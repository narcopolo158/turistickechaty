/**
 * DATA-06 (increment 1): parser značení KČT z OSM tagů (`osmc:symbol`, `kct_*`,
 * `colour`), výpočet délky trasy z geometrie a roztřídění relací na značené
 * (do katalogu) vs. bez rozpoznaného značení (k ruční kontrole). Nic se
 * nedomýšlí — neznámá barva = null. Overpass se nevolá (sandbox nedosáhne;
 * ostrý běh dělá Actions).
 */
import { describe, expect, it } from 'vitest'

import {
  delkaTrasyKm,
  overpassDotazTrasy,
  zpracujTrasy,
  znaceniZTagu,
  type TrasaRelace,
} from '../../scripts/data06-trasy'

describe('DATA-06 · značení z OSM tagů', () => {
  it('osmc:symbol → barva KČT (první pole je barva cesty)', () => {
    expect(znaceniZTagu({ 'osmc:symbol': 'red:white:red_bar' })?.znaceni).toBe('cervena')
    expect(znaceniZTagu({ 'osmc:symbol': 'blue:white:blue_bar' })?.znaceni).toBe('modra')
    expect(znaceniZTagu({ 'osmc:symbol': 'green:white:green_bar' })?.znaceni).toBe('zelena')
    expect(znaceniZTagu({ 'osmc:symbol': 'yellow:white:yellow_bar' })?.znaceni).toBe('zluta')
  })

  it('fallback na kct_* tagy', () => {
    expect(znaceniZTagu({ kct_red: 'major' })?.znaceni).toBe('cervena')
    expect(znaceniZTagu({ kct_yellow: 'minor' })?.znaceni).toBe('zluta')
  })

  it('fallback na colour — název i hex', () => {
    expect(znaceniZTagu({ colour: 'green' })?.znaceni).toBe('zelena')
    expect(znaceniZTagu({ colour: '#FF0000' })?.znaceni).toBe('cervena')
    expect(znaceniZTagu({ color: '#ffff00' })?.znaceni).toBe('zluta')
  })

  it('osmc:symbol má přednost před colour', () => {
    const v = znaceniZTagu({ 'osmc:symbol': 'blue:white:blue_bar', colour: 'red' })
    expect(v?.znaceni).toBe('modra')
    expect(v?.zdroj).toContain('osmc:symbol')
  })

  it('nerozpoznané / prázdné → null (nedomýšlet)', () => {
    expect(znaceniZTagu({})).toBeNull()
    expect(znaceniZTagu({ 'osmc:symbol': 'black:white:black_bar' })).toBeNull()
    expect(znaceniZTagu({ colour: 'purple' })).toBeNull()
    expect(znaceniZTagu({ colour: '#123456' })).toBeNull()
  })
})

describe('DATA-06 · délka a roztřídění tras', () => {
  const usek = (body: [number, number][]) => ({
    type: 'way',
    ref: 1,
    role: '',
    geometry: body.map(([lat, lon]) => ({ lat, lon })),
  })

  it('délka trasy = součet úseků (haversine), km na 1 desetinné místo', () => {
    // ~1,11 km na stupeň zeměpisné šířky * 0,01 = ~1,11 km; dva úseky.
    const rel: TrasaRelace = {
      type: 'relation',
      id: 1,
      members: [usek([[50.0, 15.0], [50.01, 15.0]]), usek([[50.01, 15.0], [50.02, 15.0]])],
    }
    expect(delkaTrasyKm(rel)).toBeGreaterThan(2.1)
    expect(delkaTrasyKm(rel)).toBeLessThan(2.3)
  })

  it('roztřídí značené do katalogu, bez barvy do reportu', () => {
    const relace: TrasaRelace[] = [
      {
        type: 'relation',
        id: 10,
        tags: { name: 'Červená z Harrachova', ref: 'KČT 0410', 'osmc:symbol': 'red:white:red_bar' },
        members: [usek([[50.0, 15.0], [50.01, 15.0]])],
      },
      { type: 'relation', id: 11, tags: { name: 'Neznámá trasa' }, members: [] },
    ]
    const { znacene, bezZnaceni } = zpracujTrasy(relace)
    expect(znacene).toHaveLength(1)
    expect(znacene[0]).toMatchObject({ osmId: 10, znaceni: 'cervena', ref: 'KČT 0410', pocetUseku: 1 })
    expect(znacene[0].url).toContain('/relation/10')
    expect(bezZnaceni).toHaveLength(1)
    expect(bezZnaceni[0].osmId).toBe(11)
  })
})

describe('DATA-06 · tvar Overpass dotazu', () => {
  it('ptá se na route=hiking s geometrií v bboxu Krkonoš', () => {
    const dotaz = overpassDotazTrasy()
    expect(dotaz).toContain('route')
    expect(dotaz).toContain('hiking')
    expect(dotaz).toContain('out geom')
  })
})
