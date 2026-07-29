import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Fotky lanovek z manifestu, který plní pipeline DATA-33 (Wikimedia Commons).
 * Stejná pravidla jako u fotek středisek: bez doloženého autora se snímek
 * nepoužije, protože uvedení autora je podmínka licence CC BY/BY-SA, ne
 * ozdoba. Dokud běh neproběhne, mini-stránka lanovky fotku prostě nemá —
 * placeholder se nekreslí.
 */
export type FotkaLanovky = {
  url: string
  autor: string
  licence: string
  licenceUrl?: string
  stranka: string
  /** Název souboru na Commons — popiska, ať snímek sám řekne, co je na něm. */
  popis?: string
}

type Manifest = {
  lanovky?: {
    slug?: string
    soubor?: string
    popis?: string
    vybrano?: { autor?: string; licence?: string; licenceUrl?: string; stranka?: string }
  }[]
}

const cache = new Map<string, Map<string, FotkaLanovky>>()

const nactiManifest = (oblast: string): Map<string, FotkaLanovky> => {
  const hotovo = cache.get(oblast)
  if (hotovo) return hotovo
  const mapa = new Map<string, FotkaLanovky>()
  const cesta = join(process.cwd(), 'data', 'lanovky', `_fotky-${oblast}.json`)
  if (existsSync(cesta)) {
    const m = JSON.parse(readFileSync(cesta, 'utf8')) as Manifest
    for (const z of m.lanovky ?? []) {
      const v = z.vybrano
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
  cache.set(oblast, mapa)
  return mapa
}

/** Fotka lanovky, nebo null (pak se místo nevykresluje — žádný placeholder). */
export const fotkaLanovky = (oblast: string, slug: string): FotkaLanovky | null =>
  nactiManifest(oblast).get(slug) ?? null
