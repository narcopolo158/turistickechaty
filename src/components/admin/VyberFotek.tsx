import React from 'react'

import VyberFotekKlient from './VyberFotekKlient'

/**
 * Vlastní pohled adminu „Výběr fotek" (`/admin/vyber-fotek`).
 *
 * Serverový obal je schválně prázdný: data si klient tahá z `/api/redakce`,
 * které je jediným místem, kde se čte a zapisuje fronta. Kdyby si stránka
 * načítala data sama a zapisovala jinudy, měli bychom dvě cesty k týmž
 * souborům a jednou by se rozešly.
 */
export default function VyberFotek() {
  return <VyberFotekKlient />
}
