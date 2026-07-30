/**
 * Komunitní podání fotek středisek a lanovek (zadání Michala 30. 7. 2026:
 * „mám pro některá střediska a lanovky lepší vlastní fotky — jak tam máme
 * komunitní sběr fotek chat a razítek, přidej tam i upload ostatních fotek,
 * ať to můžu editovat sám").
 *
 * Testy míří na tři místa, kde by se rozšíření dalo tiše pokazit:
 *   1. validace pustí nové druhy, ale pořád trvá na PŘEDMĚTU — fotka bez
 *      místa by v adminu skončila jako snímek, u kterého nikdo nepozná, co
 *      na něm je;
 *   2. lanovka nemá kolekci ani jednoznačný slug napříč oblastmi, takže se
 *      posílá jako `oblast/slug` a musí jít najít zpátky;
 *   3. hlášky mluví o tom, co člověk vybírá — „vyber chatu" u fotky lanovky
 *      je návod do zdi.
 */
import { describe, expect, it } from 'vitest'

import { lanovkaPodleSlugu, lanovkySeSlugy } from '@/lib/lanovky'
import { DRUHY_PODANI, PREDMET_DRUHU, zkontrolujPodani } from '@/lib/podani'

const podani = (p: Partial<Parameters<typeof zkontrolujPodani>[0]> = {}) =>
  zkontrolujPodani({
    druh: 'fotka-strediska',
    chataSlug: 'harrachov',
    jmeno: 'Michal',
    email: null,
    poznamka: null,
    souhlas: true,
    past: null,
    soubor: { velikost: 500_000, mime: 'image/jpeg' },
    ...p,
  })

describe('druhy podání', () => {
  it('vedle razítka a fotky chaty projde i fotka střediska a lanovky', () => {
    expect(DRUHY_PODANI).toContain('fotka-strediska')
    expect(DRUHY_PODANI).toContain('fotka-lanovky')
    expect(podani()).toEqual([])
    expect(podani({ druh: 'fotka-lanovky', chataSlug: 'krkonose/protez' })).toEqual([])
  })

  it('neznámý druh neprojde — jinak by se podání uložilo bez předmětu', () => {
    const chyby = podani({ druh: 'fotka-mesta' })
    expect(chyby.length).toBeGreaterThan(0)
    expect(chyby[0]).toMatch(/Vyber, co posíláš/)
  })

  it('předmět je povinný u všech druhů', () => {
    for (const druh of DRUHY_PODANI) {
      expect(podani({ druh, chataSlug: null }).length, druh).toBeGreaterThan(0)
    }
  })

  it('hláška mluví o tom, co člověk vybírá — ne pořád o chatě', () => {
    expect(podani({ druh: 'fotka-lanovky', chataSlug: null }).join(' ')).toContain('lanovku')
    expect(podani({ druh: 'fotka-strediska', chataSlug: null }).join(' ')).toContain('středisko')
    expect(podani({ druh: 'razitko', chataSlug: null }).join(' ')).toContain('chatu')
  })

  it('každý druh ví, jaký předmět k němu patří', () => {
    expect(PREDMET_DRUHU.razitko).toBe('chata')
    expect(PREDMET_DRUHU['fotka-strediska']).toBe('stredisko')
    expect(PREDMET_DRUHU['fotka-lanovky']).toBe('lanovka')
  })

  it('licenční souhlas platí i pro nové druhy — bez něj se nezveřejňuje nic', () => {
    expect(podani({ souhlas: false }).join(' ')).toMatch(/licenčního souhlasu/)
  })
})

describe('lanovka jako předmět podání', () => {
  it('dvojice `oblast/slug` z formuláře najde tutéž dráhu, jakou člověk vybral', () => {
    const draha = lanovkySeSlugy('krkonose').find((l) => l.nazev)!
    const [oblast, slug] = `krkonose/${draha.slug}`.split('/')
    expect(lanovkaPodleSlugu(oblast, slug)?.id).toBe(draha.id)
  })

  it('slug bez oblasti dráhu nenajde — proto se posílá dvojice', () => {
    const draha = lanovkySeSlugy('krkonose').find((l) => l.nazev)!
    expect(lanovkaPodleSlugu('', draha.slug)).toBeNull()
  })
})
