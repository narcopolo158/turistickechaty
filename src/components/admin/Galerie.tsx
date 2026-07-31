import React from 'react'

import GalerieKlient from './GalerieKlient'

/**
 * Vlastní pohled adminu „Galerie chat" (`/admin/galerie`) — správa fotek
 * objektů, které jich mají víc než jednu. Data i zápis jdou přes /api/redakce.
 */
export default function Galerie() {
  return <GalerieKlient />
}
