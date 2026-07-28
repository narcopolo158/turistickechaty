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

/**
 * Zmenšení snímku PŘED odesláním (canvas): telefonní fotky mají běžně 4–12 MB
 * a upload z hor po mobilních datech je pomalý — navíc reverse proxy před
 * aplikací mívá vlastní strop na velikost těla požadavku (typicky 1–10 MB),
 * který se projeví jako nečitelná chyba. Web stejně servíruje nejvýš 1600 px,
 * takže 2400 px dlouhé hrany je s rezervou dost i pro redakční posouzení.
 *
 * Poctivost: nezdaří-li se zmenšení (HEIC bez podpory dekodéru, malý soubor,
 * výsledek by byl větší), vrací se PŮVODNÍ soubor — nikdy se nic nezahodí.
 */
export const MAX_HRANA_PX = 2400
export const ZMENSOVAT_NAD_B = 1_200_000

export const zmensiObrazek = async (soubor: File): Promise<File> => {
  if (soubor.size <= ZMENSOVAT_NAD_B) return soubor
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return soubor
  try {
    const bitmap = await createImageBitmap(soubor)
    const merit = Math.min(1, MAX_HRANA_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * merit))
    canvas.height = Math.max(1, Math.round(bitmap.height * merit))
    const ctx = canvas.getContext('2d')
    if (!ctx) return soubor
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob || blob.size >= soubor.size) return soubor
    return new File([blob], soubor.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return soubor // nedekódovatelný formát (HEIC v některých prohlížečích) → pošle se originál
  }
}
