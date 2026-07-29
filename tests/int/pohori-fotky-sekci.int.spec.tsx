/**
 * Fotky sekcí stránky pohoří (handoff F1): foto pás u top cílů a vlepený
 * snímek u paměti hor.
 *
 * Testy hlídají tři věci, které by se daly pokazit tiše:
 *   1. atribuce se vypíše i u licencí, které ji nevyžadují (Unsplash/Pexels) —
 *      web, který u faktů jmenuje prameny a u obrázků mlčí, si protiřečí;
 *   2. body ve fotce se kreslí JEN z dat — návrh u nich má konkrétní tvrzení
 *      o tom, co na snímku je, a to musí někdo doložit;
 *   3. bod je tlačítko, ne div s `:hover` — jinak by byl popisek pro
 *      klávesnici neviditelný.
 */
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import FotoPas from '@/components/FotoPas'
import FotoVlepena from '@/components/FotoVlepena'
import type { Oblasti as Oblast } from '@/payload-types'

type Fotka = NonNullable<Oblast['fotky']>[number]

const PAS: Fotka = {
  role: 'pas-cile',
  soubor: '/foto/pohori/karkonosze-malgorzata-twardo.jpg',
  nahled: '/foto/pohori/karkonosze-malgorzata-twardo-nahled.jpg',
  alt: 'Skalnaté srázy krkonošských karů',
  autor: 'Małgorzata Twardo',
  licence: 'unsplash',
  popis: 'Karkonosze — polská strana Krkonoš',
}

const PAMET: Fotka = {
  role: 'pamet',
  soubor: '/foto/pohori/pamet-hor-mateusz-mierzejewski.jpg',
  nahled: '/foto/pohori/pamet-hor-mateusz-mierzejewski-nahled.jpg',
  alt: 'Kamenitá stezka stoupá k horské stavbě s věží',
  autor: 'Mateusz Mierzejewski',
  licence: 'pexels',
}

afterEach(cleanup)

describe('foto pás u top cílů', () => {
  it('vypíše atribuci i u licence, která ji nevyžaduje, a popisku z dat', () => {
    render(<FotoPas fotka={PAS} />)
    expect(screen.getByText('foto: Małgorzata Twardo · Unsplash')).toBeTruthy()
    expect(screen.getByText('Karkonosze — polská strana Krkonoš')).toBeTruthy()
  })

  it('bez dat nekreslí žádné body — na dohad se neukazuje', () => {
    const { container } = render(<FotoPas fotka={PAS} />)
    expect(container.querySelectorAll('.fpas-bod')).toHaveLength(0)
  })

  it('s doloženými body je každý bod tlačítko (dosažitelné klávesnicí)', () => {
    const sBody: Fotka = {
      ...PAS,
      hotspoty: [
        { text: 'Stěny karů', x: 40, y: 55 },
        { text: 'Hřebenovka', x: 70, y: 30 },
      ],
    }
    const { container } = render(<FotoPas fotka={sBody} />)
    const body = container.querySelectorAll('.fpas-bod')
    expect(body).toHaveLength(2)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect((body[0] as HTMLElement).style.left).toBe('40%')
    expect((body[0] as HTMLElement).style.top).toBe('55%')
    expect(screen.getByText('Stěny karů')).toBeTruthy()
  })

  it('bod bez textu se přeskočí (prázdný kroužek nic neříká)', () => {
    const { container } = render(
      <FotoPas fotka={{ ...PAS, hotspoty: [{ text: '  ' }, { text: 'Kar' }] }} />,
    )
    expect(container.querySelectorAll('.fpas-bod')).toHaveLength(1)
  })

  it('karta se vykreslí jen tehdy, když ji stránka pošle', () => {
    const { container: bez } = render(<FotoPas fotka={PAS} />)
    expect(bez.querySelector('.fpas-karta')).toBeNull()
    cleanup()
    const { container: s } = render(<FotoPas fotka={PAS} karta={<b>Sněžka</b>} />)
    expect(s.querySelector('.fpas-karta')!.textContent).toBe('Sněžka')
  })

  it('bez souboru nevykreslí nic (oblast bez fotky nemá prázdný pás)', () => {
    const { container } = render(<FotoPas fotka={{ role: 'pas-cile', autor: 'Někdo' }} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('vlepený snímek u paměti hor', () => {
  it('nese atribuci a alternativní popis', () => {
    const { container } = render(<FotoVlepena fotka={PAMET} />)
    expect(screen.getByText('foto: Mateusz Mierzejewski · Pexels')).toBeTruthy()
    expect(container.querySelector('img')!.getAttribute('alt')).toBe(PAMET.alt)
  })

  it('rukopisná popiska se ukáže jen tehdy, když je v datech', () => {
    const { container: bez } = render(<FotoVlepena fotka={PAMET} />)
    expect(bez.querySelector('.fvlep-rukopis')).toBeNull()
    cleanup()
    const { container: s } = render(
      <FotoVlepena fotka={{ ...PAMET, popis: 'nad Sněžnými jámami' }} />,
    )
    expect(s.querySelector('.fvlep-rukopis')!.textContent).toBe('nad Sněžnými jámami')
  })

  it('bez souboru nevykreslí nic', () => {
    const { container } = render(<FotoVlepena fotka={{ role: 'pamet' }} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('data Krkonoš', () => {
  it('obě fotky sekcí mají doloženého autora i licenci', async () => {
    const { readFileSync } = await import('node:fs')
    const { parse } = await import('yaml')
    const d = parse(readFileSync('data/oblasti/krkonose.yaml', 'utf8')) as {
      fotky?: { role: string; autor?: string; licence?: string; soubor?: string; overeni?: unknown }[]
    }
    const fotky = d.fotky ?? []
    expect(fotky.length).toBeGreaterThanOrEqual(2)
    for (const f of fotky) {
      expect(f.soubor, `${f.role}: chybí soubor`).toBeTruthy()
      expect(f.autor, `${f.role}: chybí autor`).toBeTruthy()
      expect(f.licence, `${f.role}: chybí licence`).toBeTruthy()
      expect(f.overeni, `${f.role}: chybí blok ověření`).toBeTruthy()
    }
  })
})
