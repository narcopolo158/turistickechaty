import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getPayload } from 'payload'

import config from '@/payload.config'
import { frontaFotek, mezeryProfilu, souhrnFronty, stavKandidatu } from '@/lib/redakce/fronta'
import {
  pridejOdlozeni,
  pridejRozhodnutiFotky,
  pridejVyrazeni,
  uzJeVProfilu,
  vlozFotkuDoProfilu,
  zaznamFotky,
} from '@/lib/redakce/zapis'

/**
 * REDAKČNÍ PROSTŘEDÍ — data a zápis rozhodnutí (GET fronta, POST rozhodnutí).
 *
 * PROČ TENHLE ENDPOINT VŮBEC JE: zdrojem pravdy je repozitář, ne databáze
 * (seed jede jedním směrem `data/**` → Payload). Kdyby výběr fotky ukládal
 * záznam jen do DB, přepsal by ho první deploy a nikdo by nepoznal proč.
 * Prostředí proto zapisuje do TÝCHŽ YAML souborů, které čte seed a hlídá
 * `npm run kontrola` — rozhodnutí pak projde běžnou cestou (commit → CI →
 * deploy) a je po něm stopa v historii.
 *
 * PROČ SE ZÁPIS DÁ VYPNOUT: soubory se dají měnit jen tam, kde je pracovní
 * kopie repa — tedy lokálně u Michala. Na nasazeném webu by zápis buď spadl,
 * nebo (hůř) uspěl do kontejneru, který příští deploy zahodí; tichá ztráta
 * rozhodnutí je to nejhorší, co může redakční nástroj udělat. Zápis je proto
 * povolený jen s `REDAKCE_ZAPIS=1` (výchozí ve vývoji) a prostředí to říká
 * nahlas: bez něj ukazuje frontu jen ke čtení.
 *
 * PŘÍSTUP: jen přihlášená redakce (týž účet jako do adminu).
 */

const zapisPovolen = (): boolean =>
  process.env.REDAKCE_ZAPIS === '1' ||
  (process.env.REDAKCE_ZAPIS !== '0' && process.env.NODE_ENV !== 'production')

const koren = () => process.cwd()

const odpoved = (status: number, telo: Record<string, unknown>) => Response.json(telo, { status })

/** Přihlášený uživatel Payloadu; jinak `null`. */
const redaktor = async (req: Request): Promise<{ email?: string } | null> => {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    return user ? { email: user.email } : null
  } catch {
    return null
  }
}

export async function GET(req: Request): Promise<Response> {
  if (!(await redaktor(req))) return odpoved(401, { chyba: 'Přihlas se do adminu.' })
  const url = new URL(req.url)
  const oblast = url.searchParams.get('oblast') ?? undefined
  const k = koren()
  const dnes = new Date().toISOString().slice(0, 10)
  return odpoved(200, {
    zapisPovolen: zapisPovolen(),
    souhrn: souhrnFronty(k, dnes),
    fotky: frontaFotek(k, oblast),
    kandidati: stavKandidatu(k).filter((kand) => !oblast || kand.oblast === oblast),
    mezery: mezeryProfilu(k, dnes).filter((m) => !oblast || m.oblast === oblast),
  })
}

/** Cesta k profilu chaty; kandidátní i profilové soubory leží po oblastech. */
const cestaProfilu = (oblast: string, slug: string) =>
  join(koren(), 'data', 'chaty', oblast, `${slug}.yaml`)

type Telo = {
  akce: 'vybrat-fotku' | 'odmitnout-fotku' | 'uzavrit-fotky' | 'odlozit-kandidata' | 'vyradit-kandidata'
  chata?: string
  oblast?: string
  duvod?: string
  alt?: string
  /** OSM URL kandidáta — identita, která přežije přejmenování. */
  osm?: string
  fotka?: {
    soubor: string
    original: string
    stranka: string
    autor?: string
    licence?: string
    datum?: string
    popis?: string
  }
}

export async function POST(req: Request): Promise<Response> {
  const uzivatel = await redaktor(req)
  if (!uzivatel) return odpoved(401, { chyba: 'Přihlas se do adminu.' })
  if (!zapisPovolen())
    return odpoved(423, {
      chyba:
        'Zápis je vypnutý (REDAKCE_ZAPIS). Prostředí běží jen ke čtení — rozhodnutí se zapisují tam, kde je pracovní kopie repa.',
    })

  let telo: Telo
  try {
    telo = (await req.json()) as Telo
  } catch {
    return odpoved(400, { chyba: 'Nečitelné tělo požadavku.' })
  }
  const dnes = new Date().toISOString().slice(0, 10)
  const rozhodl = uzivatel.email ?? 'redakce'
  const souborRozhodnuti = join(koren(), 'data', 'kandidati', 'fotky', '_rozhodnuti.yaml')
  const souborOdlozeni = join(koren(), 'data', 'kandidati', '_odlozeno.yaml')

  try {
    switch (telo.akce) {
      case 'vybrat-fotku': {
        if (!telo.chata || !telo.oblast || !telo.fotka?.original || !telo.fotka.stranka)
          return odpoved(400, { chyba: 'Chybí chata, oblast nebo fotka.' })
        // ALT PÍŠE ČLOVĚK: je to tvrzení o tom, co je na snímku, a z metadat
        // Commons se vyčíst nedá (konvence B). Bez něj se fotka nezapíše.
        const alt = (telo.alt ?? '').trim()
        if (alt.length < 3)
          return odpoved(400, { chyba: 'Doplň popis snímku (alt) — co je na fotce vidět. Tvrzení patří člověku.' })
        const cesta = cestaProfilu(telo.oblast, telo.chata)
        if (!existsSync(cesta))
          return odpoved(404, { chyba: `Profil ${telo.oblast}/${telo.chata} neexistuje — nejdřív povýšit kandidáta.` })
        const puvodni = readFileSync(cesta, 'utf8')
        if (uzJeVProfilu(puvodni, telo.fotka.original))
          return odpoved(409, { chyba: 'Tuhle fotku už profil má.' })
        const zaznam = zaznamFotky({ ...telo.fotka, alt, dnes })
        writeFileSync(cesta, vlozFotkuDoProfilu(puvodni, zaznam), 'utf8')
        return odpoved(200, { hotovo: true, soubor: `data/chaty/${telo.oblast}/${telo.chata}.yaml` })
      }
      case 'odmitnout-fotku':
      case 'uzavrit-fotky': {
        if (!telo.chata || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí chata nebo důvod — bez důvodu se rozhodnutí nezapisuje.' })
        if (telo.akce === 'odmitnout-fotku' && !telo.fotka?.soubor)
          return odpoved(400, { chyba: 'Chybí soubor odmítané fotky.' })
        const puvodni = existsSync(souborRozhodnuti) ? readFileSync(souborRozhodnuti, 'utf8') : null
        const novy = pridejRozhodnutiFotky(puvodni, {
          chata: telo.chata,
          soubor: telo.fotka?.soubor,
          stav: telo.akce === 'odmitnout-fotku' ? 'odmitnuta' : 'uzavrena',
          duvod: telo.duvod.trim(),
          rozhodl,
          checked: dnes,
        })
        writeFileSync(souborRozhodnuti, novy, 'utf8')
        return odpoved(200, { hotovo: true, soubor: 'data/kandidati/fotky/_rozhodnuti.yaml' })
      }
      case 'odlozit-kandidata': {
        if (!telo.chata || !telo.oblast || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí kandidát, oblast nebo důvod.' })
        const puvodni = existsSync(souborOdlozeni) ? readFileSync(souborOdlozeni, 'utf8') : null
        const novy = pridejOdlozeni(puvodni, {
          slug: telo.chata,
          oblast: telo.oblast,
          duvod: telo.duvod.trim(),
          rozhodl,
          checked: dnes,
        })
        writeFileSync(souborOdlozeni, novy, 'utf8')
        return odpoved(200, { hotovo: true, soubor: 'data/kandidati/_odlozeno.yaml' })
      }
      case 'vyradit-kandidata': {
        if (!telo.chata || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí kandidát nebo důvod — vyřazení bez důvodu se nezapisuje.' })
        // Identitou vyřazeného je OSM URL: přežije přejmenování i přesun mezi
        // oblastmi, takže se objekt nevrátí dalším během DATA-01 pod jiným
        // slugem. Když ji neznáme, zapíše se aspoň slug.
        const souborVyrazeni = join(koren(), 'data', 'kandidati', '_vyrazeno.yaml')
        if (!existsSync(souborVyrazeni)) return odpoved(500, { chyba: 'Chybí data/kandidati/_vyrazeno.yaml.' })
        const novy = pridejVyrazeni(readFileSync(souborVyrazeni, 'utf8'), {
          slug: telo.chata,
          osm: telo.osm,
          duvod: telo.duvod.trim(),
          rozhodl,
          checked: dnes,
        })
        writeFileSync(souborVyrazeni, novy, 'utf8')
        return odpoved(200, { hotovo: true, soubor: 'data/kandidati/_vyrazeno.yaml' })
      }
      default:
        return odpoved(400, { chyba: 'Neznámá akce.' })
    }
  } catch (chyba) {
    return odpoved(500, { chyba: chyba instanceof Error ? chyba.message : 'Zápis se nepovedl.' })
  }
}
