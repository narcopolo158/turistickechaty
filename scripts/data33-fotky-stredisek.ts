/**
 * DATA-33: fotky STŘEDISEK A LANOVEK z Wikimedia Commons — dohledá, VYBERE
 * a STÁHNE.
 *
 * Zadání Michala 28. 7. 2026: „u středisek chci taky fotky, jak na profilu,
 * tak na přehledu — najdi zdroj a rovnou stáhni." A 29. 7. 2026: „sběr fotek
 * lanovek zařaď" — jeden klik tedy obstará obojí.
 *
 * LANOVKY MAJÍ SÍTO NAVÍC. U střediska stačí, že snímek pochází z obce: je to
 * fotka MÍSTA. U lanovky by ale geosearch kolem dráhy nabídl i kostel z téže
 * vsi, a takový snímek by na stránce lanovky tvrdil něco, co na něm není —
 * proto projde jen soubor, jehož název nebo popis o lanovce opravdu mluví
 * (`jeOLanovce`, mnohojazyčně). Bod dotazu je STŘED dráhy, ne stanice, a okruh
 * pokrývá aspoň polovinu délky: fotograf stojí kdekoli podél lana.
 *
 * ČÍM SE LIŠÍ OD DATA-02: fotky chat skript jen NAVRHUJE (redakce vybírá
 * a nahrává, protože u chaty rozhoduje, jestli je na snímku opravdu ta bouda).
 * U střediska je sázka nižší — je to obec, ne konkrétní budova — a Michal
 * chce výsledek rovnou. Skript proto jednu fotku vybere podle napsaných
 * pravidel, stáhne ji do `public/strediska/<slug>.jpg` (u lanovek
 * `public/lanovky/<slug>.jpg`) a do manifestu zapíše
 * autora, licenci a obě URL (stránka souboru i originál). Ostatní kandidáti
 * zůstanou v manifestu jako `alternativy`, takže výměna je jednořádková
 * změna `prefer` a další běh.
 *
 * PRAVIDLA VÝBĚRU (v tomhle pořadí, ať je rozhodnutí přezkoumatelné):
 *   1. `prefer` z manifestu — redakční volba přebíjí všechno ostatní,
 *   2. licence musí projít sítem DATA-02 (CC0/BY/BY-SA/PD; NC a ND ven),
 *   3. nález z geosearche před fulltextem (geotag = fotka opravdu odtud),
 *   4. na šířku před na výšku (karta i hlavička střediska jsou širší než vyšší),
 *   5. větší plocha před menší.
 * Co pravidla nevyberou, se nestahuje — radši žádná fotka než náhodná.
 *
 * ATRIBUCE: licence CC BY/BY-SA vyžadují uvedení autora — proto se autor
 * ukládá do manifestu a web ho vypisuje u fotky. Fotka bez doloženého autora
 * se nestahuje, i kdyby licence jinak prošla.
 *
 * Spuštění (sandbox na Commons nedosáhne — ostrý běh dělá GitHub Actions):
 *   npx tsx scripts/data33-fotky-stredisek.ts --oblast krkonose
 *   npx tsx scripts/data33-fotky-stredisek.ts --oblast krkonose --bez-stahovani
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import {
  API_COMMONS,
  cistyText,
  dobaCekaniMs,
  posudLicenci,
  stahniJson,
  strankyZOdpovedi,
  urlFulltext,
  urlGeosearch,
  type ChataProDotaz,
  type CommonsStranka,
} from './data02-commons-fotky'
import { oblastZArgv } from './oblasti'
import { lanovkySeSlugy } from '../src/lib/lanovky'

/**
 * User-Agent MUSÍ být bez diakritiky — a stálo to jeden spadlý běh.
 *
 * První ostrý běh (29. 7. 2026, Michalův klik) došel až k prvnímu stažení
 * a spadl na `Cannot convert argument to a ByteString because the character
 * at index 36 has a value of 345`. Index 36 bylo „ř" ze slova „středisek":
 * hodnota hlavičky se ve fetchi převádí na ByteString, do kterého se vejdou
 * jen znaky do 255. „í" (237) projde, „ř" (345) ani „ě" (283) ne — proto
 * tatáž chyba nikdy nepotkala DATA-05, kde je v UA jen „razítek".
 *
 * Kontrolu, že se sem diakritika nevrátí, dělá test `data33-fotky-stredisek`
 * — a schválně nad VŠEMI skripty, ne jen nad tímhle.
 */
const UA = 'turistickechaty.cz (DATA-33 fotky stredisek; repo narcopolo158/turistickechaty)'
/** Okruh geosearche kolem bodu obce — středisko je plocha, ne budova. */
export const RADIUS_STREDISKA_M = 900

export type StrediskoProDotaz = ChataProDotaz & { lat: number; lng: number }

/** Střediska oblasti se souřadnicemi (bez GPS nemá geosearch kolem čeho hledat). */
export const nactiStrediska = (adresar: string, oblast: string): StrediskoProDotaz[] => {
  if (!existsSync(adresar)) return []
  const out: StrediskoProDotaz[] = []
  for (const f of readdirSync(adresar).sort()) {
    if (!f.endsWith('.yaml') || f.startsWith('_')) continue
    const d = (parse(readFileSync(join(adresar, f), 'utf8')) ?? {}) as Record<string, unknown>
    if (typeof d.slug !== 'string' || typeof d.nazev !== 'string') continue
    if (typeof d.lat !== 'number' || typeof d.lng !== 'number') continue
    out.push({ slug: d.slug, nazev: d.nazev, oblast, profil: 'rucni', lat: d.lat, lng: d.lng })
  }
  return out
}

/** Okruh geosearche kolem středu lanovky — dráha je čára, ne bod. */
export const RADIUS_LANOVKY_MIN_M = 500

/**
 * Slova, podle kterých se pozná, že snímek opravdu ukazuje lanovku.
 *
 * PROČ TO SÍTO JE: u střediska stačí, že fotka pochází z obce — je to snímek
 * MÍSTA. U lanovky ale geosearch kolem dráhy vrátí i kostel, náměstí a kdeco
 * dalšího z téže vsi, a takový snímek by na stránce lanovky tvrdil něco, co
 * na něm není. Bere se proto jen soubor, jehož NÁZEV nebo POPIS mluví
 * o lanovce — česky, polsky, německy i anglicky, protože Commons je
 * mnohojazyčný.
 */
const SLOVA_LANOVKY = [
  'lanovka',
  'lanová dráha',
  'lanove drahy',
  'lanovky',
  'sedačková',
  'kabinová',
  'kolej linowa',
  'kolejka linowa',
  'wyciąg',
  'wyciag',
  'seilbahn',
  'sessellift',
  'cable car',
  'cablecar',
  'ropeway',
  'chairlift',
  'chair lift',
  'gondola',
  'aerial lift',
  'aerial tramway',
]

/** Text stránky souboru, ve kterém se hledají slova o lanovce. */
const textStranky = (s: CommonsStranka): string =>
  [s.title, s.imageinfo?.[0]?.extmetadata?.ImageDescription?.value]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export const jeOLanovce = (s: CommonsStranka): boolean => {
  const text = textStranky(s)
  return SLOVA_LANOVKY.some((slovo) => text.includes(slovo))
}

export type FotkaStrediska = {
  soubor: string
  autor: string
  licence: string
  licenceUrl?: string
  stranka: string
  original: string
  nahled: string
  sirka: number
  vyska: number
  nalezeno: 'geosearch' | 'fulltext'
}

/** Kandidát ze stránky Commons — jen když projde licencí a má doloženého autora. */
export const kandidatZeStranky = (
  s: CommonsStranka,
  nalezeno: FotkaStrediska['nalezeno'],
): FotkaStrediska | { odmitnuto: string } => {
  const info = s.imageinfo?.[0]
  const meta = info?.extmetadata
  const licence = posudLicenci(meta)
  if (!licence.ok) return { odmitnuto: licence.duvod }
  const autor = cistyText(meta?.Artist?.value, 160)
  if (!autor) return { odmitnuto: 'chybí doložený autor (u CC BY/BY-SA je uvedení autora podmínkou licence)' }
  if (!info?.url || !info.descriptionurl || !info.width || !info.height) {
    return { odmitnuto: 'odpověď nenese URL nebo rozměry souboru' }
  }
  return {
    soubor: s.title!,
    autor,
    licence: licence.licence,
    licenceUrl: licence.licenceUrl,
    stranka: info.descriptionurl,
    original: info.url,
    // Náhled 1600 px stačí na hlavičku i kartu a nestahuje se zbytečně 20 MB originálu.
    nahled: info.thumburl ?? info.url,
    sirka: info.width,
    vyska: info.height,
    nalezeno,
  }
}

/**
 * Pořadí kandidátů podle pravidel výběru. `prefer` (redakční volba) vyhrává,
 * pak geosearch nad fulltextem, pak šířka nad výškou, pak větší plocha.
 */
export const seradKandidaty = (kandidati: FotkaStrediska[], prefer?: string): FotkaStrediska[] =>
  [...kandidati].sort((a, b) => {
    if (prefer) {
      if (a.soubor === prefer) return -1
      if (b.soubor === prefer) return 1
    }
    if (a.nalezeno !== b.nalezeno) return a.nalezeno === 'geosearch' ? -1 : 1
    const naSirku = (f: FotkaStrediska) => (f.sirka > f.vyska ? 0 : 1)
    if (naSirku(a) !== naSirku(b)) return naSirku(a) - naSirku(b)
    return b.sirka * b.vyska - a.sirka * a.vyska
  })

export type ZaznamManifestu = {
  slug: string
  nazev: string
  soubor: string
  vybrano: FotkaStrediska
  alternativy: FotkaStrediska[]
  /** Redakční volba — když je vyplněná, další běh vezme tenhle soubor. */
  prefer?: string
}

const MANIFEST = (oblast: string) => join(process.cwd(), 'data', 'strediska', `_fotky-${oblast}.json`)
const MANIFEST_LANOVKY = (oblast: string) =>
  join(process.cwd(), 'data', 'lanovky', `_fotky-${oblast}.json`)

/**
 * Lanovky oblasti jako objekty k dohledání fotky. Bod dotazu je STŘED dráhy,
 * ne stanice: fotograf stojí kdekoli podél lana a od stanice by okruh minul
 * půlku trati. Okruh proto pokrývá aspoň polovinu délky dráhy.
 */
const nactiLanovky = (oblastSlug: string): (StrediskoProDotaz & { radiusM: number; jenOLanovce: boolean })[] => {
  const data = lanovkySeSlugy(oblastSlug)
  return data
    .filter((l) => l.nazev)
    .map((l) => ({
      slug: l.slug,
      nazev: l.nazev!,
      oblast: oblastSlug,
      profil: 'rucni' as const,
      lat: (l.dolni.lat + l.horni.lat) / 2,
      lng: (l.dolni.lng + l.horni.lng) / 2,
      radiusM: Math.max(RADIUS_LANOVKY_MIN_M, Math.round(l.delkaM / 2) + 200),
      jenOLanovce: true,
    }))
}

/**
 * Stažení snímku s opakováním. Dotazy na API opakování dávno mají (DATA-02 se
 * to naučila na 429 od Commons, které limituje sdílené IP Actions runnerů),
 * kdežto stahování obrázku běželo na jeden pokus — a jedna přechodná 429 by
 * tiše nechala středisko bez fotky. Chybějící fotka se hlásí, ale mlčky vzniklá
 * díra se hledá hůř než pád.
 */
const stahniObrazek = async (url: string, pokusy = 3): Promise<Buffer | null> => {
  for (let i = 1; i <= pokusy; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    // 4xx kromě 429 opakování nespraví (403 = blokace, 404 = jiný soubor).
    if (res.status !== 429 && res.status < 500) {
      console.log(`    stažení: HTTP ${res.status} — neopakuji`)
      return null
    }
    if (i === pokusy) {
      console.log(`    stažení: HTTP ${res.status} ani po ${pokusy} pokusech`)
      return null
    }
    const cekat = dobaCekaniMs(i, 15_000, res.headers.get('retry-after'))
    console.log(`    stažení: HTTP ${res.status}, čekám ${Math.round(cekat / 1000)} s a zkouším znovu`)
    await new Promise((r) => setTimeout(r, cekat))
  }
  return null
}

// ── běh ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const bezStahovani = argv.includes('--bez-stahovani')
  const oblast = oblastZArgv(argv)

  const strediska = nactiStrediska(join(process.cwd(), 'data', 'strediska', oblast.slug), oblast.slug)
  const lanovky = nactiLanovky(oblast.slug)
  console.log(
    `Oblast: ${oblast.nazev} — středisek se souřadnicemi: ${strediska.length}, lanovek: ${lanovky.length}`,
  )
  if (!strediska.length && !lanovky.length) return

  if (strediska.length) {
    await zpracujSkupinu({
      druh: 'stredisko',
      objekty: strediska.map((s) => ({ ...s, radiusM: RADIUS_STREDISKA_M, jenOLanovce: false })),
      manifestCesta: MANIFEST(oblast.slug),
      klicManifestu: 'strediska',
      adresarFotek: join(process.cwd(), 'public', 'strediska'),
      cestaVWebu: (slug) => `/strediska/${slug}.jpg`,
      zdroj:
        'Wikimedia Commons (geosearch kolem bodu obce + fulltext podle názvu) — jen licence CC0/CC BY/CC BY-SA/PD s doloženým autorem',
      bezStahovani,
    })
  }

  if (lanovky.length) {
    await zpracujSkupinu({
      druh: 'lanovka',
      objekty: lanovky,
      manifestCesta: MANIFEST_LANOVKY(oblast.slug),
      klicManifestu: 'lanovky',
      adresarFotek: join(process.cwd(), 'public', 'lanovky'),
      cestaVWebu: (slug) => `/lanovky/${slug}.jpg`,
      zdroj:
        'Wikimedia Commons (geosearch kolem středu dráhy + fulltext podle názvu, jen snímky, jejichž název nebo popis mluví o lanovce) — jen licence CC0/CC BY/CC BY-SA/PD s doloženým autorem',
      bezStahovani,
    })
  }
}

type ObjektProDotaz = StrediskoProDotaz & { radiusM: number; jenOLanovce: boolean }

/**
 * Jedna skupina objektů (střediska nebo lanovky) — dohledání, výběr, stažení
 * a zápis manifestu. Obojí běží po stejné trase schválně: kdyby měly lanovky
 * vlastní kopii kódu, licenční síto by se dřív nebo později rozešlo.
 */
const zpracujSkupinu = async (vstup: {
  druh: 'stredisko' | 'lanovka'
  objekty: ObjektProDotaz[]
  manifestCesta: string
  klicManifestu: 'strediska' | 'lanovky'
  adresarFotek: string
  cestaVWebu: (slug: string) => string
  zdroj: string
  bezStahovani: boolean
}) => {
  const { objekty, manifestCesta, klicManifestu, adresarFotek, cestaVWebu, zdroj, bezStahovani } = vstup

  const stary: ZaznamManifestu[] = existsSync(manifestCesta)
    ? ((JSON.parse(readFileSync(manifestCesta, 'utf8')) as Record<string, ZaznamManifestu[]>)[
        klicManifestu
      ] ?? [])
    : []
  const preferDle = new Map(stary.filter((z) => z.prefer).map((z) => [z.slug, z.prefer!]))

  const manifest: ZaznamManifestu[] = []
  const bezFotky: { slug: string; duvod: string }[] = []

  for (const s of objekty) {
    const kandidati: FotkaStrediska[] = []
    const odmitnuti: string[] = []
    for (const [url, druhNalezu] of [
      [urlGeosearch(API_COMMONS, s, s.radiusM), 'geosearch'],
      [urlFulltext(API_COMMONS, s), 'fulltext'],
    ] as const) {
      const json = await stahniJson(url)
      for (const stranka of strankyZOdpovedi(json, druhNalezu)) {
        // U lanovky musí snímek o lanovce opravdu mluvit — geosearch kolem
        // dráhy jinak nabídne kostel z téže vsi.
        if (s.jenOLanovce && !jeOLanovce(stranka)) {
          odmitnuti.push(`${stranka.title}: název ani popis nemluví o lanovce`)
          continue
        }
        const v = kandidatZeStranky(stranka, druhNalezu)
        if ('odmitnuto' in v) odmitnuti.push(`${stranka.title}: ${v.odmitnuto}`)
        else if (!kandidati.some((k) => k.soubor === v.soubor)) kandidati.push(v)
      }
      // Slušnost k API: krátká pauza mezi dotazy (Commons limituje sdílené IP Actions).
      await new Promise((r) => setTimeout(r, dobaCekaniMs(1, 1_200)))
    }

    const serazeni = seradKandidaty(kandidati, preferDle.get(s.slug))
    const vybrano = serazeni[0]
    if (!vybrano) {
      bezFotky.push({ slug: s.slug, duvod: `žádný licenčně čistý kandidát (odmítnuto ${odmitnuti.length})` })
      console.log(`  ${s.nazev}: bez fotky — ${odmitnuti.length} kandidátů neprošlo sítem`)
      continue
    }
    manifest.push({
      slug: s.slug,
      nazev: s.nazev,
      soubor: cestaVWebu(s.slug),
      vybrano,
      alternativy: serazeni.slice(1, 6),
      ...(preferDle.get(s.slug) ? { prefer: preferDle.get(s.slug) } : {}),
    })
    console.log(
      `  ${s.nazev}: ${vybrano.soubor} (${vybrano.sirka}×${vybrano.vyska}, ${vybrano.licence}, ${vybrano.nalezeno}) + ${serazeni.length - 1} alternativ`,
    )

    if (bezStahovani) continue
    const data = await stahniObrazek(vybrano.nahled)
    if (!data) {
      bezFotky.push({ slug: s.slug, duvod: 'stažení selhalo i po opakování' })
      continue
    }
    mkdirSync(adresarFotek, { recursive: true })
    writeFileSync(join(adresarFotek, `${s.slug}.jpg`), data)
  }

  writeFileSync(
    manifestCesta,
    `${JSON.stringify(
      {
        zdroj,
        pozn:
          'Výběr dělá skript podle pravidel v hlavičce data33-fotky-stredisek.ts. Jinou fotku vybereš tak, že k záznamu dopíšeš "prefer": "File:…" a pustíš běh znovu.',
        checked: new Date().toISOString().slice(0, 10),
        [klicManifestu]: manifest,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  console.log(`\nManifest: ${manifestCesta}`)
  console.log(`Se staženou fotkou: ${manifest.length} · bez fotky: ${bezFotky.length}`)
  for (const b of bezFotky) console.log(`- ${b.slug}: ${b.duvod}`)
}

if (process.argv[1]?.endsWith('data33-fotky-stredisek.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
