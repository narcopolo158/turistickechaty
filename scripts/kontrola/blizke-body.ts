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
 * Rozhodnutí ale nežije jen v registru jmenovců — a to je nález z prvního
 * ostrého průchodu (24. 8. 2026). Kontrola hlásila „Josefova věž 19,7 m od
 * Horské chaty Kleť", ačkoli ten pár JE rozhodnutý od 7. 8. 2026: kandidát
 * leží v `data/kandidati/_vyrazeno.yaml` se slučovacím důvodem („jeden
 * provoz, jeden profil"). Čte se proto i druhý registr — identita objektu
 * podle **OSM URL** (tak, jak to `_vyrazeno.yaml` samo píše ve své hlavičce),
 * navíc podle `oblast/slug`. Bez toho by kontrola žádala rozhodnutí, které
 * už padlo, a to je přesně ten druh šumu, kvůli kterému se kontroly přestanou
 * číst.
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
  /** Primární OSM URL záznamu (identita objektu), když ji soubor nese. */
  osm: string | null
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

/**
 * První OSM URL v souboru. U kandidáta z DATA-01 stojí hned v hlavičce
 * („# Zdroj: …"), u profilu v `overeniLokace.source`. Normalizuje se na tvar
 * bez protokolu a bez `www.`, ať se `https://www.openstreetmap.org/node/1`
 * a `http://openstreetmap.org/node/1` porovnají jako týž objekt.
 */
export const normalizujOsm = (url: string): string =>
  url
    .trim()
    .replace(/^https?:\/\//u, '')
    .replace(/^www\./u, '')
    .replace(/\/+$/u, '')

const osmZeSouboru = (obsah: string): string | null => {
  const m = /https?:\/\/(?:www\.)?openstreetmap\.org\/(?:node|way|relation)\/\d+/u.exec(obsah)
  return m ? normalizujOsm(m[0]) : null
}

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
        osm: osmZeSouboru(obsah),
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

/**
 * Objekty, které už redakce vyřadila (`data/kandidati/_vyrazeno.yaml`) — ať
 * jako duplicitu, přesun do jiné oblasti, nebo sloučení do profilu (vzor
 * Josefova věž / Rozhledna Pancíř). Identita objektu je podle `_vyrazeno.yaml`
 * jeho **OSM URL**; některé záznamy mají navíc `slug` ve tvaru `oblast/slug`.
 * Vracíme obojí normalizované, aby se kandidát dal poznat kterýmkoli klíčem.
 */
export const vyrazeneObjekty = (
  cesta: string = join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml'),
): { osm: Set<string>; slugy: Set<string> } => {
  const osm = new Set<string>()
  const slugy = new Set<string>()
  if (!existsSync(cesta)) return { osm, slugy }
  const d = parse(readFileSync(cesta, 'utf8')) as {
    vyrazeno?: { osm?: string; slug?: string }[]
  } | null
  for (const z of d?.vyrazeno ?? []) {
    if (z.osm) osm.add(normalizujOsm(z.osm))
    // Slug je v tomto registru buď holý (`chata-mamut-…`), nebo už s oblastí
    // (`sumava/josefova-vez`). Jen tvar s lomítkem je jednoznačný klíč.
    if (z.slug && z.slug.includes('/')) slugy.add(z.slug)
  }
  return { osm, slugy }
}

export const najdiBlizkeBody = (
  korenKandidati: string = KOREN_KANDIDATI,
  korenChaty: string = KOREN_CHATY,
  registr: string = REGISTR_JMENOVCU,
  prah: number = BLIZKO_M,
  registrVyrazenych: string = join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml'),
): Par[] => {
  const rozhodnuto = rozhodnuteDvojice(registr)
  const vyrazeno = vyrazeneObjekty(registrVyrazenych)
  const profily = nactiBody(korenChaty)
  const out: Par[] = []
  // Objekt, který má kandidátský soubor i profil, se se svým sousedem potká
  // dvakrát (A kandidát × B profil a B kandidát × A profil). Je to týž pár
  // a týž rozhodovací úkol, hlásí se proto jednou.
  const videno = new Set<string>()
  for (const kandidat of nactiBody(korenKandidati)) {
    if (kandidat.povyseny) continue
    // Kandidát už jednou vyřazený (sloučený do profilu, duplicita, přesun)
    // je rozhodnutý — pár se nehlásí, ať už se pozná OSM URL, nebo slugem.
    if (kandidat.osm && vyrazeno.osm.has(kandidat.osm)) continue
    if (vyrazeno.slugy.has(`${kandidat.oblast}/${kandidat.slug}`)) continue
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

export type ParKandidatu = {
  vzdalenostM: number
  a: Bod
  b: Bod
}

/**
 * KANDIDÁT × KANDIDÁT v téže oblasti — druhá polovina téhož měření, doplněná
 * 31. 8. 2026 poté, co ji dva nálezy za sebou vyžádaly:
 *
 *  - 30. 8. 2026: `prezesowa-chata` a `szklana-chata` stojí ve Szklarské
 *    Porębě 30–40 m od sebe a může jít o týž podnik zapsaný dvakrát.
 *  - 31. 8. 2026: `modrokamenna-bouda` (ruční kandidát z triáže DATA-22)
 *    a `penzion-modrokamenna-bouda` (běh DATA-01 z 22. 8.) jsou **9,8 m**
 *    od sebe a je to prokazatelně týž dům; jádro názvu se liší jen
 *    předsazeným slovem „Penzion", takže shodu neohlásila ani `kolize-jmen`,
 *    ani pojistka DATA-38.
 *
 * `najdiBlizkeBody` výš měří kandidáta jen proti **publikovanému profilu**,
 * takže dvojice dvou nepovýšených kandidátů jí propadne celá. Registry
 * rozhodnutých párů i to, že kontrola NEROZHODUJE, zůstávají stejné — je to
 * týž rozhodovací úkol, jen o patro dřív, ještě před povýšením.
 *
 * PRÁH JE ALE JINÝ, A JE TO ZMĚŘENO. Padesátimetrový práh z DATA-38 sedí na
 * pár kandidát × profil, protože profil je kurátorovaný objekt — blízký zásah
 * u něj něco znamená. V surové zásobě kandidátů leží ale celé chatové osady
 * stejných domků, takže na 50 m vychází **384 dvojic a 298 z nich je ze
 * Šumavy** (řady „FH 1–34", „Schwarzes Haus 61–65“ — legitimní sousedé, ne
 * duplicity). Měřeno 31. 8. 2026 nad celým repem: 50 m → 384, 30 m → 202,
 * 15 m → 62, **10 m → 8**. Teprve na deseti metrech je výstup čitelný a skoro
 * samá pravá dvojice (`havlova-bouda` × `restaurace-havlova-bouda` 3,4 m,
 * `kramarova-chata` × `kramarova-chata-na-suchem-vrchu` 6,1 m, `vazecka-chata`
 * × `vazecka-chata-bistro` 6,3 m). Deset metrů je zhruba půdorys boudy: dva
 * body blíž k sobě jsou spíš týž dům než dva sousední.
 */
export const BLIZKO_KANDIDATI_M = 10

export const najdiBlizkeKandidaty = (
  korenKandidati: string = KOREN_KANDIDATI,
  registr: string = REGISTR_JMENOVCU,
  prah: number = BLIZKO_KANDIDATI_M,
  registrVyrazenych: string = join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml'),
): ParKandidatu[] => {
  const rozhodnuto = rozhodnuteDvojice(registr)
  const vyrazeno = vyrazeneObjekty(registrVyrazenych)
  const zivi = nactiBody(korenKandidati).filter(
    (k) =>
      !k.povyseny &&
      !(k.osm && vyrazeno.osm.has(k.osm)) &&
      !vyrazeno.slugy.has(`${k.oblast}/${k.slug}`),
  )
  const out: ParKandidatu[] = []
  for (let i = 0; i < zivi.length; i += 1) {
    for (let j = i + 1; j < zivi.length; j += 1) {
      const a = zivi[i]!
      const b = zivi[j]!
      if (a.oblast !== b.oblast) continue // jiné oblasti řeší DATA-36/38
      // Dva zápisy TÉŽE OSM entity nejsou nález — to je práce pro
      // `duplicity-oblasti`, která identitu podle OSM URL umí.
      if (a.osm && b.osm && a.osm === b.osm) continue
      const par = [`${a.oblast}/${a.slug}`, `${b.oblast}/${b.slug}`].sort()
      if (rozhodnuto.has(`${par[0]}|${par[1]}`)) continue
      const d = vzdalenostM(a, b)
      if (d > prah) continue
      out.push({ vzdalenostM: d, a, b })
    }
  }
  return out.sort((x, y) => x.vzdalenostM - y.vzdalenostM || x.a.slug.localeCompare(y.a.slug))
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

  const paryK = najdiBlizkeKandidaty()
  console.log()
  for (const p of paryK) {
    console.log(
      `? ${p.vzdalenostM.toFixed(1).padStart(6)} m  ${p.a.oblast}/${p.a.slug}` +
        (p.a.nazev ? ` — ${p.a.nazev}` : ''),
    )
    console.log(
      `          KANDIDÁT  ${p.b.oblast}/${p.b.slug}` + (p.b.nazev ? ` — ${p.b.nazev}` : ''),
    )
  }
  console.log()
  console.log(`dvojic nepovýšených kandidátů do ${BLIZKO_KANDIDATI_M} m v téže oblasti: ${paryK.length}`)
  if (paryK.length) {
    console.log()
    console.log('Totéž, jen o patro dřív: dva kandidáti pár metrů od sebe jsou nejspíš')
    console.log('týž objekt zapsaný dvakrát (ruční zápis × běh DATA-01, nebo dvě OSM')
    console.log('entity jednoho domu). Rozhodnutí patří do data/_jmenovci.yaml stejně')
    console.log('jako u páru s profilem — tím kontrola zmlkne.')
  }
  // Návratový kód schválně 0 — viz hlavička.
  process.exit(0)
}
