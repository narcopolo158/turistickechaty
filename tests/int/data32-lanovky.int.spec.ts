/**
 * DATA-32 — přehled lanovek. Testy míří na tři rozhodnutí, u kterých by tichá
 * chyba znamenala nepravdivý web: co se do přehledu pouští, jak se spojují
 * úseky téhož jména a odkud se berou výšky.
 */
import { describe, expect, it } from 'vitest'

import { sestavLanovky, spojUseky, vyskaZMrizky } from '../../scripts/data32-lanovky'

/** Mřížka 3×3 nad malým bboxem: výška roste k severu i k východu. */
const GRID = [
  [100, 200, 300],
  [200, 300, 400],
  [300, 400, 500],
]
const BBOX = { latMin: 50.0, lngMin: 15.0, latMax: 50.2, lngMax: 15.2 }
const vyska = (lat: number, lng: number) => vyskaZMrizky(GRID, BBOX, 3, 3, lat, lng)

const usek = (typ: string, nazev: string | null, body: [number, number][]) => ({ typ, nazev, body })

describe('vyskaZMrizky', () => {
  it('bilineárně interpoluje mezi body mřížky', () => {
    expect(vyska(50.0, 15.0)).toBe(100)
    expect(vyska(50.2, 15.2)).toBe(500)
    expect(vyska(50.1, 15.1)).toBe(300)
  })

  it('mimo bbox vrací null — model se nedopočítává tam, kam nesahá', () => {
    expect(vyska(49.5, 15.0)).toBeNull()
    expect(vyska(50.1, 16.0)).toBeNull()
  })
})

describe('spojUseky', () => {
  it('spojí navazující úseky téhož jména do jedné dráhy', () => {
    const skupiny = spojUseky([
      usek('chair_lift', 'Medvědín', [[50.0, 15.0], [50.05, 15.05]]),
      usek('chair_lift', 'Medvědín', [[50.05, 15.05], [50.1, 15.1]]),
    ])
    expect(skupiny).toHaveLength(1)
    expect(skupiny[0]).toHaveLength(2)
  })

  it('stejnojmenné, ale vzdálené dráhy nespojuje (dva vleky „Kotva")', () => {
    const skupiny = spojUseky([
      usek('chair_lift', 'Kotva', [[50.0, 15.0], [50.01, 15.01]]),
      usek('chair_lift', 'Kotva', [[50.15, 15.15], [50.16, 15.16]]),
    ])
    expect(skupiny).toHaveLength(2)
  })

  it('paralelní dráhy s odlišnými jmény zůstávají dvě', () => {
    const skupiny = spojUseky([
      usek('chair_lift', 'Hala Szrenicka I', [[50.0, 15.0], [50.05, 15.05]]),
      usek('chair_lift', 'Hala Szrenicka II', [[50.0, 15.0001], [50.05, 15.0501]]),
    ])
    expect(skupiny).toHaveLength(2)
  })
})

describe('sestavLanovky', () => {
  const CHATA = { slug: 'testova-bouda', nazev: 'Testová bouda', lat: 50.1002, lng: 15.1002 }

  it('vleky do přehledu nepouští — průvodce je pro pěší', () => {
    const out = sestavLanovky(
      [
        usek('chair_lift', 'Sedačka', [[50.0, 15.0], [50.1, 15.1]]),
        usek('platter', 'Talíř', [[50.0, 15.0], [50.05, 15.05]]),
        usek('t-bar', 'Kotva', [[50.0, 15.0], [50.05, 15.05]]),
        usek('magic_carpet', 'Pás', [[50.0, 15.0], [50.01, 15.01]]),
      ],
      [],
      vyska,
    )
    expect(out.map((l) => l.nazev)).toEqual(['Sedačka'])
  })

  it('dolní a horní stanici určuje podle modelu, ne podle pořadí bodů', () => {
    // Body jsou zapsané od vrcholu dolů — dráha přesto musí vést zdola nahoru.
    const [l] = sestavLanovky([usek('gondola', 'Expres', [[50.1, 15.1], [50.0, 15.0]])], [], vyska)
    expect(l.dolni.vyska).toBe(100)
    expect(l.horni.vyska).toBe(300)
    expect(l.prevyseniM).toBe(200)
  })

  it('u horní stanice najde chatu do 1,5 km a vzdálenost uvede v metrech', () => {
    const [l] = sestavLanovky([usek('gondola', 'Expres', [[50.0, 15.0], [50.1, 15.1]])], [CHATA], vyska)
    expect(l.uHorniStanice).toHaveLength(1)
    expect(l.uHorniStanice[0].slug).toBe('testova-bouda')
    expect(l.uHorniStanice[0].vzdalenostM).toBeLessThan(60)
  })

  it('vzdálenou chatu k dráze nepřipíše', () => {
    const daleko = { slug: 'daleka', nazev: 'Daleká', lat: 50.2, lng: 15.2 }
    const [l] = sestavLanovky([usek('gondola', 'Expres', [[50.0, 15.0], [50.1, 15.1]])], [daleko], vyska)
    expect(l.uHorniStanice).toHaveLength(0)
  })

  it('dráhy s chatou řadí před dráhy bez chaty', () => {
    const out = sestavLanovky(
      [
        usek('chair_lift', 'Bez chaty', [[50.0, 15.0], [50.12, 15.12]]),
        usek('chair_lift', 'S chatou', [[50.05, 15.05], [50.1, 15.1]]),
      ],
      [CHATA],
      vyska,
    )
    expect(out[0].nazev).toBe('S chatou')
  })

  it('když model výšku nezná, převýšení nevymýšlí', () => {
    const [l] = sestavLanovky([usek('gondola', 'Mimo model', [[49.0, 14.0], [49.1, 14.1]])], [], vyska)
    expect(l.prevyseniM).toBeNull()
    expect(l.dolni.vyska).toBeNull()
  })
})
