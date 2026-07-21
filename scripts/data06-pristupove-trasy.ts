/**
 * DATA-06 (increment 3b): přístupové trasy k chatám. Nad routovacím grafem
 * značených tras (increment 1) najde ke každé publikované chatě nejbližší
 * VÝCHOZÍ BODY (increment 2 — obce/lanovky/železnice) a spočítá cestu po
 * značených trasách (preference značek): geometrie, délka, `znaceni` po úsecích,
 * podíl neznačené délky. Jeden Dijkstra na chatu (single-source), pak se ke
 * kandidátům jen složí trasa.
 *
 * Poctivost (CLAUDE.md): vše `verified: false` se zdrojem (OSM/ODbL). Trasa s
 * >15 % délky mimo značené cesty → příznak k ruční kontrole. Body i chaty dál
 * než `MAX_SNAP_M` od sítě tras se nepřipojují (nedomýšlet neexistující cestu).
 * Výšky a `casMin` (DIN 33466) sem NEpatří — dopočítá je krok s Mapy.com
 * Elevation API (Actions); tady je čistě planární routing (jde v sandboxu).
 *
 *   npx tsx scripts/data06-pristupove-trasy.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { nactiExport } from './data01-overpass-krkonose'
import {
  dijkstraOdUzlu,
  najdiNejblizsiUzel,
  postavGraf,
  slozTrasu,
  type Graf,
  type Trasa,
  type UzelKlic,
} from './data06-graf'
import { type TrasaRelace } from './data06-trasy'

const TRASY_ADRESAR = join(process.cwd(), 'data', 'trasy', 'krkonose')
const EXPORT_JSON = join(TRASY_ADRESAR, '_overpass-trasy.json')
const OBLAST_ADRESAR = join(process.cwd(), 'data', 'oblasti', 'krkonose')
// Přednostně kurátorovaný seznam středisek (reálná východiska túr, ruční výběr),
// jinak fallback na plný OSM katalog kandidátů.
const STREDISKA_YAML = join(OBLAST_ADRESAR, 'vychozi-body.yaml')
const VYCHOZI_JSON = join(OBLAST_ADRESAR, 'vychozi-body-kandidati.json')
const CHATY_ADRESAR = join(process.cwd(), 'data', 'chaty', 'krkonose')
const VYSTUP_JSON = join(TRASY_ADRESAR, 'pristupove-trasy.json')

/** Dál než tolik metrů od nejbližšího uzlu sítě = nepřipojeno (nepočítá se). */
const MAX_SNAP_M = 1500
/** Kolik nejbližších výchozích bodů zapsat jako přístup k chatě. */
const POCET_PRISTUPU = 2
/** Trasa s vyšším podílem neznačené délky (%) → příznak k ruční kontrole. */
const PRAH_NEZNACENE_PROC = 15

export type VychoziSnap = { nazev: string; typ: string; uzel: UzelKlic }
export type Pristup = {
  vychoziBod: string
  typ: string
  delkaKm: number
  useky: Trasa['useky']
  podilNeznacenychProc: number
  kRucniKontrole: boolean
  geometrie: Trasa['geometrie']
}

/**
 * Vybere `pocet` nejbližších dosažitelných výchozích bodů k chatě (dle ceny
 * routingu s preferencí značených) a složí k nim trasu. Jeden Dijkstra z uzlu
 * chaty; body na týž uzel se neopakují; degenerované (nulové) trasy se vynechají.
 */
export const vyberPristupy = (graf: Graf, hutUzel: UzelKlic, vychoziSnap: VychoziSnap[], pocet: number): Pristup[] => {
  const { cena, predchudce } = dijkstraOdUzlu(graf, hutUzel)
  const dosazitelne = vychoziSnap
    .map((v) => ({ v, c: cena.get(v.uzel) }))
    .filter((x): x is { v: VychoziSnap; c: number } => x.c != null)
    .sort((a, b) => a.c - b.c)

  const pristupy: Pristup[] = []
  const pouzityUzel = new Set<UzelKlic>()
  for (const { v } of dosazitelne) {
    if (pristupy.length >= pocet) break
    if (pouzityUzel.has(v.uzel)) continue
    const t = slozTrasu(graf, predchudce, hutUzel, v.uzel)
    if (!t || t.delkaKm <= 0) continue
    pouzityUzel.add(v.uzel)
    pristupy.push({
      vychoziBod: v.nazev,
      typ: v.typ,
      delkaKm: t.delkaKm,
      useky: t.useky,
      podilNeznacenychProc: t.podilNeznacenychProc,
      kRucniKontrole: t.podilNeznacenychProc > PRAH_NEZNACENE_PROC,
      geometrie: t.geometrie,
    })
  }
  return pristupy
}

// ── Načtení vstupů ──────────────────────────────────────────────────────────

type VychoziBod = { nazev: string; typ: string; lat: number; lng: number }
type Chata = { slug: string; nazev: string; lat: number; lng: number }

const nactiChaty = (dir: string): Chata[] => {
  if (!existsSync(dir)) return []
  const out: Chata[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const y = parse(readFileSync(join(dir, f), 'utf8')) as { slug?: string; nazev?: string; lat?: number; lng?: number } | null
    if (!y?.nazev || typeof y.lat !== 'number' || typeof y.lng !== 'number') continue
    out.push({ slug: y.slug ?? f.replace(/\.yaml$/, ''), nazev: y.nazev, lat: y.lat, lng: y.lng })
  }
  return out
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = () => {
  if (!existsSync(EXPORT_JSON)) throw new Error(`Export tras ${EXPORT_JSON} neexistuje — workflow „DATA-06: export značených tras".`)

  const { elementy } = nactiExport(readFileSync(EXPORT_JSON, 'utf8'))
  const graf = postavGraf(elementy as unknown as TrasaRelace[])
  let hran = 0
  for (const s of graf.sousede.values()) hran += s.length
  console.log(`Graf: ${graf.uzly.size} uzlů, ${hran / 2} hran.`)

  // Zdroj výchozích bodů: přednostně kurátorovaný seznam středisek (reálná
  // východiska), jinak fallback na plný OSM katalog kandidátů.
  let vychoziBody: VychoziBod[]
  let zdrojBodu: string
  if (existsSync(STREDISKA_YAML)) {
    const kur = parse(readFileSync(STREDISKA_YAML, 'utf8')) as { strediska?: VychoziBod[] }
    vychoziBody = kur.strediska ?? []
    zdrojBodu = `kurátorovaná střediska (${vychoziBody.length})`
  } else if (existsSync(VYCHOZI_JSON)) {
    const katalog = JSON.parse(readFileSync(VYCHOZI_JSON, 'utf8')) as { body?: VychoziBod[] }
    vychoziBody = katalog.body ?? []
    zdrojBodu = `OSM katalog kandidátů (${vychoziBody.length})`
  } else {
    throw new Error(`Chybí ${STREDISKA_YAML} i ${VYCHOZI_JSON} — bez výchozích bodů nelze routovat.`)
  }

  // Výchozí body → přichycení na síť (dál než MAX_SNAP_M se vynechá).
  const vychoziSnap: VychoziSnap[] = []
  let vbMimo = 0
  for (const b of vychoziBody) {
    const nej = najdiNejblizsiUzel(graf, b.lat, b.lng)
    if (nej && nej.vzdalenostM <= MAX_SNAP_M) vychoziSnap.push({ nazev: b.nazev, typ: b.typ, uzel: nej.klic })
    else vbMimo++
  }
  console.log(`Výchozí body (${zdrojBodu}) → připojeno ${vychoziSnap.length} (${vbMimo} dál než ${MAX_SNAP_M} m).`)

  const chaty = nactiChaty(CHATY_ADRESAR)
  const vystup: { slug: string; nazev: string; pristupSnapM: number; pristupy: Pristup[] }[] = []
  const bezTras: string[] = []
  for (const chata of chaty) {
    const nej = najdiNejblizsiUzel(graf, chata.lat, chata.lng)
    if (!nej || nej.vzdalenostM > MAX_SNAP_M) {
      bezTras.push(`${chata.nazev} (od sítě ${nej?.vzdalenostM ?? '—'} m)`)
      continue
    }
    const pristupy = vyberPristupy(graf, nej.klic, vychoziSnap, POCET_PRISTUPU)
    if (!pristupy.length) {
      bezTras.push(`${chata.nazev} (žádný dosažitelný výchozí bod)`)
      continue
    }
    vystup.push({ slug: chata.slug, nazev: chata.nazev, pristupSnapM: nej.vzdalenostM, pristupy })
  }

  mkdirSync(TRASY_ADRESAR, { recursive: true })
  writeFileSync(
    VYSTUP_JSON,
    JSON.stringify(
      {
        zdroj: 'OpenStreetMap Overpass (route=hiking) + výchozí body OSM — data © přispěvatelé OpenStreetMap, ODbL 1.0',
        pozn: 'Planární routing po značených trasách (preference značek). Výšky a casMin (DIN 33466) dopočítá krok s Mapy.com Elevation API.',
        pocetChat: vystup.length,
        chaty: vystup,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const kKontrole = vystup.flatMap((c) => c.pristupy).filter((p) => p.kRucniKontrole).length
  console.log(`\n## DATA-06 report — přístupové trasy`)
  console.log(`Chat s trasou: ${vystup.length} / ${chaty.length} · přístupů celkem: ${vystup.reduce((s, c) => s + c.pristupy.length, 0)} · k ruční kontrole (>${PRAH_NEZNACENE_PROC} % neznačené): ${kKontrole}`)
  for (const c of vystup.slice(0, 8)) {
    const p = c.pristupy[0]
    console.log(`- ${c.nazev}: ${p.vychoziBod} (${p.typ}) ${p.delkaKm} km${p.kRucniKontrole ? ` ⚠︎ ${p.podilNeznacenychProc}% neznačené` : ''}`)
  }
  if (vystup.length > 8) console.log(`  … a ${vystup.length - 8} dalších`)
  if (bezTras.length) {
    console.log(`\nBez trasy (${bezTras.length}):`)
    for (const b of bezTras) console.log(`- ${b}`)
  }
  console.log(`\nKatalog: ${VYSTUP_JSON}`)
}

if (process.argv[1]?.endsWith('data06-pristupove-trasy.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
