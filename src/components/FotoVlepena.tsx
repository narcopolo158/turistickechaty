import React from 'react'

import type { Oblasti as Oblast } from '@/payload-types'

/**
 * Vlepený snímek s fotorožky (handoff F1, sekce 07 — třetí fotografický
 * moment: fotka v albu paměti hor, ne ilustrace).
 *
 * Bílý rám se spodním okrajem na popisku, čtyři rohové fotorožky, mírné
 * natočení, které se při najetí srovná. Rukopisný popisek se bere z dat
 * a když ho data nemají, zůstane u snímku jen atribuce — o tom, co je na
 * fotce, se nehádá.
 */

const LICENCE_TEXT: Record<string, string> = {
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  cc0: 'CC0',
  pd: 'volné dílo',
  'se-svolenim': 'se svolením',
  vlastni: 'foto redakce',
}

type Fotka = NonNullable<Oblast['fotky']>[number]

export function FotoVlepena({ fotka }: { fotka?: Fotka | null }) {
  if (!fotka?.soubor) return null

  const licence = fotka.licence ? LICENCE_TEXT[fotka.licence] : null
  const atribuce = ['foto: ' + (fotka.autor ?? 'neznámý autor'), licence].filter(Boolean).join(' · ')

  return (
    <figure className="fvlep">
      <div className="fvlep-ram">
        {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa, rozměry známe */}
        <img
          className="fvlep-img"
          src={fotka.nahled ?? fotka.soubor}
          alt={fotka.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
        <span className="fvlep-rozek fvlep-rozek--lh" aria-hidden="true" />
        <span className="fvlep-rozek fvlep-rozek--ph" aria-hidden="true" />
        <span className="fvlep-rozek fvlep-rozek--ld" aria-hidden="true" />
        <span className="fvlep-rozek fvlep-rozek--pd" aria-hidden="true" />
        <figcaption className="fvlep-popis">
          {fotka.popis && <span className="fvlep-rukopis">{fotka.popis}</span>}
          {fotka.zdrojUrl ? (
            <a className="fvlep-autor" href={fotka.zdrojUrl} target="_blank" rel="noopener noreferrer">
              {atribuce}
            </a>
          ) : (
            <span className="fvlep-autor">{atribuce}</span>
          )}
        </figcaption>
      </div>
    </figure>
  )
}

export default FotoVlepena
