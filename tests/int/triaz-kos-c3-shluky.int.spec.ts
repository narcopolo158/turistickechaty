/**
 * KOŠ C3 PO SHLUCÍCH (14. 10. 2026) — měření varianty (d).
 *
 * Varianta (d) z deníku 13. 10. 2026 zní: zbylé nepřečtené kandidáty číst
 * podle MÍSTA, ne podle identifikátoru kandidáta — u shluku rozhodne jeden
 * pramen víc kandidátů naráz, jak se to poprvé stalo u čtveřice Domandi.
 * Rozsah té varianty je ale číslo, ne dojem, a tenhle test ho drží, aby se
 * nerozešel s daty: kdyby se shlukování rozbilo (jiný práh, jiná množina
 * kandidátů), vypadalo by to jako „varianta (d) zabírá na všechno" a session
 * by podle toho stavěla frontu čtení, která nikam nevede.
 *
 * Testy běží nad ostrými exporty v repu a nad živou tabulkou verdiktů —
 * statické soubory, žádná síť.
 */
import { describe, expect, it } from 'vitest'

import { kose } from '../../scripts/triaz-kos-c'
import { PRAH_SHLUKU_M, shlukyC3 } from '../../scripts/triaz-kos-c3-shluky'
import { vzdalenostM } from '../../scripts/kontrola/blizke-body'

const shluky = shlukyC3('krkonose')
const dle = (klic: string) => shluky.find((s) => s.klic === klic)

describe('shluky koše C3', () => {
  it('drží čtrnáct shluků z měření 6. 9. 2026', () => {
    // Kontrolní číslo ze starého měření. Kdyby se rozešlo, neporovná se
    // dnešní rozsah varianty (d) s tím, co se tvrdilo 6. 9.
    expect(shluky).toHaveLength(14)
  })

  it('každý shluk má aspoň dva členy a rozpětí pod dvojnásobkem prahu', () => {
    // Shluk o jednom členu není shluk; tranzitivní uzávěr naopak smí být
    // širší než práh (tři domky po 200 m v řadě), ale ne bezbřehý.
    for (const s of shluky) {
      expect(s.clenove.length).toBeGreaterThanOrEqual(2)
      expect(s.rozpetiM).toBeLessThanOrEqual(PRAH_SHLUKU_M * 2)
    }
  })

  it('žádný kandidát koše C3 nepadne do dvou shluků naráz', () => {
    const vsichni = shluky.flatMap((s) => s.clenove.map((c) => c.slug))
    expect(new Set(vsichni).size).toBe(vsichni.length)
  })

  it('neztratí ani jednoho kandidáta koše — shluky jsou podmnožina C3', () => {
    const c3 = new Set(kose('krkonose').c3.map((k) => k.slug))
    for (const s of shluky) for (const c of s.clenove) expect(c3.has(c.slug)).toBe(true)
  })

  it('pětice u Ściegen je jeden shluk o rozpětí desítek metrů', () => {
    // Pět domků se jmény horských květin (OSM way 1033422413–1033422417,
    // jeden dávkový zápis) — největší shluk koše a jediný, kde je
    // nepřečtených všech pět.
    const s = dle('arnika')
    expect(s?.clenove.map((c) => c.slug)).toEqual([
      'arnika',
      'dziewiecsil',
      'goryczka',
      'lilia',
      'rozeniec',
    ])
    expect(s?.rozpetiM).toBeLessThan(100)
    expect(s?.neprectenych).toBe(5)
  })

  it('u pětice nemá čtení kde začít ani přes souseda', () => {
    // To je celé jádro dnešního měření: shluk NENÍ sám o sobě klíč ke čtení.
    // Když identifikátor nemá ani jeden člen, varianta (d) na shluk nesahá.
    expect(dle('arnika')?.clenove.every((c) => c.zacatek === null)).toBe(true)
  })

  it('rozsah varianty (d) je tři kandidáti, ne jedenadvacet', () => {
    // Nepřečtení ve shluku, kde aspoň jeden člen identifikátor MÁ.
    const odemceno = shluky
      .filter((s) => s.neprectenych > 0 && s.clenove.some((c) => c.zacatek !== null))
      .reduce((a, s) => a + s.neprectenych, 0)
    expect(odemceno).toBe(3)
  })

  it('vzdálenost členů shluku sedí s prahem i s uzávěrem', () => {
    // Každý člen má ve svém shluku aspoň jednoho souseda do prahu —
    // jinak by ho tam uzávěr neměl čím přitáhnout.
    const c3 = new Map(kose('krkonose').c3.map((k) => [k.slug, k]))
    for (const s of shluky)
      for (const c of s.clenove) {
        const a = c3.get(c.slug)
        if (!a) throw new Error(`kandidát ${c.slug} není v koši C3`)
        const nejblizsi = Math.min(
          ...s.clenove
            .filter((j) => j.slug !== c.slug)
            .map((j) => {
              const b = c3.get(j.slug)
              if (!b) throw new Error(`kandidát ${j.slug} není v koši C3`)
              return vzdalenostM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
            }),
        )
        expect(nejblizsi).toBeLessThanOrEqual(PRAH_SHLUKU_M)
      }
  })
})
