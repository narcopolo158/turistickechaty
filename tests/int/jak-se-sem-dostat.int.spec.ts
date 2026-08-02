import { describe, expect, it } from 'vitest'

import {
  bodyKatalogu,
  formatVzdusne,
  jakSeSemDostat,
  nejblizsiBod,
  zastavkyVMiste,
  zdrojKatalogu,
  type BodKatalogu,
} from '@/lib/jak-se-sem-dostat'

/**
 * „Jak se sem dostat" (F1e, blok 02 handoffu).
 *
 * Podstata testů není v tom, že se něco vypíše, ale v tom, CO blok tvrdí:
 * mluví o zastávce, ne o spojení, o vzdušné vzdálenosti, ne o pěší, a auto
 * si nevymýšlí. Doložená próza z dat vždy přebíjí výpočet z mapy.
 */

/** Bod obce Pec pod Sněžkou (katalog výchozích bodů DATA-06). */
const PEC = { lat: 50.6935744, lng: 15.7335607 }

const bod = (nazev: string, typ: string, lat: number, lng: number): BodKatalogu => ({
  nazev,
  typ,
  lat,
  lng,
  url: `https://www.openstreetmap.org/node/${nazev.length}`,
})

describe('formátování vzdálenosti', () => {
  it('pod kilometrem metry po padesátce, výš kilometry s desetinnou čárkou', () => {
    expect(formatVzdusne(0.24)).toBe('250 m')
    expect(formatVzdusne(1.24)).toBe('1,2 km')
    expect(formatVzdusne(12.06)).toBe('12,1 km')
  })

  it('velmi blízký bod nespadne na „0 m" — nula by tvrdila, že leží v témž bodě', () => {
    expect(formatVzdusne(0.004)).toBe('50 m')
  })
})

describe('nejbližší bod daného typu', () => {
  const body = [
    bod('Svoboda nad Úpou', 'zeleznice', 50.6247, 15.8148),
    bod('Kunčice nad Labem', 'zeleznice', 50.5697, 15.6383),
    bod('Pec pod Sněžkou, aut. st.', 'zastavka', 50.6934, 15.7331),
  ]

  it('vybere bližší ze dvou stanic', () => {
    expect(nejblizsiBod(PEC, body, 'zeleznice', 20)?.nazev).toBe('Svoboda nad Úpou')
  })

  it('mimo limit nevrátí nic — „nejbližší stanice" 60 km daleko není odpověď', () => {
    expect(nejblizsiBod(PEC, body, 'zeleznice', 3)).toBeNull()
  })

  it('středisko bez souřadnic nemá od čeho měřit', () => {
    expect(nejblizsiBod({ lat: null, lng: null }, body, 'zeleznice', 20)).toBeNull()
  })
})

describe('zastávky v místě', () => {
  const body = [
    bod('Pec pod Sněžkou, aut. st.', 'zastavka', 50.6934, 15.7331),
    bod('Pec pod Sněžkou, Hnědý vrch', 'zastavka', 50.6975, 15.7255),
    bod('Špindlerův Mlýn, aut. nádr.', 'zastavka', 50.7256, 15.6088),
    bod('Sněžka', 'lanovka', 50.7359, 15.7397),
  ]

  it('počítá jen zastávky v okruhu a nejbližší jmenuje', () => {
    const { pocet, nejblizsi } = zastavkyVMiste(PEC, body)
    expect(pocet).toBe(2)
    expect(nejblizsi?.nazev).toBe('Pec pod Sněžkou, aut. st.')
  })

  it('lanovka není autobusová zastávka', () => {
    expect(zastavkyVMiste(PEC, [bod('Sněžka', 'lanovka', 50.6936, 15.7336)]).pocet).toBe(0)
  })
})

describe('řádky bloku', () => {
  const body = [
    bod('Svoboda nad Úpou', 'zeleznice', 50.6247, 15.8148),
    bod('Pec pod Sněžkou, aut. st.', 'zastavka', 50.6934, 15.7331),
  ]

  it('z katalogu vzniknou řádky Vlakem a Autobusem, každý s původem `katalog`', () => {
    const r = jakSeSemDostat(PEC, body)
    expect(r.map((x) => x.klic)).toEqual(['Vlakem', 'Autobusem'])
    expect(r.every((x) => x.puvod === 'katalog')).toBe(true)
  })

  it('řádek o autobusu netvrdí spojení, jen zastávku — a přiznává to nahlas', () => {
    const bus = jakSeSemDostat(PEC, body).find((x) => x.klic === 'Autobusem')!
    expect(bus.hodnota).toContain('Které linky tudy jezdí, z našich dat neplyne')
    expect(bus.hodnota).not.toMatch(/jezdí sem|spojení z|přímý spoj/i)
  })

  it('počet zastávek se skloňuje — „11 autobusová zastávek" by byl paskvil', () => {
    const dvakrat = [...body, bod('Pec pod Sněžkou, kaplička', 'zastavka', 50.6944, 15.7325)]
    expect(jakSeSemDostat(PEC, body).find((x) => x.klic === 'Autobusem')!.hodnota).toContain(
      'je 1 autobusová zastávka',
    )
    expect(jakSeSemDostat(PEC, dvakrat).find((x) => x.klic === 'Autobusem')!.hodnota).toContain(
      'jsou 2 autobusové zastávky',
    )
  })

  it('vzdálenost je pojmenovaná jako vzdušná — jinak by se sečetla s délkami tras', () => {
    const vlak = jakSeSemDostat(PEC, body).find((x) => x.klic === 'Vlakem')!
    expect(vlak.hodnota).toContain('vzdušnou čarou')
  })

  it('doložená próza z dat přebíjí výpočet a nese původ `data`', () => {
    const r = jakSeSemDostat(PEC, body, { vlak: 'Vlakem do Svobody nad Úpou, dál autobusem.' })
    const vlak = r.find((x) => x.klic === 'Vlakem')!
    expect(vlak.hodnota).toBe('Vlakem do Svobody nad Úpou, dál autobusem.')
    expect(vlak.puvod).toBe('data')
  })

  it('prázdný řetězec v datech se nebere jako doložený text', () => {
    const vlak = jakSeSemDostat(PEC, body, { vlak: '   ' }).find((x) => x.klic === 'Vlakem')!
    expect(vlak.puvod).toBe('katalog')
  })

  it('řádek Autem vznikne JEN z doloženého pole — kudy se přijíždí, mapa neříká', () => {
    expect(jakSeSemDostat(PEC, body).some((x) => x.klic === 'Autem')).toBe(false)
    const r = jakSeSemDostat(PEC, body, { auto: 'Vjezd do centra je regulovaný, parkuje se u…' })
    expect(r.find((x) => x.klic === 'Autem')?.puvod).toBe('data')
  })

  it('bez dat i bez katalogu blok mlčí — prázdná tabulka neříká nic', () => {
    expect(jakSeSemDostat(PEC, [])).toEqual([])
    expect(jakSeSemDostat({ lat: null, lng: null }, body)).toEqual([])
  })
})

describe('katalog výchozích bodů v repu', () => {
  it('Krkonoše mají body i větu o původu dat (atribuce ODbL patří ke každému použití OSM)', () => {
    const body = bodyKatalogu('krkonose')
    expect(body.length).toBeGreaterThan(100)
    expect(body.some((b) => b.typ === 'zeleznice')).toBe(true)
    expect(zdrojKatalogu('krkonose')).toMatch(/OpenStreetMap/)
  })

  it('nad reálným katalogem dostane Pec pod Sněžkou oba řádky', () => {
    const r = jakSeSemDostat(PEC, bodyKatalogu('krkonose'))
    expect(r.map((x) => x.klic)).toEqual(['Vlakem', 'Autobusem'])
  })

  it('neexistující oblast vrátí prázdno, ne výjimku', () => {
    expect(bodyKatalogu('neexistujici-pohori')).toEqual([])
    expect(zdrojKatalogu('neexistujici-pohori')).toBeNull()
  })
})
