/**
 * Strukturovaná data mini-stránky střediska (F1e, handoff `design/handoff-f1/`
 * §3: „breadcrumb + JSON-LD").
 *
 * Proč vlastní modul a ne pár řádků v `page.tsx`: JSON-LD je tvrzení pro
 * stroje a platí pro ně totéž co pro veřejnou prózu — **co není v datech, se
 * nepíše**. Čistá funkce se dá otestovat nad skutečnými YAML středisek, kdežto
 * objekt složený uvnitř serverové komponenty se testuje jen přes render.
 *
 * Rozhodnutí, která tenhle modul drží:
 *
 *  - **Typ je `TouristDestination`, ne `SkiResort` ani `LodgingBusiness`.**
 *    Středisko vedeme jako *východisko túr*; že se v něm i lyžuje nebo
 *    ubytovává, z našich dat neplyne a schema.org není místo, kde si to
 *    domýšlet.
 *  - **`geo` vzniká, jakmile je čím ho naplnit — souřadnicemi NEBO výškou
 *    obce.** Původně stálo `geo` jen na souřadnicích, jenže 4. 8. 2026 přibyly
 *    doložené výšky u jizerských středisek, která GPS zatím nemají (čekají na
 *    běh DATA-06 pro Jizerky) — doložený údaj by tím tiše vypadl z JSON-LD.
 *    `GeoCoordinates` samotnou `elevation` unese. Co v datech není, se dál
 *    nevypisuje: prázdná nadmořská výška je lepší než vymyšlená.
 *  - **`containedInPlace` = pohoří**, protože to je vazba, kterou data mají
 *    (`oblast` v kolekci). Naopak **chaty dostupné odtud se do JSON-LD
 *    nepíšou**: schema.org na ně nabízí `includesAttraction`, jenže to znamená
 *    „je součástí destinace", a přístupová trasa DATA-06 dokládá dosažitelnost
 *    po svých, ne příslušnost. Použít ji by bylo tvrzení navíc.
 *  - **`addressCountry` podle země střediska** (polská východiště nesou `PL`)
 *    a od 1. 8. 2026 nese zemi objektu i **kanonická adresa a drobečky** —
 *    stejné pravidlo jako u profilů chat (Karpacz =
 *    `/polsko/krkonose/stredisko/karpacz`). Článek pohoří v drobečcích jde
 *    přes segment země objektu (`/polsko/krkonose`) a trvale se přesměruje na
 *    kanonické `/cesko/krkonose` — pohoří je přeshraniční celek, jedna
 *    stránka. Tvar je 1:1 s profilem chaty, ať se stránky nečtou pokaždé
 *    jinak.
 */

/** Vstup: jen pole, na která funkce opravdu sahá (kolekce jich má víc). */
export type StrediskoProJsonLd = {
  nazev: string
  slug?: string | null
  perex?: string | null
  lat?: number | null
  lng?: number | null
  vyskaObce?: number | null
  zeme?: string | null
}

export type JsonLdKontext = {
  /** Kanonický segment země v URL webu (dnes vždy `cesko`). */
  zemeSlug: string
  oblastSlug: string
  oblastNazev: string
  /** Název země pro první článek drobečkové navigace. */
  zemeNazev: string
  /** Bez lomítka na konci, např. `https://turistickechaty.cz`. */
  origin?: string
}

const ORIGIN = 'https://turistickechaty.cz'

/**
 * Dvojice `[TouristDestination, BreadcrumbList]` — stejný tvar jako na profilu
 * chaty, ať se stránky nečtou pokaždé jinak.
 */
export const jsonLdStrediska = (
  s: StrediskoProJsonLd,
  k: JsonLdKontext,
): Record<string, unknown>[] => {
  const origin = k.origin ?? ORIGIN
  const cestaOblast = `/${k.zemeSlug}/${k.oblastSlug}`
  const cesta = `${cestaOblast}/stredisko/${s.slug}`

  const misto: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: s.nazev,
    url: `${origin}${cesta}`,
  }
  if (s.perex) misto.description = s.perex
  const maSouradnice = s.lat != null && s.lng != null
  if (maSouradnice || s.vyskaObce != null) {
    misto.geo = {
      '@type': 'GeoCoordinates',
      ...(maSouradnice ? { latitude: s.lat, longitude: s.lng } : {}),
      // Výška obce se vypisuje jen doložená (pole `vyskaObce`); dopočet
      // z výškového modelu (DATA-35) je taky doklad, ale zapisuje se do dat,
      // ne tady — tenhle modul jen přepisuje, co v datech stojí.
      ...(s.vyskaObce != null ? { elevation: s.vyskaObce } : {}),
    }
  }
  if (s.zeme) misto.address = { '@type': 'PostalAddress', addressCountry: s.zeme.toUpperCase() }
  misto.containedInPlace = {
    '@type': 'Place',
    name: k.oblastNazev,
    url: `${origin}${cestaOblast}`,
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      // Stejný tvar jako profil chaty: první článek je země objektu a míří na
      // /{zeme} — ta adresa dnes trvale přesměruje na úvod (route /[zeme]).
      { '@type': 'ListItem', position: 1, name: k.zemeNazev, item: `${origin}/${k.zemeSlug}` },
      { '@type': 'ListItem', position: 2, name: k.oblastNazev, item: `${origin}${cestaOblast}` },
      { '@type': 'ListItem', position: 3, name: s.nazev, item: `${origin}${cesta}` },
    ],
  }

  return [misto, breadcrumb]
}
