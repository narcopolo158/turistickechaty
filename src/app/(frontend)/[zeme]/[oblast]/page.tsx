import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import Mapa3D from '@/components/Mapa3D'
import { SectionBar } from '@/components/ui'
import { getIndexChat, getOblastBySlug, ZEME_SLUG } from '@/lib/chaty'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'
import { zanikleChaty } from '@/lib/zanikle'

import '../../pohori.css'

export const revalidate = 3600

/**
 * Stránka pohoří (F1d, 1. průchod — zadání Michala 28. 7. 2026: „založ
 * stránku pohoří Krkonoše s perfektně zasazenou 3D mapou"): breadcrumb →
 * hero s kurátorskou charakteristikou (z kolekce Oblasti, se zdrojovou
 * popiskou) a 4 stat-tiles s mikro-zdroji → 01 3D mapa (SKUTEČNÁ aplikace
 * z pipeline DATA-28 — výškopis Mapy.com Elevation, ne malovaný placeholder
 * z návrhu; poster→klik, three.js až po kliknutí) → 02 chaty oblasti (CTA
 * katalog) → 03 top cíle. Žebříčky, střediska, vitrína, FAQ a přesahy
 * (sekce handoffu 03–09) přijdou dalšími průchody F1d.
 *
 * Kanonická cesta pohoří je /cesko/krkonose (Krkonoše jsou přeshraniční,
 * jedna stránka) — /polsko/krkonose sem přesměruje natrvalo.
 */

const KANONICKA_ZEME = 'cesko'

export async function generateStaticParams() {
  return [{ zeme: KANONICKA_ZEME, oblast: 'krkonose' }]
}

type Params = { zeme: string; oblast: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { oblast: oblastSlug } = await params
  const oblast = await getOblastBySlug(oblastSlug)
  if (!oblast) return {}
  return {
    title: `${oblast.nazev} — horské chaty | turistickechaty.cz`,
    description: oblast.charakteristika ?? `Průvodce horskými chatami: ${oblast.nazev}.`,
    alternates: { canonical: `/${KANONICKA_ZEME}/${oblastSlug}` },
  }
}

export default async function PohoriPage({ params }: { params: Promise<Params> }) {
  const { zeme, oblast: oblastSlug } = await params
  if (!Object.values(ZEME_SLUG).includes(zeme)) notFound()
  if (zeme !== KANONICKA_ZEME) permanentRedirect(`/${KANONICKA_ZEME}/${oblastSlug}`)

  const [oblast, { index }] = await Promise.all([getOblastBySlug(oblastSlug), getIndexChat()])
  if (!oblast) notFound()

  const vOblasti = index.filter((ch) => ch.oblastSlug === oblastSlug)
  if (vOblasti.length === 0 && oblastSlug !== 'krkonose') notFound()
  const zanikle = zanikleChaty()
  const sRazitkem = vOblasti.filter((ch) => ch.razitko).length
  const vysky = vOblasti.map((ch) => ch.vyska).filter((v): v is number => v != null)
  const vyskaMin = vysky.length ? Math.min(...vysky) : null
  const vyskaMax = vysky.length ? Math.max(...vysky) : null
  const posledni = vOblasti
    .map((ch) => ch.checked)
    .filter((c): c is string => c != null)
    .sort()
    .at(-1)

  const hora = oblast.nejvyssiHora
  const topCile = (oblast.topCile ?? []).filter((c) => c.nazev)
  const chataUrl = (slug: string | null | undefined): string | null => {
    if (!slug) return null
    return vOblasti.find((ch) => ch.slug === slug)?.url ?? null
  }

  return (
    <div className="wrap pohori">
      <nav className="pohori-breadcrumb mn" aria-label="Drobečková navigace">
        <Link href="/">Česko</Link> / <span>{oblast.nazev}</span>
      </nav>

      <header className="pohori-hero">
        <div className="pohori-hero-text">
          <h1>{oblast.nazev}</h1>
          {oblast.charakteristika && <p className="pohori-charakteristika">{oblast.charakteristika}</p>}
          <p className="pohori-mikropozn">
            <span aria-hidden="true">†</span> charakteristika oblasti — kurátorský text se zdroji v datech oblasti
          </p>
        </div>
        <div className="pohori-tiles">
          {hora?.nazev && hora?.vyska != null && (
            <div className="pohori-tile">
              <b>{formatVyskaM(hora.vyska)}</b>
              <span>{hora.nazev} — nejvyšší hora</span>
              <i>zdroj v datech oblasti · ověření ČÚZK: DATA-04</i>
            </div>
          )}
          <div className="pohori-tile">
            <b>{vOblasti.length}</b>
            <span>chat v průvodci</span>
            <i>z naší databáze</i>
          </div>
          {vyskaMin != null && vyskaMax != null && (
            <div className="pohori-tile">
              <b>
                {formatVyskaM(vyskaMin).replace(' m', '')}–{formatVyskaM(vyskaMax)}
              </b>
              <span>rozpětí výšek chat</span>
              <i>jen doložené výšky ({vysky.length} z {vOblasti.length})</i>
            </div>
          )}
          <div className="pohori-tile">
            <b>{zanikle.length}</b>
            <span>zaniklých v Atlasu</span>
            <i>
              <Link href="/zanikle">Atlas zaniklých</Link>
            </i>
          </div>
        </div>
      </header>

      <section className="sec" aria-label="3D mapa">
        <SectionBar num="01" title="3D mapa Krkonoš" variant="red" />
        <Mapa3D posterUrl="/3d/poster.jpg" appUrl="/3d/krkonose.html" />
      </section>

      <section className="sec" aria-label="Chaty oblasti">
        <SectionBar num="02" title="Chaty oblasti" variant="red" />
        <div className="pohori-chaty-blok">
          <p>
            Vedeme <b>{vOblasti.length} profilů</b> — od hřebenových bud po schroniska na polské straně
            ({sRazitkem} s doloženým razítkem{posledni ? `, naposledy ověřeno ${formatCheckedDatum(posledni)}` : ''}).
            Filtrování podle stavu, služeb a razítek běží v katalogu.
          </p>
          <div className="pohori-chaty-cta">
            <Link href="/chaty" className="pohori-cta-red">
              Otevřít katalog chat ▸
            </Link>
            <Link href="/chaty?view=mapa" className="pohori-cta-ghost">
              Mapa chat ▸
            </Link>
          </div>
        </div>
      </section>

      {topCile.length > 0 && (
        <section className="sec" aria-label="Top cíle">
          <SectionBar num="03" title="Top cíle" variant="red" />
          <div className="pohori-cile">
            {topCile.map((cil) => {
              const url = chataUrl(cil.nejblizChataSlug)
              const nazevChaty = vOblasti.find((ch) => ch.slug === cil.nejblizChataSlug)?.nazev
              return (
                <div key={cil.nazev} className="pohori-cil">
                  <b>{cil.nazev}</b>
                  {cil.veta && <p>{cil.veta}</p>}
                  {url && nazevChaty && (
                    <Link href={url} className="pohori-cil-chata">
                      Nejblíž: {nazevChaty} ▸
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
          <p className="pohori-mikropozn">kurátorský výběr s vazbou na doložené profily — žádná hodnocení ani ceny</p>
        </section>
      )}
    </div>
  )
}
