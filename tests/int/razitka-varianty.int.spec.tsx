/**
 * Varianty otisku razítka na profilu (zadání Michala 28. 7. 2026: „škoda
 * ukazovat jen jednu verzi razítka, když jich máme víc").
 *
 * Testuje se to, co může tiše přestat fungovat: že se ukážou VŠECHNY doložené
 * varianty, že se přepínají klikem i klávesnicí, že popiska pod otiskem stojí
 * jen na doložených polích (co v datech není, se nedopisuje) a že natočení
 * otisků je deterministické — kdyby se počítalo náhodně, rozešel by se server
 * s klientem při hydrataci a vějíř by při každém renderu cukl.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import RazitkaVarianty, { VybranyOtisk, type VariantaOtisku } from '@/components/RazitkaVarianty'

afterEach(cleanup)

const v = (prepis: Partial<VariantaOtisku> & { id: string; poradi: number }): VariantaOtisku => ({
  nazev: `Otisk ${prepis.poradi}`,
  otiskUrl: `/media/otisky/${prepis.id}.gif`,
  otiskAlt: `Otisk ${prepis.poradi} — Luční bouda`,
  historicke: false,
  stav: 'k dispozici',
  obdobi: null,
  dolozil: null,
  zdroj: null,
  zdrojUrl: null,
  ...prepis,
})

const SEDM = Array.from({ length: 7 }, (_, i) => v({ id: `r${i + 1}`, poradi: i + 1 }))

/** Obal, který drží výběr — jako profil chaty. */
function List({ varianty = SEDM }: { varianty?: VariantaOtisku[] }) {
  const [vybrana, setVybrana] = useState(varianty[0].id)
  const aktualni = varianty.find((x) => x.id === vybrana)!
  return (
    <>
      <VybranyOtisk varianta={aktualni} celkem={varianty.length} nazevChaty="Luční bouda" />
      <RazitkaVarianty varianty={varianty} vybranaId={vybrana} onVyber={setVybrana} />
    </>
  )
}

describe('Varianty otisku razítka', () => {
  it('ukáže všechny doložené varianty, ne jen jednu — a první je vybraná', () => {
    const { container } = render(<List />)
    const dlazdice = container.querySelectorAll('.zap-list-otisk')
    expect(dlazdice).toHaveLength(7)
    expect(screen.getByRole('radiogroup', { name: 'Varianty otisku — 7' })).toBeTruthy()
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)
    expect(container.querySelector('.zap-otisk-plocha img')!.getAttribute('src')).toBe('/media/otisky/r1.gif')
  })

  it('klik přepne velký otisk i popisku', () => {
    const { container } = render(<List />)
    fireEvent.click(screen.getByRole('radio', { name: 'Otisk 4' }))
    expect(container.querySelector('.zap-otisk-plocha img')!.getAttribute('src')).toBe('/media/otisky/r4.gif')
    expect(screen.getByText(/varianta 4 z 7/)).toBeTruthy()
  })

  it('šipky přepínají dokola, Home/End skáčou na kraje (roving tabindex)', () => {
    const { container } = render(<List />)
    const skupina = screen.getByRole('radiogroup')
    fireEvent.keyDown(skupina, { key: 'ArrowRight' })
    expect(screen.getByText(/varianta 2 z 7/)).toBeTruthy()
    fireEvent.keyDown(skupina, { key: 'ArrowLeft' })
    fireEvent.keyDown(skupina, { key: 'ArrowLeft' }) // z první doleva = poslední
    expect(screen.getByText(/varianta 7 z 7/)).toBeTruthy()
    fireEvent.keyDown(skupina, { key: 'Home' })
    expect(screen.getByText(/varianta 1 z 7/)).toBeTruthy()
    fireEvent.keyDown(skupina, { key: 'End' })
    expect(screen.getByText(/varianta 7 z 7/)).toBeTruthy()
    // fokus drží jen vybraná dlaždice — do listu se vstupuje jedním tabem
    const tab0 = [...container.querySelectorAll('.zap-list-otisk')].filter((d) => d.getAttribute('tabindex') === '0')
    expect(tab0).toHaveLength(1)
  })

  it('natočení vějíře je deterministické a symetrické (žádná náhoda v renderu)', () => {
    const { container } = render(<List />)
    const rot = [...container.querySelectorAll<HTMLElement>('.zap-list-otisk')].map((d) => d.style.getPropertyValue('--rot'))
    expect(rot).toEqual(['-6deg', '-4deg', '-2deg', '0deg', '2deg', '4deg', '6deg'])
    // druhý render musí dát totéž — jinak by se rozešla hydratace
    cleanup()
    const znovu = render(<List />).container
    expect([...znovu.querySelectorAll<HTMLElement>('.zap-list-otisk')].map((d) => d.style.getPropertyValue('--rot'))).toEqual(rot)
  })

  it('popiska stojí jen na doložených polích — co v datech není, se nedopisuje', () => {
    const { container, rerender } = render(
      <VybranyOtisk
        varianta={v({ id: 'h', poradi: 7, historicke: true, stav: 'historický otisk', obdobi: 'cca konec 80. let (odhad)', dolozil: 'Michal (redakce)' })}
        celkem={7}
        nazevChaty="Luční bouda"
      />,
    )
    const udaje = container.querySelector('.zap-otisk-udaje')!
    expect(udaje.textContent).toContain('historický otisk')
    expect(udaje.textContent).toContain('cca konec 80. let (odhad)')
    expect(udaje.textContent).toContain('doložil Michal (redakce)')
    expect(udaje.querySelector('.dot.hist')).toBeTruthy() // šedá tečka = už se nerazítkuje

    // bez období a bez kredit
    rerender(<VybranyOtisk varianta={v({ id: 'x', poradi: 1 })} celkem={3} nazevChaty="Luční bouda" />)
    const holy = container.querySelector('.zap-otisk-udaje')!
    expect(holy.textContent).toContain('varianta 1 z 3')
    expect(holy.textContent).not.toContain('doložil')
    expect(holy.textContent).not.toContain('–') // žádná prázdná pomlčka po nedoloženém údaji
  })

  it('chybějící sken varianty se přizná, nevykreslí se prázdné okno', () => {
    render(<VybranyOtisk varianta={v({ id: 'bez', poradi: 2, otiskUrl: null })} celkem={2} nazevChaty="Luční bouda" />)
    expect(screen.getByText(/otisk téhle varianty zatím nemáme/)).toBeTruthy()
  })

  it('jediná varianta vějíř nedělá — profil zůstává jako dřív', () => {
    const { container } = render(
      <RazitkaVarianty varianty={[v({ id: 'jedna', poradi: 1 })]} vybranaId="jedna" onVyber={() => {}} />,
    )
    expect(container.querySelector('.zap-listovnik')).toBeNull()
  })

  it('najetí na otisk ukáže jeho název místo nápovědy (vějíř se dá přečíst bez klikání)', () => {
    const { container } = render(<List />)
    const napoveda = container.querySelector('.zap-list-napoveda')!
    expect(napoveda.textContent).toBe('klikni na otisk nebo přepínej šipkami')
    fireEvent.mouseEnter(within(container).getByRole('radio', { name: 'Otisk 3' }))
    expect(napoveda.textContent).toBe('Otisk 3')
    fireEvent.mouseLeave(within(container).getByRole('radio', { name: 'Otisk 3' }))
    expect(napoveda.textContent).toBe('klikni na otisk nebo přepínej šipkami')
  })
})
