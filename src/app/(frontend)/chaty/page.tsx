import Link from 'next/link'
import React from 'react'

import MapaChat from '@/components/MapaChat'
import { getChatyProMapu } from '@/lib/chaty'

export const metadata = {
  title: 'Chaty — turistickechaty.cz',
  description: 'Katalog horských chat s ověřenými daty. Připravujeme, začínáme Krkonošemi.',
}

export default async function ChatyPage() {
  // mapa patří v MVP i do katalogu (rozhodnutí Michala, zadání ručního běhu 20. 7.)
  const chaty = await getChatyProMapu()

  return (
    <>
      <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 0 }}>
        <div className="mn" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
          Česko › Pohoří
        </div>
        <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
          Katalog chat
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 540, margin: '4px 0 10px' }}>
          Připravujeme — katalog pohoří s ověřenými daty chat začne Krkonošemi. Na mapě už jsou
          chaty, které v průvodci mají profil.
        </p>
        <p style={{ fontSize: 13, margin: '0 0 16px' }}>
          Zajímá tě i to, co už tu není? Projdi <Link href="/zanikle">Atlas zaniklých chat</Link> — boudy a
          schroniska Krkonoš, která zanikla.
        </p>
      </section>
      <MapaChat chaty={chaty} />
      <div style={{ paddingBottom: 30 }} />
    </>
  )
}
