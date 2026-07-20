/**
 * Atribuce převzaté fotky u hero snímku (FotoAtribuce) — licenční povinnost
 * CC BY / CC BY-SA: autor a licence viditelné přímo u fotky, odkaz na zdroj.
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { FotoAtribuce } from '../../src/components/FotoAtribuce'
import type { Fotky as Fotka } from '../../src/payload-types'

afterEach(cleanup)

const fotka = (extra: Partial<Fotka>): Fotka =>
  ({
    id: 1,
    alt: 'Luční bouda',
    autor: 'Stanislav Dusík',
    licence: 'cc-by-sa',
    licencePoznamka: 'CC BY-SA 4.0',
    zdrojUrl: 'https://commons.wikimedia.org/wiki/File:Krkono%C5%A1e,_Lu%C4%8Dn%C3%AD_bouda.jpg',
    updatedAt: '',
    createdAt: '',
    ...extra,
  }) as Fotka

describe('FotoAtribuce', () => {
  it('u převzaté fotky zobrazí autora s přesným zněním licence jako odkaz na zdroj', () => {
    render(<FotoAtribuce fotka={fotka({})} />)
    const odkaz = screen.getByRole('link', { name: 'Foto: Stanislav Dusík · CC BY-SA 4.0' })
    expect(odkaz.getAttribute('href')).toContain('commons.wikimedia.org')
    expect(odkaz.getAttribute('rel')).toContain('noopener')
  })

  it('bez licencePoznamka spadne na obecný text licence z číselníku', () => {
    render(<FotoAtribuce fotka={fotka({ licencePoznamka: null })} />)
    expect(screen.getByText('Foto: Stanislav Dusík · CC BY-SA')).toBeTruthy()
  })

  it('bez zdrojUrl vykreslí text bez odkazu (atribuce zůstává)', () => {
    render(<FotoAtribuce fotka={fotka({ zdrojUrl: null })} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Foto: Stanislav Dusík · CC BY-SA 4.0')).toBeTruthy()
  })

  it('u vlastní fotky redakce se nezobrazuje nic', () => {
    const { container } = render(<FotoAtribuce fotka={fotka({ licence: 'vlastni' })} />)
    expect(container.innerHTML).toBe('')
  })

  it('bez autora se nezobrazuje nic (atribuci nelze splnit ani vymyslet)', () => {
    const { container } = render(<FotoAtribuce fotka={fotka({ autor: '' })} />)
    expect(container.innerHTML).toBe('')
  })
})
