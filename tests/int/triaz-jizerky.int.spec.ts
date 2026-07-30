/**
 * Co smí být PUBLIKOVANÝ profil (triáž jizerských kandidátů, 30. 7. 2026).
 *
 * Triáž 75 kandidátů z DATA-01 rozhodovala podle klíče z CLAUDE.md: „rozhoduje
 * role na trase a občerstvení pro veřejnost, ne typ stavby ani nadmořská
 * výška". Z toho plynula dvě pravidla, která tenhle test drží, aby je příští
 * dávka nepřekročila mlčky:
 *
 *   1. PROFIL MUSÍ MÍT DRUHÝ PRAMEN. Sám o sobě je OSM export jen strojový
 *      výpis — pro Krkonoše se povyšovalo až po křížovém ověření (DATA-03)
 *      a u jizerské dávky je druhým pramenem externí katalog turistických
 *      chat (jeho vlastní pramen nocleh.kct.cz). Kdyby profil stál jen na
 *      OpenStreetMap, tvrdil by víc, než čím je doložený.
 *   2. PROFIL MUSÍ DOLOŽIT SLUŽBU VEŘEJNOSTI. U obsluhované chaty se to
 *      pozná podle `kuchyne: ano`; útulna a bivak slouží jinak (přístřeší),
 *      takže se na ně pravidlo nevztahuje. Bez toho by se do průvodce
 *      dostaly soukromé pronájmy — a právě těch 18 triáž vyřadila.
 *
 * Test schválně NEkontroluje počet profilů: dávky budou přibývat.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

type Profil = {
  nazev?: string
  typ?: string
  kuchyne?: string
  zdroje?: { popis?: string; url?: string }[]
}

const ADRESAR = join(process.cwd(), 'data', 'chaty', 'jizerske-hory')
const profily = readdirSync(ADRESAR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ soubor: f, d: parse(readFileSync(join(ADRESAR, f), 'utf8')) as Profil }))

describe('publikované profily Jizerských hor', () => {
  it('nějaké vůbec existují (jinak test nic nehlídá)', () => {
    expect(profily.length).toBeGreaterThan(0)
  })

  it('každý stojí i na jiném prameni než na OpenStreetMap', () => {
    const jenOsm = profily.filter(({ d }) => {
      const url = (d.zdroje ?? []).map((z) => z.url ?? '')
      return !url.some((u) => u && !u.includes('openstreetmap.org'))
    })
    expect(jenOsm.map((p) => p.soubor)).toEqual([])
  })

  it('obsluhovaná chata má doložené občerstvení pro veřejnost', () => {
    const bezObcerstveni = profily
      .filter(({ d }) => d.typ === 'obsluhovana' && d.kuchyne !== 'ano')
      .map((p) => p.soubor)
    expect(bezObcerstveni).toEqual([])
  })

  it('každý profil má u sebe pramen s popisem, ne holý odkaz', () => {
    const bezPopisu = profily
      .filter(({ d }) => (d.zdroje ?? []).some((z) => !z.popis?.trim()))
      .map((p) => p.soubor)
    expect(bezPopisu).toEqual([])
  })

  /**
   * Vyřazení kandidáti se nesmí vrátit dalším během DATA-01 — to hlídá
   * `data/kandidati/_vyrazeno.yaml`. Test drží jen to, že důvod u záznamu
   * opravdu je: seznam bez důvodů by za měsíc nikdo nedokázal přezkoumat.
   */
  it('vyřazení kandidáti mají u sebe důvod i datum', () => {
    const vyrazeno = parse(
      readFileSync(join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml'), 'utf8'),
    ) as { vyrazeno?: { osm?: string; slug?: string; duvod?: string; checked?: unknown }[] }
    const zaznamy = vyrazeno.vyrazeno ?? []
    expect(zaznamy.length).toBeGreaterThan(0)
    const neuplne = zaznamy.filter((z) => !z.osm || !z.slug || !z.duvod?.trim() || !z.checked)
    expect(neuplne).toEqual([])
  })
})
