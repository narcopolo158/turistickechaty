import React from 'react'

export const metadata = {
  title: 'Chaty — turistickechaty.cz',
  description: 'Katalog horských chat s ověřenými daty. Připravujeme, začínáme Krkonošemi.',
}

export default function ChatyPage() {
  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div className="mn" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
        Česko › Pohoří
      </div>
      <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
        Katalog chat
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 540, margin: '4px 0 16px' }}>
        Připravujeme — katalog pohoří s ověřenými daty chat začne Krkonošemi.
      </p>
    </section>
  )
}
