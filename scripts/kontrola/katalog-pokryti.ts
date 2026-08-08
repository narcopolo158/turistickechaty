/**
 * Pokrytí externího katalogu daty průvodce — SEZNAM K POSOUZENÍ, ne verdikt.
 *
 * Pro každou oblast, která má v `scripts/oblasti.ts` vyplněné `katalogPohori`,
 * projde katalogové objekty a řekne, které z nich NEMAJÍ v repu ani
 * publikovaný profil, ani kandidáta. To je jediná mezera z celé pipeline,
 * kterou nezachytí nic jiného: DATA-01 stahuje z OSM, takže objekt, který
 * v OSM není nebo je tam civilně tagovaný, prostě nepřijde — a report běhu
 * ukáže úspěch, protože z jeho pohledu se nic nestalo.
 *
 * PROČ VZNIKLA. 8. 8. 2026 se ručním porovnáním našly dvě takové mezery po
 * sobě: v Jeseníkách chyběl katalogový Hotel Praděd (1491 m, nejvýše položený
 * objekt oblasti) a v Beskydech LIBUŠÍN a CHATA NA RADHOŠTI — dva nejznámější
 * objekty pohoří. U Beskyd měla mezeru pokrýt dohledávka podle jmen
 * z katalogu, ale ta tiše selhala na běhové chybě Overpassu (viz
 * `scripts/kontrola/exporty.ts` a DATA-37). Ruční porovnání je ale samo
 * nespolehlivé a nedělá se pravidelně, takže se to počítá tady.
 *
 *   npx tsx scripts/kontrola/katalog-pokryti.ts [slug oblasti …]
 *
 * NEROZHODUJE (návratový kód vždy 0): mezera je PRÁCE, ne vada. Objekt může
 * v OSM chybět, může být pod jiným jménem, může být zaniklý nebo mimo klíč
 * zařazení. Report má říct, kde se má hledat — rozhodnout musí redakce
 * s pramenem. Kdyby kontrola rozhodovala, zablokovala by CI kvůli tomu, že je
 * práce rozdělaná; a to je přesně ten druh kontroly, kterou lidi vypnou.
 *
 * PÁROVÁNÍ JMENEM JE SLABÉ A JE TO PŘIZNANÉ — proto má report TŘI kategorie,
 * ne dvě:
 *   • SILNÁ SHODA — `typShodyNazvu` z DATA-05 (rovnost po normalizaci, nebo
 *     obsažení jednoho jména v druhém). Tichá, do výpisu nejde.
 *   • SLABÁ SHODA — silná selhala, ale jména mají společné rozlišující slovo
 *     (po odstranění obecných částí jako „schronisko", „chata", „hotel",
 *     „na", „pod"). Vypisuje se K PŘEČTENÍ, protože právě tady se pozná
 *     polská deklinace: „Schronisko Hala Miziowa" (katalog) × „Schronisko na
 *     Hali Miziowej" (OSM) je zjevně týž objekt, ale žádné jméno neobsahuje
 *     druhé. Bez téhle kategorie by report tvrdil, že v Beskydech chybí
 *     většina polských schronisek, a to není pravda.
 *   • BEZ ZÁZNAMU — ani jedno.
 * Opačný směr chyby zůstává: falešná silná shoda mezeru ZAMLČÍ („Chata na
 * Radhošti" by se spárovala s „Radhošťským rybníkem", kdyby takový kandidát
 * existoval — a přesně to se 8. 8. 2026 při ručním hledání stalo). Proto se
 * u slabých shod vypisuje, ČÍM se objekt spároval, a proto je tenhle report
 * pomůcka pro čtení, ne rozhodnutí.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { normalizuj, typShodyNazvu } from '../data05-razitkuj-parovani'
import { OBLASTI } from '../oblasti'

type KatalogZaznam = {
  Název?: string
  'Alternativní název'?: string
  Pohoří?: string
  'Nadmořská výška (m)'?: number | null
  'Nejbližší obec nebo uzel'?: string
  Stav?: string
}

type Objekt = { slug: string; nazvy: string[]; kde: string }

const KATALOG_CESTA = join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json')

/** Načte názvy + aliasy ze všech YAML v adresáři (profily i kandidáti). */
const nactiZAdresare = (dir: string, kde: string): Objekt[] => {
  if (!existsSync(dir)) return []
  const out: Objekt[] = []
  for (const soubor of readdirSync(dir)) {
    if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
    const d = parse(readFileSync(join(dir, soubor), 'utf8')) as {
      nazev?: string
      slug?: string
      aliasy?: { nazev?: string }[]
    } | null
    if (!d?.nazev) continue
    const aliasy = (d.aliasy ?? []).map((a) => a?.nazev).filter((x): x is string => !!x)
    out.push({ slug: d.slug ?? soubor.replace(/\.yaml$/, ''), nazvy: [d.nazev, ...aliasy], kde })
  }
  return out
}

export type Mezera = {
  oblast: string
  nazev: string
  vyska: number | null
  uzel: string
  pohori: string
}

/**
 * Obecné části jmen chat ve čtyřech jazycích korpusu. Po jejich odstranění
 * zbude rozlišující slovo — jméno hory, haly nebo osoby.
 */
const OBECNE = new Set([
  'schronisko',
  'schroniska',
  'bacowka',
  'chata',
  'chaty',
  'chatka',
  'chalupa',
  'hotel',
  'horsky',
  'horska',
  'turisticka',
  'utulna',
  'utulna',
  'pttk',
  'ssm',
  'zhp',
  'gorskie',
  'berghaus',
  'berggasthof',
  'huette',
  'hutte',
  'haus',
  'dom',
  'penzion',
  'restaurace',
  'rozhledna',
  'vez',
])

/** Rozlišující slova jména, zkrácená na pět znaků (deklinace se tím srovná). */
const rozlisujici = (s: string): Set<string> => {
  const out = new Set<string>()
  for (const slovo of normalizuj(s).split(' ')) {
    if (slovo.length < 4 || OBECNE.has(slovo)) continue
    out.add(slovo.slice(0, 5))
  }
  return out
}

const slabaShoda = (a: string[], b: string): boolean => {
  const kb = rozlisujici(b)
  if (!kb.size) return false
  for (const na of a) {
    const ka = rozlisujici(na)
    for (const t of ka) if (kb.has(t)) return true
  }
  return false
}

export type PokrytiOblasti = {
  oblast: string
  vKatalogu: number
  silne: { nazev: string; s: string; kde: string }[]
  slabe: { nazev: string; s: string; kde: string }[]
  mezery: Mezera[]
}

export function pokrytiOblasti(
  slug: string,
  katalogPohori: string[],
  katalog: KatalogZaznam[],
  objekty: Objekt[],
): PokrytiOblasti {
  const vOblasti = katalog.filter((r) => katalogPohori.includes(String(r['Pohoří'] ?? '')))
  const silne: PokrytiOblasti['silne'] = []
  const slabe: PokrytiOblasti['slabe'] = []
  const mezery: Mezera[] = []
  for (const r of vOblasti) {
    const nazev = String(r['Název'] ?? '').trim()
    if (!nazev) continue
    const alt = String(r['Alternativní název'] ?? '').trim()
    const hledane = alt ? [nazev, alt] : [nazev]
    const silny = objekty.find((o) => hledane.some((h) => typShodyNazvu(o.nazvy, h) !== null))
    if (silny) {
      silne.push({ nazev, s: silny.slug, kde: silny.kde })
      continue
    }
    const slaby = objekty.find((o) => hledane.some((h) => slabaShoda(o.nazvy, h)))
    if (slaby) {
      slabe.push({ nazev, s: slaby.slug, kde: slaby.kde })
      continue
    }
    mezery.push({
      oblast: slug,
      nazev,
      vyska: typeof r['Nadmořská výška (m)'] === 'number' ? r['Nadmořská výška (m)'] : null,
      uzel: String(r['Nejbližší obec nebo uzel'] ?? '—'),
      pohori: String(r['Pohoří'] ?? '—'),
    })
  }
  return { oblast: slug, vKatalogu: vOblasti.length, silne, slabe, mezery }
}

const spustenoPrimo = process.argv[1]?.includes('katalog-pokryti')
if (spustenoPrimo) {
  const vybrane = process.argv.slice(2)
  const katalog = JSON.parse(readFileSync(KATALOG_CESTA, 'utf8')) as KatalogZaznam[]
  const oblasti = OBLASTI.filter(
    (o) => (o.katalogPohori ?? []).length && (!vybrane.length || vybrane.includes(o.slug)),
  )

  let mezerCelkem = 0
  let vKataloguCelkem = 0
  for (const o of oblasti) {
    const objekty = [
      ...nactiZAdresare(join(process.cwd(), 'data', 'chaty', o.slug), 'profil'),
      ...nactiZAdresare(join(process.cwd(), 'data', 'kandidati', o.slug), 'kandidát'),
    ]
    const v = pokrytiOblasti(o.slug, o.katalogPohori ?? [], katalog, objekty)
    vKataloguCelkem += v.vKatalogu
    mezerCelkem += v.mezery.length
    console.log(
      `\n${o.slug} — katalog ${v.vKatalogu} | silná shoda ${v.silne.length} | slabá ${v.slabe.length} | BEZ ZÁZNAMU ${v.mezery.length}`,
    )
    if (!objekty.length) {
      console.log('    (oblast nemá v repu ani jeden objekt — čeká na běh DATA-01)')
      continue
    }
    for (const s of v.slabe) {
      console.log(
        `    ? ${s.nazev} — slabá shoda s ${s.kde}em ${s.s}; přečti, jestli je to týž objekt`,
      )
    }
    for (const m of v.mezery.sort((a, b) => (b.vyska ?? 0) - (a.vyska ?? 0))) {
      console.log(
        `    • ${m.nazev} — ${m.vyska ? `${m.vyska} m` : 'výška neuvedena'}, ${m.uzel} (${m.pohori})`,
      )
    }
  }

  console.log(`\n${'─'.repeat(78)}`)
  console.log(
    `oblasti s katalogem: ${oblasti.length} | katalogových objektů: ${vKataloguCelkem} | bez záznamu v repu: ${mezerCelkem}`,
  )
  if (mezerCelkem) {
    console.log(
      '\nCo s tím: mezera NENÍ vada. Postup je (1) ověřit, jestli objekt nestojí\n' +
        'v repu pod jiným jménem, (2) jestli není zaniklý nebo mimo klíč zařazení,\n' +
        '(3) teprve pak ruční dohledávka (DATA-31) nebo nový běh DATA-01.',
    )
  }
  process.exit(0)
}
