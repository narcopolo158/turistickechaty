/**
 * Kde je oblast v řetězu DATA-06 (scripts/data06-stav.ts).
 *
 * Vzniklo 30. 7. 2026: Michal pustil pro Jizerky poslední krok řetězu a dostal
 * červené „Chybí …/pristupove-trasy.json — nejdřív DATA-06 3b". Pravda, ale
 * k ničemu: 3b pro Jizerky spustit nejde, oblast nemá jediný publikovaný
 * profil chaty. Hláška ho poslala do slepé uličky a běh se tvářil rozbitě,
 * i když se jen sešlo pořadí prací.
 *
 * Testy drží ten rozdíl — a jsou o něm celé:
 *   • chybí vstup, ALE oblast na krok ještě nedošla → `chyba: false`
 *     (běh smí skončit v pořádku),
 *   • chybí vstup a oblast na krok došla → `chyba: true` (přeskočený krok,
 *     má spadnout).
 */
import { describe, expect, it } from 'vitest'

import { lzeDopocitatVysky, lzeRoutovat, popisStavu, stavRetezu, type StavRetezu } from '../../scripts/data06-stav'
import { oblastDleSlugu } from '../../scripts/oblasti'

const KRKONOSE = oblastDleSlugu('krkonose')
const JIZERKY = oblastDleSlugu('jizerske-hory')

/** Oblast, která má všechno až po přístupové trasy. */
const HOTOVO: StavRetezu = {
  znaceneTrasy: true,
  vychoziBody: true,
  profilu: 76,
  pristupoveTrasy: true,
}

describe('DATA-06 · stav řetězu', () => {
  it('oblast bez publikovaných profilů: routing NENÍ na řadě, a není to chyba', () => {
    const v = lzeRoutovat(JIZERKY, { ...HOTOVO, profilu: 0, pristupoveTrasy: false })
    expect(v.lze).toBe(false)
    expect(v).toMatchObject({ chyba: false })
    expect(v.lze === false && v.duvod).toContain('DATA-03')
  })

  it('oblast S profily, ale bez značených tras: přeskočený krok → chyba', () => {
    const v = lzeRoutovat(KRKONOSE, { ...HOTOVO, znaceneTrasy: false, pristupoveTrasy: false })
    expect(v).toMatchObject({ lze: false, chyba: true })
    expect(v.lze === false && v.duvod).toContain('export značených tras')
  })

  it('oblast S profily a trasami, ale bez výchozích bodů: taky přeskočený krok', () => {
    const v = lzeRoutovat(KRKONOSE, { ...HOTOVO, vychoziBody: false, pristupoveTrasy: false })
    expect(v).toMatchObject({ lze: false, chyba: true })
    expect(v.lze === false && v.duvod).toContain('výchozí body')
  })

  it('všechno na místě → routing se smí spustit', () => {
    expect(lzeRoutovat(KRKONOSE, { ...HOTOVO, pristupoveTrasy: false })).toEqual({ lze: true })
  })

  it('výšky: hotové přístupové trasy stačí', () => {
    expect(lzeDopocitatVysky(KRKONOSE, HOTOVO)).toEqual({ lze: true })
  })

  /**
   * Tohle je přesně Michalův případ: klikl na poslední krok u oblasti, která
   * je teprve na začátku. Důvod se musí přebrat z routingu — jinak by mu
   * hláška řekla „spusť 3b", což je právě to, co udělat nejde.
   */
  it('výšky u oblasti bez profilů: převezme důvod z routingu, ne „spusť 3b"', () => {
    const v = lzeDopocitatVysky(JIZERKY, {
      znaceneTrasy: true,
      vychoziBody: false,
      profilu: 0,
      pristupoveTrasy: false,
    })
    expect(v).toMatchObject({ lze: false, chyba: false })
    expect(v.lze === false && v.duvod).toContain('publikovaný profil')
    expect(v.lze === false && v.duvod).not.toContain('nejdřív routing')
  })

  it('výšky u oblasti s profily, ale bez tras: přeskočený krok → chyba', () => {
    const v = lzeDopocitatVysky(KRKONOSE, { ...HOTOVO, pristupoveTrasy: false })
    expect(v).toMatchObject({ lze: false, chyba: true })
    expect(v.lze === false && v.duvod).toContain('3b')
  })

  it('přehled stavu vypíše všechny čtyři řádky řetězu', () => {
    const text = popisStavu(JIZERKY, { ...HOTOVO, profilu: 0 })
    expect(text).toContain('Jizerské hory')
    expect(text).toContain('značené trasy')
    expect(text).toContain('výchozí body')
    expect(text).toContain('ŽÁDNÉ')
    expect(text).toContain('přístupové trasy')
  })

  it('stav se čte ze skutečného repa — Krkonoše mají profily i trasy', () => {
    const s = stavRetezu('krkonose')
    expect(s.profilu).toBeGreaterThan(0)
    expect(s.znaceneTrasy).toBe(true)
    expect(s.pristupoveTrasy).toBe(true)
  })

  it('neexistující oblast nespadne, jen nemá nic', () => {
    expect(stavRetezu('vymysl')).toEqual({
      znaceneTrasy: false,
      vychoziBody: false,
      profilu: 0,
      pristupoveTrasy: false,
    })
  })
})
