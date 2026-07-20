'use client'

import React, { useId } from 'react'

/**
 * Stylizované kruhové razítko složené jen z doložených údajů (název · pohoří ·
 * výška) — sdílený jazyk sběratelské vrstvy pro razítkovací moment i sloty
 * razítkovníku, dokud chybí skutečný otisk (sken) z DB. Kresba 1:1 z handoffu
 * `razitko-moment.html` vč. rozpití inkoustu (feTurbulence + feDisplacementMap);
 * id v defs jsou přes useId, ať se instance na jedné stránce nehádají.
 */

type Props = {
  nazev: string
  pohori?: string | null
  vyska?: number | null
}

export default function RazitkoSvg({ nazev, pohori, vyska }: Props) {
  const uid = useId()

  return (
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
  )
}
