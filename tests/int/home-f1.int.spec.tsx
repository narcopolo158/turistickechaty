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
// HledaniChat používá app router (useRouter) — v jsdom se mockuje.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} }),
}))

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

  it('hero dle handoffu: claim, dřevěné cedule, koláž s ghost artefakty (mock bez fotky/otisku) a známka č. 11', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Chaty, kterým')
    expect(screen.getByText('PROZKOUMAT KRKONOŠE')).toBeTruthy()
    expect(screen.getByText('KATALOG CHAT')).toBeTruthy()
    // mock index nemá heroUrl ani otiskUrl Luční → polaroid i otisk poctivě ghost
    expect(screen.getByText(/foto hřebene — doplníme/)).toBeTruthy()
    expect(screen.getByText('EST. 1623')).toBeTruthy() // ghost SVG otisku (doložený milník)
    expect(screen.getByText('Č. 11')).toBeTruthy() // reálné číslo známky z DATA-10
  })

  it('pohoří grid: živá karta Krkonoš s čísly z dat, tři „připravujeme" s kandidátní popiskou', async () => {
    const { container } = render(await HomePage())
    const ziva = container.querySelector('.hf1-pohori-ziva') as HTMLElement
    expect(within(ziva).getByText('Krkonoše')).toBeTruthy()
    expect(within(ziva).getByText('ŽIVÉ')).toBeTruthy()
    expect(within(ziva).getByText('3')).toBeTruthy() // chat z mock indexu, ne ručně psané
    expect(screen.getAllByText(/připravujeme — sbíráme kandidáty/)).toHaveLength(2)
    expect(screen.getByText(/přesahová oblast/)).toBeTruthy()
  })

  it('namátkou z průvodce: 3 lístky z mock indexu (víc jich není), reshuffle tlačítko, poctivá popiska', async () => {
    const { container } = render(await HomePage())
    expect(screen.getByText('Namátkou z průvodce')).toBeTruthy()
    expect(container.querySelectorAll('.hf1-listek')).toHaveLength(3)
    expect(screen.getByRole('button', { name: '↻ jiných pět' })).toBeTruthy()
    expect(screen.getByText(/náhodný výběr z 3 doložených profilů/)).toBeTruthy()
  })

  it('místo malovaného posteru je skutečná mapa chat; cedule i karta pohoří vedou na /cesko/krkonose', async () => {
    const { container } = render(await HomePage())
    // rozhodnutí Michala 28. 7.: 3D patří na stránku pohoří, homepage nese turistickou mapu
    expect(screen.queryByText('Malovaná 3D mapa Krkonoš')).toBeNull()
    expect(container.querySelector('#mapa [data-testid="mapa-mock"]')).toBeTruthy()
    const cedule = screen.getByText('PROZKOUMAT KRKONOŠE').closest('a')!
    expect(cedule.getAttribute('href')).toBe('/cesko/krkonose')
    const kartaPohori = container.querySelector('.hf1-pohori-ziva a')!
    expect(kartaPohori.getAttribute('href')).toBe('/cesko/krkonose')
  })

  it('komunitní apel: počty chybějících z dat, CTA na /prispet', async () => {
    render(await HomePage())
    // mock: 3 profily, 2 s razítkem, 3 bez heroUrl
    expect(screen.getByText('Máš v deníku otisk, který nám chybí?')).toBeTruthy()
    expect(screen.getByText(/1 chat vedeme bez doloženého razítka a 3 bez fotky/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Přispět otiskem či fotkou ▸' }).getAttribute('href')).toBe('/prispet')
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
