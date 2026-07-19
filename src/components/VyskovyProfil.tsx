'use client'

import React, { useRef } from 'react'

/**
 * Interaktivní výškový profil trasy — 1:1 dle handoffu (prototyp.html #prf):
 * SVG křivka (modrá 2px, výplň soft blue), mousemove → binární vyhledání bodu
 * na path, červený bod + tmavá pilulka „km · m n. m.". Komponenta je čistě
 * datová: body [km, výška] přicházejí z Payloadu, nic se tu nedomýšlí.
 */

export type BodProfilu = [km: number, vyska: number]

type Props = {
  body: BodProfilu[]
  /** Popisek výchozího bodu (např. „Pec pod Sněžkou"). */
  start: string
  /** Popisek cíle (název chaty). */
  cil: string
}

// Geometrie plátna dle prototypu: viewBox 1030×110, křivka x 20–1010, y 8–88, výplň k y=102
const X0 = 20
const X1 = 1010
const Y_TOP = 8
const Y_BOTTOM = 88
const Y_BASE = 102

/** Hladká křivka body → cubic bezier (Catmull-Rom), jako ručně kreslené „C" v prototypu. */
const hladkaCesta = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

const fmtKm = (km: number): string => km.toFixed(1).replace('.', ',')

export default function VyskovyProfil({ body, start, cil }: Props) {
  const prfRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const serazene = [...body].sort((a, b) => a[0] - b[0])
  const maxKm = serazene[serazene.length - 1][0]
  const vysky = serazene.map((b) => b[1])
  const minV = Math.min(...vysky)
  const maxV = Math.max(...vysky)
  const rozsah = Math.max(maxV - minV, 1)

  const pts = serazene.map(([km, v]) => ({
    x: X0 + (km / maxKm) * (X1 - X0),
    y: Y_BOTTOM - ((v - minV) / rozsah) * (Y_BOTTOM - Y_TOP),
  }))
  const cara = hladkaCesta(pts)
  const vypln = `${cara} L${X1},${Y_BASE} L${X0},${Y_BASE} Z`

  // Přesně dle prototypu: binární vyhledání bodu na path dle x, výška čtená z křivky
  const onMove = (e: React.MouseEvent) => {
    const pl = lineRef.current, svg = svgRef.current, dot = dotRef.current, tip = tipRef.current
    if (!pl || !svg || !dot || !tip) return
    const r = svg.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 1030
    const L = pl.getTotalLength()
    let lo = 0, hi = L
    for (let i = 0; i < 18; i++) {
      const m = (lo + hi) / 2
      if (pl.getPointAtLength(m).x < x) lo = m
      else hi = m
    }
    const p = pl.getPointAtLength(lo)
    if (p.x < X0 || p.x > X1) return
    dot.setAttribute('cx', String(p.x))
    dot.setAttribute('cy', String(p.y))
    dot.setAttribute('opacity', '1')
    const km = ((p.x - X0) / (X1 - X0)) * maxKm
    const vyska = Math.round(minV + ((Y_BOTTOM - p.y) / (Y_BOTTOM - Y_TOP)) * rozsah)
    tip.textContent = `${fmtKm(km)} KM · ${vyska.toLocaleString('cs')} M`
    tip.style.opacity = '1'
    tip.style.left = `${Math.min(Math.max((p.x / 1030) * 100, 3), 80)}%`
  }

  const onLeave = () => {
    dotRef.current?.setAttribute('opacity', '0')
    if (tipRef.current) tipRef.current.style.opacity = '0'
  }

  return (
    <div className="prof" ref={prfRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <svg viewBox="0 0 1030 110" ref={svgRef} role="img" aria-label={`Výškový profil trasy: ${start} → ${cil}, ${fmtKm(maxKm)} km`}>
        <path d={vypln} fill="#d9e9f1" />
        <path d={cara} ref={lineRef} fill="none" stroke="#1b6e9e" strokeWidth="2" />
        <g fontSize="8.5" fontWeight="600" fill="#5e6971">
          <text x={X0 + 2} y="99">{`0 KM · ${start} ${serazene[0][1].toLocaleString('cs')} M`.toUpperCase()}</text>
          <text x={X1 - 2} y="99" textAnchor="end">{`${fmtKm(maxKm)} KM · ${cil}`.toUpperCase()}</text>
        </g>
        <circle ref={dotRef} cx={X0} cy={Y_BOTTOM} r="5" fill="#e0341f" stroke="#fff" strokeWidth="2" opacity="0" />
      </svg>
      <div className="tipp" ref={tipRef} />
    </div>
  )
}
