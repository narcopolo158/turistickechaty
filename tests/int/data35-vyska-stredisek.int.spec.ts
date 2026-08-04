/**
 * DATA-35: pravidlo pro výšku obce u středisek (zadání Michala 4. 8. 2026 —
 * místo rozpětí nadmořská výška turistického uzlu / rozcestí / náměstí).
 *
 * Testuje se rozhodovací část a tvar zápisu, ne síť: vlastní stažení výšek
 * běží v Actions (sandbox na api.mapy.com nedosáhne). Nejdůležitější je
 * poslední test — že věta, kterou skript vkládá do `overeniLokace.source`,
 * projde hlídacím pravidlem středisek. Kdyby ji někdo přeformuloval a slovo
 * „ČÚZK" z ní vypadlo, workflow by po svém commitu shodilo testy až v CI.
 */
import { describe, expect, it } from 'vitest'
import { parseDocument } from 'yaml'

import { rozhodni, stredRozpeti, vetaOVysce, vlozVyskuZaLng } from '../../scripts/data35-vyska-stredisek'

describe('DATA-35 — koho dopočítat', () => {
  it('středisko s výškou z lidského pramene se NEPŘEPISUJE (vzor Dolní Dvůr 641 m)', () => {
    const r = rozhodni({ vyskaObce: 641, lat: 50.65, lng: 15.65 })
    expect(r.akce).toBe('preskocit')
    expect(r.akce === 'preskocit' && r.duvod).toMatch(/641/)
  })

  it('středisko bez výšky a se souřadnicemi se dopočítá z referenčního bodu', () => {
    const r = rozhodni({ lat: 50.6663343, lng: 15.5481647 })
    expect(r).toEqual({ akce: 'dopocitat', bod: { lat: 50.6663343, lon: 15.5481647 } })
  })

  it('středisko bez souřadnic se přeskočí (nemá se co vzorkovat)', () => {
    expect(rozhodni({}).akce).toBe('preskocit')
    expect(rozhodni({ lat: 50.6 }).akce).toBe('preskocit')
  })
})

describe('DATA-35 — střed rozpětí (poslední možnost dle zadání)', () => {
  it('počítá aritmetický střed a zaokrouhluje na celé metry', () => {
    expect(stredRozpeti(682, 1010)).toBe(846) // Benecko
    expect(stredRozpeti(575, 1555)).toBe(1065) // Špindlerův Mlýn
    expect(stredRozpeti(400, 1036)).toBe(718) // Vrchlabí
  })
})

describe('DATA-35 — zápis do YAML', () => {
  const YAML_STREDISKA = [
    '# komentář hlavičky, který musí přežít',
    'nazev: Benecko',
    'slug: benecko',
    'lat: 50.6663343',
    'lng: 15.5481647',
    'overeniLokace:',
    '  source: OpenStreetMap (bod obce) — ODbL 1.0',
    '  verified: false',
    "  checked: '2026-07-28'",
    'interniPoznamky: poslední klíč souboru',
    '',
  ].join('\n')

  it('vkládá vyskaObce hned za lng, ne na konec souboru', () => {
    const doc = parseDocument(YAML_STREDISKA)
    vlozVyskuZaLng(doc, 812)
    const radky = doc.toString().split('\n')
    expect(radky[radky.findIndex((r) => r.startsWith('lng:')) + 1]).toBe('vyskaObce: 812')
    expect(doc.toString()).toContain('# komentář hlavičky, který musí přežít')
  })

  it('existující hodnotu přepíše na místě (idempotence druhého běhu)', () => {
    const doc = parseDocument(YAML_STREDISKA)
    vlozVyskuZaLng(doc, 812)
    vlozVyskuZaLng(doc, 813)
    expect(doc.toString().match(/vyskaObce:/g)).toHaveLength(1)
    expect(doc.get('vyskaObce')).toBe(813)
  })
})

describe('DATA-35 — věta o výšce projde hlídacím pravidlem středisek', () => {
  const veta = vetaOVysce({ lat: 50.6663343, lon: 15.5481647 }, 812, '2026-08-04', 'uzel OSM place')

  // Tytéž dva výrazy hlídá tests/int/strediska-data.int.spec.ts: výška smí
  // v datech být jen tehdy, když ji zdroj lokace výslovně zmiňuje a zároveň
  // přiznává, že ověření proti ČÚZK je pořád otevřené.
  it('zmiňuje výšku i otevřené ověření ČÚZK', () => {
    expect(veta).toMatch(/[Vv]ýšk/)
    expect(veta).toMatch(/ČÚZK/)
  })

  it('říká nahlas, že jde o model, a nese souřadnice vzorkovaného bodu', () => {
    expect(veta).toMatch(/model/)
    expect(veta).toMatch(/50\.666334/)
    expect(veta).toMatch(/15\.548165/)
    expect(veta).toContain('812 m')
  })
})
