/**
 * Razítkovací moment + lokální deník (F0-08).
 *
 * Dokládá chování dle handoffu razitko-moment.html: klik → dopad (.hit),
 * po dopadu zápis do localStorage (`tc-denik`) a stav „✓ Ve sbírce · datum";
 * při dalším načtení otisk bez animace (.set) a živý badge počtu ve sbírce.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import RazitkoMoment from '../../src/components/RazitkoMoment'
import {
  _resetDenikProTesty,
  formatDatumDeniku,
  nactiDenik,
  pocetVeSbirce,
  pridejDoDeniku,
  usePocetDeniku,
} from '../../src/lib/denik'

function Badge() {
  return <b data-testid="badge">{usePocetDeniku()}</b>
}

beforeEach(() => {
  localStorage.clear()
  _resetDenikProTesty()
})
afterEach(cleanup)

const lucni = {
  slug: 'lucni-bouda',
  nazev: 'Luční bouda',
  pohori: 'Krkonoše',
  vyska: 1410,
}

describe('lib/denik — lokální deník', () => {
  it('začíná prázdný a přidání je idempotentní', () => {
    expect(pocetVeSbirce()).toBe(0)
    const prvni = pridejDoDeniku('lucni-bouda')
    pridejDoDeniku('lucni-bouda')
    pridejDoDeniku('vyrovka')
    expect(pocetVeSbirce()).toBe(2)
    expect(nactiDenik().zaznamy['lucni-bouda']).toEqual(prvni)
    // datum záznamu je dnešek v ISO (lokální čas návštěvníka)
    expect(prvni.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('přežije reload (čte se z localStorage) a ignoruje poškozený zápis', () => {
    pridejDoDeniku('lucni-bouda')
    _resetDenikProTesty() // „reload" — zahodí cache, zůstane jen localStorage
    expect(pocetVeSbirce()).toBe(1)

    localStorage.setItem('tc-denik', '{rozbité json')
    _resetDenikProTesty()
    expect(pocetVeSbirce()).toBe(0)
  })

  it('formatDatumDeniku: „2026-07-20" → „20. 7. 2026"', () => {
    expect(formatDatumDeniku('2026-07-20')).toBe('20. 7. 2026')
  })
})

describe('RazitkoMoment', () => {
  it('bez záznamu: hint, CTA a stylizované razítko z doložených údajů', () => {
    const { container } = render(<RazitkoMoment {...lucni} />)

    expect(screen.getByTestId('pad').className).toBe('pad')
    expect(screen.getByText(/SEM DOPADNE/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Přidat razítko chaty Luční bouda/ })).toBeTruthy()

    // stylizované SVG: název, pohoří s oddělovači, výška, rozpití inkoustu
    const svg = container.querySelector('.pad svg')!
    expect(svg.textContent).toContain('LUČNÍ BOUDA')
    expect(svg.textContent).toContain('· KRKONOŠE ·')
    expect(svg.textContent).toContain('1410 M')
    expect(svg.querySelector('filter feTurbulence')).toBeTruthy()
  })

  it('klik → dopad .hit → zápis do deníku a „✓ Ve sbírce" s dneškem; druhý klik nic nepřidá', async () => {
    render(
      <>
        <RazitkoMoment {...lucni} />
        <Badge />
      </>,
    )

    expect(screen.getByTestId('badge').textContent).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: /Přidat razítko/ }))

    // animace dopadu běží, zapsáno je až v okamžiku dopadu (~480 ms)
    expect(screen.getByTestId('pad').className).toBe('pad hit')
    expect(pocetVeSbirce()).toBe(0)

    await waitFor(() => expect(screen.getByTestId('badge').textContent).toBe('1'), {
      timeout: 2000,
    })

    const zaznam = nactiDenik().zaznamy['lucni-bouda']
    const tlacitko = screen.getByRole('button')
    expect(tlacitko.textContent).toBe(`✓ Ve sbírce · ${formatDatumDeniku(zaznam.datum)}`)
    expect(tlacitko.className).toBe('btn done')
    // pad zůstává .hit — finální stav drží animation forwards, žádný restart
    expect(screen.getByTestId('pad').className).toBe('pad hit')

    fireEvent.click(tlacitko)
    expect(pocetVeSbirce()).toBe(1)
  })

  it('se záznamem z dřívějška: otisk hned viditelný (.set) bez animace, hint skrytý', () => {
    act(() => {
      pridejDoDeniku('lucni-bouda')
    })
    render(<RazitkoMoment {...lucni} />)

    expect(screen.getByTestId('pad').className).toBe('pad set')
    const tlacitko = screen.getByRole('button')
    expect(tlacitko.textContent).toContain('✓ Ve sbírce')
    expect(tlacitko.getAttribute('aria-disabled')).toBe('true')
  })

  it('poctivostní štítek (historický otisk) se ukáže pod padem jen s propem', () => {
    const { container, rerender } = render(
      <RazitkoMoment {...lucni} otiskUrl="/media/otisk.png" stitek="historický otisk · cca konec 80. let (odhad)" />,
    )
    const stitek = container.querySelector('.pad-stitek')!
    expect(stitek.textContent).toBe('historický otisk · cca konec 80. let (odhad)')
    // bez propu štítek není — aktuální razítka žádné označení nedostávají
    rerender(<RazitkoMoment {...lucni} otiskUrl="/media/otisk.png" />)
    expect(container.querySelector('.pad-stitek')).toBeNull()
  })

  it('skutečný otisk z DB má přednost před stylizovaným SVG', () => {
    const { container } = render(
      <RazitkoMoment {...lucni} otiskUrl="/media/otisk.png" otiskAlt="Otisk razítka Luční boudy" />,
    )
    const img = container.querySelector<HTMLImageElement>('.pad img')!
    expect(img.getAttribute('src')).toBe('/media/otisk.png')
    expect(img.getAttribute('alt')).toBe('Otisk razítka Luční boudy')
    expect(container.querySelector('.pad svg')).toBeNull()
  })

  it('víc otisků na stránce nesdílí SVG id (useId prefixy)', () => {
    const { container } = render(
      <>
        <RazitkoMoment {...lucni} />
        <RazitkoMoment slug="vyrovka" nazev="Výrovka" pohori="Krkonoše" />
      </>,
    )
    const ids = [...container.querySelectorAll('svg [id]')].map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
