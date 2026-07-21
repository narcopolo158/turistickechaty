/**
 * DATA-05: checklist turistických razítek z razitkuj.cz (kategorie „Horské a
 * turistické chaty") — se svolením Roberta Šindlera (KiBob), 21. 7. 2026.
 *
 * NEstahuje skeny razítek (autorská práva; otisky se převezmou až po dobudování
 * viditelné atribuce zdroje v UI). Sbírá jen **fakta pro checklist**: název
 * razítka + odkaz na jeho detail na razitkuj.cz. Slouží k (a) doplnění „razítko
 * existuje" k našim chatám a (b) zpětnému dohledání chat, které v katalogu
 * nemáme. Zdroj: razitkuj.cz (se svolením; u převzatých údajů uvádět).
 *
 * Parser se drží **URL vzorů detailu** (robustní vůči změně markupu):
 *   novější  `/{ID}_{slug}`        (např. /5469_bouda-bile-labe)
 *   starší   `/misto-{slug}/1`     (např. /misto-bilikova-chata/1)
 * Text odkazu = název. Stránkování `…/kategorie-horske-a-turisticke-chaty/{n}`
 * (1..36); běh se zastaví na první stránce bez nového razítka.
 *
 * Sandbox na razitkuj.cz nedosáhne (proxy) — ostrý běh dělá GitHub Actions
 * workflow „DATA-05: checklist razítek razitkuj.cz":
 *   npx tsx scripts/data05-razitkuj-checklist.ts               # všechny stránky
 *   npx tsx scripts/data05-razitkuj-checklist.ts --strany 3    # jen prvních 3 (test)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = 'http://www.razitkuj.cz'
const KATEGORIE = 'kategorie-horske-a-turisticke-chaty'
const MAX_STRAN = 60 // pojistka proti smyčce (kategorie má ~36 stran)
const RAZITKA_ADRESAR = join(process.cwd(), 'data', 'razitka')
const CHECKLIST_JSON = join(RAZITKA_ADRESAR, '_razitkuj-checklist.json')
const ZDROJ = 'razitkuj.cz — kategorie „Horské a turistické chaty" (se svolením Roberta Šindlera / KiBob, 21. 7. 2026)'

export const strankaUrl = (strana: number): string => `${BASE}/${KATEGORIE}/${strana}`

/** Jeden objekt v checklistu; `pocetOtisku` = kolik verzí razítka objekt má
 * (razitkuj to uvádí příponou „(N)" — i historické varianty, cenné pro sběr). */
export type RazitkoPolozka = { nazev: string; url: string; pocetOtisku?: number }

/** Cesta detailu razítka? (novější `/ID_slug` nebo starší `/misto-slug/1`). */
export const jeDetailRazitka = (cesta: string): boolean =>
  /^\/(?:\d+_[a-z0-9][a-z0-9\-']*|misto-[a-z0-9][a-z0-9\-']*\/1)$/i.test(cesta)

/** Rozdělí text odkazu na čistý název a počet otisků z přípony „(N)" (bez → 1). */
export const rozdelPocet = (text: string): { nazev: string; pocet: number } => {
  const m = /^(.*?)\s*\((\d+)\)\s*$/.exec(text)
  return m ? { nazev: m[1].trim(), pocet: Number(m[2]) } : { nazev: text, pocet: 1 }
}

/** Odstraní vnořené tagy a sjednotí bílé znaky (text odkazu → název). */
const ocisti = (s: string): string =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Vytáhne ze surového HTML stránky kategorie razítka (název + absolutní URL
 * detailu). Klíčem je URL vzor detailu, ne třídy v markupu. Jeden detail bývá
 * odkazovaný dvakrát (náhled + titulek) — deduplikuje se dle URL, přednost má
 * výskyt s neprázdným textem názvu.
 */
export const parsujStranku = (html: string): RazitkoPolozka[] => {
  const dleUrl = new Map<string, { nazev: string; pocet: number }>()
  const re = /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const cesta = m[1].replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '')
    if (!jeDetailRazitka(cesta)) continue
    const url = `${BASE}${cesta}`
    const { nazev, pocet } = rozdelPocet(ocisti(m[2]))
    const stavajici = dleUrl.get(url)
    if (stavajici === undefined || (!stavajici.nazev && nazev)) dleUrl.set(url, { nazev, pocet })
  }
  return [...dleUrl.entries()]
    .filter(([, v]) => v.nazev.length > 0)
    .map(([url, v]) => ({ nazev: v.nazev, url, pocetOtisku: v.pocet }))
}

// ── Stažení ─────────────────────────────────────────────────────────────────

const stahniStranku = async (url: string): Promise<string> => {
  const odpoved = await fetch(url, {
    headers: {
      'User-Agent': 'turistickechaty.cz (checklist razítek, se svolením provozovatele; repo narcopolo158/turistickechaty)',
    },
  })
  if (odpoved.status === 404) return '' // za koncem stránkování — konec kategorie
  if (!odpoved.ok) throw new Error(`HTTP ${odpoved.status} u ${url}`)
  return odpoved.text()
}

/**
 * Projde stránky kategorie a posbírá razítka. Zastaví se, když stránka nepřidá
 * žádné nové razítko (konec kategorie), nejpozději na `maxStran`. `nactiHtml`
 * jde podvrhnout v testu; ostrý běh stahuje z webu.
 */
export const posbirejChecklist = async (
  maxStran: number,
  nactiHtml: (url: string) => Promise<string> = stahniStranku,
): Promise<{ razitka: RazitkoPolozka[]; stran: number }> => {
  const dleUrl = new Map<string, RazitkoPolozka>()
  let stranSObsahem = 0
  for (let strana = 1; strana <= maxStran; strana++) {
    const html = await nactiHtml(strankaUrl(strana))
    const polozky = parsujStranku(html)
    let novych = 0
    for (const p of polozky) {
      if (!dleUrl.has(p.url)) {
        dleUrl.set(p.url, p)
        novych++
      }
    }
    if (novych > 0) stranSObsahem++
    console.log(`Strana ${strana}: ${polozky.length} objektů (${novych} nových).`)
    if (novych === 0) break // konec kategorie (prázdná / 404 / jen duplicity)
  }
  const razitka = [...dleUrl.values()].sort(
    (a, b) => a.nazev.localeCompare(b.nazev, 'cs') || a.url.localeCompare(b.url),
  )
  return { razitka, stran: stranSObsahem }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--strany')
  const maxStran = i >= 0 && argv[i + 1] ? Math.max(1, Math.min(MAX_STRAN, Number(argv[i + 1]))) : MAX_STRAN

  console.log(`Sbírám checklist razítek z ${BASE}/${KATEGORIE} (max ${maxStran} stran)…`)
  const { razitka, stran } = await posbirejChecklist(maxStran)

  mkdirSync(RAZITKA_ADRESAR, { recursive: true })
  const pocetOtisku = razitka.reduce((s, r) => s + (r.pocetOtisku ?? 1), 0)
  const checklist = {
    zdroj: ZDROJ,
    kategorieUrl: `${BASE}/${KATEGORIE}/1`,
    stahnuto: new Date().toISOString().slice(0, 10),
    pocetObjektu: razitka.length,
    pocetOtisku, // vč. historických / variant (razitkuj to uvádí jako „(N)")
    razitka,
  }
  writeFileSync(CHECKLIST_JSON, JSON.stringify(checklist, null, 2) + '\n', 'utf8')

  console.log(`\n## DATA-05 report — checklist razítek razitkuj.cz`)
  console.log(`Projito stran: ${stran}`)
  console.log(`Objektů: ${razitka.length} · otisků vč. variant/historických: ${pocetOtisku}`)
  console.log(`Checklist zapsán: ${CHECKLIST_JSON}`)
  console.log(`Zdroj: ${ZDROJ}`)
}

if (process.argv[1]?.endsWith('data05-razitkuj-checklist.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
