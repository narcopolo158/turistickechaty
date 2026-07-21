/**
 * DATA-08: zapojení externího katalogu ČR/SK do Krkonoš — mapování katalogového
 * řádku na kandidáta (bez GPS, verified:false, jistota katalogu ≠ naše verified),
 * filtr pohoří a kategorizace proti našim profilům (silná shoda + slabá detekce
 * možných duplikátů). Nad podvrženými daty, bez souborů.
 */
import { describe, expect, it } from 'vitest'

import {
  kandidatDataZKatalogu,
  kategorizuj,
  krkonoseZaznamy,
  mapaTyp,
  tokenoveShody,
  zemeZIso,
  type KatalogZaznam,
  type ProfilNazvy,
} from '../../scripts/data08-katalog-krkonose'

const zaznam = (over: Partial<KatalogZaznam> = {}): KatalogZaznam => ({
  Název: 'Erlebachova bouda',
  ISO: 'CZ',
  Pohoří: 'Krkonoše',
  'Nadmořská výška (m)': 1150,
  'Typ objektu': 'bouda',
  Jistota: 'A',
  'Web objektu': 'https://www.erlebachovabouda.cz/',
  'Zdroj 1': 'https://www.krkonose.eu/',
  'Ověřeno k': '2026-07-21',
  ...over,
})

describe('DATA-08 · mapování katalogu', () => {
  it('země z ISO, typ jen když jednoznačný', () => {
    expect(zemeZIso('CZ')).toBe('cz')
    expect(zemeZIso('PL')).toBe('pl')
    expect(mapaTyp('horská útulna')).toBe('utulna')
    expect(mapaTyp('horský hotel')).toBe('horsky-hotel')
    expect(mapaTyp('horský hotel / bouda')).toBeUndefined() // nejednoznačné → redakce
    expect(mapaTyp('bouda')).toBeUndefined()
  })

  it('filtr jen krkonošské záznamy', () => {
    const k = krkonoseZaznamy([zaznam(), zaznam({ Název: 'Chata na Grúni', Pohoří: 'Beskydy' })])
    expect(k).toHaveLength(1)
    expect(k[0].Název).toBe('Erlebachova bouda')
  })

  it('kandidát z katalogu: pole, verified:false, BEZ GPS, jistota ≠ verified', () => {
    const d = kandidatDataZKatalogu(zaznam())
    expect(d).toMatchObject({
      nazev: 'Erlebachova bouda',
      slug: 'erlebachova-bouda',
      zeme: 'cz',
      oblast: 'krkonose',
      vyska: 1150,
      kontakty: { web: 'https://www.erlebachovabouda.cz/' },
    })
    expect(d.lat).toBeUndefined() // katalog nenese GPS
    expect(d.lng).toBeUndefined()
    expect((d.overeniProvoz as { verified: boolean }).verified).toBe(false)
    expect(String(d.interniPoznamky)).toContain('BEZ GPS')
    expect(String(d.interniPoznamky)).toContain('KŘÍŽOVÉM OVĚŘENÍ')
  })
})

describe('DATA-08 · slabá detekce duplikátů', () => {
  it('sdílené významné tokeny: dost pro předložkovou variantu, málo pro jiné boudy', () => {
    expect(tokenoveShody('Bouda u Bílého Labe', 'Bouda Bílé Labe')).toBeGreaterThanOrEqual(2)
    expect(tokenoveShody('Petrova bouda', 'Martinova bouda')).toBeLessThan(2) // jen „bouda"
  })
})

describe('DATA-08 · kategorizace proti našim datům', () => {
  const publikovane: ProfilNazvy[] = [
    { slug: 'lucni-bouda', nazev: 'Luční bouda', nazvy: ['Luční bouda'] },
    { slug: 'bouda-bile-labe', nazev: 'Bouda Bílé Labe', nazvy: ['Bouda Bílé Labe'] },
  ]
  const kandidati: ProfilNazvy[] = [
    { slug: 'vyrovka', nazev: 'Výrovka', nazvy: ['Výrovka', 'Chata Výrovka'] },
  ]

  it('silná shoda → publikovaná / kandidát; předložková varianta → možný duplikát; jinak nový', () => {
    expect(kategorizuj(zaznam({ Název: 'Luční bouda' }), publikovane, kandidati).kind).toBe('publikovana')
    expect(kategorizuj(zaznam({ Název: 'Chata Výrovka' }), publikovane, kandidati).kind).toBe('kandidat')
    expect(kategorizuj(zaznam({ Název: 'Bouda u Bílého Labe' }), publikovane, kandidati).kind).toBe('mozny-duplikat')
    expect(kategorizuj(zaznam({ Název: 'Erlebachova bouda' }), publikovane, kandidati).kind).toBe('novy')
  })
})
