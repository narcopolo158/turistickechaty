/**
 * DATA-36 bod (b) — DUPLICITY OBJEKTŮ MEZI OBLASTMI.
 *
 * Okna oblastí se ZÁMĚRNĚ překrývají, aby ostrý řez na hranici dvou pohoří
 * tiše nevyřízl objekty na sedle mezi nimi (Krkonoše × Jizerky u Jizerky
 * a Harrachova, Beskydy × Javorníky u Rožnovské Bečvy). Cena toho rozhodnutí
 * se předvedla 8. 8. 2026: dva kliky na DATA-01 pro dvě sousední oblasti
 * vyrobily 29 kandidátů se shodným jménem i souřadnicemi ve dvou adresářích.
 *
 * Bod (a) DATA-36 je pojistka v exportu (`indexJinychOblasti` v
 * `scripts/data01-overpass-krkonose.ts`): objekt, který už vede jiná oblast,
 * se znovu nezaloží. Jenže pojistka chrání jen BUDOUCÍ běhy — duplicity,
 * které v repu už leží (a ty, které vzniknou ručním založením profilu nebo
 * přesunem mezi oblastmi), nevidí nikdo. Tahle kontrola je druhá polovina:
 * čte stav repa a hlásí, že týž OSM objekt vedou dvě oblasti.
 *
 * IDENTITA OBJEKTU JE URL V OSM, ne slug ani jméno — stejně jako v bodě (a).
 * Slug se může lišit suffixem `-<id>` a jména jako „Chata", „Skalka" nebo
 * „Poľana" se v korpusu opakují u prokazatelně různých objektů (od toho je
 * registr jmenovců a kontrola `kolize-jmen`).
 *
 * A stejně jako bod (a) se bere **PRVNÍ OSM URL v souboru** — to je hlavička
 * záznamu, tedy jeho vlastní objekt. Další URL v témž souboru bývají citace
 * CIZÍCH objektů z rešerše: šumavský kandidát `josefova-vez` cituje uzel
 * Kletě, `rozhledna-pancir` uzly Chaty Pancíř. Braly-li by se všechny, hlásila
 * by kontrola jako duplicitu i poctivě odvedenou rešerši sousedního objektu.
 *
 *   npx tsx scripts/kontrola/duplicity-oblasti.ts
 *
 * NEROZHODUJE (návratový kód vždy 0): duplicita mezi oblastmi je
 * ROZPRACOVANOST, ne vada. Objekt na hranici dvou pohoří někam patří a
 * rozhodne to triáž s pramenem o příslušnosti — ne kontrola. Kontrola má
 * jen zajistit, že se na takový pár nezapomene (vzor `katalog-pokryti`).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const KOREN_KANDIDATI = join(process.cwd(), 'data', 'kandidati')
const KOREN_CHATY = join(process.cwd(), 'data', 'chaty')

/** OSM URL v libovolném tvaru, ve kterém se v datech vyskytuje. */
const OSM_URL = /openstreetmap\.org\/(node|way|relation)\/(\d+)/g

export type Vyskyt = {
  oblast: string
  slug: string
  /** `kandidat` = `data/kandidati/…`, `profil` = `data/chaty/…` */
  druh: 'kandidat' | 'profil'
  nazev: string | null
}

export type Duplicita = {
  /** Kanonické OSM URL objektu (bez schématu a www — identita, ne odkaz). */
  osm: string
  vyskyty: Vyskyt[]
}

/** Jméno objektu z YAML bez parsování celého souboru (stačí první `nazev:`). */
const nazevZeSouboru = (obsah: string): string | null =>
  /^nazev:\s*(.+?)\s*$/mu.exec(obsah)?.[1]?.replace(/^["']|["']$/gu, '') ?? null

/**
 * Projde adresáře oblastí pod daným kořenem a vrátí výskyty podle OSM URL.
 * Soubory začínající podtržítkem se ignorují — to jsou surové exporty
 * a registry (`_vyrazeno.yaml`, `_overpass-*.json`), ne datové záznamy;
 * `_vyrazeno.yaml` navíc OSM URL nese schválně, a vyřazený objekt duplicita
 * není.
 */
export const nactiVyskyty = (koren: string, druh: Vyskyt['druh']): Map<string, Vyskyt[]> => {
  const out = new Map<string, Vyskyt[]>()
  if (!existsSync(koren)) return out
  for (const oblast of readdirSync(koren, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!oblast.isDirectory() || oblast.name.startsWith('_')) continue
    const adresar = join(koren, oblast.name)
    for (const soubor of readdirSync(adresar).sort()) {
      if (!soubor.endsWith('.yaml') || soubor.startsWith('_')) continue
      const obsah = readFileSync(join(adresar, soubor), 'utf8')
      const vyskyt: Vyskyt = {
        oblast: oblast.name,
        slug: soubor.replace(/\.yaml$/u, ''),
        druh,
        nazev: nazevZeSouboru(obsah),
      }
      // První URL = hlavička záznamu, tedy jeho vlastní objekt (viz komentář
      // v hlavičce souboru). Bez OSM URL je záznam ručně založený profil —
      // ten se do indexu nedostane a duplicitu s ním kontrola nevidí; je to
      // vědomá mez, ne opomenutí (identitu ručního profilu nenese nic strojově
      // porovnatelného).
      const m = OSM_URL.exec(obsah)
      OSM_URL.lastIndex = 0
      if (!m) continue
      const url = `openstreetmap.org/${m[1]}/${m[2]}`
      out.set(url, [...(out.get(url) ?? []), vyskyt])
    }
  }
  return out
}

/**
 * Duplicity = týž OSM objekt vedený ve DVOU A VÍCE OBLASTECH. Dva výskyty
 * v jedné oblasti (kandidát a profil téhož slugu) duplicita mezi oblastmi
 * nejsou a řeší je jiná kontrola; sem nepatří.
 */
export const najdiDuplicity = (
  korenKandidati: string = KOREN_KANDIDATI,
  korenChaty: string = KOREN_CHATY,
): Duplicita[] => {
  const vse = new Map<string, Vyskyt[]>()
  for (const [koren, druh] of [
    [korenKandidati, 'kandidat'],
    [korenChaty, 'profil'],
  ] as const) {
    for (const [url, vyskyty] of nactiVyskyty(koren, druh)) {
      vse.set(url, [...(vse.get(url) ?? []), ...vyskyty])
    }
  }
  const out: Duplicita[] = []
  for (const [osm, vyskyty] of vse) {
    if (new Set(vyskyty.map((v) => v.oblast)).size < 2) continue
    out.push({
      osm,
      vyskyty: [...vyskyty].sort(
        (a, b) => a.oblast.localeCompare(b.oblast) || a.slug.localeCompare(b.slug),
      ),
    })
  }
  return out.sort((a, b) => a.osm.localeCompare(b.osm))
}

const spustenoPrimo = process.argv[1]?.includes('duplicity-oblasti')
if (spustenoPrimo) {
  const duplicity = najdiDuplicity()

  for (const d of duplicity) {
    console.log(`? https://www.${d.osm}`)
    for (const v of d.vyskyty) {
      console.log(
        `    ${v.druh === 'profil' ? 'PROFIL   ' : 'kandidát '} ${v.oblast}/${v.slug}` +
          (v.nazev ? ` — ${v.nazev}` : ''),
      )
    }
  }

  console.log()
  console.log(`objektů vedených ve dvou a více oblastech: ${duplicity.length}`)
  if (duplicity.length) {
    console.log()
    console.log('Co s tím: NENÍ to vada, je to rozhodnutí o příslušnosti. Postup je')
    console.log('(1) najít pramen, který objekt řadí do pohoří (rozvodí, hřeben, mapa),')
    console.log('(2) záznam v druhé oblasti smazat nebo přesunout — a v tom, který')
    console.log('zůstane, poznámkou říct proč, ať to příští triáž neřeší znovu.')
    console.log('Pozor: dva OSM objekty téhož domu (DATA-38) tahle kontrola nevidí —')
    console.log('identitou je URL, takže dvě různá ID projdou jako dva objekty.')
  }
  // Návratový kód schválně 0 — viz hlavička.
  process.exit(0)
}
