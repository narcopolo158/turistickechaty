import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { overeni } from '../fields/overeni'

/**
 * Fotka — každá nese autora, licenci a zdrojové URL (plán kap. 7).
 * Žádné fotky z Google Maps ani Mapy.com; u převzatých se atribuce
 * zobrazuje přímo u fotky na webu.
 */
export const Fotky: CollectionConfig = {
  slug: 'fotky',
  labels: { singular: 'Fotka', plural: 'Fotky' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'typ', 'autor', 'licence', 'chata'],
    group: 'Média',
    description:
      'Každá fotka má autora a licenci; převzaté i zdrojové URL. Fotky z Google Maps a Mapy.com se nepoužívají nikdy.',
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Komunitní fotka nesmí být schválena (typ přepnut mimo čekárnu) bez
        // licenčního souhlasu odesilatele — stejná brána jako u razítek.
        const byloPodani =
          originalDoc?.typ === 'komunitni-podani' || Boolean(originalDoc?.podani?.hostJmeno) || Boolean(data?.podani?.hostJmeno)
        if (byloPodani && data?.typ && data.typ !== 'komunitni-podani' && !data?.podani?.licencniSouhlas) {
          throw new APIError('Komunitní fotku nelze schválit bez licenčního souhlasu odesilatele.', 400)
        }
        return data
      },
    ],
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'nahled', width: 480, height: 320, position: 'centre' },
      { name: 'karta', width: 800 },
      { name: 'velka', width: 1600 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Popisek (alt)',
      required: true,
    },
    {
      name: 'typ',
      type: 'select',
      label: 'Typ',
      options: [
        { label: 'Současná fotografie', value: 'soucasna' },
        { label: 'Dobová pohlednice / archivní snímek', value: 'dobova' },
        { label: 'Otisk razítka', value: 'otisk-razitka' },
        { label: 'Ilustrační / atmosférická', value: 'ilustracni' },
        // Komunitní podání ČEKÁ na posouzení: šablony vybírají fotky podle
        // typu (hero = soucasna, otisk přes publikované razítko), takže
        // podání s tímhle typem se na webu NIKDE nekreslí. Schválení =
        // redakce po kontrole přepne typ (a tím fotku pustí do výběrů).
        { label: 'Komunitní podání (čeká na posouzení)', value: 'komunitni-podani' },
      ],
    },
    {
      name: 'chata',
      type: 'relationship',
      relationTo: 'chaty',
      label: 'Chata',
      admin: { description: 'Fotka se pak sama nabídne v profilu chaty.' },
    },
    {
      name: 'datovani',
      type: 'text',
      label: 'Datování snímku',
      admin: { placeholder: 'např. 2024 / „cca 1935" / léto 2019' },
    },
    { name: 'autor', type: 'text', label: 'Autor', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'licence',
          type: 'select',
          label: 'Licence',
          required: true,
          options: [
            { label: 'Vlastní (redakce)', value: 'vlastni' },
            { label: 'Se svolením (chatař, sběratel…)', value: 'se-svolenim' },
            { label: 'CC BY', value: 'cc-by' },
            { label: 'CC BY-SA', value: 'cc-by-sa' },
            { label: 'CC0', value: 'cc0' },
            { label: 'Volné dílo (public domain)', value: 'pd' },
            { label: 'Jiná (viz poznámka)', value: 'jina' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'licencePoznamka',
          type: 'text',
          label: 'Upřesnění licence',
          admin: { width: '50%', placeholder: 'např. CC BY-SA 4.0 / znění svolení' },
        },
      ],
    },
    {
      name: 'zdrojUrl',
      type: 'text',
      label: 'Zdrojové URL',
      admin: { description: 'U převzatých fotek povinné (Wikimedia Commons apod.).' },
    },
    {
      name: 'prevzatoDne',
      type: 'date',
      label: 'Datum převzetí',
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } },
    },
    overeni('overeni', {
      admin: { description: 'Ověření licence a autorství (kdo a kdy je zkontroloval).' },
    }),
    // ── Komunitní podání (fotka od návštěvníka webu) ──────────────────────
    {
      name: 'podani',
      type: 'group',
      label: 'Komunitní podání',
      admin: {
        condition: (data) => data?.typ === 'komunitni-podani' || Boolean(data?.podani?.hostJmeno),
        description:
          'Kdo fotku poslal a jeho licenční souhlas. Schválení = po kontrole přepnout Typ (tím se fotka pustí do výběrů šablon) — bez souhlasu to hook nedovolí.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'hostJmeno', type: 'text', label: 'Jméno', admin: { width: '50%' } },
            {
              name: 'hostEmail',
              type: 'email',
              label: 'E-mail',
              admin: { width: '50%', description: 'Neveřejné — jen pro redakci (kontakt k podání).' },
            },
          ],
        },
        {
          name: 'licencniSouhlas',
          type: 'checkbox',
          label: 'Licenční souhlas udělen',
          defaultValue: false,
          admin: {
            description:
              'Odesilatel potvrdil, že snímek sám pořídil / má k němu práva a souhlasí se zveřejněním s uvedením jména (licence „se svolením").',
          },
        },
        { name: 'souhlasZneni', type: 'textarea', label: 'Znění souhlasu' },
        {
          name: 'souhlasDatum',
          type: 'date',
          label: 'Datum souhlasu',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } },
        },
      ],
    },
  ],
}
