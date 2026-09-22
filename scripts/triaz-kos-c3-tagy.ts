/**
 * ZBYTEK KOŠE C3 PŘES STROJOVĚ ČITELNÝ DOKLAD — a nejdřív test, jestli
 * takový doklad vůbec něco pozná.
 *
 * Stav ke 22. 9. 2026: koš C3 má 120 kandidátů, přečteno je jich 21 ve
 * dvou frontách (14.–21. 9.). Výtěžnost obou front je 1 z 21 na povýšení,
 * a **15 ze 16 návrhů na vyřazení padlo na téže půlce klíče** —
 * občerstvení jen pro ubytované. Číst zbývajících 99 po jednom je práce
 * na dvacet sessions, a měření z 6. 9. říká, že zbytek koše je slabší,
 * ne silnější (36 kandidátů je nad prahem 250 m od značky).
 *
 * Deník 21. 9. proto položil Michalovi otázku, jestli vzít zbytek koše
 * hromadně přes strojově čitelný doklad. Tenhle skript na tu otázku
 * NEODPOVÍDÁ ROZHODNUTÍM — dělá krok, který musí každé takové
 * rozhodnutí předcházet: **měří, jestli signály čitelné z repu
 * odpovídají tomu, co u přečtených jednadvaceti vyšlo ze čtení pramenů.**
 *
 * Logika je stejná jako u koše C1 (1. 9.) a u role na trase (6. 9.):
 * nejdřív se signál zkalibruje na tom, co už je rozhodnuté, a teprve
 * pokud něco pozná, smí se pustit na nepřečtené. Kdyby signál
 * přečtenou jednadvacítku nerozdělil, je bezcenný i pro zbytek — a to
 * je taky výsledek, který stojí za zápis.
 *
 * MĚŘENÉ SIGNÁLY (všechny z OSM tagů v exportech v repu, bez sítě):
 *
 *   1. `tourism` — `apartment` a `hostel` proti `guest_house`, `chalet`,
 *      `hotel`. Apartmán je z definice ubytování bez veřejné hospody;
 *      pokud se to potvrdí na přečtených, je to nejlevnější dělicí čára,
 *      jakou koš má.
 *
 *   2. GASTRO STOPA NA SAMOTNÉM ELEMENTU — koš C z definice nemá
 *      `amenity=restaurant` (jinak by to nebyl koš C), ale OSM nese
 *      i slabší stopy veřejného provozu: `cuisine`, `food`, `drink:*`,
 *      `opening_hours`, `outdoor_seating`, `takeaway`. Nalezená stopa je
 *      pozvánka ke čtení, ne doklad.
 *
 *   3. LEXIKON JMÉNA — „apartmán", „apartments", „chalupa", „penzion",
 *      „vila", „sruby", „domek" proti „bouda", „schronisko", „bouda",
 *      „hütte". Jméno není doklad ničeho, ale je to signál, který šel
 *      u všech šestnácti vyřazených přečíst dřív, než se otevřel
 *      prohlížeč.
 *
 *   4. ČITELNOST — má element `website`/`contact:website` nebo telefon?
 *      Tohle nerozhoduje o zařazení vůbec; rozhoduje o tom, jestli má
 *      smysl kandidáta dávat do fronty ke čtení, nebo jestli u něj čeká
 *      totéž, co u `chata-u-kohouta` (21. 9.): není co číst.
 *
 * CO SKRIPT NEDOKLÁDÁ: mlčení OSM není doklad absence (poučka z koše E,
 * 31. 8. 2026). Žádný z těchhle signálů neříká, že hospoda není —
 * říkají jen, kde se čtení nejspíš vyplatí a kde ne. Nic se nezapisuje
 * do `data/`, nic se nevyřazuje, nic nepovyšuje.
 *
 *   npx tsx scripts/triaz-kos-c3-tagy.ts              # kalibrace + zbytek koše
 *   npx tsx scripts/triaz-kos-c3-tagy.ts --md         # tabulky do dokumentace
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { kose, nactiExporty } from './triaz-kos-c'

/** Verdikt, se kterým kandidát vyšel ze čtení pramenů (14.–21. 9. 2026). */
export type Verdikt = 'povysit' | 'drzet' | 'vyradit' | 'skrtnuto'

/**
 * Přečtené verdikty se NEOPISUJÍ do skriptu — čtou se ze souhrnné tabulky
 * v `docs/KRKONOSE-TRIAZ-KOSE.md`, aby verdikt žil na jednom místě. Řádky
 * tabulky nesou slugy v backticích, sloupec „verdikt" je jejich kategorie.
 */
export const prectene = (
  dokument = join('docs', 'KRKONOSE-TRIAZ-KOSE.md'),
): Map<string, Verdikt> => {
  const out = new Map<string, Verdikt>()
  if (!existsSync(dokument)) return out
  const text = readFileSync(dokument, 'utf8')
  const za = text.split('### CELÝ KOŠ C3 — souhrn')[1]
  if (!za) return out
  // Řez u dalšího nadpisu — dokument za souhrnem roste a tabulky pozdějších
  // oddílů (např. kalibrace signálů z 22. 9.) do verdiktů nepatří.
  const oddil = za.split(/\n##+ /u)[0]
  for (const radek of oddil.split('\n')) {
    if (!radek.startsWith('|')) continue
    const bunky = radek.split('|').map((b) => b.trim())
    const popis = bunky[1] ?? ''
    let verdikt: Verdikt | null = null
    if (popis.includes('povýšení')) verdikt = 'povysit'
    else if (popis.startsWith('držet')) verdikt = 'drzet'
    else if (popis.includes('škrtnuto')) verdikt = 'skrtnuto'
    else if (popis.includes('VYŘADIT')) verdikt = 'vyradit'
    if (!verdikt) continue
    for (const m of (bunky[3] ?? '').matchAll(/`([a-z0-9-]+)`/gu)) out.set(m[1], verdikt)
  }
  return out
}

/** OSM tagy, které u ubytovacího elementu naznačují veřejný provoz. */
const GASTRO_STOPY = [
  'cuisine',
  'food',
  'drink',
  'opening_hours',
  'outdoor_seating',
  'takeaway',
  'bar',
  'restaurant',
  'microbrewery',
  'diet:vegetarian',
]

/** Slova ve jméně, která popisují pronájem ubytování, ne boudu na trase. */
const LEXIKON_UBYTOVANI = [
  'apartm',
  'apartament',
  'apartment',
  'chalupa',
  'chalupy',
  'penzion',
  'pension',
  'pensjonat',
  'vila',
  'villa',
  'srub',
  'domek',
  'domki',
  'ubytov',
  'noclegi',
  'rezidence',
  'residence',
  'wellness',
]

/** Slova, kterými se hlásí bouda / schronisko / útulna — protipól lexikonu výš. */
const LEXIKON_BOUDA = ['bouda', 'baude', 'schronisko', 'hütte', 'hutte', 'útuln', 'utuln', 'bacow']

export type Signaly = {
  slug: string
  nazev: string
  tourism: string | null
  /** Nalezené gastro stopy v tagech (prázdné pole = žádná). */
  gastroStopy: string[]
  /** Slovo lexikonu ubytování nalezené ve jméně, nebo null. */
  slovoUbytovani: string | null
  /** Slovo lexikonu boudy nalezené ve jméně, nebo null. */
  slovoBouda: string | null
  /** Má element web nebo telefon — tedy je u čeho začít čtení? */
  citelny: boolean
  verdikt: Verdikt | null
}

const najdi = (jmeno: string, lexikon: string[]): string | null => {
  const n = jmeno.toLowerCase()
  return lexikon.find((s) => n.includes(s)) ?? null
}

export const signalyC3 = (oblast = 'krkonose', koren = 'data'): Signaly[] => {
  const { c3 } = kose(oblast, koren)
  const exporty = nactiExporty(join(koren, 'kandidati', oblast))
  const verdikty = prectene()
  return c3.map((k) => {
    const tags = (k.osm ? exporty.get(k.osm)?.tags : undefined) ?? {}
    const jmeno = tags.name ?? k.nazev
    return {
      slug: k.slug,
      nazev: k.nazev,
      tourism: k.tourism,
      gastroStopy: GASTRO_STOPY.filter((t) =>
        Object.keys(tags).some((klic) => klic === t || klic.startsWith(`${t}:`)),
      ),
      slovoUbytovani: najdi(jmeno, LEXIKON_UBYTOVANI),
      slovoBouda: najdi(jmeno, LEXIKON_BOUDA),
      citelny: Boolean(
        tags.website ?? tags['contact:website'] ?? tags.phone ?? tags['contact:phone'],
      ),
      verdikt: verdikty.get(k.slug) ?? null,
    }
  })
}

// ── Výpis ───────────────────────────────────────────────────────────────────

/**
 * Kalibrace signálu na přečtených: kolik z nich signál označil, a kolik
 * z označených skutečně skončilo návrhem na vyřazení. Signál má cenu jen
 * tehdy, když je pravá strana výrazně jinde než základní výtěžnost koše.
 */
const kalibruj = (
  nazev: string,
  vzorek: Signaly[],
  plati: (s: Signaly) => boolean,
): { nazev: string; oznacil: number; ztohoVyradit: number; minul: string[] } => {
  const oznacene = vzorek.filter(plati)
  return {
    nazev,
    oznacil: oznacene.length,
    ztohoVyradit: oznacene.filter((s) => s.verdikt === 'vyradit').length,
    // Kdo NENÍ na vyřazení, ale signál ho označil — to je cena omylu.
    minul: oznacene.filter((s) => s.verdikt !== 'vyradit').map((s) => s.slug),
  }
}

const main = (): void => {
  const md = process.argv.includes('--md')
  const vse = signalyC3()
  const prectenych = vse.filter((s) => s.verdikt !== null)
  const zbytek = vse.filter((s) => s.verdikt === null)

  const signaly: Array<[string, (s: Signaly) => boolean]> = [
    ['tourism=apartment nebo hostel', (s) => s.tourism === 'apartment' || s.tourism === 'hostel'],
    ['jméno nese slovo ubytování', (s) => s.slovoUbytovani !== null],
    [
      'jméno nese slovo ubytování a ŽÁDNÉ slovo boudy',
      (s) => s.slovoUbytovani !== null && s.slovoBouda === null,
    ],
    ['žádná gastro stopa v tagech', (s) => s.gastroStopy.length === 0],
    ['bez webu i telefonu (není co číst)', (s) => !s.citelny],
  ]

  console.log(`KOŠ C3 — strojově čitelné signály nad ${vse.length} kandidáty`)
  console.log(`přečteno a rozhodnuto: ${prectenych.length} · zbývá: ${zbytek.length}\n`)

  console.log('KALIBRACE NA PŘEČTENÝCH — signál má cenu jen tam, kde dělí:\n')
  if (md)
    console.log(
      '| signál | označil z přečtených | z toho na vyřazení | koho označil mimo |\n| --- | --- | --- | --- |',
    )
  for (const [nazev, plati] of signaly) {
    const k = kalibruj(nazev, prectenych, plati)
    const mimo = k.minul.length === 0 ? '—' : k.minul.map((s) => `\`${s}\``).join(', ')
    if (md)
      console.log(
        `| ${nazev} | ${k.oznacil} / ${prectenych.length} | ${k.ztohoVyradit} | ${mimo} |`,
      )
    else {
      console.log(`  ${nazev}`)
      console.log(
        `    označil ${k.oznacil} z ${prectenych.length} přečtených, z toho ${k.ztohoVyradit} na vyřazení`,
      )
      console.log(`    mimo vyřazení označil: ${k.minul.length === 0 ? '—' : k.minul.join(', ')}`)
    }
  }

  const zaklad = prectenych.filter((s) => s.verdikt === 'vyradit').length
  console.log(
    `\n  (pro srovnání: základní podíl vyřazení mezi přečtenými je ${zaklad}/${prectenych.length})`,
  )

  console.log('\nROZLOŽENÍ `tourism` V CELÉM KOŠI:\n')
  const dle = new Map<string, { celkem: number; precteno: number; vyrazeno: number }>()
  for (const s of vse) {
    const klic = s.tourism ?? '—'
    const z = dle.get(klic) ?? { celkem: 0, precteno: 0, vyrazeno: 0 }
    z.celkem += 1
    if (s.verdikt !== null) z.precteno += 1
    if (s.verdikt === 'vyradit') z.vyrazeno += 1
    dle.set(klic, z)
  }
  if (md)
    console.log('| tourism | v koši | přečteno | z toho na vyřazení |\n| --- | --- | --- | --- |')
  for (const [klic, z] of [...dle.entries()].sort((a, b) => b[1].celkem - a[1].celkem)) {
    if (md) console.log(`| \`${klic}\` | ${z.celkem} | ${z.precteno} | ${z.vyrazeno} |`)
    else
      console.log(
        `  ${klic.padEnd(14)} v koši ${String(z.celkem).padStart(3)} · přečteno ${z.precteno} · na vyřazení ${z.vyrazeno}`,
      )
  }

  const sGastroStopou = zbytek.filter((s) => s.gastroStopy.length > 0)
  console.log(
    `\nZBYTEK KOŠE (${zbytek.length}) — kandidáti s gastro stopou v tazích: ${sGastroStopou.length}\n`,
  )
  if (md)
    console.log('| kandidát | tourism | gastro stopy | web/telefon |\n| --- | --- | --- | --- |')
  for (const s of sGastroStopou) {
    if (md)
      console.log(
        `| \`${s.slug}\` — ${s.nazev} | \`${s.tourism}\` | ${s.gastroStopy.join(', ')} | ${s.citelny ? 'ano' : 'ne'} |`,
      )
    else
      console.log(
        `  ${s.slug} — ${s.nazev} (${s.tourism}): ${s.gastroStopy.join(', ')}${s.citelny ? '' : ' · BEZ webu i telefonu'}`,
      )
  }

  const necitelni = zbytek.filter((s) => !s.citelny)
  console.log(`\nZBYTEK KOŠE — bez webu i telefonu v OSM: ${necitelni.length} z ${zbytek.length}`)
  console.log('  (není to doklad ničeho — jen to, že čtení u nich začne dohledávkou podle jména)')

  // ── Nejlépe zkalibrovaný signál pustěný na nepřečtené ────────────────────
  // Lexikon jména je jediný signál, který na přečtených neoznačil ANI
  // JEDNOHO mimo vyřazení. Proto — a jen proto — se smí pustit dál.
  const lexikonem = zbytek.filter((s) => s.slovoUbytovani !== null)
  console.log(`\nLEXIKON JMÉNA NA NEPŘEČTENÝCH — označil ${lexikonem.length} z ${zbytek.length}:\n`)
  if (md)
    console.log(
      '| kandidát | tourism | slovo ve jméně | gastro stopa | web/telefon |\n| --- | --- | --- | --- | --- |',
    )
  for (const s of lexikonem.sort((a, b) => a.slug.localeCompare(b.slug, 'cs'))) {
    const stopa = s.gastroStopy.length === 0 ? '—' : s.gastroStopy.join(', ')
    if (md)
      console.log(
        `| \`${s.slug}\` — ${s.nazev} | \`${s.tourism}\` | ${s.slovoUbytovani} | ${stopa} | ${s.citelny ? 'ano' : 'ne'} |`,
      )
    else
      console.log(
        `  ${s.slug} — ${s.nazev} (${s.tourism}, „${s.slovoUbytovani}")${s.slovoBouda ? ` · ALE NESE I „${s.slovoBouda}"` : ''}${s.gastroStopy.length ? ` · stopa: ${stopa}` : ''}`,
      )
  }

  // Obě varianty lexikonu (se slovem boudy a bez něj) daly na přečtených
  // TOTÉŽ číslo — vzorek mezi nimi nerozhoduje. Na nepřečtených se ale
  // rozcházejí, a to je podstatnější než shoda na kalibraci.
  const iBouda = lexikonem.filter((s) => s.slovoBouda !== null)
  console.log(
    `\n  Z toho ${iBouda.length} nese ve jméně SOUČASNĚ slovo boudy: ${
      iBouda.map((s) => s.slug).join(', ') || '—'
    }`,
  )
  console.log('  Přísnější varianta signálu (ubytování a žádné slovo boudy) je na kalibraci')
  console.log('  k nerozeznání od volnější — rozejdou se až tady.')
  console.log('\n  POZOR: tohle NENÍ návrh na vyřazení. Lexikon je pořadí čtení, ne verdikt —')
  console.log('  kalibrace stojí na šesti případech a jméno nikdy nedokládá, co uvnitř je.')
}

if (process.argv[1]?.endsWith('triaz-kos-c3-tagy.ts')) main()
