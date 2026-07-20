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
  OVERPASS_DOTAZ,
  chataZElementu,
  nactiExport,
  osmUrl,
  porovnejSRucnim,
  stahniOverpass,
  vzdalenostM,
  yamlChaty,
  zapisKandidaty,
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

describe('OVERPASS_DOTAZ', () => {
  it('ptá se na všechny tři tagy chat, jen v ČR (area ISO3166-1) a s bboxem Krkonoš', () => {
    expect(OVERPASS_DOTAZ).toContain('"tourism"="alpine_hut"')
    expect(OVERPASS_DOTAZ).toContain('"tourism"="wilderness_hut"')
    expect(OVERPASS_DOTAZ).toContain('"tourism"="hut"')
    expect(OVERPASS_DOTAZ).toContain('area["ISO3166-1"="CZ"]')
    expect(OVERPASS_DOTAZ).toContain('50.55,15.30,50.82,16.05')
    expect(OVERPASS_DOTAZ).toContain('out center') // way/relation potřebují souřadnice středu
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

  it('zapisuje kandidáty, ruční profil jen porovná, kandidáta nepřepisuje, kolize slugů řeší', () => {
    const rucniYaml = '# ruční profil — nesahat\nnazev: Luční bouda\nslug: lucni-bouda\nlat: 50.7345\nlng: 15.6966\nvyska: 1410\n'
    mkdirSync(rucni, { recursive: true })
    writeFileSync(join(rucni, 'lucni-bouda.yaml'), rucniYaml, 'utf8')

    const elementy = [
      node(1, { tourism: 'alpine_hut', name: 'Luční bouda', ele: '1413' }, 50.7346, 15.6967), // ruční
      node(2, { tourism: 'alpine_hut', name: 'Nová bouda' }),
      node(3, { tourism: 'alpine_hut', name: 'Nová bouda' }), // kolize jména
      node(4, { tourism: 'alpine_hut' }), // beze jména
    ]
    const report = zapisKandidaty(elementy, kandidati, rucni, CHECKED)

    expect(report.rucni).toHaveLength(1)
    expect(report.rucni[0].slug).toBe('lucni-bouda')
    expect(report.rucni[0].gpsRozdilM as number).toBeLessThan(50)
    expect(readFileSync(join(rucni, 'lucni-bouda.yaml'), 'utf8')).toBe(rucniYaml) // nedotčeno
    expect(readdirSync(kandidati).sort()).toEqual(['nova-bouda-3.yaml', 'nova-bouda.yaml']) // ruční slug nevznikl
    expect(report.zapsano.map((z) => z.slug)).toEqual(['nova-bouda', 'nova-bouda-3'])
    expect(report.preskoceno).toHaveLength(1)
    expect(parse(readFileSync(join(kandidati, 'nova-bouda-3.yaml'), 'utf8')).slug).toBe('nova-bouda-3')

    // Druhý běh je idempotentní: nic nového, existující kandidáti hlášeni, soubor nezměněn.
    const obsahPred = readFileSync(join(kandidati, 'nova-bouda.yaml'), 'utf8')
    const znovu = zapisKandidaty(elementy, kandidati, rucni, CHECKED)
    expect(znovu.zapsano).toHaveLength(0)
    expect(znovu.jizKandidat.map((k) => k.slug)).toEqual(['nova-bouda', 'nova-bouda-3'])
    expect(readFileSync(join(kandidati, 'nova-bouda.yaml'), 'utf8')).toBe(obsahPred)
  })
})

describe('stahniOverpass (mock API)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('POSTuje dotaz jako data= a vrací surový text exportu i použitou instanci', async () => {
    const raw = JSON.stringify({ osm3s: { timestamp_osm_base: '2026-07-20T05:00:00Z' }, elements: [] })
    const fetchMock = vi.fn().mockResolvedValue(new Response(raw, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(stahniOverpass(['https://overpass.example/api/interpreter'])).resolves.toEqual({
      raw,
      api: 'https://overpass.example/api/interpreter',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://overpass.example/api/interpreter')
    expect(init.method).toBe('POST')
    expect(decodeURIComponent(init.body)).toContain('tourism')
  })

  it('rate limit první instance → fallback na zrcadlo (přesně scénář GitHub Actions runnerů)', async () => {
    const raw = JSON.stringify({ osm3s: { timestamp_osm_base: '2026-07-20T05:00:00Z' }, elements: [] })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(new Response(raw, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(stahniOverpass(['https://hlavni.example', 'https://zrcadlo.example'])).resolves.toEqual({
      raw,
      api: 'https://zrcadlo.example',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('selhání všech instancí (HTTP, síť i chybová HTML stránka) dává souhrnnou chybu', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('<html>rate limited</html>', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(stahniOverpass(['https://a.example', 'https://b.example', 'https://c.example'])).rejects.toThrow(
      /Všechny Overpass instance selhaly:[\s\S]*a\.example: HTTP 429[\s\S]*b\.example: fetch failed[\s\S]*c\.example.*validní JSON/,
    )
  })
})
