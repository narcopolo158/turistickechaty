/**
 * DATA-01: export chat Krkonoš z OSM — mapování tagů, poctivost dat,
 * staging kandidátů, ochrana + porovnání ručních profilů a tvar Overpass
 * dotazu (API se mockuje, sandbox na Overpass nedosáhne; ostrý běh dělá
 * Actions workflow).
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  DVOJI_ENTITA_M,
  OKOLI_OBCERSTVENI_M,
  chataZElementu,
  indexJinychOblasti,
  indexPolohJinychOblasti,
  MIN_VYSKA_ROZHLEDNY_M,
  jePrilisNizka,
  jeRozhledna,
  nactiExport,
  nactiVyrazene,
  osmUrl,
  overpassDotaz,
  overpassDotazRozhledny,
  parujRozhledny,
  porovnejSRucnim,
  stahniOverpass,
  vyskaVeze,
  vzdalenostM,
  yamlChaty,
  zapisKandidaty,
  znackaObcerstveni,
  type ExportPolozka,
  type OsmElement,
  verdiktBehu,
} from '../../scripts/data01-overpass-krkonose'
import { oblastDleSlugu, zemeDotazu } from '../../scripts/oblasti'

const CHECKED = '2026-07-20'

const node = (id: number, tags: Record<string, string>, lat = 50.7, lon = 15.7): OsmElement => ({
  type: 'node',
  id,
  lat,
  lon,
  tags,
})

describe('overpassDotaz', () => {
  it('ptá se na hutové tagy, v area státu a s bboxem Krkonoš', () => {
    // Od 30. 7. 2026 jsou tagy v jednom regexu (přibyl `chalet`) a k nim
    // druhá vrstva na civilně tagované boudy — podrobnosti hlídá
    // `data01-siroky-dotaz`. Tady jde o kostru dotazu.
    const dotaz = overpassDotaz('CZ')
    for (const tag of ['alpine_hut', 'wilderness_hut', 'hut', 'chalet'])
      expect(dotaz).toContain(tag)
    expect(dotaz).toContain('"tourism"~')
    expect(dotaz).toContain('area["ISO3166-1"="CZ"]')
    expect(dotaz).toContain('50.55,15.30,50.87,16.05')
    expect(dotaz).toContain('out center') // way/relation potřebují souřadnice středu
  })

  it('Krkonoše se dotazují za obě země — ČR i Polsko (přeshraniční pohoří vcelku)', () => {
    expect(zemeDotazu(oblastDleSlugu('krkonose'))).toEqual([
      { zeme: 'cz', iso: 'CZ' },
      { zeme: 'pl', iso: 'PL' },
    ])
    expect(overpassDotaz('PL')).toContain('area["ISO3166-1"="PL"]')
  })

  /**
   * Běh z 30. 7. 2026 spadl na tom, že se Ještědského hřbetu — celého v Česku —
   * ptal i Polska. V okně (50.62–50.84 N, 14.8–15.12 E) žádné polské území
   * není, takže odpověď byla prázdná; prázdno se ale počítá za selhání
   * instance, a po třech kolech u tří instancí (17 minut) spadl celý běh
   * s exit 1 — i s hotovým českým exportem, který se tím nezacommitoval.
   */
  it('Ještědský hřbet se Polska neptá — je celý v Česku', () => {
    expect(zemeDotazu(oblastDleSlugu('jestedsky-hrbet'))).toEqual([{ zeme: 'cz', iso: 'CZ' }])
  })
})

/**
 * Rozhodnutí Michala 28. 7. 2026: rozhledny bereme JEN s občerstvením
 * (restaurace, bufet) nebo když je jejich součástí chata. Volně přístupná
 * věž bez občerstvení do průvodce nepatří.
 */
describe('rozhledny s občerstvením', () => {
  const vez = (id: number, tags: Record<string, string> = {}, lat = 50.7, lon = 15.7) =>
    node(id, { 'tower:type': 'observation', name: `Rozhledna ${id}`, ...tags }, lat, lon)
  // ~44 m severně (0,0004° zeměpisné šířky) a ~330 m severně.
  const BLIZKO = 50.7004
  const DALEKO = 50.703

  it('dotaz vybere rozhledny a k nim občerstvení v okolí — v area státu a okně oblasti', () => {
    const dotaz = overpassDotazRozhledny('CZ', '50.75,15.05,51.02,15.45')
    expect(dotaz).toContain('"tower:type"="observation"')
    expect(dotaz).toContain('->.rozhledny')
    expect(dotaz).toContain(`around.rozhledny:${OKOLI_OBCERSTVENI_M}`)
    expect(dotaz).toContain('restaurant|cafe|fast_food|bar|pub|biergarten')
    expect(dotaz).toContain('alpine_hut|wilderness_hut|hut|chalet')
    expect(dotaz).toContain('area["ISO3166-1"="CZ"]')
    expect(dotaz).toContain('50.75,15.05,51.02,15.45')
  })

  it('pozná rozhlednu a doklad občerstvení z tagů', () => {
    expect(jeRozhledna(vez(1))).toBe(true)
    expect(jeRozhledna(node(2, { tourism: 'alpine_hut', name: 'Bouda' }))).toBe(false)
    expect(znackaObcerstveni(node(3, { amenity: 'fast_food' }))).toEqual({
      znacka: 'amenity=fast_food',
      jeChata: false,
    })
    expect(znackaObcerstveni(node(4, { tourism: 'alpine_hut' }))).toEqual({
      znacka: 'tourism=alpine_hut',
      jeChata: true,
    })
    // atrakce u rozhledny občerstvení nedokládá — nesmí ji propašovat dovnitř
    expect(znackaObcerstveni(node(5, { tourism: 'attraction' }))).toBeNull()
    expect(znackaObcerstveni(node(6, { amenity: 'toilets' }))).toBeNull()
  })

  it('spáruje bufet v okolí, vzdálený objekt nebere a řadí od nejbližšího', () => {
    const [r] = parujRozhledny([
      vez(10),
      node(11, { amenity: 'cafe', name: 'Kavárna u věže' }, BLIZKO),
      node(12, { amenity: 'restaurant', name: 'Restaurace daleko' }, DALEKO),
      node(13, { amenity: 'fast_food', name: 'Bufet' }, 50.7002),
    ])
    expect(r.obcerstveni.map((o) => o.nazev)).toEqual(['Bufet', 'Kavárna u věže'])
    expect(r.obcerstveni[0].vzdalenostM).toBeLessThan(r.obcerstveni[1].vzdalenostM)
    expect(r.obcerstveni.every((o) => o.vzdalenostM <= OKOLI_OBCERSTVENI_M)).toBe(true)
  })

  it('občerstvení zatagované přímo na věži je doklad se vzdáleností 0', () => {
    const [r] = parujRozhledny([vez(20, { amenity: 'cafe' })])
    expect(r.obcerstveni).toEqual([
      {
        url: osmUrl(vez(20)),
        nazev: 'Rozhledna 20',
        znacka: 'amenity=cafe',
        vzdalenostM: 0,
        jeChata: false,
      },
    ])
  })

  // Z prvního ostrého běhu v Jizerkách (28. 7. 2026): mezi devíti nálezy byla
  // i „vyhlídka na Harrachov" s height=5 — pětimetrová plošina u můstků není
  // rozhledna. Práh sahá JEN na doloženou výšku; co OSM neuvádí, se nedomýšlí.
  it('doložená výška pod prahem dělá z nálezu vyhlídkovou plošinu, ne rozhlednu', () => {
    expect(jePrilisNizka(vez(60, { height: '5' }))).toBe(true)
    expect(jePrilisNizka(vez(61, { height: '20.8' }))).toBe(false)
    expect(jePrilisNizka(vez(62))).toBe(false) // bez údaje se nevyřazuje
    expect(jePrilisNizka(vez(63, { height: '5,5' }))).toBe(true) // desetinná čárka
    expect(vyskaVeze(vez(64, { height: 'vysoká' }))).toBeNull()
    expect(MIN_VYSKA_ROZHLEDNY_M).toBe(8)
  })

  it('rozhledna bez občerstvení má prázdný doklad — tu podle rozhodnutí nebereme', () => {
    const [r] = parujRozhledny([
      vez(30),
      node(31, { amenity: 'restaurant', name: 'Restaurace daleko' }, DALEKO),
    ])
    expect(r.obcerstveni).toEqual([])
  })

  it('chata u rozhledny se pozná (dvojici pak posoudí redakce, ať nevznikne dvojí objekt)', () => {
    const [r] = parujRozhledny([
      vez(40),
      node(41, { tourism: 'alpine_hut', name: 'Bouda pod rozhlednou' }, BLIZKO),
    ])
    expect(r.obcerstveni[0]).toMatchObject({ nazev: 'Bouda pod rozhlednou', jeChata: true })
  })

  it('kandidát z rozhledny nese doklad občerstvení a typ `rozhledna`', () => {
    const vysledek = chataZElementu(vez(50, { height: '24' }), CHECKED, 'cz', {
      oblast: 'jizerske-hory',
      obcerstveni: [
        {
          url: 'https://www.openstreetmap.org/node/51',
          nazev: 'Bufet',
          znacka: 'amenity=fast_food',
          vzdalenostM: 12,
          jeChata: false,
        },
      ],
    })
    expect('duvod' in vysledek).toBe(false)
    const { data } = vysledek as { data: Record<string, unknown> }
    expect(data.typ).toBe('rozhledna') // pátá hodnota číselníku (Michal 28. 7. 2026)
    expect(data.oblast).toBe('jizerske-hory')
    const poznamky = data.interniPoznamky as string
    expect(poznamky).toContain('ROZHLEDNA S OBČERSTVENÍM')
    expect(poznamky).toContain('Bufet — amenity=fast_food, 12 m')
    expect(poznamky).toContain('Výška věže dle OSM: 24 m')
  })
})

describe('nactiExport', () => {
  it('checked bere z osm3s.timestamp_osm_base (datum stavu OSM dat)', () => {
    const raw = JSON.stringify({
      osm3s: { timestamp_osm_base: '2026-07-18T09:00:00Z' },
      elements: [],
    })
    expect(nactiExport(raw)).toEqual({ elementy: [], checked: '2026-07-18' })
  })

  it('nevalidní JSON i chybějící elements jsou tvrdá chyba', () => {
    expect(() => nactiExport('<html>error</html>')).toThrow(/validní JSON/)
    expect(() => nactiExport('{}')).toThrow(/elements/)
  })

  /**
   * Skutečná odpověď z beskydského běhu 8. 8. 2026 — HTTP 200, nula elementů
   * a chyba jen v `remark`. Do 8. 8. 2026 to pipeline brala jako výsledek,
   * takže dohledávka podle jmen z katalogu tiše neudělala nic a v kandidátech
   * chybí Libušín i Chata na Radhošti. Test drží ten konkrétní tvar odpovědi,
   * ne obecnou myšlenku.
   */
  it('běhová chyba v `remark` je tvrdá chyba, ne prázdný výsledek', () => {
    const raw = JSON.stringify({
      version: 0.6,
      generator: 'Overpass API 0.7.62.11 87bfad18',
      osm3s: { timestamp_osm_base: '2026-05-31T22:37:44Z' },
      elements: [],
      remark: 'runtime error: Query timed out in "query" at line 5 after 183 seconds.',
    })
    expect(() => nactiExport(raw)).toThrow(/běhovou chybu/)
    expect(() => nactiExport(raw)).toThrow(/timed out/)
  })

  it('chyba v `remark` platí i tehdy, když nějaké elementy přišly', () => {
    // Overpass umí vrátit ČÁST výsledku a pak vypršet. Částečný export je
    // horší než žádný: vypadá jako úspěch a rozdíl proti minulému běhu se
    // projeví jako „objekty zmizely".
    const raw = JSON.stringify({
      osm3s: { timestamp_osm_base: '2026-08-08T00:00:00Z' },
      elements: [{ type: 'node', id: 1, lat: 49.5, lon: 18.4, tags: { name: 'Chata' } }],
      remark: 'runtime error: Query run out of memory in "recurse" at line 7.',
    })
    expect(() => nactiExport(raw)).toThrow(/běhovou chybu/)
  })

  it('neškodný `remark` bez chyby export neshodí', () => {
    // Overpass posílá `remark` i pro nechybová hlášení. Kdyby kontrola
    // reagovala na jeho pouhou přítomnost, začala by shazovat platné běhy.
    const raw = JSON.stringify({
      osm3s: { timestamp_osm_base: '2026-08-08T00:00:00Z' },
      elements: [],
      remark: 'Query returned an empty result set.',
    })
    expect(nactiExport(raw)).toEqual({ elementy: [], checked: '2026-08-08' })
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
    expect(d.kontakty).toEqual({
      telefon: '+420 123 456 789',
      email: 'info@example.cz',
      web: 'https://example.cz/',
    })
    expect(d.aliasy).toEqual([
      { nazev: 'Baudenschänke', poznamka: 'historický název (OSM old_name)' },
    ])
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
    const el = node(
      110,
      { tourism: 'alpine_hut', name: 'Schronisko pod Łabskim Szczytem' },
      50.775,
      15.55,
    )
    const vysledek = chataZElementu(el, CHECKED, 'pl')
    if (!('data' in vysledek)) throw new Error('čekal jsem data')
    expect(vysledek.data.slug).toBe('schronisko-pod-labskim-szczytem')
    const okraj = chataZElementu(
      node(
        111,
        { tourism: 'alpine_hut', name: 'Schronisko PTTK na Przełęczy Okraj' },
        50.78,
        15.86,
      ),
      CHECKED,
      'pl',
    )
    if (!('data' in okraj)) throw new Error('čekal jsem data')
    expect(okraj.data.slug).toBe('schronisko-pttk-na-przeleczy-okraj')
  })

  it('wilderness_hut → útulna; nestandardní hut typ nedostane (určí redakce)', () => {
    const utulna = chataZElementu(
      node(103, { tourism: 'wilderness_hut', name: 'Útulna Pod Lesem', ele: 'cca 900?' }),
      CHECKED,
    )
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
    const bezSouradnic = chataZElementu(
      { type: 'way', id: 105, tags: { tourism: 'alpine_hut', name: 'Bouda' } },
      CHECKED,
    )
    expect(bezSouradnic).toEqual({
      duvod: 'bez-souradnic',
      url: 'https://www.openstreetmap.org/way/105',
    })
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
    const el = node(
      1,
      { tourism: 'alpine_hut', name: 'Luční Bouda', ele: '1413' },
      50.7346,
      15.6967,
    )
    const rucni =
      'nazev: Luční bouda\nslug: lucni-bouda\nlat: 50.734525\nlng: 15.696628\nvyska: 1410\n'
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
    const rucniYaml =
      '# ruční profil — nesahat\nnazev: Luční bouda\nslug: lucni-bouda\nlat: 50.7345\nlng: 15.6966\nvyska: 1410\n'
    mkdirSync(rucni, { recursive: true })
    writeFileSync(join(rucni, 'lucni-bouda.yaml'), rucniYaml, 'utf8')

    const cz = (el: OsmElement): ExportPolozka => ({ el, zeme: 'cz', checked: CHECKED })
    const polozky = [
      cz(node(1, { tourism: 'alpine_hut', name: 'Luční bouda', ele: '1413' }, 50.7346, 15.6967)), // ruční
      cz(node(2, { tourism: 'alpine_hut', name: 'Nová bouda' })),
      cz(node(3, { tourism: 'alpine_hut', name: 'Nová bouda' })), // kolize jména
      cz(node(4, { tourism: 'alpine_hut' })), // beze jména
      {
        el: node(5, { tourism: 'alpine_hut', name: 'Schronisko Odrodzenie' }, 50.753, 15.685),
        zeme: 'pl',
        checked: '2026-07-19',
      } as ExportPolozka,
    ]
    const report = zapisKandidaty(polozky, kandidati, rucni)

    expect(report.rucni).toHaveLength(1)
    expect(report.rucni[0].slug).toBe('lucni-bouda')
    expect(report.rucni[0].gpsRozdilM as number).toBeLessThan(50)
    expect(readFileSync(join(rucni, 'lucni-bouda.yaml'), 'utf8')).toBe(rucniYaml) // nedotčeno
    expect(readdirSync(kandidati).sort()).toEqual([
      'nova-bouda-3.yaml',
      'nova-bouda.yaml',
      'schronisko-odrodzenie.yaml',
    ])
    expect(report.zapsano.map((z) => z.slug)).toEqual([
      'nova-bouda',
      'nova-bouda-3',
      'schronisko-odrodzenie',
    ])
    expect(report.preskoceno).toHaveLength(1)
    expect(parse(readFileSync(join(kandidati, 'nova-bouda-3.yaml'), 'utf8')).slug).toBe(
      'nova-bouda-3',
    )
    const pl = parse(readFileSync(join(kandidati, 'schronisko-odrodzenie.yaml'), 'utf8'))
    expect(pl.zeme).toBe('pl')
    expect(pl.overeniLokace.checked).toBe('2026-07-19') // checked per export dané země

    // Druhý běh je idempotentní: nic nového, existující kandidáti hlášeni, soubor nezměněn.
    const obsahPred = readFileSync(join(kandidati, 'nova-bouda.yaml'), 'utf8')
    const znovu = zapisKandidaty(polozky, kandidati, rucni)
    expect(znovu.zapsano).toHaveLength(0)
    expect(znovu.jizKandidat.map((k) => k.slug)).toEqual([
      'nova-bouda',
      'nova-bouda-3',
      'schronisko-odrodzenie',
    ])
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
    expect(report.vyrazeno).toEqual([
      { url: 'https://www.openstreetmap.org/node/11', duvod: 'duplicita — sloučeno' },
    ])
    expect(readdirSync(kandidati).sort()).toEqual(['poctiva-bouda.yaml']) // duplicitní se nezaložila
  })

  // Regrese z 28. 7. 2026: oblast byla v transformaci natvrdo „krkonose",
  // takže první běh pro Jizerské hory založil sedm kandidátů s cizí oblastí
  // (a hlavičkou, která posílala povyšovat do data/chaty/krkonose/).
  it('oblast se propisuje do YAML i do hlavičky — nová oblast nedědí Krkonoše', () => {
    const polozky: ExportPolozka[] = [
      {
        el: node(60, { tourism: 'alpine_hut', name: 'Jizerská bouda' }),
        zeme: 'cz',
        checked: CHECKED,
      },
    ]
    zapisKandidaty(polozky, kandidati, rucni, new Map(), 'jizerske-hory')
    const soubor = readFileSync(join(kandidati, 'jizerska-bouda.yaml'), 'utf8')
    expect(parse(soubor).oblast).toBe('jizerske-hory')
    expect(soubor).toContain('data/chaty/jizerske-hory/')
    expect(soubor).not.toContain('data/chaty/krkonose/')
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
    elements: [
      {
        type: 'node',
        id: 1,
        lat: 50.7,
        lon: 15.4,
        tags: { tourism: 'alpine_hut', name: 'Zkušební bouda' },
      },
    ],
  })
  const PRAZDNY = JSON.stringify({
    osm3s: { timestamp_osm_base: '2026-07-20T05:00:00Z' },
    elements: [],
  })
  /** Spánek se v testech jen zaznamenává — čekat 30 s doopravdy nechceme. */
  const spanekSpy = () => {
    const cekani: number[] = []
    return { cekani, spanek: async (ms: number) => void cekani.push(ms) }
  }

  it('POSTuje dotaz jako data= a vrací surový text exportu i použitou instanci', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(RAW, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      stahniOverpass(['https://overpass.example/api/interpreter'], overpassDotaz('CZ')),
    ).resolves.toEqual({
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
    await expect(
      stahniOverpass(['https://hlavni.example', 'https://zrcadlo.example'], overpassDotaz('CZ')),
    ).resolves.toEqual({
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
      stahniOverpass(
        ['https://a.example', 'https://b.example', 'https://c.example'],
        overpassDotaz('CZ'),
        { kola: 1 },
      ),
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
      stahniOverpass(['https://a.example', 'https://b.example'], overpassDotaz('CZ'), {
        pauzy: [30_000, 90_000],
        spanek,
      }),
    ).resolves.toEqual({ raw: RAW, api: 'https://a.example' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(cekani).toEqual([30_000]) // jedna pauza: po prvním neúspěšném kole
  })

  it('vyčerpaná kola nesou v chybě číslo kola a délky pauz rostou', async () => {
    const { cekani, spanek } = spanekSpy()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('too busy', { status: 504 })))
    await expect(
      stahniOverpass(['https://a.example'], overpassDotaz('CZ'), {
        kola: 3,
        pauzy: [30_000, 90_000],
        spanek,
      }),
    ).rejects.toThrow(/kolo 3\/3\): HTTP 504 \(přetížená instance\)/)
    expect(cekani).toEqual([30_000, 90_000])
  })

  // Regionální zrcadlo (jen Švýcarsko, jen Britské ostrovy…) odpoví na dotaz
  // mimo svůj výřez HTTP 200 a prázdným seznamem. Bez pojistky by se uložil
  // prázdný export a běh by hlásil „0 nových kandidátů" jako úspěch.
  it('prázdná odpověď je selhání instance — a `povolitPrazdno` ji přijme', async () => {
    const { spanek } = spanekSpy()
    // Tělo Response se dá přečíst jen jednou — každý pokus dostane vlastní.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response(PRAZDNY, { status: 200 })),
    )
    await expect(
      stahniOverpass(['https://regionalni.example'], overpassDotaz('CZ'), { kola: 1, spanek }),
    ).rejects.toThrow(/0 objektů — instance nejspíš nemá celosvětová data/)
    await expect(
      stahniOverpass(['https://regionalni.example'], overpassDotaz('CZ'), {
        kola: 1,
        spanek,
        povolitPrazdno: true,
      }),
    ).resolves.toEqual({ raw: PRAZDNY, api: 'https://regionalni.example' })
  })
})

/**
 * Rozhodnutí Michala 30. 7. 2026: „uprav to tak, že zacommituje co najde."
 *
 * Předtím platilo všechno, nebo nic — a stálo to celý běh: polský dotaz na
 * Ještěd selhal (prázdno = selhání instance) a s ním přišel vniveč i hotový
 * český export, 7 objektů a 17 minut. Testy drží obě strany té dohody:
 * neúplný běh se ZAPÍŠE, ale musí být VIDĚT — ve výpisu i v commit message.
 */
describe('DATA-01 · verdikt neúplného běhu', () => {
  it('všechny země prošly → zapisuje se a nic se nehlásí', () => {
    const v = verdiktBehu([
      { iso: 'CZ', ok: true },
      { iso: 'PL', ok: true },
    ])
    expect(v.zapsat).toBe(true)
    expect(v.neuplny).toBe(false)
    expect(v.sentinel).toBeNull()
    expect(v.zprava).toContain('CZ, PL')
  })

  it('jedna země selhala → zapisuje se, co je, a neúplnost jde do commitu', () => {
    const v = verdiktBehu([
      { iso: 'CZ', ok: true },
      { iso: 'PL', ok: false, chyba: 'HTTP 504' },
    ])
    expect(v.zapsat).toBe(true)
    expect(v.neuplny).toBe(true)
    expect(v.hotove).toEqual(['CZ'])
    expect(v.selhale).toEqual(['PL'])
    // Sentinel čte workflow (sed) a lepí ho do commit message — tvar se
    // nesmí měnit bez úpravy .github/workflows/data01-overpass.yml.
    expect(v.sentinel).toBe('NEUPLNY_BEH: PL')
    expect(v.zprava).toContain('NEÚPLNÝ BĚH')
  })

  it('neselhala-li ani jedna, ale žádná neprošla → není co zapsat', () => {
    const v = verdiktBehu([{ iso: 'CZ', ok: false, chyba: 'HTTP 504' }])
    expect(v.zapsat).toBe(false)
    expect(v.sentinel).toBeNull()
    expect(v.zprava).toContain('ani jedna')
  })

  it('běh bez zemí (nic se nedotazovalo) se nepovažuje za úspěch', () => {
    expect(verdiktBehu([]).zapsat).toBe(false)
  })

  it('víc selhaných zemí se do sentinelu vypíše všech', () => {
    const v = verdiktBehu([
      { iso: 'CZ', ok: true },
      { iso: 'PL', ok: false },
      { iso: 'SK', ok: false },
    ])
    expect(v.sentinel).toBe('NEUPLNY_BEH: PL,SK')
  })
})

/**
 * DATA-36 — pojistka proti dvojímu založení kandidáta v překrývajících se
 * oknech. Vznikla 8. 8. 2026 z doloženého následku: dva kliky na DATA-01 pro
 * sousední oblasti (beskydy, javorniky-vsetinske-vrchy) vyrobily 29 kandidátů
 * se shodným jménem i souřadnicemi ve dvou adresářích, protože export
 * o kandidátech jiných oblastí nic nevěděl. Ruční rozhodnutí takových
 * duplicit nestačí — při dalším běhu se vrátí.
 *
 * Pravidlo je „PRVNÍ EXPORT VYHRÁVÁ": objekt už vedený jinou oblastí se
 * znovu nezakládá, jen se vypíše do reportu. Překryv oken zůstává záměrný,
 * protože ostrý řez na hranici dvou pohoří tiše vyřízne objekty na sedle
 * mezi nimi.
 */
describe('DATA-36: objekt vedený jinou oblastí se nezakládá znovu', () => {
  const OBJEKT: OsmElement = {
    type: 'node',
    id: 4242424242,
    lat: 49.4,
    lon: 18.3,
    tags: { name: 'Chata Na Rozvodí', tourism: 'alpine_hut' },
  }
  const URL_OBJEKTU = 'https://www.openstreetmap.org/node/4242424242'

  const priprav = () => {
    const koren = mkdtempSync(join(tmpdir(), 'data36-'))
    const kand = join(koren, 'kandidati', 'beskydy')
    const rucni = join(koren, 'chaty', 'beskydy')
    mkdirSync(kand, { recursive: true })
    mkdirSync(rucni, { recursive: true })
    return { koren, kand, rucni }
  }

  it('bez indexu se kandidát založí (kontrolní běh — jinak test nic nehlídá)', () => {
    const { kand, rucni } = priprav()
    const report = zapisKandidaty(
      [{ el: OBJEKT, zeme: 'cz', checked: '2026-08-08' }],
      kand,
      rucni,
      new Map(),
      'beskydy',
    )
    expect(report.zapsano.map((z) => z.slug)).toEqual(['chata-na-rozvodi'])
    expect(report.jinaOblast).toEqual([])
    expect(existsSync(join(kand, 'chata-na-rozvodi.yaml'))).toBe(true)
  })

  it('s indexem se NEzaloží a objekt se vypíše do reportu s cílem', () => {
    const { kand, rucni } = priprav()
    const report = zapisKandidaty(
      [{ el: OBJEKT, zeme: 'cz', checked: '2026-08-08' }],
      kand,
      rucni,
      new Map(),
      'beskydy',
      new Map([[URL_OBJEKTU, 'javorniky-vsetinske-vrchy/chata-na-rozvodi']]),
    )
    expect(report.zapsano).toEqual([])
    expect(report.jinaOblast).toEqual([
      { url: URL_OBJEKTU, kde: 'javorniky-vsetinske-vrchy/chata-na-rozvodi' },
    ])
    // Klíčové: soubor NEVZNIKL, takže se duplicita při dalším běhu nevrátí.
    expect(existsSync(join(kand, 'chata-na-rozvodi.yaml'))).toBe(false)
  })

  it('index čte identitu z OSM URL, ne ze slugu ani ze jména', () => {
    // Jména jako „Chata", „Hájenka" nebo „Skalka" se v korpusu opakují a slug
    // může nést suffix `-<id>`; jediný stabilní rozlišovač je URL objektu.
    const koren = mkdtempSync(join(tmpdir(), 'data36-index-'))
    const jina = join(koren, 'kandidati', 'javorniky-vsetinske-vrchy')
    mkdirSync(jina, { recursive: true })
    writeFileSync(
      join(jina, 'uplne-jiny-slug.yaml'),
      ['nazev: Chata', 'overeniLokace:', `  source: OpenStreetMap ${URL_OBJEKTU} — ODbL`].join(
        '\n',
      ),
      'utf8',
    )
    const index = indexJinychOblasti([join(koren, 'kandidati')], 'beskydy')
    expect(index.get(URL_OBJEKTU)).toBe('javorniky-vsetinske-vrchy/uplne-jiny-slug')
    // Vlastní oblast se do indexu nepočítá — jinak by si běh zablokoval sám sebe.
    expect(indexJinychOblasti([join(koren, 'kandidati')], 'javorniky-vsetinske-vrchy').size).toBe(0)
  })

  it('soubory začínající podtržítkem index ignoruje (exporty a registry)', () => {
    const koren = mkdtempSync(join(tmpdir(), 'data36-podtrzitko-'))
    const jina = join(koren, 'kandidati', 'sumava')
    mkdirSync(jina, { recursive: true })
    writeFileSync(join(jina, '_overpass-export-cz.yaml'), `x: ${URL_OBJEKTU}`, 'utf8')
    expect(indexJinychOblasti([join(koren, 'kandidati')], 'beskydy').size).toBe(0)
  })
})

describe('DATA-38: druhá OSM entita objektu vedeného jinou oblastí', () => {
  // Přesně případ Čartáku z 8. 8. 2026: jiná oblast vede objekt pod JINOU
  // OSM entitou (jiné URL), takže síto DATA-36 mlčí — rozhodnout musí
  // shoda jádra názvu + poloha do prahu DVOJI_ENTITA_M.
  const UZEL: OsmElement = {
    type: 'node',
    id: 291203956,
    lat: 49.352,
    lon: 18.256,
    tags: { name: 'Horský hotel Čarták', tourism: 'hotel' },
  }

  const priprav = (lat: number, lng: number, nazev = 'Horský hotel Čarták') => {
    const koren = mkdtempSync(join(tmpdir(), 'data38-'))
    const kand = join(koren, 'kandidati', 'beskydy')
    const rucni = join(koren, 'chaty', 'beskydy')
    const jina = join(koren, 'kandidati', 'javorniky-vsetinske-vrchy')
    mkdirSync(kand, { recursive: true })
    mkdirSync(rucni, { recursive: true })
    mkdirSync(jina, { recursive: true })
    writeFileSync(
      join(jina, 'horsky-hotel-cartak.yaml'),
      [
        `nazev: ${nazev}`,
        `lat: ${lat}`,
        `lng: ${lng}`,
        'overeniLokace:',
        '  source: OpenStreetMap https://www.openstreetmap.org/node/3814562072 — ODbL',
      ].join('\n'),
      'utf8',
    )
    const polohy = indexPolohJinychOblasti([join(koren, 'kandidati')], 'beskydy')
    return { kand, rucni, polohy }
  }

  it('shodné jádro názvu 9 m od záznamu jiné oblasti se NEzaloží a vypíše', () => {
    // 9 m ≈ posun o ~0,00008° zeměpisné šířky.
    const { kand, rucni, polohy } = priprav(49.35208, 18.256)
    const report = zapisKandidaty(
      [{ el: UZEL, zeme: 'cz', checked: '2026-08-10' }],
      kand,
      rucni,
      new Map(),
      'beskydy',
      new Map(),
      polohy,
    )
    expect(report.zapsano).toEqual([])
    expect(report.dvojiEntita).toHaveLength(1)
    expect(report.dvojiEntita[0].kde).toBe('javorniky-vsetinske-vrchy/horsky-hotel-cartak')
    expect(report.dvojiEntita[0].vzdalenostM).toBeLessThanOrEqual(DVOJI_ENTITA_M)
    // Soubor NEVZNIKL — jinak by se dvojí entita vrátila s každým během.
    expect(existsSync(join(kand, 'horsky-hotel-cartak.yaml'))).toBe(false)
  })

  it('shodné jméno 150 m daleko PROJDE — to už může být sousední objekt', () => {
    // Práh je 50 m schválně: 150 m dělí i sousední chatu Gírové a rozhodnout
    // tam musí redakce (kandidát vznikne a odhalí ho kontrola kolizí jmen).
    const { kand, rucni, polohy } = priprav(49.35335, 18.256)
    const report = zapisKandidaty(
      [{ el: UZEL, zeme: 'cz', checked: '2026-08-10' }],
      kand,
      rucni,
      new Map(),
      'beskydy',
      new Map(),
      polohy,
    )
    expect(report.dvojiEntita).toEqual([])
    expect(report.zapsano.map((z) => z.slug)).toEqual(['horsky-hotel-cartak'])
  })

  it('jiné jádro názvu 9 m vedle PROJDE — dva objekty na témž kopci jsou legitimní', () => {
    const { kand, rucni, polohy } = priprav(49.35208, 18.256, 'Vyhlídka Sokolí')
    const report = zapisKandidaty(
      [{ el: UZEL, zeme: 'cz', checked: '2026-08-10' }],
      kand,
      rucni,
      new Map(),
      'beskydy',
      new Map(),
      polohy,
    )
    expect(report.dvojiEntita).toEqual([])
    expect(report.zapsano).toHaveLength(1)
  })

  it('záznam bez GPS nebo beze jména se do indexu poloh nedostane', () => {
    const koren = mkdtempSync(join(tmpdir(), 'data38-index-'))
    const jina = join(koren, 'kandidati', 'sumava')
    mkdirSync(jina, { recursive: true })
    writeFileSync(join(jina, 'bez-gps.yaml'), 'nazev: Chata Bez GPS\n', 'utf8')
    writeFileSync(join(jina, 'bez-jmena.yaml'), 'lat: 49.1\nlng: 13.2\n', 'utf8')
    writeFileSync(join(jina, '_registr.yaml'), 'nazev: Registr\nlat: 49.1\nlng: 13.2\n', 'utf8')
    expect(indexPolohJinychOblasti([join(koren, 'kandidati')], 'beskydy')).toEqual([])
  })
})
