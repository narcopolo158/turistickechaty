/**
 * DATA-22 — křížová kontrola oficiálního seznamu turistických známek u chat
 * proti našemu korpusu.
 *
 * Vstup: data/externi/znamky-vizitky-2026/turisticke-znamky-cr-vyber.csv
 * (převod z XLSX, který Michal stáhl přímo z webu vydavatele 26. 7. 2026 —
 * tedy PRIMÁRNÍ seznam vydavatele, ne AI kompilace jako znamky-vizitky.csv).
 *
 * Co dělá: pro každou položku seznamu hledá shodu mezi publikovanými profily
 * (data/chaty) a kandidáty (data/kandidati) podle názvu a aliasů. Výstup je
 * SEZNAM K POSOUZENÍ, ne seznam vad — spousta položek jsou rozhledny, sedla
 * a chaty mimo Krkonoše, které do pilotu nepatří.
 *
 *   npx tsx scripts/data22-znamky-oficialni-seznam.ts [--vse]
 *
 * ---------------------------------------------------------------------------
 * ČTYŘI VĚCI, KTERÉ SE PŘI ČTENÍ VÝSTUPU DAJÍ SPLÉST (všechny ověřené 26. 7.
 * 2026; první tři jsem si sám nejdřív zapsal jako „chyba párování" a byly to
 * naopak správné výsledky):
 *
 * (1) SEZNAM JE FILTROVANÝ, TAKŽE NEPŘÍTOMNOST NIC NEDOKAZUJE. Michal jej
 *     stáhl s filtrem „horské chaty a boudy" a výslovně dodává, že ve filtru
 *     samotném může být chyba. Doklad je v našich datech: Pomezní bouda má
 *     doloženou známku č. 673, a v seznamu není. „Publikovaný profil bez
 *     známky v seznamu" tedy NENÍ tvrzení, že objekt známku nemá.
 *
 * (2) 19 „Osada Rezek" se záměrně NEPÁRUJE s krkonose/chata-rezek. Známka je
 *     vydána pro OSADU, ne pro chatu, a profil tu vazbu vědomě neuzavírá
 *     (viz jeho interniPoznamky). Dopsat sem alias by tiše tvrdilo přesně to,
 *     co profil odmítá tvrdit. Nechat nespárované.
 *
 * (3) 22 „Dvoračky - Štumpovka" se ze stejného důvodu nepáruje ani s jedním
 *     objektem: známka nese celý areál o dvou budovách, kdežto my podle
 *     rozhodnutí Michala z 21. 7. 2026 vedeme Dvoračky a Horský hotel
 *     Štumpovka jako dva samostatné objekty.
 *
 * (4) Polské schronisko v seznamu být nemůže — je to seznam český. Deset
 *     polských profilů v posledním výpisu je proto očekávaný stav, ne nález.
 * ---------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs'
import { najdiYaml, nactiYaml } from './kontrola/lib'

type Radek = { cislo: string; nazev: string }

/** Bez diakritiky, malá písmena, jen písmena a číslice oddělené mezerou. */
function klic(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
}

/** Odřízne krajové přívlastky, kterými vydavatel odlišuje stejnojmenné známky. */
const OBLASTI = [
  'krkonose',
  'jizerske hory',
  'beskydy',
  'slezske beskydy',
  'sumava',
  'jeseniky',
  'cesky raj',
  'ceske svycarsko',
  'blansky les',
  'chriby',
  'jestedsky hrbet',
  'lysa hora',
  'liscilouka',
  'lisci louka',
  'pec pod snezkou',
  'spindleruv mlyn',
  'teplicke skaly',
]

function jadro(nazev: string): string {
  let k = klic(nazev)
  for (const o of OBLASTI) {
    k = k.replace(new RegExp(`(^| )${o}( |$)`, 'gu'), ' ')
  }
  // „Šerák 1351m", „Ještěd 1012m", „Ostrý 1044m" — výškový přívlastek
  k = k.replace(/ ?\d{3,4} ?m( |$)/gu, ' ')
  // obecná slova, která vydavatel a my používáme různě
  k = k.replace(/(^| )(chata|horska|horsky|bouda|hotel|turisticka|rozhledna)( |$)/gu, ' $3')
  return k.replace(/\s+/gu, ' ').trim()
}

function nactiCsv(cesta: string): Radek[] {
  const text = readFileSync(cesta, 'utf8').replace(/^﻿/u, '')
  return text
    .split('\n')
    .slice(1)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const i = r.indexOf(',')
      const nazev = r.slice(i + 1).replace(/^"|"$/gu, '').replaceAll('""', '"')
      return { cislo: r.slice(0, i), nazev }
    })
}

type Objekt = { slug: string; oblast: string; jmena: string[]; publikovan: boolean }

function nactiKorpus(): Objekt[] {
  const out: Objekt[] = []
  for (const [dir, pub] of [
    ['data/chaty', true],
    ['data/kandidati', false],
  ] as const) {
    for (const cesta of najdiYaml(dir)) {
      const d = nactiYaml(cesta) as Record<string, unknown>
      if (!d?.nazev) continue
      const jmena = [String(d.nazev)]
      for (const a of (d.aliasy as Array<{ nazev?: string }> | undefined) ?? []) {
        if (a?.nazev) jmena.push(a.nazev)
      }
      out.push({
        slug: String(d.slug ?? ''),
        oblast: String(d.oblast ?? ''),
        jmena,
        publikovan: pub,
      })
    }
  }
  return out
}

const vse = process.argv.includes('--vse')
const seznam = nactiCsv('data/externi/znamky-vizitky-2026/turisticke-znamky-cr-vyber.csv')
const korpus = nactiKorpus()

const index = new Map<string, Objekt[]>()
for (const o of korpus) {
  for (const j of o.jmena) {
    for (const k of [klic(j), jadro(j)]) {
      if (!k) continue
      const arr = index.get(k) ?? []
      if (!arr.includes(o)) arr.push(o)
      index.set(k, arr)
    }
  }
}

const nalezene: string[] = []
const kandidatske: string[] = []
const nezname: string[] = []

for (const r of seznam) {
  const shody = index.get(klic(r.nazev)) ?? index.get(jadro(r.nazev)) ?? []
  const radek = `${r.cislo.padStart(5)}  ${r.nazev}`
  if (!shody.length) {
    nezname.push(radek)
  } else if (shody.some((s) => s.publikovan)) {
    nalezene.push(
      `${radek}  ->  ${shody
        .filter((s) => s.publikovan)
        .map((s) => `${s.oblast}/${s.slug}`)
        .join(', ')}`,
    )
  } else {
    kandidatske.push(
      `${radek}  ->  KANDIDÁT ${shody.map((s) => `${s.oblast}/${s.slug}`).join(', ')}`,
    )
  }
}

console.log(`=== V SEZNAMU VYDAVATELE: ${seznam.length} položek`)
console.log(`\n--- SHODA S PUBLIKOVANÝM PROFILEM (${nalezene.length})`)
for (const r of nalezene) console.log(r)
console.log(`\n--- SHODA JEN S KANDIDÁTEM (${kandidatske.length})`)
for (const r of kandidatske) console.log(r)
console.log(`\n--- BEZ SHODY V KORPUSU (${nezname.length})`)
if (vse) for (const r of nezname) console.log(r)
else console.log('    (spusť s --vse pro výpis; většinou rozhledny a jiná pohoří)')

// Profily, které známku v seznamu vydavatele NEMAJÍ — kandidáti na doplnění
// nebo doklad, že objekt známku prostě nevydává.
const maZnamku = new Set<string>()
for (const r of seznam) {
  for (const o of index.get(klic(r.nazev)) ?? index.get(jadro(r.nazev)) ?? []) {
    maZnamku.add(`${o.oblast}/${o.slug}`)
  }
}
const bezZnamky = korpus
  .filter((o) => o.publikovan && !maZnamku.has(`${o.oblast}/${o.slug}`))
  .map((o) => `${o.oblast}/${o.slug}  (${o.jmena[0]})`)
  .sort()
console.log(`\n--- PUBLIKOVANÉ PROFILY BEZ ZNÁMKY V SEZNAMU (${bezZnamky.length})`)
for (const r of bezZnamky) console.log(r)
