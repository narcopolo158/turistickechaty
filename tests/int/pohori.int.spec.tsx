/**
 * Stránka pohoří (F1d, 1. průchod): hero s charakteristikou a stat-tiles
 * POČÍTANÝMI z dat, 3D mapa jako poster→klik (skutečná aplikace z DATA-28,
 * ne malovaný placeholder), CTA do katalogu, top cíle s vazbou na profily.
 * Payload se mockuje — server data testuje CI build se seedem.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IndexChata } from '@/lib/index-chat'

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
  heroUrl: null,
  heroAlt: null,
  znamka: false,
  checked: null,
  verified: false,
  nejstarsiRok: null,
  ...prepis,
})

vi.mock('@/lib/chaty', () => ({
  ZEME_SLUG: { cz: 'cesko', pl: 'polsko' },
  getOblastBySlug: async () => ({
    nazev: 'Krkonoše',
    slug: 'krkonose',
    charakteristika: 'Nejvyšší pohoří Česka, rozložené po obou stranách hranice.',
    nejvyssiHora: { nazev: 'Sněžka', vyska: 1603, source: 'tisicovky.cz (titulky)' },
    topCile: [
      { nazev: 'Sněžka', veta: 'Nejvyšší hora Česka.', nejblizChataSlug: 'dom-slaski', source: 'x' },
      { nazev: 'Pramen Labe', veta: 'U pramene Labe.', nejblizChataSlug: 'labska-bouda', source: 'x' },
    ],
  }),
  getIndexChat: async () => ({
    index: [
      chata({ slug: 'lucni-bouda', nazev: 'Luční bouda', vyska: 1410, razitko: true, checked: '2026-07-19' }),
      chata({ slug: 'dom-slaski', nazev: 'Dom Śląski', url: '/cesko/krkonose/dom-slaski', vyska: 1400, zeme: 'pl' }),
      chata({ slug: 'labska-bouda', nazev: 'Labská bouda', vyska: 1340 }),
      chata({ slug: 'bez-vysky', nazev: 'Bez výšky' }),
    ],
    kalendarium: [],
  }),
}))
vi.mock('@/lib/zanikle', () => ({
  zanikleChaty: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('notFound')
  },
  permanentRedirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))

import PohoriPage from '@/app/(frontend)/[zeme]/[oblast]/page'

afterEach(cleanup)

const params = (zeme: string) => Promise.resolve({ zeme, oblast: 'krkonose' })

describe('Stránka pohoří (F1d)', () => {
  it('hero: název, charakteristika se zdrojovou popiskou a stat-tiles počítané z dat', async () => {
    render(await PohoriPage({ params: params('cesko') }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Krkonoše')
    expect(screen.getByText(/Nejvyšší pohoří Česka/)).toBeTruthy()
    expect(screen.getByText(/kurátorský text se zdroji/)).toBeTruthy()
    expect(screen.getByText('1 603 m')).toBeTruthy() // nejvyšší hora z dat oblasti
    expect(screen.getByText('Sněžka — nejvyšší hora')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy() // chat v průvodci z indexu
    const rozpeti = document.querySelector('.pohori-tiles')!
    expect(rozpeti.textContent).toContain('1 340–1 410 m') // rozpětí jen doložených výšek
    expect(screen.getByText(/jen doložené výšky \(3 z 4\)/)).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy() // zaniklých (mock Atlasu)
  })

  it('3D mapa: poster se spouští kliknutím (three.js až po kliknutí), pak iframe skutečné aplikace', async () => {
    const { container } = render(await PohoriPage({ params: params('cesko') }))
    expect(container.querySelector('iframe')).toBeNull() // bez kliknutí se 3D nenačítá
    const poster = screen.getByRole('button', { name: /Spustit 3D mapu/ })
    expect(screen.getByText(/poster šetří data/)).toBeTruthy()
    fireEvent.click(poster)
    const iframe = container.querySelector('iframe')!
    expect(iframe.getAttribute('src')).toBe('/3d/krkonose.html')
    // atribuce reálných dat 3D mapy (Mapy.com výškopis + OSM)
    expect(screen.getByText(/Mapy\.com Elevation API/)).toBeTruthy()
    expect(screen.getByText(/OpenStreetMap \(ODbL\)/)).toBeTruthy()
  })

  it('top cíle nesou vazbu na doložené profily, CTA vede do katalogu', async () => {
    render(await PohoriPage({ params: params('cesko') }))
    expect(screen.getByRole('link', { name: 'Nejblíž: Dom Śląski ▸' }).getAttribute('href')).toBe('/cesko/krkonose/dom-slaski')
    expect(screen.getByText('Otevřít katalog chat ▸').getAttribute('href')).toBe('/chaty')
  })

  it('/polsko/krkonose přesměruje na kanonickou /cesko/krkonose (jedno pohoří, jedna stránka)', async () => {
    await expect(PohoriPage({ params: params('polsko') })).rejects.toThrow('redirect:/cesko/krkonose')
  })
})
