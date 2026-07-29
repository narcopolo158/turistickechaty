import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Pojmenované vrcholy oblasti s nadmořskou výškou (OSM, ODbL) — podklad pro
 * řez hřebenem na stránce pohoří. Soubor plní `scripts/vrcholy-z-3d.ts`
 * z exportu pipeline DATA-28; čte se při buildu, jako ostatní datové vrstvy.
 *
 * Výšky jsou převzaté z OSM, ne měřené — kdo je zobrazuje, to musí přiznat.
 */
export type Vrchol = { nazev: string; lat: number; lng: number; vyska: number }

export type VrcholyOblasti = {
  zdroj: string
  pozn: string
  oblast: string
  pocet: number
  vrcholy: Vrchol[]
}

const cache = new Map<string, VrcholyOblasti | null>()

export const vrcholyOblasti = (oblastSlug: string): VrcholyOblasti | null => {
  const hotovo = cache.get(oblastSlug)
  if (hotovo !== undefined) return hotovo
  const cesta = join(process.cwd(), 'data', 'vrcholy', `${oblastSlug}.json`)
  const data = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as VrcholyOblasti) : null
  cache.set(oblastSlug, data)
  return data
}
