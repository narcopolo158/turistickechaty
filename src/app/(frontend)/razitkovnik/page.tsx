import React from 'react'

import RazitkovnikClient from '@/components/RazitkovnikClient'
import { getChatyProRazitkovnik } from '@/lib/chaty'

export const revalidate = 600

export const metadata = {
  title: 'Razítkovník — turistickechaty.cz',
  description: 'Deník razítek z turistických chat — sbírka jako za mlada. Sbírá se na profilech chat, deník zůstává ve tvém prohlížeči.',
}

export default async function RazitkovnikPage() {
  const chaty = await getChatyProRazitkovnik()

  // s jediným pohořím v průvodci nese titulek jeho jméno (dle prototypu),
  // s více pohořími zůstává obecný — nic se nedomýšlí
  const oblasti = [...new Set(chaty.map((ch) => ch.oblastNazev).filter(Boolean))]
  const titulek = oblasti.length === 1 ? `${oblasti[0]} — sbírka razítek` : 'Sbírka razítek'

  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <RazitkovnikClient titulek={titulek} chaty={chaty} />
    </section>
  )
}
