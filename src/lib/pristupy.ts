import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Kolik chat průvodce má doloženou přístupovou trasu z daného výchozího bodu
 * (DATA-06, značené trasy z OpenStreetMap).
 *
 * Karta střediska v návrhu nese velké číslo „N chat odtud". Do dneška u něj
 * stála poznámka „počty doplní přepočet přístupových tras" — tenhle modul ji
 * ruší tím, že to číslo spočítá z dat, která už v repu leží. Nepočítá se nic
 * navíc: bere se přesně to, co pipeline zapsala jako `vychoziBod`.
 *
 * Kde trasa doložená není, vrací se `null` — ne nula. Nula by tvrdila, že
 * odtud nikam nevede cesta, kdežto pravda je, že ji nemáme spočítanou.
 */
export type PristupyZBodu = { pocet: number; chaty: { slug: string; nazev: string }[] }

type Soubor = {
  chaty?: {
    slug?: string
    nazev?: string
    pristupy?: { vychoziBod?: string }[]
  }[]
}

/**
 * Obec z názvu výchozího bodu. Pipeline zapisuje body podrobněji, než se
 * jmenují střediska — „Janské Lázně, horní stanice kabinkové lanovky",
 * „Špindlerův Mlýn, autobusové nádraží", „Szklarska Poręba Górna, železniční
 * stanice". Kdyby se porovnávaly celé názvy, měla by polovina středisek
 * pomlčku, přestože trasy odtud doložené máme. Bere se proto část před první
 * čárkou a porovnává se bez ohledu na velikost písmen.
 */
const obecZBodu = (bod: string): string => bod.split(',')[0]!.trim().toLocaleLowerCase('cs')

const cache = new Map<string, Map<string, PristupyZBodu>>()

const nactiOblast = (oblastSlug: string): Map<string, PristupyZBodu> => {
  const hotovo = cache.get(oblastSlug)
  if (hotovo) return hotovo
  /** obec → slugy chat (množina: táž chata z dvou zastávek téže obce = jedna). */
  const podleObce = new Map<string, Map<string, { slug: string; nazev: string }>>()
  const cesta = join(process.cwd(), 'data', 'trasy', oblastSlug, 'pristupove-trasy.json')
  if (existsSync(cesta)) {
    const d = JSON.parse(readFileSync(cesta, 'utf8')) as Soubor
    for (const ch of d.chaty ?? []) {
      if (!ch.slug || !ch.nazev) continue
      for (const p of ch.pristupy ?? []) {
        if (!p.vychoziBod) continue
        const obec = obecZBodu(p.vychoziBod)
        const chaty = podleObce.get(obec) ?? new Map()
        chaty.set(ch.slug, { slug: ch.slug, nazev: ch.nazev })
        podleObce.set(obec, chaty)
      }
    }
  }
  const mapa = new Map<string, PristupyZBodu>()
  for (const [obec, chaty] of podleObce) {
    const seznam = [...chaty.values()].sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'))
    mapa.set(obec, { pocet: seznam.length, chaty: seznam })
  }
  cache.set(oblastSlug, mapa)
  return mapa
}

/**
 * Chaty dostupné ze střediska, nebo `null`, když z něj trasy spočítané nemáme.
 * Název střediska se hledá jako obec ve výchozích bodech — „Szklarska Poręba"
 * proto najde i body zapsané jako „Szklarska Poręba Górna, železniční stanice".
 */
export const chatZBodu = (oblastSlug: string, nazevStrediska: string): PristupyZBodu | null => {
  const mapa = nactiOblast(oblastSlug)
  const hledany = nazevStrediska.trim().toLocaleLowerCase('cs')
  const presne = mapa.get(hledany)
  if (presne) return presne
  // Obec může nést v datech upřesnění bez čárky (Szklarska Poręba Górna).
  const chaty = new Map<string, { slug: string; nazev: string }>()
  for (const [obec, zaznam] of mapa) {
    if (!obec.startsWith(`${hledany} `)) continue
    for (const ch of zaznam.chaty) chaty.set(ch.slug, ch)
  }
  if (!chaty.size) return null
  const seznam = [...chaty.values()].sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs'))
  return { pocet: seznam.length, chaty: seznam }
}
