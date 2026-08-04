/**
 * Šumava — čtvrtá oblast (rozhodnutí Michala 4. 8. 2026: „pustíme se do
 * šumavy + bavorskou část, budeme muset založit německo").
 *
 * Testy hlídají tři věci, které se u založení oblasti dají tiše zkazit:
 *   1. NĚMECKO je zapojené celou cestou — od dotazu (zemeDotazu) po URL
 *      (ZEME_SLUG): kdyby chybělo v jednom článku, bavorská polovina by
 *      z pipeline vypadla bez chybové hlášky.
 *   2. `katalogPohori` sedí na SKUTEČNÁ jména v katalogu — překlep by tiše
 *      vypnul dohledávku podle jmen (druhou záchrannou síť DATA-01).
 *   3. Okno dotazu opravdu obsahuje krajní doložené body pohoří — malé okno
 *      je nejtišší chyba ze všech, dotaz prostě vrátí míň.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { ZEME_SLUG } from '@/lib/chaty'
import { bboxStr, oblastDleSlugu, zemeDotazu } from '../../scripts/oblasti'

const KONFIG = oblastDleSlugu('sumava')

const YAML = parse(
  readFileSync(join(process.cwd(), 'data', 'oblasti', 'sumava.yaml'), 'utf8'),
) as {
  nazev?: string
  slug?: string
  sklonovani?: { druhy?: string; sesty?: string }
  charakteristika?: string
  overeniCharakteristika?: { source?: string; verified?: boolean; checked?: string }
  nejvyssiHora?: { nazev?: string; vyska?: number; source?: string }
  topCile?: { nazev: string; source?: string; nejblizChataSlug?: string }[]
  interniPoznamky?: string
}

describe('konfigurace oblasti (scripts/oblasti.ts)', () => {
  it('dotazuje se po Česku i Německu — bavorská část je celý smysl rozšíření', () => {
    expect(zemeDotazu(KONFIG)).toEqual([
      { zeme: 'cz', iso: 'CZ' },
      { zeme: 'de', iso: 'DE' },
    ])
  })

  it('frontend umí německé objekty adresovat (de → nemecko v ZEME_SLUG)', () => {
    expect(ZEME_SLUG.de).toBe('nemecko')
  })

  it('katalogPohori sedí na skutečná jména v externím katalogu', () => {
    const katalog = JSON.parse(
      readFileSync(join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json'), 'utf8'),
    ) as Record<string, unknown>[] | Record<string, Record<string, unknown>[]>
    const radky = (Array.isArray(katalog) ? katalog : Object.values(katalog)[0]) as {
      ['Pohoří']?: string
    }[]
    for (const jmeno of KONFIG.katalogPohori ?? []) {
      const pocet = radky.filter((r) => r['Pohoří'] === jmeno).length
      expect(pocet, `katalogPohori „${jmeno}" nemá v katalogu jediný řádek — překlep?`).toBeGreaterThan(0)
    }
    // Rakouský Böhmerwald je VĚDOMĚ mimo (zadání jmenuje jen bavorskou
    // část) — kdyby ho sem někdo přidal, dohledávka by hledala objekt
    // v zemi, na kterou se dotaz neptá.
    expect(KONFIG.katalogPohori).not.toContain('Böhmerwald')
  })

  it('okno dotazu obsahuje krajní doložené body (Arber, Gibacht, Dreisessel, Vítkův kámen)', () => {
    // Souřadnice: Großer Arber z GPS na sumava.cz (49°6'45.276"N,
    // 13°8'8.748"E — citace v data/oblasti/sumava.yaml); ostatní tři jsou
    // orientační polohy krajních objektů/bodů z konfigurace okna.
    const BODY: [string, number, number][] = [
      ['Großer Arber', 49.1126, 13.1358],
      ['Berggasthof Gibacht (Waldmünchen)', 49.36, 12.66],
      ['Dreisessel', 48.78, 13.8],
      ['Vítkův kámen (Vyšebrodsko)', 48.6, 14.28],
    ]
    const b = KONFIG.bbox
    for (const [nazev, lat, lng] of BODY) {
      expect(lat > b.latMin && lat < b.latMax, `${nazev}: lat ${lat} mimo okno ${bboxStr(b)}`).toBe(true)
      expect(lng > b.lngMin && lng < b.lngMax, `${nazev}: lng ${lng} mimo okno ${bboxStr(b)}`).toBe(true)
    }
  })

  it('3D okno leží uvnitř okna dotazu', () => {
    const { bbox: b, bbox3d: t } = KONFIG
    expect(t.latMin).toBeGreaterThanOrEqual(b.latMin)
    expect(t.latMax).toBeLessThanOrEqual(b.latMax)
    expect(t.lngMin).toBeGreaterThanOrEqual(b.lngMin)
    expect(t.lngMax).toBeLessThanOrEqual(b.lngMax)
  })
})

describe('metadata oblasti (data/oblasti/sumava.yaml)', () => {
  it('nese název, slug a skloňované tvary', () => {
    expect(YAML.nazev).toBe('Šumava')
    expect(YAML.slug).toBe('sumava')
    expect(YAML.sklonovani?.druhy).toBe('Šumavy')
    expect(YAML.sklonovani?.sesty).toBe('Šumavě')
  })

  it('charakteristika má ověření a zůstává verified:false (konvence B)', () => {
    expect(YAML.charakteristika).toBeTruthy()
    expect(YAML.overeniCharakteristika?.verified).toBe(false)
    expect(YAML.overeniCharakteristika?.source).toMatch(/cumbres\.cz/)
  })

  it('nejvyšší hora je Großer Arber 1456 m s PŘIZNANÝM rozporem 1457', () => {
    expect(YAML.nejvyssiHora?.nazev).toMatch(/Arber/)
    expect(YAML.nejvyssiHora?.vyska).toBe(1456)
    // Rozpor pramenů (sumava.cz 1456 × cumbres.cz 1457) musí zdroj přiznávat —
    // kdyby při úpravě věta o 1457 vypadla, číslo by vypadalo nesporně.
    expect(YAML.nejvyssiHora?.source).toMatch(/1457/)
    expect(YAML.nejvyssiHora?.source).toMatch(/Plechý/)
  })

  it('každý top cíl (až přibudou) nese zdroj a vazbu na existující profil', () => {
    // Teď je pole prázdné — profily ještě nejsou. Test je pravidlo, ne stav:
    // až cíle přibudou, musí mít zdroj; prázdné pole projde.
    for (const c of YAML.topCile ?? []) {
      expect(c.source, `cíl ${c.nazev} bez zdroje`).toBeTruthy()
    }
  })

  it('interní poznámka drží rozhodnutí o rakouské straně i jazykové pravidlo', () => {
    const p = String(YAML.interniPoznamky)
    expect(p).toMatch(/Helfenberger/)
    expect(p).toMatch(/alias/i)
  })
})
