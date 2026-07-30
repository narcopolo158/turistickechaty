import React from 'react'

import { zanikleChatyVse, type ZaniklaChata } from '@/lib/zanikle'

export const revalidate = 600

export const metadata = {
  title: 'Atlas zaniklých chat — turistickechaty.cz',
  description:
    'Zaniklé horské boudy, chaty a schroniska Krkonoš a Karkonosze: kdy vznikly a zanikly, proč, co je na místě dnes. Doložená historie, každý údaj se zdrojem.',
  alternates: { canonical: '/zanikle' },
}

/** Doména z URL (bez www) pro popisek zdroje. */
const host = (u: string): string => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

const Radek = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 8, fontSize: 12.5, margin: '3px 0' }}>
    <span style={{ flex: '0 0 92px', color: 'var(--muted)', fontSize: 11 }}>{k}</span>
    <span>{children}</span>
  </div>
)

const Karta = ({ c }: { c: ZaniklaChata }) => {
  const roky = [c.rokVzniku, c.rokZaniku].some(Boolean) ? `${c.rokVzniku ?? '?'} – ${c.rokZaniku ?? '?'}` : null
  return (
    <div className="card" id={c.slug} style={{ overflow: 'hidden', marginBottom: 12 }}>
      <div className="lista night" style={{ borderRadius: 0, margin: 0 }}>
        <b>{c.nazev}</b>
        {roky && <span className="r">{roky}</span>}
      </div>
      <div className="bx">
        {c.nazvyHistoricke.length > 0 && (
          <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 8px' }}>též {c.nazvyHistoricke.join(' · ')}</p>
        )}
        {c.oblastCast && <Radek k="Poloha">{c.oblastCast}</Radek>}
        {c.pricinaZaniku && (
          <Radek k="Zánik">
            {c.rokZaniku ? `${c.rokZaniku} — ` : ''}
            {c.pricinaZaniku}
          </Radek>
        )}
        {c.coJeDnes && <Radek k="Dnes">{c.coJeDnes}</Radek>}
        {c.pristupnost && (
          <Radek k="Přístup">
            {c.pristupnost}
            {c.pristupnostPoznamka ? ` — ${c.pristupnostPoznamka}` : ''}
          </Radek>
        )}
        {c.popis && <p style={{ fontSize: 13, lineHeight: 1.55, margin: '9px 0 0' }}>{c.popis}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {c.zdroje.length > 0 && (
            <p className="mn" style={{ fontSize: 9.5, color: 'var(--muted)', margin: 0 }}>
              zdroj:{' '}
              {c.zdroje.slice(0, 4).map((u, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <a href={u} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    {host(u)}
                  </a>
                </span>
              ))}
            </p>
          )}
          <span className="mn" style={{ fontSize: 9.5, color: 'var(--muted)' }}>
            jistota {c.jistota}
            {c.lat != null && c.gpsPresnost ? ` · GPS ${c.gpsPresnost}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ZaniklePage() {
  const chaty = zanikleChatyVse()
  const cz = chaty.filter((c) => c.zeme === 'Česko')
  const pl = chaty.filter((c) => c.zeme !== 'Česko')

  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div className="mn" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
        Krkonoše › Historie
      </div>
      <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
        Atlas zaniklých chat
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 620, margin: '4px 0 6px' }}>
        Boudy, chaty a schroniska Krkonoš a Karkonosze, které už neexistují — kdy vznikly a zanikly, proč
        a co je na jejich místě dnes. Doložená historie, každý údaj se zdrojem.
      </p>
      <p className="mn" style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 620, margin: '0 0 20px' }}>
        {chaty.length} objektů (Česko {cz.length}, Polsko {pl.length}). Konzervativní první vydání, ne tvrzení
        o úplnosti; data zatím neověřena redakcí — každé pole nese zdroj.
      </p>

      {chaty.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Atlas se připravuje.</p>
      ) : (
        <>
          {cz.map((c) => (
            <Karta c={c} key={c.slug} />
          ))}
          {pl.length > 0 && (
            <>
              <h2 className="sg" style={{ fontSize: 22, fontWeight: 700, margin: '22px 0 12px' }}>
                Polská strana (Karkonosze)
              </h2>
              {pl.map((c) => (
                <Karta c={c} key={c.slug} />
              ))}
            </>
          )}
        </>
      )}
    </section>
  )
}
