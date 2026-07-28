/**
 * DATA-01: export chat Krkonoš z OSM — mapování tagů, poctivost dat,
 * staging kandidátů, ochrana + porovnání ručních profilů a tvar Overpass
 * dotazu (API se mockuje, sandbox na Overpass nedosáhne; ostrý běh dělá
 * Actions workflow).
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  ZEME_DOTAZU,
  chataZElementu,
  nactiExport,
  nactiVyrazene,
  osmUrl,
  overpassDotaz,
  porovnejSRucnim,
  stahniOverpass,
  vzdalenostM,
  yamlChaty,
  zapisKandidaty,
  type ExportPolozka,
  type OsmElement,
} from '../../scripts/data01-overpass-krkonose'

const CHECKED = '2026-07-20'

const node = (id: number, tags: Record<string, string>, lat = 50.7, lon = 15.7): OsmElement => ({
  type: 'node',
  id,
  lat,
  lon,
  tags,
})

describe('overpassDotaz', () => {
  it('ptá se na všechny tři tagy chat, v area státu a s bboxem Krkonoš', () => {
    const dotaz = overpassDotaz('CZ')
    expect(dotaz).toContain('"tourism"="alpine_hut"')
    expect(dotaz).toContain('"tourism"="wilderness_hut"')
    expect(dotaz).toContain('"tourism"="hut"')
    expect(dotaz).toContain('area["ISO3166-1"="CZ"]')
    expect(dotaz).toContain('50.55,15.30,50.87,16.05')
    expect(dotaz).toContain('out center') // way/relation potřebují souřadnice středu
  })

  it('Krkonoše se dotazují za obě země — ČR i Polsko (přeshraniční pohoří vcelku)', () => {
    expect(ZEME_DOTAZU).toEqual([
      { zeme: 'cz', iso: 'CZ' },
      { zeme: 'pl', iso: 'PL' },
    ])
    expect(overpassDotaz('PL')).toContain('area["ISO3166-1"="PL"]')
  })
})

describe('nactiExport', () => {
  it('checked bere z osm3s.timestamp_osm_base (datum stavu OSM dat)', () => {
    const raw = JSON.stringify({ osm3s: { timestamp_osm_base: '2026-07-18T09:00:00Z' }, elements: [] })
    expect(nactiExport(raw)).toEqual({ elementy: [], checked: '2026-07-18' })
  })

  it('nevalidní JSON i chybějící elements jsou tvrdá chyba', () => {
    expect(() => nactiExport('<html>error</html>')).toThrow(/validní JSON/)
    expect(() => nactiExport('{}')).toThrow(/elements/)
  })
})

describe('chataZElementu', () => {
  it('mapuje doložené tagy: název, slug, GPS, výška, obec, kontakty, aliasy', () => {
    const el = node(101, {
      tourism: 'alpine_hut',
      name: 'Šraňková bouda',
      ele: '1234',
      'addr:city': 'Pec pod Sněžkou',
      website: 'https://example.cz/',
      phone: '+420 123 456 789',
      email: 'info@example.cz',
      old_name: 'Baudenschänke',
    })
    const vysledek = chataZElementu(el, CHECKED)
    expect('data' in vysledek).toBe(true)
    if (!('data' in vysledek)) return
    const d = vysledek.data
    expect(d.nazev).toBe('Šraňková bouda')
    expect(d.slug).toBe('srankova-bouda') // stejná logika jako Payload hook
    expect(d.zeme).toBe('cz')
    expect(d.typ).toBe('obsluhovana')
    expect(d.oblast).toBe('krkonose')
    expect(d.lat).toBe(50.7)
    expect(d.lng).toBe(15.7)
    expect(d.vyska).toBe(1234)
    expect(d.obec).toBe('Pec pod Sněžkou')
    expect(d.kontakty).toEqual({ telefon: '+420 123 456 789', email: 'info@example.cz', web: 'https://example.cz/' })
    expect(d.aliasy).toEqual([{ nazev: 'Baudenschänke', poznamka: 'historický název (OSM old_name)' }])
    expect(d.stav).toBeUndefined() // stav se nedomýšlí — OSM ho nenese
  })

  it('bloky ověření nesou OSM URL, atribuci ODbL, verified: false a checked', () => {
    const el = node(102, { tourism: 'alpine_hut', name: 'Bouda', phone: '+420 1' })
    const vysledek = chataZElementu(el, CHECKED)
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    for (const blok of [vysledek.data.overeniLokace, vysledek.data.overeniProvoz]) {
      const o = blok as { source: string; verified: boolean; checked: string }
      expect(o.source).toContain('https://www.openstreetmap.org/node/102')
      expect(o.source).toContain('ODbL')
      expect(o.verified).toBe(false)
      expect(o.checked).toBe(CHECKED)
    }
  })

  it('polský kandidát nese zeme: pl (schroniska — rozhodnutí 20. 7.)', () => {
    const el = node(109, { tourism: 'alpine_hut', name: 'Schronisko Samotnia' }, 50.7435, 15.6941)
    const vysledek = chataZElementu(el, CHECKED, 'pl')
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    expect(vysledek.data.zeme).toBe('pl')
    expect(vysledek.data.slug).toBe('schronisko-samotnia')
    expect(vysledek.data.oblast).toBe('krkonose') // jedno pohoří, zemi nese chata
  })

  it('polské ł se přepisuje na l — slug neztrácí písmena (nález z průchodu PL kandidátů)', () => {
    const el = node(110, { tourism: 'alpine_hut', name: 'Schronisko pod Łabskim Szczytem' }, 50.775, 15.55)
    const vysledek = chataZElementu(el, CHECKED, 'pl')
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    expect(vysledek.data.slug).toBe('schronisko-pod-labskim-szczytem')
    const okraj = chataZElementu(node(111, { tourism: 'alpine_hut', name: 'Schronisko PTTK na Przełęczy Okraj' }, 50.78, 15.86), CHECKED, 'pl')
    if (!('data' in okraj)) throw new Error('čekal jsem data')
    expect(okraj.data.slug).toBe('schronisko-pttk-na-przeleczy-okraj')
  })

  it('wilderness_hut → útulna; nestandardní hut typ nedostane (určí redakce)', () => {
    const utulna = chataZElementu(node(103, { tourism: 'wilderness_hut', name: 'Útulna Pod Lesem', ele: 'cca 900?' }), CHECKED)
    if (!('data' in utulna)) throw new Error('čekal jsem data')
    expect(utulna.data.typ).toBe('utulna')
    expect(utulna.data.vyska).toBeUndefined() // nevalidní ele se nezapisuje
    expect(utulna.data.kontakty).toBeUndefined()
    expect(utulna.data.overeniProvoz).toBeUndefined()

    const hut = chataZElementu(node(108, { tourism: 'hut', name: 'Bouda Bez Typu' }), CHECKED)
    if (!('data' in hut)) throw new Error('čekal jsem data')
    expect(hut.data.typ).toBeUndefined()
    expect(hut.data.interniPoznamky).toContain('nestandardní')
  })

  it('way bez center a objekt beze jména se přeskakují s důvodem do reportu', () => {
    const bezJmena = chataZElementu(node(104, { tourism: 'alpine_hut' }), CHECKED)
    expect(bezJmena).toEqual({ duvod: 'bez-nazvu', url: 'https://www.openstreetmap.org/node/104' })
    const bezSouradnic = chataZElementu({ type: 'way', id: 105, tags: { tourism: 'alpine_hut', name: 'Bouda' } }, CHECKED)
    expect(bezSouradnic).toEqual({ duvod: 'bez-souradnic', url: 'https://www.openstreetmap.org/way/105' })
  })

  it('way s center bere souřadnice středu', () => {
    const el: OsmElement = {
      type: 'way',
      id: 106,
      center: { lat: 50.71, lon: 15.65 },
      tags: { tourism: 'alpine_hut', name: 'Bouda Na Plání' },
    }
    const vysledek = chataZElementu(el, CHECKED)
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    expect(vysledek.data.lat).toBe(50.71)
    expect(vysledek.data.lng).toBe(15.65)
    expect(osmUrl(el)).toBe('https://www.openstreetmap.org/way/106')
  })
})

describe('porovnání s ručním profilem', () => {
  it('vzdalenostM: 0.001° zeměpisné šířky ≈ 111 m', () => {
    expect(vzdalenostM(50.7, 15.7, 50.701, 15.7)).toBeGreaterThan(105)
    expect(vzdalenostM(50.7, 15.7, 50.701, 15.7)).toBeLessThan(118)
    expect(vzdalenostM(50.7, 15.7, 50.7, 15.7)).toBe(0)
  })

  it('porovnejSRucnim doloží GPS rozdíl, výšky a odlišný název — nic nemění', () => {
    const el = node(1, { tourism: 'alpine_hut', name: 'Luční Bouda', ele: '1413' }, 50.7346, 15.6967)
    const rucni = 'nazev: Luční bouda\nslug: lucni-bouda\nlat: 50.734525\nlng: 15.696628\nvyska: 1410\n'
    const p = porovnejSRucnim(el, rucni, 'lucni-bouda')
    expect(p.gpsRozdilM).not.toBeNull()
    expect(p.gpsRozdilM as number).toBeLessThan(50) // stejné místo
    expect(p.vyskaOsm).toBe(1413)
    expect(p.vyskaRucni).toBe(1410)
    expect(p.nazevOsm).toBe('Luční Bouda')
    expect(p.nazevRucni).toBe('Luční bouda')
  })
})

describe('yamlChaty', () => {
  it('výstup je zpětně parsovatelný i s diakritikou a uvozovkami, hlavička nese zdroj a KANDIDÁT', () => {
    const el = node(107, { tourism: 'alpine_hut', name: 'Bouda „U Sněžky": horní' })
    const vysledek = chataZElementu(el, CHECKED)
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    const yaml = yamlChaty(vysledek.data, osmUrl(el), CHECKED)
    expect(yaml).toContain('# Zdroj: https://www.openstreetmap.org/node/107')
    expect(yaml).toContain('ODbL')
    expect(yaml).toContain('KANDIDÁT')
    const zpet = parse(yaml)
    expect(zpet.nazev).toBe('Bouda „U Sněžky": horní')
    expect(zpet.overeniLokace.verified).toBe(false)
    expect(typeof zpet.overeniLokace.checked).toBe('string') // seed čeká string, ne Date
  })
})

describe('zapisKandidaty', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'data01-'))
  const kandidati = join(tmp, 'kandidati')
  const rucni = join(tmp, 'chaty')
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('zapisuje kandidáty obou zemí, ruční profil jen porovná, kandidáta nepřepisuje, kolize slugů řeší', () => {
    const rucniYaml = '# ruční profil — nesahat\nnazev: Luční bouda\nslug: lucni-bouda\nlat: 50.7345\nlng: 15.6966\nvyska: 1410\n'
    mkdirSync(rucni, { recursive: true })
    writeFileSync(join(rucni, 'lucni-bouda.yaml'), rucniYaml, 'utf8')

    const cz = (el: OsmElement): ExportPolozka => ({ el, zeme: 'cz', checked: CHECKED })
    const polozky = [
      cz(node(1, { tourism: 'alpine_hut', name: 'Luční bouda', ele: '1413' }, 50.7346, 15.6967)), // ruční
      cz(node(2, { tourism: 'alpine_hut', name: 'Nová bouda' })),
      cz(node(3, { tourism: 'alpine_hut', name: 'Nová bouda' })), // kolize jména
      cz(node(4, { tourism: 'alpine_hut' })), // beze jména
      { el: node(5, { tourism: 'alpine_hut', name: 'Schronisko Odrodzenie' }, 50.753, 15.685), zeme: 'pl', checked: '2026-07-19' } as ExportPolozka,
    ]
    const report = zapisKandidaty(polozky, kandidati, rucni)

    expect(report.rucni).toHaveLength(1)
    expect(report.rucni[0].slug).toBe('lucni-bouda')
    expect(report.rucni[0].gpsRozdilM as number).toBeLessThan(50)
    expect(readFileSync(join(rucni, 'lucni-bouda.yaml'), 'utf8')).toBe(rucniYaml) // nedotčeno
    expect(readdirSync(kandidati).sort()).toEqual(['nova-bouda-3.yaml', 'nova-bouda.yaml', 'schronisko-odrodzenie.yaml'])
    expect(report.zapsano.map((z) => z.slug)).toEqual(['nova-bouda', 'nova-bouda-3', 'schronisko-odrodzenie'])
    expect(report.preskoceno).toHaveLength(1)
    expect(parse(readFileSync(join(kandidati, 'nova-bouda-3.yaml'), 'utf8')).slug).toBe('nova-bouda-3')
    const pl = parse(readFileSync(join(kandidati, 'schronisko-odrodzenie.yaml'), 'utf8'))
    expect(pl.zeme).toBe('pl')
    expect(pl.overeniLokace.checked).toBe('2026-07-19') // checked per export dané země

    // Druhý běh je idempotentní: nic nového, existující kandidáti hlášeni, soubor nezměněn.
    const obsahPred = readFileSync(join(kandidati, 'nova-bouda.yaml'), 'utf8')
    const znovu = zapisKandidaty(polozky, kandidati, rucni)
    expect(znovu.zapsano).toHaveLength(0)
    expect(znovu.jizKandidat.map((k) => k.slug)).toEqual(['nova-bouda', 'nova-bouda-3', 'schronisko-odrodzenie'])
    expect(readFileSync(join(kandidati, 'nova-bouda.yaml'), 'utf8')).toBe(obsahPred)
  })

  it('vyřazené OSM objekty (redakční seznam) se nezakládají ani po smazání souboru — jdou do reportu', () => {
    const cz = (el: OsmElement): ExportPolozka => ({ el, zeme: 'cz', checked: CHECKED })
    const polozky = [
      cz(node(10, { tourism: 'alpine_hut', name: 'Poctivá bouda' })),
      cz(node(11, { tourism: 'alpine_hut', name: 'Duplicitní bouda' })),
    ]
    const vyrazene = new Map([['https://www.openstreetmap.org/node/11', 'duplicita — sloučeno']])

    const report = zapisKandidaty(polozky, kandidati, rucni, vyrazene)
    expect(report.zapsano.map((z) => z.slug)).toEqual(['poctiva-bouda'])
    expect(report.vyrazeno).toEqual([{ url: 'https://www.openstreetmap.org/node/11', duvod: 'duplicita — sloučeno' }])
    expect(readdirSync(kandidati).sort()).toEqual(['poctiva-bouda.yaml']) // duplicitní se nezaložila
  })

  it('nactiVyrazene čte seznam z YAML (klíč = OSM URL) a bez souboru vrací prázdnou mapu', () => {
    mkdirSync(tmp, { recursive: true }) // afterEach předchozího testu tmp smazal
    const soubor = join(tmp, '_vyrazeno.yaml')
    writeFileSync(
      soubor,
      'vyrazeno:\n  - osm: https://www.openstreetmap.org/node/656462770\n    slug: chata-mamut-656462770\n    duvod: >-\n      Duplicita v OSM — sloučeno.\n    rozhodl: Michal\n    checked: 2026-07-20\n',
      'utf8',
    )
    const mapa = nactiVyrazene(soubor)
    expect(mapa.size).toBe(1)
    expect(mapa.get('https://www.openstreetmap.org/node/656462770')).toContain('Duplicita')
    expect(nactiVyrazene(join(tmp, 'neexistuje.yaml')).size).toBe(0)
  })

  it('ostrý seznam data/kandidati/_vyrazeno.yaml je načtitelný a kryje smazané/přesunuté kandidáty', () => {
    const mapa = nactiVyrazene()
    expect(mapa.size).toBeGreaterThanOrEqual(6)
    // duplicity (soubory smazány z krkonose/)
    expect(mapa.get('https://www.openstreetmap.org/node/656462770')).toContain('chata-mamut')
    expect(mapa.get('https://www.openstreetmap.org/node/656504528')).toContain('lyzarska-bouda')
    // mimo pohoří (soubory přesunuty do jiných oblastí)
    expect(mapa.get('https://www.openstreetmap.org/way/30778232')).toContain('Jizer')
  })
})

describe('stahniOverpass (mock API)', () => {
  afterEach(() => vi.unstubAllGlobals())

  /** Nejmenší platný export — jeden objekt, ať prázdno zůstane vyhrazené pojistce níž. */
  const RAW = JSON.stringify({
    osm3s: { timestamp_osm_base: '2026-07-20T05:00:00Z' },
    elements: [{ type: 'node', id: 1, lat: 50.7, lon: 15.4, tags: { tourism: 'alpine_hut', name: 'Zkušební bouda' } }],
  })
  const PRAZDNY = JSON.stringify({ osm3s: { timestamp_osm_base: '2026-07-20T05:00:00Z' }, elements: [] })
  /** Spánek se v testech jen zaznamenává — čekat 30 s doopravdy nechceme. */
  const spanekSpy = () => {
    const cekani: number[] = []
    return { cekani, spanek: async (ms: number) => void cekani.push(ms) }
  }

  it('POSTuje dotaz jako data= a vrací surový text exportu i použitou instanci', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(RAW, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(stahniOverpass(['https://overpass.example/api/interpreter'], overpassDotaz('CZ'))).resolves.toEqual({
      raw: RAW,
      api: 'https://overpass.example/api/interpreter',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://overpass.example/api/interpreter')
    expect(init.method).toBe('POST')
    expect(decodeURIComponent(init.body)).toContain('tourism')
  })

  it('rate limit první instance → fallback na zrcadlo (přesně scénář GitHub Actions runnerů)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(new Response(RAW, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(stahniOverpass(['https://hlavni.example', 'https://zrcadlo.example'], overpassDotaz('CZ'))).resolves.toEqual({
      raw: RAW,
      api: 'https://zrcadlo.example',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('selhání všech instancí v jediném kole (HTTP, síť i chybová HTML stránka) dává souhrnnou chybu', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('<html>rate limited</html>', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      stahniOverpass(['https://a.example', 'https://b.example', 'https://c.example'], overpassDotaz('CZ'), { kola: 1 }),
    ).rejects.toThrow(
      /Všechny Overpass instance selhaly:[\s\S]*a\.example \(kolo 1\/1\): HTTP 429[\s\S]*b\.example \(kolo 1\/1\): fetch failed[\s\S]*c\.example.*validní JSON/,
    )
  })

  // Přesně scénář z 28. 7. 2026: obě instance vrátily 504 ve stejné vteřině
  // a běh DATA-01 pro Jizerské hory skončil. 504 je „mám nával", ne „špatný
  // dotaz" — po pauze se to zpravidla stáhne napodruhé.
  it('504 ze všech instancí → počká a projde je znovu (kolo 2 uspěje)', async () => {
    const { cekani, spanek } = spanekSpy()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('too busy', { status: 504 }))
      .mockResolvedValueOnce(new Response('too busy', { status: 504 }))
      .mockResolvedValueOnce(new Response(RAW, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      stahniOverpass(['https://a.example', 'https://b.example'], overpassDotaz('CZ'), { pauzy: [30_000, 90_000], spanek }),
    ).resolves.toEqual({ raw: RAW, api: 'https://a.example' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(cekani).toEqual([30_000]) // jedna pauza: po prvním neúspěšném kole
  })

  it('vyčerpaná kola nesou v chybě číslo kola a délky pauz rostou', async () => {
    const { cekani, spanek } = spanekSpy()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('too busy', { status: 504 })))
    await expect(
      stahniOverpass(['https://a.example'], overpassDotaz('CZ'), { kola: 3, pauzy: [30_000, 90_000], spanek }),
    ).rejects.toThrow(/kolo 3\/3\): HTTP 504 \(přetížená instance\)/)
    expect(cekani).toEqual([30_000, 90_000])
  })

  // Regionální zrcadlo (jen Švýcarsko, jen Britské ostrovy…) odpoví na dotaz
  // mimo svůj výřez HTTP 200 a prázdným seznamem. Bez pojistky by se uložil
  // prázdný export a běh by hlásil „0 nových kandidátů" jako úspěch.
  it('prázdná odpověď je selhání instance — a `povolitPrazdno` ji přijme', async () => {
    const { spanek } = spanekSpy()
    // Tělo Response se dá přečíst jen jednou — každý pokus dostane vlastní.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(PRAZDNY, { status: 200 })))
    await expect(stahniOverpass(['https://regionalni.example'], overpassDotaz('CZ'), { kola: 1, spanek })).rejects.toThrow(
      /0 objektů — instance nejspíš nemá celosvětová data/,
    )
    await expect(
      stahniOverpass(['https://regionalni.example'], overpassDotaz('CZ'), { kola: 1, spanek, povolitPrazdno: true }),
    ).resolves.toEqual({ raw: PRAZDNY, api: 'https://regionalni.example' })
  })
})
