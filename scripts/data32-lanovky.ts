/**
 * DATA-32: přehled lanovek oblasti — které vyvezou pěšího k chatám.
 *
 * ZDROJ JE UŽ V REPU, nic se nestahuje. Pipeline DATA-28 (3D terén) při každém
 * běhu ukládá mimo jiné vrstvu `aerialway` z OpenStreetMap do
 * `docs/experimenty/3d-teren-data{-<oblast>}.json`. Tenhle skript ji přebírá
 * a dělá z ní čitelný přehled — proto běží i v bezobslužné session, která na
 * Overpass nedosáhne. Cena za to je stáří dat: nese se `stavOsm` z toho běhu
 * a v UI se přiznává.
 *
 *   npx tsx scripts/data32-lanovky.ts [--oblast krkonose]
 *
 * CO SE DO PŘEHLEDU BERE A PROČ. Průvodce je pro pěší, ne pro lyžaře: berou se
 * jen dráhy, které **vyvezou člověka i s batohem** — kabinkové (`gondola`,
 * `cable_car`), kombinované (`mixed_lift`) a sedačkové (`chair_lift`). Vleky
 * všeho druhu (`platter`, `t-bar`, `drag_lift`, `magic_carpet`) do přehledu
 * NEJDOU, jen se spočítají a počet se v reportu i v UI přizná — jinak by
 * přehled tvrdil, že Krkonoše mají tři sta lanovek, což by čtenáře klamalo.
 *
 * SPOJOVÁNÍ ÚSEKŮ. OSM vede jednu dráhu často jako víc `way` (úseky, mezistanice).
 * Spojujeme jen úseky **téhož jména**, jejichž konce na sebe navazují do 200 m.
 * Dvě paralelní dráhy s odlišnými jmény („Hala Szrenicka I" a „II") zůstávají
 * dvěma záznamy, protože to jsou dvě dráhy — a stejnojmenné úseky, které na
 * sebe nenavazují (dva různé vleky „Kotva" na opačných koncích údolí), taky.
 *
 * VÝŠKY. Nadmořské výšky stanic se čtou z výškového modelu, který drží tentýž
 * soubor (Mapy.com Elevation API, bilineárně mezi body mřížky ~180 m). Je to
 * MODEL, ne měření — proto se převýšení zaokrouhluje na desítky metrů a nese
 * `verified: false`. Délka se počítá z geometrie OSM (haversine po lomených
 * bodech), tedy z půdorysu; skutečná délka lana je o kousek větší.
 *
 * VAZBA NA CHATY. Ke každé dráze se hledají publikované profily do 1,5 km od
 * horní stanice — to je smysl celého přehledu („odkud se dá vyjet nahoru").
 * Vzdálenost je vzdušná čára, ne délka cesty; v UI je to napsané.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { oblastZArgv } from './oblasti'

const KOREN = process.cwd()

/** Dráhy, které vyvezou pěšího. Vleky sem vědomě nepatří — viz hlavička. */
const PRO_PESI = new Set(['gondola', 'cable_car', 'mixed_lift', 'chair_lift'])

const TYP_NAZEV: Record<string, string> = {
  gondola: 'kabinková',
  cable_car: 'kabinková (visutá)',
  mixed_lift: 'kombinovaná (kabinky i sedačky)',
  chair_lift: 'sedačková',
}

type SurovaLanovka = { typ: string; nazev: string | null; body: [number, number][] }

export type Lanovka = {
  id: string
  nazev: string | null
  typ: string
  typNazev: string
  delkaM: number
  prevyseniM: number | null
  dolni: { lat: number; lng: number; vyska: number | null }
  horni: { lat: number; lng: number; vyska: number | null }
  useku: number
  /** Publikované profily do 1,5 km od horní stanice (vzdušnou čarou). */
  uHorniStanice: { slug: string; nazev: string; vzdalenostM: number }[]
}

const R = 6371000
const rad = (x: number) => (x * Math.PI) / 180
export const vzdM = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

const delkaTrasy = (body: [number, number][]): number => {
  let d = 0
  for (let i = 1; i < body.length; i++)
    d += vzdM(body[i - 1][0], body[i - 1][1], body[i][0], body[i][1])
  return d
}

/** Bilineární odečet z výškové mřížky DATA-28; mimo bbox vrací null (nehádá se). */
export function vyskaZMrizky(
  grid: number[][],
  bbox: { latMin: number; lngMin: number; latMax: number; lngMax: number },
  nx: number,
  ny: number,
  lat: number,
  lng: number,
): number | null {
  if (lat < bbox.latMin || lat > bbox.latMax || lng < bbox.lngMin || lng > bbox.lngMax) return null
  const fx = ((lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin)) * (nx - 1)
  const fy = ((lat - bbox.latMin) / (bbox.latMax - bbox.latMin)) * (ny - 1)
  const x0 = Math.min(nx - 2, Math.max(0, Math.floor(fx)))
  const y0 = Math.min(ny - 2, Math.max(0, Math.floor(fy)))
  const tx = fx - x0
  const ty = fy - y0
  const h = (x: number, y: number) => grid[y]?.[x]
  const h00 = h(x0, y0)
  const h10 = h(x0 + 1, y0)
  const h01 = h(x0, y0 + 1)
  const h11 = h(x0 + 1, y0 + 1)
  if ([h00, h10, h01, h11].some((v) => typeof v !== 'number')) return null
  const a = h00 + (h10 - h00) * tx
  const b = h01 + (h11 - h01) * tx
  return a + (b - a) * ty
}

/** Normalizace jména pro spojování úseků (diakritika a mezery neřeší identitu). */
const klicJmena = (s: string | null): string =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()

/**
 * Spojí úseky téhož jména, jejichž konce na sebe navazují (do `prah` metrů).
 * Nepojmenované úseky se nespojují — bez jména není co ztotožňovat.
 */
export function spojUseky(vstup: SurovaLanovka[], prah = 200): SurovaLanovka[][] {
  const skupiny: SurovaLanovka[][] = []
  const podleJmena = new Map<string, SurovaLanovka[]>()
  for (const l of vstup) {
    const k = klicJmena(l.nazev)
    if (!k) {
      skupiny.push([l])
      continue
    }
    const s = podleJmena.get(k)
    if (s) s.push(l)
    else podleJmena.set(k, [l])
  }
  for (const stejnojmenne of podleJmena.values()) {
    const zbyva = [...stejnojmenne]
    while (zbyva.length) {
      const retez = [zbyva.shift() as SurovaLanovka]
      let rostlo = true
      while (rostlo) {
        rostlo = false
        for (let i = 0; i < zbyva.length; i++) {
          const kandidat = zbyva[i]
          const konce = retez.flatMap((u) => [u.body[0], u.body[u.body.length - 1]])
          const jeho = [kandidat.body[0], kandidat.body[kandidat.body.length - 1]]
          const navazuje = konce.some((a) => jeho.some((b) => vzdM(a[0], a[1], b[0], b[1]) <= prah))
          if (navazuje) {
            retez.push(kandidat)
            zbyva.splice(i, 1)
            rostlo = true
            break
          }
        }
      }
      skupiny.push(retez)
    }
  }
  return skupiny
}

type Profil = { slug: string; nazev: string; lat: number; lng: number }

const nactiProfily = (oblast: string): Profil[] => {
  const adr = join(KOREN, 'data', 'chaty', oblast)
  if (!existsSync(adr)) return []
  const out: Profil[] = []
  for (const f of readdirSync(adr)) {
    if (!f.endsWith('.yaml') || f.startsWith('_')) continue
    const d = parse(readFileSync(join(adr, f), 'utf8')) as Record<string, unknown>
    if (typeof d.lat === 'number' && typeof d.lng === 'number' && typeof d.nazev === 'string')
      out.push({
        slug: String(d.slug ?? f.replace(/\.yaml$/u, '')),
        nazev: d.nazev,
        lat: d.lat,
        lng: d.lng,
      })
  }
  return out
}

export function sestavLanovky(
  surove: SurovaLanovka[],
  profily: Profil[],
  vyska: (lat: number, lng: number) => number | null,
): Lanovka[] {
  const out: Lanovka[] = []
  for (const skupina of spojUseky(surove.filter((l) => PRO_PESI.has(l.typ)))) {
    const vsechnyBody = skupina.flatMap((u) => u.body)
    // Krajní body celé skupiny: nejnižší a nejvyšší podle modelu; když model
    // mlčí (mimo bbox), bereme první a poslední bod a převýšení nevyplňujeme.
    const sVyskou = vsechnyBody.map((b) => ({ b, v: vyska(b[0], b[1]) }))
    const znameVysky = sVyskou.filter((x) => x.v != null) as { b: [number, number]; v: number }[]
    let dolni = sVyskou[0].b
    let horni = sVyskou[sVyskou.length - 1].b
    let prevyseni: number | null = null
    let vDolni: number | null = null
    let vHorni: number | null = null
    if (znameVysky.length >= 2) {
      const min = znameVysky.reduce((a, x) => (x.v < a.v ? x : a))
      const max = znameVysky.reduce((a, x) => (x.v > a.v ? x : a))
      dolni = min.b
      horni = max.b
      vDolni = Math.round(min.v)
      vHorni = Math.round(max.v)
      prevyseni = Math.round((max.v - min.v) / 10) * 10
    }
    const delka = Math.round(skupina.reduce((s, u) => s + delkaTrasy(u.body), 0))
    const uHorni = profily
      .map((p) => ({
        slug: p.slug,
        nazev: p.nazev,
        vzdalenostM: Math.round(vzdM(horni[0], horni[1], p.lat, p.lng)),
      }))
      .filter((p) => p.vzdalenostM <= 1500)
      .sort((a, b) => a.vzdalenostM - b.vzdalenostM)
    const typ = skupina[0].typ
    out.push({
      id: (
        klicJmena(skupina[0].nazev) || `bezejmenna-${horni[0].toFixed(4)}-${horni[1].toFixed(4)}`
      ).replace(/ /gu, '-'),
      nazev: skupina[0].nazev,
      typ,
      typNazev: TYP_NAZEV[typ] ?? typ,
      delkaM: delka,
      prevyseniM: prevyseni,
      dolni: { lat: dolni[0], lng: dolni[1], vyska: vDolni },
      horni: { lat: horni[0], lng: horni[1], vyska: vHorni },
      useku: skupina.length,
      uHorniStanice: uHorni,
    })
  }
  // Nejdřív ty, které někam k chatě vyvezou (to je smysl přehledu), pak dle délky.
  return out.sort((a, b) => {
    if (!!a.uHorniStanice.length !== !!b.uHorniStanice.length)
      return a.uHorniStanice.length ? -1 : 1
    return b.delkaM - a.delkaM
  })
}

// ── běh ─────────────────────────────────────────────────────────────────────
if (
  process.argv[1] &&
  process.argv[1].includes('data32-lanovky') &&
  !process.argv[1].includes('data32-lanovky-export')
) {
  const oblast = oblastZArgv()
  const jmenoJson =
    oblast.slug === 'krkonose' ? '3d-teren-data.json' : `3d-teren-data-${oblast.slug}.json`
  const cesta = join(KOREN, 'docs', 'experimenty', jmenoJson)
  const cestaExport = join(KOREN, 'data', 'lanovky', `_export-${oblast.slug}.json`)

  let surove: SurovaLanovka[]
  let vyska: (lat: number, lng: number) => number | null
  let stavOsm: string | null
  let zdrojVysek: string | null
  let zdroj: string

  if (existsSync(cesta)) {
    // Primární cesta: těžký export DATA-28 s celou výškovou mřížkou.
    const teren = JSON.parse(readFileSync(cesta, 'utf8')) as {
      bbox: { latMin: number; lngMin: number; latMax: number; lngMax: number }
      nx: number
      ny: number
      grid: number[][]
      lanovky?: SurovaLanovka[]
      stavOsm?: string
      zdrojVysky?: string
    }
    surove = teren.lanovky ?? []
    vyska = (lat, lng) => vyskaZMrizky(teren.grid, teren.bbox, teren.nx, teren.ny, lat, lng)
    stavOsm = teren.stavOsm ?? null
    zdrojVysek = teren.zdrojVysky ?? null
    zdroj =
      'OpenStreetMap (tag aerialway) — data © přispěvatelé OpenStreetMap, ODbL 1.0 ' +
      '(openstreetmap.org/copyright); přebráno z exportu pipeline DATA-28'
  } else if (existsSync(cestaExport)) {
    // Fallback: lehký export DATA-32b (jen dráhy + výšky koncových bodů).
    // Výška se hledá jako nejbližší doměřený bod do 50 m — koncové body drah
    // pro pěší v exportu jsou, pylony a vleky ne, ty zůstanou bez výšky.
    const exportni = JSON.parse(readFileSync(cestaExport, 'utf8')) as {
      lanovky?: SurovaLanovka[]
      vysky?: { lat: number; lng: number; vyska: number }[]
      stavOsm?: string
      zdrojVysky?: string
    }
    surove = exportni.lanovky ?? []
    const body = exportni.vysky ?? []
    vyska = (lat, lng) => {
      let nej: { d: number; v: number } | null = null
      for (const b of body) {
        const d = vzdM(lat, lng, b.lat, b.lng)
        if (d <= 50 && (!nej || d < nej.d)) nej = { d, v: b.vyska }
      }
      return nej ? nej.v : null
    }
    stavOsm = exportni.stavOsm ?? null
    zdrojVysek = exportni.zdrojVysky ?? null
    zdroj =
      'OpenStreetMap (way["aerialway"]) — data © přispěvatelé OpenStreetMap, ODbL 1.0 ' +
      `(openstreetmap.org/copyright); přebráno z exportu data/lanovky/_export-${oblast.slug}.json (DATA-32b)`
  } else {
    console.error(
      `✗ Chybí ${jmenoJson} i data/lanovky/_export-${oblast.slug}.json — nejdřív musí ` +
        `doběhnout DATA-28 (3D terén), nebo lehčí export data32-lanovky-export.ts pro oblast ${oblast.slug}.`,
    )
    process.exit(1)
  }

  const profily = nactiProfily(oblast.slug)
  const lanovky = sestavLanovky(surove, profily, vyska)

  const vleku = surove.filter((l) => !PRO_PESI.has(l.typ)).length
  const vystup = {
    oblast: oblast.slug,
    zdroj,
    stavOsm,
    zdrojVysek,
    poznamka:
      'Jen dráhy, které vyvezou pěšího (kabinkové, kombinované, sedačkové). ' +
      `Vleky a dětské pásy (${vleku} v témž exportu) přehled nevede. Převýšení je ` +
      'z výškového modelu, ne z měření — zaokrouhleno na desítky metrů; délka je ' +
      'půdorysná z geometrie OSM. Vzdálenost k chatám je vzdušná čára.',
    vygenerovano: 'scripts/data32-lanovky.ts',
    pocet: lanovky.length,
    vleku,
    lanovky,
  }
  const adr = join(KOREN, 'data', 'lanovky')
  mkdirSync(adr, { recursive: true })
  writeFileSync(join(adr, `${oblast.slug}.json`), JSON.stringify(vystup, null, 2) + '\n')

  console.log(`Oblast: ${oblast.nazev} | stav OSM dat: ${vystup.stavOsm}`)
  console.log(
    `Drah pro pěší: ${lanovky.length} (z ${surove.length} aerialway; vleků a pásů ${vleku} — mimo přehled)`,
  )
  for (const l of lanovky) {
    const chaty = l.uHorniStanice
      .slice(0, 3)
      .map((c) => `${c.nazev} (${c.vzdalenostM} m)`)
      .join(', ')
    console.log(
      ` · ${l.nazev ?? '(bez názvu)'} — ${l.typNazev}, ${l.delkaM} m` +
        (l.prevyseniM != null ? `, +${l.prevyseniM} m` : ', převýšení neznámé') +
        (l.useku > 1 ? `, ${l.useku} úseky` : '') +
        (chaty ? ` → ${chaty}` : ''),
    )
  }
  console.log(`Zapsáno: data/lanovky/${oblast.slug}.json`)
}
