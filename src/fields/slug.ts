import type { TextField } from 'payload'

/** Převod českého názvu na URL slug: diakritika pryč, mezery na pomlčky. */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
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
