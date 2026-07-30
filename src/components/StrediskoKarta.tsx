import Link from 'next/link'
import React from 'react'

import { kreditFotky, nazevZdroje } from '@/lib/atribuce'
import type { PristupyZBodu } from '@/lib/pristupy'

/**
 * Karta střediska (handoff F1 v2, sekce 04): malovaný hřeben s vlaječkou
 * v hlavičce, odznak země, velké číslo „N chat odtud", fotka a doložené
 * poznámky.
 *
 * Číslo se BERE Z DAT (DATA-06, přístupové trasy z OSM) — návrh ho měl jen
 * naznačené a v naší šabloně u něj do dneška stála poznámka „doplní přepočet
 * přístupových tras". Kde trasy doložené nejsou, ukazuje karta pomlčku
 * a řekne proč; nula by tvrdila, že odtud nikam cesta nevede.
 */

export type Stredisko = {
  slug?: string | null
  nazev: string
  zeme?: string | null
  perex?: string | null
  lanovka?: string | null
}

export type FotoStrediska = {
  url: string
  autor: string
  licence: string
  /** Odkaz na zdroj (Commons); vlastní snímek od redakce ho nemá. */
  stranka?: string
  /** Název souboru na Commons — popiska, ať snímek sám řekne, co je na něm. */
  popis?: string
}

export function StrediskoKarta({
  stredisko,
  foto,
  pristupy,
  url,
}: {
  stredisko: Stredisko
  foto?: FotoStrediska | null
  pristupy?: PristupyZBodu | null
  /** Odkaz na mini-stránku střediska; bez něj karta zůstane bez CTA. */
  url?: string | null
}) {
  const pl = stredisko.zeme === 'pl'

  return (
    <div className={`pohori-stredisko${pl ? ' pohori-stredisko--pl' : ''}`}>
      {/* Hlavička karty: BUĎ fotka, NEBO malovaný hřeben — ne obojí.
          Hřeben je zástupný obrázek pro dobu, než fotka je; když se pod něj
          postavila ještě fotka (stav po DATA-33), četla se karta jako dvě
          hlavičky nad sebou a stejná kresba se opakovala u každého střediska
          (výtka Michala 30. 7. 2026: „ten stejný obrázek nad každou fotkou…
          teď to tam působí nepatřičně"). Fotka proto bere týž pruh a tutéž
          výšku, jakou měl zástupný hřeben. */}
      {foto ? (
        <figure className="pohori-stredisko-foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (DATA-33), ne upload */}
          <img src={foto.url} alt={foto.popis ?? `${stredisko.nazev} — pohled na středisko`} loading="lazy" />
          {/* Na kartě jen atribuce (podmínka licence). Název souboru z Commons
              nese `title` a alt — vypsaný by na úzké kartě zabral víc místa
              než samotný snímek; celý ho ukazuje mini-stránka střediska. */}
          <figcaption title={foto.popis}>
            {kreditFotky(foto.autor, foto.licence)}
            {foto.stranka && (
              <>
                {' · '}
                <a href={foto.stranka} target="_blank" rel="noopener noreferrer nofollow">
                  {nazevZdroje(foto.stranka)}
                </a>
              </>
            )}
          </figcaption>
        </figure>
      ) : (
        <div className="strk-emblem" aria-hidden="true">
          <svg viewBox="0 0 240 44" preserveAspectRatio="none">
            <path className="strk-hreben-zad" d="M0,44 L38,20 L74,36 L118,10 L166,34 L206,18 L240,32 L240,44 Z" />
            <path className="strk-hreben" d="M0,44 L34,26 L70,40 L116,18 L164,38 L208,24 L240,36 L240,44 Z" />
            <g className="strk-vlajka">
              <path d="M116,18 L116,4" />
              <path d="M116,5 L131,9 L116,13 Z" />
            </g>
          </svg>
        </div>
      )}

      <div className="strk-hlava">
        <b>{url ? <Link href={url}>{stredisko.nazev}</Link> : stredisko.nazev}</b>
        {pl && <span className="pohori-tag-pl">PL</span>}
      </div>

      <div className="strk-cislo">
        {pristupy ? (
          <>
            <b>{pristupy.pocet}</b>
            <span>{pristupy.pocet === 1 ? 'chata odtud' : pristupy.pocet < 5 ? 'chaty odtud' : 'chat odtud'}</span>
          </>
        ) : (
          <>
            <b className="strk-cislo--prazdno">—</b>
            <span>přístupové trasy odtud zatím nemáme spočítané</span>
          </>
        )}
      </div>

      {/* Perex i věta o lanovce jsou v datech celé i s prameny — na kartě se
          ukazují zkrácené na tři řádky (`title` nese plné znění a mini-stránka
          střediska ho jednou vypíše celé). Nezkrácené věty dělaly z mřížky
          karet sloupce různé výšky, ve kterých se název ztratil: karta je
          přehled, ne článek. */}
      {stredisko.perex && (
        <p className="strk-text" title={stredisko.perex}>
          {stredisko.perex}
        </p>
      )}
      {stredisko.lanovka && (
        <p className="pohori-stredisko-lanovka strk-text" title={stredisko.lanovka}>
          <span aria-hidden="true">🚡</span> {stredisko.lanovka}
        </p>
      )}
      {url && (
        <Link className="strk-cta" href={url}>
          Odtud ▸
        </Link>
      )}
    </div>
  )
}

export default StrediskoKarta
