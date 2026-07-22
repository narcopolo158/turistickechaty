/**
 * DATA-13: stažení obrázků turistických známek z oficiálních detailů.
 *
 * Poctivost / svolení (KLÍČOVÉ): grafika známky je autorské dílo vydavatele.
 * Stahujeme JEN to, k čemu máme svolení:
 *   • jen produkty `system: 'znamka'` (ne vizitky — Wander Book zatím nesvolil),
 *   • jen z domén **Turistické známky s.r.o.**: turisticke-znamky.cz i
 *     **znaczki-turystyczne.pl** — polská verze TÉHOŽ vydavatele (potvrdil Michal).
 *     Souhlas Mgr. Davida Holuba (e-mail + telefonicky 22. 7. 2026) se týká obou.
 *   • jiné hostitele (např. Wander Book / vizitky) PŘESKAKUJEME — bez svolení.
 * Každý obrázek se ukládá s atribucí „se svolením" (manifest + UI).
 *
 * Síť: sandbox denních sessions na turisticke-znamky.cz nedosáhne (proxy) —
 * skript běží v GitHub Actions (jako fotky/výšky). Idempotentní: existující
 * soubor přeskočí (--force stáhne znovu). `--dry` jen vypíše, co by udělal.
 *
 *   npx tsx scripts/data13-znamky-obrazky.ts [--force] [--dry]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'data', 'znamky-vizitky')
const PUBLIC_DIR = join(process.cwd(), 'public', 'znamky')
const MANIFEST = join(DATA_DIR, 'obrazky.json')

const SVOLIL =
  'Turistické známky s.r.o. (Mgr. David Holub) — souhlas e-mail + telefonicky 22. 7. 2026; ' +
  'týká se obou domén vydavatele (turisticke-znamky.cz i znaczki-turystyczne.pl)'
/** Domény TÉHOŽ vydavatele (Turistické známky s.r.o.), k jehož obrázkům máme svolení. */
const POVOLENE_HOSTY = ['turisticke-znamky.cz', 'znaczki-turystyczne.pl']
/** Vlídný, identifikující User-Agent (některé WAF blokují holé tokeny). */
const UA = 'Mozilla/5.0 (compatible; turistickechaty.cz/1.0; +https://turistickechaty.cz)'

type Produkt = { system: string; cislo: string; nazev: string; url: string; stav: string }
type Katalog = { chaty?: { slug: string; nazev: string; produkty: Produkt[] }[] }
export type ObrazekZaznam = {
  slug: string
  cislo: string
  detailUrl: string
  obrazekUrl: string
  soubor: string
  mime: string
}

// ── Čisté pomocné funkce (testované) ────────────────────────────────────────

/** Absolutní URL z případně relativní adresy vůči stránce detailu. */
export const absolutniUrl = (src: string, baseUrl: string): string => {
  try {
    return new URL(src, baseUrl).href
  } catch {
    return src
  }
}

const META_VZORY: RegExp[] = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
]

/**
 * Skutečná cesta obrázku známky na CMS vydavatele (turisticke-znamky.cz i polská
 * znaczki-turystyczne.pl — Laravel): `/storage/item_images/<velikost>/<hash>.<ext>`.
 * (Ověřeno Michalem 22. 7. 2026.) Název je hash, ne číslo známky → nelze složit,
 * musí se vytáhnout z HTML detailu.
 */
const ITEM_IMAGES = /((?:https?:\/\/[^"'\s)]+)?\/storage\/item_images\/[^"'\s)]+\.(?:png|jpe?g|webp|gif))/gi

/** Preference velikosti: original/large > medium > (neznámé) > thumb/small/mini. */
const velikostSkore = (u: string): number =>
  /\/(original|large)\//i.test(u) ? 3 : /\/medium\//i.test(u) ? 2 : /\/(thumb|small|mini)\//i.test(u) ? 0 : 1

/**
 * Vytáhne URL obrázku známky z HTML detailu. Přednost má **cesta item_images**
 * (definitivní obrázek známky na tomto webu); teprve pak og:image / twitter /
 * image_src a nakonec `<img>` se známkovým src. `null`, když se nic bezpečného
 * nenajde — radši poctivě nic než špatný obrázek.
 */
/**
 * Generický / nemístní obrázek (logo, banner, share, placeholder) — NENÍ známka.
 * Chrání proti tomu, aby fallback (og:image) sebral logo webu jako „známku"
 * (znaczki-turystyczne.pl vrací u detailů og:image = /images/pages/znacki_turystyczne.jpg).
 */
export const jeGenericky = (url: string): boolean => {
  const u = url.toLowerCase()
  if (/\/(images\/pages|logo|logos|assets|static|placeholder|default|banner|share|social)\//.test(u)) return true
  const soubor = u.split('?')[0].split('/').pop() ?? ''
  return /logo|znaczki[_-]?turystyczne|znacki[_-]?turystyczne|turisticke[_-]?znamky|default|placeholder|banner/.test(soubor)
}

export const extractObrazekUrl = (html: string, baseUrl: string): string | null => {
  // 1) per-item cesta (item_images) — definitivní obrázek známky, důvěřuj
  const itemy = [...html.matchAll(ITEM_IMAGES)].map((m) => m[1])
  if (itemy.length) {
    return absolutniUrl([...itemy].sort((a, b) => velikostSkore(b) - velikostSkore(a))[0], baseUrl)
  }
  // 2) meta/fallback — ale odmítni generické (logo/banner/share), ať nebereme logo webu
  const kandidati: string[] = []
  for (const re of META_VZORY) {
    const m = html.match(re)
    if (m?.[1]) kandidati.push(m[1].trim())
  }
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    if (/znamk|\/foto|\/image|\/upload|item_images/i.test(m[1])) kandidati.push(m[1].trim())
  }
  return kandidati.map((k) => absolutniUrl(k, baseUrl)).find((u) => !jeGenericky(u)) ?? null
}

const MIME_PRIPONA: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

/** Přípona souboru z MIME (jinak z přípony URL, jinak .jpg). */
export const priponaObrazku = (mime: string, url: string): string => {
  const zMime = MIME_PRIPONA[mime.split(';')[0].trim().toLowerCase()]
  if (zMime) return zMime
  const m = url.split('?')[0].match(/\.(png|jpe?g|webp|gif)$/i)
  return m ? `.${m[1].toLowerCase().replace('jpeg', 'jpg')}` : '.jpg'
}

/** Bere se jen známka od vydavatele, k němuž máme svolení (turisticke-znamky.cz). */
export const jeStazitelna = (p: Produkt): boolean => {
  if (p.system !== 'znamka') return false
  try {
    const host = new URL(p.url).hostname.replace(/^www\./, '')
    return POVOLENE_HOSTY.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

// ── Běh (síť) ───────────────────────────────────────────────────────────────

const nactiKatalogy = (): { slug: string; produkt: Produkt }[] => {
  if (!existsSync(DATA_DIR)) return []
  const out: { slug: string; produkt: Produkt }[] = []
  for (const f of readdirSync(DATA_DIR)) {
    if (!f.endsWith('.json') || f === 'obrazky.json') continue
    const k = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8')) as Katalog
    for (const c of k.chaty ?? []) {
      for (const p of c.produkty ?? []) if (jeStazitelna(p)) out.push({ slug: c.slug, produkt: p })
    }
  }
  return out
}

const stahni = async (url: string): Promise<{ mime: string; buf: Buffer }> => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const mime = res.headers.get('content-type') ?? ''
  return { mime, buf: Buffer.from(await res.arrayBuffer()) }
}

const main = async () => {
  const dry = process.argv.includes('--dry')
  const force = process.argv.includes('--force')
  const polozky = nactiKatalogy()
  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

  const stare: ObrazekZaznam[] = existsSync(MANIFEST)
    ? ((JSON.parse(readFileSync(MANIFEST, 'utf8')) as { obrazky?: ObrazekZaznam[] }).obrazky ?? [])
    : []
  const dleSlug = new Map(stare.map((z) => [z.slug, z]))
  // Pojistka: stejná adresa obrázku u víc chat = generický/sdílený obrázek, ne známka.
  const pouzite = new Set<string>(stare.map((z) => z.obrazekUrl))

  let stazeno = 0
  let preskoceno = 0
  let bezObrazku = 0
  console.log(`\n## DATA-13 — obrázky známek (jen turisticke-znamky.cz, se svolením)${dry ? ' (DRY)' : ''}`)
  console.log(`Kandidátů (známka + povolený host): ${polozky.length}`)

  for (const { slug, produkt } of polozky) {
    const hotovo = dleSlug.get(slug)
    const souborExistuje = hotovo && existsSync(join(process.cwd(), 'public', hotovo.soubor.replace(/^\//, '')))
    if (hotovo && souborExistuje && !force) {
      preskoceno++
      continue
    }
    try {
      if (dry) {
        console.log(`- [dry] ${slug} (č. ${produkt.cislo}) ← ${produkt.url}`)
        continue
      }
      const res = await fetch(produkt.url, { headers: { 'User-Agent': UA } })
      if (!res.ok) {
        console.log(`- ✗ ${slug}: detail HTTP ${res.status} (${produkt.url})`)
        continue
      }
      const html = await res.text()
      const obrazekUrl = extractObrazekUrl(html, produkt.url)
      if (!obrazekUrl) {
        console.log(`- ⚠ ${slug}: obrázek v detailu nenalezen — doplnit ručně (${produkt.url})`)
        bezObrazku++
        continue
      }
      if (pouzite.has(obrazekUrl)) {
        console.log(`- ⚠ ${slug}: sdílený/generický obrázek (${obrazekUrl}) — přeskočeno (není známka konkrétní chaty)`)
        bezObrazku++
        continue
      }
      const { mime, buf } = await stahni(obrazekUrl)
      const soubor = `/znamky/${slug}${priponaObrazku(mime, obrazekUrl)}`
      writeFileSync(join(process.cwd(), 'public', soubor.replace(/^\//, '')), buf)
      dleSlug.set(slug, { slug, cislo: produkt.cislo, detailUrl: produkt.url, obrazekUrl, soubor, mime: mime.split(';')[0].trim() })
      pouzite.add(obrazekUrl)
      console.log(`- ✓ ${slug} (č. ${produkt.cislo}) → ${soubor} [${(buf.length / 1024).toFixed(0)} kB]`)
      stazeno++
    } catch (e) {
      console.log(`- ✗ ${slug}: ${e instanceof Error ? e.message : e}`)
    }
  }

  if (!dry) {
    const obrazky = [...dleSlug.values()].sort((a, b) => a.slug.localeCompare(b.slug))
    const manifest = {
      zdroj: 'Turistické známky s.r.o. (turisticke-znamky.cz, znaczki-turystyczne.pl)',
      svolil: SVOLIL,
      poznamka:
        'Obrázky známek se svolením vydavatele. Jen system=znamka a jen domény Turistické ' +
        'známky s.r.o. (turisticke-znamky.cz i polská znaczki-turystyczne.pl); vizitky (Wander Book) se nestahují (bez svolení).',
      stazeno: new Date().toISOString().slice(0, 10),
      obrazky,
    }
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }
  console.log(`\nStaženo: ${stazeno} · přeskočeno (už je): ${preskoceno} · bez obrázku: ${bezObrazku}`)
}

if (process.argv[1]?.endsWith('data13-znamky-obrazky.ts')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}
