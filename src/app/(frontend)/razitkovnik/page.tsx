import React from 'react'

export const metadata = {
  title: 'Razítkovník — turistickechaty.cz',
  description: 'Deník razítek z horských chat — sbírka jako za mlada. Připravujeme.',
}

export default function RazitkovnikPage() {
  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div className="mn" style={{ fontSize: 10, color: 'var(--red)', marginBottom: 8 }}>
        Můj deník razítek
      </div>
      <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
        Razítkovník
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 540, margin: '4px 0 16px' }}>
        Připravujeme — sbírková razítka chat, odznaky pohoří a lokální deník.
      </p>
    </section>
  )
}
