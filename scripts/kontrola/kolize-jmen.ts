/**
 * Kolize názvů chat napříč celým korpusem (DATA-17).
 *
 * V Krkonoších stojí víc objektů se stejným jménem — dvě „Martinovy boudy"
 * (hřeben u Špindlerova Mlýna a Benecko) a dvě „Lesní boudy" (nad Pecí pod
 * Sněžkou a ve Špindlerově Mlýně). Kdyby se do korpusu dostaly obě půlky
 * dvojice, čtenář by je od sebe v nadpisu, perexu ani v URL nerozeznal.
 *
 * Tahle kontrola je PREVENCE, ne úklid. Když se psala (26. 7. 2026), hlásila
 * NULU — a to je její smysl: měření tehdy převrátilo vlastní zadání, protože
 * backlog předpokládal, že kolize v korpusu jsou, kdežto ve skutečnosti je ani
 * jeden ze jmenovců mezi profily ani mezi kandidáty vůbec nebyl. Kdo sem
 * jednoho dne přidá druhou půlku dvojice, dozví se to od kontroly, ne od
 * čtenáře.
 *
 * DVĚ PASTI, kvůli kterým kontrola vypadá složitěji, než by musela:
 *
 *   1. Týž objekt leží běžně ve DVOU patrech najednou — jednou jako
 *      publikovaný profil (`data/chaty/…`) a jednou jako kandidát
 *      (`data/kandidati/…`). Naivní seskupení podle jména proto na dnešním
 *      korpusu hlásí čtyřicet „kolizí", a všechny jsou tentýž objekt dvakrát.
 *      Totožnost objektu se tu proto počítá jako `oblast/slug`, ne jako cesta
 *      k souboru; dvě patra téhož objektu mají tutéž totožnost a nehlásí se.
 *
 *   2. Filtr „týž slug => týž objekt" by ale sám o sobě zakryl přesně ten
 *      případ, kvůli kterému kontrola vzniká: dva RŮZNÉ objekty téhož jména
 *      dostanou od slugifikace tentýž slug. Proto je v totožnosti i oblast —
 *      `krkonose/lesni-bouda` a `jizerske-hory/lesni-bouda` jsou dva objekty,
 *      i když se slug shoduje, a kontrola je nahlásí.
 *
 * Oddíl A jsou shodné názvy (to je vada vždy), oddíl B jen shodná jádra po
 * odmazání typových slov („bouda", „chata", „schronisko") — tam může jít
 * o dva objekty, které se legitimně jmenují jinak, a je to tedy k posouzení.
 *
 * NA ROZDÍL od `ban-scan` a `audit-mech` tahle kontrola ROZHODUJE: jejich
 * ustálený stav je nenulový (část zásahů jsou trvalé falešné poplachy), kdežto
 * tady je čistý stav přesně nula, takže jakýkoli zásah je regrese a vrací se
 * návratový kód 1.
 *
 *   npx tsx scripts/kontrola/kolize-jmen.ts [soubor.yaml …]
 */
import { existsSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { najdiYaml, nactiYaml, seznamMap } from './lib'

// POZOR: v tomhle souboru se nesmí objevit `\b` ani `\w` — viz komentář v lib.ts.
// Konstanty WB0/WB1 tu ale nejsou potřeba: `norm()` sráží název na holé ASCII
// oddělené jednou mezerou, takže hranicí slova JE mezera, a to přesně.

/**
 * Kombinující diakritika, kterou od písmene oddělí rozklad NFD. Zapsáno přes
 * `new RegExp` s escapy schválně — v literálu by to byly neviditelné znaky.
 */
const DIAKRITIKA = new RegExp('[\\u0300-\\u036f]', 'gu')

/** Písmena, která rozklad NFD nerozloží — polské „ł" stojí v Unicode samostatně. */
const NEROZLOZITELNA: Array<[RegExp, string]> = [[new RegExp('\\u0142', 'gu'), 'l']]

/** Název sražený na porovnatelný tvar: bez diakritiky, malá písmena, jedna mezera. */
function norm(s: string): string {
  let x = s.normalize('NFD').replace(DIAKRITIKA, '').toLowerCase()
  for (const [vzor, za] of NEROZLOZITELNA) x = x.replace(vzor, za)
  return x.replace(/[^a-z0-9]+/gu, ' ').trim()
}

/**
 * Slova, která říkají jen TYP objektu, ne jeho jméno. Odmazávají se, aby
 * „Martinova bouda" a „Martinova chata" spadly do jedné hromádky. Seznam se
 * schválně drží při zemi: čím víc se maže, tím spíš dva nepříbuzné názvy
 * splynou v prázdno.
 */
const TYPOVA = [
  'bouda',
  'boudy',
  'baude',
  'chata',
  'chatka',
  'chalupa',
  'horska',
  'horsky',
  'hotel',
  'penzion',
  'utulna',
  'schronisko',
  'bacowka',
  'dom',
  'pttk',
  // Typ `rozhledna` (28. 7. 2026) přivedl do korpusu jména, která typovým
  // slovem ZAČÍNAJÍ („rozhledna Slovanka", „Wieża Widokowa Mirsk"). Dokud tu
  // ta slova nebyla, kontrola jmenovce mezi rozhlednou a boudou téhož jména
  // neviděla — a jeden takový v korpusu opravdu stál: krkonošská Bouda
  // Slovanka × jizerskohorská rozhledna Slovanka, 40 km od sebe.
  // „widokowa" je přídavné jméno, ale ve dvojici s „wieza" nese týž význam.
  'rozhledna',
  'rozhledny',
  'wieza',
  'widokowa',
  'vyhlidka',
]
const TYPOVE_SLOVO = new RegExp(` (?:${TYPOVA.join('|')}) `, 'gu')

/** Jádro názvu — název bez typových slov. Název složený jen z nich zůstává celý. */
function jadro(nazev: string): string {
  const cely = norm(nazev)
  let x = ` ${cely} `
  let predtim = ''
  // opakovaně, protože `g` u sousedních slov přeskočí sdílenou mezeru
  while (x !== predtim) {
    predtim = x
    x = x.replace(TYPOVE_SLOVO, ' ')
  }
  return x.trim() || cely
}

/**
 * Totožnost objektu napříč patry: oblast + slug. Oblast je adresář, ve kterém
 * soubor leží — `data/chaty/krkonose/x.yaml` i `data/kandidati/krkonose/x.yaml`
 * dají shodně `krkonose/x`, kdežto `data/chaty/jizerske-hory/x.yaml` ne.
 */
function totoznost(cesta: string, d: Record<string, unknown>): string {
  const slug =
    typeof d.slug === 'string' && d.slug
      ? d.slug
      : basename(cesta).replace(/\.yaml$/u, '')
  return `${basename(dirname(cesta))}/${slug}`
}

type Zaznam = { cesta: string; nazev: string; obec: string; kdo: string }

const cesty = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [...najdiYaml('data/chaty'), ...najdiYaml('data/kandidati')]

// ── načtení ────────────────────────────────────────────────────────────────
// Soubory bez `nazev` se přeskakují: pod `data/kandidati/fotky/` leží metadata
// fotek, ne profily, a ta žádný název objektu nenesou.
const zaznamy: Zaznam[] = []
for (const cesta of cesty) {
  const d = nactiYaml(cesta)
  if (typeof d.nazev !== 'string' || !d.nazev.trim()) continue
  zaznamy.push({
    cesta,
    nazev: d.nazev.trim(),
    obec: typeof d.obec === 'string' && d.obec ? d.obec : '—',
    kdo: totoznost(cesta, d),
  })
}

// ── seskupení podle jádra názvu ────────────────────────────────────────────
const hromadky = new Map<string, Zaznam[]>()
for (const z of zaznamy) {
  const j = jadro(z.nazev)
  const h = hromadky.get(j)
  if (h) h.push(z)
  else hromadky.set(j, [z])
}

/**
 * Známí jmenovci (`data/_jmenovci.yaml`): kolize, které redakce VIDĚLA
 * a rozhodla o nich. Bez tohohle registru by kontrola musela zůstat červená
 * po celou dobu, kdy se čeká na `obec` z pramene — a to je přesně stav,
 * ve kterém verdikt přestane kdokoli číst (DATA-17, pravidlo R6: rozlišovač
 * se nevymýšlí, doplní se z pramene). Klíčem je MNOŽINA objektů, ne jádro
 * názvu: přibude-li k dvojici třetí jmenovec, kontrola se ozve znovu.
 */
const ZNAME_SOUBOR = 'data/_jmenovci.yaml'
const klicMnoziny = (kdo: string[]): string => [...kdo].sort().join(' + ')

const zname = new Map<string, string>()
{
  const d = existsSync(ZNAME_SOUBOR) ? nactiYaml(ZNAME_SOUBOR) : {}
  for (const z of seznamMap(d.jmenovci)) {
    const objekty = Array.isArray(z.objekty) ? z.objekty.filter((o): o is string => typeof o === 'string') : []
    if (objekty.length < 2) continue
    zname.set(klicMnoziny(objekty), typeof z.duvod === 'string' ? z.duvod.trim().replace(/\s+/gu, ' ') : 'bez udaneho duvodu')
  }
}

const A: string[] = []
const B: string[] = []
const Z: string[] = []
const objekty = new Set(zaznamy.map((z) => z.kdo))

for (const [j, skupina] of [...hromadky].sort(([a], [b]) => (a < b ? -1 : 1))) {
  // Kolize je až rozdíl OBJEKTŮ, ne souborů — dvě patra téhož objektu ne.
  const kdo = [...new Set(skupina.map((z) => z.kdo))].sort()
  if (kdo.length < 2) continue

  const radky = [` * jadro <<${j}>> — objektu: ${kdo.length}`]
  for (const k of kdo) {
    const patra = skupina.filter((z) => z.kdo === k)
    const soubory = patra
      .map((z) => z.cesta)
      .sort()
      .join(', ')
    radky.push(`     ${k} | <<${patra[0].nazev}>> | obec: ${patra[0].obec} | ${soubory}`)
  }
  const zaznam = radky.join('\n')

  // Rozhodnutá kolize se hlásí, ale neshazuje běh — verdikt platí pro nové.
  const duvod = zname.get(klicMnoziny(kdo))
  if (duvod !== undefined) {
    Z.push(`${zaznam}\n     ROZHODNUTO: ${duvod}`)
    continue
  }

  // Shodný i celý název => tvrdá kolize; jinak se objekty liší typovým slovem.
  const jmena = new Set(skupina.map((z) => norm(z.nazev)))
  if (jmena.size === 1) A.push(zaznam)
  else B.push(zaznam)
}

function vypis(nalezy: string[], nadpis: string) {
  console.log(`\n=== ${nadpis} — ${nalezy.length} ===`)
  for (const n of nalezy) console.log(n)
}

vypis(A, 'A: shodny cely nazev')
vypis(B, 'B: shodne jadro nazvu, cely nazev se lisi typovym slovem')
vypis(Z, `Z: znami jmenovci (${ZNAME_SOUBOR}) — rozhodnuti redakce, neshazuji beh`)

console.log()
console.log(
  `souboru: ${cesty.length} | profilu s nazvem: ${zaznamy.length} | ` +
    `objektu: ${objekty.size} | kolizi: ${A.length + B.length} ` +
    `(A ${A.length} · B ${B.length}) | znamych: ${Z.length}`,
)

process.exit(A.length + B.length ? 1 : 0)
