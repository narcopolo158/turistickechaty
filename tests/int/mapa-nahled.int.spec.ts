/**
 * URL statického náhledu mapy (`src/lib/mapa-nahled.ts`).
 *
 * Náhled je ta úspora, kvůli které vznikl (nápad Michala 1. 8. 2026): jeden
 * dotaz místo dvaceti dlaždic. Testuje se proto, co by tu úsporu nebo obrázek
 * pokazilo:
 *  1. že se do URL nedostane tisícibodová trasa (API má strop na délku),
 *  2. že zředění nechá OBA konce — jinak čára končí kus před chatou,
 *  3. že výřez sedí: s trasami se dopočítá z jejich rozsahu, bez nich se
 *     centruje na chatu,
 *  4. že barvy tras jsou tytéž jako v živé mapě — přechod po kliknutí má
 *     vypadat, jako by se mapa probrala, ne jako by se vyměnila,
 *  5. **že si náhled nedržíme** — dokumentace Mapy.com dlouhodobou keš
 *     zakazuje a je to Michalův klíč, ne náš.
 */
import { describe, expect, it } from 'vitest'

import { BARVY_TRAS, urlNahleduMapy, zredCaru } from '@/lib/mapa-nahled'

const cara = (n: number) => Array.from({ length: n }, (_, i) => ({ lat: 50 + i / 1000, lng: 15 + i / 1000 }))

describe('zředění čáry', () => {
  it('krátkou čáru nechá být', () => {
    expect(zredCaru(cara(10))).toHaveLength(10)
  })

  it('dlouhou zředí na limit a nechá oba konce', () => {
    const puvodni = cara(1000)
    const zredena = zredCaru(puvodni, 40)
    expect(zredena).toHaveLength(40)
    expect(zredena[0]).toEqual(puvodni[0])
    expect(zredena.at(-1)).toEqual(puvodni.at(-1))
  })
})

describe('URL statické mapy', () => {
  const KLIC = 'zkusebni-klic'

  it('bez tras se centruje na chatu s rozumným přiblížením', () => {
    const url = new URL(urlNahleduMapy(KLIC, { lat: 50.7326, lng: 15.696 }))
    expect(url.searchParams.get('lat')).toBe('50.73260')
    expect(url.searchParams.get('zoom')).toBe('14')
    expect(url.searchParams.get('mapset')).toBe('outdoor')
    expect(url.searchParams.getAll('markers')).toHaveLength(1)
  })

  /** S trasami má výřez ukázat, ODKUD se k chatě chodí — ne jen střechu. */
  it('s trasami nechá výřez dopočítat API a přidá čáry v barvách živé mapy', () => {
    const url = new URL(urlNahleduMapy(KLIC, { lat: 50.7, lng: 15.7, trasy: [{ body: cara(500) }, { body: cara(300) }] }))
    expect(url.searchParams.get('zoom')).toBeNull()
    expect(url.searchParams.get('padding')).toBe('28')
    const tvary = url.searchParams.getAll('shapes')
    expect(tvary).toHaveLength(2)
    expect(tvary[0]).toContain(`color:${BARVY_TRAS[0]}`)
    expect(tvary[1]).toContain(`color:${BARVY_TRAS[1]}`)
    // Souřadnice jdou v pořadí lon,lat — obráceně by mapa ukázala Somálsko.
    expect(tvary[0]).toMatch(/path:\[\(15\.\d+,50\.\d+;/)
  })

  it('trasa bez dvou bodů se nekreslí (čára z jednoho bodu není čára)', () => {
    const url = new URL(urlNahleduMapy(KLIC, { lat: 50.7, lng: 15.7, trasy: [{ body: cara(1) }] }))
    expect(url.searchParams.getAll('shapes')).toHaveLength(0)
    expect(url.searchParams.get('zoom')).toBe('14')
  })

  it('URL zůstane v rozumné délce i u dlouhých tras', () => {
    const url = urlNahleduMapy(KLIC, { lat: 50.7, lng: 15.7, trasy: [{ body: cara(5000) }, { body: cara(5000) }, { body: cara(5000) }] })
    expect(url.length).toBeLessThan(4000)
  })

  it('bere nejvýš tři trasy — čtvrtá už je na náhledu jen šum', () => {
    const url = new URL(
      urlNahleduMapy(KLIC, { lat: 50.7, lng: 15.7, trasy: [1, 2, 3, 4, 5].map(() => ({ body: cara(50) })) }),
    )
    expect(url.searchParams.getAll('shapes')).toHaveLength(3)
  })

  it('klíč je v URL právě jednou a nikde jinde než v parametru', () => {
    const url = urlNahleduMapy(KLIC, { lat: 50.7, lng: 15.7 })
    expect(url.split(KLIC)).toHaveLength(2)
    expect(new URL(url).searchParams.get('apikey')).toBe(KLIC)
  })
})

/**
 * LICENČNÍ POJISTKA. Dokumentace statických map Mapy.com říká: „Images are
 * intended for online display only. Long-term storage or caching is not
 * permitted." Kdyby někdo (i já za měsíc) chtěl „ušetřit" tím, že si obrázek
 * necháme na serveru na týden, spadne tenhle test dřív, než to dojede do
 * produkce na Michalův klíč.
 */
describe('route náhledu si obrázek nedrží', () => {
  it('nemá serverovou keš a prohlížeči povolí jen krátké soukromé držení', async () => {
    const modul = await import('@/app/api/mapa-nahled/[slug]/route')
    expect(modul.revalidate).toBe(0)

    const zdroj = await import('node:fs/promises').then((fs) =>
      fs.readFile('src/app/api/mapa-nahled/[slug]/route.ts', 'utf8'),
    )
    expect(zdroj).toMatch(/'cache-control': `private, max-age=\$\{KES_PROHLIZECE\}`/)
    expect(zdroj).not.toMatch(/max-age=\d{5,}|stale-while-revalidate/)
  })
})
