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
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  najdiExporty,
  zkontrolujExport,
  zkontrolujKotvuJmen,
  zkontrolujSirkuDotazu,
  zkontrolujVrstvy,
} from '../../scripts/kontrola/exporty'

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

describe('zkontrolujSirkuDotazu — export ze staré, užší verze dotazu', () => {
  const hut = (name: string) => ({ type: 'node', id: 1, tags: { tourism: 'alpine_hut', name } })
  const civil = (name: string) => ({ type: 'node', id: 2, tags: { tourism: 'hotel', name } })

  it('samé hutové tagy v hlavním exportu = podpis staré verze dotazu', () => {
    const u = zkontrolujSirkuDotazu(
      'data/kandidati/krkonose/_overpass-export-cz.json',
      odpoved({ elements: [hut('Luční bouda'), hut('Vosecká bouda')] }),
    )
    expect(u?.druh).toBe('uzky-dotaz')
    expect(u?.elementu).toBe(2)
    expect(u?.civilnich).toBe(0)
  })

  it('jediný civilně tagovaný objekt stačí — dotaz si o ně říká, tedy je to nová verze', () => {
    // Přesně tenhle tvar mají Jizerky: Prezidentská chata je v OSM restaurace.
    expect(
      zkontrolujSirkuDotazu(
        'data/kandidati/jizerske-hory/_overpass-export-cz.json',
        odpoved({ elements: [hut('Smědava'), civil('Prezidentská chata')] }),
      ),
    ).toBeNull()
  })

  it('hlídá jen hlavní export — dohledávka podle jmen a rozhledny mají vlastní dotaz', () => {
    const telo = odpoved({ elements: [hut('cokoli')] })
    expect(zkontrolujSirkuDotazu('data/kandidati/x/_overpass-dle-jmen-cz.json', telo)).toBeNull()
    expect(zkontrolujSirkuDotazu('data/kandidati/x/_overpass-rozhledny-cz.json', telo)).toBeNull()
  })

  it('prázdný ani rozbitý export se jako úzký dotaz nehlásí — to je práce jiné kontroly', () => {
    expect(
      zkontrolujSirkuDotazu('x/_overpass-export-cz.json', odpoved({ elements: [] })),
    ).toBeNull()
    expect(zkontrolujSirkuDotazu('x/_overpass-export-cz.json', '<html>502</html>')).toBeNull()
  })

  it('nad skutečným repem už nesedne na nic — a je to doložený obrat', () => {
    // Do 22. 8. 2026 tenhle test tvrdil opak: sedne PRÁVĚ na dva krkonošské
    // soubory (78 objektů, 0 civilně tagovaných), protože pilotní oblast
    // běžela naposledy před commitem 34cebbb. Michal ten den DATA-01 nad
    // Krkonošemi pustil, export přinesl 173 nových kandidátů a podpis staré
    // verze dotazu z repa zmizel.
    //
    // Kontrola tím ale NEPOZBYLA smysl a nesmaže se: platí na každou oblast,
    // která se pustí příště, a stará verze dotazu se v repu může objevit
    // znovu (obnovený starý export, nová oblast puštěná ze zastaralé větve).
    // Test proto od 22. 8. hlídá ČISTÝ stav — že podpis nikde není. Pozitivní
    // cestu drží vzorky výš, ne skutečná data; ta se mají hýbat.
    const zasahy = najdiExporty()
      .map((s) => zkontrolujSirkuDotazu(s, readFileSync(s, 'utf8')))
      .filter((u) => u !== null)
      .map((u) => u!.soubor.replace(`${process.cwd()}/`, ''))
    expect(zasahy).toEqual([])
  })
})

describe('zkontrolujVrstvy — vrstva dotazu, která vůbec neproběhla', () => {
  const KATALOG = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')

  it('nad skutečným repem už nechybí žádná vrstva — tichá mezera je zavřená', () => {
    // Nález 20. 8. 2026: pilotní oblast neměla ani jeden `_overpass-dle-jmen-*`,
    // ačkoli má neprázdné `katalogPohori` a všechny ostatní oblasti ten soubor
    // mají. Kontrola z 21. 8. to změřila, 22. 8. Michal DATA-01 nad Krkonošemi
    // pustil a obě vrstvy (988 a 187 řádků) se do repa doplnily.
    //
    // Test proto od 22. 8. hlídá čistý stav. Chybějící vrstva je tiché
    // nedoběhnutí běhu, takže nula je tu skutečně cílový stav — na rozdíl od
    // `nespustena`, kde nula znamená jen „fronta je prázdná" a ta se plní
    // každou nově založenou oblastí.
    const tiche = zkontrolujVrstvy()
      .filter((c) => c.druh === 'chybi-vrstva')
      .map((c) => c.soubor)
    expect(tiche).toEqual([])
  })

  it('rozhledny nechybí nikde — podpis je opravdu úzký, ne „všechno chybí"', () => {
    // Bez tohohle testu by kontrola mohla hlásit půl repa a nikdo by si toho
    // nevšiml: seznam by byl tak dlouhý, že by ho nikdo nečetl.
    expect(
      zkontrolujVrstvy().filter((c) => c.druh === 'chybi-vrstva' && c.vrstva === 'rozhledny'),
    ).toEqual([])
  })

  it('oblast bez hlavního exportu je „nespuštěná", ne „chybí vrstva"', () => {
    // Rozdíl je věcný: nespuštěná oblast čeká na Michalův klik v Actions
    // (fronta práce), kdežto chybějící vrstva je běh, který tiše nedoběhl.
    const nespustene = [
      ...new Set(
        zkontrolujVrstvy()
          .filter((c) => c.druh === 'nespustena')
          .map((c) => c.oblast),
      ),
    ]
    expect(nespustene).toEqual(['oravska-magura', 'zapadne-tatry', 'slovensky-raj', 'bieszczady'])
  })

  it('bez katalogových jmen se dohledávka podle jmen nevyžaduje', () => {
    // Oblast s prázdným `katalogPohori` ten soubor mít NEMÁ — kontrola po něm
    // nesmí volat, jinak by trvale svítila u oblastí, kde je to v pořádku.
    const koren = mkdtempSync(join(tmpdir(), 'vrstvy-'))
    const dir = join(koren, 'krkonose')
    mkdirSync(dir, { recursive: true })
    for (const f of ['_overpass-export-cz.json', '_overpass-export-pl.json'])
      writeFileSync(join(dir, f), '{"elements":[]}')

    // Katalog schválně neexistuje → `jmenaZKatalogu` vrátí prázdno u všech oblastí.
    const bezKatalogu = zkontrolujVrstvy(koren, join(koren, 'neexistuje.json'))
    expect(bezKatalogu.some((c) => c.vrstva === 'dle-jmen')).toBe(false)
    // Krkonoším pak zbývají jen rozhledny a ty v dočasném kořeni chybí.
    expect(bezKatalogu.filter((c) => c.oblast === 'krkonose').map((c) => c.vrstva)).toEqual([
      'rozhledny',
      'rozhledny',
    ])

    // S katalogem naopak dohledávka chybí i tady — týž kořen, jiný jediný vstup.
    const sKatalogem = zkontrolujVrstvy(koren, KATALOG)
    expect(sKatalogem.filter((c) => c.oblast === 'krkonose').map((c) => c.vrstva)).toEqual([
      'dle-jmen',
      'rozhledny',
      'dle-jmen',
      'rozhledny',
    ])
  })
})

describe('zkontrolujKotvuJmen — jméno, na které ukotvená dohledávka nedosáhne', () => {
  const KATALOG = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')

  /**
   * Tři třídy nálezu se měří nad VLASTNÍMI daty, ne nad repem — schválně.
   * Původní verze tohohle testu (22. 8. ráno) jmenovala konkrétní dvojice ze
   * skutečných exportů a po Michalově běhu DATA-01 nad Krkonošemi spadla:
   * „Špindlerova bouda" je od té chvíle v OSM pod přesným jménem, zato
   * přibyly „Portášky" a „Černá bouda". Test, který fixuje snímek dat, měří
   * data, ne kontrolu.
   */
  const fixturaKotvy = (osm: string[], katalogJmena: string[]) => {
    const koren = mkdtempSync(join(tmpdir(), 'kotva-'))
    const dir = join(koren, 'krkonose')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, '_overpass-export-cz.json'),
      odpoved({ elements: osm.map((name, id) => ({ type: 'node', id, tags: { name } })) }),
    )
    const katalog = join(koren, 'katalog.json')
    writeFileSync(
      katalog,
      JSON.stringify(katalogJmena.map((n) => ({ Pohoří: 'Krkonoše', Název: n }))),
    )
    return zkontrolujKotvuJmen(koren, katalog)
  }

  it('pozná všechny tři třídy, kterými se OSM jméno liší od katalogového', () => {
    const { mine } = fixturaKotvy(
      ['Schronisko PTTK Klimczok', 'Hotel Špindlerova bouda', 'Chata Javorový vrch'],
      ['Schronisko Klimczok', 'Špindlerova bouda', 'Chata Javorový'],
    )
    const dvojice = new Map(mine.map((m) => [m.katalog, m.osm]))
    // Vsuvka uvnitř jména — jádro odřízne jen slovo na začátku, „PTTK" ne.
    expect(dvojice.get('Schronisko Klimczok')).toEqual(['Schronisko PTTK Klimczok'])
    // Předsazené slovo v OSM u jména, které katalog vede bez něj.
    expect(dvojice.get('Špindlerova bouda')).toEqual(['Hotel Špindlerova bouda'])
    // Přípona za jménem — „Javorový" v OSM pokračuje slovem „vrch".
    expect(dvojice.get('Chata Javorový')).toEqual(['Chata Javorový vrch'])
  })

  it('uvozovky kolem jména se v OSM ignorují, jinak by hlásily každé polské schronisko', () => {
    const { mine, presne } = fixturaKotvy(
      ['Schronisko PTTK "Orlica"', 'Luční bouda'],
      ['Schronisko Orlica', 'Luční bouda'],
    )
    // Uvozovky se normalizují pryč, takže rozdíl dělá jen vsuvka „PTTK".
    expect(mine.map((m) => m.katalog)).toEqual(['Schronisko Orlica'])
    expect(presne).toBe(1)
  })

  it('nad skutečným repem je nálezů čitelná menšina, ne půl korpusu', () => {
    // Konkrétní dvojice se s každým re-exportem hýbou, a tak to má být.
    // Neměnný je TVAR: kontrola má něco najít (jinak se přestala ptát) a má
    // toho najít málo (jinak se přestane číst).
    const { mine, objektu, presne } = zkontrolujKotvuJmen()
    expect(objektu).toBeGreaterThan(100)
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.length).toBeLessThan(presne)
    expect(mine.length).toBeLessThan(objektu / 4)
  })

  it('přesná shoda se nehlásí, i když je jméno v exportu vícekrát', () => {
    const { mine } = zkontrolujKotvuJmen()
    // Luční bouda je v OSM pojmenovaná stejně jako v katalogu → do výpisu nepatří.
    expect(mine.map((m) => m.katalog)).not.toContain('Luční bouda')
  })

  it('měří se jen směr „OSM říká víc" — holé „Chata" v OSM není nález', () => {
    // Opačný směr by holé obecné jméno spároval s každým katalogovým jménem,
    // které to slovo obsahuje; takový výpis se nedá číst a proto se neměří.
    const { mine } = zkontrolujKotvuJmen()
    expect(mine.every((m) => m.osm.every((o) => o.trim().toLowerCase() !== 'chata'))).toBe(true)
  })

  it('bez exportů oblasti se neměří nic — chybějící vrstvu hlásí jiná kontrola', () => {
    const koren = mkdtempSync(join(tmpdir(), 'kotva-'))
    expect(zkontrolujKotvuJmen(koren, KATALOG).mine).toEqual([])
    expect(zkontrolujKotvuJmen(koren, KATALOG).objektu).toBe(0)
  })

  it('bez katalogu kontrola mlčí, místo aby spadla', () => {
    const koren = mkdtempSync(join(tmpdir(), 'kotva-'))
    const vysledek = zkontrolujKotvuJmen(koren, join(koren, 'neexistuje.json'))
    expect(vysledek).toEqual({ mine: [], objektu: 0, presne: 0 })
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
