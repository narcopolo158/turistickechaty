import React from 'react'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import TabBar from '@/components/TabBar'

import './fonts.css'
import './tokens.css'
import './styles.css'
import './components.css'
import './profil.css'
import './razitkovnik.css'

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
        <SiteFooter />
        <TabBar />
      </body>
    </html>
  )
}
