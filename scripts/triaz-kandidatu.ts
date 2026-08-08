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

/**
 * Jméno nese slovo, které v našem oboru znamená chatu. Shodné se SLOVA_BOUDY
 * z data01 (odtud kandidáti pocházejí) + slova, která přinesla triáž Šumavy.
 *
 * SIGNÁL MÁ DVĚ SÍLY (rozlišeno 8. 8. 2026, viz `PRONAJEM_TAGY` níž).
 * SILNÁ slova pojmenovávají v našem oboru rovnou objekt služby: „bouda",
 * „Hütte", „Berggasthof", „schronisko", „Schutzhaus", „útulna". Kdo tak dům
 * pojmenuje, hlásí se k horské chatě.
 *
 * SLABÁ jsou česká „chata / chatka / chalupa". Znamenají jak Chatu KČT
 * Prášily, tak víkendový domek u Lipna — v Česku je „chata" běžné slovo pro
 * rekreační stavení a v šumavském exportu je jich desítky. Samo o sobě slovo
 * dál stačí na koš NADĚJNÉ (rozhodne až člověk), ale PROTI tagu pronájmu
 * neváží nic: „Chata Sandra" s `tourism=apartment` v Lipně nad Vltavou není
 * rozpor, jen apartmán, který se jmenuje česky.
 */
const JMENO_SILNE = new RegExp(
  `${WB0}(?:` +
    // slova, která končí přesně tady — jinak „Hütte" sebere „Hutterer"
    // a „Bäckerei Hutterer" spadne mezi nadějné (chyceno při prvním běhu)
    `(?:bouda|boudy|boudě|schronisko|hut[ae]|hütte|` +
    `hutte|hüttn|huttn|baude|schutzhaus|schutzhütte|berggasthof|berghaus|` +
    `berggasthaus|berghotel|jagdhaus|almhütte|alm|kiosek|rozhledna|` +
    `aussichtsturm|turm|útulna|utulna|hájenka|hajenka)${WB1}` +
    // předpony, u kterých na konci slova nezáleží (skloňování, složeniny)
    `|(?:horsk|útuln|utuln|občerstven|obcerstven|vyhlídk|vyhlidk|schutzhütt)` +
  `)`,
  'iu',
)
const JMENO_SLABE = new RegExp(`${WB0}(?:chata|chatky|chatka|chalupa)${WB1}`, 'iu')

/** Nejsilnější nález ve jméně; `sila` rozhoduje jen proti tagu pronájmu. */
function jmennySignal(nazev: string): { slovo: string; sila: 'silny' | 'slaby' } | null {
  const silne = JMENO_SILNE.exec(nazev)?.[0]
  if (silne) return { slovo: silne, sila: 'silny' }
  const slabe = JMENO_SLABE.exec(nazev)?.[0]
  return slabe ? { slovo: slabe, sila: 'slaby' } : null
}

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
 * TAGY PRONÁJMU — v OSM znamenají lůžko k pronajmutí, ne obsluhovanou chatu.
 *
 * `tourism=chalet` je pronajímaný domek k samostatnému vaření
 * (https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dchalet). V šumavském
 * exportu je to největší skupina vůbec — 154 kandidátů — a v prvním běhu
 * spadla celá mezi nadějné, což koš úplně znehodnotilo.
 *
 * `tourism=apartment` je pronajímaná bytová jednotka
 * (https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dapartment) — doplněno
 * 8. 8. 2026: čtrnáct šumavských kandidátů s tímhle tagem sedělo mezi
 * nadějnými jen proto, že se jmenují „Chata …" nebo „Chalupa …" (Lipno
 * nad Vltavou, Kvilda). Tag je u nich konkrétnější než jméno.
 *
 * Sám o sobě tedy tag pronájmu míří MIMO klíč. Když jméno nese boudové
 * slovo, je to rozpor tagu a jména a rozhodne až člověk — přesně takový
 * případ byl Zwieseler Hütte i Waldvereinshütte (obojí Selbstversorger,
 * vyřazeno 6. 8. s pramenem).
 *
 * KOLIK JMENNÉHO SIGNÁLU TAG PŘEBIJE, SE LIŠÍ TAG OD TAGU — a rozhodlo
 * o tom měření nad vlastním korpusem, ne úvaha:
 *
 *   `chalet` nepřebíjí ani slabé české „chata": máme doložený PROTIPŘÍKLAD.
 *   Turnerova chata na Šumavě měla v OSM `tourism=chalet` a jmenuje se
 *   prostě „chata" — a je to publikovaný profil. Kdyby ji slabé jméno
 *   neuchránilo, koš by ji byl poslal mezi hromadné.
 *
 *   `apartment` slabé „chata / chalupa" přebíjí (rozpor u něj dělá jen
 *   SILNÉ slovo). Tag míří na bytovou jednotku v domě, ne na chatovou
 *   stavbu, je tedy konkrétnější — a mezi VŠEMI povýšenými profily všech
 *   oblastí z něj nevzešel ani jeden (měřeno 8. 8. 2026, protipříklad
 *   žádný; jediný povýšený s tagem pronájmu je právě Turnerova chata).
 *
 * POZOR: „MIMO KLÍČ" pořád není vyřazení. Tag je pramen o dnešním provozu,
 * ne o turistické minulosti objektu — tu klíč zařazení taky váží a z tagu
 * se nepozná. Koš určuje jen pořadí práce.
 */
const PRONAJEM_TAGY: Record<string, { popis: string; prebijiSlabeJmeno: boolean }> = {
  chalet: { popis: 'pronajímaný domek, ne obsluhovaná chata', prebijiSlabeJmeno: false },
  apartment: {
    popis: 'pronajímaná bytová jednotka, ne obsluhovaná chata',
    prebijiSlabeJmeno: true,
  },
}

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

/**
 * Slugy z rozhodovacích seznamů. POZOR: `_vyrazeno.yaml` je vede ve DVOU
 * tvarech — holý `kynast` i s předponou oblasti `sumava/waldvereinshutte`
 * (33 ze 49 záznamů k 8. 8. 2026). Porovnávat se musí poslední úsek cesty,
 * jinak koš ukazuje jako nezpracované i to, co redakce rozhodla: přesně tak
 * tu 8. 8. 2026 seděly mezi NADĚJNÝMI Zwieseler Hütte a Waldvereinshütte,
 * obě vyřazené už 6. 8. s pramenem. U jizerských záznamů se to neprojevilo
 * jen proto, že se tam soubory kandidátů po vyřazení mazaly.
 */
function nactiSeznam(cesta: string, klic: string): Set<string> {
  if (!existsSync(cesta)) return new Set()
  const d = parse(readFileSync(cesta, 'utf8')) as Record<string, unknown>
  const polozky = Array.isArray(d?.[klic]) ? (d[klic] as Array<Record<string, unknown>>) : []
  return new Set(polozky.map((p) => String(p.slug ?? '').split('/').pop() ?? ''))
}

export function zatrid(nazev: string, poznamky: string, typ: string): [Kos, string] {
  // Tag z OSM váží víc než jméno: „Waldhäusl" s alpine_hut je nadějnější
  // než „Waldhäusl" bez tagu, i když se jméno nemění.
  if (typ) return ['NADEJNE', `typ z OSM: ${typ}`]
  const tag = TAG_Z_POZNAMEK.exec(poznamky)?.[1]
  if (tag && NADEJNE_TAGY.has(tag)) return ['NADEJNE', `OSM tourism=${tag}`]
  const jmeno = jmennySignal(nazev)
  const pronajem = tag ? PRONAJEM_TAGY[tag] : undefined
  if (pronajem) {
    const rozpor = jmeno && (jmeno.sila === 'silny' || !pronajem.prebijiSlabeJmeno)
    return rozpor
      ? ['POSOUDIT', `rozpor: OSM tourism=${tag} (pronájem) × jméno nese „${jmeno.slovo}"`]
      : ['MIMO', `OSM tourism=${tag} — ${pronajem.popis}`]
  }
  for (const [duvod, vzor] of MIMO_KLIC) {
    const s = vzor.exec(nazev)
    if (s) return ['MIMO', `${duvod} — „${s[0]}"`]
  }
  if (jmeno) return ['NADEJNE', `jméno nese „${jmeno.slovo}"`]
  return ['POSOUDIT', 'žádný signál ve jméně ani v tazích']
}

// Zbytek souboru je CLI. Běží jen při přímém spuštění, aby se dal `zatrid`
// importovat v testu, aniž by se přitom vypsaly koše celé oblasti.
const spustenoPrimo = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/triaz-kandidatu.ts')

const oblast = process.argv[2]?.startsWith('--') ? 'sumava' : (process.argv[2] ?? 'sumava')
const jakoMd = process.argv.includes('--md')

if (spustenoPrimo) {
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
}
