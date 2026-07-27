'use client'

import React from 'react'

/**
 * Tisk stránky průvodce — print CSS skryje chrome a přidá patičku (.pfoot).
 * Volitelné children/className: homepage F1c používá chip „Tisk seznamu ▸"
 * (printová podoba homepage = čistý seznam chat, B13 handoffu).
 */
export default function TiskButton({
  className = 'btn gh',
  children = 'Vytisknout stránku průvodce ⎙',
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  )
}
