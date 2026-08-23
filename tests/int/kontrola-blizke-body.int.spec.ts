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

import { BLIZKO_M, najdiBlizkeBody, vzdalenostM } from '../../scripts/kontrola/blizke-body'

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
    const a = { oblast: 'x', slug: 'a', nazev: null, lat: 50.7, lng: 15.7, povyseny: false }
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
