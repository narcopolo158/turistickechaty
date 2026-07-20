import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('úvodní stránka se načte', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/turistickechaty\.cz/)

    // hero dle F0-02 (šablonový test z F0-01 čekal „turistickechaty.cz")
    const heading = page.locator('h1').first()

    await expect(heading).toContainText('Každá bouda')
  })

  test('badge Deník v hlavičce ukazuje počet razítek z lokálního deníku (F0-08)', async ({ page }) => {
    // bez deníku nula…
    await page.goto('http://localhost:3000')
    await expect(page.locator('header .denik b')).toHaveText('0')

    // …se dvěma záznamy v localStorage dvojka hned od načtení
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tc-denik',
        JSON.stringify({
          verze: 1,
          zaznamy: {
            'lucni-bouda': { datum: '2026-07-20' },
            vyrovka: { datum: '2026-07-20' },
          },
        }),
      )
    })
    await page.goto('http://localhost:3000')
    await expect(page.locator('header .denik b')).toHaveText('2')
  })

  test('badge Deník ve spodním tab-baru (mobil) čte tentýž deník', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tc-denik',
        JSON.stringify({ verze: 1, zaznamy: { 'lucni-bouda': { datum: '2026-07-20' } } }),
      )
    })
    await page.goto('http://localhost:3000')
    const tab = page.locator('.tabbar a', { hasText: 'Deník' })
    await expect(tab).toBeVisible()
    await expect(tab.locator('b')).toHaveText('1')
  })
})
