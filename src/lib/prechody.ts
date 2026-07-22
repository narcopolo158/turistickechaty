import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Přechody mezi chatami (sousední chaty, DATA-06) — načtení pro profil (karta
 * „Sousední chaty" / plánovač přechodů, plán P3). Data počítá
 * `scripts/data06-prechody.ts` do `data/trasy/krkonose/prechody.json`
 * (nejbližší jiné chaty po značených trasách). `verified:false`, zdroj OSM.
 * Čas přechodu (DIN 33466) dopočítá krok s převýšením (Actions); zatím délka.
 */
export type PrechodUsek = { znaceni: string; delkaKm: number }
export type Prechod = {
  cilSlug: string
  cilNazev: string
  cilUrl: string | null
  delkaKm: number
  useky: PrechodUsek[]
  podilNeznacenychProc: number
  kRucniKontrole: boolean
}

type Katalog = { chaty?: { slug: string; prechody: Prechod[] }[] }

let cache: Map<string, Prechod[]> | null = null

const nactiKatalog = (): Map<string, Prechod[]> => {
  if (cache) return cache
  cache = new Map()
  const cesta = join(process.cwd(), 'data', 'trasy', 'krkonose', 'prechody.json')
  if (existsSync(cesta)) {
    const k = JSON.parse(readFileSync(cesta, 'utf8')) as Katalog
    for (const c of k.chaty ?? []) cache.set(c.slug, c.prechody)
  }
  return cache
}

/** Sousední chaty (přechody) dle slugu — prázdné pole, když žádné nejsou. */
export const prechodyChaty = (slug: string): Prechod[] => nactiKatalog().get(slug) ?? []
