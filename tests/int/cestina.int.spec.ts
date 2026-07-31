/**
 * Skloňování ve větách webu (src/lib/cestina.ts).
 *
 * PROČ TENHLE TEST EXISTUJE: čeština je v tomhle projektu opakovaný zdroj
 * TICHÝCH chyb — nic nespadne, jen se na stránce objeví „2 chat vedeme bez
 * razítka" nebo „chaty v Jizerské hory". Obojí našel Michal okem, ne CI.
 * Testují se proto hranice tvarů (1 / 2–4 / 5+) a nouzové vazby pro případ,
 * že oblast skloňované tvary v datech nemá.
 */
import { describe, expect, it } from 'vitest'

import { tvarChaty, tvarOblasti, tvarProfily, vOblastech } from '@/lib/cestina'

const KRKONOSE = { nazev: 'Krkonoše', typ: 'pohori' as const, druhy: 'Krkonoš', sesty: 'Krkonoších' }
const JIZERKY = {
  nazev: 'Jizerské hory',
  typ: 'pohori' as const,
  druhy: 'Jizerských hor',
  sesty: 'Jizerských horách',
}
const CESKY_RAJ = {
  nazev: 'Český ráj',
  typ: 'turisticka-oblast' as const,
  druhy: 'Českého ráje',
  sesty: 'Českém ráji',
}

describe('tvarChaty', () => {
  it('1. pád: 1 chata / 2 chaty / 5 chat', () => {
    expect(tvarChaty(1)).toBe('chata')
    expect(tvarChaty(2)).toBe('chaty')
    expect(tvarChaty(4)).toBe('chaty')
    expect(tvarChaty(5)).toBe('chat')
    expect(tvarChaty(89)).toBe('chat')
  })

  it('4. pád („vedeme N chat"): 1 chatu / 2 chaty / 5 chat', () => {
    expect(tvarChaty(1, 'ctvrty')).toBe('chatu')
    expect(tvarChaty(3, 'ctvrty')).toBe('chaty')
    expect(tvarChaty(12, 'ctvrty')).toBe('chat')
  })

  /**
   * 2. pád má jen dva tvary a láme se JINDE než ostatní: „u 2 chat", ne
   * „u 2 chaty". Právě tuhle hranici perex homepage potřebuje („U 89 chat
   * vedeme…") a právě na ní by se dvojka chytla.
   */
  it('2. pád („u N chat"): 1 chaty / 2 chat / 5 chat', () => {
    expect(tvarChaty(1, 'druhy')).toBe('chaty')
    expect(tvarChaty(2, 'druhy')).toBe('chat')
    expect(tvarChaty(4, 'druhy')).toBe('chat')
    expect(tvarChaty(89, 'druhy')).toBe('chat')
  })

  it('nula mluví jako množné číslo („0 chat")', () => {
    expect(tvarChaty(0)).toBe('chat')
    expect(tvarChaty(0, 'druhy')).toBe('chat')
  })
})

describe('tvarProfily', () => {
  it('1 profil / 2 profily / 5 profilů', () => {
    expect(tvarProfily(1)).toBe('profil')
    expect(tvarProfily(4)).toBe('profily')
    expect(tvarProfily(89)).toBe('profilů')
  })
})

describe('vOblastech', () => {
  it('skládá 6. pád z dat oblasti', () => {
    expect(vOblastech([KRKONOSE])).toBe('v Krkonoších')
    expect(vOblastech([KRKONOSE, JIZERKY])).toBe('v Krkonoších a Jizerských horách')
    expect(vOblastech([KRKONOSE, JIZERKY, CESKY_RAJ])).toBe(
      'v Krkonoších, Jizerských horách a Českém ráji',
    )
  })

  /**
   * Když nová oblast tvary v datech nemá, věta se NESMÍ zkomolit — přepne se
   * na vazbu, které stačí 1. pád. Radši úřednější, ale správně: „v Jizerské
   * hory" by byl přesně ten druh chyby, kterou nikdo nenahlásí jako bug.
   */
  it('bez skloňování v datech volí opis v 1. pádu, nikdy nekomolí', () => {
    const bezTvaru = { nazev: 'Beskydy', typ: 'pohori' as const }
    expect(vOblastech([bezTvaru])).toBe('v oblasti Beskydy')
    expect(vOblastech([KRKONOSE, bezTvaru])).toBe('v oblastech Krkonoše a Beskydy')
  })

  it('bez oblastí vrací prázdno (věta si pak poradí sama)', () => {
    expect(vOblastech([])).toBe('')
  })
})

describe('tvarOblasti', () => {
  it('dokud jsou všechny oblasti pohoří, mluví se o pohořích', () => {
    expect(tvarOblasti([KRKONOSE, JIZERKY])).toBe('pohoří')
    expect(tvarOblasti([KRKONOSE, JIZERKY], 'sesty')).toBe('pohoří')
    expect(tvarOblasti([KRKONOSE, JIZERKY], 'pocet')).toBe('pohoří')
  })

  /**
   * Až na web přijde Český ráj (v datech `turisticka-oblast`, protože pohoří
   * není), musí se slovo změnit samo — jinak by rozcestník lhal a nic by
   * nespadlo.
   */
  it('s turistickou oblastí přepne na neutrální „oblast" ve správném tvaru', () => {
    expect(tvarOblasti([KRKONOSE, CESKY_RAJ])).toBe('oblasti')
    expect(tvarOblasti([KRKONOSE, CESKY_RAJ], 'sesty')).toBe('oblastech')
    expect(tvarOblasti([KRKONOSE, CESKY_RAJ], 'pocet')).toBe('oblasti') // 2 oblasti
    expect(tvarOblasti([CESKY_RAJ], 'pocet')).toBe('oblast') // 1 oblast
    expect(
      tvarOblasti([KRKONOSE, JIZERKY, CESKY_RAJ, KRKONOSE, JIZERKY], 'pocet'),
    ).toBe('oblastí') // 5 oblastí
  })

  it('prázdný seznam se netváří jako pohoří', () => {
    expect(tvarOblasti([])).toBe('oblasti')
  })
})
