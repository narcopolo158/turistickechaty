/**
 * Blok „Odtud dál" mini-stránky střediska (handoff F1 §3 bod 6).
 *
 * Testy drží tři rozhodnutí, ne dnešní čísla:
 *   1. cíl se vypíše JEN s doloženým řetězem cíl→chata→trasa odtud — jinak by
 *      stránka tvrdila dosažitelnost, kterou nemáme spočítanou;
 *   2. sousední východiště se měří VZDUŠNOU čarou a řadí od nejbližšího;
 *      chybějící GPS není nula, ale vypadnutí ze seznamu;
 *   3. listování šablonou je cyklické a abecední podle českého řazení —
 *      poslední list vede na první, ne do prázdna.
 */
import { describe, expect, it } from 'vitest'

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import {
  cileOdtud,
  dalsiList,
  sousedniVychodiste,
  vzdusnaKm,
  type StrediskoVOblasti,
} from '@/lib/odtud-dal'

/** Střediska se čtou přímo z commitnutých YAML (bez DB), jako v `strediska-data`. */
const strediskaZeSouboru = (oblast: string): StrediskoVOblasti[] => {
  const slozka = join(process.cwd(), 'data', 'strediska', oblast)
  return readdirSync(slozka)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => parse(readFileSync(join(slozka, f), 'utf8')) as StrediskoVOblasti)
}

describe('vzdušná vzdálenost', () => {
  it('Pec pod Sněžkou → Špindlerův Mlýn je zhruba 11 km', () => {
    const km = vzdusnaKm({ lat: 50.6926, lng: 15.7318 }, { lat: 50.7256, lng: 15.6068 })
    expect(km).not.toBeNull()
    expect(km!).toBeGreaterThan(9)
    expect(km!).toBeLessThan(13)
  })

  it('bez souřadnic vrací null, ne nulu — chybějící GPS není „na stejném místě"', () => {
    expect(vzdusnaKm({ lat: 50.7, lng: 15.6 }, { lat: null, lng: null })).toBeNull()
    expect(vzdusnaKm({}, { lat: 50.7, lng: 15.6 })).toBeNull()
  })
})

const A: StrediskoVOblasti = { slug: 'a', nazev: 'Aves', lat: 50.7, lng: 15.6 }
const B: StrediskoVOblasti = { slug: 'b', nazev: 'Bučina', lat: 50.71, lng: 15.61 }
const C: StrediskoVOblasti = { slug: 'c', nazev: 'Cvikov', lat: 50.9, lng: 15.9 }
const BEZ_GPS: StrediskoVOblasti = { slug: 'd', nazev: 'Dolina' }

describe('sousední východiště', () => {
  it('řadí od nejbližšího a sebe sama vynechá', () => {
    const s = sousedniVychodiste(A, [A, C, B])
    expect(s.map((x) => x.slug)).toEqual(['b', 'c'])
  })

  it('středisko bez GPS ani bez slugu do seznamu nejde', () => {
    const s = sousedniVychodiste(A, [A, B, BEZ_GPS, { nazev: 'Bez slugu', lat: 50.7, lng: 15.62 }])
    expect(s.map((x) => x.slug)).toEqual(['b'])
  })

  it('vypíše nejvýš tři sousedy, ať patička nezhoustne', () => {
    const hodne = Array.from({ length: 8 }, (_, i) => ({
      slug: `s${i}`,
      nazev: `Středisko ${i}`,
      lat: 50.7 + i / 100,
      lng: 15.6,
    }))
    expect(sousedniVychodiste(A, hodne)).toHaveLength(3)
  })
})

describe('cíle odtud', () => {
  const topCile = [
    { nazev: 'Sněžné jámy', veta: 'Kary na polské straně.', nejblizChataSlug: 'szrenicka' },
    { nazev: 'Sněžka', veta: 'Nejvyšší hora Česka.', nejblizChataSlug: 'dom-slaski' },
    { nazev: 'Cíl bez vazby', veta: 'Nemá doloženou chatu.' },
  ]

  it('projde jen cíl, jehož chata má trasu odtud — ostatní mlčí', () => {
    const out = cileOdtud(topCile, [{ slug: 'dom-slaski', nazev: 'Dom Śląski', delkaKm: 4.2 }])
    expect(out).toHaveLength(1)
    expect(out[0]!.nazev).toBe('Sněžka')
    expect(out[0]!.chataNazev).toBe('Dom Śląski')
    expect(out[0]!.delkaKm).toBe(4.2)
  })

  it('drží pořadí z dat oblasti (první cíl nese fotopás sekce 05)', () => {
    const out = cileOdtud(topCile, [
      { slug: 'dom-slaski', nazev: 'Dom Śląski', delkaKm: 4.2 },
      { slug: 'szrenicka', nazev: 'Szrenicka', delkaKm: 2.1 },
    ])
    expect(out.map((c) => c.nazev)).toEqual(['Sněžné jámy', 'Sněžka'])
  })

  it('bez spočítaných tras nevypíše nic — dosažitelnost se nedomýšlí', () => {
    expect(cileOdtud(topCile, [])).toEqual([])
  })

  it('délka trasy smí chybět, cíl kvůli tomu nezmizí', () => {
    const out = cileOdtud(topCile, [{ slug: 'dom-slaski', nazev: 'Dom Śląski', delkaKm: null }])
    expect(out[0]!.delkaKm).toBeNull()
  })
})

describe('další list (listování šablonou)', () => {
  const trojice = [C, A, B]

  it('vede na abecedně další středisko podle českého řazení', () => {
    expect(dalsiList(trojice, 'a')!.slug).toBe('b')
    expect(dalsiList(trojice, 'b')!.slug).toBe('c')
  })

  it('poslední list se vrací na první, ne do prázdna', () => {
    expect(dalsiList(trojice, 'c')!.slug).toBe('a')
  })

  it('jediné středisko v oblasti listovat nemá kam', () => {
    expect(dalsiList([A], 'a')).toBeNull()
  })

  it('české řazení bere diakritiku jako člověk (Č před D, ne za Z)', () => {
    const dle = [
      { slug: 'd', nazev: 'Dolní Dvůr' },
      { slug: 'c', nazev: 'Černý Důl' },
      { slug: 'b', nazev: 'Benecko' },
    ]
    expect(dalsiList(dle, 'b')!.slug).toBe('c')
    expect(dalsiList(dle, 'c')!.slug).toBe('d')
  })
})

describe('nad skutečnými daty střediska', () => {
  it('každé krkonošské středisko má kam listovat a nelistuje samo na sebe', () => {
    const strediska = strediskaZeSouboru('krkonose')
    expect(strediska.length).toBeGreaterThan(1)
    for (const s of strediska) {
      if (!s.slug) continue
      const dalsi = dalsiList(strediska, s.slug)
      expect(dalsi, `${s.slug}: nemá další list`).not.toBeNull()
      expect(dalsi!.slug, `${s.slug}: listuje sám na sebe`).not.toBe(s.slug)
    }
  })

  it('listováním se projdou všechna střediska oblasti a kruh se uzavře', () => {
    const strediska = strediskaZeSouboru('krkonose').filter((s) => s.slug)
    const start = strediska[0]!.slug!
    const navstivene = new Set<string>()
    let kde = start
    for (let i = 0; i < strediska.length; i++) {
      navstivene.add(kde)
      kde = dalsiList(strediska, kde)!.slug
    }
    expect(navstivene.size).toBe(strediska.length)
    expect(kde).toBe(start)
  })
})
