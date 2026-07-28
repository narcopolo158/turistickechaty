/**
 * DATA-31: dohledávka souřadnic pro profily bez GPS.
 *
 * Testuje se to, na čem stojí poctivost celé dohledávky: že se vybírají jen
 * profily, kterým GPS opravdu chybí, že dotaz hledá JMÉNEM (a jde do něj
 * i jádro názvu, protože OSM jméno bývá bez typového slova), že se shoda
 * dělí na přesnou a částečnou — a hlavně že rozpor obcí report VYZNAČÍ.
 * Právě obec je tu jediná levná pojistka proti záměně entit, kvůli které
 * seděla 27. 7. 2026 Lovecká chata na mapě 10 km vedle.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  jadroJmena,
  normJmeno,
  overpassDotazJmena,
  profilyBezGps,
  sestavReport,
  sparujNalezy,
  type ProfilBezGps,
} from '../../scripts/data31-gps-dohledavka'
import type { OsmElement } from '../../scripts/data01-overpass-krkonose'

const node = (id: number, tags: Record<string, string>, lat = 50.7, lon = 15.6): OsmElement => ({ type: 'node', id, lat, lon, tags })

describe('výběr profilů bez GPS', () => {
  it('bere jen profily bez lat/lng, meta soubory a profily se souřadnicemi přeskakuje', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'data31-'))
    mkdirSync(tmp, { recursive: true })
    writeFileSync(join(tmp, 'ma-gps.yaml'), 'nazev: Má GPS\nslug: ma-gps\nlat: 50.7\nlng: 15.6\n', 'utf8')
    writeFileSync(join(tmp, 'bez-gps.yaml'), 'nazev: Erlebachova bouda\nslug: erlebachova-bouda\nobec: Špindlerův Mlýn\n', 'utf8')
    writeFileSync(join(tmp, 'jen-sirka.yaml'), 'nazev: Půlka\nslug: pulka\nlat: 50.7\n', 'utf8')
    writeFileSync(join(tmp, '_meta.yaml'), 'neco: jiného\n', 'utf8')

    expect(profilyBezGps(tmp)).toEqual([
      { slug: 'erlebachova-bouda', nazev: 'Erlebachova bouda', obec: 'Špindlerův Mlýn' },
      { slug: 'pulka', nazev: 'Půlka', obec: null },
    ])
    expect(profilyBezGps(join(tmp, 'neexistuje'))).toEqual([])
  })
})

describe('jméno a jeho jádro', () => {
  it('normalizace srovná diakritiku, velikost i mezery', () => {
    expect(normJmeno('  Chata  Pod   STUDNIČNOU ')).toBe('chata pod studnicnou')
  })

  it('jádro odebere typová slova, ať se najde i OSM jméno bez nich', () => {
    expect(jadroJmena('Chata Pod Studničnou')).toBe('pod studnicnou')
    expect(jadroJmena('Erlebachova bouda')).toBe('erlebachova')
    // Polské „ł" zůstane: není to L s diakritikou, ale samostatné písmeno,
    // takže ho NFD nerozloží — kdežto „ą" o ocásek přijde. Pro porovnání to
    // nevadí (obě strany projdou touž normalizací), ale ať to nikoho nepřekvapí.
    expect(jadroJmena('Schronisko PTTK nad Łomniczką')).toBe('nad łomniczka')
  })
})

describe('dotaz', () => {
  it('hledá jménem bez ohledu na tag, v area státu a v okně oblasti', () => {
    const dotaz = overpassDotazJmena('CZ', ['Erlebachova bouda', 'pod studnicnou'], '50.55,15.30,50.87,16.05')
    expect(dotaz).toContain('["name"~"Erlebachova bouda|pod studnicnou",i]')
    expect(dotaz).toContain('area["ISO3166-1"="CZ"]')
    expect(dotaz).toContain('50.55,15.30,50.87,16.05')
    expect(dotaz).toContain('out center')
    expect(dotaz).not.toContain('tourism') // celý smysl: tag neomezujeme
  })

  it('metaznaky ve jménu se escapují (jinak by regex spadl nebo lovil nesmysly)', () => {
    expect(overpassDotazJmena('PL', ['Schronisko "Pod Łabskim Szczytem"'], '1,2,3,4')).toContain(
      'Schronisko \\"Pod Łabskim Szczytem\\"',
    )
  })

  it('duplicitní jména se do dotazu nedávají dvakrát', () => {
    const dotaz = overpassDotazJmena('CZ', ['Portášky', 'Portášky', ''], '1,2,3,4')
    expect(dotaz.match(/Portášky/gu)).toHaveLength(1)
  })
})

describe('párování nálezů', () => {
  const profily: ProfilBezGps[] = [
    { slug: 'erlebachova-bouda', nazev: 'Erlebachova bouda', obec: 'Špindlerův Mlýn' },
    { slug: 'chata-pod-studnicnou', nazev: 'Chata Pod Studničnou', obec: 'Pec pod Sněžkou' },
  ]

  it('rozliší přesnou a částečnou shodu a přesnou dá první', () => {
    const [erl] = sparujNalezy(profily, [
      node(1, { name: 'Erlebachova', tourism: 'hotel' }, 50.758, 15.633),
      node(2, { name: 'Erlebachova bouda', tourism: 'hotel', 'addr:city': 'Špindlerův Mlýn', ele: '880' }, 50.759, 15.634),
    ])
    expect(erl.nalezy.map((n) => n.typShody)).toEqual(['presna', 'castecna'])
    expect(erl.nalezy[0]).toMatchObject({ nazev: 'Erlebachova bouda', lat: 50.759, lng: 15.634, obecOsm: 'Špindlerův Mlýn' })
    expect(erl.nalezy[0].tagy).toContain('tourism=hotel')
    expect(erl.nalezy[0].tagy).toContain('ele=880')
    expect(erl.nalezy[0].osm).toBe('https://www.openstreetmap.org/node/2')
  })

  it('najde objekt i pod jménem bez typového slova (to je smysl jádra)', () => {
    const [, pod] = sparujNalezy(profily, [node(3, { name: 'Pod Studničnou', tourism: 'chalet' }, 50.708, 15.726)])
    expect(pod.nalezy).toHaveLength(1)
    expect(pod.nalezy[0].typShody).toBe('castecna')
  })

  it('cizí jména nebere a objekt bez souřadnic přeskočí', () => {
    const vysledek = sparujNalezy(profily, [
      node(4, { name: 'Luční bouda', tourism: 'alpine_hut' }),
      { type: 'way', id: 5, tags: { name: 'Erlebachova bouda' } }, // bez lat/lon i center
    ])
    expect(vysledek.every((v) => v.nalezy.length === 0)).toBe(true)
  })

  it('report vyznačí rozpor obcí — jediná levná pojistka proti záměně entit', () => {
    const navrhy = sparujNalezy(profily, [
      node(6, { name: 'Erlebachova bouda', 'addr:city': 'Vrchlabí', tourism: 'hotel' }, 50.6, 15.6),
    ])
    const report = sestavReport(navrhy, 'Krkonoše')
    expect(report).toContain('⚠ obec nesedí')
    expect(report).toContain('obec v profilu: Špindlerův Mlýn')
    expect(report).toContain('Chata Pod Studničnou') // profil bez nálezu se přizná
    expect(report).toContain('Bez nálezu v OSM')
    expect(report).toContain('ODbL')
  })

  it('shodná obec varování nevyvolá', () => {
    const navrhy = sparujNalezy(profily, [
      node(7, { name: 'Erlebachova bouda', 'addr:city': 'Špindlerův Mlýn' }, 50.758, 15.633),
    ])
    expect(sestavReport(navrhy, 'Krkonoše')).not.toContain('⚠ obec nesedí')
  })
})
