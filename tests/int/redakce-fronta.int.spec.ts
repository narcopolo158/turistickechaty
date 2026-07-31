/**
 * Fronta redakční práce + zápis rozhodnutí (`src/lib/redakce/**`).
 *
 * Tohle je nervový systém redakčního prostředí: podle něj se pozná, co ještě
 * čeká, a jím se zapisuje, co člověk rozhodl. Testuje se proto trojí:
 *  1. že se stav ODVOZUJE z dat (povýšený = má profil, vyřazený = stojí ve
 *     `_vyrazeno.yaml`) a nikde se nevede zvlášť — druhý seznam by se rozešel,
 *  2. že zápis do YAML NEPŘIJDE o komentáře (v nich je půlka projektové
 *     paměti) a nic si nedomýšlí (`verified: false`, alt od člověka),
 *  3. že vady rozhodnutí (bez důvodu, odložený objekt s hotovým profilem)
 *     spadnou v `npm run kontrola`, ne až na webu.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

import { frontaFotek, mezeryProfilu, souhrnFronty, stavKandidatu } from '@/lib/redakce/fronta'
import {
  licenceDoCiselniku,
  pridejOdlozeni,
  pridejRozhodnutiFotky,
  pridejVyrazeni,
  uzJeVProfilu,
  vlozFotkuDoProfilu,
  zaznamFotky,
} from '@/lib/redakce/zapis'
import { vadyFronty } from '../../scripts/kontrola/fronta'

/** Malý, ale úplný datový strom — táž struktura, jakou má repo. */
const postavRepo = () => {
  const koren = mkdtempSync(join(tmpdir(), 'redakce-'))
  mkdirSync(join(koren, 'data', 'kandidati', 'krkonose'), { recursive: true })
  mkdirSync(join(koren, 'data', 'kandidati', 'fotky', 'krkonose'), { recursive: true })
  mkdirSync(join(koren, 'data', 'chaty', 'krkonose'), { recursive: true })

  const kandidat = (slug: string, nazev: string, osm: string) =>
    writeFileSync(
      join(koren, 'data', 'kandidati', 'krkonose', `${slug}.yaml`),
      `# komentář kandidáta\nnazev: ${nazev}\nslug: ${slug}\noblast: krkonose\ntyp: obsluhovana\nlat: 50.7\nlng: 15.7\novereniLokace:\n  source: OpenStreetMap ${osm} — ODbL\n`,
      'utf8',
    )
  kandidat('povysena', 'Povýšená', 'https://www.openstreetmap.org/way/1')
  kandidat('vyrazena', 'Vyřazená', 'https://www.openstreetmap.org/way/2')
  kandidat('odlozena', 'Odložená', 'https://www.openstreetmap.org/way/3')
  kandidat('ceka', 'Čeká', 'https://www.openstreetmap.org/way/4')

  writeFileSync(
    join(koren, 'data', 'chaty', 'krkonose', 'povysena.yaml'),
    '# profil\nnazev: Povýšená\nslug: povysena\noblast: krkonose\n',
    'utf8',
  )
  writeFileSync(
    join(koren, 'data', 'kandidati', '_vyrazeno.yaml'),
    'vyrazeno:\n  - osm: https://www.openstreetmap.org/way/2\n    slug: vyrazena\n    duvod: soukromý pronájem\n    checked: 2026-07-31\n',
    'utf8',
  )
  writeFileSync(
    join(koren, 'data', 'kandidati', '_odlozeno.yaml'),
    'odlozeno:\n  - slug: odlozena\n    oblast: krkonose\n    duvod: čeká na ověření v terénu\n    checked: 2026-07-31\n',
    'utf8',
  )
  writeFileSync(
    join(koren, 'data', 'kandidati', 'fotky', 'krkonose', 'povysena.yaml'),
    `chata: povysena\noblast: krkonose\nnazevChaty: Povýšená\nfotky:\n` +
      `  - soubor: 'File:Geo.jpg'\n    nahled: https://upload.wikimedia.org/geo.jpg\n    original: https://upload.wikimedia.org/geo-orig.jpg\n    stranka: https://commons.wikimedia.org/wiki/File:Geo.jpg\n    nalezeno: geosearch\n    licence: CC BY-SA 4.0\n    rozmery: 1000×800\n` +
      `  - soubor: 'File:Jmeno.jpg'\n    nahled: https://upload.wikimedia.org/jmeno.jpg\n    original: https://upload.wikimedia.org/jmeno-orig.jpg\n    stranka: https://commons.wikimedia.org/wiki/File:Jmeno.jpg\n    nalezeno: kategorie + fulltext\n    licence: CC BY 4.0\n    rozmery: 4000×4000\n`,
    'utf8',
  )
  return koren
}

describe('stav kandidátů se odvozuje z dat', () => {
  const koren = postavRepo()
  const stavy = Object.fromEntries(stavKandidatu(koren).map((k) => [k.slug, k]))

  it('povýšený = má profil, vyřazený = je ve _vyrazeno, odložený = v _odlozeno, zbytek čeká', () => {
    expect(stavy['povysena']!.stav).toBe('povysen')
    expect(stavy['vyrazena']!.stav).toBe('vyrazen')
    expect(stavy['odlozena']!.stav).toBe('odlozen')
    expect(stavy['ceka']!.stav).toBe('nezpracovan')
  })

  /** Vyřazení se páruje i podle OSM URL — slug se v OSM může přejmenovat. */
  it('vyřazení drží i po přejmenování (identita = OSM URL)', () => {
    const koren2 = postavRepo()
    const cesta = join(koren2, 'data', 'kandidati', 'krkonose', 'vyrazena.yaml')
    writeFileSync(cesta, readFileSync(cesta, 'utf8').replace('slug: vyrazena', 'slug: vyrazena-nove'), 'utf8')
    const znovu = stavKandidatu(koren2).find((k) => k.slug === 'vyrazena-nove')!
    expect(znovu.stav).toBe('vyrazen')
  })

  it('nezpracované řadí napřed — fronta má být vidět', () => {
    expect(stavKandidatu(koren)[0]!.stav).toBe('nezpracovan')
  })

  it('u rozhodnutých nese důvod, ať se nemusí dohledávat', () => {
    expect(stavy['vyrazena']!.duvod).toContain('soukromý pronájem')
    expect(stavy['odlozena']!.duvod).toContain('terénu')
  })
})

describe('fronta fotek', () => {
  const koren = postavRepo()

  it('silné nálezy (geotag) řadí před slabé, i když jsou slabé větší', () => {
    const ch = frontaFotek(koren)[0]!
    expect(ch.ceka.map((f) => f.soubor)).toEqual(['File:Geo.jpg', 'File:Jmeno.jpg'])
    expect(ch.ceka[0]!.silny).toBe(true)
    expect(ch.ceka[1]!.silny).toBe(false) // kategorie = shoda jména (Barborka × Barbórka)
  })

  it('odmítnutá fotka se do fronty nevrací', () => {
    writeFileSync(
      join(koren, 'data', 'kandidati', 'fotky', '_rozhodnuti.yaml'),
      "rozhodnuti:\n  - chata: povysena\n    soubor: 'File:Geo.jpg'\n    stav: odmitnuta\n    duvod: je na ní jen rozcestník\n    checked: 2026-07-31\n",
      'utf8',
    )
    const ch = frontaFotek(koren)[0]!
    expect(ch.ceka.map((f) => f.soubor)).toEqual(['File:Jmeno.jpg'])
    expect(ch.odmitnute).toHaveLength(1)
  })

  it('souhrn počítá jen profily, ne kandidáty bez profilu', () => {
    const s = souhrnFronty(koren)
    expect(s.fotky.profilu).toBe(1)
    expect(s.kandidati.nezpracovan).toBe(1)
    expect(s.dleOblasti.find((o) => o.oblast === 'krkonose')!.kandidatiNezpracovani).toBe(1)
  })
})

describe('zápis do profilu chaty', () => {
  const fotka = zaznamFotky({
    original: 'https://upload.wikimedia.org/x.jpg',
    stranka: 'https://commons.wikimedia.org/wiki/File:X.jpg',
    alt: 'Chata od jihu',
    autor: 'A. Autor',
    licence: 'CC BY-SA 4.0',
    datum: '2016-11-17 12:32:59',
    popis: 'popis ze zdroje',
    dnes: '2026-07-31',
  })

  it('nikdy netvrdí ověření — to smí jen člověk (konvence B)', () => {
    expect(fotka.overeni.verified).toBe(false)
    expect(fotka.licence).toBe('cc-by-sa')
    expect(fotka.alt).toBe('Chata od jihu')
  })

  it('licenci mimo číselník nehádá, ale rovnou to řekne', () => {
    expect(licenceDoCiselniku('GFDL')).toBeNull()
    expect(() =>
      zaznamFotky({ original: 'a', stranka: 'b', alt: 'c', licence: 'GFDL', dnes: '2026-07-31' }),
    ).toThrow(/číselníku/)
  })

  /**
   * ZÁPIS SMÍ ZMĚNIT JEN TO, CO PŘIBYLO. První verze načetla soubor knihovnou
   * `yaml` a vypsala ho zpátky: komentáře přežily, ale dlouhé složené bloky se
   * přelomily na jiné šířce a diff jednoho přidaného snímku měl 97 změněných
   * řádků (nález z ostrého testu 31. 7. 2026). Takový diff se nedá číst.
   */
  it('nechá původní text beze změny a jen doplní blok', () => {
    const puvodni =
      '# důležitý komentář\nnazev: Chata\nslug: chata\n# a ještě jeden\npopis: >-\n  hodně dlouhý složený text, který se nesmí přelomit jinde, než byl,\n  protože jinak je diff nečitelný\nvyska: 1200\n'
    const novy = vlozFotkuDoProfilu(puvodni, fotka)
    expect(novy.startsWith(puvodni)).toBe(true) // ani znak původního souboru se nezměnil
    const data = parse(novy) as { vyska: number; fotky: { stahnoutZ: string; overeni: { verified: boolean } }[] }
    expect(data.vyska).toBe(1200)
    expect(data.fotky).toHaveLength(1)
    expect(data.fotky[0]!.overeni.verified).toBe(false)
  })

  /** Datumy musí zůstat řetězcem — nekvotované `2026-07-31` je v YAML datum. */
  it('datumy zapisuje jako řetězec, ne jako datum', () => {
    const novy = vlozFotkuDoProfilu('nazev: Chata\n', fotka)
    expect(novy).toContain("prevzatoDne: '2026-07-31'")
    const data = parse(novy) as { fotky: { prevzatoDne: unknown; overeni: { checked: unknown } }[] }
    expect(typeof data.fotky[0]!.prevzatoDne).toBe('string')
    expect(typeof data.fotky[0]!.overeni.checked).toBe('string')
  })

  /** Blok `fotky:` nemusí být poslední klíč — vložit se musí dovnitř něj. */
  it('vloží položku do existujícího bloku, i když za ním jsou další klíče', () => {
    const puvodni =
      'nazev: Chata\nfotky:\n  - stahnoutZ: https://prvni.jpg\n    alt: první\nzajimavosti:\n  - text: něco\n'
    const novy = vlozFotkuDoProfilu(puvodni, fotka)
    const data = parse(novy) as { fotky: { stahnoutZ: string }[]; zajimavosti: unknown[] }
    expect(data.fotky.map((f) => f.stahnoutZ)).toEqual(['https://prvni.jpg', 'https://upload.wikimedia.org/x.jpg'])
    expect(data.zajimavosti).toHaveLength(1)
  })

  it('další fotka se přidá na konec, hero zůstane první', () => {
    const sJednou = vlozFotkuDoProfilu('nazev: Chata\n', fotka)
    const seDvema = vlozFotkuDoProfilu(sJednou, { ...fotka, stahnoutZ: 'https://upload.wikimedia.org/y.jpg' })
    const data = parse(seDvema) as { fotky: { stahnoutZ: string }[] }
    expect(data.fotky.map((f) => f.stahnoutZ)).toEqual([
      'https://upload.wikimedia.org/x.jpg',
      'https://upload.wikimedia.org/y.jpg',
    ])
  })

  it('pozná už zapsanou fotku (dvojklik nesmí založit duplicitu)', () => {
    const text = vlozFotkuDoProfilu('nazev: Chata\n', fotka)
    expect(uzJeVProfilu(text, 'https://upload.wikimedia.org/x.jpg')).toBe(true)
    expect(uzJeVProfilu(text, 'https://upload.wikimedia.org/jina.jpg')).toBe(false)
  })
})

describe('zápis rozhodnutí do seznamů', () => {
  it('nový _rozhodnuti.yaml vznikne i s hlavičkou, proč existuje', () => {
    const text = pridejRozhodnutiFotky(null, {
      chata: 'lucni-bouda',
      soubor: 'File:X.jpg',
      stav: 'odmitnuta',
      duvod: 'je na ní jen značka',
      rozhodl: 'michal@example.com',
      checked: '2026-07-31',
    })
    expect(text).toMatch(/^#/) // hlavička komentářem
    expect(text).toContain('odmitnuta')
    const data = parse(text) as { rozhodnuti: { chata: string; duvod: string }[] }
    expect(data.rozhodnuti[0]!.chata).toBe('lucni-bouda')
  })

  it('vyřazení nese OSM URL jako identitu (přežije přejmenování)', () => {
    const text = pridejVyrazeni('vyrazeno:\n  - slug: stara\n    duvod: x\n', {
      slug: 'nova',
      osm: 'https://www.openstreetmap.org/way/9',
      duvod: 'apartmány bez občerstvení',
      rozhodl: 'michal@example.com',
      checked: '2026-07-31',
    })
    const data = parse(text) as { vyrazeno: { slug: string; osm?: string }[] }
    expect(data.vyrazeno).toHaveLength(2)
    expect(data.vyrazeno[1]!.osm).toBe('https://www.openstreetmap.org/way/9')
  })

  it('odložení se přidá do existujícího seznamu, nepřepíše ho', () => {
    const text = pridejOdlozeni('odlozeno:\n  - slug: prvni\n    oblast: krkonose\n    duvod: a\n', {
      slug: 'druha',
      oblast: 'jizerske-hory',
      duvod: 'čeká na odpověď chataře',
      rozhodl: 'michal@example.com',
      checked: '2026-07-31',
    })
    const data = parse(text) as { odlozeno: { slug: string }[] }
    expect(data.odlozeno.map((o) => o.slug)).toEqual(['prvni', 'druha'])
  })
})

describe('vady fronty (kontrola)', () => {
  it('čistý stav nehlásí nic', () => {
    expect(vadyFronty(postavRepo())).toEqual([])
  })

  it('odložený objekt, který už má profil, je vada — jinak fronta lže', () => {
    const koren = postavRepo()
    writeFileSync(
      join(koren, 'data', 'kandidati', '_odlozeno.yaml'),
      'odlozeno:\n  - slug: povysena\n    oblast: krkonose\n    duvod: cokoliv\n',
      'utf8',
    )
    expect(vadyFronty(koren).map((v) => v.zprava).join(' ')).toMatch(/profil už existuje/)
  })

  it('rozhodnutí bez důvodu nebo k neznámému objektu je vada', () => {
    const koren = postavRepo()
    writeFileSync(
      join(koren, 'data', 'kandidati', 'fotky', '_rozhodnuti.yaml'),
      "rozhodnuti:\n  - chata: neexistuje\n    stav: uzavrena\n    duvod: ''\n",
      'utf8',
    )
    const zpravy = vadyFronty(koren).map((v) => v.zprava).join(' ')
    expect(zpravy).toMatch(/neznámý objekt/)
    expect(zpravy).toMatch(/nemá důvod/)
  })
})

/**
 * Úplnost profilů (doplněno 31. 7. 2026). Fronta původně hlídala jen to, jestli
 * profil VZNIKL a má fotku — jenže chata může mít profil a přitom mlčet: bez
 * GPS se nedostane na mapu, bez kontaktu si čtenář neověří otvíračku, bez data
 * kontroly nikdo nepozná, že údaj zestárl. Nic z toho nespadne, tak to musí
 * někdo počítat.
 */
describe('mezery v profilech', () => {
  const postavProfil = (obsah: string) => {
    const koren = mkdtempSync(join(tmpdir(), 'mezery-'))
    mkdirSync(join(koren, 'data', 'chaty', 'krkonose'), { recursive: true })
    mkdirSync(join(koren, 'data', 'trasy', 'krkonose'), { recursive: true })
    writeFileSync(join(koren, 'data', 'chaty', 'krkonose', 'chata.yaml'), obsah, 'utf8')
    writeFileSync(
      join(koren, 'data', 'trasy', 'krkonose', 'pristupove-trasy.json'),
      JSON.stringify({ chaty: { 'jina-chata': {} } }),
      'utf8',
    )
    return koren
  }

  it('prázdný profil hlásí všechno, co chybí', () => {
    const koren = postavProfil('nazev: Chata\nslug: chata\noblast: krkonose\n')
    const m = mezeryProfilu(koren, '2026-07-31')[0]!
    expect(m.chybi.sort()).toEqual(['GPS', 'fotka', 'kontakt', 'otvírací doba', 'přístupová trasa'].sort())
    expect(m.nejstarsiOvereni).toBeNull()
    expect(m.stariDnu).toBeNull()
  })

  it('vyplněný profil nehlásí nic a trasu bere z výstupu DATA-06', () => {
    const koren = postavProfil(
      'nazev: Chata\nslug: jina-chata\noblast: krkonose\nlat: 50.7\nlng: 15.7\nsezona: celoročně\nkontakty:\n  telefon: 123\nfotky:\n  - stahnoutZ: https://x.jpg\n',
    )
    expect(mezeryProfilu(koren, '2026-07-31')[0]!.chybi).toEqual([])
  })

  /** Stárnutí se počítá k předanému dni, ne ke kalendáři — jinak by test hnil. */
  it('stáří ověření bere NEJSTARŠÍ blok, ne nejnovější', () => {
    const koren = postavProfil(
      'nazev: Chata\nslug: chata\noblast: krkonose\novereniLokace:\n  checked: 2024-07-31\novereniProvoz:\n  checked: 2026-07-30\n',
    )
    const m = mezeryProfilu(koren, '2026-07-31')[0]!
    expect(m.nejstarsiOvereni).toBe('2024-07-31')
    expect(m.stariDnu).toBe(730)
  })

  it('souhrn počítá profily s mezerou i zastaralá ověření', () => {
    const koren = postavProfil(
      'nazev: Chata\nslug: chata\noblast: krkonose\novereniLokace:\n  checked: 2024-07-31\n',
    )
    const s = souhrnFronty(koren, '2026-07-31')
    expect(s.profily.celkem).toBe(1)
    expect(s.profily.sMezerou).toBe(1)
    expect(s.profily.zastaraleOvereni).toBe(1)
    expect(s.profily.dleDruhu.map((d) => d.druh)).toContain('GPS')
  })
})
