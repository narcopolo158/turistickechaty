import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { overeni } from '../fields/overeni'

/**
 * Razítko — samostatná entita, ne jen obrázek u chaty (plán kap. 5).
 * Umožňuje archiv variant v čase, „chybějící razítka" jako komunitní výzvu
 * a později propojení s deníkem chataře. Kredit dokladatele motivuje komunitu.
 *
 * Komunitní sběr (rozhodnutí Michala 21. 7. 2026): otisk může nahrát sběratel
 * přímo na web — s účtem i bez (host). Moderace jede přes Payload **koncept /
 * publikaci** (`versions.drafts`): komunitní podání vzniká jako koncept a na
 * webu se objeví, teprve až ho redakce publikuje. Veřejné čtení (viz
 * `lib/chaty.ts`) bere jen publikovaná razítka. Veřejný nahrávací formulář se
 * spustí až s nasazením webu; teď je hotové datové a moderační zázemí.
 */
export const Razitka: CollectionConfig = {
  slug: 'razitka',
  labels: { singular: 'Razítko', plural: 'Razítka' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'chata', 'zpusobZiskani', 'stav', '_status'],
    group: 'Obsah',
    description:
      'Katalog turistických razítek — archiv variant v čase. Záznam může existovat i bez otisku (víme o razítku, sháníme sken). Komunitní podání čeká jako koncept, než ho redakce publikuje.',
  },
  // Moderace: koncept = čeká na schválení; publikováno = na webu. Redakční
  // záznamy se rovnou publikují (seed), komunitní podání přijdou jako koncept.
  versions: { drafts: true },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Poctivost + právo: komunitní razítko nesmí být publikováno bez
        // licenčního souhlasu toho, kdo otisk nahrál. Koncepty se ukládat smí.
        if (
          data?._status === 'published' &&
          data?.zpusobZiskani === 'komunitni-podani' &&
          !data?.podani?.licencniSouhlas
        ) {
          throw new APIError(
            'Komunitní razítko nelze publikovat bez licenčního souhlasu nahrávajícího.',
            400,
          )
        }
        // Převzatý otisk (partnerský web se svolením) nesmí jít ven bez uvedení
        // zdroje — atribuce je podmínka svolení i naší poctivosti (DATA-05).
        if (
          data?._status === 'published' &&
          data?.zpusobZiskani === 'prevzato-se-svolenim' &&
          !data?.prevzeti?.zdrojUrl
        ) {
          throw new APIError(
            'Převzaté razítko nelze publikovat bez uvedení zdroje (odkazu na původní web).',
            400,
          )
        }
        return data
      },
    ],
  },
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
      admin: {
        description:
          'Veřejný kredit — redakce, nebo jméno/přezdívka sběratele. U komunitních podání se předvyplní z podání níže.',
      },
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
    // ── Původ a komunitní podání ──────────────────────────────────────────
    {
      name: 'zpusobZiskani',
      type: 'select',
      label: 'Původ záznamu',
      defaultValue: 'redakce',
      options: [
        { label: 'Redakční záznam', value: 'redakce' },
        { label: 'Komunitní podání (nahrál sběratel)', value: 'komunitni-podani' },
        { label: 'Převzato se svolením (partnerský web)', value: 'prevzato-se-svolenim' },
      ],
      admin: {
        description:
          'Komunitní podání čeká jako koncept, dokud ho redakce nepublikuje. Publikovat ho nelze bez licenčního souhlasu níže. Převzaté (partnerský web) nelze publikovat bez odkazu na zdroj.',
      },
    },
    {
      name: 'podani',
      type: 'group',
      label: 'Komunitní podání',
      admin: {
        condition: (data) => data?.zpusobZiskani === 'komunitni-podani',
        description:
          'Kdo otisk nahrál a jeho licenční souhlas. Sběratel může podat s účtem i jako host (bez účtu).',
      },
      fields: [
        {
          name: 'ucet',
          type: 'relationship',
          relationTo: 'users',
          label: 'Účet sběratele',
          admin: {
            description: 'Vyplněno, když otisk nahrál přihlášený sběratel. U hostů zůstane prázdné.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'hostJmeno',
              type: 'text',
              label: 'Jméno (host bez účtu)',
              admin: { width: '50%' },
            },
            {
              name: 'hostEmail',
              type: 'email',
              label: 'E-mail (host)',
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
              'Nahrávající potvrdil, že otisk sám naskenoval / vlastní a uděluje souhlas se zveřejněním s uvedením kreditu (licence „se svolením"). Bez zaškrtnutí nelze publikovat.',
          },
        },
        {
          name: 'souhlasZneni',
          type: 'textarea',
          label: 'Znění souhlasu',
          admin: {
            description: 'Text souhlasu tak, jak byl při nahrání odsouhlasen (pro doložení).',
          },
        },
        {
          name: 'souhlasDatum',
          type: 'date',
          label: 'Datum souhlasu',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } },
        },
      ],
    },
    // ── Převzetí z partnerského webu se svolením ──────────────────────────
    {
      name: 'prevzeti',
      type: 'group',
      label: 'Převzetí se svolením',
      admin: {
        condition: (data) => data?.zpusobZiskani === 'prevzato-se-svolenim',
        description:
          'Otisk převzatý z partnerského webu s jeho svolením. Zdroj (odkaz) se povinně zobrazuje u razítka na webu — bez `zdrojUrl` nelze publikovat.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'zdroj',
              type: 'text',
              label: 'Zdroj (název webu)',
              admin: { width: '50%', placeholder: 'např. razitkuj.cz' },
            },
            {
              name: 'zdrojUrl',
              type: 'text',
              label: 'Odkaz na zdroj (detail razítka)',
              admin: { width: '50%', placeholder: 'https://www.razitkuj.cz/…' },
            },
          ],
        },
        {
          name: 'svolil',
          type: 'text',
          label: 'Kdo a kdy svolil',
          admin: { placeholder: 'např. Robert Šindler (KiBob), 21. 7. 2026' },
        },
      ],
    },
    overeni(),
  ],
}
