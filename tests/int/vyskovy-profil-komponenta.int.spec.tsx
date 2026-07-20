/**
 * Render komponenty VyskovyProfil nad reálnými daty tras z YAML (zdroj pravdy).
 * Šablona profilu zobrazuje křivku první trasy s daty (rozhodnutí session 07);
 * tenhle test dokládá, že renderovatelné jsou VŠECHNY trasy v YAML — když
 * přibude trasa nebo se změní pořadí, křivka nesmí spadnout ani lhát.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import VyskovyProfil, { type BodProfilu } from '../../src/components/VyskovyProfil'

type Trasa = { vychoziBod: string; delkaKm: number; vyskovyProfil?: BodProfilu[] }

const yaml = parse(
  readFileSync(join(process.cwd(), 'data/chaty/krkonose/lucni-bouda.yaml'), 'utf8'),
) as { nazev: string; trasy: Trasa[] }

const trasySProfilem = yaml.trasy.filter(
  (t) => Array.isArray(t.vyskovyProfil) && t.vyskovyProfil.length >= 2,
)

afterEach(cleanup)

describe('VyskovyProfil nad daty z lucni-bouda.yaml', () => {
  it('YAML obsahuje aspoň dvě trasy s výškovým profilem (Špindl + Pec)', () => {
    expect(trasySProfilem.length).toBeGreaterThanOrEqual(2)
  })

  it.each(trasySProfilem.map((t) => [t.vychoziBod, t] as const))(
    'trasa „%s" vyrenderuje křivku, popisky paty i aria-label',
    (_nazev, trasa) => {
      const { container } = render(
        <VyskovyProfil body={trasa.vyskovyProfil!} start={trasa.vychoziBod} cil={yaml.nazev} />,
      )

      // SVG s přístupným popisem trasy a délky (desetinná čárka česky)
      const svg = container.querySelector('svg')!
      expect(svg).not.toBeNull()
      const delka = trasa.delkaKm.toFixed(1).replace('.', ',')
      expect(svg.getAttribute('aria-label')).toBe(
        `Výškový profil trasy: ${trasa.vychoziBod} → ${yaml.nazev}, ${delka} km`,
      )

      // Dvě path: výplň (uzavřená k základně) + křivka; hladká křivka = C segment na každý bod
      const cesty = svg.querySelectorAll('path')
      expect(cesty).toHaveLength(2)
      const vypln = cesty[0].getAttribute('d')!
      const krivka = cesty[1].getAttribute('d')!
      expect(krivka.startsWith('M')).toBe(true)
      expect(krivka.match(/C/g)).toHaveLength(trasa.vyskovyProfil!.length - 1)
      expect(vypln.endsWith('Z')).toBe(true)

      // Datové body křivky (M + koncový bod každého C) se drží plátna (x 20–1010, y 8–88).
      // Kontrolní body Catmull-Rom smí mírně přestřelit (vlastnost hladké interpolace),
      // ale nikdy ven z viewBoxu 0–1030 × 0–110 — jinak by se křivka ořízla.
      const souradnice = krivka.match(/-?[\d.]+,-?[\d.]+/g)!
      souradnice.forEach((pár, i) => {
        const [x, y] = pár.split(',').map(Number)
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(1030)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(110)
        const jeDatovyBod = i === 0 || i % 3 === 0 // M, pak každá třetí dvojice = koncový bod C
        if (jeDatovyBod) {
          expect(x).toBeGreaterThanOrEqual(19.9)
          expect(x).toBeLessThanOrEqual(1010.1)
          expect(y).toBeGreaterThanOrEqual(7.9)
          expect(y).toBeLessThanOrEqual(88.1)
        }
      })

      // Popisky paty: start s nadmořskou výškou prvního bodu, cíl s celkovou délkou
      const texty = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent)
      const vyskaStartu = trasa.vyskovyProfil![0][1].toLocaleString('cs')
      expect(texty[0]).toBe(`0 KM · ${trasa.vychoziBod} ${vyskaStartu} M`.toUpperCase())
      expect(texty[1]).toBe(`${delka} KM · ${yaml.nazev}`.toUpperCase())

      // Bod hoveru startuje skrytý
      expect(svg.querySelector('circle')!.getAttribute('opacity')).toBe('0')
    },
  )

  it('krajní body křivky odpovídají prvnímu a poslednímu bodu profilu (žádné ořezání)', () => {
    for (const trasa of trasySProfilem) {
      const { container } = render(
        <VyskovyProfil body={trasa.vyskovyProfil!} start={trasa.vychoziBod} cil={yaml.nazev} />,
      )
      const krivka = container.querySelectorAll('path')[1].getAttribute('d')!
      const prvni = krivka.match(/^M([\d.]+),([\d.]+)/)!
      const posledni = krivka.match(/([\d.]+),([\d.]+)$/)!
      expect(Number(prvni[1])).toBeCloseTo(20, 0) // X0
      expect(Number(posledni[1])).toBeCloseTo(1010, 0) // X1
      cleanup()
    }
  })
})
