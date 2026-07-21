import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { FotoAtribuce } from '@/components/FotoAtribuce'
import MapaTrasy from '@/components/MapaTrasy'
import RazitkoMoment from '@/components/RazitkoMoment'
import TiskButton from '@/components/TiskButton'
import { TRAIL_COLORS, TrailBlaze } from '@/components/ui'
import VyskovyProfil, { type BodProfilu } from '@/components/VyskovyProfil'
import { pristupyChaty } from '@/lib/pristupove-trasy'
import {
  chataPath,
  formatCas,
  formatCislo,
  formatDatum,
  formatGps,
  getChataBySlug,
  posledniOvereni,
  TYP_NAZEV,
  ZEME_NAZEV,
  ZEME_SLUG,
  ZNACENI_BARVA,
  ZNACENI_NAZEV,
} from '@/lib/chaty'
import type { Chaty as Chata, Fotky as Fotka, Razitka } from '@/payload-types'

export const revalidate = 600

/** Popisek typu výchozího bodu pro sekci „Odkud vyjít". */
const TYP_BODU_NAZEV: Record<string, string> = {
  obec: 'obec',
  lanovka: 'lanovka',
  zeleznice: 'vlaková zastávka',
  zastavka: 'aut. zastávka',
}

/** Doména z URL (bez www) pro popisek zdroje; při chybě vrátí vstup. */
const hostZUrl = (u: string): string => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

type Params = { zeme: string; oblast: string; chata: string }

/** Placeholder hor, dokud chata nemá vlastní hero fotku (ilustrace, ne fakt). */
const HeroPlaceholder = () => (
  <svg viewBox="0 0 900 460" preserveAspectRatio="xMidYMid slice" aria-hidden>
    <defs>
      <linearGradient id="ph" x2="0" y2="1">
        <stop offset="0" stopColor="#dbe7f0" />
        <stop offset="1" stopColor="#e8eee6" />
      </linearGradient>
    </defs>
    <rect width="900" height="460" fill="url(#ph)" />
    <circle cx="710" cy="88" r="42" fill="#f4c46a" opacity=".9" />
    <path
      d="M0,280 C120,232 240,255 340,222 C440,190 520,230 620,200 L710,138 L800,220 C840,240 880,247 900,250 L900,460 L0,460 Z"
      fill="#93ab97"
    />
    <path d="M0,340 C160,300 320,325 480,296 C640,268 780,310 900,288 L900,460 L0,460 Z" fill="#64815f" />
    <path d="M0,398 C200,372 420,390 620,368 C740,356 840,370 900,362 L900,460 L0,460 Z" fill="#41573f" />
  </svg>
)

const stavBadge = (chata: Chata): React.ReactNode => {
  if (chata.stav === 'v-provozu') return <span className="open">● Otevřeno</span>
  if (chata.stav === 'mimo-provoz') return <span>Dočasně mimo provoz</span>
  if (chata.stav === 'zanikla') return <span>Zaniklá</span>
  return null
}

async function nactiChatu(params: Params): Promise<Chata> {
  const chata = await getChataBySlug(params.chata)
  if (!chata) notFound()
  // kanonická URL musí sedět (země i oblast) — jinak 404, ať neexistují duplicitní cesty
  const path = chataPath(chata)
  if (!path || path !== `/${params.zeme}/${params.oblast}/${params.chata}`) notFound()
  return chata
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params
  const chata = await getChataBySlug(params.chata)
  if (!chata) return {}
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const title = `${chata.nazev}${chata.vyska ? ` · ${formatCislo(chata.vyska)} m` : ''} — ${oblast?.nazev ?? 'Turistické chaty'}`
  return {
    title,
    description:
      chata.perex ??
      `${chata.nazev} — profil chaty na turistickechaty.cz: ověřená data, trasy, razítko.`,
    alternates: { canonical: chataPath(chata) ?? undefined },
  }
}

/** JSON-LD dle typu chaty (plán kap. 6) — jen z doložených polí. */
const jsonLd = (chata: Chata, path: string) => {
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const typy: string[] = ['TouristAttraction']
  if (chata.nocleh === 'ano') typy.push('LodgingBusiness')
  else if (chata.kuchyne === 'ano') typy.push('FoodEstablishment')

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': typy.length === 1 ? typy[0] : typy,
    name: chata.nazev,
    url: `https://turistickechaty.cz${path}`,
  }
  const aliasy = (chata.aliasy ?? []).map((a) => a.nazev).filter(Boolean)
  if (aliasy.length) data.alternateName = aliasy
  if (chata.perex) data.description = chata.perex
  if (chata.lat != null && chata.lng != null) {
    data.geo = {
      '@type': 'GeoCoordinates',
      latitude: chata.lat,
      longitude: chata.lng,
      ...(chata.vyska != null ? { elevation: chata.vyska } : {}),
    }
  }
  if (chata.zeme) data.address = { '@type': 'PostalAddress', addressCountry: chata.zeme.toUpperCase() }
  if (chata.kontakty?.telefon) data.telephone = chata.kontakty.telefon
  if (chata.kontakty?.email) data.email = chata.kontakty.email
  const sameAs = [chata.kontakty?.web, chata.kontakty?.facebook, chata.kontakty?.instagram].filter(Boolean)
  if (sameAs.length) data.sameAs = sameAs

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      chata.zeme && {
        '@type': 'ListItem',
        position: 1,
        name: ZEME_NAZEV[chata.zeme],
        item: `https://turistickechaty.cz/${ZEME_SLUG[chata.zeme]}`,
      },
      oblast && {
        '@type': 'ListItem',
        position: 2,
        name: oblast.nazev,
        item: `https://turistickechaty.cz/${chata.zeme ? ZEME_SLUG[chata.zeme] : ''}/${oblast.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: chata.nazev, item: `https://turistickechaty.cz${path}` },
    ].filter(Boolean),
  }
  return [data, breadcrumb]
}

export default async function ProfilChaty(props: { params: Promise<Params> }) {
  const params = await props.params
  const chata = await nactiChatu(params)
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const path = `/${params.zeme}/${params.oblast}/${params.chata}`

  const fotky = (chata.fotky?.docs ?? []).filter((f): f is Fotka => typeof f === 'object')
  const heroFoto = fotky.find((f) => f.typ === 'soucasna' && f.url)
  const razitka = (chata.razitka?.docs ?? []).filter((r): r is Razitka => typeof r === 'object')
  const razitko = razitka.find((r) => r.stav === 'k-dispozici') ?? razitka[0]
  const otisk = razitko && typeof razitko.otisk === 'object' ? razitko.otisk : null
  const overeni = posledniOvereni(chata)
  const trasy = chata.trasy ?? []
  // Přístupové trasy od kurátorovaných středisek (DATA-06 3b) — „odkud vyjít".
  const pristupy = pristupyChaty(chata.slug)
  /** První trasa s doloženým výškovým profilem (≥ 2 body [km, výška]). */
  const trasaSProfilem = trasy.find(
    (t) =>
      Array.isArray(t.vyskovyProfil) &&
      t.vyskovyProfil.length >= 2 &&
      t.vyskovyProfil.every(
        (b) => Array.isArray(b) && b.length === 2 && typeof b[0] === 'number' && typeof b[1] === 'number',
      ),
  )
  const sousede = (chata.sousedniChaty ?? []).filter((s) => typeof s.chata === 'object')
  const maHistorii = Boolean(chata.rokVzniku || (chata.milniky?.length ?? 0) > 0 || chata.historieText)

  // řádek faktů — jen doložené buňky
  const fakta: { k: string; v: React.ReactNode; s?: string }[] = []
  if (chata.vyska != null) fakta.push({ k: 'Výška', v: `${formatCislo(chata.vyska)} m`, s: oblast?.nazev })
  if (chata.sezona) fakta.push({ k: 'Otevřeno', v: chata.sezona, s: chata.otviraciDoba?.split('\n')[0] })
  if (chata.nocleh === 'ano' && chata.kapacita != null)
    fakta.push({ k: 'Nocleh', v: `≈ ${formatCislo(chata.kapacita)} lůžek`, s: chata.cenyOrientacne ?? undefined })
  else if (chata.nocleh) fakta.push({ k: 'Nocleh', v: chata.nocleh === 'ano' ? 'Ano' : 'Ne' })
  if (overeni)
    fakta.push({ k: 'Ověřeno', v: formatDatum(overeni.checked), s: overeni.verified ? 'redakce' : 'zatím neověřeno' })
  if (chata.webkamera)
    fakta.push({
      k: 'Webkamera',
      v: (
        <a href={chata.webkamera} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="live" />
          Živě
        </a>
      ),
    })

  const kotvy: { id: string; label: string }[] = []
  if (chata.zajimavosti?.length) kotvy.push({ id: 'p-zajimavosti', label: `0${kotvy.length + 1} Zajímavosti` })
  if (trasy.length) kotvy.push({ id: 'p-trasy', label: `0${kotvy.length + 1} Trasy` })
  if (pristupy.length) kotvy.push({ id: 'p-pristup', label: `0${kotvy.length + 1} Odkud vyjít` })
  if (razitko) kotvy.push({ id: 'p-razitko', label: `0${kotvy.length + 1} Razítko` })
  if (sousede.length) kotvy.push({ id: 'p-sousede', label: `0${kotvy.length + 1} Sousedé` })
  if (maHistorii) kotvy.push({ id: 'p-historie', label: `0${kotvy.length + 1} Historie` })

  let sekce = 0
  const cisloSekce = () => `0${++sekce}`

  return (
    <div className="wrap" style={{ paddingTop: 26 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(chata, path)) }} />

      <div className="p-crumb">
        {chata.zeme && <Link href={`/${ZEME_SLUG[chata.zeme]}`}>{ZEME_NAZEV[chata.zeme]}</Link>}
        {oblast && <> › <Link href="/chaty">{oblast.nazev}</Link></>}
        {chata.lat != null && chata.lng != null && <> · {formatGps(chata.lat, chata.lng)}</>}
      </div>

      {kotvy.length > 1 && (
        <nav className="subnav" aria-label="Obsah profilu">
          {kotvy.map((k) => (
            <a key={k.id} href={`#${k.id}`}>
              {k.label}
            </a>
          ))}
        </nav>
      )}

      <div className="phero">
        {heroFoto?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroFoto.url} alt={heroFoto.alt} />
        ) : (
          <HeroPlaceholder />
        )}
        {heroFoto && <FotoAtribuce fotka={heroFoto} />}
        <div className="tx">
          <div className="cr">
            {[chata.typ ? TYP_NAZEV[chata.typ] : null, oblast?.nazev].filter(Boolean).join(' · ')}
          </div>
          <h1>{chata.nazev}</h1>
          <div className="bg">
            {chata.vyska != null && <span>{formatCislo(chata.vyska)} m n. m.</span>}
            {chata.nocleh === 'ano' && chata.kapacita != null && <span>≈ {formatCislo(chata.kapacita)} lůžek</span>}
            {stavBadge(chata)}
          </div>
        </div>
      </div>

      {fakta.length > 0 && (
        <div className="facts" style={{ gridTemplateColumns: `repeat(${fakta.length}, 1fr)` }}>
          {fakta.map((f) => (
            <div key={f.k}>
              <div className="k">{f.k}</div>
              <div className="v">{f.v}</div>
              {f.s && <div className="s">{f.s}</div>}
            </div>
          ))}
        </div>
      )}

      {chata.perex && <p style={{ maxWidth: 720, margin: '6px 0 4px' }}>{chata.perex}</p>}
      {chata.text && (
        <div style={{ maxWidth: 720, margin: '6px 0 4px' }}>
          <RichText data={chata.text} />
        </div>
      )}

      {(chata.zajimavosti?.length ?? 0) > 0 && (
        <section id="p-zajimavosti" style={{ marginTop: 18 }}>
          <div className="lista">
            <span className="n">{cisloSekce()}</span>
            <b>Zajímavosti</b>
          </div>
          <ul style={{ maxWidth: 720, margin: '10px 0 4px', paddingLeft: 18, display: 'grid', gap: 6 }}>
            {chata.zajimavosti!.map((z, i) => (
              <li key={z.id ?? i}>
                {z.text}
                {z.zdroj && (
                  <span className="mn" style={{ color: 'var(--muted)' }}>
                    {' '}
                    — {z.zdroj}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {trasy.length > 0 && (
        <section id="p-trasy" style={{ marginTop: 18 }}>
          <div className="lista">
            <span className="n">{cisloSekce()}</span>
            <b>Přístupové trasy</b>
          </div>
          {trasy.map((t, i) => (
            <div className="row" style={i === trasy.length - 1 ? { borderBottom: 0 } : undefined} key={t.id ?? i}>
              <div>
                <b>{t.vychoziBod}</b>
                {t.poznamka && <span className="sm">{t.poznamka}</span>}
              </div>
              <span className="num">{t.casMin != null ? formatCas(t.casMin) : '—'}</span>
              <span className="num">{t.prevyseni != null ? `+${formatCislo(t.prevyseni)} m` : '—'}</span>
              {t.znaceni && t.znaceni !== 'jine' ? (
                <span className="znm">
                  <i style={{ '--zc': ZNACENI_BARVA[t.znaceni] } as React.CSSProperties} />
                  {ZNACENI_NAZEV[t.znaceni]}
                </span>
              ) : (
                <span className="num">{t.znaceni ? ZNACENI_NAZEV[t.znaceni] : '—'}</span>
              )}
              <span />
            </div>
          ))}
          {trasaSProfilem && (
            <div style={{ margin: '16px 0 0' }}>
              <VyskovyProfil
                body={trasaSProfilem.vyskovyProfil as BodProfilu[]}
                start={trasaSProfilem.vychoziBod}
                cil={chata.nazev}
              />
              <p className="prof-pop">
                Výškový profil trasy ({trasaSProfilem.vychoziBod}) — najeď myší po křivce.
              </p>
            </div>
          )}
        </section>
      )}

      {pristupy.length > 0 && (
        <section id="p-pristup" style={{ marginTop: 18 }}>
          <div className="lista">
            <span className="n">{cisloSekce()}</span>
            <b>Odkud vyjít</b>
          </div>
          <p style={{ margin: '2px 0 10px', fontSize: 11.5, color: 'var(--muted)' }}>
            Doporučené nástupy a cesty po značených trasách (výpočet ze značení KČT
            v OpenStreetMap). U vyznačených chat pocházejí nástupy z ověřovaného
            katalogu se zdroji; jinak z nejbližších středisek. Orientační, zatím bez
            převýšení a času — vždy ověřte aktuální stav cest a dopravy.
          </p>
          {typeof chata.lat === 'number' && typeof chata.lng === 'number' && (
            <div style={{ margin: '0 0 14px' }}>
              <MapaTrasy
                hut={{ nazev: chata.nazev, lat: chata.lat, lng: chata.lng }}
                trasy={pristupy.map((p) => ({ vychoziBod: p.vychoziBod, typ: p.typ, delkaKm: p.delkaKm, body: p.geometrie ?? [] }))}
              />
            </div>
          )}
          {pristupy.map((p, i) => {
            // Úseky slij podle barvy (přehlednější než dlouhá sekvence).
            const dleBarvy = new Map<string, number>()
            for (const u of p.useky) dleBarvy.set(u.znaceni, (dleBarvy.get(u.znaceni) ?? 0) + u.delkaKm)
            // Praktická linka (doprava + sezóna) a zdroje — jen u katalogových nástupů.
            const detaily = [p.doprava, p.sezona].filter((x): x is string => !!x && x !== 'neuvedeno')
            return (
              <div
                key={p.vychoziBod + i}
                style={{
                  padding: '9px 2px',
                  borderBottom: i === pristupy.length - 1 ? undefined : '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ flex: '1 1 150px', minWidth: 150 }}>
                    <b style={{ fontSize: 13 }}>{p.vychoziBod}</b>{' '}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{TYP_BODU_NAZEV[p.typ] ?? p.typ}</span>
                  </span>
                  <span className="num" style={{ fontWeight: 600 }}>{formatCislo(p.delkaKm)} km</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {[...dleBarvy.entries()].map(([znaceni, km], j) =>
                      znaceni in TRAIL_COLORS ? (
                        <TrailBlaze key={j} color={znaceni as keyof typeof TRAIL_COLORS}>
                          {`${TRAIL_COLORS[znaceni as keyof typeof TRAIL_COLORS].label} ${formatCislo(Math.round(km * 10) / 10)}`}
                        </TrailBlaze>
                      ) : (
                        <span key={j} style={{ fontSize: 11, color: 'var(--muted)' }}>
                          neznačeno {formatCislo(Math.round(km * 10) / 10)} km
                        </span>
                      ),
                    )}
                    {p.kRucniKontrole && (
                      <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>· část mimo značku</span>
                    )}
                  </span>
                </div>
                {(detaily.length > 0 || p.poznamka || (p.zdroje && p.zdroje.length > 0)) && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                    {detaily.length > 0 && <div>{detaily.join(' · ')}</div>}
                    {p.poznamka && <div>{p.poznamka}</div>}
                    {p.zdroje && p.zdroje.length > 0 && (
                      <div>
                        zdroj:{' '}
                        {p.zdroje.map((u, j) => (
                          <span key={j}>
                            {j > 0 && ', '}
                            <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                              {hostZUrl(u)}
                            </a>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      <div className="g2" style={{ marginTop: 18 }}>
        {razitko && (
          <div className="card" id="p-razitko" style={{ overflow: 'hidden' }}>
            <div className="lista red" style={{ borderRadius: 0, margin: 0 }}>
              <span className="n">{cisloSekce()}</span>
              <b>Razítko</b>
              <Link className="r" href="/razitkovnik">Sbírka →</Link>
            </div>
            <div className="bx">
              <RazitkoMoment
                slug={chata.slug}
                nazev={chata.nazev}
                pohori={oblast?.nazev}
                vyska={chata.vyska}
                otiskUrl={otisk?.url}
                otiskAlt={otisk?.alt}
                stitek={
                  // poctivost v UI: historický otisk nesmí dopadat bez označení
                  razitko.stav === 'historicke'
                    ? `historický otisk${razitko.platnostOd ? ` · ${razitko.platnostOd}` : ''}`
                    : undefined
                }
              >
                <div style={{ fontSize: 12.5 }}>
                  {razitko.kdeSeRazitkuje && <p style={{ marginTop: 9 }}>Razítkuje se: {razitko.kdeSeRazitkuje}</p>}
                  {razitko.potvrzeno && (
                    <p className="mn" style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 9 }}>
                      Doloženo {formatDatum(razitko.potvrzeno)}
                      {razitko.dolozil && <> · {razitko.dolozil}</>}
                    </p>
                  )}
                  {razitka.length > 1 && (
                    <p style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                      Historické varianty ({razitka.length - 1})
                    </p>
                  )}
                  {/* Poctivost + podmínka svolení: u převzatého otisku vždy viditelný zdroj. */}
                  {razitko.zpusobZiskani === 'prevzato-se-svolenim' && razitko.prevzeti?.zdrojUrl && (
                    <p className="mn" style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 9 }}>
                      Otisk převzat se svolením —{' '}
                      <a href={razitko.prevzeti.zdrojUrl} target="_blank" rel="noopener noreferrer nofollow">
                        {razitko.prevzeti.zdroj || 'zdroj'}
                      </a>
                    </p>
                  )}
                </div>
              </RazitkoMoment>
            </div>
          </div>
        )}

        {sousede.length > 0 && (
          <div className="card" id="p-sousede" style={{ overflow: 'hidden' }}>
            <div className="lista" style={{ borderRadius: 0, margin: 0 }}>
              <span className="n">{cisloSekce()}</span>
              <b>Sousední chaty</b>
              <span className="r">Přechody</span>
            </div>
            <div className="bx">
              {sousede.map((s, i) => {
                const soused = s.chata as Chata
                const sousedPath = chataPath(soused)
                const obsah = (
                  <>
                    {soused.nazev} {s.casPrechodMin != null && <b>{formatCas(s.casPrechodMin)}</b>}
                  </>
                )
                return sousedPath ? (
                  <Link className="chip" href={sousedPath} key={s.id ?? i}>
                    {obsah}
                  </Link>
                ) : (
                  <span className="chip" key={s.id ?? i}>
                    {obsah}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {maHistorii && (
        <section id="p-historie" style={{ marginTop: 18 }}>
          <div className="lista night">
            <span className="n">{cisloSekce()}</span>
            <b>Historie</b>
            {chata.rokVzniku && <span className="r">od {chata.rokVzniku}</span>}
          </div>
          {(chata.milniky?.length ?? 0) > 0 && (
            <div style={{ marginBottom: 10 }}>
              {chata.milniky!.map((m, i) => (
                <div
                  className="row"
                  style={{ gridTemplateColumns: '.2fr 1.8fr', ...(i === chata.milniky!.length - 1 ? { borderBottom: 0 } : {}) }}
                  key={m.id ?? i}
                >
                  <span className="num">{m.rok ?? '—'}</span>
                  <span>{m.udalost}</span>
                </div>
              ))}
            </div>
          )}
          {chata.historieText && (
            <div style={{ maxWidth: 720 }}>
              <RichText data={chata.historieText} />
            </div>
          )}
        </section>
      )}

      <div className="p-zdroje">
        {chata.rezervaceUrl && (
          <a className="btn blue" href={chata.rezervaceUrl}>
            Rezervovat nocleh
          </a>
        )}
        <TiskButton />
        {(chata.zdroje?.length ?? 0) > 0 && (
          <span className="src">Zdroje: {chata.zdroje!.map((z) => z.popis).join(' · ')}</span>
        )}
      </div>

      <div className="pfoot">
        turistickechaty.cz{path} — stránka z průvodce
        {overeni && <> · data ověřena {formatDatum(overeni.checked)}</>}
        {razitko?.potvrzeno && <> · razítko doloženo</>}
      </div>
    </div>
  )
}
