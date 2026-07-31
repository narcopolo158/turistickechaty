/**
 * F1b: čistá logika katalogu /chaty — filtrování, řazení a URL stav nad SSG
 * indexem chat. Přeneseno 1:1 z funkčního prototypu handoffu
 * (`design/handoff-f1/F1-Katalog.dc.html`, metoda `_filtered()`):
 *   - hledání: substring v názvu, bez rozlišení velikosti,
 *   - stavové chips (v provozu / zaniklá) fungují jako OR,
 *   - službové chips (nocleh / občerstvení / razítko / známka) jako AND,
 *   - řazení abecedně (localeCompare cs) / podle výšky (sestupně, bez výšky
 *     nakonec) / naposledy ověřeno (sestupně, bez ověření nakonec).
 *
 * Poctivost: filtr služby vybírá jen profily s DOLOŽENÝM „ano" — nezjištěno
 * (null) neprojde, ale nikdy se nevydává za „ne" (UI to říká popiskou).
 * Stav filtrů patří do URL (`?q=…&chips=…&sort=…&view=…`), ať jde výběr
 * sdílet odkazem — serializace vynechává výchozí hodnoty.
 *
 * Žádný Payload, žádné fs — čisté funkce, testovatelné samostatně; klient
 * je dostane spolu s indexem (props ze server komponenty).
 */
import type { IndexChata } from './index-chat'

/** Chips dle prototypu; hodnoty jsou i URL tokeny. */
export const CHIP_KLICE = ['v-provozu', 'zanikla', 'nocleh', 'obcerstveni', 'razitko', 'znamka'] as const

/** Lidské popisky chips — sdílí katalog i seznam chat na stránce pohoří. */
export const CHIP_POPISKY: Record<(typeof CHIP_KLICE)[number], string> = {
  'v-provozu': 'v provozu',
  zanikla: 'zaniklá',
  nocleh: 'nocleh',
  obcerstveni: 'občerstvení',
  razitko: 'razítko',
  znamka: 'známka',
}
export type ChipKlic = (typeof CHIP_KLICE)[number]

/** Stavové chips = OR (výběr množiny stavů); zbytek jsou službové = AND. */
const STAVOVE_CHIPS: ChipKlic[] = ['v-provozu', 'zanikla']

export const RAZENI = ['abc', 'vyska', 'overeno'] as const
export type Razeni = (typeof RAZENI)[number]

export const ZOBRAZENI = ['karty', 'radky', 'mapa'] as const
export type Zobrazeni = (typeof ZOBRAZENI)[number]

export type KatalogStav = {
  q: string
  chips: ChipKlic[]
  /**
   * Slugy pohoří k zobrazení (prázdné = všechna). Není to chip s pevným
   * seznamem jako `chips`: oblasti průvodce přibývají, takže se berou z DAT —
   * co je v indexu, to je ve filtru (zadání Michala 31. 7. 2026: „ať to funguje
   * pro všechna nově založená pohoří i do budoucna").
   */
  oblasti: string[]
  sort: Razeni
  view: Zobrazeni
}

export const VYCHOZI_STAV: KatalogStav = { q: '', chips: [], oblasti: [], sort: 'abc', view: 'karty' }

/** Jedno pohoří ve filtru — slug do URL, název na tlačítko, počet do popisku. */
export type OblastVolba = { slug: string; nazev: string; pocet: number }

/**
 * Pohoří, která má smysl nabídnout — sesbíraná z indexu, ne z číselníku.
 * Řadí se podle počtu profilů (pilot první), při shodě česky podle názvu.
 * Profily bez oblasti se přeskakují: filtr, který by nikoho nevybral, do lišty
 * nepatří.
 */
export const oblastiZIndexu = (index: IndexChata[]): OblastVolba[] => {
  const cs = new Intl.Collator('cs')
  const dle = new Map<string, OblastVolba>()
  for (const ch of index) {
    if (!ch.oblastSlug) continue
    const zaznam = dle.get(ch.oblastSlug)
    if (zaznam) zaznam.pocet += 1
    else dle.set(ch.oblastSlug, { slug: ch.oblastSlug, nazev: ch.oblastNazev ?? ch.oblastSlug, pocet: 1 })
  }
  return [...dle.values()].sort((a, b) => b.pocet - a.pocet || cs.compare(a.nazev, b.nazev))
}

/** Mapování chip → hodnota pole `stav` v indexu. */
const CHIP_NA_STAV: Partial<Record<ChipKlic, string>> = {
  'v-provozu': 'v-provozu',
  zanikla: 'zanikla',
}

/**
 * Filtr + řazení dle prototypu (1:1). Vrací nové pole — vstup nemutuje.
 * Řazení má proti prototypu navíc abecední tiebreak (deterministický build).
 */
export const filtrujKatalog = (index: IndexChata[], stav: KatalogStav): IndexChata[] => {
  const cs = new Intl.Collator('cs')
  const q = stav.q.trim().toLowerCase()
  const aktivni = new Set(stav.chips)

  let vysledek = index.filter((ch) => !q || ch.nazev.toLowerCase().includes(q))

  // Pohoří = OR (vyber si množinu), stejně jako stavové chips. Prázdný výběr
  // znamená „všechna", ne „žádná" — jinak by prázdná lišta vymazala katalog.
  if (stav.oblasti.length > 0) {
    const chtene = new Set(stav.oblasti)
    vysledek = vysledek.filter((ch) => ch.oblastSlug != null && chtene.has(ch.oblastSlug))
  }

  const stavy = STAVOVE_CHIPS.filter((c) => aktivni.has(c)).map((c) => CHIP_NA_STAV[c]!)
  if (stavy.length > 0) vysledek = vysledek.filter((ch) => ch.stav != null && stavy.includes(ch.stav))

  // Službové AND — jen doložené „ano" (null = nezjištěno neprojde, viz hlavička).
  if (aktivni.has('nocleh')) vysledek = vysledek.filter((ch) => ch.nocleh === true)
  if (aktivni.has('obcerstveni')) vysledek = vysledek.filter((ch) => ch.obcerstveni === true)
  if (aktivni.has('razitko')) vysledek = vysledek.filter((ch) => ch.razitko)
  if (aktivni.has('znamka')) vysledek = vysledek.filter((ch) => ch.znamka)

  const serazene = [...vysledek]
  if (stav.sort === 'abc') serazene.sort((a, b) => cs.compare(a.nazev, b.nazev))
  if (stav.sort === 'vyska')
    serazene.sort((a, b) => (b.vyska ?? -1) - (a.vyska ?? -1) || cs.compare(a.nazev, b.nazev))
  if (stav.sort === 'overeno')
    serazene.sort((a, b) => {
      const ca = a.checked ?? ''
      const cb = b.checked ?? ''
      return ca < cb ? 1 : ca > cb ? -1 : cs.compare(a.nazev, b.nazev)
    })
  return serazene
}

// ── Formát a odvozené popisky karet (čisté, bez DB — používá je client UI) ──

/** 1410 → „1 410 m"; bez výšky poctivá „—" (nikdy 0). Úzká nezlomitelná mezera. */
export const formatVyskaM = (vyska: number | null): string =>
  vyska == null ? '—' : `${new Intl.NumberFormat('cs-CZ').format(vyska).replace(/\s/g, ' ')} m`

/** ISO „2026-07-19" → „19. 7. 2026"; bez data „—". */
export const formatCheckedDatum = (iso: string | null): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${Number(m[3])}. ${Number(m[2])}. ${Number(m[1])}` : '—'
}

/**
 * Kurzívní tag karty dle prototypu („· Atlas", „· PL", „· výška nedoložena").
 * Jeden tag s prioritou: zaniklá > polský profil > nedoložená výška; jinak
 * prázdný řetězec (řádek drží min-height, ať karty nelítají).
 */
export const tagKarty = (ch: Pick<IndexChata, 'stav' | 'zeme' | 'vyska'>): string => {
  if (ch.stav === 'zanikla') return '· Atlas'
  if (ch.zeme === 'pl') return '· PL'
  if (ch.vyska == null) return '· výška nedoložena'
  return ''
}

// ── URL stav (?q=…&chips=…&sort=…&view=…) ──────────────────────────────────

const jeChip = (t: string): t is ChipKlic => (CHIP_KLICE as readonly string[]).includes(t)
const jeRazeni = (t: string): t is Razeni => (RAZENI as readonly string[]).includes(t)
const jeZobrazeni = (t: string): t is Zobrazeni => (ZOBRAZENI as readonly string[]).includes(t)

/** Stav → query string (bez „?"); výchozí hodnoty se vynechávají — čisté URL. */
export const stavDoUrl = (stav: KatalogStav): string => {
  const p = new URLSearchParams()
  if (stav.q.trim()) p.set('q', stav.q.trim())
  if (stav.chips.length > 0) {
    // Kanonické pořadí chips → stejný výběr = stejná URL (sdílení odkazem).
    p.set('chips', CHIP_KLICE.filter((c) => stav.chips.includes(c)).join(','))
  }
  if (stav.oblasti.length > 0) p.set('oblasti', [...stav.oblasti].sort().join(','))
  if (stav.sort !== VYCHOZI_STAV.sort) p.set('sort', stav.sort)
  if (stav.view !== VYCHOZI_STAV.view) p.set('view', stav.view)
  return p.toString()
}

/** Query string / searchParams → stav; neznámé tokeny se tiše zahodí (odolné URL). */
/**
 * Query string / searchParams → stav.
 *
 * `znameOblasti` je volitelný seznam slugů, které v datech opravdu jsou. Když
 * se předá, neznámý slug z URL se zahodí (stejně jako neznámý chip) — jinak by
 * překlep v odkazu ukázal prázdný katalog místo toho, aby filtr prostě
 * nezabral. Bez seznamu se přijme jakýkoli slug, ať funkce zůstane čistá
 * a použitelná i tam, kde data po ruce nejsou.
 */
export const stavZUrl = (
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  znameOblasti?: readonly string[],
): KatalogStav => {
  const p =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params).flatMap(([k, v]) =>
            typeof v === 'string' ? [[k, v] as [string, string]] : [],
          ),
        )
  const chips = (p.get('chips') ?? '').split(',').filter(jeChip)
  const sort = p.get('sort') ?? ''
  const view = p.get('view') ?? ''
  const zname = znameOblasti ? new Set(znameOblasti) : null
  const oblasti = [
    ...new Set(
      (p.get('oblasti') ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => /^[a-z0-9-]+$/u.test(t) && (!zname || zname.has(t))),
    ),
  ].sort()
  return {
    q: p.get('q') ?? '',
    chips: CHIP_KLICE.filter((c) => chips.includes(c)),
    oblasti,
    sort: jeRazeni(sort) ? sort : VYCHOZI_STAV.sort,
    view: jeZobrazeni(view) ? view : VYCHOZI_STAV.view,
  }
}
