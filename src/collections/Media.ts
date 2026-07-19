import type { CollectionConfig } from 'payload'

/**
 * Obecné soubory — GPX stopy, PDF a podobné přílohy.
 * Fotografie sem nepatří: mají vlastní kolekci Fotky s autorem a licencí.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Soubor', plural: 'Soubory' },
  admin: {
    group: 'Média',
    description: 'GPX stopy a jiné přílohy. Fotky patří do kolekce Fotky (kvůli licencím).',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Popis souboru',
      required: true,
    },
  ],
  upload: true,
}
