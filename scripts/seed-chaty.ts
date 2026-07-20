/**
 * Seed datových YAML do Payloadu (spouští se: npx payload run scripts/seed-chaty.ts).
 *
 * Zdroj pravdy pro data chat je repozitář: `data/oblasti/*.yaml`
 * a `data/chaty/<pohori>/<slug>.yaml` (CLAUDE.md — každý údaj se
 * source/verified/checked). Skript je idempotentní upsert dle slugu:
 * opakované spuštění jen přepíše hodnoty z YAML, nic neduplikuje.
 * Razítka: `data/razitka/<pohori>/<slug>.yaml` + soubor otisku vedle YAML
 * (blok `otisk` = metadata Fotky, nahraje se přes Payload upload).
 * Ostatní fotky se zatím nahrávají přes admin — seed je nechává být.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { parse } from 'yaml'

import config from '../src/payload.config'

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

const yamlSoubory = (slozka: string): string[] => {
  try {
    return readdirSync(slozka, { recursive: true, encoding: 'utf8' })
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
for (const soubor of yamlSoubory(join(DATA, 'oblasti'))) {
  const data = parse(readFileSync(soubor, 'utf8'))
  const vysledek = await upsert('oblasti', data)
  oblastId.set(data.slug, vysledek.id)
  payload.logger.info(`oblast ${data.slug}: ${vysledek.vytvoreno ? 'vytvořena' : 'aktualizována'}`)
}

// ── 2. Chaty ────────────────────────────────────────────────────────────────
for (const soubor of yamlSoubory(join(DATA, 'chaty'))) {
  const yaml = parse(readFileSync(soubor, 'utf8'))
  const { oblast, text, ...data } = yaml

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
