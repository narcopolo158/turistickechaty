/**
 * Testy scripts/vyskovy-profil.ts — čisté funkce + mock Elevation API.
 * (Skutečné API ze sandboxu sessions volat nejde — síť ho blokuje; první ostrý
 * běh proběhne lokálně u Michala, viz README „Výškové profily tras".)
 */
import { describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  douglasPeucker,
  haversineKm,
  kumulativniKm,
  parseGpx,
  prevyseni,
  stahniVysky,
  vyberRovnomerne,
  yamlFragment,
  type Bod,
  type ProfilBod,
} from '../../scripts/vyskovy-profil'

const gpx = (body: string) => `<?xml version="1.0"?><gpx><trk><trkseg>${body}</trkseg></trk></gpx>`

describe('parseGpx', () => {
  it('čte body trkpt včetně obráceného pořadí atributů', () => {
    const xml = gpx('<trkpt lat="50.7" lon="15.6"></trkpt><trkpt lon="15.7" lat="50.73"><ele>1410</ele></trkpt>')
    expect(parseGpx(xml)).toEqual([
      { lat: 50.7, lon: 15.6 },
      { lat: 50.73, lon: 15.7 },
    ])
  })

  it('spojí více segmentů a bez trkpt sáhne po rtept', () => {
    const dvaSegmenty = `<gpx><trk><trkseg><trkpt lat="1" lon="2"/></trkseg><trkseg><trkpt lat="3" lon="4"/></trkseg></trk></gpx>`
    expect(parseGpx(dvaSegmenty)).toHaveLength(2)
    const rte = `<gpx><rte><rtept lat="1" lon="2"/><rtept lat="3" lon="4"/></rte></gpx>`
    expect(parseGpx(rte)).toHaveLength(2)
  })

  it('odmítne soubor bez aspoň 2 bodů a nesmyslné souřadnice', () => {
    expect(() => parseGpx(gpx('<trkpt lat="50" lon="15"/>'))).toThrow(/aspoň 2 body/)
    expect(() => parseGpx(gpx('<trkpt lat="95" lon="15"/><trkpt lat="50" lon="15"/>'))).toThrow(/neplatné souřadnice/)
  })
})

describe('geometrie', () => {
  it('haversine: 1° zeměpisné šířky ≈ 111,2 km, stejný bod = 0', () => {
    expect(haversineKm({ lat: 50, lon: 15 }, { lat: 51, lon: 15 })).toBeCloseTo(111.19, 1)
    expect(haversineKm({ lat: 50, lon: 15 }, { lat: 50, lon: 15 })).toBe(0)
  })

  it('kumulativniKm roste monotónně od nuly', () => {
    const km = kumulativniKm([
      { lat: 50, lon: 15 },
      { lat: 50.01, lon: 15 },
      { lat: 50.02, lon: 15 },
    ])
    expect(km[0]).toBe(0)
    expect(km[1]).toBeGreaterThan(0)
    expect(km[2]).toBeCloseTo(km[1] * 2, 5)
  })

  it('vyberRovnomerne: ≤256 bodů, krajní body vždy, km monotónní', () => {
    const body: Bod[] = Array.from({ length: 1000 }, (_, i) => ({ lat: 50 + i * 0.001, lon: 15 }))
    const km = kumulativniKm(body)
    const vyber = vyberRovnomerne(body, km)
    expect(vyber.body.length).toBeLessThanOrEqual(256)
    expect(vyber.body[0]).toEqual(body[0])
    expect(vyber.body[vyber.body.length - 1]).toEqual(body[body.length - 1])
    for (let i = 1; i < vyber.km.length; i++) expect(vyber.km[i]).toBeGreaterThan(vyber.km[i - 1])
  })

  it('vyberRovnomerne: krátkou trasu nechá být', () => {
    const body: Bod[] = [
      { lat: 50, lon: 15 },
      { lat: 50.1, lon: 15 },
    ]
    const km = kumulativniKm(body)
    expect(vyberRovnomerne(body, km)).toEqual({ body, km })
  })
})

describe('douglasPeucker', () => {
  it('rovný svah srazí na krajní body', () => {
    const profil: ProfilBod[] = Array.from({ length: 50 }, (_, i) => [i * 0.1, 800 + i * 10])
    expect(douglasPeucker(profil, 2)).toEqual([profil[0], profil[49]])
  })

  it('vrchol nad toleranci zachová, šum pod tolerancí zahodí', () => {
    const sVrcholem: ProfilBod[] = [
      [0, 800],
      [1, 810], // vrchol +10 m nad spojnicí
      [2, 800],
    ]
    expect(douglasPeucker(sVrcholem, 2)).toEqual(sVrcholem)
    const sSumem: ProfilBod[] = [
      [0, 800],
      [1, 801],
      [2, 800],
    ]
    expect(douglasPeucker(sSumem, 2)).toEqual([sSumem[0], sSumem[2]])
  })
})

describe('prevyseni', () => {
  it('sčítá stoupání a klesání zvlášť', () => {
    expect(prevyseni([800, 850, 820, 900])).toEqual({ stoupani: 130, klesani: 30 })
  })
})

describe('stahniVysky (mock API)', () => {
  const bod = (i: number): Bod => ({ lon: 15 + i * 0.001, lat: 50 })
  const okOdpoved = (pocet: number) => ({
    ok: true,
    status: 200,
    json: async () => ({ items: Array.from({ length: pocet }, () => ({ elevation: 1000 })) }),
  })

  it('posílá lon,lat páry a klíč v hlavičce; >256 bodů dávkované na 2 dotazy', async () => {
    const volani: string[] = []
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      volani.push(String(url))
      expect((init?.headers as Record<string, string>)['X-Mapy-Api-Key']).toBe('test-klic')
      const pocetPozic = String(url).split('positions=')[1].split(';').length
      return okOdpoved(pocetPozic) as unknown as Response
    })
    const vysky = await stahniVysky(Array.from({ length: 300 }, (_, i) => bod(i)), 'test-klic', fetchMock)
    expect(vysky).toHaveLength(300)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // lon první — přesně dle dokumentace Elevation API
    expect(volani[0]).toContain('positions=15,50;')
  })

  it('srozumitelně selže na HTTP chybu i na chybějící výšku (-100000)', async () => {
    const fetch401 = vi.fn(async () => ({ ok: false, status: 401 }) as unknown as Response)
    await expect(stahniVysky([bod(0)], 'x', fetch401)).rejects.toThrow(/HTTP 401.*klíč/)
    const fetchDira = vi.fn(
      async () =>
        ({ ok: true, status: 200, json: async () => ({ items: [{ elevation: -100000 }] }) }) as unknown as Response,
    )
    await expect(stahniVysky([bod(0)], 'x', fetchDira)).rejects.toThrow(/není k dispozici/)
  })
})

describe('yamlFragment', () => {
  it('vypíše validní YAML se zaokrouhlenými body a doložením zdroje', () => {
    const fragment = yamlFragment({
      gpxSoubor: 'pec-lucni-bouda.gpx',
      bodyGpx: 500,
      bodyProApi: 256,
      profil: [
        [0, 769.4],
        [4.253, 1101.6],
        [8.512, 1410.2],
      ],
      delkaKm: 8.512,
      stoupani: 750,
      klesani: 110,
      toleranceM: 2,
      zdrojGeometrie: 'geometrie z GPX',
      checked: '2026-07-20',
    })
    const parsovano = parse(fragment) as Array<Record<string, unknown>>
    expect(parsovano).toHaveLength(1)
    expect(parsovano[0].delkaKm).toBe(8.5)
    expect(parsovano[0].prevyseni).toBe(750)
    expect(parsovano[0].vyskovyProfil).toEqual([
      [0, 769],
      [4.25, 1102],
      [8.51, 1410],
    ])
    expect(fragment).toContain('Mapy.com Elevation API')
    expect(fragment).toContain('checked 2026-07-20')
    expect(fragment).toContain('verified: false')
  })
})
