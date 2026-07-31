/**
 * PŘEHLÍDKA KANDIDÁTNÍCH FOTEK — kontaktní arch pro redakční výběr.
 *
 *   npx tsx scripts/fotky-prehlidka.ts                      # všechny oblasti
 *   npx tsx scripts/fotky-prehlidka.ts --oblast jizerske-hory
 *   npx tsx scripts/fotky-prehlidka.ts --vse                # i chaty, které fotku už mají
 *   npx tsx scripts/fotky-prehlidka.ts --i-kandidati         # i objekty bez profilu
 *
 * PROČ VZNIKLO (31. 7. 2026): běh DATA-02 přinesl 2 994 kandidátních snímků ke
 * 160 objektům. To je hromada, kterou nikdo neprojde v YAML — a přitom je to
 * poslední krok, který MUSÍ udělat člověk: jestli je na snímku opravdu ta
 * chata, pozná jen oko (konvence B), a licenci má na stránce souboru
 * zkontrolovat redakce. Skript proto nic nevybírá; jen z dat postaví
 * kontaktní arch, ve kterém výběr trvá minuty místo večerů.
 *
 * PROČ HTML A NE SEZNAM: sandbox na upload.wikimedia.org nedosáhne (ověřeno,
 * curl vrací 000), takže náhledy nemůže stáhnout ani zmenšit — ale PROHLÍŽEČ
 * Michala tam dosáhne bez problému. Arch je tedy stránka, která si miniatury
 * natáhne z Commons sama, přesně jako to dělá mapa s dlaždicemi Mapy.com.
 * Soubor je samostatný (žádné externí CSS/JS) a do repa se necommituje —
 * generuje se do `out/`, které je v .gitignore.
 *
 * CO ARCH HLÍDÁ ZA ČLOVĚKA:
 *  - Nálezy dělí na SILNÉ (geotag u chaty nebo kategorie objektu) a SLABÉ
 *    (jen shoda jména ve fulltextu). Slabé jsou schované a označené, protože
 *    umí být úplně mimo: chata „Barbora" v Jizerkách si takhle přitáhla
 *    28 portrétů herečky Barbory Štěpánové.
 *  - Ke každému snímku ukazuje autora, licenci, rozměry, datum a popis ze
 *    zdroje — tedy přesně to, z čeho se skládá atribuce.
 *  - Po kliknutí složí YAML blok `fotky:` v tom tvaru, jaký čte seed
 *    (`stahnoutZ`, `licence` z číselníku kolekce Fotky, `overeni` s
 *    `verified: false`). Nic si nedomýšlí: `alt` nechává na redakci, protože
 *    tvrzení „na snímku je tahle budova" musí padnout od člověka.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { parse } from 'yaml'

/**
 * YAML soubory ve složce; soubory s prefixem `_` jsou meta seznamy
 * (`_vyrazeno.yaml`, `_commons-export.json`…), ne datové záznamy — stejná
 * konvence jako v seedu.
 */
const yamlSoubory = (slozka: string): string[] => {
  try {
    return readdirSync(slozka, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.yaml') && !basename(f).startsWith('_'))
      .map((f) => join(slozka, f))
  } catch {
    return []
  }
}

/** Jedna nalezená fotka tak, jak ji zapsalo DATA-02. */
export type Kandidat = {
  soubor: string
  autor?: string
  licence?: string
  stranka?: string
  original?: string
  nahled?: string
  nalezeno?: string
  rozmery?: string
  datum?: string
  popis?: string
}

export type ChataSFotkami = {
  slug: string
  oblast: string
  nazev: string
  /** Objekt má profil v `data/chaty/` — tedy prošel triáží a stojí na webu. */
  jeProfil: boolean
  maFotku: boolean
  silne: Kandidat[]
  slabe: Kandidat[]
}

/**
 * Síla nálezu = JEN geotag u chaty (`geosearch`, do 300 m od jejích GPS).
 *
 * Napoprvé tu jako silná počítala i `kategorie` — zdálo se rozumné, že
 * zařazení do kategorie objektu je doklad. Arch to hned vyvrátil: chata
 * **Barborka** v Krkonoších dostala 51 „silných" nálezů, z toho 50 z polské
 * kategorie **Barbórka** (hornický svátek v Bytomi) — kategorie se přiřazuje
 * podle shody JMÉNA, ne podle objektu, takže je stejně slabá jako fulltext.
 * Homonyma jsou v tomhle korpusu běžná: Barbora, Barborka, Hvězda, Peklo.
 *
 * I geotag ovšem dokládá jen MÍSTO, ne obsah — u téže Barborky je jediný
 * geotagovaný snímek portrét člověka. Poslední slovo má proto vždycky oko
 * redakce; arch jen řadí podle toho, kde se vyplatí začít.
 */
export const jeSilny = (k: Kandidat): boolean => (k.nalezeno ?? '').includes('geosearch')

/** Číselník licencí kolekce Fotky — co se nevejde, nechá skript na redakci. */
export const licenceDoCiselniku = (licence: string | undefined): string | null => {
  if (!licence) return null
  const l = licence.toLowerCase()
  if (l.startsWith('cc0')) return 'cc0'
  if (l.includes('public domain') || l === 'pd') return 'pd'
  if (l.startsWith('cc by-sa')) return 'cc-by-sa'
  if (l.startsWith('cc by')) return 'cc-by'
  return null
}

/** Rozlišení v pixelech (na řazení) — „3539×3400" → 12 032 600. */
export const plocha = (rozmery: string | undefined): number => {
  const m = /(\d+)\s*×\s*(\d+)/.exec(rozmery ?? '')
  return m ? Number(m[1]) * Number(m[2]) : 0
}

/**
 * Přehled profilů: které objekty vůbec mají profil (prošly triáží) a které
 * z nich už mají redakčně vybraný blok `fotky:`.
 *
 * Rozdíl je podstatný pro to, co má smysl prohlížet: kandidátů DATA-02 je
 * 160, ale profilů 89 — vybírat fotku k objektu, který se možná nikdy
 * profilem nestane, je práce navíc.
 */
export const stavProfilu = (korenChat: string): { profily: Set<string>; sFotkou: Set<string> } => {
  const profily = new Set<string>()
  const sFotkou = new Set<string>()
  for (const soubor of yamlSoubory(korenChat)) {
    const data = parse(readFileSync(soubor, 'utf8')) as { slug?: string; fotky?: unknown[] } | null
    if (!data?.slug) continue
    profily.add(data.slug)
    if (Array.isArray(data.fotky) && data.fotky.length > 0) sFotkou.add(data.slug)
  }
  return { profily, sFotkou }
}

/** Načte kandidáty a seřadí je: silné nálezy první, uvnitř podle rozlišení. */
export const nactiKandidaty = (
  korenKandidatu: string,
  korenChat: string,
  filtrOblasti?: string,
): ChataSFotkami[] => {
  const { profily, sFotkou } = stavProfilu(korenChat)
  const vysledek: ChataSFotkami[] = []
  for (const soubor of yamlSoubory(korenKandidatu)) {
    const data = parse(readFileSync(soubor, 'utf8')) as
      | { chata?: string; oblast?: string; nazevChaty?: string; fotky?: Kandidat[] }
      | null
    if (!data?.chata || !data.oblast) continue
    if (filtrOblasti && data.oblast !== filtrOblasti) continue
    const fotky = (data.fotky ?? []).filter((f) => f?.nahled && f?.stranka)
    const podlePlochy = (a: Kandidat, b: Kandidat) => plocha(b.rozmery) - plocha(a.rozmery)
    vysledek.push({
      slug: data.chata,
      oblast: data.oblast,
      nazev: data.nazevChaty ?? data.chata,
      jeProfil: profily.has(data.chata),
      maFotku: sFotkou.has(data.chata),
      silne: fotky.filter(jeSilny).sort(podlePlochy),
      slabe: fotky.filter((f) => !jeSilny(f)).sort(podlePlochy),
    })
  }
  // Napřed profily BEZ fotky a s nejlepší nabídkou — to je práce, která hoří.
  return vysledek.sort(
    (a, b) =>
      Number(b.jeProfil) - Number(a.jeProfil) ||
      Number(a.maFotku) - Number(b.maFotku) ||
      b.silne.length - a.silne.length ||
      a.nazev.localeCompare(b.nazev, 'cs'),
  )
}

const escapuj = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * YAML blok pro profil chaty. Tvar odpovídá tomu, co čte `seed-chaty.ts`
 * (`stahnoutZ` → stažení souboru, zbytek jsou metadata kolekce Fotky).
 * `verified: false` je tu natvrdo schválně: licenci a obsah snímku potvrzuje
 * člověk až po prohlídce stránky souboru (konvence B).
 */
export const yamlBlok = (k: Kandidat, dnes: string): string => {
  const licence = licenceDoCiselniku(k.licence)
  const popis = (k.popis ?? '').replace(/\s+/g, ' ').trim()
  const radky = [
    'fotky:',
    `  - stahnoutZ: ${k.original ?? ''}`,
    `    alt: '' # DOPLNIT: co je na snímku vidět — tvrzení patří člověku, ne exportu`,
    '    typ: soucasna',
    ...(k.datum ? [`    datovani: ${k.datum.slice(0, 10)} # z metadat Commons`] : []),
    ...(k.autor ? [`    autor: ${k.autor}`] : []),
    licence ? `    licence: ${licence}` : `    licence: # DOPLNIT — „${k.licence ?? '?'}" není v číselníku`,
    ...(k.licence ? [`    licencePoznamka: ${k.licence}`] : []),
    `    zdrojUrl: ${k.stranka ?? ''}`,
    `    prevzatoDne: '${dnes}'`,
    '    overeni:',
    `      source: Wikimedia Commons API extmetadata (${[k.licence && `licence ${k.licence}`, k.autor && `autor ${k.autor}`, popis && `popis „${popis}"`].filter(Boolean).join(', ')}), export DATA-02 ${dnes}`,
    '      verified: false # licenci a obsah snímku zkontroluje redakce na stránce souboru',
    `      checked: '${dnes}'`,
  ]
  return radky.join('\n')
}

const kartaFotky = (k: Kandidat, slug: string, dnes: string): string => `
        <figure class="f" data-yaml="${escapuj(yamlBlok(k, dnes))}" data-chata="${escapuj(slug)}">
          <img src="${escapuj(k.nahled ?? '')}" alt="" loading="lazy" decoding="async" />
          <figcaption>
            <b>${escapuj(k.autor ?? 'autor neuveden')}</b>
            <span class="lic">${escapuj(k.licence ?? '—')}</span>
            <span class="meta">${escapuj(k.rozmery ?? '—')}${k.datum ? ` · ${escapuj(k.datum.slice(0, 10))}` : ''}</span>
            ${k.popis ? `<span class="pop">${escapuj(k.popis.slice(0, 160))}</span>` : ''}
            <a href="${escapuj(k.stranka ?? '')}" target="_blank" rel="noreferrer">stránka souboru ▸</a>
          </figcaption>
        </figure>`

export const sestavHtml = (chaty: ChataSFotkami[], dnes: string, titulek: string): string => {
  const sekce = chaty
    .map(
      (ch) => `
      <section class="ch" id="ch-${escapuj(ch.slug)}">
        <h2>${escapuj(ch.nazev)} <span class="sl">${escapuj(ch.oblast)}/${escapuj(ch.slug)}</span>
          ${ch.maFotku ? '<span class="ma">už má fotku</span>' : ''}
          ${ch.jeProfil ? '' : '<span class="kand">zatím jen kandidát, ne profil</span>'}
          <span class="poc">${ch.silne.length} silných · ${ch.slabe.length} slabých</span>
        </h2>
        ${ch.silne.length ? `<div class="mr">${ch.silne.map((k) => kartaFotky(k, ch.slug, dnes)).join('')}</div>` : '<p class="nic">Žádný silný nález — geotag ani kategorie. Fotku bude potřeba získat odjinud.</p>'}
        ${
          ch.slabe.length
            ? `<details><summary>slabé nálezy (${ch.slabe.length}) — jen shoda jména, často úplně jiný objekt</summary>
             <div class="mr slaba">${ch.slabe.map((k) => kartaFotky(k, ch.slug, dnes)).join('')}</div></details>`
            : ''
        }
      </section>`,
    )
    .join('')

  return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapuj(titulek)}</title>
<style>
  :root { --ink:#26221d; --muted:#6d675e; --line:#e3ded3; --red:#c8352a; --paper:#fdfaf2; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:14px/1.5 system-ui, sans-serif; }
  header { position:sticky; top:0; z-index:5; background:var(--paper); border-bottom:1px solid var(--line); padding:14px 20px; }
  header h1 { margin:0 0 4px; font-size:18px; }
  header p { margin:0; color:var(--muted); font-size:12.5px; max-width:90ch; }
  main { padding:18px 20px 240px; }
  .ch { border-top:1px solid var(--line); padding:18px 0 8px; }
  .ch h2 { font-size:16px; margin:0 0 10px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .sl { font:11px/1 ui-monospace, monospace; color:var(--muted); }
  .ma { font-size:11px; background:#e8efe6; color:#3d6b40; padding:2px 7px; border-radius:9px; }
  .kand { font-size:11px; background:#f1ece0; color:#8a7c5f; padding:2px 7px; border-radius:9px; }
  .poc { font-size:11px; color:var(--muted); margin-left:auto; }
  .mr { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px,1fr)); gap:10px; }
  .f { margin:0; background:#fff; border:1px solid var(--line); border-radius:9px; overflow:hidden; cursor:pointer; }
  .f.vybrana { outline:3px solid var(--red); }
  .f img { display:block; width:100%; height:150px; object-fit:cover; background:#eee; }
  figcaption { padding:7px 9px 9px; display:flex; flex-direction:column; gap:2px; font-size:11.5px; }
  figcaption b { font-weight:600; }
  .lic { color:#3d6b40; }
  .meta, .pop { color:var(--muted); }
  .pop { font-style:italic; }
  figcaption a { color:var(--red); text-decoration:none; margin-top:3px; }
  details { margin-top:10px; }
  summary { cursor:pointer; color:var(--muted); font-size:12px; }
  .slaba { margin-top:8px; opacity:.75; }
  .nic { color:var(--muted); font-style:italic; margin:0; }
  #panel { position:fixed; inset:auto 0 0 0; background:#26221d; color:#f3eee4; padding:12px 20px; max-height:44vh; overflow:auto; display:none; }
  #panel.je { display:block; }
  #panel h3 { margin:0 0 8px; font-size:13px; }
  #panel pre { margin:0; font:11.5px/1.5 ui-monospace, monospace; white-space:pre-wrap; }
  #panel button { margin-right:8px; background:var(--red); color:#fff; border:0; border-radius:7px; padding:7px 12px; cursor:pointer; font-size:12px; }
</style></head>
<body>
<header>
  <h1>${escapuj(titulek)}</h1>
  <p>Klikni na snímek → dole se složí YAML blok do profilu chaty (<code>data/chaty/&lt;oblast&gt;/&lt;slug&gt;.yaml</code>).
     Než blok použiješ, otevři <b>stránku souboru</b> a přesvědč se, že je na snímku opravdu ta chata a že licence sedí —
     export dokládá jen to, co o souboru tvrdí Commons. Miniatury se načítají přímo z Commons.</p>
</header>
<main>${sekce}</main>
<div id="panel">
  <h3>YAML blok — vlož do profilu chaty (<span id="ktera"></span>)</h3>
  <pre id="kod"></pre>
  <p><button id="kopiruj">Kopírovat</button><button id="zavri">Zavřít</button></p>
</div>
<script>
  var panel = document.getElementById('panel'), kod = document.getElementById('kod'), ktera = document.getElementById('ktera')
  document.querySelectorAll('.f').forEach(function (f) {
    f.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') return
      document.querySelectorAll('.f.vybrana').forEach(function (x) { x.classList.remove('vybrana') })
      f.classList.add('vybrana')
      kod.textContent = f.dataset.yaml
      ktera.textContent = f.dataset.chata
      panel.classList.add('je')
    })
  })
  document.getElementById('kopiruj').addEventListener('click', function () {
    navigator.clipboard.writeText(kod.textContent).then(function () { this.textContent = 'Zkopírováno' }.bind(this))
  })
  document.getElementById('zavri').addEventListener('click', function () { panel.classList.remove('je') })
</script>
</body></html>
`
}

const main = () => {
  const argv = process.argv.slice(2)
  const oblast = argv.includes('--oblast') ? argv[argv.indexOf('--oblast') + 1] : undefined
  const vse = argv.includes('--vse')
  const iKandidati = argv.includes('--i-kandidati')
  const koren = process.cwd()
  const dnes = new Date().toISOString().slice(0, 10)

  let chaty = nactiKandidaty(
    join(koren, 'data', 'kandidati', 'fotky'),
    join(koren, 'data', 'chaty'),
    oblast,
  )
  if (!iKandidati) chaty = chaty.filter((ch) => ch.jeProfil)
  if (!vse) chaty = chaty.filter((ch) => !ch.maFotku)
  chaty = chaty.filter((ch) => ch.silne.length + ch.slabe.length > 0)
  if (chaty.length === 0) {
    console.log('Není co ukázat — žádní kandidáti odpovídající výběru.')
    return
  }

  const titulek = `Kandidátní fotky${oblast ? ` — ${oblast}` : ''} (${chaty.length} chat, ${dnes})`
  const cil = join(koren, 'out', `fotky-prehlidka${oblast ? `-${oblast}` : ''}.html`)
  if (!existsSync(join(koren, 'out'))) mkdirSync(join(koren, 'out'), { recursive: true })
  writeFileSync(cil, sestavHtml(chaty, dnes, titulek), 'utf8')

  const silne = chaty.reduce((s, ch) => s + ch.silne.length, 0)
  const slabe = chaty.reduce((s, ch) => s + ch.slabe.length, 0)
  const bezSilneho = chaty.filter((ch) => ch.silne.length === 0).length
  console.log(`Arch zapsán: ${cil}`)
  console.log(`  chat: ${chaty.length} | silných nálezů: ${silne} | slabých: ${slabe}`)
  console.log(`  chat bez jediného silného nálezu: ${bezSilneho} — těm fotka z Commons nepomůže`)
}

if (process.argv[1]?.endsWith('fotky-prehlidka.ts')) main()
