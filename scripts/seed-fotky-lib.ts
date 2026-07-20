/**
 * Čisté pomocné funkce seedu pro fotky chat (stahování z Wikimedia Commons).
 * Oddělený modul bez závislosti na Payloadu — seed-chaty.ts běží celý
 * při importu (payload run), testy proto importují odsud.
 */
import { slugify } from '../src/fields/slug'

/**
 * Název souboru pro upload z URL Commons: dekódovaný poslední segment
 * převedený na bezpečný tvar (diakritika a mezery pryč, přípona zůstává).
 */
export const nazevSouboruZUrl = (url: string): string => {
  const segment = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'fotka')
  const tecka = segment.lastIndexOf('.')
  const [zaklad, pripona] = tecka > 0 ? [segment.slice(0, tecka), segment.slice(tecka)] : [segment, '']
  return slugify(zaklad) + pripona.toLowerCase()
}

/** MIME typ dle přípony — Commons originály jsou JPEG/PNG, jiné nebereme. */
export const mimeTypSouboru = (nazev: string): string => {
  if (/\.png$/i.test(nazev)) return 'image/png'
  if (/\.jpe?g$/i.test(nazev)) return 'image/jpeg'
  throw new Error(`Nepodporovaná přípona fotky: ${nazev} (čekám .jpg/.jpeg/.png)`)
}
