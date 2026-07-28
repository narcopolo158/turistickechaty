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
 * ROZHLEDNY (rozhodnutí Michala 28. 7. 2026): druhý dotaz sbírá rozhledny
 * (`tower:type=observation`) a k nim občerstvení v okolí. Kandidátem se stane
 * jen rozhledna s DOLOŽENÝM občerstvením (restaurace, bufet, kavárna…) —
 * volně přístupná věž bez občerstvení do průvodce nepatří a zůstane jen
 * v reportu. Když je tím občerstvením chata, která už kandidátem je,
 * rozhledna se zvlášť nezakládá (byl by to druhý objekt na témž místě) —
 * dvojici posoudí redakce. Doklad (objekt, tag, vzdálenost) jde do
 * `interniPoznamky` kandidáta, ať je co ověřovat.
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

import { bboxStr, oblastZArgv, type OblastKonfig } from './oblasti'

// Slug generujeme stejně jako Payload hook — jeden zdroj pravdy.
import { slugify } from '../src/fields/slug'

/**
 * Veřejné instance Overpass — zkoušejí se po řadě (hlavní instance
 * overpass-api.de sdílené IP GitHub Actions runnerů často rate-limituje,
 * kumi.systems bývá benevolentnější). `--api URL` fallback vypíná a vynutí
 * jedinou instanci.
 *
 * Do seznamu smí JEN instance s celosvětovými daty. Regionální zrcadla
 * (overpass.osm.ch = jen Švýcarsko, atownsend.org.uk = Britské ostrovy…) by
 * na náš dotaz odpověděla HTTP 200 a prázdným seznamem — tedy tiše prázdným
 * exportem, což je horší než pád. Proto se u nich drží zdroj:
 * wiki.openstreetmap.org/wiki/Overpass_API, oddíl veřejných instancí,
 * kontrolováno 28. 7. 2026 (private.coffee je tam vedená jako „global data
 * coverage"). Prázdnou odpověď navíc `stahniZInstance` bere jako selhání
 * instance — viz `povolitPrazdno`.
 */
export const VYCHOZI_API_INSTANCE = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Adresáře i dotaz se odvozují z konfigurace oblasti (scripts/oblasti.ts) —
// nové pohoří se přidává tam, ne kopií tohohle skriptu.
const kandidatiAdresar = (oblast: string) => join(process.cwd(), 'data', 'kandidati', oblast)
const rucniAdresar = (oblast: string) => join(process.cwd(), 'data', 'chaty', oblast)
const VYRAZENO_SOUBOR = join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml')

/**
 * Vyřazené OSM objekty (redakční rozhodnutí v `data/kandidati/_vyrazeno.yaml`):
 * duplicity v OSM a objekty mimo Krkonoše přesunuté do jiných oblastí. Bez
 * tohoto seznamu by je další běh exportu znovu založil v krkonose/ — objekty
 * v OSM dál existují a bbox je dál chytá. Klíč = URL objektu v OSM (stabilní
 * identita nezávislá na slugu). Chybějící soubor = prázdný seznam.
 */
export const nactiVyrazene = (soubor: string = VYRAZENO_SOUBOR): Map<string, string> => {
  if (!existsSync(soubor)) return new Map()
  const data = parse(readFileSync(soubor, 'utf8')) as {
    vyrazeno?: { osm?: string; duvod?: string }[]
  } | null
  const mapa = new Map<string, string>()
  for (const z of data?.vyrazeno ?? []) {
    if (z.osm) mapa.set(z.osm, z.duvod ?? 'bez udaného důvodu')
  }
  return mapa
}

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
export const overpassDotaz = (iso: string, okno: string = BBOX_KRKONOSE): string => `[out:json][timeout:120];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
  nwr["tourism"="alpine_hut"](area.stat)(${okno});
  nwr["tourism"="wilderness_hut"](area.stat)(${okno});
  nwr["tourism"="hut"](area.stat)(${okno});
);
out center;`

/**
 * ROZHLEDNY (rozhodnutí Michala 28. 7. 2026): „v Jizerkách je hodně rozhleden,
 * většina jich má občerstvení nebo restauraci nebo je její součástí chata —
 * všechny takové bych určitě zahrnul. Samotné rozhledny (volně přístupné bez
 * občerstvení) nebereme."
 *
 * Občerstvení u rozhledny OSM skoro nikdy netagguje na věži samotné — bufet
 * bývá vedle jako vlastní objekt. Dotaz proto vybere rozhledny do množiny
 * `.rozhledny` a k nim přibalí objekty s občerstvením v okolí; spárování
 * a rozhodnutí „bereme / nebereme" dělá skript nad odpovědí (`parujRozhledny`),
 * ne dotaz — ať je v surovém exportu vidět i to, co jsme NEvzali.
 *
 * `tower:type=observation` je společný jmenovatel obou obvyklých zápisů
 * (`man_made=tower` i `building=tower`), proto se selektuje jím.
 */
export const OKOLI_OBCERSTVENI_M = 100

export const overpassDotazRozhledny = (iso: string, okno: string = BBOX_KRKONOSE): string => `[out:json][timeout:180];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
nwr["tower:type"="observation"](area.stat)(${okno})->.rozhledny;
(
  .rozhledny;
  nwr(around.rozhledny:${OKOLI_OBCERSTVENI_M})["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten)$"];
  nwr(around.rozhledny:${OKOLI_OBCERSTVENI_M})["tourism"~"^(alpine_hut|wilderness_hut|hut|chalet)$"];
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
const stahniZInstance = async (api: string, dotaz: string, povolitPrazdno = false): Promise<string> => {
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
  const { elementy } = nactiExport(text) // validace už při stažení — vadný export se neukládá
  // Prázdno není výsledek, ale podezření: instance s regionálními daty odpoví
  // na dotaz mimo svůj výřez HTTP 200 a `elements: []`. Bez téhle pojistky by
  // se takový export uložil a běh by hlásil „0 nových kandidátů" jako úspěch.
  if (!elementy.length && !povolitPrazdno) {
    throw new Error('0 objektů — instance nejspíš nemá celosvětová data (nebo dotaz minul); prázdno vynutíš přepínačem --povolit-prazdno')
  }
  return text
}

export type StahniVolby = {
  /** Kolik kol se seznam instancí projde (výchozí 3). */
  kola?: number
  /** Pauzy mezi koly v ms; poslední hodnota platí i pro další kola. */
  pauzy?: number[]
  /** Vstřik spánku (testy si ho nahradí, aby nečekaly). */
  spanek?: (ms: number) => Promise<void>
  /** Prázdná odpověď je legitimní výsledek, ne selhání instance. */
  povolitPrazdno?: boolean
}

const VYCHOZI_PAUZY = [30_000, 90_000]
const usni = (ms: number) => new Promise<void>((hotovo) => setTimeout(hotovo, ms))

/**
 * Zkouší instance po řadě, dokud jedna nevrátí validní export — rate limit
 * či výpadek jedné veřejné instance běh neshodí. Selžou-li všechny, počká
 * a projde je ZNOVU: HTTP 504 z Overpassu znamená „teď mám nával", ne „tvůj
 * dotaz je špatně", a po půl minutě zpravidla projde (28. 7. 2026 spadl běh
 * DATA-01 pro Jizerské hory právě takhle — obě tehdejší instance vrátily 504
 * ve stejné vteřině a jediný pokus na instanci znamenal konec).
 * Selžou-li všechna kola, chyba nese souhrn všech pokusů (do anotace Actions).
 */
export const stahniOverpass = async (
  instance: string[],
  dotaz: string,
  volby: StahniVolby = {},
): Promise<{ raw: string; api: string }> => {
  const kola = Math.max(1, volby.kola ?? 3)
  const pauzy = volby.pauzy ?? VYCHOZI_PAUZY
  const spanek = volby.spanek ?? usni
  const chyby: string[] = []

  for (let kolo = 1; kolo <= kola; kolo++) {
    for (const api of instance) {
      try {
        return { raw: await stahniZInstance(api, dotaz, volby.povolitPrazdno), api }
      } catch (chyba) {
        const zprava = chyba instanceof Error ? chyba.message : String(chyba)
        chyby.push(`${api} (kolo ${kolo}/${kola}): ${zprava}`)
        console.error(`Instance selhala — ${api} (kolo ${kolo}/${kola}): ${zprava}`)
      }
    }
    if (kolo < kola) {
      const pauza = pauzy[Math.min(kolo - 1, pauzy.length - 1)] ?? 0
      console.error(`Všechny instance v kole ${kolo} selhaly — čekám ${Math.round(pauza / 1000)} s a zkusím znovu.`)
      await spanek(pauza)
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

export const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

/** Souřadnice: node je nese přímo, way/relation dává Overpass přes `out center`. */
export const souradnice = (el: OsmElement): { lat: number; lng: number } | null => {
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
  volby: { oblast?: string; obcerstveni?: ObcerstveniUObjektu[] } = {},
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
    oblast: volby.oblast ?? 'krkonose',
    // `stav` vědomě chybí: OSM provoz spolehlivě nenese, nedomýšlíme.
  }
  // Typ jen z jednoznačného tagu; nestandardní `hut` nechává typ redakci.
  if (tagy.tourism === 'alpine_hut') data.typ = 'obsluhovana'
  if (tagy.tourism === 'wilderness_hut') data.typ = 'utulna'
  // Rozhledna se sem dostane jen s doloženým občerstvením (viz parujRozhledny),
  // takže typ je jednoznačný — číselník ho od 28. 7. 2026 zná.
  if (jeRozhledna(el)) data.typ = 'rozhledna'

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
    jeRozhledna(el)
      ? 'ROZHLEDNA S OBČERSTVENÍM (rozhodnutí Michala 28. 7. 2026: rozhledny bereme jen s občerstvením/restaurací nebo s chatou) — typ `rozhledna`.'
      : tagy.tourism === 'hut'
        ? 'OSM tag tourism=hut je nestandardní — typ nevyplněn, určí redakce.'
        : `Typ odvozen z OSM tagu tourism=${tagy.tourism} (alpine_hut = obsluhovaná, wilderness_hut = útulna).`,
    // Doklad občerstvení: konkrétní OSM objekty a vzdálenosti, ať je co ověřit.
    // Bez dokladu se rozhledna kandidátem vůbec nestane (viz parujRozhledny).
    ...(volby.obcerstveni?.length
      ? [
          `Doklad občerstvení (OSM, ${OKOLI_OBCERSTVENI_M} m okolí): ${volby.obcerstveni
            .map((o) => `${o.nazev ?? '(bez názvu)'} — ${o.znacka}, ${o.vzdalenostM} m, ${o.url}`)
            .join(' · ')}`,
        ]
      : []),
    ...(tagy.height ? [`Výška věže dle OSM: ${tagy.height} m`] : []),
    ...(tagy.operator ? [`Provozovatel dle OSM: ${tagy.operator}`] : []),
    ...(tagy.opening_hours ? [`Otvírací doba dle OSM (surový formát, neověřeno): ${tagy.opening_hours}`] : []),
    ...(tagy.note ? [`Poznámka z OSM: ${tagy.note}`] : []),
  ]
  data.interniPoznamky = poznamky.join('\n')

  return { data }
}

// ── Porovnání s ručně kurátorovaným profilem ────────────────────────────────

// ── rozhledny s občerstvením ────────────────────────────────────────────────

const OBCERSTVENI_AMENITY = new Set(['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'biergarten'])
const CHATA_TOURISM = new Set(['alpine_hut', 'wilderness_hut', 'hut', 'chalet'])

export type ObcerstveniUObjektu = {
  url: string
  nazev: string | null
  znacka: string
  vzdalenostM: number
  /** Občerstvení je samo chata (pak rozhledna nejspíš patří k ní, ne naopak). */
  jeChata: boolean
}
export type Rozhledna = { el: OsmElement; obcerstveni: ObcerstveniUObjektu[] }

/**
 * Nejnižší doložená výška, při které objekt ještě bereme jako rozhlednu.
 * První ostrý běh v Jizerských horách (28. 7. 2026) přinesl mezi devíti nálezy
 * i „vyhlídku na Harrachov" s `height=5` — pětimetrová plošina u skokanských
 * můstků není rozhledna a v průvodci nemá co dělat. Filtr sahá JEN na objekty,
 * které výšku doloženou mají: co OSM neuvádí, se nedomýšlí a jde k posouzení.
 */
export const MIN_VYSKA_ROZHLEDNY_M = 8

/** Doložená výška věže z tagu `height` (jen číslo v metrech), jinak null. */
export const vyskaVeze = (el: OsmElement): number | null => {
  const h = Number.parseFloat((el.tags?.height ?? '').replace(',', '.'))
  return Number.isFinite(h) && h > 0 ? h : null
}

export const jeRozhledna = (el: OsmElement): boolean => el.tags?.['tower:type'] === 'observation'

/** Rozhledna, jejíž doložená výška je pod prahem — vyhlídková plošina, ne věž. */
export const jePrilisNizka = (el: OsmElement): boolean => {
  const v = vyskaVeze(el)
  return v != null && v < MIN_VYSKA_ROZHLEDNY_M
}

/** Doklad občerstvení z tagů objektu — `null`, když objekt občerstvení nenese. */
export const znackaObcerstveni = (el: OsmElement): { znacka: string; jeChata: boolean } | null => {
  const t = el.tags ?? {}
  if (t.amenity && OBCERSTVENI_AMENITY.has(t.amenity)) return { znacka: `amenity=${t.amenity}`, jeChata: false }
  if (t.tourism && CHATA_TOURISM.has(t.tourism)) return { znacka: `tourism=${t.tourism}`, jeChata: true }
  return null
}

/**
 * Ke každé rozhledně z odpovědi najde objekty s občerstvením do `limitM`.
 * Rozhledna, která občerstvení nese sama (bufet zatagovaný přímo na věži),
 * dostane doklad se vzdáleností 0. Prázdný seznam = rozhledna, kterou dle
 * rozhodnutí Michala NEBEREME — ale zůstane v reportu, ať je vidět, co se
 * zahodilo a proč.
 */
export const parujRozhledny = (elementy: OsmElement[], limitM: number = OKOLI_OBCERSTVENI_M): Rozhledna[] => {
  const rozhledny = elementy.filter(jeRozhledna)
  const zdroje = elementy.filter((el) => !jeRozhledna(el) && znackaObcerstveni(el))
  return rozhledny.map((el) => {
    const gps = souradnice(el)
    const obcerstveni: ObcerstveniUObjektu[] = []
    const vlastni = znackaObcerstveni(el)
    if (vlastni) {
      obcerstveni.push({ url: osmUrl(el), nazev: el.tags?.name ?? null, znacka: vlastni.znacka, vzdalenostM: 0, jeChata: vlastni.jeChata })
    }
    if (gps) {
      for (const z of zdroje) {
        const zGps = souradnice(z)
        if (!zGps) continue
        const d = vzdalenostM(gps.lat, gps.lng, zGps.lat, zGps.lng)
        if (d > limitM) continue
        const zn = znackaObcerstveni(z)!
        obcerstveni.push({ url: osmUrl(z), nazev: z.tags?.name ?? null, znacka: zn.znacka, vzdalenostM: d, jeChata: zn.jeChata })
      }
    }
    obcerstveni.sort((a, b) => a.vzdalenostM - b.vzdalenostM || a.url.localeCompare(b.url))
    return { el, obcerstveni }
  })
}

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
    `# (data/chaty/${data.oblast ?? 'krkonose'}/) povyšovat až po křížovém ověření (DATA-03). Stav`,
    '# provozu OSM nenese, proto tu není. Nic nedomýšlet!',
    '',
    stringify(data),
  ].join('\n')

export type Report = {
  zapsano: { slug: string; nazev: string; url: string }[]
  jizKandidat: { slug: string; url: string }[]
  rucni: Porovnani[]
  preskoceno: Preskoceni[]
  vyrazeno: { url: string; duvod: string }[]
}

/** Element s metadaty svého exportu (země dle area v dotazu, checked dle stavu dat). */
export type ExportPolozka = { el: OsmElement; zeme: Zeme; checked: string; obcerstveni?: ObcerstveniUObjektu[] }

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
  vyrazene: Map<string, string> = new Map(),
  // Oblast se zapisuje do YAML kandidáta. Výchozí „krkonose" drží zpětnou
  // kompatibilitu; běh pro jinou oblast ji předává z konfigurace (28. 7. 2026
  // právě tenhle hardcode poslal sedm jizerskohorských kandidátů do Krkonoš).
  oblast: string = 'krkonose',
): Report => {
  const report: Report = { zapsano: [], jizKandidat: [], rucni: [], preskoceno: [], vyrazeno: [] }
  const slugyBehu = new Set<string>()
  mkdirSync(kandidatiAdresar, { recursive: true })

  // Deterministické pořadí výstupu nezávislé na pořadí z API.
  const serazene = [...polozky].sort(
    (a, b) => (a.el.tags?.name ?? '').localeCompare(b.el.tags?.name ?? '', 'cs') || a.el.id - b.el.id,
  )

  for (const { el, zeme, checked, obcerstveni } of serazene) {
    // Redakčně vyřazené objekty (duplicity, mimo pohoří) se znovu nezakládají.
    const duvodVyrazeni = vyrazene.get(osmUrl(el))
    if (duvodVyrazeni !== undefined) {
      report.vyrazeno.push({ url: osmUrl(el), duvod: duvodVyrazeni })
      continue
    }
    const vysledek = chataZElementu(el, checked, zeme, { oblast, obcerstveni })
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
  // Prázdný výsledek je ve výchozím stavu selhání instance (viz stahniZInstance).
  // Přepínač je pro případ, kdy víme, že v okně opravdu nic není.
  const povolitPrazdno = argv.includes('--povolit-prazdno')

  const oblast: OblastKonfig = oblastZArgv(argv)
  // Země dotazu bere konfigurace oblasti (přeshraniční pohoří „vcelku").
  const kandAdr = kandidatiAdresar(oblast.slug)
  const rucAdr = rucniAdresar(oblast.slug)
  const okno = bboxStr(oblast.bbox)
  console.log(`Oblast: ${oblast.nazev} (${oblast.slug}) — okno dotazu ${okno}`)

  const polozky: ExportPolozka[] = []
  const stavy: string[] = []
  for (const { zeme, iso } of ZEME_DOTAZU) {
    const soubor = join(kandAdr, `_overpass-export-${zeme}.json`)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export ${soubor} neexistuje — země ${zeme} se přeskakuje (stáhne ji běh bez --z-jsonu).`)
        continue
      }
      console.log(`Offline transformace commitnutého exportu ${soubor}…`)
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (alpine_hut + wilderness_hut + hut, ${iso} ∩ okno ${oblast.nazev}); instance: ${instance.join(', ')}…`)
      const vysledek = await stahniOverpass(instance, overpassDotaz(iso, okno), { povolitPrazdno })
      raw = vysledek.raw
      console.log(`Staženo z ${vysledek.api}.`)
      mkdirSync(kandAdr, { recursive: true })
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

  // ── rozhledny (jen s doloženým občerstvením) ──────────────────────────────
  // URL chat z hlavního exportu: rozhledna, u které je občerstvením PRÁVĚ
  // takováto chata, se nezakládá zvlášť — byl by to druhý objekt na témž
  // místě. Do reportu jde jako dvojice a redakce rozhodne, co je hlavní.
  const urlChat = new Set(polozky.map((p) => osmUrl(p.el)))
  const rozhlednyVzate: { nazev: string; url: string; doklad: string }[] = []
  const rozhlednyUChaty: { nazev: string; url: string; chata: string }[] = []
  const rozhlednyBezObcerstveni: { nazev: string; url: string }[] = []
  const rozhlednyNizke: { nazev: string; url: string; vyska: number }[] = []

  for (const { zeme, iso } of ZEME_DOTAZU) {
    const soubor = join(kandAdr, `_overpass-rozhledny-${zeme}.json`)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export rozhleden ${soubor} neexistuje — země ${zeme} se přeskakuje.`)
        continue
      }
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (rozhledny tower:type=observation + občerstvení do ${OKOLI_OBCERSTVENI_M} m)…`)
      // Oblast bez jediné rozhledny je legitimní stav, prázdno tu neplaší.
      const vysledek = await stahniOverpass(instance, overpassDotazRozhledny(iso, okno), { povolitPrazdno: true })
      raw = vysledek.raw
      mkdirSync(kandAdr, { recursive: true })
      writeFileSync(soubor, raw, 'utf8')
      console.log(`Surový export rozhleden uložen: ${soubor}.`)
    }
    const { elementy, checked } = nactiExport(raw)
    for (const r of parujRozhledny(elementy)) {
      const nazev = r.el.tags?.name ?? '(bez názvu)'
      // Doložená výška pod prahem = vyhlídková plošina, ne rozhledna.
      if (jePrilisNizka(r.el)) {
        rozhlednyNizke.push({ nazev, url: osmUrl(r.el), vyska: vyskaVeze(r.el)! })
        continue
      }
      if (!r.obcerstveni.length) {
        rozhlednyBezObcerstveni.push({ nazev, url: osmUrl(r.el) })
        continue
      }
      const chataVedle = r.obcerstveni.find((o) => o.jeChata && urlChat.has(o.url))
      if (chataVedle) {
        rozhlednyUChaty.push({ nazev, url: osmUrl(r.el), chata: `${chataVedle.nazev ?? '(bez názvu)'} (${chataVedle.vzdalenostM} m, ${chataVedle.url})` })
        continue
      }
      polozky.push({ el: r.el, zeme, checked, obcerstveni: r.obcerstveni })
      rozhlednyVzate.push({
        nazev,
        url: osmUrl(r.el),
        doklad: r.obcerstveni.map((o) => `${o.nazev ?? '(bez názvu)'} — ${o.znacka}, ${o.vzdalenostM} m`).join(' · '),
      })
    }
  }

  const report = zapisKandidaty(polozky, kandAdr, rucAdr, nactiVyrazene(), oblast.slug)

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
  console.log(`\nVyřazeno redakcí (data/kandidati/_vyrazeno.yaml — nezakládá se): ${report.vyrazeno.length}`)
  for (const v of report.vyrazeno) console.log(`- ${v.url} — ${v.duvod}`)

  console.log(`\n### Rozhledny (bereme jen s doloženým občerstvením — rozhodnutí Michala 28. 7. 2026)`)
  console.log(`\nVzaté jako kandidáti: ${rozhlednyVzate.length}`)
  for (const r of rozhlednyVzate) console.log(`- ${r.nazev} — doklad: ${r.doklad} — ${r.url}`)
  console.log(`\nU chaty, která už kandidátem je (dvojici posoudí redakce, zvlášť se nezakládá): ${rozhlednyUChaty.length}`)
  for (const r of rozhlednyUChaty) console.log(`- ${r.nazev} × ${r.chata} — ${r.url}`)
  console.log(`\nBez doloženého občerstvení (NEBEREME): ${rozhlednyBezObcerstveni.length}`)
  for (const r of rozhlednyBezObcerstveni) console.log(`- ${r.nazev} — ${r.url}`)
  console.log(`\nPod prahem výšky ${MIN_VYSKA_ROZHLEDNY_M} m — vyhlídková plošina, ne rozhledna (NEBEREME): ${rozhlednyNizke.length}`)
  for (const r of rozhlednyNizke) console.log(`- ${r.nazev} (${r.vyska} m) — ${r.url}`)
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('data01-overpass-krkonose.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
