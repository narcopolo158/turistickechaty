/**
 * Strukturovaná data mini-stránky střediska (F1e — „breadcrumb + JSON-LD").
 *
 * Testy drží ROZHODNUTÍ, ne dnešní obsah dat:
 *   1. co není v datech, se do JSON-LD nedostane — chybějící perex, GPS ani
 *      výška obce nesmí vyrobit prázdný nebo dopočítaný klíč;
 *   2. `containedInPlace` je pohoří (vazba, kterou data mají), kdežto chaty
 *      dostupné odtud se nepíšou vůbec — přístupová trasa dokládá
 *      dosažitelnost po svých, ne příslušnost k destinaci;
 *   3. drobečková navigace jde po URL webu (vše pod `/cesko`), zatímco
 *      `addressCountry` nese skutečnou zemi objektu — polská východiště `PL`;
 *   4. nad SKUTEČNÝMI YAML všech středisek musí výstup zůstat serializovatelný
 *      a bez `undefined`, protože jde do stránky přes `JSON.stringify`.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { jsonLdStrediska, type StrediskoProJsonLd } from '@/lib/jsonld-stredisko'

const KONTEXT = {
  zemeSlug: 'cesko',
  oblastSlug: 'krkonose',
  oblastNazev: 'Krkonoše',
  zemeNazev: 'Česko',
}

const strediskaZeSouboru = (oblast: string): StrediskoProJsonLd[] => {
  const slozka = join(process.cwd(), 'data', 'strediska', oblast)
  return readdirSync(slozka)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => parse(readFileSync(join(slozka, f), 'utf8')) as StrediskoProJsonLd)
}

describe('JSON-LD střediska — tvar', () => {
  const [misto, breadcrumb] = jsonLdStrediska(
    {
      nazev: 'Pec pod Sněžkou',
      slug: 'pec-pod-snezkou',
      perex: 'Východisko pod Sněžku.',
      lat: 50.6935744,
      lng: 15.7335607,
      zeme: 'cz',
    },
    KONTEXT,
  )

  it('vrací dvojici TouristDestination + BreadcrumbList', () => {
    expect(misto['@type']).toBe('TouristDestination')
    expect(breadcrumb['@type']).toBe('BreadcrumbList')
  })

  it('URL míří na mini-stránku, ne na profil chaty téhož jména', () => {
    expect(misto.url).toBe('https://turistickechaty.cz/cesko/krkonose/stredisko/pec-pod-snezkou')
  })

  it('geo nese souřadnice a bez výšky obce nemá elevation', () => {
    expect(misto.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 50.6935744,
      longitude: 15.7335607,
    })
  })

  it('containedInPlace je pohoří a chaty odtud se nevypisují', () => {
    expect(misto.containedInPlace).toEqual({
      '@type': 'Place',
      name: 'Krkonoše',
      url: 'https://turistickechaty.cz/cesko/krkonose',
    })
    // `includesAttraction` by tvrdilo příslušnost, ne dosažitelnost po svých.
    expect(misto).not.toHaveProperty('includesAttraction')
    expect(misto).not.toHaveProperty('touristAttraction')
  })

  it('drobečková navigace má tři stupně v pořadí web → pohoří → středisko', () => {
    expect(breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Česko', item: 'https://turistickechaty.cz/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Krkonoše',
        item: 'https://turistickechaty.cz/cesko/krkonose',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Pec pod Sněžkou',
        item: 'https://turistickechaty.cz/cesko/krkonose/stredisko/pec-pod-snezkou',
      },
    ])
  })
})

describe('JSON-LD střediska — co v datech není, se nepíše', () => {
  it('bez perexu nevznikne description, bez GPS nevznikne geo', () => {
    const [misto] = jsonLdStrediska({ nazev: 'Bez dat', slug: 'bez-dat' }, KONTEXT)
    expect(misto).not.toHaveProperty('description')
    expect(misto).not.toHaveProperty('geo')
    expect(misto).not.toHaveProperty('address')
  })

  it('samotná zeměpisná šířka bez délky geo nevyrobí', () => {
    const [misto] = jsonLdStrediska({ nazev: 'Půl bodu', slug: 'pul-bodu', lat: 50.1 }, KONTEXT)
    expect(misto).not.toHaveProperty('geo')
  })

  it('výška obce se objeví jen tehdy, když ji data nesou', () => {
    const [misto] = jsonLdStrediska(
      { nazev: 'S výškou', slug: 's-vyskou', lat: 50.1, lng: 15.7, vyskaObce: 769 },
      KONTEXT,
    )
    expect((misto.geo as Record<string, unknown>).elevation).toBe(769)
  })

  it('polské východisko nese addressCountry PL, ale drobečky vedou přes /cesko', () => {
    const [misto, breadcrumb] = jsonLdStrediska(
      { nazev: 'Karpacz', slug: 'karpacz', zeme: 'pl' },
      KONTEXT,
    )
    expect(misto.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'PL' })
    const prvni = (breadcrumb.itemListElement as { name: string }[])[0]
    expect(prvni.name).toBe('Česko')
    expect(misto.url).toContain('/cesko/krkonose/stredisko/karpacz')
  })
})

describe('JSON-LD střediska — nad skutečnými daty', () => {
  const oblasti = [
    { slug: 'krkonose', nazev: 'Krkonoše' },
    { slug: 'jizerske-hory', nazev: 'Jizerské hory' },
  ]

  for (const o of oblasti) {
    it(`${o.nazev}: každé středisko dá platný, serializovatelný JSON-LD`, () => {
      const strediska = strediskaZeSouboru(o.slug)
      expect(strediska.length).toBeGreaterThan(0)
      for (const s of strediska) {
        const bloky = jsonLdStrediska(s, {
          ...KONTEXT,
          oblastSlug: o.slug,
          oblastNazev: o.nazev,
        })
        const text = JSON.stringify(bloky)
        expect(text).not.toContain('undefined')
        expect(text).not.toContain('null')
        expect(JSON.parse(text)).toHaveLength(2)
        expect(bloky[0].name).toBe(s.nazev)
        expect(String(bloky[0].url)).toContain(`/stredisko/${s.slug}`)
      }
    })
  }

  it('žádné středisko dnes nemá výšku obce — dokud nebude ČÚZK, elevation nevzniká', () => {
    // Kontrola premisy F1a: až Michal výšky doplní, test spadne a je to
    // správně — připomene, že se má přepsat, ne že je něco rozbité.
    const vsechna = [...strediskaZeSouboru('krkonose'), ...strediskaZeSouboru('jizerske-hory')]
    expect(vsechna.filter((s) => s.vyskaObce != null)).toHaveLength(0)
  })
})
