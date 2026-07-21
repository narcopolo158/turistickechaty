/**
 * DATA-06: parser katalogu doporučených výchozích bodů (ChatGPT podklad) +
 * geokódování přes OSM. Testuje robustní CSV parser, shodu OSM názvu po CELÝCH
 * slovech (ne podřetězci — „…lanovky" NESMÍ sednout na obec „Lánov") a načtení
 * doporučených bodů seskupených dle chaty a seřazených dle pořadí. Nad
 * podvrženými daty, bez souborů.
 */
import { describe, expect, it } from 'vitest'

import { geokodujBod, nactiDoporucene, parseCSV, type OsmBod } from '../../scripts/data06-katalog-vychozi'

const osm: OsmBod[] = [
  { nazev: 'Rokytnice nad Jizerou', typ: 'obec', lat: 50.7261, lng: 15.4472 },
  { nazev: 'Lysá hora', typ: 'lanovka', lat: 50.7539, lng: 15.5065 },
  { nazev: 'Lánov', typ: 'obec', lat: 50.6203, lng: 15.6555 },
  { nazev: 'Szrenica I', typ: 'lanovka', lat: 50.8057, lng: 15.5203 },
  { nazev: 'Szklarska Poręba', typ: 'obec', lat: 50.8268, lng: 15.5221 },
  { nazev: 'Szklarska Poręba Górna', typ: 'zeleznice', lat: 50.8326, lng: 15.5187 },
  { nazev: 'Pec pod Sněžkou', typ: 'obec', lat: 50.6912, lng: 15.7325 },
]

describe('DATA-06 katalog · parseCSV', () => {
  it('základní řádky a hlavička', () => {
    const r = parseCSV('a,b,c\n1,2,3\n')
    expect(r).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('uvozovky s čárkou a zalomením uvnitř pole', () => {
    const r = parseCSV('Chata,Pozn\n"Luční, bouda","řádek1\nřádek2"\n')
    expect(r[1][0]).toBe('Luční, bouda')
    expect(r[1][1]).toBe('řádek1\nřádek2')
  })

  it('zdvojené uvozovky = escapovaná uvozovka', () => {
    const r = parseCSV('a\n"říká ""ahoj"""\n')
    expect(r[1][0]).toBe('říká "ahoj"')
  })

  it('odstraní BOM a zvládne poslední řádek bez \\n', () => {
    const r = parseCSV('﻿a,b\n1,2')
    expect(r[0]).toEqual(['a', 'b'])
    expect(r[1]).toEqual(['1', '2'])
  })
})

describe('DATA-06 katalog · geokodujBod (shoda po celých slovech)', () => {
  it('„…stanice lanovky" NESEDÍ na obec Lánov (lanov ⊂ lanovky)', () => {
    // regresní pojistka: podřetězcová shoda by dala Lánov 20 km vedle
    const g = geokodujBod('Szrenica, horní stanice lanovky', 'Szklarska Poręba', osm)
    expect(g?.nazev).not.toBe('Lánov')
    expect(g?.nazev).toBe('Szrenica I') // krátký token „I" se pro shodu ignoruje
  })

  it('preferuje konkrétní bod (lanovka) před obcí', () => {
    const g = geokodujBod('Rokytnice nad Jizerou, Lysá hora – lanovka', '', osm)
    expect(g?.nazev).toBe('Lysá hora')
    expect(g?.typ).toBe('lanovka')
  })

  it('preferuje delší (specifičtější) název při stejném typu', () => {
    const g = geokodujBod('Szklarska Poręba Górna, železniční stanice', '', osm)
    expect(g?.nazev).toBe('Szklarska Poręba Górna')
  })

  it('fallback na „nejbližší uzel", když popis bodu nesedí', () => {
    const g = geokodujBod('U starého mostu (bez OSM názvu)', 'Pec pod Sněžkou', osm)
    expect(g?.nazev).toBe('Pec pod Sněžkou')
  })

  it('null, když nesedí bod ani uzel', () => {
    expect(geokodujBod('Nikde v datech', 'Taky nikde', osm)).toBeNull()
  })

  it('vyžaduje všechny významné tokeny OSM názvu', () => {
    // „Rokytnice" samo o sobě nesmí sednout na „Rokytnice nad Jizerou"
    const g = geokodujBod('Rokytnice (jen část názvu)', '', osm)
    expect(g).toBeNull()
  })
})

const CSV_HLAVICKA =
  'ID chaty,Chata,Země,Pohoří,Nejbližší obec / uzel,Pořadí,Výchozí bod,Typ výchozího bodu,Doprava / návaznost,Sezóna / omezení,Jistota,Zdrojové URL,Poznámka,Ověřeno k'

const radek = (chata: string, poradi: string, bod: string, uzel: string, zdroj = '', pozn = '', typ = 'obec'): string =>
  `HUT-x,${chata},Česko,Krkonoše,${uzel},${poradi},"${bod}",${typ},autobus,celoročně,A,"${zdroj}","${pozn}",2026-07-21`

describe('DATA-06 katalog · nactiDoporucene', () => {
  it('seskupí dle normalizovaného názvu chaty a seřadí dle pořadí', () => {
    const csv = [
      CSV_HLAVICKA,
      radek('Chata Dvoračky', '2', 'Lysá hora – lanovka', 'Rokytnice nad Jizerou'),
      radek('Chata Dvoračky', '1', 'Rokytnice nad Jizerou, Horní Domky', 'Rokytnice nad Jizerou'),
    ].join('\n')
    const m = nactiDoporucene(csv, osm)
    const d = m.get('chata dvoracky')
    expect(d).toBeDefined()
    expect(d!.map((x) => x.poradi)).toEqual([1, 2]) // seřazeno
    expect(d![0].vychoziBod).toContain('Rokytnice')
  })

  it('vynechá řádky, které se nezgeokódují', () => {
    const csv = [
      CSV_HLAVICKA,
      radek('Labská bouda', '1', 'Neexistující místo', 'Také nikde'),
      radek('Labská bouda', '2', 'Pec pod Sněžkou, náměstí', 'Pec pod Sněžkou'),
    ].join('\n')
    const d = nactiDoporucene(csv, osm).get('labska bouda')
    expect(d).toHaveLength(1)
    expect(d![0].vychoziBod).toContain('Pec')
  })

  it('rozparsuje zdroje URL (whitespace/nové řádky, jen http(s))', () => {
    const csv = [
      CSV_HLAVICKA,
      radek('Luční bouda', '1', 'Pec pod Sněžkou', 'Pec pod Sněžkou', 'https://a.cz\nhttps://b.cz\nne-url'),
    ].join('\n')
    const d = nactiDoporucene(csv, osm).get('lucni bouda')
    expect(d![0].zdroje).toEqual(['https://a.cz', 'https://b.cz'])
  })

  it('přenese metadata (typ, poznámka) a GPS z OSM', () => {
    const csv = [CSV_HLAVICKA, radek('Vosecká bouda', '1', 'Szklarska Poręba', 'Szklarska Poręba', '', 'sezónní bus', 'zeleznice')].join(
      '\n',
    )
    const d = nactiDoporucene(csv, osm).get('vosecka bouda')!
    expect(d[0].poznamka).toBe('sezónní bus')
    expect(d[0].lat).toBeCloseTo(50.8268, 3)
    expect(d[0].lng).toBeCloseTo(15.5221, 3)
  })

  it('prázdný / jen hlavičkový CSV → prázdná mapa', () => {
    expect(nactiDoporucene('', osm).size).toBe(0)
    expect(nactiDoporucene(CSV_HLAVICKA, osm).size).toBe(0)
  })
})
