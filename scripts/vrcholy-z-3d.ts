/**
 * Vrcholy oblasti z hotového 3D modelu → `data/vrcholy/<oblast>.json`.
 *
 * PROČ TENHLE MEZIKROK EXISTUJE: pojmenované vrcholy s nadmořskou výškou už
 * jednou stažené máme — DATA-28 je bere z OpenStreetMap a zapéká je do
 * `public/3d/<oblast>.html` (4 MB, jedna scéna). Řez hřebenem na stránce
 * pohoří potřebuje z těch dat pár kilobajtů a rozhodně nemá při buildu
 * parsovat čtyřmegový soubor. Tenhle skript je proto vytáhne jednou a uloží
 * vedle ostatních datových souborů.
 *
 * Není to nový pramen: data jsou tatáž (OSM, ODbL), jen v použitelném tvaru.
 * Až DATA-28 poběží příště, může JSON psát rovnou — do té doby platí tohle.
 *
 *   npx tsx scripts/vrcholy-z-3d.ts [--oblast krkonose]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { OBLASTI } from './oblasti'

export type Vrchol = { nazev: string; lat: number; lng: number; vyska: number }

/** Jedna vrstva panoramatu: nejvyšší terén ve sloupci, po pásech od jihu. */
export type Vrstva = { pas: 'jih' | 'hreben' | 'sever'; vysky: number[] }

/**
 * Vytáhne z 3D stránky i samotný VÝŠKOPIS (mřížka z Mapy.com Elevation API,
 * kterou stahuje DATA-28) a udělá z něj panoramatický řez: pro každý sloupec
 * mřížky se vezme nejvyšší terén ve třech zeměpisných pásech — jižní podhůří,
 * hřeben, severní (polská) strana.
 *
 * Proč tři pásy, a ne jedna křivka: takhle vypadá pohled na pohoří zblízka —
 * bližší hřbety překrývají vzdálenější. Jedna čára by dala plochou siluetu,
 * ze které nepoznáš, že se díváš na hory a ne na graf.
 *
 * Pořadí řádků mřížky je od jihu (`latMin`) na sever, tak jak ji DATA-28
 * skládá; ověřeno na datech: nejvyšší řádky leží uprostřed, kde hřeben je.
 */
export const rezZHtml = (html: string): { vrstvy: Vrstva[]; bbox: Bbox; nx: number; ny: number } => {
  const iBbox = html.indexOf('"bbox":{"latMin"')
  if (iBbox < 0) throw new Error('V 3D stránce není bbox výškopisu — změnil se tvar exportu?')
  const bbox = JSON.parse(html.slice(html.indexOf('{', iBbox), html.indexOf('}', iBbox) + 1)) as Bbox
  const nx = Number(html.slice(html.indexOf('"nx":', iBbox) + 5).match(/^\d+/)?.[0])
  const ny = Number(html.slice(html.indexOf('"ny":', iBbox) + 5).match(/^\d+/)?.[0])
  if (!nx || !ny) throw new Error('V 3D stránce chybí rozměry mřížky (nx/ny)')

  const iGrid = html.indexOf('"grid":', iBbox)
  const zacatek = html.indexOf('[', iGrid)
  let hloubka = 0
  let konec = -1
  for (let i = zacatek; i < html.length; i++) {
    if (html[i] === '[') hloubka++
    else if (html[i] === ']') {
      hloubka--
      if (hloubka === 0) {
        konec = i
        break
      }
    }
  }
  if (konec < 0) throw new Error('Mřížku výškopisu se nepodařilo uzavřít')
  const grid = JSON.parse(html.slice(zacatek, konec + 1)) as number[][]

  const pasy: { pas: Vrstva['pas']; od: number; do: number }[] = [
    { pas: 'sever', od: Math.round(ny * 0.66), do: ny },
    { pas: 'hreben', od: Math.round(ny * 0.33), do: Math.round(ny * 0.66) },
    { pas: 'jih', od: 0, do: Math.round(ny * 0.33) },
  ]
  const vrstvy = pasy.map(({ pas, od, do: kam }) => ({
    pas,
    vysky: Array.from({ length: nx }, (_, ix) => {
      let max = 0
      for (let iy = od; iy < kam; iy++) {
        const v = grid[iy]?.[ix]
        if (typeof v === 'number' && v > max) max = v
      }
      return Math.round(max)
    }),
  }))
  return { vrstvy, bbox, nx, ny }
}

type Bbox = { latMin: number; lngMin: number; latMax: number; lngMax: number }

/**
 * Vytáhne pole `vrcholy` z JSON dat zapečených do 3D stránky. Hledá se
 * konkrétní klíč, ne „něco s ele" — kdyby se tvar exportu změnil, ať skript
 * spadne, místo aby tiše uložil prázdno.
 */
export const vrcholyZHtml = (html: string): Vrchol[] => {
  const zacatek = html.indexOf('"vrcholy":')
  if (zacatek < 0) throw new Error('V 3D stránce není klíč „vrcholy" — změnil se tvar exportu?')
  const otevreni = html.indexOf('[', zacatek)
  let hloubka = 0
  let konec = -1
  for (let i = otevreni; i < html.length; i++) {
    if (html[i] === '[') hloubka++
    else if (html[i] === ']') {
      hloubka--
      if (hloubka === 0) {
        konec = i
        break
      }
    }
  }
  if (konec < 0) throw new Error('Pole „vrcholy" se nepodařilo uzavřít')
  const syrove = JSON.parse(html.slice(otevreni, konec + 1)) as {
    n?: string
    lat?: number
    lng?: number
    ele?: number
  }[]
  return syrove
    .filter((v) => v.n && typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.ele === 'number')
    .map((v) => ({ nazev: v.n!, lat: v.lat!, lng: v.lng!, vyska: v.ele! }))
    .sort((a, b) => b.vyska - a.vyska)
}

const main = () => {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--oblast')
  const oblasti = i >= 0 && argv[i + 1] ? OBLASTI.filter((o) => o.slug === argv[i + 1]) : OBLASTI

  for (const oblast of oblasti) {
    const zdroj = join(process.cwd(), 'public', '3d', `${oblast.slug}.html`)
    if (!existsSync(zdroj)) {
      console.log(`${oblast.slug}: 3D model zatím není (${zdroj}) — přeskakuji`)
      continue
    }
    const html = readFileSync(zdroj, 'utf8')
    const vrcholy = vrcholyZHtml(html)
    const rez = rezZHtml(html)
    const cilAdresar = join(process.cwd(), 'data', 'vrcholy')
    mkdirSync(cilAdresar, { recursive: true })
    writeFileSync(
      join(cilAdresar, `${oblast.slug}.json`),
      `${JSON.stringify(
        {
          zdroj:
            'OpenStreetMap (natural=peak se jménem a nadmořskou výškou, ODbL) — ' +
            'vytaženo z 3D modelu oblasti (pipeline DATA-28)',
          zdrojVyskopisu:
            'Mapy.com Elevation API — výškový model téhož 3D exportu ' +
            `(mřížka ${rez.nx}×${rez.ny} nad bboxem modelu)`,
          pozn:
            'Výšky vrcholů jsou z OSM, terén z výškového modelu — ani jedno není ' +
            'vlastní měření. Řez je kreslí tak, jak jsou; co výšku nemá, se sem ' +
            'nedostane. Vrstvy panoramatu jsou nejvyšší terén ve sloupci pro tři ' +
            'zeměpisné pásy (jih / hřeben / sever), tedy pohled od jihu.',
          oblast: oblast.slug,
          pocet: vrcholy.length,
          bbox: rez.bbox,
          vrstvy: rez.vrstvy,
          vrcholy,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    const nej = Math.max(...rez.vrstvy.flatMap((v) => v.vysky))
    console.log(
      `${oblast.slug}: ${vrcholy.length} vrcholů + panorama ${rez.nx} sloupců ` +
        `(nejvyšší terén ${nej} m) → data/vrcholy/${oblast.slug}.json`,
    )
  }
}

if (process.argv[1]?.includes('vrcholy-z-3d')) main()
