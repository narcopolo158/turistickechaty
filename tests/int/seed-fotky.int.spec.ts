/**
 * Fotky chat v seedu (DATA-02 → profil): pomocné funkce stahování z Commons
 * a konzistence redakčního výběru v YAML Luční boudy s poli kolekce Fotky.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

import { mimeTypSouboru, nazevSouboruZUrl } from '../../scripts/seed-fotky-lib'

describe('nazevSouboruZUrl', () => {
  it('dekóduje URL Commons a vrátí bezpečný název s příponou', () => {
    // Reálné URL vybrané hero fotky: %C5%A1 = š, %2C = čárka, mezery jako %20.
    expect(
      nazevSouboruZUrl(
        'https://upload.wikimedia.org/wikipedia/commons/1/1e/Krkono%C5%A1e%2C_Lu%C4%8Dn%C3%AD_bouda.jpg',
      ),
    ).toBe('krkonose-lucni-bouda.jpg')
  })

  it('zachová příponu malými písmeny a zvládne PNG', () => {
    expect(nazevSouboruZUrl('https://example.org/cesta/Sn%C4%9B%C5%BEka.PNG')).toBe('snezka.png')
  })
})

describe('mimeTypSouboru', () => {
  it('vrací image/jpeg pro .jpg i .jpeg a image/png pro .png', () => {
    expect(mimeTypSouboru('foto.jpg')).toBe('image/jpeg')
    expect(mimeTypSouboru('foto.jpeg')).toBe('image/jpeg')
    expect(mimeTypSouboru('foto.png')).toBe('image/png')
  })

  it('nepodporovanou příponu odmítne čitelnou chybou (žádné domýšlení)', () => {
    expect(() => mimeTypSouboru('foto.webp')).toThrow(/Nepodporovaná přípona/)
  })
})

describe('redakční výběr fotek v lucni-bouda.yaml', () => {
  const yaml = parse(
    readFileSync(join(process.cwd(), 'data/chaty/krkonose/lucni-bouda.yaml'), 'utf8'),
  )

  it('každá fotka nese úplná metadata pro kolekci Fotky i pro seed', () => {
    expect(Array.isArray(yaml.fotky)).toBe(true)
    expect(yaml.fotky.length).toBeGreaterThan(0)
    for (const fotka of yaml.fotky) {
      // Identita a stažení (seed) + povinná pole kolekce (alt, autor, licence).
      expect(fotka.stahnoutZ).toMatch(/^https:\/\/upload\.wikimedia\.org\//)
      expect(fotka.zdrojUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(fotka.alt?.length).toBeGreaterThan(10)
      expect(fotka.autor?.length).toBeGreaterThan(0)
      // Jen licence, které prošly sítem DATA-02 (žádné NC/ND, žádná „jina").
      expect(['cc-by', 'cc-by-sa', 'cc0', 'pd']).toContain(fotka.licence)
      // Ověření dle CLAUDE.md: source + verified + checked; očima na stránce
      // souboru licenci zkontroluje redakce — do té doby verified: false.
      expect(fotka.overeni?.source?.length).toBeGreaterThan(0)
      expect(fotka.overeni?.verified).toBe(false)
      expect(String(fotka.overeni?.checked)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // Název souboru pro upload musí jít odvodit (jinak seed spadne až za běhu).
      expect(() => mimeTypSouboru(nazevSouboruZUrl(fotka.stahnoutZ))).not.toThrow()
    }
  })

  it('hero fotka (typ soucasna) je právě jedna a jde o doloženou fotku boudy', () => {
    const hero = yaml.fotky.filter((f: { typ?: string }) => f.typ === 'soucasna')
    expect(hero).toHaveLength(1)
    expect(hero[0].autor).toBe('Stanislav Dusík')
    expect(hero[0].licencePoznamka).toBe('CC BY-SA 4.0')
  })
})
