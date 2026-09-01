/**
 * KOŠ C — ROZVRSTVENÍ MĚŘENÍM (1. 9. 2026).
 *
 * `scripts/triaz-kos-c.ts` nic nezapisuje do dat, takže se jeho chyba
 * neprojeví jako vadný záznam — projeví se tím, že se osm bud s doloženou
 * hospodou utopí mezi sto dvaceti rekreačními domky a nikdo je nepřečte.
 * Test proto drží tři věci naráz: že se koš C odvozuje z týchž signálů jako
 * tabulka z 22. 8. (kontrolní číslo 131), že se dvojí zápis téhož objektu
 * pozná podle jména I polohy, a že sousední podnik za dvojí zápis neprojde.
 *
 * Testy běží nad ostrými exporty v repu — jsou to statické soubory, ne síť.
 */
import { describe, expect, it } from 'vitest'

import { GASTRO_DOSAH_M, kosC } from '../../scripts/triaz-kos-c'

const vse = kosC('krkonose')
const dle = (slug: string) => vse.find((k) => k.slug === slug)

describe('koš C krkonošské triáže', () => {
  it('odvodí z exportů týchž 131 kandidátů jako tabulka z 22. 8. 2026', () => {
    // Kdyby se vrstvení počítalo nad jinou množinou než původní koš,
    // nedaly by se výsledky srovnat se čtením košů A/B/D/E.
    expect(vse).toHaveLength(131)
  })

  it('do koše C nepustí kandidáta, který má gastro amenity na sobě', () => {
    // Takový kandidát patří do koše B — o to se koš C celý opírá.
    expect(vse.every((k) => k.tourism !== null)).toBe(true)
    expect(dle('restaurace-havlova-bouda')).toBeUndefined()
  })

  it('pozná dvojí zápis téhož objektu: shodné jádro jména A poloha', () => {
    // Děčínská bouda: way/174009063 (guest_house) × node/5341404078
    // (amenity=restaurant), 8 m. Právě tenhle pár slučování DATA-01
    // rozhodlo ve prospěch ubytovacího zápisu a doklad o hospodě zahodilo.
    const decinska = dle('decinska-bouda')
    expect(decinska?.dvojiZapis?.osm).toBe('openstreetmap.org/node/5341404078')
    expect(Math.round(decinska?.dvojiZapis?.vzdalenostM ?? -1)).toBeLessThanOrEqual(10)
  })

  it('dvojí zápis chytí i za hranicí 30 m, když jméno sedí', () => {
    // Amelkowa chata leží 62 m od stejnojmenné restaurace — kdyby se
    // vrstvilo jen podle vzdálenosti, propadla by mezi 120 „bez gastra".
    const amelkowa = dle('amelkowa-chata')
    expect(amelkowa?.dvojiZapis).not.toBeNull()
    expect(amelkowa?.dvojiZapis?.vzdalenostM ?? 0).toBeGreaterThan(GASTRO_DOSAH_M)
  })

  it('soused s jiným jménem za dvojí zápis NEPROJDE', () => {
    // Chata Jeřabinka × Chata Hradečanka, 28 m: v osadě Pomezní Boudy stojí
    // podniků víc a blízkost sama o kandidátovi nedokládá nic. Kdyby tudy
    // prošla, vrstvení by vyrábělo doklady, které v pramenech nejsou.
    const jerabinka = dle('chata-jerabinka')
    expect(jerabinka?.dvojiZapis).toBeNull()
    expect(jerabinka?.gastroM ?? 0).toBeLessThanOrEqual(GASTRO_DOSAH_M)
  })

  it('měří vzdálenost k nejbližšímu středisku, nebo přizná, že nemá k čemu', () => {
    // Proxy pro „ulice ve středisku × dům o samotě". Nesmí tiše vracet 0.
    for (const k of vse) {
      if (k.strediskoM === null) expect(k.strediskoNazev).toBeNull()
      else expect(k.strediskoM).toBeGreaterThan(0)
    }
  })
})
