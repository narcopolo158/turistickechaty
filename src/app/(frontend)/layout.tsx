import React from 'react'
import SiteHeader from '@/components/SiteHeader'
import TabBar from '@/components/TabBar'

import './fonts.css'
import './tokens.css'
import './styles.css'
import './components.css'

export const metadata = {
  title: 'turistickechaty.cz — průvodce horskými chatami',
  description:
    'Průvodce všemi horskými chatami: ověřená data, mapa, výlety, historie a katalog razítek. Začínáme Krkonošemi.',
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
        <footer className="foot">
          <div className="wrap">
            <span className="sg" style={{ fontWeight: 700 }}>
              Turistické chaty
            </span>
            <span>průvodce všemi horskými chatami · Krkonoše → Česko → Slovensko → Alpy</span>
            <span className="mn" style={{ marginLeft: 'auto', fontSize: 9 }}>
              MAPY.COM · KČT · SIL OFL FONTY
            </span>
          </div>
        </footer>
        <TabBar />
      </body>
    </html>
  )
}
