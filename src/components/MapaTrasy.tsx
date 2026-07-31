'use client'

import 'leaflet/dist/leaflet.css'

import React, { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'

/**
 * Mapa přístupových tras na profilu chaty (DATA-06 3b, Phase 2). Turistická
 * mapa Mapy.com „outdoor" (pod ní jsou barevné KČT značky), na ní chata + čáry
 * vypočtených tras z nejbližších středisek + značky startů. Leaflet se importuje
 * až na klientu (jako MapaChat), dlaždice s klíčem z NEXT_PUBLIC_MAPY_API_KEY,
 * povinné logo Mapy.com + atribuce z tiles.json.
 */
export type Bod = { lat: number; lng: number }
export type TrasaNaMape = { vychoziBod: string; typ: string; delkaKm: number; body: Bod[] }

const DLAZDICE = 'https://api.mapy.com/v1/maptiles/outdoor'

/**
 * Mapy.com u svých podkladů VYŽADUJÍ dvě věci: odkaz na jejich copyright
 * a své logo někde nad mapou. Živé mapě je přidává Leaflet, statickému náhledu
 * na profilu je musíme přidat sami — proto jsou tyhle tři hodnoty vyvezené,
 * ať se na dvou místech nerozejdou.
 */
export const MAPY_COPYRIGHT = 'https://api.mapy.com/copyright'
export const MAPY_ATRIBUCE = '© Seznam.cz a.s. a další'
export const LOGO_SVG = 'https://api.mapy.com/img/api/logo.svg'
const ATRIBUCE_FALLBACK = `<a href="${MAPY_COPYRIGHT}" target="_blank">&copy; Seznam.cz a.s. a další</a>`

/** Barvy čar tras — záměrně odlišné od KČT značek (červená/modrá/zelená/žlutá) pod mapou. */
const BARVY_TRAS = ['#d81f6a', '#7a3ea8', '#0e6e6e']

const HUT_SVG =
  '<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#e0341f" stroke="#fff" stroke-width="3"/><polygon points="15,9.5 20,16.5 10,16.5" fill="#fff"/></svg>'
const startSvg = (barva: string): string =>
  `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${barva}" stroke="#fff" stroke-width="2.5"/></svg>`

export default function MapaTrasy({ hut, trasy }: { hut: { nazev: string; lat: number; lng: number }; trasy: TrasaNaMape[] }) {
  const elRef = useRef<HTMLDivElement>(null)
  const klic = process.env.NEXT_PUBLIC_MAPY_API_KEY

  useEffect(() => {
    const el = elRef.current
    const pouzitelne = trasy.filter((t) => t.body && t.body.length > 1)
    if (!el || !klic || pouzitelne.length === 0) return
    let mapa: Leaflet.Map | undefined
    let zruseno = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (zruseno || !el || el.childElementCount > 0) return

      mapa = L.map(el, { scrollWheelZoom: false, attributionControl: true })
      mapa.attributionControl.setPrefix(false)

      const tileSize = window.devicePixelRatio > 1 ? '256@2x' : '256'
      L.tileLayer(`${DLAZDICE}/${tileSize}/{z}/{x}/{y}?apikey=${klic}`, { minZoom: 0, maxZoom: 19, tileSize: 256 }).addTo(mapa)

      fetch(`${DLAZDICE}/tiles.json?apikey=${klic}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((t: { attribution?: string } | null) => {
          if (!zruseno) mapa?.attributionControl.addAttribution(t?.attribution || ATRIBUCE_FALLBACK)
        })
        .catch(() => {
          if (!zruseno) mapa?.attributionControl.addAttribution(ATRIBUCE_FALLBACK)
        })

      const LogoControl = L.Control.extend({
        options: { position: 'bottomleft' as const },
        onAdd: () => {
          const div = L.DomUtil.create('div', 'mlogo')
          const a = L.DomUtil.create('a', '', div) as HTMLAnchorElement
          a.href = 'https://mapy.com/'
          a.target = '_blank'
          a.innerHTML = `<img src="${LOGO_SVG}" alt="Mapy.com" />`
          L.DomEvent.disableClickPropagation(a)
          return div
        },
      })
      new LogoControl().addTo(mapa)

      const vsechnyBody: [number, number][] = [[hut.lat, hut.lng]]

      pouzitelne.forEach((t, i) => {
        const barva = BARVY_TRAS[i % BARVY_TRAS.length]
        const linie = t.body.map((b) => [b.lat, b.lng] as [number, number])
        // Podklad (bílá pod čarou) + barevná čára — čitelné na pestré mapě.
        L.polyline(linie, { color: '#fff', weight: 7, opacity: 0.8 }).addTo(mapa!)
        L.polyline(linie, { color: barva, weight: 4, opacity: 0.95 }).addTo(mapa!)
        vsechnyBody.push(...linie)

        // Geometrie z routingu je orientovaná chata→nástup → výchozí bod je POSLEDNÍ bod čáry.
        const start = t.body[t.body.length - 1]
        L.marker([start.lat, start.lng], {
          icon: L.divIcon({ className: 'mk-start', html: startSvg(barva), iconSize: [16, 16], iconAnchor: [8, 8] }),
          title: t.vychoziBod,
        })
          .addTo(mapa!)
          .bindTooltip(`${t.vychoziBod} — ${t.delkaKm} km`, { direction: 'top', offset: [0, -6] })
      })

      L.marker([hut.lat, hut.lng], {
        icon: L.divIcon({ className: 'mk mk-vybrana', html: HUT_SVG, iconSize: [30, 30], iconAnchor: [15, 15] }),
        title: hut.nazev,
      })
        .addTo(mapa!)
        .bindTooltip(hut.nazev, { direction: 'top', offset: [0, -12] })

      mapa.fitBounds(L.latLngBounds(vsechnyBody), { padding: [26, 26], maxZoom: 15 })
    })()

    return () => {
      zruseno = true
      mapa?.remove()
    }
  }, [hut, trasy, klic])

  if (!klic || trasy.filter((t) => t.body && t.body.length > 1).length === 0) return null

  return (
    <div
      ref={elRef}
      role="region"
      aria-label={`Mapa přístupových tras k chatě ${hut.nazev}`}
      style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}
    />
  )
}
