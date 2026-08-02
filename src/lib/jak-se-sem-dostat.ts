import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { jeAutobusovaZastavka } from '@/lib/cestina'
import { vzdusnaKm, type Bod } from '@/lib/odtud-dal'

/**
 * „Jak se sem dostat" — druhý blok mini-stránky střediska (handoff F1 §3
 * bod 5: „02 Jak se sem dostat — Vlak/Bus/Auto/Lanovka (fakta, ne jízdní
 * řády)").
 *
 * Blok čekal od 31. 7. 2026 na to, až někdo dohledá dopravní napojení
 * z doložených zdrojů a naplní pole `doprava` v datech střediska. Ta ruční
 * cesta zůstává a má přednost — jenže část odpovědi v repu **už leží**:
 * katalog výchozích bodů DATA-06 (`data/oblasti/<oblast>/
 * vychozi-body-kandidati.json`) nese vedle obcí i **železniční stanice**
 * a **autobusové zastávky** z OpenStreetMap, se souřadnicemi a odkazem na
 * OSM objekt. Z toho jde poctivě složit dva řádky, aniž by se cokoli
 * domýšlelo.
 *
 * Čemu se blok VYHÝBÁ:
 *
 *  - **Jízdním řádům a linkám.** Že v obci stojí zastávka, je fakt z mapy;
 *    že tam něco jezdí a odkud, z našich dat NEPLYNE. Řádek proto mluví
 *    o zastávce, ne o spojení, a říká to i nahlas.
 *  - **Pěší vzdálenosti.** Metry jsou vzdušné (haversine z bodu obce),
 *    stejně jako u sousedních východišť — a tak se i jmenují. Poučení
 *    z 30. 7. 2026: dvě různé míry pojmenované stejně si čtenář sečte.
 *  - **Autu.** „Kudy se přijíždí a kde se parkuje" žádný náš datový soubor
 *    nenese (a u Pece je to navíc regulované). Řádek „Autem" se proto
 *    objeví jedině z ručně doloženého pole `doprava.auto`.
 *
 * Lanovka má na mini-stránce vlastní sekci s odkazy na dráhy (`lanovky.ts`),
 * takže se sem — na rozdíl od prototypu — nekopíruje: byl by to týž fakt
 * dvakrát na jedné stránce.
 */

/** Bod z katalogu výchozích bodů DATA-06 — jen to, co blok potřebuje. */
export type BodKatalogu = {
  nazev: string
  typ: string
  lat?: number | null
  lng?: number | null
  url?: string | null
}

/** Nalezený bod i s tím, jak daleko od střediska leží (vzdušně, km). */
export type BlizkyBod = { nazev: string; url?: string | null; vzdusnaKm: number }

/** Řádek tabulky „Jak se sem dostat" (prototyp: klíč vlevo, hodnota vpravo). */
export type RadekDopravy = { klic: string; hodnota: string; puvod: 'data' | 'katalog' }

/** Ručně doložená próza z dat střediska (pole `doprava` kolekce Strediska). */
export type RucniDoprava = {
  vlak?: string | null
  bus?: string | null
  auto?: string | null
}

/** Nejdál od obce, kde ještě dává smysl mluvit o „nejbližší stanici". */
const LIMIT_ZELEZNICE_KM = 20
/** Okruh kolem bodu obce, uvnitř kterého je zastávka „v místě". */
const OKRUH_ZASTAVEK_KM = 1.5

/** Vzdálenost lidsky: pod kilometr v metrech (po 50 m), výš v km. */
export const formatVzdusne = (km: number): string =>
  km < 1
    ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
    : `${km.toFixed(1).replace('.', ',')} km`

/** Nejbližší bod daného typu; `null`, když žádný není nebo je za limitem. */
export const nejblizsiBod = (
  stred: Bod,
  body: BodKatalogu[],
  typ: string,
  limitKm: number,
): BlizkyBod | null => {
  let nej: BlizkyBod | null = null
  for (const b of body) {
    if (b.typ !== typ) continue
    const km = vzdusnaKm(stred, b)
    if (km == null || km > limitKm) continue
    if (!nej || km < nej.vzdusnaKm) nej = { nazev: b.nazev, url: b.url, vzdusnaKm: km }
  }
  return nej
}

/** Autobusové zastávky do `OKRUH_ZASTAVEK_KM` od bodu obce. */
export const zastavkyVMiste = (
  stred: Bod,
  body: BodKatalogu[],
): { pocet: number; nejblizsi: BlizkyBod | null } => {
  let pocet = 0
  let nejblizsi: BlizkyBod | null = null
  for (const b of body) {
    if (b.typ !== 'zastavka') continue
    const km = vzdusnaKm(stred, b)
    if (km == null || km > OKRUH_ZASTAVEK_KM) continue
    pocet += 1
    if (!nejblizsi || km < nejblizsi.vzdusnaKm) nejblizsi = { nazev: b.nazev, url: b.url, vzdusnaKm: km }
  }
  return { pocet, nejblizsi }
}

/**
 * Řádky bloku. Ručně doložená próza vždy přebíjí výpočet: je konkrétnější
 * (jmenuje linky, upozorňuje na regulace) a stojí na prameni, který si
 * redakce přečetla.
 */
export const jakSeSemDostat = (
  stred: Bod,
  body: BodKatalogu[],
  rucni?: RucniDoprava | null,
): RadekDopravy[] => {
  const out: RadekDopravy[] = []

  const vlakRucne = rucni?.vlak?.trim()
  if (vlakRucne) out.push({ klic: 'Vlakem', hodnota: vlakRucne, puvod: 'data' })
  else {
    const st = nejblizsiBod(stred, body, 'zeleznice', LIMIT_ZELEZNICE_KM)
    if (st) {
      out.push({
        klic: 'Vlakem',
        hodnota: `Nejbližší železniční stanice v mapových datech: ${st.nazev} — ${formatVzdusne(
          st.vzdusnaKm,
        )} vzdušnou čarou od bodu obce.`,
        puvod: 'katalog',
      })
    }
  }

  const busRucne = rucni?.bus?.trim()
  if (busRucne) out.push({ klic: 'Autobusem', hodnota: busRucne, puvod: 'data' })
  else {
    const { pocet, nejblizsi } = zastavkyVMiste(stred, body)
    if (pocet > 0 && nejblizsi) {
      out.push({
        klic: 'Autobusem',
        hodnota:
          `Podle mapových dat ${jeAutobusovaZastavka(pocet)} v okruhu 1,5 km od bodu obce, ` +
          `nejblíž „${nejblizsi.nazev}" (${formatVzdusne(nejblizsi.vzdusnaKm)}). ` +
          `Které linky tudy jezdí, z našich dat neplyne.`,
        puvod: 'katalog',
      })
    }
  }

  // Autem: jedině z doloženého pole. Kudy se přijíždí, kde se dá zaparkovat
  // a co je zrovna regulované, žádná mapová vrstva neříká.
  const autoRucne = rucni?.auto?.trim()
  if (autoRucne) out.push({ klic: 'Autem', hodnota: autoRucne, puvod: 'data' })

  return out
}

type Katalog = { body?: BodKatalogu[]; zdroj?: string }

const cache = new Map<string, Katalog>()

const nactiKatalog = (oblastSlug: string): Katalog => {
  const hotovo = cache.get(oblastSlug)
  if (hotovo) return hotovo
  const cesta = join(
    process.cwd(),
    'data',
    'oblasti',
    oblastSlug,
    'vychozi-body-kandidati.json',
  )
  const d = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as Katalog) : {}
  cache.set(oblastSlug, d)
  return d
}

/** Body katalogu výchozích bodů oblasti (prázdné pole, když soubor chybí). */
export const bodyKatalogu = (oblastSlug: string): BodKatalogu[] => nactiKatalog(oblastSlug).body ?? []

/** Věta o původu dat pod blokem — atribuce ODbL patří ke každému použití OSM. */
export const zdrojKatalogu = (oblastSlug: string): string | null =>
  nactiKatalog(oblastSlug).zdroj ?? null
