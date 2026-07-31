/**
 * Smoke test statického náhledu mapy (`src/lib/mapa-nahled.ts`).
 *
 * PROČ SAMOSTATNÝ SKRIPT A NE UNIT TEST: unit testy hlídají TVAR adresy —
 * pořadí lon,lat, zředění čáry, počet tras. Jestli tu adresu Mapy.com opravdu
 * přijmou, se z nich nepozná; sandbox denních sessions na api.mapy.com
 * nedosáhne (proxy, stejně jako u dlaždic — viz hlavička smoke-mapy.yml).
 * Tenhle skript se proto pouští z Actions a ptá se doopravdy.
 *
 * Ověřuje obě podoby, které route `/api/mapa-nahled/[slug]` umí vyrobit:
 *   1. bez tras — střed na chatě + `zoom`,
 *   2. s trasami — výřez dopočítá API z `padding` a `shapes` (tenhle případ
 *      je rizikový: kombinaci „shapes + padding + žádný zoom" dokumentace
 *      popisuje, ale nikde ji neukazuje na příkladu).
 *
 * Klíč se bere z `MAPY_API_KEY` (secret v Actions) nebo `NEXT_PUBLIC_MAPY_API_KEY`
 * (lokální .env). Do výpisu se NIKDY nedostane — adresa se tiskne s klíčem
 * nahrazeným hvězdičkami, protože logy běhů jsou v Actions veřejně čitelné.
 *
 *   npx tsx scripts/smoke-mapa-nahled.ts
 *
 * Návratový kód 1, když kterýkoli dotaz neskončí obrázkem.
 */
import { readFileSync } from 'node:fs'

// Aby skript šel pustit i lokálně s klíčem z .env; v Actions přijde z prostředí.
import 'dotenv/config'
import { parse } from 'yaml'

import { urlNahleduMapy } from '../src/lib/mapa-nahled'
import { pristupyChaty } from '../src/lib/pristupove-trasy'

/** Vzorová chata: má GPS i spočtené trasy, takže projdou obě větve. */
const SLUG = 'lucni-bouda'
const YAML = `data/chaty/krkonose/${SLUG}.yaml`

const klic = process.env.MAPY_API_KEY || process.env.NEXT_PUBLIC_MAPY_API_KEY
if (!klic) {
  console.error('Chybí MAPY_API_KEY (Actions) ani NEXT_PUBLIC_MAPY_API_KEY (.env).')
  process.exit(1)
}

/** Adresa do logu bez klíče — logy běhů Actions jsou veřejné. */
const bezKlice = (url: string): string => url.replace(klic, '*'.repeat(8))

const chata = parse(readFileSync(YAML, 'utf8')) as { lat?: number; lng?: number }
if (typeof chata.lat !== 'number' || typeof chata.lng !== 'number') {
  console.error(`${YAML}: chybí lat/lng — vzorová chata musí mít doložené souřadnice.`)
  process.exit(1)
}

const trasy = pristupyChaty(SLUG)
  .map((p) => ({ body: p.geometrie ?? [] }))
  .filter((t) => t.body.length > 1)

console.log(`vzorová chata: ${SLUG} (${chata.lat}, ${chata.lng}) | tras s geometrií: ${trasy.length}`)
if (trasy.length === 0) console.log('POZOR: chata nemá geometrii tras — varianta „s trasami" se neověří.')

type Pripad = { popis: string; url: string }
const pripady: Pripad[] = [
  { popis: 'bez tras (střed + zoom)', url: urlNahleduMapy(klic, { lat: chata.lat, lng: chata.lng }) },
  ...(trasy.length
    ? [{ popis: 's trasami (padding + shapes)', url: urlNahleduMapy(klic, { lat: chata.lat, lng: chata.lng, trasy }) }]
    : []),
]

let spadlo = 0
for (const { popis, url } of pripady) {
  console.log(`\n── ${popis} ──`)
  console.log(`délka URL: ${url.length} znaků`)
  console.log(bezKlice(url))
  try {
    // `debug=true` vrací důvod odmítnutí v JSON místo holého kódu (dokumentace
    // static-maps). Bez něj se z „403" nepozná, jestli je vadný klíč, nebo
    // parametr — a to je přesně to, co potřebujeme vědět.
    const odpoved = await fetch(`${url}&debug=true`, {
      headers: { 'user-agent': 'turistickechaty.cz smoke/1.0 (+https://turistickechaty.cz)' },
    })
    const typ = odpoved.headers.get('content-type') ?? '—'
    const telo = await odpoved.arrayBuffer()
    console.log(`HTTP ${odpoved.status} | content-type: ${typ} | ${telo.byteLength} B`)
    if (!odpoved.ok || !typ.startsWith('image/') || telo.byteLength < 1000) {
      // Prázdný „obrázek" o pár bajtech je odmítnutí převlečené za odpověď.
      console.error('VADA: odpověď není použitelný obrázek.')
      // Důvod odmítnutí do logu — bez něj se hledá po hmatu. Klíč se v těle
      // neobjevuje, ale pro jistotu se přes výpis pouští táž redakce.
      const text = new TextDecoder().decode(telo).slice(0, 400)
      if (text.trim()) console.error(`odpověď serveru: ${bezKlice(text)}`)
      // Ať se sandboxová bariéra neplete s odmítnutím od Mapy.com — vypadají
      // stejně (403), ale znamenají opak: tohle není nález, jen zeď.
      if (/not in allowlist|egress/i.test(text))
        console.error(
          'POZN.: to odmítl proxy sandboxu, ne Mapy.com. Tenhle skript má smysl pouštět z Actions (Smoke: Mapy.com API).',
        )
      spadlo++
    }
  } catch (e) {
    console.error(`VADA: dotaz neprošel — ${e instanceof Error ? e.message : String(e)}`)
    spadlo++
  }
}

console.log(`\nhotovo: ${pripady.length - spadlo}/${pripady.length} ok`)
process.exit(spadlo ? 1 : 0)
