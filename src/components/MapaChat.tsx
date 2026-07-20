'use client'

import 'leaflet/dist/leaflet.css'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type * as Leaflet from 'leaflet'

/** 1410 → „1 410" (úzká nezlomitelná mezera; lokálně — lib/chaty.ts je server-only) */
const formatCislo = (n: number): string =>
  new Intl.NumberFormat('cs-CZ').format(n).replace(/\s/g, ' ')

/**
 * Mapový pás dle prototypu (`.band` + hover preview `.mpre`) — F0-07.
 * Leaflet se importuje až na klientu (useEffect), dlaždice Mapy.com „outdoor"
 * s klíčem z NEXT_PUBLIC_MAPY_API_KEY. Atribuce se načítá za běhu z tiles.json
 * mapsetu (fallback = text z oficiálního příkladu dokumentace map-tiles);
 * logo Mapy.com je povinná součást mapy (LogoControl dle téže dokumentace).
 */

export type MapovaChata = {
  slug: string
  nazev: string
  vyska?: number | null
  stav?: 'v-provozu' | 'mimo-provoz' | 'zanikla' | null
  lat: number
  lng: number
  /** Kanonická cesta profilu — klik na marker naviguje sem. */
  url: string
  /** Vybraná chata: červený marker r12 s bílou střechou, jediná se stínem. */
  vybrana?: boolean
}

const DLAZDICE = 'https://api.mapy.com/v1/maptiles/outdoor'
/** Fallback do doby, než doběhne tiles.json (text z oficiálního Leaflet příkladu). */
const ATRIBUCE_FALLBACK =
  '<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>'
const LOGO_SVG = 'https://api.mapy.com/img/api/logo.svg'

/** Markery 1:1 dle handoffu `components/karta-chaty.html` (SVG hodnoty beze změn). */
const MARKER = {
  /** v provozu i dočasně mimo provoz — modrá = navigační vrstva mapy */
  provoz:
    '<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#1b6e9e" stroke="#fff" stroke-width="2.5"/></svg>',
  /** zaniklá — bílá se šedým čárkovaným okrajem */
  zanikla:
    '<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="#fff" stroke="#8a949c" stroke-width="2" stroke-dasharray="3.5 3"/></svg>',
  /** vybraná — červená s bílou střechou, jako jediná se stínem (řeší CSS .mk-vybrana) */
  vybrana:
    '<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#e0341f" stroke="#fff" stroke-width="3"/><polygon points="15,9.5 20,16.5 10,16.5" fill="#fff"/></svg>',
}

const STAV_PREVIEW: Record<string, { text: string; barva: string }> = {
  'v-provozu': { text: 'V provozu', barva: '#1e8a4f' },
  'mimo-provoz': { text: 'Mimo provoz', barva: '#b82413' },
  zanikla: { text: 'Zaniklá', barva: '#5e6971' },
}

export default function MapaChat({ chaty }: { chaty: MapovaChata[] }) {
  const elRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const klic = process.env.NEXT_PUBLIC_MAPY_API_KEY

  useEffect(() => {
    const el = elRef.current
    if (!el || !klic || chaty.length === 0) return
    let mapa: Leaflet.Map | undefined
    let zruseno = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (zruseno || !el || el.childElementCount > 0) return

      mapa = L.map(el, { scrollWheelZoom: false, attributionControl: true })
      mapa.attributionControl.setPrefix(false)

      // dlaždice — 256@2x pro retinu je u mapsetu outdoor podporované
      const tileSize = window.devicePixelRatio > 1 ? '256@2x' : '256'
      L.tileLayer(`${DLAZDICE}/${tileSize}/{z}/{x}/{y}?apikey=${klic}`, {
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
      }).addTo(mapa)

      // atribuce za běhu z tiles.json daného mapsetu; při chybě fallback
      fetch(`${DLAZDICE}/tiles.json?apikey=${klic}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((t: { attribution?: string } | null) => {
          if (!zruseno) mapa?.attributionControl.addAttribution(t?.attribution || ATRIBUCE_FALLBACK)
        })
        .catch(() => {
          if (!zruseno) mapa?.attributionControl.addAttribution(ATRIBUCE_FALLBACK)
        })

      // povinné logo Mapy.com (dle dokumentace map-tiles)
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

      // markery dle handoffu + hover preview dle prototypu (.mpre: top 12px, left dle markeru)
      const pre = preRef.current
      const body = document.createElement('div')
      chaty.forEach((ch) => {
        const varianta = ch.vybrana ? 'vybrana' : ch.stav === 'zanikla' ? 'zanikla' : 'provoz'
        const velikost = varianta === 'vybrana' ? 30 : 20
        const marker = L.marker([ch.lat, ch.lng], {
          icon: L.divIcon({
            className: `mk mk-${varianta}`,
            html: MARKER[varianta],
            iconSize: [velikost, velikost],
            iconAnchor: [velikost / 2, velikost / 2],
          }),
          alt: ch.nazev,
          title: ch.nazev,
        }).addTo(mapa!)

        marker.on('mouseover', () => {
          if (!pre || !mapa) return
          const stav = ch.stav ? STAV_PREVIEW[ch.stav] : null
          body.textContent = ''
          const jmeno = document.createElement('b')
          jmeno.className = 'sg'
          jmeno.style.fontSize = '13.5px'
          jmeno.textContent = ch.nazev
          body.append(jmeno)
          if (ch.vyska != null) {
            const m = document.createElement('span')
            m.style.cssText = 'color:#5e6971;margin-left:8px'
            m.textContent = `${formatCislo(ch.vyska)} m`
            body.append(m)
          }
          if (stav) {
            const s = document.createElement('span')
            s.style.cssText = `margin-left:8px;font-weight:600;color:${stav.barva}`
            s.textContent = stav.text
            body.append(s)
          }
          const dal = document.createElement('span')
          dal.style.cssText = 'margin-left:8px;color:#1b6e9e;font-weight:600'
          dal.textContent = 'Profil →'
          body.append(dal)
          pre.replaceChildren(body)
          const bod = mapa.latLngToContainerPoint(marker.getLatLng())
          pre.style.left = `${bod.x}px`
          pre.style.opacity = '1'
        })
        marker.on('mouseout', () => {
          if (pre) pre.style.opacity = '0'
        })
        marker.on('click', () => router.push(ch.url))
      })

      const hranice = L.latLngBounds(chaty.map((ch) => [ch.lat, ch.lng]))
      mapa.fitBounds(hranice, { padding: [30, 30], maxZoom: 13 })
      mapa.on('move zoom', () => {
        if (pre) pre.style.opacity = '0'
      })
    })()

    return () => {
      zruseno = true
      mapa?.remove()
    }
  }, [chaty, klic, router])

  // bez klíče nebo bez chat se pás vůbec nevykresluje — nic se nedomýšlí
  if (!klic || chaty.length === 0) return null

  return (
    <div className="band mapband" data-testid="mapa-chat">
      <div className="mpre" ref={preRef} aria-hidden="true" />
      <div ref={elRef} className="mapel" role="region" aria-label="Mapa chat" />
    </div>
  )
}
