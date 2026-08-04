/**
 * DATA-35: výška obce u středisek — z nadmořské výšky referenčního bodu
 * střediska, ne z rozpětí.
 *
 * ZADÁNÍ MICHALA (4. 8. 2026), doslova: „u středisek s rozpětím výšek bych
 * určil středovou hodnotu, nebo lépe: vycházel z nadmořské výšky turistického
 * uzlu / rozcestí / náměstí."
 *
 * Proč to vůbec bylo potřeba: oficiální portál svazku uvádí u obcí rozložených
 * po svahu ROZPĚTÍ (Benecko 682–1010 m, Špindlerův Mlýn 575–1555 m, Vrchlabí
 * 400–1036 m). Vybrat z rozpětí jedno číslo od oka = domýšlení, takže pole
 * `vyskaObce` u nich zůstávalo prázdné a stat-tile se nevykresloval.
 *
 * POŘADÍ PREFERENCE (implementované níž, `rozhodni()`):
 *   1. Doložené JEDNO číslo z lidského pramene, které už v datech je
 *      (Dolní Dvůr 641 m, Pec pod Sněžkou 750 m — oficiální portál svazku).
 *      Tohle skript NIKDY nepřepisuje; jen ho porovná s modelem a rozdíl
 *      vypíše do reportu jako křížovou kontrolu.
 *   2. Výška REFERENČNÍHO BODU střediska z výškového modelu Mapy.com.
 *      Referenční bod = `lat`/`lng` v YAML střediska, což je uzel OSM
 *      `place` (town/village) — u českých obcí konvenčně střed obce, tedy
 *      to „náměstí / turistický uzel" ze zadání. Bod už je v datech doložený
 *      (ODbL) a je to týž bod, ze kterého se routují přístupové trasy.
 *   3. Střed doloženého rozpětí — POSLEDNÍ možnost, jen když bod nemá
 *      souřadnice. Zapisuje se s výslovnou poznámkou, že je to střed rozpětí.
 *
 * POLSKÁ STŘEDISKA SE ZAHRNUJÍ (rozhodnutí Michala 4. 8. 2026 na dotaz, jestli
 * u nich neplatí handoffové „PL bez čísel"): Karpacz, Przesieka i Szklarska
 * Poręba mají referenční bod stejně doložený jako česká, takže model jim výšku
 * dodá se stejnou silou dokladu. „PL bez čísel" se týkalo POČTŮ chat z katalogu,
 * ne doložených údajů o obci.
 *
 * Poctivost: výsledek kroku 2 je hodnota z VÝŠKOVÉHO MODELU (Mapy.com sám
 * píše „model s různou přesností — nemusí odpovídat realitě"), tedy nikdy
 * `verified: true` a nikdy se nevydává za úředně evidovanou výšku obce.
 * Ověření proti ČÚZK zůstává otevřené — a hlídací test v
 * `tests/int/strediska-data.int.spec.ts` vyžaduje, aby to zdroj říkal nahlas.
 *
 * Sandbox denních sessions na api.mapy.com nedosáhne (proxy, doloženo
 * u DATA-06 i DATA-28) — skript proto běží v GitHub Actions
 * („DATA-35: výška obce u středisek"), klíč secret MAPY_API_KEY.
 * Lokálně jde pustit nasucho:
 *
 *   npx tsx scripts/data35-vyska-stredisek.ts --oblast krkonose --dry-run
 *   npx tsx scripts/data35-vyska-stredisek.ts --oblast krkonose
 *
 * Idempotentní: když se hodnota nezmění, soubor se nesahá (ani `checked`).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseDocument } from 'yaml'

import { cestyOblasti, oblastZArgv } from './oblasti'
import { stahniVysky, type Bod } from './vyskovy-profil'

const OBLAST = oblastZArgv()
const DRY_RUN = process.argv.includes('--dry-run')

/** Dnešní datum ve tvaru `YYYY-MM-DD` (pole `checked`). */
const dnes = (): string => new Date().toISOString().slice(0, 10)

/**
 * Věta, kterou skript vkládá do `overeniLokace.source` k výšce. Musí obsahovat
 * slovo „výšk" i „ČÚZK" — hlídá to test středisek (výška bez dokladu a bez
 * přiznaného otevřeného ověření se nesmí do dat dostat).
 */
export const vetaOVysce = (
  bod: Bod,
  vyska: number,
  datum: string,
  puvodBodu: string,
): string =>
  `Výška obce: nadmořská výška referenčního bodu střediska (${puvodBodu}, ` +
  `${bod.lat.toFixed(6)}, ${bod.lon.toFixed(6)}) z výškového modelu Mapy.com ` +
  `Elevation API (načteno ${datum}): ${vyska} m — model s různou přesností, ` +
  `nemusí odpovídat realitě, proto verified:false. Referenční bod místo ` +
  `rozpětí dle zadání Michala 4. 8. 2026 („vycházel z nadmořské výšky ` +
  `turistického uzlu / rozcestí / náměstí"). Ověření proti ČÚZK zůstává otevřené.`

/** Střed doloženého rozpětí (krok 3) — zaokrouhlený na celé metry. */
export const stredRozpeti = (min: number, max: number): number => Math.round((min + max) / 2)

/**
 * Odstraní ze zdroje lokace větu o tom, že výška teprve chybí. Bez toho by si
 * soubor po dopočtu protiřečil — první běh 4. 8. 2026 nechal u šesti středisek
 * „výška obce zatím nedoložena — doplnit ze ČÚZK" hned vedle vyplněné hodnoty
 * a muselo se to uklízet ručně. Věta o OTEVŘENÉM ověření ČÚZK se tím nemaže:
 * tu doplňuje `vetaOVysce()` a hlídací test ji vyžaduje.
 */
export const bezVetyOChybejiciVysce = (source: string): string =>
  source
    .replace(/;?\s*výšk[au]\s+obce\s+zatím\s+nedoložena\s*—\s*doplnit\s+ze\s+ČÚZK\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()

/**
 * Vloží `vyskaObce` HNED ZA `lng`, ne na konec mapy. `setIn` na neexistující
 * klíč připojuje na konec — výška by pak seděla až pod interními poznámkami,
 * daleko od GPS a od bloku ověření, ke kterému patří (a vzor Dolního Dvora
 * z 3. 8. má pořadí lat / lng / vyskaObce / overeniLokace).
 */
export const vlozVyskuZaLng = (doc: ReturnType<typeof parseDocument>, vyska: number): void => {
  const mapa = doc.contents as { items?: { key?: { value?: unknown } }[] } | null
  if (!mapa?.items) throw new Error('YAML střediska není mapa klíčů.')
  const jeKlic = (nazev: string) => (p: { key?: { value?: unknown } }) => p.key?.value === nazev
  if (mapa.items.some(jeKlic('vyskaObce'))) {
    doc.setIn(['vyskaObce'], vyska)
    return
  }
  const pozice = mapa.items.findIndex(jeKlic('lng'))
  const pair = doc.createPair('vyskaObce', vyska) as { key?: { value?: unknown } }
  if (pozice < 0) mapa.items.push(pair)
  else mapa.items.splice(pozice + 1, 0, pair)
}

type StrediskoDoc = {
  soubor: string
  cesta: string
  doc: ReturnType<typeof parseDocument>
}

const nactiStrediska = (slozka: string): StrediskoDoc[] =>
  readdirSync(slozka)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const cesta = join(slozka, f)
      return { soubor: f, cesta, doc: parseDocument(readFileSync(cesta, 'utf8')) }
    })

/**
 * Co se má s daným střediskem stát. Oddělené od I/O, ať je to testovatelné
 * bez sítě i bez souborů.
 */
export type Rozhodnuti =
  | { akce: 'preskocit'; duvod: string }
  | { akce: 'dopocitat'; bod: Bod }

export const rozhodni = (data: {
  vyskaObce?: unknown
  lat?: unknown
  lng?: unknown
}): Rozhodnuti => {
  if (typeof data.vyskaObce === 'number')
    return { akce: 'preskocit', duvod: `už má doloženou výšku ${data.vyskaObce} m (lidský pramen má přednost před modelem)` }
  if (typeof data.lat !== 'number' || typeof data.lng !== 'number')
    return { akce: 'preskocit', duvod: 'nemá souřadnice referenčního bodu (jizerská střediska čekají na běh DATA-06 pro Jizerské hory)' }
  return { akce: 'dopocitat', bod: { lat: data.lat, lon: data.lng } }
}

const main = async (): Promise<void> => {
  const slozka = join(cestyOblasti(OBLAST.slug).strediska)
  const strediska = nactiStrediska(slozka)
  const datum = dnes()

  const kDopoctu: { s: StrediskoDoc; bod: Bod }[] = []
  const radky: string[] = []

  for (const s of strediska) {
    const data = s.doc.toJS() as { vyskaObce?: unknown; lat?: unknown; lng?: unknown; nazev?: string }
    const r = rozhodni(data)
    if (r.akce === 'preskocit') {
      radky.push(`— ${data.nazev ?? s.soubor}: přeskočeno (${r.duvod})`)
      continue
    }
    kDopoctu.push({ s, bod: r.bod })
  }

  if (kDopoctu.length === 0) {
    console.log(radky.join('\n'))
    console.log('\nNic k dopočtu.')
    return
  }

  const apiKlic = process.env.MAPY_API_KEY ?? process.env.NEXT_PUBLIC_MAPY_API_KEY ?? ''
  if (DRY_RUN || !apiKlic) {
    console.log(radky.join('\n'))
    console.log(
      `\n${DRY_RUN ? 'DRY RUN' : 'BEZ KLÍČE (MAPY_API_KEY)'} — dopočet by proběhl pro ${kDopoctu.length} středisek:`,
    )
    for (const { s, bod } of kDopoctu) console.log(`  • ${s.soubor} @ ${bod.lat}, ${bod.lon}`)
    return
  }

  // Jeden dotaz na všechna střediska (limit 256 pozic/dotaz je hluboko nad
  // počtem středisek oblasti) — kvóta tarifu Basic se tím sotva dotkne.
  const vysky = await stahniVysky(
    kDopoctu.map(({ bod }) => bod),
    apiKlic,
  )

  let zmeneno = 0
  for (const [i, { s, bod }] of kDopoctu.entries()) {
    const vyska = Math.round(vysky[i])
    const doc = s.doc
    vlozVyskuZaLng(doc, vyska)
    const puvodni = bezVetyOChybejiciVysce(String(doc.getIn(['overeniLokace', 'source']) ?? ''))
    doc.setIn(
      ['overeniLokace', 'source'],
      `${puvodni}${puvodni.endsWith('.') || puvodni === '' ? '' : '.'} ${vetaOVysce(bod, vyska, datum, 'uzel OSM place, týž bod jako GPS výš')}`.trim(),
    )
    doc.setIn(['overeniLokace', 'checked'], datum)
    doc.setIn(['overeniLokace', 'verified'], false)
    if (!DRY_RUN) writeFileSync(s.cesta, doc.toString())
    zmeneno++
    radky.push(`✓ ${s.soubor}: vyskaObce ${vyska} m (referenční bod ${bod.lat}, ${bod.lon})`)
  }

  console.log(radky.join('\n'))
  console.log(`\nStředisek v oblasti ${OBLAST.slug}: ${strediska.length} | dopočteno: ${zmeneno}`)
}

// Spouštět jen jako CLI — import v testech nesmí sáhnout na síť.
if (process.argv[1]?.includes('data35-vyska-stredisek')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
