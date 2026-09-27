/**
 * ZBYTEK KOŠE C3 — JE U KOHO VŮBEC ZAČÍT ČTENÍ? Měření, ne odhad.
 *
 * Michalovi leží od 22. 9. 2026 otázka, co s nepřečtenými kandidáty koše C3
 * (dnes jich je 83, fronta signálů je vyčerpaná). Varianty jsou tři:
 * (a) číst dál po jednom, (b) koš uzavřít jako celek, (c) přečíst jen ty,
 * u kterých v OSM existuje identifikátor k hledání, a zbytek odložit.
 * Deník 26. 9. doporučil (c), ale rozsah té varianty byl **odhad** —
 * „oba přečtení schroniska odemkl sdílený kontakt z OSM".
 *
 * Tenhle skript ten odhad nahrazuje číslem. NEROZHODUJE nic: neříká, který
 * kandidát do průvodce patří, ani který ne. Měří jedinou věc — **má čtení
 * u kandidáta kde začít?** Celé nad exporty v repu, bez jediného dotazu
 * do sítě.
 *
 * PROČ TO NENÍ TOTÉŽ CO SIGNÁL „ČITELNOST" Z 22. 9.: ten měřil jen
 * `website`/`phone` a byl vedlejším řádkem kalibrace. Čtení od té doby
 * ukázalo dvě věci, které tenhle skript bere v potaz:
 *
 *   1. **E-mail je identifikátor, a někdy silnější než jméno** (24. 9.,
 *      `domek-w-karkonoszach`): lokální část `zaciszegajowe@` byla přesmyčka
 *      obchodní značky Gajowe Zacisze, pod kterou objekt inzeruje. Hledání
 *      podle OSM jména („Domek w Karkonoszach" = „domek v Krkonoších")
 *      uspět nemohlo. Týž vzorec podruhé 26. 9. u tří schronisek jednoho
 *      správce, která odemkl společný e-mail.
 *
 *   2. **Adresa unese identitu tam, kde jméno ani měření ne** (26. 9.):
 *      u rezervačních portálů padne GPS pramene i 190 m od OSM uzlu
 *      (`apartamenty-every-sky`), takže práh 30 m nepomůže — a obecné jméno
 *      („Chalupa Sport") nepomůže taky, což je přesně důvod, proč zůstal
 *      `chalupa-sport` bez verdiktu. Ulice s číslem popisným je proti tomu
 *      dotaz, který vrátí konkrétní dům.
 *
 * ČTYŘI ÚROVNĚ, každá říká, čím by čtení začalo:
 *
 *   VLASTNÍ PRAMEN  `website` / `contact:website` / `url` — je kam jít
 *                   přímo. (Pozor: doména v OSM může ukazovat na sesterský
 *                   objekt — 26. 9., `…-zloty-widok`. A doména není záruka,
 *                   že se načte — `chalupa-u-rihu` web v OSM MÁ a přečíst
 *                   se ho nepodařilo, DNS se nepřeložilo.)
 *   KONTAKT         telefon, e-mail nebo sociální síť bez webu — dotaz,
 *                   který podle čtení 24. a 26. 9. prameny otevírá.
 *   ADRESA          ulice/místo s číslem, nebo RÚIAN identifikátor adresy —
 *                   dotaz na konkrétní dům.
 *   NIC             jen jméno a `tourism`. Tady čtení nemá kde začít; je to
 *                   případ `chalupa-sport` a `chata-u-kohouta`.
 *
 * CO SKRIPT NEDOKLÁDÁ: přítomnost identifikátoru NENÍ doklad, že objekt
 * klíč zařazení splňuje, a jeho nepřítomnost NENÍ doklad, že nesplňuje —
 * mlčení OSM není doklad absence (poučka z koše E, 31. 8. 2026). Měří se
 * cena čtení, ne obsah objektu. Nic se nezapisuje do `data/`, nic se
 * nevyřazuje, nic nepovyšuje.
 *
 *   npx tsx scripts/triaz-kos-c3-identifikatory.ts        # kalibrace + zbytek
 *   npx tsx scripts/triaz-kos-c3-identifikatory.ts --md   # tabulky do dokumentace
 */
import { join } from 'node:path'

import { kose, nactiExporty } from './triaz-kos-c'
import { LEXIKON_BOUDA, prectene, type Verdikt } from './triaz-kos-c3-tagy'

/** OSM klíče, pod kterými leží vlastní stránka objektu. */
const WEB = ['website', 'contact:website', 'url']

/** OSM klíče telefonu — včetně mobilních variant, které se v datech střídají. */
const TELEFON = ['phone', 'contact:phone', 'contact:mobile', 'phone:mobile', 'mobile']

/** OSM klíče e-mailu. */
const EMAIL = ['email', 'contact:email']

/** Sociální sítě — slabší než web, ale jsou to stránky, které se dají otevřít. */
const SOCIALNI = [
  'contact:facebook',
  'facebook',
  'contact:instagram',
  'instagram',
  'contact:youtube',
]

/**
 * Identifikátory adresy. Číslo samo bez ulice/místa dotaz neunese (v obci je
 * čísel mnoho), proto se páruje; RÚIAN identifikátory a `ref:vatin` unesou
 * dotaz samy, protože míří do registru.
 */
const ULICE = ['addr:street', 'addr:place', 'addr:housename']
const CISLO = ['addr:housenumber', 'addr:conscriptionnumber']
const REGISTR = ['ref:ruian:addr', 'ref:vatin']

export type Uroven = 'vlastni-pramen' | 'kontakt' | 'adresa' | 'nic'

export type Identifikatory = {
  slug: string
  nazev: string
  tourism: string | null
  web: string[]
  telefon: boolean
  email: boolean
  socialni: boolean
  /** Adresa, která unese dotaz na konkrétní dům (ulice/místo + číslo, nebo registr). */
  adresa: string | null
  /** Jméno provozovatele — do registru firem se s ním jde, ale dům neurčí. */
  operator: string | null
  uroven: Uroven
  verdikt: Verdikt | null
}

const ma = (tags: Record<string, string>, klice: string[]): boolean =>
  klice.some((k) => typeof tags[k] === 'string' && tags[k].trim() !== '')

const hodnoty = (tags: Record<string, string>, klice: string[]): string[] =>
  klice.flatMap((k) => (typeof tags[k] === 'string' && tags[k].trim() !== '' ? [tags[k]] : []))

/** Adresní dotaz, který určí dům — nebo null, když ho tagy neunesou. */
const adresniDotaz = (tags: Record<string, string>): string | null => {
  const registr = REGISTR.find((k) => typeof tags[k] === 'string' && tags[k].trim() !== '')
  if (ma(tags, ULICE) && ma(tags, CISLO)) {
    const ulice = hodnoty(tags, ULICE)[0]
    const cislo = hodnoty(tags, CISLO)[0]
    const obec = tags['addr:city'] ?? tags['addr:place'] ?? ''
    return `${ulice} ${cislo}${obec && obec !== ulice ? `, ${obec}` : ''}`
  }
  if (registr) return `${registr}=${tags[registr]}`
  return null
}

export const identifikatoryC3 = (oblast = 'krkonose', koren = 'data'): Identifikatory[] => {
  const { c3 } = kose(oblast, koren)
  const exporty = nactiExporty(join(koren, 'kandidati', oblast))
  const verdikty = prectene()
  return c3.map((k) => {
    const tags = ((k.osm ? exporty.get(k.osm)?.tags : undefined) ?? {}) as Record<string, string>
    const web = hodnoty(tags, WEB)
    const telefon = ma(tags, TELEFON)
    const email = ma(tags, EMAIL)
    const socialni = ma(tags, SOCIALNI)
    const adresa = adresniDotaz(tags)
    let uroven: Uroven = 'nic'
    if (web.length > 0) uroven = 'vlastni-pramen'
    else if (telefon || email || socialni) uroven = 'kontakt'
    else if (adresa !== null) uroven = 'adresa'
    return {
      slug: k.slug,
      nazev: k.nazev,
      tourism: k.tourism,
      web,
      telefon,
      email,
      socialni,
      adresa,
      operator: tags.operator ?? null,
      uroven,
      verdikt: verdikty.get(k.slug) ?? null,
    }
  })
}

// ── Výpis ───────────────────────────────────────────────────────────────────

const POPIS: Record<Uroven, string> = {
  'vlastni-pramen': 'VLASTNÍ PRAMEN (web v OSM)',
  kontakt: 'KONTAKT (telefon / e-mail / síť, bez webu)',
  adresa: 'ADRESA (ulice s číslem nebo registr, bez kontaktu)',
  nic: 'NIC (jen jméno a tourism)',
}

const UROVNE: Uroven[] = ['vlastni-pramen', 'kontakt', 'adresa', 'nic']

const main = (): void => {
  const md = process.argv.includes('--md')
  const vse = identifikatoryC3()
  const prectenych = vse.filter((s) => s.verdikt !== null)
  const zbytek = vse.filter((s) => s.verdikt === null)

  console.log(`KOŠ C3 — identifikátor k hledání nad ${vse.length} kandidáty`)
  console.log(`přečteno a rozhodnuto: ${prectenych.length} · zbývá: ${zbytek.length}\n`)

  // ── Kalibrace: dělí úroveň to, co ze čtení vyšlo jako „nebylo co číst"? ──
  console.log('KALIBRACE NA PŘEČTENÝCH — čtyři kandidáti skončili „nebylo co číst":\n')
  if (md)
    console.log(
      '| úroveň | přečtených | z toho „nebylo co číst" | kdo z nich |\n| --- | --- | --- | --- |',
    )
  for (const u of UROVNE) {
    const v = prectenych.filter((s) => s.uroven === u)
    const bez = v.filter((s) => s.verdikt === 'necteno')
    if (md)
      console.log(
        `| ${POPIS[u]} | ${v.length} | ${bez.length} | ${bez.map((s) => `\`${s.slug}\``).join(', ') || '—'} |`,
      )
    else {
      console.log(`  ${POPIS[u]}`)
      console.log(
        `    přečtených ${v.length}, z toho „nebylo co číst" ${bez.length}${
          bez.length ? `: ${bez.map((s) => s.slug).join(', ')}` : ''
        }`,
      )
    }
  }

  // ── Rozložení nepřečtených ────────────────────────────────────────────────
  console.log(`\nZBYTEK KOŠE (${zbytek.length}) PODLE ÚROVNĚ:\n`)
  if (md) console.log('| úroveň | kolik | podíl |\n| --- | --- | --- |')
  for (const u of UROVNE) {
    const kolik = zbytek.filter((s) => s.uroven === u).length
    const podil = `${Math.round((kolik / zbytek.length) * 1000) / 10} %`
    if (md) console.log(`| ${POPIS[u]} | ${kolik} | ${podil} |`)
    else console.log(`  ${POPIS[u].padEnd(46)} ${String(kolik).padStart(3)} · ${podil}`)
  }
  const kCteni = zbytek.filter((s) => s.uroven !== 'nic')
  console.log(
    `\n  Varianta (c) — „číst jen to, k čemu existuje identifikátor" — má tedy rozsah ${kCteni.length} z ${zbytek.length}.`,
  )
  console.log(`  Kandidátů, u kterých čtení nemá kde začít: ${zbytek.length - kCteni.length}.`)

  // ── Fronta ke čtení, od nejsilnějšího identifikátoru ─────────────────────
  console.log(`\nFRONTA KE ČTENÍ (${kCteni.length}) — pořadí čtení, ne pořadí zamítání:\n`)
  if (md)
    console.log(
      '| kandidát | tourism | web | telefon | e-mail | síť | adresa |\n| --- | --- | --- | --- | --- | --- | --- |',
    )
  const poradi = (s: Identifikatory): number => UROVNE.indexOf(s.uroven)
  for (const s of kCteni.sort(
    (a, b) => poradi(a) - poradi(b) || a.slug.localeCompare(b.slug, 'cs'),
  )) {
    if (md)
      console.log(
        `| \`${s.slug}\` — ${s.nazev} | \`${s.tourism}\` | ${s.web[0] ?? '—'} | ${
          s.telefon ? 'ano' : '—'
        } | ${s.email ? 'ano' : '—'} | ${s.socialni ? 'ano' : '—'} | ${s.adresa ?? '—'} |`,
      )
    else
      console.log(
        `  [${s.uroven}] ${s.slug} — ${s.nazev} (${s.tourism})${s.web[0] ? ` · ${s.web[0]}` : ''}${
          s.telefon ? ' · tel' : ''
        }${s.email ? ' · e-mail' : ''}${s.socialni ? ' · síť' : ''}${s.adresa ? ` · ${s.adresa}` : ''}`,
      )
  }

  // ── A kdo zůstane odložený ───────────────────────────────────────────────
  const bezNiceho = zbytek.filter((s) => s.uroven === 'nic')
  console.log(
    `\nBEZ IDENTIFIKÁTORU (${bezNiceho.length}) — u nich by varianta (c) čtení odložila:\n`,
  )
  if (md) console.log('| kandidát | tourism | provozovatel v OSM |\n| --- | --- | --- |')
  for (const s of bezNiceho.sort((a, b) => a.slug.localeCompare(b.slug, 'cs'))) {
    if (md) console.log(`| \`${s.slug}\` — ${s.nazev} | \`${s.tourism}\` | ${s.operator ?? '—'} |`)
    else
      console.log(
        `  ${s.slug} — ${s.nazev} (${s.tourism})${s.operator ? ` · provozovatel ${s.operator}` : ''}`,
      )
  }
  const sOperatorem = bezNiceho.filter((s) => s.operator !== null)
  if (sOperatorem.length > 0)
    console.log(
      `\n  Z toho ${sOperatorem.length} nese aspoň jméno provozovatele — dotaz do registru firem, ne na dům.`,
    )

  // ── Křížové měření: koho by varianta (c) odložila podle JMÉNA? ───────────
  // Jméno „bouda"/„schronisko" je nejsilnější pozitivní signál, jaký koš má
  // (lexikon z 22. 9.). Kdyby ležel právě v odložené skupině, platila by
  // varianta (c) proti vlastnímu účelu — odkládala by to nejnadějnější.
  const nesebouduJmeno = (s: Identifikatory): boolean => {
    const n = (s.nazev ?? '').toLowerCase()
    return LEXIKON_BOUDA.some((w) => n.includes(w))
  }
  const boudaOdlozena = bezNiceho.filter(nesebouduJmeno)
  const boudaKeCteni = kCteni.filter(nesebouduJmeno)
  console.log('\nKŘÍŽOVÉ MĚŘENÍ — kde leží jména „bouda / schronisko / útulna":\n')
  if (md)
    console.log('| skupina | kandidátů | z toho jméno boudy | podíl |\n| --- | --- | --- | --- |')
  for (const [nazev, skupina, s] of [
    ['fronta ke čtení', kCteni.length, boudaKeCteni],
    ['bez identifikátoru (odložení)', bezNiceho.length, boudaOdlozena],
  ] as Array<[string, number, Identifikatory[]]>) {
    const podil = `${Math.round((s.length / skupina) * 1000) / 10} %`
    if (md) console.log(`| ${nazev} | ${skupina} | ${s.length} | ${podil} |`)
    else
      console.log(`  ${nazev.padEnd(32)} ${skupina} kandidátů · jméno boudy ${s.length} · ${podil}`)
  }
  if (boudaOdlozena.length > 0)
    console.log(`\n  Odložená jména boudy: ${boudaOdlozena.map((s) => s.slug).join(', ')}`)
  console.log('\n  POZOR: „bez identifikátoru" NENÍ návrh na vyřazení. Je to cena čtení,')
  console.log('  ne obsah objektu — mlčení OSM není doklad absence (koš E, 31. 8. 2026).')
}

if (process.argv[1]?.endsWith('triaz-kos-c3-identifikatory.ts')) main()
