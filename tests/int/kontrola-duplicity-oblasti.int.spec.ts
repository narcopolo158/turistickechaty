/**
 * Kontrola duplicit objektů mezi oblastmi (`scripts/kontrola/duplicity-oblasti.ts`,
 * DATA-36 bod (b)).
 *
 * Pojistka v exportu (bod (a)) chrání jen budoucí běhy. Tahle kontrola čte
 * stav repa — a testy drží tři věci, na kterých stojí její užitečnost:
 * že pár ve DVOU oblastech pozná, že dvojici kandidát + profil v JEDNÉ oblasti
 * nehlásí (to je běžný stav po povýšení — u Šumavy tak vypadá 39 profilů)
 * a že citace cizího OSM objektu v rešerši není duplicita.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { najdiDuplicity } from '../../scripts/kontrola/duplicity-oblasti'

/** Minimální kandidát/profil: hlavička s OSM URL + `nazev`, jak je píše DATA-01. */
const zaznam = (nazev: string, osm: string, poznamky: string[] = []) =>
  [
    `# ${nazev} — KANDIDÁT z OpenStreetMap (DATA-01)`,
    `# Zdroj: https://www.${osm} · data © přispěvatelé OpenStreetMap, ODbL 1.0`,
    '',
    `nazev: ${nazev}`,
    ...poznamky.map((p) => `# ${p}`),
    '',
  ].join('\n')

/** Postaví dvojici kořenů (kandidáti, chaty) v dočasném adresáři. */
const repo = (soubory: Array<[string, string, string]>) => {
  const koren = mkdtempSync(join(tmpdir(), 'duplicity-'))
  const kandidati = join(koren, 'kandidati')
  const chaty = join(koren, 'chaty')
  for (const [cesta, jmeno, obsah] of soubory) {
    const adresar = join(koren, cesta)
    mkdirSync(adresar, { recursive: true })
    writeFileSync(join(adresar, jmeno), obsah)
  }
  mkdirSync(kandidati, { recursive: true })
  mkdirSync(chaty, { recursive: true })
  return { kandidati, chaty }
}

describe('najdiDuplicity', () => {
  it('pozná týž OSM objekt vedený ve dvou oblastech', () => {
    // Přesně případ z 8. 8. 2026: dva kliky na DATA-01 pro sousední pohoří
    // založily objekt ze společného pásu oken dvakrát, pokaždé pod jiným slugem.
    const { kandidati, chaty } = repo([
      [
        'kandidati/beskydy',
        'chata-na-solani.yaml',
        zaznam('Chata na Soláni', 'openstreetmap.org/way/111'),
      ],
      [
        'kandidati/javorniky-vsetinske-vrchy',
        'solan-chata-111.yaml',
        zaznam('Soláň — chata', 'openstreetmap.org/way/111'),
      ],
    ])
    const d = najdiDuplicity(kandidati, chaty)
    expect(d).toHaveLength(1)
    expect(d[0]!.osm).toBe('openstreetmap.org/way/111')
    expect(d[0]!.vyskyty.map((v) => `${v.oblast}/${v.slug}`)).toEqual([
      'beskydy/chata-na-solani',
      'javorniky-vsetinske-vrchy/solan-chata-111',
    ])
    // Jméno se hlásí, aby šlo z reportu poznat, jestli jde opravdu o týž dům.
    expect(d[0]!.vyskyty[0]!.nazev).toBe('Chata na Soláni')
  })

  it('pozná i pár, kde jedna oblast má už PROFIL a druhá pořád kandidáta', () => {
    // Tenhle tvar je horší než dvojice kandidátů: profil je na webu, takže
    // objekt tam visí pod jedním pohořím a v datech patří ke dvěma.
    const { kandidati, chaty } = repo([
      ['kandidati/velka-fatra', 'limba.yaml', zaznam('Útulňa Limba', 'openstreetmap.org/node/222')],
      ['chaty/nizke-tatry', 'limba.yaml', zaznam('Útulňa Limba', 'openstreetmap.org/node/222')],
    ])
    const d = najdiDuplicity(kandidati, chaty)
    expect(d).toHaveLength(1)
    expect(d[0]!.vyskyty.map((v) => v.druh).sort()).toEqual(['kandidat', 'profil'])
  })

  it('kandidát a profil v TÉŽE oblasti duplicita není', () => {
    // Běžný stav po povýšení — kandidát zůstává, stav se z něj odvozuje
    // (docs/REDAKCNI-FRONTA.md). Kdyby to kontrola hlásila, utopí se skutečné
    // nálezy v šumu: jen Šumava má takových dvojic 39.
    const { kandidati, chaty } = repo([
      ['kandidati/sumava', 'belveder.yaml', zaznam('Hotel Belveder', 'openstreetmap.org/node/333')],
      ['chaty/sumava', 'belveder.yaml', zaznam('Hotel Belveder', 'openstreetmap.org/node/333')],
    ])
    expect(najdiDuplicity(kandidati, chaty)).toEqual([])
  })

  it('citace cizího OSM objektu v rešerši duplicita není', () => {
    // Doslova případ šumavské `josefova-vez`, která v poznámkách cituje uzel
    // Kletě. Identita je PRVNÍ URL v souboru, tedy hlavička záznamu.
    const { kandidati, chaty } = repo([
      [
        'kandidati/sumava',
        'josefova-vez.yaml',
        zaznam('Josefova věž', 'openstreetmap.org/way/83686493', [
          'Rešerše: vedle stojí Horská chata Klet, https://www.openstreetmap.org/node/360005769',
        ]),
      ],
      [
        'chaty/jestedsky-hrbet',
        'horska-chata-klet.yaml',
        zaznam('Horská chata Klet', 'openstreetmap.org/node/360005769'),
      ],
    ])
    expect(najdiDuplicity(kandidati, chaty)).toEqual([])
  })

  it('soubory s podtržítkem se ignorují — vyřazený objekt duplicita není', () => {
    // `_vyrazeno.yaml` nese OSM URL schválně (aby se objekt nezaložil znovu);
    // brát ho jako výskyt by udělalo duplicitu z každého vyřazení.
    const { kandidati, chaty } = repo([
      ['kandidati/beskydy', 'chata.yaml', zaznam('Chata', 'openstreetmap.org/way/444')],
      [
        'kandidati/javorniky-vsetinske-vrchy',
        '_vyrazeno.yaml',
        zaznam('Chata', 'openstreetmap.org/way/444'),
      ],
    ])
    expect(najdiDuplicity(kandidati, chaty)).toEqual([])
  })

  it('nad skutečným repem je stav čistý — 29 párů z 8. 8. je rozhodnuto rozvodím', () => {
    // Nula je tu ZPRÁVA, ne prázdný test: kdyby příští běh DATA-01 pojistku
    // obešel, tenhle test spadne jako první.
    expect(najdiDuplicity()).toEqual([])
  })
})
