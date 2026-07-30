/**
 * DATA-31: dohledávka souřadnic pro publikované profily, které GPS nemají.
 *
 * PROČ: 28. 7. 2026 Michal nahlásil, že Chata Pod Studničnou a Erlebachova
 * bouda nemají na profilu mapu. Příčina není v šabloně — obě chaty nemají
 * v datech `lat`/`lng`. Měření ukázalo, že takových profilů je **dvanáct**:
 * vznikly z externího katalogu a z webů chat, a žádný z těch pramenů polohu
 * neuvádí (kandidátní YAML to říká výslovně: „katalog ji nenese"). Chybějící
 * souřadnice pak nesrazí jen mapu: chata vypadne z výpočtu přístupových tras
 * (DATA-06 pokryla 63 ze 76 profilů), z 3D modelu i z mapového pásu.
 *
 * PROČ TO NENAJDE DATA-01: hlavní export bere `tourism=alpine_hut`,
 * `wilderness_hut` a `hut`. Tyhle objekty jsou v OSM zpravidla vedené jinak
 * (hotel, chalet, guest_house, jen budova), takže je dotaz vůbec nepotká —
 * ověřeno v surových exportech, ani jeden z dvanácti v nich není.
 *
 * CO SKRIPT DĚLÁ: pro zvolenou oblast najde profily bez GPS, zeptá se
 * Overpassu na objekty JMÉNEM (bez ohledu na tag) a na objekty s TÝMŽ WEBEM,
 * jaký nese profil, a sestaví REPORT s nálezy — u každého tagy, obec z OSM
 * proti obci z profilu a síla důkazu (web > přesné jméno > jádro jména).
 * Web přibyl 28. 7. 2026 po Michalově poznámce „rezek je i zastávka
 * autobusu": obecné jméno netřídí, kdežto odkaz na týž web ano. **Nic nezapisuje do profilů.** Precedens je čerstvý: 27. 7.
 * 2026 se ukázalo, že Lovecká chata seděla na mapě 10 km vedle kvůli záměně
 * OSM entit; jméno samo tedy identitu neprokazuje a poslední slovo má redakce.
 * Návrhy se ukládají do `data/kandidati/<oblast>/_gps-navrhy.yaml`, odkud je
 * po potvrzení přenese do profilů druhý krok (se `source` + ODbL, verified:false).
 *
 * Spuštění (sandbox na Overpass nedosáhne — ostrý běh dělá GitHub Actions):
 *   npx tsx scripts/data31-gps-dohledavka.ts --oblast krkonose
 *   npx tsx scripts/data31-gps-dohledavka.ts --z-jsonu    # jen přepočet z uloženého exportu
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse, stringify } from 'yaml'

import {
  ATRIBUCE,
  VYCHOZI_API_INSTANCE,
  nactiExport,
  osmUrl,
  souradnice,
  stahniOverpass,
  type OsmElement,
} from './data01-overpass-krkonose'
import { bboxStr, oblastZArgv, zemeDotazu } from './oblasti'

export type ProfilBezGps = { slug: string; nazev: string; obec: string | null; webDomena: string | null }

/**
 * Doména z `kontakty.web` profilu — pro dohledávku je to nejsilnější stopa,
 * jakou máme: jméno v OSM se liší nebo je obecné („Rezek" je taky autobusová
 * zastávka, jak upozornil Michal 28. 7. 2026), kdežto `website` na objektu
 * ukazuje na týž web jako profil, a to shoda náhodou nebývá.
 */
export const domenaZUrl = (url: unknown): string | null => {
  if (typeof url !== 'string') return null
  const m = url.match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/iu)
  return m ? m[1].toLowerCase() : null
}

/**
 * Porovnávací tvar jména: bez diakritiky, bez uvozovek, malá písmena, jedna
 * mezera. Uvozovky musí pryč, jinak jádro názvu „Schronisko PTTK „Nad
 * Łomniczką"" nese uvozovky s sebou a shodu s prostým „Nad Łomniczką" z OSM
 * mine — přesně to se stalo 28. 7. 2026: objekt v odpovědi BYL (way/405165026,
 * building + operator=PTTK + ele=1002), ale párování ho zahodilo.
 */
export const normJmeno = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .replace(/[„“”"«»]/gu, '')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim()

/** Typová slova, po jejichž odebrání zbude jádro názvu (jako u kolize-jmen). */
const TYPOVA = /\b(chata|bouda|hotel|horska|horsky|schronisko|turystyczne|pttk)\b/giu

/** Jádro názvu pro volnější shodu („Chata Pod Studničnou" → „pod studnicnou"). */
export const jadroJmena = (s: string): string => normJmeno(s).replace(TYPOVA, ' ').replace(/\s+/gu, ' ').trim()

/**
 * Jádro pro DOTAZ — s diakritikou. `jadroJmena` diakritiku shazuje, protože
 * porovnává; kdyby ale takový tvar šel do Overpassu, hledal by „nad łomniczka"
 * a jméno „nad Łomniczką" by minul. Přesně to se stalo 28. 7. 2026 při prvním
 * běhu: polské schronisko jako jediné ze dvanácti nemělo nález.
 */
export const jadroProDotaz = (s: string): string =>
  s.replace(TYPOVA, ' ').replace(/[„"]/gu, ' ').replace(/\s+/gu, ' ').trim()

/** Publikované profily zvolené oblasti, které nemají `lat`/`lng`. */
export const profilyBezGps = (adresar: string): ProfilBezGps[] => {
  if (!existsSync(adresar)) return []
  const out: ProfilBezGps[] = []
  for (const f of readdirSync(adresar).sort()) {
    if (!f.endsWith('.yaml') || f.startsWith('_')) continue
    const d = (parse(readFileSync(join(adresar, f), 'utf8')) ?? {}) as Record<string, unknown>
    if (typeof d.lat === 'number' && typeof d.lng === 'number') continue
    if (typeof d.nazev !== 'string') continue
    const kontakty = (d.kontakty ?? {}) as Record<string, unknown>
    out.push({
      slug: typeof d.slug === 'string' ? d.slug : f.replace(/\.yaml$/u, ''),
      nazev: d.nazev,
      obec: typeof d.obec === 'string' ? d.obec : null,
      webDomena: domenaZUrl(kontakty.web),
    })
  }
  return out
}

/** Escape do řetězcového literálu Overpass regexu (uvozovky a metaznaky). */
const escRegex = (s: string): string => s.replace(/[\\^$.*+?()[\]{}|"]/gu, (z) => `\\${z}`)

/**
 * Dotaz hledá JMÉNEM, ne tagem — to je celý smysl dohledávky. Kromě celých
 * názvů se ptá i na jádra („Pod Studničnou"), protože OSM jméno bývá bez
 * typového slova; volnější shodu pak report označí a rozhodne o ní redakce.
 */
export const overpassDotazJmena = (iso: string, jmena: string[], okno: string, domeny: string[] = []): string => {
  const alternativy = [...new Set(jmena.map((j) => j.trim()).filter(Boolean).map(escRegex))].join('|')
  const web = [...new Set(domeny.map((d) => d.trim().toLowerCase()).filter(Boolean).map(escRegex))].join('|')
  // Druhá a třetí větev hledá podle WEBU profilu — objekt se může jmenovat
  // jinak (nebo obecně), ale odkaz na týž web je stopa, která nelže.
  const vetve = [
    `  nwr["name"~"${alternativy}",i](area.stat)(${okno});`,
    ...(web
      ? [`  nwr["website"~"${web}",i](area.stat)(${okno});`, `  nwr["contact:website"~"${web}",i](area.stat)(${okno});`]
      : []),
  ]
  return `[out:json][timeout:180];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
${vetve.join('\n')}
);
out center;`
}

export type Nalez = {
  osm: string
  nazev: string
  typShody: 'web' | 'presna' | 'castecna'
  lat: number
  lng: number
  obecOsm: string | null
  tagy: string
}
export type NavrhGps = { slug: string; nazev: string; obecProfilu: string | null; nalezy: Nalez[] }

const ZAJIMAVE_TAGY = ['tourism', 'building', 'amenity', 'ele', 'addr:city', 'operator', 'website']

/** Ke každému profilu bez GPS přiřadí nálezy z odpovědi (přesné i částečné). */
export const sparujNalezy = (profily: ProfilBezGps[], elementy: OsmElement[]): NavrhGps[] =>
  profily.map((p) => {
    const cil = normJmeno(p.nazev)
    const jadro = jadroJmena(p.nazev)
    const nalezy: Nalez[] = []
    for (const el of elementy) {
      const gps = souradnice(el)
      if (!gps) continue
      const jmeno = el.tags?.name
      // Web nad jméno: objekt bez jména nebo s obecným jménem („Rezek" je
      // i autobusová zastávka) se pozná podle odkazu na týž web jako profil.
      const webObjektu = `${el.tags?.website ?? ''} ${el.tags?.['contact:website'] ?? ''}`.toLowerCase()
      const shodaWebu = !!p.webDomena && webObjektu.includes(p.webDomena)
      if (!jmeno && !shodaWebu) continue
      const n = jmeno ? normJmeno(jmeno) : ''
      const presna = !!jmeno && n === cil
      // Jádro musí mít aspoň tři znaky, jinak by „U Kotle" chytalo půl pohoří.
      const castecna = !!jmeno && !presna && jadro.length >= 3 && (n.includes(jadro) || jadroJmena(jmeno) === jadro)
      if (!shodaWebu && !presna && !castecna) continue
      nalezy.push({
        osm: osmUrl(el),
        nazev: jmeno ?? '(bez jména)',
        typShody: shodaWebu ? 'web' : presna ? 'presna' : 'castecna',
        lat: gps.lat,
        lng: gps.lng,
        obecOsm: el.tags?.['addr:city'] ?? null,
        tagy: ZAJIMAVE_TAGY.filter((t) => el.tags?.[t]).map((t) => `${t}=${el.tags![t]}`).join(', '),
      })
    }
    // Pořadí síly důkazu: web > přesné jméno > jádro jména.
    const sila = { web: 0, presna: 1, castecna: 2 } as const
    nalezy.sort((a, b) => sila[a.typShody] - sila[b.typShody] || a.nazev.localeCompare(b.nazev, 'cs'))
    return { slug: p.slug, nazev: p.nazev, obecProfilu: p.obec, nalezy }
  })

/** Report do Actions summary i do docs — čte ho člověk, ne stroj. */
export const sestavReport = (navrhy: NavrhGps[], oblastNazev: string): string => {
  const s: string[] = []
  const s1 = navrhy.filter((n) => n.nalezy.length)
  const bez = navrhy.filter((n) => !n.nalezy.length)
  s.push(`# DATA-31 — dohledávka souřadnic (${oblastNazev})`)
  s.push('')
  s.push(`Profilů bez GPS: **${navrhy.length}** · s nálezem v OSM: **${s1.length}** · bez nálezu: **${bez.length}**`)
  s.push('')
  s.push('Síla důkazu klesá shora dolů: SHODA WEBU (objekt odkazuje na týž web')
  s.push('jako profil) → přesná shoda jména → částečná shoda jádra názvu.')
  s.push('')
  s.push('Nálezy jsou NÁVRHY, ne fakta: shoda jména identitu neprokazuje (27. 7. 2026')
  s.push('seděla Lovecká chata na mapě 10 km vedle kvůli záměně OSM entit). Než se')
  s.push('souřadnice zapíšou do profilu, potvrdí je redakce — pomůckou je obec:')
  s.push('když se `addr:city` z OSM rozchází s `obec` v profilu, je to jiný objekt.')
  s.push('')
  for (const n of s1) {
    s.push(`## ${n.nazev}${n.obecProfilu ? ` — obec v profilu: ${n.obecProfilu}` : ''}`)
    for (const x of n.nalezy) {
      const obec = x.obecOsm ? `obec OSM: ${x.obecOsm}` : 'obec v OSM chybí'
      const varovani = x.obecOsm && n.obecProfilu && normJmeno(x.obecOsm) !== normJmeno(n.obecProfilu) ? ' ⚠ obec nesedí' : ''
      const stitek = { web: 'SHODA WEBU', presna: 'přesná shoda jména', castecna: 'částečná shoda jména' }[x.typShody]
      s.push(`- **${stitek}** „${x.nazev}" — ${x.lat}, ${x.lng} · ${obec}${varovani}`)
      s.push(`  - ${x.tagy || 'bez zajímavých tagů'} — ${x.osm}`)
    }
    s.push('')
  }
  if (bez.length) {
    s.push('## Bez nálezu v OSM')
    s.push('')
    for (const n of bez) s.push(`- ${n.nazev}${n.obecProfilu ? ` (${n.obecProfilu})` : ''} — jméno v okně oblasti nikde`)
    s.push('')
  }
  s.push(`Zdroj nálezů: OpenStreetMap — ${ATRIBUCE}`)
  s.push('')
  return s.join('\n')
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const argv = process.argv.slice(2)
  const zJsonu = argv.includes('--z-jsonu')
  const apiIndex = argv.indexOf('--api')
  const instance = apiIndex >= 0 && argv[apiIndex + 1] ? [argv[apiIndex + 1]] : VYCHOZI_API_INSTANCE
  const oblast = oblastZArgv(argv)
  const okno = bboxStr(oblast.bbox)
  const kandAdr = join(process.cwd(), 'data', 'kandidati', oblast.slug)

  const profily = profilyBezGps(join(process.cwd(), 'data', 'chaty', oblast.slug))
  console.log(`Oblast: ${oblast.nazev} (${oblast.slug}) — profilů bez GPS: ${profily.length}`)
  if (!profily.length) {
    console.log('Není co dohledávat — všechny publikované profily oblasti mají souřadnice.')
    return
  }
  for (const p of profily) console.log(`  - ${p.nazev}${p.obec ? ` (${p.obec})` : ''}`)

  const jmena = [...profily.map((p) => p.nazev), ...profily.map((p) => jadroProDotaz(p.nazev)).filter((j) => j.length >= 3)]
  const domeny = profily.map((p) => p.webDomena).filter((d): d is string => !!d)
  const elementy: OsmElement[] = []
  // Země bere konfigurace oblasti (stejně jako DATA-01) — u oblasti celé
  // v Česku by polský dotaz byl jen prázdný soubor a minuta navíc.
  for (const { zeme, iso } of zemeDotazu(oblast)) {
    const soubor = join(kandAdr, `_overpass-gps-${zeme}.json`)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: ${soubor} neexistuje — ${zeme} se přeskakuje.`)
        continue
      }
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} — hledám ${jmena.length} jmen a ${domeny.length} webů v okně ${okno}…`)
      // Prázdná odpověď je tu legitimní výsledek: v Polsku nemusí být ani jedno
      // z hledaných jmen, a pád běhu by z toho udělal chybu, kterou to není.
      const vysledek = await stahniOverpass(instance, overpassDotazJmena(iso, jmena, okno, domeny), { povolitPrazdno: true })
      raw = vysledek.raw
      mkdirSync(kandAdr, { recursive: true })
      writeFileSync(soubor, raw, 'utf8')
      console.log(`Surový export uložen: ${soubor} (doklad nálezu).`)
    }
    elementy.push(...nactiExport(raw).elementy)
  }

  const navrhy = sparujNalezy(profily, elementy)
  const report = sestavReport(navrhy, oblast.nazev)
  const reportCesta = join(process.cwd(), 'docs', `DATA-31-gps-${oblast.slug}.md`)
  writeFileSync(reportCesta, report, 'utf8')
  mkdirSync(kandAdr, { recursive: true })
  writeFileSync(
    join(kandAdr, '_gps-navrhy.yaml'),
    [
      '# NÁVRHY souřadnic pro publikované profily bez GPS (DATA-31).',
      '# Nezapisuje se automaticky do profilů: shoda jména identitu NEPROKAZUJE',
      '# (Lovecká chata seděla 27. 7. 2026 na mapě 10 km vedle kvůli záměně entit).',
      `# Zdroj: OpenStreetMap — ${ATRIBUCE}`,
      '',
      stringify({ navrhy }),
    ].join('\n'),
    'utf8',
  )
  console.log(`\nReport: ${reportCesta}\n`)
  console.log(report)
}

if (process.argv[1]?.endsWith('data31-gps-dohledavka.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
