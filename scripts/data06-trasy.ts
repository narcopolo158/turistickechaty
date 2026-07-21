/**
 * DATA-06 (increment 1): export značených turistických tras Krkonoš z OSM.
 *
 * Cíl celé DATA-06: pro každou chatu spočítat přístupové trasy automaticky.
 * Tenhle první krok postaví ROUTOVATELNÝ PODKLAD — stáhne z Overpass relace
 * `route=hiking` v Krkonoších i s geometrií a z tagu `osmc:symbol` (příp.
 * `kct_*` / `colour`) určí **barvu značení KČT** (červená/modrá/zelená/žlutá).
 * Výstup: surový export (doklad) + katalog značených tras `znacene-trasy.json`
 * (osmId, název, ref, znaceni, délka, počet úseků) — vstup pro pozdější
 * routing z výchozích bodů (increment 2: cesty po značkách → geometrie,
 * `znaceni` po úsecích, výšky přes Mapy.com Elevation, `casMin` dle DIN 33466).
 *
 * Poctivost (CLAUDE.md): nic se nedomýšlí — barva jen tam, kde ji OSM nese;
 * trasy bez rozpoznaného značení jdou do reportu, ne do katalogu jako by byly
 * neznačené-ale-jisté. Atribuce: data © přispěvatelé OpenStreetMap, ODbL 1.0.
 *
 * Spuštění (sandbox na Overpass nedosáhne — ostrý běh dělá GitHub Actions
 * workflow „DATA-06: export značených tras"):
 *   npx tsx scripts/data06-trasy.ts                 # stáhne + zpracuje
 *   npx tsx scripts/data06-trasy.ts --z-jsonu       # offline nad commitnutým exportem
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { BBOX_KRKONOSE, nactiExport, stahniOverpass, VYCHOZI_API_INSTANCE, vzdalenostM } from './data01-overpass-krkonose'

const TRASY_ADRESAR = join(process.cwd(), 'data', 'trasy', 'krkonose')
const EXPORT_JSON = join(TRASY_ADRESAR, '_overpass-trasy.json')
const KATALOG_JSON = join(TRASY_ADRESAR, 'znacene-trasy.json')
const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

export type Znaceni = 'cervena' | 'modra' | 'zelena' | 'zluta'

/** Anglický název barvy z OSM → značení KČT (jen čtyři pásové barvy KČT). */
const BARVA_NAZEV: Record<string, Znaceni> = {
  red: 'cervena',
  blue: 'modra',
  green: 'zelena',
  yellow: 'zluta',
}

/**
 * Hex barvy, které KČT/OSM v praxi používají pro pásové značení. Mapuje se jen
 * jednoznačná shoda; neznámý hex vrací null (nedomýšlet).
 */
const BARVA_HEX: Record<string, Znaceni> = {
  '#ff0000': 'cervena',
  '#e30613': 'cervena',
  '#d40000': 'cervena',
  '#0000ff': 'modra',
  '#0060ff': 'modra',
  '#004a99': 'modra',
  '#008000': 'zelena',
  '#00a000': 'zelena',
  '#009933': 'zelena',
  '#ffff00': 'zluta',
  '#ffd700': 'zluta',
  '#f2c200': 'zluta',
}

const barvaZTokenu = (token: string): Znaceni | null => {
  const t = token.trim().toLowerCase()
  if (BARVA_NAZEV[t]) return BARVA_NAZEV[t]
  if (/^#[0-9a-f]{6}$/.test(t)) return BARVA_HEX[t] ?? null
  return null
}

export type VysledekZnaceni = { znaceni: Znaceni; zdroj: string } | null

/**
 * Určí barvu značení KČT z OSM tagů relace. Pořadí zdrojů podle spolehlivosti:
 *   1) `osmc:symbol` — formát `waycolour:background:foreground[...]`; první pole
 *      je barva cesty (KČT: „red:white:red_bar" → červená).
 *   2) `kct_red|kct_blue|kct_green|kct_yellow` — přímé KČT tagy značky.
 *   3) `colour` / `color` — název (red…) nebo hex.
 * Nerozpoznáno → null (do reportu, ne do katalogu). Nic se nedomýšlí.
 */
export const znaceniZTagu = (tagy: Record<string, string>): VysledekZnaceni => {
  const osmc = tagy['osmc:symbol']
  if (osmc) {
    const barva = barvaZTokenu(osmc.split(':')[0] ?? '')
    if (barva) return { znaceni: barva, zdroj: `osmc:symbol=${osmc}` }
  }
  for (const [tag, znaceni] of [
    ['kct_red', 'cervena'],
    ['kct_blue', 'modra'],
    ['kct_green', 'zelena'],
    ['kct_yellow', 'zluta'],
  ] as const) {
    if (tagy[tag]) return { znaceni, zdroj: `${tag}=${tagy[tag]}` }
  }
  const colour = tagy.colour ?? tagy.color
  if (colour) {
    const barva = barvaZTokenu(colour)
    if (barva) return { znaceni: barva, zdroj: `colour=${colour}` }
  }
  return null
}

// ── Overpass ────────────────────────────────────────────────────────────────

/** Relace pěší trasy vč. geometrie členských cest (Overpass `out geom`). */
export type TrasaRelace = {
  type: 'relation'
  id: number
  tags?: Record<string, string>
  members?: { type: string; ref: number; role: string; geometry?: { lat: number; lon: number }[] }[]
}

export const overpassDotazTrasy = (): string => `[out:json][timeout:180];
relation["route"="hiking"](${BBOX_KRKONOSE});
out geom tags;`

/** Součet délek všech členských cest relace (haversine po sobě jdoucích bodů), km. */
export const delkaTrasyKm = (rel: TrasaRelace): number => {
  let metry = 0
  for (const clen of rel.members ?? []) {
    const g = clen.geometry
    if (!g || g.length < 2) continue
    for (let i = 1; i < g.length; i++) {
      metry += vzdalenostM(g[i - 1].lat, g[i - 1].lon, g[i].lat, g[i].lon)
    }
  }
  return Math.round((metry / 1000) * 10) / 10
}

export type TrasaKatalog = {
  osmId: number
  url: string
  nazev: string | null
  ref: string | null
  znaceni: Znaceni
  znaceniZdroj: string
  delkaKm: number
  pocetUseku: number
}

export type TrasyReport = {
  znacene: TrasaKatalog[]
  bezZnaceni: { osmId: number; url: string; nazev: string | null }[]
}

/** Roztřídí relace: se známou barvou → katalog, bez barvy → report k ruční kontrole. */
export const zpracujTrasy = (relace: TrasaRelace[]): TrasyReport => {
  const znacene: TrasaKatalog[] = []
  const bezZnaceni: TrasyReport['bezZnaceni'] = []
  for (const rel of relace) {
    if (rel.type !== 'relation') continue
    const tagy = rel.tags ?? {}
    const url = `https://www.openstreetmap.org/relation/${rel.id}`
    const vysledek = znaceniZTagu(tagy)
    if (!vysledek) {
      bezZnaceni.push({ osmId: rel.id, url, nazev: tagy.name ?? null })
      continue
    }
    znacene.push({
      osmId: rel.id,
      url,
      nazev: tagy.name ?? null,
      ref: tagy.ref ?? null,
      znaceni: vysledek.znaceni,
      znaceniZdroj: vysledek.zdroj,
      delkaKm: delkaTrasyKm(rel),
      pocetUseku: (rel.members ?? []).filter((m) => m.type === 'way' && m.geometry && m.geometry.length > 1).length,
    })
  }
  znacene.sort((a, b) => (a.nazev ?? '').localeCompare(b.nazev ?? '', 'cs') || a.osmId - b.osmId)
  return { znacene, bezZnaceni }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const zJsonu = argv.includes('--z-jsonu')
  const apiIndex = argv.indexOf('--api')
  const instance = apiIndex >= 0 && argv[apiIndex + 1] ? [argv[apiIndex + 1]] : VYCHOZI_API_INSTANCE

  mkdirSync(TRASY_ADRESAR, { recursive: true })
  let raw: string
  if (zJsonu) {
    if (!existsSync(EXPORT_JSON)) throw new Error(`--z-jsonu: export ${EXPORT_JSON} neexistuje — nejdřív ho stáhne workflow/běh bez --z-jsonu.`)
    console.log(`Offline zpracování commitnutého exportu ${EXPORT_JSON}…`)
    raw = readFileSync(EXPORT_JSON, 'utf8')
  } else {
    console.log(`Overpass dotaz: route=hiking ∩ bbox Krkonoš; instance: ${instance.join(', ')}…`)
    const vysledek = await stahniOverpass(instance, overpassDotazTrasy())
    raw = vysledek.raw
    console.log(`Staženo z ${vysledek.api}.`)
    writeFileSync(EXPORT_JSON, raw, 'utf8')
    console.log(`Surový export uložen: ${EXPORT_JSON} (commituje se jako doklad).`)
  }

  const { elementy, checked } = nactiExport(raw)
  const relace = elementy as unknown as TrasaRelace[]
  const { znacene, bezZnaceni } = zpracujTrasy(relace)

  const katalog = {
    zdroj: `OpenStreetMap Overpass (route=hiking, bbox Krkonoš) — ${ATRIBUCE}`,
    stavOsmDat: checked,
    pocetTras: znacene.length,
    trasy: znacene,
  }
  writeFileSync(KATALOG_JSON, JSON.stringify(katalog, null, 2) + '\n', 'utf8')

  const dle = (z: Znaceni) => znacene.filter((t) => t.znaceni === z).length
  console.log(`\n## DATA-06 report — značené trasy (stav OSM dat: ${checked})`)
  console.log(`Relací route=hiking v exportu: ${relace.length}`)
  console.log(`Se značením KČT (do katalogu): ${znacene.length} — červená ${dle('cervena')}, modrá ${dle('modra')}, zelená ${dle('zelena')}, žlutá ${dle('zluta')}`)
  console.log(`Bez rozpoznaného značení (k ruční kontrole, NEzapsáno): ${bezZnaceni.length}`)
  for (const t of bezZnaceni.slice(0, 20)) console.log(`- ${t.nazev ?? '(bez názvu)'} — ${t.url}`)
  if (bezZnaceni.length > 20) console.log(`  … a ${bezZnaceni.length - 20} dalších`)
  console.log(`\nKatalog zapsán: ${KATALOG_JSON}`)
}

if (process.argv[1]?.endsWith('data06-trasy.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
