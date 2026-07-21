/**
 * DATA-02: fotky chat z Wikimedia Commons — kandidátní METADATA.
 *
 * Pro každou chatu s GPS (ruční profily v `data/chaty/**` i OSM kandidáty
 * v `data/kandidati/<oblast>/`) položí na Commons API tři dotazy:
 *   1. geosearch — soubory (namespace 6) v okruhu kolem GPS chaty,
 *   2. kategorie — soubory v `Category:<název chaty>` (pokud existuje),
 *   3. fulltext — hledání přesné fráze názvu chaty v namespace File
 *      (chytá pojmenované soubory BEZ geotagu, které geosearch mine —
 *      lekce z první dávky povyšování: Klínovka, Tetřevky, U Jirky a
 *      Lovecká měly 0 kandidátů, Špindlerovka jen záběry parkoviště).
 * Fulltext je z těch tří nejméně přesný (jiné objekty téhož jména!):
 * nález POUZE z fulltextu s geotagem dál než FULLTEXT_MAX_GEOTAG_M se
 * vyřazuje rovnou, negeotagované nálezy zůstávají kandidáty s původem
 * `fulltext` — jestli je na snímku právě tahle chata, rozhodne redakce
 * na stránce souboru.
 * Výsledek filtruje TVRDÝM licenčním sítem a zapisuje jen metadata do
 * `data/kandidati/fotky/<oblast>/<slug>.yaml` — SOUBORY SE NESTAHUJÍ,
 * výběr, stažení a nahrání do kolekce Fotky dělá redakce ručně.
 *
 * Licenční pravidla (CLAUDE.md + zadání DATA-02):
 *   - povoleno: CC0, CC BY, CC BY-SA (libovolná verze), public domain,
 *   - zakázáno: cokoli s NC nebo ND, nerozpoznané licence (→ report),
 *   - CC BY / CC BY-SA bez dohledatelného autora se vyřazuje (atribuce
 *     je podmínkou licence — bez autora ji nejde splnit),
 *   - u každé přijaté fotky: autor, licence, URL stránky souboru i originálu.
 *
 * Spuštění (sandbox denních sessions na Commons nedosáhne — ostrý běh dělá
 * GitHub Actions workflow „DATA-02: fotky chat z Wikimedia Commons"):
 *   npx tsx scripts/data02-commons-fotky.ts                # stáhne + transformuje
 *   npx tsx scripts/data02-commons-fotky.ts --radius 400   # širší okruh geosearch (m)
 *   npx tsx scripts/data02-commons-fotky.ts --z-jsonu      # offline: jen transformace commitnutého exportu
 *
 * Poctivost dat: skript nic nedomýšlí — zapisuje jen to, co Commons API
 * vrátí; `checked` = datum dotazu (Commons nemá snapshot timestamp).
 * Kandidátní YAML fotek jsou strojově generované a běh je PŘEPISUJE —
 * redakční výběr patří do YAML chaty, ne sem. Do `data/chaty/**` skript
 * nikdy nezapisuje.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse, stringify } from 'yaml'

// Haversine sdílený s DATA-01 (jeden zdroj pravdy; main tam hlídá guard).
import { vzdalenostM } from './data01-overpass-krkonose'

export const API_COMMONS = 'https://commons.wikimedia.org/w/api.php'
export const VYCHOZI_RADIUS_M = 300
/** Nález POUZE z fulltextu s geotagem dál než tohle = jiný objekt téhož jména. */
export const FULLTEXT_MAX_GEOTAG_M = 1000
const USER_AGENT = 'turistickechaty.cz (DATA-02 fotky; repo narcopolo158/turistickechaty)'

// Metadata, která si od Commons říkáme — licence, autorství, popis, datum.
const EXTMETADATA_POLE =
  'LicenseShortName|UsageTerms|LicenseUrl|Artist|Attribution|Credit|ImageDescription|DateTimeOriginal|Copyrighted'

// ── Seznam chat k dotazování ────────────────────────────────────────────────

export type ChataProDotaz = {
  slug: string
  nazev: string
  oblast: string
  lat: number
  lng: number
  profil: 'rucni' | 'kandidat'
}

const nactiYamlChaty = (
  cesta: string,
  oblast: string,
  profil: 'rucni' | 'kandidat',
): ChataProDotaz | null => {
  const data = parse(readFileSync(cesta, 'utf8')) as {
    slug?: string
    nazev?: string
    lat?: number
    lng?: number
  } | null
  if (!data?.slug || !data?.nazev || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
    return null
  }
  return { slug: data.slug, nazev: data.nazev, oblast, lat: data.lat, lng: data.lng, profil }
}

/**
 * Sesbírá chaty s GPS z `data/chaty/<oblast>/` a `data/kandidati/<oblast>/`
 * (adresář `fotky` v kandidátech patří tomuto skriptu, ne chatám — přeskakuje
 * se, stejně jako soubory `_*` a ne-YAML). Ruční profil má při shodě slugu
 * přednost před kandidátem.
 */
export const nactiChaty = (koren: string): { chaty: ChataProDotaz[]; preskoceno: string[] } => {
  const chaty = new Map<string, ChataProDotaz>()
  const preskoceno: string[] = []
  const zdroje: { adresar: string; profil: 'rucni' | 'kandidat' }[] = [
    { adresar: join(koren, 'data', 'chaty'), profil: 'rucni' },
    { adresar: join(koren, 'data', 'kandidati'), profil: 'kandidat' },
  ]
  for (const { adresar, profil } of zdroje) {
    if (!existsSync(adresar)) continue
    for (const oblast of readdirSync(adresar).sort()) {
      if (oblast === 'fotky') continue // výstup DATA-02, nejsou to chaty
      const oblastDir = join(adresar, oblast)
      if (!statSync(oblastDir).isDirectory()) continue
      for (const soubor of readdirSync(oblastDir).sort()) {
        if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
        const chata = nactiYamlChaty(join(oblastDir, soubor), oblast, profil)
        if (!chata) {
          preskoceno.push(`${oblast}/${soubor} (${profil}) — chybí slug/nazev/GPS`)
          continue
        }
        const klic = `${chata.oblast}/${chata.slug}`
        if (chaty.has(klic)) {
          if (profil === 'kandidat') continue // ruční profil už zapsán — má přednost
        }
        chaty.set(klic, chata)
      }
    }
  }
  return { chaty: [...chaty.values()], preskoceno }
}

// ── Dotazy na Commons API ───────────────────────────────────────────────────

const spolecneParametry = (): URLSearchParams =>
  new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo|coordinates',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '640',
    iiextmetadatafilter: EXTMETADATA_POLE,
    colimit: 'max',
  })

/** Soubory (namespace 6) v okruhu kolem GPS chaty. */
export const urlGeosearch = (api: string, chata: ChataProDotaz, radiusM: number): string => {
  const p = spolecneParametry()
  p.set('generator', 'geosearch')
  p.set('ggscoord', `${chata.lat}|${chata.lng}`)
  p.set('ggsradius', String(radiusM))
  p.set('ggslimit', '50')
  p.set('ggsnamespace', '6')
  return `${api}?${p.toString()}`
}

/** Soubory v kategorii pojmenované přesně po chatě (nemusí existovat). */
export const urlKategorie = (api: string, chata: ChataProDotaz): string => {
  const p = spolecneParametry()
  p.set('generator', 'categorymembers')
  p.set('gcmtitle', `Category:${chata.nazev}`)
  p.set('gcmtype', 'file')
  p.set('gcmlimit', '50')
  return `${api}?${p.toString()}`
}

/**
 * Fulltextové hledání přesné fráze názvu chaty v namespace File — chytá
 * soubory pojmenované/popsané po chatě, které nemají geotag (geosearch je
 * mine) ani nesedí v kategorii. Fráze v uvozovkách schválně: bez nich by
 * CirrusSearch rozložil „Lovecká chata" na slova a vrátil lovecké chaty
 * z celé republiky.
 */
export const urlFulltext = (api: string, chata: ChataProDotaz): string => {
  const p = spolecneParametry()
  p.set('generator', 'search')
  p.set('gsrsearch', `"${chata.nazev}"`)
  p.set('gsrnamespace', '6')
  p.set('gsrlimit', '30')
  return `${api}?${p.toString()}`
}

/**
 * Doba čekání před dalším pokusem: exponenciální backoff (základ × 2^pokus,
 * strop 150 s) — a když server pošle `Retry-After` (Wikimedia ho u 429
 * posílá), respektuje se ta delší z obou hodnot.
 */
export const dobaCekaniMs = (
  cisloPokusu: number,
  zakladMs: number,
  retryAfterSekundy?: string | null,
): number => {
  const backoff = Math.min(zakladMs * 2 ** (cisloPokusu - 1), 150_000)
  const zHlavicky = Number(retryAfterSekundy)
  return Number.isFinite(zHlavicky) && zHlavicky > 0 ? Math.max(backoff, zHlavicky * 1000) : backoff
}

/**
 * GET s identifikačním User-Agentem. Na 429/5xx čeká a opakuje (výchozí
 * 3 opakování, backoff 30 → 60 → 120 s + respekt k Retry-After) — první
 * ostrý běh ukázal, že Commons limituje sdílené IP Actions runnerů po
 * dávkách ~10 dotazů a jeden pokus s pevnou pauzou nestačí.
 */
export const stahniJson = async (
  url: string,
  moznosti: { pokusy?: number; pauzaMs?: number } = {},
): Promise<unknown> => {
  const { pokusy = 4, pauzaMs = 30_000 } = moznosti
  let posledniStatus = 0
  for (let cisloPokusu = 1; cisloPokusu <= pokusy; cisloPokusu++) {
    const odpoved = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (odpoved.ok) {
      try {
        return await odpoved.json()
      } catch {
        throw new Error('Commons API nevrátilo validní JSON.')
      }
    }
    posledniStatus = odpoved.status
    const opakovatelna = odpoved.status === 429 || odpoved.status >= 500
    if (!opakovatelna || cisloPokusu === pokusy) break
    const cekani = dobaCekaniMs(cisloPokusu, pauzaMs, odpoved.headers.get('retry-after'))
    console.log(
      `HTTP ${odpoved.status} — čekám ${Math.round(cekani / 1000)} s (pokus ${cisloPokusu + 1}/${pokusy})…`,
    )
    await new Promise((done) => setTimeout(done, cekani))
  }
  const napoveda = posledniStatus === 429 ? ' (příliš dotazů — Commons žádá zpomalit)' : ''
  throw new Error(`Commons API vrátilo HTTP ${posledniStatus}${napoveda}.`)
}

// ── Odpověď API ─────────────────────────────────────────────────────────────

type ExtHodnota = { value?: unknown }
type ExtMetadata = Partial<
  Record<
    | 'LicenseShortName'
    | 'UsageTerms'
    | 'LicenseUrl'
    | 'Artist'
    | 'Attribution'
    | 'Credit'
    | 'ImageDescription'
    | 'DateTimeOriginal'
    | 'Copyrighted',
    ExtHodnota
  >
>
export type CommonsStranka = {
  title?: string
  coordinates?: { lat?: number; lon?: number }[]
  imageinfo?: {
    url?: string
    descriptionurl?: string
    thumburl?: string
    width?: number
    height?: number
    extmetadata?: ExtMetadata
  }[]
}

export type DruhNalezu = 'geosearch' | 'kategorie' | 'fulltext'

/** Stránky z odpovědi (formatversion=2); `error` v odpovědi = prázdný výsledek
 *  jen u neexistující/neplatné kategorie, jinak tvrdá chyba. */
export const strankyZOdpovedi = (json: unknown, druh: DruhNalezu): CommonsStranka[] => {
  const telo = json as {
    error?: { code?: string; info?: string }
    query?: { pages?: CommonsStranka[] }
  } | null
  if (telo?.error) {
    const kod = telo.error.code ?? ''
    // Kategorie po chatě existovat nemusí — to není chyba běhu.
    if (druh === 'kategorie' && /invalidcategory|invalidtitle|missingtitle/.test(kod)) return []
    throw new Error(`Commons API chyba (${druh}): ${kod} ${telo.error.info ?? ''}`.trim())
  }
  return telo?.query?.pages ?? []
}

// ── Licenční síto a čištění metadat ─────────────────────────────────────────

/** Z HTML metadat Commons udělá čistý text (tagy pryč, entity, bílé znaky). */
export const cistyText = (hodnota: unknown, max = 300): string => {
  if (hodnota == null) return ''
  const text = String(hodnota)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export type Licence =
  | { ok: true; licence: string; licenceUrl?: string; vyzadujeAutora: boolean }
  | { ok: false; duvod: string }

/**
 * Tvrdé licenční síto: povoleno jen CC0 / CC BY / CC BY-SA / public domain.
 * NC, ND a nerozpoznané licence se vyřazují — nerozpoznaná ≠ volná.
 */
export const posudLicenci = (meta: ExtMetadata | undefined): Licence => {
  const shortName = cistyText(meta?.LicenseShortName?.value, 80)
  const usage = cistyText(meta?.UsageTerms?.value, 160)
  const licenceUrl = cistyText(meta?.LicenseUrl?.value, 200) || undefined

  if (/\b(NC|ND)\b|NonCommercial|NoDeriv/i.test(`${shortName} ${usage}`)) {
    return { ok: false, duvod: `licence „${shortName || usage}" zakazuje komerční užití nebo úpravy (NC/ND)` }
  }
  if (/^CC BY(-SA)?\b/i.test(shortName)) {
    return { ok: true, licence: shortName, licenceUrl, vyzadujeAutora: true }
  }
  if (/^CC0\b/i.test(shortName)) {
    return { ok: true, licence: shortName, licenceUrl, vyzadujeAutora: false }
  }
  if (/public domain/i.test(shortName) || /^PD\b/i.test(shortName) || meta?.Copyrighted?.value === 'False') {
    return { ok: true, licence: shortName || 'Public domain', licenceUrl, vyzadujeAutora: false }
  }
  return { ok: false, duvod: `nerozpoznaná licence „${shortName || '—'}" — ručně posoudit` }
}

// ── Zpracování stránek na kandidáty ─────────────────────────────────────────

export type FotkaKandidat = {
  soubor: string
  autor: string
  licence: string
  licenceUrl?: string
  stranka: string
  original: string
  nahled?: string
  rozmery?: string
  /** Vzdálenost geotagu fotky od GPS chaty (m) — jen u geotagovaných. */
  vzdalenostM?: number
  datum?: string
  popis?: string
  /** Původ nálezu: zdroje v kanonickém pořadí, např. „geosearch + fulltext". */
  nalezeno: string
}
export type OdmitnutaFotka = { soubor: string; duvod: string }

const fotkaZeStranky = (
  chata: ChataProDotaz,
  stranka: CommonsStranka,
  nalezeno: FotkaKandidat['nalezeno'],
): FotkaKandidat | OdmitnutaFotka | null => {
  const soubor = stranka.title ?? ''
  const info = stranka.imageinfo?.[0]
  if (!soubor || !info?.url || !info.descriptionurl) return null // bez URL není co nabídnout

  const licence = posudLicenci(info.extmetadata)
  if (!licence.ok) return { soubor, duvod: licence.duvod }

  const meta = info.extmetadata
  const autor =
    cistyText(meta?.Artist?.value) || cistyText(meta?.Attribution?.value) || cistyText(meta?.Credit?.value)
  if (!autor && licence.vyzadujeAutora) {
    return { soubor, duvod: `licence ${licence.licence} vyžaduje atribuci, ale autor není v metadatech dohledatelný` }
  }

  const fotka: FotkaKandidat = {
    soubor,
    autor: autor || 'neuveden (CC0/PD atribuci nevyžaduje)',
    licence: licence.licence,
    stranka: info.descriptionurl,
    original: info.url,
    nalezeno,
  }
  if (licence.licenceUrl) fotka.licenceUrl = licence.licenceUrl
  if (info.thumburl) fotka.nahled = info.thumburl
  if (info.width && info.height) fotka.rozmery = `${info.width}×${info.height}`
  const geotag = stranka.coordinates?.[0]
  if (typeof geotag?.lat === 'number' && typeof geotag?.lon === 'number') {
    fotka.vzdalenostM = vzdalenostM(geotag.lat, geotag.lon, chata.lat, chata.lng)
  }
  const datum = cistyText(meta?.DateTimeOriginal?.value, 40)
  if (datum) fotka.datum = datum
  const popis = cistyText(meta?.ImageDescription?.value, 240)
  if (popis) fotka.popis = popis
  return fotka
}

/** Kanonické pořadí zdrojů v poli `nalezeno` (přesnější zdroje první). */
const PORADI_DRUHU: DruhNalezu[] = ['geosearch', 'kategorie', 'fulltext']

/**
 * Sloučí geosearch + kategorii + fulltext (dedup podle názvu souboru), prožene
 * licenčním sítem a deterministicky seřadí: geotagované dle vzdálenosti od
 * chaty, pak abecedně. Nález POUZE z fulltextu s geotagem dál než
 * FULLTEXT_MAX_GEOTAG_M se vyřazuje (jiný objekt téhož jména — např.
 * „Lovecká chata" kdekoli v ČR). Vyřazené jdou do reportu — do YAML
 * kandidátů nepatří. `fulltextJson` je volitelný kvůli starším exportům
 * bez fulltext dotazu (offline --z-jsonu je zpracuje beze změny).
 */
export const zpracujOdpovedi = (
  chata: ChataProDotaz,
  geosearchJson: unknown,
  kategorieJson: unknown,
  fulltextJson?: unknown,
): { fotky: FotkaKandidat[]; odmitnuto: OdmitnutaFotka[] } => {
  const zdroje: { stranky: CommonsStranka[]; druh: DruhNalezu }[] = [
    { stranky: strankyZOdpovedi(geosearchJson, 'geosearch'), druh: 'geosearch' },
    { stranky: strankyZOdpovedi(kategorieJson, 'kategorie'), druh: 'kategorie' },
  ]
  if (fulltextJson !== undefined) {
    zdroje.push({ stranky: strankyZOdpovedi(fulltextJson, 'fulltext'), druh: 'fulltext' })
  }
  const podleSouboru = new Map<string, { stranka: CommonsStranka; druhy: Set<DruhNalezu> }>()
  for (const { stranky, druh } of zdroje) {
    for (const stranka of stranky) {
      if (!stranka.title) continue
      const drive = podleSouboru.get(stranka.title)
      if (drive) drive.druhy.add(druh)
      else podleSouboru.set(stranka.title, { stranka, druhy: new Set([druh]) })
    }
  }

  const fotky: FotkaKandidat[] = []
  const odmitnuto: OdmitnutaFotka[] = []
  for (const { stranka, druhy } of podleSouboru.values()) {
    const nalezeno = PORADI_DRUHU.filter((d) => druhy.has(d)).join(' + ')
    const vysledek = fotkaZeStranky(chata, stranka, nalezeno)
    if (!vysledek) continue
    if ('duvod' in vysledek) {
      odmitnuto.push(vysledek)
      continue
    }
    const jenFulltext = druhy.size === 1 && druhy.has('fulltext')
    if (jenFulltext && vysledek.vzdalenostM !== undefined && vysledek.vzdalenostM > FULLTEXT_MAX_GEOTAG_M) {
      odmitnuto.push({
        soubor: vysledek.soubor,
        duvod: `fulltext nález s geotagem ${Math.round(vysledek.vzdalenostM)} m od chaty — pravděpodobně jiný objekt téhož jména`,
      })
      continue
    }
    fotky.push(vysledek)
  }
  const cs = new Intl.Collator('cs')
  fotky.sort(
    (a, b) => (a.vzdalenostM ?? Infinity) - (b.vzdalenostM ?? Infinity) || cs.compare(a.soubor, b.soubor),
  )
  odmitnuto.sort((a, b) => cs.compare(a.soubor, b.soubor))
  return { fotky, odmitnuto }
}

// ── YAML kandidátů ──────────────────────────────────────────────────────────

/**
 * YAML kandidátních fotek jedné chaty. Strojově generovaný soubor — běh ho
 * PŘEPISUJE; redakční výběr se zapisuje do YAML chaty (kolekce Fotky), ne sem.
 * `sFulltextem` říká, jestli zpracovaný export fulltext dotaz OBSAHOVAL —
 * hlavička nesmí tvrdit víc, než se skutečně hledalo (starý export bez
 * fulltextu tak projde offline transformací beze změny souborů).
 */
export const yamlFotek = (
  chata: ChataProDotaz,
  fotky: FotkaKandidat[],
  checked: string,
  radiusM: number,
  sFulltextem = false,
): string =>
  [
    `# ${chata.nazev} — kandidátní FOTKY z Wikimedia Commons (DATA-02, dotaz ${checked})`,
    `# Zdroj: geosearch ${radiusM} m okolo GPS chaty + Category:${chata.nazev}${sFulltextem ? ` + fulltext „${chata.nazev}" (namespace File)` : ''} na commons.wikimedia.org`,
    '# Licenční síto: jen CC0 / CC BY / CC BY-SA / public domain (NC a ND vyřazeny už tady).',
    ...(sFulltextem
      ? [
          '# POZOR na nálezy s původem jen `fulltext`: jde o shodu jména v názvu/popisu souboru,',
          '# ne o geotag u chaty — před převzetím ověřit na stránce souboru, že je to tento objekt.',
        ]
      : []),
    '# STROJOVĚ GENEROVÁNO — další běh soubor přepíše. Soubory se nestahují: výběr,',
    '# kontrolu licence na stránce souboru a nahrání do kolekce Fotky dělá redakce.',
    '',
    stringify({
      chata: chata.slug,
      oblast: chata.oblast,
      nazevChaty: chata.nazev,
      zdroj: `Wikimedia Commons API (geosearch + kategorie${sFulltextem ? ' + fulltext' : ''}), profil chaty: ${chata.profil === 'rucni' ? 'data/chaty' : 'kandidát DATA-01'}`,
      checked,
      fotky,
    }),
  ].join('\n')

export type ReportChaty = {
  slug: string
  oblast: string
  nazev: string
  prijato: number
  /** Kolik z přijatých našel JEN fulltext (redakce u nich ověřuje objekt). */
  jenFulltext: number
  odmitnuto: OdmitnutaFotka[]
}

export const zapisKandidatyFotek = (
  koren: string,
  chata: ChataProDotaz,
  fotky: FotkaKandidat[],
  checked: string,
  radiusM: number,
  sFulltextem = false,
): string => {
  const adresar = join(koren, 'data', 'kandidati', 'fotky', chata.oblast)
  mkdirSync(adresar, { recursive: true })
  const cesta = join(adresar, `${chata.slug}.yaml`)
  writeFileSync(cesta, yamlFotek(chata, fotky, checked, radiusM, sFulltextem), 'utf8')
  return cesta
}

// ── Surový export (doklad + offline režim) ──────────────────────────────────

export type SurovyExport = {
  checked: string
  radiusM: number
  api: string
  /** Odpovědi API po chatách: `<oblast>/<slug>` → { geosearch, kategorie,
   *  fulltext }. `fulltext` chybí ve starších exportech (před rozšířením). */
  dotazy: Record<string, { geosearch: unknown; kategorie: unknown; fulltext?: unknown }>
}

export const cestaExportu = (koren: string): string =>
  join(koren, 'data', 'kandidati', 'fotky', '_commons-export.json')

export const nactiSurovyExport = (raw: string): SurovyExport => {
  let telo: SurovyExport
  try {
    telo = JSON.parse(raw) as SurovyExport
  } catch {
    throw new Error('Export není validní JSON.')
  }
  if (!telo || typeof telo.dotazy !== 'object' || !telo.checked) {
    throw new Error('Export nemá očekávaný tvar ({ checked, radiusM, dotazy }).')
  }
  return telo
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const spanek = (ms: number) => new Promise((done) => setTimeout(done, ms))

const main = async () => {
  const argv = process.argv.slice(2)
  const apiIndex = argv.indexOf('--api')
  const api = apiIndex >= 0 && argv[apiIndex + 1] ? argv[apiIndex + 1] : API_COMMONS
  const radiusIndex = argv.indexOf('--radius')
  const radiusM =
    radiusIndex >= 0 && Number.isFinite(Number(argv[radiusIndex + 1]))
      ? Number(argv[radiusIndex + 1])
      : VYCHOZI_RADIUS_M
  const zJsonu = argv.includes('--z-jsonu')
  const koren = process.cwd()

  const { chaty, preskoceno } = nactiChaty(koren)
  if (chaty.length === 0) throw new Error('Žádná chata s GPS v data/chaty/ ani data/kandidati/.')

  let exportDat: SurovyExport
  if (zJsonu) {
    const cesta = cestaExportu(koren)
    if (!existsSync(cesta)) {
      throw new Error(`--z-jsonu: export ${cesta} neexistuje — nejdřív ho stáhne workflow/běh bez --z-jsonu.`)
    }
    console.log(`Offline transformace commitnutého exportu ${cesta}…`)
    exportDat = nactiSurovyExport(readFileSync(cesta, 'utf8'))
  } else {
    const checked = new Date().toISOString().slice(0, 10)
    console.log(`Commons dotazy (${api}, geosearch ${radiusM} m + kategorie + fulltext) pro ${chaty.length} chat…`)
    exportDat = { checked, radiusM, api, dotazy: {} }
    // Tempo pod 1 dotaz/s: první ostrý běh na 2/s narážel na 429 po ~10
    // dotazech — limiter sdílených IP runnerů chce opravdu volnou chůzi.
    const TEMPO_MS = 1200
    for (const chata of chaty) {
      const geosearch = await stahniJson(urlGeosearch(api, chata, radiusM))
      await spanek(TEMPO_MS)
      const kategorie = await stahniJson(urlKategorie(api, chata))
      await spanek(TEMPO_MS)
      const fulltext = await stahniJson(urlFulltext(api, chata))
      await spanek(TEMPO_MS)
      exportDat.dotazy[`${chata.oblast}/${chata.slug}`] = { geosearch, kategorie, fulltext }
      console.log(`- ${chata.nazev}: dotazy staženy`)
    }
    mkdirSync(join(koren, 'data', 'kandidati', 'fotky'), { recursive: true })
    writeFileSync(cestaExportu(koren), `${JSON.stringify(exportDat, null, 1)}\n`, 'utf8')
    console.log(`Surový export uložen: ${cestaExportu(koren)} (commituje se jako doklad).`)
  }

  const reporty: ReportChaty[] = []
  const bezDotazu: string[] = []
  for (const chata of chaty) {
    const dotazy = exportDat.dotazy[`${chata.oblast}/${chata.slug}`]
    if (!dotazy) {
      bezDotazu.push(`${chata.oblast}/${chata.slug}`) // chata přibyla po exportu
      continue
    }
    const { fotky, odmitnuto } = zpracujOdpovedi(chata, dotazy.geosearch, dotazy.kategorie, dotazy.fulltext)
    zapisKandidatyFotek(koren, chata, fotky, exportDat.checked, exportDat.radiusM, dotazy.fulltext !== undefined)
    reporty.push({
      slug: chata.slug,
      oblast: chata.oblast,
      nazev: chata.nazev,
      prijato: fotky.length,
      jenFulltext: fotky.filter((f) => f.nalezeno === 'fulltext').length,
      odmitnuto,
    })
  }

  console.log(`\n## DATA-02 report (dotaz ${exportDat.checked}, geosearch ${exportDat.radiusM} m + fulltext)`)
  console.log(`\nChaty s kandidátními fotkami: ${reporty.filter((r) => r.prijato > 0).length} z ${reporty.length}`)
  for (const r of reporty) {
    console.log(`\n### ${r.nazev} (\`data/kandidati/fotky/${r.oblast}/${r.slug}.yaml\`)`)
    const fulltextInfo = r.jenFulltext > 0 ? ` (z toho jen fulltext — ověřit objekt: ${r.jenFulltext})` : ''
    console.log(`- přijato: ${r.prijato}${fulltextInfo} · vyřazeno sítem: ${r.odmitnuto.length}`)
    for (const o of r.odmitnuto) console.log(`  - ✗ ${o.soubor} — ${o.duvod}`)
  }
  if (bezDotazu.length > 0) {
    console.log(`\nBez dotazu v exportu (chata přibyla po stažení — pustit znovu bez --z-jsonu): ${bezDotazu.join(', ')}`)
  }
  if (preskoceno.length > 0) {
    console.log(`\nPřeskočené YAML (bez slug/nazev/GPS): ${preskoceno.length}`)
    for (const p of preskoceno) console.log(`- ${p}`)
  }
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('data02-commons-fotky.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
