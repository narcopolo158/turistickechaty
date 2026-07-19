import type { GroupField } from 'payload'

/**
 * Sdílený blok ověření údajů — jádro datové důvěryhodnosti webu.
 *
 * Pravidlo z CLAUDE.md: každý údaj má `source` (URL / „telefonát" / kniha),
 * `verified: true|false` a `checked: YYYY-MM-DD`. Fakta se nikdy nedomýšlejí —
 * co není doloženo, zůstává `verified: false`, nebo se nezapisuje vůbec.
 *
 * Blok se vkládá ke každé tematické skupině údajů (lokace, nocleh, provoz…),
 * protože tak se data reálně ověřují — jeden telefonát potvrdí otvíračku
 * i kontakty najednou. Jméno musí být na úrovni dokumentu unikátní
 * (taby bez `name` sdílejí jednu úroveň), proto se předává parametrem.
 */
export const overeni = (name = 'overeni', overrides: Partial<GroupField> = {}): GroupField => ({
  name,
  type: 'group',
  label: 'Ověření údajů',
  admin: {
    description:
      'Odkud údaje v této skupině pocházejí a kdy byly naposledy ověřeny. Nikdy nedomýšlet fakta.',
    ...(overrides.admin ?? {}),
  },
  fields: [
    {
      name: 'source',
      type: 'text',
      label: 'Zdroj',
      admin: {
        placeholder: 'URL / „telefonát 12. 8." / kniha (str.)…',
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      label: 'Ověřeno',
      defaultValue: false,
    },
    {
      name: 'checked',
      type: 'date',
      label: 'Zkontrolováno dne',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' },
      },
    },
  ],
  ...Object.fromEntries(Object.entries(overrides).filter(([k]) => k !== 'admin')),
})
