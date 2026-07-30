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
import { shodaNazvu } from './data05-razitkuj-parovani'
import {
  dijkstraOdUzlu,
  najdiNejblizsiUzel,
  postavGraf,
  slozTrasu,
  type Graf,
  type Trasa,
  type UzelKlic,
} from './data06-graf'
import { nactiDoporuceneZeSouboru, type DoporucenyBod, type OsmBod } from './data06-katalog-vychozi'
import { type TrasaRelace } from './data06-trasy'
import { cestyOblasti, oblastZArgv } from './oblasti'

/**
 * Cesty se odvozují od zvolené oblasti (`--oblast`), ne napevno. Do 30. 7. 2026
 * tu stálo „krkonose" a routing by po exportu jiné oblasti tiše počítal pořád
 * Krkonoše — tichý přehmat, který by v datech nebylo poznat.
 */
const cesty = (() => {
  const oblast = oblastZArgv()
  const c = cestyOblasti(oblast.slug)
  return {
    oblast,
    TRASY_ADRESAR: c.trasy,
    EXPORT_JSON: join(c.trasy, '_overpass-trasy.json'),
    // Přednostně kurátorovaný seznam středisek (reálná východiska túr, ruční
    // výběr), jinak fallback na plný OSM katalog kandidátů.
    STREDISKA_YAML: join(c.oblast, 'vychozi-body.yaml'),
    VYCHOZI_JSON: join(c.oblast, 'vychozi-body-kandidati.json'),
    CHATY_ADRESAR: c.chaty,
    VYSTUP_JSON: join(c.trasy, 'pristupove-trasy.json'),
  }
})()
const { TRASY_ADRESAR, EXPORT_JSON, STREDISKA_YAML, VYCHOZI_JSON, CHATY_ADRESAR, VYSTUP_JSON } = cesty
// Katalog doporučených nástupů (ChatGPT podklad, per-chata pořadí + zdroje).
// Geokóduje se proti OSM katalogu výchozích bodů (VYCHOZI_JSON).
const KATALOG_CSV = join(process.cwd(), 'data', 'externi', 'vychozi-body-cr-sk-2026', 'vychozi-body.csv')

/** Dál než tolik metrů od nejbližšího uzlu sítě = nepřipojeno (nepočítá se). */
const MAX_SNAP_M = 1500
/** Kolik nejbližších výchozích bodů zapsat jako přístup k chatě (fallback střediska). */
const POCET_PRISTUPU = 2
/** Kolik nástupů zapsat u chaty se shodou v katalogu (katalog dává 1–3). */
const POCET_PRISTUPU_KATALOG = 3
/** Trasa s vyšším podílem neznačené délky (%) → příznak k ruční kontrole. */
const PRAH_NEZNACENE_PROC = 15
/** Geokódovaný nástup dál než tolik km (vzdušně) od chaty = špatný geokód → zahodit. */
const MAX_VZDUSNE_KM = 12

/** Vzdušná vzdálenost dvou GPS bodů (km, haversine) — sanity check geokódu. */
const vzdusneKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export type VychoziSnap = { nazev: string; typ: string; uzel: UzelKlic }
export type Pristup = {
  vychoziBod: string
  typ: string
  delkaKm: number
  useky: Trasa['useky']
  podilNeznacenychProc: number
  kRucniKontrole: boolean
  geometrie: Trasa['geometrie']
  /** 'katalog' = kurátorovaný nástup z katalogu (s pořadím/zdroji), 'stredisko' = nejbližší kurátorované středisko. */
  zdrojBodu: 'katalog' | 'stredisko'
  /** Katalogová metadata (jen `zdrojBodu === 'katalog'`). */
  poradi?: number
  doprava?: string
  sezona?: string
  poznamka?: string
  zdroje?: string[]
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
      zdrojBodu: 'stredisko',
    })
  }
  return pristupy
}

/**
 * Přístupy z kurátorovaného katalogu doporučených nástupů (ChatGPT podklad).
 * Bere nástupy v POŘADÍ dle katalogu (pořadí 1 = hlavní východisko — lidská
 * znalost, kterou nechceme přebít routovací cenou), geokódované přes OSM. Pro
 * každý spočítá reálnou trasu po značených cestách. Sanity: nástup dál než
 * `MAX_VZDUSNE_KM` vzdušně = špatný geokód → přeskočí; body na týž uzel se
 * neopakují; nedosažitelné/nulové se vynechají. Metadata (pořadí, doprava,
 * sezóna, poznámka, zdroje) jdou na profil jako ověřitelné vodítko.
 */
export const vyberPristupyZKatalogu = (
  graf: Graf,
  hutUzel: UzelKlic,
  hutLat: number,
  hutLng: number,
  doporucene: DoporucenyBod[],
  pocet: number,
): Pristup[] => {
  const { cena, predchudce } = dijkstraOdUzlu(graf, hutUzel)
  const pristupy: Pristup[] = []
  const pouzityUzel = new Set<UzelKlic>()
  for (const d of doporucene) {
    if (pristupy.length >= pocet) break
    if (vzdusneKm(hutLat, hutLng, d.lat, d.lng) > MAX_VZDUSNE_KM) continue // špatný geokód
    const nej = najdiNejblizsiUzel(graf, d.lat, d.lng)
    if (!nej || nej.vzdalenostM > MAX_SNAP_M) continue
    if (pouzityUzel.has(nej.klic) || cena.get(nej.klic) == null) continue
    const t = slozTrasu(graf, predchudce, hutUzel, nej.klic)
    if (!t || t.delkaKm <= 0) continue
    pouzityUzel.add(nej.klic)
    pristupy.push({
      vychoziBod: d.vychoziBod,
      typ: d.typ,
      delkaKm: t.delkaKm,
      useky: t.useky,
      podilNeznacenychProc: t.podilNeznacenychProc,
      kRucniKontrole: t.podilNeznacenychProc > PRAH_NEZNACENE_PROC,
      geometrie: t.geometrie,
      zdrojBodu: 'katalog',
      poradi: d.poradi,
      doprava: d.doprava || undefined,
      sezona: d.sezona || undefined,
      poznamka: d.poznamka || undefined,
      zdroje: d.zdroje.length ? d.zdroje : undefined,
    })
  }
  return pristupy
}

// ── Načtení vstupů ──────────────────────────────────────────────────────────

type VychoziBod = { nazev: string; typ: string; lat: number; lng: number }
type Chata = { slug: string; nazev: string; lat: number; lng: number; nazvy: string[] }

const nactiChaty = (dir: string): Chata[] => {
  if (!existsSync(dir)) return []
  const out: Chata[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const y = parse(readFileSync(join(dir, f), 'utf8')) as
      | { slug?: string; nazev?: string; lat?: number; lng?: number; aliasy?: { nazev?: string }[] }
      | null
    if (!y?.nazev || typeof y.lat !== 'number' || typeof y.lng !== 'number') continue
    const aliasy = (y.aliasy ?? []).map((a) => a?.nazev).filter((n): n is string => !!n)
    out.push({ slug: y.slug ?? f.replace(/\.yaml$/, ''), nazev: y.nazev, lat: y.lat, lng: y.lng, nazvy: [y.nazev, ...aliasy] })
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

  // Katalog doporučených nástupů (kurátorovaný, per-chata pořadí + zdroje):
  // geokóduje se proti OSM katalogu výchozích bodů. Když chybí, jede se jen na
  // kurátorovaná střediska (fallback výše).
  const osmBody: OsmBod[] = existsSync(VYCHOZI_JSON)
    ? ((JSON.parse(readFileSync(VYCHOZI_JSON, 'utf8')) as { body?: OsmBod[] }).body ?? [])
    : []
  const katalog: Map<string, DoporucenyBod[]> =
    existsSync(KATALOG_CSV) && osmBody.length ? nactiDoporuceneZeSouboru(KATALOG_CSV, osmBody) : new Map()
  // Katalog má klíče = normalizovaný název chaty; shoda přes název + aliasy chaty.
  const najdiKatalog = (nazvy: string[]): DoporucenyBod[] | null => {
    for (const [klic, body] of katalog) if (shodaNazvu(nazvy, klic)) return body
    return null
  }
  console.log(`Katalog doporučených nástupů: ${katalog.size} chat (geokódováno přes ${osmBody.length} OSM bodů).`)

  const chaty = nactiChaty(CHATY_ADRESAR)
  const vystup: { slug: string; nazev: string; pristupSnapM: number; zdroj: 'katalog' | 'stredisko'; pristupy: Pristup[] }[] = []
  const bezTras: string[] = []
  let zKatalogu = 0
  for (const chata of chaty) {
    const nej = najdiNejblizsiUzel(graf, chata.lat, chata.lng)
    if (!nej || nej.vzdalenostM > MAX_SNAP_M) {
      bezTras.push(`${chata.nazev} (od sítě ${nej?.vzdalenostM ?? '—'} m)`)
      continue
    }
    // Přednost: kurátorované nástupy z katalogu (v pořadí dle katalogu). Když
    // chata není v katalogu nebo se nic nezroutuje, fallback na střediska.
    const doporucene = najdiKatalog(chata.nazvy)
    let pristupy = doporucene ? vyberPristupyZKatalogu(graf, nej.klic, chata.lat, chata.lng, doporucene, POCET_PRISTUPU_KATALOG) : []
    let zdroj: 'katalog' | 'stredisko' = 'katalog'
    if (!pristupy.length) {
      pristupy = vyberPristupy(graf, nej.klic, vychoziSnap, POCET_PRISTUPU)
      zdroj = 'stredisko'
    }
    if (!pristupy.length) {
      bezTras.push(`${chata.nazev} (žádný dosažitelný výchozí bod)`)
      continue
    }
    if (zdroj === 'katalog') zKatalogu++
    vystup.push({ slug: chata.slug, nazev: chata.nazev, pristupSnapM: nej.vzdalenostM, zdroj, pristupy })
  }

  mkdirSync(TRASY_ADRESAR, { recursive: true })
  writeFileSync(
    VYSTUP_JSON,
    JSON.stringify(
      {
        zdroj:
          'OpenStreetMap Overpass (route=hiking) + výchozí body OSM — data © přispěvatelé OpenStreetMap, ODbL 1.0. Doporučené nástupy a jejich pořadí/zdroje: katalog (ChatGPT podklad, ' +
          'data/externi/vychozi-body-cr-sk-2026), verified:false.',
        pozn: 'Planární routing po značených trasách (preference značek). Nástupy z katalogu jsou v pořadí dle katalogu (pořadí 1 = hlavní), ostatní chaty z kurátorovaných středisek. Výšky a casMin (DIN 33466) dopočítá krok s Mapy.com Elevation API.',
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
  console.log(`Chat s trasou: ${vystup.length} / ${chaty.length} · z katalogu: ${zKatalogu}, ze středisek: ${vystup.length - zKatalogu} · přístupů celkem: ${vystup.reduce((s, c) => s + c.pristupy.length, 0)} · k ruční kontrole (>${PRAH_NEZNACENE_PROC} % neznačené): ${kKontrole}`)
  for (const c of vystup.slice(0, 8)) {
    const p = c.pristupy[0]
    console.log(`- ${c.nazev} [${c.zdroj}]: ${p.vychoziBod} (${p.typ}) ${p.delkaKm} km${p.kRucniKontrole ? ` ⚠︎ ${p.podilNeznacenychProc}% neznačené` : ''}`)
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
