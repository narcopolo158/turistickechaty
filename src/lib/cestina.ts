/**
 * Skloňování v číslovkách — jedno místo, ať to nemusí řešit každá šablona.
 *
 * PROČ VZNIKLO (31. 7. 2026): apel na homepage skládal větu „{n} chat vedeme
 * bez doloženého razítka" s tvarem „chat" napevno. Dokud byla chata bez razítka
 * jediná, věta zněla „1 chat vedeme…" — což je taky špatně, jen to nebylo tak
 * slyšet. Po přidání Jizerských hor vyšlo „2 chat vedeme…" a bylo to na první
 * pohled. Čeština má tři tvary a hranice mezi nimi je 1 / 2–4 / 5+.
 */

/** Pád, ve kterém věta počítaný předmět potřebuje. */
export type Pad = 'prvni' | 'druhy' | 'ctvrty'

/**
 * Tvar slova „chata" k číslovce: „1 chata / 2 chaty / 5 chat" (1. pád),
 * „u 1 chaty / u 2 chat / u 5 chat" (2. pád — po předložce „u", „bez"),
 * „1 chatu / 2 chaty / 5 chat" (4. pád — „vedeme N chat").
 */
export const tvarChaty = (pocet: number, pad: Pad = 'prvni'): string => {
  const n = Math.abs(pocet)
  // 2. pád má jen dva tvary: jednotné „chaty", množné „chat" — a to i u dvou
  // („u 2 chat"), kde 1. a 4. pád ještě říkají „chaty".
  if (pad === 'druhy') return n === 1 ? 'chaty' : 'chat'
  if (n === 1) return pad === 'prvni' ? 'chata' : 'chatu'
  if (n >= 2 && n <= 4) return 'chaty'
  return 'chat'
}

/**
 * Celá vazba „je 1 autobusová zastávka / jsou 2 autobusové zastávky /
 * je 11 autobusových zastávek" — pro blok „Jak se sem dostat".
 *
 * Sloveso i přívlastek se v ní mění spolu s podstatným jménem, takže je
 * nemá smysl skládat po kusech: u pětky a výš se počítaný předmět stává
 * podmětem v 2. pádě a sloveso spadne zpátky do jednotného čísla.
 */
export const jeAutobusovaZastavka = (pocet: number): string => {
  const n = Math.abs(pocet)
  if (n === 1) return 'je 1 autobusová zastávka'
  if (n >= 2 && n <= 4) return `jsou ${n} autobusové zastávky`
  return `je ${n} autobusových zastávek`
}

/**
 * Tvar slova „profil": „1 profil / 2 profily / 5 profilů".
 */
export const tvarProfily = (pocet: number): string => {
  const n = Math.abs(pocet)
  if (n === 1) return 'profil'
  if (n >= 2 && n <= 4) return 'profily'
  return 'profilů'
}

/** Oblast tak, jak o ní potřebuje mluvit věta na webu. */
export type OblastVeVete = {
  nazev: string
  typ?: 'pohori' | 'podoblast' | 'turisticka-oblast' | null
  /** 2. pád (koho/čeho) — „Krkonoš", „Jizerských hor". */
  druhy?: string | null
  /** 6. pád (o kom/čem) — „Krkonoších", „Jizerských horách". */
  sesty?: string | null
}

/**
 * Výčet do české věty: „Krkonoše", „Krkonoše a Jizerské hory", „A, B a C".
 * (Kopie `spojVyctem` z lib/chaty — tady bez závislosti na Payloadu.)
 */
const spoj = (polozky: string[]): string =>
  polozky.length <= 1
    ? (polozky[0] ?? '')
    : `${polozky.slice(0, -1).join(', ')} a ${polozky[polozky.length - 1]}`

/**
 * „v Krkonoších a Jizerských horách" — místní určení z názvů oblastí.
 *
 * PROČ NE PROSTĚ ŠABLONA: čeština název neskloní algoritmem (Krkonoše jsou
 * pomnožné, Jizerské hory dvouslovné, Český ráj mužský), a psát tvar do
 * šablony znamená, že po přidání další oblasti věta tiše lže — přesně jako
 * když stránka Jizerek ukazovala krkonošskou mapu. Tvary proto přicházejí
 * z dat oblasti (`sklonovani.sesty`).
 *
 * Když tvar u některé oblasti chybí, věta se NEZKOMOLÍ: přepne se na vazbu,
 * které stačí 1. pád („v oblastech Krkonoše a Jizerské hory"). Radši
 * úřednější, ale správně.
 */
export const vOblastech = (oblasti: OblastVeVete[]): string => {
  if (oblasti.length === 0) return ''
  const tvary = oblasti.map((o) => o.sesty).filter((s): s is string => !!s)
  if (tvary.length === oblasti.length) return `v ${spoj(tvary)}`
  return `v ${oblasti.length === 1 ? 'oblasti' : 'oblastech'} ${spoj(oblasti.map((o) => o.nazev))}`
}

/**
 * Souhrnné pojmenování živých oblastí: „pohoří", dokud jsou opravdu všechna
 * pohoří, jinak neutrální „oblast". Podoblast se počítá k pohořím.
 *
 * PROČ SE TO POČÍTÁ: rozcestník i popisky mluví o „pohořích". Až na web
 * přijde Český ráj (v datech `turisticka-oblast`, protože pohoří není),
 * začala by ta slova lhát — a nikdo by si toho nevšiml, protože nic
 * nespadne. Slovo „pohoří" navíc nemá v žádném pádu ani čísle jiný tvar,
 * takže věty s ním skloňování neřeší; „oblast" ho potřebuje.
 *
 * `pocet` je tvar po číslovce: 1 oblast / 2 oblasti / 5 oblastí.
 */
export const tvarOblasti = (
  oblasti: OblastVeVete[],
  pad: 'prvni' | 'sesty' | 'pocet' = 'prvni',
): string => {
  const vsechnyPohori = oblasti.length > 0 && oblasti.every((o) => o.typ !== 'turisticka-oblast')
  if (vsechnyPohori) return 'pohoří'
  if (pad === 'sesty') return 'oblastech'
  if (pad === 'prvni') return 'oblasti'
  const n = oblasti.length
  if (n === 1) return 'oblast'
  return n >= 2 && n <= 4 ? 'oblasti' : 'oblastí'
}
