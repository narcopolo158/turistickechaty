/**
 * Spustí všechny kontroly datové vrstvy najednou.
 *
 * Na rozdíl od řetězení přes `&&` se nezastaví na první chybě — validátor sice
 * vrací nenulový kód, ale zbylé tři kontroly stejně doběhnou, protože jejich
 * výstup je seznam k posouzení, ne verdikt, a chce se vidět celý.
 *
 *   npx tsx scripts/kontrola/vse.ts
 *
 * Návratový kód 1, když spadne validátor nebo regresní test fixtury.
 */
import { spawnSync } from 'node:child_process'

const KROKY = [
  ['validator', 'ciselniky, konvence B, svoleni u obrazku', true],
  ['zdroje', 'domena jmenovana v proze musi stat i ve `zdroje`', false],
  ['ban-scan', 'zakazane vzory ve verejne proze (seznam k posouzeni)', false],
  ['audit-mech', 'mechanicky audit A-F (seznam k posouzeni)', false],
  // jako jedina z trojice seznamovych kontrol ROZHODUJE: cisty stav je presne
  // nula, takze kazdy zasah je regrese, ne polozka k posouzeni
  ['kolize-jmen', 'kolize nazvu chat v celem korpusu', true],
  // jedina kontrola mimo datovou vrstvu: definice GitHub Actions. Rozhoduje,
  // protoze vadny workflow se jinak pozna az na webu Actions (padly beh).
  ['workflows', 'definice GitHub Actions (.github/workflows)', true],
  ['test-fixtura', 'regresni test kontrol proti fixture', true],
] as const

let spadlo = 0
for (const [jmeno, popis, rozhoduje] of KROKY) {
  console.log(`\n${'─'.repeat(78)}\n▶ ${jmeno} — ${popis}\n${'─'.repeat(78)}`)
  const beh = spawnSync('npx', ['tsx', `scripts/kontrola/${jmeno}.ts`], {
    stdio: 'inherit',
  })
  if (rozhoduje && beh.status !== 0) spadlo++
}

console.log(`\n${'─'.repeat(78)}`)
console.log(spadlo ? `HOTOVO — ${spadlo} rozhodujicich kontrol spadlo` : 'HOTOVO — vse zelene')
process.exit(spadlo ? 1 : 0)
