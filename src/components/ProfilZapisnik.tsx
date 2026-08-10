'use client'

/**
 * Profil chaty v2 — „Sběratelský zápisník" (design session, validační profil Luční bouda).
 * Dvoustrana = „list z deníku": levá strana emoce/identita/artefakty, pravá tvrdá data (01–09).
 * Data přicházejí HOTOVÁ a POCTIVÁ z page.tsx (reálná pole Payloadu, ne prototypové placeholdery).
 * Faux-3D jen pro artefakty + hero (restraint). Noc = globální body.dark. Serif (Newsreader) default.
 */

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'

import MapaTrasy, { LOGO_SVG, MAPY_ATRIBUCE, MAPY_COPYRIGHT, type TrasaNaMape } from './MapaTrasy'
import IkonaRozhledna from './IkonaRozhledna'
import RazitkaVarianty, { OtiskZdroj, VybranyOtisk, type VariantaOtisku } from './RazitkaVarianty'
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
  /** Album — současné snímky kromě profilového (galerie chaty). */
  galerie: {
    url: string
    plna: string
    alt: string
    autor: string | null
    licence: string | null
    zdrojUrl: string | null
    datovani: string | null
  }[]
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
  /** Statický náhled mapy (jeden dotaz, cachovaný) — `null` bez API klíče. */
  mapaNahledUrl: string | null
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
  /**
   * Mapa je rozbalená ROVNOU (rozhodnutí Michala 31. 7. 2026: „nesedí mi tam
   * ten placeholder přes mapu, líbila by se mi rovnou rozbalená").
   *
   * Skládaná obálka byla z grafického návrhu — hezká metafora, ale mezi
   * čtenářem a tím, proč sem přišel, stálo kliknutí. Papírové sklady zůstávají
   * jako dekorace nad živými dlaždicemi a „Složit" pořád funguje; jen se
   * nezačíná zavřené. Dlaždice se přitom natáhnou, až se mapa doroluje do
   * záběru — API Mapy.com se tedy nešahá kvůli návštěvníkům, kteří tam
   * nedojdou (to bylo na skládání to jediné praktické).
   */
  const [unfolded, setUnfolded] = useState(true)
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
                      {f.k === 'Typ' && f.v.startsWith('Rozhledna') && <IkonaRozhledna size={17} varianta="vez-obcerstveni" />}
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
                <div className="zap-strip"><b>Mapa</b><span className="line" /><span className="tag">trasy a nástupy</span></div>
                <SkladanaMapa
                  mapa={data.mapa}
                  nazev={data.nazev}
                  nahledUrl={data.mapaNahledUrl}
                  unfolded={unfolded}
                  setUnfolded={setUnfolded}
                  reduced={reduced}
                />
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

            {/*
              ALBUM — další snímky chaty (rozhodnutí Michala 31. 7. 2026:
              „další fotky pod razítka a mapu, do levé části").

              Proč zrovna sem: levý sloupec je v zápisníku ta „měkká" strana —
              artefakty, mapa, paměť. Album po mapě uzavírá cestu, kterou
              stránka vede: co to je (hlavička) → co si odsud odnesu
              (razítko) → jak se tam dostanu (mapa) → jak to tam vypadá.
              Vpravo jsou tvrdá data a fotky by je tříštily.

              Vizuálně navazuje na vlepené snímky z alba pohoří: bílý rám,
              fotorožky, drobné natočení, které se při najetí srovná. První
              fotka je přes celou šířku sloupce (má nést dojem z místa),
              zbytek v dvojicích.
            */}
            {data.galerie.length > 0 && (
              <>
                <div className="zap-strip">
                  <b>Album</b>
                  <span className="line" />
                  <span className="tag">
                    {data.galerie.length} {data.galerie.length === 1 ? 'snímek' : data.galerie.length < 5 ? 'snímky' : 'snímků'}
                  </span>
                </div>
                <Album fotky={data.galerie} nazev={data.nazev} reduced={reduced} />
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
          {/* Jediná varianta se kreslí bez paspart — atribuce převzatého otisku
              se ale musí ukázat i tady (DATA-05, podmínka svolení). */}
          {r.varianty[0] && <OtiskZdroj varianta={r.varianty[0]} />}
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
function SkladanaMapa({
  mapa,
  nazev,
  nahledUrl,
  unfolded,
  setUnfolded,
  reduced,
}: {
  mapa: NonNullable<ZapData['mapa']>
  nazev: string
  nahledUrl: string | null
  unfolded: boolean
  setUnfolded: (v: boolean) => void
  reduced: boolean
}) {
  /**
   * DVĚ ÚROVNĚ MAPY (nápad Michala 1. 8. 2026: „natáhli bysme mapu do cache
   * a načetla by se až po kliknutí — mapa by tam vždy byla, ale šetřili bysme
   * načítání plné mapy").
   *
   * 1. **Náhled** je statický obrázek z jednoho dotazu, který si server drží
   *    v keši. Je vidět hned, se značkou chaty i s přístupovými trasami, takže
   *    čtenář ví, kde chata je, aniž by cokoli klikal — a Mapy.com se přitom
   *    ptáme jednou za období, ne za každého návštěvníka.
   * 2. **Živá mapa** (dvacet dlaždic, posun, přiblížení) se natáhne, teprve až
   *    o ni někdo stojí.
   *
   * Náhled i živá mapa mají tytéž dlaždice, značku i barvy tras, takže přechod
   * vypadá, jako by se mapa probrala — ne jako by se vyměnila.
   *
   * Bez náhledu (chybí klíč, API odmítlo) se nic neláme: mapa se pak natáhne
   * živá, jakmile vjede do záběru. Prázdno tu být nesmí.
   */
  const [zive, setZive] = useState(false)
  const maNahled = !!nahledUrl
  const [vzahledu, setVzahledu] = useState(false)
  const ramRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const prvek = ramRef.current
    if (!prvek || vzahledu || maNahled) return
    if (typeof IntersectionObserver === 'undefined') {
      const id = setTimeout(() => setVzahledu(true), 0)
      return () => clearTimeout(id)
    }
    const pozorovatel = new IntersectionObserver(
      (zaznamy) => {
        if (zaznamy.some((z) => z.isIntersecting)) {
          setVzahledu(true)
          pozorovatel.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    pozorovatel.observe(prvek)
    return () => pozorovatel.disconnect()
  }, [vzahledu, maNahled])

  const ukazZivou = zive || (!maNahled && vzahledu)

  return (
    <div className="zap-map" ref={ramRef}>
      <div className={`zap-map-inner${unfolded && !reduced ? ' unfold' : ''}`}>
        {unfolded ? (
          <>
            <div className="zap-map-live">
              {ukazZivou ? (
                <MapaTrasy hut={{ nazev, lat: mapa.lat, lng: mapa.lng }} trasy={mapa.trasy} />
              ) : maNahled ? (
                <div className="zap-map-nahledbox">
                  <button
                    type="button"
                    className="zap-map-nahled"
                    onClick={() => setZive(true)}
                    aria-label="Načíst interaktivní mapu"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- statický náhled z vlastní route, ne z /public */}
                    <img
                      src={nahledUrl!}
                      alt={`Mapa okolí — ${nazev}, se značkou chaty a přístupovými trasami`}
                      loading="lazy"
                      decoding="async"
                      // Rozbitý náhled nesmí nechat na stránce díru — a čekat
                      // na doscrollování nemá smysl, čtenář se dívá právě sem.
                      onError={() => setZive(true)}
                    />
                    <span className="btn">Rozhýbat mapu ▸</span>
                  </button>
                  {/*
                    Logo a atribuce Mapy.com vyžadují u svých podkladů — u statického
                    náhledu stejně jako u živé mapy, kde je přidává Leaflet sám.
                    Stojí VEDLE tlačítka, ne v něm: odkaz uvnitř tlačítka je
                    neplatné HTML a čtečka by z toho udělala jeden zmatený prvek.
                  */}
                  <a
                    className="zap-map-logo"
                    href="https://mapy.com/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Mapy.com"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- povinné logo poskytovatele z jejich domény */}
                    <img src={LOGO_SVG} alt="Mapy.com" width={60} height={18} />
                  </a>
                  <a className="zap-map-atribuce" href={MAPY_COPYRIGHT} target="_blank" rel="noreferrer">
                    {MAPY_ATRIBUCE}
                  </a>
                </div>
              ) : (
                <div className="zap-map-ceka" aria-hidden />
              )}
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

/**
 * ALBUM — vlepené snímky v levém sloupci profilu.
 *
 * Návrhová rozhodnutí, která tu stojí za pozornost:
 *  - **První snímek přes celou šířku**, zbytek v dvojicích. Album má nejdřív
 *    dát dojem z místa, teprve pak detaily; mřížka stejně velkých čtverců by
 *    z toho udělala kontaktní arch.
 *  - **Fotorožky a drobné natočení** navazují na vlepené snímky v albu pohoří —
 *    stránka je zápisník, ne galerie stocku. Při najetí se snímek srovná
 *    a nadzvedne; `prefers-reduced-motion` to vypíná.
 *  - **Atribuce u každého snímku**, i když licence nevyžaduje. Web, který
 *    u faktů jmenuje prameny a u fotek ne, si protiřečí.
 *  - **Lupa přes celou obrazovku** po kliknutí: šipky, Esc, klik mimo. Bez ní
 *    by album bylo jen ozdoba — na fotce chaty chce člověk vidět detail.
 */
function Album({ fotky, nazev, reduced }: { fotky: ZapData['galerie']; nazev: string; reduced: boolean }) {
  const [otevrena, setOtevrena] = useState<number | null>(null)
  const zavri = useCallback(() => setOtevrena(null), [])
  const posun = useCallback(
    (o: number) => setOtevrena((i) => (i == null ? null : (i + o + fotky.length) % fotky.length)),
    [fotky.length],
  )

  useEffect(() => {
    if (otevrena == null) return
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.key === 'Escape') zavri()
      if (e.key === 'ArrowRight') posun(1)
      if (e.key === 'ArrowLeft') posun(-1)
    }
    window.addEventListener('keydown', naKlavesu)
    return () => window.removeEventListener('keydown', naKlavesu)
  }, [otevrena, zavri, posun])

  const atribuce = (f: ZapData['galerie'][number]) =>
    ['foto: ' + (f.autor ?? 'neznámý autor'), f.licence, f.datovani].filter(Boolean).join(' · ')

  return (
    <>
      <div className="zap-album">
        {fotky.map((f, i) => (
          <figure
            key={f.plna}
            /**
             * Velký úvodní snímek jen u LICHÉHO počtu — zbytek se pak srovná
             * do dvojic a mřížka nikdy nekončí osamělou půlkou. U sudého počtu
             * jsou všechny stejné, což je taky v pořádku: album má vypadat
             * složené, ne rozsypané.
             */
            className={`zap-album-snimek${i === 0 && fotky.length % 2 === 1 ? ' velky' : ''}`}
            style={reduced ? undefined : ({ '--rot': `${((i % 3) - 1) * 0.9}deg` } as React.CSSProperties)}
          >
            <button type="button" onClick={() => setOtevrena(i)} aria-label={`Zvětšit: ${f.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- náhled z Payloadu, rozměry řídí CSS */}
              <img src={f.url} alt={f.alt} loading="lazy" decoding="async" />
              <span className="roh lh" aria-hidden />
              <span className="roh ph" aria-hidden />
              <span className="roh ld" aria-hidden />
              <span className="roh pd" aria-hidden />
            </button>
            <figcaption>
              <span className="popis">{f.alt}</span>
              <span className="atr">{atribuce(f)}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {otevrena != null && fotky[otevrena] && (
        <div className="zap-lupa" role="dialog" aria-modal="true" aria-label={`Album — ${nazev}`} onClick={zavri}>
          <div className="zap-lupa-obsah" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- plná fotka z Payloadu */}
            <img src={fotky[otevrena]!.plna} alt={fotky[otevrena]!.alt} />
            <div className="zap-lupa-popis">
              <b>{fotky[otevrena]!.alt}</b>
              <span>
                {atribuce(fotky[otevrena]!)}
                {fotky[otevrena]!.zdrojUrl && (
                  <>
                    {' · '}
                    <a href={fotky[otevrena]!.zdrojUrl!} target="_blank" rel="noreferrer">
                      zdroj snímku ▸
                    </a>
                  </>
                )}
              </span>
            </div>
            {fotky.length > 1 && (
              <>
                <button type="button" className="zap-lupa-sip vlevo" onClick={() => posun(-1)} aria-label="Předchozí snímek">
                  ‹
                </button>
                <button type="button" className="zap-lupa-sip vpravo" onClick={() => posun(1)} aria-label="Další snímek">
                  ›
                </button>
                <span className="zap-lupa-pocet">
                  {otevrena + 1} / {fotky.length}
                </span>
              </>
            )}
            <button type="button" className="zap-lupa-zavri" onClick={zavri} aria-label="Zavřít">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
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
