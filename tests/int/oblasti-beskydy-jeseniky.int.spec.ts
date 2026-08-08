/**
 * Beskydy a Jeseníky — pátá a šestá oblast (pověření Michala 8. 8. 2026:
 * „můžeš se pustit do beskyd a jeseníku").
 *
 * Testy hlídají čtyři věci, které se u založení oblasti dají tiše zkazit —
 * tiše proto, že se neprojeví chybou, ale MENŠÍM VÝSLEDKEM:
 *   1. Okno dotazu obsahuje krajní doložené body pohoří. Malé okno je
 *      nejtišší chyba ze všech: Overpass prostě vrátí míň a nikdo neví, že
 *      něco chybí. Jizerská jižní hrana se kvůli tomu posouvala třikrát.
 *   2. `katalogPohori` sedí na SKUTEČNÁ jména v externím katalogu. Překlep
 *      by vypnul dohledávku podle jmen, tedy druhou záchrannou síť DATA-01,
 *      a to úplně beze slova.
 *   3. Slovensko je u Beskyd zapojené celou cestou — od dotazu
 *      (`zemeDotazu`) po URL (`ZEME_SLUG`). Kdyby chybělo v jednom článku,
 *      slovenská část oblasti by z pipeline vypadla bez hlášky. Totéž
 *      Polsko u Jeseníků.
 *   4. Rozhodnutí o rozsahu, která ještě čekají na Michala, zůstávají
 *      v poznámkách zapsaná. Kdyby při úpravě vypadla, vypadal by rozsah
 *      hotově — a to je horší než otevřená otázka.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { ZEME_SLUG } from '@/lib/chaty'
import { bboxStr, oblastDleSlugu, zemeDotazu } from '../../scripts/oblasti'

type OblastYaml = {
  nazev?: string
  slug?: string
  sklonovani?: { druhy?: string; sesty?: string }
  charakteristika?: string
  overeniCharakteristika?: { source?: string; verified?: boolean; checked?: string }
  nejvyssiHora?: { nazev?: string; vyska?: number; source?: string }
  topCile?: { nazev?: string; source?: string }[]
  interniPoznamky?: string
}

const nactiYaml = (slug: string): OblastYaml =>
  parse(readFileSync(join(process.cwd(), 'data', 'oblasti', `${slug}.yaml`), 'utf8')) as OblastYaml

type Katalog = { Pohoří?: string }[]
const KATALOG = JSON.parse(
  readFileSync(
    join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json'),
    'utf8',
  ),
) as Katalog
const POHORI_V_KATALOGU = new Set(KATALOG.map((r) => r['Pohoří']).filter(Boolean) as string[])

/**
 * Body, které okno MUSÍ obsáhnout. Souřadnice jsou z pramenů dohledaných
 * 8. 8. 2026 (PeakVisor, turistika.cz, treking.cz) a jsou zapsané
 * i v komentáři u konfigurace oblasti. Nejsou to publikované údaje —
 * slouží jen jako kotvy okna, přesně jako bbox sám.
 */
const KOTVY: Record<string, { nazev: string; lat: number; lng: number }[]> = {
  beskydy: [
    { nazev: 'Lysá hora', lat: 49.546, lng: 18.448 },
    { nazev: 'Radhošť', lat: 49.492, lng: 18.223 },
    { nazev: 'Barania Góra', lat: 49.612, lng: 19.011 },
    { nazev: 'Skrzyczne', lat: 49.685, lng: 19.03 },
    { nazev: 'Szyndzielnia (severní kotva)', lat: 49.753, lng: 18.999 },
    { nazev: 'Babia Góra', lat: 49.573, lng: 19.53 },
    { nazev: 'Wielka Racza / Veľká Rača', lat: 49.413, lng: 18.968 },
    { nazev: 'Gírová', lat: 49.532, lng: 18.8 },
    { nazev: 'Hala Krupowa (východní kotva)', lat: 49.625, lng: 19.653 },
    { nazev: 'Vsacký Cáb (západní kotva)', lat: 49.386, lng: 18.088 },
    { nazev: 'Kohútka (jižní kotva)', lat: 49.293, lng: 18.229 },
  ],
  jeseniky: [
    { nazev: 'Praděd', lat: 50.083, lng: 17.233 },
    { nazev: 'Šerák', lat: 50.186, lng: 17.107 },
    { nazev: 'sedlo Skřítek (jižní kotva)', lat: 49.99, lng: 17.163 },
    { nazev: 'Králický Sněžník / Śnieżnik (západní kotva)', lat: 50.207, lng: 16.847 },
    { nazev: 'Rejvíz', lat: 50.224, lng: 17.313 },
    { nazev: 'Biskupská kupa (východní kotva)', lat: 50.256, lng: 17.43 },
    { nazev: 'chata Paprsek', lat: 50.21, lng: 16.991 },
  ],
}

describe.each([
  ['beskydy', 'Beskydy'],
  ['jeseniky', 'Jeseníky'],
])('oblast %s', (slug, nazev) => {
  const konfig = oblastDleSlugu(slug)
  const yaml = nactiYaml(slug)

  it('konfigurace a YAML se shodují na jménu i slugu', () => {
    expect(konfig.nazev).toBe(nazev)
    expect(yaml.nazev).toBe(nazev)
    expect(yaml.slug).toBe(slug)
  })

  it('má skloňované tvary — čeština je algoritmem neskloní', () => {
    expect(yaml.sklonovani?.druhy).toBeTruthy()
    expect(yaml.sklonovani?.sesty).toBeTruthy()
  })

  it('charakteristika má ověření a zůstává verified:false (konvence B)', () => {
    expect(yaml.charakteristika).toBeTruthy()
    expect(yaml.overeniCharakteristika?.source).toBeTruthy()
    expect(yaml.overeniCharakteristika?.verified).toBe(false)
    expect(yaml.overeniCharakteristika?.checked).toBe('2026-08-08')
  })

  it('nejvyšší hora nese výšku i zdroj', () => {
    expect(yaml.nejvyssiHora?.nazev).toBeTruthy()
    expect(yaml.nejvyssiHora?.vyska).toBeGreaterThan(0)
    expect(yaml.nejvyssiHora?.source).toBeTruthy()
  })

  it('každý top cíl (až přibudou) nese zdroj', () => {
    for (const c of yaml.topCile ?? []) {
      expect(c.source, `cíl ${c.nazev} bez zdroje`).toBeTruthy()
    }
  })

  it('okno dotazu obsahuje všechny doložené kotvy pohoří', () => {
    const b = konfig.bbox
    const venku = KOTVY[slug].filter(
      (k) => k.lat < b.latMin || k.lat > b.latMax || k.lng < b.lngMin || k.lng > b.lngMax,
    )
    expect(
      venku.map((k) => k.nazev),
      `okno ${bboxStr(b)} nechává venku kotvy — dotaz by je tiše minul`,
    ).toEqual([])
  })

  it('3D okno leží uvnitř okna dotazu', () => {
    const { bbox: b, bbox3d: t } = konfig
    expect(t.latMin).toBeGreaterThanOrEqual(b.latMin)
    expect(t.lngMin).toBeGreaterThanOrEqual(b.lngMin)
    expect(t.latMax).toBeLessThanOrEqual(b.latMax)
    expect(t.lngMax).toBeLessThanOrEqual(b.lngMax)
  })

  it('každý katalogový název pohoří v katalogu opravdu existuje', () => {
    const chybne = (konfig.katalogPohori ?? []).filter((p) => !POHORI_V_KATALOGU.has(p))
    expect(
      chybne,
      'název nesedí na katalog — dohledávka podle jmen by se tiše vypnula',
    ).toEqual([])
  })

  it('každá země dotazu má slug pro URL', () => {
    for (const { zeme } of zemeDotazu(konfig)) {
      expect(ZEME_SLUG[zeme], `země ${zeme} nemá slug — profily by neměly URL`).toBeTruthy()
    }
  })

  it('poznámka jmenuje další krok, kterým je Michalův klik na DATA-01', () => {
    const p = String(yaml.interniPoznamky)
    expect(p).toMatch(/DATA-01/)
    expect(p).toMatch(/klik/i)
  })
})

describe('rozhodnutí o rozsahu, která ještě čekají na Michala', () => {
  it('Beskydy: okno bere Javorníky a Vsetínské vrchy, ale poznámka to vede jako otevřenou otázku', () => {
    const konfig = oblastDleSlugu('beskydy')
    // Objekty s doloženým stravováním v obou jednotkách by užší okno tiše
    // vyřízlo — proto jsou v katalogPohori.
    expect(konfig.katalogPohori).toContain('Javorníky')
    expect(konfig.katalogPohori).toContain('Vsetínské vrchy')
    const p = String(nactiYaml('beskydy').interniPoznamky)
    expect(p).toMatch(/Javorníky/)
    expect(p).toMatch(/NEROZHODNUTO|rozhodnutí o rozsahu|nerozhodne/i)
  })

  it('Beskydy jsou přeshraniční přes tři země — Slovensko musí být v dotazu', () => {
    const iso = zemeDotazu(oblastDleSlugu('beskydy')).map((z) => z.iso)
    expect(iso).toEqual(expect.arrayContaining(['CZ', 'PL', 'SK']))
  })

  it('Jeseníky: Góry Bystrzyckie jsou vědomě mimo okno a je to zapsané', () => {
    const konfig = oblastDleSlugu('jeseniky')
    expect(konfig.katalogPohori).not.toContain('Góry Bystrzyckie')
    // Katalog tu jednotku vede — kdyby ne, test by hlídal neexistující riziko.
    expect(POHORI_V_KATALOGU.has('Góry Bystrzyckie')).toBe(true)
    // Bez ohledu na velikost písmen: poznámka jednotku někdy jmenuje verzálkami
    // („polské GÓRY BYSTRZYCKIE"), a to je pořád platný zápis rozhodnutí.
    const p = String(nactiYaml('jeseniky').interniPoznamky)
    expect(p).toMatch(/Bystrzyckie/i)
  })

  it('Jeseníky: poznámka drží opravu mé chyby v zadání (Sněžník × Śnieżnik je jeden vrchol)', () => {
    // Zadání rešerše tvrdilo, že jsou to dva různé vrcholy. Prameny to
    // vyvrátily. Kdyby ta poznámka z YAMLu vypadla, chyba by se mohla vrátit
    // do dat při dalším rozšiřování oblasti.
    const p = String(nactiYaml('jeseniky').interniPoznamky)
    expect(p).toMatch(/JEDEN vrchol/)
  })
})
