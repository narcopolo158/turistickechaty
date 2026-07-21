/**
 * DATA-05 (fáze 3c): z manifestu stažených otisků (`data/razitka/skeny/_otisky.json`,
 * výstup fáze 3b) založí razítkové YAML záznamy `prevzato-se-svolenim` — jeden
 * na každý otisk, vedle jeho obrázku v `data/razitka/skeny/<slug>/<id>.yaml`.
 * Seed je pak nahraje (otisk → Fotky, razítko s viditelným zdrojem).
 *
 * Poctivost: u každého otisku povinný zdroj (odkaz na razitkuj.cz) + svolil;
 * `verified: false`. razitkuj neuvádí stáří ani aktuálnost varianty → `stav`
 * NEnastavujeme (nedomýšlet, která se dnes razítkuje); jen se přizná počet variant.
 *
 *   npx tsx scripts/data05-razitkuj-zaloz.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { stringify } from 'yaml'

import type { ManifestChata, ManifestOtisk } from './data05-razitkuj-otisky'

const SKENY_ADRESAR = join(process.cwd(), 'data', 'razitka', 'skeny')
const MANIFEST_JSON = join(SKENY_ADRESAR, '_otisky.json')

type Manifest = { svolil: string; stazeno: string; chaty: ManifestChata[] }

/** Sestaví razítkový záznam (YAML data) pro jeden převzatý otisk. */
export const razitkoZaznam = (
  chata: ManifestChata,
  otisk: ManifestOtisk,
  poradi: number,
  celkem: number,
  svolil: string,
  stazeno: string,
): Record<string, unknown> => {
  const nazevSouboru = basename(otisk.soubor)
  const source = `razitkuj.cz ${chata.zdrojUrl} — otisk se svolením (${svolil})`
  return {
    chata: chata.slug,
    nazev: `${chata.nazev} — otisk z razitkuj.cz (var. ${poradi}/${celkem})`,
    zpusobZiskani: 'prevzato-se-svolenim',
    prevzeti: {
      zdroj: 'razitkuj.cz',
      zdrojUrl: chata.zdrojUrl,
      svolil,
    },
    dolozil: 'razitkuj.cz (se svolením)',
    // `stav` vědomě nevyplněn: razitkuj neuvádí, která varianta je aktuální.
    poznamka:
      `Otisk převzat se svolením z razitkuj.cz` +
      (celkem > 1 ? ` (varianta ${poradi} z ${celkem}).` : '.') +
      ' Stáří ani aktuálnost varianty razitkuj neuvádí — dnešní stav na chatě neověřen.',
    otisk: {
      soubor: nazevSouboru,
      alt: `Otisk razítka ${chata.nazev} (převzato se svolením z razitkuj.cz)`,
      typ: 'otisk-razitka',
      // Jednotlivého skenaře razitkuj neuvádí — autor = sbírka (poctivě, nedomýšlet jméno).
      autor: 'razitkuj.cz (sbírka přispěvatelů)',
      licence: 'se-svolenim',
      zdrojUrl: otisk.obrazekUrl,
      overeni: { source, verified: false, checked: stazeno },
    },
    overeni: {
      source: `razitkuj.cz (se svolením — ${svolil})`,
      verified: false,
      checked: stazeno,
    },
  }
}

const yamlRazitko = (chata: ManifestChata, data: Record<string, unknown>): string =>
  [
    `# ${data.nazev}`,
    `# Otisk převzatý se svolením z razitkuj.cz (zdroj: ${chata.zdrojUrl}).`,
    '# Vygenerováno z manifestu fáze 3b (data05-razitkuj-zaloz.ts). verified: false.',
    '',
    stringify(data),
  ].join('\n')

const main = () => {
  if (!existsSync(MANIFEST_JSON)) throw new Error(`Manifest ${MANIFEST_JSON} neexistuje — nejdřív workflow „DATA-05: stažení otisků razítek".`)
  const manifest = JSON.parse(readFileSync(MANIFEST_JSON, 'utf8')) as Manifest

  let zapsano = 0
  for (const chata of manifest.chaty) {
    const celkem = chata.otisky.length
    chata.otisky.forEach((otisk, i) => {
      const data = razitkoZaznam(chata, otisk, i + 1, celkem, manifest.svolil, manifest.stazeno)
      // YAML vedle obrázku: data/razitka/skeny/<slug>/<id>.yaml (soubor = <id>.<ext>).
      const cesta = join(SKENY_ADRESAR, chata.slug, basename(otisk.soubor).replace(/\.[^.]+$/, '.yaml'))
      writeFileSync(cesta, yamlRazitko(chata, data), 'utf8')
      zapsano++
    })
  }
  console.log(`\n## DATA-05 fáze 3c — razítka z manifestu`)
  console.log(`Chat: ${manifest.chaty.length} · založeno razítkových YAML: ${zapsano}`)
  console.log(`(Seed je nahraje: otisk → Fotky, razítko prevzato-se-svolenim se zdrojem.)`)
}

if (process.argv[1]?.endsWith('data05-razitkuj-zaloz.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
