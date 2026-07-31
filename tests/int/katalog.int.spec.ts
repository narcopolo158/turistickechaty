/**
 * F1b: logika katalogu — filtrování (stavové OR, službové AND), řazení
 * (abc / výška / ověřeno) a URL stav. Chování 1:1 dle funkčního prototypu
 * handoffu (F1-Katalog.dc.html, _filtered()).
 */
import { describe, expect, it } from 'vitest'

import type { IndexChata } from '@/lib/index-chat'
import {
  filtrujKatalog,
  oblastiZIndexu,
  stavDoUrl,
  stavZUrl,
  VYCHOZI_STAV,
  type KatalogStav,
} from '@/lib/katalog'

const chata = (prepis: Partial<IndexChata>): IndexChata => ({
  slug: 'x',
  nazev: 'X',
  url: null,
  oblastSlug: 'krkonose',
  oblastNazev: 'Krkonoše',
  zeme: 'cz',
  typ: null,
  stav: 'v-provozu',
  vyska: null,
  lat: null,
  lng: null,
  nocleh: null,
  obcerstveni: null,
  razitko: false,
  otiskUrl: null,
  heroUrl: null,
  heroAlt: null,
  otiskAlt: null,
  kapacita: null,
  znamka: false,
  checked: null,
  verified: false,
  nejstarsiRok: null,
  ...prepis,
})

const INDEX: IndexChata[] = [
  chata({ slug: 'lucni', nazev: 'Luční bouda', vyska: 1410, nocleh: true, obcerstveni: true, razitko: true, znamka: true, checked: '2026-07-19' }),
  chata({ slug: 'labska', nazev: 'Labská bouda', vyska: 1340, nocleh: true, obcerstveni: true, razitko: true, znamka: true, checked: '2026-07-12' }),
  chata({ slug: 'lovecka', nazev: 'Lovecká chata', vyska: null, nocleh: false, obcerstveni: true, checked: '2026-07-11' }),
  chata({ slug: 'obri', nazev: 'Obří bouda', stav: 'zanikla', vyska: 1390, nocleh: false, obcerstveni: false, checked: null }),
  chata({ slug: 'vyrovka', nazev: 'Výrovka', vyska: 1370, nocleh: true, obcerstveni: null, razitko: true, znamka: true, checked: '2026-07-08' }),
]

const stav = (prepis: Partial<KatalogStav>): KatalogStav => ({ ...VYCHOZI_STAV, chips: [], ...prepis })

describe('filtrujKatalog', () => {
  it('bez filtrů vrací vše abecedně česky (výchozí řazení)', () => {
    expect(filtrujKatalog(INDEX, stav({})).map((c) => c.slug)).toEqual([
      'labska', 'lovecka', 'lucni', 'obri', 'vyrovka',
    ])
  })

  it('hledání je case-insensitive substring v názvu a nemutuje vstup', () => {
    const puvodni = [...INDEX]
    expect(filtrujKatalog(INDEX, stav({ q: 'BOUDA' })).map((c) => c.slug)).toEqual(['labska', 'lucni', 'obri'])
    expect(INDEX).toEqual(puvodni)
  })

  it('stavové chips jsou OR: samotná „zaniklá" nechá jen zaniklé, obě = oba stavy', () => {
    expect(filtrujKatalog(INDEX, stav({ chips: ['zanikla'] })).map((c) => c.slug)).toEqual(['obri'])
    expect(filtrujKatalog(INDEX, stav({ chips: ['v-provozu', 'zanikla'] }))).toHaveLength(5)
  })

  it('službové chips jsou AND a pouštějí jen doložené „ano" (null = nezjištěno neprojde)', () => {
    // nocleh: Lovecká má doložené „ne", Obří „ne" → jen lucni/labska/vyrovka
    expect(filtrujKatalog(INDEX, stav({ chips: ['nocleh'] })).map((c) => c.slug)).toEqual([
      'labska', 'lucni', 'vyrovka',
    ])
    // nocleh AND občerstvení: Výrovka má občerstvení nezjištěno (null) → vypadne
    expect(filtrujKatalog(INDEX, stav({ chips: ['nocleh', 'obcerstveni'] })).map((c) => c.slug)).toEqual([
      'labska', 'lucni',
    ])
    expect(filtrujKatalog(INDEX, stav({ chips: ['razitko', 'znamka'] }))).toHaveLength(3)
  })

  it('řazení podle výšky: sestupně, bez výšky nakonec; podle ověření: nejnovější první, bez checked nakonec', () => {
    expect(filtrujKatalog(INDEX, stav({ sort: 'vyska' })).map((c) => c.slug)).toEqual([
      'lucni', 'obri', 'vyrovka', 'labska', 'lovecka',
    ])
    expect(filtrujKatalog(INDEX, stav({ sort: 'overeno' })).map((c) => c.slug)).toEqual([
      'lucni', 'labska', 'lovecka', 'vyrovka', 'obri',
    ])
  })

  it('kombinace: hledání + stav + služba + řazení (scénář z prototypu)', () => {
    const vysledek = filtrujKatalog(INDEX, stav({ q: 'bouda', chips: ['v-provozu', 'nocleh'], sort: 'vyska' }))
    expect(vysledek.map((c) => c.slug)).toEqual(['lucni', 'labska'])
  })

  it('poctivý prázdný výsledek: kombinace bez shody vrací []', () => {
    expect(filtrujKatalog(INDEX, stav({ q: 'neexistuje' }))).toEqual([])
    expect(filtrujKatalog(INDEX, stav({ chips: ['zanikla', 'nocleh'] }))).toEqual([])
  })
})

describe('URL stav katalogu', () => {
  it('výchozí stav = prázdná URL; plný stav se serializuje kanonicky', () => {
    expect(stavDoUrl(VYCHOZI_STAV)).toBe('')
    const url = stavDoUrl({ q: 'bouda', chips: ['nocleh', 'v-provozu'], oblasti: [], sort: 'vyska', view: 'mapa' })
    // chips v kanonickém pořadí (stejný výběr = stejná URL pro sdílení)
    expect(url).toBe('q=bouda&chips=v-provozu%2Cnocleh&sort=vyska&view=mapa')
  })

  it('roundtrip: stav → URL → stav je identita', () => {
    const puvodni: KatalogStav = { q: 'lu', chips: ['v-provozu', 'razitko'], oblasti: [], sort: 'overeno', view: 'radky' }
    expect(stavZUrl(new URLSearchParams(stavDoUrl(puvodni)))).toEqual(puvodni)
    expect(stavZUrl(new URLSearchParams(''))).toEqual(VYCHOZI_STAV)
  })

  it('neznámé tokeny v URL se tiše zahodí (odolnost vůči ručně upraveným odkazům)', () => {
    const s = stavZUrl(new URLSearchParams('chips=nocleh,nesmysl&sort=spatne&view=fake&cizi=1'))
    expect(s).toEqual({ q: '', chips: ['nocleh'], oblasti: [], sort: 'abc', view: 'karty' })
  })

  it('bere i Next.js searchParams objekt (string hodnoty)', () => {
    expect(stavZUrl({ q: 'bouda', chips: 'zanikla', sort: 'vyska', view: undefined })).toEqual({
      q: 'bouda',
      chips: ['zanikla'],
      oblasti: [],
      sort: 'vyska',
      view: 'karty',
    })
  })
})

/**
 * Filtr podle pohoří (zadání Michala 31. 7. 2026: „na přehledu všech chat
 * budeme potřebovat filtr podle pohoří — a připrav to rovnou tak, aby to
 * fungovalo pro všechna nově založená pohoří i do budoucna").
 *
 * Klíčové rozhodnutí, které tyhle testy drží: seznam pohoří NENÍ číselník
 * v kódu, ale odvozuje se z indexu. Nová oblast se tedy ve filtru objeví tím,
 * že má první publikovaný profil — nikdo na to nemusí sáhnout.
 */
describe('katalog · filtr podle pohoří', () => {
  const jizerska = (prepis: Partial<IndexChata>) =>
    chata({ oblastSlug: 'jizerske-hory', oblastNazev: 'Jizerské hory', ...prepis })
  const MIX: IndexChata[] = [
    chata({ slug: 'lucni', nazev: 'Luční bouda' }),
    chata({ slug: 'vyrovka', nazev: 'Výrovka' }),
    jizerska({ slug: 'smedava', nazev: 'Smědava' }),
    { ...chata({ slug: 'bezoblasti', nazev: 'Bez oblasti' }), oblastSlug: null, oblastNazev: null },
  ]

  it('nabídka pohoří vzniká z dat, řadí se dle počtu a nese počty', () => {
    expect(oblastiZIndexu(MIX)).toEqual([
      { slug: 'krkonose', nazev: 'Krkonoše', pocet: 2 },
      { slug: 'jizerske-hory', nazev: 'Jizerské hory', pocet: 1 },
    ])
  })

  it('profil bez oblasti do nabídky nepatří (filtr, který nikoho nevybere)', () => {
    expect(oblastiZIndexu(MIX).map((o) => o.slug)).not.toContain(null)
    expect(oblastiZIndexu([]).length).toBe(0)
  })

  it('prázdný výběr znamená VŠECHNA pohoří, ne žádné', () => {
    expect(filtrujKatalog(MIX, { ...VYCHOZI_STAV, oblasti: [] })).toHaveLength(MIX.length)
  })

  it('výběr filtruje, víc oblastí se sčítá (OR)', () => {
    const jen = filtrujKatalog(MIX, { ...VYCHOZI_STAV, oblasti: ['jizerske-hory'] })
    expect(jen.map((ch) => ch.slug)).toEqual(['smedava'])
    const obe = filtrujKatalog(MIX, { ...VYCHOZI_STAV, oblasti: ['jizerske-hory', 'krkonose'] })
    expect(obe).toHaveLength(3) // vše kromě profilu bez oblasti
  })

  it('kombinace s ostatními filtry je AND (pohoří × služba)', () => {
    const index = [...MIX, jizerska({ slug: 'knajpa', nazev: 'Knajpa', obcerstveni: true })]
    const v = filtrujKatalog(index, { ...VYCHOZI_STAV, oblasti: ['jizerske-hory'], chips: ['obcerstveni'] })
    expect(v.map((ch) => ch.slug)).toEqual(['knajpa'])
  })

  it('výběr se veze v URL a roundtrip je identita', () => {
    const stav: KatalogStav = { ...VYCHOZI_STAV, oblasti: ['jizerske-hory', 'krkonose'] }
    const url = stavDoUrl(stav)
    expect(url).toBe('oblasti=jizerske-hory%2Ckrkonose')
    expect(stavZUrl(new URLSearchParams(url))).toEqual(stav)
  })

  /**
   * Překlep v ručně upraveném odkazu nesmí ukázat prázdný katalog — to by
   * vypadalo jako „průvodce nic nemá". Když volající zná skutečné oblasti,
   * neznámý token se zahodí stejně jako neznámý chip.
   */
  it('neznámý slug se zahodí, když víme, jaké oblasti existují', () => {
    const zname = ['krkonose', 'jizerske-hory']
    expect(stavZUrl(new URLSearchParams('oblasti=krkonose,vymysl'), zname).oblasti).toEqual(['krkonose'])
    // Bez seznamu zůstane funkce čistá a slug přijme (filtr pak prostě nezabere).
    expect(stavZUrl(new URLSearchParams('oblasti=vymysl')).oblasti).toEqual(['vymysl'])
    // Nesmysly, které nemůžou být slugem, padají vždycky.
    expect(stavZUrl(new URLSearchParams('oblasti=Velké Hory,../etc')).oblasti).toEqual([])
  })
})
