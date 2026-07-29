'use client'

import React, { useId } from 'react'

/**
 * Kulaté razítko oblasti — přesahuje přes trhaný spodní okraj titulní fotky
 * (handoff F1 „Stránka pohoří", edice s fotkami).
 *
 * PROČ VLASTNÍ KOMPONENTA, a ne `RazitkoSvg`: to razítko mluví za CHATU
 * (název · pohoří · výška, uprostřed silueta boudy). Tady razítkujeme celé
 * pohoří, takže uprostřed stojí hřeben a v obloucích je název oblasti a její
 * nejvyšší hora.
 *
 * POCTIVOST: návrh měl ve spodním oblouku slogan „KRAJ BOUD · OD 1623".
 * Slogan je tvrzení jako každé jiné a doklad pro něj v datech nemáme, proto
 * ho nekreslíme — do oblouku jde jen to, co v datech oblasti doložené je
 * (`nejvyssiHora` se svým `source`). Bez doložené hory zůstane razítko jen
 * s názvem oblasti; nic se nedomýšlí a prázdný oblouk se nekreslí.
 */

type Props = {
  nazev: string
  hora?: { nazev?: string | null; vyska?: number | null } | null
}

export default function RazitkoOblasti({ nazev, hora }: Props) {
  const uid = useId()
  const horaNazev = hora?.nazev?.trim()
  const vyska = typeof hora?.vyska === 'number' ? hora.vyska : null

  return (
    <svg className="phf-razitko" viewBox="0 0 120 120" width="138" height="138" aria-hidden="true">
      <defs>
        <path id={`${uid}t`} d="M18,60 a42,42 0 0 1 84,0" fill="none" />
        <path id={`${uid}b`} d="M22,62 a38,38 0 0 0 76,0" fill="none" />
        <filter id={`${uid}ink`}>
          <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
        </filter>
      </defs>
      <g fill="var(--stamp, #c92f1b)" stroke="var(--stamp, #c92f1b)" filter={`url(#${uid}ink)`}>
        <circle cx="60" cy="60" r="53" fill="none" strokeWidth="3" />
        <circle cx="60" cy="60" r="42" fill="none" strokeWidth="1.4" />
        <text fontSize="11" fontWeight="700" letterSpacing="1.5" stroke="none">
          <textPath href={`#${uid}t`} startOffset="50%" textAnchor="middle">
            {nazev.toUpperCase()}
          </textPath>
        </text>
        {horaNazev && (
          <text fontSize="8" fontWeight="600" letterSpacing="1.1" stroke="none">
            <textPath href={`#${uid}b`} startOffset="50%" textAnchor="middle">
              {horaNazev.toUpperCase()}
            </textPath>
          </text>
        )}
        {/* Hřeben se dvěma vrcholy — kresba z návrhu, beze změny. */}
        <path d="M38,66 L48,50 L56,60 L66,44 L82,66 Z" stroke="none" />
        <path d="M34,72 L86,72" strokeWidth="1.6" />
        {vyska != null && (
          <text
            x="60"
            y="84"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="1"
            textAnchor="middle"
            stroke="none"
          >
            {`${vyska} M`}
          </text>
        )}
      </g>
    </svg>
  )
}
