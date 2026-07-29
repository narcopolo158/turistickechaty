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

/** Jeden úsek trasy — barva pásové značky a její délka. */
export type Usek = { znaceni: string | null; delkaKm: number | null }

/** Přístup ke konkrétní chatě z jednoho výchozího bodu. */
export type Pristup = {
  slug: string
  nazev: string
  /** Přesný název výchozího bodu z dat („Pec pod Sněžkou, parkoviště P1"). */
  vychoziBod: string
  delkaKm: number | null
  useky: Usek[]
  /** Kolik procent trasy vede po neznačené cestě (z pipeline DATA-06). */
  podilNeznacenychProc: number | null
}

type SouborPodrobne = {
  zdroj?: string
  pozn?: string
  chaty?: {
    slug?: string
    nazev?: string
    pristupy?: {
      vychoziBod?: string
      delkaKm?: number
      podilNeznacenychProc?: number
      useky?: { znaceni?: string; delkaKm?: number }[]
      /** Body trasy OD CHATY dolů — poslední bod je výchozí bod túry. */
      geometrie?: { lat: number; lng: number }[]
    }[]
  }[]
}

const cachePodrobne = new Map<string, SouborPodrobne>()

const nactiSoubor = (oblastSlug: string): SouborPodrobne => {
  const hotovo = cachePodrobne.get(oblastSlug)
  if (hotovo) return hotovo
  const cesta = join(process.cwd(), 'data', 'trasy', oblastSlug, 'pristupove-trasy.json')
  const d = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as SouborPodrobne) : {}
  cachePodrobne.set(oblastSlug, d)
  return d
}

/**
 * Přístupy ze střediska i s délkou a značením úseků — podklad pro mini-stránku
 * střediska. Z každé dvojice (chata, středisko) se bere NEJKRATŠÍ doložený
 * přístup: víc tras k téže chatě je informace pro plánovač, ne pro přehled
 * „co je odtud dostupné".
 */
export const pristupyStrediska = (oblastSlug: string, nazevStrediska: string): Pristup[] => {
  const hledany = nazevStrediska.trim().toLocaleLowerCase('cs')
  const out = new Map<string, Pristup>()
  for (const ch of nactiSoubor(oblastSlug).chaty ?? []) {
    if (!ch.slug || !ch.nazev) continue
    for (const p of ch.pristupy ?? []) {
      if (!p.vychoziBod) continue
      const obec = obecZBodu(p.vychoziBod)
      if (obec !== hledany && !obec.startsWith(`${hledany} `)) continue
      const kandidat: Pristup = {
        slug: ch.slug,
        nazev: ch.nazev,
        vychoziBod: p.vychoziBod,
        delkaKm: typeof p.delkaKm === 'number' ? p.delkaKm : null,
        useky: (p.useky ?? []).map((u) => ({
          znaceni: u.znaceni ?? null,
          delkaKm: typeof u.delkaKm === 'number' ? u.delkaKm : null,
        })),
        podilNeznacenychProc:
          typeof p.podilNeznacenychProc === 'number' ? p.podilNeznacenychProc : null,
      }
      const stavajici = out.get(ch.slug)
      if (
        !stavajici ||
        (kandidat.delkaKm != null && (stavajici.delkaKm == null || kandidat.delkaKm < stavajici.delkaKm))
      ) {
        out.set(ch.slug, kandidat)
      }
    }
  }
  return [...out.values()].sort((a, b) => (a.delkaKm ?? 99) - (b.delkaKm ?? 99))
}

/** Zdroj přístupových tras (do patičky mini-stránky). */
export const zdrojPristupu = (oblastSlug: string): string | null =>
  nactiSoubor(oblastSlug).zdroj ?? null

/** Vzdušná vzdálenost v metrech (na těchhle délkách stačí rovinná aproximace). */
const vzdalenostM = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const stred = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const dx = (a.lng - b.lng) * Math.cos(stred) * 111_320
  const dy = (a.lat - b.lat) * 110_540
  return Math.hypot(dx, dy)
}

/**
 * Přístupy, které ZAČÍNAJÍ u zadaného bodu — podklad pro mini-stránku lanovky
 * („co odtud dojdu pěšky"). Nehledá se podle názvu výchozího bodu, ale podle
 * souřadnic: jména výchozích bodů jsou v datech psaná různě („Černá hora"
 * × „Černá hora, horní stanice kabinkové lanovky Černohorský Express"),
 * kdežto souřadnice se nepřejmenují.
 *
 * POZOR na směr geometrie: pipeline DATA-06 ukládá body OD CHATY k výchozímu
 * bodu, takže výchozí bod je POSLEDNÍ prvek. Podle prvního to nesedělo — tam
 * stojí chata a všechny její přístupy tím pádem začínají „na tomtéž místě".
 */
export const pristupyOdBodu = (
  oblastSlug: string,
  bod: { lat: number; lng: number },
  radiusM = 800,
): (Pristup & { odstupM: number })[] => {
  const out = new Map<string, Pristup & { odstupM: number }>()
  for (const ch of nactiSoubor(oblastSlug).chaty ?? []) {
    if (!ch.slug || !ch.nazev) continue
    for (const p of ch.pristupy ?? []) {
      const zacatek = p.geometrie?.[p.geometrie.length - 1]
      if (!zacatek || typeof zacatek.lat !== 'number' || typeof zacatek.lng !== 'number') continue
      const odstup = vzdalenostM(bod, zacatek)
      if (odstup > radiusM) continue
      const kandidat = {
        slug: ch.slug,
        nazev: ch.nazev,
        vychoziBod: p.vychoziBod ?? '',
        delkaKm: typeof p.delkaKm === 'number' ? p.delkaKm : null,
        useky: (p.useky ?? []).map((u) => ({
          znaceni: u.znaceni ?? null,
          delkaKm: typeof u.delkaKm === 'number' ? u.delkaKm : null,
        })),
        podilNeznacenychProc:
          typeof p.podilNeznacenychProc === 'number' ? p.podilNeznacenychProc : null,
        odstupM: Math.round(odstup),
      }
      const stavajici = out.get(ch.slug)
      if (!stavajici || (kandidat.delkaKm ?? 99) < (stavajici.delkaKm ?? 99)) out.set(ch.slug, kandidat)
    }
  }
  return [...out.values()].sort((a, b) => (a.delkaKm ?? 99) - (b.delkaKm ?? 99))
}
