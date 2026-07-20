import React from 'react'
import Link from 'next/link'

/**
 * 404 „MIMO ZNAČKU" — razítková řeč systémových stavů 1:1 z handoffu
 * `razitko-moment.html` (blok „Tady cesta nevede"): šedý přerušovaný obrys
 * razítka (#8a949c, nikdy cihlová), vždy s akcí zpět. Chytá notFound()
 * z profilů chat i neznámé URL přes catch-all `[...rest]`.
 */

export const metadata = {
  title: '404 — mimo značku · turistickechaty.cz',
  robots: { index: false },
}

/** Šedý přerušovaný obrys s „404" — kresba dle handoffu, bez defs (žádná id, instance se nehádají). */
function RazitkoMimoZnacku() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="#8a949c" strokeDasharray="7 6">
        <circle cx="100" cy="100" r="92" strokeWidth="3" />
      </g>
      <text x="100" y="112" textAnchor="middle" fontFamily="'Space Grotesk','Inter',sans-serif" fontSize="40" fontWeight="700" fill="#8a949c">
        404
      </text>
      <text x="100" y="140" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="2" fill="#8a949c">
        MIMO ZNAČKU
      </text>
    </svg>
  )
}

export default function NotFound() {
  return (
    <section className="wrap sec" style={{ paddingTop: 54, paddingBottom: 60, display: 'grid', placeItems: 'center' }}>
      <div className="es" style={{ maxWidth: 420, padding: '34px 28px' }}>
        <div style={{ width: 74, height: 74, margin: '0 auto', opacity: 0.45, transform: 'rotate(-7deg)' }}>
          <RazitkoMimoZnacku />
        </div>
        <div className="h sg">Tady cesta nevede</div>
        <p>Stránka neexistuje — možná zanikla jako Obří bouda.</p>
        <Link className="lk" href="/">
          Zpět na rozcestí →
        </Link>
      </div>
    </section>
  )
}
