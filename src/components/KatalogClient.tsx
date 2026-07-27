'use client'

import React, { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import MapaChat, { type MapovaChata } from './MapaChat'
import RazitkoSvg from './RazitkoSvg'
import type { IndexChata } from '@/lib/index-chat'
import {
  CHIP_KLICE,
  filtrujKatalog,
  formatCheckedDatum,
  formatVyskaM,
  RAZENI,
  stavDoUrl,
  stavZUrl,
  tagKarty,
  ZOBRAZENI,
  type ChipKlic,
  type KatalogStav,
  type Razeni,
  type Zobrazeni,
} from '@/lib/katalog'

/**
 * Katalog /chaty (F1b) — funkční prototyp handoffu přenesený 1:1
 * (`design/handoff-f1/F1-Katalog.dc.html`): filtr-bar (hledání, přepínač
 * Karty/Řádky/Mapa, řazení, chips), kartotéční lístky s mini-otiskem
 * razítka, tabulkové řádky, mapa s přefiltrovanou množinou a poctivý
 * prázdný stav s odkazem do Atlasu zaniklých.
 *
 * Zdroj pravdy stavu = URL (`?q=&chips=&sort=&view=`): chips/řazení/pohled
 * dělají history.pushState (funguje „zpět"), psaní do hledání replaceState
 * (každé písmeno není položka historie). Next ≥14.1 obě API synchronizuje
 * s useSearchParams. Data přicházejí jako props ze server komponenty
 * (SSG index) — klient nedotazuje nic.
 */

const CHIP_POPISKY: Record<ChipKlic, string> = {
  'v-provozu': 'v provozu',
  zanikla: 'zaniklá',
  nocleh: 'nocleh',
  obcerstveni: 'občerstvení',
  razitko: 'razítko',
  znamka: 'známka',
}

const RAZENI_POPISKY: Record<Razeni, string> = {
  abc: 'abecedně',
  vyska: 'podle výšky',
  overeno: 'naposledy ověřeno',
}

const ZOBRAZENI_POPISKY: Record<Zobrazeni, string> = {
  karty: 'Karty',
  radky: 'Řádky',
  mapa: 'Mapa',
}

/** Ikonky doložených služeb dle prototypu; bez jediné doložené poctivá „–". */
const ikonyChaty = (ch: IndexChata): string[] => {
  const ikony = [ch.nocleh === true ? '⌂' : null, ch.obcerstveni === true ? '☕' : null, ch.razitko ? '◉' : null]
    .filter((i): i is string => i != null)
  return ikony.length > 0 ? ikony : ['–']
}

const stavPill = (stav: string | null): { cls: string; text: string } =>
  stav === 'zanikla'
    ? { cls: 'g', text: 'zaniklá' }
    : stav === 'mimo-provoz'
      ? { cls: 'c', text: 'mimo provoz' }
      : stav === 'v-provozu'
        ? { cls: 'o', text: 'v provozu' }
        : { cls: 'n', text: 'stav nezjištěn' }

function MiniOtisk({ ch }: { ch: IndexChata }) {
  return (
    <span className="ktl-otisk" title={ch.otiskUrl ? 'miniatura doloženého otisku' : 'razítko doloženo — sken zatím chybí (stylizovaný náhled)'}>
      {ch.otiskUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura skenu z DB, rozměr fixní
        <img src={ch.otiskUrl} alt={ch.otiskAlt ?? `Otisk razítka — ${ch.nazev}`} />
      ) : (
        <RazitkoSvg nazev={ch.nazev} vyska={ch.vyska} />
      )}
    </span>
  )
}

export default function KatalogClient({ index }: { index: IndexChata[] }) {
  const searchParams = useSearchParams()
  const stav: KatalogStav = useMemo(() => stavZUrl(new URLSearchParams(searchParams.toString())), [searchParams])
  const vysledek = useMemo(() => filtrujKatalog(index, stav), [index, stav])

  const zmen = useCallback(
    (patch: Partial<KatalogStav>, zpusob: 'push' | 'replace' = 'push') => {
      const novy = { ...stav, ...patch }
      const query = stavDoUrl(novy)
      const url = query ? `?${query}` : window.location.pathname
      if (zpusob === 'push') window.history.pushState(null, '', url)
      else window.history.replaceState(null, '', url)
    },
    [stav],
  )

  const prepniChip = (chip: ChipKlic) =>
    zmen({ chips: stav.chips.includes(chip) ? stav.chips.filter((c) => c !== chip) : [...stav.chips, chip] })

  // Mapa: markery = přefiltrovaná množina; jen profily s doloženou GPS a URL.
  const proMapu: MapovaChata[] = useMemo(
    () =>
      vysledek.flatMap((ch) =>
        ch.lat != null && ch.lng != null && ch.url != null
          ? [{ slug: ch.slug, nazev: ch.nazev, vyska: ch.vyska, stav: ch.stav as MapovaChata['stav'], lat: ch.lat, lng: ch.lng, url: ch.url }]
          : [],
      ),
    [vysledek],
  )
  const bezGpsPocet = vysledek.length - proMapu.length

  // Klíč gridu = otisk filtru → přefiltrování remountne výpis → fadeUp animace (prototyp).
  const filtrKlic = `${stav.q}|${stav.chips.join(',')}|${stav.sort}|${stav.view}`

  return (
    <>
      <header className="ktl-hero">
        <div>
          <div className="ktl-drobek mn">
            Průvodce <span aria-hidden="true">/</span> <b>Katalog chat</b>
          </div>
          <h1>Katalog chat</h1>
          <p>
            Všech {index.length} vedených profilů bez stránkování — kartotéka, kterou si přebereš
            filtry. Žádné ceny, žádné hvězdičky: stav, výška, služby a datum ověření.
          </p>
        </div>
        <div className="ktl-counter" aria-live="polite">
          <span className="ktl-counter-cislo">{vysledek.length}</span> zobrazeno
        </div>
      </header>

      <div className="ktl-bar" role="search">
        <div className="ktl-bar-radek">
          <label className="ktl-hledani">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={stav.q}
              placeholder="Hledat v katalogu…"
              aria-label="Hledat v katalogu"
              onChange={(e) => zmen({ q: e.target.value }, 'replace')}
            />
          </label>
          <div className="ktl-seg" role="group" aria-label="Zobrazení">
            {ZOBRAZENI.map((v) => (
              <button key={v} type="button" className={stav.view === v ? 'akt' : ''} onClick={() => zmen({ view: v })}>
                {ZOBRAZENI_POPISKY[v]}
              </button>
            ))}
          </div>
          <div className="ktl-seg-sk" role="group" aria-label="Řazení">
            <span className="ktl-mikrolabel">Řadit</span>
            {RAZENI.map((r) => (
              <button key={r} type="button" className={`ktl-sort${stav.sort === r ? ' akt' : ''}`} onClick={() => zmen({ sort: r })}>
                {RAZENI_POPISKY[r]}
              </button>
            ))}
          </div>
        </div>
        <div className="ktl-bar-radek ktl-bar-chips">
          <span className="ktl-mikrolabel">Filtry</span>
          {CHIP_KLICE.map((chip) => {
            const aktivni = stav.chips.includes(chip)
            return (
              <button key={chip} type="button" className={`ktl-chip${aktivni ? ' akt' : ''}`} aria-pressed={aktivni} onClick={() => prepniChip(chip)}>
                {CHIP_POPISKY[chip]}
                {aktivni ? ' ×' : ''}
              </button>
            )
          })}
          <span className="ktl-vypln" />
          <span className="ktl-pozn mn">
            službové filtry vybírají jen doložené {'„ano“'} · stav filtrů patří do URL — sdílení
            i {'„zpět“'} fungují
          </span>
        </div>
      </div>

      <div className="ktl-vypis">
        {vysledek.length === 0 ? (
          <div className="ktl-prazdno">
            <div className="ktl-prazdno-kruh" aria-hidden="true">?</div>
            <div className="ktl-prazdno-titulek">Téhle kombinaci zatím nic neodpovídá</div>
            <p>
              Vedeme jen doložené profily — nic si nedomýšlíme. Zkus ubrat filtr, nebo se podívej do{' '}
              <Link href="/zanikle">Atlasu zaniklých</Link>.
            </p>
            <button type="button" className="ktl-reset" onClick={() => zmen({ q: '', chips: [] })}>
              Zrušit filtry
            </button>
          </div>
        ) : stav.view === 'karty' ? (
          <div key={filtrKlic} className="ktl-grid">
            {vysledek.map((ch, i) => {
              const pill = stavPill(ch.stav)
              const telo = (
                <>
                  <span className="ktl-karta-linka" aria-hidden="true" />
                  <span className="ktl-karta-thumb" aria-hidden="true">
                    {ch.razitko && <MiniOtisk ch={ch} />}
                  </span>
                  <span className="ktl-karta-telo">
                    <span className="ktl-karta-pohori">{ch.oblastNazev ?? '—'}</span>
                    <span className="ktl-karta-nazev">{ch.nazev}</span>
                    <span className="ktl-karta-tag">{tagKarty(ch)}</span>
                    <span className="ktl-karta-fakta">
                      <b>{formatVyskaM(ch.vyska)}</b>
                      <span className={`ktl-pill ${pill.cls}`}>{pill.text}</span>
                    </span>
                    <span className="ktl-ikony">
                      {ikonyChaty(ch).map((ik, j) => (
                        <span key={j}>{ik}</span>
                      ))}
                    </span>
                    <span className="ktl-karta-pata">
                      <span className="mn">ověř. {formatCheckedDatum(ch.checked)}</span>
                      <span className="ktl-karta-cta">Profil ▸</span>
                    </span>
                  </span>
                </>
              )
              const style = { '--rot': `${((i % 3) - 1) * 0.7}deg` } as React.CSSProperties
              return ch.url ? (
                <Link key={ch.slug} href={ch.url} className="ktl-karta" style={style}>
                  {telo}
                </Link>
              ) : (
                <span key={ch.slug} className="ktl-karta" style={style}>
                  {telo}
                </span>
              )
            })}
          </div>
        ) : stav.view === 'radky' ? (
          <div key={filtrKlic} className="ktl-tabulka">
            <div className="ktl-radek ktl-radek-hlava" aria-hidden="true">
              <span>Chata</span>
              <span>Výška</span>
              <span>Stav</span>
              <span>Služby</span>
              <span>Ověřeno</span>
            </div>
            {vysledek.map((ch) => {
              const pill = stavPill(ch.stav)
              const telo = (
                <>
                  <span className="ktl-radek-nazev">
                    <b>{ch.nazev}</b>
                    <i className="ktl-karta-tag">{tagKarty(ch)}</i>
                  </span>
                  <span className="ktl-num">{formatVyskaM(ch.vyska)}</span>
                  <span>
                    <span className={`ktl-pill ${pill.cls}`}>{pill.text}</span>
                  </span>
                  <span className="ktl-ikony">
                    {ikonyChaty(ch).map((ik, j) => (
                      <span key={j}>{ik}</span>
                    ))}
                  </span>
                  <span className="mn">{formatCheckedDatum(ch.checked)}</span>
                </>
              )
              return ch.url ? (
                <Link key={ch.slug} href={ch.url} className="ktl-radek">
                  {telo}
                </Link>
              ) : (
                <span key={ch.slug} className="ktl-radek">
                  {telo}
                </span>
              )
            })}
          </div>
        ) : (
          <div className="ktl-mapa">
            <MapaChat chaty={proMapu} />
            <p className="ktl-pozn mn">
              markery = přefiltrovaná množina ({proMapu.length}
              {bezGpsPocet > 0 ? `; ${bezGpsPocet} profilů bez doložené GPS na mapě není` : ''})
            </p>
          </div>
        )}
      </div>

    </>
  )
}
