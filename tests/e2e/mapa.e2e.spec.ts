import { test, expect } from '@playwright/test'

/**
 * F0-07 mapový pás — e2e s mockem Mapy.com API (sandbox na api.mapy.com
 * nedosáhne; skutečné API ověřuje smoke workflow v Actions). Route interception
 * podvrhne tiles.json (atribuce) i dlaždice, test pak ověřuje chování mapy:
 * dlaždice se požadují se správnou šablonou, marker dle handoffu, hover preview
 * dle prototypu, atribuce z tiles.json + povinné logo, klik naviguje na profil.
 */

// 1×1 průhledný PNG jako dlaždice
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

const MOCK_ATRIBUCE = '<a href="https://api.mapy.com/copyright">© Testovací atribuce Mapy.com</a>'

test.describe('Mapový pás (F0-07)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://api.mapy.com/v1/maptiles/outdoor/tiles.json*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          tilejson: '2.2.0',
          name: 'outdoor',
          attribution: MOCK_ATRIBUCE,
          minzoom: 0,
          maxzoom: 19,
          tiles: ['https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}'],
        }),
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
  })

  test('dlaždice se požadují se šablonou outdoor a klíčem v query', async ({ page }) => {
    const pozadavek = page.waitForRequest(
      (r) =>
        /https:\/\/api\.mapy\.com\/v1\/maptiles\/outdoor\/256(@2x)?\/\d+\/\d+\/\d+\?apikey=.+/.test(
          r.url(),
        ),
      { timeout: 15000 },
    )
    await page.goto('http://localhost:3000/')
    await pozadavek
  })

  test('marker Luční boudy dle handoffu, hover preview, klik na profil', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const mapa = page.getByTestId('mapa-chat')
    await expect(mapa).toBeVisible()

    // marker v provozu: modrý kruh r8 se stroke bílou 2.5 (SVG hodnoty z handoffu);
    // Leaflet z něj dělá fokusovatelný prvek s přístupným názvem chaty
    const marker = mapa.locator('.mk-provoz')
    await expect(marker).toHaveCount(1)
    await expect(mapa.getByRole('button', { name: 'Luční bouda' })).toBeVisible()
    const kruh = marker.locator('circle')
    await expect(kruh).toHaveAttribute('fill', '#1b6e9e')
    await expect(kruh).toHaveAttribute('r', '8')
    await expect(kruh).toHaveAttribute('stroke-width', '2.5')

    // hover → preview .mpre: název · výška · stav zeleně · „Profil →"
    const preview = mapa.locator('.mpre')
    await expect(preview).toHaveCSS('opacity', '0')
    await marker.hover()
    await expect(preview).toHaveCSS('opacity', '1')
    await expect(preview).toContainText('Luční bouda')
    await expect(preview).toContainText('1 410 m')
    await expect(preview).toContainText('V provozu')
    await expect(preview).toContainText('Profil →')
    const stav = preview.locator('span', { hasText: 'V provozu' })
    await expect(stav).toHaveCSS('color', 'rgb(30, 138, 79)')

    // mouseout → preview zmizí
    await mapa.hover({ position: { x: 10, y: 10 } })
    await expect(preview).toHaveCSS('opacity', '0')

    // klik na marker naviguje na profil
    await marker.click()
    await page.waitForURL('**/cesko/krkonose/lucni-bouda')
  })

  test('atribuce z tiles.json za běhu + povinné logo Mapy.com', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const mapa = page.getByTestId('mapa-chat')

    const atribuce = mapa.locator('.leaflet-control-attribution')
    await expect(atribuce).toContainText('© Testovací atribuce Mapy.com')
    // prefix „Leaflet" je vypnutý — atribuci určuje jen tiles.json
    await expect(atribuce).not.toContainText('Leaflet')

    const logo = mapa.locator('.mlogo a')
    await expect(logo).toHaveAttribute('href', 'https://mapy.com/')
    await expect(logo.locator('img')).toHaveAttribute('alt', 'Mapy.com')
  })

  test('mapa je i v katalogu /chaty s markerem publikované chaty (rozhodnutí 20. 7.; od F1b jako pohled Mapa)', async ({ page }) => {
    // F1b: katalog má výchozí Karty; mapa je třetí pohled přepínače a stav
    // žije v URL (?view=mapa) — deep-link musí fungovat i napřímo.
    await page.goto('http://localhost:3000/chaty?view=mapa')
    const mapa = page.getByTestId('mapa-chat')
    await expect(mapa).toBeVisible()

    // stejná komponenta, markery = přefiltrovaná množina (tady vše publikované)
    await expect(mapa.locator('.mk-provoz')).toHaveCount(1)
    await mapa.locator('.mk-provoz').hover()
    await expect(mapa.locator('.mpre')).toContainText('Luční bouda')

    // klik naviguje na profil i z katalogu
    await mapa.locator('.mk-provoz').click()
    await page.waitForURL('**/cesko/krkonose/lucni-bouda')
  })

  test('katalog F1b: výchozí karty, chip filtruje a zapisuje do URL, prázdný stav poctivě', async ({ page }) => {
    await page.goto('http://localhost:3000/chaty')
    // výchozí pohled = karty s kartotéčním lístkem chaty
    await expect(page.locator('.ktl-karta').first()).toBeVisible()
    await expect(page.getByTestId('mapa-chat')).toHaveCount(0) // mapa až na vyžádání

    // chip „zaniklá": publikovaný katalog zaniklé nevede (Atlas je zvlášť)
    await page.getByRole('button', { name: 'zaniklá' }).click()
    await expect(page).toHaveURL(/chips=zanikla/)
    await expect(page.getByText('Téhle kombinaci zatím nic neodpovídá')).toBeVisible()

    // „zpět" vrací předchozí stav filtrů (pushState)
    await page.goBack()
    await expect(page.locator('.ktl-karta').first()).toBeVisible()
  })

  test('atribuce spadne na fallback, když tiles.json neodpoví', async ({ page }) => {
    await page.route('https://api.mapy.com/v1/maptiles/outdoor/tiles.json*', (route) =>
      route.abort(),
    )
    await page.goto('http://localhost:3000/')
    await expect(page.getByTestId('mapa-chat').locator('.leaflet-control-attribution')).toContainText(
      '© Seznam.cz a.s. a další',
    )
  })
})
