import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  /** Stránka souboru na Commons — doklad licence i původu. */
  stranka: string
}

type Manifest = {
  strediska?: {
    slug?: string
    soubor?: string
    vybrano?: { autor?: string; licence?: string; licenceUrl?: string; stranka?: string }
  }[]
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
      mapa.set(z.slug, { url: z.soubor, autor: v.autor, licence: v.licence, licenceUrl: v.licenceUrl, stranka: v.stranka })
    }
  }
  cache.set(oblast, mapa)
  return mapa
}

/** Fotka střediska, nebo null (pak se místo nevykresluje — žádný placeholder). */
export const fotkaStrediska = (oblast: string, slug: string): FotkaStrediska | null =>
  nactiManifest(oblast).get(slug) ?? null
