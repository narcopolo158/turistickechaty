/**
 * DATA-06: přechody mezi chatami (sousední chaty) — graf sousedství pro plánovač
 * (plán P3). Nad routovacím grafem značených tras (increment 1) spočítá ke každé
 * publikované chatě N nejbližších JINÝCH chat po značených trasách: délka,
 * značení po úsecích, podíl neznačené délky, geometrie. Jeden Dijkstra na chatu.
 *
 * Poctivost: vše `verified: false` se zdrojem (OSM route=hiking, ODbL). Přechod
 * s >15 % délky mimo značené cesty → příznak k ruční kontrole. Výšky a `casMin`
 * (DIN 33466) sem NEpatří — dopočítá je krok s Mapy.com Elevation API (Actions),
 * stejně jako u přístupových tras; tady je čistě planární routing.
 *
 *   npx tsx scripts/data06-prechody.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { nactiExport } from './data01-overpass-krkonose'
import { dijkstraOdUzlu, najdiNejblizsiUzel, postavGraf, slozTrasu, type Graf, type Trasa, type UzelKlic } from './data06-graf'
import { type TrasaRelace } from './data06-trasy'

const TRASY_ADRESAR = join(process.cwd(), 'data', 'trasy', 'krkonose')
const EXPORT_JSON = join(TRASY_ADRESAR, '_overpass-trasy.json')
const CHATY_ADRESAR = join(process.cwd(), 'data', 'chaty', 'krkonose')
const VYSTUP_JSON = join(TRASY_ADRESAR, 'prechody.json')

/** Dál než tolik metrů od nejbližšího uzlu sítě = nepřipojeno (nepočítá se). */
const MAX_SNAP_M = 1500
/** Kolik nejbližších sousedních chat zapsat. */
const POCET_PRECHODU = 4
/** Přechod delší než tolik km (po značených) už není „soused" — nezapisovat. */
const MAX_PRECHOD_KM = 18
/** Přechod s vyšším podílem neznačené délky (%) → příznak k ruční kontrole. */
const PRAH_NEZNACENE_PROC = 15

/** Kód země → český URL slug (jako src/lib/chaty ZEME_SLUG; sem malá kopie). */
const ZEME_SLUG: Record<string, string> = { cz: 'cesko', sk: 'slovensko', pl: 'polsko', at: 'rakousko', de: 'nemecko' }

export type CilSnap = { slug: string; nazev: string; uzel: UzelKlic; url: string | null }
export type Prechod = {
  cilSlug: string
  cilNazev: string
  cilUrl: string | null
  delkaKm: number
  useky: Trasa['useky']
  podilNeznacenychProc: number
  kRucniKontrole: boolean
}
// Geometrie se do prechody.json zatím nepíše (karta ji nepotřebuje, soubor by
// zbytečně bobtnal). Až přijdou výšky/časy (Actions) nebo mapa přechodů, doplní
// se sem geometrie z routingu — je kdykoli přepočitatelná z grafu.

/**
 * Vybere `pocet` nejbližších JINÝCH chat (dle skutečné délky po značených) a
 * složí k nim trasu. Jeden Dijkstra z uzlu chaty; sebe sama a chaty na týž uzel
 * vynechá; nulové a delší než `MAX_PRECHOD_KM` se nezapíšou.
 */
export const vyberPrechody = (graf: Graf, hutUzel: UzelKlic, hutSlug: string, cile: CilSnap[], pocet: number): Prechod[] => {
  const { cena, predchudce } = dijkstraOdUzlu(graf, hutUzel)
  const slozene = cile
    .filter((c) => c.slug !== hutSlug && cena.get(c.uzel) != null)
    .map((c) => ({ c, t: slozTrasu(graf, predchudce, hutUzel, c.uzel) }))
    .filter((x): x is { c: CilSnap; t: Trasa } => !!x.t && x.t.delkaKm > 0 && x.t.delkaKm <= MAX_PRECHOD_KM)
    .sort((a, b) => a.t.delkaKm - b.t.delkaKm)

  const pristupy: Prechod[] = []
  const pouzityUzel = new Set<UzelKlic>()
  for (const { c, t } of slozene) {
    if (pristupy.length >= pocet) break
    if (pouzityUzel.has(c.uzel)) continue
    pouzityUzel.add(c.uzel)
    pristupy.push({
      cilSlug: c.slug,
      cilNazev: c.nazev,
      cilUrl: c.url,
      delkaKm: t.delkaKm,
      useky: t.useky,
      podilNeznacenychProc: t.podilNeznacenychProc,
      kRucniKontrole: t.podilNeznacenychProc > PRAH_NEZNACENE_PROC,
    })
  }
  return pristupy
}

type Chata = { slug: string; nazev: string; lat: number; lng: number; url: string | null }

const nactiChaty = (dir: string): Chata[] => {
  if (!existsSync(dir)) return []
  const out: Chata[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const y = parse(readFileSync(join(dir, f), 'utf8')) as
      | { slug?: string; nazev?: string; lat?: number; lng?: number; zeme?: string; oblast?: string }
      | null
    if (!y?.nazev || typeof y.lat !== 'number' || typeof y.lng !== 'number') continue
    const slug = y.slug ?? f.replace(/\.yaml$/, '')
    const zemeSlug = y.zeme ? ZEME_SLUG[y.zeme] : null
    const url = zemeSlug && y.oblast ? `/${zemeSlug}/${y.oblast}/${slug}` : null
    out.push({ slug, nazev: y.nazev, lat: y.lat, lng: y.lng, url })
  }
  return out
}

const main = () => {
  if (!existsSync(EXPORT_JSON)) throw new Error(`Export tras ${EXPORT_JSON} neexistuje — workflow „DATA-06: export značených tras".`)
  const { elementy } = nactiExport(readFileSync(EXPORT_JSON, 'utf8'))
  const graf = postavGraf(elementy as unknown as TrasaRelace[])

  const chaty = nactiChaty(CHATY_ADRESAR)
  // Přichytit každou chatu na síť (dál než MAX_SNAP_M se do grafu sousedství nezapojí).
  const snap = new Map<string, CilSnap & { lat: number; lng: number }>()
  for (const ch of chaty) {
    const nej = najdiNejblizsiUzel(graf, ch.lat, ch.lng)
    if (nej && nej.vzdalenostM <= MAX_SNAP_M) snap.set(ch.slug, { slug: ch.slug, nazev: ch.nazev, uzel: nej.klic, url: ch.url, lat: ch.lat, lng: ch.lng })
  }
  const cile: CilSnap[] = [...snap.values()].map(({ slug, nazev, uzel, url }) => ({ slug, nazev, uzel, url }))

  const vystup: { slug: string; nazev: string; prechody: Prechod[] }[] = []
  for (const ch of chaty) {
    const s = snap.get(ch.slug)
    if (!s) continue
    const prechody = vyberPrechody(graf, s.uzel, ch.slug, cile, POCET_PRECHODU)
    if (prechody.length) vystup.push({ slug: ch.slug, nazev: ch.nazev, prechody })
  }

  mkdirSync(TRASY_ADRESAR, { recursive: true })
  writeFileSync(
    VYSTUP_JSON,
    JSON.stringify(
      {
        zdroj: 'OpenStreetMap Overpass (route=hiking) — data © přispěvatelé OpenStreetMap, ODbL 1.0. Planární routing po značených trasách, verified:false.',
        pozn: 'Sousední chaty = nejbližší jiné chaty po značených trasách. Výšky a casMin (DIN 33466) dopočítá krok s Mapy.com Elevation API (Actions).',
        pocetChat: vystup.length,
        chaty: vystup,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const kKontrole = vystup.flatMap((c) => c.prechody).filter((p) => p.kRucniKontrole).length
  console.log(`\n## DATA-06 report — přechody mezi chatami`)
  console.log(`Chat se sousedy: ${vystup.length} / ${chaty.length} · přechodů celkem: ${vystup.reduce((s, c) => s + c.prechody.length, 0)} · k ruční kontrole (>${PRAH_NEZNACENE_PROC} % neznačené): ${kKontrole}`)
  for (const c of vystup.slice(0, 8)) {
    console.log(`- ${c.nazev}: ${c.prechody.map((p) => `${p.cilNazev} ${p.delkaKm} km`).join(' · ')}`)
  }
  if (vystup.length > 8) console.log(`  … a ${vystup.length - 8} dalších`)
  console.log(`\nKatalog: ${VYSTUP_JSON}`)
}

if (process.argv[1]?.endsWith('data06-prechody.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
