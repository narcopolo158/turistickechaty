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

const KOREN = process.cwd()

type StrediskoYaml = {
  nazev?: string
  slug?: string
  zeme?: string
  oblast?: string
  lat?: number
  lng?: number
  vyskaObce?: number
  overeniLokace?: { source?: string; verified?: boolean; checked?: string }
  vychoziBody?: { nazev: string }[]
}

const nactiStrediska = (): { soubor: string; data: StrediskoYaml }[] => {
  const slozka = join(KOREN, 'data', 'strediska', 'krkonose')
  return readdirSync(slozka)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => ({ soubor: f, data: parse(readFileSync(join(slozka, f), 'utf8')) as StrediskoYaml }))
}

const katalogBodu = (): Set<string> => {
  const json = JSON.parse(
    readFileSync(join(KOREN, 'data', 'oblasti', 'krkonose', 'vychozi-body-kandidati.json'), 'utf8'),
  ) as { body: { nazev: string }[] }
  return new Set(json.body.map((b) => b.nazev))
}

describe('střediska Krkonoš (data/strediska/krkonose)', () => {
  const strediska = nactiStrediska()

  it('je jich 7 dle handoffu (5 CZ + 2 PL) a slug sedí s názvem souboru', () => {
    expect(strediska).toHaveLength(7)
    for (const { soubor, data } of strediska) {
      expect(soubor).toBe(`${data.slug}.yaml`)
      expect(data.nazev).toBeTruthy()
      expect(data.oblast).toBe('krkonose')
      expect(['cz', 'pl']).toContain(data.zeme)
    }
    expect(strediska.filter(({ data }) => data.zeme === 'pl')).toHaveLength(2)
  })

  it('lokace je doložená: GPS + source (OSM/ODbL) + checked; výška obce zatím poctivě chybí', () => {
    for (const { soubor, data } of strediska) {
      expect(typeof data.lat, soubor).toBe('number')
      expect(typeof data.lng, soubor).toBe('number')
      expect(data.overeniLokace?.source, soubor).toMatch(/OpenStreetMap/)
      expect(data.overeniLokace?.source, soubor).toMatch(/ODbL/)
      expect(data.overeniLokace?.verified, soubor).toBe(false)
      expect(data.overeniLokace?.checked, soubor).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // Výška obce se zdrojem ČÚZK je zadání F1a — dokud doklad není, pole nesmí existovat.
      expect(data.vyskaObce, `${soubor}: výška obce bez dokladu`).toBeUndefined()
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
