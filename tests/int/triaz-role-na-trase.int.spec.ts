/**
 * ROLE NA TRASE — MĚŘENÍ DRUHÉ PŮLKY KLÍČE ZAŘAZENÍ (2. 9. 2026).
 *
 * `scripts/triaz-role-na-trase.ts` nic nezapisuje do dat, takže se jeho
 * chyba neprojeví vadným záznamem — projeví se tím, že se podle špatného
 * čísla přečte špatný kandidát, nebo se naopak bouda na hřebeni odsune
 * mezi apartmány. Test proto drží čtyři věci: že se vzdálenost počítá
 * KOLMO K ÚSEKU (a ne k lomovému bodu), že měření sedí na korpusu, který
 * už redakce rozhodla, že se jméno cíle v názvu trasy pozná, a že se
 * krátké jádro názvu nepoužije jako shoda.
 *
 * Testy běží nad ostrým exportem DATA-06 v repu — statický soubor, ne síť.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

import type { TrasaRelace } from '../../scripts/data06-trasy'
import {
  jmenujeCil,
  nactiTrasy,
  roleBodu,
  roleNaTrase,
  U_TRASY_M,
  vzdalenostKUsecceM,
} from '../../scripts/triaz-role-na-trase'

const relace = nactiTrasy('krkonose')!

describe('role na trase — geometrie', () => {
  it('měří kolmo k úseku, ne k jeho lomovému bodu', () => {
    // Bod leží uprostřed dlouhého rovného úseku, pár metrů stranou.
    // Vzdálenost k nejbližšímu KONCI úseku je přes 400 m, kolmo je to ~11 m
    // — a právě o tenhle rozdíl by měření přeceňovalo každou boudu
    // u dlouhé rovné cesty.
    const a = { lat: 50.7, lng: 15.7 }
    const b = { lat: 50.7, lng: 15.71 }
    const bod = { lat: 50.7001, lng: 15.705 }
    const kolmo = vzdalenostKUsecceM(bod, a, b)
    expect(kolmo).toBeGreaterThan(9)
    expect(kolmo).toBeLessThan(13)
  })

  it('u degenerovaného úseku (dva totožné body) vrací vzdálenost k bodu', () => {
    const a = { lat: 50.7, lng: 15.7 }
    expect(vzdalenostKUsecceM({ lat: 50.7, lng: 15.7 }, a, a)).toBeCloseTo(0, 5)
    expect(vzdalenostKUsecceM({ lat: 50.7009, lng: 15.7 }, a, a)).toBeGreaterThan(90)
  })
})

describe('role na trase — měření proti rozhodnutému korpusu', () => {
  // Průchod celým korpusem proti čtrnáctimegabajtovému exportu trvá
  // jednotky sekund — výchozích 5 s vitestu na to nestačí.
  it('drtivá většina publikovaných profilů leží do prahu od značky', { timeout: 60_000 }, () => {
    // Kalibrace metody: publikované profily prošly redakcí a klíčem
    // zařazení, takže „role na trase" u nich platí. Kdyby měření tvrdilo
    // opak u větší části z nich, měřilo by něco jiného, než si myslí.
    const dir = join('data', 'chaty', 'krkonose')
    let doPrahu = 0
    let celkem = 0
    for (const soubor of readdirSync(dir)) {
      if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
      const y = parse(readFileSync(join(dir, soubor), 'utf8')) as Record<string, unknown>
      if (typeof y.lat !== 'number' || typeof y.lng !== 'number') continue
      celkem++
      const r = roleBodu({ lat: y.lat, lng: y.lng }, relace, String(y.nazev ?? ''))
      if ((r.nejblizsi?.vzdalenostM ?? Infinity) <= U_TRASY_M) doPrahu++
    }
    expect(celkem).toBeGreaterThan(60)
    expect(doPrahu / celkem).toBeGreaterThan(0.9)
  })

  it('u kandidáta mimo okno exportu nepředstírá blízkost', () => {
    // Raisova chata na Zvičině leží v Podkrkonoší, tedy MIMO okno
    // krkonošského exportu tras — měření u ní vyjde v kilometrech a je to
    // vlastnost okna, ne doklad, že k chatě nevede značka (DATA-29).
    const y = parse(
      readFileSync(join('data', 'chaty', 'krkonose', 'raisova-chata-na-zvicine.yaml'), 'utf8'),
    ) as Record<string, number>
    const r = roleBodu({ lat: y.lat, lng: y.lng }, relace)
    expect(r.nejblizsi?.vzdalenostM ?? 0).toBeGreaterThan(5000)
  })
})

describe('role na trase — jméno cíle v názvu trasy', () => {
  it('pozná boudu jmenovanou v názvu značené trasy', () => {
    // KČT 4228 se jmenuje „Svoboda nad Úpou - Hoffmannova bouda": trasa
    // tu boudu vede jako CÍL, což je silnější doklad role než vzdálenost.
    const hoffmannova = roleNaTrase('krkonose', ['hoffmannova-bouda'])[0]
    expect(hoffmannova.jmenujiCil.length).toBeGreaterThan(0)
    expect(hoffmannova.jmenujiCil.some((t) => (t.popis ?? '').includes('Hoffmannova bouda'))).toBe(
      true,
    )
  })

  it('krátké jádro názvu se za shodu nepovažuje', () => {
    // „Chata" má po odstranění druhového slova prázdné jádro; kdyby se
    // hledalo, sedla by na kdeco a vyrobila by doklad, který v datech není.
    const rel = { type: 'relation', id: 1, tags: { name: 'Chata pod Lysou' } } as TrasaRelace
    expect(jmenujeCil('Chata', rel)).toBe(false)
    expect(jmenujeCil('Bouda', rel)).toBe(false)
  })

  it('jmenování se počítá jen u tras do prahu', () => {
    // Jmenovec o pět údolí dál o roli kandidáta nedokládá nic.
    const vsechny = roleNaTrase('krkonose', ['hoffmannova-bouda'])[0]
    expect(vsechny.jmenujiCil.every((t) => t.vzdalenostM <= U_TRASY_M)).toBe(true)
  })
})
