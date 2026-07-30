/**
 * DATA-22 — křížová kontrola oficiálního seznamu turistických známek u chat
 * proti našemu korpusu.
 *
 * Vstupy: (1) data/externi/znamky-vizitky-2026/turisticke-znamky-cr-vyber.csv
 * (převod z XLSX, který Michal stáhl přímo z webu vydavatele 26. 7. 2026 —
 * tedy PRIMÁRNÍ seznam vydavatele, ne AI kompilace jako znamky-vizitky.csv);
 * (2) data/externi/znamkova-mista-2026/ — výpis známkových míst od Michala
 * (30. 7. 2026), který nese navíc PRODEJNÍ MÍSTA a kategorie vydavatele.
 * Prodejní místo bývá i sám objekt, takže z něj padá obec i oficiální web.
 *
 * Co dělá: pro každou položku seznamu hledá shodu mezi publikovanými profily
 * (data/chaty) a kandidáty (data/kandidati) podle názvu a aliasů. Výstup je
 * SEZNAM K POSOUZENÍ, ne seznam vad — spousta položek jsou rozhledny, sedla
 * a chaty mimo Krkonoše, které do pilotu nepatří.
 *
 *   npx tsx scripts/data22-znamky-oficialni-seznam.ts [--vse]
 *
 * ---------------------------------------------------------------------------
 * ČTYŘI VĚCI, KTERÉ SE PŘI ČTENÍ VÝSTUPU DAJÍ SPLÉST (všechny ověřené 26. 7.
 * 2026; první tři jsem si sám nejdřív zapsal jako „chyba párování" a byly to
 * naopak správné výsledky):
 *
 * (1) SEZNAM JE FILTROVANÝ, TAKŽE NEPŘÍTOMNOST NIC NEDOKAZUJE. Michal jej
 *     stáhl s filtrem „horské chaty a boudy" a výslovně dodává, že ve filtru
 *     samotném může být chyba. Doklad je v našich datech: Pomezní bouda má
 *     doloženou známku č. 673, a v seznamu není. „Publikovaný profil bez
 *     známky v seznamu" tedy NENÍ tvrzení, že objekt známku nemá.
 *
 * (2) 19 „Osada Rezek" se záměrně NEPÁRUJE s krkonose/chata-rezek. Známka je
 *     vydána pro OSADU, ne pro chatu, a profil tu vazbu vědomě neuzavírá
 *     (viz jeho interniPoznamky). Dopsat sem alias by tiše tvrdilo přesně to,
 *     co profil odmítá tvrdit. Nechat nespárované.
 *
 * (3) 22 „Dvoračky - Štumpovka" se ze stejného důvodu nepáruje ani s jedním
 *     objektem: známka nese celý areál o dvou budovách, kdežto my podle
 *     rozhodnutí Michala z 21. 7. 2026 vedeme Dvoračky a Horský hotel
 *     Štumpovka jako dva samostatné objekty.
 *
 * (4) Polské schronisko v seznamu být nemůže — je to seznam český. Deset
 *     polských profilů v posledním výpisu je proto očekávaný stav, ne nález.
 *
 * (5) 1935 „Chata Hubertka, Jizerské hory" se s krkonose/chata-hubertka
 *     páruje NEPRÁVEM — jadro() odřízne krajový přívlastek „Jizerské hory",
 *     jenže ten tu není ozdoba, nýbrž rozlišovač jmenovců: známka patří
 *     objektu v Jizerských horách, kdežto náš kandidát je z OSM v Krkonoších
 *     (lat 50.696, lng 15.536 — u Benecka). Falešná shoda třídy DATA-17;
 *     alias NEpřidávat a shodu ve výstupu ignorovat. Ověřeno 26. 7. 2026.
 *     **ROZSOUZENO 30. 7. 2026** exportem známkových míst od Michala: prodejní
 *     místo známky je „Chata Hubertka, Bílý Potok 370, chatahubertka.cz",
 *     tedy jizerská. Náš jizerský kandidát `jizerske-hory/hubertka`
 *     (lat 50.888, lng 15.230) leží v okně Jizerských hor, krkonošský
 *     v okně Krkonoš — report to nově vypisuje se souřadnicemi obou, ať je
 *     rozhodnutí přezkoumatelné. Známka patří jizerskému objektu.
 * ---------------------------------------------------------------------------
 */
import { existsSync, readFileSync } from 'node:fs'
import { najdiYaml, nactiYaml } from './kontrola/lib'
import { OBLASTI as OBLASTI_KONFIG } from './oblasti'

type Radek = { cislo: string; nazev: string }

/**
 * Známkové místo z exportu, který Michal poslal 30. 7. 2026
 * (`data/externi/znamkova-mista-2026/`). Na rozdíl od filtrovaného CSV nese
 * i PRODEJNÍ MÍSTA a kategorie vydavatele — a prodejní místo bývá i sám
 * objekt, takže z něj padá obec i oficiální web (u č. 42 „Horská chata
 * Smědava, Bílý Potok (chatasmedava.cz)").
 */
export type ZnamkoveMisto = {
  cislo: string
  nazev: string
  kategorie: string[]
  prodejni: { nazev: string; url?: string }[]
}

/**
 * Parser textového exportu známkových míst. Formát je člověkem čitelný
 * výpis, ne strojový — proto se čte tolerantně a co se nerozparsuje, se
 * NEDOMÝŠLÍ: řádek, který nezačíná „No. ", je prodejní místo předchozího
 * místa, nebo se přeskočí.
 */
export const nactiZnamkovaMista = (text: string): ZnamkoveMisto[] => {
  const out: ZnamkoveMisto[] = []
  for (const radek of text.split('\n')) {
    const r = radek.trim()
    const hlavicka = /^No\.\s*(\d+)\s+(.+?)(?:\s*\[(.*)\])?$/u.exec(r)
    if (hlavicka) {
      out.push({
        cislo: hlavicka[1],
        nazev: hlavicka[2].trim(),
        kategorie: (hlavicka[3] ?? '').split(',').map((k) => k.trim()).filter(Boolean),
        prodejni: [],
      })
      continue
    }
    if (r.startsWith('-') && out.length) {
      const telo = r.replace(/^-\s*/u, '')
      // URL bývá v závorce na konci; „(u kostela)" závorka bez adresy je jen
      // upřesnění místa, ne odkaz — proto se hledá schéma nebo tečka v domény.
      // Doména bez schématu („jested.cz") je taky odkaz; „(u kostela)" ani
      // „(parkoviště)" ne — proto podmínka na tečku a žádnou mezeru.
      const vUrl = /\((https?:\/\/[^)]+|www\.[^)\s]+|[^)\s]+\.[a-z]{2,})\)\s*$/u.exec(telo)
      out[out.length - 1].prodejni.push({
        nazev: (vUrl ? telo.slice(0, vUrl.index) : telo).trim().replace(/[,\s]+$/u, ''),
        ...(vUrl ? { url: vUrl[1] } : {}),
      })
    }
  }
  return out
}

/** Bez diakritiky, malá písmena, jen písmena a číslice oddělené mezerou. */
function klic(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
}

/** Odřízne krajové přívlastky, kterými vydavatel odlišuje stejnojmenné známky. */
const OBLASTI = [
  'krkonose',
  'jizerske hory',
  'beskydy',
  'slezske beskydy',
  'sumava',
  'jeseniky',
  'cesky raj',
  'ceske svycarsko',
  'blansky les',
  'chriby',
  'jestedsky hrbet',
  'lysa hora',
  'liscilouka',
  'lisci louka',
  'pec pod snezkou',
  'spindleruv mlyn',
  'teplicke skaly',
]

function jadro(nazev: string): string {
  let k = klic(nazev)
  for (const o of OBLASTI) {
    k = k.replace(new RegExp(`(^| )${o}( |$)`, 'gu'), ' ')
  }
  // „Šerák 1351m", „Ještěd 1012m", „Ostrý 1044m" — výškový přívlastek
  k = k.replace(/ ?\d{3,4} ?m( |$)/gu, ' ')
  // obecná slova, která vydavatel a my používáme různě
  k = k.replace(/(^| )(chata|horska|horsky|bouda|hotel|turisticka|rozhledna)( |$)/gu, ' $3')
  return k.replace(/\s+/gu, ' ').trim()
}

function nactiCsv(cesta: string): Radek[] {
  const text = readFileSync(cesta, 'utf8').replace(/^﻿/u, '')
  return text
    .split('\n')
    .slice(1)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const i = r.indexOf(',')
      const nazev = r.slice(i + 1).replace(/^"|"$/gu, '').replaceAll('""', '"')
      return { cislo: r.slice(0, i), nazev }
    })
}

type Objekt = { slug: string; oblast: string; jmena: string[]; publikovan: boolean }

function nactiKorpus(): Objekt[] {
  const out: Objekt[] = []
  for (const [dir, pub] of [
    ['data/chaty', true],
    ['data/kandidati', false],
  ] as const) {
    for (const cesta of najdiYaml(dir)) {
      const d = nactiYaml(cesta) as Record<string, unknown>
      if (!d?.nazev) continue
      const jmena = [String(d.nazev)]
      for (const a of (d.aliasy as Array<{ nazev?: string }> | undefined) ?? []) {
        if (a?.nazev) jmena.push(a.nazev)
      }
      out.push({
        slug: String(d.slug ?? ''),
        oblast: String(d.oblast ?? ''),
        jmena,
        publikovan: pub,
      })
    }
  }
  return out
}

/**
 * CLI část. Od 30. 7. 2026 je pod strážcem, protože parser známkových míst
 * (`nactiZnamkovaMista`) importují testy — bez strážce by se při každém
 * importu vypsal celý report do výstupu testů.
 */
if (process.argv[1]?.endsWith('data22-znamky-oficialni-seznam.ts')) {
  const vse = process.argv.includes('--vse')
  const seznam = nactiCsv('data/externi/znamky-vizitky-2026/turisticke-znamky-cr-vyber.csv')
  const korpus = nactiKorpus()

  /**
   * Okna oblastí, které vedeme — slouží jen k rozřazení „patří k nám / leží
   * mimo". Objekt mimo všechna okna NENÍ chyba exportu: vydavatel řadí známky
   * po regionech, takže jizerský seznam obsahuje i Ještědský hřbet. Rozhodnutí,
   * co s takovým objektem, je na Michalovi (položka DATA-29 „přesahové oblasti").
   */
  const OKNA = OBLASTI_KONFIG.map((o) => ({ slug: o.slug, nazev: o.nazev, bbox: o.bbox }))
  const vOkne = (lat: number, lng: number) =>
    OKNA.filter((o) => lat >= o.bbox.latMin && lat <= o.bbox.latMax && lng >= o.bbox.lngMin && lng <= o.bbox.lngMax)

  const index = new Map<string, Objekt[]>()
  for (const o of korpus) {
    for (const j of o.jmena) {
      for (const k of [klic(j), jadro(j)]) {
        if (!k) continue
        const arr = index.get(k) ?? []
        if (!arr.includes(o)) arr.push(o)
        index.set(k, arr)
      }
    }
  }

  const nalezene: string[] = []
  const kandidatske: string[] = []
  const nezname: string[] = []

  for (const r of seznam) {
    const shody = index.get(klic(r.nazev)) ?? index.get(jadro(r.nazev)) ?? []
    const radek = `${r.cislo.padStart(5)}  ${r.nazev}`
    if (!shody.length) {
      nezname.push(radek)
    } else if (shody.some((s) => s.publikovan)) {
      nalezene.push(
        `${radek}  ->  ${shody
          .filter((s) => s.publikovan)
          .map((s) => `${s.oblast}/${s.slug}`)
          .join(', ')}`,
      )
    } else {
      kandidatske.push(
        `${radek}  ->  KANDIDÁT ${shody.map((s) => `${s.oblast}/${s.slug}`).join(', ')}`,
      )
    }
  }

  console.log(`=== V SEZNAMU VYDAVATELE: ${seznam.length} položek`)
  console.log(`\n--- SHODA S PUBLIKOVANÝM PROFILEM (${nalezene.length})`)
  for (const r of nalezene) console.log(r)
  console.log(`\n--- SHODA JEN S KANDIDÁTEM (${kandidatske.length})`)
  for (const r of kandidatske) console.log(r)
  console.log(`\n--- BEZ SHODY V KORPUSU (${nezname.length})`)
  if (vse) for (const r of nezname) console.log(r)
  else console.log('    (spusť s --vse pro výpis; většinou rozhledny a jiná pohoří)')

  // Profily, které známku v seznamu vydavatele NEMAJÍ — kandidáti na doplnění
  // nebo doklad, že objekt známku prostě nevydává.
  const maZnamku = new Set<string>()
  for (const r of seznam) {
    for (const o of index.get(klic(r.nazev)) ?? index.get(jadro(r.nazev)) ?? []) {
      maZnamku.add(`${o.oblast}/${o.slug}`)
    }
  }
  const bezZnamky = korpus
    .filter((o) => o.publikovan && !maZnamku.has(`${o.oblast}/${o.slug}`))
    .map((o) => `${o.oblast}/${o.slug}  (${o.jmena[0]})`)
    .sort()
  console.log(`\n--- PUBLIKOVANÉ PROFILY BEZ ZNÁMKY V SEZNAMU (${bezZnamky.length})`)
  for (const r of bezZnamky) console.log(r)

  // ── Známková místa z exportu 30. 7. 2026 (prodejní místa + kategorie) ───────
  // Vlastní oddíl, ne přepsání dosavadního: filtrované CSV vydavatele a tenhle
  // výpis se překrývají jen částečně a každý ukazuje něco jiného.
  const MISTA_SOUBOR = 'data/externi/znamkova-mista-2026/znamkova-mista-2026-07-30.txt'
  if (existsSync(MISTA_SOUBOR)) {
    const mista = nactiZnamkovaMista(readFileSync(MISTA_SOUBOR, 'utf8'))
    console.log(`\n\n=== ZNÁMKOVÁ MÍSTA (export 30. 7. 2026): ${mista.length} míst`)
    for (const m of mista) {
      const shody = index.get(klic(m.nazev)) ?? index.get(jadro(m.nazev)) ?? []
      const kde = shody.length
        ? shody.map((o) => `${o.publikovan ? 'PROFIL' : 'kandidát'} ${o.oblast}/${o.slug}`).join(', ')
        : 'V KORPUSU NENÍ'
      console.log(`\n${m.cislo.padStart(5)}  ${m.nazev}`)
      console.log(`        korpus: ${kde}`)
      if (m.kategorie.length) console.log(`        kategorie vydavatele: ${m.kategorie.join(' · ')}`)
      // Prodejní místo, které se jmenuje jako samo místo, je zároveň doklad
      // obce a webu objektu — proto se vypisuje první a s odkazem.
      for (const p of m.prodejni) console.log(`        prodej: ${p.nazev}${p.url ? ` — ${p.url}` : ''}`)
    }
    console.log(
      `\n(Objekt, který v korpusu není, může ležet mimo okna vedených oblastí — ` +
        `vydavatel řadí známky po regionech. Okna: ${OKNA.map((o) => `${o.nazev} ${o.bbox.latMin}–${o.bbox.latMax}/${o.bbox.lngMin}–${o.bbox.lngMax}`).join(' · ')}.)`,
    )
    // Souřadnice tenhle export nenese, takže rozřazení do oken se dělá u těch
    // objektů, které v korpusu MÁME — u ostatních by to byl dohad.
    for (const m of mista) {
      for (const o of index.get(klic(m.nazev)) ?? index.get(jadro(m.nazev)) ?? []) {
        // Hledá se v obou korpusech: kandidát i profil mají týž slug a rozhoduje
        // až to, kde soubor leží.
        // Cesta musí končit `<oblast>/<slug>.yaml`: v `data/kandidati/fotky/`
        // leží soubory téhož jména, ale jsou to návrhy FOTEK a souřadnice
        // nenesou — první nalezená cesta by tedy tichounce nic nevrátila.
        const cesta = [...najdiYaml('data/chaty'), ...najdiYaml('data/kandidati')].find((c) =>
          c.endsWith(`/${o.oblast}/${o.slug}.yaml`) && !c.includes('/fotky/'),
        )
        const d = cesta ? (nactiYaml(cesta) as Record<string, unknown>) : null
        const lat = typeof d?.lat === 'number' ? d.lat : null
        const lng = typeof d?.lng === 'number' ? d.lng : null
        if (lat != null && lng != null) {
          const okna = vOkne(lat, lng)
          console.log(
            `        ${m.nazev} → ${o.oblast}/${o.slug} (${lat}, ${lng}) ` +
              `${okna.length ? `v okně: ${okna.map((x) => x.slug).join(', ')}` : 'MIMO okna vedených oblastí'}`,
          )
        }
      }
    }
  }
}
