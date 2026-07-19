import type { CollectionConfig } from 'payload'

import { verejneJenPublikovane } from '../access/verejneCteni'
import { overeni } from '../fields/overeni'
import { slugField } from '../fields/slug'
import { OBTIZNOST_OPTIONS, ZNACENI_OPTIONS } from './spolecne'

/**
 * Výlet — redakční trasa s pořadím zastávek (plán kap. 5).
 * Zastávky odkazují na chaty; přechody chata–chata později využije plánovač.
 */
export const Vylety: CollectionConfig = {
  slug: 'vylety',
  labels: { singular: 'Výlet', plural: 'Výlety' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'typ', 'delkaKm', 'obtiznost', 'oblast'],
    group: 'Obsah',
    description: 'Redakční výlety a přechody. Každá chata má mít aspoň jeden propojený výlet.',
  },
  access: { read: verejneJenPublikovane },
  versions: { drafts: true },
  fields: [
    { name: 'nazev', type: 'text', label: 'Název', required: true },
    slugField(),
    {
      name: 'typ',
      type: 'select',
      label: 'Typ',
      options: [
        { label: 'Okruh', value: 'okruh' },
        { label: 'Přechod', value: 'prechod' },
        { label: 'Tam a zpět', value: 'tam-a-zpet' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'oblast',
      type: 'relationship',
      relationTo: 'oblasti',
      label: 'Oblast',
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'delkaKm', type: 'number', label: 'Délka (km)', admin: { width: '25%', step: 0.1 } },
        { name: 'prevyseni', type: 'number', label: 'Převýšení (m)', admin: { width: '25%' } },
        { name: 'casMin', type: 'number', label: 'Čas (min)', admin: { width: '25%' } },
        {
          name: 'obtiznost',
          type: 'select',
          label: 'Obtížnost',
          options: OBTIZNOST_OPTIONS,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'sezonnost',
      type: 'text',
      label: 'Sezónnost',
      admin: { placeholder: 'např. celoročně / jen v létě / v zimě jen na sněžnicích' },
    },
    {
      name: 'znaceni',
      type: 'select',
      label: 'Převažující značení',
      hasMany: true,
      options: ZNACENI_OPTIONS,
    },
    {
      name: 'gpx',
      type: 'upload',
      relationTo: 'media',
      label: 'GPX soubor',
    },
    { name: 'perex', type: 'textarea', label: 'Perex' },
    {
      name: 'zastavky',
      type: 'array',
      label: 'Pořadí zastávek',
      labels: { singular: 'Zastávka', plural: 'Zastávky' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'typ',
              type: 'select',
              label: 'Typ',
              defaultValue: 'chata',
              options: [
                { label: 'Chata', value: 'chata' },
                { label: 'Vrchol', value: 'vrchol' },
                { label: 'Jiné místo', value: 'misto' },
              ],
              admin: { width: '30%' },
            },
            {
              name: 'chata',
              type: 'relationship',
              relationTo: 'chaty',
              label: 'Chata',
              admin: {
                width: '70%',
                condition: (_data, siblingData) => siblingData?.typ === 'chata',
              },
            },
          ],
        },
        {
          name: 'nazev',
          type: 'text',
          label: 'Název místa',
          admin: {
            description: 'U vrcholů a jiných míst; u chat se bere název chaty.',
            condition: (_data, siblingData) => siblingData?.typ !== 'chata',
          },
        },
        { name: 'poznamka', type: 'text', label: 'Poznámka' },
      ],
    },
    {
      name: 'doprava',
      type: 'group',
      label: 'Doprava',
      fields: [
        { name: 'naStart', type: 'textarea', label: 'Na start' },
        { name: 'zCile', type: 'textarea', label: 'Z cíle' },
      ],
    },
    {
      name: 'etapy',
      type: 'array',
      label: 'Text po etapách',
      labels: { singular: 'Etapa', plural: 'Etapy' },
      fields: [
        { name: 'nadpis', type: 'text', label: 'Nadpis etapy', required: true },
        { name: 'text', type: 'richText', label: 'Text' },
      ],
    },
    overeni(),
  ],
}
