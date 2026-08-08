/**
 * Kontrola surových Overpass exportů (`scripts/kontrola/exporty.ts`).
 *
 * Vznikla z konkrétní škody 8. 8. 2026: beskydský `_overpass-dle-jmen-cz.json`
 * nesl `remark: runtime error: Query timed out … after 183 seconds` a nula
 * elementů. Overpass hlásí běhovou chybu jako HTTP 200, takže se soubor uložil
 * jako platný doklad a dohledávka podle jmen z katalogu tiše neudělala nic —
 * proto v kandidátech chyběly Libušín a Chata na Radhošti, tedy PŘESNĚ ty
 * objekty, kvůli kterým ta záchranná síť existuje.
 *
 * Testy drží tři věci: že se ten konkrétní tvar odpovědi pozná, že se
 * nechybový `remark` nehlásí (jinak by kontrola začala plašit) a že se
 * kontrola dívá na skutečné exporty v repu, ne jen na svoje vzorky.
 */
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { najdiExporty, zkontrolujExport } from '../../scripts/kontrola/exporty'

const odpoved = (telo: Record<string, unknown>) => JSON.stringify(telo)

describe('zkontrolujExport', () => {
  it('pozná běhovou chybu v `remark` — přesný tvar z beskydského běhu', () => {
    const v = zkontrolujExport(
      '_overpass-dle-jmen-cz.json',
      odpoved({
        version: 0.6,
        generator: 'Overpass API 0.7.62.11 87bfad18',
        osm3s: { timestamp_osm_base: '2026-05-31T22:37:44Z' },
        elements: [],
        remark: 'runtime error: Query timed out in "query" at line 5 after 183 seconds.',
      }),
    )
    expect(v).not.toBeNull()
    expect(v?.druh).toBe('remark')
    expect(v?.elementu).toBe(0)
    // Stav OSM dat se hlásí schválně: u toho souboru byl 31. 5., kdežto
    // u ostatních zemí téhož běhu 8. 8. — samo o sobě to prozrazuje, že
    // odpověď přišla z jiné (zaostalé) instance.
    expect(v?.stavOsm).toBe('2026-05-31')
  })

  it('chybu hlásí i u částečného výsledku, kde nějaké elementy přišly', () => {
    // Částečný export je horší než žádný: vypadá jako úspěch a rozdíl proti
    // minulému běhu se projeví jako „objekty zmizely".
    const v = zkontrolujExport(
      'x.json',
      odpoved({
        osm3s: { timestamp_osm_base: '2026-08-08T00:00:00Z' },
        elements: [{ type: 'node', id: 1 }],
        remark: 'runtime error: Query run out of memory in "recurse" at line 7.',
      }),
    )
    expect(v?.druh).toBe('remark')
    expect(v?.elementu).toBe(1)
  })

  it('nechybový `remark` a prázdný výsledek se nehlásí', () => {
    // Prázdný výsledek JE u dohledávky legitimní: v druhé zemi nemusí být
    // z katalogu nic. Kontrola rozlišuje „nenašlo se" od „neptal jsem se".
    expect(
      zkontrolujExport(
        'x.json',
        odpoved({
          osm3s: { timestamp_osm_base: '2026-08-08T00:00:00Z' },
          elements: [],
          remark: 'Query returned an empty result set.',
        }),
      ),
    ).toBeNull()
    expect(
      zkontrolujExport(
        'x.json',
        odpoved({ osm3s: { timestamp_osm_base: '2026-08-08' }, elements: [] }),
      ),
    ).toBeNull()
  })

  it('rozbitý JSON i chybějící `elements` jsou vada, ne výjimka', () => {
    // Kontrola nesmí spadnout na prvním poškozeném souboru — musí projít
    // všechny a vypsat je.
    expect(zkontrolujExport('x.json', '<html>502 Bad Gateway</html>')?.druh).toBe('json')
    expect(zkontrolujExport('x.json', '{"remark":"ok"}')?.druh).toBe('bez-elements')
  })
})

describe('najdiExporty nad skutečným repem', () => {
  it('najde surové exporty a všechny jsou v pořádku', () => {
    const soubory = najdiExporty()
    // Kdyby jich bylo nula, test by procházel a nekontroloval nic.
    expect(soubory.length).toBeGreaterThan(10)
    const vady = soubory
      .map((s) => zkontrolujExport(s, readFileSync(s, 'utf8')))
      .filter((v) => v !== null)
      .map((v) => `${v!.soubor}: ${v!.zprava}`)
    expect(vady).toEqual([])
  })

  it('bere jen soubory `_overpass*.json`, ne YAML kandidátů ani registry', () => {
    for (const s of najdiExporty()) {
      expect(s).toMatch(/\/_overpass[\w.-]*\.json$/)
    }
  })
})
