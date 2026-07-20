/**
 * DATA-01: export chat Krkonoš z OpenStreetMap (Overpass API) — kandidáti.
 *
 * Stáhne objekty `tourism=alpine_hut` / `wilderness_hut` / `hut` v celých
 * Krkonoších — česká i polská strana, po zemích (průnik area státu + bbox
 * pohoří; rozhodnutí Michala 20. 7.: přeshraniční pohoří bereme celá).
 * Surové odpovědi uloží do `data/kandidati/krkonose/_overpass-export-<zeme>.json`
 * (commitují se — doklad exportu vč. timestampu a copyright hlavičky
 * Overpass) a transformuje je na `data/kandidati/krkonose/<slug>.yaml` —
 * jen doložené údaje z OSM tagů, vše `verified: false` se zdrojem
 * (URL OSM objektu) a atribucí ODbL.
 *
 * STAGING (rozhodnutí ručního běhu 20. 7.): kandidáti NEJSOU na webu — seed
 * čte jen `data/chaty/**`. Do `data/chaty/<pohori>/` se YAML povyšuje ručně
 * až po křížovém ověření (DATA-03), ať web nezaplaví desítky polotenkých
 * profilů naráz. Ručně kurátorované profily (Luční bouda) se NIKDY
 * nepřepisují — export je jen porovná a rozdíly vypíše do reportu.
 *
 * Spuštění (sandbox denních sessions na Overpass nedosáhne — ostrý běh dělá
 * GitHub Actions workflow „DATA-01: OSM export chat Krkonoš"):
 *   npx tsx scripts/data01-overpass-krkonose.ts                  # stáhne + transformuje
 *   npx tsx scripts/data01-overpass-krkonose.ts --api https://overpass.kumi.systems/api/interpreter
 *   npx tsx scripts/data01-overpass-krkonose.ts --z-jsonu        # offline: jen transformace commitnutého exportu
 *
 * Poctivost dat (CLAUDE.md): skript nic nedomýšlí — zapisuje pouze to, co
 * v OSM je. Stav provozu OSM spolehlivě nenese → `stav` se nevyplňuje.
 * Typ jen z jednoznačného významu tagu dle OSM wiki: alpine_hut = obsluhovaná
 * chata, wilderness_hut = útulna; nestandardní `tourism=hut` typ nedostane —
 * určí redakce. `checked` = datum stavu OSM dat (osm3s.timestamp_osm_base
 * z odpovědi), ne datum transformace.
 *
 * Atribuce: data © přispěvatelé OpenStreetMap, licence ODbL 1.0
 * (https://www.openstreetmap.org/copyright) — v source každého bloku ověření.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse, stringify } from 'yaml'

// Slug generujeme stejně jako Payload hook — jeden zdroj pravdy.
import { slugify } from '../src/fields/slug'

/**
 * Veřejné instance Overpass — zkoušejí se po řadě (hlavní instance
 * overpass-api.de sdílené IP GitHub Actions runnerů často rate-limituje,
 * kumi.systems bývá benevolentnější). `--api URL` fallback vypíná a vynutí
 * jedinou instanci.
 */
export const VYCHOZI_API_INSTANCE = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const KANDIDATI_ADRESAR = join(process.cwd(), 'data', 'kandidati', 'krkonose')
const RUCNI_ADRESAR = join(process.cwd(), 'data', 'chaty', 'krkonose')
const exportJson = (zeme: Zeme) => join(KANDIDATI_ADRESAR, `_overpass-export-${zeme}.json`)

/**
 * Krkonoše bereme celé — přes státní hranici (rozhodnutí Michala 20. 7.;
 * obecný princip pro přeshraniční pohoří, příště německá strana Šumavy).
 * Země se dotazuje po jedné (průnik area státu + bbox), aby každý kandidát
 * nesl doloženou `zeme` — bbox sám hranici nezná a domýšlet ji nebudeme.
 */
export const ZEME_DOTAZU: { zeme: Zeme; iso: string }[] = [
  { zeme: 'cz', iso: 'CZ' },
  { zeme: 'pl', iso: 'PL' },
]

export type Zeme = 'cz' | 'pl'

/**
 * Hrubé vyhledávací okno Krkonoš (jih, západ, sever, východ) — jen okno
 * dotazu, ne publikovaný údaj: pokrývá Harrachov až Rýchory a na severu
 * polské podhůří (Szklarska Poręba, Karpacz) s rezervou.
 */
export const BBOX_KRKONOSE = '50.55,15.30,50.87,16.05'

// `tourism=hut` je nestandardní (wiki zná alpine_hut/wilderness_hut), ale
// zadání ručního běhu ho chce v checklistu — kandidáty nic nekazí, nanejvýš
// přinese pár objektů k ruční kontrole navíc.
export const overpassDotaz = (iso: string): string => `[out:json][timeout:120];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
  nwr["tourism"="alpine_hut"](area.stat)(${BBOX_KRKONOSE});
  nwr["tourism"="wilderness_hut"](area.stat)(${BBOX_KRKONOSE});
  nwr["tourism"="hut"](area.stat)(${BBOX_KRKONOSE});
);
out center;`

export type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// ── Stažení a načtení exportu ───────────────────────────────────────────────

/** Stáhne surovou odpověď z jedné instance a ověří, že je to validní export. */
const stahniZInstance = async (api: string, dotaz: string): Promise<string> => {
  const odpoved = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Slušnost vůči veřejné instanci — ať provozovatel ví, kdo se ptá.
      'User-Agent': 'turistickechaty.cz (DATA-01 export; repo narcopolo158/turistickechaty)',
    },
    body: `data=${encodeURIComponent(dotaz)}`,
  })
  if (!odpoved.ok) {
    const napoveda = odpoved.status === 429 ? ' (rate limit)' : odpoved.status === 504 ? ' (přetížená instance)' : ''
    throw new Error(`HTTP ${odpoved.status}${napoveda}`)
  }
  const text = await odpoved.text()
  nactiExport(text) // validace už při stažení — vadný export se neukládá
  return text
}

/**
 * Zkouší instance po řadě, dokud jedna nevrátí validní export — rate limit
 * či výpadek jedné veřejné instance běh neshodí. Selžou-li všechny, chyba
 * nese souhrn všech pokusů (do anotace Actions).
 */
export const stahniOverpass = async (instance: string[], dotaz: string): Promise<{ raw: string; api: string }> => {
  const chyby: string[] = []
  for (const api of instance) {
    try {
      return { raw: await stahniZInstance(api, dotaz), api }
    } catch (chyba) {
      const zprava = chyba instanceof Error ? chyba.message : String(chyba)
      chyby.push(`${api}: ${zprava}`)
      console.error(`Instance selhala — ${api}: ${zprava}`)
    }
  }
  throw new Error(`Všechny Overpass instance selhaly:\n${chyby.map((ch) => `- ${ch}`).join('\n')}`)
}

/**
 * Načte surový export: elementy + `checked` = datum stavu OSM dat
 * (osm3s.timestamp_osm_base); bez něj datum dneška (transformace).
 */
export const nactiExport = (rawJson: string): { elementy: OsmElement[]; checked: string } => {
  let telo: { elements?: OsmElement[]; osm3s?: { timestamp_osm_base?: string } }
  try {
    telo = JSON.parse(rawJson)
  } catch {
    throw new Error('Export není validní JSON — Overpass zřejmě vrátil chybovou stránku.')
  }
  if (!Array.isArray(telo.elements)) throw new Error('Export bez pole `elements` — neplatný výstup Overpass.')
  const timestamp = telo.osm3s?.timestamp_osm_base
  const checked =
    typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}/.test(timestamp)
      ? timestamp.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  return { elementy: telo.elements, checked }
}

// ── Mapování OSM elementu na data chaty ─────────────────────────────────────

export const osmUrl = (el: OsmElement): string => `https://www.openstreetmap.org/${el.type}/${el.id}`

const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

/** Souřadnice: node je nese přímo, way/relation dává Overpass přes `out center`. */
const souradnice = (el: OsmElement): { lat: number; lng: number } | null => {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

/** Nadmořská výška z tagu `ele` — jen rozumné číslo, jinak se nezapisuje. */
const vyskaZTagu = (ele: string | undefined): number | null => {
  if (!ele) return null
  const cislo = Number(ele.replace(',', '.').replace(/\s*m$/i, ''))
  return Number.isFinite(cislo) && cislo > 0 && cislo < 4900 ? Math.round(cislo) : null
}

/** Vícehodnotové OSM tagy (alt_name apod.) oddělují hodnoty středníkem. */
const hodnoty = (tag: string | undefined): string[] =>
  (tag ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

export type Preskoceni = { duvod: 'bez-nazvu' | 'bez-souradnic'; url: string }

/**
 * Sestaví data chaty z OSM tagů — jen doložená pole. Bez názvu nebo souřadnic
 * se objekt přeskakuje (nemá jak dostat slug, resp. nepatří na mapu ani do
 * katalogu bez lokace) a jde do reportu k ruční kontrole.
 */
export const chataZElementu = (
  el: OsmElement,
  checked: string,
  zeme: Zeme = 'cz',
): { data: Record<string, unknown> } | Preskoceni => {
  const tagy = el.tags ?? {}
  const url = osmUrl(el)
  if (!tagy.name) return { duvod: 'bez-nazvu', url }
  const gps = souradnice(el)
  if (!gps) return { duvod: 'bez-souradnic', url }

  const data: Record<string, unknown> = {
    nazev: tagy.name,
    slug: slugify(tagy.name),
    zeme, // zaručeno průnikem s area ISO3166-1 daného státu přímo v dotazu
    oblast: 'krkonose',
    // `stav` vědomě chybí: OSM provoz spolehlivě nenese, nedomýšlíme.
  }
  // Typ jen z jednoznačného tagu; nestandardní `hut` nechává typ redakci.
  if (tagy.tourism === 'alpine_hut') data.typ = 'obsluhovana'
  if (tagy.tourism === 'wilderness_hut') data.typ = 'utulna'

  const aliasy = [
    ...hodnoty(tagy.alt_name).map((nazev) => ({ nazev, poznamka: 'alternativní název (OSM alt_name)' })),
    ...hodnoty(tagy.old_name).map((nazev) => ({ nazev, poznamka: 'historický název (OSM old_name)' })),
  ]
  if (aliasy.length > 0) data.aliasy = aliasy

  data.lat = gps.lat
  data.lng = gps.lng
  const vyska = vyskaZTagu(tagy.ele)
  if (vyska != null) data.vyska = vyska
  if (tagy['addr:city']) data.obec = tagy['addr:city']
  data.overeniLokace = {
    source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
    verified: false,
    checked,
  }

  const kontakty: Record<string, string> = {}
  const telefon = tagy.phone ?? tagy['contact:phone']
  const email = tagy.email ?? tagy['contact:email']
  const web = tagy.website ?? tagy['contact:website']
  if (telefon) kontakty.telefon = telefon
  if (email) kontakty.email = email
  if (web) kontakty.web = web
  if (Object.keys(kontakty).length > 0) {
    data.kontakty = kontakty
    data.overeniProvoz = {
      source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
      verified: false,
      checked,
    }
  }

  const poznamky = [
    `KANDIDÁT z OSM (DATA-01, stav dat ${checked}) — na web povýšit do data/chaty/ až po křížovém ověření (DATA-03).`,
    tagy.tourism === 'hut'
      ? 'OSM tag tourism=hut je nestandardní — typ nevyplněn, určí redakce.'
      : `Typ odvozen z OSM tagu tourism=${tagy.tourism} (alpine_hut = obsluhovaná, wilderness_hut = útulna).`,
    ...(tagy.operator ? [`Provozovatel dle OSM: ${tagy.operator}`] : []),
    ...(tagy.opening_hours ? [`Otvírací doba dle OSM (surový formát, neověřeno): ${tagy.opening_hours}`] : []),
    ...(tagy.note ? [`Poznámka z OSM: ${tagy.note}`] : []),
  ]
  data.interniPoznamky = poznamky.join('\n')

  return { data }
}

// ── Porovnání s ručně kurátorovaným profilem ────────────────────────────────

/** Vzdálenost dvou GPS bodů v metrech (haversine — stačí na sanity check). */
export const vzdalenostM = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371008.8
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

export type Porovnani = {
  slug: string
  url: string
  nazevOsm: string
  nazevRucni: string | null
  /** Vzdálenost OSM bodu od ručně zapsané GPS (m); null, když ruční profil GPS nemá. */
  gpsRozdilM: number | null
  vyskaOsm: number | null
  vyskaRucni: number | null
}

/** OSM objekt vs. ruční YAML — nic nepřepisuje, jen doloží rozdíly do reportu. */
export const porovnejSRucnim = (el: OsmElement, rucniYaml: string, slug: string): Porovnani => {
  const rucni = parse(rucniYaml) as { nazev?: string; lat?: number; lng?: number; vyska?: number } | null
  const gps = souradnice(el)
  const maRucniGps = typeof rucni?.lat === 'number' && typeof rucni?.lng === 'number'
  return {
    slug,
    url: osmUrl(el),
    nazevOsm: el.tags?.name ?? '',
    nazevRucni: rucni?.nazev ?? null,
    gpsRozdilM: gps && maRucniGps ? vzdalenostM(gps.lat, gps.lng, rucni.lat as number, rucni.lng as number) : null,
    vyskaOsm: vyskaZTagu(el.tags?.ele),
    vyskaRucni: typeof rucni?.vyska === 'number' ? rucni.vyska : null,
  }
}

// ── YAML soubor ─────────────────────────────────────────────────────────────

/**
 * YAML s hlavičkovým komentářem (zdroj, atribuce, upozornění redakci).
 * Hodnoty serializuje knihovna `yaml` — žádné ruční escapování názvů.
 */
export const yamlChaty = (data: Record<string, unknown>, url: string, checked: string): string =>
  [
    `# ${data.nazev} — KANDIDÁT z OpenStreetMap (DATA-01, stav OSM dat ${checked})`,
    `# Zdroj: ${url} · ${ATRIBUCE}`,
    '# Vše verified: false — údaje převzaty z OSM tagů, redakčně neověřeno. Na web',
    '# (data/chaty/krkonose/) povyšovat až po křížovém ověření (DATA-03). Stav',
    '# provozu OSM nenese, proto tu není. Nic nedomýšlet!',
    '',
    stringify(data),
  ].join('\n')

export type Report = {
  zapsano: { slug: string; nazev: string; url: string }[]
  jizKandidat: { slug: string; url: string }[]
  rucni: Porovnani[]
  preskoceno: Preskoceni[]
}

/** Element s metadaty svého exportu (země dle area v dotazu, checked dle stavu dat). */
export type ExportPolozka = { el: OsmElement; zeme: Zeme; checked: string }

/**
 * Zapíše YAML kandidátů (obě země do téhož adresáře pohoří — Krkonoše jsou
 * jedno pohoří, zemi nese chata). Ruční profily v `data/chaty/krkonose/` se
 * nikdy nepřepisují — jen porovnají; existující kandidát zůstává
 * (idempotence, případné ruční úpravy kandidáta se neztrácejí). Kolizi
 * slugů dvou OSM objektů v jednom běhu — i napříč zeměmi — řeší
 * deterministický suffix `-<osm id>`.
 */
export const zapisKandidaty = (
  polozky: ExportPolozka[],
  kandidatiAdresar: string,
  rucniAdresar: string,
): Report => {
  const report: Report = { zapsano: [], jizKandidat: [], rucni: [], preskoceno: [] }
  const slugyBehu = new Set<string>()
  mkdirSync(kandidatiAdresar, { recursive: true })

  // Deterministické pořadí výstupu nezávislé na pořadí z API.
  const serazene = [...polozky].sort(
    (a, b) => (a.el.tags?.name ?? '').localeCompare(b.el.tags?.name ?? '', 'cs') || a.el.id - b.el.id,
  )

  for (const { el, zeme, checked } of serazene) {
    const vysledek = chataZElementu(el, checked, zeme)
    if ('duvod' in vysledek) {
      report.preskoceno.push(vysledek)
      continue
    }
    const { data } = vysledek

    // Ručně kurátorovaný profil má absolutní přednost — jen porovnat.
    const rucniCesta = join(rucniAdresar, `${data.slug as string}.yaml`)
    if (existsSync(rucniCesta)) {
      report.rucni.push(porovnejSRucnim(el, readFileSync(rucniCesta, 'utf8'), data.slug as string))
      continue
    }

    let slug = data.slug as string
    if (slugyBehu.has(slug)) slug = `${slug}-${el.id}` // dvě chaty téhož jména v OSM
    data.slug = slug
    slugyBehu.add(slug)

    const cesta = join(kandidatiAdresar, `${slug}.yaml`)
    if (existsSync(cesta)) {
      report.jizKandidat.push({ slug, url: osmUrl(el) })
      continue
    }
    writeFileSync(cesta, yamlChaty(data, osmUrl(el), checked), 'utf8')
    report.zapsano.push({ slug, nazev: data.nazev as string, url: osmUrl(el) })
  }
  return report
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const apiIndex = argv.indexOf('--api')
  const instance = apiIndex >= 0 && argv[apiIndex + 1] ? [argv[apiIndex + 1]] : VYCHOZI_API_INSTANCE
  const zJsonu = argv.includes('--z-jsonu')

  const polozky: ExportPolozka[] = []
  const stavy: string[] = []
  for (const { zeme, iso } of ZEME_DOTAZU) {
    const soubor = exportJson(zeme)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export ${soubor} neexistuje — země ${zeme} se přeskakuje (stáhne ji běh bez --z-jsonu).`)
        continue
      }
      console.log(`Offline transformace commitnutého exportu ${soubor}…`)
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (alpine_hut + wilderness_hut + hut, ${iso} ∩ bbox Krkonoš); instance: ${instance.join(', ')}…`)
      const vysledek = await stahniOverpass(instance, overpassDotaz(iso))
      raw = vysledek.raw
      console.log(`Staženo z ${vysledek.api}.`)
      mkdirSync(KANDIDATI_ADRESAR, { recursive: true })
      writeFileSync(soubor, raw, 'utf8')
      console.log(`Surový export uložen: ${soubor} (commituje se jako doklad).`)
    }
    const { elementy, checked } = nactiExport(raw)
    console.log(`Export ${zeme}: ${elementy.length} objektů, stav OSM dat ${checked}.`)
    stavy.push(`${zeme} ${checked}`)
    polozky.push(...elementy.map((el) => ({ el, zeme, checked })))
  }
  if (polozky.length === 0 && zJsonu) {
    throw new Error('--z-jsonu: žádný commitnutý export nenalezen — nejdřív ho stáhne workflow/běh bez --z-jsonu.')
  }

  const report = zapisKandidaty(polozky, KANDIDATI_ADRESAR, RUCNI_ADRESAR)

  console.log(`\n## DATA-01 report (stav OSM dat: ${stavy.join(', ')})`)
  console.log(`\nNoví kandidáti: ${report.zapsano.length}`)
  for (const ch of report.zapsano) console.log(`- ${ch.nazev} (\`${ch.slug}.yaml\`) — ${ch.url}`)
  console.log(`\nUž kandidátem z dřívějška (nepřepsáno): ${report.jizKandidat.length}`)
  for (const ch of report.jizKandidat) console.log(`- ${ch.slug} — ${ch.url}`)
  console.log(`\nRučně kurátorované profily (nedotčeny — jen porovnání s OSM): ${report.rucni.length}`)
  for (const p of report.rucni) {
    const gps = p.gpsRozdilM != null ? `GPS rozdíl ${p.gpsRozdilM} m` : 'GPS v ručním profilu chybí'
    const vyska =
      p.vyskaOsm != null && p.vyskaRucni != null
        ? `výška OSM ${p.vyskaOsm} m vs. ruční ${p.vyskaRucni} m`
        : `výška OSM ${p.vyskaOsm ?? '—'} / ruční ${p.vyskaRucni ?? '—'}`
    console.log(`- ${p.slug}: ${gps}; ${vyska}${p.nazevOsm !== p.nazevRucni ? `; název OSM „${p.nazevOsm}" vs. „${p.nazevRucni}"` : ''} — ${p.url}`)
  }
  console.log(`\nPřeskočeno — neúplné v OSM (k ruční kontrole): ${report.preskoceno.length}`)
  for (const p of report.preskoceno) console.log(`- ${p.url} (${p.duvod === 'bez-nazvu' ? 'chybí name' : 'chybí souřadnice'})`)
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('data01-overpass-krkonose.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
