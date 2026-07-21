/**
 * DATA-08: zapojení externího katalogu turistických chat ČR/SK/přeshraniční
 * (307 záznamů, jistota A/B/C, dva zdroje na řádek) do našich Krkonoš. Katalog
 * je AI kompilace (vypracoval ChatGPT, zadal Michal) — viz
 * `data/externi/katalog-cr-sk-2026/PUVOD.md`: bereme ho jako VODICÍ / kandidátní
 * zdroj, ne jako verifikaci; citace katalogu neplatí doslova (fakta často sedí,
 * ale uvedený odkaz nemusí údaj podkládat) → primární zdroj se dokládá zvlášť.
 *
 * POCTIVOST (CLAUDE.md, konvence B): katalogová „jistota A" NENÍ naše
 * `verified: true`. Vše převzaté je `verified: false` se `source` odkazujícím na
 * PŮVODNÍ zdroje katalogu (krkonose.eu, kct.cz, oficiální weby) + poznámkou, že
 * jde o externí katalog k **křížovému ověření** před povýšením. Katalog nenese
 * GPS → noví kandidáti jsou bez souřadnic (doplní se z OSM/ručně).
 *
 * Co dělá (jen Krkonoše, pilot):
 *   • roztřídí katalogové chaty proti našim publikovaným (`data/chaty`) i
 *     kandidátům (`data/kandidati/krkonose`) — silná shoda názvu + slabá
 *     detekce možných duplikátů (předložky u/na/pod matou substring);
 *   • pro **opravdu nové** (ani chata, ani kandidát, ani možný duplikát) založí
 *     kandidátní YAML se zdroji z katalogu;
 *   • pro **shody** (publikované i kandidáty) sepíše report obohacení
 *     (`docs/DATA-08-katalog-krkonose.md`) — co katalog nabízí navíc (výška,
 *     web, provoz, kapacita, zdroje…), aby se to dalo doplnit vědomě, ne naslepo.
 *
 * Vstup je commitnutý v repu (`data/externi/katalog-cr-sk-2026/katalog.json`),
 * takže běh je reprodukovatelný. Lze předat i jinou cestu argumentem.
 *   npx tsx scripts/data08-katalog-krkonose.ts [cesta/katalog.json]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse, stringify } from 'yaml'

import { slugify } from '../src/fields/slug'
import { nactiChaty, normalizuj, shodaNazvu } from './data05-razitkuj-parovani'

const KANDIDATI_ADRESAR = join(process.cwd(), 'data', 'kandidati', 'krkonose')
const REPORT_MD = join(process.cwd(), 'docs', 'DATA-08-katalog-krkonose.md')
const VYCHOZI_VSTUP = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')

/** Řádek katalogu (klíče = záhlaví listu). Jen pole, která používáme. */
export type KatalogZaznam = {
  Název: string
  'Alternativní název'?: string
  ISO?: string
  Pohoří?: string
  'Oblast / část pohoří'?: string
  'Nejbližší obec nebo uzel'?: string
  'Nadmořská výška (m)'?: number | string | null
  'Typ objektu'?: string
  'Kapacita lůžek'?: number | string | null
  Stravování?: string
  Provoz?: string
  Přístup?: string
  Stav?: string
  Jistota?: string
  'Web objektu'?: string
  'Zdroj 1'?: string
  'Zdroj 2'?: string
  'Poznámka pro katalog'?: string
  'Ověřeno k'?: string
}

export const zemeZIso = (iso: string | undefined): string => (iso ?? '').trim().toLowerCase() || 'cz'

/** Typ objektu z katalogu → náš enum, jen když je jednoznačný (jinak redakce). */
export const mapaTyp = (typObjektu: string | undefined): 'utulna' | 'horsky-hotel' | undefined => {
  const s = (typObjektu ?? '').toLowerCase()
  if (s.includes('útuln') || s.includes('utuln')) return 'utulna'
  if (s.includes('hotel') && !s.includes('bouda') && !s.includes('chata') && !s.includes('schronisk')) return 'horsky-hotel'
  return undefined
}

/** Jen krkonošské záznamy katalogu. */
export const krkonoseZaznamy = (katalog: KatalogZaznam[]): KatalogZaznam[] =>
  katalog.filter((r) => (r.Pohoří ?? '').toLowerCase().includes('krkono'))

const cislo = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

/** Sestaví data kandidáta z katalogového řádku (bez GPS — katalog ji nenese). */
export const kandidatDataZKatalogu = (rec: KatalogZaznam): Record<string, unknown> => {
  const checked = (rec['Ověřeno k'] ?? '').slice(0, 10) || '2026-07-21'
  const zdroje = [rec['Zdroj 1'], rec['Zdroj 2']].map((z) => (z ?? '').trim()).filter(Boolean)
  const source = `Externí katalog turistických chat ČR/SK (2026) — jistota ${rec.Jistota ?? '?'}${zdroje.length ? `; původní zdroje: ${zdroje.join('; ')}` : ''}`

  const data: Record<string, unknown> = {
    nazev: rec.Název,
    slug: slugify(rec.Název),
    zeme: zemeZIso(rec.ISO),
    oblast: 'krkonose',
  }
  const typ = mapaTyp(rec['Typ objektu'])
  if (typ) data.typ = typ

  const alt = (rec['Alternativní název'] ?? '').trim()
  if (alt) data.aliasy = [{ nazev: alt, poznamka: 'alternativní název (externí katalog ČR/SK)' }]

  const vyska = cislo(rec['Nadmořská výška (m)'])
  if (vyska != null) data.vyska = vyska
  const obec = (rec['Nejbližší obec nebo uzel'] ?? '').trim()
  if (obec) data.obec = obec

  const web = (rec['Web objektu'] ?? '').trim()
  if (web) data.kontakty = { web }
  data.overeniProvoz = { source, verified: false, checked }

  const poznamky = [
    `KANDIDÁT z externího katalogu ČR/SK (kámoš, jistota ${rec.Jistota ?? '?'}, ověřeno k ${checked}) — na web povýšit až po KŘÍŽOVÉM OVĚŘENÍ. Vše verified:false. „Jistota A" katalogu ≠ naše verified.`,
    'BEZ GPS — souřadnice doplnit z OSM nebo ručně (katalog je nenese).',
    rec['Typ objektu'] ? `Typ dle katalogu: ${rec['Typ objektu']}` : null,
    rec.Provoz ? `Provoz dle katalogu: ${rec.Provoz}` : null,
    rec['Kapacita lůžek'] ? `Kapacita dle katalogu: ${rec['Kapacita lůžek']}` : null,
    rec.Stravování ? `Stravování dle katalogu: ${rec.Stravování}` : null,
    rec.Přístup ? `Přístup dle katalogu: ${rec.Přístup}` : null,
    rec['Poznámka pro katalog'] ? `Poznámka z katalogu: ${rec['Poznámka pro katalog']}` : null,
  ].filter(Boolean)
  data.interniPoznamky = poznamky.join('\n')
  return data
}

/** YAML kandidáta s hlavičkovým komentářem (zdroj, výhrada). */
export const yamlKandidat = (data: Record<string, unknown>, rec: KatalogZaznam): string =>
  [
    `# ${data.nazev} — KANDIDÁT z externího katalogu ČR/SK (jistota ${rec.Jistota ?? '?'}, ověřeno k ${(rec['Ověřeno k'] ?? '').slice(0, 10) || '2026-07-21'})`,
    '# Vše verified: false — převzato z externího katalogu (kompilace), NEověřeno námi.',
    '# „Jistota A" katalogu ≠ naše verified. Před povýšením do data/chaty/ křížově',
    '# ověřit z původních zdrojů a doplnit GPS (katalog ji nenese). Nic nedomýšlet!',
    '',
    stringify(data),
  ].join('\n')

// ── Kategorizace proti našim datům ──────────────────────────────────────────

export type ProfilNazvy = { slug: string; nazev: string; nazvy: string[] }

/** Významné tokeny názvu (délka ≥ 4) — pro slabou detekci možných duplikátů. */
export const vyznamneTokeny = (s: string): string[] => normalizuj(s).split(' ').filter((t) => t.length >= 4)

/** Počet sdílených významných tokenů dvou názvů. */
export const tokenoveShody = (a: string, b: string): number => {
  const ta = new Set(vyznamneTokeny(a))
  return vyznamneTokeny(b).filter((t) => ta.has(t)).length
}

export type Kategorie =
  | { kind: 'publikovana'; nazev: string }
  | { kind: 'kandidat'; nazev: string }
  | { kind: 'mozny-duplikat'; nazev: string }
  | { kind: 'novy' }

/**
 * Zařadí katalogový záznam: silná shoda názvu (i alias) → publikovaná/kandidát;
 * jinak slabá shoda (≥2 sdílené významné tokeny, např. „Bouda u Bílého Labe" vs.
 * „Bouda Bílé Labe") → možný duplikát k ruční kontrole; jinak nový.
 */
export const kategorizuj = (rec: KatalogZaznam, publikovane: ProfilNazvy[], kandidati: ProfilNazvy[]): Kategorie => {
  const jmena = [rec.Název, rec['Alternativní název'] ?? ''].filter(Boolean)
  const silna = (arr: ProfilNazvy[]) => arr.find((p) => jmena.some((j) => shodaNazvu(p.nazvy, j)))

  const pub = silna(publikovane)
  if (pub) return { kind: 'publikovana', nazev: pub.nazev }
  const kand = silna(kandidati)
  if (kand) return { kind: 'kandidat', nazev: kand.nazev }

  const slaba = [...publikovane, ...kandidati].find((p) => p.nazvy.some((n) => tokenoveShody(rec.Název, n) >= 2))
  if (slaba) return { kind: 'mozny-duplikat', nazev: slaba.nazev }
  return { kind: 'novy' }
}

// ── Načtení našich profilů ──────────────────────────────────────────────────

const nactiProfilyZAdresare = (dir: string): ProfilNazvy[] => {
  if (!existsSync(dir)) return []
  const out: ProfilNazvy[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const y = parse(readFileSync(join(dir, f), 'utf8')) as {
      nazev?: string
      slug?: string
      aliasy?: { nazev?: string }[]
    } | null
    if (!y?.nazev) continue
    const nazvy = [y.nazev, ...(y.aliasy ?? []).map((a) => a?.nazev).filter((x): x is string => !!x)]
    out.push({ slug: y.slug ?? f.replace(/\.yaml$/, ''), nazev: y.nazev, nazvy })
  }
  return out
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const nabidkaObohaceni = (rec: KatalogZaznam): string => {
  const casti = [
    rec['Nadmořská výška (m)'] ? `výška ${rec['Nadmořská výška (m)']} m` : null,
    (rec['Web objektu'] ?? '').trim() ? `web ${rec['Web objektu']}` : null,
    rec.Provoz ? `provoz ${rec.Provoz}` : null,
    rec['Kapacita lůžek'] ? `kapacita ${rec['Kapacita lůžek']}` : null,
    rec.Stravování ? `stravování ${rec.Stravování}` : null,
    rec['Poznámka pro katalog'] ? `pozn.: ${rec['Poznámka pro katalog']}` : null,
  ].filter(Boolean)
  const zdroje = [rec['Zdroj 1'], rec['Zdroj 2']].filter(Boolean).join('; ')
  return `${casti.join(' · ')}${zdroje ? ` — zdroje: ${zdroje}` : ''} (jistota ${rec.Jistota ?? '?'})`
}

const main = () => {
  const vstup = process.argv[2] ?? VYCHOZI_VSTUP
  if (!existsSync(vstup)) throw new Error(`Vstupní katalog ${vstup} neexistuje — předej cestu argumentem.`)
  const katalog = JSON.parse(readFileSync(vstup, 'utf8')) as KatalogZaznam[]
  const krk = krkonoseZaznamy(katalog)

  const publikovane: ProfilNazvy[] = nactiChaty().map((c) => ({ slug: c.slug, nazev: c.nazev, nazvy: c.nazvy }))
  const kandidati = nactiProfilyZAdresare(KANDIDATI_ADRESAR)

  const obohatPubl: { rec: KatalogZaznam; nazev: string }[] = []
  const obohatKand: { rec: KatalogZaznam; nazev: string }[] = []
  const dupl: { rec: KatalogZaznam; nazev: string }[] = []
  const zalozeno: string[] = []
  const preskoceno: string[] = []

  mkdirSync(KANDIDATI_ADRESAR, { recursive: true })
  for (const rec of krk) {
    const k = kategorizuj(rec, publikovane, kandidati)
    if (k.kind === 'publikovana') obohatPubl.push({ rec, nazev: k.nazev })
    else if (k.kind === 'kandidat') obohatKand.push({ rec, nazev: k.nazev })
    else if (k.kind === 'mozny-duplikat') dupl.push({ rec, nazev: k.nazev })
    else {
      const data = kandidatDataZKatalogu(rec)
      const cesta = join(KANDIDATI_ADRESAR, `${data.slug as string}.yaml`)
      if (existsSync(cesta)) {
        preskoceno.push(`${rec.Název} (${data.slug}.yaml už existuje)`)
        continue
      }
      writeFileSync(cesta, yamlKandidat(data, rec), 'utf8')
      zalozeno.push(`${rec.Název} → ${data.slug}.yaml`)
    }
  }

  // Report obohacení + přehled
  const md: string[] = [
    '# DATA-08 — externí katalog ČR/SK v Krkonoších',
    '',
    `Zdroj: externí katalog turistických chat ČR/SK (kompilace „od kámoše", ${krk.length} krkonošských záznamů). **Jistota A/B/C katalogu ≠ naše \`verified: true\`** — vše převzaté je \`verified: false\` se zdrojem a před povýšením se křížově ověří. Katalog nenese GPS.`,
    '',
    `## Založení noví kandidáti (${zalozeno.length})`,
    ...(zalozeno.length ? zalozeno.map((z) => `- ${z}`) : ['- (žádní)']),
    '',
    `## Možné duplikáty — NEzaložené, k ruční kontrole (${dupl.length})`,
    ...(dupl.length ? dupl.map((d) => `- „${d.rec.Název}" ~ naše „${d.nazev}" → ${nabidkaObohaceni(d.rec)}`) : ['- (žádné)']),
    '',
    `## Obohacení publikovaných chat (${obohatPubl.length}) — doplnit vědomě po kontrole`,
    ...(obohatPubl.length ? obohatPubl.map((o) => `- **${o.nazev}**: ${nabidkaObohaceni(o.rec)}`) : ['- (žádné)']),
    '',
    `## Obohacení kandidátů (${obohatKand.length}) — doplnit do kandidátních YAML`,
    ...(obohatKand.length ? obohatKand.map((o) => `- **${o.nazev}**: ${nabidkaObohaceni(o.rec)}`) : ['- (žádné)']),
    ...(preskoceno.length ? ['', `## Přeskočeno (slug už existuje) (${preskoceno.length})`, ...preskoceno.map((p) => `- ${p}`)] : []),
    '',
  ]
  mkdirSync(join(process.cwd(), 'docs'), { recursive: true })
  writeFileSync(REPORT_MD, md.join('\n'), 'utf8')

  console.log(`\n## DATA-08 report — katalog ČR/SK v Krkonoších`)
  console.log(`Krkonošských záznamů katalogu: ${krk.length}`)
  console.log(`Založeno nových kandidátů: ${zalozeno.length}`)
  console.log(`Možné duplikáty (k ruční kontrole): ${dupl.length}`)
  console.log(`K obohacení: ${obohatPubl.length} publikovaných + ${obohatKand.length} kandidátů`)
  console.log(`Report: ${REPORT_MD}`)
}

if (process.argv[1]?.endsWith('data08-katalog-krkonose.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
