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

import LanovkySeznam from '@/components/LanovkySeznam'
import type { LanovkyOblasti } from '@/lib/lanovky'

const DATA = JSON.parse(
  readFileSync(join(process.cwd(), 'data', 'lanovky', 'krkonose.json'), 'utf8'),
) as LanovkyOblasti

afterEach(cleanup)

describe('LanovkySeznam nad reálnými daty Krkonoš', () => {
  it('vypíše dráhy pro pěší a jejich počet sedí s daty', () => {
    render(<LanovkySeznam data={DATA} />)
    const radky = document.querySelectorAll('.lanovky-tab tbody tr')
    expect(radky.length).toBe(DATA.lanovky.length)
    expect(DATA.lanovky.length).toBeGreaterThan(0)
  })

  it('přiznává, že vleky v přehledu nejsou (i jejich počet)', () => {
    render(<LanovkySeznam data={DATA} />)
    expect(screen.getByText(/Vleky a dětské pásy v něm nejsou/)).toBeTruthy()
    expect(document.body.textContent).toContain(String(DATA.vleku))
  })

  it('u převýšení říká, že jde o odhad z modelu, a značí ho „≈"', () => {
    render(<LanovkySeznam data={DATA} />)
    expect(document.body.textContent).toContain('odhad z výškového modelu')
    const sPrevysenim = DATA.lanovky.filter((l) => l.prevyseniM != null)
    if (sPrevysenim.length) expect(document.body.textContent).toContain('≈')
  })

  it('vzdálenost k chatě označuje jako vzdušnou čáru a odkazuje na profil', () => {
    render(<LanovkySeznam data={DATA} />)
    expect(document.body.textContent).toContain('vzdušná čára')
    const sChatou = DATA.lanovky.find((l) => l.uHorniStanice.length)
    if (sChatou) {
      const odkaz = screen.getAllByRole('link', { name: sChatou.uHorniStanice[0].nazev })[0]
      expect(odkaz.getAttribute('href')).toContain(`/${sChatou.uHorniStanice[0].slug}`)
    }
  })

  it('uvádí zdroj dat i stáří (ODbL a datum stavu OSM)', () => {
    render(<LanovkySeznam data={DATA} />)
    expect(document.body.textContent).toContain('OpenStreetMap')
    expect(document.body.textContent).toContain('ODbL')
    if (DATA.stavOsm) expect(document.body.textContent).toContain(DATA.stavOsm)
  })

  it('bez dat nevykreslí nic (nová oblast nemá prázdnou tabulku)', () => {
    const { container } = render(<LanovkySeznam data={null} />)
    expect(container.innerHTML).toBe('')
  })
})
