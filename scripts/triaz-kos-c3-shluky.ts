/**
 * ZBYTEK KOŠE C3 PO SHLUCÍCH — kolik z 21 nepřečtených se dá rozhodnout
 * jedním čtením za shluk? Měření, ne odhad.
 *
 * KONTEXT. Fronta čtení stavěná podle identifikátoru (`triaz-kos-c3-
 * identifikatory.ts`) je od 13. 10. 2026 prázdná: všech 21 zbývajících
 * kandidátů je v úrovni NIC — jen jméno a `tourism`, čtení nemá kde začít.
 * Varianta (d) z deníku 13. 10. říká: nečíst podle identifikátoru kandidáta,
 * ale podle **místa**. Měření ze 6. 9. 2026 ukázalo, že kandidáti C3 tvoří
 * prahem 300 m čtrnáct shluků o 36 položkách — a 13. 10. se poprvé doložilo,
 * že to funguje: jeden pramen (`pl.domandi-living.com`) rozhodl čtyři
 * kandidáty shluku Domandi naráz, protože web mluví o **každém** domku.
 *
 * CO SKRIPT MĚŘÍ: shluky nad celým košem C3 (práh 300 m, tranzitivní
 * uzávěr — soused souseda je týž shluk) a u každého shluku říká, kolik má
 * členů přečtených a kolik ne. Z toho plyne jediná věc, kvůli které skript
 * vznikl: **u nepřečteného kandidáta, který leží ve shluku s přečteným,
 * čtení kde začít MÁ** — identifikátor souseda (jeho web, kontakt, adresa)
 * je dotaz na totéž místo. Úroveň NIC tedy není totéž co „není kde začít",
 * jakmile se měří místo, a ne kandidát.
 *
 * CO SKRIPT NEDOKLÁDÁ — a je to totéž varování jako u měření ze 6. 9.:
 * shluk **NENÍ doklad duplicity** (jiná jména, jiné OSM uzly) a NENÍ sám
 * o sobě doklad, že verdikt jednoho člena platí pro ostatní. Přenos
 * verdiktu je věc PRAMENE, ne geometrie: u Domandi rozhodl větu „Każdy
 * domek…", ne vzdálenost 17 m. Jestli směl, leží jako otázka na Michalovi
 * od 13. 10. 2026. Skript proto nic nezapisuje do `data/`, nic nevyřazuje
 * a nic nepovyšuje — staví jen pořadí čtení.
 *
 * PRÁH 300 M je převzatý z měření 6. 9. 2026, aby shluky zůstaly tytéž
 * a čísla se dala porovnat; `--prah <m>` ho umí změnit pro citlivostní
 * zkoušku.
 *
 *   npx tsx scripts/triaz-kos-c3-shluky.ts              # shluky + fronta čtení
 *   npx tsx scripts/triaz-kos-c3-shluky.ts --md         # tabulky do dokumentace
 *   npx tsx scripts/triaz-kos-c3-shluky.ts --prah 150   # citlivost na práh
 */
import { kose } from './triaz-kos-c'
import { identifikatoryC3, type Uroven } from './triaz-kos-c3-identifikatory'
import { prectene, type Verdikt } from './triaz-kos-c3-tagy'
import { vzdalenostM } from './kontrola/blizke-body'

/** Práh shluku v metrech — převzatý z měření 6. 9. 2026. */
export const PRAH_SHLUKU_M = 300

export type ClenShluku = {
  slug: string
  nazev: string
  uroven: Uroven
  /** Identifikátor, kterým by u tohoto člena šlo začít (web / adresa / —). */
  zacatek: string | null
  verdikt: Verdikt | null
}

export type Shluk = {
  /** Slug prvního člena v abecedě — stabilní jméno shluku napříč běhy. */
  klic: string
  clenove: ClenShluku[]
  prectenych: number
  neprectenych: number
  /** Největší vzdálenost mezi dvěma členy shluku (metry, zaokrouhleno). */
  rozpetiM: number
}

const zacatekCteni = (i: {
  web: string[]
  telefon: boolean
  email: boolean
  socialni: boolean
  adresa: string | null
}): string | null => {
  if (i.web.length > 0) return i.web[0]
  if (i.telefon) return 'telefon v OSM'
  if (i.email) return 'e-mail v OSM'
  if (i.socialni) return 'sociální síť v OSM'
  if (i.adresa !== null) return i.adresa
  return null
}

/**
 * Shluky koše C3 tranzitivním uzávěrem nad prahem.
 *
 * Tranzitivní uzávěr (ne „každý s každým do prahu") je záměr: tři domky
 * v řadě po 200 m jsou jedno místo, i když krajní dva dělí 400 m. Týž
 * postup použilo měření 6. 9. 2026, proto souhlasí počet shluků.
 */
export const shlukyC3 = (oblast = 'krkonose', koren = 'data', prahM = PRAH_SHLUKU_M): Shluk[] => {
  const { c3 } = kose(oblast, koren)
  const identifikatory = new Map(identifikatoryC3(oblast, koren).map((i) => [i.slug, i]))
  const verdikty = prectene()

  // Union-find nad indexy kandidátů.
  const rodic = c3.map((_, i) => i)
  const najdi = (i: number): number => {
    let k = i
    while (rodic[k] !== k) k = rodic[k]
    while (rodic[i] !== k) {
      const dalsi = rodic[i]
      rodic[i] = k
      i = dalsi
    }
    return k
  }
  for (let a = 0; a < c3.length; a += 1) {
    for (let b = a + 1; b < c3.length; b += 1) {
      const d = vzdalenostM({ lat: c3[a].lat, lng: c3[a].lng }, { lat: c3[b].lat, lng: c3[b].lng })
      if (d <= prahM) {
        const ka = najdi(a)
        const kb = najdi(b)
        if (ka !== kb) rodic[kb] = ka
      }
    }
  }

  const skupiny = new Map<number, number[]>()
  for (let i = 0; i < c3.length; i += 1) {
    const k = najdi(i)
    const s = skupiny.get(k)
    if (s) s.push(i)
    else skupiny.set(k, [i])
  }

  const out: Shluk[] = []
  for (const indexy of skupiny.values()) {
    if (indexy.length < 2) continue
    const clenove = indexy
      .map((i) => {
        const k = c3[i]
        const ident = identifikatory.get(k.slug)
        return {
          slug: k.slug,
          nazev: k.nazev,
          uroven: ident?.uroven ?? ('nic' as Uroven),
          zacatek: ident ? zacatekCteni(ident) : null,
          verdikt: verdikty.get(k.slug) ?? null,
        }
      })
      .sort((a, b) => a.slug.localeCompare(b.slug, 'cs'))
    let rozpeti = 0
    for (const a of indexy)
      for (const b of indexy)
        if (a < b)
          rozpeti = Math.max(
            rozpeti,
            vzdalenostM({ lat: c3[a].lat, lng: c3[a].lng }, { lat: c3[b].lat, lng: c3[b].lng }),
          )
    out.push({
      klic: clenove[0].slug,
      clenove,
      prectenych: clenove.filter((c) => c.verdikt !== null).length,
      neprectenych: clenove.filter((c) => c.verdikt === null).length,
      rozpetiM: Math.round(rozpeti),
    })
  }
  // Pořadí výpisu = pořadí čtení: nejdřív shluky, kde je nepřečtených nejvíc.
  return out.sort((a, b) => b.neprectenych - a.neprectenych || a.klic.localeCompare(b.klic, 'cs'))
}

// ── Výpis ───────────────────────────────────────────────────────────────────

const main = (): void => {
  const md = process.argv.includes('--md')
  const iPrah = process.argv.indexOf('--prah')
  const prah = iPrah >= 0 ? Number(process.argv[iPrah + 1]) : PRAH_SHLUKU_M

  const shluky = shlukyC3('krkonose', 'data', prah)
  const vse = identifikatoryC3()
  const neprectene = vse.filter((s) => s.verdikt === null)
  const vShluku = new Set(
    shluky.flatMap((s) => s.clenove.filter((c) => c.verdikt === null).map((c) => c.slug)),
  )
  const samotari = neprectene.filter((s) => !vShluku.has(s.slug))

  console.log(`KOŠ C3 — shluky prahem ${prah} m nad ${vse.length} kandidáty`)
  console.log(
    `shluků: ${shluky.length} · v nich položek: ${shluky.reduce((a, s) => a + s.clenove.length, 0)}`,
  )
  console.log(
    `nepřečtených celkem: ${neprectene.length} · z toho ve shluku: ${vShluku.size} · samotářů: ${samotari.length}\n`,
  )

  const sNeprectenymi = shluky.filter((s) => s.neprectenych > 0)
  console.log(
    `SHLUKY S NEPŘEČTENÝM ČLENEM (${sNeprectenymi.length}) — pořadí čtení, ne pořadí zamítání:\n`,
  )
  if (md)
    console.log(
      '| shluk | nepřečtených | přečtených | rozpětí | kde začít čtení |\n| --- | --- | --- | --- | --- |',
    )
  for (const s of sNeprectenymi) {
    const zacatky = s.clenove.flatMap((c) => (c.zacatek ? [`\`${c.slug}\` → ${c.zacatek}`] : []))
    if (md) {
      console.log(
        `| \`${s.klic}\` (${s.clenove.length}) | ${s.neprectenych} | ${s.prectenych} | ${s.rozpetiM} m | ${
          zacatky.join('; ') || '— (ani jeden člen nemá identifikátor)'
        } |`,
      )
    } else {
      console.log(
        `  ${s.klic} — ${s.clenove.length} členů, nepřečtených ${s.neprectenych}, rozpětí ${s.rozpetiM} m`,
      )
      for (const c of s.clenove)
        console.log(
          `    ${c.verdikt === null ? '·' : '✓'} ${c.slug} (${c.nazev})${
            c.zacatek ? ` — ${c.zacatek}` : ''
          }${c.verdikt ? ` [${c.verdikt}]` : ''}`,
        )
    }
  }

  console.log(`\nSAMOTÁŘI (${samotari.length}) — nepřečtení mimo jakýkoli shluk:\n`)
  for (const s of samotari) console.log(`  ${s.slug} — ${s.nazev} (${s.tourism ?? '—'})`)

  const odemceno = sNeprectenymi
    .filter((s) => s.clenove.some((c) => c.zacatek !== null))
    .reduce((a, s) => a + s.neprectenych, 0)
  console.log(
    `\nROZSAH VARIANTY (d): ${odemceno} z ${neprectene.length} nepřečtených leží ve shluku, kde aspoň jeden člen identifikátor MÁ.`,
  )
  console.log(
    '  POZOR: shluk není doklad duplicity ani doklad, že verdikt člena platí pro ostatní.',
  )
  console.log('  Přenos verdiktu je věc pramene, ne geometrie (Domandi, 13. 10. 2026).')
}

if (process.argv[1]?.endsWith('triaz-kos-c3-shluky.ts')) main()
