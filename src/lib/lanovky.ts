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
