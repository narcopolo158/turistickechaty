/**
 * DATA-33: fotky středisek z Commons — výběr a licenční síto.
 *
 * Na rozdíl od fotek chat tady skript rovnou stahuje, takže testy hlídají to,
 * co se nesmí pokazit tiše: že projde jen licenčně čistý snímek s doloženým
 * autorem (uvedení autora je podmínka CC BY/BY-SA, ne ozdoba) a že pořadí
 * výběru je přesně to napsané v hlavičce skriptu — jinak by se do repa
 * commitla náhodná fotka a nikdo by nepoznal proč.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  kandidatZeStranky,
  nactiStrediska,
  seradKandidaty,
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
})
