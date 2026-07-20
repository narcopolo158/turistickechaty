'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { usePocetDeniku } from '@/lib/denik'

export const NAV_ITEMS = [
  { href: '/', label: 'Úvod', key: 'uvod' },
  { href: '/chaty', label: 'Chaty', key: 'chaty' },
  { href: '/vylety', label: 'Výlety', key: 'vylety' },
  { href: '/razitkovnik', label: 'Razítkovník', key: 'razitkovnik' },
] as const

export function activeKey(pathname: string): string {
  if (pathname === '/') return 'uvod'
  const item = NAV_ITEMS.find((n) => n.href !== '/' && pathname.startsWith(n.href))
  return item ? item.key : ''
}

function toggleDark() {
  const dark = document.body.classList.toggle('dark')
  try {
    localStorage.setItem('tc-dark', dark ? '1' : '0')
  } catch {
    /* localStorage nemusí být dostupná — režim se pak neuloží */
  }
}

export default function SiteHeader() {
  const pathname = usePathname()
  const active = activeKey(pathname)
  const pocetRazitek = usePocetDeniku()

  // Pojistka k inline darkInit skriptu z layoutu: not-found (a error) boundary
  // React kreslí na klientu a script tagy v komponentách tam neprovádí — bez
  // tohoto efektu by 404 po reloadu ztratila tmavý režim (hlavička je v layoutu,
  // efekt tak pokryje každou stránku; na SSR stránkách je no-op po darkInit).
  React.useLayoutEffect(() => {
    try {
      document.body.classList.toggle('dark', localStorage.getItem('tc-dark') === '1')
    } catch {
      /* localStorage nemusí být dostupná — zůstane světlý režim */
    }
  }, [])

  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Turistické chaty — úvod">
          <svg viewBox="0 0 40 40" style={{ width: 24, height: 24 }} aria-hidden="true">
            <polygon points="20,7 34,22 6,22" fill="#e0341f" />
            <rect x="11" y="22" width="18" height="12" fill="#e0341f" />
            <rect x="17.5" y="26" width="5" height="8" fill="#fff" />
          </svg>
          Turistické chaty
        </Link>
        <nav className="nav" aria-label="Hlavní navigace">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className={active === item.key ? 'on' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/razitkovnik" className="denik" aria-label="Můj deník razítek">
          Deník <b>{pocetRazitek}</b>
        </Link>
        <button type="button" className="dm" onClick={toggleDark} title="Hřebenovka po tmě" aria-label="Přepnout tmavý režim">
          ◐
        </button>
      </div>
    </header>
  )
}
