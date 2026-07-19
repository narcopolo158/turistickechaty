import type { CollectionConfig } from 'payload'

import { verejneJenPublikovane } from '../access/verejneCteni'
import { overeni } from '../fields/overeni'
import { slugField } from '../fields/slug'

/**
 * Článek / příběh — volný redakční obsah propojený s chatami a oblastmi
 * (plán kap. 5): historie, rozhovory s chataři, žebříčky, tehdy/dnes.
 */
export const Clanky: CollectionConfig = {
  slug: 'clanky',
  labels: { singular: 'Článek', plural: 'Články' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'publikovano', '_status'],
    group: 'Obsah',
    description: 'Redakční obsah: historie, rozhovory, žebříčky, příběhy zaniklých chat.',
  },
  access: { read: verejneJenPublikovane },
  versions: { drafts: true },
  fields: [
    { name: 'nazev', type: 'text', label: 'Titulek', required: true },
    slugField(),
    {
      name: 'publikovano',
      type: 'date',
      label: 'Datum publikace',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' },
      },
    },
    { name: 'perex', type: 'textarea', label: 'Perex' },
    {
      name: 'uvodniFotka',
      type: 'upload',
      relationTo: 'fotky',
      label: 'Úvodní fotka',
    },
    { name: 'obsah', type: 'richText', label: 'Obsah' },
    {
      name: 'chaty',
      type: 'relationship',
      relationTo: 'chaty',
      hasMany: true,
      label: 'Propojené chaty',
    },
    {
      name: 'oblasti',
      type: 'relationship',
      relationTo: 'oblasti',
      hasMany: true,
      label: 'Propojené oblasti',
    },
    overeni('overeni', {
      admin: { description: 'Zdroje faktů v článku (historická literatura, rozhovory…).' },
    }),
  ],
}
