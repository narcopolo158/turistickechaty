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
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { Fotky } from '@/collections/Fotky'

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
