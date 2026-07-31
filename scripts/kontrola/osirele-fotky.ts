/**
 * Osiřelé kandidátní fotky: `data/kandidati/fotky/<oblast>/<slug>.yaml`
 * k objektu, který v korpusu už není.
 *
 * PROČ VZNIKLA (31. 7. 2026): kandidátní fotky vyrábí DATA-02 pro každý objekt
 * v `data/chaty/**` i `data/kandidati/**`. Když se pak objekt POVÝŠÍ (změní
 * oblast i slug — Pešákovna a Chatka Górzystów šly z krkonošských kandidátů do
 * jizerských profilů) nebo VYŘADÍ, jeho soubor s fotkami zůstane ležet pod
 * starým jménem. Nikoho to neshodí: soubor se prostě nikdy nepřečte. Jenže
 * příští běh DATA-02 založí správný soubor vedle něj a v adresáři začnou být
 * dvě metadata k téže chatě — a ta stará se tváří stejně důvěryhodně.
 *
 *   npx tsx scripts/kontrola/osirele-fotky.ts
 *
 * SEZNAM K POSOUZENÍ, ne verdikt (nerozhoduje o návratovém kódu celé kontroly):
 * osiření je běžný důsledek triáže, ne chyba, kterou by měl někdo řešit hned.
 * Smazat je smí redakce — data se neztratí, další běh DATA-02 je dohledá znovu
 * pod správným jménem.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KOREN = process.cwd()

/** Dvojice (oblast, slug) všech objektů, které v korpusu opravdu jsou. */
export const ziveObjekty = (koren = KOREN): Set<string> => {
  const out = new Set<string>()
  for (const zdroj of ['chaty', 'kandidati']) {
    const adr = join(koren, 'data', zdroj)
    if (!existsSync(adr)) continue
    for (const oblast of readdirSync(adr)) {
      if (oblast === 'fotky') continue // výstup DATA-02, ne chaty
      const dir = join(adr, oblast)
      if (!statSync(dir).isDirectory()) continue
      for (const f of readdirSync(dir)) {
        if (f.endsWith('.yaml')) out.add(`${oblast}/${f.replace(/\.yaml$/u, '')}`)
      }
    }
  }
  return out
}

/** Kandidátní fotky bez odpovídajícího objektu. */
export const osireleFotky = (koren = KOREN): string[] => {
  const zive = ziveObjekty(koren)
  const adr = join(koren, 'data', 'kandidati', 'fotky')
  if (!existsSync(adr)) return []
  const out: string[] = []
  for (const oblast of readdirSync(adr)) {
    const dir = join(adr, oblast)
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.yaml')) continue
      const klic = `${oblast}/${f.replace(/\.yaml$/u, '')}`
      if (!zive.has(klic)) out.push(`data/kandidati/fotky/${klic}.yaml`)
    }
  }
  return out.sort()
}

if (process.argv[1]?.endsWith('osirele-fotky.ts')) {
  const nalezy = osireleFotky()
  for (const f of nalezy) console.log(` * ${f}`)
  console.log(`\nkandidátních fotek osiřelých: ${nalezy.length} (objekt povýšen nebo vyřazen — smazat smí redakce)`)
}
