import React from 'react'
import Link from 'next/link'

/* Karta chaty (katalogová dlaždice) — stav pilulkou ve fotce, nikdy barevným rámečkem.
   Hover: zdvih 2 px + plovoucí stín. Zaniklé chaty žijí dál — s érou místo otvíračky. */

export type HutCardFact = { k: React.ReactNode; v: React.ReactNode }

export default function HutCard(props: {
  href?: string
  name: React.ReactNode
  region: React.ReactNode
  status: { state: 'open' | 'closed' | 'gone'; text: React.ReactNode }
  facts: HutCardFact[]
  photo?: React.ReactNode
}) {
  const { href, name, region, status, facts, photo } = props
  const stCls = status.state === 'open' ? '' : status.state === 'gone' ? ' g' : ' c'

  const inner = (
    <>
      <div className="ph">
        {photo ?? (
          /* placeholder krajiny, než budou fotky z Payloadu (licencované) */
          <svg viewBox="0 0 270 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="270" height="128" fill="#dbe7f0" />
            <path d="M0,78 C60,56 120,70 180,48 L215,28 L250,58 L270,54 L270,128 L0,128 Z" fill="#93ab97" />
            <path d="M0,102 C90,88 180,98 270,86 L270,128 L0,128 Z" fill="#64815f" />
          </svg>
        )}
        <span className={`st${stCls}`}>{status.text}</span>
      </div>
      <div className="bd">
        <div className="nm">{name}</div>
        <div className="rg mn">{region}</div>
        <div className="fx">
          {facts.slice(0, 3).map((f, i) => (
            <div key={i}>
              <div className="k mn">{f.k}</div>
              <div className="v">{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  return href ? (
    <Link href={href} className="hc">
      {inner}
    </Link>
  ) : (
    <div className="hc">{inner}</div>
  )
}
