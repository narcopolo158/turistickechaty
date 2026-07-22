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
})
