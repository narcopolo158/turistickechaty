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
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

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

const yamlSoubory = (slozka: string, rekurzivne = true): string[] => {
  try {
    return readdirSync(slozka, { recursive: rekurzivne, encoding: 'utf8' })
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => join(slozka, f))
  } catch {
    return []
  }
}

type Upsert = { vytvoreno: boolean; id: number | string }

/**
 * Upsert dle slugu; drafty publikujeme — do repa se zapisují jen hotová data.
 * (Payload neumí generiku přes union kolekcí, proto explicitní větvení.)
 */
const upsert = async (
  collection: 'oblasti' | 'chaty',
  data: Record<string, unknown>,
): Promise<Upsert> => {
  const slug = data.slug as string
  // YAML je netypovaný vstup — validitu polí hlídá Payload za běhu; index
  // signatura Recordu se do typů kolekcí musí přetypovat přes unknown.
  const oblastData = { ...data, _status: 'published' } as unknown as RequiredDataFromCollectionSlug<'oblasti'>
  const chataData = { ...data, _status: 'published' } as unknown as RequiredDataFromCollectionSlug<'chaty'>
  const stavajici = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  const id = stavajici.docs[0]?.id
  if (id != null) {
    const doc =
      collection === 'oblasti'
        ? await payload.update({ collection, id, data: oblastData })
        : await payload.update({ collection, id, data: chataData })
    return { vytvoreno: false, id: doc.id }
  }
  const doc =
    collection === 'oblasti'
      ? await payload.create({ collection, data: oblastData })
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
    const nazev = nazevSouboruZUrl(stahnoutZ)
    let odpoved: Response
    try {
      odpoved = await fetch(stahnoutZ, {
        // Pozor: HTTP hlavicky jsou ASCII — zadna diakritika (fetch by spadl).
        headers: { 'User-Agent': 'turistickechaty.cz seed (kontakt: viz repozitar / GitHub)' },
      })
    } catch (chyba) {
      throw new Error(
        `chata ${slug}: stažení fotky selhalo (${stahnoutZ}) — seed potřebuje síť na upload.wikimedia.org, pusť ho lokálně nebo v Actions. Původní chyba: ${chyba}`,
      )
    }
    if (!odpoved.ok) throw new Error(`chata ${slug}: stažení fotky vrátilo HTTP ${odpoved.status} (${stahnoutZ})`)
    const data = Buffer.from(await odpoved.arrayBuffer())
    await payload.create({
      collection: 'fotky',
      data: fotkaData,
      file: { data, name: nazev, mimetype: mimeTypSouboru(nazev), size: data.byteLength },
    })
    payload.logger.info(`fotka (${slug}): stažena a nahrána — ${nazev} (${Math.round(data.byteLength / 1024)} kB)`)
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
