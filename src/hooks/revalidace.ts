import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Po redakčním zásahu (schválení komunitní fotky, publikace razítka, úprava
 * profilu) obnovit statické stránky HNED — jinak přehled ukazuje starý stav
 * až do vypršení `revalidate` (katalog 10 min, homepage hodinu). Profil chaty
 * se renderuje na vyžádání, takže se změna projeví okamžitě; přehledy ne,
 * a přesně to Michal 28. 7. 2026 viděl u hero fotky Labské boudy.
 *
 * Poctivost k prostředí: `revalidatePath` existuje jen v Next runtime. Seed
 * i skripty běží mimo něj, proto se import dělá dynamicky a případná chyba
 * se spolkne — datová operace se kvůli obnově cache NIKDY nesmí zvrtnout.
 */

/** Stránky, které nesou souhrny nad všemi profily (počty, karty, žebříčky). */
const SOUHRNNE_CESTY = ['/', '/chaty', '/razitkovnik', '/zanikle', '/prispet']

export const revaliduj = async (cesty: string[]): Promise<void> => {
  try {
    const { revalidatePath } = await import('next/cache')
    for (const cesta of cesty) revalidatePath(cesta)
  } catch {
    // mimo Next runtime (seed, CLI skripty) — obnova cache tam nedává smysl
  }
}

/** Cesta profilu chaty z dokumentu (potřebuje zemi a oblast — jinak null). */
const cestaProfilu = (chata: unknown): string | null => {
  if (!chata || typeof chata !== 'object') return null
  const c = chata as { slug?: string; zeme?: string; oblast?: { slug?: string } | number | null }
  const zeme = c.zeme === 'pl' ? 'polsko' : c.zeme === 'cz' ? 'cesko' : null
  const oblast = typeof c.oblast === 'object' && c.oblast ? c.oblast.slug : null
  return zeme && oblast && c.slug ? `/${zeme}/${oblast}/${c.slug}` : null
}

/** Hook pro kolekce, jejichž změna mění souhrny (Fotky, Razitka, Chaty…). */
export const revalidujPoZmene: CollectionAfterChangeHook = async ({ doc }) => {
  const cesty = [...SOUHRNNE_CESTY]
  const profil = cestaProfilu(doc) ?? cestaProfilu((doc as { chata?: unknown })?.chata)
  if (profil) cesty.push(profil)
  // Stránka pohoří té chaty, které se změna týká. Do 31. 7. 2026 tu byla
  // `/cesko/krkonose` napevno: po přidání Jizerských hor by se jejich
  // rozcestník po editaci nikdy nepřegeneroval, kdežto krkonošský by se
  // přegeneroval i kvůli změně v jiné oblasti.
  const oblastProfilu = profil?.split('/')[2]
  if (oblastProfilu) cesty.push(`/cesko/${oblastProfilu}`)
  await revaliduj(cesty)
  return doc
}

export const revalidujPoSmazani: CollectionAfterDeleteHook = async ({ doc }) => {
  await revaliduj(SOUHRNNE_CESTY)
  return doc
}
