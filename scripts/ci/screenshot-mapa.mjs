/**
 * Snímky mapového pásu s reálnými dlaždicemi Mapy.com (F0-07) — běží ve
 * workflow „Vizuální kontrola: mapa" v GitHub Actions (sandbox denních sessions
 * na api.mapy.com nedosáhne, Actions ano). Fotí homepage light / dark / stav
 * s otevřeným hover preview a navíc katalog /chaty (mapa je v MVP i tam).
 *
 * Lokální ověření logiky bez přístupu k API: MOCK_MAPY=1 podvrhne tiles.json
 * i dlaždice stejně jako e2e testy — CI běží bez mocku, s reálnými dlaždicemi.
 * Selhání (pás se nevykreslí, dlaždice nedojedou) je tvrdá chyba: smysl snímků
 * je doložit skutečný stav, ne ho domýšlet.
 */
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const OUT = process.env.OUT_DIR ?? 'docs/screenshots/f0-07'
const MOCK = process.env.MOCK_MAPY === '1'

// 1×1 PNG pro mock dlaždic (shodné s e2e)
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
})
// deviceScaleFactor 1 → deterministická šablona 256 (retina větev 256@2x se nefotí)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

if (MOCK) {
  await page.route('https://api.mapy.com/v1/maptiles/outdoor/tiles.json*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ attribution: '© Mock atribuce', tiles: [] }),
    }),
  )
  await page.route('https://api.mapy.com/v1/maptiles/outdoor/256*/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PNG_1PX }),
  )
  await page.route('https://api.mapy.com/img/api/logo.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="18"></svg>',
    }),
  )
}

/**
 * Počká, až pás existuje, všechny dlaždice mají skutečná obrazová data
 * a je vidět atribuce i logo Mapy.com — přesně to se na snímcích posuzuje.
 */
async function cekejNaDlazdice() {
  await page.waitForSelector('[data-testid="mapa-chat"]', { timeout: 30_000 })
  await page.waitForFunction(
    () => {
      const dlazdice = [...document.querySelectorAll('img.leaflet-tile')]
      const atribuce = document.querySelector('.leaflet-control-attribution')
      const logo = document.querySelector('.mlogo img')
      return (
        dlazdice.length >= 4 &&
        dlazdice.every((d) => d.complete && d.naturalWidth > 0) &&
        atribuce != null &&
        (atribuce.textContent ?? '').trim().length > 0 &&
        logo instanceof HTMLImageElement &&
        logo.complete
      )
    },
    { timeout: 60_000 },
  )
  await page.waitForTimeout(700) // fade-in dlaždic
}

const pas = () => page.getByTestId('mapa-chat')

try {
  // 1) homepage light
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await cekejNaDlazdice()
  await pas().screenshot({ path: `${OUT}/mapa-light.png` })
  console.log('✓ mapa-light.png')

  // 2) homepage s otevřeným hover preview
  await page.locator('.mk').first().hover()
  await page.waitForFunction(() => {
    const pre = document.querySelector('.mpre')
    return pre instanceof HTMLElement && pre.style.opacity === '1'
  })
  await pas().screenshot({ path: `${OUT}/mapa-hover.png` })
  console.log('✓ mapa-hover.png')

  // 3) homepage dark („hřebenovka po tmě" — dlaždice zůstávají světlé jako v prototypu)
  await page.evaluate(() => localStorage.setItem('tc-dark', '1'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await cekejNaDlazdice()
  await pas().screenshot({ path: `${OUT}/mapa-dark.png` })
  console.log('✓ mapa-dark.png')

  // 4) katalog /chaty (mapa je v MVP i v katalogu — rozhodnutí 20. 7.)
  await page.evaluate(() => localStorage.removeItem('tc-dark'))
  await page.goto(`${BASE}/chaty`, { waitUntil: 'domcontentloaded' })
  await cekejNaDlazdice()
  await pas().screenshot({ path: `${OUT}/mapa-katalog.png` })
  console.log('✓ mapa-katalog.png')
} catch (chyba) {
  console.error('✗ Snímky mapy selhaly — pás se nevykreslil, nebo dlaždice nedojely.')
  console.error('  Zkontroluj secret MAPY_API_KEY a dostupnost api.mapy.com.')
  throw chyba
} finally {
  await browser.close()
}
