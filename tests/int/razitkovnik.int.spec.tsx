/**
 * Razítkovník (F0-08): skóre, progress, sloty a odznak se skládají z chat
 * předaných serverem a z lokálního deníku — žádná demo čísla z prototypu.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import RazitkovnikClient, { type RazitkovnikChata } from '../../src/components/RazitkovnikClient'
import { _resetDenikProTesty, formatDatumDeniku, pridejDoDeniku } from '../../src/lib/denik'

const chata = (slug: string, nazev: string, extra: Partial<RazitkovnikChata> = {}): RazitkovnikChata => ({
  slug,
  nazev,
  vyska: 1400,
  oblastNazev: 'Krkonoše',
  url: `/cesko/krkonose/${slug}`,
  otiskUrl: null,
  otiskAlt: null,
  kdeSeRazitkuje: null,
  maOtiskVDb: false,
  ...extra,
})

const TRI = [
  chata('lucni-bouda', 'Luční bouda', { kdeSeRazitkuje: 'na baru v bufetu' }),
  chata('vyrovka', 'Výrovka'),
  chata('labska-bouda', 'Labská bouda'),
]

beforeEach(() => {
  localStorage.clear()
  _resetDenikProTesty()
})
afterEach(cleanup)

describe('RazitkovnikClient', () => {
  it('prázdný deník: skóre 0/3, progress 0 %, všechny sloty chybějící, výzva k prvnímu razítku', () => {
    render(<RazitkovnikClient titulek="Krkonoše — sbírka razítek" chaty={TRI} />)

    expect(screen.getByTestId('skore-mam').textContent).toBe('0')
    expect(screen.getByText(/0 % · ZBÝVÁ 3 · ODZNAK KRKONOŠE/)).toBeTruthy()
    expect(screen.getByTestId('pbar-vypln').style.width).toBe('0%')
    expect(screen.getAllByTestId('slot-chybi')).toHaveLength(3)
    expect(screen.queryAllByTestId('slot-mam')).toHaveLength(0)
    // prázdný stav nabízí akci; chybějící slot bez místa razítkování nese poctivé „zatím bez otisku"
    expect(screen.getByText('Najít první razítko →').getAttribute('href')).toBe('/chaty')
    expect(screen.getByText('Razítkuje se: na baru v bufetu')).toBeTruthy()
    expect(screen.getAllByText('Zatím bez otisku')).toHaveLength(2)
  })

  it('1 z 3 ve sbírce: skóre, procenta, datum ve slotu i odznak sedí', () => {
    const zaznam = pridejDoDeniku('vyrovka')
    render(<RazitkovnikClient titulek="Krkonoše — sbírka razítek" chaty={TRI} />)

    expect(screen.getByTestId('skore-mam').textContent).toBe('1')
    expect(screen.getByText(/33 % · ZBÝVÁ 2/)).toBeTruthy()
    expect(screen.getByTestId('pbar-vypln').style.width).toBe('33%')
    expect(screen.getAllByTestId('slot-mam')).toHaveLength(1)
    expect(screen.getAllByTestId('slot-chybi')).toHaveLength(2)
    expect(screen.getByText(formatDatumDeniku(zaznam.datum))).toBeTruthy()
    // sbírkový slot nese stylizované razítko (otisk v DB není)
    expect(screen.getByTestId('slot-mam').querySelector('svg text')?.textContent).toContain('VÝROVKA')
    // odznak: 1/3 → 101 z 302 po obvodu
    const odznak = screen.getByRole('img', { name: 'Odznak Krkonoše: 1 z 3 razítek' })
    expect(odznak.querySelector('circle[stroke="#e0341f"]')?.getAttribute('stroke-dasharray')).toBe('101 302')
    // „prázdný deník" blok zmizel
    expect(screen.queryByText('Najít první razítko →')).toBeNull()
  })

  it('slugy v deníku bez chaty v DB se do skóre razítkovníku nepočítají', () => {
    pridejDoDeniku('neexistujici-bouda')
    render(<RazitkovnikClient titulek="Krkonoše — sbírka razítek" chaty={TRI} />)
    expect(screen.getByTestId('skore-mam').textContent).toBe('0')
  })

  it('otisk z DB má ve sbírkovém slotu přednost před stylizovaným SVG', () => {
    pridejDoDeniku('lucni-bouda')
    const sOtiskem = [chata('lucni-bouda', 'Luční bouda', { otiskUrl: '/media/otisk.png', otiskAlt: 'Otisk — Luční bouda', maOtiskVDb: true })]
    render(<RazitkovnikClient titulek="Krkonoše — sbírka razítek" chaty={sOtiskem} />)

    const slot = screen.getByTestId('slot-mam')
    expect(slot.querySelector('img')?.getAttribute('src')).toBe('/media/otisk.png')
    expect(slot.querySelector('svg')).toBeNull()
    // vše má otisk v DB → výzva komunitě se nezobrazuje
    expect(screen.queryByText(/VÝZVA/)).toBeNull()
  })

  it('víc oblastí: skupiny s vlastní lištou a odznakem, titulek bez odznaku v progress textu', () => {
    const dveOblasti = [...TRI, chata('rysavka', 'Rysavka', { oblastNazev: 'Jeseníky', url: null })]
    pridejDoDeniku('rysavka')
    render(<RazitkovnikClient titulek="Sbírka razítek" chaty={dveOblasti} />)

    expect(screen.getByText('Krkonoše')).toBeTruthy()
    expect(screen.getByText('Jeseníky')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Odznak Krkonoše: 0 z 3 razítek' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Odznak Jeseníky: 1 z 1 razítek' })).toBeTruthy()
    expect(screen.getByText(/25 % · ZBÝVÁ 3/).textContent).not.toContain('ODZNAK')
  })

  it('bez chat v DB: poctivý prázdný stav s akcí zpět na úvod', () => {
    render(<RazitkovnikClient titulek="Sbírka razítek" chaty={[]} />)
    expect(screen.getByText('Prázdný razítkovník')).toBeTruthy()
    expect(screen.getByText('Zpět na úvod →').getAttribute('href')).toBe('/')
  })
})
