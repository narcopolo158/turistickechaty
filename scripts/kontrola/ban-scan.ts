/**
 * Mechanický sken veřejné prózy (perex + text) na zakázané vzory.
 *
 * Do veřejného textu nepatří: URL, domény, e-maily, telefony, ceny („ceny se
 * mění"), GPS, čísla turistických známek, názvy polí ani interní terminologie.
 * Výstup je SEZNAM K POSOUZENÍ, ne seznam vad — část zásahů jsou trvalé
 * a známé falešné poplachy: doména v prvním pádě jako jméno pramene („server
 * Krkonose.eu") je doložený domácí styl, „redakce" v závěrečném odstavci taky,
 * OpenStreetMap se uvádí kvůli licenci ODbL a české „osm" trefuje vzor /OSM/.
 *
 *   npx tsx scripts/kontrola/ban-scan.ts [soubor.yaml …]
 */
import { basename } from 'node:path'
import { najdiYaml, nactiYaml, proza, W, WB0, WB1 } from './lib'

// POZOR: v tomhle souboru se nesmí objevit `\b` ani `\w` — viz komentář v lib.ts.
const VZORY: Array<[string, RegExp]> = [
  ['URL', new RegExp('https?://|www\\.', 'gu')],
  [
    'doména/TLD',
    new RegExp(`${WB0}[a-z0-9-]{2,}\\.(cz|pl|eu|com|net|org|info)${WB1}`, 'gu'),
  ],
  ['e-mail', new RegExp('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+', 'gu')],
  ['telefon', new RegExp(`\\+\\d{2,3}\\s?\\d|${WB0}\\d{3}\\s\\d{3}\\s\\d{3}${WB1}`, 'gu')],
  [
    'cena',
    new RegExp(
      `${WB0}Kč${WB1}|${WB0}korun|${WB0}zł${WB1}|${WB0}EUR${WB1}|€|${WB0}PLN${WB1}|` +
        `${WB0}cen[ayu]${WB1}|${WB0}cení[kř]`,
      'gu',
    ),
  ],
  [
    'GPS',
    new RegExp(
      `\\d{1,3}\\.\\d{4,}|\\d+°\\s?\\d+'|${WB0}souřadnic|${WB0}GPS${WB1}|${WB0}N${WB1}\\s*\\d{2}\\.`,
      'gu',
    ),
  ],
  [
    'číslo známky',
    new RegExp(`známk${W}*\\s*(č\\.|číslo)\\s*\\d+|${WB0}č\\.\\s?\\d{2,4}${WB1}`, 'gu'),
  ],
  [
    'název pole',
    new RegExp(
      `${WB0}verified${WB1}|${WB0}checked${WB1}|${WB0}slug${WB1}|${WB0}typObcerstveni${WB1}|` +
        `${WB0}interniPoznamky${WB1}|${WB0}overeni[A-Z]|${WB0}perex${WB1}|${WB0}milniky${WB1}|` +
        `${WB0}rokVzniku${WB1}|${WB0}zajimavosti${WB1}|${WB0}yaml${WB1}|${WB0}YAML${WB1}`,
      'gu',
    ),
  ],
  [
    'interní pojem',
    new RegExp(
      `${WB0}kandidát|${WB0}KANDIDÁT|${WB0}povýš|${WB0}DATA-\\d+|${WB0}OSM${WB1}|` +
        `${WB0}OpenStreetMap${WB1}|${WB0}Payload${WB1}|${WB0}redakc|${WB0}profil${WB1}|` +
        `${WB0}nedomýšl|${WB0}ověřeno námi${WB1}`,
      'gu',
    ),
  ],
]

const cesty = process.argv.slice(2).length
  ? process.argv.slice(2)
  : najdiYaml('data/chaty')

let zasahy = 0
for (const cesta of cesty) {
  const d = nactiYaml(cesta)
  for (const [kde, obsah] of proza(d, true)) {
    for (const [jmeno, vzor] of VZORY) {
      for (const m of obsah.matchAll(vzor)) {
        const a = Math.max(0, m.index - 45)
        const b = Math.min(obsah.length, m.index + m[0].length + 45)
        console.log(
          `${basename(cesta)} | ${kde} | ${jmeno} | …${obsah.slice(a, b).replaceAll('\n', ' ')}…`,
        )
        zasahy++
      }
    }
  }
}
console.log()
console.log(`souboru: ${cesty.length} | zasahu: ${zasahy}`)
