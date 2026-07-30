import type { Metadata } from 'next'
import React from 'react'

import PrispetForm from '@/components/PrispetForm'
import { getIndexChat, getSlugyOblasti, getStrediskaOblasti } from '@/lib/chaty'
import { lanovkySeSlugy } from '@/lib/lanovky'

import './prispet.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Přispěj otiskem nebo fotkou | turistickechaty.cz',
  description:
    'Pošli otisk razítka nebo fotku turistické chaty. Podání projde redakční kontrolou a zveřejníme ho s tvým jménem.',
}

/**
 * Komunitní sběr (rozhodnutí Michala 21. 7. + 28. 7. 2026): sběratel nahraje
 * otisk či fotku přímo na web, redakce jen schvaluje. Stránka říká poctivě
 * celý proces — čekárna, kontrola, kredit jménem; čísla jsou počítaná z dat
 * (kolika chatám otisk/fotka chybí), žádná ručně psaná.
 */
export default async function PrispetPage() {
  const { index } = await getIndexChat()
  const bezRazitka = index.filter((ch) => !ch.razitko).length
  const bezFotky = index.filter((ch) => ch.heroUrl == null).length

  /**
   * Střediska a lanovky ze všech vedených oblastí (zadání Michala 30. 7.
   * 2026). Lanovka nemá kolekci ani profil — jejím „slugem" je proto
   * `oblast/slug`, aby ji API našlo v přehledu té správné oblasti.
   */
  const oblasti = await getSlugyOblasti()
  const poOblastech = await Promise.all(oblasti.map((o) => getStrediskaOblasti(o)))
  const strediska = poOblastech
    .flat()
    .filter((s) => s.slug)
    .map((s) => ({ slug: s.slug!, nazev: s.nazev }))
  const lanovky = oblasti.flatMap((o) =>
    lanovkySeSlugy(o)
      .filter((l) => l.nazev)
      .map((l) => ({ slug: `${o}/${l.slug}`, nazev: l.nazev! })),
  )

  return (
    <div className="wrap prsp">
      <header className="prsp-hero">
        <div className="prsp-eyebrow">Komunitní sbírka · pomoz průvodci</div>
        <h1>Přispěj otiskem nebo fotkou</h1>
        <p>
          Vedeme {index.length} chat — a {bezRazitka} z nich zatím nemá doložené razítko,{' '}
          {bezFotky} nemá fotku. Jestli máš v deníku otisk nebo v telefonu snímek, pošli je: po
          redakční kontrole se objeví na profilu chaty <b>s tvým jménem u snímku</b>. Vítáme i fotky{' '}
          <b>středisek a lanovek</b> — u těch dnes web ukazuje snímek z Wikimedia Commons a vlastní
          fotka od člověka, který tam byl, ho nahradí.
        </p>
      </header>
      <PrispetForm
        chaty={index.map((ch) => ({ slug: ch.slug, nazev: ch.nazev }))}
        predmety={{ strediska, lanovky }}
      />
      <p className="prsp-pata">
        Sbíráme jen snímky, ke kterým máš práva. Historické otisky vítány — u razítka napiš, z kdy
        pochází. Díky, že pomáháš držet průvodce doložený.
      </p>
    </div>
  )
}
