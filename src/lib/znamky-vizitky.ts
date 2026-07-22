import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Turistické známky a vizitky u chaty (DATA-10) — načtení pro profil (blok
 * „Sběratelská místa"). Data generuje `scripts/data10-znamky-vizitky.ts` z
 * katalogu do `data/znamky-vizitky/krkonose.json` (dle slugu). Bere se jen
 * vrstva číslo + odkaz + fakt (verified:false, se zdrojem); obrázky/náhledy sem
 * nepatří — grafika je autorské dílo vydavatele, doplní se jen se svolením.
 */
export type Produkt = {
  system: 'znamka' | 'vizitka'
  cislo: string
  nazev: string
  url: string
  stav: string
  jistota: string
  poznamka?: string
}

type Katalog = { chaty?: { slug: string; produkty: Produkt[] }[] }

let cache: Map<string, Produkt[]> | null = null

const nactiKatalog = (): Map<string, Produkt[]> => {
  if (cache) return cache
  cache = new Map()
  const cesta = join(process.cwd(), 'data', 'znamky-vizitky', 'krkonose.json')
  if (existsSync(cesta)) {
    const k = JSON.parse(readFileSync(cesta, 'utf8')) as Katalog
    for (const c of k.chaty ?? []) cache.set(c.slug, c.produkty)
  }
  return cache
}

/** Sběratelské produkty chaty dle slugu (prázdné pole, když žádné nejsou). */
export const znamkyVizitkyChaty = (slug: string): Produkt[] => nactiKatalog().get(slug) ?? []
