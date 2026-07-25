/**
 * Mechanické kontroly publikovaných profilů (krok (a) návrhu DATA-15).
 *
 * Část auditní taxonomie z 25. 7. 2026 je strojově chytatelná. Tenhle skript
 * nedělá jazykový audit — hledá jen vzory, které se dají popsat pravidlem:
 *
 *   A  próza tvrdí hodnotu pole, které je v datech ZÁMĚRNĚ prázdné
 *      (obec, stav, kapacita, výška) — tak se chytil Krakonoš
 *   B  v bloku `overeni` stojí „před publikací ověřit…", a profil je přesto
 *      publikovaný — tak se chytila Samotnia
 *   C  doména v próze je blízká varianta domény doložené v `zdroje`
 *      => pravděpodobně skloňovaná doména (vada domácího stylu)
 *   D  superlativ ve větě bez připsání (kdo to tvrdí?)
 *   E  letopočet v próze, který se nikde jinde v souboru nevyskytuje
 *      => údaj bez opory v datech profilu
 *
 * Výstup je SEZNAM K POSOUZENÍ, ne seznam vad. Každý zásah se musí přečíst;
 * první běh 25. 7. 2026 dal 18 zásahů, z toho 8 skutečných vad a 10 falešných
 * poplachů — a právě podle nich jsou kontroly A a D utažené (viz komentáře
 * u `PRIZNANI`, `NENI_REKORD`, `VNITRNI` a u okna vět).
 *
 *   npx tsx scripts/kontrola/audit-mech.ts [soubor.yaml …]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { DOMENA, najdiYaml, nactiYaml, proza, seznamMap, VETA, WB0, WB1 } from './lib'

// POZOR: v tomhle souboru se nesmí objevit `\b` ani `\w` — viz komentář v lib.ts.

/** Věta, ve které leží shoda `m` (podle hranic VETA). */
function vetaKolem(text: string, shoda: string): string {
  for (const v of text.split(VETA)) if (v.includes(shoda)) return v
  return text
}

/** Věta i plus její bezprostřední sousedé — připsání často stojí vedle. */
function oknoVet(vety: string[], i: number): string {
  return vety.slice(Math.max(0, i - 1), i + 2).join(' ')
}

/** Celý soubor bez perexu a bez pole text — tj. data, komentáře, poznámky. */
function zbytekSouboru(raw: string, d: Record<string, unknown>): string {
  let s = raw
  for (const [, v] of proza(d)) {
    for (const radek of v.split('\n')) {
      const r = radek.trim()
      if (r.length > 8) s = s.replaceAll(r, ' ')
    }
  }
  return s
}

function vypis(nalezy: string[], nadpis: string) {
  console.log(`\n=== ${nadpis} — ${nalezy.length} ===`)
  for (const n of nalezy) console.log(' *', n)
}

// ── kontrola A: próza tvrdí hodnotu záměrně prázdného pole ──────────────────

/** Příznak, že profil rozpor PŘIZNÁVÁ (pak nejde o tichý výběr, ale o poctivost). */
const PRIZNANI = new RegExp(
  'odporuj|neodpovídaj|rozpor|kdežto|nevíme|nemáme|nedoložen|nepodařilo|' +
    'prameny si|není jasné|nejasn|záměrně|doložit neumíme|jedna z|která z|' +
    'neověřen|ověřit|ověřte',
  'iu',
)

const CISLO_LUZEK = new RegExp(`${WB0}(\\d{1,3})\\s*lůž`, 'iu')
const VYSKA_M = new RegExp(`${WB0}(\\d\\s?\\d{3}|\\d{3,4})\\s*m(?:\\s*n\\.\\s*m\\.|etr)`, 'iu')
const V_PROVOZU = new RegExp(
  `${WB0}(je v provozu|funguje|je otevřen|má otevřeno|slouží hostům)`,
  'iu',
)

function kontrolaA(cesta: string, d: Record<string, unknown>, obceVsech: Set<string>): string[] {
  const n: string[] = []
  const p = proza(d)
  const cely = p.map(([, v]) => v).join(' ')
  const priznano = PRIZNANI.test(cely)

  if (!d.obec) {
    for (const obec of [...obceVsech].sort()) {
      const zaklad = obec.slice(0, 5).toLowerCase()
      if (zaklad && cely.toLowerCase().includes(zaklad) && !priznano) {
        n.push(`${cesta} | pole \`obec\` prazdne, proza jmenuje <<${obec}>> a rozpor nikde nepriznava`)
        break
      }
    }
  }

  if (!d.kapacita) {
    for (const [lbl, v] of p) {
      const m = CISLO_LUZEK.exec(v)
      if (m && !priznano) {
        n.push(`${cesta} | pole \`kapacita\` prazdne, ${lbl} uvadi <<${m[0]}>>`)
        break
      }
    }
  }

  if (!d.vyska) {
    for (const [lbl, v] of p) {
      const m = VYSKA_M.exec(v)
      // stejné hradlo jako u obec/kapacita: když profil rozpor nebo vlastní
      // mezeru PŘIZNÁVÁ, nejde o vadu, ale o poctivost
      // (portasky.yaml: „Nadmořskou výšku tu záměrně nenajdete")
      if (m && !priznano) {
        n.push(`${cesta} | pole \`vyska\` prazdne, ${lbl} uvadi <<${m[0]}>>`)
        break
      }
    }
  }

  if (!d.stav) {
    for (const [lbl, v] of p) {
      const m = V_PROVOZU.exec(v)
      // navíc připsání: „Provozovatel na svém webu uvádí, že má otevřeno
      // 365 dní v roce" není tvrzení profilu, ale citace pramene
      if (m && !priznano && !PRIPSANI.test(vetaKolem(v, m[0]))) {
        n.push(`${cesta} | pole \`stav\` prazdne, ${lbl} tvrdi <<${m[0]}>>`)
        break
      }
    }
  }
  return n
}

// ── kontrola B: overeni si žádá odklad publikace, profil už publikovaný ─────

const ODKLAD = new RegExp(
  'před publikací|před zveřejněním|nepublikovat|publikovat až|dokud se ne',
  'iu',
)
/** Formulace, která odklad jen REKAPITULUJE (už vyřešeno) — nehlásit. */
const VYRESENO = new RegExp('POZNÁMKA K PUBLIKACI|byl publikován|publikován i bez', 'iu')

function kontrolaB(cesta: string, d: Record<string, unknown>): string[] {
  const n: string[] = []
  for (const [k, v] of Object.entries(d)) {
    if (!k.startsWith('overeni') || !v || typeof v !== 'object') continue
    const src = String((v as Record<string, unknown>).source ?? '')
    const m = ODKLAD.exec(src)
    if (m && !VYRESENO.test(src))
      n.push(`${cesta} | ${k}.source zada <<${m[0]}>>, ale profil je publikovany`)
  }
  return n
}

// ── kontrola C: doména v próze jako blízká varianta doložené domény ─────────

function kontrolaC(cesta: string, d: Record<string, unknown>): string[] {
  const n: string[] = []
  const dolozene = new Set<string>()
  for (const z of seznamMap(d.zdroje)) {
    for (const kus of [z.url, z.popis]) {
      for (const m of String(kus ?? '').matchAll(DOMENA)) {
        const dom = m[1].toLowerCase()
        dolozene.add(dom.startsWith('www.') ? dom.slice(4) : dom)
      }
    }
  }
  for (const [lbl, v] of proza(d)) {
    for (const m of v.matchAll(DOMENA)) {
      const dom = m[1].toLowerCase()
      if (dolozene.has(dom)) continue
      const tecka = dom.lastIndexOf('.')
      const label = dom.slice(0, tecka)
      const tld = dom.slice(tecka + 1)
      for (const ref of dolozene) {
        const rt = ref.lastIndexOf('.')
        const rlabel = ref.slice(0, rt)
        const rtld = ref.slice(rt + 1)
        if (rtld === tld && rlabel.slice(0, 4) === label.slice(0, 4) && rlabel !== label) {
          n.push(`${cesta} | ${lbl} | <<${m[1]}>> ~ dolozena <<${ref}>> => nejspis sklonovana domena`)
          break
        }
      }
    }
  }
  return n
}

// ── kontrola D: superlativ bez připsání ─────────────────────────────────────

const SUPERLATIV = new RegExp(`${WB0}nej[a-záčďéěíňóřšťúůýž]{3,}`, 'iu')
/**
 * `dle` a `nese` musí stát jako SLOVO — holý vzor se trefil i dovnitř slov
 * („Špin**dle**rův", „ve**dle**", „při**nese**") a věta pak prošla jako
 * připsaná, i když připsání neměla. Chytila to fixtura (01-kontrola-a.yaml:
 * „nad obcí Špindlerův Mlýn a je v provozu" mělo spustit větev `stav`, ale
 * nespouštělo). Na dnešním korpusu je rozdíl nulový — utažení tedy nic
 * neodkrylo, jen zavírá díru do budoucna.
 */
const PRIPSANI = new RegExp(
  `podle|${WB0}dle|uvádí|uvádějí|provozovatel|tvrd|označuj|hlásí|titulek|` +
    `katalog|pramen|prý|má být|se odvolává|píše|popisuje|${WB0}nese|zdroj`,
  'iu',
)
/**
 * Superlativy, které nejsou tvrzením o rekordu (řadu z nich vynesl první běh
 * 25. 7. 2026 jako falešný poplach — nejsou to rekordy, ale běžné tvary).
 */
const NENI_REKORD = new RegExp(
  'nejspíš|nejen|nejasn|nejde|nejbliž|nejdřív|nejprve|nejméně|nejsou|' +
    'nejlép|nejist|nejpozděj|nejčastěj|nejpodstatn|nejdůležit',
  'iu',
)
/** Superlativ o vnitřním uspořádání budovy, ne o rekordu mezi chatami. */
const VNITRNI = new RegExp('nejvyšším patře|nejnižším patře|nejvyšší patro', 'iu')

function kontrolaD(cesta: string, d: Record<string, unknown>): string[] {
  const n: string[] = []
  for (const [lbl, v] of proza(d)) {
    const vety = v.split(VETA)
    vety.forEach((veta, i) => {
      const m = SUPERLATIV.exec(veta)
      if (!m || NENI_REKORD.test(m[0])) return
      if (VNITRNI.test(veta)) return
      // připsání nemusí stát v téže větě — petrova-bouda ho má až ve větě
      // následující („Celou tuhle časovou osu přebíráme ze sekundárního
      // média"), a to je legitimní připsání
      if (!PRIPSANI.test(oknoVet(vety, i))) {
        // `trim()` NENÍ kosmetika: pythonovské `str.split()` bez argumentu
        // zahazuje prázdné okraje, kdežto `split(/\s+/)` v JS je nechává,
        // takže by úryvek začínal mezerou navíc (chytila to fixtura).
        const uryvek = veta.trim().split(/\s+/u).join(' ').slice(0, 110)
        n.push(`${cesta} | ${lbl} | superlativ <<${m[0]}>> bez pripsani: ...${uryvek}...`)
      }
    })
  }
  return n
}

// ── kontrola E: letopočet v próze bez opory jinde v souboru ─────────────────

const ROK = new RegExp(`${WB0}(1[5-9]\\d{2}|20[0-2]\\d)${WB1}`, 'gu')

function kontrolaE(cesta: string, d: Record<string, unknown>, raw: string): string[] {
  const n: string[] = []
  const zbytek = zbytekSouboru(raw, d)
  const videno = new Set<string>()
  for (const [lbl, v] of proza(d)) {
    for (const m of v.matchAll(ROK)) {
      const rok = m[1]
      if (!zbytek.includes(rok) && !videno.has(rok)) {
        videno.add(rok)
        n.push(`${cesta} | ${lbl} | rok ${rok} se v datech profilu (mimo prozu) nevyskytuje`)
      }
    }
  }
  return n
}

// ── běh ─────────────────────────────────────────────────────────────────────

const cesty = process.argv.slice(2).length ? process.argv.slice(2) : najdiYaml('data/chaty')

const soubory: Array<[string, Record<string, unknown>, string]> = []
const obce = new Set<string>()
for (const c of cesty) {
  const raw = readFileSync(c, 'utf8')
  let d: Record<string, unknown>
  try {
    d = nactiYaml(c)
  } catch (e) {
    console.log(`CHYBA YAML ${c}: ${e}`)
    continue
  }
  soubory.push([c, d, raw])
  if (d.obec) obce.add(String(d.obec))
}

const A: string[] = []
const B: string[] = []
const C: string[] = []
const D: string[] = []
const E: string[] = []
for (const [c, d, raw] of soubory) {
  const jm = basename(c)
  A.push(...kontrolaA(jm, d, obce))
  B.push(...kontrolaB(jm, d))
  C.push(...kontrolaC(jm, d))
  D.push(...kontrolaD(jm, d))
  E.push(...kontrolaE(jm, d, raw))
}

vypis(A, 'A: proza tvrdi hodnotu zamerne prazdneho pole')
vypis(B, 'B: overeni zada odklad publikace, profil je publikovany')
vypis(C, 'C: pravdepodobne sklonovana domena')
vypis(D, 'D: superlativ bez pripsani')
vypis(E, 'E: letopocet v proze bez opory jinde v souboru')

const celkem = A.length + B.length + C.length + D.length + E.length
console.log(
  `\nsouboru: ${soubory.length} | zasahu k posouzeni: ${celkem} ` +
    `(A ${A.length} · B ${B.length} · C ${C.length} · D ${D.length} · E ${E.length})`,
)
