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

import { pristupyChaty } from '@/lib/pristupove-trasy'
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

/**
 * Profil chaty čte trasy ze VŠECH oblastí, ne jen z krkonošské.
 *
 * Nález 31. 7. 2026: `src/lib/pristupove-trasy.ts` i `src/lib/prechody.ts`
 * měly cestu napevno na `data/trasy/krkonose/…`, takže jizerské profily
 * neměly sekci „Odkud vyjít", přestože trasy pro ně spočítané byly. Nebylo to
 * vidět jako pád — jen jako chybějící sekce, což je horší: stránka vypadala
 * hotově a mlčky zamlčela doložená data.
 */
describe('profil chaty · trasy napříč oblastmi', () => {
  it('krkonošská i jizerská chata mají svoje přístupy', () => {
    expect(pristupyChaty('lucni-bouda').length).toBeGreaterThan(0)
    expect(pristupyChaty('horska-chata-smedava').length).toBeGreaterThan(0)
  })

  it('jizerská trasa nese délku i dopočítané převýšení a čas (DATA-06 výšky)', () => {
    const p = pristupyChaty('horska-chata-smedava')[0]!
    expect(p.delkaKm).toBeGreaterThan(0)
    // Mezistav řetězu DATA-06 (routing ze sandboxu čerstvý, výšky z Actions
    // ještě nedoběhly) je legitimní — hlídá ho stavRetezu ve workflow výšek
    // (lzeDopocitatVysky), takže zastaralé výšky se bez nového běhu nevrátí.
    // Výšky se tu proto vyžadují, jen když v datech jsou.
    if (p.prevyseni == null) return
    expect(p.prevyseni).toBeGreaterThan(0)
    expect(p.casMin).toBeGreaterThan(0)
    // Výškový profil má končit u chaty, ne u nástupu — jinak by křivka i šipka
    // „↑ převýšení" ukazovaly cestu opačným směrem.
    const profil = p.vyskovyProfil ?? []
    expect(profil.length).toBeGreaterThan(1)
    expect(profil[profil.length - 1]![1]).toBeGreaterThan(profil[0]![1])
  })

  it('neznámý slug vrací prázdno, ne výjimku', () => {
    expect(pristupyChaty('vymyslena-chata')).toEqual([])
  })
})
