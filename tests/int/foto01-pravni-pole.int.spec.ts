/**
 * FOTO-01, bod (a): právní pole u historických snímků.
 *
 * Rešerše `docs/FOTKY-ZDROJE-A-LICENCE.md` (zadání Michala 29. 7. 2026)
 * došla k tomu, že u dobové fotky nerozhoduje „licence", ale PROČ je dílo
 * volné: majetková práva končí 70 let po smrti autora, u anonymních děl
 * 70 let od zveřejnění. Pohlednice z roku 1928 s neznámým autorem je tedy
 * volná, signovaný snímek téhož roku nemusí být — a bez zapsaného důvodu
 * to za rok nikdo nepřezkoumá.
 *
 * Testy čtou konfiguraci kolekce (ne běžící DB): pole a hooky se dostanou
 * k redakci commitnutou konfigurací, stejně jako se noc dostane ke čtenáři
 * commitnutým stylopisem.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { parse as parseYaml } from 'yaml'

import { Fotky } from '@/collections/Fotky'
import { kreditFotky, nazevZdroje } from '@/lib/atribuce'

type Pole = { name?: string; type: string; options?: { value: string }[]; fields?: Pole[] }
const vsechnaPole = (pole: Pole[]): Pole[] =>
  pole.flatMap((p) => [p, ...(p.fields ? vsechnaPole(p.fields as Pole[]) : [])])

const pole = vsechnaPole(Fotky.fields as Pole[])
const podleJmena = (jmeno: string) => pole.find((p) => p.name === jmeno)

describe('pole pro pětibodový klíč', () => {
  it('kolekce umí zapsat všech pět bodů klíče z oddílu 3.4', () => {
    // 1. kde je originál, 2. autor, 3. rok vydání, 4. proč je volný, 5. co je na něm.
    expect(podleJmena('instituce'), 'kde je originál').toBeTruthy()
    expect(podleJmena('signatura')).toBeTruthy()
    expect(podleJmena('autor'), 'kdo je autor').toBeTruthy()
    expect(podleJmena('rokVydani'), 'rok vydání').toBeTruthy()
    expect(podleJmena('pravniStatus'), 'proč je volný').toBeTruthy()
    expect(podleJmena('pravniPoznamka'), 'čím je to doložené').toBeTruthy()
    expect(podleJmena('alt'), 'co je na něm').toBeTruthy()
    expect(podleJmena('puvodOriginalu')).toBeTruthy()
  })

  it('status rozlišuje autora od anonyma — u anonyma běží lhůta od vydání, ne od úmrtí', () => {
    const hodnoty = (podleJmena('pravniStatus')?.options ?? []).map((o) => o.value)
    expect(hodnoty).toContain('volne-autor')
    expect(hodnoty).toContain('volne-anonym')
    expect(hodnoty).toContain('se-svolenim')
    expect(hodnoty, 'poctivý pracovní stav').toContain('nevyjasneno')
  })
})

describe('brána: „nevyjasněno" se nepublikuje', () => {
  const hook = (Fotky.hooks?.beforeChange ?? [])[0] as (a: {
    data?: Record<string, unknown>
    originalDoc?: Record<string, unknown>
  }) => unknown

  it('snímek s nevyjasněným statusem nedostane typ, kterým ho šablony vyberou', () => {
    expect(() => hook({ data: { pravniStatus: 'nevyjasneno', typ: 'dobova' } })).toThrow(APIError)
  })

  it('…a nepomůže ani schovat status do už uloženého dokumentu', () => {
    expect(() => hook({ data: { typ: 'dobova' }, originalDoc: { pravniStatus: 'nevyjasneno' } })).toThrow()
  })

  it('rozpracovaný snímek smí v čekárně zůstat — brání se publikaci, ne práci', () => {
    expect(() => hook({ data: { pravniStatus: 'nevyjasneno', typ: 'komunitni-podani' } })).not.toThrow()
  })

  it('doložený snímek projde (jinak by brána zavřela i to, co je v pořádku)', () => {
    expect(() =>
      hook({
        data: {
          pravniStatus: 'volne-anonym',
          pravniPoznamka: 'anonym, vydáno 1928 dle rubu pohlednice',
          typ: 'dobova',
        },
      }),
    ).not.toThrow()
  })

  it('fotky bez právních polí (Commons, CC) se nezměnily — brána se jich netýká', () => {
    expect(() => hook({ data: { typ: 'soucasna', licence: 'cc-by-sa' } })).not.toThrow()
  })
})

/**
 * Mediabanka CzechTourism (prověřena 30. 7. 2026, na Michalův podnět).
 *
 * Podmínky banky předepisují ZNĚNÍ kreditu doslova — „© CzechTourism –
 * mediabanka, autor: [jméno]". Náš obvyklý tvar „foto: X · zdroj" by tedy
 * podmínku nesplnil, i když by autora poctivě jmenoval. Test hlídá právě
 * tenhle rozdíl: je to jediné místo, kde nestačí uvést autora po svém.
 */
describe('mediabanka CzechTourism — předepsaný kredit', () => {
  it('licence je mezi volbami u fotek i u hero pohoří', () => {
    const licence = podleJmena('licence')?.options?.map((o) => o.value) ?? []
    expect(licence).toContain('mediabanka-czt')
    const oblasti = readFileSync(join(process.cwd(), 'src/collections/Oblasti.ts'), 'utf8')
    expect(oblasti).toContain("value: 'mediabanka-czt'")
  })

  it('hero vypisuje předepsané znění, ne naše obvyklé „foto: X · zdroj"', () => {
    const hero = readFileSync(join(process.cwd(), 'src/components/PohoriHero.tsx'), 'utf8')
    expect(hero).toContain('© CzechTourism – mediabanka, autor:')
    // A kontrola samotné kontroly: obvyklý tvar v komponentě pořád je,
    // takže test nechytá jen to, že se odtud „foto: " ztratilo.
    expect(hero).toContain("'foto: '")
  })
})

/**
 * Kredit u fotky — jedno místo pro všechny šablony (30. 7. 2026).
 *
 * Karta střediska měla dvě věci napevno: pořadí slov v kreditu a název
 * zdroje „Wikimedia Commons". U prvních snímků z mediabanky CzechTourism
 * bylo obojí špatně a výsledek zněl „foto Tomáš Rucký, © CzechTourism –
 * mediabanka · Wikimedia Commons" — porušené předepsané znění kreditu
 * a nepravda o zdroji v jedné řádce.
 */
describe('kredit a název zdroje', () => {
  it('mediabanka má předepsané znění, ostatní licence obvyklé', () => {
    expect(kreditFotky('Tomáš Rucký', '© CzechTourism – mediabanka')).toBe(
      '© CzechTourism – mediabanka, autor: Tomáš Rucký',
    )
    expect(kreditFotky('ŠJů', 'CC BY 4.0')).toBe('foto ŠJů, CC BY 4.0')
  })

  it('název zdroje se bere z domény, ne napevno', () => {
    expect(nazevZdroje('https://commons.wikimedia.org/wiki/File:X.jpg')).toBe('Wikimedia Commons')
    expect(nazevZdroje('https://media.visitczechia.com')).toBe('mediabanka CzechTourism')
    // Neznámou doménu ukáže doslova — raději „example.org" než nesprávné Commons.
    expect(nazevZdroje('https://www.example.org/foto/1')).toBe('example.org')
    expect(nazevZdroje('nesmysl')).toBe('zdroj')
  })

  it('šablony kredit skládají přes helper, ne po svém', () => {
    for (const cesta of [
      'src/components/StrediskoKarta.tsx',
      'src/app/(frontend)/[zeme]/[oblast]/stredisko/[stredisko]/page.tsx',
      'src/app/(frontend)/[zeme]/[oblast]/lanovka/[lanovka]/page.tsx',
    ]) {
      const zdroj = readFileSync(join(process.cwd(), cesta), 'utf8')
      expect(zdroj, cesta).toContain('kreditFotky(foto.autor, foto.licence)')
      // Napevno psaný název zdroje se nesmí vrátit.
      expect(zdroj.includes('>\n                  Wikimedia Commons'), cesta).toBe(false)
    }
  })
})

/**
 * Snímky z mediabanky, které Michal poslal 30. 7. 2026, a jejich licenční
 * doklad. Registr je v repu proto, aby se za rok dalo u každého souboru
 * dohledat, čí je a odkud — u snímku bez dokladu se nedá poznat, jestli tam
 * smí být.
 */
describe('registr snímků z mediabanky', () => {
  const registr = parseYaml(readFileSync(join(process.cwd(), 'data/foto-mediabanka-czt.yaml'), 'utf8')) as {
    kreditPredepsany: string
    snimky: { assetId: string; autor: string | null; licence: string; vRepu: string; pouziti: string }[]
  }

  it('každý snímek má licenci, cestu v repu — a autora, POKUD ho mediabanka předepsala', () => {
    // Počet je práh, ne rovnost: 30. 7. přišlo osm snímků, 4. 8. pět
    // šumavských. Rovnost by padala při každé další dodávce.
    expect(registr.snimky.length).toBeGreaterThanOrEqual(13)
    for (const s of registr.snimky) {
      expect(s.licence, s.assetId).toMatch(/Licence/iu)
      expect(existsSync(join(process.cwd(), s.vRepu)), s.vRepu).toBe(true)
      // Autor smí být null JEN vysloveně: tři šumavské licenční soubory
      // (4. 8. 2026) řádek „Please Credit" nemají — vymyšlený autor by byl
      // horší než žádný. Prázdný řetězec nebo chybějící klíč je pořád chyba.
      expect(s.autor === null || (typeof s.autor === 'string' && s.autor.length > 0), s.assetId).toBe(true)
    }
  })

  it('snímky bez místa v názvu jsou vedené jako NEPŘIŘAZENÉ', () => {
    // Mediabanka u nich uvádí prostě „lanovka" / „sumava_landscape" —
    // přiřadit je ke konkrétnímu objektu by tvrdilo, co nevíme (DATA-33).
    const neprirazene = registr.snimky.filter((s) => s.pouziti.startsWith('NEPŘIŘAZENO'))
    expect(neprirazene.length).toBeGreaterThanOrEqual(2)
    // …a naopak: každé přiřazené použití jmenuje oblast nebo objekt.
    for (const s of registr.snimky) {
      expect(s.pouziti?.trim().length, s.assetId).toBeGreaterThan(0)
    }
  })

  it('registr nese předepsané znění kreditu', () => {
    expect(registr.kreditPredepsany).toContain('© CzechTourism – mediabanka, autor:')
  })
})
