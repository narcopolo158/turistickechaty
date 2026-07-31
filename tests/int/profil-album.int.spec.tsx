/**
 * ALBUM na profilu chaty — další snímky pod razítky a mapou (rozhodnutí
 * Michala 31. 7. 2026: „další fotky pod razítka a mapu do levé části").
 *
 * Testuje se to, co může tiše pokazit web nebo licenci:
 *  1. že se album vykreslí jen tehdy, když nějaké snímky jsou (prázdný pruh
 *     s nadpisem vypadá jako rozbitá stránka),
 *  2. že u každého snímku stojí ATRIBUCE — i tam, kde ji licence nevyžaduje;
 *     web, který u faktů jmenuje prameny a u fotek ne, si protiřečí,
 *  3. že lupa jde otevřít i zavřít (klávesnicí i křížkem) — bez ní by album
 *     bylo jen ozdoba,
 *  4. že mapa je rozbalená rovnou, ne za klikem.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ZapData } from '@/components/ProfilZapisnik'

// Živá mapa se nahrazuje atrapou (Leaflet v jsdom nekreslí), ale KONSTANTY
// zůstávají skutečné — test atribuce má hlídat opravdové hodnoty, ne své vlastní.
vi.mock('@/components/MapaTrasy', async (puvodni) => ({
  ...(await puvodni<typeof import('@/components/MapaTrasy')>()),
  default: () => <div data-testid="mapa-mock" />,
}))
// jsdom `matchMedia` nemá; komponenta si jím zjišťuje prefers-reduced-motion.
window.matchMedia = ((dotaz: string) => ({
  matches: false,
  media: dotaz,
  addEventListener: () => {},
  removeEventListener: () => {},
})) as unknown as typeof window.matchMedia
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }))

import ProfilZapisnik from '@/components/ProfilZapisnik'

const foto = (i: number) => ({
  url: `https://priklad.cz/n${i}.jpg`,
  plna: `https://priklad.cz/p${i}.jpg`,
  alt: `Snímek ${i}`,
  autor: i === 2 ? null : `Autor ${i}`,
  licence: 'CC BY-SA 4.0',
  zdrojUrl: `https://commons.wikimedia.org/wiki/File:F${i}.jpg`,
  datovani: '2024',
})

const DATA = (galerie: ZapData['galerie']): ZapData =>
  ({
    nazev: 'Zkušební bouda',
    eyebrow: 'Krkonoše',
    crumb: 'Krkonoše',
    vyskaText: '1 410 m',
    hero: null,
    galerie,
    heroAtribuce: null,
    heroCaption: '',
    status: { kind: 'none', label: '', sub: null },
    historickeNazvy: [],
    lead: null,
    facts: [],
    identitaNote: null,
    charakteristika: [],
    provoz: null,
    nocleh: null,
    obcerstveni: null,
    sluzby: [],
    pristupIntro: null,
    routes: [],
    mapa: { lat: 50.7, lng: 15.7, trasy: [] },
    mapaNahledUrl: null,
    mapa3dUrl: null,
    prispetUrl: null,
    sousede: [],
    historie: null,
    zajimavosti: [],
    zdroje: [],
    razitko: null,
    znamka: null,
    vizitka: null,
    dalsiList: null,
  }) as ZapData

afterEach(cleanup)

describe('Album na profilu chaty', () => {
  it('bez snímků se nekreslí vůbec — prázdný pruh je horší než nic', () => {
    const { container } = render(<ProfilZapisnik data={DATA([])} />)
    expect(container.querySelector('.zap-album')).toBeNull()
    expect(screen.queryByText('Album')).toBeNull()
  })

  it('vykreslí snímky s popiskem i atribucí a spočítá je v hlavičce', () => {
    const { container } = render(<ProfilZapisnik data={DATA([foto(1), foto(2), foto(3)])} />)
    expect(screen.getByText('Album')).toBeTruthy()
    expect(screen.getByText('3 snímky')).toBeTruthy()
    expect(container.querySelectorAll('.zap-album-snimek')).toHaveLength(3)
    expect(screen.getByText('foto: Autor 1 · CC BY-SA 4.0 · 2024')).toBeTruthy()
    // Bez autora se nemlčí — řekne se, že není znám.
    expect(screen.getByText('foto: neznámý autor · CC BY-SA 4.0 · 2024')).toBeTruthy()
  })

  /**
   * Velký úvodní snímek jen u lichého počtu — zbytek se pak srovná do dvojic
   * a mřížka nikdy nekončí osamělou půlkou.
   */
  it('mřížka se skládá do dvojic: velký snímek jen u lichého počtu', () => {
    const { container: liche } = render(<ProfilZapisnik data={DATA([foto(1), foto(2), foto(3)])} />)
    expect(liche.querySelectorAll('.zap-album-snimek.velky')).toHaveLength(1)
    cleanup()
    const { container: sude } = render(<ProfilZapisnik data={DATA([foto(1), foto(2)])} />)
    expect(sude.querySelectorAll('.zap-album-snimek.velky')).toHaveLength(0)
  })

  it('lupa se otevře klikem, listuje a zavře Escapem', () => {
    const { container } = render(<ProfilZapisnik data={DATA([foto(1), foto(2)])} />)
    fireEvent.click(container.querySelector('.zap-album-snimek button')!)
    const lupa = container.querySelector('.zap-lupa')
    expect(lupa).toBeTruthy()
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'zdroj snímku ▸' })).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Další snímek'))
    expect(screen.getByText('2 / 2')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.zap-lupa')).toBeNull()
  })

  /**
   * Skládaná obálka byla z grafického návrhu — hezká metafora, ale mezi
   * čtenářem a tím, proč přišel, stálo kliknutí (rozhodnutí Michala
   * 31. 7. 2026). Mapa se otevírá rozbalená; složit ji pořád jde.
   */
  it('mapa je rozbalená rovnou, placeholder přes ni není', () => {
    const { container } = render(<ProfilZapisnik data={DATA([])} />)
    expect(container.querySelector('.zap-map-cover')).toBeNull()
    expect(container.querySelector('.zap-map-live')).toBeTruthy()
    expect(screen.getByText('◂ Složit')).toBeTruthy()
    expect(screen.queryByText(/Skládaná turistická mapa/)).toBeNull()
  })
})

/**
 * DVĚ ÚROVNĚ MAPY (nápad Michala 1. 8. 2026: „natáhli bysme mapu do cache
 * a načetla by se až po kliknutí — mapa by tam vždy byla, ale šetřili bysme
 * načítání plné mapy").
 *
 * Hlídá se, že se živé dlaždice NENAČTOU dřív, než o ně někdo stojí — v tom
 * je celá úspora — a zároveň že mapa není nikdy prázdná: bez náhledu (chybí
 * klíč, API odmítlo) se musí natáhnout živá.
 */
describe('náhled mapy a živé dlaždice', () => {
  const sNahledem = () => ({ ...DATA([]), mapaNahledUrl: '/api/mapa-nahled/zkusebni' })

  it('s náhledem se živá mapa nenačte, dokud se neklikne', () => {
    const { container } = render(<ProfilZapisnik data={sNahledem()} />)
    expect(container.querySelector('.zap-map-nahled img')).toBeTruthy()
    expect(container.querySelector('[data-testid="mapa-mock"]')).toBeNull()
    fireEvent.click(container.querySelector('.zap-map-nahled')!)
    expect(container.querySelector('[data-testid="mapa-mock"]')).toBeTruthy()
  })

  it('náhled má popis pro čtečku a tlačítko, které říká, co se stane', () => {
    render(<ProfilZapisnik data={sNahledem()} />)
    expect(screen.getByAltText(/Mapa okolí — Zkušební bouda/)).toBeTruthy()
    expect(screen.getByText('Rozhýbat mapu ▸')).toBeTruthy()
  })

  /** Rozbitý náhled nesmí nechat na stránce díru — spadne se na živou mapu. */
  it('když náhled selže, mapa se natáhne živá', () => {
    const { container } = render(<ProfilZapisnik data={sNahledem()} />)
    fireEvent.error(container.querySelector('.zap-map-nahled img')!)
    expect(container.querySelector('[data-testid="mapa-mock"]')).toBeTruthy()
  })

  it('bez náhledu (chybí klíč) se mapa chová jako dřív — živá', () => {
    const { container } = render(<ProfilZapisnik data={DATA([])} />)
    expect(container.querySelector('.zap-map-nahled')).toBeNull()
    expect(container.querySelector('.zap-map-live')).toBeTruthy()
  })

  /**
   * Mapy.com u svých podkladů vyžadují logo a odkaz na copyright. Živé mapě je
   * kreslí Leaflet; statický náhled by se bez téhle kontroly mohl tiše vydat
   * bez nich — a to je porušení licence, ne kosmetika.
   */
  it('náhled nese logo Mapy.com i odkaz na copyright', () => {
    const { container } = render(<ProfilZapisnik data={sNahledem()} />)
    const logo = container.querySelector('a.zap-map-logo')
    expect(logo?.getAttribute('href')).toContain('mapy.com')
    expect(logo?.querySelector('img')?.getAttribute('alt')).toBe('Mapy.com')
    const atribuce = screen.getByText('© Seznam.cz a.s. a další')
    expect(atribuce.getAttribute('href')).toBe('https://api.mapy.com/copyright')
  })

  /** Odkaz uvnitř tlačítka je neplatné HTML — a čtečka z toho udělá guláš. */
  it('logo ani atribuce nejsou uvnitř tlačítka', () => {
    const { container } = render(<ProfilZapisnik data={sNahledem()} />)
    expect(container.querySelector('.zap-map-nahled a')).toBeNull()
  })
})
