import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Přístupové trasy k chatám (DATA-06 increment 3b) — načtení pro profil.
 * Data počítá `scripts/data06-pristupove-trasy.ts` do
 * `data/trasy/<oblast>/pristupove-trasy.json` (routing po značených KČT trasách).
 * Tady se jen čtou pro server-render profilu.
 *
 * ČTOU SE VŠECHNY OBLASTI, ne jen krkonošská. Do 31. 7. 2026 tu byla cesta
 * napevno na `krkonose`, takže jizerské profily neměly sekci „Odkud vyjít",
 * přestože trasy pro ně spočítané byly — chyba nebyla vidět jako pád, jen jako
 * chybějící sekce. Klíčem je slug chaty, který je v korpusu jedinečný (hlídá
 * validátor), takže se mapy oblastí můžou spojit do jedné.
 */
export type PristupUsek = { znaceni: string; delkaKm: number }
export type Bod = { lat: number; lng: number }
export type Pristup = {
  vychoziBod: string
  typ: string
  delkaKm: number
  useky: PristupUsek[]
  podilNeznacenychProc: number
  kRucniKontrole: boolean
  /** Geometrie trasy (pro čáru na mapě). Seznam „odkud vyjít" ji nepoužívá. */
  geometrie?: Bod[]
  /** Převýšení (stoupání k chatě, m) — Mapy.com výškový model, verified:false. Dopočítá DATA-06 výšky. */
  prevyseni?: number
  /** Klesání po trase (m). */
  klesani?: number
  /** Odhad času chůze (min, DIN 33466 z délky a převýšení). */
  casMin?: number
  /** Výškový profil [km, výška] od nástupu k chatě (pro křivku). */
  vyskovyProfil?: [number, number][]
  /** 'katalog' = kurátorovaný nástup (s pořadím/zdroji), 'stredisko' = nejbližší středisko. */
  zdrojBodu?: 'katalog' | 'stredisko'
  /** Katalogová metadata (jen `zdrojBodu === 'katalog'`). */
  poradi?: number
  doprava?: string
  sezona?: string
  poznamka?: string
  zdroje?: string[]
}

type Katalog = { chaty?: { slug: string; pristupy: Pristup[] }[] }

let cache: Map<string, Pristup[]> | null = null

const nactiKatalog = (): Map<string, Pristup[]> => {
  if (cache) return cache
  cache = new Map()
  const koren = join(process.cwd(), 'data', 'trasy')
  if (!existsSync(koren)) return cache
  for (const oblast of readdirSync(koren)) {
    const cesta = join(koren, oblast, 'pristupove-trasy.json')
    if (!existsSync(cesta)) continue
    const katalog = JSON.parse(readFileSync(cesta, 'utf8')) as Katalog
    for (const c of katalog.chaty ?? []) cache.set(c.slug, c.pristupy)
  }
  return cache
}

/** Přístupové trasy chaty dle slugu (prázdné pole, když žádné nejsou). */
export const pristupyChaty = (slug: string): Pristup[] => nactiKatalog().get(slug) ?? []
