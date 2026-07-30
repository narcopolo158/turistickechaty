import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Redakční a komunitní fotky středisek a lanovek z Payloadu — mají PŘEDNOST
 * před automatickým výběrem z Commons (DATA-33).
 *
 * Proč přednost (zadání Michala 30. 7. 2026: „mám pro některá střediska
 * a lanovky lepší vlastní fotky… ať to můžu editovat sám"): skript nad cizím
 * katalogem vybírá podle pravidel a v nejlepším případě trefí doložený snímek
 * místa. Člověk, který tam byl, ví, co místo ukazuje nejlíp — a když má
 * vlastní fotku, nemá smysl mu ji přebíjet algoritmem. Commons zůstává jako
 * výplň tam, kde vlastní snímek není.
 *
 * Čekárna se sem NEDOSTANE: bere se jen fotka, které redakce přepnula typ
 * mimo `komunitni-podani` (tj. schválila ji). Podání tedy pořád nic
 * nezveřejňuje samo — stejně jako u chat a razítek.
 */

export type RedakcniFotka = {
  url: string
  autor: string
  licence: string
  /** Odkaz na zdroj (u převzatých snímků); vlastní fotka ho nemá. */
  stranka?: string
  /** Popiska — u vlastních snímků datování nebo alt, ať snímek řekne, co je na něm. */
  popis?: string
}

/** Lidský název licence pro popisku pod fotkou. */
const NAZEV_LICENCE: Record<string, string> = {
  'se-svolenim': 'se svolením',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  'cc0': 'CC0',
  'public-domain': 'volné dílo',
  vlastni: 'vlastní snímek',
}

type FotkaDoc = {
  url?: string | null
  sizes?: { karta?: { url?: string | null }; nahled?: { url?: string | null } } | null
  autor?: string | null
  licence?: string | null
  zdrojUrl?: string | null
  datovani?: string | null
  alt?: string | null
  stredisko?: number | string | { id: number | string } | null
  lanovkaOblast?: string | null
  lanovkaSlug?: string | null
}

const naFotku = (d: FotkaDoc): RedakcniFotka | null => {
  const url = d.sizes?.karta?.url ?? d.url ?? null
  // Bez autora se snímek nepoužije — u „se svolením" je uvedení jména
  // podmínkou, za které nám ho člověk dal. Totéž pravidlo jako u Commons.
  if (!url || !d.autor) return null
  return {
    url,
    autor: d.autor,
    licence: NAZEV_LICENCE[d.licence ?? ''] ?? d.licence ?? 'se svolením',
    ...(d.zdrojUrl ? { stranka: d.zdrojUrl } : {}),
    ...(d.datovani ? { popis: d.datovani } : {}),
  }
}

/** Schválené = redakce jim přepnula typ mimo čekárnu. */
const KDE_SCHVALENE = { typ: { not_equals: 'komunitni-podani' } }

const idZVztahu = (v: FotkaDoc['stredisko']): string | null =>
  v == null ? null : typeof v === 'object' ? String(v.id) : String(v)

/**
 * Fotky středisek podle id střediska. Vrací mapu, ne funkci na dotaz:
 * stránka pohoří kreslí patnáct karet a patnáct dotazů do DB by z jednoho
 * renderu udělalo patnáct round-tripů.
 */
export const redakcniFotkyStredisek = async (): Promise<Map<string, RedakcniFotka>> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'fotky',
    where: { and: [KDE_SCHVALENE, { stredisko: { exists: true } }] },
    sort: '-createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: false,
  })
  const mapa = new Map<string, RedakcniFotka>()
  for (const doc of res.docs as FotkaDoc[]) {
    const id = idZVztahu(doc.stredisko)
    const foto = naFotku(doc)
    // `-createdAt` → první nalezená je nejnovější; starší se nepřepisuje.
    if (id && foto && !mapa.has(id)) mapa.set(id, foto)
  }
  return mapa
}

/** Fotky lanovek podle slugu dráhy v dané oblasti (lanovky kolekci nemají). */
export const redakcniFotkyLanovek = async (oblast: string): Promise<Map<string, RedakcniFotka>> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'fotky',
    where: { and: [KDE_SCHVALENE, { lanovkaOblast: { equals: oblast } }] },
    sort: '-createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: false,
  })
  const mapa = new Map<string, RedakcniFotka>()
  for (const doc of res.docs as FotkaDoc[]) {
    const foto = naFotku(doc)
    if (doc.lanovkaSlug && foto && !mapa.has(doc.lanovkaSlug)) mapa.set(doc.lanovkaSlug, foto)
  }
  return mapa
}
