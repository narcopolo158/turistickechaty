/**
 * DATA-06 (increment 3b): výběr přístupových tras — z uzlu chaty najít nejbližší
 * dosažitelné výchozí body (dle ceny routingu) a složit k nim trasu. Nad malým
 * syntetickým grafem, bez sítě.
 */
import { describe, expect, it } from 'vitest'

import { postavGraf, uzelKlic } from '../../scripts/data06-graf'
import { vyberPristupy, vyberPristupyZKatalogu, type VychoziSnap } from '../../scripts/data06-pristupove-trasy'
import type { DoporucenyBod } from '../../scripts/data06-katalog-vychozi'
import type { TrasaRelace } from '../../scripts/data06-trasy'

/** Značená (červená) linka A–B–C–D po zeměpisné délce. */
const linka: TrasaRelace = {
  type: 'relation',
  id: 1,
  tags: { 'osmc:symbol': 'red:white:red_bar' },
  members: [
    {
      type: 'way',
      ref: 0,
      role: '',
      geometry: [
        { lat: 50.0, lon: 15.0 }, // A (chata)
        { lat: 50.0, lon: 15.001 }, // B (blízký bod)
        { lat: 50.0, lon: 15.002 }, // C
        { lat: 50.0, lon: 15.003 }, // D (vzdálený bod)
      ],
    },
  ],
}

const A = uzelKlic(50.0, 15.0)
const B = uzelKlic(50.0, 15.001)
const D = uzelKlic(50.0, 15.003)

describe('DATA-06 · výběr přístupových tras', () => {
  const graf = postavGraf([linka])
  const vychozi: VychoziSnap[] = [
    { nazev: 'Daleko', typ: 'obec', uzel: D },
    { nazev: 'Blízko', typ: 'lanovka', uzel: B },
  ]

  it('vrátí nejbližší výchozí body seřazené (blízký první), s trasou a značením', () => {
    const p = vyberPristupy(graf, A, vychozi, 2)
    expect(p.map((x) => x.vychoziBod)).toEqual(['Blízko', 'Daleko'])
    expect(p[0].delkaKm).toBeLessThan(p[1].delkaKm)
    expect(p[0].useky.every((u) => u.znaceni === 'cervena')).toBe(true)
    expect(p[0].podilNeznacenychProc).toBe(0)
    expect(p[0].geometrie.length).toBeGreaterThanOrEqual(2)
  })

  it('respektuje počet přístupů', () => {
    expect(vyberPristupy(graf, A, vychozi, 1).map((x) => x.vychoziBod)).toEqual(['Blízko'])
  })

  it('vynechá výchozí bod přímo na uzlu chaty (nulová trasa) i nedosažitelný', () => {
    const graf2 = postavGraf([
      linka,
      { type: 'relation', id: 2, tags: { 'osmc:symbol': 'blue:white:blue_bar' }, members: [{ type: 'way', ref: 0, role: '', geometry: [{ lat: 50.9, lon: 15.9 }, { lat: 50.9, lon: 15.901 }] }] },
    ])
    const vych: VychoziSnap[] = [
      { nazev: 'Na chatě', typ: 'lanovka', uzel: A }, // stejný uzel → nulová trasa, vynechat
      { nazev: 'Jiná komponenta', typ: 'obec', uzel: uzelKlic(50.9, 15.9) }, // nedosažitelné
      { nazev: 'Blízko', typ: 'lanovka', uzel: B },
    ]
    const p = vyberPristupy(graf2, A, vych, 5)
    expect(p.map((x) => x.vychoziBod)).toEqual(['Blízko']) // jen dosažitelný nenulový
  })
})

describe('DATA-06 · přístupy z katalogu (pořadí + metadata + sanity)', () => {
  const graf = postavGraf([linka])
  const bod = (over: Partial<DoporucenyBod>): DoporucenyBod => ({
    poradi: 1,
    vychoziBod: 'X',
    typ: 'obec',
    doprava: '',
    sezona: '',
    poznamka: '',
    zdroje: [],
    lat: 50.0,
    lng: 15.001,
    ...over,
  })

  it('respektuje POŘADÍ katalogu (ne routovací cenu) — daleký pořadí 1 je první', () => {
    const doporucene = [
      bod({ poradi: 1, vychoziBod: 'Daleko', lat: 50.0, lng: 15.003 }), // uzel D (dál)
      bod({ poradi: 2, vychoziBod: 'Blízko', lat: 50.0, lng: 15.001 }), // uzel B (blíž)
    ]
    const p = vyberPristupyZKatalogu(graf, A, 50.0, 15.0, doporucene, 3)
    expect(p.map((x) => x.vychoziBod)).toEqual(['Daleko', 'Blízko']) // pořadí, ne vzdálenost
    expect(p[0].zdrojBodu).toBe('katalog')
  })

  it('přenese metadata (pořadí, doprava, sezóna, poznámka, zdroje)', () => {
    const doporucene = [
      bod({
        vychoziBod: 'Blízko',
        doprava: 'autobus X',
        sezona: 'léto',
        poznamka: 'pozn',
        zdroje: ['https://a.cz'],
        lat: 50.0,
        lng: 15.001,
      }),
    ]
    const p = vyberPristupyZKatalogu(graf, A, 50.0, 15.0, doporucene, 3)
    expect(p[0]).toMatchObject({ poradi: 1, doprava: 'autobus X', sezona: 'léto', poznamka: 'pozn', zdroje: ['https://a.cz'] })
  })

  it('zahodí špatný geokód (nástup > 12 km vzdušně od chaty)', () => {
    const doporucene = [
      bod({ vychoziBod: 'Chyba', lat: 50.3, lng: 15.0 }), // ~33 km od chaty → sanity guard
      bod({ vychoziBod: 'Blízko', poradi: 2, lat: 50.0, lng: 15.001 }),
    ]
    const p = vyberPristupyZKatalogu(graf, A, 50.0, 15.0, doporucene, 3)
    expect(p.map((x) => x.vychoziBod)).toEqual(['Blízko'])
  })

  it('nepřidá dva nástupy na týž uzel (dedup) ani nulovou trasu', () => {
    const doporucene = [
      bod({ vychoziBod: 'Na chatě', lat: 50.0, lng: 15.0 }), // uzel A = chata → nulová trasa
      bod({ vychoziBod: 'Blízko A', poradi: 2, lat: 50.0, lng: 15.001 }), // uzel B
      bod({ vychoziBod: 'Blízko B', poradi: 3, lat: 50.0, lng: 15.0011 }), // taky ~uzel B → dedup
    ]
    const p = vyberPristupyZKatalogu(graf, A, 50.0, 15.0, doporucene, 3)
    expect(p.map((x) => x.vychoziBod)).toEqual(['Blízko A'])
  })
})
