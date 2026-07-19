import type { CollectionConfig } from 'payload'

import { overeni } from '../fields/overeni'

/**
 * Razítko — samostatná entita, ne jen obrázek u chaty (plán kap. 5).
 * Umožňuje archiv variant v čase, „chybějící razítka" jako komunitní výzvu
 * a později propojení s deníkem chataře. Kredit dokladatele motivuje komunitu.
 */
export const Razitka: CollectionConfig = {
  slug: 'razitka',
  labels: { singular: 'Razítko', plural: 'Razítka' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'chata', 'stav', 'potvrzeno'],
    group: 'Obsah',
    description:
      'Katalog turistických razítek — archiv variant v čase. Záznam může existovat i bez otisku (víme o razítku, sháníme sken).',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'nazev',
      type: 'text',
      label: 'Označení',
      required: true,
      admin: { placeholder: 'např. Luční bouda — kulaté s kamzíkem (2020)' },
    },
    {
      name: 'chata',
      type: 'relationship',
      relationTo: 'chaty',
      label: 'Chata',
      required: true,
    },
    {
      name: 'otisk',
      type: 'upload',
      relationTo: 'fotky',
      label: 'Otisk (sken / foto)',
      admin: { description: 'Může chybět — chybějící otisky jsou výzva pro komunitu.' },
    },
    {
      name: 'stav',
      type: 'select',
      label: 'Stav',
      options: [
        { label: 'Aktuálně k dispozici', value: 'k-dispozici' },
        { label: 'Dočasně nedostupné', value: 'nedostupne' },
        { label: 'Historické (už se nerazítkuje)', value: 'historicke' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'platnostOd',
          type: 'text',
          label: 'V užívání od',
          admin: { width: '50%', placeholder: 'např. 2018 / „cca 90. léta"' },
        },
        {
          name: 'platnostDo',
          type: 'text',
          label: 'V užívání do',
          admin: { width: '50%', placeholder: 'prázdné = dosud' },
        },
      ],
    },
    {
      name: 'kdeSeRazitkuje',
      type: 'text',
      label: 'Kde se razítkuje',
      admin: { placeholder: 'např. na baru v restauraci, na recepci' },
    },
    {
      name: 'dolozil',
      type: 'text',
      label: 'Doložil(a)',
      admin: { description: 'Redakce, nebo jméno sběratele — kredit motivuje komunitu.' },
    },
    {
      name: 'potvrzeno',
      type: 'date',
      label: 'Naposledy potvrzeno',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' },
        description: 'Kdy někdo naposledy potvrdil, že se razítko na chatě opravdu razítkuje.',
      },
    },
    { name: 'poznamka', type: 'textarea', label: 'Poznámka' },
    overeni(),
  ],
}
