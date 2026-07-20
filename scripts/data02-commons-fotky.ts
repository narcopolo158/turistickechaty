/**
 * DATA-02: fotky chat z Wikimedia Commons — kandidátní METADATA.
 *
 * Pro každou chatu s GPS (ruční profily v `data/chaty/**` i OSM kandidáty
 * v `data/kandidati/<oblast>/`) položí na Commons API dva dotazy:
 *   1. geosearch — soubory (namespace 6) v okruhu kolem GPS chaty,
 *   2. kategorie — soubory v `Category:<název chaty>` (pokud existuje).
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

export const stahniJson = async (url: string): Promise<unknown> => {
  const odpoved = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!odpoved.ok) {
    const napoveda = odpoved.status === 429 ? ' (příliš dotazů — Commons žádá zpomalit)' : ''
    throw new Error(`Commons API vrátilo HTTP ${odpoved.status}${napoveda}.`)
  }
  try {
    return await odpoved.json()
  } catch {
    throw new Error('Commons API nevrátilo validní JSON.')
  }
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

/** Stránky z odpovědi (formatversion=2); `error` v odpovědi = prázdný výsledek
 *  jen u neexistující/neplatné kategorie, jinak tvrdá chyba. */
export const strankyZOdpovedi = (json: unknown, druh: 'geosearch' | 'kategorie'): CommonsStranka[] => {
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
  nalezeno: 'geosearch' | 'kategorie' | 'geosearch + kategorie'
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

/**
 * Sloučí geosearch + kategorii (dedup podle názvu souboru), prožene licenčním
 * sítem a deterministicky seřadí: geotagované dle vzdálenosti od chaty, pak
 * abecedně. Vyřazené jdou do reportu — do YAML kandidátů nepatří.
 */
export const zpracujOdpovedi = (
  chata: ChataProDotaz,
  geosearchJson: unknown,
  kategorieJson: unknown,
): { fotky: FotkaKandidat[]; odmitnuto: OdmitnutaFotka[] } => {
  const zdroje: { stranky: CommonsStranka[]; druh: 'geosearch' | 'kategorie' }[] = [
    { stranky: strankyZOdpovedi(geosearchJson, 'geosearch'), druh: 'geosearch' },
    { stranky: strankyZOdpovedi(kategorieJson, 'kategorie'), druh: 'kategorie' },
  ]
  const podleSouboru = new Map<string, { stranka: CommonsStranka; nalezeno: FotkaKandidat['nalezeno'] }>()
  for (const { stranky, druh } of zdroje) {
    for (const stranka of stranky) {
      if (!stranka.title) continue
      const drive = podleSouboru.get(stranka.title)
      podleSouboru.set(stranka.title, {
        stranka: drive?.stranka ?? stranka,
        nalezeno: drive && drive.nalezeno !== druh ? 'geosearch + kategorie' : (drive?.nalezeno ?? druh),
      })
    }
  }

  const fotky: FotkaKandidat[] = []
  const odmitnuto: OdmitnutaFotka[] = []
  for (const { stranka, nalezeno } of podleSouboru.values()) {
    const vysledek = fotkaZeStranky(chata, stranka, nalezeno)
    if (!vysledek) continue
    if ('duvod' in vysledek) odmitnuto.push(vysledek)
    else fotky.push(vysledek)
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
 */
export const yamlFotek = (
  chata: ChataProDotaz,
  fotky: FotkaKandidat[],
  checked: string,
  radiusM: number,
): string =>
  [
    `# ${chata.nazev} — kandidátní FOTKY z Wikimedia Commons (DATA-02, dotaz ${checked})`,
    `# Zdroj: geosearch ${radiusM} m okolo GPS chaty + Category:${chata.nazev} na commons.wikimedia.org`,
    '# Licenční síto: jen CC0 / CC BY / CC BY-SA / public domain (NC a ND vyřazeny už tady).',
    '# STROJOVĚ GENEROVÁNO — další běh soubor přepíše. Soubory se nestahují: výběr,',
    '# kontrolu licence na stránce souboru a nahrání do kolekce Fotky dělá redakce.',
    '',
    stringify({
      chata: chata.slug,
      oblast: chata.oblast,
      nazevChaty: chata.nazev,
      zdroj: `Wikimedia Commons API (geosearch + kategorie), profil chaty: ${chata.profil === 'rucni' ? 'data/chaty' : 'kandidát DATA-01'}`,
      checked,
      fotky,
    }),
  ].join('\n')

export type ReportChaty = {
  slug: string
  oblast: string
  nazev: string
  prijato: number
  odmitnuto: OdmitnutaFotka[]
}

export const zapisKandidatyFotek = (
  koren: string,
  chata: ChataProDotaz,
  fotky: FotkaKandidat[],
  checked: string,
  radiusM: number,
): string => {
  const adresar = join(koren, 'data', 'kandidati', 'fotky', chata.oblast)
  mkdirSync(adresar, { recursive: true })
  const cesta = join(adresar, `${chata.slug}.yaml`)
  writeFileSync(cesta, yamlFotek(chata, fotky, checked, radiusM), 'utf8')
  return cesta
}

// ── Surový export (doklad + offline režim) ──────────────────────────────────

export type SurovyExport = {
  checked: string
  radiusM: number
  api: string
  /** Odpovědi API po chatách: `<oblast>/<slug>` → { geosearch, kategorie }. */
  dotazy: Record<string, { geosearch: unknown; kategorie: unknown }>
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
    console.log(`Commons dotazy (${api}, geosearch ${radiusM} m + kategorie) pro ${chaty.length} chat…`)
    exportDat = { checked, radiusM, api, dotazy: {} }
    for (const chata of chaty) {
      const geosearch = await stahniJson(urlGeosearch(api, chata, radiusM))
      await spanek(250) // slušnost k API — žádné salvy
      const kategorie = await stahniJson(urlKategorie(api, chata))
      await spanek(250)
      exportDat.dotazy[`${chata.oblast}/${chata.slug}`] = { geosearch, kategorie }
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
    const { fotky, odmitnuto } = zpracujOdpovedi(chata, dotazy.geosearch, dotazy.kategorie)
    zapisKandidatyFotek(koren, chata, fotky, exportDat.checked, exportDat.radiusM)
    reporty.push({ slug: chata.slug, oblast: chata.oblast, nazev: chata.nazev, prijato: fotky.length, odmitnuto })
  }

  console.log(`\n## DATA-02 report (dotaz ${exportDat.checked}, geosearch ${exportDat.radiusM} m)`)
  console.log(`\nChaty s kandidátními fotkami: ${reporty.filter((r) => r.prijato > 0).length} z ${reporty.length}`)
  for (const r of reporty) {
    console.log(`\n### ${r.nazev} (\`data/kandidati/fotky/${r.oblast}/${r.slug}.yaml\`)`)
    console.log(`- přijato: ${r.prijato} · vyřazeno licenčním sítem: ${r.odmitnuto.length}`)
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
