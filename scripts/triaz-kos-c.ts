/**
 * KOŠ C — ROZVRSTVENÍ PODLE MĚŘENÍ NAD EXPORTY, ne podle úvahy.
 *
 * Koš C krkonošské triáže („OSM zná jen ubytování" — `guest_house`, `chalet`,
 * `hotel`, `apartment`, `hostel`) drží 131 kandidátů. Číst je po jednom tak,
 * jak se četl koš B (pět až jedenáct za session), je práce na dvanáct
 * sessions — a koš B přitom ukázal, že u velké části z nich dohledávka podle
 * jména nic nepřinese, protože jméno je obecné slovo (zápis 30. 8. 2026).
 *
 * Skript proto koš C NEROZHODUJE, jen ho ROZVRSTVÍ podle signálů, které
 * leží v repu a dají se změřit bez jediného dotazu do sítě:
 *
 *   1. DVOJÍ ZÁPIS TÉHOŽ OBJEKTU (koš C1) — leží do `SLOUCIT_DO_M` gastro
 *      element se SHODNÝM jádrem názvu? OSM vede řadu bud dvakrát: budovou
 *      nebo POI s `tourism=*` a vedle toho uzlem `amenity=restaurant`.
 *      Jádro i práh jsou tytéž, jakými slučuje duplicity DATA-01, ať se
 *      shoda měří stejným pravidlem. Shoda jména sama nestačí (jmenovci
 *      v různých údolích), poloha sama taky ne (chata a hospoda vedle sebe
 *      jsou dva podniky) — rozhoduje až obojí naráz. Takový kandidát má
 *      PRVNÍ půlku klíče (veřejné občerstvení) doloženou z OSM, aniž by se
 *      otevřel prohlížeč, a do koše C spadl jen proto, že slučování
 *      duplicit z dvojice zahodilo právě ten gastro zápis.
 *
 *   2. GASTRO JINÉHO JMÉNA V DOSAHU (koš C2) — element do
 *      `GASTRO_DOSAH_M`, ale jmenuje se jinak. To je soused, ne doklad;
 *      v osadě plné boudiček je takový nález běžný a musí ho přečíst člověk.
 *
 *   3. VZDÁLENOST OD STŘEDISKA — jak daleko je nejbližší referenční bod
 *      střediska z `data/strediska/<oblast>/`. Není to důkaz role na trase
 *      (tu měří značka, a tu OSM export nenese), ale je to nejlevnější
 *      dostupný proxy pro to, co se u koše B rozhodovalo pořád dokola:
 *      „ulice ve středisku" × „dům o samotě v horách".
 *
 * VÝSTUP JE PODKLAD K PRÁCI, NE VERDIKT. Nic nezapisuje do `data/`, nic
 * nevyřazuje, nic nepovyšuje. „Bez gastra v dosahu" NENÍ vyřazení —
 * OSM mlčení není doklad absence (poučka z koše E, 31. 8. 2026: koš tehdy
 * měřil nepřítomnost odkazu, ne nepřítomnost objektu). Znamená jen, že
 * takový kandidát potřebuje dohledávku u pramenů, kdežto kandidát
 * s gastrem v dosahu se dá číst rychleji a s lepší výtěžností.
 *
 *   npx tsx scripts/triaz-kos-c.ts              # výchozí: krkonose
 *   npx tsx scripts/triaz-kos-c.ts krkonose --md
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

import { jadroNazvu, SLOUCIT_DO_M } from './data01-overpass-krkonose'
import { normalizujOsm, vzdalenostM } from './kontrola/blizke-body'

/** Práh, na kterém dva OSM elementy popisují týž dům (viz komentář výš). */
export const GASTRO_DOSAH_M = 30

/** OSM tagy, kterými se v exportu hlásí veřejné občerstvení. */
export const GASTRO_AMENITY = new Set([
  'restaurant',
  'cafe',
  'pub',
  'bar',
  'fast_food',
  'biergarten',
  'food_court',
])

/** OSM tagy `tourism`, které nesou koš C: ubytování bez doloženého gastra. */
export const UBYTOVANI_TOURISM = new Set([
  'guest_house',
  'chalet',
  'hotel',
  'apartment',
  'hostel',
  'motel',
  'apartments',
])

type OsmPrvek = {
  klic: string
  lat: number
  lng: number
  tags: Record<string, string>
}

type Kandidat = {
  slug: string
  nazev: string
  lat: number
  lng: number
  osm: string | null
  tourism: string | null
  gastroM: number | null
  gastroNazev: string | null
  /** Gastro element se SHODNÝM jádrem názvu do `SLOUCIT_DO_M` — týž objekt. */
  dvojiZapis: { osm: string; nazev: string; vzdalenostM: number } | null
  strediskoM: number | null
  strediskoNazev: string | null
}

const cislo = (obsah: string, klic: string): number | null => {
  const m = new RegExp(`^${klic}:\\s*(-?\\d+(?:\\.\\d+)?)\\s*$`, 'mu').exec(obsah)
  return m ? Number(m[1]) : null
}

const osmZeSouboru = (obsah: string): string | null => {
  const m = /https?:\/\/(?:www\.)?openstreetmap\.org\/(?:node|way|relation)\/\d+/u.exec(obsah)
  return m ? normalizujOsm(m[0]) : null
}

/** Union všech overpass exportů oblasti, klíčované `openstreetmap.org/<typ>/<id>`. */
export const nactiExporty = (adresar: string): Map<string, OsmPrvek> => {
  const out = new Map<string, OsmPrvek>()
  if (!existsSync(adresar)) return out
  for (const soubor of readdirSync(adresar).sort()) {
    if (!soubor.startsWith('_overpass-') || !soubor.endsWith('.json')) continue
    let syrove: unknown
    try {
      syrove = JSON.parse(readFileSync(join(adresar, soubor), 'utf8'))
    } catch {
      continue
    }
    const pole = Array.isArray(syrove)
      ? syrove
      : ((syrove as { elements?: unknown[] })?.elements ?? [])
    for (const e of pole as Array<Record<string, unknown>>) {
      if (typeof e !== 'object' || e === null) continue
      const typ = e.type as string | undefined
      const id = e.id as number | undefined
      if (!typ || typeof id !== 'number') continue
      const stred = e.center as { lat?: number; lon?: number } | undefined
      const lat = (e.lat as number | undefined) ?? stred?.lat
      const lng = (e.lon as number | undefined) ?? stred?.lon
      if (typeof lat !== 'number' || typeof lng !== 'number') continue
      const klic = `openstreetmap.org/${typ}/${id}`
      // Pozdější export může nést bohatší tagy; slučujeme, nepřepisujeme.
      const drivejsi = out.get(klic)
      const tags = { ...(drivejsi?.tags ?? {}), ...((e.tags as Record<string, string>) ?? {}) }
      out.set(klic, { klic, lat, lng, tags })
    }
  }
  return out
}

/** Elementy exportu, které hlásí veřejné občerstvení. */
export const gastroPrvky = (exporty: Map<string, OsmPrvek>): OsmPrvek[] =>
  [...exporty.values()].filter((p) => GASTRO_AMENITY.has(p.tags.amenity ?? ''))

/** Referenční body středisek oblasti (`data/strediska/<oblast>/*.yaml`). */
export const nactiStrediska = (
  adresar: string,
): Array<{ nazev: string; lat: number; lng: number }> => {
  const out: Array<{ nazev: string; lat: number; lng: number }> = []
  if (!existsSync(adresar)) return out
  for (const soubor of readdirSync(adresar).sort()) {
    if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
    const y = parse(readFileSync(join(adresar, soubor), 'utf8')) as Record<string, unknown>
    const lat = y?.lat
    const lng = y?.lng
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    out.push({ nazev: String(y.nazev ?? soubor.replace(/\.yaml$/u, '')), lat, lng })
  }
  return out
}

/**
 * Kandidáti koše C oblasti: soubor v `data/kandidati/<oblast>/`, jehož OSM
 * element nese `tourism` z UBYTOVANI_TOURISM a NEMÁ gastro amenity na sobě.
 * Kandidát bez dohledatelného elementu do koše C nepatří (to je koš E).
 */
export const kosC = (oblast: string, koren = 'data'): Kandidat[] => {
  const adresar = join(koren, 'kandidati', oblast)
  const exporty = nactiExporty(adresar)
  const gastro = gastroPrvky(exporty)
  const strediska = nactiStrediska(join(koren, 'strediska', oblast))
  const out: Kandidat[] = []
  if (!existsSync(adresar)) return out

  for (const soubor of readdirSync(adresar).sort()) {
    if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
    const obsah = readFileSync(join(adresar, soubor), 'utf8')
    const osm = osmZeSouboru(obsah)
    if (!osm) continue
    const prvek = exporty.get(osm)
    if (!prvek) continue
    const tourism = prvek.tags.tourism ?? null
    if (!tourism || !UBYTOVANI_TOURISM.has(tourism)) continue
    if (GASTRO_AMENITY.has(prvek.tags.amenity ?? '')) continue

    const lat = cislo(obsah, 'lat') ?? prvek.lat
    const lng = cislo(obsah, 'lng') ?? prvek.lng
    const bod = { lat, lng }

    let gastroM: number | null = null
    let gastroNazev: string | null = null
    let dvojiZapis: Kandidat['dvojiZapis'] = null
    const jadro = jadroNazvu(prvek.tags.name)
    for (const g of gastro) {
      const d = vzdalenostM(bod, { lat: g.lat, lng: g.lng })
      if (gastroM === null || d < gastroM) {
        gastroM = d
        gastroNazev = g.tags.name ?? g.klic
      }
      // Shoda jádra názvu MĚŘENÁ TÝMŽ pravidlem, jakým pipeline slučuje
      // duplicity — proto i týž práh 150 m. Shoda jména sama nestačí
      // (jmenovci v různých údolích), poloha sama taky ne (chata a hospoda
      // vedle sebe jsou dva podniky) — rozhoduje až obojí naráz.
      if (
        jadro &&
        jadroNazvu(g.tags.name) === jadro &&
        d <= SLOUCIT_DO_M &&
        (dvojiZapis === null || d < dvojiZapis.vzdalenostM)
      ) {
        dvojiZapis = { osm: g.klic, nazev: g.tags.name ?? g.klic, vzdalenostM: d }
      }
    }
    let strediskoM: number | null = null
    let strediskoNazev: string | null = null
    for (const s of strediska) {
      const d = vzdalenostM(bod, { lat: s.lat, lng: s.lng })
      if (strediskoM === null || d < strediskoM) {
        strediskoM = d
        strediskoNazev = s.nazev
      }
    }

    const nazevM = /^nazev:\s*(.+)$/mu.exec(obsah)
    out.push({
      slug: soubor.replace(/\.yaml$/u, ''),
      nazev: nazevM ? nazevM[1].trim() : soubor.replace(/\.yaml$/u, ''),
      lat,
      lng,
      osm,
      tourism,
      gastroM,
      gastroNazev,
      dvojiZapis,
      strediskoM,
      strediskoNazev,
    })
  }
  return out
}

/**
 * Rozvrstvení koše C na C1/C2/C3 — jedno místo pro pravidlo, které do
 * 6. 9. 2026 žilo jen uvnitř `main()` téhle úlohy. Odsud si ho bere
 * i `triaz-role-na-trase.ts`, aby se koše nikde neurčovaly dvakrát jinak
 * (týž důvod, proč se značení bere z `znaceniZTagu` a jádro jména
 * z `jadroNazvu`).
 *
 * C1 a C2 se vracejí seřazené podle vzdálenosti, kterou koš definuje;
 * **C3 v pořadí, v jakém přišel z `kosC` (podle slugu)** — řazení C3 je
 * věcí výpisu, ne rozvrstvení.
 */
export const kose = (
  oblast: string,
  koren = 'data',
): { c1: Kandidat[]; c2: Kandidat[]; c3: Kandidat[] } => {
  const vse = kosC(oblast, koren)
  const maGastroVDosahu = (k: Kandidat): boolean =>
    k.gastroM !== null && k.gastroM <= GASTRO_DOSAH_M
  return {
    c1: vse
      .filter((k) => k.dvojiZapis !== null)
      .sort((a, b) => (a.dvojiZapis?.vzdalenostM ?? 0) - (b.dvojiZapis?.vzdalenostM ?? 0)),
    c2: vse
      .filter((k) => k.dvojiZapis === null && maGastroVDosahu(k))
      .sort((a, b) => (a.gastroM ?? 0) - (b.gastroM ?? 0)),
    c3: vse.filter((k) => k.dvojiZapis === null && !maGastroVDosahu(k)),
  }
}

const m = (x: number | null): string => (x === null ? '—' : `${Math.round(x)} m`)

const main = () => {
  const args = process.argv.slice(2)
  const oblast = args.find((a) => !a.startsWith('--')) ?? 'krkonose'
  const md = args.includes('--md')
  const { c1, c2, c3 } = kose(oblast)
  const vse = [...c1, ...c2, ...c3]

  if (md) {
    console.log(`### C1 · dvojí zápis téhož objektu — ${c1.length}\n`)
    console.log('| kandidát | OSM typ kandidáta | gastro element téhož jména | vzdálenost |')
    console.log('| --- | --- | --- | --- |')
    for (const k of c1) {
      console.log(
        `| \`${k.slug}\` — ${k.nazev} | \`tourism=${k.tourism}\` | ${k.dvojiZapis?.nazev} (\`${k.dvojiZapis?.osm}\`) | ${m(k.dvojiZapis?.vzdalenostM ?? null)} |`,
      )
    }
    console.log(`\n### C2 · gastro JINÉHO jména do ${GASTRO_DOSAH_M} m — ${c2.length}\n`)
    console.log('| kandidát | OSM typ | nejbližší gastro | vzdálenost | nejbližší středisko |')
    console.log('| --- | --- | --- | --- | --- |')
    for (const k of c2) {
      console.log(
        `| \`${k.slug}\` — ${k.nazev} | \`tourism=${k.tourism}\` | ${k.gastroNazev ?? '—'} | ${m(k.gastroM)} | ${k.strediskoNazev ?? '—'} ${m(k.strediskoM)} |`,
      )
    }
    console.log(`\n### C3 · bez gastra v dosahu — ${c3.length}\n`)
    console.log('| kandidát | OSM typ | nejbližší gastro | nejbližší středisko |')
    console.log('| --- | --- | --- | --- |')
    for (const k of c3.sort((a, b) => (a.strediskoM ?? 0) - (b.strediskoM ?? 0))) {
      console.log(
        `| \`${k.slug}\` — ${k.nazev} | \`tourism=${k.tourism}\` | ${m(k.gastroM)} | ${k.strediskoNazev ?? '—'} ${m(k.strediskoM)} |`,
      )
    }
    return
  }

  console.log(`Koš C oblasti ${oblast}: ${vse.length} kandidátů`)
  console.log(`  C1 dvojí zápis téhož objektu (jádro jména do ${SLOUCIT_DO_M} m): ${c1.length}`)
  console.log(`  C2 gastro jiného jména do ${GASTRO_DOSAH_M} m:                  ${c2.length}`)
  console.log(`  C3 bez gastra v dosahu:                                ${c3.length}`)
  console.log('\nC1 — veřejné občerstvení doložené z OSM, zbývá role na trase:')
  for (const k of c1) {
    console.log(
      `  ${k.slug} — ${k.nazev}: ${m(k.dvojiZapis?.vzdalenostM ?? null)} → ${k.dvojiZapis?.nazev} (${k.dvojiZapis?.osm})`,
    )
  }
  console.log('\nC2 — soused, ne doklad; přečte člověk:')
  for (const k of c2) console.log(`  ${k.slug} — ${k.nazev}: ${m(k.gastroM)} → ${k.gastroNazev}`)
  console.log('\nC3 podle vzdálenosti od nejbližšího střediska:')
  const pasma: Array<[string, number, number]> = [
    ['do 250 m', 0, 250],
    ['250–500 m', 250, 500],
    ['0,5–1 km', 500, 1000],
    ['1–2 km', 1000, 2000],
    ['2–4 km', 2000, 4000],
    ['nad 4 km', 4000, Infinity],
  ]
  for (const [popis, od, doM] of pasma) {
    const n = c3.filter(
      (k) => k.strediskoM !== null && k.strediskoM > od && k.strediskoM <= doM,
    ).length
    console.log(`  ${popis.padEnd(10)} ${n}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
