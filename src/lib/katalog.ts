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
  sort: Razeni
  view: Zobrazeni
}

export const VYCHOZI_STAV: KatalogStav = { q: '', chips: [], sort: 'abc', view: 'karty' }

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
  if (stav.sort !== VYCHOZI_STAV.sort) p.set('sort', stav.sort)
  if (stav.view !== VYCHOZI_STAV.view) p.set('view', stav.view)
  return p.toString()
}

/** Query string / searchParams → stav; neznámé tokeny se tiše zahodí (odolné URL). */
export const stavZUrl = (params: URLSearchParams | Record<string, string | string[] | undefined>): KatalogStav => {
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
  return {
    q: p.get('q') ?? '',
    chips: CHIP_KLICE.filter((c) => chips.includes(c)),
    sort: jeRazeni(sort) ? sort : VYCHOZI_STAV.sort,
    view: jeZobrazeni(view) ? view : VYCHOZI_STAV.view,
  }
}
