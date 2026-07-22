import type { MetadataRoute } from 'next'

import { getChatyProMapu } from '@/lib/chaty'

/**
 * Mapa webu (/sitemap.xml). Statické stránky + všechny publikované chaty
 * (kanonická cesta /cesko/krkonose/<slug> z `chataPath`). `/design` (noindex)
 * a 404 catch-all se sem nedávají. Regeneruje se s ISR; když je DB při buildu
 * nedostupná, vrátí aspoň statické stránky (build nespadne).
 */
const BASE = 'https://turistickechaty.cz'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dnes = new Date()
  const staticke: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: dnes, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/chaty`, lastModified: dnes, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/razitkovnik`, lastModified: dnes, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/zanikle`, lastModified: dnes, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/vylety`, lastModified: dnes, changeFrequency: 'monthly', priority: 0.5 },
  ]

  let chaty: MetadataRoute.Sitemap = []
  try {
    const docs = await getChatyProMapu()
    chaty = docs
      .filter((c) => c.url)
      .map((c) => ({ url: `${BASE}${c.url}`, lastModified: dnes, changeFrequency: 'weekly' as const, priority: 0.8 }))
  } catch {
    // DB nedostupná (např. build bez DB) — aspoň statické stránky.
  }

  return [...staticke, ...chaty]
}
