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
