'use client'

import { useSyncExternalStore } from 'react'

/**
 * Lokální deník razítek — F0-08.
 *
 * Sbírka žije jen v prohlížeči návštěvníka (localStorage, klíč `tc-denik`),
 * přesně dle handoffu: „Deník/sbírka: server-side per user (fáze 4), prototyp
 * má localStorage." Účty tohle jednou nahradí, formát je proto verzovaný.
 *
 * Reaktivitu napříč komponentami (tlačítko na profilu, badge v hlavičce
 * i tab-baru) zajišťuje mini-store pro `useSyncExternalStore`; změny
 * z jiných tabů chytá `storage` event.
 */

const KLIC = 'tc-denik'

export type ZaznamDeniku = {
  /** Den otisknutí v ISO tvaru YYYY-MM-DD (čas návštěvníka). */
  datum: string
}

export type Denik = {
  verze: 1
  /** Záznamy podle slugu chaty — slug je v Payloadu unikátní. */
  zaznamy: Record<string, ZaznamDeniku>
}

const PRAZDNY: Denik = { verze: 1, zaznamy: {} }

let cache: Denik = PRAZDNY
let nacteno = false
const posluchaci = new Set<() => void>()

function precistUloziste(): Denik {
  if (typeof window === 'undefined') return PRAZDNY
  try {
    const raw = window.localStorage.getItem(KLIC)
    if (!raw) return PRAZDNY
    const data: unknown = JSON.parse(raw)
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as { verze?: unknown }).verze === 1 &&
      typeof (data as { zaznamy?: unknown }).zaznamy === 'object' &&
      (data as { zaznamy?: unknown }).zaznamy !== null
    ) {
      const zaznamy: Record<string, ZaznamDeniku> = {}
      for (const [slug, z] of Object.entries((data as Denik).zaznamy)) {
        if (typeof z === 'object' && z !== null && typeof z.datum === 'string') {
          zaznamy[slug] = { datum: z.datum }
        }
      }
      return { verze: 1, zaznamy }
    }
  } catch {
    /* poškozený nebo nedostupný záznam → prázdný deník (nic nedomýšlíme) */
  }
  return PRAZDNY
}

function snapshot(): Denik {
  if (!nacteno) {
    cache = precistUloziste()
    nacteno = true
  }
  return cache
}

function oznamZmenu() {
  nacteno = false
  for (const cb of posluchaci) cb()
}

export function subscribeDenik(cb: () => void): () => void {
  posluchaci.add(cb)
  const naStorage = (e: StorageEvent) => {
    if (e.key === KLIC || e.key === null) oznamZmenu()
  }
  window.addEventListener('storage', naStorage)
  return () => {
    posluchaci.delete(cb)
    window.removeEventListener('storage', naStorage)
  }
}

export function nactiDenik(): Denik {
  return snapshot()
}

export function zaznamProSlug(slug: string): ZaznamDeniku | null {
  return snapshot().zaznamy[slug] ?? null
}

export function pocetVeSbirce(): number {
  return Object.keys(snapshot().zaznamy).length
}

/** Dnešek v ISO tvaru z lokálního času návštěvníka (jeho den, ne UTC). */
function dnesIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Přidá razítko do deníku (idempotentně) a vrátí jeho záznam. */
export function pridejDoDeniku(slug: string): ZaznamDeniku {
  const stavajici = snapshot().zaznamy[slug]
  if (stavajici) return stavajici
  const zaznam: ZaznamDeniku = { datum: dnesIso() }
  const novy: Denik = { verze: 1, zaznamy: { ...snapshot().zaznamy, [slug]: zaznam } }
  try {
    window.localStorage.setItem(KLIC, JSON.stringify(novy))
  } catch {
    /* plné/nedostupné úložiště — sbírka se neuloží, UI to nesmí shodit */
  }
  oznamZmenu()
  return zaznam
}

/** Počet razítek ve sbírce — na serveru a při hydrataci 0. */
export function usePocetDeniku(): number {
  return useSyncExternalStore(subscribeDenik, pocetVeSbirce, () => 0)
}

/** Záznam deníku pro danou chatu — na serveru a při hydrataci null. */
export function useZaznamDeniku(slug: string): ZaznamDeniku | null {
  return useSyncExternalStore(
    subscribeDenik,
    () => zaznamProSlug(slug),
    () => null,
  )
}

/** Jen pro testy: zahodí cache, ať jde úložiště mezi testy čistit. */
export function _resetDenikProTesty() {
  nacteno = false
  cache = PRAZDNY
}

/** „2026-07-20" → „20. 7. 2026" (bez Intl — deterministické i v testech). */
export function formatDatumDeniku(iso: string): string {
  const [r, m, d] = iso.split('-').map(Number)
  if (!r || !m || !d) return iso
  return `${d}. ${m}. ${r}`
}
