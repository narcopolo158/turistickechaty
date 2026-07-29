/**
 * Titulní fotka oblasti (FOTO-01).
 *
 * Nejde o kosmetiku: test hlídá dvě věci, na kterých stojí poctivost webu —
 * (1) atribuce se zobrazí i u licence, která ji NEVYŽADUJE (Unsplash), protože
 * jinak by web u faktů prameny jmenoval a u obrázků mlčel; (2) popisek říká jen
 * to, co dokládá zdroj — komponenta nesmí přidat nic vlastního.
 */
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { PohoriHeroFoto } from '@/components/PohoriHeroFoto'

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

afterEach(cleanup)

describe('PohoriHeroFoto', () => {
  it('zobrazí atribuci i u licence, která ji nevyžaduje (Unsplash)', () => {
    render(<PohoriHeroFoto foto={FOTO} />)
    const odkaz = screen.getByRole('link', { name: /Jan Kopřiva/ })
    expect(odkaz.textContent).toBe('Foto: Jan Kopřiva · Unsplash')
    expect(odkaz.getAttribute('href')).toBe('https://unsplash.com/photos/mbFs0yZYb74')
  })

  it('popisek nese jen doložený text zdroje, nic navíc', () => {
    render(<PohoriHeroFoto foto={FOTO} />)
    expect(screen.getByText(FOTO.popisMista)).toBeTruthy()
    // Budovu na snímku autor nejmenuje — nesmí ji jmenovat ani web.
    expect(screen.queryByText(/Luční bouda|Ještěd/)).toBeNull()
  })

  it('nabídne menší variantu přes srcSet, ať se na mobilu netáhne 1920px', () => {
    const { container } = render(<PohoriHeroFoto foto={FOTO} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('srcset')).toContain(FOTO.nahled)
    expect(img?.getAttribute('alt')).toBe(FOTO.alt)
  })

  it('bez souboru nevykreslí nic (oblast bez fotky nemá prázdný rám)', () => {
    const { container } = render(<PohoriHeroFoto foto={{ autor: 'Někdo' }} />)
    expect(container.innerHTML).toBe('')
  })

  it('bez autora přizná, že autor není znám — nemlčí', () => {
    const { container } = render(
      <PohoriHeroFoto foto={{ soubor: '/foto/pohori/x.jpg', licence: 'pd' }} />,
    )
    expect(container.textContent).toContain('Foto: neznámý autor · volné dílo')
  })
})
