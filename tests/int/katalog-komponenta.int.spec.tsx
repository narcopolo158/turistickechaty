/**
 * F1b: KatalogClient — render a interakce dle funkčního prototypu handoffu:
 * karty s poctivými „—", chips filtrují (prázdný stav s resetem), přepínač
 * zobrazení, řazení a zápis stavu do URL (pushState/replaceState).
 * MapaChat se mockuje (Leaflet v jsdom neběží) — mapový pohled jen dokládá,
 * že markery = přefiltrovaná množina s GPS.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IndexChata } from '@/lib/index-chat'
import type { MapovaChata } from '@/components/MapaChat'

// URL jako zdroj pravdy: mock useSearchParams čte přímo window.location.search,
// takže pushState/replaceState v komponentě se projeví po re-renderu.
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

// Leaflet v jsdom neběží — mapa se nahrazuje výpisem markerů.
vi.mock('@/components/MapaChat', () => ({
  default: ({ chaty }: { chaty: MapovaChata[] }) => (
    <div data-testid="mapa-mock">{chaty.map((ch) => ch.slug).join(',')}</div>
  ),
}))

import KatalogClient from '@/components/KatalogClient'

const chata = (prepis: Partial<IndexChata>): IndexChata => ({
  slug: 'x',
  nazev: 'X',
  url: '/cesko/krkonose/x',
  oblastSlug: 'krkonose',
  oblastNazev: 'Krkonoše',
  zeme: 'cz',
  typ: 'obsluhovana',
  stav: 'v-provozu',
  vyska: null,
  lat: null,
  lng: null,
  nocleh: null,
  obcerstveni: null,
  razitko: false,
  otiskUrl: null,
  heroUrl: null,
  heroAlt: null,
  otiskAlt: null,
  kapacita: null,
  znamka: false,
  checked: null,
  verified: false,
  nejstarsiRok: null,
  ...prepis,
})

const INDEX: IndexChata[] = [
  chata({ slug: 'lucni-bouda', nazev: 'Luční bouda', url: '/cesko/krkonose/lucni-bouda', vyska: 1410, lat: 50.73, lng: 15.69, nocleh: true, obcerstveni: true, razitko: true, znamka: true, checked: '2026-07-19' }),
  chata({ slug: 'lovecka-chata', nazev: 'Lovecká chata', url: '/cesko/krkonose/lovecka-chata', vyska: null, nocleh: false, obcerstveni: true, checked: '2026-07-11' }),
  chata({ slug: 'samotnia', nazev: 'Schronisko Samotnia', url: '/polsko/krkonose/samotnia', zeme: 'pl', vyska: 1195, lat: 50.74, lng: 15.69, nocleh: true, checked: '2026-07-21' }),
]

beforeEach(() => window.history.replaceState(null, '', '/chaty'))
afterEach(cleanup)

describe('KatalogClient', () => {
  it('vykreslí karty s poctivými údaji: „—" u výšky, tagy „· PL" a „· výška nedoložena", counter', () => {
    render(<KatalogClient index={INDEX} />)
    expect(screen.getByRole('heading', { name: 'Katalog chat' })).toBeTruthy()
    expect(screen.getByText('Luční bouda')).toBeTruthy()
    expect(screen.getByText('1 410 m')).toBeTruthy()
    expect(screen.getByText('· výška nedoložena')).toBeTruthy() // Lovecká — bez domýšlení
    expect(screen.getByText('· PL')).toBeTruthy() // Samotnia
    expect(screen.getByText('3')).toBeTruthy() // counter zobrazeno
    // karta je odkaz na profil
    const lucni = screen.getByText('Luční bouda').closest('a')!
    expect(lucni.getAttribute('href')).toBe('/cesko/krkonose/lucni-bouda')
    // mini-otisk jen u chaty s razítkem (bez skenu stylizované SVG)
    expect(lucni.querySelector('.ktl-otisk svg')).not.toBeNull()
  })


  // Michal 28. 7. 2026: rozhledny s občerstvením mají v katalogu vlastní ikonku,
  // ať se v seznamu poznají od chat, kterými nejsou.
  it('rozhledna s občerstvením nese u názvu vlastní ikonu, chata ji nemá', () => {
    render(<KatalogClient index={[chata({ slug: 'vez', nazev: 'Rozhledna Žalý', typ: 'rozhledna' }), chata({ slug: 'bouda', nazev: 'Luční bouda' })]} />)
    const ikony = screen.getAllByRole('img', { name: 'Rozhledna s občerstvením' })
    expect(ikony).toHaveLength(1)
    expect(ikony[0].closest('.ktl-karta-nazev')?.textContent).toContain('Rozhledna Žalý')
  })

  it('thumb karty nese hero fotku profilu; bez hero zůstává silueta (žádný img)', () => {
    const { container } = render(
      <KatalogClient
        index={[
          chata({ slug: 'a', nazev: 'S fotkou', heroUrl: '/media/fotky/hero-480.jpg', heroAlt: 'S fotkou — hero' }),
          chata({ slug: 'b', nazev: 'Bez fotky' }),
        ]}
      />,
    )
    const fotky = container.querySelectorAll('img.ktl-thumb-foto')
    expect(fotky).toHaveLength(1) // jen karta s heroUrl
    expect(fotky[0].getAttribute('src')).toBe('/media/fotky/hero-480.jpg')
    expect(fotky[0].getAttribute('loading')).toBe('lazy')
    // fotka je dekorativní (název je textem karty) — alt prázdný, thumb aria-hidden
    expect(fotky[0].getAttribute('alt')).toBe('')
    expect(container.querySelectorAll('.ktl-karta-thumb--foto')).toHaveLength(1)
    expect(container.querySelectorAll('.ktl-karta-thumb')).toHaveLength(2) // silueta zůstává oběma jako podklad
  })

  it('službový chip filtruje jen doložené „ano" a zapisuje stav do URL (pushState)', () => {
    render(<KatalogClient index={INDEX} />)
    fireEvent.click(screen.getByRole('button', { name: 'nocleh' }))
    expect(window.location.search).toBe('?chips=nocleh')
    // re-render z nové URL (mock čte location.search)
    cleanup()
    render(<KatalogClient index={INDEX} />)
    expect(screen.queryByText('Lovecká chata')).toBeNull() // nocleh: doložené „ne"
    expect(screen.getByText('Luční bouda')).toBeTruthy()
    expect(screen.getByText('Schronisko Samotnia')).toBeTruthy()
  })

  it('kombinace bez shody = poctivý prázdný stav s odkazem do Atlasu a resetem', () => {
    window.history.replaceState(null, '', '/chaty?chips=zanikla')
    render(<KatalogClient index={INDEX} />)
    expect(screen.getByText('Téhle kombinaci zatím nic neodpovídá')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Atlasu zaniklých' }).getAttribute('href')).toBe('/zanikle')
    fireEvent.click(screen.getByRole('button', { name: 'Zrušit filtry' }))
    expect(window.location.search).toBe('')
  })

  it('hledání píše do URL přes replaceState (žádné položky historie po písmenech)', () => {
    render(<KatalogClient index={INDEX} />)
    const push = vi.spyOn(window.history, 'pushState')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Hledat v katalogu' }), {
      target: { value: 'luč' },
    })
    expect(window.location.search).toBe(`?${new URLSearchParams({ q: 'luč' }).toString()}`)
    expect(push).not.toHaveBeenCalled()
  })

  it('řádkové zobrazení má tabulkovou hlavičku, mapa dostává jen přefiltrované profily s GPS', () => {
    window.history.replaceState(null, '', '/chaty?view=radky')
    render(<KatalogClient index={INDEX} />)
    expect(screen.getByText('Služby')).toBeTruthy() // hlavička tabulky
    cleanup()

    window.history.replaceState(null, '', '/chaty?view=mapa')
    render(<KatalogClient index={INDEX} />)
    const mapa = screen.getByTestId('mapa-mock')
    // Lovecká nemá GPS → na mapě není; popiska to přiznává
    expect(mapa.textContent).toBe('lucni-bouda,samotnia')
    expect(screen.getByText(/1 profilů bez doložené GPS na mapě není/)).toBeTruthy()
  })

  it('aktivní chip nese × a aria-pressed; přepínače řazení mají výchozí „abecedně"', () => {
    window.history.replaceState(null, '', '/chaty?chips=razitko')
    render(<KatalogClient index={INDEX} />)
    const chip = screen.getByRole('button', { name: 'razítko ×' })
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    const razeni = within(screen.getByRole('group', { name: 'Řazení' }))
    expect(razeni.getByRole('button', { name: 'abecedně' }).className).toContain('akt')
  })

  /**
   * Lišta pohoří se ukazuje, JEN když je z čeho vybírat. S jedinou oblastí by
   * to byl přepínač bez alternativy a zároveň nepravdivý dojem, že průvodce
   * vede víc pohoří, než vede. Seznam se bere z indexu, takže nová oblast se
   * objeví sama (zadání Michala 31. 7. 2026).
   */
  it('lišta pohoří: s jednou oblastí není, s druhou přibude i s počty', () => {
    const { container } = render(<KatalogClient index={INDEX} />)
    expect(container.textContent).not.toContain('Pohoří')
    cleanup()

    render(
      <KatalogClient
        index={[
          ...INDEX,
          chata({
            slug: 'smedava',
            nazev: 'Smědava',
            url: '/cesko/jizerske-hory/smedava',
            oblastSlug: 'jizerske-hory',
            oblastNazev: 'Jizerské hory',
          }),
        ]}
      />,
    )
    const tlacitko = screen.getByRole('button', { name: /Jizerské hory/ })
    expect(tlacitko.textContent).toContain('1') // počet profilů oblasti
    expect(screen.getByRole('button', { name: /Krkonoše/ }).textContent).toContain('3')
  })

  it('výběr pohoří filtruje výpis a zapíše se do URL', () => {
    render(
      <KatalogClient
        index={[
          ...INDEX,
          chata({
            slug: 'smedava',
            nazev: 'Smědava',
            url: '/cesko/jizerske-hory/smedava',
            oblastSlug: 'jizerske-hory',
            oblastNazev: 'Jizerské hory',
          }),
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Jizerské hory/ }))
    expect(window.location.search).toContain('oblasti=jizerske-hory')
  })
})