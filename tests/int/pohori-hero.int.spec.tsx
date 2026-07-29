/**
 * Hlavička stránky pohoří — titulní fotka přes celou šířku (FOTO-01 + handoff
 * F1, edice „foto", zadání Michala 29. 7. 2026).
 *
 * Testy nehlídají vzhled (od toho jsou screenshoty), ale to, co by se dalo
 * tiše pokazit a nikdo by si nevšiml:
 *
 *   1. atribuce se zobrazí i u licence, která ji NEVYŽADUJE (Unsplash) —
 *      jinak by web u faktů prameny jmenoval a u obrázků mlčel;
 *   2. popisek říká jen to, co dokládá zdroj — komponenta nesmí přidat nic
 *      vlastního (návrh ukazuje šipkou na Luční boudu, náš snímek ji nemá
 *      doloženou, takže se anotace nekreslí);
 *   3. razítko oblasti nese jen doložené údaje z `nejvyssiHora` a slogan
 *      z návrhu („KRAJ BOUD · OD 1623") do něj nepatří;
 *   4. bez fotky nezmizí H1 — stránka bez nadpisu by byla vada, ne design.
 */
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import PohoriHero from '@/components/PohoriHero'

const FOTO = {
  soubor: '/foto/pohori/krkonose-hero-jan-kopriva.jpg',
  nahled: '/foto/pohori/krkonose-hero-jan-kopriva-nahled.jpg',
  alt: 'Pohled z vrcholu Sněžky přes hřebenovou pláň',
  autor: 'Jan Kopřiva',
  autorUrl: 'https://unsplash.com/@jxk',
  licence: 'unsplash' as const,
  zdrojUrl: 'https://unsplash.com/photos/mbFs0yZYb74',
  popisMista: 'pohled z vrcholu Sněžky (dle popisu autora u snímku)',
  prevzatoDne: '2026-07-29',
}

const HORA = { nazev: 'Sněžka', vyska: 1603 }

afterEach(cleanup)

describe('PohoriHero — fotka a její doložení', () => {
  it('zobrazí atribuci i u licence, která ji nevyžaduje (Unsplash)', () => {
    render(<PohoriHero nazev="Krkonoše" foto={FOTO} hora={HORA} />)
    const odkaz = screen.getByRole('link', { name: /Jan Kopřiva/ })
    expect(odkaz.textContent).toBe('foto: Jan Kopřiva · Unsplash')
    expect(odkaz.getAttribute('href')).toBe('https://unsplash.com/photos/mbFs0yZYb74')
  })

  it('popisek nese jen doložený text zdroje, nic navíc', () => {
    render(<PohoriHero nazev="Krkonoše" foto={FOTO} hora={HORA} />)
    expect(screen.getByText(FOTO.popisMista)).toBeTruthy()
    // Budovu na snímku autor nejmenuje — nesmí ji jmenovat ani web.
    expect(screen.queryByText(/Luční bouda|Ještěd/)).toBeNull()
  })

  it('nabídne menší variantu přes srcSet, ať se na mobilu netáhne 1920px', () => {
    const { container } = render(<PohoriHero nazev="Krkonoše" foto={FOTO} hora={HORA} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('srcset')).toContain(FOTO.nahled)
    expect(img?.getAttribute('alt')).toBe(FOTO.alt)
  })

  it('bez autora přizná, že autor není znám — nemlčí', () => {
    const { container } = render(
      <PohoriHero nazev="Krkonoše" foto={{ soubor: '/foto/pohori/x.jpg', licence: 'pd' }} />,
    )
    expect(container.textContent).toContain('foto: neznámý autor · volné dílo')
  })
})

describe('PohoriHero — nadpis a nadtitulek', () => {
  it('název pohoří je H1 uvnitř fotky', () => {
    render(<PohoriHero nazev="Krkonoše" kicker="Česko a Polsko · pohoří" foto={FOTO} hora={HORA} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Krkonoše')
    expect(screen.getByText('Česko a Polsko · pohoří')).toBeTruthy()
  })

  it('bez fotky zůstane H1 zachován (klidná textová hlavička)', () => {
    const { container } = render(<PohoriHero nazev="Jizerské hory" kicker="Česko · pohoří" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Jizerské hory')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.pohori-hero-holy')).toBeTruthy()
  })
})

describe('PohoriHero — rukopisná anotace jen z dat', () => {
  it('bez dat se anotace ani šipka nekreslí (nemáme na co ukázat)', () => {
    const { container } = render(<PohoriHero nazev="Krkonoše" foto={FOTO} hora={HORA} />)
    expect(container.querySelector('.phf-anotace')).toBeNull()
    expect(container.querySelector('.phf-sipka')).toBeNull()
  })

  it('s doloženou anotací se vykreslí na zadané pozici, šipka jen na pokyn', () => {
    const sAnotaci = { ...FOTO, anotace: { text: 'Luční bouda, 1 410 m', x: 56, y: 24, sipka: true } }
    const { container } = render(<PohoriHero nazev="Krkonoše" foto={sAnotaci} hora={HORA} />)
    const a = container.querySelector('.phf-anotace') as HTMLElement
    expect(a.textContent).toContain('Luční bouda, 1 410 m')
    expect(a.style.left).toBe('56%')
    expect(a.style.top).toBe('24%')
    expect(container.querySelector('.phf-sipka')).toBeTruthy()

    cleanup()
    const bezSipky = { ...FOTO, anotace: { text: 'jen popiska', sipka: false } }
    const { container: c2 } = render(<PohoriHero nazev="Krkonoše" foto={bezSipky} hora={HORA} />)
    expect(c2.querySelector('.phf-sipka')).toBeNull()
  })
})

describe('PohoriHero — razítko oblasti', () => {
  it('nese název oblasti, doloženou horu a její výšku', () => {
    const { container } = render(<PohoriHero nazev="Krkonoše" foto={FOTO} hora={HORA} />)
    const razitko = container.querySelector('.phf-razitko')!
    expect(razitko.textContent).toContain('KRKONOŠE')
    expect(razitko.textContent).toContain('SNĚŽKA')
    expect(razitko.textContent).toContain('1603 M')
    // Slogan z návrhu je tvrzení bez pramene — do razítka nepatří.
    expect(razitko.textContent).not.toContain('OD 1623')
  })

  it('bez doložené hory zůstane jen název oblasti — prázdný oblouk se nekreslí', () => {
    const { container } = render(<PohoriHero nazev="Jizerské hory" foto={FOTO} hora={null} />)
    const razitko = container.querySelector('.phf-razitko')!
    expect(razitko.textContent).toContain('JIZERSKÉ HORY')
    expect(razitko.textContent!.replace('JIZERSKÉ HORY', '').trim()).toBe('')
  })
})
