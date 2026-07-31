/**
 * FRONTA REDAKČNÍ PRÁCE — jeden zdroj pravdy o tom, co čeká na rozhodnutí.
 *
 * PROČ EXISTUJE (31. 7. 2026, zadání Michala: „ujisti se, že k tomu budu mít
 * všechny potřebné nástroje a nic nám neproklouzne a nic nezůstane
 * nezpracované"): pipeline sype kandidáty rychleji, než je stíhá redakce
 * projít — DATA-01 přinesla 147 kandidátních objektů, DATA-02 skoro tři tisíce
 * fotek. Dokud stav rozpracovanosti nikde nestál, dalo se poznat jen ručním
 * porovnáváním složek, co je hotové a co leží. Přesně tak zapadlo 45 kandidátů
 * Jizerek: nikdo je nezahodil, jen se na ně zapomnělo.
 *
 * KLÍČOVÉ ROZHODNUTÍ: stav se **odvozuje z dat**, nikde se nevede zvlášť.
 * Kandidát je povýšený tím, že existuje profil; vyřazený tím, že stojí ve
 * `_vyrazeno.yaml`. Druhý seznam „co je hotové" by se rozešel s realitou
 * první den, kdy by někdo povýšil chatu ručně. Zvlášť se proto zapisují jen
 * rozhodnutí, která z jiných dat poznat NEJDOU — „odloženo" a „odmítnutá
 * fotka": obojí je aktivní volba člověka, ne nepřítomnost práce.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'

import { parse } from 'yaml'

import { slugLanovky } from '../lanovky'

/** Stav kandidátního objektu. `nezpracovan` = leží ve frontě. */
export type StavKandidata = 'povysen' | 'vyrazen' | 'odlozen' | 'nezpracovan'

export type Kandidat = {
  slug: string
  nazev: string
  oblast: string
  stav: StavKandidata
  /** U odloženého a vyřazeného důvod, který zapsal člověk. */
  duvod?: string
  /** Signály, podle kterých se rozhoduje (z OSM tagů kandidáta). */
  typ?: string
  vyska?: number | null
  maGps: boolean
  maObcerstveni: boolean
  osm?: string
}

export type FotkaVeFronte = {
  soubor: string
  autor?: string
  licence?: string
  stranka?: string
  original?: string
  nahled?: string
  nalezeno?: string
  rozmery?: string
  datum?: string
  popis?: string
  /** Jen geotag u chaty je doklad polohy; kategorie i fulltext jsou shoda jména. */
  silny: boolean
}

export type FotkyChaty = {
  slug: string
  nazev: string
  oblast: string
  /** Profil existuje (objekt prošel triáží), ne jen kandidát. */
  jeProfil: boolean
  /** Chata už má v profilu vybranou fotku. */
  maFotku: boolean
  /** Rozhodnutí na úrovni chaty — „z Commons nic nebereme". */
  uzavrena?: { duvod: string; checked?: string }
  ceka: FotkaVeFronte[]
  odmitnute: { soubor: string; duvod: string }[]
}

/**
 * Mezera v profilu — údaj, který na webu chybí, ačkoli objekt na webu stojí.
 *
 * PROČ (doplněno 31. 7. 2026 k původní frontě): fronta hlídala, jestli profil
 * VZNIKL a má fotku. Chata ale může mít profil a být skoro prázdná — bez GPS
 * se nedostane na mapu, bez kontaktu si čtenář neověří otvíračku, bez data
 * kontroly nikdo nepozná, že údaj zestárl. Tohle jsou práce, které se jinak
 * neozvou: nic nespadne, jen stránka mlčí.
 */
export type MezeraProfilu = {
  slug: string
  nazev: string
  oblast: string
  /** Čeho se nedostává — čitelné názvy, jdou rovnou do reportu i na obrazovku. */
  chybi: string[]
  /** Nejstarší `checked` napříč bloky ověření (podle něj se pozná stárnutí). */
  nejstarsiOvereni: string | null
  /** Stáří nejstaršího ověření ve dnech; `null` = objekt nemá ověření žádné. */
  stariDnu: number | null
}

export type Souhrn = {
  kandidati: { celkem: number; nezpracovan: number; odlozen: number; povysen: number; vyrazen: number }
  fotky: { profilu: number; sFotkou: number; cekaRozhodnuti: number; bezNabidky: number; uzavrenych: number }
  /** Úplnost profilů: co na webu stojí, ale mlčí. */
  profily: {
    celkem: number
    sMezerou: number
    dleDruhu: { druh: string; pocet: number }[]
    /** Profily s nejstarším ověřením starším než rok. */
    zastaraleOvereni: number
  }
  /** Oblasti, ve kterých fronta něco drží — ať je vidět, kde se stojí. */
  dleOblasti: { oblast: string; kandidatiNezpracovani: number; profilyBezFotky: number }[]
}

const yamlSoubory = (slozka: string): string[] => {
  try {
    return readdirSync(slozka, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.yaml') && !basename(f).startsWith('_'))
      .map((f) => join(slozka, f))
  } catch {
    return []
  }
}

const nactiYaml = <T>(cesta: string): T | null => {
  try {
    return parse(readFileSync(cesta, 'utf8')) as T
  } catch {
    return null
  }
}

/** Odložení kandidáti — aktivní „zatím ne" s důvodem (ne nepřítomnost práce). */
export type Odlozeny = { slug: string; oblast?: string; duvod: string; rozhodl?: string; checked?: string }

export const nactiOdlozene = (koren: string): Map<string, Odlozeny> => {
  const soubor = join(koren, 'data', 'kandidati', '_odlozeno.yaml')
  const data = existsSync(soubor) ? nactiYaml<{ odlozeno?: Odlozeny[] }>(soubor) : null
  return new Map((data?.odlozeno ?? []).map((o) => [o.slug, o]))
}

/** Vyřazení kandidáti (`_vyrazeno.yaml`) — klíčem je slug i OSM URL. */
export const nactiVyrazene = (koren: string): Map<string, { duvod?: string }> => {
  const soubor = join(koren, 'data', 'kandidati', '_vyrazeno.yaml')
  const data = nactiYaml<{ vyrazeno?: { slug?: string; osm?: string; duvod?: string }[] }>(soubor)
  const mapa = new Map<string, { duvod?: string }>()
  for (const v of data?.vyrazeno ?? []) {
    if (v.slug) mapa.set(v.slug, { duvod: v.duvod })
    if (v.osm) mapa.set(v.osm, { duvod: v.duvod })
  }
  return mapa
}

/** Slugy objektů, které mají publikovaný profil (= prošly triáží). */
export const nactiProfily = (koren: string): Map<string, { maFotku: boolean; nazev: string }> => {
  const mapa = new Map<string, { maFotku: boolean; nazev: string }>()
  for (const soubor of yamlSoubory(join(koren, 'data', 'chaty'))) {
    const d = nactiYaml<{ slug?: string; nazev?: string; fotky?: unknown[] }>(soubor)
    if (!d?.slug) continue
    mapa.set(d.slug, { maFotku: Array.isArray(d.fotky) && d.fotky.length > 0, nazev: d.nazev ?? d.slug })
  }
  return mapa
}

/**
 * Kandidátní objekty se stavem. Soubor kandidáta se po povýšení NEMAŽE
 * (zůstává jako historický záznam s hlavičkou „POVÝŠENO"), takže stav se
 * pozná podle toho, jestli existuje profil téhož slugu.
 */
const korenKandidatu = (koren: string) => join(koren, 'data', 'kandidati')

export const stavKandidatu = (koren: string): Kandidat[] => {
  const profily = nactiProfily(koren)
  const vyrazeni = nactiVyrazene(koren)
  const odlozeni = nactiOdlozene(koren)
  const vysledek: Kandidat[] = []

  for (const soubor of yamlSoubory(korenKandidatu(koren))) {
    const d = nactiYaml<{
      slug?: string
      nazev?: string
      oblast?: string
      typ?: string
      vyska?: number
      lat?: number
      lng?: number
      obcerstveni?: unknown
      overeniLokace?: { source?: string }
    }>(soubor)
    if (!d?.slug) continue
    const slug = d.slug
    const osm = /https?:\/\/www\.openstreetmap\.org\/\S+/.exec(d.overeniLokace?.source ?? '')?.[0]
    const stav: StavKandidata = profily.has(slug)
      ? 'povysen'
      : vyrazeni.has(slug) || (osm ? vyrazeni.has(osm) : false)
        ? 'vyrazen'
        : odlozeni.has(slug)
          ? 'odlozen'
          : 'nezpracovan'
    vysledek.push({
      slug,
      nazev: d.nazev ?? slug,
      oblast: d.oblast ?? basename(soubor.replace(/\/[^/]+$/, '')),
      stav,
      duvod: odlozeni.get(slug)?.duvod ?? vyrazeni.get(slug)?.duvod,
      typ: d.typ,
      vyska: d.vyska ?? null,
      maGps: d.lat != null && d.lng != null,
      maObcerstveni: d.obcerstveni != null,
      osm,
    })
  }
  // Nezpracované napřed — fronta má být vidět, ne se v ní hledat.
  const poradi: Record<StavKandidata, number> = { nezpracovan: 0, odlozen: 1, povysen: 2, vyrazen: 3 }
  return vysledek.sort(
    (a, b) => poradi[a.stav] - poradi[b.stav] || a.oblast.localeCompare(b.oblast, 'cs') || a.nazev.localeCompare(b.nazev, 'cs'),
  )
}

/** Jen geotag u chaty je doklad polohy (Barborka × polská „Barbórka"). */
export const jeSilny = (nalezeno: string | undefined): boolean => (nalezeno ?? '').includes('geosearch')

export type OdmitnutaFotka = {
  chata: string
  soubor?: string
  stav: 'odmitnuta' | 'uzavrena'
  duvod: string
  rozhodl?: string
  checked?: string
}

/** Rozhodnutí o fotkách, která z jiných dat poznat nejdou (odmítnutí, uzavření). */
export const nactiRozhodnutiFotek = (koren: string): OdmitnutaFotka[] => {
  const soubor = join(koren, 'data', 'kandidati', 'fotky', '_rozhodnuti.yaml')
  const data = existsSync(soubor) ? nactiYaml<{ rozhodnuti?: OdmitnutaFotka[] }>(soubor) : null
  return data?.rozhodnuti ?? []
}

/**
 * Fronta fotek: co u které chaty ještě čeká na oko redakce. Vybrané fotky se
 * poznají z profilu (blok `fotky:`), odmítnuté z `_rozhodnuti.yaml` —
 * zbytek je fronta.
 */
export const frontaFotek = (koren: string, filtrOblasti?: string): FotkyChaty[] => {
  const profily = nactiProfily(koren)
  const rozhodnuti = nactiRozhodnutiFotek(koren)
  const odmitnuteDle = new Map<string, { soubor: string; duvod: string }[]>()
  const uzavreneDle = new Map<string, { duvod: string; checked?: string }>()
  for (const r of rozhodnuti) {
    if (r.stav === 'uzavrena') uzavreneDle.set(r.chata, { duvod: r.duvod, checked: r.checked })
    else if (r.soubor)
      odmitnuteDle.set(r.chata, [...(odmitnuteDle.get(r.chata) ?? []), { soubor: r.soubor, duvod: r.duvod }])
  }

  const vysledek: FotkyChaty[] = []
  for (const soubor of yamlSoubory(join(koren, 'data', 'kandidati', 'fotky'))) {
    const d = nactiYaml<{ chata?: string; oblast?: string; nazevChaty?: string; fotky?: FotkaVeFronte[] }>(soubor)
    if (!d?.chata || !d.oblast) continue
    if (filtrOblasti && d.oblast !== filtrOblasti) continue
    const odmitnute = odmitnuteDle.get(d.chata) ?? []
    const odmitnutaJmena = new Set(odmitnute.map((o) => o.soubor))
    const ceka = (d.fotky ?? [])
      .filter((f) => f?.soubor && f?.nahled && !odmitnutaJmena.has(f.soubor))
      .map((f) => ({ ...f, silny: jeSilny(f.nalezeno) }))
      .sort((a, b) => Number(b.silny) - Number(a.silny) || plocha(b.rozmery) - plocha(a.rozmery))
    vysledek.push({
      slug: d.chata,
      nazev: d.nazevChaty ?? d.chata,
      oblast: d.oblast,
      jeProfil: profily.has(d.chata),
      maFotku: profily.get(d.chata)?.maFotku ?? false,
      uzavrena: uzavreneDle.get(d.chata),
      ceka,
      odmitnute,
    })
  }
  // Práce, která hoří, napřed: profil bez fotky a s nabídkou silných nálezů.
  return vysledek.sort(
    (a, b) =>
      Number(b.jeProfil) - Number(a.jeProfil) ||
      Number(a.maFotku) - Number(b.maFotku) ||
      Number(!!a.uzavrena) - Number(!!b.uzavrena) ||
      b.ceka.filter((f) => f.silny).length - a.ceka.filter((f) => f.silny).length ||
      a.nazev.localeCompare(b.nazev, 'cs'),
  )
}

/** Rozlišení v pixelech (na řazení) — „3539×3400" → 12 032 600. */
export const plocha = (rozmery: string | undefined): number => {
  const m = /(\d+)\s*×\s*(\d+)/.exec(rozmery ?? '')
  return m ? Number(m[1]) * Number(m[2]) : 0
}


/** Nejstarší `checked` napříč bloky ověření profilu. */
const nejstarsiChecked = (profil: Record<string, unknown>): string | null => {
  const data: string[] = []
  for (const [klic, hodnota] of Object.entries(profil)) {
    if (!klic.startsWith('overeni') || !hodnota || typeof hodnota !== 'object') continue
    const checked = (hodnota as { checked?: unknown }).checked
    if (typeof checked === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(checked)) data.push(checked)
    else if (checked instanceof Date) data.push(checked.toISOString().slice(0, 10))
  }
  return data.sort()[0] ?? null
}

/** Slugy chat, ke kterým DATA-06 spočítala aspoň jednu přístupovou trasu. */
const chatySTrasami = (koren: string): Set<string> => {
  const slugy = new Set<string>()
  const korenTras = join(koren, 'data', 'trasy')
  let oblasti: string[] = []
  try {
    oblasti = readdirSync(korenTras, { encoding: 'utf8' })
  } catch {
    return slugy
  }
  for (const oblast of oblasti) {
    const soubor = join(korenTras, oblast, 'pristupove-trasy.json')
    if (!existsSync(soubor)) continue
    try {
      const data = JSON.parse(readFileSync(soubor, 'utf8')) as { chaty?: Record<string, unknown> | unknown[] }
      const chaty = data.chaty ?? {}
      for (const klic of Array.isArray(chaty)
        ? chaty.map((c) => (c as { slug?: string }).slug ?? '')
        : Object.keys(chaty))
        if (klic) slugy.add(klic)
    } catch {
      // Rozbitý soubor tras není chyba fronty — hlásí ho vlastní kontrola.
    }
  }
  return slugy
}

/**
 * Mezery profilů: co objektu na webu chybí, ačkoli na webu stojí.
 * `dnes` se předává, aby šlo stárnutí testovat bez závislosti na kalendáři.
 */
export const mezeryProfilu = (koren: string, dnes: string): MezeraProfilu[] => {
  const sTrasami = chatySTrasami(koren)
  const vysledek: MezeraProfilu[] = []
  for (const soubor of yamlSoubory(join(koren, 'data', 'chaty'))) {
    const d = nactiYaml<Record<string, unknown>>(soubor)
    if (!d || typeof d.slug !== 'string') continue
    const kontakty = (d.kontakty ?? {}) as { telefon?: unknown; web?: unknown; email?: unknown }
    const chybi: string[] = []
    if (d.lat == null || d.lng == null) chybi.push('GPS')
    if (!kontakty.telefon && !kontakty.web && !kontakty.email) chybi.push('kontakt')
    if (!d.otviraciDoba && !d.sezona) chybi.push('otvírací doba')
    if (!sTrasami.has(d.slug)) chybi.push('přístupová trasa')
    if (!Array.isArray(d.fotky) || d.fotky.length === 0) chybi.push('fotka')
    const nejstarsi = nejstarsiChecked(d)
    const stariDnu =
      nejstarsi != null
        ? Math.round((Date.parse(dnes) - Date.parse(nejstarsi)) / 86_400_000)
        : null
    vysledek.push({
      slug: d.slug,
      nazev: typeof d.nazev === 'string' ? d.nazev : d.slug,
      oblast: typeof d.oblast === 'string' ? d.oblast : '—',
      chybi,
      nejstarsiOvereni: nejstarsi,
      stariDnu,
    })
  }
  // Nejvíc chybějícího napřed; při shodě nejstarší ověření.
  return vysledek.sort(
    (a, b) => b.chybi.length - a.chybi.length || (b.stariDnu ?? 0) - (a.stariDnu ?? 0),
  )
}

/** Hranice, za kterou se ověření považuje za zastaralé (konvence: rok). */
export const ROK_DNU = 365

/** Čísla do reportu i do hlavičky redakčního prostředí. */
export const souhrnFronty = (koren: string, dnes = new Date().toISOString().slice(0, 10)): Souhrn => {
  const kandidati = stavKandidatu(koren)
  const fotky = frontaFotek(koren)
  const mezery = mezeryProfilu(koren, dnes)
  const dleDruhu = new Map<string, number>()
  for (const m of mezery) for (const druh of m.chybi) dleDruhu.set(druh, (dleDruhu.get(druh) ?? 0) + 1)
  const profily = fotky.filter((f) => f.jeProfil)
  const oblasti = [...new Set([...kandidati.map((k) => k.oblast), ...fotky.map((f) => f.oblast)])].sort()
  return {
    kandidati: {
      celkem: kandidati.length,
      nezpracovan: kandidati.filter((k) => k.stav === 'nezpracovan').length,
      odlozen: kandidati.filter((k) => k.stav === 'odlozen').length,
      povysen: kandidati.filter((k) => k.stav === 'povysen').length,
      vyrazen: kandidati.filter((k) => k.stav === 'vyrazen').length,
    },
    fotky: {
      profilu: profily.length,
      sFotkou: profily.filter((f) => f.maFotku).length,
      cekaRozhodnuti: profily.filter((f) => !f.maFotku && !f.uzavrena && f.ceka.length > 0).length,
      bezNabidky: profily.filter((f) => !f.maFotku && !f.uzavrena && f.ceka.length === 0).length,
      uzavrenych: profily.filter((f) => !!f.uzavrena).length,
    },
    profily: {
      celkem: mezery.length,
      sMezerou: mezery.filter((m) => m.chybi.length > 0).length,
      dleDruhu: [...dleDruhu].map(([druh, pocet]) => ({ druh, pocet })).sort((a, b) => b.pocet - a.pocet),
      zastaraleOvereni: mezery.filter((m) => (m.stariDnu ?? 0) > ROK_DNU).length,
    },
    dleOblasti: oblasti.map((oblast) => ({
      oblast,
      kandidatiNezpracovani: kandidati.filter((k) => k.oblast === oblast && k.stav === 'nezpracovan').length,
      profilyBezFotky: profily.filter((f) => f.oblast === oblast && !f.maFotku && !f.uzavrena).length,
    })),
  }
}

// ── Cílové objekty pro přesun fotky ────────────────────────────────────────

export type CilovyObjekt = {
  druh: 'chata' | 'stredisko' | 'lanovka'
  slug: string
  nazev: string
  oblast: string
}

/**
 * Objekty, kterým jde přiřadit fotka.
 *
 * PROČ (zadání Michala 31. 7. 2026): mezi kandidátními snímky chaty se často
 * najde dobrá fotka NĚČEHO JINÉHO — typicky lanovky, která k chatě vede.
 * Zahodit ji je škoda: patří jinam, ne pryč. Seznam se skládá z dat, ne
 * z číselníku, aby v něm bylo přesně to, co web opravdu vede.
 */
export const ciloveObjekty = (koren: string): CilovyObjekt[] => {
  const cile: CilovyObjekt[] = []

  for (const soubor of yamlSoubory(join(koren, 'data', 'chaty'))) {
    const d = nactiYaml<{ slug?: string; nazev?: string; oblast?: string }>(soubor)
    if (d?.slug) cile.push({ druh: 'chata', slug: d.slug, nazev: d.nazev ?? d.slug, oblast: d.oblast ?? '—' })
  }
  for (const soubor of yamlSoubory(join(koren, 'data', 'strediska'))) {
    const d = nactiYaml<{ slug?: string; nazev?: string; oblast?: string }>(soubor)
    if (d?.slug) cile.push({ druh: 'stredisko', slug: d.slug, nazev: d.nazev ?? d.slug, oblast: d.oblast ?? '—' })
  }
  // Lanovky nemají YAML profily — vznikají z OSM (DATA-32) a leží v JSONu po
  // oblastech. Slug + oblast je jejich identita i v kolekci Fotky.
  const korenLanovek = join(koren, 'data', 'lanovky')
  try {
    for (const nazev of readdirSync(korenLanovek, { encoding: 'utf8' })) {
      if (!nazev.endsWith('.json') || nazev.startsWith('_')) continue
      const oblast = nazev.replace(/\.json$/, '')
      const data = JSON.parse(readFileSync(join(korenLanovek, nazev), 'utf8')) as {
        lanovky?: { id?: string; nazev?: string | null }[]
      }
      // Slug dráhy se počítá stejně jako na webu (`slugLanovky`) — jinak by
      // fotka mířila na jiné URL, než jaké má mini-stránka lanovky.
      for (const l of data.lanovky ?? [])
        if (l.id) cile.push({ druh: 'lanovka', slug: slugLanovky(l.nazev ?? null, l.id), nazev: l.nazev ?? l.id, oblast })
    }
  } catch {
    // Bez souborů lanovek se prostě nenabídnou.
  }
  return cile.sort((a, b) => a.druh.localeCompare(b.druh) || a.nazev.localeCompare(b.nazev, 'cs'))
}

/** Chaty, které už mají v profilu galerii — podklad pro obrazovku správy. */
export const galerieChat = (
  koren: string,
): { slug: string; nazev: string; oblast: string; fotky: Record<string, unknown>[] }[] => {
  const vysledek: { slug: string; nazev: string; oblast: string; fotky: Record<string, unknown>[] }[] = []
  for (const soubor of yamlSoubory(join(koren, 'data', 'chaty'))) {
    const d = nactiYaml<{ slug?: string; nazev?: string; oblast?: string; fotky?: Record<string, unknown>[] }>(soubor)
    if (!d?.slug || !Array.isArray(d.fotky) || d.fotky.length === 0) continue
    vysledek.push({ slug: d.slug, nazev: d.nazev ?? d.slug, oblast: d.oblast ?? '—', fotky: d.fotky })
  }
  return vysledek.sort((a, b) => b.fotky.length - a.fotky.length || a.nazev.localeCompare(b.nazev, 'cs'))
}
