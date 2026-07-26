/**
 * Regresní test kontrolních skriptů proti fixtuře.
 *
 * Fixtura (`scripts/kontrola/fixture/*.yaml`) je schválně vadný korpus: každý
 * soubor cílí na jednu větev kontroly a na jednu past. Očekávaný výstup
 * v `fixture/ocekavany-vystup/` NEBYL napsán ručně — vygenerovaly ho původní
 * pythonovské skripty, ze kterých se kontroly portovaly. Snímek je tedy důkaz,
 * že se port chová stejně jako předloha, a přežije i to, že originály zmizí.
 *
 * Když test spadne, jsou dvě možnosti: buď je v portu chyba, nebo se kontrola
 * ZÁMĚRNĚ zpřísnila — pak se snímek přegeneruje a rozdíl se popíše v commitu.
 *
 *   npx tsx scripts/kontrola/test-fixtura.ts
 *
 * Návratový kód 1 při jakémkoli rozdílu (vhodné do CI).
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { najdiYaml } from './lib'

const FIXTURA = 'scripts/kontrola/fixture'
const SNIMKY = join(FIXTURA, 'ocekavany-vystup')
const KONTROLY = ['audit-mech', 'ban-scan', 'zdroje', 'kolize-jmen']

const soubory = najdiYaml(FIXTURA)
if (!soubory.length) {
  console.log('✗ fixtura je prázdná — spouštíš to z kořene repozitáře?')
  process.exit(1)
}

let spadlo = 0
for (const jmeno of KONTROLY) {
  const beh = spawnSync(
    'npx',
    ['tsx', join('scripts/kontrola', `${jmeno}.ts`), ...soubory],
    { encoding: 'utf8' },
  )
  const dostal = beh.stdout ?? ''
  const cekal = readFileSync(join(SNIMKY, `${jmeno}.txt`), 'utf8')

  if (dostal === cekal) {
    console.log(`✓ ${jmeno}`)
    continue
  }

  spadlo++
  console.log(`✗ ${jmeno} — výstup se liší od snímku:`)
  const a = cekal.split('\n')
  const b = dostal.split('\n')
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue
    console.log(`    ř. ${i + 1}`)
    console.log(`      čekal:  ${JSON.stringify(a[i] ?? null)}`)
    console.log(`      dostal: ${JSON.stringify(b[i] ?? null)}`)
  }
}

console.log()
console.log(`fixtura: ${soubory.length} souboru | kontrol: ${KONTROLY.length} | spadlo: ${spadlo}`)
process.exit(spadlo ? 1 : 0)
