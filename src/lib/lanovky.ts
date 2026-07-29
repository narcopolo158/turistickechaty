import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Přehled lanovek oblasti (DATA-32) — data generuje `scripts/data32-lanovky.ts`
 * z vrstvy `aerialway` OpenStreetMap, kterou drží export pipeline DATA-28.
 *
 * Vede jen dráhy, které vyvezou pěšího (kabinkové, kombinované, sedačkové);
 * vleky ne — jejich počet nese `vleku`, ať je vidět, co přehled vynechává.
 * Převýšení pochází z výškového modelu, ne z měření, a vzdálenost k chatám je
 * vzdušná čára: obojí musí být v UI přiznané, proto to sem chodí s daty.
 */
export type Lanovka = {
  id: string
  nazev: string | null
  typ: string
  typNazev: string
  delkaM: number
  prevyseniM: number | null
  dolni: { lat: number; lng: number; vyska: number | null }
  horni: { lat: number; lng: number; vyska: number | null }
  useku: number
  uHorniStanice: { slug: string; nazev: string; vzdalenostM: number }[]
}

export type LanovkyOblasti = {
  oblast: string
  zdroj: string
  stavOsm: string | null
  zdrojVysek: string | null
  poznamka: string
  pocet: number
  vleku: number
  lanovky: Lanovka[]
}

const cache = new Map<string, LanovkyOblasti | null>()

/** Lanovky oblasti; `null`, když pro ni přehled zatím není (např. nová oblast). */
export const lanovkyOblasti = (oblastSlug: string): LanovkyOblasti | null => {
  const z = cache.get(oblastSlug)
  if (z !== undefined) return z
  const cesta = join(process.cwd(), 'data', 'lanovky', `${oblastSlug}.json`)
  const data = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as LanovkyOblasti) : null
  cache.set(oblastSlug, data)
  return data
}

/**
 * Slug lanovky do URL mini-stránky. Vzniká z názvu (bez diakritiky) a když
 * by se dva názvy sešly na tomtéž slugu, rozliší je pořadí v datech —
 * v Krkonoších stojí „Szrenica I" a „Szrenica II", ale i dvě dráhy téhož
 * jména na různých svazích; tichá kolize by poslala čtenáře na cizí lanovku.
 */
export const slugLanovky = (nazev: string | null, id: string): string => {
  const zaklad = (nazev ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    // Malá písmena AŽ POTOM: „Ł" se rozkladem NFD nerozloží a velké
    // písmeno by tudy propadlo do prázdna (z „Łabski" by zbylo „abski").
    .replace(/ł/gu, 'l')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
  return zaklad || `draha-${id.replace(/[^a-z0-9]+/giu, '-')}`
}

export type LanovkaSeSlugem = Lanovka & { slug: string; url: string }

/** Lanovky oblasti s URL mini-stránky; kolize slugů se rozliší příponou. */
export const lanovkySeSlugy = (oblastSlug: string, zemeSlug = 'cesko'): LanovkaSeSlugem[] => {
  const data = lanovkyOblasti(oblastSlug)
  if (!data) return []
  const pouzite = new Map<string, number>()
  return data.lanovky.map((l) => {
    const zaklad = slugLanovky(l.nazev, l.id)
    const kolikrat = (pouzite.get(zaklad) ?? 0) + 1
    pouzite.set(zaklad, kolikrat)
    const slug = kolikrat === 1 ? zaklad : `${zaklad}-${kolikrat}`
    return { ...l, slug, url: `/${zemeSlug}/${oblastSlug}/lanovka/${slug}` }
  })
}

export const lanovkaPodleSlugu = (
  oblastSlug: string,
  slug: string,
  zemeSlug = 'cesko',
): LanovkaSeSlugem | null => lanovkySeSlugy(oblastSlug, zemeSlug).find((l) => l.slug === slug) ?? null
