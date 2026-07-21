/**
 * DATA-05: spárování checklistu razítek razitkuj.cz (`_razitkuj-checklist.json`)
 * s naším katalogem chat (`data/chaty/**`). Běží offline v sandboxu (čte jen
 * commitnutá data). Výstup:
 *   • našim chatám doplní odkaz „razítko existuje na razitkuj.cz" (párování dle
 *     názvu i aliasů, s diakritikou i bez),
 *   • vypíše naše chaty BEZ nalezeného razítka,
 *   • heuristicky označí razítka, jejichž název zmiňuje Krkonoše/známé brány,
 *     ale žádné naší chatě neodpovídají → **kandidáti na zpětné dohledání chat**
 *     (k ověření; přesné zařazení dle pohoří chce detail razítka — další krok).
 *
 * Nic se nedomýšlí: shoda jen při dost silné shodě názvu; slabé shody jdou do
 * reportu k ruční kontrole, ne do dat.
 *
 *   npx tsx scripts/data05-razitkuj-parovani.ts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import type { RazitkoPolozka } from './data05-razitkuj-checklist'

const CHATY_KOREN = join(process.cwd(), 'data', 'chaty')
const CHECKLIST_JSON = join(process.cwd(), 'data', 'razitka', '_razitkuj-checklist.json')

/** Normalizace názvu pro porovnání: bez diakritiky (vč. ł/ß), malá písmena, jen [a-z0-9] + mezery. */
export const normalizuj = (s: string): string =>
  s
    .replace(/[łŁ]/g, 'l')
    .replace(/[ß]/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Silná shoda názvu chaty (název + aliasy) s názvem razítka: shoda po
 * normalizaci, nebo jeden název obsahuje druhý (oba aspoň 5 znaků — krátké
 * názvy by daly falešné shody).
 */
export const shodaNazvu = (nazvyChaty: string[], nazevRazitka: string): boolean => {
  const r = normalizuj(nazevRazitka)
  if (!r) return false
  return nazvyChaty.some((n) => {
    const h = normalizuj(n)
    if (!h) return false
    if (h === r) return true
    return h.length >= 5 && r.length >= 5 && (r.includes(h) || h.includes(r))
  })
}

export type Chata = { slug: string; nazev: string; nazvy: string[]; zeme?: string }

/** Načte chaty z `data/chaty/<pohori>/<slug>.yaml` (název + aliasy pro párování). */
export const nactiChaty = (koren: string = CHATY_KOREN): Chata[] => {
  const chaty: Chata[] = []
  if (!existsSync(koren)) return chaty
  for (const pohori of readdirSync(koren, { withFileTypes: true })) {
    if (!pohori.isDirectory()) continue
    const dir = join(koren, pohori.name)
    for (const soubor of readdirSync(dir)) {
      if (!soubor.endsWith('.yaml')) continue
      const data = parse(readFileSync(join(dir, soubor), 'utf8')) as {
        nazev?: string
        slug?: string
        zeme?: string
        aliasy?: { nazev?: string }[]
      } | null
      if (!data?.nazev) continue
      const aliasy = (data.aliasy ?? []).map((a) => a?.nazev).filter((x): x is string => !!x)
      chaty.push({ slug: data.slug ?? soubor.replace(/\.yaml$/, ''), nazev: data.nazev, nazvy: [data.nazev, ...aliasy], zeme: data.zeme })
    }
  }
  return chaty
}

export type Sparovani = {
  shody: { chata: string; slug: string; razitko: string; url: string }[]
  bezRazitka: { slug: string; nazev: string }[]
  kandidatiChat: RazitkoPolozka[]
}

/** Klíčová slova pro heuristické „vypadá krkonošsky" (zpětné dohledání chat). */
const KRKONOSE_KLICE = [
  'krkonos',
  'spindl',
  'pec pod snezkou',
  'snezka',
  'harrach',
  'rokytnic',
  'janske lazne',
  'labsk',
  'lucni',
  'voseck',
  'martinov',
  'vyrovk',
  'szrenic',
  'karpacz',
  'samotni',
  'strzech',
]

/**
 * Spáruje checklist s chatami. Chata je „má razítko", když aspoň jedno razítko
 * silně sedí na její název/alias. Razítka bez shody, jejichž název zavání
 * Krkonošemi, jdou mezi kandidáty na dohledání (k ověření).
 */
export const sparuj = (chaty: Chata[], razitka: RazitkoPolozka[]): Sparovani => {
  const shody: Sparovani['shody'] = []
  const sRazitkem = new Set<string>()
  const razitkaSeShodou = new Set<string>()

  for (const chata of chaty) {
    for (const r of razitka) {
      if (shodaNazvu(chata.nazvy, r.nazev)) {
        shody.push({ chata: chata.nazev, slug: chata.slug, razitko: r.nazev, url: r.url })
        sRazitkem.add(chata.slug)
        razitkaSeShodou.add(r.url)
      }
    }
  }

  const bezRazitka = chaty
    .filter((c) => !sRazitkem.has(c.slug))
    .map((c) => ({ slug: c.slug, nazev: c.nazev }))

  const kandidatiChat = razitka.filter((r) => {
    if (razitkaSeShodou.has(r.url)) return false
    const n = normalizuj(r.nazev)
    return KRKONOSE_KLICE.some((k) => n.includes(k))
  })

  shody.sort((a, b) => a.chata.localeCompare(b.chata, 'cs'))
  return { shody, bezRazitka, kandidatiChat }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = () => {
  if (!existsSync(CHECKLIST_JSON)) {
    throw new Error(`Checklist ${CHECKLIST_JSON} neexistuje — nejdřív ho stáhne workflow „DATA-05: checklist razítek razitkuj.cz".`)
  }
  const checklist = JSON.parse(readFileSync(CHECKLIST_JSON, 'utf8')) as { razitka?: RazitkoPolozka[] }
  const razitka = checklist.razitka ?? []
  const chaty = nactiChaty()
  const { shody, bezRazitka, kandidatiChat } = sparuj(chaty, razitka)

  console.log(`\n## DATA-05 párování — razítka razitkuj.cz vs. náš katalog`)
  console.log(`Chat v katalogu: ${chaty.length} · razítek v checklistu: ${razitka.length}`)
  console.log(`\nNaše chaty s nalezeným razítkem (${new Set(shody.map((s) => s.slug)).size}):`)
  for (const s of shody) console.log(`- ${s.chata} → „${s.razitko}" ${s.url}`)
  console.log(`\nNaše chaty BEZ nalezeného razítka (${bezRazitka.length}):`)
  for (const b of bezRazitka) console.log(`- ${b.nazev} (${b.slug})`)
  console.log(`\nKandidáti na zpětné dohledání chat — razítko „vypadá krkonošsky", bez shody (${kandidatiChat.length}), K OVĚŘENÍ:`)
  for (const k of kandidatiChat) console.log(`- „${k.nazev}" ${k.url}`)
}

if (process.argv[1]?.endsWith('data05-razitkuj-parovani.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
