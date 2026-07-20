/**
 * DATA-01: export chat Krkonoš z OSM — mapování tagů, poctivost dat,
 * ochrana ručních profilů a tvar Overpass dotazu (API se mockuje,
 * sandbox na Overpass nedosáhne; ostrý běh dělá Actions workflow).
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  OVERPASS_DOTAZ,
  chataZElementu,
  osmUrl,
  stahniElementy,
  yamlChaty,
  zapisChaty,
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
  it('ptá se na oba tagy chat, jen v ČR (area ISO3166-1) a s bboxem Krkonoš', () => {
    expect(OVERPASS_DOTAZ).toContain('"tourism"="alpine_hut"')
    expect(OVERPASS_DOTAZ).toContain('"tourism"="wilderness_hut"')
    expect(OVERPASS_DOTAZ).toContain('area["ISO3166-1"="CZ"]')
    expect(OVERPASS_DOTAZ).toContain('50.55,15.30,50.82,16.05')
    expect(OVERPASS_DOTAZ).toContain('out center') // way/relation potřebují souřadnice středu
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

  it('wilderness_hut → útulna; bez kontaktů nevzniká overeniProvoz; nevalidní ele se nezapisuje', () => {
    const el = node(103, { tourism: 'wilderness_hut', name: 'Útulna Pod Lesem', ele: 'cca 900?' })
    const vysledek = chataZElementu(el, CHECKED)
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    expect(vysledek.data.typ).toBe('utulna')
    expect(vysledek.data.vyska).toBeUndefined()
    expect(vysledek.data.kontakty).toBeUndefined()
    expect(vysledek.data.overeniProvoz).toBeUndefined()
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

describe('yamlChaty', () => {
  it('výstup je zpětně parsovatelný i s diakritikou a uvozovkami, hlavička nese zdroj', () => {
    const el = node(107, { tourism: 'alpine_hut', name: 'Bouda „U Sněžky": horní' })
    const vysledek = chataZElementu(el, CHECKED)
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    const yaml = yamlChaty(vysledek.data, osmUrl(el), CHECKED)
    expect(yaml).toContain('# Zdroj: https://www.openstreetmap.org/node/107')
    expect(yaml).toContain('ODbL')
    const zpet = parse(yaml)
    expect(zpet.nazev).toBe('Bouda „U Sněžky": horní')
    expect(zpet.overeniLokace.verified).toBe(false)
  })
})

describe('zapisChaty', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'data01-'))
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('zapisuje nové, nikdy nepřepisuje existující ruční profil a řeší kolizi slugů', () => {
    const rucni = '# ruční profil — nesahat\nnazev: Luční bouda\nslug: lucni-bouda\n'
    writeFileSync(join(tmp, 'lucni-bouda.yaml'), rucni, 'utf8')

    const report = zapisChaty(
      [
        node(1, { tourism: 'alpine_hut', name: 'Luční bouda' }), // existuje ručně
        node(2, { tourism: 'alpine_hut', name: 'Nová bouda' }),
        node(3, { tourism: 'alpine_hut', name: 'Nová bouda' }), // kolize jména
        node(4, { tourism: 'alpine_hut' }), // beze jména
      ],
      tmp,
      CHECKED,
    )

    expect(report.existujici).toEqual([{ slug: 'lucni-bouda', url: 'https://www.openstreetmap.org/node/1' }])
    expect(readFileSync(join(tmp, 'lucni-bouda.yaml'), 'utf8')).toBe(rucni) // nedotčeno
    expect(report.zapsano.map((z) => z.slug)).toEqual(['nova-bouda', 'nova-bouda-3'])
    expect(report.preskoceno).toHaveLength(1)
    const soubory = readdirSync(tmp).sort()
    expect(soubory).toEqual(['lucni-bouda.yaml', 'nova-bouda-3.yaml', 'nova-bouda.yaml'])
    expect(parse(readFileSync(join(tmp, 'nova-bouda-3.yaml'), 'utf8')).slug).toBe('nova-bouda-3')
  })
})

describe('stahniElementy (mock API)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('POSTuje dotaz jako data= a vrací elements', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ elements: [node(1, { name: 'A' })] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const elementy = await stahniElementy('https://overpass.example/api/interpreter')
    expect(elementy).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://overpass.example/api/interpreter')
    expect(init.method).toBe('POST')
    expect(decodeURIComponent(init.body)).toContain('tourism')
  })

  it('HTTP 429 dává čitelnou hlášku se zrcadlem, chybějící elements je tvrdá chyba', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 429 })))
    await expect(stahniElementy('https://x')).rejects.toThrow(/429.*kumi\.systems/s)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    await expect(stahniElementy('https://x')).rejects.toThrow(/elements/)
  })
})
