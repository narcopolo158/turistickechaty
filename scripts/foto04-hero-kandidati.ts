/**
 * FOTO-04: kandidáti na hero fotku POHOŘÍ z Wikimedia Commons.
 *
 * Vznik 9. 8. 2026: Michal chtěl hero Nízkých Tater ze slovakia.travel,
 * jenže právní podmínky portálu užití zakazují (doklad
 * docs/FOTKY-ZDROJE-A-LICENCE.md, odd. 4d) — náhradou je Wikimedia Commons.
 * Sandbox denních sessions ale na Commons nedosáhne (jako u DATA-02), a tak
 * VÝBĚR TITULŮ dělá redakce předem (WebSearch) a tenhle skript v Actions:
 *   1. položí na Commons API dotaz imageinfo na zadané tituly,
 *   2. protáhne je TÝMŽ licenčním sítem jako DATA-02 (posudLicenci —
 *      CC0 / CC BY / CC BY-SA / PD; CC BY* bez autora se vyřazuje),
 *   3. stáhne NÁHLED 2400 px (ne originál — hero se stejně zmenšuje
 *      a originály z Commons mívají desítky MB) do
 *      data/kandidati/hero-foto/<oblast>/ a vedle položí _meta.yaml
 *      s autorem, licencí a URL stránky pro atribuci.
 * Definitivní výběr, ořez na hero + náhled a zápis heroFoto do
 * data/oblasti/<slug>.yaml dělá redakce lokálně — soubory v repu si může
 * prohlédnout, což u metadat nejde.
 *
 * Spuštění (ostrý běh dělá workflow „FOTO-04: hero kandidáti z Commons"):
 *   npx tsx scripts/foto04-hero-kandidati.ts --oblast nizke-tatry \
 *     --soubory 'File:A.jpg|File:B.jpg'
 *
 * Poctivost dat: skript nic nedomýšlí — zapisuje jen to, co Commons API
 * vrátí; `checked` = datum dotazu. Adresář je kandidátní a další běh se
 * stejnou oblastí ho PŘEPÍŠE.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { stringify } from 'yaml'

import { API_COMMONS, cistyText, posudLicenci, stahniJson } from './data02-commons-fotky'

const SIRKA_NAHLEDU = 2400

type Vstup = { oblast: string; soubory: string[] }

export const zpracujArgv = (argv: string[]): Vstup => {
  const oblastI = argv.indexOf('--oblast')
  const souboryI = argv.indexOf('--soubory')
  if (oblastI === -1 || souboryI === -1) {
    throw new Error('Povinné argumenty: --oblast <slug> --soubory "File:A.jpg|File:B.jpg"')
  }
  const oblast = argv[oblastI + 1]
  const soubory = (argv[souboryI + 1] ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!oblast || soubory.length === 0) throw new Error('Prázdná oblast nebo prázdný seznam souborů.')
  if (soubory.some((s) => !s.startsWith('File:'))) {
    throw new Error('Každý titul musí začínat „File:" — jinak API vrátí jinou stránku, než redakce vybrala.')
  }
  return { oblast, soubory }
}

/** Bezpečné jméno souboru na disku: bez „File:", diakritiky a lomítek. */
export const jmenoNaDisku = (titul: string, poradi: number): string => {
  const zaklad = titul
    .replace(/^File:/u, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .replace(/[^A-Za-z0-9.]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
  return `${String(poradi + 1).padStart(2, '0')}-${zaklad}`
}

type MetaZaznam = {
  soubor: string
  naDisku: string
  autor: string
  licence: string
  licenceUrl?: string
  stranka: string
  original: string
  stazenoZ: string
  rozmeryOriginalu?: string
  datum?: string
  popis?: string
}

const main = async () => {
  const { oblast, soubory } = zpracujArgv(process.argv.slice(2))
  const dnes = new Date().toISOString().slice(0, 10)
  const cil = join(process.cwd(), 'data', 'kandidati', 'hero-foto', oblast)
  rmSync(cil, { recursive: true, force: true })
  mkdirSync(cil, { recursive: true })

  const prijate: MetaZaznam[] = []
  const odmitnute: { soubor: string; duvod: string }[] = []

  for (const [i, titul] of soubory.entries()) {
    const url = new URL(API_COMMONS)
    url.searchParams.set('action', 'query')
    url.searchParams.set('format', 'json')
    url.searchParams.set('formatversion', '2')
    url.searchParams.set('titles', titul)
    url.searchParams.set('prop', 'imageinfo')
    url.searchParams.set('iiprop', 'url|size|extmetadata')
    url.searchParams.set('iiurlwidth', String(SIRKA_NAHLEDU))
    url.searchParams.set(
      'iiextmetadatafilter',
      'LicenseShortName|UsageTerms|LicenseUrl|Artist|ImageDescription|DateTimeOriginal|Copyrighted|Restrictions',
    )
    const json = (await stahniJson(url.toString())) as {
      query?: { pages?: { title?: string; missing?: boolean; imageinfo?: Record<string, unknown>[] }[] }
    }
    const stranka = json.query?.pages?.[0]
    const info = stranka?.imageinfo?.[0] as
      | {
          url?: string
          thumburl?: string
          width?: number
          height?: number
          descriptionurl?: string
          extmetadata?: Record<string, { value?: unknown }>
        }
      | undefined
    if (!stranka || stranka.missing || !info) {
      odmitnute.push({ soubor: titul, duvod: 'stránka na Commons neexistuje nebo nevrátila imageinfo' })
      continue
    }
    const licence = posudLicenci(info.extmetadata as Parameters<typeof posudLicenci>[0])
    if (!licence.ok) {
      odmitnute.push({ soubor: titul, duvod: licence.duvod })
      continue
    }
    const autor = cistyText(info.extmetadata?.Artist?.value, 120)
    if (licence.vyzadujeAutora && !autor) {
      odmitnute.push({ soubor: titul, duvod: `licence ${licence.licence} vyžaduje atribuci, ale autor chybí` })
      continue
    }
    const restrikce = cistyText(info.extmetadata?.Restrictions?.value, 80)
    if (restrikce) {
      odmitnute.push({ soubor: titul, duvod: `Commons uvádí restrikce „${restrikce}" — ručně posoudit` })
      continue
    }
    const stazenoZ = info.thumburl ?? info.url
    if (!stazenoZ || !info.url) {
      odmitnute.push({ soubor: titul, duvod: 'chybí URL náhledu i originálu' })
      continue
    }
    const naDisku = jmenoNaDisku(titul, i)
    const odpoved = await fetch(stazenoZ, {
      headers: { 'user-agent': 'turistickechaty.cz (FOTO-04 hero; repo narcopolo158/turistickechaty)' },
    })
    if (!odpoved.ok) {
      odmitnute.push({ soubor: titul, duvod: `stažení náhledu selhalo: HTTP ${odpoved.status}` })
      continue
    }
    writeFileSync(join(cil, naDisku), Buffer.from(await odpoved.arrayBuffer()))
    prijate.push({
      soubor: titul,
      naDisku,
      autor,
      licence: licence.licence,
      licenceUrl: licence.licenceUrl,
      stranka: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(titul)}`,
      original: (info.url ?? '').split('?')[0],
      stazenoZ,
      rozmeryOriginalu: info.width && info.height ? `${info.width}×${info.height}` : undefined,
      datum: cistyText(info.extmetadata?.DateTimeOriginal?.value, 40) || undefined,
      popis: cistyText(info.extmetadata?.ImageDescription?.value, 300) || undefined,
    })
  }

  const hlavicka = [
    `# Kandidáti na HERO fotku oblasti ${oblast} — FOTO-04 (dotaz ${dnes})`,
    '# Zdroj: Wikimedia Commons API (imageinfo, extmetadata), tituly vybrala redakce.',
    '# Licenční síto shodné s DATA-02: jen CC0 / CC BY / CC BY-SA / public domain.',
    '# Soubory vedle jsou NÁHLEDY (max 2400 px) ke KOUKÁNÍ a výběru — hero',
    '# a náhled pro web z vybraného souboru vyrobí redakce lokálně; atribuce',
    '# se bere odsud. STROJOVĚ GENEROVÁNO — další běh se stejnou oblastí',
    '# adresář přepíše.',
    '',
  ].join('\n')
  writeFileSync(
    join(cil, '_meta.yaml'),
    hlavicka + stringify({ oblast, checked: dnes, prijate, odmitnute }, { lineWidth: 100 }),
  )

  console.log(`FOTO-04 (${oblast}): přijato ${prijate.length}, odmítnuto ${odmitnute.length}`)
  for (const p of prijate) console.log(`  OK   ${p.soubor} — ${p.licence}, autor ${p.autor || '—'}`)
  for (const o of odmitnute) console.log(`  VYR  ${o.soubor} — ${o.duvod}`)
  if (prijate.length === 0) {
    console.error('Žádný přijatý kandidát — hero z tohohle běhu nevznikne.')
    process.exitCode = 1
  }
}

const spustenoPrimo = process.argv[1]?.endsWith('foto04-hero-kandidati.ts')
if (spustenoPrimo) {
  main().catch((e) => {
    console.error(String(e))
    process.exitCode = 1
  })
}
