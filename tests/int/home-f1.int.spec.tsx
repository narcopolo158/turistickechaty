/**
 * F1c (první průchod): homepage countery + kalendárium + „Z průvodce" +
 * printový seznam — všechna čísla POČÍTANÁ z mockovaného indexu, žádná
 * ručně psaná. Payload i Leaflet se mockují (server data přicházejí
 * z getIndexChat / getChatyProMapu, ty testuje CI build se seedem).
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IndexChata, KalendariumPolozka } from '@/lib/index-chat'

const chata = (prepis: Partial<IndexChata>): IndexChata => ({
  slug: 'x',
  nazev: 'X',
  url: '/cesko/krkonose/x',
  oblastSlug: 'krkonose',
  oblastNazev: 'Krkonoše',
  zeme: 'cz',
  typ: 'obsluhovana',
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
  chata({ slug: 'lucni-bouda', nazev: 'Luční bouda', vyska: 1410, razitko: true, znamka: true, checked: '2026-07-19' }),
  chata({ slug: 'vyrovka', nazev: 'Výrovka', vyska: 1357, razitko: true, checked: '2026-07-08' }),
  chata({ slug: 'bez-overeni', nazev: 'Bez ověření' }),
  chata({
    slug: 'smedava',
    nazev: 'Smědava',
    url: '/cesko/jizerske-hory/smedava',
    oblastSlug: 'jizerske-hory',
    oblastNazev: 'Jizerské hory',
  }),
]
const KALENDARIUM: KalendariumPolozka[] = [
  { rok: 1623, udalost: 'letopočet na základním kameni.', chataNazev: 'Luční bouda', chataUrl: '/cesko/krkonose/lucni-bouda' },
]

vi.mock('@/lib/chaty', () => ({
  getChatyProMapu: async () => [],
  getIndexChat: async () => ({ index: INDEX, kalendarium: KALENDARIUM }),
  // Titulní fotka oblasti (FOTO-01): mock ji schválně NEMÁ — karta pohoří má
  // fungovat i bez fotky (kreslené panorama je záloha, viz page.tsx).
  getOblastBySlug: async () => null,
  // Živé oblasti (31. 7. 2026): homepage je od přidání Jizerských hor bere
  // odsud, ať krkonošská karta nepočítá cizí chaty. Mock vede dvě, aby test
  // ohlídal i to, že se druhá opravdu vykreslí.
  // Skloňované tvary (31. 7. 2026) chodí z dat oblasti — mock je nese taky,
  // jinak by věty v heru sklouzly na nouzový opis „v oblastech…".
  getZiveOblasti: async () => [
    { slug: 'krkonose', nazev: 'Krkonoše', pocetChat: 2, typ: 'pohori', druhy: 'Krkonoš', sesty: 'Krkonoších' },
    {
      slug: 'jizerske-hory',
      nazev: 'Jizerské hory',
      pocetChat: 1,
      typ: 'pohori',
      druhy: 'Jizerských hor',
      sesty: 'Jizerských horách',
    },
  ],
  spojVyctem: (p: string[]) =>
    p.length <= 1 ? (p[0] ?? '') : `${p.slice(0, -1).join(', ')} a ${p[p.length - 1]}`,
  ZEME_NAZEV: { cz: 'Česko', sk: 'Slovensko', pl: 'Polsko' },
}))
vi.mock('@/lib/zanikle', () => ({
  zanikleChaty: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
  zanikleChatyVse: () => Array.from({ length: 12 }, (_, i) => ({ slug: `z${i}` })),
}))
vi.mock('@/components/MapaChat', () => ({ default: () => <div data-testid="mapa-mock" /> }))
// HledaniChat používá app router (useRouter) — v jsdom se mockuje.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} }),
}))

import HomePage from '@/app/(frontend)/page'

afterEach(cleanup)

describe('Homepage F1c — datové pásy', () => {
  it('countery jsou spočítané z indexu (profily, s razítkem, zaniklé, naposledy ověřeno)', async () => {
    render(await HomePage())
    const countery = document.querySelector('.hf1-countery')!
    expect(within(countery as HTMLElement).getByText('4')).toBeTruthy() // profilů (fond, obě oblasti)
    expect(within(countery as HTMLElement).getByText('2')).toBeTruthy() // s razítkem
    expect(within(countery as HTMLElement).getByText('12')).toBeTruthy() // zaniklých (mock Atlasu)
    expect(within(countery as HTMLElement).getByText('19. 7. 2026')).toBeTruthy() // max checked
  })

  it('kalendárium skládá větu z milníku a odkazuje na profil', async () => {
    render(await HomePage())
    expect(screen.getByText(/^Před \d+ lety \(1623\) letopočet na základním kameni\.$/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'číst na profilu ▸' }).getAttribute('href')).toBe(
      '/cesko/krkonose/lucni-bouda',
    )
  })

  it('pás Naposledy ověřeno řadí dle checked a profily bez checked vynechává', async () => {
    render(await HomePage())
    const panel = screen.getByText('Naposledy ověřeno').closest('.hf1-panel') as HTMLElement
    const radky = within(panel).getAllByRole('link')
    expect(radky.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Luční bouda'),
      expect.stringContaining('Výrovka'),
    ])
  })

  /**
   * NADPIS: PŘEDMĚT A ZÁMĚR, NE SLOGAN A NE DVĚ POHOŘÍ.
   *
   * Dvě rozhodnutí Michala z 31. 7. 2026 v jedné větě. Nejdřív padl slogan
   * („nelíbí se mi Chaty, kterým můžeš věřit") — důvěru si má čtenář udělat
   * z toho, co pod nadpisem uvidí. Pak padla i první náhrada, která jmenovala
   * obě živé oblasti: „neomezuj headline na 2 pohoří, rovnou ber celkový
   * plán." Nadpis proto drží oblouk z docs/plan.md; co průvodce OPRAVDU má,
   * říká perex hned pod ním.
   */
  it('hero: nadpis nese záměr průvodce, ne slogan ani výčet dvou pohoří', async () => {
    render(await HomePage())
    const h1 = screen.getByRole('heading', { level: 1 }).textContent
    expect(h1).toBe('Turistické chaty od českých hor po Alpy')
    expect(h1).not.toContain('Chaty, kterým')
    // Nadpis se nesmí vázat na aktuální dvě oblasti — ty se mění.
    expect(h1).not.toMatch(/Krkonoš|Jizersk/)
  })

  it('hero: dřevěné cedule, koláž s prázdnými sloty (mock bez fotky/otisku) a známka č. 11', async () => {
    render(await HomePage())
    expect(screen.getByText('PROZKOUMAT POHOŘÍ')).toBeTruthy()
    expect(screen.getByText('KATALOG CHAT')).toBeTruthy()
    // mock index nemá heroUrl ani otiskUrl Luční → polaroid i otisk zůstanou prázdné
    expect(screen.getByText('fotku sem teprve hledáme')).toBeTruthy()
    expect(screen.getByText('EST. 1623')).toBeTruthy() // kreslený otisk (doložený milník)
    expect(screen.getByText('Č. 11')).toBeTruthy() // reálné číslo známky z DATA-10
  })

  /**
   * Perex je první, co ze stránky přečte člověk i jazykový model, který ji
   * cituje — proto musí v jedné větě říct, CO to je, a hned nato doložená
   * čísla. A protože nadpis mluví o záměru („až do Alp"), je to právě perex,
   * kdo drží realitu: kolik profilů a ve kterých oblastech. Slovo „zatím"
   * je tu schválně — bez něj by dvojice nadpis + perex slibovala Alpy.
   */
  it('perex definuje web, přiznává dnešní rozsah a nese počet profilů z indexu', async () => {
    render(await HomePage())
    const perex = document.querySelector('.hf1-perex')!.textContent!
    expect(perex).toContain('Průvodce turistickými chatami')
    expect(perex).toMatch(/zatím 4 profily v Krkonoších a Jizerských horách/)
  })

  /**
   * Zadání Michala 31. 7. 2026: „redukuj vše, co zní technicky, na nejnutnější
   * minimum; zdroje nemusí být na každém řádku, ale pohromadě". Poznámky pod
   * pásy mizely postupně, takže test drží výsledek — na homepage už nesmí být
   * vidět jazyk redakčního systému.
   */
  it('mikropoznámky o databázi jsou pryč — o původu dat mluví FAQ a patička', async () => {
    render(await HomePage())
    expect(screen.queryByText(/v databázi/)).toBeNull()
    expect(screen.queryByText(/„checked“/)).toBeNull()
    expect(screen.queryByText(/ghost/)).toBeNull()
    expect(screen.queryByText('živý důkaz')).toBeNull()
  })

  /**
   * Od 31. 7. 2026 nese grid VŠECHNY oblasti s publikovanými profily, každou
   * s vlastními čísly. Dřív tu byla Krkonoše napevno a počty se braly z celého
   * fondu — s druhou oblastí by si krkonošská karta přivlastnila i jizerské
   * chaty. Test proto hlídá, že se čísla mezi kartami LIŠÍ.
   */
  it('pohoří grid: každá živá oblast má vlastní čísla, „připravujeme" jen ty ostatní', async () => {
    const { container } = render(await HomePage())
    const zive = container.querySelectorAll('.hf1-pohori-ziva')
    expect(zive).toHaveLength(2)
    const krkonose = zive[0] as HTMLElement
    const jizerky = zive[1] as HTMLElement
    expect(within(krkonose).getByText('Krkonoše')).toBeTruthy()
    expect(within(krkonose).getByText('ŽIVÉ')).toBeTruthy()
    expect(within(krkonose).getByText('3')).toBeTruthy() // 3 krkonošské chaty z mock indexu
    expect(within(jizerky).getByText('Jizerské hory')).toBeTruthy()
    expect(within(jizerky).getByText('1')).toBeTruthy() // jediná jizerská
    // Oblast, která na webu stojí, se nesmí zároveň nabízet jako „připravujeme".
    expect(within(container).queryByText(/Jizerské hory.*připravujeme/)).toBeNull()
    expect(screen.getAllByText(/připravujeme — sbíráme kandidáty/)).toHaveLength(2)
    expect(screen.getByText(/přesahová oblast/)).toBeTruthy()
  })

  it('namátkou z průvodce: lístky z mock indexu (víc jich není), reshuffle tlačítko, poctivá popiska', async () => {
    const { container } = render(await HomePage())
    expect(screen.getByText('Namátkou z průvodce')).toBeTruthy()
    expect(container.querySelectorAll('.hf1-listek')).toHaveLength(4)
    expect(screen.getByRole('button', { name: '↻ jiných pět' })).toBeTruthy()
    expect(screen.getByText(/náhodný výběr z 4 profilů/)).toBeTruthy()
  })

  /**
   * Rozcestník v heru je NEUTRÁLNÍ (rozhodnutí Michala 31. 7. 2026). Do té doby
   * vedlo velké prkno na Krkonoše — s druhou živou oblastí by to čtenáři
   * tvrdilo, že průvodce je pořád jen krkonošský, a prkno za každou oblast se
   * přidávat nedá donekonečna. Test drží obojí: cedule míří na sekci Pohoří
   * a karty odtud vedou na jednotlivá pohoří.
   */
  it('místo malovaného posteru je skutečná mapa chat; cedule vede na rozcestník, karty na pohoří', async () => {
    const { container } = render(await HomePage())
    // rozhodnutí Michala 28. 7.: 3D patří na stránku pohoří, homepage nese turistickou mapu
    expect(screen.queryByText('Malovaná 3D mapa Krkonoš')).toBeNull()
    expect(container.querySelector('#mapa [data-testid="mapa-mock"]')).toBeTruthy()
    const cedule = screen.getByText('PROZKOUMAT POHOŘÍ').closest('a')!
    expect(cedule.getAttribute('href')).toBe('#pohori')
    // Kotva musí existovat — odkaz do prázdna by čtenáře nechal stát na místě.
    expect(container.querySelector('#pohori')).toBeTruthy()
    // Popiska počítá živé oblasti z dat (mock jich má dvě).
    expect(screen.getByText(/2 pohoří · stránky s 3D mapou/)).toBeTruthy()
    const karty = container.querySelectorAll('.hf1-pohori-ziva a')
    expect([...karty].map((a) => a.getAttribute('href'))).toEqual([
      '/cesko/krkonose',
      '/cesko/jizerske-hory',
    ])
  })

  it('komunitní apel: počty chybějících z dat, CTA na /prispet', async () => {
    render(await HomePage())
    // mock: 4 profily, 2 s razítkem, 4 bez heroUrl
    expect(screen.getByText('Máš v deníku otisk, který nám chybí?')).toBeTruthy()
    expect(screen.getByText(/2 chaty vedeme bez\s+doloženého razítka a 4 bez fotky/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Přispět otiskem či fotkou ▸' }).getAttribute('href')).toBe('/prispet')
  })

  /**
   * FAQ + strukturovaná data (31. 7. 2026). Homepage do té doby neměla ŽÁDNÝ
   * JSON-LD, takže vyhledávače a jazykové modely o webu jako celku nevěděly
   * nic. Test hlídá tři věci, na kterých to stojí: že blok je syntakticky
   * platný (jediná chyba zneplatní celý blok), že netvrdí nic, co není na
   * stránce vidět, a že hodnocení ani počty recenzí si nevymýšlí.
   */
  describe('FAQ a strukturovaná data', () => {
    const graf = async () => {
      const { container } = render(await HomePage())
      const bloky = [...container.querySelectorAll('script[type="application/ld+json"]')]
      expect(bloky).toHaveLength(1)
      // Když by JSON nebyl platný, JSON.parse tady spadne — přesně jak by
      // blok zahodil vyhledávač.
      const data = JSON.parse(bloky[0]!.textContent!) as { '@graph': Record<string, unknown>[] }
      return data['@graph']
    }

    it('otázky jsou vidět na stránce a v JSON-LD ve stejném znění', async () => {
      const { container } = render(await HomePage())
      const otazky = [...container.querySelectorAll('.hf1-faq-polozka summary')].map(
        (s) => s.textContent,
      )
      expect(otazky.length).toBeGreaterThanOrEqual(6)
      expect(otazky).toContain('Co je turistická chata?')
      expect(otazky).toContain('Odkud data pocházejí?')
      cleanup()
      const faq = (await graf()).find((u) => u['@type'] === 'FAQPage') as {
        mainEntity: { name: string; acceptedAnswer: { text: string } }[]
      }
      expect(faq.mainEntity.map((q) => q.name)).toEqual(otazky)
      // Odpověď musí být samonosná — vytržená z kontextu pořád dává smysl.
      expect(faq.mainEntity[0]!.acceptedAnswer.text).toMatch(/^Turistická chata je/)
    })

    it('čísla ve FAQ se počítají z indexu, ne píšou ručně', async () => {
      const faq = (await graf()).find((u) => u['@type'] === 'FAQPage') as {
        mainEntity: { name: string; acceptedAnswer: { text: string } }[]
      }
      const kolik = faq.mainEntity.find((q) => q.name.startsWith('Kolik chat'))!
      // mock: 4 profily, 3 krkonošské + 1 jizerská, 12 zaniklých
      expect(kolik.acceptedAnswer.text).toContain('4 profily')
      // Počty se jmenují se skloněnou oblastí z dat — „3 v Krkonoších".
      expect(kolik.acceptedAnswer.text).toContain('3 v Krkonoších')
      expect(kolik.acceptedAnswer.text).toContain('1 v Jizerských horách')
      expect(kolik.acceptedAnswer.text).toContain('12 zaniklých')
    })

    it('WebSite umí hledání, které katalog opravdu podporuje (?q=)', async () => {
      const web = (await graf()).find((u) => u['@type'] === 'WebSite') as {
        potentialAction: { target: { urlTemplate: string } }
      }
      expect(web.potentialAction.target.urlTemplate).toBe(
        'https://turistickechaty.cz/chaty?q={search_term_string}',
      )
    })

    it('CollectionPage vede oblasti a datum shodné s viditelným „naposledy ověřeno"', async () => {
      const stranka = (await graf()).find((u) => u['@type'] === 'CollectionPage') as {
        dateModified: string
        mainEntity: { numberOfItems: number; itemListElement: { url: string }[] }
      }
      expect(stranka.dateModified).toBe('2026-07-19') // = max checked v mocku
      expect(stranka.mainEntity.numberOfItems).toBe(2)
      expect(stranka.mainEntity.itemListElement.map((p) => p.url)).toEqual([
        'https://turistickechaty.cz/cesko/krkonose',
        'https://turistickechaty.cz/cesko/jizerske-hory',
      ])
    })

    it('nevymýšlí si hodnocení ani recenze', async () => {
      const cely = JSON.stringify(await graf())
      expect(cely).not.toMatch(/aggregateRating|reviewCount|ratingValue/)
    })
  })

  it('printový seznam (B13) nese všechny profily s poctivými „—"', async () => {
    render(await HomePage())
    const tabulka = document.querySelector('.hf1-print table')!
    const radky = tabulka.querySelectorAll('tbody tr')
    expect(radky).toHaveLength(4)
    const bezOvereni = [...radky].find((r) => r.textContent?.includes('Bez ověření'))!
    expect(bezOvereni.textContent).toContain('—') // výška i ověření nedoloženy
  })
})
