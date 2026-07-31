import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Přechody mezi chatami (sousední chaty, DATA-06) — načtení pro profil (karta
 * „Sousední chaty" / plánovač přechodů, plán P3). Data počítá
 * `scripts/data06-prechody.ts` do `data/trasy/<oblast>/prechody.json` (čtou se
 * všechny oblasti — cesta napevno na krkonose skrývala data nové oblasti)
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
  const koren = join(process.cwd(), 'data', 'trasy')
  if (!existsSync(koren)) return cache
  for (const oblast of readdirSync(koren)) {
    const cesta = join(koren, oblast, 'prechody.json')
    if (!existsSync(cesta)) continue
    const k = JSON.parse(readFileSync(cesta, 'utf8')) as Katalog
    for (const c of k.chaty ?? []) cache.set(c.slug, c.prechody)
  }
  return cache
}

/** Sousední chaty (přechody) dle slugu — prázdné pole, když žádné nejsou. */
export const prechodyChaty = (slug: string): Prechod[] => nactiKatalog().get(slug) ?? []
