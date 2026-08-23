/**
 * BLÍZKÉ BODY UVNITŘ OBLASTI — kandidát stojící pár metrů od publikovaného
 * profilu je nejspíš DRUHÁ OSM ENTITA TÉHOŽ OBJEKTU, ne nová chata.
 *
 * Proč to nechytí nic z toho, co už v repu je:
 *  - `duplicity-oblasti` (DATA-36 b) porovnává identitu podle **OSM URL**.
 *    Dvě různá ID téhož domu jsou pro ni dva objekty — je to napsané i v její
 *    vlastní hlavičce jako známá mez.
 *  - Pojistka v běhu (DATA-38, `zapisKandidaty`) sítu podle vzdálenosti sice
 *    rozumí, ale ptá se jen na kandidáty a profily **JINÝCH** oblastí a
 *    vyžaduje **shodné jádro názvu**.
 *  - `kolize-jmen` vidí jen shodu jmen.
 *
 * Mezi těmi třemi zůstává díra: **táž oblast + jiné jméno**. Přesně tam spadl
 * krkonošský běh z 22. 8. 2026 — „Restaurace Labska Bouda" 19,5 m od profilu
 * `labska-bouda`, „Schronisko Górskie Dom Śląski" 4,2 m od `dom-slaski`
 * a „Schronisko Szrenica 1362 m n.p.m." 5,7 m od `schronisko-szrenica`.
 * Žádný z těch tří párů nemá shodné jádro názvu, takže je neohlásil nikdo;
 * ohlásily se jen tři páry, kde se jména potkala (Portášky, Černá bouda,
 * Srebrny Potok). Vzdálenost je tu spolehlivější signál než jméno — týž dům
 * se v OSM přejmenuje snáz, než se přestěhuje.
 *
 * PRÁH `BLIZKO_M = 50` je převzatý z DATA-38 i s odůvodněním: 9 m u Čartáku
 * je jasná dvojí entita, 150 m dělí i dvě sousední stavby (chata Gírové).
 * Mezi tím leží pásmo, které musí rozhodnout redakce — kontrola proto nic
 * netvrdí, jen měří a vypisuje.
 *
 * NEROZHODUJE (návratový kód vždy 0): je to PRÁCE (rozhodnout pár), ne vada
 * souboru — týž důvod jako u `duplicity-oblasti` a `katalog-pokryti`. Páry,
 * o kterých redakce **už rozhodla** a zapsala je do `data/_jmenovci.yaml`,
 * se nehlásí: registr je doklad, že se o dvojici ví.
 *
 *   npx tsx scripts/kontrola/blizke-body.ts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

/** Práh blízkosti v metrech — zdůvodnění v hlavičce (převzato z DATA-38). */
export const BLIZKO_M = 50

const KOREN_KANDIDATI = join(process.cwd(), 'data', 'kandidati')
const KOREN_CHATY = join(process.cwd(), 'data', 'chaty')
const REGISTR_JMENOVCU = join(process.cwd(), 'data', '_jmenovci.yaml')

export type Bod = {
  oblast: string
  slug: string
  nazev: string | null
  lat: number
  lng: number
  /** Kandidát už povýšený na profil je historický záznam, ne rozpracovanost. */
  povyseny: boolean
}

export type Par = {
  vzdalenostM: number
  kandidat: Bod
  profil: Bod
}

const cislo = (obsah: string, klic: 'lat' | 'lng'): number | null => {
  const m = new RegExp(`^${klic}:\\s*(-?\\d+(?:\\.\\d+)?)\\s*$`, 'mu').exec(obsah)
  return m ? Number(m[1]) : null
}

const nazevZeSouboru = (obsah: string): string | null =>
  /^nazev:\s*(.+?)\s*$/mu.exec(obsah)?.[1]?.replace(/^["']|["']$/gu, '') ?? null

/** Vzdálenost dvou bodů na kouli v metrech (haversine, R = 6371 km). */
export const vzdalenostM = (a: Bod, b: Bod): number => {
  const R = 6_371_000
  const rad = (x: number) => (x * Math.PI) / 180
  const f1 = rad(a.lat)
  const f2 = rad(b.lat)
  const df = rad(b.lat - a.lat)
  const dl = rad(b.lng - a.lng)
  const h = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Body pod daným kořenem. Soubory s podtržítkem jsou surové exporty
 * a registry, ne datové záznamy; záznam bez `lat`/`lng` se přeskakuje
 * (bez souřadnic se vzdálenost neměří a nedomýšlí).
 */
export const nactiBody = (koren: string): Bod[] => {
  const out: Bod[] = []
  if (!existsSync(koren)) return out
  for (const oblast of readdirSync(koren, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!oblast.isDirectory() || oblast.name.startsWith('_')) continue
    const adresar = join(koren, oblast.name)
    for (const soubor of readdirSync(adresar).sort()) {
      if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
      const obsah = readFileSync(join(adresar, soubor), 'utf8')
      const lat = cislo(obsah, 'lat')
      const lng = cislo(obsah, 'lng')
      if (lat === null || lng === null) continue
      out.push({
        oblast: oblast.name,
        slug: soubor.replace(/\.yaml$/u, ''),
        nazev: nazevZeSouboru(obsah),
        lat,
        lng,
        povyseny: obsah.includes('POVÝŠENO'),
      })
    }
  }
  return out
}

/** Dvojice `oblast/slug`, o kterých redakce rozhodla (registr jmenovců). */
export const rozhodnuteDvojice = (cesta: string = REGISTR_JMENOVCU): Set<string> => {
  const out = new Set<string>()
  if (!existsSync(cesta)) return out
  const d = parse(readFileSync(cesta, 'utf8')) as { jmenovci?: { objekty?: string[] }[] } | null
  for (const z of d?.jmenovci ?? []) {
    const objekty = [...(z.objekty ?? [])].sort()
    for (const a of objekty) for (const b of objekty) if (a < b) out.add(`${a}|${b}`)
  }
  return out
}

export const najdiBlizkeBody = (
  korenKandidati: string = KOREN_KANDIDATI,
  korenChaty: string = KOREN_CHATY,
  registr: string = REGISTR_JMENOVCU,
  prah: number = BLIZKO_M,
): Par[] => {
  const rozhodnuto = rozhodnuteDvojice(registr)
  const profily = nactiBody(korenChaty)
  const out: Par[] = []
  // Objekt, který má kandidátský soubor i profil, se se svým sousedem potká
  // dvakrát (A kandidát × B profil a B kandidát × A profil). Je to týž pár
  // a týž rozhodovací úkol, hlásí se proto jednou.
  const videno = new Set<string>()
  for (const kandidat of nactiBody(korenKandidati)) {
    if (kandidat.povyseny) continue
    for (const profil of profily) {
      if (profil.oblast !== kandidat.oblast) continue // jiné oblasti řeší DATA-36/38
      if (profil.slug === kandidat.slug) continue // kandidát a jeho vlastní profil
      const par = [`${kandidat.oblast}/${kandidat.slug}`, `${profil.oblast}/${profil.slug}`].sort()
      const klic = `${par[0]}|${par[1]}`
      if (rozhodnuto.has(klic) || videno.has(klic)) continue
      const d = vzdalenostM(kandidat, profil)
      if (d > prah) continue
      videno.add(klic)
      out.push({ vzdalenostM: d, kandidat, profil })
    }
  }
  return out.sort(
    (a, b) => a.vzdalenostM - b.vzdalenostM || a.kandidat.slug.localeCompare(b.kandidat.slug),
  )
}

const spustenoPrimo = process.argv[1]?.includes('blizke-body')
if (spustenoPrimo) {
  const pary = najdiBlizkeBody()

  for (const p of pary) {
    console.log(
      `? ${p.vzdalenostM.toFixed(1).padStart(6)} m  ${p.kandidat.oblast}/${p.kandidat.slug}` +
        (p.kandidat.nazev ? ` — ${p.kandidat.nazev}` : ''),
    )
    console.log(
      `             PROFIL  ${p.profil.oblast}/${p.profil.slug}` +
        (p.profil.nazev ? ` — ${p.profil.nazev}` : ''),
    )
  }

  console.log()
  console.log(`kandidátů do ${BLIZKO_M} m od publikovaného profilu téže oblasti: ${pary.length}`)
  if (pary.length) {
    console.log()
    console.log('Co s tím: NENÍ to vada, je to pár k rozhodnutí. Postup je (1) porovnat')
    console.log('OSM tagy a web obou záznamů, (2) když jde o týž objekt, kandidáta')
    console.log('nepovyšovat a zapsat dvojici do data/_jmenovci.yaml s důvodem — tím')
    console.log('kontrola zmlkne; (3) když jsou to dvě stavby, zapsat to tam taky, ať')
    console.log('to příští triáž neřeší znovu. Vzdálenost sama nerozhoduje: 9 m je')
    console.log('jasná dvojí entita, 47 m můžou být dvě sousední boudy.')
  }
  // Návratový kód schválně 0 — viz hlavička.
  process.exit(0)
}
