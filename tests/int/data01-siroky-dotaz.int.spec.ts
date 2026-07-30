/**
 * DATA-01: proč jizerské boudy vypadly z exportu (nález Michala 30. 7. 2026:
 * „překvapilo mě, že v seznamu nejsou známé jizerské chaty jako Smědava,
 * Knajpa, chaty v osadě Jizerka").
 *
 * Nebyl to bbox — ten Jizerky pokrývá celé. Byl to DOTAZ: ptal se na tři
 * „hut" tagy, což v Krkonoších stačí (tamní boudy jsou v OSM skoro vždy
 * `alpine_hut`), ale v Jizerkách je táž věc mapovaná jako restaurace, hotel
 * nebo penzion. Doklad je v našich vlastních datech: dotaz na rozhledny bere
 * okolní občerstvení podle `amenity` a vytáhl „Chata Proseč", „Chata
 * Bramberk", „Ski Chata" (restaurant), „Slovanka" (guest_house), „U Čápa"
 * (hotel) — objekty, které hutový dotaz minul.
 *
 * Testy proto hlídají obojí: že dotaz civilně tagované boudy chytí, a že se
 * přitom nerozlil na všechny hospody v okně (bbox obsahuje Liberec
 * i Jablonec).
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { jmenaZKatalogu, overpassDotaz, overpassDotazDleJmen } from '../../scripts/data01-overpass-krkonose'
import { oblastDleSlugu } from '../../scripts/oblasti'

const KATALOG = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')
const dotaz = overpassDotaz('CZ', '50.73,15.05,51.02,15.45')

describe('rozšířený dotaz DATA-01', () => {
  it('pořád bere hutové tagy — to, co fungovalo v Krkonoších, se neruší', () => {
    for (const tag of ['alpine_hut', 'wilderness_hut', 'hut']) expect(dotaz).toContain(tag)
  })

  it('nově bere i `chalet` — chyběl i v Krkonoších, jen se to neprojevilo', () => {
    expect(dotaz).toContain('chalet')
  })

  it('bere restauraci i penzion, ale JEN když má v názvu slovo boudy', () => {
    // Bez téhle podmínky by dotaz v okně s Libercem a Jabloncem vrátil
    // stovky hospod a triáž by se v nich utopila.
    const radky = dotaz.split('\n').filter((r) => r.includes('amenity') || r.includes('guest_house'))
    expect(radky.length).toBeGreaterThan(0)
    for (const r of radky) expect(r, r).toContain('"name"~')
  })

  it('slova boudy pokrývají české, polské i německé názvosloví', () => {
    for (const slovo of ['chata', 'bouda', 'schronisko', 'baude']) expect(dotaz).toContain(slovo)
  })

  it('hledání jména je case-insensitive — OSM píše „Chata" i „chata"', () => {
    expect(dotaz).toMatch(/"name"~"[^"]+",i/u)
  })
})

describe('dohledávka podle jmen z katalogu', () => {
  const jmena = jmenaZKatalogu(KATALOG, oblastDleSlugu('jizerske-hory').katalogPohori)

  it('vytáhne jizerské objekty, které Michal postrádal', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena).toContain('Horská chata Smědava')
    expect(jmena).toContain('Kiosek Knajpa')
    expect(jmena).toContain('Pyramida Jizerka')
  })

  it('přidává i zkrácené jádro názvu — OSM říká „Smědava", katalog „Horská chata Smědava"', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena).toContain('Smědava')
    expect(jmena).toContain('Knajpa')
  })

  it('nebere objekty z jiných pohoří — jinak by dotaz tahal Krkonoše do Jizerek', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena.some((j) => j.includes('Luční'))).toBe(false)
  })

  it('bez konfigurace katalogu vrací prázdno, ne výjimku', () => {
    expect(jmenaZKatalogu(KATALOG, undefined)).toEqual([])
    expect(jmenaZKatalogu('/neexistuje.json', ['Jizerské hory'])).toEqual([])
  })

  it('jména se do dotazu vkládají escapovaná — závorka v názvu by rozbila regex', () => {
    const d = overpassDotazDleJmen('CZ', ['Chata (stará)', 'Smědava'])
    expect(d).toContain('\\(stará\\)')
    expect(d).toContain('Smědava')
  })

  it('je to jeden dotaz na všechna jména, ne N dotazů', () => {
    const d = overpassDotazDleJmen('CZ', ['A', 'B', 'C'])
    expect(d.match(/^nwr/gmu)?.length).toBe(1)
    expect(d).toContain('A|B|C')
  })
})

describe('katalog proti tomu, co v repu opravdu je', () => {
  it('objekty, které Michal jmenoval, katalog opravdu vede v Jizerských horách', () => {
    if (!existsSync(KATALOG)) return
    const katalog = JSON.parse(readFileSync(KATALOG, 'utf8')) as { Pohoří?: string; Název?: string }[]
    const jizerske = katalog.filter((z) => z.Pohoří === 'Jizerské hory').map((z) => z.Název)
    expect(jizerske).toContain('Horská chata Smědava')
    expect(jizerske).toContain('Chata Jizerka')
  })
})
