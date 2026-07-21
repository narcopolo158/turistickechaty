import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Přístupové trasy k chatám (DATA-06 increment 3b) — načtení pro profil.
 * Data počítá `scripts/data06-pristupove-trasy.ts` do
 * `data/trasy/krkonose/pristupove-trasy.json` (routing po značených KČT trasách
 * z kurátorovaných středisek). Tady se jen čtou pro server-render profilu.
 * Geometrie (pro mapu) se zatím nenačítá — seznam „odkud vyjít" ji nepotřebuje.
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
}

type Katalog = { chaty?: { slug: string; pristupy: Pristup[] }[] }

let cache: Map<string, Pristup[]> | null = null

const nactiKatalog = (): Map<string, Pristup[]> => {
  if (cache) return cache
  cache = new Map()
  const cesta = join(process.cwd(), 'data', 'trasy', 'krkonose', 'pristupove-trasy.json')
  if (existsSync(cesta)) {
    const katalog = JSON.parse(readFileSync(cesta, 'utf8')) as Katalog
    for (const c of katalog.chaty ?? []) cache.set(c.slug, c.pristupy)
  }
  return cache
}

/** Přístupové trasy chaty dle slugu (prázdné pole, když žádné nejsou). */
export const pristupyChaty = (slug: string): Pristup[] => nactiKatalog().get(slug) ?? []
