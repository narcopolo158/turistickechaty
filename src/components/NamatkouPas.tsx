'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { seedovanyVyber, type IndexChata } from '@/lib/index-chat'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'

/**
 * „Namátkou z průvodce" (handoff homepage 02): 5 kartotéčních lístků ze
 * seedovaného Fisher–Yates výběru nad CELOU databází. První render používá
 * seed ze serveru (dayOfYear z buildu) — server i klient kreslí totéž, žádný
 * hydration mismatch; „↻ jiných pět" jen posune seed. Kulaté mini-razítko
 * u chat s doloženým razítkem na hover karty „dokvákne" (keyframe settlePop,
 * re-trigger přes style.animation); reduced-motion animaci vypíná v CSS.
 * Thumb nese hero fotku profilu, bez ní siluetu (konzistentně s katalogem —
 * rozhodnutí Michala 28. 7. 2026).
 */
export default function NamatkouPas({ index, seed }: { index: IndexChata[]; seed: number }) {
  const [aktualniSeed, setAktualniSeed] = useState(seed)
  const picks = seedovanyVyber(index, aktualniSeed, 5)

  const dokvakni = (e: React.MouseEvent<HTMLElement>) => {
    const razitko = e.currentTarget.querySelector<HTMLElement>('[data-stamp]')
    if (!razitko) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    razitko.style.animation = 'none'
    void razitko.offsetWidth // reflow → animace se spustí znovu
    razitko.style.animation = ''
  }

  return (
    <>
      <div className="hf1-sekce-hlava">
        <span className="hf1-sekce-num">02</span>
        <span className="hf1-sekce-titul">Namátkou z průvodce</span>
        <span className="hf1-sekce-cara" aria-hidden="true" />
        <button type="button" className="hf1-reshuffle" onClick={() => setAktualniSeed((s) => s + 1)}>
          ↻ jiných pět
        </button>
      </div>
      <div className="hf1-namatkou">
        {picks.map((ch, i) => {
          const pill =
            ch.stav === 'v-provozu'
              ? { cls: 'ok', text: 'v provozu' }
              : ch.stav === 'zanikla'
                ? { cls: 'zanikla', text: 'zaniklá' }
                : ch.stav === 'mimo-provoz'
                  ? { cls: 'mimo', text: 'mimo provoz' }
                  : { cls: 'nezn', text: 'stav neověřen' }
          const telo = (
            <>
              <span className="hf1-listek-linka" aria-hidden="true" />
              <span className={`hf1-listek-thumb${ch.heroUrl ? ' hf1-listek-thumb--foto' : ''}`} aria-hidden="true">
                {ch.heroUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload (nahled 480×320)
                  <img src={ch.heroUrl} alt="" loading="lazy" decoding="async" />
                )}
                {ch.razitko && (
                  <span className="hf1-listek-razitko" data-stamp="1">
                    RAZÍT
                    <br />
                    KO
                  </span>
                )}
              </span>
              <span className="hf1-listek-telo">
                <span className="hf1-listek-nazev">{ch.nazev}</span>
                <span className="hf1-listek-fakta">
                  <b>{formatVyskaM(ch.vyska)}</b>
                  <span className={`hf1-pill ${pill.cls}`}>{pill.text}</span>
                </span>
                <span className="hf1-listek-mezera" />
                <span className="hf1-listek-over">ověř. {formatCheckedDatum(ch.checked)}</span>
                <span className="hf1-listek-cta">Otevřít profil ▸</span>
              </span>
            </>
          )
          const style = { '--rot': `${((i % 3) - 1) * 1.2}deg` } as React.CSSProperties
          return ch.url ? (
            <Link key={ch.slug} href={ch.url} className="hf1-listek" style={style} onMouseEnter={dokvakni}>
              {telo}
            </Link>
          ) : (
            <span key={ch.slug} className="hf1-listek" style={style} onMouseEnter={dokvakni}>
              {telo}
            </span>
          )
        })}
      </div>
      <div className="hf1-pozn">
        <span aria-hidden="true">†</span> náhodný výběr z {index.length} doložených profilů — žádná redakční „doporučení
        bez dokladu“
      </div>
    </>
  )
}
