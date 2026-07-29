/**
 * DATA-33: fotky středisek z Commons — výběr a licenční síto.
 *
 * Na rozdíl od fotek chat tady skript rovnou stahuje, takže testy hlídají to,
 * co se nesmí pokazit tiše: že projde jen licenčně čistý snímek s doloženým
 * autorem (uvedení autora je podmínka CC BY/BY-SA, ne ozdoba) a že pořadí
 * výběru je přesně to napsané v hlavičce skriptu — jinak by se do repa
 * commitla náhodná fotka a nikdo by nepoznal proč.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  jeOLanovce,
  jeOStavbe,
  jePohledZLanovky,
  jmenujeJinouDrahu,
  kandidatZeStranky,
  nactiStrediska,
  popisSouboru,
  rozlisujiciSlova,
  seradKandidaty,
  shodaNazvu,
  vyberProObjekt,
  type FotkaStrediska,
} from '../../scripts/data33-fotky-stredisek'

const stranka = (prepis: Record<string, unknown> = {}) => ({
  title: 'File:Harrachov.jpg',
  imageinfo: [
    {
      url: 'https://upload.wikimedia.org/x/Harrachov.jpg',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Harrachov.jpg',
      thumburl: 'https://upload.wikimedia.org/thumb/Harrachov.jpg/1600px.jpg',
      width: 2400,
      height: 1600,
      extmetadata: {
        Artist: { value: '<a href="/wiki/User:Foto">Jan Fotograf</a>' },
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
      },
      ...(prepis.imageinfo0 as object),
    },
  ],
  ...prepis,
})

const foto = (p: Partial<FotkaStrediska>): FotkaStrediska => ({
  soubor: 'File:X.jpg',
  autor: 'Autor',
  licence: 'CC BY-SA 4.0',
  stranka: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  original: 'https://upload.wikimedia.org/X.jpg',
  nahled: 'https://upload.wikimedia.org/thumb/X.jpg',
  sirka: 1000,
  vyska: 800,
  nalezeno: 'geosearch',
  ...p,
})

describe('hlavičky HTTP snesou jen znaky do 255', () => {
  /**
   * První ostrý běh DATA-33 spadl na `Cannot convert argument to a ByteString
   * because the character at index 36 has a value of 345` — bylo to „ř" ze
   * slova „středisek" v User-Agentu. Hodnota hlavičky se převádí na ByteString
   * (znaky ≤ 255), takže „í" (237) projde a „ř" (345) ani „ě" (283) ne.
   *
   * Test schválně nekontroluje jen DATA-33: past je v tom, že se chyba
   * neprojeví u nikoho, kdo má v UA náhodou jen znaky do 255, a další skript
   * si ji přinese znovu. Proto se čtou VŠECHNY skripty a hlídá se KAŽDÝ řetězec
   * přiřazený hlavičce.
   */
  const SKRIPTY = join(process.cwd(), 'scripts')
  const zdroje = readdirSync(SKRIPTY)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({ f, text: readFileSync(join(SKRIPTY, f), 'utf8') }))

  it('žádný skript neposílá do hlavičky znak nad 255', () => {
    const spatne: string[] = []
    for (const { f, text } of zdroje) {
      // 'User-Agent': '…' i konstanty, které se do hlavičky dosazují.
      for (const m of text.matchAll(/'(?:User-Agent|Referer|Accept[\w-]*)':\s*'([^']*)'/gu)) {
        if ([...m[1]].some((z) => z.codePointAt(0)! > 255)) spatne.push(`${f}: ${m[1]}`)
      }
      for (const m of text.matchAll(/^const (?:UA|USER_AGENT) = '([^']*)'/gmu)) {
        if ([...m[1]].some((z) => z.codePointAt(0)! > 255)) spatne.push(`${f}: ${m[1]}`)
      }
    }
    expect(spatne, `hlavičky s nepřevoditelným znakem:\n${spatne.join('\n')}`).toEqual([])
  })

  it('test by ten pád opravdu chytil (kontrola samotné kontroly)', () => {
    const stary = 'turistickechaty.cz (DATA-33 fotky středisek; repo narcopolo158/turistickechaty)'
    const zavadne = [...stary].filter((z) => z.codePointAt(0)! > 255)
    expect(zavadne).toEqual(['ř'])
    expect(stary.codePointAt(36)).toBe(345)
  })
})

describe('načtení středisek', () => {
  it('bere jen střediska se souřadnicemi, meta soubory přeskakuje', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'data33-'))
    mkdirSync(tmp, { recursive: true })
    writeFileSync(join(tmp, 'harrachov.yaml'), 'nazev: Harrachov\nslug: harrachov\nlat: 50.77\nlng: 15.43\n', 'utf8')
    writeFileSync(join(tmp, 'bez-gps.yaml'), 'nazev: Bez GPS\nslug: bez-gps\n', 'utf8')
    writeFileSync(join(tmp, '_fotky-krkonose.json'), '{}', 'utf8')
    expect(nactiStrediska(tmp, 'krkonose')).toEqual([
      { slug: 'harrachov', nazev: 'Harrachov', oblast: 'krkonose', profil: 'rucni', lat: 50.77, lng: 15.43 },
    ])
    expect(nactiStrediska(join(tmp, 'neni'), 'krkonose')).toEqual([])
  })
})

describe('licenční síto a doložení autora', () => {
  it('čistá licence s autorem projde a nese obě URL i rozměry', () => {
    const v = kandidatZeStranky(stranka(), 'geosearch')
    expect('odmitnuto' in v).toBe(false)
    expect(v).toMatchObject({
      soubor: 'File:Harrachov.jpg',
      licence: 'CC BY-SA 4.0',
      stranka: 'https://commons.wikimedia.org/wiki/File:Harrachov.jpg',
      nahled: 'https://upload.wikimedia.org/thumb/Harrachov.jpg/1600px.jpg',
      sirka: 2400,
      nalezeno: 'geosearch',
    })
    expect((v as FotkaStrediska).autor).toContain('Jan Fotograf')
  })

  it('NC/ND licence neprojde', () => {
    const v = kandidatZeStranky(
      stranka({ imageinfo0: { extmetadata: { Artist: { value: 'Kdo' }, LicenseShortName: { value: 'CC BY-NC 3.0' } } } }),
      'geosearch',
    )
    expect(v).toHaveProperty('odmitnuto')
    expect((v as { odmitnuto: string }).odmitnuto).toMatch(/komerční|NC/)
  })

  it('bez doloženého autora se fotka nestahuje, i když licence prošla', () => {
    const v = kandidatZeStranky(
      stranka({ imageinfo0: { extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' } } } }),
      'geosearch',
    )
    expect((v as { odmitnuto: string }).odmitnuto).toMatch(/autor/)
  })

  it('odpověď bez URL nebo rozměrů se odmítne (nedá se ani stáhnout, ani vykreslit)', () => {
    const v = kandidatZeStranky(
      stranka({ imageinfo0: { url: undefined, width: undefined } }),
      'fulltext',
    )
    expect((v as { odmitnuto: string }).odmitnuto).toMatch(/URL nebo rozměry/)
  })
})

describe('pořadí výběru', () => {
  it('geosearch má přednost před fulltextem', () => {
    const [prvni] = seradKandidaty([
      foto({ soubor: 'File:Fulltext.jpg', nalezeno: 'fulltext', sirka: 4000, vyska: 3000 }),
      foto({ soubor: 'File:Geo.jpg', nalezeno: 'geosearch', sirka: 800, vyska: 600 }),
    ])
    expect(prvni.soubor).toBe('File:Geo.jpg')
  })

  it('na šířku před na výšku, pak větší plocha', () => {
    const poradi = seradKandidaty([
      foto({ soubor: 'File:NaVysku.jpg', sirka: 3000, vyska: 4000 }),
      foto({ soubor: 'File:MalaSirka.jpg', sirka: 900, vyska: 600 }),
      foto({ soubor: 'File:VelkaSirka.jpg', sirka: 2000, vyska: 1300 }),
    ]).map((f) => f.soubor)
    expect(poradi).toEqual(['File:VelkaSirka.jpg', 'File:MalaSirka.jpg', 'File:NaVysku.jpg'])
  })

  it('redakční `prefer` přebije všechna ostatní pravidla', () => {
    const [prvni] = seradKandidaty(
      [
        foto({ soubor: 'File:Geo.jpg', nalezeno: 'geosearch', sirka: 4000, vyska: 2000 }),
        foto({ soubor: 'File:RedakceChce.jpg', nalezeno: 'fulltext', sirka: 700, vyska: 900 }),
      ],
      'File:RedakceChce.jpg',
    )
    expect(prvni.soubor).toBe('File:RedakceChce.jpg')
  })

  /**
   * Přesně ten případ, který první ostrý běh prohrál: Hofmanky Express dostal
   * geotagovaný snímek sousední Protěže, protože geosearch měl přednost před
   * fulltextem. Geotag ale říká jen „vyfoceno poblíž"; doložené jméno v názvu
   * souboru je silnější důkaz než souřadnice o pár set metrů vedle.
   */
  it('snímek, který dráhu JMENUJE, jde před ten, který ji jen geotaguje', () => {
    const [prvni] = seradKandidaty(
      [
        foto({ soubor: 'File:Lanovka Protěž, pohled od Slunečné dolů.jpg', nalezeno: 'geosearch', sirka: 4000, vyska: 3000 }),
        foto({ soubor: 'File:Janske Lazne 2022 P57 Hofmanky Express.jpg', nalezeno: 'fulltext', sirka: 1000, vyska: 800 }),
      ],
      { nazev: 'Hofmanky Express' },
    )
    expect(prvni.soubor).toContain('Hofmanky Express')
  })
})

/**
 * Rezervace souborů (jeden soubor = jeden objekt) a její střet s redakční
 * volbou.
 *
 * Tenhle blok existuje kvůli konkrétní škodě: druhý ostrý běh 29. 7. 2026
 * si `prefer` předrezervoval mezi „už použité", takže si ho vlastní objekt
 * nesměl vzít. Tři redakční volby se tiše ignorovaly a Čertova hora — která
 * měla jediného kandidáta, a byl to právě její `prefer` — vypadla z manifestu
 * úplně. Na výsledku to nevypadalo jako chyba, jen jako „na Commons nic není".
 */
describe('rezervace souborů vs. redakční volba', () => {
  const kand = (soubor: string, p: Partial<FotkaStrediska> = {}) => foto({ soubor, ...p })

  it('objekt si svůj `prefer` vezme, i když je předem rezervovaný', () => {
    const { vybrano } = vyberProObjekt([kand('File:A.jpg'), kand('File:Chce.jpg')], {
      prefer: 'File:Chce.jpg',
      pouzite: new Set(['File:Chce.jpg']),
    })
    expect(vybrano?.soubor).toBe('File:Chce.jpg')
  })

  it('jediný kandidát, který je zároveň `prefer`, nesmí objekt připravit o fotku', () => {
    const { vybrano } = vyberProObjekt([kand('File:Harrachov - wyciąg 001.JPG')], {
      prefer: 'File:Harrachov - wyciąg 001.JPG',
      pouzite: new Set(['File:Harrachov - wyciąg 001.JPG']),
    })
    expect(vybrano).toBeTruthy()
  })

  it('cizímu objektu rezervovaný soubor naopak nedá — od toho rezervace je', () => {
    const { vybrano } = vyberProObjekt([kand('File:Rezervovano.jpg'), kand('File:Volne.jpg')], {
      pouzite: new Set(['File:Rezervovano.jpg']),
    })
    expect(vybrano?.soubor).toBe('File:Volne.jpg')
  })

  it('když jsou všechny obsazené, vrátí prázdno místo cizí fotky', () => {
    const { vybrano } = vyberProObjekt([kand('File:A.jpg')], { pouzite: new Set(['File:A.jpg']) })
    expect(vybrano).toBeUndefined()
  })
})

/**
 * Síta předmětu snímku (oprava po prvním ostrém běhu, 29. 7. 2026).
 *
 * Samo slovo „lanovka" v názvu nestačilo: na stránky drah se dostala sousední
 * dráha, dům pod dráhou i výhled Z kabiny. Každé síto má proto svůj test —
 * a hlavně test na to, co propustit MUSÍ, protože nejsnazší způsob, jak síto
 * „opravit", je utáhnout ho tak, že nepustí ani správný snímek.
 */
describe('kdo je na snímku', () => {
  const stranka = (title: string, popis?: string) =>
    ({
      title,
      imageinfo: [{ extmetadata: popis ? { ImageDescription: { value: popis } } : {} }],
    }) as Parameters<typeof jeOStavbe>[0]

  const DRAHY = ['Hofmanky Express', 'Protěž', 'Hnědý vrch', 'Zahrádky Express', 'Szrenica I', 'Szrenica II', 'Čertova hora']

  describe('cizí dráha', () => {
    it('„Lanovka Protěž" se nesmí vydávat za Hofmanky Express', () => {
      expect(jmenujeJinouDrahu(stranka('File:Lanovka Protěž, pohled od Slunečné dolů.jpg'), 'Hofmanky Express', DRAHY)).toBe(true)
      expect(jmenujeJinouDrahu(stranka('File:Lanová dráha Pec pod Sněžkou-Hnědý vrch, lanovka(1).jpg'), 'Zahrádky Express', DRAHY)).toBe(true)
    })

    it('vlastní dráze její vlastní snímek nevetuje', () => {
      expect(jmenujeJinouDrahu(stranka('File:Lanovka Protěž,spodní stanice.jpg'), 'Protěž', DRAHY)).toBe(false)
    })

    it('Szrenica I a II se navzájem nevetují — rozlišující slovo mají společné', () => {
      const s = stranka('File:Wyciąg na Szrenicę - przesiadka na II etap - panoramio.jpg')
      expect(jmenujeJinouDrahu(s, 'Szrenica I', DRAHY)).toBe(false)
      expect(jmenujeJinouDrahu(s, 'Szrenica II', DRAHY)).toBe(false)
      // …zato Karkonosz Express, který v textu není, tenhle snímek nedostane.
      expect(jmenujeJinouDrahu(s, 'Karkonosz Express', DRAHY)).toBe(true)
    })

    it('skloňovaný tvar polského jména se pozná (Szrenicę, Szrenice)', () => {
      expect(shodaNazvu('wyciag na szrenice', 'Szrenica I')).toBe('plna')
      expect(rozlisujiciSlova('1 - Wyciąg „Zbyszek"')).toEqual(['zbyszek'])
      expect(rozlisujiciSlova('Hnědý vrch')).toEqual(['hnedy'])
    })
  })

  describe('stavba pod dráhou', () => {
    it('dům ani hotel nejsou fotka dráhy, i když ji název zmiňuje', () => {
      expect(jeOStavbe(stranka('File:Černý Důl, čp. 263 pod lanovkou Saxner.jpg'))).toBe(true)
      expect(jeOStavbe(stranka('File:Karpacz, Hotel Gołębiewski - fotopolska.eu (192884).jpg'))).toBe(true)
    })

    it('stanice dráhy stavba v tomhle smyslu není — jinak by síto vyhodilo to nejlepší', () => {
      expect(jeOStavbe(stranka('File:Černý Důl, dolní stanice lanovky Saxner.jpg'))).toBe(false)
      expect(jeOStavbe(stranka('File:Špindlerův Mlýn, sedačková lanovka na Medvědín.jpg'))).toBe(false)
    })
  })

  describe('výhled Z lanovky', () => {
    it('„Widok z wyciągu" je snímek krajiny, ne dráhy', () => {
      expect(jePohledZLanovky(stranka('File:Widok z wyciągu ^1 - panoramio.jpg'))).toBe(true)
    })

    it('„pohled od Slunečné dolů" je naopak pohled NA dráhu a projít musí', () => {
      expect(jePohledZLanovky(stranka('File:Lanovka Protěž, pohled od Slunečné dolů.jpg'))).toBe(false)
    })
  })

  it('popiska pod fotkou je název souboru bez File: a bez přípony', () => {
    expect(popisSouboru('File:Lanovka_Svatý_Petr-Pláň_1949.png')).toBe('Lanovka Svatý Petr-Pláň 1949')
  })
})

/**
 * Hlídka nad tím, co je opravdu v repu. Testy výš hlídají pravidla, tenhle
 * hlídá výsledek — protože ke čtenáři se dostane commitnutý manifest, ne
 * funkce. Po prvním ostrém běhu měly tři dvojice drah tutéž fotku; u jedné
 * z každé dvojice to nutně byl snímek cizí dráhy.
 */
describe('manifest v repu', () => {
  const manifest = (cesta: string, klic: string) => {
    const p = join(process.cwd(), 'data', cesta)
    if (!existsSync(p)) return []
    return (JSON.parse(readFileSync(p, 'utf8'))[klic] ?? []) as {
      slug: string
      soubor: string
      popis?: string
      vybrano: { soubor: string }
    }[]
  }
  const lanovky = manifest(join('lanovky', '_fotky-krkonose.json'), 'lanovky')
  const strediska = manifest(join('strediska', '_fotky-krkonose.json'), 'strediska')

  it('jeden soubor z Commons slouží nejvýš jednomu objektu', () => {
    for (const [kde, zaznamy] of [
      ['lanovky', lanovky],
      ['střediska', strediska],
    ] as const) {
      const dle = new Map<string, string[]>()
      for (const z of zaznamy) dle.set(z.vybrano.soubor, [...(dle.get(z.vybrano.soubor) ?? []), z.slug])
      const sdilene = [...dle].filter(([, slugy]) => slugy.length > 1)
      expect(sdilene, `${kde}: tentýž soubor u víc objektů → u jednoho z nich je to fotka něčeho jiného`).toEqual([])
    }
  })

  it('každý záznam nese popisku, aby fotka na webu řekla, co je na ní', () => {
    const bez = [...lanovky, ...strediska].filter((z) => !z.popis).map((z) => z.slug)
    expect(bez).toEqual([])
  })

  it('ke každému záznamu existuje i stažený soubor (a naopak žádný osiřelý)', () => {
    for (const [adresar, zaznamy] of [
      ['lanovky', lanovky],
      ['strediska', strediska],
    ] as const) {
      const kor = join(process.cwd(), 'public', adresar)
      const naDisku = existsSync(kor) ? readdirSync(kor).filter((f) => f.endsWith('.jpg')).sort() : []
      expect(zaznamy.map((z) => `${z.slug}.jpg`).sort(), `${adresar}: manifest a public/ se rozešly`).toEqual(naDisku)
    }
  })
})

/**
 * Síto lanovek (zadání Michala 29. 7. 2026: „sběr fotek lanovek zařaď").
 *
 * U střediska stačí, že snímek pochází z obce — je to fotka MÍSTA. U lanovky
 * ne: geosearch kolem dráhy vrátí i kostel z téže vsi a takový snímek by na
 * stránce lanovky tvrdil něco, co na něm není. Proto tenhle test — kdyby síto
 * jednou přestalo platit, stránka by vypadala pořád stejně a nikdo by nepoznal,
 * že se dívá na náves.
 */
describe('síto „je to opravdu lanovka"', () => {
  const stranka = (title: string, popis?: string) =>
    ({
      title,
      imageinfo: [
        {
          url: 'https://upload.wikimedia.org/x.jpg',
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
          width: 1000,
          height: 800,
          extmetadata: popis ? { ImageDescription: { value: popis } } : {},
        },
      ],
    }) as Parameters<typeof jeOLanovce>[0]

  it('pozná lanovku česky, polsky, německy i anglicky', () => {
    expect(jeOLanovce(stranka('File:Lanovka na Sněžku.jpg'))).toBe(true)
    expect(jeOLanovce(stranka('File:Kolej linowa Szrenica.jpg'))).toBe(true)
    expect(jeOLanovce(stranka('File:Seilbahn Schneekoppe.jpg'))).toBe(true)
    expect(jeOLanovce(stranka('File:Chairlift Medvedin.jpg'))).toBe(true)
  })

  it('vezme i snímek, který lanovku jmenuje až v popisu', () => {
    expect(jeOLanovce(stranka('File:IMG_2043.jpg', 'Sedačková lanovka na Portášky'))).toBe(true)
  })

  it('kostel z téže vsi neprojde — a to je celý smysl toho síta', () => {
    expect(jeOLanovce(stranka('File:Kostel svatého Petra, Pec pod Sněžkou.jpg'))).toBe(false)
    expect(jeOLanovce(stranka('File:Namesti v Peci.jpg', 'Pohled na náměstí'))).toBe(false)
  })
})
