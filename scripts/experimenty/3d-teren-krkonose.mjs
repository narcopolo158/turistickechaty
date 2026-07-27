/**
 * EXPERIMENT (odbočka Michala, 26. 7. 2026): 3D model Krkonoš s chatami.
 *
 * POCTIVOST PŘEDEM: v repu není žádný skutečný výškopis (DEM/vrstevnice)
 * a sandbox nepustí síť na výšková API (opentopodata i Overpass: „Host not
 * in allowlist", změřeno 26. 7. 2026). Reliéf v tomhle prototypu je proto
 * ILUSTRAČNÍ INTERPOLACE (IDW) z výšek, které repo má: chaty s polem
 * `vyska` + OSM uzly s tagem `ele`. NENÍ to skutečný terén — hřebeny mezi
 * kotvami jsou vyhlazené, údolí mělká. Ostrý model vznikne stejným HTML,
 * jen s mřížkou z DMR 5G (ČÚZK, otevřená data) nebo Mapy.com Elevation
 * API (klíč projekt má) — jeden běh přes Actions nebo Michalův počítač.
 *
 * Výstup: docs/experimenty/3d-teren-krkonose.html (samostatný soubor,
 * three.js z cdnjs). Spuštění: node scripts/experimenty/3d-teren-krkonose.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const BBOX = { latMin: 50.6, latMax: 50.82, lngMin: 15.35, lngMax: 15.95 }
const NX = 130, NY = 78 // mřížka

// ── kotvy výšek ──────────────────────────────────────────────────────────
const kotvy = []
const chaty = []
for (const [dir, pub] of [['data/chaty/krkonose', true], ['data/kandidati/krkonose', false]]) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const d = parse(readFileSync(`${dir}/${f}`, 'utf8')) || {}
    if (!d.lat || !d.lng) continue
    const rec = { n: d.nazev ?? f, lat: d.lat, lng: d.lng, ele: d.vyska ?? null,
      typ: d.typ ?? null, stav: d.stav ?? null, pub }
    // publikované vždy; kandidáty jen ty, které nejsou duplicitou publikovaného slugu
    if (pub || !chaty.some((c) => c.n === rec.n)) chaty.push(rec)
    if (d.vyska) kotvy.push({ lat: d.lat, lng: d.lng, ele: d.vyska })
  }
}
for (const src of ['data/kandidati/krkonose/_overpass-export-cz.json', 'data/kandidati/krkonose/_overpass-export-pl.json']) {
  const j = JSON.parse(readFileSync(src, 'utf8'))
  for (const e of j.elements ?? []) {
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
    const ele = Number(e.tags?.ele)
    if (lat && lng && ele) kotvy.push({ lat, lng, ele })
  }
}
// OKRAJOVÉ PODMÍNKY VYKRESLENÍ (ne data!): bez nich IDW táhne okraje mřížky
// k průměru kotev a masiv se rozteče. Po obvodu bboxu se přidají body 480 m
// (jih, podhůří) / 400 m (sever, polská strana) — čistě renderovací opěry,
// v HTML je reliéf stejně označen jako ilustrační.
for (let i = 0; i <= 20; i++) {
  const lng = BBOX.lngMin + (BBOX.lngMax - BBOX.lngMin) * (i / 20)
  kotvy.push({ lat: BBOX.latMin, lng, ele: 480 })
  kotvy.push({ lat: BBOX.latMax, lng, ele: 400 })
}
for (let i = 1; i < 8; i++) {
  const lat = BBOX.latMin + (BBOX.latMax - BBOX.latMin) * (i / 8)
  kotvy.push({ lat, lng: BBOX.lngMin, ele: 520 })
  kotvy.push({ lat, lng: BBOX.lngMax, ele: 520 })
}

// ── IDW interpolace (p=2, s měkkým stropem vlivu) ────────────────────────
const grid = new Array(NY)
for (let iy = 0; iy < NY; iy++) {
  grid[iy] = new Array(NX)
  const lat = BBOX.latMin + (BBOX.latMax - BBOX.latMin) * (iy / (NY - 1))
  for (let ix = 0; ix < NX; ix++) {
    const lng = BBOX.lngMin + (BBOX.lngMax - BBOX.lngMin) * (ix / (NX - 1))
    let sw = 0, se = 0
    for (const k of kotvy) {
      const dy = (k.lat - lat) * 111.32
      const dx = (k.lng - lng) * 111.32 * Math.cos((lat * Math.PI) / 180)
      const d2 = dx * dx + dy * dy + 0.15 // +eps ~ vyhlazení
      const w = 1 / (d2 * d2) // p=4 → ostřejší kopce kolem kotev
      sw += w; se += w * k.ele
    }
    grid[iy][ix] = Math.round(se / sw)
  }
}

// ── schematické přechody (reálné délky, PŘÍMKY — ne geometrie tras) ─────
const prechodyJ = JSON.parse(readFileSync('data/trasy/krkonose/prechody.json', 'utf8'))
const idx = new Map(chaty.filter((c) => c.pub).map((c) => [c.n, c]))
const prechody = []
const seen = new Set()
for (const ch of prechodyJ.chaty ?? []) {
  for (const p of ch.prechody ?? []) {
    const a = ch.nazev, b = p.cilNazev
    const key = [a, b].sort().join('|')
    if (seen.has(key) || !idx.has(a) || !idx.has(b)) continue
    seen.add(key)
    prechody.push({ a, b, km: p.delkaKm })
  }
}

const data = { bbox: BBOX, nx: NX, ny: NY, grid, chaty, prechody,
  kotvy: kotvy.length, genDate: '2026-07-26' }
writeFileSync('docs/experimenty/3d-teren-data.json', JSON.stringify(data))
console.log(`kotvy: ${kotvy.length} | chaty: ${chaty.length} (pub ${chaty.filter((c) => c.pub).length}) | prechody: ${prechody.length}`)
console.log('zapsano docs/experimenty/3d-teren-data.json')
