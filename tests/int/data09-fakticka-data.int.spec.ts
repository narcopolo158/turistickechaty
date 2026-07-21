/**
 * DATA-09: doplnění věcných dat chatám z katalogu „doplňková faktická data".
 * Testuje parsování milníků, načtení CSV a CHIRURGICKÉ doplnění do YAML textu:
 * doplní jen prázdné, nikdy nepřepíše, „neuvedeno" ignoruje, nezaloží duplicitní
 * klíč (regrese: kontakty + existující overeniProvoz), zachová komentáře.
 * Výsledek musí být pokaždé validní YAML. Nad podvrženými daty, bez souborů.
 */
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { doplnText, nactiFakta, parseMilniky } from '../../scripts/data09-fakticka-data'

const radek = (over: Record<string, string> = {}): Record<string, string> => ({
  nazev: 'Testchata',
  rok_vzniku: 'neuvedeno',
  rok_vzniku_zdroj: '',
  historicke_milniky: 'neuvedeno',
  historicke_milniky_zdroj: '',
  kapacita_luzek: 'neuvedeno',
  kapacita_luzek_zdroj: '',
  telefon: 'neuvedeno',
  telefon_zdroj: '',
  email: 'neuvedeno',
  email_zdroj: '',
  web: 'neuvedeno',
  web_zdroj: '',
  zajimavost: 'neuvedeno',
  zajimavost_kategorie: 'jiné',
  zajimavost_zdroj: '',
  jistota: 'A',
  overeno_k: '2026-07-21',
  ...over,
})

describe('DATA-09 · parseMilniky', () => {
  it('rozparsuje „rok — text" oddělené středníkem', () => {
    expect(parseMilniky('1625 — požár; 1914 — přestavba')).toEqual([
      { rok: 1625, udalost: 'požár' },
      { rok: 1914, udalost: 'přestavba' },
    ])
  })
  it('vynechá segmenty bez letopočtu', () => {
    expect(parseMilniky('někdy dávno — nejasné; 1900 — jasné')).toEqual([{ rok: 1900, udalost: 'jasné' }])
  })
})

describe('DATA-09 · nactiFakta', () => {
  it('načte CSV do mapy dle názvu chaty', () => {
    const csv = 'nazev,kapacita_luzek\nLuční bouda,90\nLabská bouda,neuvedeno\n'
    const m = nactiFakta(csv)
    expect(m.get('Luční bouda')?.kapacita_luzek).toBe('90')
    expect(m.size).toBe(2)
  })
})

describe('DATA-09 · doplnText (doplní jen prázdné, nepřepíše)', () => {
  const zaklad = 'nazev: Testchata\nslug: testchata\nzeme: cz\noblast: krkonose\n'

  it('doplní kapacitu + založí overeniNocleh (verified:false); výsledek je validní YAML', () => {
    const { text, doplneno } = doplnText(zaklad, radek({ kapacita_luzek: '90', kapacita_luzek_zdroj: 'https://x.cz/' }))
    const y = parse(text)
    expect(y.kapacita).toBe(90)
    expect(y.overeniNocleh.verified).toBe(false)
    expect(String(y.overeniNocleh.source)).toContain('https://x.cz/')
    expect(doplneno).toContain('kapacita=90')
  })

  it('NEPŘEPÍŠE existující hodnotu (kapacita už je)', () => {
    const { text, doplneno, ponechano } = doplnText(`${zaklad}kapacita: 40\n`, radek({ kapacita_luzek: '90' }))
    expect(parse(text).kapacita).toBe(40)
    expect(doplneno).not.toContain('kapacita=90')
    expect(ponechano).toContain('kapacita')
  })

  it('„neuvedeno" v katalogu → nic nedoplní', () => {
    const { text, doplneno } = doplnText(zaklad, radek())
    expect(doplneno).toEqual([])
    expect(text).toBe(zaklad)
  })

  it('REGRESE: telefon + existující overeniProvoz bez bloku kontakty → žádný duplicitní klíč', () => {
    const src = `${zaklad}overeniProvoz:\n  source: ruční\n  verified: true\n  checked: '2026-01-01'\n`
    const { text } = doplnText(src, radek({ telefon: '+420 111', telefon_zdroj: 'https://t.cz/' }))
    const y = parse(text) // nesmí hodit „Map keys must be unique"
    expect(y.kontakty.telefon).toBe('+420 111')
    expect(y.overeniProvoz.verified).toBe(true) // ruční blok nedotčen
  })

  it('telefon do EXISTUJÍCÍHO bloku kontakty (inline zdroj, ne nový overeniProvoz)', () => {
    const src = `${zaklad}kontakty:\n  web: https://w.cz/\novereniProvoz:\n  source: ruční\n  verified: false\n  checked: '2026-01-01'\n`
    const { text } = doplnText(src, radek({ telefon: '+420 222', telefon_zdroj: 'https://t.cz/' }))
    const y = parse(text)
    expect(y.kontakty.telefon).toBe('+420 222')
    expect(y.kontakty.web).toBe('https://w.cz/') // původní zůstalo
  })

  it('zajímavost jen když chata žádnou nemá; jinak ponechá', () => {
    const bez = doplnText(zaklad, radek({ zajimavost: 'Nej bouda', zajimavost_kategorie: 'stáří', zajimavost_zdroj: 'https://z.cz/' }))
    expect(parse(bez.text).zajimavosti[0]).toMatchObject({ text: 'Nej bouda', kategorie: 'stari' })

    const s = doplnText(`${zaklad}zajimavosti:\n  - text: Už mám\n    kategorie: jine\n`, radek({ zajimavost: 'Nová' }))
    expect(parse(s.text).zajimavosti).toHaveLength(1) // nepřidá druhou
    expect(s.ponechano).toContain('zajimavosti')
  })

  it('zachová ruční komentáře v souboru', () => {
    const src = `# důležitý komentář\nnazev: Testchata\nslug: t\nzeme: cz\noblast: krkonose\n`
    const { text } = doplnText(src, radek({ rok_vzniku: '1900', rok_vzniku_zdroj: 'https://r.cz/' }))
    expect(text).toContain('# důležitý komentář')
    expect(parse(text).rokVzniku).toBe(1900)
  })
})
