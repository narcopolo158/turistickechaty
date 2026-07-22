/**
 * DATA-10: turistické známky a vizitky u chat. Testuje převod řádku vazební
 * tabulky na produkt (mapování systému, zahození bez čísla/URL, „neuvedeno")
 * a seskupení katalogu dle názvu chaty. Nad podvrženými daty, bez souborů.
 */
import { describe, expect, it } from 'vitest'

import { nactiKatalog, produktZRadku } from '../../scripts/data10-znamky-vizitky'

const radek = (over: Record<string, string> = {}): Record<string, string> => ({
  'ID chaty': 'HUT-0001',
  'Název chaty': 'Luční bouda',
  Systém: 'Turistické známky',
  'Číslo / kód': '11',
  'Oficiální název': 'Luční bouda',
  'Detail URL': 'https://www.turisticke-znamky.cz/znamky/lucni-bouda-c11',
  Stav: 'vedeno v oficiálním seznamu',
  Jistota: 'A',
  Poznámka: 'neuvedeno',
  ...over,
})

describe('DATA-10 · produktZRadku', () => {
  it('mapuje Turistické známky → znamka', () => {
    const p = produktZRadku(radek())
    expect(p).toMatchObject({ system: 'znamka', cislo: '11', jistota: 'A' })
    expect(p?.poznamka).toBeUndefined() // „neuvedeno" se zahodí
  })

  it('mapuje vizitky / Wander Card → vizitka', () => {
    const p = produktZRadku(radek({ Systém: 'Turistické vizitky / Wander Card', 'Číslo / kód': 'CZ-411', 'Detail URL': 'https://cs.wander-book.com/lucni-bouda-m211.htm' }))
    expect(p?.system).toBe('vizitka')
    expect(p?.cislo).toBe('CZ-411')
  })

  it('zahodí řádek bez čísla nebo bez http URL', () => {
    expect(produktZRadku(radek({ 'Číslo / kód': '' }))).toBeNull()
    expect(produktZRadku(radek({ 'Detail URL': 'neuvedeno' }))).toBeNull()
  })

  it('přenese poznámku, když není „neuvedeno"', () => {
    const p = produktZRadku(radek({ Poznámka: 'vyřazena z projektu 2025' }))
    expect(p?.poznamka).toBe('vyřazena z projektu 2025')
  })
})

describe('DATA-10 · nactiKatalog', () => {
  const csv = [
    'ID chaty,Název chaty,Systém,Číslo / kód,Oficiální název,Detail URL,Stav,Jistota,Poznámka',
    'HUT-0001,Luční bouda,Turistické známky,11,Luční bouda,https://www.turisticke-znamky.cz/znamky/lucni-bouda-c11,vedeno,A,neuvedeno',
    'HUT-0001,Luční bouda,Turistické vizitky / Wander Card,CZ-411,Luční bouda,https://cs.wander-book.com/lucni-bouda-m211.htm,aktivní,A,neuvedeno',
    'HUT-0002,Labská bouda,Turistické známky,74,Labská bouda,https://www.turisticke-znamky.cz/znamky/labska-bouda-c74,vedeno,A,neuvedeno',
  ].join('\n')

  it('seskupí produkty dle názvu chaty', () => {
    const m = nactiKatalog(csv)
    expect(m.get('Luční bouda')).toHaveLength(2)
    expect(m.get('Labská bouda')).toHaveLength(1)
    expect(m.get('Luční bouda')!.map((p) => p.system)).toEqual(['znamka', 'vizitka'])
  })

  it('prázdný CSV → prázdná mapa', () => {
    expect(nactiKatalog('').size).toBe(0)
  })
})
