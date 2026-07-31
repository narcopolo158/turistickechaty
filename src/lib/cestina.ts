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
export type Pad = 'prvni' | 'ctvrty'

/**
 * Tvar slova „chata" k číslovce: „1 chata / 2 chaty / 5 chat" (1. pád),
 * „1 chatu / 2 chaty / 5 chat" (4. pád — „vedeme N chat").
 */
export const tvarChaty = (pocet: number, pad: Pad = 'prvni'): string => {
  const n = Math.abs(pocet)
  if (n === 1) return pad === 'prvni' ? 'chata' : 'chatu'
  if (n >= 2 && n <= 4) return 'chaty'
  return 'chat'
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
