'use client'

/**
 * Profil chaty v2 — „Sběratelský zápisník" (design session, validační profil Luční bouda).
 * Dvoustrana = „list z deníku": levá strana emoce/identita/artefakty, pravá tvrdá data (01–09).
 * Data přicházejí HOTOVÁ a POCTIVÁ z page.tsx (reálná pole Payloadu, ne prototypové placeholdery).
 * Faux-3D jen pro artefakty + hero (restraint). Noc = globální body.dark. Serif (Newsreader) default.
 */

import React, { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'

import MapaTrasy, { type TrasaNaMape } from './MapaTrasy'
import IkonaRozhledna from './IkonaRozhledna'
import RazitkaVarianty, { VybranyOtisk, type VariantaOtisku } from './RazitkaVarianty'
import RazitkoSvg from './RazitkoSvg'
import VyskovyProfil, { type BodProfilu } from './VyskovyProfil'
import { formatDatumDeniku, pridejDoDeniku, useZaznamDeniku } from '@/lib/denik'

// ── Serializovatelný tvar dat (sestaví page.tsx z Payloadu) ────────────────
export type ZapMark = '†' | '✓' | '◷'
export type ZapNote = { mark: ZapMark; text: string } | null
export type ZapFakt = { k: string; v: string }
export type ZapSluzba = { k: string; v: string; stav: 'ano' | 'ne' | 'nezjisteno' }
export type ZapRoute = {
  from: string
  km: string
  time: string | null
  up: string | null
  marks: string[]
  profil: BodProfilu[] | null
  lo: string | null
  hiText: string
}
export type ZapSoused = { nazev: string; km: string; url: string | null }
export type ZapMilnik = { rok: string; text: string }
export type ZapZaj = { text: string; tag: string | null }
export type ZapZdroj = { nazev: string; url: string | null; datum: string | null }

export type ZapData = {
  nazev: string
  eyebrow: string
  crumb: string
  vyskaText: string | null
  hero: { url: string; alt: string } | null
  heroAtribuce: { text: string; url: string | null } | null
  heroCaption: string
  status: { kind: 'open' | 'gone' | 'none'; label: string; sub: string | null }
  historickeNazvy: string[]
  lead: string | null
  facts: ZapFakt[]
  identitaNote: ZapNote
  charakteristika: string[]
  provoz: { big: string | null; kv: ZapFakt[]; dynamic: string | null; note: ZapNote } | null
  nocleh: { pokoje: string[]; ceny: string | null; kapacita: string | null; warn: string | null; note: ZapNote } | null
  obcerstveni: { specialita: string } | null
  sluzby: ZapSluzba[]
  pristupIntro: string | null
  routes: ZapRoute[]
  mapa: { lat: number; lng: number; trasy: TrasaNaMape[] } | null
  /** Deep-link na 3D mapu pohoří (?chata=<název>) — null u chat bez GPS. */
  mapa3dUrl: string | null
  /** Odkaz na komunitní podání s předvyplněnou chatou (/prispet?chata=slug). */
  prispetUrl: string | null
  sousede: ZapSoused[]
  historie: { rozsah: string | null; milniky: ZapMilnik[]; text: string[] } | null
  zajimavosti: ZapZaj[]
  zdroje: ZapZdroj[]
  razitko: { slug: string; nazev: string; pohori: string | null; vyska: number | null; otiskUrl: string | null; otiskAlt: string | null; caption: string; stav: string; varianty: VariantaOtisku[] } | null
  znamka: { cislo: string; url: string; stav: string; aktivni: boolean; obrazekUrl: string | null; obrazekZdroj: string | null } | null
  vizitka: { cislo: string; nazev: string; url: string; stav: string; vyrazena: boolean; obrazekUrl: string | null; obrazekZdroj: string | null } | null
  dalsiList: string | null
}

// Legenda 5 stavů ověření — motiv, ne patička (design B5). Statická.
const LEGENDA: { mark: string; name: string; desc: string; note: string; cls: string }[] = [
  { mark: '†', name: 'Převzato ze zdroje', desc: 'Doloženo citací, redakčně neověřeno. Elegantní, ne varovné.', note: 'výchozí stav dnes — u většiny údajů', cls: 'zdroj' },
  { mark: '✓', name: 'Ověřeno redakcí', desc: 'Telefonát nebo oficiální web potvrzen redakcí.', note: 'zatím výjimečně', cls: 'red' },
  { mark: '◈', name: 'Ověřeno provozovatelem', desc: 'Potvrdí ověřený účet chataře.', note: 'Fáze 4', cls: 'neu' },
  { mark: '⊕', name: 'Potvrzeno návštěvníky', desc: 'Nezávislá komunitní hlášení (× počet).', note: 'Fáze 4', cls: 'neu' },
  { mark: '◷', name: 'Údaj se mění / starší 12 měsíců', desc: 'Dynamický údaj — poctivě přiznané stáří.', note: 'provoz, menu, dostupnost', cls: 'dyn' },
]

const STAV_STYLE: Record<string, { bg: string; bd: string; mbg: string; mfg: string }> = {
  zdroj: { bg: 'rgba(224,52,31,.05)', bd: 'rgba(224,52,31,.22)', mbg: 'rgba(224,52,31,.12)', mfg: '#c92f1b' },
  red: { bg: 'var(--paper)', bd: 'var(--line)', mbg: 'rgba(56,64,87,.10)', mfg: '#384057' },
  neu: { bg: 'var(--paper)', bd: 'var(--line)', mbg: 'rgba(56,64,87,.10)', mfg: '#384057' },
  dyn: { bg: 'rgba(234,179,8,.06)', bd: 'rgba(234,179,8,.28)', mbg: 'rgba(234,179,8,.16)', mfg: '#8a6a10' },
}

/** Malá poznámka ověření (†/✓/◷) pod skupinou údajů. */
function SrcNote({ note }: { note: ZapNote }) {
  if (!note) return null
  return (
    <div className="zap-srcnote">
      <span className="t">{note.mark}</span> {note.text}
    </div>
  )
}

/** Hover parallax (perspektiva) — vypnuto při prefers-reduced-motion. */
function useTilt(reduced: boolean) {
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(720px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 9).toFixed(2)}deg) translateY(-5px)`
  }
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = ''
  }
  return { onMove, onLeave }
}

export default function ProfilZapisnik({ data }: { data: ZapData }) {
  const reduced = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
  const [unfolded, setUnfolded] = useState(false)
  const [slider, setSlider] = useState(52)
  const tilt = useTilt(reduced)

  const polaroidTransform = { transform: 'rotate(-2deg)' } // výchozí náklon; tilt přepíše inline

  let n = 0
  const idx = () => String(++n).padStart(2, '0')

  return (
    <div className="zap-desk">
      <div className="zap-meta">
        <span>turistickechaty.cz · profil chaty</span>
        <span>{data.eyebrow}</span>
      </div>

      <div className="zap-sheet">
        <div className="zap-topline" />
        {/* papírové zrno */}
        <svg className="zap-grain" aria-hidden>
          <filter id="zapGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" result="n" /><feColorMatrix in="n" type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#zapGrain)" />
        </svg>
        {/* SVG filtry pro faux-3D (rozpité razítko, dřevo) */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <defs>
            <filter id="zapWood"><feTurbulence type="fractalNoise" baseFrequency="0.013 0.14" numOctaves={4} seed={4} result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.17  0 0 0 0 0.06  0 0 0 0.5 0" /></filter>
          </defs>
        </svg>

        {/* běžící hlavička */}
        <div className="zap-head">
          <div className="zap-brand">
            <span className="zap-emblem"><i /></span>
            <b>Turistické chaty</b>
          </div>
          <div className="zap-crumb">{data.crumb}</div>
          <div className="zap-alt">{data.vyskaText ?? ' '}</div>
        </div>
        <div className="zap-hair" />
        <div className="zap-blaze" aria-hidden>
          <i style={{ flex: 2, background: 'linear-gradient(to bottom,transparent 0 25%,var(--tr-red) 25% 75%,transparent 75%)' }} />
          <i style={{ flex: 3, background: 'linear-gradient(to bottom,transparent 0 25%,var(--tr-blue) 25% 75%,transparent 75%)' }} />
          <i style={{ flex: 1.4, background: 'linear-gradient(to bottom,transparent 0 25%,var(--tr-green) 25% 75%,transparent 75%)' }} />
          <i style={{ flex: 1, background: 'linear-gradient(to bottom,transparent 0 25%,var(--tr-yellow) 25% 75%,transparent 75%)' }} />
        </div>

        <div className="zap-grid">
          {/* ── LEVÁ STRANA — identita / artefakty ─────────────────────── */}
          <div className="zap-page zap-left">
            <div className="zap-polaroid-wrap">
              <div className="zap-polaroid" style={polaroidTransform} onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave}>
                <div className="zap-washi" />
                <div className="zap-frame">
                  <div className="zap-photo">
                    {data.hero ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={data.hero.url} alt={data.hero.alt} />
                    ) : (
                      <HeroPlaceholder />
                    )}
                    {data.heroAtribuce &&
                      (data.heroAtribuce.url ? (
                        <a className="zap-atr" href={data.heroAtribuce.url} target="_blank" rel="noopener noreferrer nofollow">{data.heroAtribuce.text}</a>
                      ) : (
                        <span className="zap-atr">{data.heroAtribuce.text}</span>
                      ))}
                    <span className="zap-corner tl" /><span className="zap-corner tr" /><span className="zap-corner bl" /><span className="zap-corner br" />
                  </div>
                  <div className="zap-cap">{data.heroCaption}</div>
                </div>
              </div>
            </div>

            <div className="zap-eyebrow">{data.eyebrow}</div>
            <h1 className="zap-title">{data.nazev}</h1>
            <div className="zap-status">
              {data.status.kind !== 'none' && (
                <span className={`zap-pill ${data.status.kind}`}><i />{data.status.label}</span>
              )}
              {data.status.sub && <span className="sub">{data.status.sub}</span>}
            </div>
            {data.historickeNazvy.length > 0 ? (
              <div className="zap-tnote"><span className="t">†</span> historické názvy: {data.historickeNazvy.join(' · ')}</div>
            ) : (
              <div className="zap-tnote"><span className="t">†</span> historické názvy — u této chaty nedoloženo</div>
            )}
            {data.lead && <p className="zap-lead">{data.lead}</p>}

            {data.facts.length > 0 && (
              <div className="zap-facts">
                {data.facts.map((f) => (
                  <div className="zap-fact" key={f.k}>
                    <span className="k">{f.k}</span>
                    <span className="v">
                      {f.k === 'Typ' && f.v.startsWith('Rozhledna') && <IkonaRozhledna size={16} />}
                      {f.v}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <SrcNote note={data.identitaNote} />

            {/* Sběratelská místa */}
            {(data.razitko || data.znamka || data.vizitka) && (
              <>
                <div className="zap-strip"><b>Sběratelská místa</b><span className="line" /><span className="tag">Artefakt</span></div>
                <div className="zap-artefakty">
                  {data.razitko && <RazitkoObjekt r={data.razitko} reduced={reduced} />}
                  {data.znamka && <ZnamkaObjekt z={data.znamka} tilt={tilt} />}
                  {data.vizitka && <VizitkaObjekt v={data.vizitka} tilt={tilt} />}
                </div>
              </>
            )}
            {data.prispetUrl && (
              <a className="zap-prispet" href={data.prispetUrl}>
                {data.razitko
                  ? 'Máš jiný otisk nebo novější fotku? Pošli je do sbírky ▸'
                  : 'Razítko téhle chaty zatím nemáme — máš otisk? Pošli ho ▸'}
              </a>
            )}

            {/* Skládaná mapa */}
            {data.mapa && (
              <>
                <div className="zap-strip"><b>Mapa · skládaná</b><span className="line" /><span className="tag">Podpisový prvek</span></div>
                <SkladanaMapa mapa={data.mapa} nazev={data.nazev} unfolded={unfolded} setUnfolded={setUnfolded} reduced={reduced} />
                <div className="zap-srcnote"><span className="t">†</span> živé dlaždice Mapy.com pod dekorativní papírovou vrstvou · sklady ve „whisper“ úrovni, neruší ovládání</div>
                {data.mapa3dUrl && (
                  <a className="zap-3d-odkaz" href={data.mapa3dUrl}>Ukázat na 3D mapě pohoří ▸</a>
                )}
              </>
            )}
            {/* Bez souřadnic mapa chybí — a je poctivější to říct než nechat
                prázdno, které vypadá jako rozbitá stránka. Profil se sem dostal
                z pramenů, které GPS neuvádějí (katalog, web chaty); dokud je
                nedoložíme, mapu nekreslíme, protože polohu nedomýšlíme. */}
            {!data.mapa && (
              <>
                <div className="zap-strip"><b>Mapa · skládaná</b><span className="line" /><span className="tag">Chybí podklad</span></div>
                <div className="zap-mapa-chybi">
                  <b>Souřadnice téhle chaty zatím nemáme doložené.</b>
                  <span>
                    Prameny, ze kterých profil vznikl, polohu neuvádějí — a odhadnout ji z okolí by znamenalo
                    tvrdit něco, co nemáme čím podložit. Mapu proto nekreslíme, dokud souřadnice nedoložíme.
                  </span>
                  {data.prispetUrl && (
                    <a className="zap-3d-odkaz" href={data.prispetUrl}>Znáš přesnou polohu? Pošli ji do sbírky ▸</a>
                  )}
                </div>
              </>
            )}

            {/* Osobní stopa — veřejná (ghost, Fáze 4) */}
            <div className="zap-osobni">
              <span className="q">?</span>
              <div>
                <div className="lab">Osobní stopa · Fáze 4</div>
                <div className="txt">Přihlas se a <b>orazítkuj si svůj deník</b> — navštíveno, získané razítko, vlastní poznámka a fotka.</div>
              </div>
            </div>
          </div>

          {/* ── PRAVÁ STRANA — tvrdá data ──────────────────────────────── */}
          <div className="zap-page zap-right">
            {data.charakteristika.length > 0 && (
              <div className="zap-intro">
                {data.charakteristika.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}

            {data.provoz && (
              <>
                <SekceHlavicka n={idx()} t="Provoz" />
                {(data.provoz.big || data.provoz.kv.length > 0) && (
                  <div className="zap-kvs">
                    {data.provoz.big && <div className="zap-kv"><div className="big">{data.provoz.big}</div></div>}
                    {data.provoz.kv.map((k) => (
                      <div className="zap-kv" key={k.k}><div className="k">{k.k}</div><div className="v">{k.v}</div></div>
                    ))}
                  </div>
                )}
                {data.provoz.dynamic && (
                  <div className="zap-dyn"><span className="m">◷</span> {data.provoz.dynamic}</div>
                )}
                <SrcNote note={data.provoz.note} />
              </>
            )}

            {data.nocleh && (
              <>
                <SekceHlavicka n={idx()} t="Nocleh" />
                {data.nocleh.pokoje.length > 0 && (
                  <div className="zap-chips">{data.nocleh.pokoje.map((p, i) => <span className="zap-chip2" key={i}>{p}</span>)}</div>
                )}
                <div className="zap-nocline">
                  {data.nocleh.kapacita && <div className="zap-kv"><div className="k">Kapacita</div><div className="v">{data.nocleh.kapacita}</div></div>}
                  {data.nocleh.ceny && <div className="price"><b>{data.nocleh.ceny}</b></div>}
                  {data.nocleh.warn && <div className="zap-warn"><span className="m">⚠</span> kapacita lůžek — <b>neuvádíme</b>: {data.nocleh.warn}</div>}
                </div>
                <SrcNote note={data.nocleh.note} />
              </>
            )}

            {data.obcerstveni && (
              <>
                <SekceHlavicka n={idx()} t="Občerstvení" />
                <div className="zap-callout">
                  <span className="quote">„</span>
                  <div>
                    <div className="k">Specialita podniku</div>
                    <div className="body">{data.obcerstveni.specialita}</div>
                  </div>
                </div>
              </>
            )}

            {data.sluzby.length > 0 && (
              <>
                <SekceHlavicka n={idx()} t="Služby" tag={'zobrazujeme i „nezjištěno" — poctivě'} tagItalic />
                <div className="zap-sluzby">
                  {data.sluzby.map((s) => (
                    <div className="zap-sluzba" key={s.k}>
                      <span className={`ic ${s.stav === 'ano' ? 'ano' : s.stav === 'ne' ? 'ne' : 'un'}`}>{s.stav === 'ano' ? '✓' : s.stav === 'ne' ? '✕' : '–'}</span>
                      <div><div className="k">{s.k}</div><div className="v">{s.v}</div></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.routes.length > 0 && (
              <>
                <SekceHlavicka n={idx()} t="Odkud vyjít" tag="Informace" />
                {data.pristupIntro && <p className="zap-intro" style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 10px' }}>{data.pristupIntro}</p>}
                {data.routes.map((r, i) => (
                  <div className="zap-route" key={i}>
                    <div className="zap-route-head">
                      <div className="from">{r.from} <span className="ar">→</span> {data.nazev}</div>
                      <div className="zap-route-stats">
                        <span>{r.km}</span>
                        {r.time && <span className="t">{r.time}</span>}
                        {r.up && <span className="u">{r.up}</span>}
                      </div>
                    </div>
                    {r.marks.length > 0 && (
                      <div className="zap-route-marks">
                        {r.marks.map((c, j) => (
                          <i key={j} style={{ background: `linear-gradient(to bottom,#fff 0 26%,${c} 26% 74%,#fff 74%)` }} />
                        ))}
                      </div>
                    )}
                    <div className="zap-route-axis"><span>{r.from}</span><span className="warn">⚠ značení úseků se doplňuje</span><span>{data.nazev}</span></div>
                    {r.profil && (
                      <VyskovyProfil body={r.profil} start={r.from} cil={data.nazev} />
                    )}
                    <div className="zap-route-foot"><span>{r.lo ?? ''}</span><span>výškový profil{r.up ? ` · ${r.up}` : ''}</span><span>{r.hiText}</span></div>
                  </div>
                ))}
                {data.mapa && (
                  <MapaTrasyOdkaz />
                )}
              </>
            )}

            {data.sousede.length > 0 && (
              <>
                <SekceHlavicka n={idx()} t="Sousední chaty · přechody" />
                <div className="zap-sousede">
                  {data.sousede.map((s, i) =>
                    s.url ? (
                      <Link className="zap-soused" href={s.url} key={i}><span className="n">{s.nazev}</span><span className="km">{s.km}</span></Link>
                    ) : (
                      <span className="zap-soused" key={i}><span className="n">{s.nazev}</span><span className="km">{s.km}</span></span>
                    ),
                  )}
                </div>
              </>
            )}

            {data.historie && (
              <>
                <SekceHlavicka n={idx()} t="Historie" tag={data.historie.rozsah ?? undefined} tagItalic />
                {data.historie.milniky.length > 0 && (
                  <div className="zap-timeline">
                    {data.historie.milniky.map((m, i) => (
                      <div className="zap-mil" key={i}><span className="dot" /><div className="rok">{m.rok}</div><div className="txt">{m.text}</div></div>
                    ))}
                  </div>
                )}
                {data.historie.text.map((p, i) => <p className="zap-intro" key={i} style={{ margin: '0 0 8px' }}>{p}</p>)}
                <TehdyDnes slider={slider} setSlider={setSlider} />
              </>
            )}

            {data.zajimavosti.length > 0 && (
              <>
                <SekceHlavicka n={idx()} t={'Zajímavosti · „nej"'} />
                <div className="zap-zaj">
                  {data.zajimavosti.map((z, i) => (
                    <div className="zap-zaj-row" key={i}><span className="d" /><div className="txt">{z.text}{z.tag && <span className="tag"> {z.tag}</span>}</div></div>
                  ))}
                </div>
              </>
            )}

            {data.zdroje.length > 0 && (
              <>
                <SekceHlavicka n={idx()} t="Zdroje a ověření" />
                <div className="zap-zdroje">
                  {data.zdroje.map((z, i) => (
                    <div className="zap-zdroj" key={i}>
                      <span className="n">{z.url ? <a href={z.url} target="_blank" rel="noopener noreferrer nofollow">{z.nazev}</a> : z.nazev}</span>
                      <span className="meta">{z.datum && <span className="d">ověř. {z.datum}</span>}<span className="st">převzato ze zdroje</span></span>
                    </div>
                  ))}
                </div>
                <div className="zap-legend-h">Stavy ověření — jak číst značky</div>
                <div className="zap-legend">
                  {LEGENDA.map((v) => {
                    const st = STAV_STYLE[v.cls]
                    return (
                      <div className="zap-stav" key={v.mark} style={{ background: st.bg, border: `1px solid ${st.bd}` }}>
                        <span className="mk" style={{ background: st.mbg, color: st.mfg }}>{v.mark}</span>
                        <div><div className="name">{v.name}</div><div className="desc">{v.desc}</div><div className="note">{v.note}</div></div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="zap-foot">
          <span className="l">List · {data.nazev} · sazba: sběratelský zápisník · mřížka 8 px · KČT červená</span>
          {data.dalsiList && <span className="r">další list — {data.dalsiList} →</span>}
        </div>
      </div>
    </div>
  )
}

// ── Sekční hlavička ────────────────────────────────────────────────────────
function SekceHlavicka({ n, t, tag, tagItalic }: { n: string; t: string; tag?: string; tagItalic?: boolean }) {
  return (
    <div className="zap-sec">
      <span className="n">{n}</span>
      <span className="t">{t}</span>
      <span className="line" />
      {tag && <span className={`tag${tagItalic ? ' i' : ''}`}>{tag}</span>}
    </div>
  )
}

// ── Razítko (reálný otisk / stylizované SVG) + sběr do deníku ──────────────
function RazitkoObjekt({ r, reduced }: { r: NonNullable<ZapData['razitko']>; reduced: boolean }) {
  const zaznam = useZaznamDeniku(r.slug)
  const [hit, setHit] = useState(false)
  // Vybraná varianta otisku (víc verzí razítka — zadání Michala 28. 7. 2026).
  const [vybranaId, setVybranaId] = useState(r.varianty[0]?.id ?? '')
  const sbirat = () => {
    if (zaznam || hit) return
    setHit(true)
    window.setTimeout(() => pridejDoDeniku(r.slug), 480)
  }
  const vic = r.varianty.length > 1
  const vybrana = r.varianty.find((v) => v.id === vybranaId) ?? r.varianty[0] ?? null

  return (
    <div className={`zap-razitko${vic ? ' ma-varianty' : ''}`}>
      {vic && vybrana ? (
        <>
          <div className="zap-obj-cap nad">{r.caption}</div>
          <VybranyOtisk varianta={vybrana} celkem={r.varianty.length} nazevChaty={r.nazev} reduced={reduced} />
        </>
      ) : (
        <>
          <div className="zap-obj-stage">
            {r.otiskUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.otiskUrl} alt={r.otiskAlt ?? `Otisk razítka — ${r.nazev}`} style={{ maxWidth: 122, maxHeight: 122, mixBlendMode: 'multiply' }} />
            ) : (
              <div style={{ width: 122 }}><RazitkoSvg nazev={r.nazev} pohori={r.pohori} vyska={r.vyska} /></div>
            )}
          </div>
          <div className="zap-obj-cap">{r.caption}</div>
          <div className="zap-obj-sub"><span className="dot" style={{ color: 'var(--open)' }}>●</span> {r.stav}</div>
        </>
      )}
      <RazitkaVarianty varianty={r.varianty} vybranaId={vybrana?.id ?? ''} onVyber={setVybranaId} reduced={reduced} />
      {zaznam ? (
        <button type="button" className="btn done" style={{ marginTop: 8, fontSize: 11 }} aria-disabled>✓ Ve sbírce · {formatDatumDeniku(zaznam.datum)}</button>
      ) : (
        <button type="button" className="btn" style={{ marginTop: 8, fontSize: 11 }} onClick={sbirat} aria-label={`Přidat razítko ${r.nazev} do deníku`}>＋ Do deníku</button>
      )}
    </div>
  )
}

// ── Dřevěná známka (faux-3D placeholder, artwork po svolení) ───────────────
function ZnamkaObjekt({ z, tilt }: { z: NonNullable<ZapData['znamka']>; tilt: ReturnType<typeof useTilt> }) {
  const disc = z.obrazekUrl ? (
    <div className="zap-znamka" onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave}>
      {/* reálná grafika známky — se svolením vydavatele (DATA-13) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="zap-znamka-foto" src={z.obrazekUrl} alt={`Turistická známka č. ${z.cislo}`} title={z.obrazekZdroj ?? undefined} />
      <div className="spec" />
    </div>
  ) : (
    <div className="zap-znamka" onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave}>
      <div className="grain"><svg width="104" height="104"><rect width="104" height="104" filter="url(#zapWood)" /></svg></div>
      <div className="spec" />
      <div className="ring"><div className="c">Č. {z.cislo}</div><div className="n">ZNÁMKA</div><div className="m">náhled</div></div>
    </div>
  )
  return (
    <div style={{ width: 120 }}>
      <a href={z.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'inherit' }}>
        <div className="zap-obj-stage">{disc}</div>
        <div className="zap-obj-cap">Známka č. {z.cislo}</div>
        <div className="zap-obj-sub">
          <span className="dot" style={{ color: z.aktivni ? 'var(--open)' : 'var(--gone)' }}>●</span> {z.obrazekUrl ? 'se svolením vydavatele' : z.stav}
        </div>
      </a>
    </div>
  )
}

// ── Vizitka (faux-3D placeholder) ──────────────────────────────────────────
function VizitkaObjekt({ v, tilt }: { v: NonNullable<ZapData['vizitka']>; tilt: ReturnType<typeof useTilt> }) {
  return (
    <div style={{ width: 150 }}>
      <a href={v.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'inherit' }}>
        <div className="zap-obj-stage">
          <div className={`zap-vizitka${v.vyrazena ? ' vyrazena' : ''}`} onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave}>
            {v.obrazekUrl ? (
              <>
                {/* reálná grafika vizitky — až po svolení Wander Book (DATA-13) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="zap-vizitka-foto" src={v.obrazekUrl} alt={`Turistická vizitka ${v.cislo}`} title={v.obrazekZdroj ?? undefined} />
                <div className="fold" />
              </>
            ) : (
              <>
                <div className="fold" />
                <div className="lbl">TURISTICKÁ VIZITKA</div>
                <div className="code">{v.cislo}</div>
                <div className="nm">{v.nazev}</div>
                <div className="web">wander-book.com</div>
              </>
            )}
            {v.vyrazena && <div className="zap-vyrazeno"><span>VYŘAZENO 2025</span></div>}
          </div>
        </div>
        <div className="zap-obj-cap">Vizitka {v.cislo}</div>
        <div className="zap-obj-sub">
          <span className="dot" style={{ color: v.vyrazena ? 'var(--gone)' : 'var(--open)' }}>●</span> {v.obrazekUrl ? 'se svolením vydavatele' : v.stav}
        </div>
      </a>
    </div>
  )
}

// ── Skládaná mapa (obálka → unfold → živé dlaždice + papír) ────────────────
function SkladanaMapa({ mapa, nazev, unfolded, setUnfolded, reduced }: { mapa: NonNullable<ZapData['mapa']>; nazev: string; unfolded: boolean; setUnfolded: (v: boolean) => void; reduced: boolean }) {
  return (
    <div className="zap-map">
      <div className={`zap-map-inner${unfolded && !reduced ? ' unfold' : ''}`}>
        {unfolded ? (
          <>
            <div className="zap-map-live">
              <MapaTrasy hut={{ nazev, lat: mapa.lat, lng: mapa.lng }} trasy={mapa.trasy} />
            </div>
            <div className="zap-map-paper" aria-hidden>
              <div className="fold-v" style={{ left: '33.3%' }} />
              <div className="fold-v" style={{ left: '66.6%' }} />
              <div className="fold-h" style={{ top: '50%' }} />
              <div className="wear" />
            </div>
            <button type="button" className="zap-map-fold" onClick={() => setUnfolded(false)}>◂ Složit</button>
          </>
        ) : (
          <button type="button" className="zap-map-cover" onClick={() => setUnfolded(true)} aria-label="Rozložit mapu">
            <div className="zap-map-paper" aria-hidden style={{ opacity: 0.9 }}>
              <div className="fold-v" style={{ left: '33.3%', background: 'linear-gradient(90deg,rgba(0,0,0,.14),rgba(255,255,255,.55))' }} />
              <div className="fold-v" style={{ left: '66.6%', background: 'linear-gradient(90deg,rgba(0,0,0,.14),rgba(255,255,255,.55))' }} />
              <div className="fold-h" style={{ top: '50%', background: 'linear-gradient(rgba(0,0,0,.12),rgba(255,255,255,.5))' }} />
            </div>
            <div><div className="t1">Mapy.com · outdoor</div><div className="t2">Skládaná turistická mapa</div></div>
            <span className="btn">Rozložit mapu ▸</span>
          </button>
        )}
      </div>
    </div>
  )
}

function MapaTrasyOdkaz() {
  return (
    <p className="zap-srcnote" style={{ marginTop: 4 }}>
      <span className="t">†</span> trasy počítané ze značení KČT v OpenStreetMap; převýšení z výškového modelu Mapy.com, čas je odhad (DIN 33466) — orientační.
    </p>
  )
}

// ── Tehdy / dnes (ghost — dobové pohlednice zatím nemáme) ──────────────────
function TehdyDnes({ slider, setSlider }: { slider: number; setSlider: (v: number) => void }) {
  return (
    <div className="zap-tehdy" style={{ marginTop: 12 }}>
      <div className="zap-tehdy-head"><span className="k">Tehdy / dnes</span><span className="warn">⚠ dobové pohlednice zatím nemáme — ghost slot</span></div>
      <div className="zap-tehdy-stage">
        <div className="zap-tehdy-ghost"><div><div className="h">dobová pohlednice</div><div className="s">ghost — čeká na archiv</div></div></div>
        <div className="zap-tehdy-handle" style={{ left: `calc(${slider}% - 15px)` }}><i>⇄</i></div>
      </div>
      <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(+e.target.value)} aria-label="Tehdy / dnes" />
    </div>
  )
}

// ── Placeholder hor pro hero bez fotky (ilustrace, ne fakt) ────────────────
function HeroPlaceholder() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id="zaph" x2="0" y2="1"><stop offset="0" stopColor="#dbe7f0" /><stop offset="1" stopColor="#e8eee6" /></linearGradient></defs>
      <rect width="400" height="300" fill="url(#zaph)" />
      <circle cx="312" cy="70" r="26" fill="#f4c46a" opacity=".9" />
      <path d="M0,180 C60,150 120,165 170,140 C230,112 280,150 330,128 L400,150 L400,300 L0,300 Z" fill="#93ab97" />
      <path d="M0,225 C90,200 200,215 300,195 C350,186 380,200 400,196 L400,300 L0,300 Z" fill="#4d6a4a" />
    </svg>
  )
}
