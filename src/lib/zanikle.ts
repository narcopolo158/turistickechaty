import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Atlas zaniklých chat (DATA-11) — načtení pro stránku `/zanikle`. Data generuje
 * `scripts/data11-zanikle.ts` z katalogu do `data/zanikle/krkonose.json`. Vše
 * `verified:false` se zdrojem; samostatná kategorie (nemíchá se do živého
 * katalogu chat). Historické snímky sem nepatří — řeší se zvlášť (práva).
 */
export type ZaniklaChata = {
  id: string
  slug: string
  nazev: string
  nazvyHistoricke: string[]
  zeme: string
  oblastCast: string | null
  lat: number | null
  lng: number | null
  gpsPresnost: string | null
  rokVzniku: string | null
  rokZaniku: string | null
  pricinaZaniku: string | null
  coJeDnes: string | null
  patrnePozustatky: string | null
  pristupnost: string | null
  pristupnostPoznamka: string | null
  popis: string | null
  jistota: string
  zdroje: string[]
}

let cache: ZaniklaChata[] | null = null

/** Všechny zaniklé chaty (Česko první, dle názvu) — prázdné pole, když data chybí. */
export const zanikleChaty = (): ZaniklaChata[] => {
  if (cache) return cache
  const cesta = join(process.cwd(), 'data', 'zanikle', 'krkonose.json')
  cache = existsSync(cesta) ? ((JSON.parse(readFileSync(cesta, 'utf8')).chaty as ZaniklaChata[]) ?? []) : []
  return cache
}
