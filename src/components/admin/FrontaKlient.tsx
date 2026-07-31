'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import type { Kandidat, MezeraProfilu, Souhrn } from '@/lib/redakce/fronta'

/**
 * FRONTA — jediná obrazovka, na které je vidět, co ještě čeká.
 *
 * Smysl (zadání Michala 31. 7. 2026): „ať nám nic neproklouzne a nic nezůstane
 * nezpracované". Kandidát, o kterém nikdo nerozhodl, tu leží tak dlouho, dokud
 * se nestane jedna ze tří věcí — povýšení (vznikne profil), vyřazení (zapíše
 * se důvod) nebo odložení (taky s důvodem). Čtvrtá možnost, „zapomenout",
 * z obrazovky zmizet nedá; přesně tak se stalo, že 45 kandidátů Jizerek leželo
 * týden, aniž by to bylo komukoli vidět.
 *
 * POVYŠOVÁNÍ SE ODSUD NEDĚLÁ — a je to záměr. Povýšení znamená křížové ověření
 * druhým pramenem (DATA-03), sepsání profilu se zdroji a datem kontroly; to je
 * redakční práce, ne jedno tlačítko. Fronta k ní dává podklad (co OSM ví,
 * odkaz do OSM, signály) a hlídá, že se na objekt nezapomene.
 */

type Data = {
  zapisPovolen: boolean
  rezim: 'github' | 'disk' | 'jen-cteni'
  stavZapisu: string
  souhrn: Souhrn
  kandidati: Kandidat[]
  mezery: MezeraProfilu[]
}

/** Pátý „stav" není stav kandidáta, ale pohled na hotové profily. */
type Pohled = Kandidat['stav'] | 'mezery'

const barvy = { ink: '#26221d', muted: '#6d675e', line: '#e3ded3', red: '#c8352a', paper: '#fdfaf2', zelena: '#3d6b40' }

const STAVY: { klic: Kandidat['stav']; popis: string }[] = [
  { klic: 'nezpracovan', popis: 'čeká na rozhodnutí' },
  { klic: 'odlozen', popis: 'odloženo s důvodem' },
  { klic: 'povysen', popis: 'povýšeno na profil' },
  { klic: 'vyrazen', popis: 'vyřazeno s důvodem' },
]

export default function FrontaKlient() {
  const [data, setData] = useState<Data | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  const [stav, setStav] = useState<Pohled>('nezpracovan')
  const [oblast, setOblast] = useState('')
  const [hlaska, setHlaska] = useState<string | null>(null)
  /** Rozhodnutí z tohohle sezení — v režimu `github` se v datech projeví až po deployi. */
  const [hotove, setHotove] = useState<Set<string>>(new Set())

  const nacti = useCallback(async () => {
    const res = await fetch('/api/redakce')
    if (!res.ok) {
      setChyba(res.status === 401 ? 'Nejsi přihlášený do adminu.' : `Fronta se nenačetla (HTTP ${res.status}).`)
      return
    }
    setData((await res.json()) as Data)
  }, [])

  // Načtení se schválně odkládá za první render: `setState` volaný synchronně
  // uvnitř efektu spouští kaskádu překreslení (a lint na to má pravidlo).
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
    if (res.ok) {
      if (typeof telo.chata === 'string') setHotove((d) => new Set(d).add(telo.chata as string))
      await nacti()
    }
  }

  if (chyba) return <p style={{ padding: 24, color: barvy.red }}>{chyba}</p>
  if (!data) return <p style={{ padding: 24, color: barvy.muted }}>Načítám frontu…</p>

  const k = data.souhrn.kandidati
  const f = data.souhrn.fotky
  const seznam = data.kandidati.filter(
    (x) => x.stav === stav && (!oblast || x.oblast === oblast) && !(stav === 'nezpracovan' && hotove.has(x.slug)),
  )
  const seznamMezer = (data.mezery ?? []).filter(
    (m) => m.chybi.length > 0 && (!oblast || m.oblast === oblast),
  )
  const oblasti = data.souhrn.dleOblasti.map((o) => o.oblast)

  return (
    <div style={{ background: barvy.paper, color: barvy.ink, minHeight: '100vh', padding: '18px 22px 80px', font: '14px/1.5 system-ui, sans-serif' }}>
      <h1 style={{ font: '600 20px/1.2 system-ui', margin: '0 0 6px' }}>Fronta redakční práce</h1>
      <p style={{ margin: '0 0 14px', color: barvy.muted, maxWidth: '92ch', fontSize: 13 }}>
        Stav se počítá z dat, nevede se zvlášť: povýšený kandidát má profil, vyřazený stojí ve{' '}
        <code>_vyrazeno.yaml</code>, odložený v <code>_odlozeno.yaml</code>. Co není ani jedno, čeká
        tady. Povyšuje se v session s křížovým ověřením — tahle obrazovka hlídá, že se na objekt
        nezapomene.
      </p>

      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '0 0 16px' }}>
        <Karta titul="Kandidátní objekty" polozky={[
          { popis: 'čeká na rozhodnutí', hodnota: k.nezpracovan, zvyraznit: k.nezpracovan > 0 },
          { popis: 'odloženo', hodnota: k.odlozen },
          { popis: 'povýšeno', hodnota: k.povysen },
          { popis: 'vyřazeno', hodnota: k.vyrazen },
        ]} />
        <Karta titul="Fotky profilů" polozky={[
          { popis: 'profilů s fotkou', hodnota: `${f.sFotkou}/${f.profilu}` },
          { popis: 'čeká na výběr', hodnota: f.cekaRozhodnuti, zvyraznit: f.cekaRozhodnuti > 0 },
          { popis: 'bez nabídky z Commons', hodnota: f.bezNabidky },
          { popis: 'uzavřeno bez fotky', hodnota: f.uzavrenych },
        ]} />
        <Karta titul="Úplnost profilů" polozky={[
          { popis: 'profilů s mezerou', hodnota: `${data.souhrn.profily.sMezerou}/${data.souhrn.profily.celkem}`, zvyraznit: data.souhrn.profily.sMezerou > 0 },
          ...data.souhrn.profily.dleDruhu.map((d) => ({ popis: `bez: ${d.druh}`, hodnota: d.pocet })),
          { popis: 'ověření starší než rok', hodnota: data.souhrn.profily.zastaraleOvereni, zvyraznit: data.souhrn.profily.zastaraleOvereni > 0 },
        ]} />
        <div>
          <h3 style={{ font: '600 12px/1 system-ui', textTransform: 'uppercase', letterSpacing: '.08em', color: barvy.muted, margin: '0 0 8px' }}>
            Po oblastech
          </h3>
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5 }}>
            <tbody>
              {data.souhrn.dleOblasti.map((o) => (
                <tr key={o.oblast}>
                  <td style={{ padding: '2px 12px 2px 0' }}>{o.oblast}</td>
                  <td style={{ padding: '2px 12px 2px 0', color: o.kandidatiNezpracovani ? barvy.red : barvy.muted }}>
                    {o.kandidatiNezpracovani} kandidátů
                  </td>
                  <td style={{ padding: '2px 0', color: o.profilyBezFotky ? barvy.red : barvy.muted }}>
                    {o.profilyBezFotky} bez fotky
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p
        style={{
          background: data.zapisPovolen ? '#eef3ec' : '#fdf1ea',
          border: `1px solid ${data.zapisPovolen ? barvy.zelena : barvy.red}`,
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 12.5,
          margin: '0 0 12px',
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
        {data.rezim === 'github' && ' Rozhodnutí se v číslech projeví po nejbližším nasazení.'}
      </p>

      <p style={{ margin: '0 0 12px' }}>
        <Link href="/admin/vyber-fotek" style={{ color: barvy.red, fontWeight: 600, fontSize: 13 }}>
          Otevřít výběr fotek ▸
        </Link>
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 12px' }}>
        {[...STAVY, { klic: 'mezery' as const, popis: 'mezery v profilech' }].map((s) => (
          <button
            key={s.klic}
            type="button"
            onClick={() => setStav(s.klic)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: `1px solid ${stav === s.klic ? barvy.red : barvy.line}`,
              background: stav === s.klic ? barvy.red : 'transparent',
              color: stav === s.klic ? '#fff' : barvy.ink,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {s.popis} (
            {s.klic === 'mezery'
              ? data.souhrn.profily.sMezerou
              : data.kandidati.filter((x) => x.stav === s.klic).length}
            )
          </button>
        ))}
        <select value={oblast} onChange={(e) => setOblast(e.target.value)} style={{ marginLeft: 'auto', padding: '6px 9px', borderRadius: 8, border: `1px solid ${barvy.line}` }}>
          <option value="">všechny oblasti</option>
          {oblasti.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {stav === 'mezery' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: barvy.muted, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <th style={{ padding: '6px 8px 6px 0' }}>Profil</th>
              <th style={{ padding: '6px 8px' }}>Oblast</th>
              <th style={{ padding: '6px 8px' }}>Chybí</th>
              <th style={{ padding: '6px 8px' }}>Nejstarší ověření</th>
            </tr>
          </thead>
          <tbody>
            {seznamMezer.map((m) => (
              <tr key={`${m.oblast}/${m.slug}`} style={{ borderTop: `1px solid ${barvy.line}` }}>
                <td style={{ padding: '7px 8px 7px 0' }}>
                  <b>{m.nazev}</b>
                  <br />
                  <span style={{ font: '11px ui-monospace, monospace', color: barvy.muted }}>{m.slug}</span>
                </td>
                <td style={{ padding: '7px 8px', color: barvy.muted }}>{m.oblast}</td>
                <td style={{ padding: '7px 8px' }}>
                  {m.chybi.map((c) => (
                    <span key={c} style={{ display: 'inline-block', border: `1px solid ${barvy.line}`, borderRadius: 12, padding: '1px 8px', marginRight: 5, fontSize: 11.5 }}>
                      {c}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '7px 8px', fontSize: 12, color: barvy.muted }}>
                  {m.nejstarsiOvereni ?? '—'}
                  {m.stariDnu != null ? ` (${m.stariDnu} dní)` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: barvy.muted, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <th style={{ padding: '6px 8px 6px 0' }}>Objekt</th>
            <th style={{ padding: '6px 8px' }}>Oblast</th>
            <th style={{ padding: '6px 8px' }}>Typ</th>
            <th style={{ padding: '6px 8px' }}>Signály</th>
            <th style={{ padding: '6px 8px' }}>{stav === 'nezpracovan' ? 'Rozhodnout' : 'Důvod'}</th>
          </tr>
        </thead>
        <tbody>
          {seznam.map((kand) => (
            <tr key={`${kand.oblast}/${kand.slug}`} style={{ borderTop: `1px solid ${barvy.line}` }}>
              <td style={{ padding: '7px 8px 7px 0' }}>
                <b>{kand.nazev}</b>
                <br />
                <span style={{ font: '11px ui-monospace, monospace', color: barvy.muted }}>{kand.slug}</span>
              </td>
              <td style={{ padding: '7px 8px', color: barvy.muted }}>{kand.oblast}</td>
              <td style={{ padding: '7px 8px', color: barvy.muted }}>{kand.typ ?? '—'}</td>
              <td style={{ padding: '7px 8px', fontSize: 12 }}>
                {kand.maGps ? '📍 GPS' : '— bez GPS'}
                {kand.maObcerstveni ? ' · občerstvení' : ''}
                {kand.vyska != null ? ` · ${kand.vyska} m` : ''}
                {kand.osm && (
                  <>
                    {' · '}
                    <a href={kand.osm} target="_blank" rel="noreferrer" style={{ color: barvy.red }}>
                      OSM ▸
                    </a>
                  </>
                )}
              </td>
              <td style={{ padding: '7px 8px', fontSize: 12, color: barvy.muted }}>
                {stav === 'nezpracovan' ? (
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={!data.zapisPovolen}
                      onClick={() => {
                        const d = window.prompt(`Proč „${kand.nazev}" odložit? (co chybí, na co se čeká)`)
                        if (d?.trim())
                          void posli({ akce: 'odlozit-kandidata', chata: kand.slug, oblast: kand.oblast, duvod: d })
                      }}
                      style={tlacitko(barvy.line, barvy.ink)}
                    >
                      Odložit…
                    </button>
                    <button
                      type="button"
                      disabled={!data.zapisPovolen}
                      onClick={() => {
                        const d = window.prompt(`Proč „${kand.nazev}" vyřadit? (důvod jde do dat a DATA-01 objekt znovu nezaloží)`)
                        if (d?.trim())
                          void posli({ akce: 'vyradit-kandidata', chata: kand.slug, osm: kand.osm, duvod: d })
                      }}
                      style={tlacitko(barvy.red, barvy.red)}
                    >
                      Vyřadit…
                    </button>
                  </span>
                ) : (
                  (kand.duvod ?? '—')
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {stav !== 'mezery' && seznam.length === 0 && (
        <p style={{ color: barvy.muted, fontStyle: 'italic', marginTop: 14 }}>
          Nic tu není — v tomhle stavu (a výběru oblasti) žádný objekt neleží.
        </p>
      )}

      {hlaska && (
        <p style={{ position: 'fixed', right: 18, top: 14, background: barvy.ink, color: '#f3eee4', padding: '8px 13px', borderRadius: 8, fontSize: 12.5 }}>
          {hlaska}
        </p>
      )}
    </div>
  )
}

const tlacitko = (okraj: string, text: string): React.CSSProperties => ({
  background: 'transparent',
  border: `1px solid ${okraj}`,
  color: text,
  borderRadius: 7,
  padding: '4px 9px',
  fontSize: 12,
  cursor: 'pointer',
})

const Karta = ({
  titul,
  polozky,
}: {
  titul: string
  polozky: { popis: string; hodnota: number | string; zvyraznit?: boolean }[]
}) => (
  <div>
    <h3 style={{ font: '600 12px/1 system-ui', textTransform: 'uppercase', letterSpacing: '.08em', color: barvy.muted, margin: '0 0 8px' }}>
      {titul}
    </h3>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {polozky.map((p) => (
        <span key={p.popis} style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
          <b style={{ fontSize: 18, color: p.zvyraznit ? barvy.red : barvy.ink }}>{p.hodnota}</b>
          <span style={{ fontSize: 12, color: barvy.muted }}>{p.popis}</span>
        </span>
      ))}
    </div>
  </div>
)
