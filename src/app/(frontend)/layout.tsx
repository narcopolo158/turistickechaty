import React from 'react'
import './styles.css'

export const metadata = {
  title: 'turistickechaty.cz — průvodce horskými chatami',
  description:
    'Průvodce všemi horskými chatami: ověřená data, mapa, výlety, historie a katalog razítek. Začínáme Krkonošemi.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="cs">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
