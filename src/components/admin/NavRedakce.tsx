import Link from 'next/link'
import React from 'react'

/**
 * Odkazy na redakční prostředí v navigaci adminu.
 *
 * Vlastní pohledy Payloadu (`/admin/fronta`, `/admin/vyber-fotek`) se do menu
 * samy nepřidají — bez tohohle bloku by o nich věděl jen ten, kdo si pamatuje
 * URL. Nástroj, který není vidět, se nepoužívá.
 */
export default function NavRedakce() {
  return (
    <div style={{ margin: '18px 0 0' }}>
      <p
        style={{
          font: '600 10px/1 var(--font-body, sans-serif)',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          opacity: 0.6,
          margin: '0 0 8px',
        }}
      >
        Redakce
      </p>
      <Link href="/admin/fronta" style={{ display: 'block', padding: '4px 0' }}>
        Fronta práce
      </Link>
      <Link href="/admin/vyber-fotek" style={{ display: 'block', padding: '4px 0' }}>
        Výběr fotek
      </Link>
    </div>
  )
}
