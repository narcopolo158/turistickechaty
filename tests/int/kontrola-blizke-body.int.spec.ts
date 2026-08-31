/**
 * Kontrola blízkých bodů uvnitř oblasti (`scripts/kontrola/blizke-body.ts`).
 *
 * Vznikla z měřené díry mezi třemi existujícími kontrolami (22.–23. 8. 2026):
 * `duplicity-oblasti` porovnává OSM URL, pojistka DATA-38 se ptá jen na JINÉ
 * oblasti a jen při shodném jádru názvu, `kolize-jmen` vidí jen jména. Krkonošský
 * běh z 22. 8. 2026 spadl přesně doprostřed: „Restaurace Labska Bouda" 19,5 m
 * od profilu `labska-bouda`, „Schronisko Górskie Dom Śląski" 4,2 m od
 * `dom-slaski`, „Schronisko Szrenica 1362 m n.p.m." 5,7 m od
 * `schronisko-szrenica` — žádný z těch párů nemá shodné jádro názvu.
 *
 * Testy drží čtyři věci: že se blízký pár s NEshodným jménem najde, že práh
 * odděluje (150 m projde, stejně jako u DATA-38), že rozhodnutý pár z registru
 * jmenovců mlčí a že kontrola nad skutečným repem drží TVAR nálezu.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  BLIZKO_KANDIDATI_M,
  BLIZKO_M,
  najdiBlizkeBody,
  najdiBlizkeKandidaty,
  vzdalenostM,
} from '../../scripts/kontrola/blizke-body'

/** Dočasný kořen se dvěma oblastmi a registrem jmenovců. */
const kostra = () => {
  const koren = mkdtempSync(join(tmpdir(), 'blizke-body-'))
  const kandidati = join(koren, 'kandidati')
  const chaty = join(koren, 'chaty')
  mkdirSync(join(kandidati, 'krkonose'), { recursive: true })
  mkdirSync(join(chaty, 'krkonose'), { recursive: true })
  const registr = join(koren, '_jmenovci.yaml')
  writeFileSync(registr, 'jmenovci: []\n')
  return { koren, kandidati, chaty, registr }
}

const zaznam = (cesta: string, nazev: string, lat: number, lng: number, navic = '') =>
  writeFileSync(cesta, `nazev: ${nazev}\nlat: ${lat}\nlng: ${lng}\n${navic}`)

describe('vzdalenostM', () => {
  it('měří v metrech — 0,001 ° zeměpisné šířky je zhruba 111 m', () => {
    const a = { oblast: 'x', slug: 'a', nazev: null, lat: 50.7, lng: 15.7, osm: null, povyseny: false }
    const b = { ...a, slug: 'b', lat: 50.701 }
    expect(vzdalenostM(a, b)).toBeGreaterThan(105)
    expect(vzdalenostM(a, b)).toBeLessThan(115)
  })
})

describe('najdiBlizkeBody', () => {
  it('najde blízký pár, i když se jména neshodují (vzor Labská bouda)', () => {
    const { kandidati, chaty, registr } = kostra()
    zaznam(
      join(kandidati, 'krkonose', 'restaurace-labska-bouda.yaml'),
      'Restaurace Labska Bouda',
      50.7734,
      15.5387,
    )
    zaznam(join(chaty, 'krkonose', 'labska-bouda.yaml'), 'Labská bouda', 50.77338, 15.53895)
    const pary = najdiBlizkeBody(kandidati, chaty, registr)
    expect(pary).toHaveLength(1)
    expect(pary[0].kandidat.slug).toBe('restaurace-labska-bouda')
    expect(pary[0].profil.slug).toBe('labska-bouda')
    expect(pary[0].vzdalenostM).toBeLessThan(BLIZKO_M)
  })

  it('práh odděluje — 150 m projde (týž práh a týž důvod jako DATA-38)', () => {
    const { kandidati, chaty, registr } = kostra()
    zaznam(join(kandidati, 'krkonose', 'soused.yaml'), 'Soused', 50.7, 15.7)
    zaznam(join(chaty, 'krkonose', 'profil.yaml'), 'Profil', 50.70135, 15.7)
    expect(najdiBlizkeBody(kandidati, chaty, registr)).toHaveLength(0)
  })

  it('pár rozhodnutý v registru jmenovců se nehlásí', () => {
    const { kandidati, chaty, registr } = kostra()
    zaznam(join(kandidati, 'krkonose', 'rozhledna-zaly.yaml'), 'Rozhledna Žalý', 50.6455, 15.5343)
    zaznam(join(chaty, 'krkonose', 'zaly.yaml'), 'Žalý', 50.64552, 15.53432)
    expect(najdiBlizkeBody(kandidati, chaty, registr)).toHaveLength(1)
    writeFileSync(
      registr,
      'jmenovci:\n  - jadro: zaly\n    objekty:\n      - krkonose/rozhledna-zaly\n      - krkonose/zaly\n',
    )
    expect(najdiBlizkeBody(kandidati, chaty, registr)).toHaveLength(0)
  })

  it('kandidát vyřazený v _vyrazeno.yaml (sloučený do profilu) se nehlásí — podle OSM URL', () => {
    const { koren, kandidati, chaty, registr } = kostra()
    zaznam(
      join(kandidati, 'krkonose', 'restaurace-x.yaml'),
      'Restaurace X',
      50.7,
      15.7,
      '# Zdroj: https://www.openstreetmap.org/node/111 · ODbL\n',
    )
    zaznam(join(chaty, 'krkonose', 'profil-x.yaml'), 'Profil X', 50.70005, 15.7)
    // Bez záznamu ve vyřazených se pár hlásí.
    const prazdneVyrazeno = join(koren, '_vyrazeno-prazdne.yaml')
    writeFileSync(prazdneVyrazeno, 'vyrazeno: []\n')
    expect(najdiBlizkeBody(kandidati, chaty, registr, BLIZKO_M, prazdneVyrazeno)).toHaveLength(1)
    // Se sloučením podle OSM URL (i s http:// a bez www.) kontrola mlčí.
    const vyrazeno = join(koren, '_vyrazeno.yaml')
    writeFileSync(
      vyrazeno,
      'vyrazeno:\n  - osm: http://openstreetmap.org/node/111\n    slug: restaurace-x\n    duvod: sloučeno\n',
    )
    expect(najdiBlizkeBody(kandidati, chaty, registr, BLIZKO_M, vyrazeno)).toHaveLength(0)
  })

  it('kandidát vyřazený v _vyrazeno.yaml se nehlásí i podle slugu oblast/slug', () => {
    const { koren, kandidati, chaty, registr } = kostra()
    zaznam(join(kandidati, 'krkonose', 'kandidat-y.yaml'), 'Kandidát Y', 50.7, 15.7)
    zaznam(join(chaty, 'krkonose', 'profil-y.yaml'), 'Profil Y', 50.70005, 15.7)
    const vyrazeno = join(koren, '_vyrazeno.yaml')
    // Holý slug bez lomítka NENÍ jednoznačný klíč a nesmí nic umlčet.
    writeFileSync(vyrazeno, 'vyrazeno:\n  - slug: kandidat-y\n    duvod: nejednoznačné\n')
    expect(najdiBlizkeBody(kandidati, chaty, registr, BLIZKO_M, vyrazeno)).toHaveLength(1)
    // Tvar oblast/slug klíčem je a pár umlčí.
    writeFileSync(vyrazeno, 'vyrazeno:\n  - slug: krkonose/kandidat-y\n    duvod: sloučeno\n')
    expect(najdiBlizkeBody(kandidati, chaty, registr, BLIZKO_M, vyrazeno)).toHaveLength(0)
  })

  it('povýšený kandidát je historický záznam, ne rozpracovanost', () => {
    const { kandidati, chaty, registr } = kostra()
    zaznam(
      join(kandidati, 'krkonose', 'stary.yaml'),
      'Starý',
      50.7,
      15.7,
      '# ═══ POVÝŠENO 27. 7. 2026 → data/chaty/krkonose/jiny.yaml ═══\n',
    )
    zaznam(join(chaty, 'krkonose', 'jiny.yaml'), 'Jiný', 50.70005, 15.7)
    expect(najdiBlizkeBody(kandidati, chaty, registr)).toHaveLength(0)
  })

  it('nad skutečným repem drží TVAR nálezu — páry jsou vždy z jedné oblasti a pod prahem', () => {
    const pary = najdiBlizkeBody()
    for (const p of pary) {
      expect(p.kandidat.oblast).toBe(p.profil.oblast)
      expect(p.vzdalenostM).toBeLessThanOrEqual(BLIZKO_M)
      expect(p.kandidat.slug).not.toBe(p.profil.slug)
    }
    // Seřazeno od nejbližšího — report se čte shora.
    const vzdalenosti = pary.map((p) => p.vzdalenostM)
    expect([...vzdalenosti].sort((a, b) => a - b)).toEqual(vzdalenosti)
  })

  it('bez dat kontrola mlčí, místo aby spadla', () => {
    const koren = mkdtempSync(join(tmpdir(), 'blizke-body-prazdno-'))
    expect(
      najdiBlizkeBody(join(koren, 'kandidati'), join(koren, 'chaty'), join(koren, 'nic.yaml')),
    ).toEqual([])
  })
})

/**
 * KANDIDÁT × KANDIDÁT (doplněno 31. 8. 2026). Druhá polovina téhož měření:
 * `najdiBlizkeBody` výš porovnává kandidáta jen s publikovaným profilem, takže
 * dvojice dvou nepovýšených kandidátů jí propadne celá. Vyžádaly si ji dva
 * nálezy za sebou — `prezesowa-chata` × `szklana-chata` (30–40 m, 30. 8.)
 * a `modrokamenna-bouda` × `penzion-modrokamenna-bouda` (9,8 m, 31. 8.).
 *
 * Práh je tu ale jiný a je změřený: v surové zásobě kandidátů leží celé chatové
 * osady stejných domků (šumavské řady „FH 1–34"), takže na 50 m vychází 384
 * dvojic a 298 z nich je jen ze Šumavy. Na 10 m jich zbývá 8 a jsou to skoro
 * samé pravé dvojice — proto `BLIZKO_KANDIDATI_M = 10`.
 */
describe('najdiBlizkeKandidaty', () => {
  it('najde dvojici dvou nepovýšených kandidátů (vzor Modrokamenná bouda)', () => {
    const { kandidati, registr } = kostra()
    zaznam(join(kandidati, 'krkonose', 'modrokamenna-bouda.yaml'), 'Modrokamenná bouda', 50.643114, 15.7909801)
    zaznam(
      join(kandidati, 'krkonose', 'penzion-modrokamenna-bouda.yaml'),
      'Penzion Modrokamenná bouda',
      50.643114,
      15.7909801,
      '# Zdroj: https://www.openstreetmap.org/node/2399375802\n',
    )
    const pary = najdiBlizkeKandidaty(kandidati, registr)
    expect(pary).toHaveLength(1)
    expect([pary[0].a.slug, pary[0].b.slug].sort()).toEqual([
      'modrokamenna-bouda',
      'penzion-modrokamenna-bouda',
    ])
  })

  it('práh 10 m odděluje — sousední domky chatové osady se nehlásí', () => {
    const { kandidati, registr } = kostra()
    // 0,0004 ° šířky ≈ 44 m: pod starým padesátimetrovým prahem, nad novým.
    zaznam(join(kandidati, 'krkonose', 'fh-1.yaml'), 'FH 1', 50.7, 15.7)
    zaznam(join(kandidati, 'krkonose', 'fh-2.yaml'), 'FH 2', 50.7004, 15.7)
    expect(najdiBlizkeKandidaty(kandidati, registr)).toHaveLength(0)
    expect(najdiBlizkeKandidaty(kandidati, registr, 50)).toHaveLength(1)
  })

  it('rozhodnutý pár z registru jmenovců mlčí', () => {
    const { kandidati, registr } = kostra()
    zaznam(join(kandidati, 'krkonose', 'a.yaml'), 'A', 50.7, 15.7)
    zaznam(join(kandidati, 'krkonose', 'b.yaml'), 'B', 50.70001, 15.7)
    expect(najdiBlizkeKandidaty(kandidati, registr)).toHaveLength(1)
    writeFileSync(
      registr,
      'jmenovci:\n  - jadro: ab\n    objekty:\n      - krkonose/a\n      - krkonose/b\n',
    )
    expect(najdiBlizkeKandidaty(kandidati, registr)).toHaveLength(0)
  })

  it('dva zápisy TÉŽE OSM entity nehlásí — to je práce duplicity-oblasti', () => {
    const { kandidati, registr } = kostra()
    const url = '# Zdroj: https://www.openstreetmap.org/node/111\n'
    zaznam(join(kandidati, 'krkonose', 'a.yaml'), 'A', 50.7, 15.7, url)
    zaznam(join(kandidati, 'krkonose', 'b.yaml'), 'B', 50.70001, 15.7, url)
    expect(najdiBlizkeKandidaty(kandidati, registr)).toHaveLength(0)
  })

  it('nad skutečným repem drží TVAR nálezu — jedna oblast, pod prahem, seřazeno', () => {
    const pary = najdiBlizkeKandidaty()
    for (const p of pary) {
      expect(p.a.oblast).toBe(p.b.oblast)
      expect(p.vzdalenostM).toBeLessThanOrEqual(BLIZKO_KANDIDATI_M)
      expect(p.a.slug).not.toBe(p.b.slug)
    }
    const vzdalenosti = pary.map((p) => p.vzdalenostM)
    expect([...vzdalenosti].sort((a, b) => a - b)).toEqual(vzdalenosti)
  })
})
