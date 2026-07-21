import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { getChataBySlug } from '@/lib/chaty'
import type { Razitka } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

/**
 * Moderace komunitních razítek: podání přijde jako koncept a na webu se objeví,
 * teprve až ho redakce publikuje. Publikace bez licenčního souhlasu se odmítne.
 */
describe('Moderace razítek (koncept / publikace)', () => {
  let payload: Payload
  let chataId: number | string
  let chataSlug: string
  const razitkaKUklidu: (number | string)[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const chata = await payload.create({
      collection: 'chaty',
      data: { nazev: 'Testovací bouda (moderace)', slug: 'test-moderace-bouda', _status: 'published' } as never,
    })
    chataId = chata.id
    chataSlug = chata.slug!
    // Publikované redakční razítko — na webu má být hned vidět.
    const publ = await payload.create({
      collection: 'razitka',
      data: { nazev: 'Redakční razítko (publ.)', chata: chataId, zpusobZiskani: 'redakce', _status: 'published' } as never,
    })
    razitkaKUklidu.push(publ.id)
  })

  afterAll(async () => {
    for (const id of razitkaKUklidu) await payload.delete({ collection: 'razitka', id }).catch(() => {})
    if (chataId != null) await payload.delete({ collection: 'chaty', id: chataId }).catch(() => {})
  })

  const viditelnaRazitka = async () => {
    const chata = await getChataBySlug(chataSlug)
    return (chata?.razitka?.docs ?? []).filter((r): r is Razitka => typeof r === 'object')
  }

  it('koncept komunitního podání se veřejně nezobrazí, publikované razítko ano', async () => {
    const koncept = await payload.create({
      collection: 'razitka',
      draft: true,
      data: {
        nazev: 'Komunitní podání (koncept)',
        chata: chataId,
        zpusobZiskani: 'komunitni-podani',
        dolozil: 'Tester',
        podani: { hostJmeno: 'Tester', hostEmail: 't@example.com', licencniSouhlas: true },
        _status: 'draft',
      } as never,
    })
    razitkaKUklidu.push(koncept.id)

    const pred = await viditelnaRazitka()
    expect(pred).toHaveLength(1)
    expect(pred[0].nazev).toBe('Redakční razítko (publ.)')

    // Po publikaci konceptu je razítko na webu vidět.
    await payload.update({ collection: 'razitka', id: koncept.id, draft: false, data: { _status: 'published' } as never })
    const po = await viditelnaRazitka()
    expect(po).toHaveLength(2)
    expect(po.map((r) => r.nazev)).toContain('Komunitní podání (koncept)')
  })

  it('komunitní razítko nelze publikovat bez licenčního souhlasu', async () => {
    await expect(
      payload.create({
        collection: 'razitka',
        data: {
          nazev: 'Bez souhlasu',
          chata: chataId,
          zpusobZiskani: 'komunitni-podani',
          podani: { licencniSouhlas: false },
          _status: 'published',
        } as never,
      }),
    ).rejects.toThrow(/licenčního souhlasu/)
  })

  it('převzaté razítko nelze publikovat bez uvedení zdroje (odkazu)', async () => {
    await expect(
      payload.create({
        collection: 'razitka',
        data: {
          nazev: 'Převzaté bez zdroje',
          chata: chataId,
          zpusobZiskani: 'prevzato-se-svolenim',
          prevzeti: { zdroj: 'razitkuj.cz' }, // chybí zdrojUrl → publikace odmítnuta
          _status: 'published',
        } as never,
      }),
    ).rejects.toThrow(/zdroje/)
  })

  it('převzaté razítko se zdrojem se publikuje a nese atribuci', async () => {
    const r = await payload.create({
      collection: 'razitka',
      data: {
        nazev: 'Převzaté se zdrojem',
        chata: chataId,
        zpusobZiskani: 'prevzato-se-svolenim',
        prevzeti: {
          zdroj: 'razitkuj.cz',
          zdrojUrl: 'http://www.razitkuj.cz/misto-test/1',
          svolil: 'Robert Šindler (KiBob), 21. 7. 2026',
        },
        _status: 'published',
      } as never,
    })
    razitkaKUklidu.push(r.id)
    const nase = (await viditelnaRazitka()).find((x) => x.nazev === 'Převzaté se zdrojem')
    expect(nase).toBeTruthy()
    expect(nase?.prevzeti?.zdrojUrl).toContain('razitkuj.cz')
  })
})
