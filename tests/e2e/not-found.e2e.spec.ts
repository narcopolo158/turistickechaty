import { test, expect } from '@playwright/test'

test.describe('404 „MIMO ZNAČKU" (F0-08 — razítková řeč systémových stavů)', () => {
  test('neznámá URL vrací 404 s razítkovou obrazovkou a akcí zpět', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/tudy-cesta-nevede')
    expect(response?.status()).toBe(404)

    // obrazovka dle handoffu razitko-moment.html: šedý přerušovaný obrys, 404, MIMO ZNAČKU
    await expect(page.locator('.es .h')).toHaveText('Tady cesta nevede')
    await expect(page.locator('.es svg text').first()).toHaveText('404')
    await expect(page.locator('.es svg text').nth(1)).toHaveText('MIMO ZNAČKU')
    await expect(page.locator('.es p')).toContainText('Obří bouda')

    // stránka drží layout webu (hlavička s badge Deník) — není to výchozí 404 Next.js
    await expect(page.locator('header .denik')).toBeVisible()

    // akce vede zpět na rozcestí (úvod)
    const zpet = page.locator('.es a.lk')
    await expect(zpet).toHaveText('Zpět na rozcestí →')
    await zpet.click()
    await expect(page).toHaveURL('http://localhost:3000/')
    await expect(page.locator('h1').first()).toContainText('Každá bouda')
  })

  test('neexistující chata na kanonické cestě dostane tutéž obrazovku', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/cesko/krkonose/neexistujici-bouda')
    expect(response?.status()).toBe(404)
    await expect(page.locator('.es .h')).toHaveText('Tady cesta nevede')
    await expect(page.locator('.es svg text').nth(1)).toHaveText('MIMO ZNAČKU')
  })

  test('tmavý režim drží i na 404 (not-found boundary se kreslí na klientu)', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('tc-dark', '1'))
    await page.goto('http://localhost:3000/tudy-cesta-nevede')
    // inline darkInit se v client-rendered boundary neprovede — pokrývá to pojistka v SiteHeaderu
    await expect(page.locator('body')).toHaveClass(/dark/)
  })
})
