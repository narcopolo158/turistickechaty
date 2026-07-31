import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import HeroKolaz from '@/components/HeroKolaz'
import HledaniChat from '@/components/HledaniChat'
import MapaChat from '@/components/MapaChat'
import NamatkouPas from '@/components/NamatkouPas'
import TiltDiv from '@/components/TiltDiv'
import TiskButton from '@/components/TiskButton'
import { SectionBar } from '@/components/ui'
import {
  getChatyProMapu,
  getIndexChat,
  getOblastBySlug,
  getZiveOblasti,
  spojVyctem,
  ZEME_NAZEV,
} from '@/lib/chaty'
import {
  denVRoce,
  feedNaposledyOvereno,
  kalendariumVeta,
  kalendariumVyber,
  pocetNoveOverenychZa,
  posledniOvereniFondu,
} from '@/lib/index-chat'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'
import { tvarChaty, tvarOblasti, tvarProfily, vOblastech } from '@/lib/cestina'
import { zanikleChaty, zanikleChatyVse } from '@/lib/zanikle'

// Denní rotace kalendária/namátkou a čerstvé countery: stránka se
// přegeneruje nejpozději po hodině (jinak s každým deployem).
export const revalidate = 3600

/**
 * Titulek drží týž oblouk jako nadpis stránky (celý plán, ne dvě pilotní
 * pohoří) — konkrétní jména oblastí patří do titulků JEJICH stránek, kde na
 * dotaz „chaty Krkonoše" odpoví ta pravá. Popis se SKLÁDÁ Z DAT: počet
 * profilů i jméno oblasti ve správném pádu. Napsaný natvrdo by po přidání
 * další oblasti lhal ve výsledcích vyhledávání dřív, než by si toho kdokoli
 * všiml (v layoutu takový popis do 31. 7. 2026 opravdu byl).
 */
export async function generateMetadata(): Promise<Metadata> {
  const [{ index }, ziveOblasti] = await Promise.all([getIndexChat(), getZiveOblasti()])
  const kde = vOblastech(ziveOblasti)
  const titulek = 'Turistické chaty od českých hor po Alpy'
  const popis =
    `Průvodce turistickými chatami: horské boudy, schroniska, útulny i rozhledny s občerstvením. ` +
    `Zatím ${index.length} ${tvarProfily(index.length)} ${kde}`.replace(/\s+/g, ' ') +
    ' — u každého výška, provozní stav, přístupové trasy a razítko se zdrojem a datem poslední kontroly.'
  return {
    title: `${titulek} — turistickechaty.cz`,
    description: popis,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'cs_CZ',
      siteName: 'turistickechaty.cz',
      title: titulek,
      description: popis,
      url: '/',
    },
  }
}

/**
 * Homepage dle handoffu F1 (design/handoff-f1/F1-Homepage.dc.html +
 * screenshots 01–05): hero „sběratelský stůl" (koláž faux-3D artefaktů
 * z DOLOŽENÝCH dat — hero fotka a reálný otisk Luční, známka č. 11),
 * dřevěné rozcestníkové CTA, poctivé countery s mikroblokem, kalendárium,
 * turistická mapa chat, pohoří grid, „Namátkou z průvodce" (seedovaný
 * Fisher–Yates), kurátorské pásy Z průvodce, manifest a printový
 * seznam (B13).
 *
 * Vědomé odchylky od prototypu (deník 28. 7. 2026): sekce 03 Pohlednice
 * vynechána (funkce Fáze 2 — mrtvá CTA neděláme, sekce přečíslovány);
 * RSS/Newsletter chipy a Konami sníh vynechány (backend/nízká priorita).
 * Malovaný poster band z návrhu NAHRAZEN skutečnou turistickou mapou chat
 * (rozhodnutí Michala 28. 7. 2026: 3D patří na stránku pohoří, homepage nese
 * reálnou mapu — dlaždice Mapy.com outdoor s markery).
 * Všechna čísla POČÍTANÁ z dat — nikde žádné ručně psané.
 *
 * TEXTACE (31. 7. 2026, zadání Michala): slogan „Chaty, kterým můžeš věřit"
 * je pryč, nadpis nese záměr celého plánu (ne dvě pilotní pohoří) a pod ním
 * stojí definiční věta s doloženými čísly — pro člověka i pro modely, které
 * stránku citují. Všechno, co znělo jako výpis z admina („řadí se podle
 * checked v databázi", „ghost", „živý důkaz"), zmizelo; o původu dat se mluví
 * na dvou místech pohromadě — ve FAQ a v tiráži patičky. Nově má stránka
 * strukturovaná data (WebSite, Organization, CollectionPage, FAQPage).
 */
export default async function HomePage() {
  const [chatyProMapu, { index, kalendarium }, ziveOblasti] = await Promise.all([
    getChatyProMapu(),
    getIndexChat(),
    getZiveOblasti(),
  ])
  // Oblasti, které na webu OPRAVDU stojí — tedy ty s aspoň jedním publikovaným
  // profilem. Do 31. 7. 2026 tu byly Krkonoše napevno; když přibyly Jizerské
  // hory, karta pohoří by o nich mlčela a krkonošská by si navíc přivlastnila
  // jejich čísla (počty se braly z celého fondu). Teď se počítají per oblast.
  // Detail oblasti se dotahuje jen kvůli titulní fotce. Když se nenačte,
  // karta se NEZAHODÍ — jen zůstane s kresleným panoramatem; jinak by chyba
  // v jednom dokumentu tiše smazala celou oblast z rozcestníku.
  const detailOblasti = new Map(
    (await Promise.all(ziveOblasti.map((o) => getOblastBySlug(o.slug))))
      .filter((o): o is NonNullable<typeof o> => o != null)
      .map((o) => [o.slug, o]),
  )

  const dnes = new Date().toISOString().slice(0, 10)
  const sRazitkem = index.filter((ch) => ch.razitko).length
  const seZnamkou = index.filter((ch) => ch.znamka).length
  const zanikle = zanikleChatyVse()
  const posledniOvereni = posledniOvereniFondu(index)
  const nedavno = pocetNoveOverenychZa(index, dnes, 14)
  const vyroci = kalendariumVyber(kalendarium, dnes)
  const overenoFeed = feedNaposledyOvereno(index, 4)

  // Artefakty koláže z doložených dat: hero fotka + reálný otisk Luční boudy.
  const lucni = index.find((ch) => ch.slug === 'lucni-bouda') ?? null
  const polaroid = lucni?.heroUrl
    ? {
        url: lucni.heroUrl,
        popisek: 'Luční bouda, 1 410 m',
        atribuce: 'foto: Stanislav Dusík · CC BY-SA · Wikimedia Commons',
      }
    : null
  const otiskLucni = lucni?.otiskUrl ? { url: lucni.otiskUrl, alt: lucni.otiskAlt ?? 'otisk razítka Luční boudy' } : null

  /**
   * Karta pohoří = jedna oblast s publikovanými profily, čísla POČÍTANÁ jen
   * z jejích chat. Řadí se podle počtu profilů, ať je pilot první.
   */
  const zive = ziveOblasti.map((o) => {
    const chatyOblasti = index.filter((ch) => ch.oblastSlug === o.slug)
    return {
      slug: o.slug,
      nazev: o.nazev,
      typ: o.typ,
      druhy: o.druhy,
      sesty: o.sesty,
      heroFoto: detailOblasti.get(o.slug)?.heroFoto ?? null,
      chat: chatyOblasti.length,
      zanikle: zanikleChaty(o.slug).length,
      sRazitkem: chatyOblasti.filter((ch) => ch.razitko).length,
    }
  })

  /**
   * Věty o oblastech se skládají z DAT, ne ze šablony: „v Krkonoších
   * a Jizerských horách" (6. pád z `sklonovani` v datech oblasti) a „pohoří"
   * jen dokud jsou opravdu všechna pohoří. Napsat tvary natvrdo je tentýž
   * vzorec, kvůli kterému stránka Jizerek chvíli ukazovala krkonošskou mapu.
   */
  const kdeVeta = vOblastech(zive)
  const oblastiSlovo = tvarOblasti(zive)
  const oblastiPoCisle = tvarOblasti(zive, 'pocet')
  // Země se berou z profilů ve fondu, ne ze seznamu v kódu — dokud nemáme
  // jediný polský profil, nemá se čím chlubit přeshraniční záběr.
  const zemeVeFondu = Object.keys(ZEME_NAZEV)
    .filter((z) => index.some((ch) => ch.zeme === z))
    .map((z) => ZEME_NAZEV[z]!)
  const pocetPl = index.filter((ch) => ch.zeme === 'pl').length
  // 3D mapu slibujeme jen tehdy, když ji DATA-28 opravdu vyrobila pro KAŽDOU
  // živou oblast — jinak by rozcestník posílal na stránku, kde žádná není.
  const vsechnyMaji3d =
    zive.length > 0 && zive.every((o) => existsSync(join(process.cwd(), 'public', '3d', `${o.slug}.html`)))
  const bezFotky = index.filter((ch) => ch.heroUrl == null).length

  // Oblasti, ke kterým máme jen kandidáty (nebo ani to) — kartu „připravujeme"
  // dostane jen ta, která na webu ještě nestojí; jinak by Jizerky visely na
  // homepage dvakrát, jednou živé a jednou jako slib.
  const pripravujeme = [
    { n: 'Ještědský hřbet', note: 'připravujeme — sbíráme kandidáty' },
    { n: 'Český ráj', note: 'připravujeme — sbíráme kandidáty' },
    { n: 'Podkrkonoší', note: 'přesahová oblast — s vysvětlením' },
  ].filter((p) => !zive.some((z) => z.nazev === p.n))

  /**
   * FAQ PRŮVODCE (31. 7. 2026) — otázky formulované tak, jak se opravdu ptají
   * lidé („dá se tam přespat", „co znamená ověřeno"), ne jak se jmenují sekce.
   * Slouží dvěma čtenářům najednou: člověku, který sem přišel s konkrétní
   * otázkou, a jazykovému modelu, který stránku cituje — proto je každá
   * odpověď SAMONOSNÁ (dá se vytrhnout a pořád dává smysl) a čísla jsou
   * počítaná z fondu, ne opsaná. Totéž znění jde do FAQPage JSON-LD níž.
   *
   * Tady je taky jediné místo, kde se na homepage mluví o původu dat —
   * dřív visely poznámky typu „řadí se podle checked v databázi" u každého
   * pásu a web kvůli tomu zněl jako výpis z konzole (zadání Michala:
   * „redukuj vše, co zní technicky, na nejnutnější minimum, zdroje pohromadě").
   */
  const faq: { q: string; a: string }[] = [
    {
      q: 'Co je turistická chata?',
      a:
        'Turistická chata je stavba na značené trase, která nabízí veřejnosti občerstvení a často i nocleh — ' +
        'horská bouda, polské schronisko, útulna, bivak, rozhledna s občerstvením nebo chata ve skalním městě. ' +
        'Rozhoduje role na trase a služba pro veřejnost, ne typ stavby ani nadmořská výška: hotel u silnice do průvodce nepatří, ' +
        'nevytápěná útulna pod hřebenem ano.',
    },
    {
      q: 'Kolik chat průvodce vede a kde?',
      a:
        `Průvodce vede ${index.length} ${tvarProfily(index.length)} chat` +
        `${zive.length ? `: ${spojVyctem(zive.map((o) => `${o.chat} ${vOblastech([o])}`))}` : ''}` +
        `${pocetPl > 0 ? `, z toho ${pocetPl} na polské straně` : ''}. ` +
        `K tomu ${zanikle.length} zaniklých chat v samostatném Atlasu, kam se živý katalog nemíchá. ` +
        'Další oblasti přibývají postupně — vždy až s doloženými profily, ne jako prázdný slib.',
    },
    {
      q: 'Jsou údaje na webu aktuální?',
      a:
        `U každého údaje je datum poslední kontroly; nejnovější ve fondu je ${formatCheckedDatum(posledniOvereni)}` +
        `${nedavno > 0 ? `, za posledních 14 dní jsme znovu zkontrolovali ${nedavno} ${tvarChaty(nedavno, 'ctvrty')}` : ''}. ` +
        'Provozní doba a ceny se na horách mění během sezóny — před výletem si je ověř přímo u chaty, ' +
        'kontakt najdeš na jejím profilu.',
    },
    {
      q: 'Co znamená „ověřeno" u údaje?',
      a:
        'Ověřeno znamená, že údaj potvrdil člověk z redakce vlastní kontrolou — telefonátem, návštěvou nebo přímou znalostí. ' +
        'Údaje převzaté z webů chat, katalogů a OpenStreetMap vedeme se zdrojem a datem kontroly, ale bez značky ověření. ' +
        'Co doložené není, se nezveřejní; místo dohadu je na profilu pomlčka.',
    },
    {
      q: 'Dá se na chatách přespat?',
      a:
        'U chat, kde je to doložené, uvádíme nocleh, počet lůžek a orientační ceny, u některých i odkaz na rezervaci provozovatele. ' +
        'Sami nic nerezervujeme ani neprodáváme a nebereme provize — průvodce je katalog, ne rezervační portál.',
    },
    {
      q: 'K čemu jsou razítka a známky na chatách?',
      a:
        `${sRazitkem} chat v průvodci má doložené razítko a ${seZnamkou} známkové místo (turistické známky a vizitky). ` +
        'Otisky si prohlédneš na profilech a odškrtáváš do razítkovníku, který zůstává jen ve tvém prohlížeči — ' +
        'nikam se neodesílá a nepotřebuje registraci.',
    },
    {
      q: 'Chybí tu chata, kterou znám. Proč?',
      a:
        'Do průvodce se dostane jen objekt s doloženou veřejnou službou — kandidáty prověřujeme postupně, křížem přes weby chat, katalogy a OpenStreetMap. ' +
        'Když víš o chatě, která tu chybí, nebo máš otisk razítka či vlastní fotku, pošli je přes stránku Přispět; po redakční kontrole je zveřejníme s tvým jménem u snímku.',
    },
    {
      q: 'Odkud data pocházejí?',
      a:
        'Ze čtyř zdrojů: webů a telefonátů samotných chat, dat OpenStreetMap (licence ODbL), ' +
        'sbírky otisků razitkuj.cz se svolením a fotografií z Wikimedia Commons pod licencemi CC. ' +
        'U každého jednotlivého údaje je konkrétní zdroj uvedený přímo na profilu chaty, včetně data, kdy jsme ho naposledy kontrolovali.',
    },
  ]

  const POPIS_WEBU =
    'Průvodce turistickými chatami: horské boudy, schroniska, útulny a rozhledny s občerstvením — ' +
    'ověřená data, mapa, přístupové trasy, historie a katalog razítek.'
  /**
   * JSON-LD (31. 7. 2026): homepage do té doby neměla ŽÁDNÁ strukturovaná data,
   * takže vyhledávače a jazykové modely o webu jako celku nevěděly nic — profily
   * i stránky pohoří přitom svoje bloky dávno mají. Uvádí se jen to, co je
   * doložené: žádné hodnocení, žádný počet recenzí, žádné logo, které neexistuje.
   * `SearchAction` míří na katalog, který parametr `?q=` opravdu umí.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://turistickechaty.cz/#web',
        url: 'https://turistickechaty.cz/',
        name: 'turistickechaty.cz',
        alternateName: 'Turistické chaty',
        description: POPIS_WEBU,
        inLanguage: 'cs',
        publisher: { '@id': 'https://turistickechaty.cz/#vydavatel' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://turistickechaty.cz/chaty?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://turistickechaty.cz/#vydavatel',
        name: 'Turistické chaty',
        url: 'https://turistickechaty.cz/',
        description: POPIS_WEBU,
      },
      {
        '@type': 'CollectionPage',
        '@id': 'https://turistickechaty.cz/#homepage',
        url: 'https://turistickechaty.cz/',
        name: 'Turistické chaty od českých hor po Alpy',
        description: POPIS_WEBU,
        inLanguage: 'cs',
        isPartOf: { '@id': 'https://turistickechaty.cz/#web' },
        // Datum, ke kterému je fond ověřený — týž údaj, jaký čtenář vidí
        // v hlavičce („naposledy ověřeno"). Strukturovaná data nesmí tvrdit
        // nic jiného než viditelný text.
        ...(posledniOvereni ? { dateModified: posledniOvereni } : {}),
        mainEntity: {
          '@type': 'ItemList',
          name: `Oblasti průvodce (${zive.length})`,
          numberOfItems: zive.length,
          itemListElement: zive.map((o, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: o.nazev,
            url: `https://turistickechaty.cz/cesko/${o.slug}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://turistickechaty.cz/#faq',
        isPartOf: { '@id': 'https://turistickechaty.cz/#web' },
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      {/* SVG filtry sdílené kolážovými artefakty a dřevěnými cedulemi */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="hf1-wood">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.11" numOctaves="4" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.17  0 0 0 0 0.06  0 0 0 0.5 0" />
          </filter>
        </defs>
      </svg>

      <div className="hf1-jen-obrazovka">
        <section className="wrap hf1-hero" aria-label="Úvod">
          <div className="hf1-hero-text">
            {/* Nadtitulek říká DNEŠEK: země, ve kterých fond opravdu má
                profily (přeshraniční pohoří vedeme vcelku). Velký nadpis nad
                ním mluví o celém záměru — malé písmo drží realitu. */}
            <div className="hf1-eyebrow">
              Průvodce turistickými chatami{zemeVeFondu.length ? ` · ${spojVyctem(zemeVeFondu)}` : ''}
            </div>
            {/*
              NADPIS JE PŘEDMĚT A ZÁMĚR, NE SLOGAN (rozhodnutí Michala
              31. 7. 2026: „nelíbí se mi slogan Chaty, kterým můžeš věřit",
              a vzápětí „neomezuj headline na 2 pohoří, rovnou ber celkový
              plán").

              První verze jmenovala v nadpisu obě živé oblasti — jenže tím by
              se web natrvalo představoval jako krkonošsko-jizerský, ačkoli
              plán míří přes Česko a Slovensko do Alp (docs/plan.md, kap. 1).
              Nadpis proto drží OBLOUK ZÁMĚRU, kdežto to, co průvodce opravdu
              má, stojí hned pod ním v perexu a v číslech — čtenář ani robot
              se nedozví „máme Alpy", ale „tímhle směrem to jde".
            */}
            <h1 className="hf1-claim">
              {/* Mezera patří DOVNITŘ řádku, ne mezi elementy: `display:block`
                  ji na obrazovce stejně sbalí, ale v textContentu zůstane —
                  a přesně tu čte crawler i čtečka pro nevidomé. */}
              Turistické chaty<span className="hf1-claim-kde">{' od českých hor po Alpy'}</span>
            </h1>
            <p className="hf1-perex">
              Průvodce turistickými chatami — horskými boudami a schronisky, útulnami
              i rozhlednami s občerstvením.{' '}
              {index.length > 0 ? (
                <>
                  Stavíme ho postupně: zatím {index.length} {tvarProfily(index.length)}{' '}
                  {kdeVeta}, u každého výška, provozní stav, přístupové trasy od nejbližší zastávky
                  a otisk razítka do deníku — se zdrojem a datem poslední kontroly.
                </>
              ) : (
                <>Profily teprve zakládáme — zveřejníme je, až budou doložené.</>
              )}
            </p>

            <HledaniChat polozky={index.map((ch) => ({ nazev: ch.nazev, url: ch.url }))} />

            <div className="hf1-cedule">
              <TiltDiv zaklad="rotate(-1deg)" className="hf1-cedule-prkno velke">
                {/* Rozcestník míří na sekci Pohoří, ne na jedno pohoří.
                    Do 31. 7. 2026 tu stálo „PROZKOUMAT KRKONOŠE" — s druhou
                    živou oblastí by to čtenáři tvrdilo, že průvodce je pořád
                    jen krkonošský, a přidat prkno za každou oblast se nedá
                    donekonečna (rozhodnutí Michala: „asi bych dal neutrální
                    rozcestník"). Cíl je pravdivý: dole stojí karty všech
                    oblastí s fotkou, počty a odkazem. */}
                <Link href="#pohori" className="hf1-cedule-obsah">
                  <span className="hf1-cedule-kresba" aria-hidden="true">
                    <svg width="100%" height="100%">
                      <rect width="100%" height="100%" filter="url(#hf1-wood)" />
                    </svg>
                  </span>
                  <span className="hf1-sroubek" aria-hidden="true" />
                  {/* Slovo na ceduli se bere z dat: „pohoří" jen dokud jsou
                      všechny živé oblasti opravdu pohoří (Český ráj jím není). */}
                  <span className="hf1-cedule-titul">PROZKOUMAT {oblastiSlovo.toUpperCase()}</span>
                  <span className="hf1-cedule-pozn">
                    {zive.length} {oblastiPoCisle}
                    {/* 3D mapu slibujeme, jen když ji má KAŽDÁ živá oblast. */}
                    {vsechnyMaji3d ? ' · stránky s 3D mapou' : ' · mapa, chaty a trasy'}
                  </span>
                </Link>
              </TiltDiv>
              <TiltDiv zaklad="rotate(.8deg)" className="hf1-cedule-prkno">
                <Link href="/chaty" className="hf1-cedule-obsah">
                  <span className="hf1-cedule-kresba" aria-hidden="true">
                    <svg width="100%" height="100%">
                      <rect width="100%" height="100%" filter="url(#hf1-wood)" />
                    </svg>
                  </span>
                  <span className="hf1-sroubek" aria-hidden="true" />
                  <span className="hf1-cedule-titul">KATALOG CHAT</span>
                  <span className="hf1-cedule-pozn">{index.length} profilů</span>
                </Link>
              </TiltDiv>
            </div>

            <div className="hf1-countery">
              <div>
                <b>{index.length}</b> <span>profilů chat</span>
              </div>
              <div>
                <b>{sRazitkem}</b> <span>s razítkem</span>
              </div>
              {zanikle.length > 0 && (
                <div>
                  <b>{zanikle.length}</b> <span>zaniklých v Atlasu</span>
                </div>
              )}
              {posledniOvereni && (
                <div className="hf1-overeno">
                  naposledy ověřeno <b>{formatCheckedDatum(posledniOvereni)}</b>
                </div>
              )}
            </div>
            {/* Poznámka „jen čísla doložená v databázi — žádná vymyšlená" tu
                stála do 31. 7. 2026. Byla pravdivá, ale zněla jako popiska
                z admina a čtenář ji čte jako obhajobu; totéž teď říká FAQ
                („Odkud data pocházejí?") a tiráž v patičce — jednou a pořádně. */}
            <div className="hf1-mikroblok">
              {nedavno > 0 && (
                <span className="hf1-chip-nedavno">
                  <i aria-hidden="true" />
                  {nedavno}× nově ověřeno za 14 dní
                </span>
              )}
              <TiskButton className="hf1-chip-tisk">Tisk seznamu ▸</TiskButton>
            </div>
          </div>

          <HeroKolaz polaroid={polaroid} otiskLucni={otiskLucni} />
        </section>

        {vyroci && (
          <section className="wrap" aria-label="Kalendárium">
            <div className="hf1-kalendarium">
              <span className="hf1-label">Kalendárium</span>
              <span className="hf1-kosoctverec" aria-hidden="true" />
              <span className="hf1-vyroci">{kalendariumVeta(vyroci, dnes)}</span>
              {vyroci.chataUrl && <Link href={vyroci.chataUrl}>číst na profilu ▸</Link>}
            </div>
          </section>
        )}

        {/* Skutečná turistická mapa (dlaždice Mapy.com outdoor + markery
            všech chat) — na místě, kde měl návrh malovaný poster. */}
        <div id="mapa">
          <MapaChat chaty={chatyProMapu} />
        </div>

        <section id="pohori" className="wrap sec" aria-label="Kam vyrazit">
          <div className="hf1-sekce-hlava">
            <span className="hf1-sekce-num">01</span>
            <span className="hf1-sekce-titul">Kam vyrazit</span>
            <span className="hf1-sekce-cara" aria-hidden="true" />
            <span className="hf1-sekce-tag">
              {zive.length} {oblastiPoCisle} · další sbíráme
            </span>
          </div>
          <div className="hf1-pohori-grid">
            {zive.map((o) => (
              <TiltDiv key={o.slug} className="hf1-pohori-ziva">
                <Link href={`/cesko/${o.slug}`} className="hf1-pohori-obsah">
                  <span className="hf1-pohori-panorama" aria-hidden="true">
                    {/* Titulní fotka oblasti, když ji data mají (FOTO-01); kreslené
                        panorama zůstává jako záloha, aby karta nikdy nebyla prázdná
                        — a u „připravujeme" oblastí je pořád jediná varianta. */}
                    {o.heroFoto?.nahled ? (
                      // eslint-disable-next-line @next/next/no-img-element -- náhled titulní fotky (FOTO-01), statická příloha repa
                      <img
                        className="hf1-pohori-foto"
                        src={o.heroFoto.nahled}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <svg viewBox="0 0 460 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                        <path d="M0,64 L74,34 L140,54 L214,22 L292,52 L360,28 L420,48 L460,36 L460,110 L0,110 Z" fill="#b7c7d4" />
                        <path d="M214,22 L242,38 L188,44 Z" fill="#f2f5f7" opacity=".9" />
                        <path d="M0,84 L90,62 L180,80 L280,56 L380,76 L460,60 L460,110 L0,110 Z" fill="#7d9469" />
                        <path d="M-5,74 C100,66 220,58 330,50 C380,46 430,44 465,40" fill="none" stroke="#fdfaf2" strokeWidth="3" opacity=".65" />
                      </svg>
                    )}
                    <span className="hf1-pohori-zive-badge">ŽIVÉ</span>
                  </span>
                  <span className="hf1-pohori-telo">
                    <span className="hf1-pohori-nazev">{o.nazev}</span>
                    <span className="hf1-pohori-cisla">
                      <span>
                        <b>{o.chat}</b> chat
                      </span>
                      {/* Nula zaniklých u nové oblasti není chyba, ale ani zpráva —
                          Atlas se plní zvlášť, tak se prázdná položka neukazuje. */}
                      {o.zanikle > 0 && (
                        <span>
                          <b>{o.zanikle}</b> zaniklých
                        </span>
                      )}
                      <span>
                        <b>{o.sRazitkem}</b> s razítkem
                      </span>
                    </span>
                    <span className="hf1-pohori-cta">Prozkoumat ▸</span>
                  </span>
                </Link>
              </TiltDiv>
            ))}
            {pripravujeme.map((p) => (
              <div key={p.n} className="hf1-pohori-pripravujeme">
                {/* Do 31. 7. 2026 tu stálo slovo „silueta" — popiska z návrhu,
                    která se omylem stala obsahem. Kreslené panorama v tlumené
                    šedi řekne totéž a nezní jako nedodělek. */}
                <span className="hf1-pohori-silueta" aria-hidden="true">
                  <svg viewBox="0 0 460 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                    <path d="M0,70 L86,40 L150,60 L220,30 L300,58 L368,34 L426,52 L460,42 L460,110 L0,110 Z" fill="currentColor" opacity=".22" />
                    <path d="M0,88 L96,68 L186,84 L286,62 L384,80 L460,66 L460,110 L0,110 Z" fill="currentColor" opacity=".34" />
                  </svg>
                </span>
                <span className="hf1-pohori-telo">
                  <span className="hf1-pohori-nazev tichy">{p.n}</span>
                  <span className="hf1-pohori-note">{p.note}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap sec" aria-label="Namátkou z průvodce">
          <NamatkouPas index={index} seed={denVRoce(dnes)} />
        </section>

        {/* Komunitní apel (rozhodnutí Michala 28. 7. 2026): počty POČÍTANÉ
            z dat — kolika chatám otisk/fotka opravdu chybí. */}
        <section className="wrap" aria-label="Pomoz průvodci">
          <div className="hf1-apel">
            <div className="hf1-apel-text">
              <b>Máš v deníku otisk, který nám chybí?</b>
              <p>
                {index.length - sRazitkem} {tvarChaty(index.length - sRazitkem, 'ctvrty')} vedeme bez
                doloženého razítka a {bezFotky} bez fotky. Pošli sken otisku nebo snímek z výletu —
                po redakční kontrole je zveřejníme s tvým jménem u snímku.
              </p>
            </div>
            <Link href="/prispet" className="hf1-apel-cta">
              Přispět otiskem či fotkou ▸
            </Link>
          </div>
        </section>

        <section className="wrap sec" aria-label="Z průvodce">
          <SectionBar num="03" title="Z průvodce" variant="red" />
          <div className="hf1-zpruvodce">
            <div className="hf1-panel">
              <div className="hf1-panel-hlava">
                <b>Naposledy ověřeno</b>
                {/* Štítek říkal „živý důkaz" — reklamní slovo o vlastní
                    poctivosti. Datum vedle každé chaty je důkaz samo. */}
                <span className="hf1-tag">{formatCheckedDatum(posledniOvereni)}</span>
              </div>
              <div className="hf1-panel-seznam">
                {overenoFeed.map((ch) =>
                  ch.url ? (
                    <Link key={ch.slug} href={ch.url} className="hf1-panel-radek">
                      <span>{ch.nazev}</span>
                      <span className="hf1-datum-overeni">
                        <i aria-hidden="true" />
                        {formatCheckedDatum(ch.checked)}
                      </span>
                    </Link>
                  ) : null,
                )}
              </div>
            </div>

            <div className="hf1-panel tmavy">
              <span className="hf1-kruh" aria-hidden="true" />
              <div className="hf1-panel-hlava">
                <b>Z Atlasu zaniklých</b>
                <span className="hf1-tag">{zanikle.length} příběhů</span>
              </div>
              <p>
                Boudy a schroniska, které už nestojí — rok a příčina zániku, co je na místě dnes.
                Samostatná kategorie: do živého katalogu se nemíchá.
              </p>
              <div style={{ flex: 1 }} />
              <Link href="/zanikle" className="hf1-panel-cta">
                Otevřít Atlas ▸
              </Link>
            </div>

            <div className="hf1-panel">
              <div className="hf1-panel-hlava">
                <b>Razítka a známky</b>
                <span className="hf1-tag" style={{ color: 'var(--label)' }}>
                  sbírka
                </span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', margin: '8px 0 0' }}>
                {sRazitkem} chat s doloženým razítkem a {seZnamkou} se známkovým místem. Otisky
                sbíráš na profilech, deník zůstává ve tvém prohlížeči.
              </p>
              <div style={{ flex: 1 }} />
              <Link href="/razitkovnik" className="hf1-panel-cta">
                Otevřít razítkovník ▸
              </Link>
            </div>
          </div>
        </section>

        {/* Časté otázky (31. 7. 2026): odpovědi na to, s čím sem lidé chodí —
            a zároveň jediné místo na homepage, kde se mluví o původu dat.
            Totéž znění nese FAQPage JSON-LD dole. */}
        <section id="caste-otazky" className="wrap sec" aria-label="Časté otázky">
          <SectionBar num="04" title="Časté otázky" />
          <div className="hf1-faq">
            {faq.map((f) => (
              <details key={f.q} className="hf1-faq-polozka">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="wrap" aria-label="Jak průvodce vzniká">
          <div className="hf1-manifest">
            <span className="hf1-label">Jak průvodce vzniká</span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Ověřujeme u zdroje
            </span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Rozpory přiznáváme
            </span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Nic nedomýšlíme
            </span>
          </div>
        </section>
        <div style={{ paddingBottom: 30 }} />
      </div>

      {/* Print (B13): homepage tiskne čistý černobílý seznam všech chat. */}
      <div className="hf1-print" aria-hidden="true">
        <h2>turistickechaty.cz — seznam chat</h2>
        <p className="hf1-print-pozn">
          {index.length} vedených profilů · stav k {formatCheckedDatum(dnes)} · jen doložené údaje
          (— = nedoloženo)
        </p>
        <table>
          <thead>
            <tr>
              <th>Chata</th>
              <th>Pohoří</th>
              <th>Výška</th>
              <th>Stav</th>
              <th>Ověřeno</th>
              <th>Razítko</th>
            </tr>
          </thead>
          <tbody>
            {index.map((ch) => (
              <tr key={ch.slug}>
                <td>{ch.nazev}</td>
                <td>{ch.oblastNazev ?? '—'}</td>
                <td>{formatVyskaM(ch.vyska)}</td>
                <td>{ch.stav === 'v-provozu' ? 'v provozu' : ch.stav === 'mimo-provoz' ? 'mimo provoz' : ch.stav === 'zanikla' ? 'zaniklá' : '—'}</td>
                <td>{formatCheckedDatum(ch.checked)}</td>
                <td>{ch.razitko ? '●' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strukturovaná data webu jako celku (WebSite, Organization,
          CollectionPage se seznamem oblastí, FAQPage). Jeden blok, na konci
          dokumentu — obsah je týž, jaký čtenář vidí výš. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
