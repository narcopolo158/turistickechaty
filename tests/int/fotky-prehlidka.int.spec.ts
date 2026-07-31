/**
 * Kontaktní arch kandidátních fotek (`scripts/fotky-prehlidka.ts`).
 *
 * Arch je redakční nástroj, ale rozhoduje se v něm o tom, co půjde na web —
 * proto se testuje jako datová věc, ne jako kosmetika. Hlídá se trojí:
 *  1. Že se SLABÉ nálezy (jen shoda jména ve fulltextu) nesmíchají se
 *     silnými. Konkrétní důvod: chata „Barbora" si fulltextem přitáhla
 *     28 portrétů herečky Barbory Štěpánové — kdyby se míchaly, redakce by
 *     v nich vybírala jako v rovnocenné nabídce.
 *  2. Že vygenerovaný YAML blok NIC NETVRDÍ za člověka: `verified: false`,
 *     prázdný `alt` a licence, která se nevejde do číselníku, se nehádá.
 *  3. Že se napřed nabízejí profily bez fotky — ne objekty, které profilem
 *     teprve možná budou.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  jeSilny,
  licenceDoCiselniku,
  nactiKandidaty,
  plocha,
  sestavHtml,
  yamlBlok,
  type Kandidat,
} from '../../scripts/fotky-prehlidka'

const fotka = (prepis: Partial<Kandidat>): Kandidat => ({
  soubor: 'File:X.jpg',
  autor: 'Autor',
  licence: 'CC BY-SA 4.0',
  stranka: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  original: 'https://upload.wikimedia.org/wikipedia/commons/x/X.jpg',
  nahled: 'https://upload.wikimedia.org/wikipedia/commons/thumb/x/X.jpg/960px-X.jpg',
  nalezeno: 'geosearch',
  rozmery: '1000×800',
  ...prepis,
})

describe('síla nálezu', () => {
  it('silný je jen geotag u chaty', () => {
    expect(jeSilny(fotka({ nalezeno: 'geosearch' }))).toBe(true)
    expect(jeSilny(fotka({ nalezeno: 'geosearch + fulltext' }))).toBe(true)
    expect(jeSilny(fotka({ nalezeno: 'fulltext' }))).toBe(false)
    expect(jeSilny(fotka({ nalezeno: undefined }))).toBe(false)
  })

  /**
   * Kategorie vypadá jako doklad, ale přiřazuje se podle shody JMÉNA. První
   * verze archu ji brala jako silný signál a hned se ukázalo, proč to nejde:
   * chata Barborka dostala 50 snímků z polské kategorie „Barbórka" —
   * hornického svátku v Bytomi. Test drží ten nález.
   */
  it('kategorie je slabý signál — homonyma (Barborka × Barbórka)', () => {
    expect(jeSilny(fotka({ nalezeno: 'kategorie' }))).toBe(false)
    expect(jeSilny(fotka({ nalezeno: 'kategorie + fulltext' }))).toBe(false)
    // Geotag zůstává silný i v kombinaci s kategorií.
    expect(jeSilny(fotka({ nalezeno: 'geosearch + kategorie' }))).toBe(true)
  })
})

describe('licence do číselníku kolekce Fotky', () => {
  it('mapuje běžné varianty Commons', () => {
    expect(licenceDoCiselniku('CC BY-SA 3.0')).toBe('cc-by-sa')
    expect(licenceDoCiselniku('CC BY-SA 3.0 pl')).toBe('cc-by-sa')
    expect(licenceDoCiselniku('CC BY 4.0')).toBe('cc-by')
    expect(licenceDoCiselniku('CC0')).toBe('cc0')
    expect(licenceDoCiselniku('Public domain')).toBe('pd')
  })

  /** Co číselník nezná, se NEHÁDÁ — jinak by se do repa dostala špatná licence. */
  it('neznámou licenci nedomýšlí', () => {
    expect(licenceDoCiselniku('GFDL')).toBeNull()
    expect(licenceDoCiselniku(undefined)).toBeNull()
  })
})

describe('řazení podle rozlišení', () => {
  it('spočítá plochu z „š×v", jinak nulu', () => {
    expect(plocha('3539×3400')).toBe(12_032_600)
    expect(plocha('nesmysl')).toBe(0)
    expect(plocha(undefined)).toBe(0)
  })
})

describe('YAML blok pro profil chaty', () => {
  const blok = yamlBlok(
    fotka({ autor: 'David Sedlecký', datum: '2016-11-17 12:32:59', popis: 'Chata z jihu' }),
    '2026-07-31',
  )

  it('má tvar, který čte seed (stahnoutZ + metadata + ověření)', () => {
    expect(blok.startsWith('fotky:\n  - stahnoutZ: https://upload.wikimedia.org/')).toBe(true)
    expect(blok).toContain('    typ: soucasna')
    expect(blok).toContain('    licence: cc-by-sa')
    expect(blok).toContain('    licencePoznamka: CC BY-SA 4.0')
    expect(blok).toContain('    autor: David Sedlecký')
    expect(blok).toContain('    datovani: 2016-11-17')
    expect(blok).toContain("    prevzatoDne: '2026-07-31'")
  })

  /**
   * Konvence B: `verified: true` smí padnout jen od člověka. Export ho nesmí
   * předvyplnit ani omylem — a `alt` je tvrzení o tom, co je na snímku, takže
   * ho stroj taky nepíše.
   */
  it('nikdy netvrdí ověření ani obsah snímku', () => {
    expect(blok).toContain('      verified: false')
    expect(blok).not.toMatch(/verified:\s*true/)
    expect(blok).toMatch(/alt: ''/)
    expect(blok).toContain('DOPLNIT')
  })

  it('u licence mimo číselník řekne, že ji má doplnit člověk', () => {
    const cizi = yamlBlok(fotka({ licence: 'GFDL' }), '2026-07-31')
    expect(cizi).toMatch(/licence: # DOPLNIT/)
    expect(cizi).toContain('GFDL')
  })
})

describe('načtení kandidátů nad datovou strukturou', () => {
  const koren = mkdtempSync(join(tmpdir(), 'prehlidka-'))
  const kandidati = join(koren, 'kandidati')
  const chaty = join(koren, 'chaty')
  mkdirSync(join(kandidati, 'krkonose'), { recursive: true })
  mkdirSync(join(chaty, 'krkonose'), { recursive: true })

  const zapisKandidaty = (slug: string, nazev: string, fotky: Kandidat[]) =>
    writeFileSync(
      join(kandidati, 'krkonose', `${slug}.yaml`),
      `chata: ${slug}\noblast: krkonose\nnazevChaty: ${nazev}\nfotky:\n${fotky
        .map(
          (f) =>
            `  - soubor: ${f.soubor}\n    nahled: ${f.nahled}\n    stranka: ${f.stranka}\n    nalezeno: ${f.nalezeno}\n    rozmery: ${f.rozmery}\n    licence: ${f.licence}\n`,
        )
        .join('')}`,
      'utf8',
    )

  zapisKandidaty('bez-fotky', 'Bez fotky', [
    fotka({ soubor: 'File:A.jpg', nalezeno: 'geosearch', rozmery: '100×100' }),
    fotka({ soubor: 'File:B.jpg', nalezeno: 'geosearch', rozmery: '900×900' }),
    fotka({ soubor: 'File:C.jpg', nalezeno: 'fulltext', rozmery: '4000×4000' }),
  ])
  zapisKandidaty('uz-ma', 'Už má', [fotka({ soubor: 'File:D.jpg' })])
  zapisKandidaty('jen-kandidat', 'Jen kandidát', [fotka({ soubor: 'File:E.jpg' })])

  writeFileSync(join(chaty, 'krkonose', 'bez-fotky.yaml'), 'slug: bez-fotky\nnazev: Bez fotky\n', 'utf8')
  writeFileSync(
    join(chaty, 'krkonose', 'uz-ma.yaml'),
    'slug: uz-ma\nnazev: Už má\nfotky:\n  - stahnoutZ: https://example.org/x.jpg\n',
    'utf8',
  )

  const nactene = nactiKandidaty(kandidati, chaty)

  it('pozná profil, profil s fotkou i pouhého kandidáta', () => {
    const dle = Object.fromEntries(nactene.map((ch) => [ch.slug, ch]))
    expect(dle['bez-fotky']!.jeProfil).toBe(true)
    expect(dle['bez-fotky']!.maFotku).toBe(false)
    expect(dle['uz-ma']!.maFotku).toBe(true)
    expect(dle['jen-kandidat']!.jeProfil).toBe(false)
  })

  it('slabé nálezy drží stranou, i když jsou největší', () => {
    const ch = nactene.find((c) => c.slug === 'bez-fotky')!
    expect(ch.silne.map((f) => f.soubor)).toEqual(['File:B.jpg', 'File:A.jpg']) // dle rozlišení
    expect(ch.slabe.map((f) => f.soubor)).toEqual(['File:C.jpg']) // 4000×4000, a přesto stranou
  })

  it('napřed nabízí profily bez fotky', () => {
    expect(nactene[0]!.slug).toBe('bez-fotky')
    expect(nactene.at(-1)!.slug).toBe('jen-kandidat')
  })

  it('arch je samostatná stránka bez externích závislostí a nese oba oddíly', () => {
    const html = sestavHtml(nactene, '2026-07-31', 'Test')
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).not.toMatch(/<link[^>]+stylesheet|<script[^>]+src=/)
    expect(html).toContain('slabé nálezy')
    expect(html).toContain('zatím jen kandidát, ne profil')
    // Miniatury míří na Commons — arch je proto k ničemu offline, zato se
    // nemusí nic stahovat do repa.
    expect(html).toContain('upload.wikimedia.org')
  })
})
