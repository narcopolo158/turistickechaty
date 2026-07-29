import React from 'react'

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

export type FotoStrediska = { url: string; autor: string; licence: string; stranka: string }

export function StrediskoKarta({
  stredisko,
  foto,
  pristupy,
}: {
  stredisko: Stredisko
  foto?: FotoStrediska | null
  pristupy?: PristupyZBodu | null
}) {
  const pl = stredisko.zeme === 'pl'

  return (
    <div className={`pohori-stredisko${pl ? ' pohori-stredisko--pl' : ''}`}>
      {/* Malovaný hřeben s vlaječkou — dekorace v barvě země, žádný údaj. */}
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

      {foto && (
        <figure className="pohori-stredisko-foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (DATA-33), ne upload */}
          <img src={foto.url} alt={`${stredisko.nazev} — pohled na středisko`} loading="lazy" />
          <figcaption>
            foto {foto.autor}, {foto.licence} ·{' '}
            <a href={foto.stranka} target="_blank" rel="noopener noreferrer nofollow">
              Wikimedia Commons
            </a>
          </figcaption>
        </figure>
      )}

      <div className="strk-hlava">
        <b>{stredisko.nazev}</b>
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

      {stredisko.perex && <p>{stredisko.perex}</p>}
      {stredisko.lanovka && <p className="pohori-stredisko-lanovka">🚡 {stredisko.lanovka}</p>}
    </div>
  )
}

export default StrediskoKarta
