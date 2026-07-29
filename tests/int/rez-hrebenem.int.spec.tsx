/**
 * Řez hřebenem (handoff F1 v2, druhá verze) — panorama pohoří.
 *
 * Návrh u řezu píše „vodorovné rozestupy jsou ilustrační". My je ilustrační
 * NEMÁME: vodorovná osa je zeměpisná délka a terén je skutečný výškový model.
 * Právě proto sem patří testy — kdyby se osa nebo vrstvy jednou rozešly
 * s daty, vypadal by řez pořád stejně hezky a nikdo by si toho nevšiml.
 */
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import RezHrebenem, { hladkaCesta, mapaVysky, type BodChaty } from '@/components/RezHrebenem'
import { rezZHtml, vrcholyZHtml } from '../../scripts/vrcholy-z-3d'
import type { Vrchol, Vrstva } from '@/lib/vrcholy'

const bod = (slug: string, vyska: number, lng: number): BodChaty => ({
  slug,
  nazev: slug,
  vyska,
  lng,
  url: `/cesko/krkonose/${slug}`,
})

const VRCHOLY: Vrchol[] = [
  { nazev: 'Śnieżka / Sněžka', lat: 50.73, lng: 15.74, vyska: 1603 },
  { nazev: 'Luční hora', lat: 50.72, lng: 15.68, vyska: 1556 },
  { nazev: 'Studniční hora', lat: 50.72, lng: 15.7, vyska: 1555 },
  { nazev: 'Vysoké kolo', lat: 50.77, lng: 15.56, vyska: 1510 },
]

const VRSTVY: Vrstva[] = [
  { pas: 'sever', vysky: [700, 900, 1100, 900, 700] },
  { pas: 'hreben', vysky: [900, 1200, 1550, 1300, 1000] },
  { pas: 'jih', vysky: [500, 700, 900, 800, 600] },
]

afterEach(cleanup)

describe('svislá osa', () => {
  it('nejvyšší bod leží nahoře, nejnižší dole a strop se odvozuje z dat', () => {
    const y = mapaVysky(1603)
    expect(y(1603)).toBeLessThan(y(1000))
    expect(y(1000)).toBeLessThan(y(400))
    // Pod dolní hranicí se ořezává, aby bod nevyjel z plátna.
    expect(y(100)).toBe(y(400))
  })

  it('měřítko se přizpůsobí nižšímu pohoří (Jizerky nejsou Krkonoše)', () => {
    const krkonose = mapaVysky(1603)
    const jizerky = mapaVysky(1127)
    // Táž výška je v nižším pohoří výš na plátně — jinak by řez Jizerek
    // vypadal jako placka pod prázdnou oblohou.
    expect(jizerky(1100)).toBeLessThan(krkonose(1100))
  })
})

describe('křivka terénu', () => {
  it('je hladká (bezier), ne lomená čára', () => {
    const d = hladkaCesta([
      { x: 0, y: 100 },
      { x: 50, y: 40 },
      { x: 100, y: 80 },
    ])
    expect(d.startsWith('M0.0,100.0')).toBe(true)
    expect(d).toContain('C')
    expect(d).not.toContain('L')
  })

  it('z jednoho bodu nekreslí nic', () => {
    expect(hladkaCesta([{ x: 0, y: 0 }])).toBe('')
  })
})

describe('vykreslení', () => {
  const CHATY = [
    bod('a', 1400, 15.5),
    bod('b', 1200, 15.6),
    bod('c', 1100, 15.7),
    bod('d', 800, 15.8),
  ]

  it('vykreslí všechny chaty a řekne, kolik jich je', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    expect(container.querySelectorAll('.rez-bod')).toHaveLength(4)
    expect(container.textContent).toContain('4 chat')
  })

  it('kreslí tři vrstvy terénu z výškového modelu, odzadu dopředu', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    const vrstvy = [...container.querySelectorAll('.rez-vrstva')].map((e) => e.getAttribute('class'))
    expect(vrstvy).toEqual([
      'rez-vrstva rez-vrstva--sever',
      'rez-vrstva rez-vrstva--hreben',
      'rez-vrstva rez-vrstva--jih',
    ])
  })

  it('bez vrstev se kreslí aspoň body — chybějící model není důvod sekci zahodit', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} />)
    expect(container.querySelectorAll('.rez-vrstva')).toHaveLength(0)
    expect(container.querySelectorAll('.rez-bod')).toHaveLength(4)
  })

  it('bod chaty je odkaz na profil s výškou v aria-labelu (klávesnice, čtečka)', () => {
    render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    // Tisícová mezera je úzká nezlomitelná — regexp ji musí připustit.
    const odkaz = screen.getByRole('link', { name: /^a, 1\s400 m/ })
    expect(odkaz.getAttribute('href')).toBe('/cesko/krkonose/a')
  })

  it('popisku napevno má pět nejvyšších, a to s odstupem', () => {
    const husto = [
      bod('nej', 1500, 15.5),
      bod('hned-vedle', 1490, 15.502),
      bod('daleko', 1400, 15.9),
    ]
    const { container } = render(<RezHrebenem chaty={husto} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    const stale = [...container.querySelectorAll('.rez-bod--stale')].map((e) =>
      e.getAttribute('aria-label'),
    )
    expect(stale.some((s) => s?.startsWith('nej,'))).toBe(true)
    // Soused 200 m vedle by popisku překryl — napevno ji nedostane.
    expect(stale.some((s) => s?.startsWith('hned-vedle,'))).toBe(false)
    expect(stale.some((s) => s?.startsWith('daleko,'))).toBe(true)
  })

  it('popisky vrcholů se nepřekrývají — sousední vrchol téže výšky se vynechá', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    const popisky = [...container.querySelectorAll('.rez-vrchol')].map((e) => e.textContent ?? '')
    // Hraniční vrchol si nese obě jména z OSM, nekrátíme je.
    expect(popisky.join(' ')).toContain('Śnieżka / Sněžka')
    const blizke = popisky.filter((p) => p.includes('Luční') || p.includes('Studniční'))
    expect(blizke).toHaveLength(1)
  })

  it('pod tři body se řez nekreslí vůbec', () => {
    const { container } = render(<RezHrebenem chaty={[bod('a', 1400, 15.5)]} vrcholy={VRCHOLY} />)
    expect(container.innerHTML).toBe('')
  })

  it('řekne, že terén je model, ne obrys změřený v terénu', () => {
    const { container } = render(<RezHrebenem chaty={CHATY} vrcholy={VRCHOLY} vrstvy={VRSTVY} />)
    expect(container.textContent).toMatch(/výškový model/)
  })
})

describe('vytažení dat z 3D modelu', () => {
  it('přečte pole `vrcholy` a zahodí záznamy bez jména nebo výšky', () => {
    const html = `<script>const data = {"grid":[1,2],"vrcholy":[{"n":"Sněžka","lat":50.7,"lng":15.7,"ele":1603},{"n":"bez vysky","lat":50.7,"lng":15.7},{"lat":50.7,"lng":15.7,"ele":1200}],"chaty":[]}</script>`
    expect(vrcholyZHtml(html)).toEqual([{ nazev: 'Sněžka', lat: 50.7, lng: 15.7, vyska: 1603 }])
  })

  it('z mřížky výškopisu udělá tři pásy s nejvyšším terénem ve sloupci', () => {
    // 3 sloupce × 3 řádky: jih (řádek 0), hřeben (1), sever (2).
    const html =
      '"bbox":{"latMin":50.6,"lngMin":15.3,"latMax":50.8,"lngMax":15.9},"nx":3,"ny":3,' +
      '"grid":[[100,200,300],[900,800,700],[400,500,600]],"chaty":[]'
    const r = rezZHtml(html)
    expect(r.nx).toBe(3)
    expect(r.vrstvy.map((v) => v.pas)).toEqual(['sever', 'hreben', 'jih'])
    expect(r.vrstvy.find((v) => v.pas === 'hreben')!.vysky).toEqual([900, 800, 700])
    expect(r.vrstvy.find((v) => v.pas === 'jih')!.vysky).toEqual([100, 200, 300])
  })

  it('když klíč chybí, spadne — tiché prázdno by bylo horší', () => {
    expect(() => vrcholyZHtml('<html>nic</html>')).toThrow(/vrcholy/)
    expect(() => rezZHtml('<html>nic</html>')).toThrow(/bbox/)
  })
})
