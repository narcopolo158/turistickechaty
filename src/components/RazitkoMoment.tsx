'use client'

import React, { useEffect, useRef, useState } from 'react'
import RazitkoSvg from './RazitkoSvg'
import { formatDatumDeniku, pridejDoDeniku, useZaznamDeniku } from '@/lib/denik'

/**
 * Razítkovací moment — F0-08, „emoční srdce webu" dle handoffu
 * (components/razitko-moment.html + sekce 02 profilu v prototyp.html).
 *
 * Do padu dopadá skutečný otisk z DB (sken/foto), a teprve když chybí,
 * stylizované kruhové razítko z doložených údajů (název · pohoří · výška) —
 * je to ilustrace sběratelské vrstvy, ne tvrzení, jak razítko vypadá.
 * Dopad: scale 2.1 → 0.94, mikro-odskok, konečné natočení −7°, rozpití
 * inkoustu přes feTurbulence — 550 ms, jednou, žádné smyčky.
 * Sbírka je lokální (localStorage přes lib/denik) — účty až fáze 4.
 */

type Props = {
  slug: string
  nazev: string
  /** Název pohoří pro spodní oblouk stylizovaného razítka. */
  pohori?: string | null
  /** Nadmořská výška (doložená) — bez ní se řádek v razítku nevykreslí. */
  vyska?: number | null
  otiskUrl?: string | null
  otiskAlt?: string | null
  /**
   * Poctivostní štítek pod padem (např. „historický otisk · cca konec
   * 80. let (odhad)") — skládá ho volající jen z doložených údajů razítka.
   */
  stitek?: string | null
  /** Doplňkové řádky pod tlačítkem (doloženo, historické varianty…). */
  children?: React.ReactNode
}

/** Prodleva mezi klikem a zápisem do deníku — okamžik dopadu animace (55 % z 550 ms). */
const DOPAD_MS = 480

export default function RazitkoMoment({ slug, nazev, pohori, vyska, otiskUrl, otiskAlt, stitek, children }: Props) {
  const zaznam = useZaznamDeniku(slug)
  // „dopada" drží třídu .hit od kliku dál — animation forwards nese finální stav,
  // přepnutí na .set by dopad restartovalo/uřízlo
  const [dopada, setDopada] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const otiskni = () => {
    if (zaznam || dopada) return
    setDopada(true)
    timer.current = window.setTimeout(() => pridejDoDeniku(slug), DOPAD_MS)
  }

  const padStav = dopada ? ' hit' : zaznam ? ' set' : ''

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 'none' }}>
        <div className={`pad${padStav}`} data-testid="pad">
          <span className="hint">
            SEM DOPADNE
            <br />
            RAZÍTKO
          </span>
          {otiskUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- otisk je malý, bez next/image jako .p-otisk dřív
            <img src={otiskUrl} alt={otiskAlt ?? `Otisk razítka — ${nazev}`} />
          ) : (
            <RazitkoSvg nazev={nazev} pohori={pohori} vyska={vyska} />
          )}
        </div>
        {stitek && (
          <p className="mn pad-stitek" data-testid="pad-stitek">
            {stitek}
          </p>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 170 }}>
        {zaznam ? (
          <button type="button" className="btn done" aria-disabled="true">
            ✓ Ve sbírce · {formatDatumDeniku(zaznam.datum)}
          </button>
        ) : (
          <button type="button" className="btn" onClick={otiskni} aria-label={`Přidat razítko chaty ${nazev} do deníku`}>
            ＋ Razítko do deníku
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
