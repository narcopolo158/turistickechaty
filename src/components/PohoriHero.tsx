'use client'

import React, { useEffect, useRef } from 'react'

import RazitkoOblasti from './RazitkoOblasti'

import type { Oblasti as Oblast } from '@/payload-types'

/**
 * Hlavička stránky pohoří — titulní fotka přes celou šířku s názvem uvnitř
 * (handoff F1, edice „foto"; Michalovo zadání 29. 7. 2026: „tady máš vylepšený
 * design pro stránky pohoří").
 *
 * Návrh z toho dělá první ze tří fotografických momentů stránky: fotka 560 px
 * přes celou šířku, jemný pohyb při scrollu, trhaný spodní okraj do papíru,
 * rukopisná popiska, razítko přesahující přes okraj a název 96 px uvnitř
 * snímku. Všechno jsou to prostředky, ne tvrzení — tvrzení nese jen text,
 * a ten je celý z dat.
 *
 * CO SE SEM VĚDOMĚ NEPŘENESLO Z NÁVRHU (a proč):
 *
 *   1. **Rukopisná anotace se šipkou na Luční boudu.** Návrh ukazuje na
 *      konkrétní boudu ve fotce, a autor našeho snímku budovu NEJMENUJE.
 *      Anotace se proto kreslí jen tehdy, když ji data mají
 *      (`heroFoto.anotace`) — u Krkonoš ji povolil až Michal 29. 7. 2026
 *      vlastní znalostí místa („je to Luční bouda — ověřeno", konvence B).
 *
 *      `x`/`y` v datech je POLOHA PŘEDMĚTU, na který se ukazuje, ne poloha
 *      textu: šipka má tedy hrot přesně tam a popiska se skládá k němu.
 *      Původní pořadí (kotva u textu, šipka pevných 150×104 px) vypadalo
 *      dobře na desktopu a na mobilu ukazovalo o dobrých padesát pixelů
 *      vedle — rám se totiž zmenší, kdežto pevná kresba ne.
 *   2. **Podtitul „Domov nejstarší tradice horských bud — od roku 1623".**
 *      Hezká věta, ale je to tvrzení bez pole a bez pramene. Místo něj nese
 *      hlavička nadtitulek složený z doložených údajů (země fondu a typ
 *      oblasti).
 *
 * PROČ JE TU H1: název pohoří leží podle návrhu VE fotce. Když fotka chybí,
 * musí ho komponenta vykreslit stejně — stránka bez H1 by byla vada, ne
 * design. Bez fotky se tedy vykreslí klidná textová hlavička.
 *
 * Atribuce se zobrazuje i u licencí, které ji nevyžadují (Unsplash, Pexels):
 * web u každého faktu říká, odkud je, a u obrázků by jinak mlčel (rozhodnutí
 * z rešerše FOTO-01).
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

/** Nejvyšší posun fotky při scrollu (px) — víc, než kolik má obrázek přesahu. */
const PARALAXA_MAX = 90
const PARALAXA_KOEF = 0.16

type Props = {
  nazev: string
  /** Nadtitulek z doložených údajů (např. „Česko a Polsko · pohoří"). */
  kicker?: string | null
  foto?: Oblast['heroFoto']
  hora?: { nazev?: string | null; vyska?: number | null } | null
}

export default function PohoriHero({ nazev, kicker, foto, hora }: Props) {
  const obrazek = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = obrazek.current
    if (!el) return
    // Kdo si vypnul animace, dostane fotku bez pohybu — nastavení systému má
    // přednost před efektem.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let cekaSnimek = false
    const posun = () => {
      cekaSnimek = false
      const y = Math.min(window.scrollY * PARALAXA_KOEF, PARALAXA_MAX)
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
    }
    const naScroll = () => {
      if (cekaSnimek) return
      cekaSnimek = true
      requestAnimationFrame(posun)
    }
    posun()
    window.addEventListener('scroll', naScroll, { passive: true })
    return () => window.removeEventListener('scroll', naScroll)
  }, [])

  if (!foto?.soubor) {
    return (
      <header className="pohori-hero-holy">
        {kicker && <p className="phf-kicker">{kicker}</p>}
        <h1>{nazev}</h1>
      </header>
    )
  }

  const licence = foto.licence ? LICENCE_TEXT[foto.licence] : null
  const atribuce = ['foto: ' + (foto.autor ?? 'neznámý autor'), licence].filter(Boolean).join(' · ')
  const anotace = foto.anotace
  const anotaceText = anotace?.text?.trim()

  return (
    <div className="phf">
      <figure className="phf-ram">
        {/* Bez next/image schválně: soubor je statická příloha repa, rozměry
            známe a build z něj dělá dvě varianty — runtime optimalizace by
            nepřidala nic než další vrstvu. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (FOTO-01), viz komentář výše */}
        <img
          ref={obrazek}
          className="phf-img"
          src={foto.soubor}
          srcSet={foto.nahled ? `${foto.nahled} 900w, ${foto.soubor} 1920w` : undefined}
          sizes="100vw"
          alt={foto.alt ?? ''}
          loading="eager"
          decoding="async"
        />
        <div className="phf-stin" aria-hidden="true" />
        <div className="phf-noc" aria-hidden="true" />

        {anotaceText && (
          <div
            className={`phf-anotace${anotace?.sipka ? '' : ' phf-anotace--bezsipky'}`}
            style={{ left: `${anotace?.x ?? 56}%`, top: `${anotace?.y ?? 24}%` }}
            aria-hidden="true"
          >
            <span className="phf-anotace-text">{anotaceText}</span>
            {anotace?.sipka && (
              <svg className="phf-sipka" viewBox="0 0 150 104">
                <path d="M132,6 C92,26 64,52 40,84" fill="none" strokeWidth="2.2" strokeLinecap="round" />
                <path
                  d="M52,74 L38,86 L56,92"
                  fill="none"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}

        <figcaption className="phf-kredit">
          {foto.popisMista && <span className="phf-misto">{foto.popisMista}</span>}
          {foto.zdrojUrl ? (
            <a className="phf-autor" href={foto.zdrojUrl} target="_blank" rel="noopener noreferrer">
              {atribuce}
            </a>
          ) : (
            <span className="phf-autor">{atribuce}</span>
          )}
        </figcaption>

        <div className="phf-titul">
          {kicker && <p className="phf-kicker">{kicker}</p>}
          <h1>{nazev}</h1>
        </div>
      </figure>

      <RazitkoOblasti nazev={nazev} hora={hora} />
    </div>
  )
}
