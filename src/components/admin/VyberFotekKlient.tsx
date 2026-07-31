'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { FotkaVeFronte, FotkyChaty, Souhrn } from '@/lib/redakce/fronta'

/**
 * Redakční prostředí pro výběr fotek (klientská část).
 *
 * Návrhová rozhodnutí, která tu stojí za pozornost:
 *  - **Alt je povinný a píše ho člověk.** Bez popisu snímku tlačítko „Vybrat"
 *    nejde zmáčknout. Metadata Commons říkají autora a licenci, ale ne to, CO
 *    je na fotce — a přesně tohle tvrzení jde na web (konvence B).
 *  - **Odmítnutí vyžaduje důvod.** Jinak by se odmítnutý snímek vracel do
 *    fronty při každém dalším běhu DATA-02 a nikdo by nevěděl, proč tam
 *    nepatří.
 *  - **Slabé nálezy jsou schované.** Kategorie i fulltext jsou shoda JMÉNA:
 *    chata Barborka si takhle přitáhla 50 snímků polské „Barbórky"
 *    (hornického svátku v Bytomi). Silný signál je jen geotag u chaty.
 *  - **Nic se neděje potichu.** Po každé akci se fronta načte znovu ze
 *    serveru, takže na obrazovce stojí stav dat, ne domněnka prohlížeče.
 */

type Data = {
  zapisPovolen: boolean
  /** Kam se zapisuje: commit do repa (github), pracovní kopie (disk), nebo nikam. */
  rezim: 'github' | 'disk' | 'jen-cteni'
  stavZapisu: string
  souhrn: Souhrn
  fotky: FotkyChaty[]
}

const barvy = {
  ink: '#26221d',
  muted: '#6d675e',
  line: '#e3ded3',
  red: '#c8352a',
  paper: '#fdfaf2',
  zelena: '#3d6b40',
}

export default function VyberFotekKlient() {
  const [data, setData] = useState<Data | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  const [oblast, setOblast] = useState<string>('')
  const [vybrana, setVybrana] = useState<{ chata: FotkyChaty; fotka: FotkaVeFronte } | null>(null)
  const [alt, setAlt] = useState('')
  const [duvod, setDuvod] = useState('')
  const [pracuje, setPracuje] = useState(false)
  const [hlaska, setHlaska] = useState<string | null>(null)
  /**
   * Rozhodnutí zapsaná v TOMHLE sezení. V režimu `github` se totiž projeví
   * v datech až po deployi — kontejner čte soubory ze stavu při buildu.
   * Bez téhle množiny by chata, kterou člověk právě vyřídil, zůstala ve frontě
   * a vyřizoval by ji podruhé.
   */
  const [hotove, setHotove] = useState<Set<string>>(new Set())

  const nacti = useCallback(async () => {
    setChyba(null)
    const res = await fetch(`/api/redakce${oblast ? `?oblast=${encodeURIComponent(oblast)}` : ''}`)
    if (!res.ok) {
      setChyba(res.status === 401 ? 'Nejsi přihlášený do adminu.' : `Fronta se nenačetla (HTTP ${res.status}).`)
      return
    }
    setData((await res.json()) as Data)
  }, [oblast])

  // Načtení se schválně odkládá za první render: `setState` volaný synchronně
  // uvnitř efektu spouští kaskádu překreslení (a lint na to má pravidlo).
  useEffect(() => {
    const id = setTimeout(() => void nacti(), 0)
    return () => clearTimeout(id)
  }, [nacti])

  const posli = async (telo: Record<string, unknown>) => {
    setPracuje(true)
    setHlaska(null)
    try {
      const res = await fetch('/api/redakce', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(telo),
      })
      const odpoved = (await res.json()) as { chyba?: string; soubor?: string }
      if (!res.ok) {
        setHlaska(`⚠ ${odpoved.chyba ?? 'Nepovedlo se.'}`)
        return
      }
      setHlaska(`✓ Zapsáno do ${odpoved.soubor}`)
      if (typeof telo.chata === 'string') setHotove((d) => new Set(d).add(telo.chata as string))
      setVybrana(null)
      setAlt('')
      setDuvod('')
      await nacti()
    } finally {
      setPracuje(false)
    }
  }

  if (chyba) return <p style={{ padding: 24, color: barvy.red }}>{chyba}</p>
  if (!data) return <p style={{ padding: 24, color: barvy.muted }}>Načítám frontu…</p>

  const oblasti = [...new Set(data.souhrn.dleOblasti.map((o) => o.oblast))]
  const s = data.souhrn.fotky

  return (
    <div style={{ background: barvy.paper, color: barvy.ink, minHeight: '100vh', padding: '18px 22px 260px', font: '14px/1.5 system-ui, sans-serif' }}>
      <h1 style={{ font: '600 20px/1.2 system-ui', margin: '0 0 6px' }}>Výběr fotek</h1>
      <p style={{ margin: '0 0 12px', color: barvy.muted, maxWidth: '92ch', fontSize: 13 }}>
        Fronta se počítá z dat: co je vybrané, stojí v profilu chaty; co je odmítnuté, v{' '}
        <code>_rozhodnuti.yaml</code>. Zbytek čeká tady. Než snímek vybereš, otevři{' '}
        <b>stránku souboru</b> a přesvědč se, že je na něm opravdu ta chata — export dokládá jen to,
        co o souboru tvrdí Commons.
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 14px' }}>
        <Cislo popis="profilů s fotkou" hodnota={`${s.sFotkou}/${s.profilu}`} />
        <Cislo popis="čeká na výběr" hodnota={s.cekaRozhodnuti} zvyraznit />
        <Cislo popis="bez nabídky z Commons" hodnota={s.bezNabidky} />
        <Cislo popis="uzavřeno bez fotky" hodnota={s.uzavrenych} />
        <select value={oblast} onChange={(e) => setOblast(e.target.value)} style={{ marginLeft: 'auto', padding: '6px 9px', borderRadius: 8, border: `1px solid ${barvy.line}` }}>
          <option value="">všechny oblasti</option>
          {oblasti.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <p
        style={{
          background: data.zapisPovolen ? '#eef3ec' : '#fdf1ea',
          border: `1px solid ${data.zapisPovolen ? barvy.zelena : barvy.red}`,
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 12.5,
          margin: '0 0 14px',
        }}
      >
        <b>
          {data.rezim === 'github'
            ? 'Zápis commitem do repa.'
            : data.rezim === 'disk'
              ? 'Zápis do pracovní kopie.'
              : 'Jen ke čtení.'}
        </b>{' '}
        {data.stavZapisu}
        {data.rezim === 'github' && ' Vybraná fotka se na webu objeví po nejbližším nasazení.'}
      </p>

      {data.fotky
        .filter((ch) => ch.jeProfil && !ch.maFotku && !ch.uzavrena && !hotove.has(ch.slug))
        .map((ch) => (
          <section key={`${ch.oblast}/${ch.slug}`} style={{ borderTop: `1px solid ${barvy.line}`, padding: '16px 0 6px' }}>
            <h2 style={{ font: '600 16px/1.2 system-ui', margin: '0 0 9px', display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              {ch.nazev}
              <span style={{ font: '11px ui-monospace, monospace', color: barvy.muted }}>
                {ch.oblast}/{ch.slug}
              </span>
              <span style={{ fontSize: 11, color: barvy.muted, marginLeft: 'auto' }}>
                {ch.ceka.filter((f) => f.silny).length} silných · {ch.ceka.filter((f) => !f.silny).length} slabých
                {ch.odmitnute.length > 0 && ` · ${ch.odmitnute.length} odmítnutých`}
              </span>
            </h2>

            <Mrizka
              fotky={ch.ceka.filter((f) => f.silny)}
              prazdno="Žádný geotagovaný snímek — Commons tu nejspíš nepomůže."
              vyber={(f) => {
                setVybrana({ chata: ch, fotka: f })
                setAlt('')
                setDuvod('')
              }}
              aktivni={vybrana?.fotka.soubor}
            />

            {ch.ceka.some((f) => !f.silny) && (
              <details style={{ marginTop: 9 }}>
                <summary style={{ cursor: 'pointer', color: barvy.muted, fontSize: 12 }}>
                  slabé nálezy ({ch.ceka.filter((f) => !f.silny).length}) — jen shoda jména, často úplně jiný objekt
                </summary>
                <div style={{ opacity: 0.75, marginTop: 8 }}>
                  <Mrizka
                    fotky={ch.ceka.filter((f) => !f.silny)}
                    vyber={(f) => {
                      setVybrana({ chata: ch, fotka: f })
                      setAlt('')
                      setDuvod('')
                    }}
                    aktivni={vybrana?.fotka.soubor}
                  />
                </div>
              </details>
            )}

            <button
              type="button"
              disabled={!data.zapisPovolen || pracuje}
              onClick={() => {
                const d = window.prompt(`Proč u „${ch.nazev}" nebereme z Commons nic? (důvod se zapíše do dat)`)
                if (d?.trim()) void posli({ akce: 'uzavrit-fotky', chata: ch.slug, duvod: d })
              }}
              style={{ marginTop: 10, background: 'transparent', border: `1px solid ${barvy.line}`, borderRadius: 8, padding: '6px 11px', fontSize: 12, cursor: 'pointer', color: barvy.muted }}
            >
              U téhle chaty nic z Commons nebereme…
            </button>
          </section>
        ))}

      {vybrana && (
        <div style={{ position: 'fixed', inset: 'auto 0 0 0', background: barvy.ink, color: '#f3eee4', padding: '14px 22px', maxHeight: '48vh', overflow: 'auto', boxShadow: '0 -8px 24px rgba(0,0,0,.2)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- náhled z Commons, ne z našeho úložiště */}
            <img src={vybrana.fotka.nahled} alt="" style={{ width: 220, height: 150, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1, minWidth: 280 }}>
              <b>{vybrana.chata.nazev}</b>{' '}
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {vybrana.fotka.autor ?? 'autor neuveden'} · {vybrana.fotka.licence ?? '—'} ·{' '}
                {vybrana.fotka.rozmery ?? '—'}
              </span>
              <div style={{ margin: '4px 0 8px' }}>
                <a href={vybrana.fotka.stranka} target="_blank" rel="noreferrer" style={{ color: '#f2b8ac', fontSize: 12 }}>
                  otevřít stránku souboru na Commons ▸
                </a>
              </div>
              {vybrana.fotka.popis && (
                <p style={{ fontSize: 12, opacity: 0.75, margin: '0 0 8px', fontStyle: 'italic' }}>
                  popis ze zdroje: {vybrana.fotka.popis.slice(0, 220)}
                </p>
              )}
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                Co je na snímku vidět (alt — jde na web, tvrdíš to ty):
              </label>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder={`např. ${vybrana.chata.nazev} — pohled na budovu od jihu`}
                style={{ width: '100%', maxWidth: 620, padding: '7px 10px', borderRadius: 7, border: 'none', fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={!data.zapisPovolen || pracuje || alt.trim().length < 3}
                  onClick={() =>
                    void posli({
                      akce: 'vybrat-fotku',
                      chata: vybrana.chata.slug,
                      oblast: vybrana.chata.oblast,
                      alt,
                      fotka: vybrana.fotka,
                    })
                  }
                  style={{ background: barvy.zelena, color: '#fff', border: 0, borderRadius: 7, padding: '8px 14px', fontSize: 13, cursor: 'pointer', opacity: alt.trim().length < 3 ? 0.5 : 1 }}
                >
                  Vybrat do profilu
                </button>
                <input
                  value={duvod}
                  onChange={(e) => setDuvod(e.target.value)}
                  placeholder="důvod odmítnutí (povinný)"
                  style={{ padding: '7px 10px', borderRadius: 7, border: 'none', fontSize: 13, minWidth: 240 }}
                />
                <button
                  type="button"
                  disabled={!data.zapisPovolen || pracuje || duvod.trim().length < 3}
                  onClick={() =>
                    void posli({
                      akce: 'odmitnout-fotku',
                      chata: vybrana.chata.slug,
                      duvod,
                      fotka: vybrana.fotka,
                    })
                  }
                  style={{ background: barvy.red, color: '#fff', border: 0, borderRadius: 7, padding: '8px 14px', fontSize: 13, cursor: 'pointer', opacity: duvod.trim().length < 3 ? 0.5 : 1 }}
                >
                  Odmítnout
                </button>
                <button type="button" onClick={() => setVybrana(null)} style={{ background: 'transparent', color: '#f3eee4', border: '1px solid rgba(255,255,255,.3)', borderRadius: 7, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hlaska && (
        <p style={{ position: 'fixed', right: 18, top: 14, background: barvy.ink, color: '#f3eee4', padding: '8px 13px', borderRadius: 8, fontSize: 12.5, zIndex: 9 }}>
          {hlaska}
        </p>
      )}
    </div>
  )
}

const Cislo = ({ popis, hodnota, zvyraznit }: { popis: string; hodnota: number | string; zvyraznit?: boolean }) => (
  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
    <b style={{ fontSize: 18, color: zvyraznit ? barvy.red : barvy.ink }}>{hodnota}</b>
    <span style={{ fontSize: 12, color: barvy.muted }}>{popis}</span>
  </span>
)

const Mrizka = ({
  fotky,
  vyber,
  aktivni,
  prazdno,
}: {
  fotky: FotkaVeFronte[]
  vyber: (f: FotkaVeFronte) => void
  aktivni?: string
  prazdno?: string
}) => {
  if (fotky.length === 0)
    return prazdno ? <p style={{ color: barvy.muted, fontStyle: 'italic', margin: 0, fontSize: 13 }}>{prazdno}</p> : null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 9 }}>
      {fotky.map((f) => (
        <button
          key={f.soubor}
          type="button"
          onClick={() => vyber(f)}
          style={{
            padding: 0,
            border: aktivni === f.soubor ? `3px solid ${barvy.red}` : `1px solid ${barvy.line}`,
            borderRadius: 9,
            overflow: 'hidden',
            background: '#fff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- náhled z Commons, ne z našeho úložiště */}
          <img src={f.nahled} alt="" loading="lazy" decoding="async" style={{ display: 'block', width: '100%', height: 135, objectFit: 'cover', background: '#eee' }} />
          <span style={{ display: 'block', padding: '6px 8px 8px', fontSize: 11.5, lineHeight: 1.4 }}>
            <b style={{ display: 'block' }}>{f.autor ?? 'autor neuveden'}</b>
            <span style={{ color: barvy.zelena }}>{f.licence ?? '—'}</span>{' '}
            <span style={{ color: barvy.muted }}>{f.rozmery ?? '—'}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
