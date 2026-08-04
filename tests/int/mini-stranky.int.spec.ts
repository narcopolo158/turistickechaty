/**
 * Podklady mini-stránek střediska a lanovky (F1e + zadání Michala
 * 29. 7. 2026: „udělej i mini-stránky lanovek").
 *
 * Testy míří na tři místa, kde se dá tiše minout cíl:
 *   1. slug lanovky — kolize názvů by poslala čtenáře na cizí dráhu;
 *   2. výběr přístupů ze střediska — jména výchozích bodů jsou v datech
 *      psaná různě, takže se porovnává obec, ne celý název;
 *   3. hledání tras u horní stanice — geometrie tras je uložená OD CHATY
 *      dolů, takže výchozí bod je POSLEDNÍ prvek; podle prvního to vychází
 *      tak, že všechny přístupy jedné chaty „začínají" na jednom místě.
 */
import { describe, expect, it } from 'vitest'

import { lanovkaPodleSlugu, lanovkySeSlugy, slugLanovky } from '@/lib/lanovky'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { pristupyOdBodu, pristupyStrediska } from '@/lib/pristupy'

describe('slug lanovky', () => {
  it('srazí diakritiku i polské ł na holé ASCII', () => {
    expect(slugLanovky('Černohorský Express', 'w1')).toBe('cernohorsky-express')
    expect(slugLanovky('Wyciąg „Zbyszek"', 'w2')).toBe('wyciag-zbyszek')
    expect(slugLanovky('Łabski', 'w3')).toBe('labski')
  })

  it('dráha bez názvu dostane slug z id, ne prázdno', () => {
    expect(slugLanovky(null, 'way/123')).toBe('draha-way-123')
  })

  it('dvě dráhy téhož jména se rozliší, ať odkaz nevede na cizí', () => {
    const slugy = lanovkySeSlugy('krkonose').map((l) => l.slug)
    expect(new Set(slugy).size).toBe(slugy.length)
  })

  it('slug z přehledu najde tutéž dráhu i zpětně', () => {
    const prvni = lanovkySeSlugy('krkonose')[0]
    expect(lanovkaPodleSlugu('krkonose', prvni.slug)?.id).toBe(prvni.id)
    expect(lanovkaPodleSlugu('krkonose', 'neexistujici-draha')).toBeNull()
  })
})

describe('přístupy ze střediska', () => {
  const pec = pristupyStrediska('krkonose', 'Pec pod Sněžkou')

  it('najde trasy i z bodů zapsaných s upřesněním za čárkou', () => {
    expect(pec.length).toBeGreaterThan(5)
    expect(pec.some((p) => p.vychoziBod !== 'Pec pod Sněžkou')).toBe(true)
  })

  it('u chaty s víc trasami odtud nechá tu nejkratší a řadí od nejbližší', () => {
    const slugy = pec.map((p) => p.slug)
    expect(new Set(slugy).size).toBe(slugy.length)
    const delky = pec.map((p) => p.delkaKm ?? 99)
    expect([...delky].sort((a, b) => a - b)).toEqual(delky)
  })

  it('nese značení úseků — bez něj by řádek neuměl vykreslit pásovou značku', () => {
    const seZnackou = pec.find((p) => p.useky.some((u) => u.znaceni))
    expect(seZnackou).toBeTruthy()
    expect(['cervena', 'modra', 'zelena', 'zluta', 'cerna']).toContain(
      seZnackou!.useky.find((u) => u.znaceni)!.znaceni,
    )
  })

  it('neznámé středisko vrací prázdno, ne výjimku', () => {
    expect(pristupyStrediska('krkonose', 'Neexistující Ves')).toEqual([])
  })
})

describe('trasy od horní stanice lanovky', () => {
  const cernohorsky = lanovkySeSlugy('krkonose').find((l) => l.nazev === 'Černohorský Express')!

  it('u horní stanice Černohorského Expressu opravdu nějaké začínají', () => {
    const p = pristupyOdBodu('krkonose', cernohorsky.horni)
    expect(p.length).toBeGreaterThan(0)
    expect(p.map((x) => x.nazev)).toContain('Černá bouda')
  })

  it('rozliší horní stanici od dolní — jinak by stránka nabízela túry z údolí', () => {
    const nahore = pristupyOdBodu('krkonose', cernohorsky.horni).map((p) => p.slug)
    const dole = pristupyOdBodu('krkonose', cernohorsky.dolni).map((p) => p.slug)
    expect(nahore).not.toEqual(dole)
  })

  it('uprostřed lesa nenajde nic (a nespadne)', () => {
    expect(pristupyOdBodu('krkonose', { lat: 50.9, lng: 15.2 })).toEqual([])
  })
})

/**
 * Tichá nula u střediska (4. 8. 2026). Mini-stránka bere přístupy podle
 * JMÉNA střediska; dokud se všechna střediska jmenovala přesně jako obec ve
 * výchozích bodech, fungovalo to. Ještědský hřbet to rozbil hned prvním
 * střediskem („Liberec – Horní Hanychov" proti bodům „Liberec",
 * „Liberec-Horní Hanychov, konečná tramvaje", „Horní Hanychov, u lanovky")
 * a při té příležitosti se ukázalo, že totéž tiše potkalo i Vítkovice:
 * devět tras z Horních Mísečků, a na stránce „0 chat odtud". Párování proto
 * bere i `vychoziBody` — a tenhle test hlídá, že se vazba nerozpadne.
 */
describe('středisko nesmí tiše ukazovat nulu chat', () => {
  const strediska = (oblast: string) =>
    readdirSync(join(process.cwd(), 'data', 'strediska', oblast))
      .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
      .map((f) => {
        const d = parse(
          readFileSync(join(process.cwd(), 'data', 'strediska', oblast, f), 'utf8'),
        ) as { nazev: string; vychoziBody?: { nazev?: string }[] }
        return {
          soubor: f,
          nazev: d.nazev,
          body: (d.vychoziBody ?? []).map((b) => b.nazev).filter((n): n is string => !!n),
        }
      })

  it('každý vychoziBod střediska se opravdu páruje s nějakou trasou (Ještědský hřbet)', () => {
    for (const s of strediska('jestedsky-hrbet')) {
      const p = pristupyStrediska('jestedsky-hrbet', s.nazev, s.body)
      expect(p.length, `${s.soubor}: žádná přístupová trasa — vazba na katalog se rozpadla`).toBeGreaterThan(0)
    }
  })

  it('Vítkovice vidí trasy z Horních Mísečků (regrese tiché nuly)', () => {
    const v = strediska('krkonose').find((s) => s.nazev === 'Vítkovice')
    expect(v, 'středisko Vítkovice zmizelo').toBeTruthy()
    expect(v!.body).toContain('Horní Mísečky')
    expect(pristupyStrediska('krkonose', v!.nazev, v!.body).length).toBeGreaterThan(5)
  })

  it('jméno střediska samo o sobě je slabší klíč než jméno + vychoziBody', () => {
    // Doklad, že rozšíření párování opravdu něco přidalo, ne že jen nic nerozbilo.
    const jenJmeno = pristupyStrediska('jestedsky-hrbet', 'Liberec – Horní Hanychov')
    const iBody = pristupyStrediska('jestedsky-hrbet', 'Liberec – Horní Hanychov', [
      'Liberec',
      'Horní Hanychov, u lanovky',
    ])
    expect(jenJmeno.length).toBe(0)
    expect(iBody.length).toBeGreaterThan(0)
  })
})
