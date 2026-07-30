/**
 * Rozsah průvodce = „turistické chaty", řečený nahlas
 * (rozhodnutí Michala 30. 7. 2026: „řekněme nahlas turistické chaty").
 *
 * Do 30. 7. se web představoval jako průvodce HORSKÝMI chatami, ale do
 * korpusu už mířily objekty, které horské chaty nejsou — turistická chata
 * v Prachovských skalách a Riegrova chata na Kozákově. Buď je vyřadit, nebo
 * rozsah rozšířit a nepředstírat, že jsou to hory; Michal zvolil druhé.
 *
 * Slib pokrytí je věta ve zdroji, ne funkce — hlídá se tedy zdroj, stejně
 * jako u noční sady tokenů nebo manifestu fotek. A hlídá se z obou stran:
 * že nový slib je vidět, a že se starý nevrátil zadními dveřmi.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const zdroj = (cesta: string) => readFileSync(join(process.cwd(), cesta), 'utf8')

/** Místa, kde web slibuje, CO vede — tedy zastřešující nabídka pokrytí. */
const SLIBY = [
  'src/app/(frontend)/layout.tsx',
  'src/components/SiteFooter.tsx',
  'src/app/(frontend)/page.tsx',
  'src/app/(frontend)/chaty/page.tsx',
  'src/app/(frontend)/[zeme]/[oblast]/page.tsx',
  'src/app/(frontend)/[zeme]/[oblast]/[chata]/opengraph-image.tsx',
  'src/app/(frontend)/prispet/page.tsx',
  'src/app/(frontend)/razitkovnik/page.tsx',
]

describe('slib pokrytí mluví o turistických chatách', () => {
  it('nikde v těch místech nestojí „všemi horskými chatami"', () => {
    const spatne = SLIBY.filter((c) => /všemi horskými chatami/u.test(zdroj(c)))
    expect(spatne, `starý slib pokrytí:\n${spatne.join('\n')}`).toEqual([])
  })

  it('titulek, footer i hlavička homepage slibují turistické chaty', () => {
    expect(zdroj('src/app/(frontend)/layout.tsx')).toContain('průvodce turistickými chatami')
    expect(zdroj('src/components/SiteFooter.tsx')).toContain('průvodce turistickými chatami')
    expect(zdroj('src/app/(frontend)/page.tsx')).toContain('Průvodce turistickými chatami')
  })

  it('kontrola samotné kontroly — vzorec starého slibu by se opravdu našel', () => {
    // Kdyby byl regex vadný, test výš by procházel vždycky.
    expect(/všemi horskými chatami/u.test('průvodce všemi horskými chatami · Krkonoše')).toBe(true)
  })
})

describe('rozsah je vidět na webu, ne jen v dokumentaci', () => {
  const stranka = zdroj('src/app/(frontend)/[zeme]/[oblast]/page.tsx')

  it('FAQ oblasti má otázku na rozsah a jmenuje i to, co hory nejsou', () => {
    expect(stranka).toContain('Jaké chaty průvodce vede?')
    expect(stranka).toMatch(/skalních městech/u)
    expect(stranka).toMatch(/útulny/u)
  })

  it('FAQ přiznává, když oblast pohoří není', () => {
    expect(stranka).toContain("oblast.typ === 'pohori'")
    expect(stranka).toMatch(/není pohoří, je to turistická oblast/u)
  })

  it('rozhoduje role na trase, ne typ stavby — a stránka to říká', () => {
    expect(stranka).toMatch(/ne typ stavby/u)
  })
})

describe('úroveň oblasti umí přiznat, že to není pohoří', () => {
  it('číselník má hodnotu `turisticka-oblast`', () => {
    const oblasti = zdroj('src/collections/Oblasti.ts')
    expect(oblasti).toContain("value: 'turisticka-oblast'")
    // Pohoří i podoblast zůstávají — nová hodnota je přidaná, ne náhrada.
    expect(oblasti).toContain("value: 'pohori'")
    expect(oblasti).toContain("value: 'podoblast'")
  })

  it('rozhodnutí je zapsané v plánu i v CLAUDE.md, ať se nezapomene', () => {
    expect(zdroj('docs/plan.md')).toMatch(/turistické chaty na značených trasách/u)
    expect(zdroj('CLAUDE.md')).toMatch(/řekněme nahlas turistické chaty/u)
  })
})
