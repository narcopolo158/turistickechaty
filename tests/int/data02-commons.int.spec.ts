/**
 * DATA-02: fotky z Wikimedia Commons — licenční síto (jen CC0 / CC BY /
 * CC BY-SA / PD), čištění metadat, dedup geosearch ∩ kategorie, sběr chat
 * z data/chaty i kandidátů DATA-01 a tvar dotazů (API se mockuje, sandbox
 * na Commons nedosáhne; ostrý běh dělá Actions workflow).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  API_COMMONS,
  cistyText,
  dobaCekaniMs,
  nactiChaty,
  nactiSurovyExport,
  posudLicenci,
  stahniJson,
  strankyZOdpovedi,
  urlGeosearch,
  urlKategorie,
  yamlFotek,
  zapisKandidatyFotek,
  zpracujOdpovedi,
  type ChataProDotaz,
  type CommonsStranka,
} from '../../scripts/data02-commons-fotky'

const CHATA: ChataProDotaz = {
  slug: 'lucni-bouda',
  nazev: 'Luční bouda',
  oblast: 'krkonose',
  lat: 50.734525,
  lng: 15.696628,
  profil: 'rucni',
}

/** Stránka souboru, jak ji vrací formatversion=2 (metadata dle potřeby testu). */
const stranka = (
  title: string,
  extmetadata: Record<string, { value: unknown }>,
  navic: Partial<CommonsStranka> = {},
): CommonsStranka => ({
  title,
  imageinfo: [
    {
      url: `https://upload.wikimedia.org/orig/${encodeURIComponent(title)}`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      thumburl: `https://upload.wikimedia.org/thumb/640px-${encodeURIComponent(title)}`,
      width: 4000,
      height: 3000,
      extmetadata,
      ...navic.imageinfo?.[0],
    },
  ],
  ...navic,
})

const odpoved = (stranky: CommonsStranka[]) => ({ query: { pages: stranky } })

describe('posudLicenci — tvrdé licenční síto', () => {
  it('pouští CC BY, CC BY-SA, CC0 i public domain', () => {
    expect(posudLicenci({ LicenseShortName: { value: 'CC BY-SA 4.0' } })).toMatchObject({
      ok: true,
      licence: 'CC BY-SA 4.0',
      vyzadujeAutora: true,
    })
    expect(posudLicenci({ LicenseShortName: { value: 'CC BY 2.5' } })).toMatchObject({
      ok: true,
      vyzadujeAutora: true,
    })
    expect(posudLicenci({ LicenseShortName: { value: 'CC0' } })).toMatchObject({
      ok: true,
      vyzadujeAutora: false,
    })
    expect(posudLicenci({ LicenseShortName: { value: 'Public domain' } })).toMatchObject({ ok: true })
    // PD poznané jen z Copyrighted=False (LicenseShortName chybí)
    expect(posudLicenci({ Copyrighted: { value: 'False' } })).toMatchObject({
      ok: true,
      licence: 'Public domain',
    })
  })

  it('vyřazuje NC, ND i nerozpoznané licence (nerozpoznaná ≠ volná)', () => {
    expect(posudLicenci({ LicenseShortName: { value: 'CC BY-NC 2.0' } })).toMatchObject({ ok: false })
    expect(posudLicenci({ LicenseShortName: { value: 'CC BY-ND 4.0' } })).toMatchObject({ ok: false })
    expect(
      posudLicenci({
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        UsageTerms: { value: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0' },
      }),
    ).toMatchObject({ ok: false }) // NC schované v UsageTerms přebíjí hezké jméno
    const nerozpoznana = posudLicenci({ LicenseShortName: { value: 'Copyrighted free use' } })
    expect(nerozpoznana.ok).toBe(false)
    if (!nerozpoznana.ok) expect(nerozpoznana.duvod).toContain('nerozpoznaná')
    expect(posudLicenci(undefined).ok).toBe(false)
  })
})

describe('cistyText', () => {
  it('odstraní HTML, dekóduje entity, srazí bílé znaky a dlouhé texty zakončí výpustkou', () => {
    expect(cistyText('<a href="/wiki/User:Jan">Jan&nbsp;Novák</a> &amp; syn')).toBe('Jan Novák & syn')
    expect(cistyText('  víc\n mezer\t tu ')).toBe('víc mezer tu')
    const dlouhy = cistyText('x'.repeat(500), 100)
    expect(dlouhy.length).toBeLessThanOrEqual(100)
    expect(dlouhy.endsWith('…')).toBe(true)
  })
})

describe('zpracujOdpovedi', () => {
  const BY = { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: '<b>Jana Malá</b>' } }

  it('deduplikuje soubor nalezený geosearchem i kategorií a označí původ', () => {
    const spolecny = stranka('File:Lucni bouda.jpg', BY)
    const { fotky } = zpracujOdpovedi(CHATA, odpoved([spolecny]), odpoved([spolecny]))
    expect(fotky).toHaveLength(1)
    expect(fotky[0].nalezeno).toBe('geosearch + kategorie')
    expect(fotky[0].autor).toBe('Jana Malá')
    expect(fotky[0].rozmery).toBe('4000×3000')
  })

  it('CC BY bez dohledatelného autora vyřadí (atribuci nejde splnit), CC0 bez autora projde', () => {
    const bezAutoraBY = stranka('File:Bez autora.jpg', { LicenseShortName: { value: 'CC BY 4.0' } })
    const bezAutoraCC0 = stranka('File:Volna.jpg', { LicenseShortName: { value: 'CC0' } })
    const { fotky, odmitnuto } = zpracujOdpovedi(CHATA, odpoved([bezAutoraBY, bezAutoraCC0]), odpoved([]))
    expect(fotky.map((f) => f.soubor)).toEqual(['File:Volna.jpg'])
    expect(fotky[0].autor).toContain('neuveden')
    expect(odmitnuto).toHaveLength(1)
    expect(odmitnuto[0].duvod).toContain('atribuci')
  })

  it('řadí deterministicky: geotagované dle vzdálenosti od chaty, negeotagované nakonec', () => {
    const daleko = stranka('File:A daleko.jpg', BY, {
      coordinates: [{ lat: CHATA.lat + 0.01, lon: CHATA.lng }],
    })
    const blizko = stranka('File:B blizko.jpg', BY, {
      coordinates: [{ lat: CHATA.lat + 0.0001, lon: CHATA.lng }],
    })
    const bezGeotagu = stranka('File:0 bez geotagu.jpg', BY)
    const { fotky } = zpracujOdpovedi(CHATA, odpoved([daleko, bezGeotagu, blizko]), odpoved([]))
    expect(fotky.map((f) => f.soubor)).toEqual(['File:B blizko.jpg', 'File:A daleko.jpg', 'File:0 bez geotagu.jpg'])
    expect(fotky[0].vzdalenostM).toBeLessThan(fotky[1].vzdalenostM as number)
    expect(fotky[2].vzdalenostM).toBeUndefined()
  })

  it('neexistující kategorie není chyba, jiná chyba API ano', () => {
    const geo = odpoved([stranka('File:Lucni bouda.jpg', BY)])
    const { fotky } = zpracujOdpovedi(CHATA, geo, { error: { code: 'gcminvalidcategory' } })
    expect(fotky).toHaveLength(1)
    expect(() => strankyZOdpovedi({ error: { code: 'maxlag', info: 'busy' } }, 'geosearch')).toThrow(/maxlag/)
    expect(strankyZOdpovedi({}, 'geosearch')).toEqual([]) // prázdná odpověď = nic nalezeno
  })
})

describe('yamlFotek + zapisKandidatyFotek', () => {
  const koren = mkdtempSync(join(tmpdir(), 'data02-'))
  afterEach(() => rmSync(koren, { recursive: true, force: true }))

  it('YAML je zpětně parsovatelný, nese chatu, checked a kompletní metadata fotky', () => {
    const { fotky } = zpracujOdpovedi(
      CHATA,
      odpoved([
        stranka('File:Lucni bouda.jpg', {
          LicenseShortName: { value: 'CC BY-SA 3.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0' },
          Artist: { value: 'Jana Malá' },
          ImageDescription: { value: '<p>Luční bouda od jihu</p>' },
          DateTimeOriginal: { value: '2019-08-01 10:00' },
        }),
      ]),
      odpoved([]),
    )
    const cesta = zapisKandidatyFotek(koren, CHATA, fotky, '2026-07-20', 300)
    expect(cesta).toBe(join(koren, 'data', 'kandidati', 'fotky', 'krkonose', 'lucni-bouda.yaml'))
    const text = readFileSync(cesta, 'utf8')
    expect(text).toContain('STROJOVĚ GENEROVÁNO')
    const data = parse(text) as Record<string, unknown>
    expect(data.chata).toBe('lucni-bouda')
    expect(data.checked).toBe('2026-07-20')
    const fotka = (data.fotky as Record<string, unknown>[])[0]
    expect(fotka).toMatchObject({
      soubor: 'File:Lucni bouda.jpg',
      autor: 'Jana Malá',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      popis: 'Luční bouda od jihu',
      datum: '2019-08-01 10:00',
    })
    expect(String(fotka.stranka)).toContain('commons.wikimedia.org/wiki/')
    expect(String(fotka.original)).toContain('upload.wikimedia.org')
  })

  it('chata bez použitelných fotek dostane YAML s prázdným seznamem (doklad, že se hledalo)', () => {
    const cesta = zapisKandidatyFotek(koren, CHATA, [], '2026-07-20', 300)
    const data = parse(readFileSync(cesta, 'utf8')) as Record<string, unknown>
    expect(data.fotky).toEqual([])
  })

  it('opakovaný zápis soubor přepíše (strojově generovaný staging, žádné hromadění)', () => {
    zapisKandidatyFotek(koren, CHATA, [], '2026-07-19', 300)
    const cesta = zapisKandidatyFotek(koren, CHATA, [], '2026-07-20', 300)
    expect((parse(readFileSync(cesta, 'utf8')) as Record<string, unknown>).checked).toBe('2026-07-20')
  })
})

describe('nactiChaty', () => {
  const koren = mkdtempSync(join(tmpdir(), 'data02-chaty-'))
  afterEach(() => rmSync(koren, { recursive: true, force: true }))

  const zapis = (cesta: string, obsah: string) => {
    mkdirSync(join(koren, cesta, '..'), { recursive: true })
    writeFileSync(join(koren, cesta), obsah, 'utf8')
  }

  it('sbírá ruční profily i kandidáty DATA-01, adresář fotky a _export přeskakuje', () => {
    zapis('data/chaty/krkonose/lucni-bouda.yaml', 'nazev: Luční bouda\nslug: lucni-bouda\nlat: 50.7\nlng: 15.7\n')
    zapis('data/kandidati/krkonose/vyrovka.yaml', 'nazev: Výrovka\nslug: vyrovka\nlat: 50.72\nlng: 15.68\n')
    zapis('data/kandidati/krkonose/_overpass-export.json', '{}')
    zapis('data/kandidati/fotky/krkonose/vyrovka.yaml', 'chata: vyrovka\n') // výstup DATA-02, ne chata
    zapis('data/kandidati/krkonose/bez-gps.yaml', 'nazev: Bez GPS\nslug: bez-gps\n')
    const { chaty, preskoceno } = nactiChaty(koren)
    expect(chaty.map((ch) => `${ch.slug}:${ch.profil}`).sort()).toEqual(['lucni-bouda:rucni', 'vyrovka:kandidat'])
    expect(preskoceno).toHaveLength(1)
    expect(preskoceno[0]).toContain('bez-gps')
  })

  it('při shodě slugu má ruční profil přednost před kandidátem', () => {
    zapis('data/chaty/krkonose/lucni-bouda.yaml', 'nazev: Luční bouda\nslug: lucni-bouda\nlat: 50.7\nlng: 15.7\n')
    zapis('data/kandidati/krkonose/lucni-bouda.yaml', 'nazev: Luční bouda (OSM)\nslug: lucni-bouda\nlat: 50.71\nlng: 15.71\n')
    const { chaty } = nactiChaty(koren)
    expect(chaty).toHaveLength(1)
    expect(chaty[0].profil).toBe('rucni')
    expect(chaty[0].nazev).toBe('Luční bouda')
  })
})

describe('tvar dotazů a stahniJson (mock API)', () => {
  it('geosearch míří na namespace 6 v okruhu kolem GPS, kategorie na Category:<název>', () => {
    const geo = new URL(urlGeosearch(API_COMMONS, CHATA, 300))
    expect(geo.searchParams.get('generator')).toBe('geosearch')
    expect(geo.searchParams.get('ggscoord')).toBe('50.734525|15.696628')
    expect(geo.searchParams.get('ggsradius')).toBe('300')
    expect(geo.searchParams.get('ggsnamespace')).toBe('6')
    expect(geo.searchParams.get('prop')).toBe('imageinfo|coordinates')
    expect(geo.searchParams.get('iiextmetadatafilter')).toContain('LicenseShortName')
    const kat = new URL(urlKategorie(API_COMMONS, CHATA))
    expect(kat.searchParams.get('generator')).toBe('categorymembers')
    expect(kat.searchParams.get('gcmtitle')).toBe('Category:Luční bouda')
    expect(kat.searchParams.get('gcmtype')).toBe('file')
  })

  it('posílá identifikační User-Agent a HTTP chyby hlásí česky', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"query":{"pages":[]}}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await stahniJson(`${API_COMMONS}?x=1`)
    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).toMatchObject({ 'User-Agent': expect.stringContaining('turistickechaty.cz') })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 429 })))
    await expect(stahniJson(API_COMMONS, { pokusy: 1 })).rejects.toThrow(/429.*zpomalit/)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>err</html>', { status: 200 })))
    await expect(stahniJson(API_COMMONS)).rejects.toThrow(/validní JSON/)
    vi.unstubAllGlobals()
  })

  it('na 429/5xx opakuje s backoffem, i dvě 429 po sobě přežije (lekce z prvního běhu)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(new Response('{"query":{"pages":[]}}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const vysledek = await stahniJson(API_COMMONS, { pauzaMs: 0 })
    expect(vysledek).toEqual({ query: { pages: [] } })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    // vyčerpané pokusy = tvrdá chyba (a 4xx mimo 429 se neopakuje vůbec)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })))
    await expect(stahniJson(API_COMMONS, { pokusy: 2, pauzaMs: 0 })).rejects.toThrow(/503/)
    const zakazano = vi.fn().mockResolvedValue(new Response('no', { status: 403 }))
    vi.stubGlobal('fetch', zakazano)
    await expect(stahniJson(API_COMMONS, { pauzaMs: 0 })).rejects.toThrow(/403/)
    expect(zakazano).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('dobaCekaniMs: exponenciální backoff se stropem a respekt k Retry-After', () => {
    expect(dobaCekaniMs(1, 30_000)).toBe(30_000)
    expect(dobaCekaniMs(2, 30_000)).toBe(60_000)
    expect(dobaCekaniMs(3, 30_000)).toBe(120_000)
    expect(dobaCekaniMs(4, 30_000)).toBe(150_000) // strop
    expect(dobaCekaniMs(1, 30_000, '90')).toBe(90_000) // Retry-After delší než backoff
    expect(dobaCekaniMs(3, 30_000, '5')).toBe(120_000) // backoff delší než Retry-After
    expect(dobaCekaniMs(1, 30_000, 'nesmysl')).toBe(30_000)
  })
})

describe('nactiSurovyExport (offline --z-jsonu)', () => {
  it('validní export projde, rozbitý je tvrdá chyba', () => {
    const telo = { checked: '2026-07-20', radiusM: 300, api: API_COMMONS, dotazy: {} }
    expect(nactiSurovyExport(JSON.stringify(telo)).checked).toBe('2026-07-20')
    expect(() => nactiSurovyExport('<html>')).toThrow(/validní JSON/)
    expect(() => nactiSurovyExport('{}')).toThrow(/tvar/)
  })
})

describe('yamlFotek hlavička', () => {
  it('nese chatu, datum dotazu, radius i licenční pravidla', () => {
    const text = yamlFotek(CHATA, [], '2026-07-20', 300)
    expect(text).toContain('Luční bouda — kandidátní FOTKY')
    expect(text).toContain('dotaz 2026-07-20')
    expect(text).toContain('geosearch 300 m')
    expect(text).toContain('CC0 / CC BY / CC BY-SA / public domain')
  })
})
