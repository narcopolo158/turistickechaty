'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { activeKey } from './SiteHeader'
import { usePocetDeniku } from '@/lib/denik'

/* Ikony dle foundations/ikonografie.html — kartografický styl, tah 1.8, kulatá zakončení */
const ICONS: Record<string, React.ReactNode> = {
  uvod: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 19 L9 8 L13 14 L16 10 L21 19 Z" />
    </svg>
  ),
  chaty: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.6 11.4 L12 5 L19.4 11.4" />
      <path d="M6.5 11 V19 H17.5 V11" />
      <path d="M10.5 19 V14.5 H13.5 V19" />
    </svg>
  ),
  vylety: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4 H17 L15.5 9 H5 Z" />
      <line x1="5" y1="4" x2="5" y2="20" />
      <line x1="3" y1="20" x2="9" y2="20" />
    </svg>
  ),
  denik: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="3.5" x2="12" y2="7" />
    </svg>
  ),
}

const TABS = [
  { href: '/', label: 'Úvod', key: 'uvod', icon: 'uvod' },
  { href: '/chaty', label: 'Chaty', key: 'chaty', icon: 'chaty' },
  { href: '/vylety', label: 'Výlety', key: 'vylety', icon: 'vylety' },
  { href: '/razitkovnik', label: 'Deník', key: 'razitkovnik', icon: 'denik', badge: true },
] as const

export default function TabBar() {
  const pathname = usePathname()
  const active = activeKey(pathname)
  const pocetRazitek = usePocetDeniku()

  return (
    <nav className="tabbar" aria-label="Spodní navigace">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={active === tab.key ? 'on' : ''}>
          {ICONS[tab.icon]}
          {tab.label}
          {'badge' in tab ? <b>{pocetRazitek}</b> : null}
        </Link>
      ))}
    </nav>
  )
}
