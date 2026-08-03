import type { CollectionConfig } from 'payload'

import { overeni } from '../fields/overeni'
import { slugField } from '../fields/slug'
import { ZEME_OPTIONS } from './spolecne'

/**
 * Středisko — východiště do hor s mini-stránkou (F1e, rozhodnutí Michala
 * 27. 7. 2026: „střediska = mini-stránky rovnou"). Datový typ dle handoffu
 * `design/handoff-f1/` §3: hero + stat-tiles (chat dostupných odtud, výška
 * obce, rozpětí přístupů) + „Jak se sem dostat".
 *
 * Poctivost jako u chat: povinný je jen název a slug; co není doloženo,
 * se nezapisuje (stat-tile bez zdroje se nevykresluje). Počty chat a rozpětí
 * přístupů se NIKDY neukládají ručně — počítají se při buildu z katalogu
 * přístupových tras (DATA-06) přes shodu `vychoziBody` ↔ výchozí bod trasy.
 * URL: `/[zeme]/[oblast]/strediska/[slug]` (vlastní segment — jinak kolize
 * se slugy chat).
 */
export const Strediska: CollectionConfig = {
  slug: 'strediska',
  labels: { singular: 'Středisko', plural: 'Střediska' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'oblast', 'zeme'],
    group: 'Obsah',
    description:
      'Východiště do hor (Pec, Špindl, Harrachov…). Počty chat a rozpětí přístupů se počítají z tras — neukládají se.',
  },
  access: { read: () => true },
  fields: [
    { name: 'nazev', type: 'text', label: 'Název', required: true },
    slugField(),
    {
      name: 'zeme',
      type: 'select',
      label: 'Země',
      options: ZEME_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'oblast',
      type: 'relationship',
      relationTo: 'oblasti',
      label: 'Pohoří',
    },
    {
      name: 'perex',
      type: 'textarea',
      label: 'Perex',
      admin: { description: 'Hero mini-stránky: 2 věty, jen doložitelné údaje — žádné ceníky ani hodnocení.' },
    },
    // Perex je veřejná próza → musí mít vlastní blok ověření jako každá
    // věcná skupina (doplněno 3. 8. 2026 — do té doby perex neměl kam
    // citovat pramen, proto ho žádné středisko nemělo vyplněné).
    overeni('overeniPerex', { label: 'Ověření perexu' }),
    {
      type: 'row',
      fields: [
        {
          name: 'lat',
          type: 'number',
          label: 'Zeměpisná šířka (lat)',
          min: -90,
          max: 90,
          admin: { width: '33%', step: 0.000001 },
        },
        {
          name: 'lng',
          type: 'number',
          label: 'Zeměpisná délka (lng)',
          min: -180,
          max: 180,
          admin: { width: '33%', step: 0.000001 },
        },
        {
          name: 'vyskaObce',
          type: 'number',
          label: 'Výška obce (m)',
          admin: { width: '33%', description: 'Stat-tile „výška obce" — zdroj ČÚZK do bloku ověření.' },
        },
      ],
    },
    overeni('overeniLokace', { label: 'Ověření lokace (GPS, výška obce)' }),
    {
      name: 'vychoziBody',
      type: 'array',
      label: 'Výchozí body tras',
      labels: { singular: 'Výchozí bod', plural: 'Výchozí body' },
      admin: {
        description:
          'Názvy výchozích bodů z katalogu DATA-06 (data/oblasti/<oblast>/vychozi-body-kandidati.json), ' +
          'které patří k tomuto středisku. Přes ně se při buildu počítá „chat dostupných odtud" ' +
          'a rozpětí přístupů — vazba dat, žádná ručně psaná čísla.',
      },
      fields: [{ name: 'nazev', type: 'text', label: 'Název bodu', required: true }],
    },
    {
      name: 'lanovka',
      type: 'text',
      label: 'Lanovka',
      admin: { description: 'Jen doložený fakt (např. „kabinová lanovka na Sněžku") — bez jízdních řádů.' },
    },
    {
      name: 'doprava',
      type: 'group',
      label: 'Jak se sem dostat',
      admin: { description: 'Fakta o dopravním napojení (vlak/bus/auto) — žádné jízdní řády.' },
      fields: [
        { name: 'vlak', type: 'textarea', label: 'Vlakem' },
        { name: 'bus', type: 'textarea', label: 'Autobusem' },
        { name: 'auto', type: 'textarea', label: 'Autem a parkování' },
      ],
    },
    overeni('overeniDoprava', { label: 'Ověření dopravy' }),
    {
      name: 'interniPoznamky',
      type: 'textarea',
      label: 'Interní poznámky',
      admin: { description: 'Jen pro redakci, nikdy se nezobrazují na webu.' },
    },
  ],
}
