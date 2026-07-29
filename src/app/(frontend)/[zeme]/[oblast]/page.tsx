import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import Mapa3D from '@/components/Mapa3D'
import PohoriChatySeznam from '@/components/PohoriChatySeznam'
import VitrinaSberatelstvi, { type VitrinaOtisk } from '@/components/VitrinaSberatelstvi'
import PohoriHeroFoto from '@/components/PohoriHeroFoto'
import { SectionBar } from '@/components/ui'
import { getIndexChat, getOblastBySlug, getPocetPublikovanychRazitek, getSlugyOblasti, getStrediskaOblasti, ZEME_SLUG } from '@/lib/chaty'
import { znamkyVizitkyChaty } from '@/lib/znamky-vizitky'
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
 * z návrhu; poster→klik, three.js až po kliknutí) → 02 chaty oblasti
 * (tabulkové řádky s chips filtry) → 03 žebříčky (jen doložené hodnoty)
 * → 04 střediska → 05 top cíle → 06 zaniklé → 07 vitrína sběratelství
 * (reálné otisky se svolením) → 08 FAQ (odpovědi z dat + JSON-LD)
 * → 09 přesahy. Číslování dle handoffu; mini-stránky středisek = F1e.
 *
 * Kanonická cesta pohoří je /cesko/krkonose (Krkonoše jsou přeshraniční,
 * jedna stránka) — /polsko/krkonose sem přesměruje natrvalo.
 */

const KANONICKA_ZEME = 'cesko'

export async function generateStaticParams() {
  // Oblasti se berou z databáze — nové pohoří dostane stránku samo,
  // jakmile ho seed nahraje (rozhodnutí Michala 28. 7. 2026: Jizerské hory).
  const slugy = await getSlugyOblasti()
  return slugy.map((oblast) => ({ zeme: KANONICKA_ZEME, oblast }))
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

  const [oblast, { index }, strediska, pocetRazitek] = await Promise.all([
    getOblastBySlug(oblastSlug),
    getIndexChat(),
    getStrediskaOblasti(oblastSlug),
    getPocetPublikovanychRazitek(oblastSlug),
  ])
  if (!oblast) notFound()

  const vOblasti = index.filter((ch) => ch.oblastSlug === oblastSlug)
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

  // 3D mapa se ukáže jen tam, kde ji pipeline DATA-28 opravdu vyrobila —
  // jinak by sekce slibovala něco, co neexistuje.
  const ma3d = existsSync(join(process.cwd(), 'public', '3d', `${oblastSlug}.html`))
  const poster3d = existsSync(join(process.cwd(), 'public', '3d', `poster-${oblastSlug}.jpg`))
    ? `/3d/poster-${oblastSlug}.jpg`
    : '/3d/poster.jpg'

  const hora = oblast.nejvyssiHora
  const topCile = (oblast.topCile ?? []).filter((c) => c.nazev)
  const chataUrl = (slug: string | null | undefined): string | null => {
    if (!slug) return null
    return vOblasti.find((ch) => ch.slug === slug)?.url ?? null
  }

  // Žebříčky (handoff 03): jen doložené hodnoty, poznámka o doloženosti
  // v hlavičce každé karty. Zaniklá se značí †, nevyřazuje se.
  const nejvyse = [...vOblasti].filter((ch) => ch.vyska != null).sort((a, b) => b.vyska! - a.vyska!).slice(0, 5)
  const sRokem = vOblasti.filter((ch) => ch.nejstarsiRok != null)
  const nejstarsi = [...sRokem].sort((a, b) => a.nejstarsiRok! - b.nejstarsiRok!).slice(0, 5)
  const sKapacitou = vOblasti.filter((ch) => ch.kapacita != null)
  const nejvetsi = [...sKapacitou].sort((a, b) => b.kapacita! - a.kapacita!).slice(0, 5)

  // Zaniklé (handoff 06): 2 příběhy s doloženým rokem i příčinou.
  const zaniklePribehy = zanikle.filter((z) => z.rokZaniku && z.pricinaZaniku).slice(0, 2)

  // Vitrína (handoff 07): kurátorská trojice reálných otisků (fallback první
  // s doloženým skenem), známka se skutečným číslem z DATA-10, poctivé počty.
  const kuratorske = ['lucni-bouda', 'vyrovka', 'schronisko-samotnia']
  const sOtiskem = vOblasti.filter((ch) => ch.otiskUrl != null)
  const vitrinoveChaty = [
    ...kuratorske.map((slug) => sOtiskem.find((ch) => ch.slug === slug)).filter((ch) => ch != null),
    ...sOtiskem,
  ]
  const vitrinaOtisky: VitrinaOtisk[] = [...new Map(vitrinoveChaty.map((ch) => [ch.slug, ch])).values()]
    .slice(0, 3)
    .map((ch) => ({
      url: ch.otiskUrl!,
      alt: ch.otiskAlt ?? `Otisk razítka — ${ch.nazev}`,
      nazev: ch.nazev,
      vyska: ch.vyska,
    }))
  const znamkaLucni = znamkyVizitkyChaty('lucni-bouda').find((p) => p.system === 'znamka')
  const lucniIndex = vOblasti.find((ch) => ch.slug === 'lucni-bouda')
  const vitrinaZnamka = znamkaLucni
    ? { cislo: znamkaLucni.cislo, nazev: 'Luční bouda', vyska: lucniIndex?.vyska ?? null }
    : null

  // FAQ (handoff 08): odpovědi GENEROVANÉ z dat + JSON-LD FAQPage.
  const pocetPl = vOblasti.filter((ch) => ch.zeme === 'pl').length
  const faq: { q: string; a: string }[] = [
    {
      q: 'Kolik chat průvodce vede?',
      a: `V oblasti ${oblast.nazev} vedeme ${vOblasti.length} profilů — ${vOblasti.length - pocetPl} na české a ${pocetPl} na polské straně. K tomu ${zanikle.length} zaniklých chat v samostatném Atlasu.`,
    },
    {
      q: 'Co znamená „ověřeno" u údajů?',
      a: 'Ověřeno znamená, že údaj potvrdil člověk redakce vlastní kontrolou — telefonátem nebo návštěvou. Údaje převzaté z webů a katalogů vedeme se zdrojem a datem poslední kontroly, ale bez značky ověření; nic si nedomýšlíme.',
    },
    {
      q: 'Kde seženu otisky razítek?',
      a: `${sRazitkem} chat má doložené razítko — otisky si prohlédneš na profilech a sbíráš je do svého razítkovníku, který zůstává ve tvém prohlížeči. Převzaté skeny neseme se svolením razitkuj.cz.`,
    },
    {
      q: 'Jsou v průvodci i objekty za hranicí?',
      a: `Ano. ${oblast.nazev} vedeme jako jedno přeshraniční pohoří — ${pocetPl} objektů na polské straně patří do téhož katalogu, s původními místními názvy.`,
    },
    {
      q: 'Chybí tu chata, kterou znám. Proč?',
      a: 'Vedeme jen doložené profily: každý údaj má zdroj a datum kontroly. Kandidáty prověřujeme postupně (křížové ověření webů, katalogů a OSM) — objekt bez doložené veřejné služby do průvodce nezařazujeme.',
    },
  ]
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="wrap pohori">
      <nav className="pohori-breadcrumb mn" aria-label="Drobečková navigace">
        <Link href="/">Česko</Link> / <span>{oblast.nazev}</span>
      </nav>

      <PohoriHeroFoto foto={oblast.heroFoto} />

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

      {ma3d && (
        <section className="sec" aria-label="3D mapa">
          <SectionBar num="01" title={`3D mapa — ${oblast.nazev}`} variant="red" />
          <Mapa3D posterUrl={poster3d} appUrl={`/3d/${oblastSlug}.html`} />
        </section>
      )}

      {vOblasti.length === 0 && (
        <section className="sec" aria-label="Stav oblasti">
          <div className="pohori-presah">
            <b>Oblast připravujeme</b>
            <p>
              {oblast.nazev} jsou další pohoří v pořadí — kandidáty sbíráme z OpenStreetMap
              a křížově ověřujeme; profily zveřejníme, až budou doložené. Radši prázdno než
              nepodložený seznam. Máš tip na chatu, otisk razítka nebo fotku?{' '}
              <Link href="/prispet">Pošli je do sbírky ▸</Link>
            </p>
          </div>
        </section>
      )}

      {vOblasti.length > 0 && (
      <section className="sec" aria-label="Chaty oblasti">
        <SectionBar num="02" title="Chaty oblasti" variant="red" />
        <p className="pohori-uvodka">
          Vedeme <b>{vOblasti.length} profilů</b> — od hřebenových bud po schroniska na polské straně
          ({sRazitkem} s doloženým razítkem{posledni ? `, naposledy ověřeno ${formatCheckedDatum(posledni)}` : ''}).
        </p>
        <PohoriChatySeznam index={vOblasti} />
      </section>
      )}

      {vOblasti.length > 0 && (
      <section className="sec" id="zebricky" aria-label="Žebříčky">
        <SectionBar num="03" title="Žebříčky" variant="red" />
        <div className="pohori-zebricky">
          <div className="pohori-zebricek">
            <div className="pohori-zebricek-hlava">
              <b>Nejvýše položené</b>
              <span>{vysky.length} z {vOblasti.length} chat má doloženou výšku</span>
            </div>
            {nejvyse.map((ch, i) => (
              <Link key={ch.slug} href={ch.url ?? '/chaty'} className="pohori-zebricek-radek">
                <i>{i + 1}</i>
                <span>
                  {ch.nazev}
                  {ch.stav === 'zanikla' && <em title="zaniklá"> †</em>}
                </span>
                <b>{formatVyskaM(ch.vyska)}</b>
              </Link>
            ))}
          </div>
          <div className="pohori-zebricek">
            <div className="pohori-zebricek-hlava">
              <b>Nejstarší doložený rok</b>
              <span>{sRokem.length} z {vOblasti.length} chat má rok z milníků</span>
            </div>
            {nejstarsi.map((ch, i) => (
              <Link key={ch.slug} href={ch.url ?? '/chaty'} className="pohori-zebricek-radek">
                <i>{i + 1}</i>
                <span>
                  {ch.nazev}
                  {ch.stav === 'zanikla' && <em title="zaniklá"> †</em>}
                </span>
                <b>{ch.nejstarsiRok}</b>
              </Link>
            ))}
            <p className="pohori-zebricek-pozn">nejstarší doložený rok v historii profilu — netvrdíme založení</p>
          </div>
          <div className="pohori-zebricek">
            <div className="pohori-zebricek-hlava">
              <b>Největší kapacita</b>
              <span>{sKapacitou.length} z {vOblasti.length} chat kapacitu uvádí</span>
            </div>
            {nejvetsi.map((ch, i) => (
              <Link key={ch.slug} href={ch.url ?? '/chaty'} className="pohori-zebricek-radek">
                <i>{i + 1}</i>
                <span>
                  {ch.nazev}
                  {ch.stav === 'zanikla' && <em title="zaniklá"> †</em>}
                </span>
                <b>{ch.kapacita} lůžek</b>
              </Link>
            ))}
            <p className="pohori-zebricek-pozn">kapacity dle provozovatelů (verified:false) — chaty bez údaje v žebříčku nejsou</p>
          </div>
        </div>
      </section>
      )}

      {strediska.length > 0 && (
        <section className="sec" aria-label="Střediska">
          <SectionBar num="04" title="Střediska" variant="red" />
          <div className="pohori-strediska">
            {strediska.map((s) => (
              <div key={s.slug} className="pohori-stredisko">
                <b>{s.nazev}</b>
                {s.zeme === 'pl' && <span className="pohori-tag-pl">PL</span>}
                {s.perex && <p>{s.perex}</p>}
              </div>
            ))}
          </div>
          <p className="pohori-mikropozn">
            výchozí body túr ke chatám · počty dostupných chat doplní přepočet přístupových tras (DATA-06),
            výšky obcí ověření ČÚZK (DATA-04) · mini-stránky středisek připravujeme
          </p>
        </section>
      )}

      {topCile.length > 0 && (
        <section className="sec" aria-label="Top cíle">
          <SectionBar num="05" title="Top cíle" variant="red" />
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

      <section className="sec" aria-label="Zaniklé chaty">
        <SectionBar num="06" title="Z Atlasu zaniklých" variant="red" />
        <div className="pohori-zanikle">
          <div className="pohori-zanikle-karta">
            <div className="pohori-zanikle-hlava">
              <b>Boudy, které už nestojí</b>
              <span>{zanikle.length} příběhů</span>
            </div>
            {zaniklePribehy.map((z) => (
              <p key={z.slug} className="pohori-zanikle-pribeh">
                <b>{z.nazev}</b> · zanikla {z.rokZaniku} — {z.pricinaZaniku}
              </p>
            ))}
            <Link href="/zanikle" className="pohori-cta-ghost svetly">
              Otevřít Atlas zaniklých ▸
            </Link>
          </div>
        </div>
      </section>

      {(vitrinaOtisky.length > 0 || sRazitkem > 0) && (
      <section className="sec" aria-label="Sběratelství">
        <SectionBar num="07" title={`Sběratelství — vitrína ${oblast.nazev}`} variant="red" />
        <VitrinaSberatelstvi
          otisky={vitrinaOtisky}
          znamka={vitrinaZnamka}
          pocty={{
            sRazitkem,
            otisku: pocetRazitek,
            seZnamkou: vOblasti.filter((ch) => ch.znamka).length,
            bezRazitka: vOblasti.length - sRazitkem,
          }}
        />
        <p className="pohori-mikropozn">
          otisky se svolením razitkuj.cz · známka dle oficiálního seznamu vydavatele · počty z databáze
        </p>
      </section>
      )}

      <section className="sec" aria-label="Časté otázky">
        <SectionBar num="08" title="Časté otázky" variant="red" />
        <div className="pohori-faq">
          {faq.map((f) => (
            <details key={f.q} className="pohori-faq-polozka">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="pohori-mikropozn">odpovědi se počítají z databáze průvodce — čísla nikdy nepíšeme ručně</p>
      </section>

      {oblastSlug === 'krkonose' && (
      <section className="sec" aria-label="Přesahy">
        <SectionBar num="09" title="Přesahy pohoří" variant="red" />
        <div className="pohori-presah">
          <b>Podkrkonoší</b>
          <p>
            Raisova chata na Zvičině leží už v Podkrkonoší — vedeme ji v krkonošském fondu s poctivou
            poznámkou o poloze. Další kandidáty přesahových oblastí sbíráme; samostatná oblast vznikne,
            až jich bude dost na vlastní stránku.
          </p>
        </div>
      </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  )
}
