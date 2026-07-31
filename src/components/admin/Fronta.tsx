import React from 'react'

import FrontaKlient from './FrontaKlient'

/**
 * Vlastní pohled adminu „Fronta" (`/admin/fronta`) — přehled rozpracovanosti.
 * Serverový obal je prázdný schválně, data i zápis jdou přes `/api/redakce`.
 */
export default function Fronta() {
  return <FrontaKlient />
}
