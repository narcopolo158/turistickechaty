import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import Mapa3D from '@/components/Mapa3D'
import PohoriChatySeznam from '@/components/PohoriChatySeznam'
import VitrinaSberatelstvi, { type VitrinaOtisk } from '@/components/VitrinaSberatelstvi'
import LanovkySeznam from '@/components/LanovkySeznam'
import PohoriHero from '@/components/PohoriHero'
import FotoPas from '@/components/FotoPas'
import FotoVlepena from '@/components/FotoVlepena'
import RezHrebenem, { type BodChaty } from '@/components/RezHrebenem'
import StrediskoKarta from '@/components/StrediskoKarta'
import { SectionBar } from '@/components/ui'
import { getIndexChat, getOblastBySlug, getPocetPublikovanychRazitek, getSlugyOblasti, getStrediskaOblasti, ZEME_SLUG } from '@/lib/chaty'
import { znamkyVizitkyChaty } from '@/lib/znamky-vizitky'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'
import { fotkaStrediska } from '@/lib/fotky-stredisek'
import { lanovkyOblasti } from '@/lib/lanovky'
import { chatZBodu } from '@/lib/pristupy'
import { vrcholyOblasti } from '@/lib/vrcholy'
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
  // Přehled lanovek oblasti (DATA-32) — které vyvezou pěšího k chatám.
  const lanovky = lanovkyOblasti(oblastSlug)
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
  // Fotky sekcí (handoff F1): pás u top cílů a vlepený snímek u paměti hor.
  // Když je oblast nemá, sekce se vykreslí bez nich — placeholder nikde.
  const fotoPas = (oblast.fotky ?? []).find((f) => f.role === 'pas-cile' && f.soubor)
  const fotoPamet = (oblast.fotky ?? []).find((f) => f.role === 'pamet' && f.soubor)
  // Řez hřebenem (handoff F1 v2): body chat s doloženou výškou I polohou.
  // Co jedno z toho nemá, se do řezu nedostane — a komponenta to řekne.
  const vrcholy = vrcholyOblasti(oblastSlug)
  const bodyRezu: BodChaty[] = vOblasti
    .filter((ch) => ch.vyska != null && ch.lng != null && ch.url)
    .map((ch) => ({ slug: ch.slug, nazev: ch.nazev, vyska: ch.vyska!, lng: ch.lng!, url: ch.url! }))

  // Cíl, který je na fotce — jen když to data výslovně říkají A je to ověřené.
  const cilVeFotce =
    fotoPas?.overeni?.verified && fotoPas.cilNazev
      ? topCile.find((c) => c.nazev === fotoPas.cilNazev)
      : undefined
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

  // Nadtitulek v titulní fotce. Návrh tu má „Česko · nejvyšší české pohoří";
  // superlativ je ale tvrzení a pole pro něj (s pramenem) nemáme, takže se
  // skládá jen z toho, co je doložené: ze zemí, ve kterých fond oblasti
  // opravdu má profily, a z úrovně oblasti. Pro Krkonoše tedy „Česko
  // a Polsko · pohoří" — a kdyby polský profil nebyl ani jeden, řeklo by to
  // jen „Česko".
  const zemeVFondu = [
    ...(vOblasti.length - pocetPl > 0 ? ['Česko'] : []),
    ...(pocetPl > 0 ? ['Polsko'] : []),
  ]
  const kicker = [zemeVFondu.join(' a '), oblast.typ === 'podoblast' ? 'podoblast' : 'pohoří']
    .filter(Boolean)
    .join(' · ')
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
      {/* Titulní fotka nese název oblasti uvnitř snímku (handoff F1, edice
          „foto"); drobečková navigace jde pod ni, jak návrh ukazuje. */}
      <PohoriHero nazev={oblast.nazev} kicker={kicker} foto={oblast.heroFoto} hora={hora} />

      <nav className="pohori-breadcrumb mn" aria-label="Drobečková navigace">
        <Link href="/">Česko</Link> / <span>{oblast.nazev}</span>
      </nav>

      <header className="pohori-hero">
        <div className="pohori-hero-text">
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

      {/* Lišta „na stránce" (handoff F1 v2) — kotvy na sekce, které opravdu
          existují: odkaz na sekci, kterou oblast nemá, by vedl do prázdna. */}
      <nav className="pohori-nav" aria-label="Sekce stránky">
        <span className="pohori-nav-popisek">Na stránce</span>
        {ma3d && <a href="#s01">Mapa</a>}
        {bodyRezu.length >= 3 && <a href="#srez">Řez hřebenem</a>}
        {vOblasti.length > 0 && <a href="#s02">Chaty</a>}
        {vOblasti.length > 0 && <a href="#s03">Žebříčky</a>}
        {strediska.length > 0 && <a href="#s04">Střediska</a>}
        {lanovky && lanovky.lanovky.length > 0 && <a href="#s05">Lanovky</a>}
        {topCile.length > 0 && <a href="#s06">Cíle</a>}
        <a href="#s07">Paměť hor</a>
        {(vitrinaOtisky.length > 0 || sRazitkem > 0) && <a href="#s08">Sbírka</a>}
        <a href="#s09">FAQ</a>
      </nav>

      {ma3d && (
        <section className="sec" id="s01" aria-label="3D mapa">
          <SectionBar num="01" title={`3D mapa — ${oblast.nazev}`} variant="red" />
          <Mapa3D posterUrl={poster3d} appUrl={`/3d/${oblastSlug}.html`} />
        </section>
      )}

      {bodyRezu.length >= 3 && (
        <section className="sec" id="srez" aria-label="Řez hřebenem">
          <SectionBar num="◭" title="Řez hřebenem" variant="night" />
          <RezHrebenem
            chaty={bodyRezu}
            vrcholy={vrcholy?.vrcholy ?? []}
            vrstvy={vrcholy?.vrstvy}
            bbox={vrcholy?.bbox}
            zdrojVrcholu={vrcholy?.zdroj}
            zdrojVyskopisu={vrcholy?.zdrojVyskopisu}
          />
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
      <section className="sec" id="s02" aria-label="Chaty oblasti">
        <SectionBar num="02" title="Chaty oblasti" variant="red" />
        <p className="pohori-uvodka">
          Vedeme <b>{vOblasti.length} profilů</b> — od hřebenových bud po schroniska na polské straně
          ({sRazitkem} s doloženým razítkem{posledni ? `, naposledy ověřeno ${formatCheckedDatum(posledni)}` : ''}).
        </p>
        <PohoriChatySeznam index={vOblasti} />
      </section>
      )}

      {vOblasti.length > 0 && (
      <section className="sec" id="s03" aria-label="Žebříčky">
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
        <section className="sec" id="s04" aria-label="Střediska">
          <SectionBar num="04" title="Střediska" variant="red" />
          <div className="pohori-strediska">
            {strediska.map((s) => (
              <StrediskoKarta
                key={s.slug}
                stredisko={s}
                foto={s.slug ? fotkaStrediska(oblast.slug!, s.slug) : null}
                pristupy={chatZBodu(oblastSlug, s.nazev)}
                url={s.slug ? `/${KANONICKA_ZEME}/${oblastSlug}/stredisko/${s.slug}` : null}
              />
            ))}
          </div>
          <p className="pohori-mikropozn">
            výchozí body túr ke chatám · počet „chat odtud“ je z doložených přístupových tras
            (DATA-06, značené trasy OpenStreetMap) — kde trasy spočítané nemáme, stojí pomlčka,
            ne nula · výšky obcí ověření ČÚZK (DATA-04) · mini-stránky středisek připravujeme
          </p>
        </section>
      )}

      {lanovky && lanovky.lanovky.length > 0 && (
        <section className="sec" id="s05" aria-label="Lanovky">
          <SectionBar num="05" title="Lanovky" variant="red" />
          <LanovkySeznam data={lanovky} />
        </section>
      )}

      {topCile.length > 0 && (
        <section className="sec" id="s06" aria-label="Top cíle">
          <SectionBar num="06" title="Top cíle" variant="red" />
          {/* Foto pás přes celou šířku (handoff F1, sekce 05).
              Karta s cílem se do pásu položí JEN u snímku, u kterého je
              doložené, KTERÝ cíl je na něm (`cilNazev` + `overeni.verified`):
              karta „Sněžka" přes fotku odjinud by čtenáři řekla, že se dívá
              na Sněžku, i kdyby to nikde nestálo. Bez doložení zůstane pás
              jen fotkou s popiskou a cíle si čtenář přečte v mřížce pod ním. */}
          <FotoPas
            fotka={fotoPas}
            karta={
              cilVeFotce ? (
                <>
                  <b>{cilVeFotce.nazev}</b>
                  {cilVeFotce.veta && <p>{cilVeFotce.veta}</p>}
                  {chataUrl(cilVeFotce.nejblizChataSlug) && (
                    <Link href={chataUrl(cilVeFotce.nejblizChataSlug)!}>
                      Nejblíž:{' '}
                      {vOblasti.find((ch) => ch.slug === cilVeFotce.nejblizChataSlug)?.nazev} ▸
                    </Link>
                  )}
                </>
              ) : null
            }
          />
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

      <section className="sec" id="s07" aria-label="Zaniklé chaty">
        <SectionBar num="07" title="Z Atlasu zaniklých" variant="red" />
        <div className={`pohori-zanikle${fotoPamet ? ' pohori-zanikle--sfotkou' : ''}`}>
          {/* Vlepený snímek (handoff F1, sekce 07) — vedle tmavé karty Atlasu. */}
          <FotoVlepena fotka={fotoPamet} />
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
      <section className="sec" id="s08" aria-label="Sběratelství">
        <SectionBar num="08" title={`Sběratelství — vitrína ${oblast.nazev}`} variant="red" />
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

      <section className="sec" id="s09" aria-label="Časté otázky">
        <SectionBar num="09" title="Časté otázky" variant="red" />
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
        <SectionBar num="10" title="Přesahy pohoří" variant="red" />
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
