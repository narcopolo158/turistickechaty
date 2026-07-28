/**
 * Komunitní sběr otisků razítek a fotek chat — sdílené konstanty a čistá
 * validace pro formulář (/prispet) i API (/api/podani).
 *
 * Právní rámec (rozhodnutí Michala 21. 7. 2026, zázemí v kolekci Razitka):
 * podání čeká jako koncept/čekárna, dokud ho redakce neschválí; publikace
 * bez licenčního souhlasu odesilatele není technicky možná (hooky kolekcí).
 */

/** Znění licenčního souhlasu — ukládá se doslovně k podání (doložitelnost). */
export const SOUHLAS_ZNENI =
  'Potvrzuji, že jsem snímek sám/sama pořídil(a) nebo k němu mám práva, ' +
  'a souhlasím s jeho zveřejněním na turistickechaty.cz s uvedením mého jména ' +
  '(licence „se svolením“). E-mail je neveřejný, slouží jen redakci pro dotazy k podání.'

export const MAX_VELIKOST_B = 8 * 1024 * 1024 // 8 MB
export const POVOLENE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

export type PodaniVstup = {
  druh: string | null
  chataSlug: string | null
  jmeno: string | null
  email: string | null
  poznamka: string | null
  souhlas: boolean
  /** Honeypot — lidé ho nevidí, roboti vyplní. Cokoli ≠ prázdné → tiché zahození. */
  past: string | null
  soubor: { velikost: number; mime: string } | null
}

/** Validace podání — vrací seznam lidsky čitelných chyb (prázdný = OK). */
export const zkontrolujPodani = (v: PodaniVstup): string[] => {
  const chyby: string[] = []
  if (v.druh !== 'razitko' && v.druh !== 'fotka') chyby.push('Vyber, jestli posíláš otisk razítka, nebo fotku chaty.')
  if (!v.chataSlug?.trim()) chyby.push('Vyber chatu, ke které podání patří.')
  if (!v.jmeno?.trim()) chyby.push('Napiš jméno nebo přezdívku — zveřejníme ji jako kredit u snímku.')
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) chyby.push('E-mail nevypadá platně (a klidně ho vynech).')
  if (!v.souhlas) chyby.push('Bez licenčního souhlasu nemůžeme snímek zveřejnit.')
  if (!v.soubor) chyby.push('Přilož snímek (JPEG/PNG/WebP/GIF/HEIC).')
  else {
    if (v.soubor.velikost > MAX_VELIKOST_B) chyby.push('Soubor je větší než 8 MB — zmenši ho, prosím.')
    if (!POVOLENE_MIME.includes(v.soubor.mime)) chyby.push('Tenhle formát neumíme — pošli JPEG, PNG, WebP, GIF nebo HEIC.')
  }
  return chyby
}
