/**
 * „Jak to může být pěšky kratší než vzdušnou čarou?" (Michal 30. 7. 2026 nad
 * mini-stránkou lanovky Lysá hora A5, kde stálo „Chata Dvoračky · 823 m
 * vzdušnou čarou · pěšky 0,6 km").
 *
 * Nemohlo. Obě čísla byla spočítaná správně, ale z různých východisek:
 * vzdušná čára od horní stanice lanovky, délka trasy od jejího doloženého
 * začátku, který leží 638 m odtud. Pár čísel z dvou míst v jedné řádce se
 * čte jako chyba měření.
 *
 * Tyhle testy drží pravidlo, ne implementaci: řádek smí ukázat holé
 * „pěšky X km" jen tehdy, když trasa opravdu začíná u toho bodu; jinak musí
 * být odstup vidět. A druhá polovina testů měří skutečná data obou oblastí —
 * kdyby se do nich vrátil nesmyslný pár, spadne to tady, ne až na stránce.
 */
import { describe, expect, it } from 'vitest'

import { lanovkySeSlugy } from '@/lib/lanovky'
import { jakUkazatPesky, pristupyOdBodu, ZACINA_U_BODU_M } from '@/lib/pristupy'

describe('pravidlo pro pár „vzdušnou čarou × pěšky"', () => {
  it('trasa začínající u stanice se ukáže bez vysvětlování', () => {
    expect(jakUkazatPesky(0.86, 46, 770)).toEqual({ km: 0.86, odstupM: null })
  })

  it('trasa začínající jinde musí odstup přiznat, i když si čísla neodporují', () => {
    // karkonosz-express → Hala Szrenicka: pěšky 1,23 km je delší než vzdušných
    // 622 m, takže by to „prošlo" — ale 1,23 km se jde od bodu o půl kilometru
    // dál, ne od stanice, a čtenář to nemá jak poznat.
    expect(jakUkazatPesky(1.23, 509, 622)).toEqual({ km: 1.23, odstupM: 509 })
  })

  it('spor „pěšky < vzdušnou čarou" vysvětlení vynutí vždycky', () => {
    // Lysá hora A5 → Chata Dvoračky, přesně ten případ ze screenshotu.
    expect(jakUkazatPesky(0.62, 638, 823)).toEqual({ km: 0.62, odstupM: 638 })
    // I kdyby odstup byl v toleranci: samotný spor stačí, ať se ukáže odkud.
    expect(jakUkazatPesky(0.5, 120, 700)).toEqual({ km: 0.5, odstupM: 120 })
  })

  it('bez vzdušné čáry (sekce „dál pěšky odtud") rozhoduje jen odstup', () => {
    expect(jakUkazatPesky(2.4, ZACINA_U_BODU_M, null)).toEqual({ km: 2.4, odstupM: null })
    expect(jakUkazatPesky(2.4, ZACINA_U_BODU_M + 1, null)).toEqual({
      km: 2.4,
      odstupM: ZACINA_U_BODU_M + 1,
    })
  })

  it('chybějící délka není nula — vrací se null a řádek to řekne slovy', () => {
    expect(jakUkazatPesky(null, 20, 500)).toBeNull()
  })
})

describe('skutečná data — žádný řádek nesmí tvrdit nesmysl', () => {
  const OBLASTI = ['krkonose', 'jizerske-hory'] as const

  /** Všechny páry (lanovka, chata u horní stanice), ke kterým máme i trasu. */
  const pary = OBLASTI.flatMap((oblast) =>
    lanovkySeSlugy(oblast).flatMap((l) => {
      const pDle = new Map(pristupyOdBodu(oblast, l.horni).map((p) => [p.slug, p]))
      return l.uHorniStanice.flatMap((ch) => {
        const p = pDle.get(ch.slug)
        return p ? [{ oblast, lanovka: l.slug, chata: ch.slug, vzdusnaM: ch.vzdalenostM, p }] : []
      })
    }),
  )

  it('páry k proměření vůbec existují (jinak test nic nehlídá)', () => {
    expect(pary.length).toBeGreaterThan(0)
  })

  it('kde by pěšky vyšlo kratší než vzdušná čára, tam se odstup ukazuje', () => {
    const tichySpor = pary.filter(({ p, vzdusnaM }) => {
      const jak = jakUkazatPesky(p.delkaKm, p.odstupM, vzdusnaM)
      return jak != null && jak.km * 1_000 < vzdusnaM && jak.odstupM == null
    })
    expect(tichySpor).toEqual([])
  })

  it('trasa vydávaná za „od stanice" u ní opravdu začíná', () => {
    const daleko = pary
      .filter(({ p, vzdusnaM }) => jakUkazatPesky(p.delkaKm, p.odstupM, vzdusnaM)?.odstupM == null)
      .filter(({ p }) => p.odstupM > ZACINA_U_BODU_M)
    expect(daleko).toEqual([])
  })
})
