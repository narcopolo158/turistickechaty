/**
 * „Odtud dál" — třetí blok mini-stránky střediska (handoff F1 §3 bod 6:
 * „Sněžka, hřebenovka, sousední východiště (dashed ghost)").
 *
 * Celý blok je JEN z dat, která už v repu jsou, a každý řádek stojí na
 * doložené vazbě:
 *
 *  - **Cíle odtud** = položky `topCile` oblasti, jejichž `nejblizChataSlug`
 *    je mezi chatami s doloženou přístupovou trasou z tohoto střediska
 *    (DATA-06). Vazba cíl↔chata má v datech `source`, trasa taky — takže
 *    „odtud" není odhad z mapy, ale řetěz dvou doložených vazeb. Cíl bez
 *    takové vazby se NEVYPISUJE: že na Sněžku odněkud „to jde", je tvrzení,
 *    a to bez pramene nepíšeme.
 *  - **Sousední východiště** = ostatní střediska téže oblasti seřazená podle
 *    vzdálenosti. Ta je **vzdušná** (haversine z GPS bodů obcí), ne pěší —
 *    a tak se to i popisuje; pěší vzdálenost mezi středisky spočítanou
 *    nemáme (poučení z 30. 7. 2026: „pěšky nesmí vyjít kratší než vzdušnou
 *    čarou" — když se dvě různé míry pojmenují stejně, čtenář je sečte).
 *
 * Prototyp má v tomhle bloku i kartu „hřebenovka". Tu zatím NEDĚLÁME:
 * přechody (`data06-prechody`) vedou mezi chatami, ne ze střediska, a složit
 * z nich hřebenovku „odtud" by znamenalo vymyslet, kde přechod začíná.
 */

/** Bod na mapě — jen to, co potřebuje výpočet vzdálenosti. */
export type Bod = { lat?: number | null; lng?: number | null }

/**
 * Vzdušná vzdálenost dvou bodů v km (haversine, poloměr 6371 km).
 * `null`, když některý bod nemá souřadnice — chybějící GPS není nula.
 */
export const vzdusnaKm = (a: Bod, b: Bod): number | null => {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export type StrediskoVOblasti = { slug?: string | null; nazev: string } & Bod

export type Soused = { slug: string; nazev: string; vzdusnaKm: number }

/**
 * Sousední východiště: ostatní střediska oblasti s GPS, od nejbližšího.
 * Středisko bez slugu se vynechá (nevede na něj mini-stránka) a stejně tak
 * to, u kterého vzdálenost spočítat nejde.
 */
export const sousedniVychodiste = (
  stred: StrediskoVOblasti,
  vsechna: StrediskoVOblasti[],
  limit = 3,
): Soused[] =>
  vsechna
    .filter((x) => x.slug && x.slug !== stred.slug)
    .map((x) => ({ slug: x.slug!, nazev: x.nazev, vzdusnaKm: vzdusnaKm(stred, x) }))
    .filter((x): x is Soused => x.vzdusnaKm != null)
    .sort((a, b) => a.vzdusnaKm - b.vzdusnaKm)
    .slice(0, limit)

export type TopCil = { nazev: string; veta?: string | null; nejblizChataSlug?: string | null }

/** Chata dostupná ze střediska — výstup `pristupyStrediska` zúžený na to, co blok potřebuje. */
export type DostupnaChata = { slug: string; nazev: string; delkaKm: number | null }

export type CilOdtud = {
  nazev: string
  veta: string | null
  chataSlug: string
  chataNazev: string
  delkaKm: number | null
}

/**
 * Cíle oblasti dosažitelné odtud: `topCile` s doloženou vazbou na chatu,
 * ke které odtud vede spočítaná přístupová trasa. Pořadí zůstává pořadím
 * `topCile` (v datech je záměrné — první cíl nese fotopás sekce 05),
 * jen se z nich vybírá.
 */
export const cileOdtud = (topCile: TopCil[], dostupne: DostupnaChata[]): CilOdtud[] => {
  const dle = new Map(dostupne.map((ch) => [ch.slug, ch]))
  const out: CilOdtud[] = []
  for (const c of topCile) {
    const chata = c.nejblizChataSlug ? dle.get(c.nejblizChataSlug) : undefined
    if (!chata) continue
    out.push({
      nazev: c.nazev,
      veta: c.veta ?? null,
      chataSlug: chata.slug,
      chataNazev: chata.nazev,
      delkaKm: chata.delkaKm,
    })
  }
  return out
}

/**
 * „Další list" v patičce (handoff: listování šablonou — „Špindlerův Mlýn →").
 * Cyklicky další středisko v abecedním pořadí oblasti; `null`, když je
 * středisko v oblasti samo (listovat není kam).
 */
export const dalsiList = (
  vsechna: StrediskoVOblasti[],
  slug: string,
): { slug: string; nazev: string } | null => {
  const cs = new Intl.Collator('cs')
  const serazena = vsechna
    .filter((x) => x.slug)
    .map((x) => ({ slug: x.slug!, nazev: x.nazev }))
    .sort((a, b) => cs.compare(a.nazev, b.nazev))
  if (serazena.length < 2) return null
  const i = serazena.findIndex((x) => x.slug === slug)
  if (i < 0) return null
  return serazena[(i + 1) % serazena.length]
}
