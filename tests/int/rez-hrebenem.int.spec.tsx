/**
 * Řez hřebenem (handoff F1 v2) — výškový profil oblasti.
 *
 * Návrh u řezu píše „vodorovné rozestupy jsou ilustrační". My je ilustrační
 * NEMÁME: vodorovná osa je zeměpisná délka z dat. Právě proto sem patří
 * testy — kdyby se osa jednou rozešla s daty, vypadal by řez pořád stejně
 * hezky a nikdo by si toho nevšiml.
 */
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import RezHrebenem, { siluetaZVrcholu, yProVysku, type BodChaty } from '@/components/RezHrebenem'
import { vrcholyZHtml } from '../../scripts/vrcholy-z-3d'
import type { Vrchol } from '@/lib/vrcholy'

const bod = (slug: string, vyska: number, lng: number): BodChaty => ({
  slug,
  nazev: slug,
  vyska,
  lng,
  url: `/cesko/krkonose/${slug}`,
})

afterEach(cleanup)

describe('svislá osa', () => {
  it('sedí s vodicími čarami návrhu (1600 / 1400 / 1200 m)', () => {
    expect(yProVysku(1600)).toBeCloseTo(41.5, 1)
    expect(yProVysku(1400)).toBeCloseTo(87.7, 1)
    expect(yProVysku(1200)).toBeCloseTo(133.8, 1)
  })

  it('ořezává mimo rozsah, aby bod nevyjel z plátna', () => {
    expect(yProVysku(400)).toBe(yProVysku(1000))
    expect(yProVysku(3000)).toBe(yProVysku(1650))
  })
})

describe('silueta hřebene', () => {
  const v = (nazev: string, lng: number, vyska: number): Vrchol => ({ nazev, lat: 50.7, lng, vyska })

  it('bere v každém svislém pruhu ten nejvyšší vrchol a řadí je od západu', () => {
    const s = siluetaZVrcholu(
      [v('nizky-zapad', 15.0, 1100), v('vysoky-zapad', 15.02, 1400), v('vychod', 15.9, 1300)],
      15.0,
      16.0,
      4,
    )
    expect(s).toHaveLength(2)
    expect(s[0].x).toBeLessThan(s[1].x)
    // V prvním pruhu vyhrál vyšší vrchol → menší y (výš na plátně).
    expect(s[0].y).toBeCloseTo(yProVysku(1400), 1)
  })

  it('bez vrcholů nebo bez rozpětí vrátí prázdno, ne NaN', () => {
    expect(siluetaZVrcholu([], 15, 16)).toEqual([])
    expect(siluetaZVrcholu([v('a', 15, 1200)], 15, 15)).toEqual([])
  })
})

describe('vykreslení', () => {
  const CHATY = [
    bod('a', 1400, 15.5),
    bod('b', 1200, 15.6),
    bod('c', 1100, 15.7),
    bod('nizka', 800, 15.8),
  ]
  const VRCHOLY: Vrchol[] = [
    { nazev: 'Sněžka', lat: 50.73, lng: 15.74, vyska: 1603 },
    { nazev: 'Luční hora', lat: 50.72, lng: 15.68, vyska: 1556 },
    { nazev: 'Studniční hora', lat: 50.72, lng: 15.7, vyska: 1555 },
    { nazev: 'Vysoké kolo', lat: 50.77, lng: 15.56, vyska: 1510 },
  ]

  it('chata pod dolní hranou řezu se nekreslí a je to přiznané v poznámce', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} />)
    expect(container.querySelectorAll('.rez-bod')).toHaveLength(3)
    expect(container.textContent).toContain('3 z 4')
  })

  it('bod chaty je odkaz na profil s výškou v aria-labelu (klávesnice, čtečka)', () => {
    render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} />)
    // Tisícová mezera je úzká nezlomitelná — regexp ji musí připustit.
    const odkaz = screen.getByRole('link', { name: /^a, 1\s400 m/ })
    expect(odkaz.getAttribute('href')).toBe('/cesko/krkonose/a')
  })

  it('popisky vrcholů se nepřekrývají — sousední vrchol téže výšky se vynechá', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} />)
    const popisky = [...container.querySelectorAll('.rez-vrchol')].map((e) => e.textContent)
    expect(popisky.join(' ')).toContain('SNĚŽKA')
    // Studniční hora leží těsně vedle Luční hory → jedna z nich vypadne.
    expect(popisky.some((p) => p?.includes('LUČNÍ') && p?.includes('STUDNIČNÍ'))).toBe(false)
    const maBlizke = popisky.filter((p) => p?.includes('LUČNÍ') || p?.includes('STUDNIČNÍ'))
    expect(maBlizke).toHaveLength(1)
  })

  it('pod tři body se řez nekreslí vůbec (křivka ze dvou bodů nic neřekne)', () => {
    const { container } = render(<RezHrebenem chaty={[bod('a', 1400, 15.5)]} vrcholy={VRCHOLY} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('vytažení vrcholů z 3D modelu', () => {
  it('přečte pole `vrcholy` a zahodí záznamy bez jména nebo výšky', () => {
    const html = `<script>const data = {"grid":[1,2],"vrcholy":[{"n":"Sněžka","lat":50.7,"lng":15.7,"ele":1603},{"n":"bez vysky","lat":50.7,"lng":15.7},{"lat":50.7,"lng":15.7,"ele":1200}],"chaty":[]}</script>`
    expect(vrcholyZHtml(html)).toEqual([{ nazev: 'Sněžka', lat: 50.7, lng: 15.7, vyska: 1603 }])
  })

  it('když klíč chybí, spadne — tiché prázdno by bylo horší', () => {
    expect(() => vrcholyZHtml('<html>nic</html>')).toThrow(/vrcholy/)
  })
})
