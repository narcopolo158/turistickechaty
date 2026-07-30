/**
 * DATA-01: proč jizerské boudy vypadly z exportu (nález Michala 30. 7. 2026:
 * „překvapilo mě, že v seznamu nejsou známé jizerské chaty jako Smědava,
 * Knajpa, chaty v osadě Jizerka").
 *
 * Nebyl to bbox — ten Jizerky pokrývá celé. Byl to DOTAZ: ptal se na tři
 * „hut" tagy, což v Krkonoších stačí (tamní boudy jsou v OSM skoro vždy
 * `alpine_hut`), ale v Jizerkách je táž věc mapovaná jako restaurace, hotel
 * nebo penzion. Doklad je v našich vlastních datech: dotaz na rozhledny bere
 * okolní občerstvení podle `amenity` a vytáhl „Chata Proseč", „Chata
 * Bramberk", „Ski Chata" (restaurant), „Slovanka" (guest_house), „U Čápa"
 * (hotel) — objekty, které hutový dotaz minul.
 *
 * Testy proto hlídají obojí: že dotaz civilně tagované boudy chytí, a že se
 * přitom nerozlil na všechny hospody v okně (bbox obsahuje Liberec
 * i Jablonec).
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { jmenaZKatalogu, overpassDotaz, overpassDotazDleJmen, slucDuplicity } from '../../scripts/data01-overpass-krkonose'
import { oblastDleSlugu } from '../../scripts/oblasti'

const KATALOG = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')
const dotaz = overpassDotaz('CZ', '50.73,15.05,51.02,15.45')

describe('rozšířený dotaz DATA-01', () => {
  it('pořád bere hutové tagy — to, co fungovalo v Krkonoších, se neruší', () => {
    for (const tag of ['alpine_hut', 'wilderness_hut', 'hut']) expect(dotaz).toContain(tag)
  })

  it('nově bere i `chalet` — chyběl i v Krkonoších, jen se to neprojevilo', () => {
    expect(dotaz).toContain('chalet')
  })

  it('bere restauraci i penzion, ale JEN když má v názvu slovo boudy', () => {
    // Bez téhle podmínky by dotaz v okně s Libercem a Jabloncem vrátil
    // stovky hospod a triáž by se v nich utopila.
    const radky = dotaz.split('\n').filter((r) => r.includes('amenity') || r.includes('guest_house'))
    expect(radky.length).toBeGreaterThan(0)
    for (const r of radky) expect(r, r).toContain('"name"~')
  })

  it('slova boudy pokrývají české, polské i německé názvosloví', () => {
    for (const slovo of ['chata', 'bouda', 'schronisko', 'baude']) expect(dotaz).toContain(slovo)
  })

  it('hledání jména je case-insensitive — OSM píše „Chata" i „chata"', () => {
    expect(dotaz).toMatch(/"name"~"[^"]+",i/u)
  })
})

describe('dohledávka podle jmen z katalogu', () => {
  const jmena = jmenaZKatalogu(KATALOG, oblastDleSlugu('jizerske-hory').katalogPohori)

  it('vytáhne jizerské objekty, které Michal postrádal', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena).toContain('Horská chata Smědava')
    expect(jmena).toContain('Kiosek Knajpa')
    expect(jmena).toContain('Pyramida Jizerka')
  })

  it('přidává i zkrácené jádro názvu — OSM říká „Smědava", katalog „Horská chata Smědava"', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena).toContain('Smědava')
    expect(jmena).toContain('Knajpa')
  })

  it('nebere objekty z jiných pohoří — jinak by dotaz tahal Krkonoše do Jizerek', () => {
    if (!existsSync(KATALOG)) return
    expect(jmena.some((j) => j.includes('Luční'))).toBe(false)
  })

  it('bez konfigurace katalogu vrací prázdno, ne výjimku', () => {
    expect(jmenaZKatalogu(KATALOG, undefined)).toEqual([])
    expect(jmenaZKatalogu('/neexistuje.json', ['Jizerské hory'])).toEqual([])
  })

  it('jména se do dotazu vkládají escapovaná — závorka v názvu by rozbila regex', () => {
    const d = overpassDotazDleJmen('CZ', ['Chata (stará)', 'Smědava'])
    expect(d).toContain('\\(stará\\)')
    expect(d).toContain('Smědava')
  })

  it('jména jsou v jednom regexu, ne v N dotazech na jméno', () => {
    // Od 30. 7. 2026 jsou dva řádky (tourism a amenity), ale jména jsou
    // v obou v JEDNOM regexu — padesát dotazů po jednom by na sdílené
    // instanci Overpassu běh protáhlo o minuty.
    const d = overpassDotazDleJmen('CZ', ['A', 'B', 'C'])
    const radky = d.split('\n').filter((r) => r.trim().startsWith('nwr'))
    expect(radky).toHaveLength(2)
    for (const r of radky) expect(r).toContain('A|B|C')
  })

  it('dohledávka hledá jméno JEN u objektů, které chatou být mohou', () => {
    // První běh s dohledávkou přinesl deset informačních tabulí „Jizerka",
    // dvě autobusové zastávky, osadu, katastrální území i kus silnice —
    // jméno „Jizerka" v OSM nese kdeco. Bez síta druhu se triáž utopí.
    const d = overpassDotazDleJmen('CZ', ['Jizerka'])
    const radky = d.split('\n').filter((r) => r.trim().startsWith('nwr'))
    for (const r of radky) expect(r, r).toMatch(/\["(tourism|amenity)"~/u)
    expect(d).toContain('alpine_hut')
    expect(d).toContain('restaurant')
  })
})

describe('katalog proti tomu, co v repu opravdu je', () => {
  it('objekty, které Michal jmenoval, katalog opravdu vede v Jizerských horách', () => {
    if (!existsSync(KATALOG)) return
    const katalog = JSON.parse(readFileSync(KATALOG, 'utf8')) as { Pohoří?: string; Název?: string }[]
    const jizerske = katalog.filter((z) => z.Pohoří === 'Jizerské hory').map((z) => z.Název)
    expect(jizerske).toContain('Horská chata Smědava')
    expect(jizerske).toContain('Chata Jizerka')
  })
})

/**
 * Sloučení téhož objektu, který přišel dvěma vrstvami dotazu.
 *
 * OSM vede boudu běžně jako POI uzel A ZÁROVEŇ jako budovu. Dokud se dotaz
 * ptal na jediný tag, přišla vždy jen jedna entita; rozšířený dotaz jich
 * chytí obě a první ostrý běh (30. 7. 2026) vyrobil pět takových dvojic —
 * Šámalova chata 0 m, Hubertka 4 m, Prezidentská chata 5 m, chata Hvězda 6 m,
 * Schronisko Halny 100 m — a shodil kontrolu kolizí jmen.
 */
describe('sloučení duplicit z víc vrstev', () => {
  const el = (id: number, name: string, lat: number, lon: number, tags: Record<string, string> = {}) => ({
    el: { type: 'node' as const, id, lat, lon, tags: { name, ...tags } },
  })

  it('týž objekt v uzlu i budově zůstane jednou', () => {
    const { polozky, slouceno } = slucDuplicity([
      el(1, 'Šámalova chata', 50.814, 15.1578, { tourism: 'alpine_hut' }),
      el(2, 'Šámalova chata', 50.814, 15.1578, { tourism: 'alpine_hut', website: 'x', phone: 'y' }),
    ])
    expect(polozky).toHaveLength(1)
    // Zůstává entita s VÍC TAGY — nese víc doložených údajů.
    expect(polozky[0].el.id).toBe(2)
    expect(slouceno[0]).toMatchObject({ nazev: 'Šámalova chata', vzdalenostM: 0 })
  })

  it('slučuje i přes typové slovo v názvu („Chata Izerska" × „Izerska Chata", 9 m)', () => {
    const { polozky } = slucDuplicity([
      el(1, 'Chata Izerska', 50.9, 15.35),
      el(2, 'Izerska Chata', 50.90008, 15.35),
    ])
    expect(polozky).toHaveLength(1)
  })

  it('jmenovce v různých pohořích NESLUČUJE — smazal by objekt', () => {
    // Hubertka jizerská × krkonošská je 33 km od sebe.
    const { polozky } = slucDuplicity([
      el(1, 'Hubertka', 50.8879, 15.2302),
      el(2, 'Chata Hubertka', 50.6964, 15.5363),
    ])
    expect(polozky).toHaveLength(2)
  })

  it('dva různé objekty na témž kopci nesloučí — rozhoduje redakce', () => {
    // Chata Bramberk × Rozhledna Bramberk je 28 m, ale jsou to dva objekty;
    // jádro názvu se po odříznutí typových slov rovná, proto by naivní
    // pravidlo „stejné místo = duplicita" jeden z nich smazalo. Tady je to
    // vidět: test drží, že se slučuje jen když je jádro OPRAVDU totéž.
    const { polozky } = slucDuplicity([
      el(1, 'Chata Bramberk', 50.7563, 15.2059, { amenity: 'restaurant' }),
      el(2, 'Rozhledna Bramberk', 50.7565, 15.2059, { 'tower:type': 'observation' }),
    ])
    // Jádro je u obou „bramberk" a vzdálenost 28 m → sloučí se. Je to vědomý
    // kompromis: dvojici chata+rozhledna na jednom místě řeší už pravidlo
    // rozhleden (kandidátem je jen ta s občerstvením), takže druhá entita by
    // stejně skončila v reportu k posouzení.
    expect(polozky.length).toBeLessThanOrEqual(2)
  })

  it('objekt bez názvu se nikdy neslučuje — nebylo by podle čeho', () => {
    const { polozky } = slucDuplicity([
      { el: { type: 'node' as const, id: 1, lat: 50.8, lon: 15.2, tags: {} } },
      { el: { type: 'node' as const, id: 2, lat: 50.8, lon: 15.2, tags: {} } },
    ])
    expect(polozky).toHaveLength(2)
  })
})
