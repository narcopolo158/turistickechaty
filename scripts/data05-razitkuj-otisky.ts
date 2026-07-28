/**
 * DATA-05 (fáze 3b): stažení otisků razítek z razitkuj.cz pro chaty, které
 * razítko mají (shoda z párování). Se svolením Roberta Šindlera (KiBob),
 * 21. 7. 2026 — u každého otisku se povinně uvádí zdroj (odkaz na razitkuj.cz).
 *
 * razitkuj vystavuje otisky jako `…/razitka_thumb/{ID}_{slug}.gif` a jeden
 * objekt jich má i víc (historické varianty). Skript projde detail každé
 * spárované chaty, vytáhne VŠECHNY otisky (parser drží URL vzor, ne markup),
 * stáhne je do `data/razitka/skeny/{slug}/{ID}.{ext}` a zapíše manifest
 * `data/razitka/skeny/_otisky.json` (chata, zdrojUrl, seznam otisků) — vstup pro
 * založení razítek `prevzato-se-svolenim`.
 *
 * Sandbox na razitkuj.cz nedosáhne (proxy) — ostrý běh dělá GitHub Actions
 * workflow „DATA-05: stažení otisků razítek (razitkuj.cz)":
 *   npx tsx scripts/data05-razitkuj-otisky.ts              # všechny spárované chaty
 *   npx tsx scripts/data05-razitkuj-otisky.ts --limit 3    # jen prvních N (zkouška)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RazitkoPolozka } from './data05-razitkuj-checklist'
import { nactiChaty, sparuj } from './data05-razitkuj-parovani'

const BASE = 'https://www.razitkuj.cz'
const CHECKLIST_JSON = join(process.cwd(), 'data', 'razitka', '_razitkuj-checklist.json')
const SKENY_ADRESAR = join(process.cwd(), 'data', 'razitka', 'skeny')
const MANIFEST_JSON = join(SKENY_ADRESAR, '_otisky.json')
const SVOLIL = 'Robert Šindler (KiBob), razitkuj.cz — 21. 7. 2026'

export type OtiskDetail = { id: number; url: string; urlPlny: string; ext: string }

// Otisky razitkuj: /razitka_thumb/{ID}_{slug}.{ext} (náhled) — plná verze bez
// `_thumb`. Parser drží tento URL vzor, ne třídy v HTML (robustní).
const OTISK_RE = /\/razitka(_thumb)?\/(\d+)_([a-z0-9][a-z0-9\-']*)\.(gif|jpe?g|png)/gi

/** Vytáhne z HTML detailu razítka všechny otisky (dedup dle ID, řazeno). */
export const otiskyZDetailu = (html: string, base: string = BASE): OtiskDetail[] => {
  const dleId = new Map<number, OtiskDetail>()
  let m: RegExpExecArray | null
  OTISK_RE.lastIndex = 0
  while ((m = OTISK_RE.exec(html)) !== null) {
    const id = Number(m[2])
    const slug = m[3]
    const ext = m[4].toLowerCase()
    if (!dleId.has(id)) {
      dleId.set(id, {
        id,
        url: `${base}/razitka${m[1] ?? ''}/${id}_${slug}.${ext}`,
        urlPlny: `${base}/razitka/${id}_${slug}.${ext}`,
        ext,
      })
    }
  }
  return [...dleId.values()].sort((a, b) => a.id - b.id)
}

// ── Stažení (Actions) ───────────────────────────────────────────────────────

const UA = 'turistickechaty.cz (otisky se svolením provozovatele; repo narcopolo158/turistickechaty)'

const stahniText = async (url: string): Promise<string> => {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (r.status === 404) return ''
  if (!r.ok) throw new Error(`HTTP ${r.status} u ${url}`)
  return r.text()
}

/** Stáhne obrázek: nejdřív plnou verzi, při 404 náhled. Vrátí data + skutečné URL. */
const stahniObrazek = async (otisk: OtiskDetail): Promise<{ data: Buffer; url: string } | null> => {
  for (const url of [otisk.urlPlny, otisk.url]) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) return { data: Buffer.from(await r.arrayBuffer()), url }
  }
  return null
}

export type ManifestOtisk = { id: number; soubor: string; obrazekUrl: string }
export type ManifestChata = { slug: string; nazev: string; zdrojUrl: string; otisky: ManifestOtisk[] }

const main = async () => {
  const argv = process.argv.slice(2)
  const li = argv.indexOf('--limit')
  const limit = li >= 0 && argv[li + 1] ? Math.max(1, Number(argv[li + 1])) : Infinity

  if (!existsSync(CHECKLIST_JSON)) throw new Error(`Checklist ${CHECKLIST_JSON} neexistuje — nejdřív workflow „DATA-05: checklist razítek razitkuj.cz".`)
  const checklist = JSON.parse(readFileSync(CHECKLIST_JSON, 'utf8')) as { razitka?: RazitkoPolozka[] }
  const { shody } = sparuj(nactiChaty(), checklist.razitka ?? [])

  // Stahuje se VÝHRADNĚ z párů potvrzených redakcí (_parovani-potvrzene.yaml):
  // jmenná shoda není přiřazení (jmenovci, cizí objekty téhož jména — DATA-17).
  const nepotvrzene = shody.filter((s) => !s.potvrzeno)
  if (nepotvrzene.length) {
    console.log(`Nepotvrzené shody (${nepotvrzene.length}) se NEstahují — čekají na redakci v data/razitka/_parovani-potvrzene.yaml:`)
    for (const s of nepotvrzene) console.log(`  · ${s.chata} × „${s.razitko}" (${s.typ === 'castecna' ? 'částečná shoda' : 'přesná shoda'}) — ${s.url}`)
  }

  // Jedna chata = jeden zdrojUrl (první potvrzená shoda); víc otisků má detail.
  const dleSlug = new Map<string, { nazev: string; zdrojUrl: string }>()
  for (const s of shody) {
    if (s.potvrzeno && !dleSlug.has(s.slug)) dleSlug.set(s.slug, { nazev: s.chata, zdrojUrl: s.url })
  }
  const chaty = [...dleSlug.entries()].slice(0, limit === Infinity ? undefined : limit)

  mkdirSync(SKENY_ADRESAR, { recursive: true })
  const manifest: ManifestChata[] = []
  let otiskuCelkem = 0

  for (const [slug, info] of chaty) {
    const html = await stahniText(info.zdrojUrl)
    const otisky = otiskyZDetailu(html)
    const adr = join(SKENY_ADRESAR, slug)
    const zapsane: ManifestOtisk[] = []
    if (otisky.length) mkdirSync(adr, { recursive: true })
    for (const o of otisky) {
      const stazeny = await stahniObrazek(o)
      if (!stazeny) {
        console.error(`  ! otisk ${o.id} (${slug}) se nepodařilo stáhnout`)
        continue
      }
      const soubor = `${o.id}.${o.ext}`
      writeFileSync(join(adr, soubor), stazeny.data)
      zapsane.push({ id: o.id, soubor: `${slug}/${soubor}`, obrazekUrl: stazeny.url })
    }
    otiskuCelkem += zapsane.length
    manifest.push({ slug, nazev: info.nazev, zdrojUrl: info.zdrojUrl, otisky: zapsane })
    console.log(`${info.nazev} (${slug}): ${zapsane.length} otisků`)
  }

  writeFileSync(
    MANIFEST_JSON,
    JSON.stringify({ zdroj: 'razitkuj.cz', svolil: SVOLIL, stazeno: new Date().toISOString().slice(0, 10), pocetChat: manifest.length, pocetOtisku: otiskuCelkem, chaty: manifest }, null, 2) + '\n',
    'utf8',
  )
  console.log(`\n## DATA-05 fáze 3b — otisky staženy`)
  console.log(`Chat: ${manifest.length} · otisků celkem: ${otiskuCelkem}`)
  console.log(`Manifest: ${MANIFEST_JSON}`)
}

if (process.argv[1]?.endsWith('data05-razitkuj-otisky.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
