/**
 * DATA-10: turistické známky a vizitky u chat. Spáruje normalizovaný katalog
 * (ChatGPT podklad nad oficiálními seznamy vydavatelů,
 * `data/externi/znamky-vizitky-2026/znamky-vizitky.csv`) s našimi publikovanými
 * chatami a vygeneruje `data/znamky-vizitky/krkonose.json` (dle slugu) pro
 * profil — blok „Sběratelská místa".
 *
 * Poctivost: bere se JEN vrstva číslo + odkaz + fakt (to není chráněné,
 * zveřejnit smíme), vše `verified: false` se zdrojem (oficiální detail URL).
 * NÁHLEDY obrázků se sem nepřebírají — grafika je autorské dílo vydavatele,
 * doplní se až po písemném svolení (jiná cesta, kolekce Fotky „se-svolením").
 *
 *   npx tsx scripts/data10-znamky-vizitky.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { shodaNazvu } from './data05-razitkuj-parovani'
import { parseCSV } from './data06-katalog-vychozi'

const CSV = join(process.cwd(), 'data', 'externi', 'znamky-vizitky-2026', 'znamky-vizitky.csv')
const CHATY = join(process.cwd(), 'data', 'chaty', 'krkonose')
const VYSTUP_ADRESAR = join(process.cwd(), 'data', 'znamky-vizitky')
const VYSTUP_JSON = join(VYSTUP_ADRESAR, 'krkonose.json')

export type Produkt = {
  system: 'znamka' | 'vizitka'
  cislo: string
  nazev: string
  url: string
  stav: string
  jistota: string
  poznamka?: string
}

const prazdne = (v: string | undefined): boolean => !v || !v.trim() || v.trim().toLowerCase() === 'neuvedeno'

/** Řádek vazební tabulky → Produkt (nebo null, když chybí číslo/URL). */
export const produktZRadku = (r: Record<string, string>): Produkt | null => {
  const cislo = (r['Číslo / kód'] ?? '').trim()
  const url = (r['Detail URL'] ?? '').trim()
  if (!cislo || !/^https?:\/\//.test(url)) return null
  return {
    system: (r['Systém'] ?? '').includes('známky') ? 'znamka' : 'vizitka',
    cislo,
    nazev: (r['Oficiální název'] ?? '').trim(),
    url,
    stav: (r['Stav'] ?? '').trim(),
    jistota: (r['Jistota'] ?? '').trim(),
    ...(prazdne(r['Poznámka']) ? {} : { poznamka: r['Poznámka'].trim() }),
  }
}

/** Seskupí produkty katalogu dle názvu chaty (klíč = původní název z katalogu). */
export const nactiKatalog = (csvText: string): Map<string, Produkt[]> => {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return new Map()
  const h = rows[0].map((x) => x.trim())
  const idx = Object.fromEntries(h.map((k, i) => [k, i]))
  const out = new Map<string, Produkt[]>()
  for (const r of rows.slice(1)) {
    const rec: Record<string, string> = {}
    for (const k of h) rec[k] = r[idx[k]] ?? ''
    if (!rec['Název chaty']) continue
    const p = produktZRadku(rec)
    if (!p) continue
    const klic = rec['Název chaty']
    const seznam = out.get(klic)
    if (seznam) seznam.push(p)
    else out.set(klic, [p])
  }
  return out
}

/** Známka první, pak vizitka; v rámci systému dle čísla (číselně, kde to jde). */
const serad = (a: Produkt, b: Produkt): number => {
  if (a.system !== b.system) return a.system === 'znamka' ? -1 : 1
  const na = Number(a.cislo.replace(/\D/g, '')) || 0
  const nb = Number(b.cislo.replace(/\D/g, '')) || 0
  return na - nb
}

type Chata = { slug: string; nazev: string; nazvy: string[] }

const nactiChaty = (): Chata[] => {
  const out: Chata[] = []
  if (!existsSync(CHATY)) return out
  for (const f of readdirSync(CHATY)) {
    if (!f.endsWith('.yaml')) continue
    const y = parse(readFileSync(join(CHATY, f), 'utf8')) as { slug?: string; nazev?: string; aliasy?: { nazev?: string }[] } | null
    if (!y?.nazev) continue
    const aliasy = (y.aliasy ?? []).map((a) => a?.nazev).filter((n): n is string => !!n)
    out.push({ slug: y.slug ?? f.replace(/\.yaml$/, ''), nazev: y.nazev, nazvy: [y.nazev, ...aliasy] })
  }
  return out
}

const main = () => {
  if (!existsSync(CSV)) throw new Error(`Chybí katalog ${CSV}.`)
  const katalog = nactiKatalog(readFileSync(CSV, 'utf8'))
  const chaty = nactiChaty()

  const vystup: { slug: string; nazev: string; produkty: Produkt[] }[] = []
  for (const ch of chaty) {
    const produkty: Produkt[] = []
    for (const [klic, ps] of katalog) if (shodaNazvu(ch.nazvy, klic)) produkty.push(...ps)
    if (!produkty.length) continue
    produkty.sort(serad)
    vystup.push({ slug: ch.slug, nazev: ch.nazev, produkty })
  }

  mkdirSync(VYSTUP_ADRESAR, { recursive: true })
  writeFileSync(
    VYSTUP_JSON,
    JSON.stringify(
      {
        zdroj:
          'Turistické známky (Turistické známky s.r.o., Rýmařov) a turistické vizitky / Wander Card (Wander Book) — katalog ChatGPT nad oficiálními seznamy vydavatelů, verified:false. Jen číslo + odkaz + fakt; obrázky se nepřebírají (autorské dílo — jen se svolením).',
        pocetChat: vystup.length,
        chaty: vystup,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const znamek = vystup.reduce((s, c) => s + c.produkty.filter((p) => p.system === 'znamka').length, 0)
  const vizitek = vystup.reduce((s, c) => s + c.produkty.filter((p) => p.system === 'vizitka').length, 0)
  console.log(`\n## DATA-10 report — známky a vizitky`)
  console.log(`Chat s produktem: ${vystup.length} / ${chaty.length} · známek: ${znamek} · vizitek: ${vizitek}`)
  for (const c of vystup) {
    const popis = c.produkty.map((p) => `${p.system === 'znamka' ? 'známka' : 'vizitka'} ${p.cislo}`).join(' · ')
    console.log(`- ${c.nazev}: ${popis}`)
  }
  console.log(`\nZapsáno: ${VYSTUP_JSON}`)
}

if (process.argv[1]?.endsWith('data10-znamky-vizitky.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
