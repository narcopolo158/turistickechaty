import type { TextField } from 'payload'

/**
 * Písmena bez NFD dekompozice (škrtnutá apod.) — normalize je nerozloží,
 * a bez náhrady by ze slugu vypadla: „Łabski" → „abski". Polské ł je
 * potřeba už pro Krkonoše (DATA-01 bere obě strany), ß/ø/æ/œ/đ přijdou
 * vhod pro Alpy a další přeshraniční pohoří.
 */
const PREPISY: Record<string, string> = {
  ł: 'l',
  ß: 'ss',
  đ: 'd',
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
}

/** Převod názvu (čeština, polština…) na URL slug: diakritika pryč, mezery na pomlčky. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[łßđøæœ]/g, (znak) => PREPISY[znak] ?? znak)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Slug pole s auto-generací z jiného pole (výchozí: `nazev`).
 * Vyplněný slug se nepřepisuje — ruční úprava má přednost,
 * jen se normalizuje do bezpečného tvaru.
 */
export const slugField = (zdroj = 'nazev'): TextField => ({
  name: 'slug',
  type: 'text',
  label: 'Slug (URL)',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Část adresy stránky. Nevyplněný se vytvoří z názvu.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim() !== '') return slugify(value)
        const nazev = data?.[zdroj]
        if (typeof nazev === 'string' && nazev.trim() !== '') return slugify(nazev)
        return value
      },
    ],
  },
})
