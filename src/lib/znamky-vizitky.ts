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

/**
 * Obrázek turistické známky (DATA-13) — jen se svolením vydavatele
 * (turisticke-znamky.cz, Mgr. Holub). Manifest `data/znamky-vizitky/obrazky.json`
 * plní GitHub Action; když soubor/záznam chybí, vrací null → profil drží
 * placeholder faux-3D.
 */
export type ZnamkaObrazek = { url: string; zdroj: string }
type ObrazkyManifest = { svolil?: string; obrazky?: { slug: string; soubor: string }[] }

let obrazkyCache: Map<string, ZnamkaObrazek> | null = null

const nactiObrazky = (): Map<string, ZnamkaObrazek> => {
  if (obrazkyCache) return obrazkyCache
  obrazkyCache = new Map()
  const cesta = join(process.cwd(), 'data', 'znamky-vizitky', 'obrazky.json')
  if (existsSync(cesta)) {
    const m = JSON.parse(readFileSync(cesta, 'utf8')) as ObrazkyManifest
    const zdroj = m.svolil ?? 'Turistické známky s.r.o. (se svolením)'
    for (const o of m.obrazky ?? []) if (o.slug && o.soubor) obrazkyCache.set(o.slug, { url: o.soubor, zdroj })
  }
  return obrazkyCache
}

/** Obrázek známky chaty (se svolením), nebo null. */
export const znamkaObrazek = (slug: string): ZnamkaObrazek | null => nactiObrazky().get(slug) ?? null
