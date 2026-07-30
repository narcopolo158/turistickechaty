import { getPayload } from 'payload'

import config from '@/payload.config'
import { PREDMET_DRUHU, SOUHLAS_ZNENI, zkontrolujPodani, type DruhPodani } from '@/lib/podani'
import { lanovkaPodleSlugu } from '@/lib/lanovky'

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
  try {
    return await zpracujPodani(req)
  } catch (chyba) {
    // Bez tohohle by Next vrátil HTML error page, `res.json()` na klientu by
    // hodil výjimku a formulář by hlásil „síť“ — přesně ta past 28. 7. 2026.
    console.error('[podani] neočekávaná chyba:', chyba)
    return odpoved(500, {
      ok: false,
      chyby: ['Podání se nepodařilo uložit — chyba na naší straně. Zkus to prosím znovu.'],
      // Detail posíláme do UI záměrně: bez něj je hlášení chyby slepé
      // (28. 7. 2026 se serverová chyba tvářila jako výpadek sítě).
      detail: (chyba instanceof Error ? chyba.message : String(chyba)).slice(0, 200),
    })
  }
}

async function zpracujPodani(req: Request): Promise<Response> {
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
  const druh = vstup.druh as DruhPodani
  const predmetDruh = PREDMET_DRUHU[druh]

  /**
   * Předmět podání. Chata i středisko jsou kolekce, takže se ověří dotazem
   * a uloží vztahem. Lanovka kolekci NEMÁ (dráhy vznikají z OSM, DATA-32) —
   * ověří se proti přehledu lanovek a uloží se dvojicí oblast + slug.
   * Neověřený předmět se nepřijímá: podání, které nikam nepatří, by v adminu
   * skončilo jako fotka bez místa.
   */
  let chata: { id: number; slug?: string | null; nazev: string } | null = null
  let stredisko: { id: number; slug?: string | null; nazev: string } | null = null
  let lanovka: { oblast: string; slug: string; nazev: string } | null = null

  if (predmetDruh === 'chata' || predmetDruh === 'stredisko') {
    const kolekce = predmetDruh === 'chata' ? ('chaty' as const) : ('strediska' as const)
    const res = await payload.find({
      collection: kolekce,
      where: { slug: { equals: vstup.chataSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    const doc = res.docs[0] as { id: number; slug?: string | null; nazev: string } | undefined
    if (!doc) {
      return odpoved(400, {
        ok: false,
        chyby: [
          predmetDruh === 'chata'
            ? 'Tuhle chatu v průvodci nevedeme — vyber ji ze seznamu.'
            : 'Tohle středisko v průvodci nevedeme — vyber ho ze seznamu.',
        ],
      })
    }
    if (predmetDruh === 'chata') chata = doc
    else stredisko = doc
  } else {
    // `oblast/slug` — formulář posílá obojí v jednom poli, ať API zůstane
    // s jedním předmětem místo dvou paralelních cest.
    const [oblast, slug] = (vstup.chataSlug ?? '').split('/')
    const draha = oblast && slug ? lanovkaPodleSlugu(oblast, slug) : null
    if (!draha) {
      return odpoved(400, { ok: false, chyby: ['Tuhle lanovku v přehledu nevedeme — vyber ji ze seznamu.'] })
    }
    lanovka = { oblast, slug, nazev: draha.nazev ?? slug }
  }

  const predmetNazev = chata?.nazev ?? stredisko?.nazev ?? lanovka?.nazev ?? ''
  const predmetSlug = chata?.slug ?? stredisko?.slug ?? lanovka?.slug ?? 'podani'
  const dnes = new Date().toISOString().slice(0, 10)
  const data = Buffer.from(await (soubor as File).arrayBuffer())
  const bezpecnaPripona = ((soubor as File).name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const nazevSouboru = `podani-${predmetSlug}-${Date.now()}.${bezpecnaPripona}`

  const fotka = await payload.create({
    collection: 'fotky',
    data: {
      alt:
        druh === 'razitko'
          ? `Komunitní podání — otisk razítka, ${predmetNazev} (čeká na posouzení)`
          : `Komunitní podání — fotka, ${predmetNazev} (čeká na posouzení)`,
      typ: 'komunitni-podani',
      ...(chata ? { chata: chata.id } : {}),
      ...(stredisko ? { stredisko: stredisko.id } : {}),
      ...(lanovka ? { lanovkaOblast: lanovka.oblast, lanovkaSlug: lanovka.slug } : {}),
      autor: vstup.jmeno!,
      licence: 'se-svolenim',
      licencePoznamka: 'komunitní podání — souhlas se zveřejněním s uvedením jména',
      ...(druh !== 'razitko' && vstup.poznamka ? { datovani: vstup.poznamka.slice(0, 120) } : {}),
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

  if (druh === 'razitko' && chata) {
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
  }

  return odpoved(200, { ok: true })
}
