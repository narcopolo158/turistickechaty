import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import MapaChat, { type MapovaChata } from '@/components/MapaChat'
import { SectionBar, TrailBlaze } from '@/components/ui'
import { getIndexChat, getOblastBySlug, getSlugyOblasti, ZEME_SLUG } from '@/lib/chaty'
import { fotkaLanovky } from '@/lib/fotky-lanovek'
import { redakcniFotkyLanovek } from '@/lib/fotky-redakcni'
import { formatVyskaM } from '@/lib/katalog'
import { lanovkaPodleSlugu, lanovkySeSlugy } from '@/lib/lanovky'
import { pristupyOdBodu, zdrojPristupu, type Usek } from '@/lib/pristupy'
import { vrcholyOblasti } from '@/lib/vrcholy'

import '../../../../pohori.css'
import '../../../../mini.css'

export const revalidate = 3600

/**
 * Mini-stránka lanovky (zadání Michala 29. 7. 2026: „udělej i mini-stránky
 * lanovek — ideálně s fotkou lanovky + přehled chat a cílů nahoře i se
 * značením a obrázky").
 *
 * Stránka odpovídá na jedinou otázku: **co mi ta lanovka nahoře otevře.**
 * Proto nese tři seznamy, a všechny tři jsou z dat:
 *   — CHATY U HORNÍ STANICE (DATA-32, vzdušná čára do 1,5 km) i s fotkou;
 *   — ODTUD PĚŠKY: přístupové trasy, které u horní stanice ZAČÍNAJÍ,
 *     s pásovými značkami úseků a délkou (DATA-06). Trasy se hledají podle
 *     souřadnic konce trasy, ne podle názvu výchozího bodu — jména jsou
 *     v datech psaná různě, souřadnice ne;
 *   — CÍLE NAHOŘE: pojmenované vrcholy s výškou do 2,5 km od horní stanice
 *     (OSM). Vzdálenost je vzdušná a je to napsané.
 *
 * FOTKA: bere se z manifestu DATA-33 (Wikimedia Commons, jen licenčně čisté
 * snímky s doloženým autorem). Dokud běh neproběhne, stránka fotku prostě
 * nemá — placeholder nikde.
 */

const KANONICKA_ZEME = 'cesko'
const OKOLI_CILU_M = 2_500

type Params = { zeme: string; oblast: string; lanovka: string }

export async function generateStaticParams() {
  const slugy = await getSlugyOblasti()
  return slugy.flatMap((oblast) =>
    lanovkySeSlugy(oblast).map((l) => ({ zeme: KANONICKA_ZEME, oblast, lanovka: l.slug })),
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { oblast: oblastSlug, lanovka: slug } = await params
  const l = lanovkaPodleSlugu(oblastSlug, slug)
  if (!l) return {}
  const nazev = l.nazev ?? 'Lanová dráha'
  return {
    title: `${nazev} — lanovka | turistickechaty.cz`,
    description: `${l.typNazev}, ${Math.round(l.delkaM)} m${
      l.horni.vyska != null ? `, horní stanice ${l.horni.vyska} m` : ''
    }. Chaty a cíle u horní stanice, trasy se značením.`,
    alternates: { canonical: `/${KANONICKA_ZEME}/${oblastSlug}/lanovka/${slug}` },
  }
}

const ZNACKY = ['cervena', 'modra', 'zelena', 'zluta', 'cerna'] as const
type Znacka = (typeof ZNACKY)[number]
const jeZnacka = (z: string | null): z is Znacka => !!z && (ZNACKY as readonly string[]).includes(z)
const znackyTrasy = (useky: Usek[]): Znacka[] => {
  const out: Znacka[] = []
  for (const u of useky) {
    if (!jeZnacka(u.znaceni) || out[out.length - 1] === u.znaceni) continue
    out.push(u.znaceni)
  }
  return out
}

const format = (n: number): string => n.toLocaleString('cs-CZ')
const formatKm = (km: number | null): string =>
  km == null ? '—' : `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km`

const vzdalenostM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const stred = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  return Math.hypot((a.lng - b.lng) * Math.cos(stred) * 111_320, (a.lat - b.lat) * 110_540)
}

export default async function LanovkaPage({ params }: { params: Promise<Params> }) {
  const { zeme, oblast: oblastSlug, lanovka: slug } = await params
  if (!Object.values(ZEME_SLUG).includes(zeme)) notFound()
  if (zeme !== KANONICKA_ZEME) permanentRedirect(`/${KANONICKA_ZEME}/${oblastSlug}/lanovka/${slug}`)

  const [oblast, { index }] = await Promise.all([getOblastBySlug(oblastSlug), getIndexChat()])
  const l = lanovkaPodleSlugu(oblastSlug, slug)
  if (!oblast || !l) notFound()

  const nazev = l.nazev ?? 'Lanová dráha bez názvu v mapových datech'
  const foto = (await redakcniFotkyLanovek(oblastSlug)).get(slug) ?? fotkaLanovky(oblastSlug, slug)
  const chataDle = new Map(index.map((ch) => [ch.slug, ch]))
  const vsechnyPristupy = pristupyOdBodu(oblastSlug, l.horni)
  const pristupDle = new Map(vsechnyPristupy.map((p) => [p.slug, p]))
  // Chata u stanice, ke které odtud vede i doložená trasa, se NEOPAKUJE ve
  // druhém seznamu — dostane rovnou obojí: vzdušnou čáru i délku se značkami.
  const nahore = l.uHorniStanice.map((ch) => ({
    ...ch,
    chata: chataDle.get(ch.slug),
    pristup: pristupDle.get(ch.slug) ?? null,
  }))
  const vNahore = new Set(nahore.map((n) => n.slug))
  const pesky = vsechnyPristupy.filter((p) => !vNahore.has(p.slug))
  const vrcholy = (vrcholyOblasti(oblastSlug)?.vrcholy ?? [])
    .map((v) => ({ ...v, odstupM: Math.round(vzdalenostM(l.horni, v)) }))
    .filter((v) => v.odstupM <= OKOLI_CILU_M)
    .sort((a, b) => a.odstupM - b.odstupM)
    .slice(0, 6)

  const naMapu: MapovaChata[] = nahore
    .map((n) => n.chata)
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
        <span>{nazev}</span>
      </nav>

      <header className="mini-hero">
        <div>
          <p className="mini-kicker">Lanová dráha · {oblast.nazev}</p>
          <h1>{nazev}</h1>
          <p className="mini-perex">
            {l.typNazev}
            {l.useku > 1 && `, ${l.useku} úseky`} · {format(Math.round(l.delkaM))} m
            {l.dolni.vyska != null && l.horni.vyska != null && (
              <>
                {' '}
                · {formatVyskaM(l.dolni.vyska)} → {formatVyskaM(l.horni.vyska)}
              </>
            )}
            {l.prevyseniM != null && <> · převýšení ≈ {format(l.prevyseniM)} m</>}
          </p>
          <p className="pohori-mikropozn">
            <span aria-hidden="true">†</span> délka je půdorysná z geometrie dráhy, převýšení odhad
            z výškového modelu · <b>jízdní řád ani ceny neuvádíme</b> — mění se každou sezónu
            a doložené je nemáme
          </p>
        </div>
        {foto && (
          <figure className="mini-foto">
            {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (DATA-33) */}
            <img src={foto.url} alt={foto.popis ?? `${nazev} — pohled na lanovku`} loading="eager" />
            <figcaption>
              {/* Popiska = název souboru na Commons: snímek sám řekne, co je na něm,
                  takže případný přehmat výběru pozná čtenář i redakce hned. */}
              {foto.popis && <b className="foto-popis" title={foto.popis}>{foto.popis}</b>}
              foto {foto.autor}, {foto.licence}
              {foto.stranka && (
                <>
                  {' · '}
                  <a href={foto.stranka} target="_blank" rel="noopener noreferrer nofollow">
                    Wikimedia Commons
                  </a>
                </>
              )}
            </figcaption>
          </figure>
        )}
      </header>

      {nahore.length > 0 && (
        <section className="sec" aria-label="Chaty u horní stanice">
          <SectionBar num="01" title="Chaty u horní stanice" variant="red" />
          <ul className="mini-chaty">
            {nahore.map((n) => (
              <li key={n.slug} className="mini-chata">
                {n.chata?.heroUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload (480×320) */
                  <img className="mini-chata-foto" src={n.chata.heroUrl} alt={n.chata.heroAlt ?? ''} loading="lazy" />
                ) : (
                  <span className="mini-chata-foto mini-chata-foto--prazdna" aria-hidden="true" />
                )}
                <div className="mini-chata-text">
                  <b>{n.chata?.url ? <Link href={n.chata.url}>{n.nazev}</Link> : n.nazev}</b>
                  <span className="mini-chata-fakta">
                    {n.chata?.vyska != null && <>{formatVyskaM(n.chata.vyska)} · </>}
                    {format(n.vzdalenostM)} m vzdušnou čarou
                    {n.pristup?.delkaKm != null && <> · pěšky {formatKm(n.pristup.delkaKm)}</>}
                  </span>
                  {n.pristup && znackyTrasy(n.pristup.useky).length > 0 && (
                    <span className="mini-znacky">
                      {znackyTrasy(n.pristup.useky).map((z, i) => (
                        <TrailBlaze key={`${z}-${i}`} color={z} />
                      ))}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pesky.length > 0 && (
        <section className="sec" aria-label="Odtud pěšky">
          <SectionBar num={nahore.length ? '02' : '01'} title="Dál pěšky odtud" variant="red" />
          <ul className="mini-chaty">
            {pesky.map((p) => {
              const znacky = znackyTrasy(p.useky)
              const chata = chataDle.get(p.slug)
              return (
                <li key={p.slug} className="mini-chata">
                  {chata?.heroUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload (480×320) */
                    <img className="mini-chata-foto" src={chata.heroUrl} alt={chata.heroAlt ?? ''} loading="lazy" />
                  ) : (
                    <span className="mini-chata-foto mini-chata-foto--prazdna" aria-hidden="true" />
                  )}
                  <div className="mini-chata-text">
                    <b>{chata?.url ? <Link href={chata.url}>{p.nazev}</Link> : p.nazev}</b>
                    <span className="mini-chata-fakta">
                      {chata?.vyska != null && <>{formatVyskaM(chata.vyska)} · </>}
                      {formatKm(p.delkaKm)}
                    </span>
                    {znacky.length > 0 && (
                      <span className="mini-znacky">
                        {znacky.map((z, i) => (
                          <TrailBlaze key={`${z}-${i}`} color={z} />
                        ))}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="pohori-mikropozn">
            Trasy, které u horní stanice začínají (do 800 m od ní) — z pipeline přístupových tras.
            Značky pocházejí z OpenStreetMap, délka je půdorysná. Čas chůze neuvádíme.
          </p>
        </section>
      )}

      {vrcholy.length > 0 && (
        <section className="sec" aria-label="Cíle u horní stanice">
          <SectionBar
            num={nahore.length && pesky.length ? '03' : nahore.length || pesky.length ? '02' : '01'}
            title="Cíle u horní stanice"
            variant="blue"
          />
          <ul className="mini-cile">
            {vrcholy.map((v) => (
              <li key={v.nazev}>
                <b>{v.nazev}</b>
                <span>
                  {formatVyskaM(v.vyska)} · {format(v.odstupM)} m vzdušnou čarou
                </span>
              </li>
            ))}
          </ul>
          <p className="pohori-mikropozn">
            Pojmenované vrcholy s nadmořskou výškou z OpenStreetMap do 2,5 km od horní stanice.
            Vzdálenost je vzdušná čára, ne délka cesty.
          </p>
        </section>
      )}

      {naMapu.length > 0 && (
        <section className="sec" aria-label="Mapa">
          <SectionBar num="04" title="Chaty nahoře na mapě" variant="red" />
          <MapaChat chaty={naMapu} />
        </section>
      )}

      <p className="mini-zdroje">
        Zdroje: přehled lanovek (DATA-32, OpenStreetMap ODbL, výšky z výškového modelu) ·{' '}
        {zdrojPristupu(oblastSlug) ?? 'přístupové trasy DATA-06'} · vrcholy OpenStreetMap
      </p>

      <p className="mini-zpet">
        <Link href={`/${KANONICKA_ZEME}/${oblastSlug}`}>◂ zpět na {oblast.nazev}</Link>
      </p>
    </div>
  )
}
