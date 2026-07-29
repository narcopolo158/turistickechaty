import React from 'react'

import type { Oblasti as Oblast } from '@/payload-types'

/**
 * Foto pás přes celou šířku s klikacími body (handoff F1, sekce 05 — druhý
 * ze tří fotografických momentů stránky).
 *
 * Body jsou `<button>` s popoverem na hover i focus, žádný JS: klávesnice se
 * k nim dostane tabem a popisek se ukáže stejně jako myší. Kdyby to byl jen
 * `:hover`, byla by celá vrstva pro klávesnici neviditelná.
 *
 * POCTIVOST: body se kreslí jen z dat (`fotky[].hotspoty`). Návrh ukazuje
 * v pásu popisky typu „bývalá bouda → vysílač", jenže to je tvrzení o tom, co
 * je na snímku — a to musí někdo doložit. Bez dat je pás prostě fotka
 * s atribucí, což je poctivý stav, ne nedodělek.
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

export function FotoPas({ fotka, karta }: { fotka?: Fotka | null; karta?: React.ReactNode }) {
  if (!fotka?.soubor) return null

  const licence = fotka.licence ? LICENCE_TEXT[fotka.licence] : null
  const atribuce = ['foto: ' + (fotka.autor ?? 'neznámý autor'), licence].filter(Boolean).join(' · ')
  const hotspoty = (fotka.hotspoty ?? []).filter((h) => h.text?.trim())

  return (
    <figure className="fpas">
      {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa, rozměry známe */}
      <img
        className="fpas-img"
        src={fotka.soubor}
        srcSet={fotka.nahled ? `${fotka.nahled} 900w, ${fotka.soubor} 2400w` : undefined}
        sizes="100vw"
        alt={fotka.alt ?? ''}
        loading="lazy"
        decoding="async"
      />
      <div className="fpas-stin" aria-hidden="true" />
      <div className="fpas-noc" aria-hidden="true" />

      {hotspoty.map((h, i) => (
        <div
          key={`${h.text}-${i}`}
          className="fpas-bod"
          style={{ left: `${h.x ?? 50}%`, top: `${h.y ?? 50}%` }}
        >
          <button type="button" className="fpas-bod-tlacitko">
            <span className="fpas-bod-kruh" aria-hidden="true" />
            <span className="fpas-bod-popis">{h.text}</span>
          </button>
        </div>
      ))}

      {karta && <div className="fpas-karta">{karta}</div>}

      <figcaption className="fpas-kredit">
        {fotka.popis && <span className="fpas-misto">{fotka.popis}</span>}
        {fotka.zdrojUrl ? (
          <a className="fpas-autor" href={fotka.zdrojUrl} target="_blank" rel="noopener noreferrer">
            {atribuce}
          </a>
        ) : (
          <span className="fpas-autor">{atribuce}</span>
        )}
      </figcaption>
    </figure>
  )
}

export default FotoPas
