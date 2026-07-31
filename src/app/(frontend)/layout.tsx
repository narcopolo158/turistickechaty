import type { Metadata } from 'next'
import React from 'react'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import TabBar from '@/components/TabBar'

import './fonts.css'
import './tokens.css'
import './styles.css'
import './components.css'
import './profil.css'
import './profil-zapisnik.css'
import './razitkovnik.css'
import './katalog.css'
import './home-f1.css'

export const metadata: Metadata = {
  // Absolutní základ pro kanonické a OG URL (Next jinak varuje u og:image).
  metadataBase: new URL('https://turistickechaty.cz'),
  title: 'turistickechaty.cz — průvodce turistickými chatami',
  // Výchozí popis pro stránky, které si vlastní nepíšou. Jména oblastí sem
  // NEPATŘÍ: do 31. 7. 2026 tu stálo „Zatím Krkonoše a Jizerské hory" natvrdo
  // a s každou další oblastí by to tiše zastarávalo. Homepage si popis
  // s aktuálním výčtem skládá z dat sama (generateMetadata).
  description:
    'Průvodce turistickými chatami: horské boudy, schroniska, útulny a rozhledny s občerstvením. Ověřená data, mapa, přístupové trasy, historie a katalog razítek.',
  // Discovery odkaz pro AI asistenty (llms.txt) — z hlavičky každé stránky.
  alternates: {
    types: { 'text/markdown': '/llms.txt' },
  },
}

/* Nastaví tmavý režim před hydratací — bez záblesku světlého motivu */
const darkInit = `try{if(localStorage.getItem('tc-dark')==='1')document.body.classList.add('dark')}catch(e){}`

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="cs">
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: darkInit }} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <TabBar />
      </body>
    </html>
  )
}
