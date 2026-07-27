/**
 * F1c (první průchod): homepage countery + kalendárium + „Z průvodce" +
 * printový seznam — všechna čísla POČÍTANÁ z mockovaného indexu, žádná
 * ručně psaná. Payload i Leaflet se mockují (server data přicházejí
 * z getIndexChat / getChatyProMapu, ty testuje CI build se seedem).
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IndexChata, KalendariumPolozka } from '@/lib/index-chat'

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
  otiskAlt: null,
  znamka: false,
  checked: null,
  verified: false,
  nejstarsiRok: null,
  ...prepis,
})

const INDEX: IndexChata[] = [
  chata({ slug: 'lucni-bouda', nazev: 'Luční bouda', vyska: 1410, razitko: true, znamka: true, checked: '2026-07-19' }),
  chata({ slug: 'vyrovka', nazev: 'Výrovka', vyska: 1357, razitko: true, checked: '2026-07-08' }),
  chata({ slug: 'bez-overeni', nazev: 'Bez ověření' }),
]
const KALENDARIUM: KalendariumPolozka[] = [
  { rok: 1623, udalost: 'letopočet na základním kameni.', chataNazev: 'Luční bouda', chataUrl: '/cesko/krkonose/lucni-bouda' },
]

vi.mock('@/lib/chaty', () => ({
  getChatyProMapu: async () => [],
  getIndexChat: async () => ({ index: INDEX, kalendarium: KALENDARIUM }),
}))
vi.mock('@/lib/zanikle', () => ({
  zanikleChaty: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
}))
vi.mock('@/components/MapaChat', () => ({ default: () => <div data-testid="mapa-mock" /> }))

import HomePage from '@/app/(frontend)/page'

afterEach(cleanup)

describe('Homepage F1c — datové pásy', () => {
  it('countery jsou spočítané z indexu (profily, s razítkem, zaniklé, naposledy ověřeno)', async () => {
    render(await HomePage())
    const countery = document.querySelector('.hf1-countery')!
    expect(within(countery as HTMLElement).getByText('3')).toBeTruthy() // profilů
    expect(within(countery as HTMLElement).getByText('2')).toBeTruthy() // s razítkem
    expect(within(countery as HTMLElement).getByText('12')).toBeTruthy() // zaniklých (mock Atlasu)
    expect(within(countery as HTMLElement).getByText('19. 7. 2026')).toBeTruthy() // max checked
    expect(screen.getByText('jen čísla doložená v databázi — žádná vymyšlená')).toBeTruthy()
  })

  it('kalendárium skládá větu z milníku a odkazuje na profil; popiska přiznává rotaci', async () => {
    render(await HomePage())
    expect(screen.getByText(/^Před \d+ lety \(1623\) letopočet na základním kameni\.$/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'číst na profilu ▸' }).getAttribute('href')).toBe(
      '/cesko/krkonose/lucni-bouda',
    )
    expect(screen.getByText('z milníků historie · střídá se denně')).toBeTruthy()
  })

  it('pás Naposledy ověřeno řadí dle checked a profily bez checked vynechává', async () => {
    render(await HomePage())
    const panel = screen.getByText('Naposledy ověřeno').closest('.hf1-panel') as HTMLElement
    const radky = within(panel).getAllByRole('link')
    expect(radky.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Luční bouda'),
      expect.stringContaining('Výrovka'),
    ])
  })

  it('printový seznam (B13) nese všechny profily s poctivými „—"', async () => {
    render(await HomePage())
    const tabulka = document.querySelector('.hf1-print table')!
    const radky = tabulka.querySelectorAll('tbody tr')
    expect(radky).toHaveLength(3)
    const bezOvereni = [...radky].find((r) => r.textContent?.includes('Bez ověření'))!
    expect(bezOvereni.textContent).toContain('—') // výška i ověření nedoloženy
  })
})
