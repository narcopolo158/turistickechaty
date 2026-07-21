/**
 * DATA-06 (increment 2): rozpoznání typu výchozího bodu z OSM tagů
 * (place/aerialway/railway), roztřídění elementů na body (do katalogu) vs.
 * vynechané (k ruční kontrole) a deduplikace fyzicky téhož bodu. Nic se
 * nedomýšlí — neznámý typ / bez názvu / bez GPS do katalogu nejde. Overpass se
 * nevolá (sandbox nedosáhne; ostrý běh dělá Actions).
 */
import { describe, expect, it } from 'vitest'

import {
  overpassDotazVychoziBody,
  typBoduZTagu,
  zpracujBody,
  type ExportPolozka,
} from '../../scripts/data06-vychozi-body'
import type { OsmElement } from '../../scripts/data01-overpass-krkonose'

describe('DATA-06 · typ výchozího bodu z OSM tagů', () => {
  it('place=town|village → obec', () => {
    expect(typBoduZTagu({ place: 'town' })).toBe('obec')
    expect(typBoduZTagu({ place: 'village' })).toBe('obec')
  })

  it('aerialway=station → lanovka', () => {
    expect(typBoduZTagu({ aerialway: 'station' })).toBe('lanovka')
  })

  it('railway=station|halt → železnice', () => {
    expect(typBoduZTagu({ railway: 'station' })).toBe('zeleznice')
    expect(typBoduZTagu({ railway: 'halt' })).toBe('zeleznice')
  })

  it('highway=bus_stop → zastávka', () => {
    expect(typBoduZTagu({ highway: 'bus_stop' })).toBe('zastavka')
  })

  it('nerozpoznané → null (nedomýšlet)', () => {
    expect(typBoduZTagu({})).toBeNull()
    expect(typBoduZTagu({ place: 'hamlet' })).toBeNull() // samota — moc drobná, nebereme
    expect(typBoduZTagu({ aerialway: 'pylon' })).toBeNull()
    expect(typBoduZTagu({ railway: 'rail' })).toBeNull()
  })
})

describe('DATA-06 · roztřídění a dedup výchozích bodů', () => {
  const node = (id: number, tags: Record<string, string>, lat = 50.7, lon = 15.6): OsmElement => ({
    type: 'node',
    id,
    lat,
    lon,
    tags,
  })

  it('platný bod → katalog, chybějící typ/název/GPS → vynecháno', () => {
    const polozky: ExportPolozka[] = [
      { el: node(1, { place: 'town', name: 'Špindlerův Mlýn', ele: '715' }), zeme: 'cz' },
      { el: node(2, { aerialway: 'station', name: 'Medvědín – horní' }, 50.73, 15.58), zeme: 'cz' },
      { el: node(3, { place: 'village' }), zeme: 'cz' }, // bez názvu
      { el: node(4, { shop: 'bakery', name: 'Pekárna' }), zeme: 'cz' }, // neznámý typ
      { el: { type: 'way', id: 5, tags: { aerialway: 'station', name: 'Bez GPS' } }, zeme: 'pl' }, // bez souřadnic
    ]
    const { body, vynechano } = zpracujBody(polozky)

    expect(body).toHaveLength(2)
    const spindl = body.find((b) => b.nazev === 'Špindlerův Mlýn')
    expect(spindl).toMatchObject({ typ: 'obec', vyska: 715, zeme: 'cz', lat: 50.7, lng: 15.6 })
    expect(spindl?.url).toContain('/node/1')
    expect(body.find((b) => b.nazev.startsWith('Medvědín'))?.typ).toBe('lanovka')

    expect(vynechano).toHaveLength(3)
    expect(vynechano.map((v) => v.duvod).sort()).toEqual(['bez-nazvu', 'bez-souradnic', 'neznamy-typ'])
  })

  it('výška jen z rozumného čísla, jinak null', () => {
    const polozky: ExportPolozka[] = [
      // OSM `ele` je prosté číslo v metrech; tolerujeme i koncové „ m" (jako DATA-01).
      { el: node(10, { place: 'village', name: 'S výškou', ele: '1100 m' }), zeme: 'cz' },
      { el: node(11, { place: 'village', name: 'Bez výšky' }, 50.71, 15.61), zeme: 'cz' },
      { el: node(12, { place: 'village', name: 'Nesmysl', ele: 'x' }, 50.72, 15.62), zeme: 'cz' },
    ]
    const { body } = zpracujBody(polozky)
    expect(body.find((b) => b.nazev === 'S výškou')?.vyska).toBe(1100)
    expect(body.find((b) => b.nazev === 'Bez výšky')?.vyska).toBeNull()
    expect(body.find((b) => b.nazev === 'Nesmysl')?.vyska).toBeNull()
  })

  it('sloučí fyzicky týž bod (stanice jako node i way na stejném místě)', () => {
    const polozky: ExportPolozka[] = [
      { el: node(20, { aerialway: 'station', name: 'Sněžka' }, 50.7359, 15.7397), zeme: 'cz' },
      { el: { type: 'way', id: 21, tags: { aerialway: 'station', name: 'Sněžka' }, center: { lat: 50.736, lon: 15.7398 } }, zeme: 'cz' },
    ]
    const { body } = zpracujBody(polozky)
    expect(body).toHaveLength(1)
    expect(body[0].osmId).toBe(20) // první výskyt vyhrává
  })

  it('dvě různá sídla téhož jména daleko od sebe NEsloučí', () => {
    const polozky: ExportPolozka[] = [
      { el: node(30, { place: 'village', name: 'Rokytno' }, 50.60, 15.40), zeme: 'cz' },
      { el: node(31, { place: 'village', name: 'Rokytno' }, 50.80, 15.90), zeme: 'cz' },
    ]
    expect(zpracujBody(polozky).body).toHaveLength(2)
  })
})

describe('DATA-06 · tvar Overpass dotazu na výchozí body', () => {
  it('ptá se na place town/village + aerialway + railway v area ∩ bboxu, out center', () => {
    const dotaz = overpassDotazVychoziBody('CZ')
    expect(dotaz).toContain('ISO3166-1"="CZ"')
    expect(dotaz).toContain('place')
    expect(dotaz).toContain('town|village')
    expect(dotaz).toContain('aerialway')
    expect(dotaz).toContain('railway')
    expect(dotaz).toContain('bus_stop')
    expect(dotaz).toContain('out center;')
  })
})
