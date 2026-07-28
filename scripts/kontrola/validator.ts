/**
 * Kontrola datové vrstvy: číselníky profilů, katalog známek, manifest obrázků.
 *
 * Hlídá mimo jiné konvenci B (`verified` musí být `false`, dokud údaj neověří
 * redakce vlastním primárním dotazem) a svolení vydavatele u obrázků známek —
 * povolené jsou JEN domény Turistické známky s.r.o. (turisticke-znamky.cz
 * a znaczki-turystyczne.pl); vizitky Wander Book zatím svolení nemají.
 *
 *   npx tsx scripts/kontrola/validator.ts
 *
 * Návratový kód 1 při jakékoli chybě (vhodné do CI).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { najdiYaml, nactiYaml, seznamMap } from './lib'

const TYP = new Set(['obsluhovana', 'utulna', 'bivak', 'horsky-hotel', 'rozhledna'])
const STAV = new Set(['v-provozu', 'mimo-provoz', 'zanikla'])
const OBC = new Set(['restaurace', 'bufet', 'kiosek'])
const KAT = new Set(['stari', 'vyska', 'velikost', 'gastro', 'jine'])
const OVERENI = new Set([
  'overeniLokace',
  'overeniNocleh',
  'overeniObcerstveni',
  'overeniSluzby',
  'overeniProvoz',
  'overeniPristup',
  'overeniHistorie',
])
const POVOLENE_DOMENY = ['turisticke-znamky.cz', 'znaczki-turystyczne.pl']

const chyby: string[] = []
const E = (m: string) => chyby.push(m)
/** Zápis hodnoty do hlášky (obdoba pythonovského %r). */
const r = (v: unknown) =>
  v === undefined || v === null ? 'None' : typeof v === 'string' ? `'${v}'` : String(v)

// ── 1. profily ──────────────────────────────────────────────────────────────
const profily = najdiYaml('data/chaty')
const slugy = new Set<string>()
for (const f of profily) {
  let d: Record<string, unknown>
  try {
    d = nactiYaml(f)
  } catch (e) {
    E(`${f}: YAML se nenacetl: ${e}`)
    continue
  }
  const slug = d.slug as string | undefined
  const base = basename(f).replace(/\.yaml$/, '')
  if (slug !== base) E(`${f}: slug ${r(slug)} != nazev souboru ${r(base)}`)
  if (slug && slugy.has(slug)) E(`${f}: duplicitni slug ${r(slug)}`)
  if (slug) slugy.add(slug)

  if (!TYP.has(d.typ as string)) E(`${f}: typ ${r(d.typ)} mimo ciselnik`)
  if ('stav' in d && !STAV.has(d.stav as string)) E(`${f}: stav ${r(d.stav)} mimo ciselnik`)
  if ('typObcerstveni' in d && !OBC.has(d.typObcerstveni as string))
    E(`${f}: typObcerstveni ${r(d.typObcerstveni)} mimo ciselnik`)

  for (const z of seznamMap(d.zajimavosti))
    if (!KAT.has(z.kategorie as string))
      E(`${f}: zajimavost kategorie ${r(z.kategorie)} mimo ciselnik`)

  for (const k of Object.keys(d)) {
    if (!k.startsWith('overeni')) continue
    if (!OVERENI.has(k)) {
      E(`${f}: neznamy blok ${r(k)}`)
      continue
    }
    const b = (d[k] ?? {}) as Record<string, unknown>
    if (b.verified !== false)
      E(`${f}/${k}: verified neni False (${r(b.verified)}) — konvence B!`)
    if (!b.source) E(`${f}/${k}: chybi source`)
    if (!b.checked) E(`${f}/${k}: chybi checked`)
  }

  for (const m of seznamMap(d.milniky)) if (!m.udalost) E(`${f}: milnik bez udalosti`)
}

// ── 2. katalog známek ───────────────────────────────────────────────────────
type Produkt = { system: string; url: string; cislo: number }
type KatChata = { slug: string; produkty: Produkt[] }
const kat = JSON.parse(readFileSync('data/znamky-vizitky/krkonose.json', 'utf8')) as {
  pocetChat: number
  chaty: KatChata[]
}
if (kat.pocetChat !== kat.chaty.length)
  E(`krkonose.json: pocetChat ${kat.pocetChat} != ${kat.chaty.length} zaznamu`)

const zn = new Map<string, Produkt[]>()
for (const c of kat.chaty) {
  for (const p of c.produkty) {
    if (p.system !== 'znamka') continue
    if (!zn.has(c.slug)) zn.set(c.slug, [])
    zn.get(c.slug)!.push(p)
    if (!POVOLENE_DOMENY.some((dm) => p.url.includes(dm)))
      E(`krkonose.json/${c.slug}: znamka mimo povolene domeny: ${p.url}`)
  }
}

// ── 3. manifest obrázků (filtr DATA-13) ─────────────────────────────────────
type Obrazek = { slug: string; detailUrl: string; mime: string; cislo: number; soubor: string }
const man = JSON.parse(readFileSync('data/znamky-vizitky/obrazky.json', 'utf8')) as {
  obrazky: Obrazek[]
}
const soubory = new Set<string>()
for (const o of man.obrazky) {
  const s = o.slug
  if (!POVOLENE_DOMENY.some((dm) => o.detailUrl.includes(dm)))
    E(`obrazky.json/${s}: detailUrl mimo povolene domeny (svoleni!): ${o.detailUrl}`)
  if (o.mime !== 'image/png') E(`obrazky.json/${s}: mime ${r(o.mime)}`)
  if (!slugy.has(s)) E(`obrazky.json/${s}: obrazek bez publikovaneho profilu`)
  if (!zn.has(s)) {
    E(`obrazky.json/${s}: obrazek bez zaznamu znamky v krkonose.json`)
  } else {
    const cisla = zn.get(s)!.map((p) => p.cislo)
    if (!cisla.includes(o.cislo))
      E(`obrazky.json/${s}: cislo ${o.cislo} neodpovida katalogu ${cisla}`)
  }
  const p = 'public' + o.soubor
  if (!existsSync(p)) E(`obrazky.json/${s}: chybi soubor ${p}`)
  soubory.add(basename(p))
}

// ── 4. sirotci v public/znamky ──────────────────────────────────────────────
const png = existsSync('public/znamky')
  ? readdirSync('public/znamky')
      .filter((x) => x.endsWith('.png'))
      .sort()
  : []
for (const jm of png)
  if (!soubory.has(jm)) E(`public/znamky: sirotek bez zaznamu v manifestu: ${join('public/znamky', jm)}`)

// ── 5. známky bez obrázku (jen info) ────────────────────────────────────────
const sObrazkem = new Set(man.obrazky.map((o) => o.slug))
const bezObr = [...zn.keys()].filter((s) => !sObrazkem.has(s)).sort()

const kandidati = najdiYaml('data/kandidati')
console.log(
  `publikovano: ${profily.length} | znamky (chaty): ${zn.size} | obrazky: ${man.obrazky.length} | PNG: ${png.length}`,
)
console.log(`kandidati: ${kandidati.length}`)
if (bezObr.length)
  console.log(`info — znamka bez obrazku (${bezObr.length}): ${bezObr.join(', ')}`)
console.log(`CHYB: ${chyby.length}`)
for (const c of chyby) console.log('  ✗', c)
process.exit(chyby.length ? 1 : 0)
