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

import { pokrytiOblasti } from '../../scripts/kontrola/katalog-pokryti'

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
