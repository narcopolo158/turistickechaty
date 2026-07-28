/**
 * DATA-05: parser checklistu razítek razitkuj.cz (odkazy na detail dle URL vzorů,
 * stránkování se zastavením na prázdné) + párování razítek s naším katalogem
 * chat (normalizace názvu, silná shoda, kandidáti na dohledání). Bez sítě —
 * HTML i checklist se podvrhují.
 */
import { describe, expect, it } from 'vitest'

import {
  jeDetailRazitka,
  parsujStranku,
  posbirejChecklist,
  rozdelPocet,
  strankaUrl,
} from '../../scripts/data05-razitkuj-checklist'
import {
  normalizuj,
  ocistiNazevRazitka,
  shodaNazvu,
  sparuj,
  typShodyNazvu,
  type Chata,
  type PotvrzeneParovani,
} from '../../scripts/data05-razitkuj-parovani'
import { otiskyZDetailu } from '../../scripts/data05-razitkuj-otisky'
import { razitkoZaznam } from '../../scripts/data05-razitkuj-zaloz'

describe('DATA-05 · rozpoznání odkazu na detail razítka', () => {
  it('bere obě URL vzory detailu, ostatní ne', () => {
    expect(jeDetailRazitka('/5469_bouda-bile-labe')).toBe(true)
    expect(jeDetailRazitka('/misto-bilikova-chata/1')).toBe(true)
    expect(jeDetailRazitka('/')).toBe(false)
    expect(jeDetailRazitka('/kategorie-horske-a-turisticke-chaty/2')).toBe(false)
    expect(jeDetailRazitka('/uzivatel-278/1')).toBe(false) // není „misto-"
    expect(jeDetailRazitka('/misto-neco')).toBe(false) // chybí /1
  })
})

describe('DATA-05 · parser stránky kategorie', () => {
  const html = `
    <div class="vypis">
      <a href="/kategorie-horske-a-turisticke-chaty/2">další stránka</a>
      <a href="/5469_bouda-bile-labe"><img src="nahled.jpg" alt=""></a>
      <a href="/5469_bouda-bile-labe">Bouda Bílé Labe (3)</a>
      <a href="http://www.razitkuj.cz/misto-bilikova-chata/1">Bílikova chata</a>
      <a href="/uzivatel-278/1">uživatel tlaci</a>
    </div>`

  it('vytáhne razítka dle URL vzoru, počet otisků z „(N)", dedup náhled+titulek, ignoruje ostatní', () => {
    const polozky = parsujStranku(html)
    expect(polozky).toHaveLength(2)
    const labe = polozky.find((p) => p.url.endsWith('/5469_bouda-bile-labe'))
    expect(labe?.nazev).toBe('Bouda Bílé Labe') // „(3)" odděleno do pocetOtisku
    expect(labe?.pocetOtisku).toBe(3)
    const bilik = polozky.find((p) => p.url.endsWith('/misto-bilikova-chata/1'))
    expect(bilik?.nazev).toBe('Bílikova chata')
    expect(bilik?.pocetOtisku).toBe(1) // bez „(N)" → 1
    expect(bilik?.url).toBe('http://www.razitkuj.cz/misto-bilikova-chata/1') // absolutní href → path zachován
  })

  it('rozdelPocet oddělí počet otisků z přípony', () => {
    expect(rozdelPocet('Luční Bouda (6)')).toEqual({ nazev: 'Luční Bouda', pocet: 6 })
    expect(rozdelPocet('Vosecká bouda')).toEqual({ nazev: 'Vosecká bouda', pocet: 1 })
  })

  it('prázdné HTML → žádná razítka', () => {
    expect(parsujStranku('<div>nic</div>')).toEqual([])
  })
})

describe('DATA-05 · stránkování se zastavením', () => {
  it('projde stránky, deduplikuje a zastaví na první bez nového razítka', async () => {
    const stranky: Record<string, string> = {
      [strankaUrl(1)]: '<a href="/1_alfredka">Alfrédka</a><a href="/2_barborka">Barborka</a>',
      [strankaUrl(2)]: '<a href="/2_barborka">Barborka</a><a href="/3_cetyna">Četyna</a>', // 1 nové
      [strankaUrl(3)]: '<a href="/3_cetyna">Četyna</a>', // 0 nových → stop
      [strankaUrl(4)]: '<a href="/4_dalsi">Další</a>', // sem už nedojde
    }
    const { razitka, stran } = await posbirejChecklist(10, async (u) => stranky[u] ?? '')
    expect(razitka.map((r) => r.nazev)).toEqual(['Alfrédka', 'Barborka', 'Četyna']) // řazeno cs
    expect(stran).toBe(2) // dvě stránky přidaly nová razítka
    expect(razitka.every((r) => r.url.startsWith('http://www.razitkuj.cz/'))).toBe(true)
  })
})

describe('DATA-05 · normalizace a shoda názvu', () => {
  it('normalizuje diakritiku, ł/ß i velikost písmen', () => {
    expect(normalizuj('Luční bouda')).toBe('lucni bouda')
    expect(normalizuj('Schronisko Pod Łabskim Szczytem')).toBe('schronisko pod labskim szczytem')
  })

  it('strhne příponu „(N)" (počet variant otisku) z názvu razítka', () => {
    expect(ocistiNazevRazitka('Špindlerova bouda (3)')).toBe('Špindlerova bouda')
    expect(ocistiNazevRazitka('Luční Bouda (6)')).toBe('Luční Bouda')
    expect(ocistiNazevRazitka('Vosecká bouda')).toBe('Vosecká bouda')
  })

  it('silná shoda: přesně, obsažení i přes alias; krátké názvy nesloučí', () => {
    expect(shodaNazvu(['Bouda Bílé Labe'], 'Bouda Bílé Labe')).toBe(true)
    expect(shodaNazvu(['Luční bouda'], 'Luční bouda - Krkonoše')).toBe(true) // razítko má přípony
    expect(shodaNazvu(['Schronisko Samotnia', 'Samotnia'], 'Samotnia')).toBe(true) // přes alias
    expect(shodaNazvu(['Luční bouda'], 'Labská bouda')).toBe(false)
  })

  it('typ shody: rovnost (i přes alias) = presna, obsažení = castecna', () => {
    expect(typShodyNazvu(['Bouda Bílé Labe'], 'Bouda bílé labe')).toBe('presna') // jen velikost písmen
    expect(typShodyNazvu(['Schronisko Samotnia', 'Samotnia'], 'Samotnia')).toBe('presna') // rovnost s aliasem
    expect(typShodyNazvu(['Chata Dvoračky'], 'Dvoračky')).toBe('castecna') // razítko kratší
    expect(typShodyNazvu(['Portášky'], 'Portáš')).toBe('castecna') // ⚠ takhle se chytí i cizí objekt
    expect(typShodyNazvu(['Luční bouda'], 'Labská bouda')).toBeNull()
  })
})

describe('DATA-05 · otisky z detailu razítka (fáze 3b)', () => {
  const html = `
    <div class="detail">
      <img src="/razitka_thumb/3879_lucni-bouda.gif" alt="Luční bouda">
      <a href="/razitka/3879_lucni-bouda.gif"><img src="/razitka_thumb/3879_lucni-bouda.gif"></a>
      <img src="https://www.razitkuj.cz/razitka_thumb/180_lucni-bouda.gif">
      <img src="/razitka_thumb/12133_lucni-bouda.gif">
      <img src="/images/logo.png">
    </div>`

  it('vytáhne všechny otisky dle URL vzoru, dedup dle ID, plná verze bez _thumb', () => {
    const otisky = otiskyZDetailu(html)
    expect(otisky.map((o) => o.id)).toEqual([180, 3879, 12133]) // dedup 3879, řazeno dle ID
    const prvni = otisky.find((o) => o.id === 3879)!
    expect(prvni.url).toBe('https://www.razitkuj.cz/razitka_thumb/3879_lucni-bouda.gif')
    expect(prvni.urlPlny).toBe('https://www.razitkuj.cz/razitka/3879_lucni-bouda.gif') // bez _thumb
    expect(prvni.ext).toBe('gif')
  })

  it('žádné otisky → prázdné pole (logo se nebere)', () => {
    expect(otiskyZDetailu('<img src="/images/logo.png">')).toEqual([])
  })
})

describe('DATA-05 · záznam razítka z manifestu (fáze 3c)', () => {
  const chata = {
    slug: 'lucni-bouda',
    nazev: 'Luční bouda',
    zdrojUrl: 'http://www.razitkuj.cz/misto-lucni-bouda/1',
    otisky: [{ id: 12133, soubor: 'lucni-bouda/12133.gif', obrazekUrl: 'https://www.razitkuj.cz/razitka/12133_lucni-bouda.gif' }],
  }

  it('založí razítko prevzato-se-svolenim se zdrojem, otiskem a bez stav (nedomýšlet)', () => {
    const r = razitkoZaznam(chata, chata.otisky[0], 1, 6, 'Robert Šindler (KiBob), 21. 7. 2026', '2026-07-21')
    expect(r).toMatchObject({
      chata: 'lucni-bouda',
      zpusobZiskani: 'prevzato-se-svolenim',
      prevzeti: { zdroj: 'razitkuj.cz', zdrojUrl: 'http://www.razitkuj.cz/misto-lucni-bouda/1' },
    })
    expect((r.prevzeti as { svolil: string }).svolil).toContain('KiBob')
    expect(r).not.toHaveProperty('stav') // aktuálnost varianty razitkuj neuvádí
    const otisk = r.otisk as Record<string, unknown>
    expect(otisk.soubor).toBe('12133.gif') // jen basename (leží vedle YAML)
    expect(otisk.typ).toBe('otisk-razitka')
    expect(otisk.licence).toBe('se-svolenim')
    expect((otisk.overeni as { verified: boolean }).verified).toBe(false)
    expect(String(r.poznamka)).toContain('varianta 1 z 6')
  })
})

describe('DATA-05 · párování katalogu s checklistem', () => {
  const chaty: Chata[] = [
    { slug: 'lucni-bouda', nazev: 'Luční bouda', nazvy: ['Luční bouda'], zeme: 'cz' },
    { slug: 'bouda-bile-labe', nazev: 'Bouda Bílé Labe', nazvy: ['Bouda Bílé Labe'], zeme: 'cz' },
    { slug: 'schronisko-samotnia', nazev: 'Schronisko Samotnia', nazvy: ['Schronisko Samotnia', 'Samotnia'], zeme: 'pl' },
  ]
  const razitka = [
    { nazev: 'Bouda Bílé Labe', url: 'http://www.razitkuj.cz/5469_bouda-bile-labe' },
    { nazev: 'Schronisko PTTK Samotnia (2)', url: 'http://www.razitkuj.cz/misto-samotnia/1' }, // přípona „(2)" + alias
    { nazev: 'Kolínská bouda - Krkonoše', url: 'http://www.razitkuj.cz/9_kolinska-bouda' }, // krkonošské, není u nás
    { nazev: 'Chata Šerlich - Orlické hory', url: 'http://www.razitkuj.cz/9_serlich' }, // bez shody, ne-krkonošské
  ]

  const zadnaPotvrzeni: PotvrzeneParovani = { potvrzene: [], nesouvisi: [] }

  it('spáruje naše chaty, vypíše chaty bez razítka a kandidáty na dohledání', () => {
    const { shody, bezRazitka, kandidatiChat } = sparuj(chaty, razitka, zadnaPotvrzeni)
    expect(shody.map((s) => s.slug).sort()).toEqual(['bouda-bile-labe', 'schronisko-samotnia'])
    expect(bezRazitka.map((b) => b.slug)).toEqual(['lucni-bouda']) // Luční u nás je, razítko v mocku ne
    // „Kolínská bouda - Krkonoše" nemá u nás chatu, ale zavání Krkonošemi → kandidát; Šerlich ne.
    expect(kandidatiChat.map((k) => k.nazev)).toEqual(['Kolínská bouda - Krkonoše'])
  })

  it('shoda nese typ a příznak potvrzení z redakčního seznamu', () => {
    const { shody } = sparuj(chaty, razitka, {
      potvrzene: [{ slug: 'bouda-bile-labe', url: 'http://www.razitkuj.cz/5469_bouda-bile-labe' }],
      nesouvisi: [],
    })
    const labe = shody.find((s) => s.slug === 'bouda-bile-labe')
    expect(labe).toMatchObject({ typ: 'presna', potvrzeno: true })
    const samotnia = shody.find((s) => s.slug === 'schronisko-samotnia')
    expect(samotnia).toMatchObject({ typ: 'castecna', potvrzeno: false }) // „Schronisko PTTK Samotnia" ⊃ alias
  })


  // Michal 28. 7. 2026 („párování — vše potvrzuji"): potvrzený pár platí i tam,
  // kde jmenná shoda nic nenašla — razitkuj vede „Schronisko na Hali
  // Szrenickiej" bez „PTTK", takže automat pár nikdy nenabídl a chatě by
  // razítko chybělo napořád. Za ručním párem stojí člověk, co viděl otisk.
  it('ruční potvrzený pár platí i bez jmenné shody — a pozná se v reportu', () => {
    const { shody, bezRazitka, kandidatiChat } = sparuj(chaty, razitka, {
      potvrzene: [{ slug: 'lucni-bouda', url: 'http://www.razitkuj.cz/9_kolinska-bouda' }],
      nesouvisi: [],
    })
    const lucni = shody.find((s) => s.slug === 'lucni-bouda')
    expect(lucni).toMatchObject({ typ: 'rucni', potvrzeno: true, razitko: 'Kolínská bouda - Krkonoše' })
    expect(bezRazitka.map((b) => b.slug)).toEqual([]) // Luční už razítko má
    expect(kandidatiChat.map((k) => k.nazev)).toEqual([]) // a přestala být kandidátem k dohledání
  })

  it('ruční pár na neznámý slug nebo cizí URL se mlčky ignoruje (překlep neshodí běh)', () => {
    const { shody } = sparuj(chaty, razitka, {
      potvrzene: [
        { slug: 'neexistuje', url: 'http://www.razitkuj.cz/9_kolinska-bouda' },
        { slug: 'lucni-bouda', url: 'http://www.razitkuj.cz/999_neni-v-checklistu' },
      ],
      nesouvisi: [],
    })
    expect(shody.map((s) => s.slug).sort()).toEqual(['bouda-bile-labe', 'schronisko-samotnia'])
  })

  it('pár z `nesouvisi` (prokázaný cizí objekt) jde do vyřazených, chata zůstane „bez razítka"', () => {
    const { shody, bezRazitka, vyrazene, kandidatiChat } = sparuj(chaty, razitka, {
      potvrzene: [],
      nesouvisi: [{ slug: 'schronisko-samotnia', url: 'http://www.razitkuj.cz/misto-samotnia/1' }],
    })
    expect(shody.map((s) => s.slug)).toEqual(['bouda-bile-labe'])
    expect(vyrazene.map((v) => v.slug)).toEqual(['schronisko-samotnia'])
    expect(bezRazitka.map((b) => b.slug).sort()).toEqual(['lucni-bouda', 'schronisko-samotnia'])
    // Razítko vyřazeného páru NEztrácí šanci být kandidátem na dohledání JINÉ
    // chaty (vzor: razítko Martinovy boudy na Benecku ≠ hřebenová Martinovka,
    // ale krkonošské je) — s krkonošským klíčem v názvu se mezi kandidáty vrací.
    expect(kandidatiChat.map((k) => k.nazev)).toEqual(['Schronisko PTTK Samotnia', 'Kolínská bouda - Krkonoše'])
  })
})
