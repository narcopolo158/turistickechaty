/**
 * DATA-11: atlas zaniklých chat Krkonoš (pilíř P4). Parsuje katalog
 * (ChatGPT rešerše, `data/externi/zanikle-chaty-krkonose-2026/zanikle-chaty.csv`)
 * a vygeneruje `data/zanikle/krkonose.json` pro samostatnou stránku „Atlas
 * zaniklých chat". Zaniklé objekty se NEmíchají do živého katalogu/mapy/routingu.
 *
 * Poctivost: vše `verified: false` se zdrojem; „neuvedeno" → null (nedomýšlet).
 * GPS jen tam, kde je katalog uvádí (přesnost přesná/přibližná/odvozená).
 *
 *   npx tsx scripts/data11-zanikle.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { normalizuj } from './data05-razitkuj-parovani'
import { parseCSV } from './data06-katalog-vychozi'

const CSV = join(process.cwd(), 'data', 'externi', 'zanikle-chaty-krkonose-2026', 'zanikle-chaty.csv')
const VYSTUP_ADRESAR = join(process.cwd(), 'data', 'zanikle')
const VYSTUP_JSON = join(VYSTUP_ADRESAR, 'krkonose.json')

/** Bbox Krkonoš — sanity check GPS (mimo = nahlásit, do JSON nezapisovat souřadnice). */
const BBOX = { latMin: 50.55, latMax: 50.9, lngMin: 15.3, lngMax: 15.9 }

export type ZaniklaChata = {
  id: string
  slug: string
  nazev: string
  nazvyHistoricke: string[]
  zeme: string
  oblastCast: string | null
  lat: number | null
  lng: number | null
  gpsPresnost: string | null
  rokVzniku: string | null
  rokZaniku: string | null
  pricinaZaniku: string | null
  coJeDnes: string | null
  patrnePozustatky: string | null
  pristupnost: string | null
  pristupnostPoznamka: string | null
  popis: string | null
  jistota: string
  zdroje: string[]
}

/** Hodnota z katalogu, nebo null (prázdné/„neuvedeno"). */
const h = (v: string | undefined): string | null => {
  const t = (v ?? '').trim()
  return !t || t.toLowerCase() === 'neuvedeno' ? null : t
}

export const zaznamZRadku = (r: Record<string, string>): { z: ZaniklaChata; mimoBbox: boolean } => {
  const latN = Number(r.lat)
  const lngN = Number(r.lng)
  const maGps = Number.isFinite(latN) && Number.isFinite(lngN) && h(r.lat) != null && h(r.lng) != null
  const mimoBbox = maGps && (latN < BBOX.latMin || latN > BBOX.latMax || lngN < BBOX.lngMin || lngN > BBOX.lngMax)
  const zdroje = [
    ...new Set(
      ['gps_zdroj', 'rok_vzniku_zdroj', 'rok_zaniku_zdroj', 'pricina_zdroj', 'co_je_dnes_zdroj', 'popis_zdroj', 'zdroj_1', 'zdroj_2', 'zdroj_3']
        .flatMap((k) => (r[k] ?? '').split(/[\s\n]+/))
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u)),
    ),
  ]
  const nazev = (r.nazev ?? '').trim()
  const z: ZaniklaChata = {
    id: (r.id ?? '').trim(),
    slug: normalizuj(nazev).replace(/\s+/g, '-') || (r.id ?? '').trim().toLowerCase(),
    nazev,
    nazvyHistoricke: (h(r.nazvy_historicke) ?? '')
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean),
    zeme: (r.zeme ?? '').trim(),
    oblastCast: h(r.oblast_cast),
    lat: maGps && !mimoBbox ? latN : null,
    lng: maGps && !mimoBbox ? lngN : null,
    gpsPresnost: h(r.gps_presnost),
    rokVzniku: h(r.rok_vzniku),
    rokZaniku: h(r.rok_zaniku),
    pricinaZaniku: h(r.pricina_zaniku),
    coJeDnes: h(r.co_je_dnes),
    patrnePozustatky: h(r.patrne_pozustatky),
    pristupnost: h(r.pristupnost),
    pristupnostPoznamka: h(r.pristupnost_poznamka),
    popis: h(r.popis),
    jistota: (r.jistota ?? '').trim(),
    zdroje,
  }
  return { z, mimoBbox }
}

export const nactiKatalog = (csvText: string): { chaty: ZaniklaChata[]; mimoBbox: string[] } => {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return { chaty: [], mimoBbox: [] }
  const head = rows[0].map((x) => x.trim().replace(/^﻿/, ''))
  const chaty: ZaniklaChata[] = []
  const mimoBbox: string[] = []
  for (const r of rows.slice(1)) {
    const rec: Record<string, string> = {}
    head.forEach((k, i) => (rec[k] = r[i] ?? ''))
    if (!rec.nazev?.trim()) continue
    const { z, mimoBbox: mimo } = zaznamZRadku(rec)
    if (mimo) mimoBbox.push(`${z.nazev} (${rec.lat},${rec.lng})`)
    chaty.push(z)
  }
  // Česko první, pak dle názvu.
  chaty.sort((a, b) => (a.zeme === b.zeme ? a.nazev.localeCompare(b.nazev, 'cs') : a.zeme === 'Česko' ? -1 : 1))
  return { chaty, mimoBbox }
}

const main = () => {
  if (!existsSync(CSV)) throw new Error(`Chybí katalog ${CSV}.`)
  const { chaty, mimoBbox } = nactiKatalog(readFileSync(CSV, 'utf8'))

  mkdirSync(VYSTUP_ADRESAR, { recursive: true })
  writeFileSync(
    VYSTUP_JSON,
    JSON.stringify(
      {
        zdroj: 'Zaniklé horské chaty Krkonoš/Karkonosze — katalog ChatGPT nad historickými prameny (regionální literatura, KČT/PTTK, zanikleobce.cz, KRNAP/KPN, Wikipedie), verified:false. Doložení = zdrojové URL u záznamu.',
        pozn: 'Samostatná kategorie (stav zaniklá) — nemíchá se do živého katalogu chat, mapy ani routingu.',
        pocet: chaty.length,
        chaty,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const sGps = chaty.filter((c) => c.lat != null).length
  console.log(`\n## DATA-11 report — atlas zaniklých chat`)
  console.log(`Objektů: ${chaty.length} (Česko ${chaty.filter((c) => c.zeme === 'Česko').length}, Polsko ${chaty.filter((c) => c.zeme === 'Polsko').length}) · s GPS: ${sGps} · jistota A/B/C: ${['A', 'B', 'C'].map((j) => chaty.filter((c) => c.jistota === j).length).join('/')}`)
  for (const c of chaty) {
    console.log(`- ${c.nazev} [${c.jistota}] ${c.rokVzniku ?? '?'}–${c.rokZaniku ?? '?'} · ${c.pricinaZaniku ?? '—'}`)
  }
  if (mimoBbox.length) console.log(`\n⚠ Mimo bbox Krkonoš (GPS vynechány): ${mimoBbox.join(', ')}`)
  console.log(`\nKatalog: ${VYSTUP_JSON}`)
}

if (process.argv[1]?.endsWith('data11-zanikle.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
