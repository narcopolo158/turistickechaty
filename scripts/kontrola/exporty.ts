/**
 * Kontrola surových Overpass exportů uložených v repu
 * (`data/kandidati/<oblast>/_overpass-*.json`).
 *
 * PROČ VZNIKLA: 8. 8. 2026 se zpětným pohledem na beskydský export ukázalo,
 * že soubor `_overpass-dle-jmen-cz.json` nese
 *
 *     "remark": "runtime error: Query timed out in \"query\" at line 5
 *                after 183 seconds."
 *
 * a nula elementů. Overpass hlásí běhovou chybu jako **HTTP 200** — takže
 * pipeline to přijala jako platný výsledek („0 objektů dohledáno podle
 * jména"), běh dopadl zeleně a report neukázal nic zvláštního. Jenže právě
 * tahle dohledávka je DRUHÁ ZÁCHRANNÁ SÍŤ: hledá objekty z externího
 * katalogu, které hlavní dotaz podle tagů minul. Když tiše neudělá nic,
 * v kandidátech chybí přesně to nejcennější — u Beskyd **Libušín a Chata na
 * Radhošti**, dva nejznámější objekty celého pohoří.
 *
 * Samotná příčina je opravená v `nactiExport` (běhová chyba v `remark` je od
 * 8. 8. 2026 tvrdá chyba, takže se zapojí retry na zrcadlo). Tahle kontrola
 * řeší druhou polovinu problému: **vadný export už v repu leží** a bez ní by
 * tam ležel dál. Commitnutý export je doklad, na který se odkazují profily;
 * doklad s chybou uvnitř je horší než žádný, protože vypadá jako doklad.
 *
 *   npx tsx scripts/kontrola/exporty.ts
 *
 * ROZHODUJE (návratový kód 1): stav bez vady je přesně nula, takže každý
 * zásah je regrese, ne položka k posouzení.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const KOREN = join(process.cwd(), 'data', 'kandidati')

/** Overpass posílá `remark` i pro nechybová hlášení — hlídají se jen chyby. */
const CHYBA_V_REMARK = /error|timed out|out of memory/i

/**
 * DRUHÁ VĚC, KTEROU TENHLE SOUBOR HLÍDÁ (18. 8. 2026): export stažený
 * **starší, užší verzí dotazu**.
 *
 * Do 30. 7. 2026 sbíral DATA-01 jen hutové tagy (`tourism=alpine_hut` a spol.).
 * Commit `34cebbb` („DATA-01 hledal jen hutove tagy — jizerske boudy jsou
 * v OSM restaurace") přidal druhou vrstvu: **civilně tagované boudy** —
 * restaurace, hotely a penziony, které mají boudové slovo v NÁZVU. Oblasti
 * exportované po tomhle datu je mají (v CZ souboru Jizerky 36, Šumava 66,
 * Beskydy 30 takových objektů), oblasti exportované dřív ne — a nikdo je kvůli
 * tomu nepustil znovu.
 *
 * Kontrola se **neptá na datum**, protože `timestamp_osm_base` verzi dotazu
 * neprozradí: šumavský export nese stav dat z 1. 6., ačkoli běžel 4. 8. — to
 * jen odpovědělo zaostalé zrcadlo. Ptá se na OBSAH: když v exportu není ani
 * jediný objekt bez hutového tagu, ačkoli si o ně dotaz výslovně říká, je to
 * podpis staré verze. Nad skutečným repem to k 18. 8. 2026 sedne na dva
 * soubory (`krkonose/_overpass-export-cz.json` a `-pl.json`, dohromady 78
 * objektů, z toho 0 civilních) a na žádný jiný.
 *
 * NEROZHODUJE (nezvyšuje návratový kód): je to PRÁCE — pustit oblast znovu
 * přes Actions — ne vada souboru. U velmi malé oblasti navíc může být nula
 * civilních objektů pravda, takže poslední slovo má redakce.
 */
export type UpozorneniExportu = {
  soubor: string
  druh: 'uzky-dotaz'
  elementu: number
  civilnich: number
}

/** Tagy, kterými se v OSM značí chata jako chata (první, původní vrstva dotazu). */
const HUTOVE_TAGY = new Set(['alpine_hut', 'wilderness_hut', 'hut', 'chalet'])

/** Bere jen hlavní export oblasti; `_overpass-dle-jmen-*` i `-rozhledny-*` mají vlastní dotaz. */
const HLAVNI_EXPORT = /_overpass-export-[a-z]{2}\.json$/

export function zkontrolujSirkuDotazu(soubor: string, raw: string): UpozorneniExportu | null {
  if (!HLAVNI_EXPORT.test(soubor)) return null
  let telo: { elements?: { tags?: Record<string, string> }[] }
  try {
    telo = JSON.parse(raw)
  } catch {
    return null // rozbitý JSON řeší zkontrolujExport, ne tahle kontrola
  }
  const els = telo.elements
  if (!Array.isArray(els) || els.length === 0) return null
  const civilnich = els.filter((e) => !HUTOVE_TAGY.has(e?.tags?.tourism ?? '')).length
  if (civilnich > 0) return null
  return { soubor, druh: 'uzky-dotaz', elementu: els.length, civilnich }
}

export type VadaExportu = {
  soubor: string
  druh: 'remark' | 'json' | 'bez-elements'
  zprava: string
  elementu: number | null
  stavOsm: string | null
}

export function zkontrolujExport(soubor: string, raw: string): VadaExportu | null {
  let telo: { elements?: unknown; remark?: unknown; osm3s?: { timestamp_osm_base?: unknown } }
  try {
    telo = JSON.parse(raw)
  } catch {
    return { soubor, druh: 'json', zprava: 'není validní JSON', elementu: null, stavOsm: null }
  }
  const elementu = Array.isArray(telo.elements) ? telo.elements.length : null
  const ts = telo.osm3s?.timestamp_osm_base
  const stavOsm = typeof ts === 'string' ? ts.slice(0, 10) : null
  if (elementu === null) {
    return { soubor, druh: 'bez-elements', zprava: 'chybí pole `elements`', elementu, stavOsm }
  }
  if (typeof telo.remark === 'string' && CHYBA_V_REMARK.test(telo.remark)) {
    return { soubor, druh: 'remark', zprava: telo.remark.trim(), elementu, stavOsm }
  }
  return null
}

/** Všechny surové exporty v repu, seřazené (oblast → soubor). */
export function najdiExporty(koren: string = KOREN): string[] {
  if (!existsSync(koren)) return []
  const out: string[] = []
  for (const oblast of readdirSync(koren, { withFileTypes: true })) {
    if (!oblast.isDirectory()) continue
    const dir = join(koren, oblast.name)
    for (const f of readdirSync(dir).sort()) {
      if (f.startsWith('_overpass') && f.endsWith('.json')) out.push(join(dir, f))
    }
  }
  return out.sort()
}

const spustenoPrimo = process.argv[1]?.includes('exporty')
if (spustenoPrimo) {
  const soubory = najdiExporty()
  const vady = soubory
    .map((s) => zkontrolujExport(s, readFileSync(s, 'utf8')))
    .filter((v): v is VadaExportu => v !== null)

  for (const v of vady) {
    const kde = v.soubor.replace(`${process.cwd()}/`, '')
    console.log(`✗ ${kde}`)
    console.log(`    ${v.zprava}`)
    console.log(
      `    elementů: ${v.elementu ?? '—'} | stav OSM dat: ${v.stavOsm ?? '—'}` +
        (v.druh === 'remark'
          ? ' → export je NEÚPLNÝ, i když se stáhl; oblast potřebuje běh znovu'
          : ''),
    )
  }

  const upozorneni = soubory
    .map((s) => zkontrolujSirkuDotazu(s, readFileSync(s, 'utf8')))
    .filter((u): u is UpozorneniExportu => u !== null)

  for (const u of upozorneni) {
    const kde = u.soubor.replace(`${process.cwd()}/`, '')
    console.log(`! ${kde}`)
    console.log(
      `    ${u.elementu} objektů, z toho 0 civilně tagovaných → export je nejspíš` +
        ' z doby před 30. 7. 2026,',
    )
    console.log(
      '    kdy dotaz sbíral jen hutové tagy. Boudy mapované jako restaurace/hotel v něm chybí.',
    )
  }

  console.log()
  console.log(
    `surových exportů: ${soubory.length} | vad: ${vady.length} | upozornění: ${upozorneni.length}`,
  )
  if (upozorneni.length) {
    console.log()
    console.log('Upozornění NEROZHODUJE o návratovém kódu — je to práce, ne vada souboru:')
    console.log('pustit dotčenou oblast znovu (Actions → „DATA-01: OSM export chat (dle')
    console.log('oblasti)"), pak projít nově založené kandidáty triáží.')
  }
  if (vady.length) {
    console.log()
    console.log('Co s tím: spustit DATA-01 pro dotčenou oblast znovu (Actions →')
    console.log('„DATA-01: OSM export chat (dle oblasti)"). Od 8. 8. 2026 se běhová')
    console.log('chyba v `remark` vyhazuje jako chyba, takže se zapojí zrcadlo a vadný')
    console.log('soubor se přepíše platným.')
  }
  process.exit(vady.length ? 1 : 0)
}
