/**
 * F1a: čisté funkce SSG indexu chat — extrakce nejstaršího doloženého roku
 * z milníků, feedy nad `checked` (naposledy ověřeno, n× za 14 dní)
 * a kalendárium (deterministický výběr dayOfYear % n, žádné falešné „dnes").
 */
import { describe, expect, it } from 'vitest'

import {
  denVRoce,
  feedNaposledyOvereno,
  jeZimniPoster,
  kalendariumVeta,
  kalendariumVyber,
  nejstarsiDolozenyRok,
  pocetNoveOverenychZa,
  posledniOvereniFondu,
  seedovanyVyber,
  type IndexChata,
  type KalendariumPolozka,
} from '@/lib/index-chat'

/** Minimální záznam indexu — testy přepisují jen to, oč jim jde. */
const zaznam = (prepis: Partial<IndexChata>): IndexChata => ({
  slug: 'x',
  nazev: 'X',
  url: '/cesko/krkonose/x',
  oblastSlug: 'krkonose',
  oblastNazev: 'Krkonoše',
  zeme: 'cz',
  typ: 'obsluhovana',
  stav: 'v-provozu',
  vyska: null,
  lat: null,
  lng: null,
  nocleh: null,
  obcerstveni: null,
  razitko: false,
  otiskUrl: null,
  heroUrl: null,
  heroAlt: null,
  otiskAlt: null,
  kapacita: null,
  znamka: false,
  checked: null,
  verified: false,
  nejstarsiRok: null,
  ...prepis,
})

describe('nejstarsiDolozenyRok', () => {
  it('bere minimum přes milníky s rokem — pořadí pole nerozhoduje', () => {
    expect(
      nejstarsiDolozenyRok([
        { rok: 2014, udalost: 'rekonstrukce' },
        { rok: 1623, udalost: 'letopočet na základním kameni' },
        { udalost: 'požár (rok neznámý)' },
      ]),
    ).toBe(1623)
  })

  it('bez jediného doloženého roku je poctivě null (chata v žebříčku nebude)', () => {
    expect(nejstarsiDolozenyRok([{ udalost: 'přestavba' }])).toBeNull()
    expect(nejstarsiDolozenyRok([])).toBeNull()
    expect(nejstarsiDolozenyRok(undefined)).toBeNull()
    expect(nejstarsiDolozenyRok(null)).toBeNull()
  })
})

describe('feedy nad checked', () => {
  const index = [
    zaznam({ slug: 'a', nazev: 'Amor', checked: '2026-07-20' }),
    zaznam({ slug: 'b', nazev: 'Bouda B', checked: '2026-07-27' }),
    zaznam({ slug: 'c', nazev: 'Chata C', checked: null }),
    zaznam({ slug: 'd', nazev: 'Dvoračky', checked: '2026-07-27' }),
    zaznam({ slug: 'e', nazev: 'Erlebachova', checked: '2026-06-01' }),
  ]

  it('feedNaposledyOvereno: nejnovější první, remíza abecedně, bez checked vůbec ne', () => {
    const feed = feedNaposledyOvereno(index, 3)
    expect(feed.map((ch) => ch.slug)).toEqual(['b', 'd', 'a'])
    expect(feedNaposledyOvereno(index, 99).map((ch) => ch.slug)).toEqual(['b', 'd', 'a', 'e'])
    expect(feedNaposledyOvereno([zaznam({ checked: null })])).toEqual([])
  })

  it('posledniOvereniFondu vrací max checked, bez dat null', () => {
    expect(posledniOvereniFondu(index)).toBe('2026-07-27')
    expect(posledniOvereniFondu([zaznam({ checked: null })])).toBeNull()
    expect(posledniOvereniFondu([])).toBeNull()
  })

  it('pocetNoveOverenychZa počítá okno včetně hranice a ignoruje budoucí data (vada dat)', () => {
    expect(pocetNoveOverenychZa(index, '2026-07-27', 14)).toBe(3) // b, d, a (20. 7. je uvnitř)
    expect(pocetNoveOverenychZa(index, '2026-07-27', 7)).toBe(3) // hranice 20. 7. včetně
    expect(pocetNoveOverenychZa(index, '2026-07-27', 6)).toBe(2) // a (20. 7.) už vypadl
    expect(pocetNoveOverenychZa([zaznam({ checked: '2027-01-01' })], '2026-07-27')).toBe(0)
    expect(pocetNoveOverenychZa(index, 'nesmysl')).toBe(0)
  })
})

describe('kalendárium', () => {
  const polozky: KalendariumPolozka[] = [
    { rok: 1899, udalost: 'otevřena nová budova.', chataNazev: 'Bouda B', chataUrl: '/cesko/krkonose/b' },
    { rok: 1623, udalost: 'letopočet na základním kameni.', chataNazev: 'Amor', chataUrl: '/cesko/krkonose/a' },
    { rok: 1938, udalost: 'dokončena přestavba.', chataNazev: 'Chata C', chataUrl: null },
  ]

  it('denVRoce: 1. leden = 1, 31. prosinec = 365/366 (přestupný rok)', () => {
    expect(denVRoce('2026-01-01')).toBe(1)
    expect(denVRoce('2026-12-31')).toBe(365)
    expect(denVRoce('2024-12-31')).toBe(366)
    expect(denVRoce('2026-07-27')).toBe(208)
  })

  it('vybírá deterministicky dayOfYear % n nad seřazeným seznamem (rok, chata, událost)', () => {
    // seřazeno: 1623 Amor · 1899 Bouda B · 1938 Chata C; 1. 1. → index 0
    expect(kalendariumVyber(polozky, '2026-01-01')?.rok).toBe(1623)
    expect(kalendariumVyber(polozky, '2026-01-02')?.rok).toBe(1899)
    expect(kalendariumVyber(polozky, '2026-01-03')?.rok).toBe(1938)
    expect(kalendariumVyber(polozky, '2026-01-04')?.rok).toBe(1623) // rotace dokola
    // vstupní pořadí nerozhoduje — build je deterministický
    expect(kalendariumVyber([...polozky].reverse(), '2026-01-02')?.rok).toBe(1899)
  })

  it('prázdný seznam → null (pás se nevykreslí), věta skládá „Před X lety (Y) …"', () => {
    expect(kalendariumVyber([], '2026-07-27')).toBeNull()
    expect(kalendariumVeta(polozky[1], '2026-07-27')).toBe(
      'Před 403 lety (1623) letopočet na základním kameni.',
    )
  })
})

describe('seedovanyVyber — „Namátkou z průvodce"', () => {
  const polozky = Array.from({ length: 20 }, (_, i) => `chata-${i}`)

  it('je deterministický pro stejný seed (server i klient kreslí totéž)', () => {
    expect(seedovanyVyber(polozky, 209)).toEqual(seedovanyVyber(polozky, 209))
  })

  it('jiný seed dá jiné pořadí („↻ jiných pět") a nemění vstup', () => {
    const puvodni = [...polozky]
    const a = seedovanyVyber(polozky, 209)
    const b = seedovanyVyber(polozky, 210)
    expect(a).not.toEqual(b)
    expect(polozky).toEqual(puvodni) // shuffle jede nad kopií
  })

  it('vrací žádaný počet a u malého vstupu vše bez duplicit', () => {
    expect(seedovanyVyber(polozky, 7)).toHaveLength(5)
    const male = seedovanyVyber(['a', 'b', 'c'], 7)
    expect([...male].sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('jeZimniPoster — zimní vrstva jen podle kalendáře', () => {
  it('XII–III zima, jinak ne (žádná fake předpověď)', () => {
    expect(jeZimniPoster('2026-12-01')).toBe(true)
    expect(jeZimniPoster('2026-01-15')).toBe(true)
    expect(jeZimniPoster('2026-03-31')).toBe(true)
    expect(jeZimniPoster('2026-04-01')).toBe(false)
    expect(jeZimniPoster('2026-07-28')).toBe(false)
  })
})
