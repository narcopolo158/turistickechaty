/**
 * DATA-11: atlas zaniklých chat. Testuje převod řádku katalogu na záznam
 * (slug, historické názvy, sběr a dedup zdrojů, „neuvedeno" → null), GPS sanity
 * (mimo bbox Krkonoš → souřadnice se zahodí) a řazení (Česko první). Nad
 * podvrženými daty, bez souborů.
 */
import { describe, expect, it } from 'vitest'

import { nactiKatalog, zaznamZRadku } from '../../scripts/data11-zanikle'

const radek = (over: Record<string, string> = {}): Record<string, string> => ({
  id: 'ZANIK-001',
  nazev: 'Obří bouda',
  nazvy_historicke: 'Riesenbaude; Obří bouda',
  zeme: 'Česko',
  pohori: 'Krkonoše',
  oblast_cast: 'Obří pláň',
  lat: '50.7389',
  lng: '15.7290',
  gps_presnost: 'přesná',
  gps_zdroj: 'https://mapy.cz/x',
  rok_vzniku: '1847',
  rok_vzniku_zdroj: 'https://a.cz/',
  rok_zaniku: '1982',
  rok_zaniku_zdroj: 'https://a.cz/',
  pricina_zaniku: 'demolice',
  pricina_zdroj: 'https://b.cz/',
  co_je_dnes: 'zbytky základů',
  co_je_dnes_zdroj: 'neuvedeno',
  patrne_pozustatky: 'ano',
  pristupnost: 'na značené trase',
  pristupnost_poznamka: 'neuvedeno',
  popis: 'Obří boudu postavil roku 1847 kupec Mittlöhner.',
  popis_zdroj: 'https://a.cz/',
  jistota: 'A',
  zdroj_1: 'https://a.cz/',
  zdroj_2: 'https://c.cz/',
  zdroj_3: 'neuvedeno',
  overeno_k: '2026-07-22',
  ...over,
})

describe('DATA-11 · zaznamZRadku', () => {
  it('mapuje pole, slug z názvu a rozdělí historické názvy', () => {
    const { z } = zaznamZRadku(radek())
    expect(z.slug).toBe('obri-bouda')
    expect(z.nazvyHistoricke).toEqual(['Riesenbaude', 'Obří bouda'])
    expect(z.lat).toBeCloseTo(50.7389, 3)
    expect(z.jistota).toBe('A')
  })

  it('„neuvedeno" → null', () => {
    const { z } = zaznamZRadku(radek({ oblast_cast: 'neuvedeno', rok_zaniku: 'neuvedeno' }))
    expect(z.oblastCast).toBeNull()
    expect(z.rokZaniku).toBeNull()
  })

  it('sesbírá a deduplikuje zdroje (jen http), vynechá „neuvedeno"', () => {
    const { z } = zaznamZRadku(radek())
    expect(z.zdroje).toContain('https://a.cz/')
    expect(z.zdroje).toContain('https://c.cz/')
    expect(z.zdroje.filter((u) => u === 'https://a.cz/')).toHaveLength(1) // dedup
    expect(z.zdroje.some((u) => u.includes('neuvedeno'))).toBe(false)
  })

  it('GPS „neuvedeno" → null bez příznaku mimo bbox', () => {
    const { z, mimoBbox } = zaznamZRadku(radek({ lat: 'neuvedeno', lng: 'neuvedeno' }))
    expect(z.lat).toBeNull()
    expect(mimoBbox).toBe(false)
  })

  it('GPS mimo bbox Krkonoš → souřadnice se zahodí + příznak', () => {
    const { z, mimoBbox } = zaznamZRadku(radek({ lat: '49.0', lng: '14.0' }))
    expect(mimoBbox).toBe(true)
    expect(z.lat).toBeNull()
  })
})

describe('DATA-11 · nactiKatalog', () => {
  it('řadí Česko první, pak Polsko', () => {
    const csv = [
      'id,nazev,nazvy_historicke,zeme,pohori,oblast_cast,lat,lng,gps_presnost,gps_zdroj,rok_vzniku,rok_vzniku_zdroj,rok_zaniku,rok_zaniku_zdroj,pricina_zaniku,pricina_zdroj,co_je_dnes,co_je_dnes_zdroj,patrne_pozustatky,pristupnost,pristupnost_poznamka,popis,popis_zdroj,jistota,zdroj_1,zdroj_2,zdroj_3,overeno_k',
      'Z2,Schronisko X,,Polsko,Karkonosze,,neuvedeno,neuvedeno,,,,,,,,,,,,,,,,B,,,,2026-07-22',
      'Z1,Bobí bouda,,Česko,Krkonoše,,neuvedeno,neuvedeno,,,,,,,,,,,,,,,,A,,,,2026-07-22',
    ].join('\n')
    const { chaty } = nactiKatalog(csv)
    expect(chaty.map((c) => c.zeme)).toEqual(['Česko', 'Polsko'])
  })
})
