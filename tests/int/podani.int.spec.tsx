/**
 * Komunitní podání (/prispet + /api/podani): čistá validace vstupu
 * a formulář — poctivost procesu v UI (čekárna, kredit, souhlas doslovným
 * zněním, honeypot). API route s Payloadem testuje CI build se seedem.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import PrispetForm from '@/components/PrispetForm'
import { SOUHLAS_ZNENI, zkontrolujPodani } from '@/lib/podani'

afterEach(cleanup)

describe('zkontrolujPodani — validace', () => {
  const platne = {
    druh: 'razitko',
    chataSlug: 'lucni-bouda',
    jmeno: 'Michal',
    email: null,
    poznamka: null,
    souhlas: true,
    past: null,
    soubor: { velikost: 1024, mime: 'image/jpeg' },
  }

  it('platné podání projde bez chyb', () => {
    expect(zkontrolujPodani(platne)).toEqual([])
  })

  it('bez souhlasu, chaty, jména nebo souboru neprojde — každá chyba lidsky', () => {
    const chyby = zkontrolujPodani({ ...platne, souhlas: false, chataSlug: null, jmeno: '', soubor: null })
    expect(chyby.length).toBe(4)
    expect(chyby.join(' ')).toContain('licenčního souhlasu')
  })

  it('hlídá velikost (8 MB), formát a tvar e-mailu', () => {
    expect(zkontrolujPodani({ ...platne, soubor: { velikost: 9 * 1024 * 1024, mime: 'image/jpeg' } })[0]).toContain('8 MB')
    expect(zkontrolujPodani({ ...platne, soubor: { velikost: 10, mime: 'application/pdf' } })[0]).toContain('formát')
    expect(zkontrolujPodani({ ...platne, email: 'neni-mail' })[0]).toContain('E-mail')
  })
})

describe('PrispetForm', () => {
  const chaty = [
    { slug: 'lucni-bouda', nazev: 'Luční bouda' },
    { slug: 'vyrovka', nazev: 'Výrovka' },
  ]

  it('nese oba druhy podání, doslovné znění souhlasu, honeypot a poctivou popisku čekárny', () => {
    const { container } = render(<PrispetForm chaty={chaty} />)
    expect(screen.getByText('◉ Otisk razítka')).toBeTruthy()
    expect(screen.getByText('▣ Fotka chaty')).toBeTruthy()
    expect(screen.getByText(SOUHLAS_ZNENI)).toBeTruthy() // souhlas doslovným zněním
    expect(container.querySelector('input[name="web"]')).toBeTruthy() // honeypot
    expect(screen.getByText(/Nic se nezveřejňuje automaticky/)).toBeTruthy()
  })

  it('?chata=slug předvyplní chatu (deep-link z profilu)', () => {
    window.history.replaceState(null, '', '/prispet?chata=vyrovka&druh=fotka')
    render(<PrispetForm chaty={chaty} />)
    expect((screen.getByPlaceholderText(/začni psát/) as HTMLInputElement).value).toBe('Výrovka')
    window.history.replaceState(null, '', '/prispet')
  })

  it('neznámá chata mimo seznam se odmítne s vysvětlením (podání vážeme na vedené profily)', () => {
    const { container } = render(<PrispetForm chaty={chaty} />)
    fireEvent.change(screen.getByPlaceholderText(/začni psát/), { target: { value: 'Neznámá bouda' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert').textContent).toContain('vyber ze seznamu')
  })
})
