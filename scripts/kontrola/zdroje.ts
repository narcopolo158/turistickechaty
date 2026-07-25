/**
 * Kontrola integrity připisování zdrojů.
 *
 * Pravidlo (konvence poctivosti B + DATA-14): když veřejná próza (perex, text)
 * jmenuje konkrétní doménu jako zdroj tvrzení, musí ta doména stát i v bloku
 * `zdroje` — jinak čtenář nemá jak si tvrzení ověřit a připsání je slepé.
 * Počítá se i zdroj doložený u jednotlivé `zajimavosti`.
 *
 * Hlásí doménu jmenovanou v próze, která v `zdroje` NENÍ (ani v url, ani
 * v popisu).
 *
 *   npx tsx scripts/kontrola/zdroje.ts [soubor.yaml …]
 */
import { basename } from 'node:path'
import { domeny, najdiYaml, nactiYaml, proza, seznamMap } from './lib'

/**
 * Domény, které se v próze objevují jako součást názvu objektu nebo obecného
 * pojmu, ne jako zdroj tvrzení. Sem jen po ručním posouzení.
 */
const VYJIMKY = new Set<string>()

const cesty = process.argv.slice(2).length
  ? process.argv.slice(2)
  : najdiYaml('data/chaty')

let nalezy = 0
let souboruSNalezem = 0

for (const cesta of cesty) {
  const d = nactiYaml(cesta)

  const doloz = new Set<string>()
  for (const z of seznamMap(d.zdroje)) {
    for (const dom of domeny(z.url)) doloz.add(dom)
    for (const dom of domeny(z.popis)) doloz.add(dom)
  }
  for (const z of seznamMap(d.zajimavosti)) for (const dom of domeny(z.zdroj)) doloz.add(dom)

  const chybi = new Map<string, string[]>()
  for (const [kde, obsah] of proza(d, true)) {
    for (const dom of domeny(obsah)) {
      if (doloz.has(dom) || VYJIMKY.has(dom)) continue
      if (!chybi.has(dom)) chybi.set(dom, [])
      chybi.get(dom)!.push(kde)
    }
  }

  if (chybi.size) {
    souboruSNalezem++
    console.log(basename(cesta))
    for (const dom of [...chybi.keys()].sort()) {
      console.log(`    ${dom.padEnd(28)} jmenováno v: ${chybi.get(dom)!.join(', ')}`)
      nalezy++
    }
  }
}

console.log()
console.log(
  `souboru: ${cesty.length} | souboru s nalezem: ${souboruSNalezem} | chybejicich pripsani: ${nalezy}`,
)
