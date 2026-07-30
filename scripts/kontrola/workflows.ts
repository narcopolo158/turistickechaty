/**
 * Kontrola definic GitHub Actions (`.github/workflows/*.yml`).
 *
 * PROČ VZNIKLA: 28. 7. 2026 se do repa dostal `data01-overpass.yml` se dvěma
 * klíči `inputs:` pod sebou — nový vstup `oblast` se přidal VEDLE původního
 * `api` místo do něj. YAML s duplicitním klíčem GitHub nepřečte, a projeví se
 * to jen na webu Actions: workflow zmizí z levého sloupce pod svým jménem
 * a zůstane tam holá cesta `.github/workflows/data01-overpass.yml`, push
 * rovnou založí padlý běh („Invalid workflow file") a tlačítko Run workflow
 * nabízí staré vstupy. Lint, typecheck ani build o tom nevědí — soubor není
 * součástí aplikace. Tahle kontrola to chytí v CI, ne až Michal v prohlížeči.
 *
 *   npx tsx scripts/kontrola/workflows.ts [soubor…]
 *
 * Bez argumentů projde celý `.github/workflows`. Návratový kód 1 při jakékoli
 * vadě. Před vlastní kontrolou proběhne vestavěný self-test nad ukázkami
 * v `VZORKY` — každá kontrola má svou vadnou ukázku, takže se pozná, když
 * kontrola přestane zabírat (regresní pojistka bez další fixtury na disku).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LineCounter, parseDocument } from 'yaml'

const ADRESAR = '.github/workflows'

/**
 * Umí ten skript vybrat oblast? Pozná se podle `oblastZArgv` — tak si ji
 * z argumentů bere celá pipeline (scripts/oblasti.ts).
 */
const skriptBereOblast = (cestaSkriptu: string): boolean =>
  existsSync(cestaSkriptu) && /oblastZArgv/.test(readFileSync(cestaSkriptu, 'utf8'))

/** Volání `npx tsx scripts/…​.ts` v `run:` bloku. */
const volaneSkripty = (run: string): string[] =>
  [...run.matchAll(/npx\s+tsx\s+(scripts\/[\w./-]+\.ts)/g)].map((m) => m[1])

type Vada = { kod: string; radek: number | null; zprava: string }

const je = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** Výrazy `${{ … }}` v řetězci. */
const vyrazy = (s: string): string[] =>
  [...s.matchAll(/\$\{\{(.+?)\}\}/gs)].map((m) => m[1].trim())

/**
 * Kontexty, jejichž obsah píše ten, kdo běh spouští (formulář „Run workflow",
 * název větve, titulek issue) — tedy to, co se nesmí lepit do shellu.
 */
const VYPLNITELNE = /(?:^|[^.\w])(?:inputs\.|github\.event\.|github\.head_ref|github\.ref_name)/

/** Spouštěče workflow — `on` může být řetězec, seznam i mapa. */
function spoustece(on: unknown): string[] {
  if (typeof on === 'string') return [on]
  if (Array.isArray(on)) return on.filter((v): v is string => typeof v === 'string')
  if (je(on)) return Object.keys(on)
  return []
}

export function zkontrolujWorkflow(
  cesta: string,
  obsah: string,
  bereOblast: (cestaSkriptu: string) => boolean = skriptBereOblast,
): Vada[] {
  const vady: Vada[] = []
  const pocitadlo = new LineCounter()
  const doc = parseDocument(obsah, { lineCounter: pocitadlo })
  const radek = (offset: number | undefined) =>
    typeof offset === 'number' ? pocitadlo.linePos(offset).line : null

  // A — syntaxe. Sem spadne duplicitní klíč („Map keys must be unique"),
  // rozbité odsazení i neuzavřený řetězec. Dál nemá smysl pokračovat:
  // parser sice něco vrátí, ale GitHub soubor odmítne celý.
  if (doc.errors.length) {
    for (const e of doc.errors) {
      vady.push({ kod: 'A', radek: e.linePos?.[0]?.line ?? null, zprava: `nevalidní YAML — ${e.message.split('\n')[0]}` })
    }
    return vady
  }

  const w = doc.toJS() as Record<string, unknown> | null
  if (!je(w)) return [{ kod: 'A', radek: null, zprava: 'soubor není mapa klíčů (prázdný?)' }]

  // B — bez `name:` se workflow v Actions jmenuje svou cestou. Je to legální
  // YAML, ale v seznamu workflow je pak k nerozeznání od ostatních a odkaz
  // v deníku („spusť DATA-01") ztrácí smysl.
  if (typeof w.name !== 'string' || !w.name.trim()) {
    vady.push({ kod: 'B', radek: null, zprava: 'chybí `name:` — v Actions se workflow ukáže jako holá cesta k souboru' })
  }

  // C — kostra.
  const on = w.on
  if (on === undefined) vady.push({ kod: 'C', radek: null, zprava: 'chybí `on:` — workflow nemá spouštěč' })
  const jobs = w.jobs
  if (!je(jobs) || !Object.keys(jobs).length) {
    vady.push({ kod: 'C', radek: null, zprava: 'chybí `jobs:` nebo je prázdné' })
    return vady
  }

  const dispatch = je(on) && je(on.workflow_dispatch) ? on.workflow_dispatch : null
  const deklarovane = new Set(dispatch && je(dispatch.inputs) ? Object.keys(dispatch.inputs) : [])
  const jineSpoustece = spoustece(on).filter((s) => s !== 'workflow_dispatch')

  // Projdi kroky: každý `run:` a každou hodnotu v `env:`.
  for (const [jmenoJobu, job] of Object.entries(jobs)) {
    if (!je(job)) continue
    if (typeof job['runs-on'] !== 'string' && !Array.isArray(job['runs-on']) && !je(job['runs-on'])) {
      vady.push({ kod: 'C', radek: null, zprava: `job \`${jmenoJobu}\` nemá \`runs-on\`` })
    }
    const kroky = Array.isArray(job.steps) ? job.steps : []
    if (!kroky.length) vady.push({ kod: 'C', radek: null, zprava: `job \`${jmenoJobu}\` nemá žádné \`steps\`` })

    for (const [i, krok] of kroky.entries()) {
      if (!je(krok)) continue
      const kde = `${jmenoJobu}[${i}]${typeof krok.name === 'string' ? ` „${krok.name}"` : ''}`
      const r = radek(nodeOffset(doc, ['jobs', jmenoJobu, 'steps', i]))

      // F — interpolace VYPLNITELNÉ hodnoty přímo do shellu. Text z formuláře
      // („Run workflow" nebo název větve) se má předat přes `env:` a ve
      // skriptu číst jako "$PROMENNA": hodnota se pak nesestavuje do příkazu,
      // takže apostrof ani středník v ní nic nerozbije. Zbytek repa to tak
      // dělá (`API_INPUT`, `LIMIT_INPUT`, `RADIUS_INPUT`).
      // Vědomě se NEHLÁSÍ `secrets.*`: secret nevyplňuje odesilatel běhu, ale
      // majitel repa v nastavení, a v logu ho GitHub maskuje. Hlásit i je by
      // znamenalo přepsat funkční SSH nasazení kvůli riziku, které tam není.
      if (typeof krok.run === 'string') {
        for (const v of vyrazy(krok.run)) {
          if (!VYPLNITELNE.test(v)) continue
          vady.push({ kod: 'F', radek: r, zprava: `${kde}: výraz \`\${{ ${v} }}\` je přímo v \`run:\` — předej ho přes \`env:\` a čti jako "$PROMENNA"` })
        }
      }

      // G — skript umí `--oblast`, ale workflow mu ji nepředá. Běh pak tiše
      // spočítá výchozí oblast (krkonose) pod jménem té, kterou uživatel
      // vybral — na výsledku to není poznat. Přesně tohle se stalo DATA-06:
      // skripty se generalizovaly, tlačítko zůstalo krkonošské a Michal
      // 30. 7. 2026 hlásil „u data-06 nejde vybrat oblast".
      if (typeof krok.run === 'string') {
        for (const skript of volaneSkripty(krok.run)) {
          if (!bereOblast(skript)) continue
          if (/--oblast/.test(krok.run)) continue
          vady.push({ kod: 'G', radek: r, zprava: `${kde}: \`${skript}\` umí \`--oblast\`, ale workflow mu ji nepředá — běh spočítá výchozí oblast` })
        }
      }

      const env = je(krok.env) ? Object.values(krok.env) : []
      const jobEnv = je(job.env) ? Object.values(job.env) : []
      for (const hodnota of [...env, ...jobEnv, typeof krok.run === 'string' ? krok.run : '']) {
        if (typeof hodnota !== 'string') continue
        for (const v of vyrazy(hodnota)) {
          for (const m of v.matchAll(/(?:github\.event\.)?inputs\.([A-Za-z0-9_-]+)/g)) {
            // D — překlep ve jménu vstupu. GitHub takový výraz nezhavaruje,
            // jen dosadí prázdno — skript pak běží s výchozí hodnotou a nikdo
            // se nediví, proč se přepínač „neprojevil".
            if (!deklarovane.has(m[1])) {
              vady.push({ kod: 'D', radek: r, zprava: `${kde}: \`inputs.${m[1]}\` není deklarovaný ve \`workflow_dispatch.inputs\` (deklarované: ${[...deklarovane].join(', ') || '—'})` })
            }
          }
          // E — při jiném spouštěči než workflow_dispatch je kontext `inputs`
          // prázdný. Bez `|| 'výchozí'` by se do skriptu poslal prázdný
          // řetězec (u nás třeba `--oblast ""`).
          if (jineSpoustece.length && /(?:github\.event\.)?inputs\./.test(v) && !v.includes('||')) {
            vady.push({ kod: 'E', radek: r, zprava: `${kde}: \`${v}\` bez zálohy \`|| 'výchozí'\` — spouštěč ${jineSpoustece.join('/')} kontext \`inputs\` nemá` })
          }
        }
      }
    }
  }
  return vady
}

/** Offset uzlu v dokumentu (pro číslo řádku); null, když cesta neexistuje. */
function nodeOffset(doc: ReturnType<typeof parseDocument>, cesta: Array<string | number>): number | undefined {
  const uzel = doc.getIn(cesta, true) as { range?: [number, number, number] } | undefined
  return uzel?.range?.[0]
}

// ── vestavěný self-test ────────────────────────────────────────────────────
const DOBRY = `name: 'Ukázka'
on:
  workflow_dispatch:
    inputs:
      oblast:
        default: 'krkonose'
jobs:
  b:
    runs-on: ubuntu-latest
    steps:
      - name: Krok
        env:
          OBLAST: \${{ inputs.oblast }}
        run: echo "$OBLAST"
`
const VZORKY: Array<[string, string, string]> = [
  ['A', 'dva klíče `inputs:` pod sebou', DOBRY.replace("      oblast:\n        default: 'krkonose'", "      oblast:\n        default: 'krkonose'\n    inputs:\n      api:\n        default: ''")],
  ['B', 'chybí name', DOBRY.replace("name: 'Ukázka'\n", '')],
  ['C', 'job bez runs-on', DOBRY.replace('    runs-on: ubuntu-latest\n', '')],
  ['D', 'překlep ve jménu vstupu', DOBRY.replace('inputs.oblast }}', 'inputs.oblastt }}')],
  ['E', 'inputs bez zálohy u push spouštěče', DOBRY.replace('on:\n', 'on:\n  push:\n    branches: [main]\n')],
  ['F', 'výraz přímo v run:', DOBRY.replace('run: echo "$OBLAST"', "run: echo \"\\${{ inputs.oblast }}\"")],
  ['G', 'skript umí --oblast, workflow ji nepředá', DOBRY.replace('run: echo "$OBLAST"', 'run: npx tsx scripts/data06-trasy.ts')],
]

/** Ukázky, které se hlásit NESMÍ (aby kontrola nezačala plašit). */
const TICHE: Array<[string, string]> = [
  ['secret přímo v run: (nevyplňuje ho odesilatel běhu)', DOBRY.replace('run: echo "$OBLAST"', 'run: echo "\\${{ secrets.MAPY_API_KEY }}" > klic')],
  ['skript s --oblast v run: (předává se)', DOBRY.replace('run: echo "$OBLAST"', 'run: npx tsx scripts/data06-trasy.ts --oblast "$OBLAST"')],
  ['skript, který oblast neumí', DOBRY.replace('run: echo "$OBLAST"', 'run: npx tsx scripts/seed-chaty.ts')],
]

function selfTest(): boolean {
  let spadlo = 0
  const pripadu = VZORKY.length + TICHE.length + 1
  const cisty = zkontrolujWorkflow('<dobrý>', DOBRY)
  if (cisty.length) {
    spadlo++
    console.log(`  ✗ dobrá ukázka hlásí vady: ${cisty.map((v) => v.kod + ' ' + v.zprava).join('; ')}`)
  }
  for (const [kod, popis, yaml] of VZORKY) {
    const vady = zkontrolujWorkflow(`<${kod}>`, yaml)
    if (!vady.some((v) => v.kod === kod)) {
      spadlo++
      console.log(`  ✗ ${kod} (${popis}) — kontrola nezabrala, vrátila: ${vady.map((v) => v.kod).join(',') || 'nic'}`)
    }
  }
  for (const [popis, yaml] of TICHE) {
    const vady = zkontrolujWorkflow('<tiché>', yaml)
    if (vady.length) {
      spadlo++
      console.log(`  ✗ tichá ukázka (${popis}) se hlásí: ${vady.map((v) => v.kod + ' ' + v.zprava).join('; ')}`)
    }
  }
  console.log(`self-test: ${pripadu - spadlo}/${pripadu} ${spadlo ? '— SPADL' : 'ok'}`)
  return spadlo === 0
}

// ── běh ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const soubory = argv.length
  ? argv
  : readdirSync(ADRESAR)
      .filter((j) => j.endsWith('.yml') || j.endsWith('.yaml'))
      .sort()
      .map((j) => join(ADRESAR, j))

const selfOk = selfTest()
console.log()

let celkem = 0
for (const cesta of soubory) {
  const vady = zkontrolujWorkflow(cesta, readFileSync(cesta, 'utf8'))
  celkem += vady.length
  if (!vady.length) {
    console.log(`✓ ${cesta}`)
    continue
  }
  console.log(`✗ ${cesta}`)
  for (const v of vady) console.log(`    [${v.kod}]${v.radek ? ` ř. ${v.radek}` : ''} ${v.zprava}`)
}

console.log()
console.log(`workflow souboru: ${soubory.length} | vad: ${celkem}`)
process.exit(celkem || !selfOk ? 1 : 0)
