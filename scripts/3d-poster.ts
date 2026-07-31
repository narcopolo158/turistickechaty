/**
 * Poster 3D mapy oblasti — náhled, který stránka pohoří ukazuje před kliknutím
 * (public/3d/poster-<oblast>.jpg).
 *
 * PROČ SKRIPT, A NE RUČNÍ SNÍMEK (31. 7. 2026): poster Krkonoš vznikl kdysi
 * ručně jako `poster.jpg` a stránka na něj padala u KAŽDÉ oblasti, která svůj
 * poster neměla. Jizerské hory tak pod nadpisem „3D mapa — Jizerské hory"
 * ukazovaly panorama Krkonoš i s krkonošskými boudami v popiscích (nález
 * Michala: „tady to pořád říká Krkonoše"). Fallback je pryč a poster se dá
 * pro každou oblast vyrobit jedním příkazem — tedy i po každém běhu DATA-28,
 * který model přepočítá.
 *
 *   npx tsx scripts/3d-poster.ts --oblast jizerske-hory
 *
 * Vstup je hotová aplikace `public/3d/<oblast>.html` (DATA-28), takže skript
 * nepotřebuje síť ani API klíč — jen prohlížeč, který v repu už je (Playwright).
 *
 * VRSTVY: smrčky, sjezdovky a stíny mraků se pro poster VYPÍNAJÍ. Není to
 * kosmetika — malovaný reliéf s trasami je to, co má poster ukázat, kdežto
 * les ho přikryje a na náhledu velikosti dlaždice z něj zbyde zelená plocha.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from '@playwright/test'

import { oblastZArgv } from './oblasti'

/** Rozměr posteru — týž, jaký měl původní krkonošský snímek. */
const SIRKA = 1500
const VYSKA = 950
/** Kolik „kliknutí" kolečkem oddálit, aby se do rámu vešel celý masiv. */
const ODDALENI = 5

const main = async () => {
  const oblast = oblastZArgv()
  const koren = process.cwd()
  const app = join(koren, 'public', '3d', `${oblast.slug}.html`)
  if (!existsSync(app)) {
    throw new Error(
      `Chybí ${app} — 3D aplikaci oblasti staví DATA-28 (npx tsx scripts/data28-3d-teren.ts --oblast ${oblast.slug}).`,
    )
  }
  const cil = join(koren, 'public', '3d', `poster-${oblast.slug}.jpg`)
  mkdirSync(join(koren, 'public', '3d'), { recursive: true })

  const prohlizec = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  try {
    const stranka = await prohlizec.newPage({ viewport: { width: SIRKA, height: VYSKA } })
    await stranka.goto(`file://${app}`, { waitUntil: 'load', timeout: 180_000 })
    // Scéna se staví z vloženého JSONu a chvíli trvá, než dosedne kamera.
    await stranka.waitForTimeout(7_000)
    await stranka.evaluate(() => {
      for (const id of ['chkLes', 'chkSjez', 'chkMraky']) {
        const c = document.getElementById(id) as HTMLInputElement | null
        if (c?.checked) {
          c.checked = false
          c.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }
    })
    await stranka.waitForTimeout(2_500)
    await stranka.mouse.move(SIRKA / 2, VYSKA * 0.55)
    for (let i = 0; i < ODDALENI; i++) {
      await stranka.mouse.wheel(0, 240)
      await stranka.waitForTimeout(150)
    }
    await stranka.waitForTimeout(2_500)
    await stranka.screenshot({ path: cil, quality: 82, type: 'jpeg' })
    console.log(`Poster zapsán: ${cil} (${SIRKA}×${VYSKA}, oblast ${oblast.nazev}).`)
    console.log(
      'Pozor: poster ukazuje model TAK, JAK JE — když v něm chaty ještě nejsou (DATA-28 běželo před triáží), nebudou ani na náhledu.',
    )
  } finally {
    await prohlizec.close()
  }
}

if (process.argv[1]?.endsWith('3d-poster.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
