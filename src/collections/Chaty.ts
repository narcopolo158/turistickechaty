import type { CollectionConfig } from 'payload'

import { verejneJenPublikovane } from '../access/verejneCteni'
import { overeni } from '../fields/overeni'
import { slugField } from '../fields/slug'
import { ANO_NE_OPTIONS, OBTIZNOST_OPTIONS, ZEME_OPTIONS, ZNACENI_OPTIONS } from './spolecne'

const sluzba = (name: string, label: string) => ({
  name,
  type: 'select' as const,
  label,
  options: ANO_NE_OPTIONS,
  admin: { width: '25%', description: 'Nevyplněno = nezjištěno.' },
})

/**
 * Chata — centrální entita webu (plán kap. 5).
 *
 * Skupiny údajů drží taby; každá věcná skupina nese vlastní blok ověření
 * (source / verified / checked), protože se ověřuje jako celek — jeden
 * telefonát potvrdí otvíračku i kontakty. Povinný je jen název a slug:
 * co není doloženo, se nezapisuje.
 */
export const Chaty: CollectionConfig = {
  slug: 'chaty',
  labels: { singular: 'Chata', plural: 'Chaty' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'typ', 'stav', 'oblast', 'zeme'],
    group: 'Obsah',
    description:
      'Centrální entita webu. Žádný profil nejde ven poloprázdný — rozpracované drží koncept (draft).',
  },
  access: { read: verejneJenPublikovane },
  versions: { drafts: true },
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
      name: 'typ',
      type: 'select',
      label: 'Typ objektu',
      options: [
        { label: 'Obsluhovaná chata', value: 'obsluhovana' },
        { label: 'Útulna (neobsluhovaná)', value: 'utulna' },
        { label: 'Bivak (nouzový přístřešek)', value: 'bivak' },
        { label: 'Horský hotel v roli chaty', value: 'horsky-hotel' },
      ],
      admin: { position: 'sidebar', description: 'Taxonomie dle plánu kap. 5.' },
    },
    {
      name: 'stav',
      type: 'select',
      label: 'Stav',
      options: [
        { label: 'V provozu', value: 'v-provozu' },
        { label: 'Dočasně mimo provoz', value: 'mimo-provoz' },
        { label: 'Zaniklá', value: 'zanikla' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identifikace',
          fields: [
            {
              name: 'aliasy',
              type: 'array',
              label: 'Aliasy a historické názvy',
              labels: { singular: 'Název', plural: 'Názvy' },
              fields: [
                { name: 'nazev', type: 'text', label: 'Název', required: true },
                { name: 'poznamka', type: 'text', label: 'Poznámka (např. období)' },
              ],
            },
          ],
        },
        {
          label: 'Lokace',
          fields: [
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
                  name: 'vyska',
                  type: 'number',
                  label: 'Nadmořská výška (m)',
                  admin: { width: '33%' },
                },
              ],
            },
            {
              name: 'oblast',
              type: 'relationship',
              relationTo: 'oblasti',
              label: 'Pohoří / podoblast',
            },
            { name: 'obec', type: 'text', label: 'Nejbližší obec' },
            overeni('overeniLokace'),
          ],
        },
        {
          label: 'Nocleh',
          fields: [
            {
              name: 'nocleh',
              type: 'select',
              label: 'Nocleh',
              options: ANO_NE_OPTIONS,
              admin: { description: 'Nevyplněno = nezjištěno.' },
            },
            {
              name: 'pokoje',
              type: 'array',
              label: 'Typy pokojů',
              labels: { singular: 'Typ pokoje', plural: 'Typy pokojů' },
              admin: { condition: (data) => data?.nocleh === 'ano' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'typ', type: 'text', label: 'Typ (např. vícelůžkový)', admin: { width: '50%' } },
                    { name: 'luzek', type: 'number', label: 'Počet lůžek', admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'kapacita', type: 'number', label: 'Celková kapacita (lůžek)', admin: { width: '50%' } },
                {
                  name: 'cenyOrientacne',
                  type: 'text',
                  label: 'Ceny orientačně',
                  admin: { width: '50%', placeholder: 'např. od 450 Kč/os.' },
                },
              ],
            },
            { name: 'rezervaceUrl', type: 'text', label: 'Odkaz na rezervaci' },
            overeni('overeniNocleh'),
          ],
        },
        {
          label: 'Občerstvení',
          fields: [
            {
              name: 'kuchyne',
              type: 'select',
              label: 'Kuchyně',
              options: ANO_NE_OPTIONS,
              admin: { description: 'Nevyplněno = nezjištěno.' },
            },
            {
              name: 'typObcerstveni',
              type: 'select',
              label: 'Typ občerstvení',
              options: [
                { label: 'Restaurace', value: 'restaurace' },
                { label: 'Bufet', value: 'bufet' },
                { label: 'Kiosek', value: 'kiosek' },
              ],
              admin: { condition: (data) => data?.kuchyne === 'ano' },
            },
            { name: 'specialita', type: 'text', label: 'Specialita' },
            overeni('overeniObcerstveni'),
          ],
        },
        {
          label: 'Služby',
          fields: [
            {
              type: 'row',
              fields: [
                sluzba('voda', 'Pitná voda'),
                sluzba('wc', 'WC'),
                sluzba('sprchy', 'Sprchy'),
                sluzba('platbaKartou', 'Platba kartou'),
              ],
            },
            {
              type: 'row',
              fields: [
                sluzba('wifi', 'Wi-Fi'),
                sluzba('psi', 'Psi vítáni'),
                sluzba('nabijeni', 'Nabíjení'),
                sluzba('lyzarna', 'Lyžárna'),
              ],
            },
            overeni('overeniSluzby'),
          ],
        },
        {
          label: 'Provoz',
          fields: [
            { name: 'sezona', type: 'text', label: 'Sezóna', admin: { placeholder: 'např. celoročně / červen–září' } },
            { name: 'otviraciDoba', type: 'textarea', label: 'Otvírací doba' },
            { name: 'zimniProvoz', type: 'textarea', label: 'Zimní provoz' },
            {
              name: 'kontakty',
              type: 'group',
              label: 'Kontakty',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'telefon', type: 'text', label: 'Telefon', admin: { width: '50%' } },
                    { name: 'email', type: 'text', label: 'E-mail', admin: { width: '50%' } },
                  ],
                },
                { name: 'web', type: 'text', label: 'Web' },
                {
                  type: 'row',
                  fields: [
                    { name: 'facebook', type: 'text', label: 'Facebook', admin: { width: '50%' } },
                    { name: 'instagram', type: 'text', label: 'Instagram', admin: { width: '50%' } },
                  ],
                },
              ],
            },
            overeni('overeniProvoz'),
          ],
        },
        {
          label: 'Přístup',
          fields: [
            {
              name: 'trasy',
              type: 'array',
              label: 'Přístupové trasy',
              labels: { singular: 'Trasa', plural: 'Trasy' },
              fields: [
                { name: 'vychoziBod', type: 'text', label: 'Výchozí bod', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'casMin', type: 'number', label: 'Čas (min)', admin: { width: '33%' } },
                    { name: 'prevyseni', type: 'number', label: 'Převýšení (m)', admin: { width: '33%' } },
                    {
                      name: 'znaceni',
                      type: 'select',
                      label: 'Značení',
                      options: ZNACENI_OPTIONS,
                      admin: { width: '33%' },
                    },
                  ],
                },
                {
                  name: 'obtiznost',
                  type: 'select',
                  label: 'Obtížnost',
                  options: OBTIZNOST_OPTIONS,
                },
                { name: 'poznamka', type: 'text', label: 'Poznámka' },
                { name: 'delkaKm', type: 'number', label: 'Délka (km)', min: 0 },
                {
                  name: 'vyskovyProfil',
                  type: 'json',
                  label: 'Výškový profil (body trasy)',
                  admin: {
                    description:
                      'Pole dvojic [km, výška v m]: [[0, 769], [1.2, 850], …]. Zdroj bodů patří do ověření skupiny Přístup — nedomýšlet.',
                  },
                  validate: (value: unknown) => {
                    if (value == null) return true
                    const ok =
                      Array.isArray(value) &&
                      value.length >= 2 &&
                      value.every(
                        (b) =>
                          Array.isArray(b) &&
                          b.length === 2 &&
                          typeof b[0] === 'number' &&
                          typeof b[1] === 'number',
                      )
                    return ok || 'Očekávám pole dvojic [km, výška], nejméně 2 body.'
                  },
                },
              ],
            },
            { name: 'autem', type: 'textarea', label: 'Autem a parkování' },
            { name: 'lanovka', type: 'text', label: 'Lanovka' },
            {
              name: 'verejnaDoprava',
              type: 'group',
              label: 'Veřejná doprava',
              fields: [
                { name: 'zastavka', type: 'text', label: 'Nejbližší zastávka' },
                { name: 'idosUrl', type: 'text', label: 'Odkaz na IDOS' },
              ],
            },
            overeni('overeniPristup'),
          ],
        },
        {
          label: 'Historie',
          fields: [
            { name: 'rokVzniku', type: 'number', label: 'Rok vzniku' },
            {
              name: 'milniky',
              type: 'array',
              label: 'Časová osa milníků',
              labels: { singular: 'Milník', plural: 'Milníky' },
              admin: { description: 'Přestavby, požáry, přejmenování…' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'rok', type: 'number', label: 'Rok', admin: { width: '25%' } },
                    { name: 'udalost', type: 'text', label: 'Událost', required: true, admin: { width: '75%' } },
                  ],
                },
              ],
            },
            { name: 'historieText', type: 'richText', label: 'Historie (text)' },
            overeni('overeniHistorie'),
          ],
        },
        {
          label: 'Obsah a média',
          fields: [
            {
              name: 'perex',
              type: 'textarea',
              label: 'Perex',
              admin: { description: 'Krátké představení pro karty a náhledy (1–2 věty).' },
            },
            {
              name: 'text',
              type: 'richText',
              label: 'Živý text profilu',
              admin: { description: '2–4 odstavce: charakter místa, co si dát, kdy přijít.' },
            },
            {
              name: 'zajimavosti',
              type: 'array',
              label: 'Zajímavosti a rekordy',
              labels: { singular: 'Zajímavost', plural: 'Zajímavosti' },
              admin: {
                description:
                  'Krátké pozoruhodné údaje a „nej" (nejstarší, nejvýše položená, největší, unikátní specialita…) pro budoucí žebříčky rekordů i highlight na profilu. Sbírej je rovnou při zjišťování dat. Superlativ = tvrzení → uveď zdroj, nedomýšlet. Spočitatelná „nej" (dle rokVzniku/výšky/kapacity) sem psát nemusíš — vezmou se z polí.',
              },
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  label: 'Zajímavost',
                  required: true,
                  admin: { placeholder: 'např. „Nejvýše položené restaurační zařízení v Čechách"' },
                },
                {
                  name: 'kategorie',
                  type: 'select',
                  label: 'Kategorie „nej" (volitelné)',
                  options: [
                    { label: 'Stáří / historie', value: 'stari' },
                    { label: 'Nadmořská výška', value: 'vyska' },
                    { label: 'Velikost / kapacita', value: 'velikost' },
                    { label: 'Gastronomie / specialita', value: 'gastro' },
                    { label: 'Jiné', value: 'jine' },
                  ],
                  admin: { description: 'Pro řazení do žebříčků „nej" (volitelné).' },
                },
                {
                  name: 'zdroj',
                  type: 'text',
                  label: 'Zdroj',
                  admin: { description: 'Odkud údaj/tvrzení pochází (web, provozovatel, kniha). Superlativ bez zdroje nezapisovat.' },
                },
              ],
            },
            {
              name: 'fotky',
              type: 'join',
              collection: 'fotky',
              on: 'chata',
              label: 'Fotky',
            },
            { name: 'webkamera', type: 'text', label: 'Webkamera (URL)' },
          ],
        },
        {
          label: 'Vztahy',
          fields: [
            {
              name: 'sousedniChaty',
              type: 'array',
              label: 'Sousední chaty',
              labels: { singular: 'Sousední chata', plural: 'Sousední chaty' },
              admin: {
                description: 'Základ grafu pro plánovač přechodů — čas pěšího přechodu mezi chatami.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'chata',
                      type: 'relationship',
                      relationTo: 'chaty',
                      label: 'Chata',
                      required: true,
                      admin: { width: '60%' },
                    },
                    { name: 'casPrechodMin', type: 'number', label: 'Čas přechodu (min)', admin: { width: '40%' } },
                  ],
                },
              ],
            },
            {
              name: 'razitka',
              type: 'join',
              collection: 'razitka',
              on: 'chata',
              label: 'Razítka',
            },
            {
              name: 'clanky',
              type: 'join',
              collection: 'clanky',
              on: 'chaty',
              label: 'Články',
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'zdroje',
              type: 'array',
              label: 'Zdroje údajů',
              labels: { singular: 'Zdroj', plural: 'Zdroje' },
              admin: { description: 'Souhrn hlavních zdrojů celého profilu.' },
              fields: [
                { name: 'popis', type: 'text', label: 'Popis', required: true },
                { name: 'url', type: 'text', label: 'URL' },
              ],
            },
            {
              name: 'interniPoznamky',
              type: 'textarea',
              label: 'Interní poznámky',
              admin: { description: 'Jen pro redakci, nikdy se nezobrazují na webu.' },
            },
          ],
        },
      ],
    },
  ],
}
