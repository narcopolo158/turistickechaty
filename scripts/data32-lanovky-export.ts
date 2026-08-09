/**
 * DATA-32b: export lanovek oblasti z Overpass + výšky stanic z Mapy.com.
 *
 * Vznik 9. 8. 2026 (pokyn Michala: „rovnou dohledej i lanovky pro vsechny
 * pohori ktera je jeste nemaji"). Přehled lanovek (DATA-32) dosud stál na
 * vrstvě `aerialway` z pipeline DATA-28 (3D terén) — jenže DATA-28 doběhl
 * jen pro čtyři oblasti a je to těžký běh (celý výškový model). Tenhle
 * skript je LEHKÁ CESTA pro zbylá pohoří:
 *   1. stáhne z Overpass jen `way["aerialway"]` v okně oblasti
 *      (tytéž instance a retry logika jako DATA-01),
 *   2. koncovým bodům drah pro pěší doměří výšky přes Mapy.com Elevation
 *      API (týž klíč a helper jako DATA-06; max 256 pozic na dotaz),
 *   3. zapíše `data/lanovky/_export-<oblast>.json` — surová geometrie
 *      + výšky bodů; přehled `data/lanovky/<oblast>.json` z toho udělá
 *      DATA-32 (kterému přibyl fallback právě na tenhle soubor).
 *
 * Sandbox denních sessions na Overpass ani api.mapy.com nedosáhne — ostrý
 * běh dělá workflow „DATA-32: lanovky oblasti (export + přehled)".
 *
 *   npx tsx scripts/data32-lanovky-export.ts --oblast nizke-tatry
 *
 * Poctivost dat: zapisuje se jen to, co vrátí Overpass a Elevation API;
 * `stavOsm` = osm3s.timestamp_osm_base, výšky nesou provenienci modelu.
 * Soubor je strojově generovaný a další běh ho PŘEPÍŠE.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { VYCHOZI_API_INSTANCE, stahniOverpass } from './data01-overpass-krkonose'
import { bboxStr, oblastZArgv } from './oblasti'
import { stahniVysky, type Bod } from './vyskovy-profil'

/** Dráhy, které vyvezou pěšího — shodné s DATA-32. */
const PRO_PESI = new Set(['gondola', 'cable_car', 'mixed_lift', 'chair_lift'])

type OsmWay = {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

export type SurovaLanovka = { typ: string; nazev: string | null; body: [number, number][] }

export const dotazAerialway = (bbox: string): string =>
  `[out:json][timeout:180];way["aerialway"](${bbox});out geom qt;`

export const lanovkyZElementu = (elementy: OsmWay[]): SurovaLanovka[] => {
  const out: SurovaLanovka[] = []
  for (const e of elementy) {
    if (e.type !== 'way' || !e.tags?.aerialway || !e.geometry || e.geometry.length < 2) continue
    // `station` a podobné uzlové tagy nejsou dráha; bere se jen liniová dráha.
    if (['station', 'pylon'].includes(e.tags.aerialway)) continue
    out.push({
      typ: e.tags.aerialway,
      nazev: e.tags.name ?? null,
      body: e.geometry.map((g) => [g.lat, g.lon] as [number, number]),
    })
  }
  return out
}

/** Koncové body drah pro pěší — jen ty dostanou výšku (stanice, ne pylony). */
export const koncoveBody = (lanovky: SurovaLanovka[]): Bod[] => {
  const videno = new Set<string>()
  const out: Bod[] = []
  for (const l of lanovky) {
    if (!PRO_PESI.has(l.typ)) continue
    for (const [lat, lon] of [l.body[0], l.body[l.body.length - 1]]) {
      const k = `${lat.toFixed(6)},${lon.toFixed(6)}`
      if (videno.has(k)) continue
      videno.add(k)
      out.push({ lat, lon })
    }
  }
  return out
}

const main = async () => {
  const oblast = oblastZArgv()
  const apiKlic = process.env.MAPY_API_KEY ?? process.env.NEXT_PUBLIC_MAPY_API_KEY
  if (!apiKlic) {
    console.error('Chybí API klíč: nastav MAPY_API_KEY (secret v Actions).')
    process.exit(1)
  }

  const bbox = bboxStr(oblast.bbox)
  const { raw, api } = await stahniOverpass(VYCHOZI_API_INSTANCE, dotazAerialway(bbox))
  const telo = JSON.parse(raw) as {
    elements?: OsmWay[]
    osm3s?: { timestamp_osm_base?: string }
    remark?: string
  }
  // Táž pojistka jako DATA-37: běhová chyba v `remark` nesmí projít jako
  // prázdný výsledek.
  if (typeof telo.remark === 'string' && /error|timed out|out of memory/i.test(telo.remark)) {
    throw new Error(`Overpass vrátil běhovou chybu v \`remark\` — ${telo.remark.trim()}`)
  }
  const lanovky = lanovkyZElementu(telo.elements ?? [])
  const proPesi = lanovky.filter((l) => PRO_PESI.has(l.typ))
  const vleku = lanovky.length - proPesi.length

  const body = koncoveBody(lanovky)
  const vyskyPole = body.length ? await stahniVysky(body, apiKlic) : []
  const vysky = body.map((b, i) => ({ lat: b.lat, lng: b.lon, vyska: Math.round(vyskyPole[i]) }))

  const vystup = {
    oblast: oblast.slug,
    zdroj:
      'OpenStreetMap (way["aerialway"]) — data © přispěvatelé OpenStreetMap, ODbL 1.0 ' +
      `(openstreetmap.org/copyright); dotaz ${api}`,
    stavOsm: telo.osm3s?.timestamp_osm_base ?? null,
    zdrojVysky:
      'Mapy.com Elevation API (výškový model, jen koncové body drah pro pěší) — verified: false',
    checked: new Date().toISOString().slice(0, 10),
    poznamka:
      'Strojově generováno skriptem data32-lanovky-export.ts — další běh soubor přepíše. ' +
      'Přehled pro web z tohohle exportu dělá scripts/data32-lanovky.ts.',
    pocetDrah: lanovky.length,
    proPesi: proPesi.length,
    vleku,
    lanovky,
    vysky,
  }
  const adr = join(process.cwd(), 'data', 'lanovky')
  mkdirSync(adr, { recursive: true })
  writeFileSync(join(adr, `_export-${oblast.slug}.json`), JSON.stringify(vystup, null, 2) + '\n')
  console.log(
    `Oblast ${oblast.slug}: aerialway drah ${lanovky.length} (pro pěší ${proPesi.length}, vleků ${vleku}), ` +
      `výšek ${vysky.length}, stav OSM ${vystup.stavOsm}`,
  )
  console.log(`Zapsáno: data/lanovky/_export-${oblast.slug}.json`)
}

if (process.argv[1]?.includes('data32-lanovky-export')) {
  main().catch((e) => {
    console.error(String(e))
    process.exit(1)
  })
}
