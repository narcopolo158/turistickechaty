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
  strankaUrl,
} from '../../scripts/data05-razitkuj-checklist'
import {
  normalizuj,
  ocistiNazevRazitka,
  shodaNazvu,
  sparuj,
  type Chata,
} from '../../scripts/data05-razitkuj-parovani'

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
      <a href="/5469_bouda-bile-labe">Bouda Bílé Labe</a>
      <a href="http://www.razitkuj.cz/misto-bilikova-chata/1">Bílikova chata</a>
      <a href="/uzivatel-278/1">uživatel tlaci</a>
    </div>`

  it('vytáhne razítka dle URL vzoru, deduplikuje náhled+titulek, ignoruje ostatní', () => {
    const polozky = parsujStranku(html)
    expect(polozky).toHaveLength(2)
    expect(polozky.find((p) => p.url.endsWith('/5469_bouda-bile-labe'))?.nazev).toBe('Bouda Bílé Labe')
    const bilik = polozky.find((p) => p.url.endsWith('/misto-bilikova-chata/1'))
    expect(bilik?.nazev).toBe('Bílikova chata')
    expect(bilik?.url).toBe('http://www.razitkuj.cz/misto-bilikova-chata/1') // absolutní href → path zachován
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

  it('spáruje naše chaty, vypíše chaty bez razítka a kandidáty na dohledání', () => {
    const { shody, bezRazitka, kandidatiChat } = sparuj(chaty, razitka)
    expect(shody.map((s) => s.slug).sort()).toEqual(['bouda-bile-labe', 'schronisko-samotnia'])
    expect(bezRazitka.map((b) => b.slug)).toEqual(['lucni-bouda']) // Luční u nás je, razítko v mocku ne
    // „Kolínská bouda - Krkonoše" nemá u nás chatu, ale zavání Krkonošemi → kandidát; Šerlich ne.
    expect(kandidatiChat.map((k) => k.nazev)).toEqual(['Kolínská bouda - Krkonoše'])
  })
})
