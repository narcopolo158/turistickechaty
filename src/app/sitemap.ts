import type { MetadataRoute } from 'next'

import { getChatyProMapu, getStrediskaOblasti, getZiveOblasti } from '@/lib/chaty'

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

  // Stránky pohoří v mapě webu do 31. 7. 2026 CHYBĚLY — sitemap vedla jen
  // statické stránky a profily chat, takže rozcestník oblasti (nejsilnější
  // stránka průvodce hned po katalogu) se vyhledávačům nenabízel vůbec.
  let oblasti: MetadataRoute.Sitemap = []
  // Mini-stránky středisek (F1e) v mapě webu do 1. 8. 2026 CHYBĚLY — tatáž
  // mezera, jakou tu 31. 7. měly stránky pohoří: routa i strukturovaná data
  // existují, ale vyhledávač se o dvaadvaceti východištích nedozvěděl.
  const strediska: MetadataRoute.Sitemap = []
  try {
    // Jen oblasti s publikovanými profily — prázdný rozcestník do mapy webu
    // nepatří (seedované jsou i Český ráj a Ještědský hřbet, zatím bez chat).
    const zive = await getZiveOblasti()
    oblasti = zive.map((o) => ({
      url: `${BASE}/cesko/${o.slug}`,
      lastModified: dnes,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
    for (const o of zive) {
      // Středisko bez slugu nemá mini-stránku — do mapy webu tedy nepatří.
      const s = (await getStrediskaOblasti(o.slug)).filter((x) => x.slug)
      strediska.push(
        ...s.map((x) => ({
          url: `${BASE}/cesko/${o.slug}/stredisko/${x.slug}`,
          lastModified: dnes,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })),
      )
    }
  } catch {
    // DB nedostupná — stránky pohoří ani středisek se do mapy nedostanou,
    // statické ano.
  }

  let chaty: MetadataRoute.Sitemap = []
  try {
    const docs = await getChatyProMapu()
    chaty = docs
      .filter((c) => c.url)
      .map((c) => ({ url: `${BASE}${c.url}`, lastModified: dnes, changeFrequency: 'weekly' as const, priority: 0.8 }))
  } catch {
    // DB nedostupná (např. build bez DB) — aspoň statické stránky.
  }

  return [...staticke, ...oblasti, ...strediska, ...chaty]
}
