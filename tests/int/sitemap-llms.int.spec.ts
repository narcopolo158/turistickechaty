/**
 * SEO/AI základ: /sitemap.xml a /llms.txt se generují z DB. Ověřuje, že sitemap
 * obsahuje statické stránky i publikované chaty (a NE /design), a že llms.txt
 * má definiční větu, odkaz na sitemapu a vede na publikované chaty. Běží proti
 * lokální naseedované DB (jako ostatní integrační testy).
 */
import { getPayload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { GET as llmsGet } from '@/app/llms.txt/route'

const BASE = 'https://turistickechaty.cz'

// Zahřát Payload (studený start stáhne schéma) — jinak by první dotaz v testu
// mohl přijít dřív, než je spojení připravené, a sitemap by neměl chaty.
beforeAll(async () => {
  await getPayload({ config: await config })
}, 60_000)

describe('sitemap.xml', () => {
  it('obsahuje statické stránky, publikované chaty a NE /design', async () => {
    const s = await sitemap()
    const urls = s.map((e) => e.url)
    expect(urls).toContain(`${BASE}/`)
    expect(urls).toContain(`${BASE}/chaty`)
    expect(urls).toContain(`${BASE}/razitkovnik`)
    expect(urls.every((u) => u.startsWith(BASE))).toBe(true) // absolutní URL
    expect(urls.some((u) => u.includes('/cesko/krkonose/'))).toBe(true) // aspoň jedna chata
    expect(urls.some((u) => u.includes('/design'))).toBe(false)
    expect(urls.some((u) => u.includes('[') || u.includes('...'))).toBe(false) // žádné šablonové cesty
  })

  it('vede i mini-stránky středisek — routa bez místa v mapě webu je slepá', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    const mini = urls.filter((u) => u.includes('/stredisko/'))
    expect(mini.length).toBeGreaterThan(0)
    // Adresy musí sedět s routou `/[zeme]/[oblast]/stredisko/[slug]`, jinak
    // by mapa webu poslala robota na 404.
    expect(
      mini.every((u) => /^https:\/\/turistickechaty\.cz\/cesko\/[^/]+\/stredisko\/[^/]+$/.test(u)),
    ).toBe(true)
    expect(new Set(mini).size).toBe(mini.length) // žádné duplicity
  })
})

describe('llms.txt', () => {
  it('vrací markdown s definiční větou, odkazem na sitemapu a chatami', async () => {
    const res = await llmsGet()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    const text = await res.text()
    expect(text).toContain('turistickechaty.cz je průvodce') // definiční věta
    expect(text).toContain(`${BASE}/sitemap.xml`)
    expect(text).toContain(`${BASE}/chaty`)
    expect(text).toMatch(/Aktualizováno: \d{4}-\d{2}-\d{2}/)
  })

  /**
   * Definiční věta se skládá z DAT (31. 7. 2026). Do té doby slibovala pokrytí
   * „od Jeseníků po Alpy" — Jeseníky přitom v průvodci nejsou a nikdy nebyly —
   * a končila slovem „obě", tedy větou napsanou pro právě dvě oblasti.
   */
  it('neslibuje pokrytí, které průvodce nemá, a nepočítá s pevným počtem oblastí', async () => {
    const text = await (await llmsGet()).text()
    expect(text).not.toContain('Jeseník')
    expect(text).not.toMatch(/obě přeshraniční/)
    expect(text).toContain('turistickými chatami')
    // Oblasti se jmenují v 6. pádu z dat — „v Krkonoších", ne „v Krkonoše".
    expect(text).toMatch(/průvodce turistickými chatami v \p{Lu}/u)
  })
})

/**
 * robots.txt (31. 7. 2026) — web žádný neměl. Sítě před weby dnes AI roboty
 * ve výchozím stavu blokují a řídí se právě tímhle souborem, takže mlčení
 * znamená neviditelnost pro jazykové modely.
 */
describe('robots.txt', () => {
  const pravidla = () => {
    const r = robots()
    return Array.isArray(r.rules) ? r.rules : [r.rules!]
  }

  it('pouští obecné roboty i jmenované AI crawlery', () => {
    const agenti = pravidla().map((p) => p.userAgent)
    expect(agenti).toContain('*')
    expect(agenti).toContain('GPTBot')
    expect(agenti).toContain('ClaudeBot')
    expect(agenti).toContain('PerplexityBot')
    expect(agenti).toContain('Google-Extended')
    expect(pravidla().every((p) => p.allow === '/')).toBe(true)
  })

  it('zavírá administraci a API, ale NE statické soubory Next.js', () => {
    for (const p of pravidla()) {
      const zakaz = (Array.isArray(p.disallow) ? p.disallow : [p.disallow!]) as string[]
      expect(zakaz).toContain('/admin')
      expect(zakaz).toContain('/api/')
      // Blokovaný /_next/ = crawler si stránku vykreslí bez CSS a potrestá ji.
      expect(zakaz.some((c) => c.includes('_next'))).toBe(false)
    }
  })

  it('odkazuje sitemapu absolutní adresou', () => {
    expect(robots().sitemap).toBe(`${BASE}/sitemap.xml`)
  })
})
