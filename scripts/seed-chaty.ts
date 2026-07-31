/**
 * Seed datových YAML do Payloadu (spouští se: npx payload run scripts/seed-chaty.ts).
 *
 * Zdroj pravdy pro data chat je repozitář: `data/oblasti/*.yaml`
 * a `data/chaty/<pohori>/<slug>.yaml` (CLAUDE.md — každý údaj se
 * source/verified/checked). Skript je idempotentní upsert dle slugu:
 * opakované spuštění jen přepíše hodnoty z YAML, nic neduplikuje.
 * Razítka: `data/razitka/<pohori>/<slug>.yaml` + soubor otisku vedle YAML
 * (blok `otisk` = metadata Fotky, nahraje se přes Payload upload).
 * Fotky chat: blok `fotky:` v YAML chaty (redakční výběr z kandidátů DATA-02) —
 * seed soubor stáhne z `stahnoutZ` (Wikimedia Commons) a nahraje do kolekce
 * Fotky s metadaty (autor, licence, zdrojUrl); idempotentně dle `zdrojUrl`.
 * Stažení potřebuje síť na upload.wikimedia.org — běží lokálně / v Actions,
 * ze sandboxu denních sessions to neprojde (proxy).
 * POZOR (27. 7. 2026): Wikimedia z IP adres GitHub Actions škrtí (HTTP 429)
 * — stejný vzorec jako Overpass v DATA-28. Stahování proto jede s opakováním
 * (Retry-After / 10–20–40 s), rozestupy 1,5 s a MĚKKÝM selháním: nedotažená
 * fotka běh NEshodí, jen se ohlásí — idempotentní seed ji doplní příště
 * (profil má fallback siluetu, nic se nevymýšlí).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { parse } from 'yaml'

import config from '../src/payload.config'
import { mimeTypSouboru, nazevSouboruZUrl } from './seed-fotky-lib'

const DATA = join(process.cwd(), 'data')
const payload = await getPayload({ config })

/** Odstavce prostého textu → minimální Lexical dokument (richText pole). */
const lexical = (odstavce: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: odstavce.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    })),
  },
})

// Soubory s prefixem `_` jsou meta soubory (redakční seznamy, manifesty —
// např. data/razitka/_parovani-potvrzene.yaml), NE datové záznamy: seed je
// přeskakuje. Bez toho seed spadl na „chata undefined neexistuje" (deploy #17).
const yamlSoubory = (slozka: string, rekurzivne = true): string[] => {
  try {
    return readdirSync(slozka, { recursive: rekurzivne, encoding: 'utf8' })
      .filter((f) => f.endsWith('.yaml') && !basename(f).startsWith('_'))
      .map((f) => join(slozka, f))
  } catch {
    return []
  }
}

type Upsert = { vytvoreno: boolean; id: number | string }

/**
 * Upsert dle slugu; drafty publikujeme — do repa se zapisují jen hotová data.
 * (Payload neumí generiku přes union kolekcí, proto explicitní větvení.
 * Strediska drafts nemají — `_status` u nich Payload ignoruje.)
 */
const upsert = async (
  collection: 'oblasti' | 'chaty' | 'strediska',
  data: Record<string, unknown>,
): Promise<Upsert> => {
  const slug = data.slug as string
  // YAML je netypovaný vstup — validitu polí hlídá Payload za běhu; index
  // signatura Recordu se do typů kolekcí musí přetypovat přes unknown.
  const oblastData = { ...data, _status: 'published' } as unknown as RequiredDataFromCollectionSlug<'oblasti'>
  const chataData = { ...data, _status: 'published' } as unknown as RequiredDataFromCollectionSlug<'chaty'>
  const strediskoData = { ...data } as unknown as RequiredDataFromCollectionSlug<'strediska'>
  const stavajici = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  const id = stavajici.docs[0]?.id
  if (id != null) {
    const doc =
      collection === 'oblasti'
        ? await payload.update({ collection, id, data: oblastData })
        : collection === 'strediska'
          ? await payload.update({ collection, id, data: strediskoData })
          : await payload.update({ collection, id, data: chataData })
    return { vytvoreno: false, id: doc.id }
  }
  const doc =
    collection === 'oblasti'
      ? await payload.create({ collection, data: oblastData })
      : collection === 'strediska'
        ? await payload.create({ collection, data: strediskoData })
        : await payload.create({ collection, data: chataData })
  return { vytvoreno: true, id: doc.id }
}

// ── 1. Oblasti ──────────────────────────────────────────────────────────────
const oblastId = new Map<string, number | string>()
// Jen top-level definice oblastí (data/oblasti/*.yaml); podsložky drží
// oblastní data (výchozí body ap.), ne oblasti — proto nerekurzivně.
for (const soubor of yamlSoubory(join(DATA, 'oblasti'), false)) {
  const data = parse(readFileSync(soubor, 'utf8'))
  const vysledek = await upsert('oblasti', data)
  oblastId.set(data.slug, vysledek.id)
  payload.logger.info(`oblast ${data.slug}: ${vysledek.vytvoreno ? 'vytvořena' : 'aktualizována'}`)
}

// ── 1b. Střediska (F1a) ─────────────────────────────────────────────────────
// YAML `data/strediska/<oblast>/<slug>.yaml`; vazba na oblast slugem (jako u chat).
for (const soubor of yamlSoubory(join(DATA, 'strediska'))) {
  const { oblast, ...data } = parse(readFileSync(soubor, 'utf8'))
  if (oblast) {
    if (!oblastId.has(oblast)) {
      throw new Error(`${soubor}: oblast „${oblast}" neexistuje (chybí data/oblasti/${oblast}.yaml?)`)
    }
    data.oblast = oblastId.get(oblast)
  }
  const vysledek = await upsert('strediska', data)
  payload.logger.info(`středisko ${data.slug}: ${vysledek.vytvoreno ? 'vytvořeno' : 'aktualizováno'}`)
}

// ── 2. Chaty ────────────────────────────────────────────────────────────────
type FotkaYaml = { stahnoutZ: string } & Record<string, unknown>
// `fotky` je v kolekci Chaty join pole (jen ke čtení) — z YAML se vyjme
// a zpracuje zvlášť v sekci 2b, do upsertu chaty nesmí.
const fotkyChat = new Map<string, { fotky: FotkaYaml[]; chataId: number | string }>()
for (const soubor of yamlSoubory(join(DATA, 'chaty'))) {
  const yaml = parse(readFileSync(soubor, 'utf8'))
  const { oblast, text, fotky, ...data } = yaml

  if (oblast) {
    if (!oblastId.has(oblast)) {
      const nalezena = await payload.find({
        collection: 'oblasti',
        where: { slug: { equals: oblast } },
        limit: 1,
      })
      if (!nalezena.docs[0]) throw new Error(`${soubor}: oblast „${oblast}" neexistuje (chybí data/oblasti/${oblast}.yaml?)`)
      oblastId.set(oblast, nalezena.docs[0].id)
    }
    data.oblast = oblastId.get(oblast)
  }
  if (Array.isArray(text)) data.text = lexical(text)

  const vysledek = await upsert('chaty', data)
  payload.logger.info(`chata ${data.slug}: ${vysledek.vytvoreno ? 'vytvořena' : 'aktualizována'}`)
  if (Array.isArray(fotky) && fotky.length > 0) fotkyChat.set(data.slug, { fotky, chataId: vysledek.id })
}

// ── 2b. Fotky chat (stažení z Commons + upload, idempotentně dle zdrojUrl) ──
// SEED_BEZ_FOTEK=1 sekci vědomě přeskočí — pro prostředí bez sítě na
// upload.wikimedia.org (sandbox denních sessions); web pak hero nezobrazí.
if (process.env.SEED_BEZ_FOTEK === '1' && fotkyChat.size > 0) {
  payload.logger.warn(`SEED_BEZ_FOTEK=1 — přeskakuji stahování fotek ${fotkyChat.size} chat (hero zůstane bez snímku)`)
  fotkyChat.clear()
}
const pauza = (ms: number) => new Promise<void>((vyres) => setTimeout(vyres, ms))

/**
 * Stažení fotky s opakováním. Wikimedia z CI adres (GitHub Actions) vrací
 * HTTP 429 (doloženo prvním během deploy-staging 27. 7. 2026) — ctí se
 * Retry-After (strop 90 s), jinak 10/20/40 s; opakují se i 5xx a výpadky
 * sítě. Trvalé chyby (404, 403…) se neopakují. Po vyčerpání pokusů vrací
 * null — volající fotku přeskočí a idempotentní seed ji doplní příště.
 */
async function stahniFotku(url: string, slug: string): Promise<Buffer | null> {
  const CEKANI = [10_000, 20_000, 40_000]
  for (let pokus = 0; pokus <= CEKANI.length; pokus++) {
    let odpoved: Response | null = null
    try {
      odpoved = await fetch(url, {
        // Pozor: HTTP hlavicky jsou ASCII — zadna diakritika (fetch by spadl).
        headers: { 'User-Agent': 'turistickechaty.cz seed/1.0 (+https://turistickechaty.cz)' },
      })
    } catch (chyba) {
      payload.logger.warn(`fotka (${slug}): síť selhala (pokus ${pokus + 1}): ${chyba}`)
    }
    if (odpoved?.ok) return Buffer.from(await odpoved.arrayBuffer())
    if (odpoved && ![429, 500, 502, 503, 504].includes(odpoved.status)) {
      payload.logger.warn(`fotka (${slug}): HTTP ${odpoved.status} (${url}) — neopakovatelná chyba, přeskakuji`)
      return null
    }
    if (pokus < CEKANI.length) {
      const retryAfter = Number(odpoved?.headers.get('retry-after'))
      const cekej =
        Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 90_000) : CEKANI[pokus]
      payload.logger.warn(
        `fotka (${slug}): HTTP ${odpoved?.status ?? 'bez odpovědi'} — čekám ${Math.round(cekej / 1000)} s a zkouším znovu`,
      )
      await pauza(cekej)
    }
  }
  return null
}

let fotekVzdano = 0
for (const [slug, { fotky, chataId }] of fotkyChat) {
  for (const { stahnoutZ, ...metadata } of fotky) {
    if (!stahnoutZ || !metadata.zdrojUrl) throw new Error(`chata ${slug}: fotka potřebuje stahnoutZ i zdrojUrl (identita a zdroj)`)
    const fotkaData = { ...metadata, chata: chataId } as unknown as RequiredDataFromCollectionSlug<'fotky'>
    const stavajici = await payload.find({
      collection: 'fotky',
      where: { zdrojUrl: { equals: metadata.zdrojUrl } },
      limit: 1,
    })
    if (stavajici.docs[0]) {
      // Soubor už v DB je — jen se srovnají metadata, nic se nestahuje.
      await payload.update({ collection: 'fotky', id: stavajici.docs[0].id, data: fotkaData })
      payload.logger.info(`fotka (${slug}): aktualizována metadata — ${metadata.zdrojUrl}`)
      continue
    }
    if (fotekVzdano >= 3) {
      // Throttling už 3× vyčerpal všechny pokusy — zbytek tohoto běhu se
      // nezdržuje (další 429 jsou skoro jisté); doplní je příští seed.
      payload.logger.warn(`fotka (${slug}): přeskočena bez pokusu — běh už 3× narazil na throttling`)
      continue
    }
    const nazev = nazevSouboruZUrl(stahnoutZ)
    const data = await stahniFotku(stahnoutZ, slug)
    if (!data) {
      fotekVzdano++
      payload.logger.warn(
        `fotka (${slug}): NEstažena (${stahnoutZ}) — hero zatím bez snímku (fallback silueta), idempotentní seed ji doplní v příštím běhu`,
      )
      continue
    }
    await payload.create({
      collection: 'fotky',
      data: fotkaData,
      file: { data, name: nazev, mimetype: mimeTypSouboru(nazev), size: data.byteLength },
    })
    payload.logger.info(`fotka (${slug}): stažena a nahrána — ${nazev} (${Math.round(data.byteLength / 1024)} kB)`)
    await pauza(1500) // rozestup mezi stahováními — slušnost k Wikimedia, menší šance na 429
  }
}
if (fotekVzdano > 0) {
  payload.logger.warn(
    `Fotky: ${fotekVzdano} nedotaženo kvůli throttlingu/chybám — běh pokračoval dál, příští seed je doplní (idempotence dle zdrojUrl)`,
  )
}

// ── 2c. Fotky objektů bez profilu (střediska, lanovky) ─────────────────────
/**
 * `data/fotky/_redakcni.yaml` — snímky, které NEPATŘÍ chatě.
 *
 * Vznikají v redakčním prostředí: mezi kandidátními fotkami chaty se občas
 * najde dobrá fotka něčeho jiného (zadání Michala 31. 7. 2026: „jsou tam mezi
 * fotkami chat dobré fotky třeba k lanovce — je škoda je jen zahodit").
 * Středisko se váže slugem (má vlastní kolekci), lanovka dvojicí oblast+slug
 * (dráhy vznikají z OSM a kolekci nemají). Na webu mají tyhle fotky přednost
 * před automatickým výběrem z Commons — viz src/lib/fotky-redakcni.ts.
 *
 * Idempotence stejná jako u fotek chat: klíčem je `zdrojUrl`, takže opakovaný
 * seed jen srovná metadata a nic nestahuje.
 */
const souborCizichFotek = join(DATA, 'fotky', '_redakcni.yaml')
if (existsSync(souborCizichFotek) && process.env.SEED_BEZ_FOTEK !== '1') {
  const { fotky: cizi = [] } = (parse(readFileSync(souborCizichFotek, 'utf8')) ?? {}) as {
    fotky?: ({ predmet: string; slug: string; oblast?: string; stahnoutZ: string } & Record<string, unknown>)[]
  }
  for (const { predmet, slug, oblast, stahnoutZ, ...metadata } of cizi) {
    if (!stahnoutZ || !metadata.zdrojUrl) throw new Error(`fotky/_redakcni.yaml: záznam ${slug} potřebuje stahnoutZ i zdrojUrl`)
    let vazba: Record<string, unknown>
    if (predmet === 'stredisko') {
      const nalezene = await payload.find({ collection: 'strediska', where: { slug: { equals: slug } }, limit: 1 })
      if (!nalezene.docs[0]) {
        payload.logger.warn(`fotka (${slug}): středisko neexistuje — přeskakuji (doplní se, až vznikne)`)
        continue
      }
      vazba = { stredisko: nalezene.docs[0].id }
    } else if (predmet === 'lanovka') {
      if (!oblast) throw new Error(`fotky/_redakcni.yaml: lanovka ${slug} potřebuje oblast`)
      vazba = { lanovkaOblast: oblast, lanovkaSlug: slug }
    } else {
      throw new Error(`fotky/_redakcni.yaml: neznámý předmět „${predmet}" u ${slug}`)
    }
    const fotkaData = { ...metadata, ...vazba } as unknown as RequiredDataFromCollectionSlug<'fotky'>
    const stavajici = await payload.find({
      collection: 'fotky',
      where: { zdrojUrl: { equals: metadata.zdrojUrl } },
      limit: 1,
    })
    if (stavajici.docs[0]) {
      await payload.update({ collection: 'fotky', id: stavajici.docs[0].id, data: fotkaData })
      payload.logger.info(`fotka ${predmet} (${slug}): aktualizována metadata`)
      continue
    }
    const nazev = nazevSouboruZUrl(stahnoutZ)
    const data = await stahniFotku(stahnoutZ, slug)
    if (!data) {
      payload.logger.warn(`fotka ${predmet} (${slug}): NEstažena — doplní ji příští seed`)
      continue
    }
    await payload.create({
      collection: 'fotky',
      data: fotkaData,
      file: { data, name: nazev, mimetype: mimeTypSouboru(nazev), size: data.byteLength },
    })
    payload.logger.info(`fotka ${predmet} (${slug}): stažena a nahrána — ${nazev}`)
    await pauza(1500)
  }
}

// ── 3. Razítka (otisk = upload do Fotek, idempotentně dle filename) ─────────
for (const soubor of yamlSoubory(join(DATA, 'razitka'))) {
  const { chata: chataSlug, otisk, ...data } = parse(readFileSync(soubor, 'utf8'))

  const chata = await payload.find({ collection: 'chaty', where: { slug: { equals: chataSlug } }, limit: 1 })
  if (!chata.docs[0]) throw new Error(`${soubor}: chata „${chataSlug}" neexistuje — razítko potřebuje profil chaty`)
  const chataId = chata.docs[0].id

  let otiskId: number | string | undefined
  if (otisk) {
    const { soubor: nazevSouboru, ...fotka } = otisk
    const fotkaData = { ...fotka, chata: chataId } as unknown as RequiredDataFromCollectionSlug<'fotky'>
    const stavajici = await payload.find({
      collection: 'fotky',
      where: { filename: { equals: nazevSouboru } },
      limit: 1,
    })
    otiskId = stavajici.docs[0]
      ? (await payload.update({ collection: 'fotky', id: stavajici.docs[0].id, data: fotkaData })).id
      : (await payload.create({ collection: 'fotky', data: fotkaData, filePath: join(dirname(soubor), nazevSouboru) })).id
  }

  const razitkoData = {
    ...data,
    chata: chataId,
    ...(otiskId != null ? { otisk: otiskId } : {}),
    // Razítka mají zapnutou moderaci (koncept/publikace). Redakční záznamy ze
    // seedu jsou rovnou publikované — jinak by po zapnutí drafts zmizely z webu.
    _status: 'published',
  } as unknown as RequiredDataFromCollectionSlug<'razitka'>
  const existujici = await payload.find({
    collection: 'razitka',
    where: { and: [{ nazev: { equals: data.nazev } }, { chata: { equals: chataId } }] },
    limit: 1,
  })
  const vysledekRazitka = existujici.docs[0]
    ? { vytvoreno: false, id: (await payload.update({ collection: 'razitka', id: existujici.docs[0].id, data: razitkoData })).id }
    : { vytvoreno: true, id: (await payload.create({ collection: 'razitka', data: razitkoData })).id }
  payload.logger.info(
    `razítko „${data.nazev}" (${chataSlug}): ${vysledekRazitka.vytvoreno ? 'vytvořeno' : 'aktualizováno'}${otisk ? ' + otisk' : ''}`,
  )
}

payload.logger.info('Seed hotov.')
process.exit(0)
