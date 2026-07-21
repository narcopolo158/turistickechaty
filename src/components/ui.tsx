import React from 'react'
import Link from 'next/link'

/* Malé komponenty designového systému „Moderní průvodce" v2.2 (F0-03).
   Čistě prezentační, prop-driven — data přijdou z Payloadu (F0-04+). */

/* — Sekční lišta: modrá = navigace a data, červená = sběratelská vrstva, night = historie — */
export function SectionBar(props: {
  num?: string
  title: React.ReactNode
  action?: React.ReactNode
  variant?: 'blue' | 'red' | 'night'
  id?: string
}) {
  const { num, title, action, variant = 'blue', id } = props
  return (
    <div className={`lista${variant !== 'blue' ? ` ${variant}` : ''}`} id={id}>
      {num ? <span className="n mn">{num}</span> : null}
      <b>{title}</b>
      {action ? <span className="r">{action}</span> : null}
    </div>
  )
}

/* — Tlačítka — červená = akce, modrá = navigační CTA, ghost, link, done — */
type BtnVariant = 'red' | 'blue' | 'ghost' | 'link' | 'done'
const btnClass = (v: BtnVariant = 'red') =>
  `btn${v === 'red' ? '' : ` ${v === 'ghost' ? 'gh' : v}`}`

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant },
) {
  const { variant, className, ...rest } = props
  return <button type="button" {...rest} className={`${btnClass(variant)}${className ? ` ${className}` : ''}`} />
}

export function ButtonLink(props: { href: string; variant?: BtnVariant; children: React.ReactNode }) {
  const { href, variant, children } = props
  return (
    <Link href={href} className={btnClass(variant)}>
      {children}
    </Link>
  )
}

/* — Chip: sousední chata s časem chůze — */
export function Chip(props: {
  label: React.ReactNode
  value?: React.ReactNode
  onClick?: () => void
  title?: string
}) {
  const { label, value, onClick, title } = props
  const inner = (
    <>
      {label} {value != null ? <b>{value}</b> : null}
    </>
  )
  return onClick ? (
    <button type="button" className="chip" onClick={onClick} title={title}>
      {inner}
    </button>
  ) : (
    <span className="chip" title={title}>
      {inner}
    </span>
  )
}

/* — Stavová pilulka (samostatná) — stav nikdy jen barvou, vždy s textem — */
export function StatusPill(props: { state: 'open' | 'closed' | 'gone'; children: React.ReactNode }) {
  const { state, children } = props
  if (state === 'open') {
    return (
      <span className="status solid">
        <i aria-hidden="true" />
        {children}
      </span>
    )
  }
  return (
    <span className="status">
      <i aria-hidden="true" style={{ background: state === 'closed' ? 'var(--red)' : 'var(--gone)' }} />
      {children}
    </span>
  )
}

/* — Infobox: plná plocha, bez rámečku (modrá data · alpská příroda · červená upozornění) — */
export function InfoBox(props: {
  label: React.ReactNode
  variant?: 'blue' | 'alpine' | 'red'
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const { label, variant = 'blue', children, style } = props
  const cls = variant === 'alpine' ? ' alp' : variant === 'red' ? ' red' : ''
  return (
    <div className={`ibox${cls}`} style={style}>
      <span className="lbl mn">{label}</span>
      <br />
      {children}
    </div>
  )
}

/* — Pásová značka: 1:1 s terénním značením KČT (bílá-barva-bílá, 33% pásy) — */
export const TRAIL_COLORS = {
  cervena: { css: 'var(--tr-red)', label: 'červená' },
  modra: { css: 'var(--tr-blue)', label: 'modrá' },
  zelena: { css: 'var(--tr-green)', label: 'zelená' },
  zluta: { css: 'var(--tr-yellow)', label: 'žlutá' },
  cerna: { css: 'var(--tr-black)', label: 'černá' },
} as const

export function TrailBlaze(props: {
  color: keyof typeof TRAIL_COLORS
  box?: boolean
  children?: React.ReactNode
}) {
  const { color, box = false, children } = props
  const c = TRAIL_COLORS[color]
  return (
    <span className={box ? 'znk' : 'znm'}>
      <i aria-hidden="true" style={{ ['--zc' as string]: c.css }} />
      {children ?? c.label}
    </span>
  )
}

/* — Tabulkový řádek katalogu (hairline) — zaniklé chaty jsou plnohodnotné řádky — */
export function HutRow(props: {
  href?: string
  name: React.ReactNode
  sub?: React.ReactNode
  elevation?: React.ReactNode
  beds?: React.ReactNode
  status: { state: 'open' | 'closed' | 'gone'; text: React.ReactNode }
  linkLabel?: React.ReactNode
  last?: boolean
}) {
  const { href, name, sub, elevation, beds, status, linkLabel = 'Profil →', last } = props
  const stCls = status.state === 'open' ? ' o' : status.state === 'gone' ? ' g' : ' c'
  const inner = (
    <>
      <div>
        <b>{name}</b>
        {sub ? <span className="sm">{sub}</span> : null}
      </div>
      <span className="num">{elevation ?? '—'}</span>
      <span className="num">{beds ?? '—'}</span>
      <span className={`st${stCls}`}>{status.text}</span>
      <span className="lnk">{linkLabel}</span>
    </>
  )
  const cls = `row${last ? ' last' : ''}`
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
