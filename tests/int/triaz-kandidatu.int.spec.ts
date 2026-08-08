/**
 * TRIÁŽNÍ KOŠE — co smí a nesmí spadnout kam (8. 8. 2026).
 *
 * `scripts/triaz-kandidatu.ts` nic nemaže a nikam nezapisuje, takže chyba
 * v něm se neprojeví jako vadná data — projeví se tím, že se práce dělá ve
 * špatném pořadí a nadějný objekt se přehlédne. To se pozná až po dnech,
 * a proto tu stojí test: každý řádek níž je past, do které skript spadl,
 * nebo hranice, kterou nesmí překročit mlčky.
 *
 * Vstupní podoba je táž jako v ostrém běhu: název objektu, interní poznámky
 * kandidáta (odtud se čte OSM tag) a případný redakční `typ`.
 */
import { describe, expect, it } from 'vitest'

import { zatrid } from '../../scripts/triaz-kandidatu'

/** Poznámky kandidáta VŽDY nesou legendu tagů — právě na ní skript kdysi
 *  spadl (hledal v poznámkách holé `alpine_hut` a označil 305 z 305 za
 *  nadějné). Test proto legendu poctivě přikládá u každého případu. */
const LEGENDA =
  'Typ odvozen z OSM tagu tourism=%s (alpine_hut = obsluhovaná, wilderness_hut = útulna).'
const poznamky = (tag: string) => LEGENDA.replace('%s', tag)

describe('triážní koše kandidátů', () => {
  it('legenda tagů v poznámkách nesmí sama dělat kandidáta nadějným', () => {
    // Objekt bez jakéhokoli signálu: jméno nic neříká, tag OSM nenese.
    const [kos] = zatrid('Tahutea', poznamky('undefined'), '')
    expect(kos).toBe('POSOUDIT')
  })

  it('„Hütte" se nesmí trefit doprostřed slova („Bäckerei Hutterer")', () => {
    const [kos, duvod] = zatrid('Bäckerei Hutterer', poznamky('undefined'), '')
    expect(kos).toBe('MIMO')
    expect(duvod).toContain('mimo obor')
  })

  it('silné boudové slovo stačí na koš nadějných', () => {
    expect(zatrid('Berggasthof Lusen', poznamky('guest_house'), '')[0]).toBe('NADEJNE')
    expect(zatrid('Schronisko Samotnia', poznamky('undefined'), '')[0]).toBe('NADEJNE')
    expect(zatrid('Horská chata Koráb', poznamky('undefined'), '')[0]).toBe('NADEJNE')
  })

  it('redakční typ přebíjí jméno i tag', () => {
    const [kos, duvod] = zatrid('Aussichtsturm', poznamky('undefined'), 'rozhledna')
    expect(kos).toBe('NADEJNE')
    expect(duvod).toContain('typ z OSM')
  })

  it('OSM tag horské chaty stačí i beze jména', () => {
    expect(zatrid('Schachtenhaus', poznamky('hut'), '')[0]).toBe('NADEJNE')
    expect(zatrid('Forsthaus Ödwies', poznamky('wilderness_hut'), '')[0]).toBe('NADEJNE')
  })

  /**
   * Tagy pronájmu. Hranice mezi nimi NENÍ úvaha, je to měření nad korpusem
   * — u `chalet` máme protipříklad (Turnerova chata je publikovaný profil),
   * u `apartment` žádný. Kdyby to někdo chtěl sjednotit, tenhle test mu
   * ukáže, co se tím ztratí.
   */
  it('tourism=chalet nechává i slabé „chata" jako rozpor — vzor Turnerovy chaty', () => {
    const [kos, duvod] = zatrid('Turnerova chata', poznamky('chalet'), '')
    expect(kos).toBe('POSOUDIT')
    expect(duvod).toContain('rozpor')
  })

  it('tourism=apartment slabé „chata / chalupa" přebíjí', () => {
    expect(zatrid('Chata Sandra', poznamky('apartment'), '')[0]).toBe('MIMO')
    expect(zatrid('Chalupa na Lipně 1', poznamky('apartment'), '')[0]).toBe('MIMO')
  })

  it('tourism=apartment se silným boudovým slovem je pořád rozpor pro člověka', () => {
    const [kos, duvod] = zatrid(
      'Ferienwohnung Pfenniggeiger Hütte',
      poznamky('apartment'),
      '',
    )
    expect(kos).toBe('POSOUDIT')
    expect(duvod).toContain('Hütte')
  })

  it('tag pronájmu bez jmenného signálu míří mimo klíč', () => {
    expect(zatrid('Zoihäusl', poznamky('chalet'), '')[0]).toBe('MIMO')
    expect(zatrid('Ferienhaus Bär', poznamky('apartment'), '')[0]).toBe('MIMO')
  })
})
