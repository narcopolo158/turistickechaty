/**
 * Patička webu (SiteFooter) — brand řádek dle prototypu + tiráž „Zdroje dat".
 *
 * Dokládá mini-krok DATA-01: viditelná atribuce OpenStreetMap dle licence ODbL
 * (odkaz na openstreetmap.org/copyright i na text licence) a řádné uvedení
 * mapových podkladů Mapy.com — text atribuce shodný s fallbackem mapy
 * („© Seznam.cz a.s. a další", viz MapaChat).
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import SiteFooter from '../../src/components/SiteFooter'

afterEach(cleanup)

describe('SiteFooter', () => {
  it('drží brand řádek z prototypu beze změny', () => {
    render(<SiteFooter />)
    expect(screen.getByText('Turistické chaty')).toBeTruthy()
    expect(
      screen.getByText('průvodce všemi horskými chatami · Krkonoše → Česko → Slovensko → Alpy'),
    ).toBeTruthy()
    expect(screen.getByText('MAPY.COM · KČT · SIL OFL FONTY')).toBeTruthy()
  })

  it('tiráž atribuuje OpenStreetMap dle ODbL (odkazy na copyright i licenci)', () => {
    render(<SiteFooter />)
    const osm = screen.getByRole('link', { name: 'OpenStreetMap' })
    expect(osm.getAttribute('href')).toBe('https://www.openstreetmap.org/copyright')
    const odbl = screen.getByRole('link', { name: 'ODbL' })
    expect(odbl.getAttribute('href')).toBe('https://opendatacommons.org/licenses/odbl/1-0/')
    // povinná formulace atribuce
    expect(screen.getByText(/© přispěvatelé\s+OpenStreetMap/)).toBeTruthy()
  })

  it('tiráž uvádí mapové podklady Mapy.com shodně s atribucí na mapě', () => {
    render(<SiteFooter />)
    const mapy = screen.getByRole('link', { name: 'Mapy.com' })
    expect(mapy.getAttribute('href')).toBe('https://api.mapy.com/copyright')
    expect(screen.getByText(/© Seznam\.cz a\.s\. a\s+další/)).toBeTruthy()
  })

  it('tiráž vysvětluje, že zdroje údajů jsou přímo na profilech', () => {
    render(<SiteFooter />)
    expect(screen.getByText(/každý údaj o chatě má svůj zdroj uvedený přímo na\s+profilu/)).toBeTruthy()
    expect(screen.getByText('Zdroje dat:')).toBeTruthy()
  })
})
