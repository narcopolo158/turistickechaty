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
    const vrcholy = vrcholyZHtml(readFileSync(zdroj, 'utf8'))
    const cilAdresar = join(process.cwd(), 'data', 'vrcholy')
    mkdirSync(cilAdresar, { recursive: true })
    writeFileSync(
      join(cilAdresar, `${oblast.slug}.json`),
      `${JSON.stringify(
        {
          zdroj:
            'OpenStreetMap (natural=peak se jménem a nadmořskou výškou, ODbL) — ' +
            'vytaženo z 3D modelu oblasti (pipeline DATA-28)',
          pozn:
            'Výšky jsou z OSM, ne z vlastního měření. Řez hřebenem je kreslí tak, ' +
            'jak jsou; co v OSM výšku nemá, se sem nedostane.',
          oblast: oblast.slug,
          pocet: vrcholy.length,
          vrcholy,
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    console.log(`${oblast.slug}: ${vrcholy.length} vrcholů → data/vrcholy/${oblast.slug}.json`)
  }
}

if (process.argv[1]?.includes('vrcholy-z-3d')) main()
