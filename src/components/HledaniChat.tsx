'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export type HledaniPolozka = { nazev: string; url: string | null }

/**
 * Hledání na homepage (handoff hero): papírová karta s datalistem všech
 * vedených profilů. Přesná shoda názvu (bez ohledu na velikost písmen) vede
 * rovnou na profil; cokoli jiného předá dotaz katalogu (`/chaty?q=…`), kde
 * běží plné filtrování. Žádný vlastní fulltext — jen doložené profily.
 */
export default function HledaniChat({ polozky }: { polozky: HledaniPolozka[] }) {
  const router = useRouter()
  const [dotaz, setDotaz] = useState('')

  const hledej = () => {
    const q = dotaz.trim()
    if (!q) return
    const shoda = polozky.find((p) => p.nazev.localeCompare(q, 'cs', { sensitivity: 'accent' }) === 0)
    router.push(shoda?.url ?? `/chaty?q=${encodeURIComponent(q)}`)
  }

  return (
    <form
      className="hf1-hledani"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        hledej()
      }}
    >
      <span className="hf1-hledani-lupa" aria-hidden="true">
        ⌕
      </span>
      <input
        list="hf1-chaty-list"
        placeholder="Najdi chatu… (Luční bouda, Samotnia…)"
        aria-label="Najdi chatu"
        value={dotaz}
        onChange={(e) => setDotaz(e.target.value)}
      />
      <datalist id="hf1-chaty-list">
        {polozky.map((p) => (
          <option key={p.nazev} value={p.nazev} />
        ))}
      </datalist>
      <button type="submit" className="hf1-hledani-btn">
        Hledat
      </button>
    </form>
  )
}
