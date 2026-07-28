'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import { type IndexChata } from '@/lib/index-chat'
import {
  CHIP_KLICE,
  CHIP_POPISKY,
  filtrujKatalog,
  formatCheckedDatum,
  formatVyskaM,
  VYCHOZI_STAV,
  type ChipKlic,
  type Razeni,
} from '@/lib/katalog'

/**
 * 02 Chaty oblasti (handoff stránky pohoří): filtr chips + řazení +
 * tabulkové řádky (název+tag, výška, StatusPill, ikonky služeb, ověřeno).
 * Reuse čisté logiky katalogu (`filtrujKatalog` — stavové chips OR, službové
 * AND jen nad doloženým „ano"); stav drží komponenta lokálně (plný katalog
 * s URL stavem je na /chaty). Poctivost: chybějící výška „—" (Lovecká),
 * zaniklá šedě, nic se nedomýšlí.
 */
export default function PohoriChatySeznam({ index }: { index: IndexChata[] }) {
  const [chips, setChips] = useState<ChipKlic[]>([])
  const [sort, setSort] = useState<Razeni>('vyska')

  const vysledek = useMemo(
    () => filtrujKatalog(index, { ...VYCHOZI_STAV, chips, sort }),
    [index, chips, sort],
  )

  const prepniChip = (chip: ChipKlic) =>
    setChips((akt) => (akt.includes(chip) ? akt.filter((c) => c !== chip) : [...akt, chip]))

  return (
    <div className="pchs">
      <div className="pchs-lista">
        <div className="pchs-chips" role="group" aria-label="Filtry">
          {CHIP_KLICE.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`pchs-chip${chips.includes(chip) ? ' akt' : ''}`}
              aria-pressed={chips.includes(chip)}
              onClick={() => prepniChip(chip)}
            >
              {CHIP_POPISKY[chip]}
              {chips.includes(chip) ? ' ×' : ''}
            </button>
          ))}
        </div>
        <div className="pchs-razeni" role="group" aria-label="Řazení">
          <button type="button" className={sort === 'vyska' ? 'akt' : ''} onClick={() => setSort('vyska')}>
            podle výšky
          </button>
          <button type="button" className={sort === 'abc' ? 'akt' : ''} onClick={() => setSort('abc')}>
            abecedně
          </button>
        </div>
      </div>

      <div className="pchs-tabulka" role="table" aria-label="Chaty oblasti">
        {vysledek.map((ch) => {
          const pill =
            ch.stav === 'v-provozu'
              ? { cls: 'ok', text: 'v provozu' }
              : ch.stav === 'zanikla'
                ? { cls: 'zanikla', text: 'zaniklá' }
                : ch.stav === 'mimo-provoz'
                  ? { cls: 'mimo', text: 'mimo provoz' }
                  : { cls: 'nezn', text: 'stav neověřen' }
          const radek = (
            <>
              <span className="pchs-nazev">
                {ch.nazev}
                {ch.zeme === 'pl' && <i className="pchs-tag"> · PL</i>}
              </span>
              <span className="pchs-vyska">{formatVyskaM(ch.vyska)}</span>
              <span className={`pchs-pill ${pill.cls}`}>{pill.text}</span>
              <span className="pchs-sluzby" aria-hidden="true">
                {ch.nocleh === true && <span title="nocleh">⌂</span>}
                {ch.obcerstveni === true && <span title="občerstvení">☕</span>}
                {ch.razitko && <span title="razítko">◉</span>}
              </span>
              <span className="pchs-overeno mn">ověř. {formatCheckedDatum(ch.checked)}</span>
            </>
          )
          return ch.url ? (
            <Link key={ch.slug} href={ch.url} className="pchs-radek" role="row">
              {radek}
            </Link>
          ) : (
            <span key={ch.slug} className="pchs-radek" role="row">
              {radek}
            </span>
          )
        })}
      </div>
      {vysledek.length === 0 && (
        <p className="pchs-prazdno">
          Téhle kombinaci zatím nic neodpovídá — vedeme jen doložené profily.{' '}
          <button type="button" className="pchs-reset" onClick={() => setChips([])}>
            Zrušit filtry
          </button>
        </p>
      )}
      <p className="pchs-pozn">
        {vysledek.length} z {index.length} profilů · službové filtry vybírají jen doložené {'„ano“'} · plný katalog
        s hledáním a mapou: <Link href="/chaty">Katalog chat ▸</Link>
      </p>
    </div>
  )
}
