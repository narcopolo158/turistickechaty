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
 *   F  próza mluví o turistické známce nebo vizitce, ale `zdroje` katalog
 *      vydavatele vůbec nevedou — tak se chytila systémová vada z 25. 7. 2026
 *      (pět z osmi auditovaných profilů neslo v perexu „Nese turistickou
 *      známku č. X." a číslo přitom stálo jen na interní poznámce)
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
import { DOMENA, najdiYaml, nactiYaml, proza, seznamMap, VETA, W, WB0, WB1 } from './lib'

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

/**
 * Jmenuje próza obec? Původní podoba brala prvních PĚT ZNAKŮ jména obce
 * a hledala je v próze jako holý podřetězec — dvojí díra, kterou odhalilo
 * povýšení Kurzovy věže 7. 8. 2026: jakmile se do korpusu dostala obec
 * „Česká Kubice", základ „česká" se trefil doprostřed slova „severočeská"
 * a kontrola obvinila Raisovu chatu na Zvičině, že jmenuje obec o dvě stě
 * kilometrů dál. Falešné obvinění publikovaného profilu je horší než
 * propuštěný nález, proto se hledá takto:
 *   - jen slova jména delší než dva znaky (předložky „nad", „pod", „u"
 *     by trefily cokoli),
 *   - dlouhé slovo musí v próze stát jako PRVNÍCH PĚT ZNAKŮ SLOVA (kvůli
 *     skloňování: „Špindlerova Mlýna" k obci „Špindlerův Mlýn"), krátké
 *     slovo se musí shodovat CELÉ (aby bavorská obec „Lam" nesebrala
 *     „Lamberk" — a aby se přitom vůbec dala najít; kdyby se krátká slova
 *     zahazovala, jednoslovné jméno jako Lam by nešlo chytit nikdy),
 *   - a musí sedět VŠECHNA — víceslovné jméno se tak nedá potvrdit jedním
 *     obecným slovem („Česká Kubice" chce vedle „česká" i „kubic").
 */
function jmenujeObec(proza: string, obec: string): boolean {
  const slova = obec.split(/[^\p{L}\p{N}]+/u).filter((s) => s.length > 2)
  if (!slova.length) return false
  return slova.every((slovo) => {
    const zaklad = slovo.slice(0, 5).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const konec = slovo.length <= 4 ? WB1 : ''
    return new RegExp(`${WB0}${zaklad}${konec}`, 'iu').test(proza)
  })
}

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
      if (jmenujeObec(cely, obec) && !priznano) {
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
 *
 * DRUHÉ UTAŽENÍ 7. 8. 2026: samotné `nese` jako slovo je pořád příliš
 * hrubé — „nést" je běžné sloveso a věta „hora, jejíž jméno NESE celý
 * hřbet" umlčela superlativ ve větě sousední. Tak se v profilu Horského
 * hotelu Ještěd přes kontrolu D propašovalo redakční tvrzení
 * „nejslavnější česká horská stavba dvacátého století", které nedokládá
 * žádný z pramenů profilu (ty mají Perretovu cenu 1969 a Stavbu století
 * 2000 — a to je něco jiného). Nově musí u `nese` stát buď pramen jako
 * podmět („katalog nese", „OpenStreetMap nese"), nebo předmět typický
 * pro citaci údaje („nese jméno / číslo / rok / údaj"). Měřeno na
 * korpusu: +1 zásah, a je pravý; žádný falešný nepřibyl.
 */
const NESE_JAKO_PRIPSANI =
  `(?:pramen|prameny|portál|katalog|web|profil|mapa|OpenStreetMap|OSM)` +
  `[^.]{0,24}${WB0}nese|${WB0}nese (?:jméno|název|číslo|rok|údaj|výšku|hodnotu)`
const PRIPSANI = new RegExp(
  `podle|${WB0}dle|uvádí|uvádějí|provozovatel|tvrd|označuj|hlásí|titulek|` +
    `katalog|pramen|prý|má být|se odvolává|píše|popisuje|${NESE_JAKO_PRIPSANI}|zdroj`,
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

// ── kontrola F: sběratelské tvrzení v próze bez záznamu v `zdroje` ──────────

/**
 * Zmínka o turistické známce nebo vizitce ve veřejné próze. Hranice `WB0`
 * není kosmetika: bez ní by vzor `známk` zabíral i uvnitř slova „poznámka",
 * které v próze stojí běžně a se sběratelstvím nemá nic společného.
 */
const SBERATELSKE = new RegExp(`${WB0}(známk|vizitk)${W}*`, 'iu')
/**
 * Záznam v `zdroje`, který katalog sběratelských předmětů skutečně dokládá.
 * Doména vydavatele i slovní popis — katalogový záznam se cituje obojím.
 * Slovní část má hranici `WB0` ze stejného důvodu jako `SBERATELSKE`: bez ní
 * by kontrolu umlčel jakýkoli `popis` se slovem „poznámka".
 */
const KATALOG = new RegExp(
  'turisticke-znamky\\.cz|znaczki-turystyczne\\.pl|wanderbook|wander book|' +
    `${WB0}(?:známk|vizitk|znaczk)`,
  'iu',
)

function kontrolaF(cesta: string, d: Record<string, unknown>): string[] {
  const n: string[] = []
  const dolozeno = seznamMap(d.zdroje).some((z) =>
    KATALOG.test(`${String(z.popis ?? '')} ${String(z.url ?? '')}`),
  )
  if (dolozeno) return n
  for (const [lbl, v] of proza(d)) {
    const m = SBERATELSKE.exec(v)
    if (!m) continue
    const uryvek = vetaKolem(v, m[0]).trim().split(/\s+/u).join(' ').slice(0, 110)
    n.push(`${cesta} | ${lbl} | sberatelske tvrzeni <<${m[0]}>> bez zaznamu v zdroje: ...${uryvek}...`)
    break // stačí jeden zásah na soubor — vada je celoprofilová
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
const F: string[] = []
for (const [c, d, raw] of soubory) {
  const jm = basename(c)
  A.push(...kontrolaA(jm, d, obce))
  B.push(...kontrolaB(jm, d))
  C.push(...kontrolaC(jm, d))
  D.push(...kontrolaD(jm, d))
  E.push(...kontrolaE(jm, d, raw))
  F.push(...kontrolaF(jm, d))
}

vypis(A, 'A: proza tvrdi hodnotu zamerne prazdneho pole')
vypis(B, 'B: overeni zada odklad publikace, profil je publikovany')
vypis(C, 'C: pravdepodobne sklonovana domena')
vypis(D, 'D: superlativ bez pripsani')
vypis(E, 'E: letopocet v proze bez opory jinde v souboru')
vypis(F, 'F: sberatelske tvrzeni v proze bez zaznamu v zdroje')

const celkem = A.length + B.length + C.length + D.length + E.length + F.length
console.log(
  `\nsouboru: ${soubory.length} | zasahu k posouzeni: ${celkem} ` +
    `(A ${A.length} · B ${B.length} · C ${C.length} · D ${D.length} · E ${E.length} · F ${F.length})`,
)
