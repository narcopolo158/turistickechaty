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
  chata({
    slug: 'smedava',
    nazev: 'Smědava',
    url: '/cesko/jizerske-hory/smedava',
    oblastSlug: 'jizerske-hory',
    oblastNazev: 'Jizerské hory',
  }),
]
const KALENDARIUM: KalendariumPolozka[] = [
  { rok: 1623, udalost: 'letopočet na základním kameni.', chataNazev: 'Luční bouda', chataUrl: '/cesko/krkonose/lucni-bouda' },
]

vi.mock('@/lib/chaty', () => ({
  getChatyProMapu: async () => [],
  getIndexChat: async () => ({ index: INDEX, kalendarium: KALENDARIUM }),
  // Titulní fotka oblasti (FOTO-01): mock ji schválně NEMÁ — karta pohoří má
  // fungovat i bez fotky (kreslené panorama je záloha, viz page.tsx).
  getOblastBySlug: async () => null,
  // Živé oblasti (31. 7. 2026): homepage je od přidání Jizerských hor bere
  // odsud, ať krkonošská karta nepočítá cizí chaty. Mock vede dvě, aby test
  // ohlídal i to, že se druhá opravdu vykreslí.
  getZiveOblasti: async () => [
    { slug: 'krkonose', nazev: 'Krkonoše', pocetChat: 2 },
    { slug: 'jizerske-hory', nazev: 'Jizerské hory', pocetChat: 1 },
  ],
  spojVyctem: (p: string[]) =>
    p.length <= 1 ? (p[0] ?? '') : `${p.slice(0, -1).join(', ')} a ${p[p.length - 1]}`,
}))
vi.mock('@/lib/zanikle', () => ({
  zanikleChaty: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
  zanikleChatyVse: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
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
    expect(within(countery as HTMLElement).getByText('4')).toBeTruthy() // profilů (fond, obě oblasti)
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
    expect(screen.getByText('PROZKOUMAT POHOŘÍ')).toBeTruthy()
    expect(screen.getByText('KATALOG CHAT')).toBeTruthy()
    // mock index nemá heroUrl ani otiskUrl Luční → polaroid i otisk poctivě ghost
    expect(screen.getByText(/foto hřebene — doplníme/)).toBeTruthy()
    expect(screen.getByText('EST. 1623')).toBeTruthy() // ghost SVG otisku (doložený milník)
    expect(screen.getByText('Č. 11')).toBeTruthy() // reálné číslo známky z DATA-10
  })

  /**
   * Od 31. 7. 2026 nese grid VŠECHNY oblasti s publikovanými profily, každou
   * s vlastními čísly. Dřív tu byla Krkonoše napevno a počty se braly z celého
   * fondu — s druhou oblastí by si krkonošská karta přivlastnila i jizerské
   * chaty. Test proto hlídá, že se čísla mezi kartami LIŠÍ.
   */
  it('pohoří grid: každá živá oblast má vlastní čísla, „připravujeme" jen ty ostatní', async () => {
    const { container } = render(await HomePage())
    const zive = container.querySelectorAll('.hf1-pohori-ziva')
    expect(zive).toHaveLength(2)
    const krkonose = zive[0] as HTMLElement
    const jizerky = zive[1] as HTMLElement
    expect(within(krkonose).getByText('Krkonoše')).toBeTruthy()
    expect(within(krkonose).getByText('ŽIVÉ')).toBeTruthy()
    expect(within(krkonose).getByText('3')).toBeTruthy() // 3 krkonošské chaty z mock indexu
    expect(within(jizerky).getByText('Jizerské hory')).toBeTruthy()
    expect(within(jizerky).getByText('1')).toBeTruthy() // jediná jizerská
    // Oblast, která na webu stojí, se nesmí zároveň nabízet jako „připravujeme".
    expect(within(container).queryByText(/Jizerské hory.*připravujeme/)).toBeNull()
    expect(screen.getAllByText(/připravujeme — sbíráme kandidáty/)).toHaveLength(2)
    expect(screen.getByText(/přesahová oblast/)).toBeTruthy()
  })

  it('namátkou z průvodce: lístky z mock indexu (víc jich není), reshuffle tlačítko, poctivá popiska', async () => {
    const { container } = render(await HomePage())
    expect(screen.getByText('Namátkou z průvodce')).toBeTruthy()
    expect(container.querySelectorAll('.hf1-listek')).toHaveLength(4)
    expect(screen.getByRole('button', { name: '↻ jiných pět' })).toBeTruthy()
    expect(screen.getByText(/náhodný výběr z 4 doložených profilů/)).toBeTruthy()
  })

  /**
   * Rozcestník v heru je NEUTRÁLNÍ (rozhodnutí Michala 31. 7. 2026). Do té doby
   * vedlo velké prkno na Krkonoše — s druhou živou oblastí by to čtenáři
   * tvrdilo, že průvodce je pořád jen krkonošský, a prkno za každou oblast se
   * přidávat nedá donekonečna. Test drží obojí: cedule míří na sekci Pohoří
   * a karty odtud vedou na jednotlivá pohoří.
   */
  it('místo malovaného posteru je skutečná mapa chat; cedule vede na rozcestník, karty na pohoří', async () => {
    const { container } = render(await HomePage())
    // rozhodnutí Michala 28. 7.: 3D patří na stránku pohoří, homepage nese turistickou mapu
    expect(screen.queryByText('Malovaná 3D mapa Krkonoš')).toBeNull()
    expect(container.querySelector('#mapa [data-testid="mapa-mock"]')).toBeTruthy()
    const cedule = screen.getByText('PROZKOUMAT POHOŘÍ').closest('a')!
    expect(cedule.getAttribute('href')).toBe('#pohori')
    // Kotva musí existovat — odkaz do prázdna by čtenáře nechal stát na místě.
    expect(container.querySelector('#pohori')).toBeTruthy()
    // Popiska počítá živé oblasti z dat (mock jich má dvě).
    expect(screen.getByText(/2 pohoří · stránky s 3D mapou/)).toBeTruthy()
    const karty = container.querySelectorAll('.hf1-pohori-ziva a')
    expect([...karty].map((a) => a.getAttribute('href'))).toEqual([
      '/cesko/krkonose',
      '/cesko/jizerske-hory',
    ])
  })

  it('komunitní apel: počty chybějících z dat, CTA na /prispet', async () => {
    render(await HomePage())
    // mock: 4 profily, 2 s razítkem, 4 bez heroUrl
    expect(screen.getByText('Máš v deníku otisk, který nám chybí?')).toBeTruthy()
    expect(screen.getByText(/2 chaty vedeme bez\s+doloženého razítka a 4 bez fotky/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Přispět otiskem či fotkou ▸' }).getAttribute('href')).toBe('/prispet')
  })

  it('printový seznam (B13) nese všechny profily s poctivými „—"', async () => {
    render(await HomePage())
    const tabulka = document.querySelector('.hf1-print table')!
    const radky = tabulka.querySelectorAll('tbody tr')
    expect(radky).toHaveLength(4)
    const bezOvereni = [...radky].find((r) => r.textContent?.includes('Bez ověření'))!
    expect(bezOvereni.textContent).toContain('—') // výška i ověření nedoloženy
  })
})
