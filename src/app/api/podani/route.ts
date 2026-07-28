import { getPayload } from 'payload'

import config from '@/payload.config'
import { SOUHLAS_ZNENI, zkontrolujPodani } from '@/lib/podani'

/**
 * Komunitní podání otisku razítka / fotky chaty (POST multipart/form-data).
 *
 * Bezpečnost a moderace:
 * - podání NIKDY nejde rovnou na web: fotka vzniká s typem
 *   `komunitni-podani` (šablony ji nevybírají) a razítko jako KONCEPT
 *   (`_status: draft` — veřejné čtení pouští jen publikovaná);
 * - schválení dělá redakce v adminu; publikaci bez licenčního souhlasu
 *   blokují hooky kolekcí (Razitka i Fotky);
 * - honeypot pole `web` (roboti ho vyplní → tiché „díky“ bez uložení),
 *   limit velikosti a MIME, jednoduchý rate-limit na IP (best effort).
 */

const PODANI_OKNO_MS = 10 * 60 * 1000
const PODANI_MAX_V_OKNE = 5
const podaniZIp = new Map<string, number[]>()

const prekrocenLimit = (ip: string): boolean => {
  const ted = Date.now()
  const zaznamy = (podaniZIp.get(ip) ?? []).filter((t) => ted - t < PODANI_OKNO_MS)
  if (zaznamy.length >= PODANI_MAX_V_OKNE) {
    podaniZIp.set(ip, zaznamy)
    return true
  }
  zaznamy.push(ted)
  podaniZIp.set(ip, zaznamy)
  return false
}

const odpoved = (status: number, telo: Record<string, unknown>) =>
  Response.json(telo, { status })

export async function POST(req: Request): Promise<Response> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return odpoved(400, { ok: false, chyby: ['Podání se nepodařilo přečíst (očekávám formulář se souborem).'] })
  }

  // Honeypot: lidé pole nevidí, roboti ho vyplní. Tiché „ok" bez uložení —
  // spam se nedozví, že narazil.
  const past = (form.get('web') as string | null)?.trim()
  if (past) return odpoved(200, { ok: true })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'neznama'
  if (prekrocenLimit(ip)) {
    return odpoved(429, { ok: false, chyby: ['Příliš mnoho podání za sebou — zkus to prosím za pár minut.'] })
  }

  const soubor = form.get('soubor')
  const jeSoubor = soubor instanceof File && soubor.size > 0
  const vstup = {
    druh: form.get('druh') as string | null,
    chataSlug: form.get('chata') as string | null,
    jmeno: (form.get('jmeno') as string | null)?.trim() ?? null,
    email: ((form.get('email') as string | null)?.trim() || null) ?? null,
    poznamka: ((form.get('poznamka') as string | null)?.trim() || null) ?? null,
    souhlas: form.get('souhlas') === 'ano',
    past: past ?? null,
    soubor: jeSoubor ? { velikost: soubor.size, mime: soubor.type } : null,
  }
  const chyby = zkontrolujPodani(vstup)
  if (chyby.length) return odpoved(400, { ok: false, chyby })

  const payload = await getPayload({ config })
  const chataRes = await payload.find({
    collection: 'chaty',
    where: { slug: { equals: vstup.chataSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  const chata = chataRes.docs[0]
  if (!chata) return odpoved(400, { ok: false, chyby: ['Tuhle chatu v průvodci nevedeme — vyber ji ze seznamu.'] })

  const dnes = new Date().toISOString().slice(0, 10)
  const data = Buffer.from(await (soubor as File).arrayBuffer())
  const bezpecnaPripona = ((soubor as File).name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const nazevSouboru = `podani-${chata.slug}-${Date.now()}.${bezpecnaPripona}`

  const fotka = await payload.create({
    collection: 'fotky',
    data: {
      alt:
        vstup.druh === 'razitko'
          ? `Komunitní podání — otisk razítka, ${chata.nazev} (čeká na posouzení)`
          : `Komunitní podání — fotka, ${chata.nazev} (čeká na posouzení)`,
      typ: 'komunitni-podani',
      chata: chata.id,
      autor: vstup.jmeno!,
      licence: 'se-svolenim',
      licencePoznamka: 'komunitní podání — souhlas se zveřejněním s uvedením jména',
      ...(vstup.poznamka ? { datovani: undefined } : {}),
      podani: {
        hostJmeno: vstup.jmeno,
        hostEmail: vstup.email ?? undefined,
        licencniSouhlas: true,
        souhlasZneni: SOUHLAS_ZNENI,
        souhlasDatum: dnes,
      },
    },
    file: { data, name: nazevSouboru, mimetype: (soubor as File).type, size: data.length },
    overrideAccess: true,
  })

  if (vstup.druh === 'razitko') {
    await payload.create({
      collection: 'razitka',
      draft: true,
      data: {
        _status: 'draft',
        nazev: `${chata.nazev} — komunitní podání ${dnes}`,
        chata: chata.id,
        otisk: fotka.id,
        zpusobZiskani: 'komunitni-podani',
        dolozil: vstup.jmeno,
        ...(vstup.poznamka ? { poznamka: vstup.poznamka } : {}),
        podani: {
          hostJmeno: vstup.jmeno,
          hostEmail: vstup.email ?? undefined,
          licencniSouhlas: true,
          souhlasZneni: SOUHLAS_ZNENI,
          souhlasDatum: dnes,
        },
      },
      overrideAccess: true,
    })
  } else if (vstup.poznamka) {
    // Poznámka k fotce (kdy foceno apod.) → datování snímku k posouzení redakcí.
    await payload.update({
      collection: 'fotky',
      id: fotka.id,
      data: { datovani: vstup.poznamka.slice(0, 120) },
      overrideAccess: true,
    })
  }

  return odpoved(200, { ok: true })
}
