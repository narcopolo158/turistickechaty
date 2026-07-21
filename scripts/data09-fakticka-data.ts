/**
 * DATA-09: doplnění věcných dat chatám z katalogu „doplňková faktická data"
 * (ChatGPT podklad, `data/externi/fakticka-data-krkonose-2026/fakticka-data.csv`).
 * Katalog má u KAŽDÉHO pole vlastní zdroj (primární — weby chat, kct.cz).
 *
 * Poctivost (CLAUDE.md, konvence B): doplňuje se JEN prázdné (nikdy nepřepisuje
 * ruční/ověřená data); vše `verified: false` se zdrojem; „neuvedeno" v katalogu
 * = nedoplní se (nedomýšlet). YAML se needituje round-tripem knihovny (ta
 * přeformátuje celý soubor), ale CHIRURGICKY textově — ruční formát i komentáře
 * s proveniencí zůstávají beze změny; přidají se jen nové řádky.
 *
 *   npx tsx scripts/data09-fakticka-data.ts [--dry]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

import { shodaNazvu } from './data05-razitkuj-parovani'
import { parseCSV } from './data06-katalog-vychozi'

const CSV = join(process.cwd(), 'data', 'externi', 'fakticka-data-krkonose-2026', 'fakticka-data.csv')
const CHATY = join(process.cwd(), 'data', 'chaty', 'krkonose')
const DATUM = '2026-07-21' // datum sběru katalogu (overeno_k) — deterministicky

/** Prázdná / „neuvedeno" hodnota z katalogu → nic nedoplňovat. */
const jePrazdne = (v: string | undefined): boolean => !v || !v.trim() || v.trim().toLowerCase() === 'neuvedeno'

/** Kategorie zajímavosti katalogu → interní slug (bez diakritiky, jako v YAML). */
const KATEGORIE: Record<string, string> = { stáří: 'stari', výška: 'vyska', jiné: 'jine', gastro: 'gastro' }

/** „1625 — text; 1914 — text" → [{rok, udalost}] (jen segmenty s letopočtem). */
export const parseMilniky = (text: string): { rok: number; udalost: string }[] =>
  text
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => seg.match(/^(\d{3,4})\s*[—–-]\s*(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ rok: Number(m[1]), udalost: m[2].trim() }))

type Radek = Record<string, string>

/** Načte CSV do map dle názvu chaty (klíč = původní název z katalogu). */
export const nactiFakta = (csvText: string): Map<string, Radek> => {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return new Map()
  const h = rows[0].map((x) => x.trim())
  const out = new Map<string, Radek>()
  for (const r of rows.slice(1)) {
    if (!r[h.indexOf('nazev')]) continue
    const rec: Radek = {}
    h.forEach((k, i) => (rec[k] = r[i] ?? ''))
    out.set(rec.nazev, rec)
  }
  return out
}

/** YAML double-quoted skalár (JSON string je validní YAML) — bezpečné uvození. */
const q = (s: string): string => JSON.stringify(s)

/** Zdrojová nota pole pro overeni blok / inline komentář. */
const zdrojNota = (popis: string, zdroj: string): string =>
  `${popis}: ${zdroj.trim()} (doplňková fakta ${DATUM}, katalog ChatGPT, verified:false)`

/**
 * Chirurgicky doplní do textu YAML chaty prázdná věcná pole z katalogu.
 * Nepřepisuje existující. Nové skalární klíče + bloky se vloží za řádek
 * `oblast:` (univerzální kotva); kontakty se vloží do existujícího bloku
 * `kontakty:` (nebo se založí). Provenience: pokud skupina nemá `overeni…`
 * blok, založí se (verified:false); pokud má, přidá se inline `# zdroj`.
 */
export const doplnText = (
  text: string,
  r: Radek,
): { text: string; doplneno: string[]; ponechano: string[] } => {
  const y = (parse(text) ?? {}) as Record<string, unknown>
  const doplneno: string[] = []
  const ponechano: string[] = []
  const jePraznyKlic = (k: string): boolean => y[k] == null || y[k] === ''
  const maPole = (k: string): boolean => Array.isArray(y[k]) && (y[k] as unknown[]).length > 0

  // Řádky vkládané za `oblast:` (nové top-level klíče a bloky).
  const blok: string[] = []

  const maOvereniHistorie = y.overeniHistorie != null
  const maOvereniNocleh = y.overeniNocleh != null
  const maOvereniProvoz = y.overeniProvoz != null

  // ── Historie: rok vzniku + milníky (jedna overeniHistorie pro obě) ──
  const zdrojeHistorie: string[] = []
  if (!jePrazdne(r.rok_vzniku) && /^\d{3,4}$/.test(r.rok_vzniku.trim()) && jePraznyKlic('rokVzniku')) {
    const inline = maOvereniHistorie ? `  # ${zdrojNota('rok vzniku', r.rok_vzniku_zdroj)}` : ''
    blok.push(`rokVzniku: ${r.rok_vzniku.trim()}${!jePrazdne(r.rok_vzniku_zdroj) ? inline : ''}`)
    if (!maOvereniHistorie && !jePrazdne(r.rok_vzniku_zdroj)) zdrojeHistorie.push(zdrojNota('rok vzniku', r.rok_vzniku_zdroj))
    doplneno.push(`rokVzniku=${r.rok_vzniku.trim()}`)
  } else if (!jePrazdne(r.rok_vzniku) && !jePraznyKlic('rokVzniku')) ponechano.push('rokVzniku')

  if (!jePrazdne(r.historicke_milniky) && !maPole('milniky')) {
    const m = parseMilniky(r.historicke_milniky)
    if (m.length) {
      blok.push('milniky:')
      for (const x of m) blok.push(`  - rok: ${x.rok}`, `    udalost: ${q(x.udalost)}`)
      if (maOvereniHistorie && !jePrazdne(r.historicke_milniky_zdroj)) blok.push(`  # ${zdrojNota('milníky', r.historicke_milniky_zdroj)}`)
      else if (!jePrazdne(r.historicke_milniky_zdroj)) zdrojeHistorie.push(zdrojNota('milníky', r.historicke_milniky_zdroj))
      doplneno.push(`milniky×${m.length}`)
    }
  } else if (!jePrazdne(r.historicke_milniky) && maPole('milniky')) ponechano.push('milniky')

  if (zdrojeHistorie.length) blok.push('overeniHistorie:', `  source: ${q(zdrojeHistorie.join(' · '))}`, '  verified: false', `  checked: ${q(DATUM)}`)

  // ── Nocleh: kapacita lůžek ──
  if (!jePrazdne(r.kapacita_luzek) && /^\d+$/.test(r.kapacita_luzek.trim()) && jePraznyKlic('kapacita')) {
    const inline = maOvereniNocleh && !jePrazdne(r.kapacita_luzek_zdroj) ? `  # ${zdrojNota('kapacita lůžek', r.kapacita_luzek_zdroj)}` : ''
    blok.push(`kapacita: ${r.kapacita_luzek.trim()}${inline}`)
    if (!maOvereniNocleh && !jePrazdne(r.kapacita_luzek_zdroj))
      blok.push('overeniNocleh:', `  source: ${q(zdrojNota('kapacita lůžek', r.kapacita_luzek_zdroj))}`, '  verified: false', `  checked: ${q(DATUM)}`)
    doplneno.push(`kapacita=${r.kapacita_luzek.trim()}`)
  } else if (!jePrazdne(r.kapacita_luzek) && !jePraznyKlic('kapacita')) ponechano.push('kapacita')

  // ── Provoz: kontakty (telefon/email/web) ──
  const maKontakty = y.kontakty != null && typeof y.kontakty === 'object'
  const kont = (y.kontakty ?? {}) as Record<string, unknown>
  const kontaktyRadky: string[] = [] // děti bloku kontakty (+ případný inline zdroj)
  const zdrojeProvoz: string[] = []
  for (const pole of ['telefon', 'email', 'web'] as const) {
    const val = r[pole]
    if (jePrazdne(val)) continue
    if (kont[pole] != null && kont[pole] !== '') { ponechano.push(`kontakty.${pole}`); continue }
    const cista = pole === 'telefon' ? val.split(';')[0].trim() : val.trim()
    kontaktyRadky.push(`  ${pole}: ${q(cista)}`)
    if (!jePrazdne(r[`${pole}_zdroj`])) zdrojeProvoz.push(zdrojNota(pole, r[`${pole}_zdroj`]))
    doplneno.push(pole)
  }
  // Provenience kontaktů: existující overeniProvoz → inline komentář u dětí; jinak nový blok (níže).
  if (kontaktyRadky.length && zdrojeProvoz.length && maOvereniProvoz) kontaktyRadky.push(`  # ${zdrojeProvoz.join(' · ')}`)

  // ── Zajímavost (jen když chata žádnou nemá; vlastní zdroj u položky) ──
  if (!jePrazdne(r.zajimavost) && !maPole('zajimavosti')) {
    const kat = KATEGORIE[r.zajimavost_kategorie?.trim()] ?? 'jine'
    const zdroj = jePrazdne(r.zajimavost_zdroj) ? `katalog doplňková fakta ${DATUM}` : r.zajimavost_zdroj.trim()
    blok.push('zajimavosti:', `  - text: ${q(r.zajimavost.trim())}`, `    kategorie: ${kat}`, `    zdroj: ${q(zdroj)}`)
    doplneno.push('zajimavost')
  } else if (!jePrazdne(r.zajimavost) && maPole('zajimavosti')) ponechano.push('zajimavosti')

  if (!blok.length && !kontaktyRadky.length) return { text, doplneno, ponechano }

  // ── Vložení do textu ──
  const lines = text.split('\n')
  // kontakty: do existujícího bloku (za `kontakty:`), jinak nový blok za `oblast:`.
  if (kontaktyRadky.length) {
    const iK = maKontakty ? lines.findIndex((l) => /^kontakty:\s*$/.test(l)) : -1
    if (iK >= 0) lines.splice(iK + 1, 0, ...kontaktyRadky)
    else blok.push('kontakty:', ...kontaktyRadky)
    // strukturovaný overeniProvoz jen když ještě není (jinak už je inline komentář výše)
    if (zdrojeProvoz.length && !maOvereniProvoz)
      blok.push('overeniProvoz:', `  source: ${q(zdrojeProvoz.join(' · '))}`, '  verified: false', `  checked: ${q(DATUM)}`)
  }
  if (blok.length) {
    const hlavicka = `# ── Doplňková fakta (katalog ${DATUM}, ChatGPT podklad; verified:false) ──`
    // Kotva: přednostně za `oblast:` (konec identifikační hlavičky), jinak za
    // jiný identifikační klíč — ať blok nerozděluje hlavičku.
    const iKotva =
      lines.findIndex((l) => /^oblast:/.test(l)) >= 0
        ? lines.findIndex((l) => /^oblast:/.test(l))
        : lines.findIndex((l) => /^(slug|zeme|nazev):/.test(l))
    const vlozit = ['', hlavicka, ...blok]
    if (iKotva >= 0) lines.splice(iKotva + 1, 0, ...vlozit)
    else lines.push(...vlozit)
  }
  return { text: lines.join('\n'), doplneno, ponechano }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const main = () => {
  const dry = process.argv.includes('--dry')
  if (!existsSync(CSV)) throw new Error(`Chybí katalog ${CSV}.`)
  const fakta = nactiFakta(readFileSync(CSV, 'utf8'))

  const vysledky: { nazev: string; jistota: string; doplneno: string[]; ponechano: string[] }[] = []
  let bezShody = 0
  for (const f of readdirSync(CHATY)) {
    if (!f.endsWith('.yaml')) continue
    const cesta = join(CHATY, f)
    const text = readFileSync(cesta, 'utf8')
    const y = (parse(text) ?? {}) as { nazev?: string; aliasy?: { nazev?: string }[] }
    if (!y.nazev) continue
    const nazvy = [y.nazev, ...(y.aliasy ?? []).map((a) => a?.nazev).filter((n): n is string => !!n)]
    let klic: string | null = null
    for (const k of fakta.keys()) if (shodaNazvu(nazvy, k)) { klic = k; break }
    if (!klic) { bezShody++; continue }

    const r = fakta.get(klic)!
    const { text: novy, doplneno, ponechano } = doplnText(text, r)
    vysledky.push({ nazev: y.nazev, jistota: r.jistota, doplneno, ponechano })
    if (!dry && doplneno.length && novy !== text) writeFileSync(cesta, novy, 'utf8')
  }

  console.log(`\n## DATA-09 report — doplňková faktická data${dry ? ' (DRY-RUN)' : ''}`)
  const dotcene = vysledky.filter((v) => v.doplneno.length)
  console.log(`Chat se shodou: ${vysledky.length} · doplněno u: ${dotcene.length} · bez shody: ${bezShody}`)
  for (const v of vysledky) {
    if (!v.doplneno.length && !v.ponechano.length) continue
    const d = v.doplneno.length ? `+ ${v.doplneno.join(', ')}` : '(nic nového)'
    const p = v.ponechano.length ? `  {ponecháno: ${v.ponechano.join(', ')}}` : ''
    console.log(`- ${v.nazev} [${v.jistota}] ${d}${p}`)
  }
}

if (process.argv[1]?.endsWith('data09-fakticka-data.ts')) {
  try {
    main()
  } catch (chyba) {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  }
}
