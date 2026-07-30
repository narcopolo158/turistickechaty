import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

/**
 * Fotky středisek z manifestu, který plní GitHub Action (DATA-33, Wikimedia
 * Commons). Čte se při buildu ze souboru, ne z DB: fotka střediska je statická
 * příloha repa jako obrázky známek, ne redakční záznam v Payloadu.
 *
 * Atribuce není dekorace, ale podmínka licence CC BY/BY-SA — proto se vedle
 * URL vrací i autor, licence a odkaz na stránku souboru. Kdo fotku vykreslí,
 * musí vypsat i tohle; bez autora skript fotku vůbec nestahuje.
 */
export type FotkaStrediska = {
  url: string
  autor: string
  licence: string
  licenceUrl?: string
  /** Stránka souboru na Commons — doklad licence i původu; redakční snímek ji nemá. */
  stranka?: string
  /** Název souboru na Commons — popiska, ať snímek sám řekne, co je na něm. */
  popis?: string
}

type Manifest = {
  strediska?: {
    slug?: string
    soubor?: string
    popis?: string
    vybrano?: { autor?: string; licence?: string; licenceUrl?: string; stranka?: string }
  }[]
}

/**
 * REDAKČNÍ VRSTVA (`data/strediska/_fotky-redakcni.yaml`) má PŘEDNOST před
 * automatickým výběrem z Commons.
 *
 * Zadání Michala 30. 7. 2026: poslal snímky z mediabanky CzechTourism —
 * „je tam třeba dobrá fotka lanovky v Rokytnici". Skript DATA-33 na ně dosáhnout
 * nemůže (mediabanka zakazuje systematické užití, takže do pipeline nepatří)
 * a snímky ani neleží v `public/strediska/`, kterou každý běh přepisuje — jsou
 * v `public/foto/strediska/`. Kdo tam byl, ví o místě víc než skript nad cizím
 * katalogem; Commons zůstává výplní tam, kde vlastní snímek není.
 *
 * Licence `mediabanka-czt` má předepsané znění kreditu, proto se sem ukládá
 * doslova a stránka ho vypisuje beze změny.
 */
type Redakcni = {
  strediska?: {
    oblast?: string
    slug?: string
    soubor?: string
    popis?: string
    autor?: string
    licence?: string
    zdrojUrl?: string
  }[]
}

const NAZEV_LICENCE: Record<string, string> = {
  'mediabanka-czt': '© CzechTourism – mediabanka',
  'se-svolenim': 'se svolením',
  vlastni: 'foto redakce',
}

const nactiRedakcni = (oblast: string): Map<string, FotkaStrediska> => {
  const mapa = new Map<string, FotkaStrediska>()
  const cesta = join(process.cwd(), 'data', 'strediska', '_fotky-redakcni.yaml')
  if (!existsSync(cesta)) return mapa
  const d = (parse(readFileSync(cesta, 'utf8')) ?? {}) as Redakcni
  for (const z of d.strediska ?? []) {
    // Bez autora se snímek nepoužije — stejné pravidlo jako u Commons.
    if (z.oblast !== oblast || !z.slug || !z.soubor || !z.autor) continue
    mapa.set(z.slug, {
      url: z.soubor,
      autor: z.autor,
      licence: NAZEV_LICENCE[z.licence ?? ''] ?? z.licence ?? 'se svolením',
      ...(z.zdrojUrl ? { stranka: z.zdrojUrl } : {}),
      ...(z.popis ? { popis: z.popis } : {}),
    })
  }
  return mapa
}

const cache = new Map<string, Map<string, FotkaStrediska>>()

const nactiManifest = (oblast: string): Map<string, FotkaStrediska> => {
  const hotovo = cache.get(oblast)
  if (hotovo) return hotovo
  const mapa = new Map<string, FotkaStrediska>()
  const cesta = join(process.cwd(), 'data', 'strediska', `_fotky-${oblast}.json`)
  if (existsSync(cesta)) {
    const m = JSON.parse(readFileSync(cesta, 'utf8')) as Manifest
    for (const z of m.strediska ?? []) {
      const v = z.vybrano
      // Bez kompletního doložení se fotka nepoužije — půlka atribuce je horší
      // než žádná: čtenář by nevěděl, komu snímek patří.
      if (!z.slug || !z.soubor || !v?.autor || !v.licence || !v.stranka) continue
      mapa.set(z.slug, {
        url: z.soubor,
        autor: v.autor,
        licence: v.licence,
        licenceUrl: v.licenceUrl,
        stranka: v.stranka,
        popis: z.popis,
      })
    }
  }
  // Redakční snímky se dosazují NAKONEC, aby přebily manifest.
  for (const [slug, foto] of nactiRedakcni(oblast)) mapa.set(slug, foto)
  cache.set(oblast, mapa)
  return mapa
}

/** Fotka střediska, nebo null (pak se místo nevykresluje — žádný placeholder). */
export const fotkaStrediska = (oblast: string, slug: string): FotkaStrediska | null =>
  nactiManifest(oblast).get(slug) ?? null
