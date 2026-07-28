'use client'

import React, { useEffect, useRef, useState } from 'react'

import { MAX_VELIKOST_B, POVOLENE_MIME, SOUHLAS_ZNENI, zkontrolujPodani } from '@/lib/podani'

export type PrispetChata = { slug: string; nazev: string }

/**
 * Formulář komunitního podání (/prispet): otisk razítka NEBO fotka chaty.
 * Poctivost procesu přímo v UI: podání jde do redakční čekárny (nic se
 * nezveřejňuje samo), kredit jménem, e-mail neveřejný, licenční souhlas
 * doslovným zněním. Honeypot pole `web` je skryté — roboti ho vyplní.
 * `?chata=<slug>` předvyplní chatu (odkazy z profilů).
 */
export default function PrispetForm({ chaty }: { chaty: PrispetChata[] }) {
  const [druh, setDruh] = useState<'razitko' | 'fotka'>('razitko')
  const [chataNazev, setChataNazev] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [email, setEmail] = useState('')
  const [poznamka, setPoznamka] = useState('')
  const [souhlas, setSouhlas] = useState(false)
  const [stav, setStav] = useState<'piše' | 'odesílá' | 'hotovo'>('piše')
  const [chyby, setChyby] = useState<string[]>([])
  const souborRef = useRef<HTMLInputElement>(null)

  // Deep-link z profilu chaty (?chata=slug&druh=fotka) — čte se po hydrataci (SSG).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const slug = q.get('chata')
    const ch = slug ? chaty.find((c) => c.slug === slug) : null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- záměrné jednorázové převzetí query po hydrataci (SSG bez searchParams)
    if (ch) setChataNazev(ch.nazev)
    if (q.get('druh') === 'fotka') setDruh('fotka')
  }, [chaty])

  const odesli = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const soubor = souborRef.current?.files?.[0] ?? null
    const chata = chaty.find((c) => c.nazev.localeCompare(chataNazev.trim(), 'cs', { sensitivity: 'accent' }) === 0)
    const mistniChyby = zkontrolujPodani({
      druh,
      chataSlug: chata?.slug ?? null,
      jmeno,
      email: email || null,
      poznamka: poznamka || null,
      souhlas,
      past: null,
      soubor: soubor ? { velikost: soubor.size, mime: soubor.type } : null,
    })
    if (!chata && chataNazev.trim()) mistniChyby.unshift('Chatu vyber ze seznamu — podání vážeme na vedený profil.')
    setChyby(mistniChyby)
    if (mistniChyby.length || !soubor || !chata) return

    setStav('odesílá')
    const form = new FormData()
    form.set('druh', druh)
    form.set('chata', chata.slug)
    form.set('jmeno', jmeno.trim())
    if (email.trim()) form.set('email', email.trim())
    if (poznamka.trim()) form.set('poznamka', poznamka.trim())
    form.set('souhlas', souhlas ? 'ano' : '')
    form.set('soubor', soubor)
    try {
      const res = await fetch('/api/podani', { method: 'POST', body: form })
      const telo = (await res.json()) as { ok?: boolean; chyby?: string[] }
      if (res.ok && telo.ok) {
        setStav('hotovo')
      } else {
        setStav('piše')
        setChyby(telo.chyby ?? ['Odeslání se nepovedlo — zkus to prosím znovu.'])
      }
    } catch {
      setStav('piše')
      setChyby(['Odeslání se nepovedlo (síť) — zkus to prosím znovu.'])
    }
  }

  if (stav === 'hotovo') {
    return (
      <div className="prsp-hotovo" role="status">
        <b>Díky! Podání je v redakční čekárně.</b>
        <p>
          Projdeme ho, zkontrolujeme licenci a po schválení se objeví na profilu chaty s tvým jménem
          u snímku. Nic se nezveřejňuje automaticky — proto to může den dva trvat.
        </p>
        <button type="button" className="prsp-btn ghost" onClick={() => { setStav('piše'); setSouhlas(false); setPoznamka(''); if (souborRef.current) souborRef.current.value = '' }}>
          Poslat další
        </button>
      </div>
    )
  }

  return (
    <form className="prsp-form" onSubmit={odesli} aria-label="Poslat otisk razítka nebo fotku">
      <div className="prsp-druh" role="group" aria-label="Co posíláš">
        <button type="button" className={druh === 'razitko' ? 'akt' : ''} onClick={() => setDruh('razitko')}>
          ◉ Otisk razítka
        </button>
        <button type="button" className={druh === 'fotka' ? 'akt' : ''} onClick={() => setDruh('fotka')}>
          ▣ Fotka chaty
        </button>
      </div>

      <label className="prsp-pole">
        <span>Chata</span>
        <input
          list="prsp-chaty"
          value={chataNazev}
          onChange={(e) => setChataNazev(e.target.value)}
          placeholder="začni psát a vyber ze seznamu…"
          required
        />
        <datalist id="prsp-chaty">
          {chaty.map((c) => (
            <option key={c.slug} value={c.nazev} />
          ))}
        </datalist>
      </label>

      <label className="prsp-pole">
        <span>{druh === 'razitko' ? 'Sken / foto otisku' : 'Fotka'}</span>
        <input ref={souborRef} type="file" accept={POVOLENE_MIME.join(',')} required />
        <i>JPEG, PNG, WebP, GIF nebo HEIC · do {Math.round(MAX_VELIKOST_B / 1024 / 1024)} MB</i>
      </label>

      <div className="prsp-radek">
        <label className="prsp-pole">
          <span>Jméno / přezdívka</span>
          <input value={jmeno} onChange={(e) => setJmeno(e.target.value)} placeholder="zveřejníme jako kredit" required />
        </label>
        <label className="prsp-pole">
          <span>E-mail (nepovinný, neveřejný)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jen pro dotazy redakce" />
        </label>
      </div>

      <label className="prsp-pole">
        <span>{druh === 'razitko' ? 'Kde se razítkuje / kdy jsi otisk získal(a)' : 'Kdy je snímek focený'}</span>
        <input value={poznamka} onChange={(e) => setPoznamka(e.target.value)} placeholder="nepovinné, ale pomůže ověření" />
      </label>

      {/* Honeypot — pro lidi neviditelné, roboti vyplní. */}
      <label className="prsp-past" aria-hidden="true">
        Web
        <input type="text" name="web" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="prsp-souhlas">
        <input type="checkbox" checked={souhlas} onChange={(e) => setSouhlas(e.target.checked)} required />
        <span>{SOUHLAS_ZNENI}</span>
      </label>

      {chyby.length > 0 && (
        <ul className="prsp-chyby" role="alert">
          {chyby.map((ch) => (
            <li key={ch}>{ch}</li>
          ))}
        </ul>
      )}

      <button type="submit" className="prsp-btn" disabled={stav === 'odesílá'}>
        {stav === 'odesílá' ? 'Odesílám…' : 'Poslat do redakční čekárny ▸'}
      </button>
      <p className="prsp-pozn">
        Podání schvaluje redakce — zkontrolujeme, že snímek sedí k chatě, a teprve pak ho zveřejníme
        s tvým jménem. Nic se nezveřejňuje automaticky.
      </p>
    </form>
  )
}
