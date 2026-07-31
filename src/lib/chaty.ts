import { getPayload } from 'payload'
import config from '../payload.config'

import type { Chaty as Chata, Fotky as Fotka, Oblasti as Oblast, Razitka, Strediska as Stredisko } from '../payload-types'
import type { MapovaChata } from '../components/MapaChat'
import type { RazitkovnikChata } from '../components/RazitkovnikClient'
import { nejstarsiDolozenyRok, type IndexChata, type KalendariumPolozka } from './index-chat'
import { znamkyVizitkyChaty } from './znamky-vizitky'

/** Kód země (Payload select) → český URL slug dle plánu kap. 6: /cesko/krkonose/lucni-bouda */
export const ZEME_SLUG: Record<string, string> = {
  cz: 'cesko',
  sk: 'slovensko',
  pl: 'polsko',
  at: 'rakousko',
  de: 'nemecko',
  ch: 'svycarsko',
  it: 'italie',
  si: 'slovinsko',
  fr: 'francie',
}

export const ZEME_NAZEV: Record<string, string> = {
  cz: 'Česko',
  sk: 'Slovensko',
  pl: 'Polsko',
  at: 'Rakousko',
  de: 'Německo',
  ch: 'Švýcarsko',
  it: 'Itálie',
  si: 'Slovinsko',
  fr: 'Francie',
}

export const TYP_NAZEV: Record<string, string> = {
  obsluhovana: 'Obsluhovaná chata',
  utulna: 'Útulna',
  bivak: 'Bivak',
  'horsky-hotel': 'Horský hotel',
  rozhledna: 'Rozhledna s občerstvením',
}

/** Barvy pásových značek — terénní, neměnit (tokens: --tr-*) */
export const ZNACENI_BARVA: Record<string, string> = {
  cervena: '#E0341F',
  modra: '#2A5CB8',
  zelena: '#2E8B57',
  zluta: '#EAB308',
  cerna: '#1A1A1A',
}

export const ZNACENI_NAZEV: Record<string, string> = {
  cervena: 'červená',
  modra: 'modrá',
  zelena: 'zelená',
  zluta: 'žlutá',
  cerna: 'černá',
  jine: 'jiné',
}

/** Minuty → „2:30" */
export const formatCas = (min: number): string =>
  `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/** 1410 → „1 410" (úzká nezlomitelná mezera dle české typografie) */
export const formatCislo = (n: number): string =>
  new Intl.NumberFormat('cs-CZ').format(n).replace(/\s/g, ' ')

/** ISO datum → „14. 6. 2026" */
export const formatDatum = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

/** GPS na „50.7326 N, 15.6960 E" */
export const formatGps = (lat: number, lng: number): string =>
  `${Math.abs(lat).toFixed(4)} ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)} ${lng >= 0 ? 'E' : 'W'}`

/** Kanonická cesta profilu chaty; null, dokud chatě chybí země nebo oblast. */
export const chataPath = (chata: Chata): string | null => {
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const zeme = chata.zeme ? ZEME_SLUG[chata.zeme] : null
  if (!oblast?.slug || !zeme) return null
  return `/${zeme}/${oblast.slug}/${chata.slug}`
}

/** Nejnovější datum `checked` napříč bloky ověření + celková věrohodnost. */
export const posledniOvereni = (
  chata: Chata,
): { checked: string; verified: boolean } | null => {
  const bloky = [
    chata.overeniLokace,
    chata.overeniNocleh,
    chata.overeniObcerstveni,
    chata.overeniSluzby,
    chata.overeniProvoz,
    chata.overeniPristup,
    chata.overeniHistorie,
  ]
  const platne = bloky.filter((b) => b?.checked)
  if (platne.length === 0) return null
  platne.sort((a, b) => (a!.checked! < b!.checked! ? 1 : -1))
  return { checked: platne[0]!.checked!, verified: platne.some((b) => b?.verified) }
}

/**
 * Payload join (`chata.razitka`) nepopuluje vnořené relace joinovaných
 * dokumentů ani při vyšší `depth` — `razitko.otisk` tak zůstává jen číselné ID
 * a skutečný sken by se nikdy nezobrazil (padal by fallback na stylizované
 * SVG). Otisky proto doplní jeden společný dotaz na Fotky.
 */
async function populujOtiskyRazitek(chaty: Chata[]): Promise<void> {
  const razitka = chaty
    .flatMap((chata) => chata.razitka?.docs ?? [])
    .filter((r): r is Razitka => typeof r === 'object')
  const chybejici = [...new Set(razitka.map((r) => r.otisk).filter((o): o is number => typeof o === 'number'))]
  if (chybejici.length === 0) return
  const payload = await getPayload({ config })
  const fotky = await payload.find({
    collection: 'fotky',
    where: { id: { in: chybejici } },
    depth: 0,
    limit: chybejici.length,
    overrideAccess: false,
  })
  const dleId = new Map<number, Fotka>(fotky.docs.map((f) => [f.id, f]))
  for (const razitko of razitka) {
    if (typeof razitko.otisk === 'number' && dleId.has(razitko.otisk)) {
      razitko.otisk = dleId.get(razitko.otisk)!
    }
  }
}

/**
 * Join `chata.razitka` vrací i koncepty — Payload u joinovaných dokumentů
 * nefiltruje podle statusu (koncept/publikace). Veřejné čtení proto nechá jen
 * publikovaná razítka; komunitní podání ve stavu koncept se na webu neobjeví,
 * dokud ho redakce nepublikuje (moderace).
 */
function jenPublikovanaRazitka(chaty: Chata[]): void {
  for (const chata of chaty) {
    if (chata.razitka?.docs) {
      chata.razitka.docs = chata.razitka.docs.filter(
        (r) => typeof r === 'object' && (r as Razitka)._status === 'published',
      )
    }
  }
}

/** Publikovaná chata dle slugu, s oblastí, fotkami a razítky (join). */
export async function getChataBySlug(slug: string): Promise<Chata | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'chaty',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    overrideAccess: false,
  })
  jenPublikovanaRazitka(res.docs)
  await populujOtiskyRazitek(res.docs)
  return res.docs[0] ?? null
}

export type { Chata, Oblast }

/** Publikované chaty se souřadnicemi pro mapový pás (F0-07) — jen doložená pole. */
export async function getChatyProMapu(): Promise<MapovaChata[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'chaty',
    where: { and: [{ lat: { exists: true } }, { lng: { exists: true } }] },
    depth: 1,
    limit: 500,
    overrideAccess: false,
  })
  return res.docs.flatMap((chata) => {
    const url = chataPath(chata)
    if (url == null || chata.lat == null || chata.lng == null) return []
    return [
      {
        slug: chata.slug!,
        nazev: chata.nazev,
        vyska: chata.vyska ?? null,
        stav: chata.stav ?? null,
        lat: chata.lat,
        lng: chata.lng,
        url,
        typ: chata.typ ?? null,
      },
    ]
  })
}

/** ano/ne select → bool; nevyplněno = null (nezjištěno, poctivě se nefiltruje jako „ne"). */
const anoNeNaBool = (hodnota: string | null | undefined): boolean | null =>
  hodnota === 'ano' ? true : hodnota === 'ne' ? false : null

/**
 * SSG index chat (F1a) — štíhlý index všech publikovaných profilů pro
 * hledání, filtry, countery a „namátkou" šablon F1 + položky kalendária
 * (milníky historie s rokem). Počítá se při buildu v server komponentách,
 * klient dostává hotová data v props (žádné dotazy z prohlížeče).
 */
export async function getIndexChat(): Promise<{
  index: IndexChata[]
  kalendarium: KalendariumPolozka[]
}> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'chaty',
    depth: 2, // razítka jako objekty (join při depth 1 vrací jen ID — viz populujOtiskyRazitek)
    limit: 500,
    sort: 'nazev',
    overrideAccess: false,
  })
  jenPublikovanaRazitka(res.docs)
  await populujOtiskyRazitek(res.docs)

  const index: IndexChata[] = []
  const kalendarium: KalendariumPolozka[] = []
  for (const chata of res.docs) {
    const overeni = posledniOvereni(chata)
    const url = chataPath(chata)
    const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
    // Stejný výběr razítka jako na profilu a v razítkovníku: přednost
    // „k dispozici", jinak první doložené; bez skenu poctivě null.
    const razitka = (chata.razitka?.docs ?? []).filter((r): r is Razitka => typeof r === 'object')
    const razitko = razitka.find((r) => r.stav === 'k-dispozici') ?? razitka[0] ?? null
    const otisk = razitko && typeof razitko.otisk === 'object' ? razitko.otisk : null
    // Hero pro thumb karty: týž výběr jako profil (první fotka typu
    // `soucasna` s url); miniatura `nahled` (480×320), fallback plná fotka.
    const fotkyChaty = (chata.fotky?.docs ?? []).filter((f): f is Fotka => typeof f === 'object')
    const hero = fotkyChaty.find((f) => f.typ === 'soucasna' && f.url) ?? null
    index.push({
      slug: chata.slug!,
      nazev: chata.nazev,
      url,
      oblastSlug: oblast?.slug ?? null,
      oblastNazev: oblast?.nazev ?? null,
      zeme: chata.zeme ?? null,
      typ: chata.typ ?? null,
      stav: chata.stav ?? null,
      vyska: chata.vyska ?? null,
      lat: chata.lat ?? null,
      lng: chata.lng ?? null,
      nocleh: anoNeNaBool(chata.nocleh),
      obcerstveni: anoNeNaBool(chata.kuchyne),
      razitko: razitka.length > 0,
      otiskUrl: otisk?.url ?? null,
      otiskAlt: otisk?.alt ?? null,
      heroUrl: hero ? (hero.sizes?.nahled?.url ?? hero.url ?? null) : null,
      heroAlt: hero?.alt ?? null,
      kapacita: chata.kapacita ?? null,
      znamka: znamkyVizitkyChaty(chata.slug!).some((p) => p.system === 'znamka'),
      checked: overeni?.checked ?? null,
      verified: overeni?.verified ?? false,
      nejstarsiRok: nejstarsiDolozenyRok(chata.milniky),
    })
    for (const milnik of chata.milniky ?? []) {
      if (typeof milnik.rok === 'number' && milnik.udalost) {
        kalendarium.push({ rok: milnik.rok, udalost: milnik.udalost, chataNazev: chata.nazev, chataUrl: url })
      }
    }
  }
  return { index, kalendarium }
}

/**
 * Publikované chaty pro razítkovník (F0-08) — sloty sbírky. Vybírá se stejné
 * razítko jako na profilu (přednost „k dispozici", jinak první doložené);
 * chybějící otisk je poctivě null, slot pak nese stylizované SVG.
 */
export async function getChatyProRazitkovnik(): Promise<RazitkovnikChata[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'chaty',
    depth: 2,
    limit: 500,
    sort: 'nazev',
    overrideAccess: false,
  })
  jenPublikovanaRazitka(res.docs)
  await populujOtiskyRazitek(res.docs)
  return res.docs.map((chata) => {
    const razitka = (chata.razitka?.docs ?? []).filter((r): r is Razitka => typeof r === 'object')
    const razitko = razitka.find((r) => r.stav === 'k-dispozici') ?? razitka[0] ?? null
    const otisk = razitko && typeof razitko.otisk === 'object' ? razitko.otisk : null
    return {
      slug: chata.slug!,
      nazev: chata.nazev,
      vyska: chata.vyska ?? null,
      oblastNazev: typeof chata.oblast === 'object' ? (chata.oblast?.nazev ?? null) : null,
      url: chataPath(chata),
      otiskUrl: otisk?.url ?? null,
      otiskAlt: otisk?.alt ?? null,
      kdeSeRazitkuje: razitko?.kdeSeRazitkuje ?? null,
      maOtiskVDb: Boolean(otisk?.url),
    }
  })
}

/**
 * Oblast dle slugu (stránka pohoří, F1d) — metadata z F1a: charakteristika
 * s blokem ověření, nejvyšší hora se zdrojem, top cíle s vazbou na chaty.
 */
export async function getOblastBySlug(slug: string): Promise<Oblast | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'oblasti',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}

/** Střediska oblasti (F1a kolekce) — karty na stránce pohoří, řazené česky. */
export async function getStrediskaOblasti(oblastSlug: string): Promise<Stredisko[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'strediska',
    depth: 1,
    limit: 100,
    overrideAccess: false,
  })
  const cs = new Intl.Collator('cs')
  return res.docs
    .filter((s) => typeof s.oblast === 'object' && s.oblast?.slug === oblastSlug)
    .sort((a, b) => cs.compare(a.nazev, b.nazev))
}

/**
 * Počet publikovaných razítek — volitelně jen v jedné oblasti (vitrína
 * sběratelství na stránce pohoří). Bez filtru by vitrína nové oblasti
 * ukazovala otisky cizího pohoří, což by lhalo.
 */
export async function getPocetPublikovanychRazitek(oblastSlug?: string): Promise<number> {
  const payload = await getPayload({ config })
  const res = await payload.count({
    collection: 'razitka',
    where: oblastSlug
      ? { and: [{ _status: { equals: 'published' } }, { 'chata.oblast.slug': { equals: oblastSlug } }] }
      : { _status: { equals: 'published' } },
    overrideAccess: false,
  })
  return res.totalDocs
}

/** Slugy všech oblastí (stránky pohoří se generují z dat, ne ze seznamu v kódu). */
export async function getSlugyOblasti(): Promise<string[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'oblasti', limit: 100, depth: 0, overrideAccess: false })
  return res.docs.map((o) => o.slug).filter((s): s is string => !!s)
}

export type ZivaOblast = { slug: string; nazev: string; pocetChat: number }

/**
 * Oblasti, které na webu OPRAVDU stojí — mají aspoň jeden publikovaný profil.
 *
 * Seedovaných oblastí je víc než živých: Český ráj i Ještědský hřbet existují
 * jako záznam, ale zatím jen s kandidáty. Nabídnout je čtenáři (nebo robotům
 * v llms.txt a sitemap) by znamenalo poslat je na prázdný rozcestník, což je
 * horší než mlčet. Vzniklo 31. 7. 2026 při přidávání Jizerských hor na
 * homepage: tři místa si tehdy filtrovala oblasti každé po svém.
 */
export async function getZiveOblasti(): Promise<ZivaOblast[]> {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'oblasti', limit: 100, depth: 0, overrideAccess: false })
  // Počítá se z INDEXU profilů, ne z mapových bodů: mapa vede jen chaty se
  // souřadnicemi, takže by Krkonoše hlásily 74 tam a 77 jinde — dvě různá
  // čísla o téže věci na jedné stránce.
  const { index } = await getIndexChat()
  const pocty = new Map<string, number>()
  for (const ch of index) {
    if (ch.oblastSlug) pocty.set(ch.oblastSlug, (pocty.get(ch.oblastSlug) ?? 0) + 1)
  }
  return res.docs
    .filter((o): o is typeof o & { slug: string; nazev: string } => !!o.slug && !!o.nazev)
    .map((o) => ({ slug: o.slug, nazev: o.nazev, pocetChat: pocty.get(o.slug) ?? 0 }))
    .filter((o) => o.pocetChat > 0)
    .sort((a, b) => b.pocetChat - a.pocetChat)
}

/**
 * Výčet do české věty: „Krkonoše", „Krkonoše a Jizerské hory", „A, B a C".
 * Spojovat všechno slovem „a" (jak to dělal první pokus) dá paskvil
 * „Český ráj a Ještědský hřbet a Krkonoše a Jizerské hory".
 */
export const spojVyctem = (polozky: string[]): string =>
  polozky.length <= 1
    ? (polozky[0] ?? '')
    : `${polozky.slice(0, -1).join(', ')} a ${polozky[polozky.length - 1]}`
