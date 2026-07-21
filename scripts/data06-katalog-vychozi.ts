/**
 * DATA-06: parser katalogu doporučených výchozích bodů (ChatGPT podklad,
 * `data/externi/vychozi-body-cr-sk-2026/vychozi-body.csv`) + geokódování přes
 * OSM. Katalog dává 1–3 doporučené nástupy na chatu s pořadím, typem, dopravou,
 * zdroji a poznámkou — ale BEZ GPS. Tady se parsují a každý bod se geokóduje
 * proti OSM katalogu výchozích bodů (cross-check, ať sedí na místo).
 *
 * Poctivost: `verified: false`; GPS z OSM (ne z AI); co se nezgeokóduje, se
 * zahodí (radši méně bodů než bod o kus vedle). Zdroje/poznámka jdou na profil
 * jako vodítko.
 */
import { readFileSync } from 'node:fs'

import { normalizuj } from './data05-razitkuj-parovani'

/** Robustní CSV parser (uvozovky, zalomení a čárky uvnitř polí). BOM se odstraní. */
export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let pole = ''
  let vUvozovkach = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (vUvozovkach) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          pole += '"'
          i++
        } else vUvozovkach = false
      } else pole += c
    } else if (c === '"') vUvozovkach = true
    else if (c === ',') {
      row.push(pole)
      pole = ''
    } else if (c === '\n') {
      row.push(pole)
      rows.push(row)
      row = []
      pole = ''
    } else if (c !== '\r') pole += c
  }
  if (pole.length || row.length) {
    row.push(pole)
    rows.push(row)
  }
  return rows
}

export type OsmBod = { nazev: string; typ: string; lat: number; lng: number }

/** Tokeny názvu (normalizované, neprázdné) — pro shodu po celých slovech. */
const tokeny = (s: string): string[] => normalizuj(s).split(' ').filter(Boolean)

/**
 * Geokóduje textový výchozí bod přes OSM: hledá OSM místo, jehož název je v
 * popisu bodu obsažen PO CELÝCH SLOVECH (např. „Szklarská Poręba, Ski Arena" →
 * Szklarska Poręba). Shoda po celých tokenech (ne podřetězci) schválně — jinak
 * by „…stanice lanovky" chybně sedlo na obec „Lánov" (lanov ⊂ lanovky). Krátké
 * tokeny OSM názvu (< 3 znaky, např. „I"/„II" u lanovek) se pro shodu ignorují.
 * Preferuje konkrétní bod (lanovka/železnice/zastávka) před obcí a delší
 * (specifičtější) název; fallback na „nejbližší obec/uzel". null = nezgeokódováno.
 */
export const geokodujBod = (bod: string, uzel: string, osm: OsmBod[]): OsmBod | null => {
  const kandidati = (q: string): OsmBod[] => {
    const qt = new Set(tokeny(q))
    if (!qt.size) return []
    const obsazene = osm.filter((b) => {
      const bt = tokeny(b.nazev)
      const vyznamne = bt.filter((t) => t.length >= 3)
      // aspoň jeden významný token a všechny významné tokeny jsou v popisu bodu
      return vyznamne.length > 0 && vyznamne.every((t) => qt.has(t))
    })
    return [...obsazene].sort((a, b) => {
      const sa = a.typ === 'obec' ? 0 : 1
      const sb = b.typ === 'obec' ? 0 : 1
      if (sa !== sb) return sb - sa // konkrétní bod (ne obec) první
      return normalizuj(b.nazev).length - normalizuj(a.nazev).length // delší (specifičtější) název první
    })
  }
  for (const q of [bod, uzel]) {
    if (!q) continue
    const c = kandidati(q)
    if (c.length) return c[0]
  }
  return null
}

export type DoporucenyBod = {
  poradi: number
  vychoziBod: string
  typ: string
  doprava: string
  sezona: string
  poznamka: string
  zdroje: string[]
  lat: number
  lng: number
}

/**
 * Načte katalog a vrátí doporučené (geokódované) výchozí body podle
 * normalizovaného názvu chaty. Body bez geokódování se vynechají; seřazeno dle
 * pořadí (1 = hlavní).
 */
export const nactiDoporucene = (csvText: string, osm: OsmBod[]): Map<string, DoporucenyBod[]> => {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return new Map()
  const h = rows[0].map((x) => x.trim())
  const ix = (n: string) => h.indexOf(n)
  const iChata = ix('Chata')
  const iUzel = ix('Nejbližší obec / uzel')
  const iPoradi = ix('Pořadí')
  const iBod = ix('Výchozí bod')
  const iTyp = ix('Typ výchozího bodu')
  const iDoprava = ix('Doprava / návaznost')
  const iSezona = ix('Sezóna / omezení')
  const iZdroj = ix('Zdrojové URL')
  const iPozn = ix('Poznámka')

  const dle = new Map<string, DoporucenyBod[]>()
  for (const r of rows.slice(1)) {
    if (r.length < h.length - 1 || !r[iChata]) continue
    const g = geokodujBod(r[iBod] ?? '', r[iUzel] ?? '', osm)
    if (!g) continue
    const zaznam: DoporucenyBod = {
      poradi: Number(r[iPoradi]) || 99,
      vychoziBod: (r[iBod] ?? '').trim(),
      typ: (r[iTyp] ?? '').trim(),
      doprava: (r[iDoprava] ?? '').trim(),
      sezona: (r[iSezona] ?? '').trim(),
      poznamka: (r[iPozn] ?? '').trim(),
      zdroje: (r[iZdroj] ?? '')
        .split(/[\s\n]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u)),
      lat: g.lat,
      lng: g.lng,
    }
    const klic = normalizuj(r[iChata])
    const seznam = dle.get(klic)
    if (seznam) seznam.push(zaznam)
    else dle.set(klic, [zaznam])
  }
  for (const seznam of dle.values()) seznam.sort((a, b) => a.poradi - b.poradi)
  return dle
}

/** Načte katalog ze souboru (pomocník pro CLI/routing). */
export const nactiDoporuceneZeSouboru = (cesta: string, osm: OsmBod[]): Map<string, DoporucenyBod[]> =>
  nactiDoporucene(readFileSync(cesta, 'utf8'), osm)
