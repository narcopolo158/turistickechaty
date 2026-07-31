/**
 * „N chat odtud" na kartě střediska (handoff F1 v2, sekce 04).
 *
 * Číslo se počítá z přístupových tras (DATA-06). Past, kvůli které tenhle
 * test existuje: pipeline zapisuje výchozí body podrobněji, než se jmenují
 * střediska — „Janské Lázně, horní stanice kabinkové lanovky Černohorský
 * Express" nebo „Szklarska Poręba Górna, železniční stanice". Porovnání
 * celých názvů by u poloviny středisek ukázalo pomlčku, přestože trasy odtud
 * doložené máme, a nikdo by nepoznal, že jde o chybu, a ne o chybějící data.
 */
import { describe, expect, it } from 'vitest'

import { chatZBodu } from '@/lib/pristupy'

describe('chaty dostupné ze střediska', () => {
  it('najde i body zapsané s upřesněním za čárkou', () => {
    // „Janské Lázně" nemají v datech ani jeden bod pojmenovaný přesně tak —
    // všechny nesou dovětek. Přesto z nich trasy vedou.
    const jl = chatZBodu('krkonose', 'Janské Lázně')
    expect(jl).not.toBeNull()
    expect(jl!.pocet).toBeGreaterThan(0)
  })

  it('najde i obec upřesněnou bez čárky (Szklarska Poręba Górna)', () => {
    const sp = chatZBodu('krkonose', 'Szklarska Poręba')
    expect(sp).not.toBeNull()
    expect(sp!.pocet).toBeGreaterThan(0)
  })

  it('táž chata z více zastávek téhož střediska se počítá jednou', () => {
    const pec = chatZBodu('krkonose', 'Pec pod Sněžkou')!
    const slugy = pec.chaty.map((ch) => ch.slug)
    expect(new Set(slugy).size).toBe(slugy.length)
    expect(pec.pocet).toBe(slugy.length)
  })

  it('nerozliší-li se obec, vrací null — ne nulu', () => {
    // Nula by tvrdila „odtud nikam cesta nevede", což je jiné tvrzení než
    // „trasy odtud nemáme spočítané".
    expect(chatZBodu('krkonose', 'Neexistující Ves')).toBeNull()
    expect(chatZBodu('jizerske-hory', 'Neexistující Ves')).toBeNull()
  })

  /**
   * Do 31. 7. 2026 tady stálo, že Bedřichov vrací `null` — tehdy pravda, protože
   * pro Jizerky ještě neběžel routing. Teď běžel, takže by tentýž řádek hlídal
   * opak toho, co má: `null` znamená „nemáme spočítáno", ne „odtud nic nevede".
   */
  it('po doběhnutí routingu Jizerek vrací Bedřichov skutečné chaty', () => {
    const bedrichov = chatZBodu('jizerske-hory', 'Bedřichov')
    expect(bedrichov).not.toBeNull()
    expect(bedrichov!.pocet).toBeGreaterThan(0)
    expect(bedrichov!.chaty.map((ch) => ch.slug)).toContain('hrebinek')
  })

  it('nechytá cizí obec se stejným začátkem slova (Malá × Velká Úpa)', () => {
    const mala = chatZBodu('krkonose', 'Malá Úpa')
    const velka = chatZBodu('krkonose', 'Velká Úpa')
    expect(mala).not.toBeNull()
    expect(velka).not.toBeNull()
    // Množiny chat se nesmí shodovat — jsou to dvě různá východiska.
    expect(mala!.chaty.map((c) => c.slug)).not.toEqual(velka!.chaty.map((c) => c.slug))
  })
})
