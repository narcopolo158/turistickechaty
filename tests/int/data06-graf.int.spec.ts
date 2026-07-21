/**
 * DATA-06 (increment 3, jádro): stavba routovacího grafu ze značených tras,
 * přichycení bodu k nejbližšímu uzlu a hledání cesty (Dijkstra s preferencí
 * značených tras). Nad malým syntetickým grafem — deterministické, bez sítě.
 */
import { describe, expect, it } from 'vitest'

import {
  najdiNejblizsiUzel,
  najdiTrasu,
  postavGraf,
  uzelKlic,
  type Graf,
} from '../../scripts/data06-graf'
import type { TrasaRelace, Znaceni } from '../../scripts/data06-trasy'

/** Relace s cestami zadanými jako pole [lat, lon] bodů. */
const rel = (id: number, znaceni: Znaceni | null, ...cesty: [number, number][][]): TrasaRelace => ({
  type: 'relation',
  id,
  tags: znaceni ? { 'osmc:symbol': `${{ cervena: 'red', modra: 'blue', zelena: 'green', zluta: 'yellow', cerna: 'black' }[znaceni]}:white:bar` } : {},
  members: cesty.map((cesta) => ({
    type: 'way',
    ref: 0,
    role: '',
    geometry: cesta.map(([lat, lon]) => ({ lat, lon })),
  })),
})

describe('DATA-06 · stavba grafu', () => {
  it('sdílený bod dvou cest splyne v jeden uzel a spojí je', () => {
    // A—B (relace 1) a B—C (relace 2) sdílejí bod B → souvislý graf A–B–C.
    const graf = postavGraf([
      rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001]]),
      rel(2, 'cervena', [[50.0, 15.001], [50.0, 15.002]]),
    ])
    expect(graf.uzly.size).toBe(3)
    expect(graf.sousede.get(uzelKlic(50.0, 15.001))).toHaveLength(2) // B má dva sousedy
    const trasa = najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.002))
    expect(trasa).not.toBeNull()
    expect(trasa!.uzly).toHaveLength(3)
  })

  it('duplicitní/nulový segment nezaloží smyčku', () => {
    const graf = postavGraf([rel(1, 'modra', [[50.0, 15.0], [50.0, 15.0], [50.0, 15.001]])])
    expect(graf.uzly.size).toBe(2)
    expect(graf.sousede.get(uzelKlic(50.0, 15.0))).toHaveLength(1)
  })
})

describe('DATA-06 · přichycení k nejbližšímu uzlu', () => {
  const graf: Graf = postavGraf([
    rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001], [50.0, 15.002]]),
  ])

  it('vrátí nejbližší uzel a vzdálenost v metrech', () => {
    const nej = najdiNejblizsiUzel(graf, 50.00005, 15.00105)
    expect(nej?.klic).toBe(uzelKlic(50.0, 15.001))
    expect(nej!.vzdalenostM).toBeLessThan(20)
  })

  it('prázdný graf → null', () => {
    expect(najdiNejblizsiUzel(postavGraf([]), 50, 15)).toBeNull()
  })
})

describe('DATA-06 · hledání cesty', () => {
  it('nejkratší cesta vrací délku, geometrii i uzly', () => {
    const graf = postavGraf([rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001], [50.0, 15.002]])])
    const trasa = najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.002))!
    expect(trasa.uzly).toEqual([uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.001), uzelKlic(50.0, 15.002)])
    expect(trasa.geometrie).toHaveLength(3)
    expect(trasa.delkaKm).toBeGreaterThan(0.13) // 2× ~71 m ≈ 0,14 km
    expect(trasa.delkaKm).toBeLessThan(0.15)
  })

  it('preferuje značenou trasu, i když je v metrech delší', () => {
    // Přímá NEznačená spojka A→C (~143 m) vs. značená oklika A→B→C (~264 m).
    // S penalizací neznačené (×4) vyhraje značená: 264 < 143×4.
    const graf = postavGraf([
      rel(1, null, [[50.0, 15.0], [50.0, 15.002]]), // neznačená zkratka
      rel(2, 'cervena', [[50.0, 15.0], [50.001, 15.001], [50.0, 15.002]]), // značená oklika přes B
    ])
    const trasa = najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.002))!
    expect(trasa.uzly).toContain(uzelKlic(50.001, 15.001)) // vede přes B
    expect(trasa.useky.every((u) => u.znaceni === 'cervena')).toBe(true)
    expect(trasa.podilNeznacenychProc).toBe(0)
  })

  it('rozloží cestu na úseky po značení a spočítá podíl neznačených', () => {
    // Jediná cesta P→Q (červená) → R (neznačená spojka) → 50 % neznačené.
    const graf = postavGraf([
      rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001]]),
      rel(2, null, [[50.0, 15.001], [50.0, 15.002]]),
    ])
    const trasa = najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.002))!
    expect(trasa.useky).toHaveLength(2)
    expect(trasa.useky[0].znaceni).toBe('cervena')
    expect(trasa.useky[1].znaceni).toBe('neznacene')
    expect(trasa.podilNeznacenychProc).toBeGreaterThan(49)
    expect(trasa.podilNeznacenychProc).toBeLessThan(51)
  })

  it('nedosažitelný cíl (oddělené komponenty) → null', () => {
    const graf = postavGraf([
      rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001]]),
      rel(2, 'cervena', [[50.5, 15.5], [50.5, 15.501]]),
    ])
    expect(najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.5, 15.5))).toBeNull()
  })

  it('start = cíl → nulová délka', () => {
    const graf = postavGraf([rel(1, 'cervena', [[50.0, 15.0], [50.0, 15.001]])])
    const trasa = najdiTrasu(graf, uzelKlic(50.0, 15.0), uzelKlic(50.0, 15.0))!
    expect(trasa.delkaKm).toBe(0)
    expect(trasa.uzly).toEqual([uzelKlic(50.0, 15.0)])
  })
})
