'use client'

import React, { useCallback, useEffect, useState } from 'react'

/**
 * SPRÁVA GALERIÍ CHAT (zadání Michala 31. 7. 2026: „u každé chaty můžeme mít
 * víc fotek — jednu profilovou a pak další… + správa galerií chat").
 *
 * Co obrazovka umí a proč zrovna tohle:
 *  - **Přepnout profilovou fotku.** Do teď byl hero prostě první současná
 *    fotka, kterou vrátila databáze — s galerií by o hlavním snímku
 *    rozhodovalo pořadí v joinu, tedy náhoda. Profilová je vždycky právě
 *    jedna: nastavení jedné ostatním příznak sebere.
 *  - **Přeházet pořadí.** Galerie se na webu řadí podle pořadí v datech, ne
 *    podle toho, kdy fotka přibyla.
 *  - **Odebrat fotku — s důvodem.** Odebrání bez důvodu by za měsíc nikdo
 *    nevysvětlil; důvod jde do commitu.
 *
 * Miniatury se berou z Commons (`zdrojUrl` → náhled), takže obrazovka
 * potřebuje být online — stejně jako výběr fotek.
 */

type Fotka = Record<string, unknown> & {
  stahnoutZ?: string
  alt?: string
  autor?: string
  licence?: string
  hero?: boolean
  zdrojUrl?: string
}
type GalerieChaty = { slug: string; nazev: string; oblast: string; fotky: Fotka[] }
type Data = {
  zapisPovolen: boolean
  rezim: 'github' | 'disk' | 'jen-cteni'
  stavZapisu: string
  galerie: GalerieChaty[]
}

const barvy = { ink: '#26221d', muted: '#6d675e', line: '#e3ded3', red: '#c8352a', paper: '#fdfaf2', zelena: '#3d6b40' }

export default function GalerieKlient() {
  const [data, setData] = useState<Data | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  const [hlaska, setHlaska] = useState<string | null>(null)

  const nacti = useCallback(async () => {
    const res = await fetch('/api/redakce')
    if (!res.ok) {
      setChyba(res.status === 401 ? 'Nejsi přihlášený do adminu.' : `Galerie se nenačetly (HTTP ${res.status}).`)
      return
    }
    setData((await res.json()) as Data)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => void nacti(), 0)
    return () => clearTimeout(id)
  }, [nacti])

  const posli = async (telo: Record<string, unknown>) => {
    const res = await fetch('/api/redakce', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(telo),
    })
    const o = (await res.json()) as { chyba?: string; soubor?: string }
    setHlaska(res.ok ? `✓ Zapsáno do ${o.soubor}` : `⚠ ${o.chyba ?? 'Nepovedlo se.'}`)
    if (res.ok) await nacti()
  }

  if (chyba) return <p style={{ padding: 24, color: barvy.red }}>{chyba}</p>
  if (!data) return <p style={{ padding: 24, color: barvy.muted }}>Načítám galerie…</p>

  return (
    <div style={{ background: barvy.paper, color: barvy.ink, minHeight: '100vh', padding: '18px 22px 80px', font: '14px/1.5 system-ui, sans-serif' }}>
      <h1 style={{ font: '600 20px/1.2 system-ui', margin: '0 0 6px' }}>Galerie chat</h1>
      <p style={{ margin: '0 0 12px', color: barvy.muted, maxWidth: '92ch', fontSize: 13 }}>
        Profilová fotka je vždycky právě jedna — nastavení jedné ostatním příznak sebere. Pořadí
        v datech je pořadí na webu. Odebrání potřebuje důvod, ať je za měsíc jasné proč.
      </p>

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
          {data.rezim === 'github' ? 'Zápis commitem do repa.' : data.rezim === 'disk' ? 'Zápis do pracovní kopie.' : 'Jen ke čtení.'}
        </b>{' '}
        {data.stavZapisu}
      </p>

      {data.galerie.length === 0 && (
        <p style={{ color: barvy.muted, fontStyle: 'italic' }}>Žádná chata zatím nemá fotku.</p>
      )}

      {data.galerie.map((ch) => (
        <section key={`${ch.oblast}/${ch.slug}`} style={{ borderTop: `1px solid ${barvy.line}`, padding: '16px 0 6px' }}>
          <h2 style={{ font: '600 16px/1.2 system-ui', margin: '0 0 9px', display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            {ch.nazev}
            <span style={{ font: '11px ui-monospace, monospace', color: barvy.muted }}>
              {ch.oblast}/{ch.slug}
            </span>
            <span style={{ fontSize: 11, color: barvy.muted, marginLeft: 'auto' }}>
              {ch.fotky.length} {ch.fotky.length === 1 ? 'fotka' : ch.fotky.length < 5 ? 'fotky' : 'fotek'}
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
            {ch.fotky.map((f, i) => {
              // Profilová je ta s příznakem; když ji nemá žádná, platí staré
              // pravidlo „první v pořadí" — a obrazovka to říká nahlas.
              const profilova = f.hero === true || (!ch.fotky.some((x) => x.hero) && i === 0)
              return (
                <figure
                  key={String(f.stahnoutZ ?? i)}
                  style={{
                    margin: 0,
                    background: '#fff',
                    border: `${profilova ? 3 : 1}px solid ${profilova ? barvy.zelena : barvy.line}`,
                    borderRadius: 9,
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- náhled z Commons */}
                  <img
                    src={String(f.stahnoutZ ?? '')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ display: 'block', width: '100%', height: 140, objectFit: 'cover', background: '#eee' }}
                  />
                  <figcaption style={{ padding: '7px 9px 9px', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <b style={{ color: profilova ? barvy.zelena : barvy.ink }}>
                      {profilova ? (f.hero ? 'profilová' : 'profilová (první v pořadí)') : `v galerii · ${i + 1}.`}
                    </b>
                    <span style={{ color: barvy.muted }}>{String(f.alt ?? '—')}</span>
                    <span style={{ color: barvy.muted }}>
                      {String(f.autor ?? 'autor neuveden')} · {String(f.licencePoznamka ?? f.licence ?? '—')}
                    </span>
                    <span style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={!data.zapisPovolen || f.hero === true}
                        onClick={() => void posli({ akce: 'galerie-profilova', chata: ch.slug, oblast: ch.oblast, index: i })}
                        style={tlacitko(barvy.zelena)}
                      >
                        Profilová
                      </button>
                      <button
                        type="button"
                        disabled={!data.zapisPovolen || i === 0}
                        onClick={() => void posli({ akce: 'galerie-poradi', chata: ch.slug, oblast: ch.oblast, index: i, smer: -1 })}
                        style={tlacitko(barvy.line)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={!data.zapisPovolen || i === ch.fotky.length - 1}
                        onClick={() => void posli({ akce: 'galerie-poradi', chata: ch.slug, oblast: ch.oblast, index: i, smer: 1 })}
                        style={tlacitko(barvy.line)}
                      >
                        →
                      </button>
                      <button
                        type="button"
                        disabled={!data.zapisPovolen}
                        onClick={() => {
                          const d = window.prompt(`Proč fotku odebrat z galerie „${ch.nazev}"? (důvod jde do commitu)`)
                          if (d?.trim())
                            void posli({ akce: 'galerie-odebrat', chata: ch.slug, oblast: ch.oblast, index: i, duvod: d })
                        }}
                        style={tlacitko(barvy.red)}
                      >
                        Odebrat…
                      </button>
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </section>
      ))}

      {hlaska && (
        <p style={{ position: 'fixed', right: 18, top: 14, background: barvy.ink, color: '#f3eee4', padding: '8px 13px', borderRadius: 8, fontSize: 12.5 }}>
          {hlaska}
        </p>
      )}
    </div>
  )
}

const tlacitko = (okraj: string): React.CSSProperties => ({
  background: 'transparent',
  border: `1px solid ${okraj}`,
  color: okraj === '#e3ded3' ? '#26221d' : okraj,
  borderRadius: 6,
  padding: '3px 8px',
  fontSize: 11.5,
  cursor: 'pointer',
})
