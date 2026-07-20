'use client'

import React from 'react'
import Link from 'next/link'
import RazitkoSvg from './RazitkoSvg'
import { formatDatumDeniku, useDenik } from '@/lib/denik'

/**
 * Razítkovník — obrazovka 5 prototypu nad reálnými daty: skóre a sloty se
 * skládají z publikovaných chat v DB a z lokálního deníku návštěvníka
 * (localStorage přes lib/denik). Žádná demo čísla z prototypu — s jednou
 * chatou v DB je sbírka poctivě X/1.
 */

export type RazitkovnikChata = {
  slug: string
  nazev: string
  vyska: number | null
  oblastNazev: string | null
  /** Kanonická cesta profilu (název slotu na ni odkazuje). */
  url: string | null
  otiskUrl: string | null
  otiskAlt: string | null
  kdeSeRazitkuje: string | null
  /** Chata má v DB doložený sken/foto otisku — řídí infobox „Výzva". */
  maOtiskVDb: boolean
}

type Props = {
  titulek: string
  chaty: RazitkovnikChata[]
}

/** Natočení razítek ve slotech −8° až +8° dle handoffu — deterministicky z indexu (žádná náhoda, ať SSR sedí s klientem). */
const ROTACE = [-7, 4, -3, 6, -8, 3, 8, -5]

/** Šedý přerušovaný obrys s „?" — prázdný slot 1:1 z prototypu (bez defs, id se nehádají). */
function ChybejiciRazitko() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="#8a949c" strokeDasharray="7 6">
        <circle cx="100" cy="100" r="90" strokeWidth="3" />
      </g>
      <text x="100" y="94" textAnchor="middle" fontFamily="'Space Grotesk','Inter',sans-serif" fontSize="30" fontWeight="700" fill="#8a949c">
        ?
      </text>
      <text x="100" y="124" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="2" fill="#8a949c">
        CHYBÍ
      </text>
    </svg>
  )
}

/** Odznak pohoří: progres po obvodu (stroke-dasharray z 302 ≈ obvod r48) — žádné stuhy. */
function OdznakOblasti({ nazev, mam, celkem }: { nazev: string; mam: number; celkem: number }) {
  const obvod = 302
  const delka = celkem > 0 ? Math.round((mam / celkem) * obvod) : 0
  return (
    <div className="card bx" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width="92" height="92" viewBox="0 0 104 104" style={{ flex: 'none' }} role="img" aria-label={`Odznak ${nazev}: ${mam} z ${celkem} razítek`}>
        <circle cx="52" cy="52" r="48" fill="#f7f6f0" />
        <circle cx="52" cy="52" r="48" fill="none" stroke="#e6e6e1" strokeWidth="2" />
        <circle cx="52" cy="52" r="48" fill="none" stroke="#e0341f" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${delka} ${obvod}`} transform="rotate(-90 52 52)" />
        <path d="M22 66 L38 42 L47 54 L58 36 L82 66 Z" fill="#c9c4b4" />
        <text x="52" y="86" textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fill="#5e6971">
          {nazev.toUpperCase()}
        </text>
        <text x="52" y="24" textAnchor="middle" fontFamily="'Space Grotesk','Inter',sans-serif" fontSize="11" fontWeight="700" fill="#384057">
          {mam}/{celkem}
        </text>
      </svg>
      <div>
        <div className="sg" style={{ fontSize: 15.5, fontWeight: 700 }}>Odznak {nazev}</div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          Za kompletní sbírku pohoří. Progres roste po obvodu — žádné stuhy, žádný kýč.
        </p>
      </div>
    </div>
  )
}

export default function RazitkovnikClient({ titulek, chaty }: Props) {
  const denik = useDenik()

  // skóre = průnik deníku s chatami na stránce (deník může nést i slugy,
  // které v DB už/ještě nejsou — ty se počítají jen do badge v hlavičce)
  const mam = chaty.filter((ch) => denik.zaznamy[ch.slug]).length
  const celkem = chaty.length
  const pct = celkem > 0 ? Math.round((mam / celkem) * 100) : 0

  // skupiny podle oblasti v pořadí, v jakém přišly ze serveru (řazeno názvem)
  const oblasti: { nazev: string | null; chaty: RazitkovnikChata[] }[] = []
  for (const ch of chaty) {
    const skupina = oblasti.find((o) => o.nazev === ch.oblastNazev)
    if (skupina) skupina.chaty.push(ch)
    else oblasti.push({ nazev: ch.oblastNazev, chaty: [ch] })
  }

  const bezOtiskuVDb = chaty.filter((ch) => !ch.maOtiskVDb).length
  const jednaOblast = oblasti.length === 1 && oblasti[0].nazev ? oblasti[0].nazev : null

  if (celkem === 0) {
    return (
      <div className="es" style={{ maxWidth: 420 }}>
        <div style={{ width: 74, height: 74, margin: '0 auto', opacity: .45, transform: 'rotate(-7deg)' }}>
          <ChybejiciRazitko />
        </div>
        <div className="h sg">Prázdný razítkovník</div>
        <p>V průvodci zatím nejsou žádné chaty — sloty razítek se objeví s prvními profily.</p>
        <Link className="lk" href="/">Zpět na úvod →</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div className="mn" style={{ fontSize: 10, color: 'var(--red)', marginBottom: 6 }}>
            Můj deník razítek
          </div>
          <h1 className="sg" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.02em' }}>{titulek}</h1>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <b className="sg" style={{ fontSize: 36, fontWeight: 700, color: 'var(--red)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            <span data-testid="skore-mam">{mam}</span>
            <span style={{ color: 'var(--muted)', fontSize: 20 }}>/{celkem}</span>
          </b>
          <span className="mn" style={{ fontSize: 9, color: 'var(--muted)', display: 'block', marginTop: 3 }}>
            razítek ve sbírce
          </span>
        </div>
      </div>

      <div className="pbar">
        <div className="tr">
          <i data-testid="pbar-vypln" style={{ width: `${pct}%` }} />
        </div>
        <span>
          {pct} % · ZBÝVÁ {celkem - mam}
          {jednaOblast && <> · ODZNAK {jednaOblast.toUpperCase()}</>}
        </span>
      </div>

      {mam === 0 && (
        <div className="es" style={{ margin: '0 0 18px' }}>
          <div className="h sg">Prázdný deník</div>
          <p>První otisk je nejlepší. Začni chatou, kterou znáš — razítko se sbírá na jejím profilu.</p>
          <Link className="lk" href="/chaty">Najít první razítko →</Link>
        </div>
      )}

      {oblasti.map((oblast, i) => (
        <section key={oblast.nazev ?? `bez-oblasti-${i}`}>
          <div className="lista red">
            <span className="n mn">0{i + 1}</span>
            <b>{oblast.nazev ?? 'Bez zařazení'}</b>
          </div>
          <div className="slotg">
            {oblast.chaty.map((ch, j) => {
              const zaznam = denik.zaznamy[ch.slug]
              const rotace = ROTACE[j % ROTACE.length]
              return (
                <div className="slot" key={ch.slug} data-testid={zaznam ? 'slot-mam' : 'slot-chybi'}>
                  <div className="ot" style={zaznam ? { transform: `rotate(${rotace}deg)` } : undefined}>
                    {!zaznam ? (
                      <ChybejiciRazitko />
                    ) : ch.otiskUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- malý otisk, jako na profilu
                      <img src={ch.otiskUrl} alt={ch.otiskAlt ?? `Otisk razítka — ${ch.nazev}`} />
                    ) : (
                      <RazitkoSvg nazev={ch.nazev} pohori={ch.oblastNazev} vyska={ch.vyska} />
                    )}
                  </div>
                  <div className="nm">{ch.url ? <Link href={ch.url}>{ch.nazev}</Link> : ch.nazev}</div>
                  <div className="dt">
                    {zaznam
                      ? formatDatumDeniku(zaznam.datum)
                      : ch.kdeSeRazitkuje
                        ? `Razítkuje se: ${ch.kdeSeRazitkuje}`
                        : 'Zatím bez otisku'}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="g2" style={{ marginTop: 18, alignItems: 'start' }}>
        {oblasti
          .filter((o): o is { nazev: string; chaty: RazitkovnikChata[] } => o.nazev != null)
          .map((o) => (
            <OdznakOblasti
              key={o.nazev}
              nazev={o.nazev}
              mam={o.chaty.filter((ch) => denik.zaznamy[ch.slug]).length}
              celkem={o.chaty.length}
            />
          ))}
        {bezOtiskuVDb > 0 && (
          <div className="ibox" style={{ alignSelf: 'stretch' }}>
            <span className="lbl">VÝZVA</span>
            <br />
            Komunitě zatím chybí {bezOtiskuVDb === 1 ? 'otisk razítka 1 chaty' : `otisky razítek ${bezOtiskuVDb} chat`} — do té
            doby sloty nesou stylizované razítko z ověřených údajů. Nahrávání skenů s kreditem u otisku připravujeme.
          </div>
        )}
      </div>
    </>
  )
}
