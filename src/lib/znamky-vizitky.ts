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
 * Obrázek známky/vizitky — JEN se svolením vydavatele. Manifest plní GitHub
 * Action (známky: `obrazky.json`, DATA-13, se svolením Holub). Vizitky mají
 * VLASTNÍ manifest `obrazky-vizitky.json`, který se naplní teprve po svolení
 * Wander Book — do té doby soubor neexistuje → vrací null → placeholder faux-3D.
 * Oddělené soubory = čistá autorskoprávní hranice (známky ≠ vizitky).
 */
export type ObrazekOdkaz = { url: string; zdroj: string }
type ObrazkyManifest = { svolil?: string; obrazky?: { slug: string; soubor: string }[] }

const obrazkyCache = new Map<string, Map<string, ObrazekOdkaz>>()

const nactiObrazky = (soubor: string): Map<string, ObrazekOdkaz> => {
  const hotovo = obrazkyCache.get(soubor)
  if (hotovo) return hotovo
  const mapa = new Map<string, ObrazekOdkaz>()
  const cesta = join(process.cwd(), 'data', 'znamky-vizitky', soubor)
  if (existsSync(cesta)) {
    const m = JSON.parse(readFileSync(cesta, 'utf8')) as ObrazkyManifest
    const zdroj = m.svolil ?? 'vydavatel (se svolením)'
    for (const o of m.obrazky ?? []) if (o.slug && o.soubor) mapa.set(o.slug, { url: o.soubor, zdroj })
  }
  obrazkyCache.set(soubor, mapa)
  return mapa
}

/** Obrázek známky chaty (se svolením Turistické známky s.r.o.), nebo null. */
export const znamkaObrazek = (slug: string): ObrazekOdkaz | null => nactiObrazky('obrazky.json').get(slug) ?? null

/** Obrázek vizitky chaty — až po svolení Wander Book (jinak null → placeholder). */
export const vizitkaObrazek = (slug: string): ObrazekOdkaz | null => nactiObrazky('obrazky-vizitky.json').get(slug) ?? null
