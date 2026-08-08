/**
 * Beskydy, Jeseníky a Javorníky s Vsetínskými vrchy — pátá, šestá a sedmá
 * oblast (pověření Michala 8. 8. 2026: „můžeš se pustit do beskyd
 * a jeseníku"; sedmá pak jeho rozhodnutí téhož dne: „javorniky a vsetinske
 * vrchy bych udelal jako jednu samostatnou oblast").
 *
 * Testy hlídají čtyři věci, které se u založení oblasti dají tiše zkazit —
 * tiše proto, že se neprojeví chybou, ale MENŠÍM VÝSLEDKEM:
 *   1. Okno dotazu obsahuje krajní doložené body pohoří. Malé okno je
 *      nejtišší chyba ze všech: Overpass prostě vrátí míň a nikdo neví, že
 *      něco chybí. Jizerská jižní hrana se kvůli tomu posouvala třikrát.
 *   2. `katalogPohori` sedí na SKUTEČNÁ jména v externím katalogu. Překlep
 *      by vypnul dohledávku podle jmen, tedy druhou záchrannou síť DATA-01,
 *      a to úplně beze slova.
 *   3. Slovensko je zapojené celou cestou — od dotazu (`zemeDotazu`) po URL
 *      (`ZEME_SLUG`). Kdyby chybělo v jednom článku, slovenská část oblasti
 *      by z pipeline vypadla bez hlášky. Totéž Polsko u Jeseníků.
 *   4. Rozhodnutí o rozsahu zůstávají v datech zapsaná — jak ta hotová
 *      (rozdělení Beskyd a Javorníků), tak ta otevřená (Góry Bystrzyckie).
 *      Hotové proto, aby je nikdo nevrátil naslepo; otevřené proto, že
 *      rozsah, který vypadá hotově, je horší než přiznaná otázka.
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
  ],
  // Vsacký Cáb a Kohútka z tohohle seznamu 8. 8. 2026 ODEŠLY do vlastní
  // oblasti — Michalovo rozhodnutí. Kdyby se sem někdy vrátily, vrátí se
  // s nimi i jižní a západní hrana beskydského okna.
  'javorniky-vsetinske-vrchy': [
    { nazev: 'Velký Javorník (SK strana hřebene)', lat: 49.319, lng: 18.373 },
    { nazev: 'Kohútka', lat: 49.295, lng: 18.23 },
    { nazev: 'Portáš', lat: 49.2945, lng: 18.2328 },
    { nazev: 'Vysoká (severní kotva, nejvyšší vrchol Vsetínských vrchů)', lat: 49.404, lng: 18.362 },
    { nazev: 'Soláň', lat: 49.394, lng: 18.25 },
    { nazev: 'Vsacký Cáb', lat: 49.375, lng: 18.096 },
    { nazev: 'Chata Kusalíno', lat: 49.3332, lng: 18.061 },
    { nazev: 'Vsetín (západní kotva)', lat: 49.3386, lng: 17.9961 },
    { nazev: 'Kmínek (východní kotva, SK)', lat: 49.385, lng: 18.448 },
    { nazev: 'Makov (SK)', lat: 49.3564, lng: 18.4336 },
    { nazev: 'Střelná (jižní kotva)', lat: 49.1772, lng: 18.0978 },
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
  ['javorniky-vsetinske-vrchy', 'Javorníky a Vsetínské vrchy'],
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

describe('rozhodnutí o rozsahu — hotová i otevřená', () => {
  /**
   * ROZHODNUTO 8. 8. 2026 (Michal: „javorniky a vsetinske vrchy bych udelal
   * jako jednu samostatnou oblast"). Ráno téhož dne to byla otevřená otázka
   * a Javorníky se Vsetínskými vrchy byly v beskydském okně; test to tehdy
   * hlídal opačně. Dnes hlídá, že se rozdělení nevrátí zpátky omylem.
   */
  it('Javorníky a Vsetínské vrchy se z Beskyd přesunuly do vlastní oblasti', () => {
    const beskydy = oblastDleSlugu('beskydy')
    expect(beskydy.katalogPohori).not.toContain('Javorníky')
    expect(beskydy.katalogPohori).not.toContain('Vsetínské vrchy')
    const nova = oblastDleSlugu('javorniky-vsetinske-vrchy')
    expect(nova.katalogPohori).toEqual(['Javorníky', 'Vsetínské vrchy'])
    // Poznámka Beskyd musí rozhodnutí držet, aby ho nikdo nevrátil naslepo.
    expect(String(nactiYaml('beskydy').interniPoznamky)).toMatch(/samostatnou oblast/)
  })

  it('okna Beskyd a nové oblasti se v hraničním pásu ZÁMĚRNĚ překrývají', () => {
    // Ostrý řez na hranici dvou pohoří tiše vyřízne objekty na sedle mezi
    // nimi — vzor překryvu Krkonoš a Jizerek u Jizerky a Harrachova. Kdyby
    // někdo okna „uklidil" tak, aby na sebe jen navazovala, tenhle test
    // spadne a vysvětlí proč.
    const b = oblastDleSlugu('beskydy').bbox
    const j = oblastDleSlugu('javorniky-vsetinske-vrchy').bbox
    const prekryvLat = Math.min(b.latMax, j.latMax) - Math.max(b.latMin, j.latMin)
    const prekryvLng = Math.min(b.lngMax, j.lngMax) - Math.max(b.lngMin, j.lngMin)
    expect(prekryvLat, 'okna se v šířce nepřekrývají').toBeGreaterThan(0)
    expect(prekryvLng, 'okna se v délce nepřekrývají').toBeGreaterThan(0)
  })

  it('nová oblast je přeshraniční se Slovenskem a Vsetín je vevnitř okna', () => {
    const konfig = oblastDleSlugu('javorniky-vsetinske-vrchy')
    expect(zemeDotazu(konfig).map((z) => z.iso)).toEqual(expect.arrayContaining(['CZ', 'SK']))
    // Město je v okně schválně: hřeben se zvedá přímo nad ním a chodí se
    // odtud na Vsacký Cáb i Kusalíno (vzor okraje Liberce u Ještědu).
    const b = konfig.bbox
    expect(49.3386 >= b.latMin && 49.3386 <= b.latMax).toBe(true)
    expect(17.9961 >= b.lngMin && 17.9961 <= b.lngMax).toBe(true)
  })

  it('nová oblast varuje před třemi záměnami, které u ní hrozí', () => {
    // Dva Velké Javorníky (1071 m na hranici × 918 m u Frenštátu), Malý
    // Javorník jako nejvyšší bod ČESKÉ části a Vysoká místo Ptáčnice jako
    // nejvyšší vrchol Vsetínských vrchů. Všechno jsou to pasti, do kterých
    // se dá spadnout při povyšování — musí zůstat zapsané.
    const src = String(nactiYaml('javorniky-vsetinske-vrchy').nejvyssiHora?.source)
    expect(src).toMatch(/Frenštát/)
    expect(src).toMatch(/Malý Javorník/)
    expect(src).toMatch(/Vysoká/)
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
