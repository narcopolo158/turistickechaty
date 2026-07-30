import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

const cache = new Map<string, ZaniklaChata[]>()

const nactiOblast = (oblast: string): ZaniklaChata[] => {
  const hotovo = cache.get(oblast)
  if (hotovo) return hotovo
  const cesta = join(process.cwd(), 'data', 'zanikle', `${oblast}.json`)
  const chaty = existsSync(cesta)
    ? ((JSON.parse(readFileSync(cesta, 'utf8')).chaty as ZaniklaChata[]) ?? [])
    : []
  cache.set(oblast, chaty)
  return chaty
}

/**
 * Zaniklé chaty JEDNÉ oblasti (`data/zanikle/<oblast>.json`).
 *
 * Argument je povinný záměrně. Do 30. 7. 2026 funkce brala vždycky
 * `krkonose.json`, protože jiná data neexistovala — a v den, kdy vznikla
 * třetí oblast (Ještědský hřbet), z toho byla tichá nepravda: stránka
 * úplně prázdné oblasti hlásila „17 zaniklých v Atlasu" a v sekci
 * ukazovala Bodenwiesbaude a Českou boudu na Sněžce, tedy Krkonoše.
 * Číslo z cizího pohoří je horší než nula, protože vypadá jako obsah.
 */
export const zanikleChaty = (oblast: string): ZaniklaChata[] => nactiOblast(oblast)

/** Celý Atlas přes všechny oblasti, které data mají — pro stránku `/zanikle`. */
export const zanikleChatyVse = (): ZaniklaChata[] => {
  const adresar = join(process.cwd(), 'data', 'zanikle')
  if (!existsSync(adresar)) return []
  return readdirSync(adresar)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .flatMap((f) => nactiOblast(f.replace(/\.json$/u, '')))
}
