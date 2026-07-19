import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('úvodní stránka se načte', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/turistickechaty\.cz/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('turistickechaty.cz')
  })
})
