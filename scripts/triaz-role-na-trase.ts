/**
 * ROLE NA TRASE — DRUHÁ PŮLKA KLÍČE ZAŘAZENÍ, ZMĚŘENÁ NAD EXPORTY V REPU.
 *
 * Klíč zařazení (CLAUDE.md, rozhodnutí Michala 30. 7. 2026) stojí na dvou
 * půlkách: **veřejné občerstvení** a **role na trase**. První půlku umí
 * doložit `scripts/triaz-kos-c.ts` z OSM tagů (koš C1, 1. 9. 2026). Druhá
 * se dosud u každého kandidáta odhadovala z dojmu — „stojí to v osadě",
 * „je to bouda o samotě" — nebo se nahrazovala vzdáleností od střediska,
 * což je proxy pro zástavbu, ne pro trasu.
 *
 * Přitom podklad leží v repu od DATA-06: `data/trasy/<oblast>/
 * _overpass-trasy.json` nese relace `route=hiking` I S GEOMETRIÍ. Skript
 * z nich měří tři věci, bez jediného dotazu do sítě:
 *
 *   1. VZDÁLENOST K NEJBLIŽŠÍ ZNAČENÉ TRASE — kolmá vzdálenost bodu
 *      k lomené čáře trasy (ne k jejímu nejbližšímu lomovému bodu; ten
 *      u dlouhých rovných úseků přeceňuje vzdálenost i o stovky metrů).
 *      Barva se bere jen tam, kde ji OSM nese — týmž pravidlem
 *      `znaceniZTagu` jako DATA-06, ať se značení nikde neurčuje dvakrát
 *      jinak.
 *
 *   2. KOLIK RŮZNÝCH ZNAČENÝCH TRAS je do `U_TRASY_M`. Jedna značka
 *      znamená „leží na trase", dvě a víc „leží na křižovatce značek" —
 *      a to je u boudy silnější role než pouhá blízkost.
 *
 *   3. VZDÁLENOST K NEJBLIŽŠÍMU ROZCESTNÍKU (`role=guidepost` v relaci).
 *      Rozcestník je místo, kde turista rozhoduje, kudy dál; bouda u něj
 *      má roli, i kdyby k ose cesty bylo o pár desítek metrů dál.
 *
 * CO SKRIPT NEDOKLÁDÁ, a je to podstatné: blízkost značky NENÍ role na
 * trase. Značená trasa vede i středem Špindlerova Mlýna, takže apartmán
 * u silnice bude mít 20 m k modré stejně jako bouda na hřebeni. Měření
 * proto rozhoduje spolehlivě jen v JEDNOM směru — **daleko od každé
 * značky = role na trase doložená není** —, kdežto „blízko" je pozvánka
 * ke čtení, ne verdikt. Stejně tak nepřítomnost trasy v exportu není
 * doklad, že trasa v terénu není (poučka z koše E, 31. 8. 2026):
 * export má vlastní datum a vlastní okno.
 *
 * Nic nezapisuje do `data/`, nic nevyřazuje, nic nepovyšuje.
 *
 *   npx tsx scripts/triaz-role-na-trase.ts                        # celý koš C1 Krkonoš
 *   npx tsx scripts/triaz-role-na-trase.ts --kos c3               # koš C3 (120 položek)
 *   npx tsx scripts/triaz-role-na-trase.ts --slugy a,b,c          # vybraní kandidáti
 *   npx tsx scripts/triaz-role-na-trase.ts jizerske-hory --vse    # všichni kandidáti oblasti
 *   npx tsx scripts/triaz-role-na-trase.ts --md                   # tabulka do dokumentace
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { jadroNazvu, vzdalenostM } from './data01-overpass-krkonose'
import { znaceniZTagu, type TrasaRelace, type Znaceni } from './data06-trasy'
import { cestyOblasti } from './oblasti'
import { kose } from './triaz-kos-c'

/** Do téhle vzdálenosti bereme kandidáta jako ležícího U značené trasy. */
export const U_TRASY_M = 250

/**
 * Role členů relace, které OSM používá pro rozcestník. Vedle `guidepost` i
 * překlep `giudepost` — v krkonošském exportu ho nese pět členů a je to
 * chyba zápisu, ne jiný druh objektu.
 */
const ROLE_ROZCESTNIK = new Set(['guidepost', 'giudepost'])

export type Souradnice = { lat: number; lng: number }

export type TrasaBlizko = {
  /** Vzdálenost k ose trasy v metrech (kolmo k úseku, ne k lomovému bodu). */
  vzdalenostM: number
  znaceni: Znaceni
  /** `ref` KČT (číslo trasy), když ho relace nese. */
  ref: string | null
  /** Název relace, případně její `destinations` — co OSM nabídne. */
  popis: string | null
  url: string
}

export type RoleNaTrase = {
  slug: string
  nazev: string
  lat: number
  lng: number
  /** Nejbližší značená trasa, nebo null (v exportu žádná značená není). */
  nejblizsi: TrasaBlizko | null
  /** Různé značené trasy (dle OSM id relace) do `U_TRASY_M`, od nejbližší. */
  doPrahu: TrasaBlizko[]
  /** Vzdálenost k nejbližšímu rozcestníku, nebo null (žádný v exportu). */
  rozcestnikM: number | null
  /** Trasy do `U_TRASY_M`, které kandidáta jmenují jako cíl (viz `jmenujeCil`). */
  jmenujiCil: TrasaBlizko[]
}

// ── Geometrie ───────────────────────────────────────────────────────────────

const R_ZEME = 6371008.8

/**
 * Kolmá vzdálenost bodu od úsečky v metrech. Počítá se v rovině lokálně
 * ztotožněné s okolím bodu (metry na stupeň zeměpisné délky se krátí
 * kosinem šířky) — na délkách úseků OSM cest je zkreslení pod decimetr,
 * kdežto rozdíl proti „vzdálenosti k lomovému bodu" bývá stovky metrů.
 */
export const vzdalenostKUsecceM = (bod: Souradnice, a: Souradnice, b: Souradnice): number => {
  const rad = Math.PI / 180
  const mNaStupenLat = R_ZEME * rad
  const mNaStupenLng = mNaStupenLat * Math.cos(bod.lat * rad)
  const px = (a.lng - bod.lng) * mNaStupenLng
  const py = (a.lat - bod.lat) * mNaStupenLat
  const qx = (b.lng - bod.lng) * mNaStupenLng
  const qy = (b.lat - bod.lat) * mNaStupenLat
  const dx = qx - px
  const dy = qy - py
  const delka2 = dx * dx + dy * dy
  // Degenerovaný úsek (dva totožné body) → prostá vzdálenost k bodu.
  if (delka2 === 0) return Math.hypot(px, py)
  let t = -(px * dx + py * dy) / delka2
  if (t < 0) t = 0
  else if (t > 1) t = 1
  return Math.hypot(px + t * dx, py + t * dy)
}

// ── Načtení tras ────────────────────────────────────────────────────────────

/** Surový export DATA-06 oblasti (`_overpass-trasy.json`). null = není v repu. */
export const nactiTrasy = (oblast: string): TrasaRelace[] | null => {
  const soubor = join(cestyOblasti(oblast).trasy, '_overpass-trasy.json')
  if (!existsSync(soubor)) return null
  const syrove = JSON.parse(readFileSync(soubor, 'utf8')) as { elements?: unknown[] }
  const pole = (syrove.elements ?? []) as TrasaRelace[]
  return pole.filter((e) => e.type === 'relation')
}

const popisTrasy = (rel: TrasaRelace): string | null => {
  const t = rel.tags ?? {}
  return t.name ?? t.destinations ?? null
}

/**
 * Jmenuje trasa kandidáta jako cíl? Tohle je ze všech tří měření JEDINÝ
 * signál, který mluví přímo o roli — vzdálenost říká jen „vede tudy",
 * kdežto `name=„Svoboda nad Úpou - Hoffmannova bouda"` nebo
 * `destinations` s týmž jménem říká, že KČT tu boudu vede jako cíl trasy.
 * Porovnává se `jadroNazvu` (týž normalizátor jako slučování duplicit
 * v DATA-01), aby „Hoffmannova bouda" sedla na „Hoffmannovu boudu";
 * krátká jádra pod `MIN_JADRO` se zahazují, jinak by „Horská" trefila
 * půlku Krkonoš.
 */
const MIN_JADRO = 4

export const jmenujeCil = (nazevKandidata: string, rel: TrasaRelace): boolean => {
  const jadro = jadroNazvu(nazevKandidata)
  if (jadro.length < MIN_JADRO) return false
  const t = rel.tags ?? {}
  const kde = jadroNazvu([t.name, t.destinations, t.to, t.from].filter(Boolean).join(' '))
  return kde.includes(jadro)
}

/**
 * Změří roli na trase u jednoho bodu. `relace` se předává zvenčí, aby se
 * čtrnáctimegabajtový export nečetl pro každého kandidáta znovu.
 */
export const roleBodu = (
  bod: Souradnice,
  relace: TrasaRelace[],
  nazev = '',
): Omit<RoleNaTrase, 'slug' | 'nazev' | 'lat' | 'lng'> => {
  const dleRelace = new Map<number, TrasaBlizko>()
  const jmenuje = new Set<number>()
  let rozcestnikM: number | null = null

  for (const rel of relace) {
    const znaceni = znaceniZTagu(rel.tags ?? {})?.znaceni ?? null
    for (const clen of rel.members ?? []) {
      if (
        ROLE_ROZCESTNIK.has(clen.role ?? '') &&
        typeof clen.lat === 'number' &&
        typeof clen.lon === 'number'
      ) {
        const d = vzdalenostM(bod.lat, bod.lng, clen.lat, clen.lon)
        if (rozcestnikM === null || d < rozcestnikM) rozcestnikM = d
      }
      // Barvu trasa nést nemusí (spojky, mezinárodní relace bez osmc:symbol).
      // Neznačené se do měření nepočítají — klíč se ptá po ZNAČENÉ trase.
      if (!znaceni) continue
      if (nazev && jmenujeCil(nazev, rel)) jmenuje.add(rel.id)
      const g = clen.geometry
      if (!g || g.length < 2) continue
      for (let i = 1; i < g.length; i++) {
        const d = vzdalenostKUsecceM(
          bod,
          { lat: g[i - 1].lat, lng: g[i - 1].lon },
          { lat: g[i].lat, lng: g[i].lon },
        )
        const stavajici = dleRelace.get(rel.id)
        if (!stavajici || d < stavajici.vzdalenostM) {
          dleRelace.set(rel.id, {
            vzdalenostM: d,
            znaceni,
            ref: rel.tags?.ref ?? null,
            popis: popisTrasy(rel),
            url: `openstreetmap.org/relation/${rel.id}`,
          })
        }
      }
    }
  }

  const serazene = [...dleRelace.values()].sort((a, b) => a.vzdalenostM - b.vzdalenostM)
  const doPrahu = serazene.filter((t) => t.vzdalenostM <= U_TRASY_M)
  return {
    nejblizsi: serazene[0] ?? null,
    doPrahu,
    rozcestnikM,
    // Jen trasy do prahu: relace jmenující boudu, která vede o pět údolí
    // dál, o roli kandidáta nedokládá nic (typicky jmenovec).
    jmenujiCil: doPrahu.filter((t) =>
      jmenuje.has(Number(t.url.replace('openstreetmap.org/relation/', ''))),
    ),
  }
}

// ── Kandidáti ───────────────────────────────────────────────────────────────

type Bod = { slug: string; nazev: string; lat: number; lng: number }

const cislo = (obsah: string, klic: string): number | null => {
  const m = new RegExp(`^${klic}:\\s*(-?\\d+(?:\\.\\d+)?)\\s*$`, 'mu').exec(obsah)
  return m ? Number(m[1]) : null
}

/** Kandidáti oblasti se souřadnicemi; `slugy` volitelně zúží výběr. */
export const nactiKandidaty = (oblast: string, slugy?: string[], koren = 'data'): Bod[] => {
  const adresar = join(koren, 'kandidati', oblast)
  if (!existsSync(adresar)) return []
  const chce = slugy ? new Set(slugy) : null
  const out: Bod[] = []
  for (const soubor of readdirSync(adresar).sort()) {
    if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
    const slug = soubor.replace(/\.yaml$/u, '')
    if (chce && !chce.has(slug)) continue
    const obsah = readFileSync(join(adresar, soubor), 'utf8')
    const lat = cislo(obsah, 'lat')
    const lng = cislo(obsah, 'lng')
    if (lat === null || lng === null) continue
    const nazevM = /^nazev:\s*(.+)$/mu.exec(obsah)
    out.push({ slug, nazev: nazevM ? nazevM[1].trim() : slug, lat, lng })
  }
  return out
}

export const roleNaTrase = (oblast: string, slugy?: string[]): RoleNaTrase[] => {
  const relace = nactiTrasy(oblast)
  if (!relace) return []
  return nactiKandidaty(oblast, slugy).map((b) => ({ ...b, ...roleBodu(b, relace, b.nazev) }))
}

/**
 * Slugy libovolného koše C. C1 nese občerstvení doložené z OSM a měření mu
 * dodává druhou půlku klíče; **u C3 je to naopak** — občerstvení doložené
 * není, takže měření tam o zařazení nerozhoduje vůbec a říká jen, koho má
 * smysl číst dřív. „Daleko od každé značky" u C3 tedy znamená „ani druhou
 * půlku klíče měření nedává", ne „vyřadit".
 */
export const slugyKose = (oblast: string, kos: 'c1' | 'c2' | 'c3'): string[] =>
  kose(oblast)[kos].map((k) => k.slug)

/** Slugy koše C1 oblasti (dvojí zápis téhož objektu — gastro doložené z OSM). */
export const slugyC1 = (oblast: string): string[] => slugyKose(oblast, 'c1')

// ── Výpis ───────────────────────────────────────────────────────────────────

const m = (x: number | null): string => (x === null ? '—' : `${Math.round(x)} m`)

const popisZnacky = (t: TrasaBlizko | null): string => {
  if (!t) return '—'
  const cast = [t.znaceni, t.ref ? `č. ${t.ref}` : null, t.popis].filter(Boolean).join(' · ')
  return `${m(t.vzdalenostM)} — ${cast}`
}

const main = () => {
  const args = process.argv.slice(2)
  const oblast = args.find((a) => !a.startsWith('--')) ?? 'krkonose'
  const md = args.includes('--md')
  const vse = args.includes('--vse')
  const kosArg = args.find((a) => a.startsWith('--kos'))
  const kos = kosArg
    ? ((kosArg.split('=')[1] ?? args[args.indexOf(kosArg) + 1] ?? '').toLowerCase() as
        'c1' | 'c2' | 'c3')
    : null
  if (kos && !['c1', 'c2', 'c3'].includes(kos)) {
    console.error(`Neznámý koš „${kos}" — čekám c1, c2 nebo c3.`)
    process.exitCode = 1
    return
  }
  const slugyArg = args.find((a) => a.startsWith('--slugy'))
  const slugy = slugyArg
    ? (slugyArg.split('=')[1] ?? args[args.indexOf(slugyArg) + 1] ?? '').split(',').filter(Boolean)
    : kos
      ? slugyKose(oblast, kos)
      : vse
        ? undefined
        : slugyC1(oblast)

  if (!nactiTrasy(oblast)) {
    console.error(
      `Oblast ${oblast} nemá v repu export tras (data/trasy/${oblast}/_overpass-trasy.json).\n` +
        'Ostrý běh dělá workflow „DATA-06: export značených tras" — ze sandboxu Overpass nedosáhneme.',
    )
    process.exitCode = 1
    return
  }

  const vysledky = roleNaTrase(oblast, slugy).sort(
    (a, b) => (a.nejblizsi?.vzdalenostM ?? Infinity) - (b.nejblizsi?.vzdalenostM ?? Infinity),
  )

  if (md) {
    console.log(
      `| kandidát | k nejbližší značce | značek do ${U_TRASY_M} m | rozcestník | jmenuje ho trasa |`,
    )
    console.log('| --- | --- | --- | --- | --- |')
    for (const v of vysledky) {
      console.log(
        `| \`${v.slug}\` — ${v.nazev} | ${popisZnacky(v.nejblizsi)} | ${v.doPrahu.length} | ${m(v.rozcestnikM)} | ${v.jmenujiCil.length > 0 ? 'ano' : '—'} |`,
      )
    }
    return
  }

  console.log(`Role na trase — ${oblast}, kandidátů: ${vysledky.length}`)
  console.log(`(měřeno nad exportem DATA-06 v repu; práh „u trasy" = ${U_TRASY_M} m)\n`)
  for (const v of vysledky) {
    console.log(`${v.slug} — ${v.nazev}`)
    console.log(`    nejbližší značka: ${popisZnacky(v.nejblizsi)}`)
    console.log(
      `    značených tras do ${U_TRASY_M} m: ${v.doPrahu.length}` +
        (v.doPrahu.length > 1
          ? ` (${v.doPrahu.map((t) => `${t.znaceni} ${m(t.vzdalenostM)}`).join(', ')})`
          : ''),
    )
    console.log(`    nejbližší rozcestník: ${m(v.rozcestnikM)}`)
    if (v.jmenujiCil.length > 0)
      console.log(
        `    JMENUJE HO JAKO CÍL: ${v.jmenujiCil.map((t) => `${t.znaceni} „${t.popis}"`).join('; ')}`,
      )
  }
}

if (process.argv[1] && process.argv[1].endsWith('triaz-role-na-trase.ts')) main()
