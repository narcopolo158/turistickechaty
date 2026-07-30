/**
 * Známková místa z exportu, který Michal poslal 30. 7. 2026
 * (`data/externi/znamkova-mista-2026/`).
 *
 * Formát je člověkem čitelný výpis, ne strojový: hlavička „No. 42 Název
 * [kategorie]" a pod ní odrážky prodejních míst. Testy hlídají tři věci,
 * které se při tolerantním parsování snadno pokazí tiše:
 *   1. prodejní místa se přiřadí SVÉ známce (jinak by se sesypala k první);
 *   2. závorka na konci je jednou odkaz („jested.cz") a jednou upřesnění
 *      místa („(u kostela)", „(parkoviště)") — spletení jednoho za druhé
 *      by udělalo z poznámky odkaz a naopak;
 *   3. co se nerozparsuje, se přeskočí a nedomýšlí.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { nactiZnamkovaMista } from '../../scripts/data22-znamky-oficialni-seznam'

const SOUBOR = join(process.cwd(), 'data', 'externi', 'znamkova-mista-2026', 'znamkova-mista-2026-07-30.txt')

describe('parser známkových míst', () => {
  const mista = nactiZnamkovaMista(readFileSync(SOUBOR, 'utf8'))

  it('přečte všech pět míst z exportu i s číslem známky', () => {
    expect(mista.map((m) => m.cislo)).toEqual(['39', '40', '42', '1296', '1935'])
  })

  it('kategorie vydavatele se rozdělí, hranaté závorky nezůstanou v názvu', () => {
    const jested = mista.find((m) => m.cislo === '40')!
    expect(jested.nazev).toBe('Ještěd 1012m')
    expect(jested.kategorie).toContain('Ještědský hřbet')
    expect(jested.kategorie).toContain('Rozhledny a vyhlídky')
    expect(mista.every((m) => !m.nazev.includes('['))).toBe(true)
  })

  it('prodejní místa patří své známce, ne té první', () => {
    const smedava = mista.find((m) => m.cislo === '42')!
    expect(smedava.prodejni).toHaveLength(5)
    expect(smedava.prodejni[0].nazev).toBe('Horská chata Smědava, Bílý Potok')
    expect(smedava.prodejni[0].url).toBe('http://chatasmedava.cz/')
    // Hubertka má jiná prodejní místa a nesmí je zdědit.
    expect(mista.find((m) => m.cislo === '1935')!.prodejni).toHaveLength(7)
  })

  it('doména bez schématu je odkaz, upřesnění místa v závorce není', () => {
    const jested = mista.find((m) => m.cislo === '40')!
    expect(jested.prodejni[0]).toEqual({ nazev: 'Horský hotel Ještěd', url: 'jested.cz' })
    const kiosek = jested.prodejni.find((p) => p.nazev.startsWith('Kiosek u Lanovky'))!
    expect(kiosek.url, 'závorka „(parkoviště)" není odkaz').toBeUndefined()
    const trafika = mista.find((m) => m.cislo === '42')!.prodejni.find((p) => p.nazev.startsWith('Trafika'))!
    expect(trafika.nazev).toContain('(u kostela)')
    expect(trafika.url).toBe('www.trafikajosefuvdul.websnadno.cz')
  })

  it('prázdný i cizí text vrací prázdno, ne výjimku', () => {
    expect(nactiZnamkovaMista('')).toEqual([])
    expect(nactiZnamkovaMista('Turistická známková místa\n===\n\n')).toEqual([])
    // Odrážka bez předchozí hlavičky se zahodí — nemá kam patřit.
    expect(nactiZnamkovaMista('- Někde něco (www.x.cz)')).toEqual([])
  })
})

/**
 * Věcný obsah exportu, na kterém stojí dvě rozhodnutí z 30. 7. 2026:
 * Smědava do Jizerek patří (a chyběla nám), a známka 1935 rozsoudila dvojici
 * jmenovců Hubertka.
 */
describe('co z exportu vyplývá pro korpus', () => {
  const mista = nactiZnamkovaMista(readFileSync(SOUBOR, 'utf8'))

  it('Smědava je vedena jako známkové místo v Jizerských horách', () => {
    const m = mista.find((x) => x.nazev.includes('Smědava'))!
    expect(m.cislo).toBe('42')
    expect(m.kategorie).toContain('Jizerské hory')
  })

  it('známka Hubertky nese oblast v názvu — to je ten rozlišovač jmenovců', () => {
    const m = mista.find((x) => x.cislo === '1935')!
    expect(m.nazev).toContain('Jizerské hory')
    // Prodejní místo dává i adresu, kterou lze proti kandidátovi ověřit.
    expect(m.prodejni.some((p) => p.nazev.includes('Bílý Potok 370'))).toBe(true)
  })

  it('tři místa jsou z Ještědského hřbetu — jiné pohoří, ne chyba exportu', () => {
    const jestedske = mista.filter((m) => m.kategorie.includes('Ještědský hřbet'))
    expect(jestedske.map((m) => m.cislo)).toEqual(['39', '40'])
  })
})
