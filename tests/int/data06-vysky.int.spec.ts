/**
 * DATA-06: výšky/čas přístupových tras. Testuje odhad času DIN 33466 a
 * zpracování jedné trasy (orientace nástup→chata, převýšení, škálování km osy
 * na routovanou délku) nad PODVRŽENÝM Elevation API (mock fetch — sandbox na
 * api.mapy.com nedosáhne).
 */
import { describe, expect, it } from 'vitest'

import { casDin33466Min, zpracujTrasu } from '../../scripts/data06-vysky-pristupu'

describe('DATA-06 · casDin33466Min', () => {
  it('rovina 4 km → 60 min (4 km/h)', () => {
    expect(casDin33466Min(4, 0, 0)).toBe(60)
  })
  it('stoupání převáží: 9 km, +400 m → větší složka + půlka menší', () => {
    // Wh=2,25 h, Wv=1,333 h → 2,25 + 0,667 = 2,917 h ≈ 175 min
    expect(casDin33466Min(9, 400, 0)).toBe(175)
  })
  it('nulová trasa → 0 min', () => {
    expect(casDin33466Min(0, 0, 0)).toBe(0)
  })
  it('klesání se počítá pomaleji (500 m/h) než stoupání (300 m/h)', () => {
    expect(casDin33466Min(2, 600, 0)).toBeGreaterThan(casDin33466Min(2, 0, 600))
  })
})

/** Mock Elevation API: vrátí zadané výšky v pořadí pozic z URL. */
const mockFetch =
  (vysky: number[]): typeof fetch =>
  (async (url: string) => {
    const pocet = new URL(url).searchParams.get('positions')!.split(';').length
    return { ok: true, status: 200, json: async () => ({ items: vysky.slice(0, pocet).map((e) => ({ elevation: e })) }) }
  }) as unknown as typeof fetch

describe('DATA-06 · zpracujTrasu (orientace + převýšení + profil)', () => {
  // Geometrie z routingu je chata→nástup; funkce ji otočí na nástup→chata.
  const geometrie = [
    { lat: 50.75, lng: 15.51 }, // chata (nahoře)
    { lat: 50.73, lng: 15.47 }, // mezibod
    { lat: 50.71, lng: 15.42 }, // nástup (dole)
  ]

  it('profil začíná u nástupu a stoupá k chatě; převýšení sedí', async () => {
    // po otočení: nástup(1000) → mezibod(1200) → chata(1400)
    const v = await zpracujTrasu(geometrie, 9, 'KLIC', mockFetch([1000, 1200, 1400]))
    expect(v.prevyseni).toBe(400) // stoupání k chatě
    expect(v.klesani).toBe(0)
    expect(v.vyskovyProfil[0][1]).toBe(1000) // start u nástupu (dole)
    expect(v.vyskovyProfil[v.vyskovyProfil.length - 1][1]).toBe(1400) // cíl chata (nahoře)
  })

  it('km osa profilu je škálovaná na routovanou délku (9 km)', async () => {
    const v = await zpracujTrasu(geometrie, 9, 'KLIC', mockFetch([1000, 1200, 1400]))
    expect(v.vyskovyProfil[0][0]).toBe(0)
    expect(v.vyskovyProfil[v.vyskovyProfil.length - 1][0]).toBeCloseTo(9, 1)
  })

  it('čas odpovídá DIN 33466 pro spočtené převýšení', async () => {
    const v = await zpracujTrasu(geometrie, 9, 'KLIC', mockFetch([1000, 1200, 1400]))
    expect(v.casMin).toBe(casDin33466Min(9, v.prevyseni, v.klesani))
  })
})
