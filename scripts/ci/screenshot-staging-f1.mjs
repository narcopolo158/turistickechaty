/**
 * F1 · Vizuální kontrola ŽIVÉHO STAGINGU (dev.turistickechaty.cz).
 *
 * Denní sessions na staging ze sandboxu nedosáhnou — GitHub Actions ano
 * (stejné rozhodnutí jako u F0-07: kontrola se dělá tudy). Skript vyfotí
 * šablony F1 nad reálnými daty a nasazeným buildem: homepage, katalog
 * (karty/řádky/mapa), stránku pohoří, mini-stránku střediska — ve dne
 * i v noci (noc = `tc-dark=1` v localStorage před načtením, přesně jak
 * to dělá SiteHeader) a klíčové stránky i v mobilní šířce.
 *
 * Výstup: docs/kontroly/f1-staging/*.png (commitne workflow). Porovnání
 * proti design/handoff-f1/screenshots/ dělá hlavní session / Michal.
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const ZAKLAD = process.env.STAGING_URL ?? 'https://dev.turistickechaty.cz'
const VYSTUP = 'docs/kontroly/f1-staging'
mkdirSync(VYSTUP, { recursive: true })

/** [soubor, cesta, {noc, mobil, fullPage}] */
const SNIMKY = [
  ['01-homepage-den', '/', {}],
  ['02-homepage-noc', '/', { noc: true }],
  ['03-homepage-mobil', '/', { mobil: true }],
  ['04-katalog-karty-den', '/chaty', {}],
  ['05-katalog-karty-noc', '/chaty', { noc: true }],
  ['06-katalog-radky', '/chaty?view=radky', {}],
  ['07-katalog-mapa', '/chaty?view=mapa', {}],
  ['08-katalog-mobil', '/chaty', { mobil: true }],
  ['09-pohori-den', '/cesko/krkonose', {}],
  ['10-pohori-noc', '/cesko/krkonose', { noc: true }],
  ['11-pohori-mobil', '/cesko/krkonose', { mobil: true }],
  ['12-stredisko-pec', '/cesko/krkonose/stredisko/pec-pod-snezkou', {}],
  ['13-stredisko-pec-noc', '/cesko/krkonose/stredisko/pec-pod-snezkou', { noc: true }],
  ['14-stredisko-karpacz', '/polsko/krkonose/stredisko/karpacz', {}],
]

const prohlizec = await chromium.launch()
let chyb = 0

for (const [soubor, cesta, moznosti = {}] of SNIMKY) {
  const ctx = await prohlizec.newContext({
    viewport: moznosti.mobil ? { width: 390, height: 844 } : { width: 1400, height: 1000 },
    deviceScaleFactor: moznosti.mobil ? 2 : 1,
    reducedMotion: 'reduce', // stabilní snímky bez rozanimovaných mezistavů
  })
  if (moznosti.noc) {
    await ctx.addInitScript(() => localStorage.setItem('tc-dark', '1'))
  }
  const stranka = await ctx.newPage()
  const chyby = []
  stranka.on('pageerror', (e) => chyby.push(String(e.message).slice(0, 160)))
  try {
    const odpoved = await stranka.goto(ZAKLAD + cesta, { waitUntil: 'networkidle', timeout: 45_000 })
    if (!odpoved || odpoved.status() >= 400) {
      throw new Error(`HTTP ${odpoved ? odpoved.status() : 'bez odpovědi'}`)
    }
    // Leaflet dlaždice a lazy obrázky potřebují chvilku i po networkidle.
    await stranka.waitForTimeout(2500)
    await stranka.screenshot({ path: `${VYSTUP}/${soubor}.png`, fullPage: true })
    console.log(`OK  ${soubor}  (${cesta})${chyby.length ? `  — pageerrors: ${chyby.join(' | ')}` : ''}`)
    if (chyby.length) chyb++
  } catch (e) {
    console.error(`!!  ${soubor}  (${cesta}) — ${String(e.message).slice(0, 200)}`)
    chyb++
  }
  await ctx.close()
}

await prohlizec.close()
if (chyb > 0) {
  console.error(`Hotovo s ${chyb} problémy — snímky, které vznikly, se commitnou i tak (viz log).`)
  process.exitCode = 1
} else {
  console.log('Hotovo — všechny snímky pořízeny bez chyb.')
}
