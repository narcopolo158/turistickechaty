import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { getPayload } from 'payload'

import config from '@/payload.config'
import {
  ciloveObjekty,
  frontaFotek,
  galerieChat,
  mezeryProfilu,
  souhrnFronty,
  stavKandidatu,
} from '@/lib/redakce/fronta'
import { chybejiciProstredi, konfiguraceZProstredi, overSpojeni, upravSoubor } from '@/lib/redakce/github'
import {
  nastavProfilovou,
  presunVGalerii,
  pridejCiziFotku,
  pridejOdlozeni,
  pridejRozhodnutiFotky,
  pridejVyrazeni,
  uzJeVProfilu,
  upravGalerii,
  vlozFotkuDoProfilu,
  zaznamFotky,
} from '@/lib/redakce/zapis'

/**
 * REDAKČNÍ PROSTŘEDÍ — data a zápis rozhodnutí (GET fronta, POST rozhodnutí).
 *
 * PROČ SE ZAPISUJE DO REPA, A NE DO DATABÁZE: zdrojem pravdy je repozitář
 * (seed jede jedním směrem `data/**` → Payload). Kdyby výběr fotky uložil
 * záznam jen do DB, přepsal by ho první deploy a nikdo by nepoznal proč.
 *
 * DVA REŽIMY ZÁPISU (rozhodnutí Michala 31. 7. 2026: „prostředí bych chtěl
 * používat z adminu"):
 *  - **github** — commit přes API, když je nastavený `REDAKCE_GITHUB_TOKEN`
 *    a `REDAKCE_GITHUB_REPO`. Tohle je režim nasazeného webu: kontejner nemá
 *    pracovní kopii, takže rozhodnutí jde rovnou do repa a projeví se po
 *    nejbližším deployi.
 *  - **disk** — zápis do pracovní kopie, když prostředí běží lokálně
 *    (`npm run dev`). Rychlejší smyčka: rozhodnutí je vidět hned a commitne
 *    se ručně.
 * Když není ani jedno, prostředí je JEN KE ČTENÍ a řekne to nahlas. Tichá
 * ztráta rozhodnutí je to nejhorší, co může redakční nástroj udělat.
 *
 * PŘÍSTUP: jen přihlášená redakce (týž účet jako do adminu).
 */

const koren = () => process.cwd()
const odpoved = (status: number, telo: Record<string, unknown>) => Response.json(telo, { status })

/** Zápis na disk se hodí jen tam, kde je pracovní kopie repa (vývoj). */
const zapisNaDiskPovolen = (): boolean =>
  process.env.REDAKCE_ZAPIS === '1' ||
  (process.env.REDAKCE_ZAPIS !== '0' && process.env.NODE_ENV !== 'production')

export type Rezim = 'github' | 'disk' | 'jen-cteni'

/**
 * Úložiště rozhodnutí. Obě implementace mají týž tvar „načti → uprav → zapiš",
 * aby akce nemusely vědět, kam se vlastně píše.
 */
type Uloziste = {
  rezim: Rezim
  uprav: (
    cesta: string,
    uprav: (obsah: string | null) => string,
    zprava: string,
  ) => Promise<{ misto: string }>
}

const ulozisteProZapis = (): Uloziste | null => {
  const gh = konfiguraceZProstredi()
  if (gh) {
    return {
      rezim: 'github',
      uprav: async (cesta, uprav, zprava) => {
        const { commit } = await upravSoubor(gh, cesta, uprav, zprava)
        return { misto: `${cesta} (commit ${commit.slice(0, 7)} ve větvi ${gh.vetev})` }
      },
    }
  }
  if (zapisNaDiskPovolen()) {
    return {
      rezim: 'disk',
      uprav: async (cesta, uprav) => {
        const plna = join(koren(), cesta)
        const puvodni = existsSync(plna) ? readFileSync(plna, 'utf8') : null
        // Nový soubor může mířit do složky, která ještě není (data/fotky/
        // vzniká až první fotkou objektu bez profilu). GitHub API si cestu
        // vyrobí samo, souborový systém ne — nález z ostrého testu 31. 7. 2026.
        mkdirSync(dirname(plna), { recursive: true })
        writeFileSync(plna, uprav(puvodni), 'utf8')
        return { misto: cesta }
      },
    }
  }
  return null
}

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
  const uloziste = ulozisteProZapis()
  const gh = konfiguraceZProstredi()
  // Spojení se ověřuje HNED při otevření prostředí, ne až při zápisu: chybu
  // oprávnění je lepší vidět dřív, než člověk vyplní popis snímku.
  const spojeni = gh ? await overSpojeni(gh) : null

  return odpoved(200, {
    rezim: uloziste?.rezim ?? 'jen-cteni',
    zapisPovolen: !!uloziste && (spojeni?.ok ?? true),
    stavZapisu:
      spojeni?.zprava ??
      (uloziste?.rezim === 'disk'
        ? 'Zapisuje se do pracovní kopie repa — změny commitni ručně.'
        : `Zápis není nastavený — v prostředí chybí ${chybejiciProstredi().join(' a ')}.`),
    souhrn: souhrnFronty(k, dnes),
    fotky: frontaFotek(k, oblast),
    kandidati: stavKandidatu(k).filter((kand) => !oblast || kand.oblast === oblast),
    mezery: mezeryProfilu(k, dnes).filter((m) => !oblast || m.oblast === oblast),
    // Kam všude jde fotku poslat, a co už v galeriích je.
    cile: ciloveObjekty(k),
    galerie: galerieChat(k).filter((g) => !oblast || g.oblast === oblast),
  })
}

type Telo = {
  akce:
    | 'vybrat-fotku'
    | 'odmitnout-fotku'
    | 'uzavrit-fotky'
    | 'odlozit-kandidata'
    | 'vyradit-kandidata'
    | 'galerie-profilova'
    | 'galerie-poradi'
    | 'galerie-odebrat'
  chata?: string
  oblast?: string
  duvod?: string
  alt?: string
  /** OSM URL kandidáta — identita, která přežije přejmenování. */
  osm?: string
  /** Kam snímek patří; bez něj se bere chata, u které byl nalezen. */
  cil?: { druh: 'chata' | 'stredisko' | 'lanovka'; slug: string; oblast?: string }
  /** `hero` = profilová fotka objektu, `galerie` = další snímek. */
  role?: 'hero' | 'galerie'
  /** Index fotky v galerii (u akcí galerie-*). */
  index?: number
  smer?: -1 | 1
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
  const uloziste = ulozisteProZapis()
  if (!uloziste)
    return odpoved(423, {
      chyba: `Zápis není nastavený — v prostředí chybí ${chybejiciProstredi().join(' a ')}. (Lokálně stačí REDAKCE_ZAPIS=1.)`,
    })

  let telo: Telo
  try {
    telo = (await req.json()) as Telo
  } catch {
    return odpoved(400, { chyba: 'Nečitelné tělo požadavku.' })
  }
  const dnes = new Date().toISOString().slice(0, 10)
  const rozhodl = uzivatel.email ?? 'redakce'
  const CESTA_ROZHODNUTI = 'data/kandidati/fotky/_rozhodnuti.yaml'
  const CESTA_ODLOZENI = 'data/kandidati/_odlozeno.yaml'
  const CESTA_VYRAZENI = 'data/kandidati/_vyrazeno.yaml'
  /** Podpis v commitu: kdo rozhodl, ať to jde dohledat i po měsících. */
  const podpis = (co: string) => `data: ${co} (redakční prostředí, ${rozhodl})`

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
        const zaznam = zaznamFotky({ ...telo.fotka, alt, dnes })
        // Cíl je ve výchozím stavu chata, u které se snímek našel — ale nemusí
        // jím být. Mezi kandidáty chaty se často najde dobrá fotka lanovky
        // nebo střediska; zahodit ji je škoda, patří jinam (Michal 31. 7. 2026).
        const cil = telo.cil ?? { druh: 'chata' as const, slug: telo.chata, oblast: telo.oblast }

        if (cil.druh === 'chata') {
          const jeHero = telo.role !== 'galerie'
          const { misto } = await uloziste.uprav(
            `data/chaty/${cil.oblast ?? telo.oblast}/${cil.slug}.yaml`,
            (puvodni) => {
              if (puvodni == null)
                throw new Error(`Profil ${cil.oblast ?? telo.oblast}/${cil.slug} neexistuje — nejdřív povýšit kandidáta.`)
              if (uzJeVProfilu(puvodni, telo.fotka!.original)) throw new Error('Tuhle fotku už profil má.')
              const sFotkou = vlozFotkuDoProfilu(puvodni, jeHero ? { ...zaznam, hero: true } : zaznam)
              // Profilová je právě jedna: nová `hero` ostatním příznak sebere.
              return jeHero ? upravGalerii(sFotkou, (fotky) => nastavProfilovou(fotky, fotky.length - 1)) : sFotkou
            },
            podpis(`${jeHero ? 'profilová fotka' : 'fotka do galerie'} — ${cil.slug} (Wikimedia Commons)`),
          )
          return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
        }

        // Středisko a lanovka profil v `data/chaty` nemají — jejich fotky vede
        // společný redakční seznam, ze kterého je seed stáhne a naváže.
        const { misto } = await uloziste.uprav(
          'data/fotky/_redakcni.yaml',
          (puvodni) =>
            pridejCiziFotku(puvodni, {
              predmet: cil.druh as 'stredisko' | 'lanovka',
              slug: cil.slug,
              ...(cil.druh === 'lanovka' ? { oblast: cil.oblast ?? telo.oblast! } : {}),
              stahnoutZ: zaznam.stahnoutZ,
              zdrojUrl: zaznam.zdrojUrl,
              alt: zaznam.alt,
              ...(zaznam.autor ? { autor: zaznam.autor } : {}),
              licence: zaznam.licence,
              ...(zaznam.licencePoznamka ? { licencePoznamka: zaznam.licencePoznamka } : {}),
              ...(zaznam.datovani ? { datovani: zaznam.datovani } : {}),
              prevzatoDne: zaznam.prevzatoDne,
              overeni: zaznam.overeni,
            }),
          podpis(`fotka pro ${cil.druh} ${cil.slug} (nalezena u chaty ${telo.chata})`),
        )
        return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
      }
      case 'odmitnout-fotku':
      case 'uzavrit-fotky': {
        if (!telo.chata || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí chata nebo důvod — bez důvodu se rozhodnutí nezapisuje.' })
        if (telo.akce === 'odmitnout-fotku' && !telo.fotka?.soubor)
          return odpoved(400, { chyba: 'Chybí soubor odmítané fotky.' })
        const { misto } = await uloziste.uprav(
          CESTA_ROZHODNUTI,
          (puvodni) =>
            pridejRozhodnutiFotky(puvodni, {
              chata: telo.chata!,
              soubor: telo.fotka?.soubor,
              stav: telo.akce === 'odmitnout-fotku' ? 'odmitnuta' : 'uzavrena',
              duvod: telo.duvod!.trim(),
              rozhodl,
              checked: dnes,
            }),
          podpis(
            telo.akce === 'odmitnout-fotku'
              ? `odmítnutá kandidátní fotka u ${telo.chata}`
              : `u ${telo.chata} nebereme fotku z Commons`,
          ),
        )
        return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
      }
      case 'odlozit-kandidata': {
        if (!telo.chata || !telo.oblast || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí kandidát, oblast nebo důvod.' })
        const { misto } = await uloziste.uprav(
          CESTA_ODLOZENI,
          (puvodni) =>
            pridejOdlozeni(puvodni, {
              slug: telo.chata!,
              oblast: telo.oblast!,
              duvod: telo.duvod!.trim(),
              rozhodl,
              checked: dnes,
            }),
          podpis(`odložený kandidát ${telo.chata}`),
        )
        return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
      }
      case 'vyradit-kandidata': {
        if (!telo.chata || !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Chybí kandidát nebo důvod — vyřazení bez důvodu se nezapisuje.' })
        const { misto } = await uloziste.uprav(
          CESTA_VYRAZENI,
          (puvodni) => {
            if (puvodni == null) throw new Error('Chybí data/kandidati/_vyrazeno.yaml.')
            // Identitou vyřazeného je OSM URL: přežije přejmenování i přesun
            // mezi oblastmi, takže se objekt nevrátí dalším během DATA-01.
            return pridejVyrazeni(puvodni, {
              slug: telo.chata!,
              osm: telo.osm,
              duvod: telo.duvod!.trim(),
              rozhodl,
              checked: dnes,
            })
          },
          podpis(`vyřazený kandidát ${telo.chata}`),
        )
        return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
      }
      case 'galerie-profilova':
      case 'galerie-poradi':
      case 'galerie-odebrat': {
        if (!telo.chata || !telo.oblast || typeof telo.index !== 'number')
          return odpoved(400, { chyba: 'Chybí chata, oblast nebo index fotky.' })
        if (telo.akce === 'galerie-odebrat' && !telo.duvod?.trim())
          return odpoved(400, { chyba: 'Odebrání z galerie potřebuje důvod — jinak nikdo nepozná proč.' })
        const index = telo.index
        const { misto } = await uloziste.uprav(
          `data/chaty/${telo.oblast}/${telo.chata}.yaml`,
          (puvodni) => {
            if (puvodni == null) throw new Error(`Profil ${telo.oblast}/${telo.chata} neexistuje.`)
            return upravGalerii(puvodni, (fotky) => {
              if (index < 0 || index >= fotky.length) throw new Error('Fotka na tomhle místě v galerii není.')
              if (telo.akce === 'galerie-profilova') return nastavProfilovou(fotky, index)
              if (telo.akce === 'galerie-poradi') return presunVGalerii(fotky, index, telo.smer === -1 ? -1 : 1)
              return fotky.filter((_, i) => i !== index)
            })
          },
          podpis(
            telo.akce === 'galerie-profilova'
              ? `profilová fotka ${telo.chata}`
              : telo.akce === 'galerie-poradi'
                ? `pořadí fotek v galerii ${telo.chata}`
                : `odebraná fotka z galerie ${telo.chata} — ${telo.duvod!.trim()}`,
          ),
        )
        return odpoved(200, { hotovo: true, soubor: misto, rezim: uloziste.rezim })
      }
      default:
        return odpoved(400, { chyba: 'Neznámá akce.' })
    }
  } catch (chyba) {
    return odpoved(500, { chyba: chyba instanceof Error ? chyba.message : 'Zápis se nepovedl.' })
  }
}
