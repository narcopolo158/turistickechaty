/**
 * DATA-06: parser katalogu doporučených výchozích bodů (ChatGPT podklad,
 * `data/externi/vychozi-body-cr-sk-2026/vychozi-body.csv`) + geokódování přes
 * OSM. Katalog dává 1–3 doporučené nástupy na chatu s pořadím, typem, dopravou,
 * zdroji a poznámkou — ale BEZ GPS. Tady se parsují a každý bod se geokóduje
 * proti OSM katalogu výchozích bodů (cross-check, ať sedí na místo).
 *
 * Poctivost: `verified: false`; GPS z OSM (ne z AI); co se nezgeokóduje, se
 * zahodí (radši méně bodů než bod o kus vedle). Zdroje/poznámka jdou na profil
 * jako vodítko.
 */
import { readFileSync } from 'node:fs'

import { normalizuj } from './data05-razitkuj-parovani'

/** Robustní CSV parser (uvozovky, zalomení a čárky uvnitř polí). BOM se odstraní. */
export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let pole = ''
  let vUvozovkach = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (vUvozovkach) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          pole += '"'
          i++
        } else vUvozovkach = false
      } else pole += c
    } else if (c === '"') vUvozovkach = true
    else if (c === ',') {
      row.push(pole)
      pole = ''
    } else if (c === '\n') {
      row.push(pole)
      rows.push(row)
      row = []
      pole = ''
    } else if (c !== '\r') pole += c
  }
  if (pole.length || row.length) {
    row.push(pole)
    rows.push(row)
  }
  return rows
}

export type OsmBod = { nazev: string; typ: string; lat: number; lng: number }

/** Tokeny názvu (normalizované, neprázdné) — pro shodu po celých slovech. */
const tokeny = (s: string): string[] => normalizuj(s).split(' ').filter(Boolean)

/**
 * České generické popisy z katalogu → německé ekvivalenty v OSM názvech.
 * Katalog píše česky („horní stanice lanovky"), OSM v Bavorsku německy
 * („Gipfelstation Großer Arber") — bez překladu se shoda po celých slovech
 * nikdy netrefí. Nález 5. 8. 2026 (Arberschutzhaus): „Großer Arber, horní
 * stanice lanovky" sedlo na generický bod „Horní stanice lanovky" na
 * Hochfichtu 60 km daleko (zahodil ho až MAX_VZDUSNE_KM) a nejlepší nástup
 * od Gipfelstation 300 m od chaty v profilu chyběl. Překlad je doložená
 * obecná znalost, ne domýšlení — mapuje se jen popis DRUHU místa.
 */
const NEMECKE_EKVIVALENTY: [fraze: string, synonyma: string[]][] = [
  ['horni stanice', ['gipfelstation', 'bergstation']],
  ['dolni stanice', ['talstation']],
  ['zeleznicni stanice', ['bahnhof']],
  // Tvarové dvojice (pád): OSM „Lanovka Špičák" musí sednout na katalogové
  // „…dolní stanice lanovky Pancíř" — nález 5. 8. 2026 (Pancíř): bez toho
  // vyhrál bod „Pancíř" (horní stanice) a trasa od dolní stanice se
  // tvářila, že startuje nahoře.
  ['lanovky', ['lanovka']],
  ['lanovka', ['lanovky']],
  ['gondoly', ['gondola']],
]

/**
 * Generické popisy druhu místa (vč. překladů) — shoda POUZE na nich není
 * identifikace místa: bod se musí trefit aspoň jedním vlastním jménem.
 */
const GENERICKE_TOKENY = new Set([
  'horni', 'dolni', 'stanice', 'lanovky', 'lanovka', 'gondoly', 'gondola',
  'zeleznicni', 'nadrazi', 'zastavka', 'parkoviste', 'rozcesti', 'centrum',
  'bahnhof', 'talstation', 'gipfelstation', 'bergstation', 'haltestelle',
])

/** Tokeny dotazu rozšířené o německé ekvivalenty českých generických popisů. */
const tokenyDotazu = (s: string): Set<string> => {
  const n = normalizuj(s)
  const t = new Set(tokeny(s))
  for (const [fraze, synonyma] of NEMECKE_EKVIVALENTY) {
    if (n.includes(fraze)) for (const syn of synonyma) t.add(syn)
  }
  return t
}

/**
 * Geokóduje textový výchozí bod přes OSM: hledá OSM místo, jehož název je v
 * popisu bodu obsažen PO CELÝCH SLOVECH (např. „Szklarská Poręba, Ski Arena" →
 * Szklarska Poręba). Shoda po celých tokenech (ne podřetězci) schválně — jinak
 * by „…stanice lanovky" chybně sedlo na obec „Lánov" (lanov ⊂ lanovky). Krátké
 * tokeny OSM názvu (< 3 znaky, např. „I"/„II" u lanovek) se pro shodu ignorují.
 * Preferuje konkrétní bod (lanovka/železnice/zastávka) před obcí a delší
 * (specifičtější) název; fallback na „nejbližší obec/uzel". null = nezgeokódováno.
 */
/**
 * Výsledek geokódování: kromě bodu i to, ČÍM se trefil. Rozdíl není kosmetický
 * — když se konkrétní výchozí bod („Stóg Izerski, horní stanice gondoly")
 * v OSM nenajde a zabere až fallback na obec, leží nalezený bod někde jinde
 * než ten pojmenovaný. Trasa se pak nesmí tvářit, že vede odtud.
 */
export type Geokod = { bod: OsmBod; podle: 'bod' | 'uzel' }

export const geokodujBod = (bod: string, uzel: string, osm: OsmBod[]): Geokod | null => {
  const kandidati = (q: string, preferujObec: boolean): OsmBod[] => {
    const qt = tokenyDotazu(q)
    if (!qt.size) return []
    const obsazene = osm.filter((b) => {
      const bt = tokeny(b.nazev)
      const vyznamne = bt.filter((t) => t.length >= 3)
      // Aspoň jeden významný token, všechny významné tokeny v popisu bodu
      // A aspoň jeden z nich NENÍ generický popis druhu místa. Nález
      // 5. 8. 2026 (Pancíř): bod pojmenovaný jen „Talstation" (u Arberu)
      // sedl na „…dolní stanice lanovky Pancíř" přes samotný překladový
      // token a trasa vedla 22 km k jiné hoře; generická „Horní stanice
      // lanovky" (Hochficht) obdobně kradla nástupy už dřív.
      return (
        vyznamne.length > 0 &&
        vyznamne.every((t) => qt.has(t)) &&
        vyznamne.some((t) => !GENERICKE_TOKENY.has(t))
      )
    })
    return [...obsazene].sort((a, b) => {
      const sa = a.typ === 'obec' ? 0 : 1
      const sb = b.typ === 'obec' ? 0 : 1
      // Dotaz na BOD hledá konkrétní místo (ne obec) — obec až poslední.
      // Fallback na UZEL hledá „nejbližší obec/uzel" — tam je obec naopak
      // ta poctivá odpověď: trasa pak startuje od středu obce, ne od
      // náhodné zastávky téhož jména. Nález 5. 8. 2026 (Arberschutzhaus):
      // uzel „Bayerisch Eisenstein" sedl na železniční stanici, jejíž uzel
      // v grafu tras vede k chatě 17,5km oklikou — od středu obce to po
      // značených je 8,5 km.
      if (sa !== sb) return preferujObec ? sa - sb : sb - sa
      return normalizuj(b.nazev).length - normalizuj(a.nazev).length // delší (specifičtější) název první
    })
  }
  let degradovana: Geokod | null = null
  for (const [q, podle] of [[bod, 'bod'], [uzel, 'uzel']] as const) {
    if (!q) continue
    const c = kandidati(q, podle === 'uzel')
    if (!c.length) continue
    // Shoda na dotaz BODU se smí hlásit jako trefa („trasa vede odtud") jen
    // když nalezený název nese aspoň jeden významný token NAD RÁMEC uzlu.
    // Nález 5. 8. 2026 (Stóg Izerski): „Świeradów-Zdrój, dolní stanice
    // gondoly" sedlo po celých slovech na holé „Świeradów-Zdrój" (nádraží)
    // a profil by tvrdil, že trasa startuje u dolní stanice gondoly, ačkoli
    // startuje na nádraží 1,4 km od ní. Taková shoda je ve skutečnosti jen
    // nález uzlu → přednost dostane řádný fallback na uzel (s preferencí
    // obce); degradovaná shoda se použije, jen když uzel nic nedá.
    if (podle === 'bod' && uzel) {
      const uzelTokeny = new Set(tokeny(uzel))
      const nadRamec = tokeny(c[0].nazev).some((t) => t.length >= 3 && !uzelTokeny.has(t))
      if (!nadRamec) {
        degradovana = { bod: c[0], podle: 'uzel' }
        continue
      }
    }
    return { bod: c[0], podle }
  }
  return degradovana
}

export type DoporucenyBod = {
  poradi: number
  /** Jméno bodu, který se v OSM OPRAVDU našel (z něj se parsuje obec střediska). */
  vychoziBod: string
  /**
   * Nástup, který katalog doporučuje, ale v OSM se nenašel — trasa proto
   * začíná jinde (u obce či uzlu). Nález 31. 7. 2026: „Stóg Izerski, horní
   * stanice gondoly" se geokódovalo na nádraží ve Świeradowě 3,2 km od chaty,
   * takže by profil tvrdil pětikilometrovou cestu od horní stanice — a ta
   * přitom stojí 100 m od schroniska.
   */
  nastupZKatalogu?: string
  typ: string
  doprava: string
  sezona: string
  poznamka: string
  zdroje: string[]
  lat: number
  lng: number
}

/**
 * Načte katalog a vrátí doporučené (geokódované) výchozí body podle
 * normalizovaného názvu chaty. Body bez geokódování se vynechají; seřazeno dle
 * pořadí (1 = hlavní).
 */
export const nactiDoporucene = (csvText: string, osm: OsmBod[]): Map<string, DoporucenyBod[]> => {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return new Map()
  const h = rows[0].map((x) => x.trim())
  const ix = (n: string) => h.indexOf(n)
  const iChata = ix('Chata')
  const iUzel = ix('Nejbližší obec / uzel')
  const iPoradi = ix('Pořadí')
  const iBod = ix('Výchozí bod')
  const iTyp = ix('Typ výchozího bodu')
  const iDoprava = ix('Doprava / návaznost')
  const iSezona = ix('Sezóna / omezení')
  const iZdroj = ix('Zdrojové URL')
  const iPozn = ix('Poznámka')

  const dle = new Map<string, DoporucenyBod[]>()
  for (const r of rows.slice(1)) {
    if (r.length < h.length - 1 || !r[iChata]) continue
    const g = geokodujBod(r[iBod] ?? '', r[iUzel] ?? '', osm)
    if (!g) continue
    // Když se konkrétní bod z katalogu v OSM nenašel a zabral až fallback na
    // obec, NESE trasa jméno toho, co se opravdu našlo. Nález 31. 7. 2026:
    // „Stóg Izerski, horní stanice gondoly" se geokódovalo na nádraží ve
    // Świeradowě-Zdroji 3,2 km od chaty — profil by pak tvrdil pětikilometrovou
    // cestu od horní stanice, ačkoli ta stojí 100 m od schroniska.
    // Jméno bodu zůstává ČISTÉ (parsuje se z něj obec střediska), nedoložený
    // nástup z katalogu jde do vlastního pole a UI ho ukáže jako poznámku.
    const trefa = g.podle === 'bod'
    const zaznam: DoporucenyBod = {
      poradi: Number(r[iPoradi]) || 99,
      vychoziBod: trefa ? (r[iBod] ?? '').trim() : g.bod.nazev,
      nastupZKatalogu: trefa ? undefined : (r[iBod] ?? '').trim(),
      typ: (r[iTyp] ?? '').trim(),
      doprava: (r[iDoprava] ?? '').trim(),
      sezona: (r[iSezona] ?? '').trim(),
      poznamka: (r[iPozn] ?? '').trim(),
      zdroje: (r[iZdroj] ?? '')
        .split(/[\s\n]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u)),
      lat: g.bod.lat,
      lng: g.bod.lng,
    }
    const klic = normalizuj(r[iChata])
    const seznam = dle.get(klic)
    if (seznam) seznam.push(zaznam)
    else dle.set(klic, [zaznam])
  }
  for (const seznam of dle.values()) seznam.sort((a, b) => a.poradi - b.poradi)
  return dle
}

/** Načte katalog ze souboru (pomocník pro CLI/routing). */
export const nactiDoporuceneZeSouboru = (cesta: string, osm: OsmBod[]): Map<string, DoporucenyBod[]> =>
  nactiDoporucene(readFileSync(cesta, 'utf8'), osm)
