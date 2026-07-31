import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { overeni } from '../fields/overeni'
import { revalidujPoSmazani, revalidujPoZmene } from '../hooks/revalidace'

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
        /**
         * FOTO-01: „nevyjasněno" je pracovní stav, ne licence. Dokud se
         * nedoloží, PROČ smí snímek na web, nesmí dostat typ, kterým ho
         * šablony vybírají — jinak by na webu visel historický snímek
         * „protože je starý", což je přesně ta úvaha, kterou rešerše
         * (docs/FOTKY-ZDROJE-A-LICENCE.md) vyvrací.
         */
        const status = data?.pravniStatus ?? originalDoc?.pravniStatus
        if (status === 'nevyjasneno' && data?.typ && data.typ !== 'komunitni-podani') {
          throw new APIError(
            'Fotka s právním statusem „nevyjasněno" se nesmí publikovat — doplň, proč je volná, nebo čí je svolení.',
            400,
          )
        }
        return data
      },
    ],
    // Schválení komunitní fotky mění přehledy — obnovit je hned (ne až za 10 min).
    afterChange: [revalidujPoZmene],
    afterDelete: [revalidujPoSmazani],
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
    /**
     * Předmět snímku, když to není chata (zadání Michala 30. 7. 2026: „mám
     * pro některá střediska a lanovky lepší vlastní fotky — přidej tam
     * i upload ostatních fotek, ať to můžu editovat sám").
     *
     * Středisko je kolekce, takže se váže vztahem. Lanovka kolekce NENÍ —
     * dráhy vznikají z OSM (DATA-32) a mají jen slug v rámci oblasti; váže
     * se proto dvojicí textů. Redakční fotka má u obou přednost před
     * automatickým výběrem z Commons (DATA-33): vlastní snímek od Michala
     * ví o místě víc než algoritmus nad cizím katalogem.
     */
    {
      name: 'stredisko',
      type: 'relationship',
      relationTo: 'strediska',
      label: 'Středisko',
      admin: {
        description: 'Fotka se pak ukáže na kartě i mini-stránce střediska — místo snímku z Commons.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lanovkaOblast',
          type: 'text',
          label: 'Lanovka — oblast',
          admin: {
            width: '50%',
            placeholder: 'krkonose',
            description: 'Lanovka nemá vlastní kolekci (vzniká z OSM) — váže se oblastí a slugem z přehledu lanovek.',
          },
        },
        {
          name: 'lanovkaSlug',
          type: 'text',
          label: 'Lanovka — slug dráhy',
          admin: { width: '50%', placeholder: 'cernohorsky-express' },
        },
      ],
    },
    /**
     * GALERIE OBJEKTU (zadání Michala 31. 7. 2026: „u každé chaty můžeme mít
     * víc fotek — jednu profilovou a pak další").
     *
     * Do teď se profilová fotka poznala tak, že to byla PRVNÍ současná fotka,
     * kterou vrátila databáze. To fungovalo, dokud měla chata jedinou —
     * s galerií by o hlavním snímku rozhodovalo pořadí v joinu, tedy náhoda.
     * `hero` je proto vědomá volba člověka; `poradi` řadí zbytek galerie.
     * Když `hero` nemá žádná fotka, platí staré pravidlo (první současná),
     * takže starší data zůstávají v platnosti.
     */
    {
      type: 'row',
      fields: [
        {
          name: 'hero',
          type: 'checkbox',
          label: 'Profilová fotka',
          admin: {
            width: '50%',
            description: 'Hlavní snímek objektu (hero). Když ji nemá žádná fotka, vezme se první současná.',
          },
        },
        {
          name: 'poradi',
          type: 'number',
          label: 'Pořadí v galerii',
          admin: { width: '50%', description: 'Menší číslo = dřív. Nevyplněné jde na konec.' },
        },
      ],
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
            // Mediabanka CzechTourism: stažení zdarma bez registrace, web
            // povolen komerčně i nekomerčně, ale kredit má PŘEDEPSANÉ znění
            // a platí zákaz systematického a hromadného užití — proto vlastní
            // volba, ne „jiná" (viz docs/FOTKY-ZDROJE-A-LICENCE.md, odd. 4c).
            { label: 'Mediabanka CzechTourism', value: 'mediabanka-czt' },
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
    /**
     * FOTO-01, bod (a) — pole pro HISTORICKÉ snímky (rešerše
     * `docs/FOTKY-ZDROJE-A-LICENCE.md`, zadání Michala 29. 7. 2026: „jak je
     * to s použitím historických fotografií? jaká je hranice pro copyright?").
     *
     * Dosavadní model počítal s Commons a licencí CC — u dobové pohlednice
     * ale nerozhoduje „licence", nýbrž PROČ je dílo volné: majetková práva
     * končí 70 let po smrti autora, u anonymních děl 70 let od zveřejnění.
     * Pohlednice vydaná 1955 a dřív s neznámým autorem je tedy dnes volná,
     * signovaný snímek téhož roku nemusí být. Bez zapsaného důvodu se to za
     * rok nedá přezkoumat a snímek by na webu visel „protože je starý".
     *
     * Klíč z oddílu 3.4 rešerše žádá pět bodů: kde je originál, kdo je autor
     * (i doložené „neznámý"), rok vydání, proč je volný / čí je svolení, a co
     * je na něm. Autora a popis nesou pole výš; zbytek stojí tady. Chybí-li
     * kterýkoli bod, snímek se nepoužije — stejné pravidlo jako u faktů.
     */
    {
      name: 'pravniStatus',
      type: 'select',
      label: 'Právní status (u historických snímků)',
      options: [
        { label: 'Volné dílo — autor zemřel před 70+ lety', value: 'volne-autor' },
        { label: 'Volné dílo — anonym vydaný před 70+ lety', value: 'volne-anonym' },
        { label: 'Volná licence (CC / CC0)', value: 'cc' },
        { label: 'Se svolením držitele originálu', value: 'se-svolenim' },
        { label: 'Nevyjasněno — NEPUBLIKOVAT', value: 'nevyjasneno' },
      ],
      admin: {
        description:
          'Proč smí snímek na web. „Nevyjasněno" je poctivý stav pro rozpracované — takový snímek se nepoužije.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'instituce',
          type: 'text',
          label: 'Kde je originál',
          admin: { width: '50%', placeholder: 'např. Krkonošské muzeum / soukromá sbírka J. N.' },
        },
        {
          name: 'signatura',
          type: 'text',
          label: 'Signatura / inventární číslo',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rokVydani',
          type: 'text',
          label: 'Rok vydání (i odhadem)',
          admin: { width: '50%', placeholder: 'např. 1928 / „před 1945" (z rubu pohlednice)' },
        },
        {
          name: 'puvodOriginalu',
          type: 'text',
          label: 'Podoba originálu',
          admin: { width: '50%', placeholder: 'pohlednice / skleněný negativ / novinový tisk' },
        },
      ],
    },
    {
      name: 'pravniPoznamka',
      type: 'textarea',
      label: 'Odůvodnění a doklad',
      admin: {
        description:
          'Čím je status doložen: „autor A. Novák zemřel 1943", „anonym, vydáno 1928 dle rubu", „svolení sbírky X z 12. 6. 2026". Bez toho se za rok nedá přezkoumat, proč snímek na webu je.',
      },
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
