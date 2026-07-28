import Link from 'next/link'
import React, { Suspense } from 'react'

import KatalogClient from '@/components/KatalogClient'
import { SectionBar } from '@/components/ui'
import { getIndexChat } from '@/lib/chaty'

export const revalidate = 600

export const metadata = {
  title: 'Katalog chat — turistickechaty.cz',
  description:
    'Katalog horských chat s ověřenými daty — bez cen a hvězdiček: stav, výška, služby a datum ověření. Filtry, řazení, mapa.',
}

/**
 * Katalog /chaty (F1b): SSG index všech publikovaných profilů se spočítá při
 * buildu a předá klientovi — filtry, hledání, řazení i mapa běží nad props,
 * prohlížeč se DB nedotýká. Stav filtrů žije v URL (KatalogClient), proto
 * Suspense boundary kolem useSearchParams (Next ji při statickém renderu
 * vyžaduje; fallback se reálně nikdy neukáže — index je v props).
 * Sekce „Kam dál" vede do Atlasu zaniklých, razítkovníku a na žebříčky
 * stránky pohoří (F1d).
 */
export default async function ChatyPage() {
  const { index } = await getIndexChat()

  return (
    <section className="wrap sec" style={{ paddingBottom: 30 }}>
      <Suspense fallback={null}>
        <KatalogClient index={index} />
      </Suspense>

      <div style={{ marginTop: 28 }}>
        <SectionBar num="01" title="Kam dál" variant="red" />
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0 0', maxWidth: '60ch' }}>
          Zajímá tě i to, co už tu není? Projdi <Link href="/zanikle">Atlas zaniklých chat</Link> — boudy
          a schroniska, které zanikly. Doložená razítka sbírá <Link href="/razitkovnik">Razítkovník</Link>{' '}
          a nejvýše položené, nejstarší i největší chaty srovnávají{' '}
          <Link href="/cesko/krkonose#zebricky">žebříčky na stránce pohoří</Link>.
        </p>
      </div>
    </section>
  )
}
