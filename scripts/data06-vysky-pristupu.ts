/**
 * DATA-06: výšky, převýšení a odhad času přístupových tras (navazuje na 3b).
 * Nad hotovým `data/trasy/krkonose/pristupove-trasy.json` (geometrie po značených
 * z routingu) dopočítá ke KAŽDÉMU nástupu výškový profil přes Mapy.com Elevation
 * API: převýšení (stoupání/klesání), decimovaný profil [km, výška] a ODHAD času
 * chůze dle DIN 33466. Zapíše zpět do JSON. Idempotentní.
 *
 * Sandbox denních sessions na api.mapy.com nedosáhne (proxy) — běží v GitHub
 * Actions („DATA-06: výšky přístupových tras"), klíč secret MAPY_API_KEY.
 *
 *   npx tsx scripts/data06-vysky-pristupu.ts
 *
 * Poctivost: výšky = výškový model Mapy.com (nemusí odpovídat realitě), čas je
 * ODHAD z délky a převýšení (ne měřený) — obojí `verified: false`, na profilu
 * poctivě označené jako odhad. Orientace: geometrie z routingu je chata→nástup,
 * pro profil se OTÁČÍ na nástup→chata (stoupání k chatě).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  douglasPeucker,
  kumulativniKm,
  prevyseni,
  stahniVysky,
  vyberRovnomerne,
  type Bod,
  type ProfilBod,
} from './vyskovy-profil'

const VYSTUP_JSON = join(process.cwd(), 'data', 'trasy', 'krkonose', 'pristupove-trasy.json')
/** Decimace profilu (m). Auto-trasy jsou delší než ruční GPX → hrubší tolerance. */
const TOLERANCE_M = 8

/**
 * Odhad času chůze dle DIN 33466 (metodika horských spolků): 4 km/h vodorovně,
 * 300 m/h do stoupání, 500 m/h z kopce. Vodorovná (Wh) a svislá (Wv) složka se
 * kombinují „větší + půlka menší" (část převýšení se zvládá souběžně s chůzí).
 * Vrací MINUTY. Je to ODHAD z délky a převýšení, ne měřený čas z rozcestníku.
 */
export const casDin33466Min = (delkaKm: number, stoupaniM: number, klesaniM: number): number => {
  const RYCHLOST_KMH = 4
  const STOUPANI_MH = 300
  const KLESANI_MH = 500
  const wh = delkaKm / RYCHLOST_KMH
  const wv = stoupaniM / STOUPANI_MH + klesaniM / KLESANI_MH
  const hodiny = Math.max(wh, wv) + 0.5 * Math.min(wh, wv)
  return Math.round(hodiny * 60)
}

export type VyskaTrasy = { prevyseni: number; klesani: number; casMin: number; vyskovyProfil: ProfilBod[] }

/**
 * Dopočítá výšky pro jednu trasu. `geometrie` je z routingu (chata→nástup) —
 * otočí se na nástup→chata, decimuje na ≤ 256 bodů, stáhne výšky, spočítá
 * převýšení + čas (DIN 33466) + decimovaný profil. Km osa profilu se škáluje na
 * `delkaKm` z routingu (autoritativní délka po značených), ať sedí s výpisem.
 */
export const zpracujTrasu = async (
  geometrie: { lat: number; lng: number }[],
  delkaKm: number,
  apiKlic: string,
  fetchFn: typeof fetch = fetch,
): Promise<VyskaTrasy> => {
  // Orientace nástup→chata (stoupání k chatě) + převod {lat,lng} → {lon,lat}.
  const body: Bod[] = [...geometrie].reverse().map((g) => ({ lon: g.lng, lat: g.lat }))
  const km = kumulativniKm(body)
  const vyber = vyberRovnomerne(body, km)
  const vysky = await stahniVysky(vyber.body, apiKlic, fetchFn)
  const { stoupani, klesani } = prevyseni(vysky)
  const casMin = casDin33466Min(delkaKm, stoupani, klesani)
  // Profil: km osa škálovaná na routovanou délku (haversine přes decimaci je o kus kratší).
  const haversineKm = vyber.km[vyber.km.length - 1] || 1
  const skala = delkaKm / haversineKm
  const plnyProfil: ProfilBod[] = vyber.km.map((k, i) => [k * skala, vysky[i]])
  const vyskovyProfil = douglasPeucker(plnyProfil, TOLERANCE_M).map(
    ([k, v]) => [Math.round(k * 100) / 100, Math.round(v)] as ProfilBod,
  )
  return { prevyseni: stoupani, klesani, casMin, vyskovyProfil }
}

type Pristup = {
  vychoziBod: string
  delkaKm: number
  geometrie?: { lat: number; lng: number }[]
  prevyseni?: number
  klesani?: number
  casMin?: number
  vyskovyProfil?: ProfilBod[]
}
type Katalog = { chaty: { slug: string; nazev: string; pristupy: Pristup[] }[]; [k: string]: unknown }

const main = async () => {
  const { config } = await import('dotenv')
  config()
  const apiKlic = process.env.MAPY_API_KEY ?? process.env.NEXT_PUBLIC_MAPY_API_KEY
  if (!apiKlic) {
    console.error('Chybí API klíč: nastav MAPY_API_KEY (secret v Actions) nebo NEXT_PUBLIC_MAPY_API_KEY v .env.')
    process.exit(1)
  }
  if (!existsSync(VYSTUP_JSON)) throw new Error(`Chybí ${VYSTUP_JSON} — nejdřív DATA-06 3b (přístupové trasy).`)

  const katalog = JSON.parse(readFileSync(VYSTUP_JSON, 'utf8')) as Katalog
  let hotovo = 0
  let bezGeometrie = 0
  const chyby: string[] = []
  for (const chata of katalog.chaty) {
    for (const p of chata.pristupy) {
      if (!p.geometrie || p.geometrie.length < 2) {
        bezGeometrie++
        continue
      }
      try {
        const v = await zpracujTrasu(p.geometrie, p.delkaKm, apiKlic)
        p.prevyseni = v.prevyseni
        p.klesani = v.klesani
        p.casMin = v.casMin
        p.vyskovyProfil = v.vyskovyProfil
        hotovo++
      } catch (e) {
        chyby.push(`${chata.nazev} ← ${p.vychoziBod}: ${e instanceof Error ? e.message : e}`)
      }
    }
  }

  // Poznámka do hlavičky JSON (provenience výšek).
  katalog.vyskyZdroj =
    'Výšky: Mapy.com Elevation API (výškový model — nemusí odpovídat realitě). Čas: odhad DIN 33466 z délky a převýšení. Obojí verified:false.'
  writeFileSync(VYSTUP_JSON, JSON.stringify(katalog, null, 2) + '\n', 'utf8')

  console.log(`\n## DATA-06 report — výšky přístupových tras`)
  console.log(`Dopočítáno: ${hotovo} tras · bez geometrie: ${bezGeometrie} · chyb: ${chyby.length}`)
  for (const chata of katalog.chaty.slice(0, 6)) {
    const p = chata.pristupy[0]
    if (p?.casMin != null) console.log(`- ${chata.nazev} ← ${p.vychoziBod}: ${p.delkaKm} km, +${p.prevyseni} m, ~${p.casMin} min`)
  }
  if (chyby.length) {
    console.log(`\nChyby (${chyby.length}):`)
    for (const c of chyby) console.log(`- ${c}`)
  }
  console.log(`\nZapsáno: ${VYSTUP_JSON}`)
}

if (process.argv[1]?.endsWith('data06-vysky-pristupu.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
