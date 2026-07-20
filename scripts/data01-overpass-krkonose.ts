/**
 * DATA-01: export chat Krkonoš z OpenStreetMap (Overpass API).
 *
 * Stáhne objekty `tourism=alpine_hut` a `tourism=wilderness_hut` na české
 * straně Krkonoš (průnik area Česko + bbox pohoří) a založí pro každý
 * `data/chaty/krkonose/<slug>.yaml` — jen doložené údaje z OSM tagů,
 * vše `verified: false` se zdrojem (URL OSM objektu) a atribucí ODbL.
 *
 * Spuštění (sandbox denních sessions na Overpass nedosáhne — spouští se
 * z GitHub Actions workflow „DATA-01: OSM export chat Krkonoš", případně
 * lokálně):
 *   npx tsx scripts/data01-overpass-krkonose.ts
 *   npx tsx scripts/data01-overpass-krkonose.ts --api https://overpass.kumi.systems/api/interpreter
 *
 * Poctivost dat (CLAUDE.md): skript nic nedomýšlí — zapisuje pouze to, co
 * v OSM je. Existující YAML (ruční profily, např. Luční bouda) NIKDY
 * nepřepisuje. Stav provozu OSM spolehlivě nenese → `stav` se nevyplňuje.
 * Typ je odvozen přímo z významu tagu dle OSM wiki: alpine_hut = obsluhovaná
 * chata, wilderness_hut = útulna (neobsluhovaná) — s poznámkou v YAML.
 * Výstup je checklist pro redakci: křížové ověření řeší DATA-03.
 *
 * Atribuce: data © přispěvatelé OpenStreetMap, licence ODbL 1.0
 * (https://www.openstreetmap.org/copyright) — v source každého bloku ověření.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { stringify } from 'yaml'

// Slug generujeme stejně jako Payload hook — jeden zdroj pravdy.
import { slugify } from '../src/fields/slug'

const VYCHOZI_API = 'https://overpass-api.de/api/interpreter'
const CILOVY_ADRESAR = join(process.cwd(), 'data', 'chaty', 'krkonose')

/**
 * Hrubé vyhledávací okno Krkonoš (jih, západ, sever, východ) — jen okno
 * dotazu, ne publikovaný údaj: pokrývá Harrachov až Rýchory s rezervou.
 * Příslušnost k ČR řeší průnik s area `ISO3166-1=CZ` přímo v dotazu
 * (bbox samotný by zahrnul i polská schroniska — polská strana Krkonoš
 * je otevřená otázka pro Michala, viz DENIK).
 */
export const BBOX_KRKONOSE = '50.55,15.30,50.82,16.05'

export const OVERPASS_DOTAZ = `[out:json][timeout:120];
area["ISO3166-1"="CZ"][admin_level="2"]->.cz;
(
  nwr["tourism"="alpine_hut"](area.cz)(${BBOX_KRKONOSE});
  nwr["tourism"="wilderness_hut"](area.cz)(${BBOX_KRKONOSE});
);
out center;`

export type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// ── Stažení z Overpass ──────────────────────────────────────────────────────

export const stahniElementy = async (api: string): Promise<OsmElement[]> => {
  const odpoved = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Slušnost vůči veřejné instanci — ať provozovatel ví, kdo se ptá.
      'User-Agent': 'turistickechaty.cz (DATA-01 export; repo narcopolo158/turistickechaty)',
    },
    body: `data=${encodeURIComponent(OVERPASS_DOTAZ)}`,
  })
  if (!odpoved.ok) {
    const napoveda =
      odpoved.status === 429
        ? ' (příliš dotazů — počkej chvíli, nebo zkus zrcadlo: --api https://overpass.kumi.systems/api/interpreter)'
        : odpoved.status === 504
          ? ' (přetížená instance — zkus to znovu, nebo zrcadlo kumi.systems)'
          : ''
    throw new Error(`Overpass API vrátilo HTTP ${odpoved.status}${napoveda}.`)
  }
  const telo = (await odpoved.json()) as { elements?: OsmElement[] }
  if (!Array.isArray(telo.elements)) throw new Error('Overpass API: odpověď bez pole `elements` — neplatný výstup.')
  return telo.elements
}

// ── Mapování OSM elementu na data chaty ─────────────────────────────────────

export const osmUrl = (el: OsmElement): string => `https://www.openstreetmap.org/${el.type}/${el.id}`

const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

/** Souřadnice: node je nese přímo, way/relation dává Overpass přes `out center`. */
const souradnice = (el: OsmElement): { lat: number; lng: number } | null => {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

/** Nadmořská výška z tagu `ele` — jen rozumné číslo, jinak se nezapisuje. */
const vyskaZTagu = (ele: string | undefined): number | null => {
  if (!ele) return null
  const cislo = Number(ele.replace(',', '.').replace(/\s*m$/i, ''))
  return Number.isFinite(cislo) && cislo > 0 && cislo < 4900 ? Math.round(cislo) : null
}

/** Vícehodnotové OSM tagy (alt_name apod.) oddělují hodnoty středníkem. */
const hodnoty = (tag: string | undefined): string[] =>
  (tag ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

export type Preskoceni = { duvod: 'bez-nazvu' | 'bez-souradnic'; url: string }

/**
 * Sestaví data chaty z OSM tagů — jen doložená pole. Bez názvu nebo souřadnic
 * se objekt přeskakuje (nemá jak dostat slug, resp. nepatří na mapu ani do
 * katalogu bez lokace) a jde do reportu k ruční kontrole.
 */
export const chataZElementu = (
  el: OsmElement,
  checked: string,
): { data: Record<string, unknown> } | Preskoceni => {
  const tagy = el.tags ?? {}
  const url = osmUrl(el)
  if (!tagy.name) return { duvod: 'bez-nazvu', url }
  const gps = souradnice(el)
  if (!gps) return { duvod: 'bez-souradnic', url }

  const data: Record<string, unknown> = {
    nazev: tagy.name,
    slug: slugify(tagy.name),
    zeme: 'cz', // zaručeno průnikem s area ISO3166-1=CZ přímo v dotazu
    typ: tagy.tourism === 'wilderness_hut' ? 'utulna' : 'obsluhovana',
    oblast: 'krkonose',
    // `stav` vědomě chybí: OSM provoz spolehlivě nenese, nedomýšlíme.
  }

  const aliasy = [
    ...hodnoty(tagy.alt_name).map((nazev) => ({ nazev, poznamka: 'alternativní název (OSM alt_name)' })),
    ...hodnoty(tagy.old_name).map((nazev) => ({ nazev, poznamka: 'historický název (OSM old_name)' })),
  ]
  if (aliasy.length > 0) data.aliasy = aliasy

  data.lat = gps.lat
  data.lng = gps.lng
  const vyska = vyskaZTagu(tagy.ele)
  if (vyska != null) data.vyska = vyska
  if (tagy['addr:city']) data.obec = tagy['addr:city']
  data.overeniLokace = {
    source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
    verified: false,
    checked,
  }

  const kontakty: Record<string, string> = {}
  const telefon = tagy.phone ?? tagy['contact:phone']
  const email = tagy.email ?? tagy['contact:email']
  const web = tagy.website ?? tagy['contact:website']
  if (telefon) kontakty.telefon = telefon
  if (email) kontakty.email = email
  if (web) kontakty.web = web
  if (Object.keys(kontakty).length > 0) {
    data.kontakty = kontakty
    data.overeniProvoz = {
      source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
      verified: false,
      checked,
    }
  }

  const poznamky = [
    `Automatický export z OSM (DATA-01, ${checked}) — před publikací projít redakcí (DATA-03).`,
    `Typ odvozen z OSM tagu tourism=${tagy.tourism} (alpine_hut = obsluhovaná, wilderness_hut = útulna).`,
    ...(tagy.operator ? [`Provozovatel dle OSM: ${tagy.operator}`] : []),
    ...(tagy.opening_hours ? [`Otvírací doba dle OSM (surový formát, neověřeno): ${tagy.opening_hours}`] : []),
    ...(tagy.note ? [`Poznámka z OSM: ${tagy.note}`] : []),
  ]
  data.interniPoznamky = poznamky.join('\n')

  return { data }
}

// ── YAML soubor ─────────────────────────────────────────────────────────────

/**
 * YAML s hlavičkovým komentářem (zdroj, atribuce, upozornění redakci).
 * Hodnoty serializuje knihovna `yaml` — žádné ruční escapování názvů.
 */
export const yamlChaty = (data: Record<string, unknown>, url: string, checked: string): string =>
  [
    `# ${data.nazev} — automatický export z OpenStreetMap (DATA-01, staženo ${checked})`,
    `# Zdroj: ${url} · ${ATRIBUCE}`,
    '# Vše verified: false — údaje převzaty z OSM tagů, redakčně neověřeno (křížové',
    '# ověření DATA-03). Stav provozu OSM nenese, proto tu není. Nic nedomýšlet!',
    '',
    stringify(data),
  ].join('\n')

export type Report = {
  zapsano: { slug: string; nazev: string; url: string }[]
  existujici: { slug: string; url: string }[]
  preskoceno: Preskoceni[]
}

/**
 * Zapíše YAML soubory do cílového adresáře. Existující soubory (ruční
 * profily) nikdy nepřepisuje; kolizi slugů dvou OSM objektů v jednom běhu
 * řeší deterministický suffix `-<osm id>`.
 */
export const zapisChaty = (elementy: OsmElement[], cilovyAdresar: string, checked: string): Report => {
  const report: Report = { zapsano: [], existujici: [], preskoceno: [] }
  const slugyBehu = new Set<string>()
  mkdirSync(cilovyAdresar, { recursive: true })

  // Deterministické pořadí výstupu nezávislé na pořadí z API.
  const serazene = [...elementy].sort((a, b) => (a.tags?.name ?? '').localeCompare(b.tags?.name ?? '', 'cs') || a.id - b.id)

  for (const el of serazene) {
    const vysledek = chataZElementu(el, checked)
    if ('duvod' in vysledek) {
      report.preskoceno.push(vysledek)
      continue
    }
    const { data } = vysledek
    let slug = data.slug as string
    if (slugyBehu.has(slug)) slug = `${slug}-${el.id}` // dvě chaty téhož jména v OSM
    data.slug = slug
    slugyBehu.add(slug)

    const cesta = join(cilovyAdresar, `${slug}.yaml`)
    if (existsSync(cesta)) {
      report.existujici.push({ slug, url: osmUrl(el) })
      continue
    }
    writeFileSync(cesta, yamlChaty(data, osmUrl(el), checked), 'utf8')
    report.zapsano.push({ slug, nazev: data.nazev as string, url: osmUrl(el) })
  }
  return report
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const apiIndex = argv.indexOf('--api')
  const api = apiIndex >= 0 && argv[apiIndex + 1] ? argv[apiIndex + 1] : VYCHOZI_API
  const checked = new Date().toISOString().slice(0, 10)

  console.log(`Overpass dotaz na ${api} (alpine_hut + wilderness_hut, ČR ∩ bbox Krkonoš)…`)
  const elementy = await stahniElementy(api)
  console.log(`Staženo ${elementy.length} objektů.`)

  const report = zapisChaty(elementy, CILOVY_ADRESAR, checked)

  console.log(`\n## DATA-01 report (${checked})`)
  console.log(`\nNově zapsáno: ${report.zapsano.length}`)
  for (const ch of report.zapsano) console.log(`- ${ch.nazev} (\`${ch.slug}.yaml\`) — ${ch.url}`)
  console.log(`\nPřeskočeno — YAML už existuje (ruční profil se nepřepisuje): ${report.existujici.length}`)
  for (const ch of report.existujici) console.log(`- ${ch.slug} — ${ch.url}`)
  console.log(`\nPřeskočeno — neúplné v OSM (k ruční kontrole): ${report.preskoceno.length}`)
  for (const p of report.preskoceno) console.log(`- ${p.url} (${p.duvod === 'bez-nazvu' ? 'chybí name' : 'chybí souřadnice'})`)
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('data01-overpass-krkonose.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
