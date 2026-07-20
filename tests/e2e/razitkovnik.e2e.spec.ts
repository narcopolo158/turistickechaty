import { test, expect } from '@playwright/test'

/**
 * Razítkovník (F0-08) nad reálným serverem — v lokální DB je po seedu jen
 * Luční bouda, skóre je tedy poctivě X/1 (žádná demo čísla z prototypu).
 */
test.describe('Razítkovník', () => {
  test('bez záznamů: 0/1, prázdný deník s akcí, slot chybí', async ({ page }) => {
    await page.goto('http://localhost:3000/razitkovnik')

    await expect(page.locator('h1')).toContainText('sbírka razítek')
    await expect(page.getByTestId('skore-mam')).toHaveText('0')
    await expect(page.locator('.pbar span')).toContainText('0 % · ZBÝVÁ 1')
    await expect(page.getByTestId('slot-chybi')).toHaveCount(1)
    await expect(page.getByText('Najít první razítko →')).toBeVisible()
  })

  test('se záznamem v deníku: 1/1, slot s datem a razítkem, odznak plný', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tc-denik',
        JSON.stringify({ verze: 1, zaznamy: { 'lucni-bouda': { datum: '2026-07-20' } } }),
      )
    })
    await page.goto('http://localhost:3000/razitkovnik')

    await expect(page.getByTestId('skore-mam')).toHaveText('1')
    await expect(page.locator('.pbar span')).toContainText('100 % · ZBÝVÁ 0')
    const slot = page.getByTestId('slot-mam')
    await expect(slot).toHaveCount(1)
    await expect(slot.locator('.dt')).toHaveText('20. 7. 2026')
    await expect(slot.locator('svg')).toBeVisible() // stylizované razítko (otisk v DB zatím není)
    await expect(page.getByText('Najít první razítko →')).toHaveCount(0)
    // odznak Krkonoš: plný obvod
    const odznak = page.getByRole('img', { name: /Odznak Krkonoše: 1 z 1/ })
    await expect(odznak).toBeVisible()
    // proklik ze slotu na profil
    await slot.locator('.nm a').click()
    await expect(page).toHaveURL(/\/cesko\/krkonose\/lucni-bouda$/)
  })
})
