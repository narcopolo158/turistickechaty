/**
 * Výškový profil trasy z GPX přes Mapy.com Elevation API (F0-06).
 *
 * Vstup: GPX soubor (vlastní nahrávka, export z plánovače, případně OSM — u OSM
 * geometrie patří do source atribuce ODbL). Výstup: YAML fragment trasy pro
 * `data/chaty/<pohori>/<slug>.yaml` — decimované body `[km, výška]`, délka
 * a převýšení, se zdrojem „Mapy.com Elevation API" a datem `checked`.
 *
 * Spuštění (potřebuje MAPY_API_KEY nebo NEXT_PUBLIC_MAPY_API_KEY v `.env`):
 *   npx tsx scripts/vyskovy-profil.ts trasa.gpx
 *   npx tsx scripts/vyskovy-profil.ts trasa.gpx --dry-run      # bez volání API
 *   npx tsx scripts/vyskovy-profil.ts trasa.gpx --tolerance 3  # hrubší křivka (m)
 *
 * Poctivost dat: skript dokládá jen délku, výšky a převýšení (výškový model
 * Mapy.com; „model s různou přesností — nemusí odpovídat realitě", proto
 * verified: false). Čas trasy (casMin) NEDOKLÁDÁ — ten patří z rozcestníku
 * KČT nebo plánovače, s vlastním zdrojem.
 *
 * API: GET https://api.mapy.com/v1/elevation — max 256 pozic/dotaz (páry
 * `lon,lat` — lon první!), klíč hlavičkou X-Mapy-Api-Key, limit 30 dotazů/s.
 * Dokumentace: https://developer.mapy.com/en/rest-api-mapy-cz/function/elevation-api/
 * (Jedna trasa = 1 dotaz — hluboko ve free kvótě tarifu Basic.)
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

export type Bod = { lon: number; lat: number }
export type ProfilBod = [km: number, vyska: number]

const API_URL = 'https://api.mapy.com/v1/elevation'
export const MAX_POZIC_NA_DOTAZ = 256
const CHYBEJICI_VYSKA = -100_000

// ── GPX ─────────────────────────────────────────────────────────────────────

/**
 * Vytáhne body trasy z GPX: `<trkpt>` (všechny segmenty za sebou), bez nich
 * `<rtept>`. Pořadí atributů lat/lon je libovolné. Záměrně bez XML závislosti —
 * GPX body jsou atributy jednoho tagu, pro repo nechceme parser navíc.
 */
export const parseGpx = (xml: string): Bod[] => {
  const zTagu = (tag: 'trkpt' | 'rtept'): Bod[] =>
    [...xml.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g'))].map(([, atributy]) => {
      const lat = atributy.match(/\blat\s*=\s*"([^"]+)"/)?.[1]
      const lon = atributy.match(/\blon\s*=\s*"([^"]+)"/)?.[1]
      if (lat == null || lon == null) throw new Error(`GPX: bod <${tag}> bez atributu lat/lon.`)
      const bod = { lat: Number(lat), lon: Number(lon) }
      if (!Number.isFinite(bod.lat) || !Number.isFinite(bod.lon) || Math.abs(bod.lat) > 90 || Math.abs(bod.lon) > 180)
        throw new Error(`GPX: neplatné souřadnice lat="${lat}" lon="${lon}".`)
      return bod
    })
  const body = zTagu('trkpt').length >= 2 ? zTagu('trkpt') : zTagu('rtept')
  if (body.length < 2) throw new Error('GPX: nenašel jsem aspoň 2 body <trkpt>/<rtept> — je to soubor trasy?')
  return body
}

// ── Geometrie ───────────────────────────────────────────────────────────────

const R_ZEME_KM = 6371.0088
const rad = (deg: number) => (deg * Math.PI) / 180

/** Vzdálenost dvou bodů po povrchu Země (haversine), v km. */
export const haversineKm = (a: Bod, b: Bod): number => {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R_ZEME_KM * Math.asin(Math.sqrt(h))
}

/** Kumulativní vzdálenost podél trasy: km[i] = vzdálenost od startu k bodu i. */
export const kumulativniKm = (body: Bod[]): number[] => {
  const km = [0]
  for (let i = 1; i < body.length; i++) km.push(km[i - 1] + haversineKm(body[i - 1], body[i]))
  return km
}

/**
 * Vybere ≤ maxN bodů rovnoměrně PO VZDÁLENOSTI (GPX mívá body nahuštěné
 * nepravidelně). První a poslední bod zůstávají vždy.
 */
export const vyberRovnomerne = (body: Bod[], km: number[], maxN = MAX_POZIC_NA_DOTAZ): { body: Bod[]; km: number[] } => {
  if (body.length <= maxN) return { body, km }
  const delka = km[km.length - 1]
  const vybraneIdx: number[] = []
  let idx = 0
  for (let i = 0; i < maxN; i++) {
    const cil = (delka * i) / (maxN - 1)
    while (idx < km.length - 1 && Math.abs(km[idx + 1] - cil) <= Math.abs(km[idx] - cil)) idx++
    if (vybraneIdx[vybraneIdx.length - 1] !== idx) vybraneIdx.push(idx)
  }
  if (vybraneIdx[vybraneIdx.length - 1] !== body.length - 1) vybraneIdx.push(body.length - 1)
  return { body: vybraneIdx.map((i) => body[i]), km: vybraneIdx.map((i) => km[i]) }
}

// ── Elevation API ───────────────────────────────────────────────────────────

/**
 * Stáhne výšky pro body (v dávkách po 256). Vrací metry n. m. v pořadí vstupu.
 * Selže čitelně — chybějící data nikdy nenahrazuje odhadem.
 */
export const stahniVysky = async (
  body: Bod[],
  apiKlic: string,
  fetchFn: typeof fetch = fetch,
): Promise<number[]> => {
  const vysky: number[] = []
  for (let od = 0; od < body.length; od += MAX_POZIC_NA_DOTAZ) {
    const davka = body.slice(od, od + MAX_POZIC_NA_DOTAZ)
    // Pozor na pořadí: Mapy.com chce `lon,lat` (dokumentace Elevation API).
    const positions = davka.map((b) => `${b.lon},${b.lat}`).join(';')
    const odpoved = await fetchFn(`${API_URL}?lang=cs&positions=${positions}`, {
      headers: { 'X-Mapy-Api-Key': apiKlic, Accept: 'application/json' },
    })
    if (!odpoved.ok) {
      const napoveda: Record<number, string> = {
        401: 'neplatný nebo chybějící API klíč (zkontroluj .env)',
        403: 'klíč nemá k Elevation API přístup (zkontroluj projekt na developer.mapy.com)',
        422: 'neplatný formát pozic nebo příliš mnoho bodů',
        429: 'překročen limit dotazů — zkus to za chvíli',
      }
      throw new Error(`Elevation API: HTTP ${odpoved.status}${napoveda[odpoved.status] ? ` — ${napoveda[odpoved.status]}` : ''}.`)
    }
    const data = (await odpoved.json()) as { items?: { elevation: number }[] }
    if (!Array.isArray(data.items) || data.items.length !== davka.length)
      throw new Error(`Elevation API: čekal jsem ${davka.length} výšek, přišlo ${data.items?.length ?? 0}.`)
    for (const [i, item] of data.items.entries()) {
      if (typeof item.elevation !== 'number' || item.elevation <= CHYBEJICI_VYSKA)
        throw new Error(`Elevation API: pro bod ${od + i + 1} (${davka[i].lon},${davka[i].lat}) výška není k dispozici.`)
      vysky.push(item.elevation)
    }
  }
  return vysky
}

// ── Decimace profilu ────────────────────────────────────────────────────────

/**
 * Douglas–Peucker na profilu [km, výška] se SVISLOU odchylkou (rozdíl výšky
 * proti lineární interpolaci) — zachová vrcholy a sedla vyšší než tolerance,
 * rovné úseky zahodí. Tolerance v metrech.
 */
export const douglasPeucker = (profil: ProfilBod[], toleranceM: number): ProfilBod[] => {
  if (profil.length <= 2) return profil
  const ponechat = new Array<boolean>(profil.length).fill(false)
  ponechat[0] = ponechat[profil.length - 1] = true
  const zasobnik: [number, number][] = [[0, profil.length - 1]]
  while (zasobnik.length) {
    const [od, doIdx] = zasobnik.pop()!
    const [kmOd, vOd] = profil[od]
    const [kmDo, vDo] = profil[doIdx]
    let maxOdchylka = -1
    let maxIdx = -1
    for (let i = od + 1; i < doIdx; i++) {
      const [km, v] = profil[i]
      const t = kmDo === kmOd ? 0 : (km - kmOd) / (kmDo - kmOd)
      const odchylka = Math.abs(v - (vOd + t * (vDo - vOd)))
      if (odchylka > maxOdchylka) {
        maxOdchylka = odchylka
        maxIdx = i
      }
    }
    if (maxOdchylka > toleranceM && maxIdx > 0) {
      ponechat[maxIdx] = true
      zasobnik.push([od, maxIdx], [maxIdx, doIdx])
    }
  }
  return profil.filter((_, i) => ponechat[i])
}

/** Celkové stoupání a klesání v metrech (počítat z bodů PŘED finální decimací). */
export const prevyseni = (vysky: number[]): { stoupani: number; klesani: number } => {
  let stoupani = 0
  let klesani = 0
  for (let i = 1; i < vysky.length; i++) {
    const d = vysky[i] - vysky[i - 1]
    if (d > 0) stoupani += d
    else klesani -= d
  }
  return { stoupani: Math.round(stoupani), klesani: Math.round(klesani) }
}

// ── YAML výstup ─────────────────────────────────────────────────────────────

const zaokrouhli = (profil: ProfilBod[]): ProfilBod[] =>
  profil.map(([km, v]) => [Math.round(km * 100) / 100, Math.round(v)])

/** Body [[km, v], …] zalomené po šesti — čitelný YAML flow seq. */
const formatujBody = (profil: ProfilBod[], odsazeni: string): string => {
  const dvojice = profil.map(([km, v]) => `[${km}, ${v}]`)
  const radky: string[] = []
  for (let i = 0; i < dvojice.length; i += 6) radky.push(dvojice.slice(i, i + 6).join(', '))
  return `[\n${odsazeni}  ${radky.join(`,\n${odsazeni}  `)}\n${odsazeni}]`
}

export type VysledekProfilu = {
  gpxSoubor: string
  bodyGpx: number
  bodyProApi: number
  profil: ProfilBod[]
  delkaKm: number
  stoupani: number
  klesani: number
  toleranceM: number
  zdrojGeometrie: string
  checked: string
}

/** Hotový YAML fragment k vložení do pole `trasy` v YAML chaty. */
export const yamlFragment = (v: VysledekProfilu): string => {
  const profil = zaokrouhli(v.profil)
  const delka = Math.round(v.delkaKm * 10) / 10
  return `# ── Trasa vygenerovaná scripts/vyskovy-profil.ts z ${v.gpxSoubor} ──
# Výšky a délka: Mapy.com Elevation API (výškový model, checked ${v.checked});
# body: GPX ${v.bodyGpx} → ${v.bodyProApi} pro API → ${profil.length} po decimaci (Douglas–Peucker ${v.toleranceM} m).
# DOPLŇ RUČNĚ: vychoziBod, casMin (rozcestník KČT / plánovač — vlastní zdroj!), znaceni, obtiznost
# a zdroj geometrie GPX do overeniPristup (vlastní nahrávka / plánovač / OSM s atribucí ODbL).
- vychoziBod: ''
  # casMin:            # čas skript nedokládá — doplň se zdrojem do overeniPristup
  znaceni: ''          # cervena | modra | zelena | zluta | jine
  obtiznost: ''        # snadna | stredni | narocna
  prevyseni: ${v.stoupani}    # stoupání dle modelu (klesání ${v.klesani} m)
  delkaKm: ${delka}
  vyskovyProfil: ${formatujBody(profil, '  ')}

# Do overeniPristup přidej k source:
#   „délka, převýšení a výškový profil trasy: Mapy.com Elevation API (${v.zdrojGeometrie}), checked ${v.checked}"
# a ponech verified: false — výškový model nemusí odpovídat realitě.`
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const { config } = await import('dotenv')
  config()

  const argv = process.argv.slice(2)
  const gpxCesta = argv.find((a) => !a.startsWith('--'))
  const dryRun = argv.includes('--dry-run')
  const tolerance = Number(argv[argv.indexOf('--tolerance') + 1] || 2)
  if (!gpxCesta) {
    console.error('Použití: npx tsx scripts/vyskovy-profil.ts <trasa.gpx> [--dry-run] [--tolerance 2]')
    process.exit(1)
  }

  const body = parseGpx(readFileSync(gpxCesta, 'utf8'))
  const km = kumulativniKm(body)
  const vyber = vyberRovnomerne(body, km)
  const delkaKm = km[km.length - 1]

  if (dryRun) {
    console.log(`GPX: ${body.length} bodů, délka ${delkaKm.toFixed(2)} km → ${vyber.body.length} bodů pro API (bez volání — dry run).`)
    return
  }

  const apiKlic = process.env.MAPY_API_KEY ?? process.env.NEXT_PUBLIC_MAPY_API_KEY
  if (!apiKlic) {
    console.error('Chybí API klíč: nastav MAPY_API_KEY nebo NEXT_PUBLIC_MAPY_API_KEY v .env (viz .env.example).')
    process.exit(1)
  }

  const vysky = await stahniVysky(vyber.body, apiKlic)
  const { stoupani, klesani } = prevyseni(vysky)
  const plnyProfil: ProfilBod[] = vyber.km.map((k, i) => [k, vysky[i]])
  const profil = douglasPeucker(plnyProfil, tolerance)

  console.log(
    yamlFragment({
      gpxSoubor: basename(gpxCesta),
      bodyGpx: body.length,
      bodyProApi: vyber.body.length,
      profil,
      delkaKm,
      stoupani,
      klesani,
      toleranceM: tolerance,
      zdrojGeometrie: 'geometrie z GPX',
      checked: new Date().toISOString().slice(0, 10),
    }),
  )
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('vyskovy-profil.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
