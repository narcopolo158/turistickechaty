import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import MapaChat, { type MapovaChata } from '@/components/MapaChat'
import { SectionBar, TrailBlaze } from '@/components/ui'
import { getIndexChat, getOblastBySlug, getSlugyOblasti, getStrediskaOblasti, ZEME_SLUG } from '@/lib/chaty'
import { fotkaStrediska } from '@/lib/fotky-stredisek'
import { formatVyskaM } from '@/lib/katalog'
import { lanovkySeSlugy } from '@/lib/lanovky'
import { pristupyStrediska, zdrojPristupu, type Usek } from '@/lib/pristupy'

import '../../../../pohori.css'
import '../../../../mini.css'

export const revalidate = 3600

/**
 * Mini-stránka střediska (F1e — zadání Michala 29. 7. 2026: „udělej
 * mini-stránky středisek").
 *
 * Proč vůbec vzniká: karta střediska na stránce pohoří je PŘEHLED a zkracuje
 * dlouhé věty na tři řádky. Doložené znění (perex, věta o lanovce i s prameny)
 * ale nikam zmizet nesmí — vypisuje se tady, celé.
 *
 * Co stránka umí navíc oproti kartě: seznam chat dostupných odtud s délkou
 * túry a PÁSOVÝMI ZNAČKAMI úseků (DATA-06), mapu těch chat a odkazy na
 * lanovky, které z místa vyjíždějí.
 *
 * POCTIVOST: všechno je z dat. Kde nemáme spočítané přístupy, stojí pomlčka
 * a věta proč — ne nula. Délka je půdorysná z geometrie tras, ne měřená
 * kolečkem, a značky pocházejí z OSM; obojí je napsané v patičce.
 */

const KANONICKA_ZEME = 'cesko'

type Params = { zeme: string; oblast: string; stredisko: string }

export async function generateStaticParams() {
  const slugy = await getSlugyOblasti()
  const out: { zeme: string; oblast: string; stredisko: string }[] = []
  for (const oblast of slugy) {
    for (const s of await getStrediskaOblasti(oblast)) {
      if (s.slug) out.push({ zeme: KANONICKA_ZEME, oblast, stredisko: s.slug })
    }
  }
  return out
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { oblast: oblastSlug, stredisko: slug } = await params
  const s = (await getStrediskaOblasti(oblastSlug)).find((x) => x.slug === slug)
  if (!s) return {}
  return {
    title: `${s.nazev} — východisko túr | turistickechaty.cz`,
    description:
      s.perex ??
      `Chaty dostupné z místa ${s.nazev}, přístupové trasy se značením a lanovky v okolí.`,
    alternates: { canonical: `/${KANONICKA_ZEME}/${oblastSlug}/stredisko/${slug}` },
  }
}

/** Barvy značek z dat DATA-06 → komponenta pásové značky. */
const ZNACKY = ['cervena', 'modra', 'zelena', 'zluta', 'cerna'] as const
type Znacka = (typeof ZNACKY)[number]
const jeZnacka = (z: string | null): z is Znacka => !!z && (ZNACKY as readonly string[]).includes(z)

/** Značky v pořadí, v jakém se na trase střídají — opakování se slučuje. */
const znackyTrasy = (useky: Usek[]): Znacka[] => {
  const out: Znacka[] = []
  for (const u of useky) {
    if (!jeZnacka(u.znaceni)) continue
    if (out[out.length - 1] === u.znaceni) continue
    out.push(u.znaceni)
  }
  return out
}

const formatKm = (km: number | null): string =>
  km == null ? '—' : `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km`

export default async function StrediskoPage({ params }: { params: Promise<Params> }) {
  const { zeme, oblast: oblastSlug, stredisko: slug } = await params
  if (!Object.values(ZEME_SLUG).includes(zeme)) notFound()
  if (zeme !== KANONICKA_ZEME) permanentRedirect(`/${KANONICKA_ZEME}/${oblastSlug}/stredisko/${slug}`)

  const [oblast, strediska, { index }] = await Promise.all([
    getOblastBySlug(oblastSlug),
    getStrediskaOblasti(oblastSlug),
    getIndexChat(),
  ])
  const s = strediska.find((x) => x.slug === slug)
  if (!oblast || !s) notFound()

  const foto = fotkaStrediska(oblastSlug, slug)
  const pristupy = pristupyStrediska(oblastSlug, s.nazev)
  const chataDle = new Map(index.map((ch) => [ch.slug, ch]))
  const radky = pristupy.map((p) => ({ ...p, chata: chataDle.get(p.slug) }))
  const delky = pristupy.map((p) => p.delkaKm).filter((d): d is number => d != null)

  // Lanovky, které z místa vyjíždějí: dolní stanice do 2,5 km od obce.
  const lanovky = s.lat != null && s.lng != null
    ? lanovkySeSlugy(oblastSlug).filter((l) => {
        const stred = ((s.lat! + l.dolni.lat) / 2) * (Math.PI / 180)
        const dx = (s.lng! - l.dolni.lng) * Math.cos(stred) * 111_320
        const dy = (s.lat! - l.dolni.lat) * 110_540
        return Math.hypot(dx, dy) < 2_500
      })
    : []

  const naMapu: MapovaChata[] = radky
    .map((r) => r.chata)
    .filter((ch) => ch != null && ch.lat != null && ch.lng != null && ch.url)
    .map((ch) => ({
      slug: ch!.slug,
      nazev: ch!.nazev,
      vyska: ch!.vyska,
      stav: (ch!.stav as MapovaChata['stav']) ?? null,
      lat: ch!.lat!,
      lng: ch!.lng!,
      url: ch!.url!,
      typ: ch!.typ,
    }))

  return (
    <div className="wrap mini">
      <nav className="pohori-breadcrumb mn" aria-label="Drobečková navigace">
        <Link href="/">Česko</Link> / <Link href={`/${KANONICKA_ZEME}/${oblastSlug}`}>{oblast.nazev}</Link> /{' '}
        <span>{s.nazev}</span>
      </nav>

      <header className="mini-hero">
        <div>
          <p className="mini-kicker">
            Východisko túr · {oblast.nazev}
            {s.zeme === 'pl' && <span className="pohori-tag-pl">PL</span>}
          </p>
          <h1>{s.nazev}</h1>
          {s.perex && <p className="mini-perex">{s.perex}</p>}
          <p className="pohori-mikropozn">
            <span aria-hidden="true">†</span> jen doložitelné údaje — co nemáme spočítané nebo
            ověřené, tu nestojí
          </p>
        </div>
        {foto && (
          <figure className="mini-foto">
            {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (DATA-33) */}
            <img src={foto.url} alt={`${s.nazev} — pohled na středisko`} loading="eager" />
            <figcaption>
              foto {foto.autor}, {foto.licence} ·{' '}
              <a href={foto.stranka} target="_blank" rel="noopener noreferrer nofollow">
                Wikimedia Commons
              </a>
            </figcaption>
          </figure>
        )}
      </header>

      <div className="mini-tiles">
        <div className="pohori-tile">
          <b>{pristupy.length || '—'}</b>
          <span>{pristupy.length === 1 ? 'chata odtud' : 'chat odtud'}</span>
          <i>doložené přístupové trasy (DATA-06)</i>
        </div>
        {delky.length > 0 && (
          <>
            <div className="pohori-tile">
              <b>{formatKm(Math.min(...delky))}</b>
              <span>nejbližší chata</span>
              <i>půdorysná délka trasy</i>
            </div>
            <div className="pohori-tile">
              <b>{formatKm(Math.max(...delky))}</b>
              <span>nejvzdálenější</span>
              <i>z doložených tras odtud</i>
            </div>
          </>
        )}
        <div className="pohori-tile">
          <b>{lanovky.length || '—'}</b>
          <span>{lanovky.length === 1 ? 'lanovka v místě' : 'lanovek v místě'}</span>
          <i>dráhy s dolní stanicí do 2,5 km</i>
        </div>
      </div>

      {s.lanovka && (
        <section className="sec" aria-label="Lanovka">
          <SectionBar num="01" title="Lanovka odtud" variant="blue" />
          <p className="mini-text">{s.lanovka}</p>
          {lanovky.length > 0 && (
            <ul className="mini-lanovky">
              {lanovky.map((l) => (
                <li key={l.id}>
                  <Link href={l.url}>{l.nazev ?? 'dráha bez názvu v mapových datech'}</Link>{' '}
                  <span className="lanovky-tise">
                    {l.typNazev}
                    {l.horni.vyska != null && `, nahoru do ${formatVyskaM(l.horni.vyska)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {radky.length > 0 && (
        <section className="sec" aria-label="Chaty dostupné odtud">
          <SectionBar num={s.lanovka ? '02' : '01'} title="Chaty dostupné odtud" variant="red" />
          <ul className="mini-chaty">
            {radky.map((r) => {
              const znacky = znackyTrasy(r.useky)
              return (
                <li key={r.slug} className="mini-chata">
                  {r.chata?.heroUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload (480×320) */
                    <img className="mini-chata-foto" src={r.chata.heroUrl} alt={r.chata.heroAlt ?? ''} loading="lazy" />
                  ) : (
                    <span className="mini-chata-foto mini-chata-foto--prazdna" aria-hidden="true" />
                  )}
                  <div className="mini-chata-text">
                    <b>
                      {r.chata?.url ? <Link href={r.chata.url}>{r.nazev}</Link> : r.nazev}
                    </b>
                    <span className="mini-chata-fakta">
                      {r.chata?.vyska != null && <>{formatVyskaM(r.chata.vyska)} · </>}
                      {formatKm(r.delkaKm)}
                      {r.podilNeznacenychProc != null && r.podilNeznacenychProc > 0 && (
                        <> · {Math.round(r.podilNeznacenychProc)} % bez značky</>
                      )}
                    </span>
                    {znacky.length > 0 && (
                      <span className="mini-znacky">
                        {znacky.map((z, i) => (
                          <TrailBlaze key={`${z}-${i}`} color={z} />
                        ))}
                      </span>
                    )}
                    {/* Upřesnění výchozího bodu se vypisuje, jen když opravdu
                        upřesňuje — „z bodu: Pec pod Sněžkou" na stránce Pece
                        je šum, kdežto „…, parkoviště P1" je informace. */}
                    {r.vychoziBod.trim().toLocaleLowerCase('cs') !== s.nazev.trim().toLocaleLowerCase('cs') && (
                      <span className="mini-chata-odkud">z bodu: {r.vychoziBod}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="pohori-mikropozn">
            Délka je půdorysná z geometrie tras (ne měřená), značky z OpenStreetMap. U chaty
            s víc trasami odtud se ukazuje ta nejkratší. Čas chůze neuvádíme — doložený ho nemáme.
          </p>
        </section>
      )}

      {/* Mapa ukazuje ZASAZENÍ MÍSTA, ne rozptyl cílů (Michal 29. 7. 2026:
          „spíš bych tam dal mapu zasazení samotného střediska"). Středisko
          proto dostane vlastní značku — kapku — a mapa se vystředí na ně;
          chaty v okolí zůstávají jako kontext, ne jako téma. Kdyby se výřez
          jako dřív přizpůsobil všem cílům, obec by se v něm ztratila: u Pece
          se rozpětí tras táhne přes deset kilometrů. */}
      {s.lat != null && s.lng != null && (
        <section className="sec" aria-label="Mapa zasazení střediska">
          <SectionBar num={s.lanovka ? '03' : '02'} title={`Kde ${s.nazev} leží`} variant="red" />
          <MapaChat
            chaty={naMapu}
            misto={{ nazev: s.nazev, lat: s.lat, lng: s.lng }}
            zoom={13}
          />
          <p className="pohori-mikropozn">
            Střed mapy je bod obce z katalogu výchozích bodů; kolečka jsou chaty průvodce v okolí
            — klikem se otevře profil. Podklad Mapy.com „outdoor“.
          </p>
        </section>
      )}

      <p className="mini-zdroje">
        Zdroje: data střediska (`data/strediska/{oblastSlug}/{slug}.yaml`) ·{' '}
        {zdrojPristupu(oblastSlug) ?? 'přístupové trasy DATA-06'}
      </p>

      <p className="mini-zpet">
        <Link href={`/${KANONICKA_ZEME}/${oblastSlug}`}>◂ zpět na {oblast.nazev}</Link>
      </p>
    </div>
  )
}
