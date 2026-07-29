import type { CollectionConfig } from 'payload'

import { overeni } from '../fields/overeni'
import { slugField } from '../fields/slug'
import { ZEME_OPTIONS } from './spolecne'

/**
 * Oblast — hierarchie země → pohoří → podoblast (plán kap. 5).
 * Oblasti jsou pohledy na databázi: přehled chat a výletů se generuje,
 * ručně se píše jen popis.
 */
export const Oblasti: CollectionConfig = {
  slug: 'oblasti',
  labels: { singular: 'Oblast', plural: 'Oblasti' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'typ', 'nadrazena', 'zeme'],
    group: 'Obsah',
    description: 'Hierarchie země → pohoří → podoblast. Přehledy chat a výletů se generují z dat.',
  },
  access: { read: () => true },
  fields: [
    { name: 'nazev', type: 'text', label: 'Název', required: true },
    slugField(),
    {
      name: 'typ',
      type: 'select',
      label: 'Úroveň',
      required: true,
      options: [
        { label: 'Pohoří', value: 'pohori' },
        { label: 'Podoblast', value: 'podoblast' },
      ],
      admin: { description: 'Země je samostatné pole — hierarchii tvoří pohoří a podoblasti.' },
    },
    {
      name: 'nadrazena',
      type: 'relationship',
      relationTo: 'oblasti',
      label: 'Nadřazená oblast',
      admin: {
        description: 'U podoblasti její pohoří (např. Východní Krkonoše → Krkonoše).',
        condition: (data) => data?.typ === 'podoblast',
      },
    },
    {
      name: 'zeme',
      type: 'select',
      label: 'Země',
      options: ZEME_OPTIONS,
      admin: { position: 'sidebar' },
    },
    { name: 'popis', type: 'richText', label: 'Popis' },
    {
      name: 'charakteristika',
      type: 'textarea',
      label: 'Kurátorská charakteristika',
      admin: {
        description:
          'Hero stránky pohoří (F1): 2–3 věty o charakteru oblasti. Superlativy jen s dokladem ' +
          '(zdroj do bloku ověření níže) — co není doloženo, do textu nepatří.',
      },
    },
    overeni('overeniCharakteristika', {
      label: 'Ověření charakteristiky',
      admin: { description: 'Zdroje tvrzení v kurátorské charakteristice.' },
    }),
    {
      name: 'nejvyssiHora',
      type: 'group',
      label: 'Nejvyšší hora',
      admin: {
        description:
          'Stat-tile stránky pohoří (F1). Bez zdroje se dlaždice nevykresluje — nedomýšlet.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nazev', type: 'text', label: 'Název', admin: { width: '50%' } },
            { name: 'vyska', type: 'number', label: 'Výška (m)', admin: { width: '50%' } },
          ],
        },
        { name: 'source', type: 'text', label: 'Zdroj', admin: { placeholder: 'URL / kniha…' } },
      ],
    },
    {
      name: 'topCile',
      type: 'array',
      label: 'Top cíle oblasti',
      labels: { singular: 'Cíl', plural: 'Cíle' },
      admin: {
        description:
          'Sekce „Top cíle" stránky pohoří (F1): 1 poctivá věta na cíl + volitelná vazba ' +
          'na nejbližší chatu slugem. Kurátorský výběr, žádná hodnocení ani ceny.',
      },
      fields: [
        { name: 'nazev', type: 'text', label: 'Název', required: true },
        { name: 'veta', type: 'text', label: 'Jedna věta (jen doložitelné)' },
        {
          name: 'nejblizChataSlug',
          type: 'text',
          label: 'Nejbližší chata (slug)',
          admin: { description: 'Slug profilu chaty pro odkaz „Nejblíž: …" — jen když je vazba doložená.' },
        },
        { name: 'source', type: 'text', label: 'Zdroj' },
      ],
    },
    {
      name: 'heroFoto',
      type: 'group',
      label: 'Titulní fotka oblasti',
      admin: {
        description:
          'Krajinný snímek do hlavičky stránky pohoří. NENÍ to fotka objektu — ' +
          'u fotek chat musí být doložené, která budova to je (kolekce Fotky), ' +
          'kdežto tady stačí doložená lokalita. Soubory leží v public/foto/pohori/.',
      },
      fields: [
        { name: 'soubor', type: 'text', label: 'Cesta k souboru (od /)' },
        { name: 'nahled', type: 'text', label: 'Cesta k náhledu (menší varianta)' },
        { name: 'alt', type: 'text', label: 'Alternativní popis (co je na snímku)' },
        {
          type: 'row',
          fields: [
            { name: 'autor', type: 'text', label: 'Autor', admin: { width: '50%' } },
            { name: 'autorUrl', type: 'text', label: 'Profil autora', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'licence',
              type: 'select',
              label: 'Licence',
              options: [
                { label: 'Unsplash License', value: 'unsplash' },
                { label: 'Pexels License', value: 'pexels' },
                { label: 'CC BY', value: 'cc-by' },
                { label: 'CC BY-SA', value: 'cc-by-sa' },
                { label: 'CC0', value: 'cc0' },
                { label: 'Volné dílo (public domain)', value: 'pd' },
                { label: 'Se svolením', value: 'se-svolenim' },
                { label: 'Vlastní (redakce)', value: 'vlastni' },
              ],
              admin: { width: '50%' },
            },
            { name: 'zdrojUrl', type: 'text', label: 'Stránka snímku', admin: { width: '50%' } },
          ],
        },
        {
          name: 'popisMista',
          type: 'text',
          label: 'Co je na snímku (jen doložené)',
          admin: {
            description:
              'Píše se jen to, co dokládá popis u zdroje. Když autor budovu nejmenuje, ' +
              'nejmenujeme ji ani my.',
          },
        },
        { name: 'prevzatoDne', type: 'text', label: 'Převzato dne (YYYY-MM-DD)' },
      ],
    },
    {
      name: 'bbox',
      type: 'group',
      label: 'Mapové ohraničení (bbox)',
      admin: {
        description: 'Volitelné ohraničení pro výřez mapy oblasti (WGS84).',
      },
      fields: [
        { type: 'row', fields: [
          { name: 'jihLat', type: 'number', label: 'Jih (min. šířka)', admin: { width: '50%' } },
          { name: 'zapadLng', type: 'number', label: 'Západ (min. délka)', admin: { width: '50%' } },
        ] },
        { type: 'row', fields: [
          { name: 'severLat', type: 'number', label: 'Sever (max. šířka)', admin: { width: '50%' } },
          { name: 'vychodLng', type: 'number', label: 'Východ (max. délka)', admin: { width: '50%' } },
        ] },
      ],
    },
    overeni(),
  ],
}
