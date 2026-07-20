import { getPayload } from 'payload'
import config from '../payload.config'

import type { Chaty as Chata, Fotky as Fotka, Oblasti as Oblast, Razitka } from '../payload-types'
import type { MapovaChata } from '../components/MapaChat'
import type { RazitkovnikChata } from '../components/RazitkovnikClient'

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
}

/** Barvy pásových značek — terénní, neměnit (tokens: --tr-*) */
export const ZNACENI_BARVA: Record<string, string> = {
  cervena: '#E0341F',
  modra: '#2A5CB8',
  zelena: '#2E8B57',
  zluta: '#EAB308',
}

export const ZNACENI_NAZEV: Record<string, string> = {
  cervena: 'červená',
  modra: 'modrá',
  zelena: 'zelená',
  zluta: 'žlutá',
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
      },
    ]
  })
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
