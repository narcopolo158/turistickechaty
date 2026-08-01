/**
 * Výpis lanovek na stránce pohoří — komponentový test nad reálným datovým
 * souborem (data/lanovky/krkonose.json), ne nad vymyšleným mockem.
 *
 * Hlídá poctivostní věty, které musí u přehledu zůstat: že vleky v přehledu
 * nejsou, že převýšení je odhad z modelu a že vzdálenost k chatě je vzdušná
 * čára. Kdyby je někdo z UI odstranil, čtenář by četl čísla jako měřená.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import LanovkySeznam, { vyberKarty } from '@/components/LanovkySeznam'
import type { LanovkyOblasti } from '@/lib/lanovky'

const DATA = JSON.parse(
  readFileSync(join(process.cwd(), 'data', 'lanovky', 'krkonose.json'), 'utf8'),
) as LanovkyOblasti

/**
 * Cesty profilů chat, jak je stránka pohoří bere z indexu. Schválně tu NENÍ
 * poskládaná ze slugu oblasti: adresa nese ZEMI OBJEKTU, takže polské
 * schronisko má `/polsko/…`. Právě tenhle rozdíl 1. 8. 2026 vyrobil 404
 * odkazy, když si je komponenta skládala sama.
 */
const CESTY = new Map<string, string>(
  DATA.lanovky.flatMap((l) =>
    l.uHorniStanice.map((ch) => [ch.slug, `/${ch.slug === 'dom-slaski' ? 'polsko' : 'cesko'}/krkonose/${ch.slug}`] as const),
  ),
)

afterEach(cleanup)

describe('LanovkySeznam nad reálnými daty Krkonoš', () => {
  it('vypíše dráhy pro pěší a jejich počet sedí s daty', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const radky = document.querySelectorAll('.lanovky-tab tbody tr')
    expect(radky.length).toBe(DATA.lanovky.length)
    expect(DATA.lanovky.length).toBeGreaterThan(0)
  })

  it('přiznává, že vleky v přehledu nejsou (i jejich počet)', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(screen.getByText(/Vleky a dětské pásy v něm nejsou/)).toBeTruthy()
    expect(document.body.textContent).toContain(String(DATA.vleku))
  })

  it('u převýšení říká, že jde o odhad z modelu, a značí ho „≈"', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(document.body.textContent).toContain('odhad z výškového modelu')
    const sPrevysenim = DATA.lanovky.filter((l) => l.prevyseniM != null)
    if (sPrevysenim.length) expect(document.body.textContent).toContain('≈')
  })

  it('vzdálenost k chatě označuje jako vzdušnou čáru a odkazuje na profil', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(document.body.textContent).toContain('vzdušná čára')
    const sChatou = DATA.lanovky.find((l) => l.uHorniStanice.length)
    if (sChatou) {
      const odkaz = screen.getAllByRole('link', { name: sChatou.uHorniStanice[0].nazev })[0]
      expect(odkaz.getAttribute('href')).toContain(`/${sChatou.uHorniStanice[0].slug}`)
    }
  })

  it('uvádí zdroj dat i stáří (ODbL a datum stavu OSM)', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(document.body.textContent).toContain('OpenStreetMap')
    expect(document.body.textContent).toContain('ODbL')
    if (DATA.stavOsm) expect(document.body.textContent).toContain(DATA.stavOsm)
  })

  it('bez dat nevykreslí nic (nová oblast nemá prázdnou tabulku)', () => {
    const { container } = render(<LanovkySeznam data={null} cestyChat={CESTY} />)
    expect(container.innerHTML).toBe('')
  })

  /**
   * NÁLEZ 1. 8. 2026: komponenta si adresu profilu skládala sama ze slugu
   * oblasti a natvrdo psaného „cesko". U polských schronisek tím vyráběla
   * odkaz na 404 — profil je porovnává s kanonickou cestou a jinou nepřijme.
   * Adresa teď chodí z indexu; tenhle test hlídá, že se to nevrátí.
   */
  it('polskou chatu odkazuje pod /polsko, ne pod /cesko', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const polske = [...CESTY].filter(([, url]) => url.startsWith('/polsko/'))
    expect(polske.length).toBeGreaterThan(0)
    for (const [slug, url] of polske) {
      const nazev = DATA.lanovky.flatMap((l) => l.uHorniStanice).find((ch) => ch.slug === slug)!.nazev
      for (const odkaz of screen.getAllByRole('link', { name: nazev })) {
        expect(odkaz.getAttribute('href')).toBe(url)
        expect(odkaz.getAttribute('href')).not.toContain('/cesko/')
      }
    }
  })

  /** Chata bez kanonické cesty se vypíše jménem — mrtvý odkaz je horší než žádný. */
  it('bez známé cesty nevznikne odkaz, jen jméno', () => {
    render(<LanovkySeznam data={DATA} cestyChat={new Map()} />)
    const nazev = DATA.lanovky.find((l) => l.uHorniStanice.length)!.uHorniStanice[0].nazev
    expect(document.body.textContent).toContain(nazev)
    expect(screen.queryAllByRole('link', { name: nazev })).toHaveLength(0)
  })
})

/**
 * Karty sekce 06 (handoff F1). Návrh v nich jmenuje konkrétní trojici; my ji
 * musíme odvodit pravidlem, protože redakční výběr bez pravidla by byl
 * netestovatelné tvrzení. Past, kvůli které tenhle blok existuje: lanovka na
 * Sněžku má DVA úseky s přestupem na Růžové hoře, takže naivní „tři nejvyšší"
 * by dalo Sněžku dvakrát.
 */
describe('výběr tří karet', () => {
  const l = (
    id: string,
    horniVyska: number,
    dolni: [number, number],
    horni: [number, number],
    chaty = 1,
  ) =>
    ({
      id,
      nazev: id,
      typ: 'gondola',
      typNazev: 'kabinková',
      delkaM: 1000,
      prevyseniM: 300,
      useku: 1,
      dolni: { lat: dolni[0], lng: dolni[1], vyska: horniVyska - 300 },
      horni: { lat: horni[0], lng: horni[1], vyska: horniVyska },
      uHorniStanice: Array.from({ length: chaty }, (_, i) => ({
        slug: `chata-${id}-${i}`,
        nazev: `Chata ${id} ${i}`,
        vzdalenostM: 300,
      })),
    }) as LanovkyOblasti['lanovky'][number]

  it('bere nejvyšší horní stanice, ale úseky téže dráhy počítá jednou', () => {
    // Spodní úsek končí tam, kde horní začíná (Pec → Růžová hora → Sněžka).
    const horni = l('sneska-horni', 1561, [50.72, 15.75], [50.736, 15.74])
    const spodni = l('sneska-spodni', 1334, [50.7, 15.73], [50.7201, 15.7502])
    const jina = l('jina', 1353, [50.75, 15.6], [50.76, 15.61])
    const dalsi = l('dalsi', 1311, [50.65, 15.4], [50.66, 15.41])
    // `spodni.horni` leží 20 m od `horni.dolni` → tentýž přestup.
    const vybrane = vyberKarty([spodni, jina, horni, dalsi]).map((x) => x.id)
    expect(vybrane).toEqual(['sneska-horni', 'jina', 'dalsi'])
  })

  it('dráhu bez chaty nahoře ani bez výšky horní stanice do karet nepustí', () => {
    const bezChaty = l('bez-chaty', 1600, [50.1, 15.1], [50.11, 15.11], 0)
    const bezVysky = {
      ...l('bez-vysky', 1500, [50.2, 15.2], [50.21, 15.21]),
      horni: { lat: 50.21, lng: 15.21, vyska: null },
    } as LanovkyOblasti['lanovky'][number]
    const dobra = l('dobra', 1000, [50.3, 15.3], [50.31, 15.31])
    expect(vyberKarty([bezChaty, bezVysky, dobra]).map((x) => x.id)).toEqual(['dobra'])
  })

  it('nad reálnými daty dá tři různé dráhy a každá je i v tabulce', () => {
    const vybrane = vyberKarty(DATA.lanovky)
    expect(vybrane).toHaveLength(3)
    expect(new Set(vybrane.map((x) => x.id)).size).toBe(3)
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(document.querySelectorAll('.lan-karta')).toHaveLength(3)
    // Karta nesmí tvrdit dobu jízdy — doloženou ji nemáme.
    expect(document.querySelector('.lan-karty')!.textContent).not.toMatch(/min|doba jízdy/i)
    // Tisícové mezery jsou úzké nezlomitelné — pro porovnání se odmažou.
    const bezMezer = document.querySelector('.lan-karty')!.textContent!.replace(/\s/gu, '')
    for (const v of vybrane) expect(bezMezer).toContain(String(v.horni.vyska))
  })

  it('řekne, podle čeho vybírá — čtenář nemá hádat, proč vidí zrovna tyhle', () => {
    render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    expect(screen.getByText(/Vybráno pravidlem, ne redakčním vkusem/)).toBeTruthy()
  })
})

/**
 * Jízdenkové útržky (zadání Michala 29. 7.: „jízdenkové karty lanovek chci").
 * Hlídá se, že útržky NEnahradily tabulku, ale doplnily ji: tabulka nese
 * délku, převýšení a vzdálenost k chatě, které se do útržku nevejdou, a bez
 * ní by přehled tiše zchudl.
 */
describe('jízdenkové útržky', () => {
  it('nesou všechny dráhy, které nejsou v hlavních kartách', () => {
    const { container } = render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const utrzku = container.querySelectorAll('.jzd').length
    expect(utrzku).toBe(DATA.lanovky.length - 3)
    expect(utrzku).toBeGreaterThan(0)
  })

  it('tabulka s úplnými údaji zůstává — jen složená', () => {
    const { container } = render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const detail = container.querySelector('details.lanovky-tabulka')
    expect(detail).toBeTruthy()
    expect(detail!.querySelectorAll('.lanovky-tab tbody tr')).toHaveLength(DATA.lanovky.length)
    expect(detail!.querySelector('summary')!.textContent).toContain(String(DATA.lanovky.length))
  })

  it('útržek říká druh dráhy a barví se podle něj, ne podle důležitosti', () => {
    const { container } = render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const prvni = container.querySelector('.jzd')!
    expect(prvni.className).toMatch(/jzd--(sedacka|kabina|kombi|jina)/)
    expect(prvni.querySelector('.jzd-pill')!.textContent).toBeTruthy()
  })

  it('ani na útržku nejsou ceny a jízdní řády — a je to napsané', () => {
    const { container } = render(<LanovkySeznam data={DATA} cestyChat={CESTY} />)
    const blok = container.querySelector('.lan-jizdenky')!
    expect(blok.textContent).toMatch(/Jízdní řády ani ceny/)
    expect(blok.textContent).not.toMatch(/\bKč\b/)
  })
})
