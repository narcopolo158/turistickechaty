import React from 'react'

export const metadata = {
  title: 'Výlety — turistickechaty.cz',
  description: 'Redakční výlety s chatami na trase — čas, převýšení, značení a razítka. Připravujeme.',
}

export default function VyletyPage() {
  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div className="mn" style={{ fontSize: 10, color: 'var(--alpine-deep)', marginBottom: 8 }}>
        Výlety a přechody
      </div>
      <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
        Kam o víkendu
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 560, margin: '4px 0 18px' }}>
        Připravujeme — redakční výlety s chatami na trase, vždy s časem, převýšením a značením.
      </p>
    </section>
  )
}
