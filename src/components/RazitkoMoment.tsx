'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
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
  /** Doplňkové řádky pod tlačítkem (doloženo, historické varianty…). */
  children?: React.ReactNode
}

/** Prodleva mezi klikem a zápisem do deníku — okamžik dopadu animace (55 % z 550 ms). */
const DOPAD_MS = 480

export default function RazitkoMoment({ slug, nazev, pohori, vyska, otiskUrl, otiskAlt, children }: Props) {
  const zaznam = useZaznamDeniku(slug)
  // „dopada" drží třídu .hit od kliku dál — animation forwards nese finální stav,
  // přepnutí na .set by dopad restartovalo/uřízlo
  const [dopada, setDopada] = useState(false)
  const timer = useRef<number | null>(null)
  const uid = useId()

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
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id={`${uid}a`} d="M 18,100 A 82,82 0 0 1 182,100" />
              <path id={`${uid}b`} d="M 18,100 A 82,82 0 0 0 182,100" />
              <filter id={`${uid}ink`}>
                <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
              </filter>
            </defs>
            <g filter={`url(#${uid}ink)`}>
              <g fill="none" stroke="#c92f1b">
                <circle cx="100" cy="100" r="95" strokeWidth="4" />
                <circle cx="100" cy="100" r="64" strokeWidth="1.8" />
              </g>
              <text fontSize="15.5" fontWeight="700" letterSpacing="2.6" fill="#c92f1b">
                <textPath href={`#${uid}a`} startOffset="50%" textAnchor="middle">
                  {nazev.toUpperCase()}
                </textPath>
              </text>
              {pohori && (
                <text fontSize="12.5" fontWeight="700" letterSpacing="2.2" fill="#c92f1b">
                  <textPath href={`#${uid}b`} startOffset="50%" textAnchor="middle">
                    {`· ${pohori.toUpperCase()} ·`}
                  </textPath>
                </text>
              )}
              <g fill="#c92f1b" transform="translate(100,86)">
                <path d="M-16,3 L0,-13 L16,3 Z" />
                <rect x="-11" y="3" width="22" height="15" />
                <rect x="-3.5" y="8" width="7" height="10" fill="#fff" fillOpacity=".9" />
              </g>
              {vyska != null && (
                <text x="100" y="126" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#c92f1b">
                  {`${vyska} M`}
                </text>
              )}
            </g>
          </svg>
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
