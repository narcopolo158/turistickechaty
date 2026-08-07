/**
 * TRIÁŽNÍ PŘEDTŘÍDĚNÍ KANDIDÁTŮ — podklad pro redakci, ne rozhodnutí.
 *
 * Po doběhu DATA-01 zbude v oblasti stovky kandidátů (Šumava: 336, z toho
 * 299 bez typu z OSM tagů). Projít je jeden po druhém očima je práce na
 * dny a hlavně je to práce, kterou z devíti desetin dělá jméno objektu:
 * „Bäckerei Hutterer" ani „Alps Resorts - Englmar Chalets" žádný klíč
 * zařazení nesplní, kdežto „Berggasthof Lusen" skoro jistě ano.
 *
 * Skript proto kandidáty jen ROZTŘÍDÍ DO KOŠŮ podle signálů ve jméně
 * a v OSM tazích a ke každému napíše, který signál rozhodl. Nic nemaže,
 * nikam nezapisuje do dat a nic nepovyšuje — výstup je seznam k práci:
 *
 *   NADĚJNÉ      jméno nese „boudové" slovo (chata/bouda/Hütte/Berggasthof…)
 *                nebo OSM tag horské chaty → vzít v triáži nejdřív
 *   MIMO KLÍČ    jméno nese signál ubytování bez veřejného občerstvení
 *                (apartmán, Ferienwohnung, penzion, kemp) nebo služby,
 *                která do průvodce nepatří (pekárna, obchod, banka)
 *   K POSOUZENÍ  ani jedno — musí přečíst člověk
 *
 * POZOR NA VÝKLAD: „MIMO KLÍČ" NENÍ VYŘAZENÍ. Klíč zařazení (rozhodnutí
 * Michala 26. 7. 2026) se ptá i na turistickou MINULOST objektu, a tu
 * z názvu nepozná nikdo — bývalá bouda se dnes může jmenovat „Apartmány
 * u lesa". Vyřazení patří do `data/kandidati/_vyrazeno.yaml` a dělá ho
 * redakce s pramenem, ne tenhle skript. Koš slouží k tomu, aby se
 * nadějné objekty dělaly první a zbytek se probíral hromadně.
 *
 *   npx tsx scripts/triaz-kandidatu.ts [oblast]     # výchozí: sumava
 *   npx tsx scripts/triaz-kandidatu.ts sumava --md  # tabulka do dokumentu
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

// POZOR: v tomhle souboru se nesmí objevit `\b` ani `\w` — viz komentář v lib.ts.
const WB0 = '(?<![\\p{L}\\p{N}_])'
const WB1 = '(?![\\p{L}\\p{N}_])'

/** Jméno nese slovo, které v našem oboru znamená chatu. Shodné se SLOVA_BOUDY
 *  z data01 (odtud kandidáti pocházejí) + slova, která přinesla triáž Šumavy. */
const NADEJNE_JMENO = new RegExp(
  `${WB0}(?:` +
    // slova, která končí přesně tady — jinak „Hütte" sebere „Hutterer"
    // a „Bäckerei Hutterer" spadne mezi nadějné (chyceno při prvním běhu)
    `(?:chata|chatky|chatka|chalupa|bouda|boudy|boudě|schronisko|hut[ae]|hütte|` +
    `hutte|hüttn|huttn|baude|schutzhaus|schutzhütte|berggasthof|berghaus|` +
    `berggasthaus|berghotel|jagdhaus|almhütte|alm|kiosek|rozhledna|` +
    `aussichtsturm|turm|útulna|utulna|hájenka|hajenka)${WB1}` +
    // předpony, u kterých na konci slova nezáleží (skloňování, složeniny)
    `|(?:horsk|útuln|utuln|občerstven|obcerstven|vyhlídk|vyhlidk|schutzhütt)` +
  `)`,
  'iu',
)

/**
 * OSM tag objektu z interních poznámek kandidáta. POZOR NA PAST: každý
 * kandidát nese v poznámkách LEGENDU („alpine_hut = obsluhovaná,
 * wilderness_hut = útulna"), takže hledat v poznámkách holá slova
 * `alpine_hut` znamená označit za nadějné úplně všechno — přesně to
 * udělal první běh (305 z 305). Vytahuje se proto jen skutečná hodnota
 * za `tourism=`, a `tourism=undefined` znamená, že OSM typ nenese.
 */
const TAG_Z_POZNAMEK = /tourism=([a-z_]+)/iu
const NADEJNE_TAGY = new Set(['alpine_hut', 'wilderness_hut', 'hut'])
/**
 * `tourism=chalet` je v OSM PRONAJÍMANÝ DOMEK k samostatnému vaření, ne
 * obsluhovaná horská chata (https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dchalet).
 * V šumavském exportu je to největší skupina vůbec — 165 kandidátů —
 * a v prvním běhu spadla celá mezi nadějné, což koš úplně znehodnotilo.
 * Sám o sobě tedy míří MIMO klíč; když ale jméno nese boudové slovo,
 * je to rozpor tagu a jména („…hütte" s tagem pronájmu) a rozhodne
 * až člověk — přesně takový případ byl Zwieseler Hütte i Waldvereinshütte
 * (obojí Selbstversorger, vyřazeno 6. 8. s pramenem).

/**
 * Signály, že objekt do průvodce nepatří. Řazeno podle toho, jak často se
 * v šumavském exportu trefily — nejdřív ubytování bez veřejné služby, pak
 * podniky, které nejsou o turistice vůbec.
 */
const MIMO_KLIC: Array<[string, RegExp]> = [
  ['ubytování bez veřejné služby', new RegExp(
    `${WB0}(apartmán|apartman|apartment|appartement|ferienwohnung|ferienhaus|` +
      `ferienhäus|ferienhaus|feriendorf|ferienpark|chalets|chalet${WB0}|` +
      `penzion|pension|zimmer|gästehaus|gastehaus|privatzimmer|` +
      `holiday|resort|villa|vila${WB0}|bungalow|camping|kemp${WB0}|` +
      `campingplatz|jugendherberge|hostel)`, 'iu')],
  ['služba mimo obor', new RegExp(
    `${WB0}(bäckerei|backerei|pekárna|pekarna|metzgerei|řeznictví|` +
      `supermarkt|obchod|shop${WB0}|tankstelle|čerpací|apotheke|lékárna|` +
      `bank${WB0}|sparkasse|friseur|kadeřnictví|atelierhaus|galerie|` +
      `museum|muzeum|kirche|kostel|kaple|kapelle|schule|škola)`, 'iu')],
  ['městský podnik', new RegExp(
    `${WB0}(beach bar|cocktail|pizzeria|pizza|kebab|bistro${WB0}|` +
      `eiscafé|eiscafe|eisdiele|zmrzlin|steakhouse|sushi)`, 'iu')],
]

type Kos = 'NADEJNE' | 'MIMO' | 'POSOUDIT'
interface Zaznam {
  slug: string
  nazev: string
  zeme: string
  typ: string
  kos: Kos
  duvod: string
}

function nactiSeznam(cesta: string, klic: string): Set<string> {
  if (!existsSync(cesta)) return new Set()
  const d = parse(readFileSync(cesta, 'utf8')) as Record<string, unknown>
  const polozky = Array.isArray(d?.[klic]) ? (d[klic] as Array<Record<string, unknown>>) : []
  return new Set(polozky.map((p) => String(p.slug ?? '')))
}

function zatrid(nazev: string, poznamky: string, typ: string): [Kos, string] {
  // Tag z OSM váží víc než jméno: „Waldhäusl" s alpine_hut je nadějnější
  // než „Waldhäusl" bez tagu, i když se jméno nemění.
  if (typ) return ['NADEJNE', `typ z OSM: ${typ}`]
  const tag = TAG_Z_POZNAMEK.exec(poznamky)?.[1]
  if (tag && NADEJNE_TAGY.has(tag)) return ['NADEJNE', `OSM tourism=${tag}`]
  const jmeno = NADEJNE_JMENO.exec(nazev)?.[0]
  if (tag === 'chalet') {
    return jmeno
      ? ['POSOUDIT', `rozpor: OSM tourism=chalet (pronájem) × jméno nese „${jmeno}"`]
      : ['MIMO', 'OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata']
  }
  for (const [duvod, vzor] of MIMO_KLIC) {
    const s = vzor.exec(nazev)
    if (s) return ['MIMO', `${duvod} — „${s[0]}"`]
  }
  if (jmeno) return ['NADEJNE', `jméno nese „${jmeno}"`]
  return ['POSOUDIT', 'žádný signál ve jméně ani v tazích']
}

const oblast = process.argv[2]?.startsWith('--') ? 'sumava' : (process.argv[2] ?? 'sumava')
const jakoMd = process.argv.includes('--md')

const adresar = join('data/kandidati', oblast)
if (!existsSync(adresar)) {
  console.error(`✗ oblast „${oblast}" nemá adresář kandidátů (${adresar})`)
  process.exit(1)
}

const publikovane = new Set(
  existsSync(join('data/chaty', oblast))
    ? readdirSync(join('data/chaty', oblast))
        .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
        .map((f) => f.replace(/\.yaml$/, ''))
    : [],
)
const odlozene = nactiSeznam('data/kandidati/_odlozeno.yaml', 'odlozeno')
const vyrazene = nactiSeznam('data/kandidati/_vyrazeno.yaml', 'vyrazeno')

const zaznamy: Zaznam[] = []
let preskoceno = 0
for (const soubor of readdirSync(adresar).sort()) {
  if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
  const slug = soubor.replace(/\.yaml$/, '')
  if (publikovane.has(slug) || odlozene.has(slug) || vyrazene.has(slug)) {
    preskoceno++
    continue
  }
  const d = parse(readFileSync(join(adresar, soubor), 'utf8')) as Record<string, unknown>
  const nazev = String(d.nazev ?? slug)
  const poznamky = String(d.interniPoznamky ?? '')
  const typ = String(d.typ ?? '')
  const [kos, duvod] = zatrid(nazev, poznamky, typ)
  zaznamy.push({ slug, nazev, zeme: String(d.zeme ?? ''), typ, kos, duvod })
}

const kose: Kos[] = ['NADEJNE', 'POSOUDIT', 'MIMO']
const nadpisy: Record<Kos, string> = {
  NADEJNE: 'NADĚJNÉ — vzít v triáži nejdřív',
  POSOUDIT: 'K POSOUZENÍ — musí přečíst člověk',
  MIMO: 'MIMO KLÍČ dle jména — probrat hromadně, NENÍ to vyřazení',
}

if (jakoMd) {
  for (const kos of kose) {
    const v = zaznamy.filter((z) => z.kos === kos)
    console.log(`\n### ${nadpisy[kos]} (${v.length})\n`)
    console.log('| kandidát | země | signál |')
    console.log('|---|---|---|')
    for (const z of v) console.log(`| \`${z.slug}\` — ${z.nazev} | ${z.zeme} | ${z.duvod} |`)
  }
} else {
  for (const kos of kose) {
    const v = zaznamy.filter((z) => z.kos === kos)
    console.log(`\n=== ${nadpisy[kos]} — ${v.length} ===`)
    for (const z of v) console.log(` * ${z.slug.padEnd(38)} ${z.zeme}  ${z.duvod}`)
  }
}

const pocty = kose.map((k) => `${k} ${zaznamy.filter((z) => z.kos === k).length}`).join(' · ')
console.log(`\noblast ${oblast} | kandidatu k triazi: ${zaznamy.length} | ${pocty}`)
console.log(`preskoceno (publikovane/odlozene/vyrazene): ${preskoceno}`)
