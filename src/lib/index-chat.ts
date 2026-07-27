/**
 * SSG index chat (F1a) — štíhlý datový základ pro hledání, filtry, countery,
 * „namátkou z průvodce" a žebříčky šablon F1 (handoff design/handoff-f1/,
 * README §Data/SSG). Index se počítá při buildu ze server komponent
 * (`getIndexChat()` v `src/lib/chaty.ts`) a klientským komponentám se předává
 * jako props — klient už nikdy nedotazuje DB.
 *
 * Tenhle modul drží ČISTÉ funkce bez Payloadu a bez souborového systému,
 * aby šly testovat samostatně (vzor data02): extrakce „nejstaršího doloženého
 * roku" z milníků, feedy nad `checked` a kalendárium.
 *
 * Poctivost: index nic nedomýšlí — jen přeskládává, co je v profilech
 * doložené. Chybějící údaj je null (šablony kreslí „—"), nikdy 0.
 */

/** Jeden záznam indexu — pole dle handoffu (katalog, hledání, countery). */
export type IndexChata = {
  slug: string
  nazev: string
  /** Kanonická cesta profilu (`/cesko/krkonose/lucni-bouda`); null bez země/oblasti. */
  url: string | null
  oblastSlug: string | null
  oblastNazev: string | null
  /** Kód země (cz/pl/…) — ne slug. */
  zeme: string | null
  typ: string | null
  stav: string | null
  vyska: number | null
  /** null = nezjištěno (v datech nevyplněno) — poctivě se nefiltruje jako „ne". */
  nocleh: boolean | null
  obcerstveni: boolean | null
  /** Má aspoň jedno publikované razítko v DB. */
  razitko: boolean
  /** Má turistickou známku (katalog DATA-10, verified:false se zdrojem). */
  znamka: boolean
  /** Nejnovější `checked` napříč bloky ověření profilu (ISO datum), null = nikdy. */
  checked: string | null
  /** Aspoň jeden blok ověření potvrdil Michal (konvence B). */
  verified: boolean
  /** Nejstarší doložený rok z milníků historie — pro žebříček „Nejstarší".
   *  Netvrdíme založení; popisek šablony: „nejstarší doložený rok v historii".
   *  Chata bez milníku s rokem má null a v žebříčku není (rozhodnutí Michala). */
  nejstarsiRok: number | null
}

/** Milník historie, jak leží v profilu (rok je volitelný — bez roku se do extrakce nebere). */
export type MilnikProExtrakci = { rok?: number | null; udalost?: string | null }

/**
 * Nejstarší doložený rok z milníků historie (rozhodnutí Michala, deník 27. 7.
 * pokr. 18: extrakce nejstaršího doloženého letopočtu, ne pole rokVzniku).
 * Bere se minimum přes milníky s vyplněným rokem — pořadí pole nerozhoduje
 * (redakce může milníky psát od novějších). Bez jediného roku → null.
 */
export const nejstarsiDolozenyRok = (
  milniky: MilnikProExtrakci[] | null | undefined,
): number | null => {
  const roky = (milniky ?? [])
    .map((m) => m.rok)
    .filter((r): r is number => typeof r === 'number' && Number.isFinite(r))
  return roky.length > 0 ? Math.min(...roky) : null
}

/**
 * Pás „Naposledy ověřeno" — profily s nejnovějším `checked`, nejnovější první.
 * Remíza data se řeší česky abecedně (deterministický build, žádný hydration
 * mismatch). Profily bez `checked` se do pásu nedostanou.
 */
export const feedNaposledyOvereno = (index: IndexChata[], pocet = 6): IndexChata[] => {
  const cs = new Intl.Collator('cs')
  return index
    .filter((ch) => ch.checked != null)
    .sort((a, b) => (a.checked! < b.checked! ? 1 : a.checked! > b.checked! ? -1 : cs.compare(a.nazev, b.nazev)))
    .slice(0, Math.max(0, pocet))
}

/** ISO datum posledního ověření napříč celým fondem („naposledy ověřeno {datum}"), null = nikde. */
export const posledniOvereniFondu = (index: IndexChata[]): string | null => {
  let max: string | null = null
  for (const ch of index) if (ch.checked != null && (max == null || ch.checked > max)) max = ch.checked
  return max
}

/**
 * Mikroblok counterů: kolik profilů má `checked` v posledních `dni` dnech
 * (včetně hranice). `dnes` se předává jako ISO datum z buildu — funkce sama
 * nesahá na hodiny (SSR-safe, testovatelné).
 */
export const pocetNoveOverenychZa = (index: IndexChata[], dnes: string, dni = 14): number => {
  const hranice = new Date(`${dnes}T00:00:00Z`)
  if (Number.isNaN(hranice.getTime())) return 0
  hranice.setUTCDate(hranice.getUTCDate() - dni)
  const hraniceIso = hranice.toISOString().slice(0, 10)
  // ISO řez porovnává lexikograficky správně; budoucí `checked` (vada dat) se nepočítá.
  return index.filter((ch) => ch.checked != null && ch.checked >= hraniceIso && ch.checked <= dnes).length
}

// ── Kalendárium ─────────────────────────────────────────────────────────────

/** Jedna událost kalendária — milník historie s odkazem na profil. */
export type KalendariumPolozka = {
  rok: number
  udalost: string
  chataNazev: string
  chataUrl: string | null
}

/** Pořadové číslo dne v roce (1–366) z ISO data — bez sahání na lokální čas. */
export const denVRoce = (isoDatum: string): number => {
  const d = new Date(`${isoDatum}T00:00:00Z`)
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.floor((d.getTime() - start) / 86_400_000) + 1
}

/**
 * Kalendárium (handoff: pás pod herem homepage): build-time výběr JEDNOHO
 * milníku vzorcem `dayOfYear % n` nad deterministicky seřazeným seznamem.
 * Žádné falešné „přesně dnes" — popiska šablony říká „z milníků historie ·
 * střídá se denně". Prázdný seznam → null (pás se nevykreslí).
 */
export const kalendariumVyber = (
  polozky: KalendariumPolozka[],
  isoDatum: string,
): KalendariumPolozka | null => {
  if (polozky.length === 0) return null
  const cs = new Intl.Collator('cs')
  const serazene = [...polozky].sort(
    (a, b) => a.rok - b.rok || cs.compare(a.chataNazev, b.chataNazev) || cs.compare(a.udalost, b.udalost),
  )
  return serazene[(denVRoce(isoDatum) - 1) % serazene.length]
}

/** Věta kalendária: „Před {rok−Y} lety ({Y}) {událost}." — jazyk dle handoffu. */
export const kalendariumVeta = (polozka: KalendariumPolozka, isoDatum: string): string => {
  const rokDnes = Number(isoDatum.slice(0, 4))
  const pred = rokDnes - polozka.rok
  return `Před ${pred} lety (${polozka.rok}) ${polozka.udalost}`
}
