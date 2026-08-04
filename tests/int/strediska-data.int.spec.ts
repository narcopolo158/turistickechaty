/**
 * F1a: datová integrita středisek a metadat oblasti (bez DB — čte přímo
 * commitnuté YAML/JSON, stejně jako je čte seed a build).
 *
 * Hlídá poctivost: každé středisko má doloženou lokaci (source + checked),
 * vazby `vychoziBody` ukazují jen na skutečné body katalogu DATA-06 (překlep
 * ve jméně by tiše rozbil počítané stat-tiles „chat dostupných odtud")
 * a superlativy oblasti (nejvyšší hora) nesou zdroj.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { popisPuvoduVysky } from '@/lib/katalog'

const KOREN = process.cwd()

type StrediskoYaml = {
  nazev?: string
  slug?: string
  zeme?: string
  oblast?: string
  lat?: number
  lng?: number
  vyskaObce?: number
  perex?: string
  overeniPerex?: { source?: string; verified?: boolean; checked?: string }
  overeniLokace?: { source?: string; verified?: boolean; checked?: string }
  vychoziBody?: { nazev: string }[]
}

const nactiStrediska = (oblast = 'krkonose'): { soubor: string; data: StrediskoYaml }[] => {
  const slozka = join(KOREN, 'data', 'strediska', oblast)
  return readdirSync(slozka)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .sort()
    .map((f) => ({
      soubor: `${oblast}/${f}`,
      data: parse(readFileSync(join(slozka, f), 'utf8')) as StrediskoYaml,
    }))
}

/**
 * Střediska VŠECH oblastí. Pravidla o veřejné próze a o doložené výšce
 * nejsou krkonošská specialita — platí wherever středisko vznikne, a od
 * 4. 8. 2026 mají perex i jizerská. Kontroly vázané na krkonošský katalog
 * (bbox, vychoziBody, sedmička z handoffu) zůstávají zvlášť níž.
 */
const vsechnaStrediska = (): { soubor: string; data: StrediskoYaml }[] =>
  readdirSync(join(KOREN, 'data', 'strediska'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => nactiStrediska(d.name))

const katalogBodu = (): Set<string> => {
  const json = JSON.parse(
    readFileSync(join(KOREN, 'data', 'oblasti', 'krkonose', 'vychozi-body-kandidati.json'), 'utf8'),
  ) as { body: { nazev: string }[] }
  return new Set(json.body.map((b) => b.nazev))
}

describe('střediska Krkonoš (data/strediska/krkonose)', () => {
  const strediska = nactiStrediska()

  // Handoff F1 začínal se sedmi středisky (5 CZ + 2 PL). 28. 7. 2026 Michal
  // zadal rozšíření („nepřidáme další střediska jako třeba Rokytnice nad
  // Jizerou?"), a přibylo devět nástupních obcí z přepočtu přístupových tras.
  // Test proto hlídá invarianty a původní sedmičku, ne pevný počet — jinak
  // by padal při každém dalším rozšíření, což je normální vývoj korpusu.
  const HANDOFF_SEDM = ['harrachov', 'janske-lazne', 'karpacz', 'mala-upa', 'pec-pod-snezkou', 'spindleruv-mlyn', 'szklarska-poreba']

  it('drží původní sedmičku z handoffu, slug sedí s názvem souboru a země je z číselníku', () => {
    expect(strediska.length).toBeGreaterThanOrEqual(HANDOFF_SEDM.length)
    for (const slug of HANDOFF_SEDM) {
      expect(strediska.map(({ data }) => data.slug), `chybí středisko ${slug} z handoffu`).toContain(slug)
    }
    for (const { soubor, data } of strediska) {
      expect(soubor).toBe(`krkonose/${data.slug}.yaml`)
      expect(data.nazev).toBeTruthy()
      expect(data.oblast).toBe('krkonose')
      expect(['cz', 'pl']).toContain(data.zeme)
    }
    expect(strediska.filter(({ data }) => data.zeme === 'pl').length).toBeGreaterThanOrEqual(2)
  })

  it('lokace je doložená: GPS + source (OSM/ODbL) + checked; výška obce zatím poctivě chybí', () => {
    for (const { soubor, data } of strediska) {
      expect(typeof data.lat, soubor).toBe('number')
      expect(typeof data.lng, soubor).toBe('number')
      expect(data.overeniLokace?.source, soubor).toMatch(/OpenStreetMap/)
      expect(data.overeniLokace?.source, soubor).toMatch(/ODbL/)
      expect(data.overeniLokace?.verified, soubor).toBe(false)
      expect(data.overeniLokace?.checked, soubor).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('každý vychoziBod ukazuje na skutečný bod katalogu DATA-06 (překlep = tichá díra v datech)', () => {
    const katalog = katalogBodu()
    for (const { soubor, data } of strediska) {
      expect(data.vychoziBody?.length, soubor).toBeGreaterThan(0)
      for (const bod of data.vychoziBody ?? []) {
        expect(katalog.has(bod.nazev), `${soubor}: bod „${bod.nazev}" v katalogu není`).toBe(true)
      }
    }
  })

  it('GPS všech středisek leží v bboxu Krkonoš (hrubá kontrola záměny souřadnic)', () => {
    for (const { soubor, data } of strediska) {
      expect(data.lat, soubor).toBeGreaterThan(50.5)
      expect(data.lat, soubor).toBeLessThan(51.0)
      expect(data.lng, soubor).toBeGreaterThan(15.2)
      expect(data.lng, soubor).toBeLessThan(16.1)
    }
  })
})

describe('střediska všech oblastí — veřejná próza a doložená výška', () => {
  const strediska = vsechnaStrediska()

  // Pojistka proti tiché nule: kdyby se složky přejmenovaly nebo filtr
  // přestal zabírat, testy níž by prošly nad PRÁZDNÝM seznamem a nic by
  // nehlídaly. K 4. 8. 2026 je středisek 22 (16 Krkonoše + 6 Jizerské hory).
  it('načte střediska ze všech oblastí, ne z prázdna', () => {
    expect(strediska.length).toBeGreaterThanOrEqual(22)
    expect(strediska.some(({ soubor }) => soubor.startsWith('jizerske-hory/'))).toBe(true)
    expect(strediska.some(({ soubor }) => soubor.startsWith('krkonose/'))).toBe(true)
  })

  // Perex je veřejná próza — platí pro něj totéž co pro každou věcnou
  // skupinu: bez doloženého pramene se nepíše. Blok `overeniPerex` vznikl
  // 3. 8. 2026, první perexy jsou z 3.–4. 8. 2026 (oficiální portál svazku
  // region-krkonose.cz). Test hlídá pár perex ↔ ověření, ne to, kolik
  // středisek perex má — dopisují se postupně, jak se najdou prameny.
  it('perex existuje jen s blokem ověření (source + verified:false + checked)', () => {
    for (const { soubor, data } of strediska) {
      if (data.perex == null) {
        expect(data.overeniPerex, `${soubor}: ověření perexu bez perexu`).toBeUndefined()
        continue
      }
      expect(data.perex.trim().length, soubor).toBeGreaterThan(0)
      expect(data.overeniPerex?.source, `${soubor}: perex bez doloženého pramene`).toBeTruthy()
      // Konvence B (Michal 21. 7. 2026): převzato z webu → verified zůstává false.
      expect(data.overeniPerex?.verified, soubor).toBe(false)
      expect(data.overeniPerex?.checked, soubor).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // 4. 8. 2026 dostalo perex poslední chybějící středisko (Černý Důl, u kterého
  // se muselo sáhnout po krajském portálu — portál svazku ho nemá). Meta zůstává
  // jako práh, ne jako rovnost: přibyde-li středisko, test upozorní, že mu perex
  // chybí, místo aby mlčel.
  it('perex má každé dnešní středisko (22 k 4. 8. 2026)', () => {
    const bezPerexu = strediska.filter(({ data }) => !data.perex).map(({ soubor }) => soubor)
    expect(bezPerexu, `střediska bez perexu: ${bezPerexu.join(', ')}`).toEqual([])
  })

  it('perex nejmenuje pramen ve větě (pravidlo z 2. 8. 2026 — prameny až pod článkem)', () => {
    // Týž vzor jako ban-scan „vsuvka pramene": „podle …", „dle portálu …".
    const VSUVKA = /\b(podle|dle)\s+(webu|portálu|serveru|stránky|stránek|oficiáln|informačního|katalogu|Kudy)/i
    for (const { soubor, data } of strediska) {
      if (!data.perex) continue
      expect(VSUVKA.test(data.perex), `${soubor}: perex jmenuje pramen ve větě — patří do overeniPerex`).toBe(false)
    }
  })

  // Výška obce smí existovat JEN s dokladem: overeniLokace.source musí výšku
  // výslovně zmiňovat (první doklad 3. 8. 2026: Dolní Dvůr 641 m z oficiálního
  // portálu svazku; ověření proti ČÚZK zůstává otevřené a hlídá ho zmínka
  // o ČÚZK v témže zdroji). Od 4. 8. 2026 pravidlo platí i pro Jizerské hory,
  // kde první dvě výšky mají Bedřichov (707 m) a Lázně Libverda (420 m).
  it('výška obce smí být jen s dokladem ve zdroji lokace a s přiznaným ověřením ČÚZK', () => {
    for (const { soubor, data } of strediska) {
      if (data.vyskaObce == null) continue
      expect(typeof data.vyskaObce, soubor).toBe('number')
      expect(data.overeniLokace?.source, `${soubor}: výška obce bez dokladu ve zdroji lokace`).toMatch(/[Vv]ýšk/)
      expect(data.overeniLokace?.source, `${soubor}: u výšky chybí poznámka o otevřeném ověření ČÚZK`).toMatch(/ČÚZK/)
    }
  })

  // Po prvním ostrém běhu DATA-35 (4. 8. 2026) nese výšku 18 z 22 středisek
  // a většina hodnot pochází z výškového modelu. Špatně zadaný bod nebo
  // rozbitá odpověď API by se projevily nesmyslným číslem — 0 m, 5 000 m —
  // a nikdo by si toho nevšiml, protože pole samo o sobě vypadá vyplněně.
  it('výšky jsou v rozsahu, který dává v našich pohořích smysl', () => {
    const sVyskou = strediska.filter(({ data }) => data.vyskaObce != null)
    expect(sVyskou.length).toBeGreaterThanOrEqual(15)
    for (const { soubor, data } of sVyskou) {
      // Nejníž položené středisko korpusu jsou Lázně Libverda (420 m),
      // nejvýš Malá Úpa (978 m). Meze jsou schválně široké — hlídají překlep
      // a rozbitý dopočet, ne přesnost modelu.
      expect(data.vyskaObce, `${soubor}: výška mimo rozumný rozsah`).toBeGreaterThan(200)
      expect(data.vyskaObce, `${soubor}: výška mimo rozumný rozsah`).toBeLessThan(1650)
      expect(Number.isInteger(data.vyskaObce), `${soubor}: výška není celé číslo`).toBe(true)
    }
  })

  it('zdroj lokace si po dopočtu neprotiřečí (regrese z běhu 4. 8. 2026)', () => {
    // Skript výšku doplnil, ale větu „výška obce zatím nedoložena" po sobě
    // nesmazal — u šesti středisek pak stálo číslo vedle tvrzení, že chybí.
    for (const { soubor, data } of strediska) {
      if (data.vyskaObce == null) continue
      expect(data.overeniLokace?.source, `${soubor}: zdroj tvrdí, že výška chybí, ale v datech je`).not.toMatch(
        /zatím nedoložena/,
      )
    }
  })

  it('mikro-zdroj dlaždice rozliší model od lidského pramene', () => {
    // Dlaždice „výška obce" na mini-stránce musí říct, ČÍM to číslo je.
    const dleModelu = strediska.filter(({ data }) => data.overeniLokace?.source?.includes('Mapy.com Elevation'))
    const dlePramene = strediska.filter(
      ({ data }) => data.vyskaObce != null && !data.overeniLokace?.source?.includes('Mapy.com Elevation'),
    )
    expect(dleModelu.length).toBeGreaterThan(0)
    expect(dlePramene.length).toBeGreaterThan(0)
    for (const { soubor, data } of dleModelu) {
      expect(popisPuvoduVysky(data.overeniLokace?.source), soubor).toMatch(/výškový model/)
    }
    for (const { soubor, data } of dlePramene) {
      expect(popisPuvoduVysky(data.overeniLokace?.source), soubor).toMatch(/doloženého pramene/)
    }
  })

  it('rozpětí výšek se do vyskaObce nezapisuje (rozhodnutí Michala 4. 8. 2026 → DATA-35)', () => {
    // Prameny u obcí rozložených po svahu uvádějí „575 – 1555 m". Kdyby se
    // takové rozpětí propsalo do pole, byl by to vybraný údaj, ne doložený.
    for (const { soubor, data } of strediska) {
      if (data.vyskaObce == null) continue
      const doklad = data.overeniLokace?.source ?? ''
      const rozpetiUVysky = /[Vv]ýšk[^.]{0,80}?\d{3,4}\s*[–-]\s*\d{3,4}/.test(doklad)
      expect(rozpetiUVysky, `${soubor}: výška obce doložená rozpětím, ne jedním číslem`).toBe(false)
    }
  })
})

describe('metadata oblasti Krkonoše (data/oblasti/krkonose.yaml)', () => {
  const oblast = parse(readFileSync(join(KOREN, 'data', 'oblasti', 'krkonose.yaml'), 'utf8')) as {
    slug?: string
    charakteristika?: string
    overeniCharakteristika?: { source?: string; verified?: boolean; checked?: string }
    nejvyssiHora?: { nazev?: string; vyska?: number; source?: string }
    topCile?: { nazev: string; veta?: string; nejblizChataSlug?: string; source?: string }[]
  }

  it('charakteristika má blok ověření se zdrojem (superlativ „nejvyšší pohoří" nese doklad)', () => {
    expect(oblast.charakteristika).toBeTruthy()
    expect(oblast.overeniCharakteristika?.source).toBeTruthy()
    expect(oblast.overeniCharakteristika?.verified).toBe(false)
  })

  it('nejvyšší hora nese název, výšku i zdroj (stat-tile bez zdroje se nevykresluje)', () => {
    expect(oblast.nejvyssiHora?.nazev).toBe('Sněžka')
    expect(oblast.nejvyssiHora?.vyska).toBe(1603)
    expect(oblast.nejvyssiHora?.source).toBeTruthy()
  })

  it('top cíle: každý má zdroj a vazba na chatu ukazuje na existující publikovaný profil', () => {
    const profily = new Set(
      readdirSync(join(KOREN, 'data', 'chaty', 'krkonose'))
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => f.replace(/\.yaml$/, '')),
    )
    expect(oblast.topCile?.length).toBeGreaterThan(0)
    for (const cil of oblast.topCile ?? []) {
      expect(cil.source, cil.nazev).toBeTruthy()
      if (cil.nejblizChataSlug) {
        expect(profily.has(cil.nejblizChataSlug), `cíl ${cil.nazev}: slug ${cil.nejblizChataSlug}`).toBe(true)
      }
    }
  })
})
