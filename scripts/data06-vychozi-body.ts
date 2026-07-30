/**
 * DATA-06 (increment 2): export VÝCHOZÍCH BODŮ oblasti z OpenStreetMap.
 *
 * Increment 1 dal routovatelný podklad (značené trasy `route=hiking`). Aby z něj
 * šlo počítat přístupové trasy k chatám, potřebuje routing (increment 3) i
 * ODKUD se vychází — realistická místa startu túry v pohoří. Tenhle krok je
 * z OSM honestně sesbírá do katalogu výchozích bodů:
 *   • obce/střediska  — `place=town` / `place=village` (Špindl, Pec, Harrachov,
 *                       Karpacz, Szklarska Poręba…),
 *   • lanovky/vleky   — `aerialway=station` (motorizovaný přístup na hřeben:
 *                       Sněžka, Medvědín, Černá hora, Szrenica, Kopa…),
 *   • železnice       — `railway=station` / `halt` (Harrachov, Kořenov,
 *                       Rokytnice n. J.).
 *
 * Výstup: surový export (doklad, `_vychozi-body-export-<zeme>.json`) + katalog
 * `vychozi-body-kandidati.json` (osmId, název, typ, GPS, výška, země) — vstup
 * pro routing z increment 3. Kurátorské zúžení/priorizace (které body jsou pro
 * oblast „primární") je volitelná redakční vrstva nad katalogem, ne podmínka
 * běhu pipeline (cíl DATA-06: trasy bez ruční práce).
 *
 * Poctivost (CLAUDE.md): nic se nedomýšlí — zapisuje jen to, co v OSM je. Bod
 * bez názvu nebo bez souřadnic jde do reportu, ne do katalogu. Vše
 * `verified: false` se zdrojem (URL OSM objektu). Atribuce: data © přispěvatelé
 * OpenStreetMap, ODbL 1.0.
 *
 * Spuštění (sandbox na Overpass nedosáhne — ostrý běh dělá GitHub Actions
 * workflow „DATA-06: výchozí body oblasti"):
 *   npx tsx scripts/data06-vychozi-body.ts                          # Krkonoše (výchozí)
 *   npx tsx scripts/data06-vychozi-body.ts --oblast jizerske-hory   # jiná oblast
 *   npx tsx scripts/data06-vychozi-body.ts --z-jsonu                # offline nad commitnutým exportem
 *   npx tsx scripts/data06-vychozi-body.ts --api https://overpass.kumi.systems/api/interpreter
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  nactiExport,
  osmUrl,
  stahniOverpass,
  VYCHOZI_API_INSTANCE,
  type OsmElement,
  type Zeme,
} from './data01-overpass-krkonose'
import { bboxStr, cestyOblasti, oblastZArgv, zemeDotazu } from './oblasti'

const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

/** Typ výchozího bodu — z jednoznačného OSM tagu, jinak null (nedomýšlet). */
export type TypBodu = 'obec' | 'lanovka' | 'zeleznice' | 'zastavka'

/**
 * Určí typ výchozího bodu z OSM tagů. Pořadí je jen pro případ víc tagů na
 * jednom objektu (v praxi se nepřekrývají):
 *   place=town|village → obec, aerialway=station → lanovka,
 *   railway=station|halt → železnice, highway=bus_stop → zastávka.
 * Nerozpoznáno → null (do reportu).
 */
export const typBoduZTagu = (tagy: Record<string, string>): TypBodu | null => {
  if (tagy.place === 'town' || tagy.place === 'village') return 'obec'
  if (tagy.aerialway === 'station') return 'lanovka'
  if (tagy.railway === 'station' || tagy.railway === 'halt') return 'zeleznice'
  if (tagy.highway === 'bus_stop') return 'zastavka'
  return null
}

/** Souřadnice: node je nese přímo, way/relation přes Overpass `out center`. */
const souradnice = (el: OsmElement): { lat: number; lng: number } | null => {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

/** Nadmořská výška z tagu `ele` — jen rozumné číslo, jinak null (nezapisuje se). */
const vyskaZTagu = (ele: string | undefined): number | null => {
  if (!ele) return null
  const cislo = Number(ele.replace(',', '.').replace(/\s*m$/i, ''))
  return Number.isFinite(cislo) && cislo > 0 && cislo < 4900 ? Math.round(cislo) : null
}

// ── Overpass ────────────────────────────────────────────────────────────────

/**
 * Výchozí body v jedné zemi (průnik area státu + okno oblasti — stejně jako
 * DATA-01, aby každý bod nesl doloženou `zeme`). `place` bereme jen jako node
 * (sídelní bod), lanovky a železnice `nwr` (stanice bývá node i way).
 */
export const overpassDotazVychoziBody = (iso: string, okno: string): string => `[out:json][timeout:120];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
  node["place"~"^(town|village)$"](area.stat)(${okno});
  nwr["aerialway"="station"](area.stat)(${okno});
  nwr["railway"~"^(station|halt)$"](area.stat)(${okno});
  node["highway"="bus_stop"]["name"](area.stat)(${okno});
);
out center;`

// ── Zpracování ──────────────────────────────────────────────────────────────

export type VychoziBod = {
  osmId: number
  osmTyp: OsmElement['type']
  url: string
  nazev: string
  typ: TypBodu
  lat: number
  lng: number
  vyska: number | null
  zeme: Zeme
}

export type VychoziBodyReport = {
  body: VychoziBod[]
  vynechano: { url: string; duvod: 'bez-nazvu' | 'bez-souradnic' | 'neznamy-typ' }[]
}

/** Element s metadaty svého exportu (země dle area v dotazu). */
export type ExportPolozka = { el: OsmElement; zeme: Zeme }

/** Klíč pro sloučení fyzicky téhož bodu (typ + název + GPS na ~100 m). */
const klicBodu = (b: VychoziBod): string =>
  `${b.typ}|${b.nazev.toLowerCase()}|${b.lat.toFixed(3)}|${b.lng.toFixed(3)}`

/**
 * Roztřídí OSM elementy na výchozí body (mají typ + název + GPS → katalog) a
 * vynechané (k ruční kontrole). Deduplikuje fyzicky stejné body (stanice
 * mapovaná jako node i way, sídelní bod dvakrát) — dvě různá sídla téhož jména
 * daleko od sebe klíč nesloučí (GPS na ~100 m je jeho součástí).
 */
export const zpracujBody = (polozky: ExportPolozka[]): VychoziBodyReport => {
  const dleKlice = new Map<string, VychoziBod>()
  const vynechano: VychoziBodyReport['vynechano'] = []

  for (const { el, zeme } of polozky) {
    const tagy = el.tags ?? {}
    const url = osmUrl(el)
    const typ = typBoduZTagu(tagy)
    if (!typ) {
      vynechano.push({ url, duvod: 'neznamy-typ' })
      continue
    }
    if (!tagy.name) {
      vynechano.push({ url, duvod: 'bez-nazvu' })
      continue
    }
    const gps = souradnice(el)
    if (!gps) {
      vynechano.push({ url, duvod: 'bez-souradnic' })
      continue
    }
    const bod: VychoziBod = {
      osmId: el.id,
      osmTyp: el.type,
      url,
      nazev: tagy.name,
      typ,
      lat: gps.lat,
      lng: gps.lng,
      vyska: vyskaZTagu(tagy.ele),
      zeme,
    }
    const klic = klicBodu(bod)
    // Idempotentně: první výskyt vyhrává, ať je pořadí z API jedno.
    if (!dleKlice.has(klic)) dleKlice.set(klic, bod)
  }

  const body = [...dleKlice.values()].sort(
    (a, b) => a.nazev.localeCompare(b.nazev, 'cs') || a.osmId - b.osmId,
  )
  return { body, vynechano }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const zJsonu = argv.includes('--z-jsonu')
  const apiIndex = argv.indexOf('--api')
  const instance = apiIndex >= 0 && argv[apiIndex + 1] ? [argv[apiIndex + 1]] : VYCHOZI_API_INSTANCE

  const oblast = oblastZArgv(argv)
  const okno = bboxStr(oblast.bbox)
  const OBLAST_ADRESAR = cestyOblasti(oblast.slug).oblast
  const KATALOG_JSON = join(OBLAST_ADRESAR, 'vychozi-body-kandidati.json')
  const exportJson = (zeme: string) => join(OBLAST_ADRESAR, `_vychozi-body-export-${zeme}.json`)
  console.log(`Oblast: ${oblast.nazev} (${oblast.slug}) — okno dotazu ${okno}, země ${oblast.zeme.join(', ')}`)

  mkdirSync(OBLAST_ADRESAR, { recursive: true })
  const polozky: ExportPolozka[] = []
  const stavy: Partial<Record<Zeme, string>> = {}

  for (const { zeme, iso } of zemeDotazu(oblast)) {
    const soubor = exportJson(zeme)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export ${soubor} neexistuje — země ${zeme} se přeskakuje (stáhne ji běh bez --z-jsonu).`)
        continue
      }
      console.log(`Offline zpracování commitnutého exportu ${soubor}…`)
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (place town/village + aerialway=station + railway station/halt, ${iso} ∩ okno ${oblast.nazev}); instance: ${instance.join(', ')}…`)
      const vysledek = await stahniOverpass(instance, overpassDotazVychoziBody(iso, okno))
      raw = vysledek.raw
      console.log(`Staženo z ${vysledek.api}.`)
      writeFileSync(soubor, raw, 'utf8')
      console.log(`Surový export uložen: ${soubor} (commituje se jako doklad).`)
    }
    const { elementy, checked } = nactiExport(raw)
    console.log(`Export ${zeme}: ${elementy.length} objektů, stav OSM dat ${checked}.`)
    stavy[zeme as Zeme] = checked
    polozky.push(...elementy.map((el) => ({ el, zeme: zeme as Zeme })))
  }
  if (polozky.length === 0 && zJsonu) {
    throw new Error('--z-jsonu: žádný commitnutý export nenalezen — nejdřív ho stáhne workflow/běh bez --z-jsonu.')
  }

  const { body, vynechano } = zpracujBody(polozky)

  const katalog = {
    zdroj: `OpenStreetMap Overpass (place town/village + aerialway=station + railway station/halt, okno ${oblast.nazev}) — ${ATRIBUCE}`,
    stavOsmDat: stavy,
    pocetBodu: body.length,
    body,
  }
  writeFileSync(KATALOG_JSON, JSON.stringify(katalog, null, 2) + '\n', 'utf8')

  const dle = (t: TypBodu) => body.filter((b) => b.typ === t).length
  const dleZeme = (z: Zeme) => body.filter((b) => b.zeme === z).length
  console.log(`\n## DATA-06 report — výchozí body oblasti (stav OSM dat: ${Object.entries(stavy).map(([z, c]) => `${z} ${c}`).join(', ') || '—'})`)
  console.log(`Objektů v exportu: ${polozky.length}`)
  const dleZemi = oblast.zeme.map((iso) => `${iso} ${dleZeme(iso.toLowerCase() as Zeme)}`).join(', ')
  console.log(`Výchozích bodů (do katalogu): ${body.length} — obce ${dle('obec')}, lanovky ${dle('lanovka')}, železnice ${dle('zeleznice')} · ${dleZemi}`)
  console.log(`Vynecháno (k ruční kontrole, NEzapsáno): ${vynechano.length}`)
  for (const b of body.slice(0, 30)) {
    console.log(`- [${b.typ}] ${b.nazev}${b.vyska != null ? ` (${b.vyska} m)` : ''} — ${b.url}`)
  }
  if (body.length > 30) console.log(`  … a ${body.length - 30} dalších`)
  console.log(`\nKatalog zapsán: ${KATALOG_JSON}`)
}

if (process.argv[1]?.endsWith('data06-vychozi-body.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
