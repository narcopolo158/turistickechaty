/**
 * DATA-06 (increment 3b): výběr přístupových tras — z uzlu chaty najít nejbližší
 * dosažitelné výchozí body (dle ceny routingu) a složit k nim trasu. Nad malým
 * syntetickým grafem, bez sítě.
 */
import { describe, expect, it } from 'vitest'

import { postavGraf, uzelKlic } from '../../scripts/data06-graf'
import { vyberPristupy, type VychoziSnap } from '../../scripts/data06-pristupove-trasy'
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
