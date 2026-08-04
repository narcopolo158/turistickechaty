/**
 * Ještědský hřbet jako třetí oblast (rozhodnutí Michala 30. 7. 2026:
 * „bereme i ještědský hřbet").
 *
 * Rozhodnutí padlo po nálezu z vydavatelova výpisu známkových míst: tři
 * z pěti tehdejších „jizerských" položek ležely na Ještědském hřbetu, tedy
 * v jiné geomorfologické jednotce a mimo okno Jizerských hor.
 *
 * Testy hlídají to, co by se dalo zavést tiše a špatně: aby okno opravdu
 * krylo hřbet (a ne o kus vedle), aby si oblasti nekradly objekty a aby
 * dokumentace oblasti nesla doklad u čísla, které tvrdí superlativ.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { OBLASTI, oblastDleSlugu } from '../../scripts/oblasti'
import { zanikleChaty, zanikleChatyVse } from '@/lib/zanikle'

const jested = oblastDleSlugu('jestedsky-hrbet')
const vOkne = (o: typeof jested, lat: number, lng: number) =>
  lat >= o.bbox.latMin && lat <= o.bbox.latMax && lng >= o.bbox.lngMin && lng <= o.bbox.lngMax

describe('okno oblasti', () => {
  // Souřadnice jsou orientační body pro kontrolu okna, ne publikované údaje.
  const BODY = {
    'Ještěd': [50.7325, 14.9836],
    'Rašovka': [50.7156, 14.9944],
    'Pláně pod Ještědem': [50.7256, 14.9903],
    'Hodkovice nad Mohelkou': [50.6544, 15.0864],
    'Kryštofovo údolí': [50.7756, 14.8836],
  } as Record<string, [number, number]>

  it('kryje hřbet od Kryštofova údolí po Hodkovice, včetně Ještědu a Rašovky', () => {
    for (const [jmeno, [lat, lng]] of Object.entries(BODY)) {
      expect(vOkne(jested, lat, lng), jmeno).toBe(true)
    }
  })

  it('okraj Liberce je vevnitř schválně — odtud se na hřbet chodí', () => {
    // Bez městského okraje by okno minulo dolní stanici lanovky i parkoviště.
    expect(vOkne(jested, 50.7663, 15.0562)).toBe(true)
  })

  it('Kozákov vevnitř NENÍ — jihovýchodní část celku vedeme u Českého ráje', () => {
    expect(vOkne(jested, 50.625, 15.165)).toBe(false)
    // A Riegrova chata na Kozákově tam skutečně leží jako kandidát Českého ráje.
    expect(existsSync(join(process.cwd(), 'data/kandidati/cesky-raj/riegrova-chata-na-kozakove.yaml'))).toBe(true)
  })

  it('Ještěd nepatří do okna Jizerských hor — proto vlastní oblast', () => {
    expect(vOkne(oblastDleSlugu('jizerske-hory'), 50.7325, 14.9836)).toBe(false)
  })

  it('3D okno je uvnitř okna dotazu, ne mimo', () => {
    expect(jested.bbox3d.latMin).toBeGreaterThanOrEqual(jested.bbox.latMin)
    expect(jested.bbox3d.latMax).toBeLessThanOrEqual(jested.bbox.latMax)
    expect(jested.bbox3d.lngMin).toBeGreaterThanOrEqual(jested.bbox.lngMin)
    expect(jested.bbox3d.lngMax).toBeLessThanOrEqual(jested.bbox.lngMax)
  })

  it('každá oblast má neprázdné okno a vlastní slug', () => {
    const slugy = OBLASTI.map((o) => o.slug)
    expect(new Set(slugy).size).toBe(slugy.length)
    for (const o of OBLASTI) {
      expect(o.bbox.latMin, o.slug).toBeLessThan(o.bbox.latMax)
      expect(o.bbox.lngMin, o.slug).toBeLessThan(o.bbox.lngMax)
    }
  })
})

describe('dokumentace oblasti', () => {
  const yaml = parse(readFileSync(join(process.cwd(), 'data/oblasti/jestedsky-hrbet.yaml'), 'utf8')) as Record<
    string,
    { nazev?: string; vyska?: number; source?: string; verified?: boolean } & Record<string, unknown>
  >

  it('nese slug a název, kterým oblast vedeme', () => {
    expect(yaml.slug).toBe('jestedsky-hrbet')
    expect(yaml.nazev).toBe('Ještědský hřbet')
  })

  it('nejvyšší hora je doložená — superlativ bez zdroje je tvrzení bez opory', () => {
    const hora = yaml.nejvyssiHora as { nazev: string; vyska: number; source: string }
    expect(hora.nazev).toBe('Ještěd')
    expect(hora.vyska).toBe(1012)
    expect(hora.source).toMatch(/cumbres\.cz|mapotic/)
    expect(hora.source.length).toBeGreaterThan(40)
  })

  it('charakteristika má ověření a zůstává verified:false (konvence B)', () => {
    const ov = yaml.overeniCharakteristika as { verified: boolean; checked: string; source: string }
    expect(ov.verified).toBe(false)
    expect(ov.checked).toBe('2026-07-30')
    expect(ov.source).toBeTruthy()
  })

  // Do 4. 8. 2026 tenhle test žádal PRÁZDNÉ pole — podmínka zněla „dokud
  // nejsou doložené profily", a ta je od téhož dne splněná (pět publikovaných
  // profilů, tři střediska). Test proto hlídá pravidlo, ne stav: každý cíl má
  // zdroj a vazba míří na profil, který v oblasti opravdu existuje. Týž tvar
  // má kontrola top cílů u Krkonoš.
  it('každý top cíl nese zdroj a míří na existující profil oblasti', () => {
    const cile = (yaml.topCile ?? []) as unknown as {
      nazev: string
      source?: string
      nejblizChataSlug?: string
    }[]
    expect(cile.length).toBeGreaterThan(0)
    const profily = new Set(
      readdirSync(join(process.cwd(), 'data', 'chaty', 'jestedsky-hrbet'))
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => f.replace(/\.yaml$/, '')),
    )
    for (const c of cile) {
      expect(c.nazev, 'cíl bez názvu').toBeTruthy()
      expect(c.source, `cíl ${c.nazev} bez zdroje`).toBeTruthy()
      if (c.nejblizChataSlug) {
        expect(profily.has(c.nejblizChataSlug), `cíl ${c.nazev}: slug ${c.nejblizChataSlug}`).toBe(true)
      }
    }
  })

  it('interní poznámka drží důvod vzniku i to, proč je v okně kus města', () => {
    const p = String(yaml.interniPoznamky)
    expect(p).toMatch(/známkov/i)
    // Kmen slova, ne tvar: čeština skloňuje („okraj Liberce"), a test na
    // „Liberec" by tu selhal na tomtéž, na čem dnes ráno hláška formuláře.
    expect(p).toMatch(/Liberc/)
  })
})

/**
 * Atlas zaniklých je od 30. 7. 2026 vázaný na oblast.
 *
 * Nová oblast to odhalila okamžitě: stránka Ještědského hřbetu, kde nemáme
 * jediný profil, hlásila „17 zaniklých v Atlasu" a v sekci ukazovala
 * Bodenwiesbaude a Českou boudu na Sněžce — obojí Krkonoše. Číslo z cizího
 * pohoří je horší než nula, protože vypadá jako obsah.
 */
describe('zaniklé chaty patří své oblasti', () => {
  it('oblast bez vlastních dat má prázdný Atlas, ne krkonošský', () => {
    expect(zanikleChaty('jestedsky-hrbet')).toEqual([])
    expect(zanikleChaty('jizerske-hory')).toEqual([])
  })

  it('Krkonoše svá data mají dál', () => {
    expect(zanikleChaty('krkonose').length).toBeGreaterThan(0)
  })

  it('celý Atlas přes oblasti obsahuje aspoň to, co Krkonoše', () => {
    // `/zanikle` a homepage ukazují Atlas vcelku — tam se oblasti sčítají.
    expect(zanikleChatyVse().length).toBeGreaterThanOrEqual(zanikleChaty('krkonose').length)
  })
})

/**
 * Dotažení Jizerských hor na úroveň Krkonoš (zadání Michala 30. 7. 2026:
 * „vyhledej lanovky a střediska a dotáhni pohoří Jizerské hory na stejnou
 * úroveň jako mají teď Krkonoše").
 *
 * Testy hlídají, co se dá pokazit tiše: že střediska nesou doložení a NEMAJÍ
 * vymyšlené souřadnice, a že top cíle mají u každé kóty pramen.
 */
describe('Jizerské hory — střediska a cíle', () => {
  const strediska = readdirSync(join(process.cwd(), 'data/strediska/jizerske-hory'))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => parse(readFileSync(join(process.cwd(), 'data/strediska/jizerske-hory', f), 'utf8')) as Record<string, unknown>)

  it('střediska existují a nesou oblast i výchozí body', () => {
    expect(strediska.length).toBeGreaterThanOrEqual(6)
    for (const s of strediska) {
      expect(s.oblast, String(s.slug)).toBe('jizerske-hory')
      expect((s.vychoziBody as unknown[]).length, String(s.slug)).toBeGreaterThan(0)
    }
  })

  it('GPS se NEVYMÝŠLÍ — chybí, dokud ji nedoloží běh DATA-06', () => {
    // Krkonošská střediska mají bod obce z katalogu výchozích bodů (DATA-06);
    // pro Jizerky ten běh ještě nebyl, takže lat/lng chybí a poznámka říká proč.
    for (const s of strediska) {
      expect(s.lat, String(s.slug)).toBeUndefined()
      expect(String(s.interniPoznamky)).toMatch(/SOUŘADNICE ZÁMĚRNĚ CHYBÍ/u)
    }
  })

  it('každé středisko má doložený zdroj svého zařazení', () => {
    for (const s of strediska) {
      const ov = s.overeniLokace as { source: string; verified: boolean }
      expect(ov.source, String(s.slug)).toMatch(/katalog výchozích bodů/iu)
      expect(ov.verified, 'konvence B — doložené ≠ ověřené').toBe(false)
    }
  })

  it('top cíle mají u každé kóty pramen, a vazba na chatu chybí (nejsou profily)', () => {
    const oblast = parse(readFileSync(join(process.cwd(), 'data/oblasti/jizerske-hory.yaml'), 'utf8')) as {
      topCile: { nazev: string; source?: string; nejblizChataSlug?: string }[]
    }
    expect(oblast.topCile.length).toBeGreaterThanOrEqual(3)
    for (const c of oblast.topCile) {
      expect(c.source, c.nazev).toMatch(/OpenStreetMap/u)
      expect(c.nejblizChataSlug, 'odkaz na kandidáta by vedl na neexistující stránku').toBeUndefined()
    }
  })

  it('lanovky oblasti jsou vygenerované a vedou jen dráhy pro pěší', () => {
    const l = JSON.parse(readFileSync(join(process.cwd(), 'data/lanovky/jizerske-hory.json'), 'utf8')) as {
      lanovky: { nazev: string | null; typ: string }[]
      vleku?: number
    }
    expect(l.lanovky.length).toBeGreaterThan(0)
    // Vleky a dětské pásy do přehledu nepatří — pěšího nevyvezou.
    for (const d of l.lanovky) expect(['chair_lift', 'gondola', 'cable_car', 'mixed_lift']).toContain(d.typ)
  })
})

/**
 * Český ráj — turistická oblast, ne pohoří (návrh oblastí, oddíl 5;
 * rozhodnutí o oblastech přenechal Michal 30. 7. 2026).
 */
describe('Český ráj jako turistická oblast', () => {
  const raj = parse(readFileSync(join(process.cwd(), 'data/oblasti/cesky-raj.yaml'), 'utf8')) as Record<string, unknown>

  it('má úroveň `turisticka-oblast`, ne `pohori`', () => {
    expect(raj.typ).toBe('turisticka-oblast')
  })

  it('nejvyšší horu NEUVÁDÍ — u turistické oblasti by to nic neříkalo', () => {
    expect(raj.nejvyssiHora).toBeUndefined()
  })

  it('charakteristika sama říká, že to pohoří není', () => {
    expect(String(raj.charakteristika)).toMatch(/[Nn]ení to pohoří/u)
  })

  it('oba kandidáti jsou vedení v téhle oblasti', () => {
    const kandidati = readdirSync(join(process.cwd(), 'data/kandidati/cesky-raj'))
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => parse(readFileSync(join(process.cwd(), 'data/kandidati/cesky-raj', f), 'utf8')) as { oblast: string })
    expect(kandidati.length).toBe(2)
    for (const k of kandidati) expect(k.oblast).toBe('cesky-raj')
  })
})
