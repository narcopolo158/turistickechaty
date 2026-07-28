'use client'

import React, { useCallback, useRef } from 'react'

/**
 * Faux-3D hover parallax dle handoffu F1 (README §Faux-3D artefakty):
 * `perspective(760px) rotateY/X(±8°) translateY(-4px)`, transition
 * `.35s cubic-bezier(.2,.7,.2,1)` — transition dodává CSS třída volajícího.
 * `prefers-reduced-motion` tilt úplně vypíná (kontrola při každém pohybu —
 * levné a reaguje i na změnu předvolby za běhu). Základní transform
 * (rotace artefaktu v koláži) se předává přes `--zaklad` a po odjetí myši
 * se k němu prvek vrátí.
 */
export default function TiltDiv({
  zaklad = '',
  className,
  style,
  children,
}: {
  /** Klidový transform artefaktu (např. `rotate(-5deg)`) — tilt se k němu skládá. */
  zaklad?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  const tilt = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `${zaklad} perspective(760px) rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 16).toFixed(2)}deg) translateY(-4px)`
    },
    [zaklad],
  )

  const untilt = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = zaklad
  }, [zaklad])

  return (
    <div ref={ref} className={className} style={{ ...style, transform: zaklad || undefined }} onMouseMove={tilt} onMouseLeave={untilt}>
      {children}
    </div>
  )
}
