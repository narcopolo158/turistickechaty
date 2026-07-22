/**
 * DATA-06: přechody mezi chatami (sousední chaty). Nad malým syntetickým grafem
 * ověří výběr nejbližších JINÝCH chat po značených (řazení dle délky, vynechání
 * sebe sama, počet, nedosažitelné v jiné komponentě, cílová URL).
 */
import { describe, expect, it } from 'vitest'

import { postavGraf, uzelKlic } from '../../scripts/data06-graf'
import { vyberPrechody, type CilSnap } from '../../scripts/data06-prechody'
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
        { lat: 50.0, lon: 15.0 }, // A
        { lat: 50.0, lon: 15.001 }, // B
        { lat: 50.0, lon: 15.002 }, // C
        { lat: 50.0, lon: 15.003 }, // D
      ],
    },
  ],
}

const A = uzelKlic(50.0, 15.0)
const B = uzelKlic(50.0, 15.001)
const C = uzelKlic(50.0, 15.002)
const D = uzelKlic(50.0, 15.003)

describe('DATA-06 · přechody mezi chatami', () => {
  const graf = postavGraf([linka])
  const cile: CilSnap[] = [
    { slug: 'a', nazev: 'Chata A', uzel: A, url: '/cesko/krkonose/a' },
    { slug: 'b', nazev: 'Chata B', uzel: B, url: '/cesko/krkonose/b' },
    { slug: 'c', nazev: 'Chata C', uzel: C, url: '/cesko/krkonose/c' },
    { slug: 'd', nazev: 'Chata D', uzel: D, url: '/cesko/krkonose/d' },
  ]

  it('vrátí nejbližší JINÉ chaty seřazené (ne sebe), s délkou, značením a URL', () => {
    const p = vyberPrechody(graf, A, 'a', cile, 3)
    expect(p.map((x) => x.cilSlug)).toEqual(['b', 'c', 'd']) // ne 'a'
    expect(p[0].delkaKm).toBeLessThan(p[1].delkaKm)
    expect(p[0].cilUrl).toBe('/cesko/krkonose/b')
    expect(p[0].useky.every((u) => u.znaceni === 'cervena')).toBe(true)
    expect(p[0].podilNeznacenychProc).toBe(0)
  })

  it('respektuje počet přechodů', () => {
    expect(vyberPrechody(graf, A, 'a', cile, 1).map((x) => x.cilSlug)).toEqual(['b'])
  })

  it('vynechá nedosažitelnou chatu (jiná komponenta)', () => {
    const graf2 = postavGraf([
      linka,
      { type: 'relation', id: 2, tags: { 'osmc:symbol': 'blue:white:blue_bar' }, members: [{ type: 'way', ref: 0, role: '', geometry: [{ lat: 50.9, lon: 15.9 }, { lat: 50.9, lon: 15.901 }] }] },
    ])
    const cile2: CilSnap[] = [...cile, { slug: 'x', nazev: 'Chata X', uzel: uzelKlic(50.9, 15.9), url: '/cesko/krkonose/x' }]
    const p = vyberPrechody(graf2, A, 'a', cile2, 5)
    expect(p.map((x) => x.cilSlug)).toEqual(['b', 'c', 'd']) // X nedosažitelná
  })
})
