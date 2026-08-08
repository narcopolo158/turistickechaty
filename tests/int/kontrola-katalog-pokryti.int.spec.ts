/**
 * Pokrytí externího katalogu (`scripts/kontrola/katalog-pokryti.ts`).
 *
 * Kontrola vznikla 8. 8. 2026 ze dvou mezer nalezených ručně: chybějícího
 * Hotelu Praděd v Jeseníkách a chybějícího Libušína s Chatou na Radhošti
 * v Beskydech. Testy drží to, na čem její užitečnost stojí — že se
 * rozliší SILNÁ shoda, SLABÁ shoda (polská deklinace) a skutečná mezera.
 * Kdyby slabá shoda chyběla, report by tvrdil, že chybí většina polských
 * schronisek; kdyby se slabá shoda počítala jako silná, zamlčel by mezeru.
 */
import { describe, expect, it } from 'vitest'

import {
  KATALOG_MIMO_KLIC,
  KATALOG_PREJMENOVANI,
  pokrytiOblasti,
} from '../../scripts/kontrola/katalog-pokryti'

const zaznam = (nazev: string, pohori: string, vyska: number | null = null) => ({
  Název: nazev,
  Pohoří: pohori,
  'Nadmořská výška (m)': vyska,
  'Nejbližší obec nebo uzel': 'obec',
})

const objekt = (slug: string, nazev: string, kde = 'kandidát') => ({
  slug,
  nazvy: [nazev],
  kde,
})

describe('pokrytiOblasti', () => {
  it('silná shoda: přesné jméno i jméno obsažené v druhém', () => {
    const v = pokrytiOblasti(
      'x',
      ['P'],
      [zaznam('Chata Kozubová', 'P'), zaznam('Ropička', 'P')],
      [objekt('chata-kozubova', 'Chata Kozubová'), objekt('r', 'Horská chata Ropička')],
    )
    expect(v.silne.map((s) => s.nazev)).toEqual(['Chata Kozubová', 'Ropička'])
    expect(v.mezery).toEqual([])
  })

  it('vsunuté slovo uvnitř jména shodu z silné na slabou degraduje — a je to správně', () => {
    // „Schronisko na Skrzycznem" × „Schronisko PTTK na Skrzycznem": vsunuté
    // „PTTK" ruší obsažení, takže silná shoda selže. Slabá to zachytí a řekne,
    // ať se to přečte — což je u téhle dvojice přesně ten správný výsledek,
    // protože rozhodnout to má člověk, ne pravidlo o podřetězci.
    const v = pokrytiOblasti(
      'x',
      ['P'],
      [zaznam('Schronisko na Skrzycznem', 'P')],
      [objekt('schronisko-pttk-skrzyczne', 'Schronisko PTTK na Skrzycznem')],
    )
    expect(v.silne).toEqual([])
    expect(v.slabe.map((s) => s.s)).toEqual(['schronisko-pttk-skrzyczne'])
    expect(v.mezery).toEqual([])
  })

  it('slabá shoda pozná polskou deklinaci, kterou substring nechytí', () => {
    // „Hala Miziowa" × „Hali Miziowej" — žádné jméno neobsahuje druhé, a přece
    // je to týž objekt. Přesně tenhle případ dělal z reportu nesmysl.
    const v = pokrytiOblasti(
      'x',
      ['P'],
      [zaznam('Schronisko Hala Miziowa', 'P'), zaznam('Schronisko Lipowska', 'P')],
      [
        objekt('schronisko-na-hali-miziowej', 'Schronisko na Hali Miziowej'),
        objekt('schronisko-pttk-na-hali-lipowskiej', 'Schronisko PTTK na Hali Lipowskiej'),
      ],
    )
    expect(v.slabe.map((s) => s.nazev)).toEqual(['Schronisko Hala Miziowa', 'Schronisko Lipowska'])
    expect(v.mezery).toEqual([])
  })

  it('skutečná mezera zůstane mezerou a nese výšku i uzel', () => {
    const v = pokrytiOblasti(
      'beskydy',
      ['Moravskoslezské Beskydy'],
      [zaznam('Libušín', 'Moravskoslezské Beskydy', 1018)],
      [objekt('mamenka', 'Maměnka')],
    )
    expect(v.mezery).toEqual([
      {
        oblast: 'beskydy',
        nazev: 'Libušín',
        vyska: 1018,
        uzel: 'obec',
        pohori: 'Moravskoslezské Beskydy',
      },
    ])
  })

  it('obecná slova sama shodu nezaloží — jinak by „Chata" spárovala všechno', () => {
    // Kdyby se do rozlišujících slov počítalo „chata" nebo „schronisko",
    // spárovalo by se kdeco s kdečím a report by mlčel o všem.
    const v = pokrytiOblasti(
      'x',
      ['P'],
      [zaznam('Chata Ropička', 'P')],
      [objekt('chata-severka', 'Chata Severka'), objekt('s', 'Schronisko PTTK Klimczok')],
    )
    expect(v.slabe).toEqual([])
    expect(v.mezery.map((m) => m.nazev)).toEqual(['Chata Ropička'])
  })

  it('objekty jiného pohoří se do oblasti nepočítají', () => {
    const v = pokrytiOblasti(
      'x',
      ['Beskid Śląski'],
      [zaznam('Schronisko na Stożku', 'Beskid Śląski'), zaznam('Téryho chata', 'Vysoké Tatry')],
      [],
    )
    expect(v.vKatalogu).toBe(1)
    expect(v.mezery.map((m) => m.nazev)).toEqual(['Schronisko na Stożku'])
  })

  it('publikovaný profil se počítá stejně jako kandidát, ale je to v reportu vidět', () => {
    const v = pokrytiOblasti(
      'x',
      ['P'],
      [zaznam('Chata Prašivá', 'P')],
      [objekt('chata-prasiva', 'Chata Prašivá', 'profil')],
    )
    expect(v.silne[0].kde).toBe('profil')
  })
})

/**
 * Dvě ruční tabulky, které z reportu udělaly použitelnou věc. Bez nich
 * hlásil report 9 beskydských mezer; s nimi 3 — a ten rozdíl nejsou tři
 * chybějící objekty, ale tři objekty, které v repu celou dobu ležely pod
 * jiným jménem, a dva, které do průvodce vůbec nepatří.
 */
describe('ruční tabulky z rešerše 8. 8. 2026', () => {
  it('překlad zastaralého katalogového jména spáruje objekt, který v repu je', () => {
    // „Chata na Radhošti" dnes neexistuje — je to Horský hotel Radegast.
    // Bez překladu spadne do mezer, ačkoli kandidát v repu leží.
    const v = pokrytiOblasti(
      'beskydy',
      ['Moravskoslezské Beskydy'],
      [zaznam('Chata na Radhošti', 'Moravskoslezské Beskydy', 1129)],
      [objekt('horsky-hotel-radegast', 'Horský hotel Radegast')],
    )
    expect(v.mezery).toEqual([])
    expect(v.silne.map((s) => s.s)).toEqual(['horsky-hotel-radegast'])
  })

  it('objekt mimo klíč zařazení není mezera, ale zavřená otázka s důvodem', () => {
    // Hviezdoslavova hájovňa je literární muzeum bez občerstvení. Kdyby ji
    // report vedl jako mezeru, každá další session ji bude dohledávat znovu.
    const v = pokrytiOblasti(
      'beskydy',
      ['Oravské Beskydy'],
      [zaznam('Hviezdoslavova hájovňa', 'Oravské Beskydy', 900)],
      [],
    )
    expect(v.mezery).toEqual([])
    expect(v.mimoKlic).toHaveLength(1)
    expect(v.mimoKlic[0].nazev).toBe('Hviezdoslavova hájovňa')
    // Důvod musí být věcný, ne prázdný — jinak je tabulka jen umlčení.
    expect(v.mimoKlic[0].duvod).toMatch(/občerstvení/)
    expect(v.mimoKlic[0].duvod.length).toBeGreaterThan(60)
  })

  it('rozhodnutí „mimo klíč" má přednost před párováním jmen', () => {
    // I kdyby někdo Bahenec jako kandidáta založil, rozhodnutí platí dál —
    // objekt se nemá tvářit jako pokryté místo, ale jako vyřízená otázka.
    const v = pokrytiOblasti(
      'beskydy',
      ['Slezské Beskydy'],
      [zaznam('Horský hotel Bahenec', 'Slezské Beskydy', 886)],
      [objekt('wellness-hotel-bahenec', 'Wellness hotel Bahenec')],
    )
    expect(v.mimoKlic.map((m) => m.nazev)).toEqual(['Horský hotel Bahenec'])
    expect(v.silne).toEqual([])
  })

  it('každý řádek obou tabulek nese neprázdný obsah', () => {
    for (const [k, v] of Object.entries(KATALOG_PREJMENOVANI)) {
      expect(v.length, `${k} bez dnešního jména`).toBeGreaterThan(0)
      for (const jmeno of v) expect(jmeno.trim().length).toBeGreaterThan(3)
    }
    for (const [k, d] of Object.entries(KATALOG_MIMO_KLIC)) {
      // Krátký důvod by znamenal rozhodnutí bez dokladu; u vyřazení objektu
      // z průvodce je doklad to jediné, co ho drží.
      expect(d.length, `${k} má příliš krátký důvod`).toBeGreaterThan(80)
    }
  })
})
