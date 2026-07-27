/**
 * DATA-28: 3D model Krkonoš — OSTRÁ datová pipeline (nástupce experimentu
 * z 26. 7. 2026, scripts/experimenty/3d-teren-krkonose.mjs).
 *
 * Co dělá (v GitHub Actions, kde je síť; sandbox denních sessions na
 * api.mapy.com ani Overpass nedosáhne):
 *   1. VÝŠKOPIS: mřížka 240×144 přes bbox masivu z Mapy.com Elevation API
 *      (klíč hlavičkou X-Mapy-Api-Key ze secrets, max 256 pozic/dotaz,
 *      lon,lat pořadí — konvence viz scripts/vyskovy-profil.ts).
 *   2. TRASY: Overpass `relation[route=hiking] out geom;` (týž dotaz jako
 *      DATA-06), polylinie slité po relacích, decimované na ~60 m,
 *      obarvené podle osmc/kct značení.
 *   3. VRCHOLY: Overpass `node[natural=peak][name]` s tagem ele — popisky
 *      pro orientaci.
 *   4. CHATY + PŘECHODY: z YAML korpusu a data/trasy/krkonose/prechody.json
 *      (stejně jako experiment).
 *   5. Zapíše docs/experimenty/3d-teren-data.json a SLOŽÍ FINÁLNÍ HTML
 *      (šablona + přibalený three.js + data) → docs/experimenty/
 *      3d-teren-krkonose.html.
 *
 * BEZ KLÍČE/SÍTĚ (lokální běh): spadne zpět na ILUSTRAČNÍ interpolaci IDW
 * z výšek objektů korpusu (realDem:false) — tedy chování experimentu.
 * Přepínač --bez-site vynutí fallback bez pokusů o síť.
 *
 * Poctivost: výškopis je VÝŠKOVÝ MODEL (verified:false, „nemusí odpovídat
 * realitě" — formulace z DATA-06); trasy a vrcholy jsou OSM (ODbL,
 * atribuce v HTML); nic z toho nejde do publikovaných profilů.
 *
 *   npx tsx scripts/data28-3d-teren.ts [--bez-site]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { stahniOverpass, VYCHOZI_API_INSTANCE } from './data01-overpass-krkonose'
import { overpassDotazTrasy, type TrasaRelace } from './data06-trasy'
import { MAX_POZIC_NA_DOTAZ } from './vyskovy-profil'

const BBOX = { latMin: 50.6, latMax: 50.82, lngMin: 15.35, lngMax: 15.95 }
const BBOX_STR = `${BBOX.latMin},${BBOX.lngMin},${BBOX.latMax},${BBOX.lngMax}`
const NX = 240
const NY = 144
const ELEVATION_URL = 'https://api.mapy.com/v1/elevation'
const DECIMACE_M = 60
const KOREN = process.cwd()
const ADR = join(KOREN, 'docs', 'experimenty')

type Chata = { n: string; lat: number; lng: number; ele: number | null; typ: string | null; stav: string | null; pub: boolean }
type Trasa = { ref: string | null; barva: string; body: [number, number][] }
type Vrchol = { n: string; lat: number; lng: number; ele: number }

// ── chaty + kotvy z korpusu ─────────────────────────────────────────────────
const nactiChaty = (): { chaty: Chata[]; kotvy: { lat: number; lng: number; ele: number }[] } => {
  const chaty: Chata[] = []
  const kotvy: { lat: number; lng: number; ele: number }[] = []
  for (const [dir, pub] of [
    ['data/chaty/krkonose', true],
    ['data/kandidati/krkonose', false],
  ] as const) {
    for (const f of readdirSync(join(KOREN, dir))) {
      if (!f.endsWith('.yaml')) continue
      const d = (parse(readFileSync(join(KOREN, dir, f), 'utf8')) ?? {}) as Record<string, unknown>
      const lat = Number(d.lat), lng = Number(d.lng)
      if (!lat || !lng) continue
      const ele = d.vyska ? Number(d.vyska) : null
      const rec: Chata = { n: String(d.nazev ?? f), lat, lng, ele,
        typ: d.typ ? String(d.typ) : null, stav: d.stav ? String(d.stav) : null, pub }
      if (pub || !chaty.some((c) => c.n === rec.n)) chaty.push(rec)
      if (ele) kotvy.push({ lat, lng, ele })
    }
  }
  for (const src of ['_overpass-export-cz.json', '_overpass-export-pl.json']) {
    const j = JSON.parse(readFileSync(join(KOREN, 'data/kandidati/krkonose', src), 'utf8')) as {
      elements?: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[]
    }
    for (const e of j.elements ?? []) {
      const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
      const ele = Number(e.tags?.ele)
      if (lat && lng && ele) kotvy.push({ lat, lng, ele })
    }
  }
  return { chaty, kotvy }
}

// ── výškopis: Mapy.com (ostrý) ──────────────────────────────────────────────
const stahniGridMapy = async (klic: string): Promise<number[][]> => {
  const pozice: [number, number][] = [] // [lon, lat]
  for (let iy = 0; iy < NY; iy++) {
    const lat = BBOX.latMin + ((BBOX.latMax - BBOX.latMin) * iy) / (NY - 1)
    for (let ix = 0; ix < NX; ix++) {
      const lng = BBOX.lngMin + ((BBOX.lngMax - BBOX.lngMin) * ix) / (NX - 1)
      pozice.push([lng, lat])
    }
  }
  const vysky: number[] = []
  for (let i = 0; i < pozice.length; i += MAX_POZIC_NA_DOTAZ) {
    const davka = pozice.slice(i, i + MAX_POZIC_NA_DOTAZ)
    const url = `${ELEVATION_URL}?positions=${davka.map(([lo, la]) => `${lo.toFixed(5)},${la.toFixed(5)}`).join(';')}`
    // dávka se zkouší 3× (429/5xx s rozestupem) — jinak by jediný škyt
    // serveru shodil celý grid
    let j: { items?: { elevation: number }[] } | null = null
    for (let pokus = 1; pokus <= 3; pokus++) {
      const res = await fetch(url, { headers: { 'X-Mapy-Api-Key': klic } })
      if (res.ok) { j = (await res.json()) as { items?: { elevation: number }[] }; break }
      if (pokus === 3) throw new Error(`Elevation API HTTP ${res.status} (dávka ${i / MAX_POZIC_NA_DOTAZ + 1})`)
      await new Promise((r) => setTimeout(r, res.status === 429 ? 30_000 : 3_000))
    }
    if (!j?.items || j.items.length !== davka.length)
      throw new Error(`Elevation API: čekáno ${davka.length} bodů, přišlo ${j?.items?.length ?? 0}`)
    for (const it of j.items) vysky.push(Math.round(it.elevation))
    if (i % (MAX_POZIC_NA_DOTAZ * 25) === 0) console.log(`  výškopis: ${Math.min(i + MAX_POZIC_NA_DOTAZ, pozice.length)}/${pozice.length} bodů`)
    await new Promise((r) => setTimeout(r, 40)) // limit 30 dotazů/s s rezervou
  }
  const grid: number[][] = []
  for (let iy = 0; iy < NY; iy++) grid.push(vysky.slice(iy * NX, (iy + 1) * NX))
  return grid
}

// ── výškopis: IDW fallback (ilustrační — chování experimentu) ───────────────
const spocitejGridIdw = (kotvy: { lat: number; lng: number; ele: number }[]): number[][] => {
  const k = [...kotvy]
  for (let i = 0; i <= 20; i++) {
    const lng = BBOX.lngMin + ((BBOX.lngMax - BBOX.lngMin) * i) / 20
    k.push({ lat: BBOX.latMin, lng, ele: 480 }, { lat: BBOX.latMax, lng, ele: 400 })
  }
  for (let i = 1; i < 8; i++) {
    const lat = BBOX.latMin + ((BBOX.latMax - BBOX.latMin) * i) / 8
    k.push({ lat, lng: BBOX.lngMin, ele: 520 }, { lat, lng: BBOX.lngMax, ele: 520 })
  }
  const grid: number[][] = []
  for (let iy = 0; iy < NY; iy++) {
    const radek: number[] = []
    const lat = BBOX.latMin + ((BBOX.latMax - BBOX.latMin) * iy) / (NY - 1)
    for (let ix = 0; ix < NX; ix++) {
      const lng = BBOX.lngMin + ((BBOX.lngMax - BBOX.lngMin) * ix) / (NX - 1)
      let sw = 0, se = 0
      for (const b of k) {
        const dy = (b.lat - lat) * 111.32
        const dx = (b.lng - lng) * 111.32 * Math.cos((lat * Math.PI) / 180)
        const d2 = dx * dx + dy * dy + 0.15
        const w = 1 / (d2 * d2)
        sw += w
        se += w * b.ele
      }
      radek.push(Math.round(se / sw))
    }
    grid.push(radek)
  }
  return grid
}

// ── trasy z Overpass ────────────────────────────────────────────────────────
const BARVY: [RegExp, string][] = [
  [/red|cervena/, 'cervena'],
  [/blue|modra/, 'modra'],
  [/green|zelena/, 'zelena'],
  [/yellow|zluta/, 'zluta'],
]
const barvaRelace = (tags: Record<string, string> = {}): string | null => {
  const osmc = tags['osmc:symbol'] ?? ''
  for (const [re, b] of BARVY) if (re.test(osmc.split(':')[0])) return b
  for (const b of ['red', 'blue', 'green', 'yellow'])
    if (tags[`kct_${b}`]) return BARVY.find(([re]) => re.test(b))![1]
  return null
}

const vzdM = (aLat: number, aLon: number, bLat: number, bLon: number): number => {
  const dy = (bLat - aLat) * 111_320
  const dx = (bLon - aLon) * 111_320 * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180))
  return Math.hypot(dx, dy)
}

const stahniTrasy = async (): Promise<{ trasy: Trasa[]; stavOsm: string }> => {
  const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, overpassDotazTrasy())
  const telo = JSON.parse(raw) as { elements?: TrasaRelace[]; osm3s?: { timestamp_osm_base?: string } }
  const trasy: Trasa[] = []
  for (const rel of telo.elements ?? []) {
    const barva = barvaRelace(rel.tags)
    if (!barva) continue
    for (const clen of rel.members ?? []) {
      const g = clen.geometry
      if (!g || g.length < 2) continue
      const body: [number, number][] = []
      let posledni: { lat: number; lon: number } | null = null
      for (const b of g) {
        if (!posledni || vzdM(posledni.lat, posledni.lon, b.lat, b.lon) >= DECIMACE_M) {
          body.push([Number(b.lat.toFixed(4)), Number(b.lon.toFixed(4))])
          posledni = b
        }
      }
      const konec = g[g.length - 1]
      if (posledni && (posledni.lat !== konec.lat || posledni.lon !== konec.lon))
        body.push([Number(konec.lat.toFixed(4)), Number(konec.lon.toFixed(4))])
      if (body.length >= 2) trasy.push({ ref: rel.tags?.ref ?? null, barva, body })
    }
  }
  return { trasy, stavOsm: telo.osm3s?.timestamp_osm_base?.slice(0, 10) ?? 'neznámý' }
}

// ── lanovky a vleky (aerialway) ─────────────────────────────────────────────
type Lanovka = { typ: string; nazev: string | null; body: [number, number][] }
const stahniLanovky = async (): Promise<Lanovka[]> => {
  const dotaz = `[out:json][timeout:90];way["aerialway"~"^(cable_car|gondola|mixed_lift|chair_lift|drag_lift|t-bar|platter|magic_carpet)$"](${BBOX_STR});out geom;`
  const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotaz)
  const telo = JSON.parse(raw) as { elements?: { tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[] }
  const out: Lanovka[] = []
  for (const w of telo.elements ?? []) {
    const g = w.geometry
    if (!g || g.length < 2) continue
    out.push({
      typ: w.tags?.aerialway ?? 'lift',
      nazev: w.tags?.name ?? null,
      body: g.map((b) => [Number(b.lat.toFixed(5)), Number(b.lon.toFixed(5))]),
    })
  }
  return out
}

// ── řeky a pojmenované potoky (waterway) ────────────────────────────────────
type Reka = { nazev: string | null; body: [number, number][] }
const stahniReky = async (): Promise<Reka[]> => {
  const dotaz = `[out:json][timeout:120];(way["waterway"="river"](${BBOX_STR});way["waterway"="stream"]["name"](${BBOX_STR}););out geom;`
  const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotaz)
  const telo = JSON.parse(raw) as { elements?: { tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[] }
  const out: Reka[] = []
  for (const w of telo.elements ?? []) {
    const g = w.geometry
    if (!g || g.length < 2) continue
    const body: [number, number][] = []
    let posledni: { lat: number; lon: number } | null = null
    for (const b of g) {
      if (!posledni || vzdM(posledni.lat, posledni.lon, b.lat, b.lon) >= 50) {
        body.push([Number(b.lat.toFixed(4)), Number(b.lon.toFixed(4))])
        posledni = b
      }
    }
    const konec = g[g.length - 1]
    if (posledni && (posledni.lat !== konec.lat || posledni.lon !== konec.lon))
      body.push([Number(konec.lat.toFixed(4)), Number(konec.lon.toFixed(4))])
    if (body.length >= 2) out.push({ nazev: w.tags?.name ?? null, body })
  }
  return out
}

// ── lesy (landuse=forest / natural=wood) — pro malovaný panoramatický režim ──
// Šablona z nich rozmisťuje stylizované smrčky (instancovaně). Bereme vnější
// obrysy; díry (paseky) se ve stylizaci nevykreslují — je to kabát, ne data.
type Bod = { lat: number; lon: number }
const spojRingy = (members: { role?: string; geometry?: Bod[] }[]): Bod[][] => {
  const segs = members
    .filter((m) => m.role !== 'inner' && m.geometry && m.geometry.length >= 2)
    .map((m) => [...(m.geometry as Bod[])])
  const ringy: Bod[][] = []
  const klic = (b: Bod) => `${b.lat.toFixed(6)},${b.lon.toFixed(6)}`
  while (segs.length) {
    let ring = segs.shift() as Bod[]
    let zmena = true
    while (zmena && klic(ring[0]) !== klic(ring[ring.length - 1])) {
      zmena = false
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]
        if (klic(s[0]) === klic(ring[ring.length - 1])) { ring = ring.concat(s.slice(1)); segs.splice(i, 1); zmena = true; break }
        if (klic(s[s.length - 1]) === klic(ring[ring.length - 1])) { ring = ring.concat([...s].reverse().slice(1)); segs.splice(i, 1); zmena = true; break }
        if (klic(s[s.length - 1]) === klic(ring[0])) { ring = s.concat(ring.slice(1)); segs.splice(i, 1); zmena = true; break }
        if (klic(s[0]) === klic(ring[0])) { ring = [...s].reverse().concat(ring.slice(1)); segs.splice(i, 1); zmena = true; break }
      }
    }
    if (klic(ring[0]) === klic(ring[ring.length - 1]) && ring.length >= 4) ringy.push(ring)
  }
  return ringy
}
const plochaKm2 = (ring: Bod[]): number => {
  let s = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1]
    const ax = a.lon * 111.32 * Math.cos((a.lat * Math.PI) / 180), ay = a.lat * 111.32
    const bx = b.lon * 111.32 * Math.cos((b.lat * Math.PI) / 180), by = b.lat * 111.32
    s += ax * by - bx * ay
  }
  return Math.abs(s) / 2
}
const decimujRing = (ring: Bod[], krokM: number): [number, number][] => {
  const body: [number, number][] = []
  let posledni: Bod | null = null
  for (const b of ring) {
    if (!posledni || vzdM(posledni.lat, posledni.lon, b.lat, b.lon) >= krokM) {
      body.push([Number(b.lat.toFixed(4)), Number(b.lon.toFixed(4))])
      posledni = b
    }
  }
  const prvni = body[0], konec = body[body.length - 1]
  if (prvni && konec && (prvni[0] !== konec[0] || prvni[1] !== konec[1])) body.push(prvni)
  return body
}
const stahniLesy = async (): Promise<[number, number][][]> => {
  // Lesů je v Krkonoších tolik, že jeden dotaz přes celý bbox Overpass
  // shazuje (timeout/paměť — přesně tak spadl běh #5). Stahujeme proto po
  // dlaždicích 2×2; way přes hranici přijde dvakrát, což rastrové masce
  // v šabloně nevadí (fill je idempotentní).
  const ringy: Bod[][] = []
  const pulLat = (BBOX.latMin + BBOX.latMax) / 2
  const pulLng = (BBOX.lngMin + BBOX.lngMax) / 2
  const dlazdice = [
    [BBOX.latMin, BBOX.lngMin, pulLat, pulLng],
    [BBOX.latMin, pulLng, pulLat, BBOX.lngMax],
    [pulLat, BBOX.lngMin, BBOX.latMax, pulLng],
    [pulLat, pulLng, BBOX.latMax, BBOX.lngMax],
  ]
  for (let i = 0; i < dlazdice.length; i++) {
    const b = dlazdice[i].join(',')
    const dotaz = `[out:json][timeout:120];(way["landuse"="forest"](${b});way["natural"="wood"](${b});relation["landuse"="forest"](${b});relation["natural"="wood"](${b}););out geom;`
    const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotaz)
    const telo = JSON.parse(raw) as { elements?: { type: string; geometry?: Bod[]; members?: { role?: string; geometry?: Bod[] }[] }[] }
    for (const e of telo.elements ?? []) {
      if (e.type === 'way' && e.geometry && e.geometry.length >= 4) ringy.push(e.geometry)
      else if (e.type === 'relation' && e.members) ringy.push(...spojRingy(e.members))
    }
    console.log(`  lesy: dlaždice ${i + 1}/4 → zatím ${ringy.length} obrysů`)
    await new Promise((r) => setTimeout(r, 1500)) // slot pauza mezi dotazy
  }
  let krok = 80
  let out = ringy.filter((r) => plochaKm2(r) >= 0.02).map((r) => decimujRing(r, krok)).filter((r) => r.length >= 4)
  let bodu = out.reduce((s, r) => s + r.length, 0)
  while (bodu > 120_000 && krok < 640) {
    krok *= 2
    out = ringy.filter((r) => plochaKm2(r) >= 0.02).map((r) => decimujRing(r, krok)).filter((r) => r.length >= 4)
    bodu = out.reduce((s, r) => s + r.length, 0)
    console.log(`  lesy: příliš bodů, decimace zhrubena na ${krok} m → ${bodu} bodů`)
  }
  return out
}

// ── sjezdovky (piste:type=downhill) — bílé koridory zimního „plakátu" ───────
type Sjezdovka = { obtiznost: string | null; body: [number, number][] }
const stahniSjezdovky = async (): Promise<Sjezdovka[]> => {
  const dotaz = `[out:json][timeout:90];way["piste:type"="downhill"](${BBOX_STR});out geom;`
  const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotaz)
  const telo = JSON.parse(raw) as { elements?: { tags?: Record<string, string>; geometry?: Bod[] }[] }
  const out: Sjezdovka[] = []
  let ploch = 0
  for (const w of telo.elements ?? []) {
    const g = w.geometry
    if (!g || g.length < 2) continue
    // polygonové sjezdovky (obrys plochy) zatím vynecháváme — ribbon po
    // obvodu by lhal; centerline z plochy je úloha na později
    const jePolygon = w.tags?.area === 'yes' ||
      (g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon)
    if (jePolygon) { ploch++; continue }
    out.push({
      obtiznost: w.tags?.['piste:difficulty'] ?? null,
      body: g.map((b) => [Number(b.lat.toFixed(4)), Number(b.lon.toFixed(4))]),
    })
  }
  if (ploch) console.log(`  sjezdovky: ${ploch} polygonových ploch vynecháno (jen osové linie)`)
  return out
}

const stahniVrcholy = async (): Promise<Vrchol[]> => {
  const dotaz = `[out:json][timeout:60];node["natural"="peak"]["name"]["ele"](${BBOX_STR});out;`
  const { raw } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotaz)
  const telo = JSON.parse(raw) as { elements?: { lat: number; lon: number; tags?: Record<string, string> }[] }
  return (telo.elements ?? [])
    .map((e) => ({ n: e.tags?.name ?? '', lat: e.lat, lng: e.lon, ele: Math.round(Number(e.tags?.ele)) }))
    .filter((v) => v.n && Number.isFinite(v.ele) && v.ele >= 1100)
    .sort((a, b) => b.ele - a.ele)
}

// ── přechody (schematické spojnice; reálné délky z prechody.json) ──────────
const nactiPrechody = (chaty: Chata[]): { a: string; b: string; km: number }[] => {
  const j = JSON.parse(readFileSync(join(KOREN, 'data/trasy/krkonose/prechody.json'), 'utf8')) as {
    chaty?: { nazev: string; prechody?: { cilNazev: string; delkaKm: number }[] }[]
  }
  const idx = new Set(chaty.filter((c) => c.pub).map((c) => c.n))
  const out: { a: string; b: string; km: number }[] = []
  const seen = new Set<string>()
  for (const ch of j.chaty ?? []) {
    for (const p of ch.prechody ?? []) {
      const key = [ch.nazev, p.cilNazev].sort().join('|')
      if (seen.has(key) || !idx.has(ch.nazev) || !idx.has(p.cilNazev)) continue
      seen.add(key)
      out.push({ a: ch.nazev, b: p.cilNazev, km: p.delkaKm })
    }
  }
  return out
}

// ── složení HTML ────────────────────────────────────────────────────────────
const slozHtml = (dataJson: string, kotvyPocet: number): void => {
  let html = readFileSync(join(ADR, '3d-teren-sablona.html'), 'utf8')
  const three = readFileSync(join(KOREN, 'node_modules/three/build/three.min.js'), 'utf8')
  html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
    `<script>/* three.js r128 (MIT) — přibaleno, ať soubor funguje offline */\n${three}\n</script>`,
  )
  html = html.replace('/*__DATA__*/null/*__/DATA__*/', dataJson)
  html = html.replace('__KOTVY__', String(kotvyPocet))
  writeFileSync(join(ADR, '3d-teren-krkonose.html'), html)
}

// ── odolnost: opakování s čekáním + převzetí vrstvy z minulého běhu ────────
// Actions IP bývá u Overpassu škrcená (série běhů #5–#9 padala konzistentně
// po ~3m45s = grid OK + jeden Overpass timeout). Každá OSM vrstva se proto
// zkouší 3× s rozestupem, a když nedá, převezme se z posledního úspěšného
// 3d-teren-data.json v repu (stáří dat pak přiznává stavOsm).
const nactiPredchoziData = (): Record<string, unknown> | null => {
  try { return JSON.parse(readFileSync(join(ADR, '3d-teren-data.json'), 'utf8')) as Record<string, unknown> }
  catch { return null }
}
const sOpakovanim = async <T>(nazev: string, fn: () => Promise<T>): Promise<T | null> => {
  for (let pokus = 1; pokus <= 3; pokus++) {
    try { return await fn() }
    catch (chyba) {
      console.log(`  ${nazev}: pokus ${pokus}/3 selhal — ${chyba instanceof Error ? chyba.message : chyba}`)
      if (pokus < 3) await new Promise((r) => setTimeout(r, pokus * 30_000))
    }
  }
  return null
}

// ── běh ─────────────────────────────────────────────────────────────────────
const main = async () => {
  const bezSite = process.argv.includes('--bez-site')
  const klic = process.env.MAPY_API_KEY
  const { chaty, kotvy } = nactiChaty()
  const prechody = nactiPrechody(chaty)
  const pred = nactiPredchoziData()

  let grid: number[][]
  let trasy: Trasa[] = []
  let vrcholy: Vrchol[] = []
  let lanovky: Lanovka[] = []
  let reky: Reka[] = []
  let lesy: [number, number][][] = []
  let sjezdovky: Sjezdovka[] = []
  let realDem = false
  let stavOsm: string | null = null

  if (!bezSite && klic) {
    console.log(`Výškopis: Mapy.com Elevation API, mřížka ${NX}×${NY}…`)
    const g = await sOpakovanim('výškopis', () => stahniGridMapy(klic))
    if (g) { grid = g; realDem = true }
    else if (pred && pred.realDem && Array.isArray(pred.grid)) {
      grid = pred.grid as number[][]; realDem = true
      console.log('  výškopis: PŘEVZAT z minulého úspěšného běhu (Elevation nedal)')
    } else { grid = spocitejGridIdw(kotvy) }
    console.log('Trasy: Overpass out geom…')
    const t = await sOpakovanim('trasy', stahniTrasy)
    if (t) { trasy = t.trasy; stavOsm = t.stavOsm }
    else if (pred && Array.isArray(pred.trasy)) {
      trasy = pred.trasy as Trasa[]
      stavOsm = typeof pred.stavOsm === 'string' ? pred.stavOsm : null
      console.log('  trasy: PŘEVZATY z minulého úspěšného běhu (Overpass nedal)')
    }
    console.log(`  tras (barevných úseků): ${trasy.length}, stav OSM ${stavOsm}`)
    console.log('Lanovky: Overpass aerialway…')
    lanovky = (await sOpakovanim('lanovky', stahniLanovky))
      ?? ((pred && Array.isArray(pred.lanovky)) ? (console.log('  lanovky: PŘEVZATY z minulého běhu'), pred.lanovky as Lanovka[]) : [])
    console.log(`  lanovek a vleků: ${lanovky.length}`)
    console.log('Řeky: Overpass waterway…')
    reky = (await sOpakovanim('řeky', stahniReky))
      ?? ((pred && Array.isArray(pred.reky)) ? (console.log('  řeky: PŘEVZATY z minulého běhu'), pred.reky as Reka[]) : [])
    console.log(`  řek a pojmenovaných potoků: ${reky.length}`)
    console.log('Vrcholy: Overpass natural=peak…')
    vrcholy = (await sOpakovanim('vrcholy', stahniVrcholy))
      ?? ((pred && Array.isArray(pred.vrcholy)) ? (console.log('  vrcholy: PŘEVZATY z minulého běhu'), pred.vrcholy as Vrchol[]) : [])
    console.log(`  vrcholů ≥1100 m se jménem: ${vrcholy.length}`)
    // Lesy a sjezdovky jsou BEST-EFFORT vrstvy malovaného režimu — jejich
    // selhání nesmí shodit celý build (poučení z běhu #5, exit 1).
    console.log('Lesy: Overpass landuse=forest/natural=wood (4 dlaždice)…')
    lesy = (await sOpakovanim('lesy', stahniLesy))
      ?? ((pred && Array.isArray(pred.lesy)) ? (console.log('  lesy: PŘEVZATY z minulého běhu'), pred.lesy as [number, number][][]) : [])
    console.log(`  lesních obrysů: ${lesy.length} (${lesy.reduce((s, r) => s + r.length, 0)} bodů)`)
    console.log('Sjezdovky: Overpass piste:type=downhill…')
    sjezdovky = (await sOpakovanim('sjezdovky', stahniSjezdovky))
      ?? ((pred && Array.isArray(pred.sjezdovky)) ? (console.log('  sjezdovky: PŘEVZATY z minulého běhu'), pred.sjezdovky as Sjezdovka[]) : [])
    console.log(`  sjezdovek (osové linie): ${sjezdovky.length}`)
  } else {
    console.log(bezSite ? 'Vynucen běh bez sítě' : 'MAPY_API_KEY není v env', '→ ILUSTRAČNÍ reliéf (IDW z korpusu).')
    grid = spocitejGridIdw(kotvy)
  }

  const data = { bbox: BBOX, nx: NX, ny: NY, grid, chaty, prechody, trasy, vrcholy, lanovky, reky,
    lesy, sjezdovky,
    realDem, stavOsm, kotvy: kotvy.length,
    zdrojVysky: realDem ? 'Mapy.com Elevation API (výškový model)' : `ilustrační interpolace z výšek ${kotvy.length} objektů korpusu` }
  const dataJson = JSON.stringify(data)
  writeFileSync(join(ADR, '3d-teren-data.json'), dataJson)
  slozHtml(dataJson, kotvy.length)
  console.log(`Zapsáno: 3d-teren-data.json (${(dataJson.length / 1024).toFixed(0)} kB) + 3d-teren-krkonose.html`)
  console.log(`realDem: ${realDem} | chaty: ${chaty.length} | trasy: ${trasy.length} | lanovky: ${lanovky.length} | reky: ${reky.length} | vrcholy: ${vrcholy.length} | lesy: ${lesy.length} | sjezdovky: ${sjezdovky.length}`)
}

main().catch((chyba) => {
  console.error(chyba instanceof Error ? chyba.message : chyba)
  process.exit(1)
})
