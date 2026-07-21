/**
 * DATA-06 (increment 3, jádro): routovací graf ze značených tras + hledání
 * cesty. Z relací `route=hiking` (increment 1) postaví graf, kde uzel je bod
 * geometrie (sdílené křižovatky mají v OSM identické souřadnice → po kvantizaci
 * splynou) a hrana nese barvu značení KČT a délku. Nad grafem umí přichytit
 * libovolný bod (chatu, výchozí bod) k nejbližšímu uzlu a najít nejkratší cestu
 * s **preferencí značených tras** (Dijkstra; neznačené hrany mají vyšší cenu,
 * ale jdou použít jako spojka). Cesta se rozloží na úseky po značení a spočítá
 * se podíl neznačené délky (>15 % = k ruční kontrole — poctivost dle CLAUDE.md).
 *
 * Čistá logika bez sítě — jde stavět i testovat v sandboxu nad commitnutým
 * exportem `data/trasy/krkonose/_overpass-trasy.json`. Navazující krok
 * (increment 3b, GitHub Actions) tenhle graf použije k výpočtu přístupových
 * tras k chatám, dopočítá výšky přes Mapy.com Elevation API a `casMin` dle
 * DIN 33466.
 *
 * Smoke nad reálným exportem:
 *   npx tsx scripts/data06-graf.ts --smoke
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { nactiExport, vzdalenostM } from './data01-overpass-krkonose'
import { znaceniZTagu, type TrasaRelace, type Znaceni } from './data06-trasy'

/** Kolikrát dražší je vést cestu po NEznačené hraně (preference značených). */
export const CENA_NEZNACENE = 4
/** Desetinná místa souřadnic pro klíč uzlu (~0,11 m — splyne jen sdílený bod OSM). */
const PRESNOST_UZLU = 6
/** Velikost buňky prostorového indexu ve stupních (~1,1 km) pro rychlý snapping. */
const BUNKA = 0.01

export type UzelKlic = string
export type Hrana = { do: UzelKlic; delkaM: number; znaceni: Znaceni | null }

export type Graf = {
  /** Klíč uzlu → souřadnice. */
  uzly: Map<UzelKlic, { lat: number; lng: number }>
  /** Klíč uzlu → seznam hran (neorientovaný graf, hrana je v obou uzlech). */
  sousede: Map<UzelKlic, Hrana[]>
  /** Prostorový index: klíč buňky → uzly v ní (pro najdiNejblizsiUzel). */
  mrizka: Map<string, UzelKlic[]>
}

export const uzelKlic = (lat: number, lng: number): UzelKlic =>
  `${lat.toFixed(PRESNOST_UZLU)},${lng.toFixed(PRESNOST_UZLU)}`

const bunkaKlic = (lat: number, lng: number): string =>
  `${Math.floor(lat / BUNKA)},${Math.floor(lng / BUNKA)}`

// ── Stavba grafu ────────────────────────────────────────────────────────────

/**
 * Postaví neorientovaný graf ze značených i neznačených relací pěších tras.
 * Relace se zpracují v pořadí podle id (determinismus). Když týž segment nese
 * víc relací (souběh značek), zůstane u hrany první přiřazená barva; značená
 * má přednost před neznačenou (spojkou).
 */
export const postavGraf = (relace: TrasaRelace[]): Graf => {
  const uzly = new Map<UzelKlic, { lat: number; lng: number }>()
  const sousede = new Map<UzelKlic, Hrana[]>()
  const mrizka = new Map<string, UzelKlic[]>()

  const pridejUzel = (lat: number, lng: number): UzelKlic => {
    const k = uzelKlic(lat, lng)
    if (!uzly.has(k)) {
      uzly.set(k, { lat, lng })
      sousede.set(k, [])
      const bk = bunkaKlic(lat, lng)
      const seznam = mrizka.get(bk)
      if (seznam) seznam.push(k)
      else mrizka.set(bk, [k])
    }
    return k
  }

  const pridejHranu = (a: UzelKlic, b: UzelKlic, delkaM: number, znaceni: Znaceni | null): void => {
    for (const [x, y] of [[a, b], [b, a]] as const) {
      const hrany = sousede.get(x)!
      const stavajici = hrany.find((h) => h.do === y)
      if (stavajici) {
        // Souběh: značená přebíjí spojku; drž kratší reprezentaci délky.
        if (stavajici.znaceni == null && znaceni != null) stavajici.znaceni = znaceni
        if (delkaM < stavajici.delkaM) stavajici.delkaM = delkaM
      } else {
        hrany.push({ do: y, delkaM, znaceni })
      }
    }
  }

  const serazene = [...relace].sort((a, b) => a.id - b.id)
  for (const rel of serazene) {
    if (rel.type !== 'relation') continue
    const znaceni = znaceniZTagu(rel.tags ?? {})?.znaceni ?? null
    for (const clen of rel.members ?? []) {
      const g = clen.geometry
      if (!g || g.length < 2) continue
      for (let i = 1; i < g.length; i++) {
        const a = pridejUzel(g[i - 1].lat, g[i - 1].lon)
        const b = pridejUzel(g[i].lat, g[i].lon)
        if (a === b) continue // nulový segment (duplicitní bod)
        pridejHranu(a, b, vzdalenostM(g[i - 1].lat, g[i - 1].lon, g[i].lat, g[i].lon), znaceni)
      }
    }
  }
  return { uzly, sousede, mrizka }
}

// ── Přichycení bodu k nejbližšímu uzlu ──────────────────────────────────────

export type NejblizsiUzel = { klic: UzelKlic; vzdalenostM: number }

/**
 * Najde uzel grafu nejbližší zadané souřadnici (přichycení chaty / výchozího
 * bodu na síť tras). Hledá v rozšiřujících se prstencích buněk prostorového
 * indexu, aby neprocházel celý graf. null = prázdný graf.
 */
export const najdiNejblizsiUzel = (graf: Graf, lat: number, lng: number): NejblizsiUzel | null => {
  if (graf.uzly.size === 0) return null
  const cLat = Math.floor(lat / BUNKA)
  const cLng = Math.floor(lng / BUNKA)
  let nejlepsi: NejblizsiUzel | null = null

  for (let prstenec = 0; prstenec < 1000; prstenec++) {
    for (let dx = -prstenec; dx <= prstenec; dx++) {
      for (let dy = -prstenec; dy <= prstenec; dy++) {
        // Jen okraj prstence — vnitřek už prošly předchozí iterace.
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== prstenec) continue
        const seznam = graf.mrizka.get(`${cLat + dx},${cLng + dy}`)
        if (!seznam) continue
        for (const klic of seznam) {
          const u = graf.uzly.get(klic)!
          const d = vzdalenostM(lat, lng, u.lat, u.lng)
          if (!nejlepsi || d < nejlepsi.vzdalenostM) nejlepsi = { klic, vzdalenostM: d }
        }
      }
    }
    // Jakmile něco máme, dojedeme ještě jeden prstenec (bližší uzel může být
    // v sousední buňce za hranicí právě prohledaného prstence) a končíme.
    if (nejlepsi && prstenec >= 1) break
  }
  return nejlepsi
}

// ── Hledání cesty (Dijkstra s preferencí značených) ─────────────────────────

/** Minimová binární halda nad (klíč uzlu, cena) — Dijkstra bez O(n²). */
class Halda {
  private data: { klic: UzelKlic; cena: number }[] = []
  get velikost(): number {
    return this.data.length
  }
  vloz(klic: UzelKlic, cena: number): void {
    const d = this.data
    d.push({ klic, cena })
    let i = d.length - 1
    while (i > 0) {
      const rodic = (i - 1) >> 1
      if (d[rodic].cena <= d[i].cena) break
      ;[d[rodic], d[i]] = [d[i], d[rodic]]
      i = rodic
    }
  }
  odeber(): { klic: UzelKlic; cena: number } | undefined {
    const d = this.data
    if (d.length === 0) return undefined
    const vrchol = d[0]
    const posledni = d.pop()!
    if (d.length > 0) {
      d[0] = posledni
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let nej = i
        if (l < d.length && d[l].cena < d[nej].cena) nej = l
        if (r < d.length && d[r].cena < d[nej].cena) nej = r
        if (nej === i) break
        ;[d[nej], d[i]] = [d[i], d[nej]]
        i = nej
      }
    }
    return vrchol
  }
}

export type Usek = { znaceni: Znaceni | 'neznacene'; delkaKm: number }
export type Trasa = {
  uzly: UzelKlic[]
  geometrie: { lat: number; lng: number }[]
  delkaKm: number
  useky: Usek[]
  /** Podíl neznačené délky na trase v procentech (>15 % = k ruční kontrole). */
  podilNeznacenychProc: number
}

type Predchudce = { uzel: UzelKlic; delkaM: number; znaceni: Znaceni | null }

/**
 * Nejkratší cesta z `start` do `cil` (klíče uzlů) s preferencí značených tras
 * — neznačená hrana stojí `CENA_NEZNACENE`× své délky, ale je průchozí. Vrací
 * geometrii, skutečnou (nevaženou) délku, rozklad na úseky po značení a podíl
 * neznačené délky. null = cíl je z výchozího uzlu nedosažitelný.
 */
export const najdiTrasu = (graf: Graf, start: UzelKlic, cil: UzelKlic): Trasa | null => {
  if (!graf.uzly.has(start) || !graf.uzly.has(cil)) return null
  if (start === cil) {
    const u = graf.uzly.get(start)!
    return { uzly: [start], geometrie: [{ lat: u.lat, lng: u.lng }], delkaKm: 0, useky: [], podilNeznacenychProc: 0 }
  }

  const cena = new Map<UzelKlic, number>([[start, 0]])
  const predchudce = new Map<UzelKlic, Predchudce>()
  const hotovo = new Set<UzelKlic>()
  const halda = new Halda()
  halda.vloz(start, 0)

  while (halda.velikost > 0) {
    const { klic: u, cena: cu } = halda.odeber()!
    if (hotovo.has(u)) continue
    hotovo.add(u)
    if (u === cil) break
    for (const h of graf.sousede.get(u) ?? []) {
      if (hotovo.has(h.do)) continue
      const nova = cu + h.delkaM * (h.znaceni ? 1 : CENA_NEZNACENE)
      if (nova < (cena.get(h.do) ?? Infinity)) {
        cena.set(h.do, nova)
        predchudce.set(h.do, { uzel: u, delkaM: h.delkaM, znaceni: h.znaceni })
        halda.vloz(h.do, nova)
      }
    }
  }

  if (!predchudce.has(cil)) return null

  // Rekonstrukce cesty od cíle k startu → obrátit.
  const uzly: UzelKlic[] = []
  const hrany: Predchudce[] = []
  let u = cil
  while (u !== start) {
    uzly.push(u)
    const p = predchudce.get(u)!
    hrany.push(p)
    u = p.uzel
  }
  uzly.push(start)
  uzly.reverse()
  hrany.reverse()

  const geometrie = uzly.map((k) => {
    const c = graf.uzly.get(k)!
    return { lat: c.lat, lng: c.lng }
  })

  // Úseky: slévej po sobě jdoucí hrany stejného značení.
  const useky: Usek[] = []
  let delkaCelkemM = 0
  let neznacenaM = 0
  for (const h of hrany) {
    delkaCelkemM += h.delkaM
    if (!h.znaceni) neznacenaM += h.delkaM
    const znaceni: Znaceni | 'neznacene' = h.znaceni ?? 'neznacene'
    const posledni = useky[useky.length - 1]
    if (posledni && posledni.znaceni === znaceni) posledni.delkaKm += h.delkaM / 1000
    else useky.push({ znaceni, delkaKm: h.delkaM / 1000 })
  }
  for (const u2 of useky) u2.delkaKm = Math.round(u2.delkaKm * 100) / 100

  return {
    uzly,
    geometrie,
    delkaKm: Math.round((delkaCelkemM / 1000) * 100) / 100,
    useky,
    podilNeznacenychProc: delkaCelkemM > 0 ? Math.round((neznacenaM / delkaCelkemM) * 1000) / 10 : 0,
  }
}

// ── Smoke nad reálným exportem ──────────────────────────────────────────────

const smoke = (): void => {
  const cesta = join(process.cwd(), 'data', 'trasy', 'krkonose', '_overpass-trasy.json')
  if (!existsSync(cesta)) throw new Error(`Smoke: export ${cesta} neexistuje — stáhne ho workflow „DATA-06: export značených tras".`)
  const { elementy } = nactiExport(readFileSync(cesta, 'utf8'))
  const relace = elementy as unknown as TrasaRelace[]
  console.log(`Relací v exportu: ${relace.length}`)
  const t0 = Number(process.hrtime.bigint() / 1000000n)
  const graf = postavGraf(relace)
  const t1 = Number(process.hrtime.bigint() / 1000000n)
  let hran = 0
  for (const s of graf.sousede.values()) hran += s.length
  console.log(`Graf: ${graf.uzly.size} uzlů, ${hran / 2} hran (postaveno za ${t1 - t0} ms).`)

  // Demo trasa mezi dvěma reálnými chatami (souřadnice z jejich YAML).
  const dvouChat = ['lucni-bouda', 'labska-bouda']
  const body = dvouChat.map((slug) => {
    const y = readFileSync(join(process.cwd(), 'data', 'chaty', 'krkonose', `${slug}.yaml`), 'utf8')
    const lat = Number(/^lat:\s*([\d.]+)/m.exec(y)?.[1])
    const lng = Number(/^lng:\s*([\d.]+)/m.exec(y)?.[1])
    return { slug, lat, lng, uzel: najdiNejblizsiUzel(graf, lat, lng) }
  })
  for (const b of body) console.log(`Chata ${b.slug} (${b.lat}, ${b.lng}) → nejbližší uzel ${b.uzel?.vzdalenostM} m`)
  if (body[0].uzel && body[1].uzel) {
    const trasa = najdiTrasu(graf, body[0].uzel.klic, body[1].uzel.klic)
    if (trasa) {
      console.log(`\nTrasa ${dvouChat[0]} → ${dvouChat[1]}: ${trasa.delkaKm} km, ${trasa.geometrie.length} bodů, neznačené ${trasa.podilNeznacenychProc} %`)
      console.log(`Úseky: ${trasa.useky.map((u) => `${u.znaceni} ${u.delkaKm} km`).join(' · ')}`)
    } else {
      console.log(`\nTrasa ${dvouChat[0]} → ${dvouChat[1]}: nedosažitelná v grafu (oddělené komponenty).`)
    }
  }
}

if (process.argv[1]?.endsWith('data06-graf.ts')) {
  try {
    if (process.argv.includes('--smoke')) smoke()
    else console.log('Použití: npx tsx scripts/data06-graf.ts --smoke')
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
