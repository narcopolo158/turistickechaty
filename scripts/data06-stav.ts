/**
 * Kde je oblast v řetězu DATA-06 — a co má smysl spustit teď.
 *
 * PROČ TOHLE VZNIKLO (30. 7. 2026): Michal pustil pro Jizerky poslední krok
 * řetězu (výšky přístupových tras) a workflow zčervenalo hláškou „Chybí
 * data/trasy/jizerske-hory/pristupove-trasy.json — nejdřív DATA-06 3b".
 * Hláška byla pravdivá a k ničemu: 3b pro Jizerky spustit NEJDE, protože
 * oblast zatím nemá jediný publikovaný profil chaty (75 kandidátů čeká na
 * triáž). Poslala ho tedy do slepé uličky.
 *
 * Řetěz DATA-06 má pět kroků a každý stojí na výstupu předchozího:
 *   1. značené trasy   (Overpass)      → data/trasy/<o>/_overpass-trasy.json
 *   2. výchozí body    (Overpass)      → data/oblasti/<o>/vychozi-body-kandidati.json
 *   —  publikované profily chat        → data/chaty/<o>/*.yaml  (DATA-03, ruční triáž)
 *   3b. přístupové trasy (routing)     → data/trasy/<o>/pristupove-trasy.json
 *   5. výšky a čas     (Mapy.com)      → tentýž soubor, doplněný
 *
 * Podstatný je rozdíl mezi dvěma stavy, které vypadají stejně (chybí vstup):
 *   • PŘESKOČENÝ KROK — oblast na krok má, jen se nespustil ten před ním.
 *     To je chyba pořadí a má spadnout červeně.
 *   • JEŠTĚ NENÍ NA ŘADĚ — oblast nemá publikované profily, takže routing
 *     ani výšky nemají nad čím počítat. To není chyba běhu; červený křížek
 *     by tvrdil, že se něco pokazilo, a přitom se jen sešlo pořadí prací.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { cestyOblasti, type OblastKonfig } from './oblasti'

export type StavRetezu = {
  znaceneTrasy: boolean
  vychoziBody: boolean
  /** Kolik publikovaných profilů chat oblast má (kandidáti se nepočítají). */
  profilu: number
  pristupoveTrasy: boolean
}

const pocetProfilu = (dir: string): number =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')).length : 0

export const stavRetezu = (slug: string): StavRetezu => {
  const c = cestyOblasti(slug)
  return {
    znaceneTrasy: existsSync(join(c.trasy, '_overpass-trasy.json')),
    vychoziBody: existsSync(join(c.oblast, 'vychozi-body-kandidati.json')),
    profilu: pocetProfilu(c.chaty),
    pristupoveTrasy: existsSync(join(c.trasy, 'pristupove-trasy.json')),
  }
}

/** Čitelný přehled do reportu běhu — ať je vidět, kde oblast stojí. */
export const popisStavu = (oblast: OblastKonfig, s: StavRetezu): string =>
  [
    `Stav řetězu DATA-06 pro oblast ${oblast.nazev} (${oblast.slug}):`,
    `  1. značené trasy ............ ${s.znaceneTrasy ? 'jsou' : 'CHYBÍ'}`,
    `  2. výchozí body ............. ${s.vychoziBody ? 'jsou' : 'CHYBÍ'}`,
    `  —  publikované profily chat . ${s.profilu || 'ŽÁDNÉ (kandidáti čekají na triáž DATA-03)'}`,
    `  3b. přístupové trasy ........ ${s.pristupoveTrasy ? 'jsou' : 'CHYBÍ'}`,
  ].join('\n')

export type Verdikt =
  /** Krok se smí spustit. */
  | { lze: true }
  /**
   * Krok se spustit nedá. `chyba: false` znamená „ještě není na řadě" —
   * očekávaný stav, běh smí skončit v pořádku; `chyba: true` je přeskočený
   * krok, tedy chyba pořadí.
   */
  | { lze: false; chyba: boolean; duvod: string }

/**
 * Smí se spustit routing přístupových tras (3b)? Potřebuje značené trasy,
 * výchozí body a hlavně aspoň jeden publikovaný profil — bez chaty není
 * kam trasu počítat.
 */
export const lzeRoutovat = (oblast: OblastKonfig, s: StavRetezu = stavRetezu(oblast.slug)): Verdikt => {
  if (!s.profilu) {
    return {
      lze: false,
      chyba: false,
      duvod:
        `Oblast ${oblast.nazev} zatím nemá žádný publikovaný profil chaty (data/chaty/${oblast.slug}/), ` +
        `takže není ke které chatě trasu počítat. Nejdřív triáž kandidátů (DATA-03) a povýšení do data/chaty/, ` +
        `pak teprve routing. Není to chyba běhu — jen na tenhle krok ještě nedošlo.`,
    }
  }
  if (!s.znaceneTrasy) {
    return {
      lze: false,
      chyba: true,
      duvod: `Chybí značené trasy oblasti — spusť workflow „DATA-06: export značených tras (dle oblasti)" a vyber ${oblast.slug}.`,
    }
  }
  if (!s.vychoziBody) {
    return {
      lze: false,
      chyba: true,
      duvod: `Chybí výchozí body oblasti — spusť workflow „DATA-06: výchozí body oblasti" a vyber ${oblast.slug}.`,
    }
  }
  return { lze: true }
}

/** Smí se dopočítávat výšky (krok 5)? Potřebuje hotové přístupové trasy. */
export const lzeDopocitatVysky = (
  oblast: OblastKonfig,
  s: StavRetezu = stavRetezu(oblast.slug),
): Verdikt => {
  if (s.pristupoveTrasy) return { lze: true }
  const routing = lzeRoutovat(oblast, s)
  // Když routing sám ještě není na řadě, není na řadě ani krok po něm —
  // a důvod se přebírá, ať čtenář nemusí luštit dva kroky dozadu.
  if (!routing.lze) return routing
  return {
    lze: false,
    chyba: true,
    duvod: `Chybí přístupové trasy oblasti — nejdřív routing DATA-06 3b (npx tsx scripts/data06-pristupove-trasy.ts --oblast ${oblast.slug}).`,
  }
}
