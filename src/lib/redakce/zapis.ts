/**
 * ZÁPIS REDAKČNÍCH ROZHODNUTÍ DO DAT.
 *
 * Zdrojem pravdy zůstává repozitář (`data/**`), ne databáze — admin je jen
 * pohodlné okno. Rozhodnutí učiněné v prostředí se proto zapisuje do TÝCHŽ
 * YAML souborů, které čte seed a validuje `npm run kontrola`. Jinak by první
 * deploy přepsal, co Michal vybral, a nikdo by nepoznal proč.
 *
 * PROČ `parseDocument`, A NE `parse` + `stringify`: datové soubory jsou plné
 * komentářů, ve kterých je půlka projektové paměti (proč je kandidát vyřazený,
 * co který zdroj tvrdí). Přeparsovat je na objekt a vypsat zpátky by komentáře
 * ticho smazalo. Dokumentový režim knihovny `yaml` je zachová.
 *
 * Funkce jsou ČISTÉ (text → text), aby šly testovat bez souborového systému;
 * o samotný zápis se stará `zapisRozhodnuti` v route handleru.
 */
import { Document, parseDocument, type YAMLSeq } from 'yaml'

/** Fotka vybraná redakcí, ve tvaru, jaký čte seed (`stahnoutZ` + metadata). */
export type VybranaFotka = {
  stahnoutZ: string
  alt: string
  typ?: string
  datovani?: string
  autor?: string
  licence: string
  licencePoznamka?: string
  zdrojUrl: string
  prevzatoDne: string
  overeni: { source: string; verified: false; checked: string }
}

/** Číselník licencí kolekce Fotky; co se nevejde, se NEHÁDÁ. */
export const licenceDoCiselniku = (licence: string | undefined): string | null => {
  if (!licence) return null
  const l = licence.toLowerCase()
  if (l.startsWith('cc0')) return 'cc0'
  if (l.includes('public domain') || l === 'pd') return 'pd'
  if (l.startsWith('cc by-sa')) return 'cc-by-sa'
  if (l.startsWith('cc by')) return 'cc-by'
  return null
}

/**
 * Složí záznam fotky z metadat Commons. `alt` píše ČLOVĚK — je to tvrzení
 * o tom, co je na snímku, a to stroj z metadat nepozná (konvence B);
 * `verified` proto zůstává `false`, dokud licenci nepotvrdí oko redakce.
 */
export const zaznamFotky = (vstup: {
  original: string
  stranka: string
  alt: string
  autor?: string
  licence?: string
  datum?: string
  popis?: string
  dnes: string
}): VybranaFotka => {
  const ciselnik = licenceDoCiselniku(vstup.licence)
  if (!ciselnik) throw new Error(`Licence „${vstup.licence ?? '?'}" není v číselníku kolekce Fotky — zapiš ručně.`)
  const popis = (vstup.popis ?? '').replace(/\s+/g, ' ').trim()
  return {
    stahnoutZ: vstup.original,
    alt: vstup.alt,
    typ: 'soucasna',
    ...(vstup.datum ? { datovani: vstup.datum.slice(0, 10) } : {}),
    ...(vstup.autor ? { autor: vstup.autor } : {}),
    licence: ciselnik,
    ...(vstup.licence ? { licencePoznamka: vstup.licence } : {}),
    zdrojUrl: vstup.stranka,
    prevzatoDne: vstup.dnes,
    overeni: {
      source: `Wikimedia Commons API extmetadata (${[
        vstup.licence && `licence ${vstup.licence}`,
        vstup.autor && `autor ${vstup.autor}`,
        popis && `popis „${popis}"`,
      ]
        .filter(Boolean)
        .join(', ')}), výběr v redakčním prostředí ${vstup.dnes}`,
      verified: false,
      checked: vstup.dnes,
    },
  }
}

/**
 * Skalár do YAML. Prosté hodnoty se píšou bez uvozovek (tak vypadá zbytek
 * datových souborů), všechno ostatní — dvojtečky, uvozovky, víceřádkové texty
 * a cokoli, co by se dalo číst jako číslo, datum nebo `true` — se uvozuje.
 * Datumy se uvozují VŽDY: `prevzatoDne: 2026-07-31` je v YAML datum, kdežto
 * kolekce Fotky čeká řetězec.
 */
export const skalar = (hodnota: string, vzdyUvozovky = false): string => {
  const prosty = /^[\p{L}\p{N} .,()\-–—/×°'’]+$/u.test(hodnota)
  const vypadaJinak = /^(true|false|null|~|-?\d|\d{4}-\d{2}-\d{2})/i.test(hodnota.trim())
  if (!vzdyUvozovky && prosty && !vypadaJinak && hodnota.length <= 200) return hodnota
  // Jednoduché uvozovky drží styl zbytku repa (`prevzatoDne: '2026-07-31'`)
  // a nemusí escapovat zpětná lomítka; dvojité se sáhne, až když v hodnotě
  // apostrof nebo zalomení opravdu je.
  return !hodnota.includes("'") && !hodnota.includes('\n')
    ? `'${hodnota}'`
    : JSON.stringify(hodnota)
}

/** Řádky jedné položky seznamu `fotky:` (odsazení dvěma mezerami jako v repu). */
export const radkyFotky = (f: VybranaFotka): string[] =>
  [
    `  - stahnoutZ: ${f.stahnoutZ}`,
    `    alt: ${skalar(f.alt)}`,
    f.typ ? `    typ: ${f.typ}` : null,
    f.datovani ? `    datovani: ${skalar(f.datovani, true)} # z metadat Commons` : null,
    f.autor ? `    autor: ${skalar(f.autor)}` : null,
    `    licence: ${f.licence}`,
    f.licencePoznamka ? `    licencePoznamka: ${f.licencePoznamka}` : null,
    `    zdrojUrl: ${f.zdrojUrl}`,
    `    prevzatoDne: ${skalar(f.prevzatoDne, true)}`,
    '    overeni:',
    `      source: ${skalar(f.overeni.source, true)}`,
    '      verified: false # licenci a obsah snímku potvrzuje člověk (konvence B)',
    `      checked: ${skalar(f.overeni.checked, true)}`,
  ].filter((r): r is string => r != null)

/**
 * Vloží fotku do profilu chaty — TEXTOVĚ, ne přes přeparsování dokumentu.
 *
 * PROČ TEXTOVĚ (nález z ostrého testu 31. 7. 2026): první verze načetla soubor
 * knihovnou `yaml` a vypsala ho zpátky. Komentáře sice přežily, ale dokument
 * se přeformátoval — dlouhé složené bloky se přelomily na jiné šířce a diff
 * jednoho přidaného snímku měl 97 změněných řádků. Takový diff se nedá číst
 * a v code review propadne cokoli. Textový vpich mění jen to, co přibylo.
 *
 * Když blok `fotky:` neexistuje, připojí se na konec souboru; když existuje,
 * nová položka jde na jeho konec (pořadí = priorita, hero zůstává první).
 */
export const vlozFotkuDoProfilu = (yamlText: string, fotka: VybranaFotka): string => {
  const blok = radkyFotky(fotka)
  const radky = yamlText.split('\n')
  const zacatek = radky.findIndex((r) => /^fotky:\s*$/.test(r))
  if (zacatek === -1) {
    const zaklad = yamlText.endsWith('\n') ? yamlText : `${yamlText}\n`
    return `${zaklad}\nfotky:\n${blok.join('\n')}\n`
  }
  // Konec bloku = první další řádek, který začíná na prvním sloupci (další
  // klíč nebo komentář k němu). Prázdné řádky před ním k bloku nepatří.
  let konec = zacatek + 1
  while (konec < radky.length && (radky[konec] === '' || /^\s/.test(radky[konec]!))) konec++
  while (konec > zacatek + 1 && radky[konec - 1]!.trim() === '') konec--
  return [...radky.slice(0, konec), ...blok, ...radky.slice(konec)].join('\n')
}

/**
 * Je fotka (dle URL originálu) v profilu už zapsaná? Chrání před dvojklikem
 * a před tím, aby dva běhy DATA-02 nabídly týž snímek dvakrát.
 */
export const uzJeVProfilu = (yamlText: string, original: string): boolean =>
  yamlText.includes(`stahnoutZ: ${original}`)

export type RozhodnutiFotky = {
  chata: string
  /** U `uzavrena` (nebereme nic) se soubor neuvádí. */
  soubor?: string
  stav: 'odmitnuta' | 'uzavrena'
  duvod: string
  rozhodl: string
  checked: string
}

const HLAVICKA_ROZHODNUTI = `Rozhodnutí redakce o kandidátních fotkách (DATA-02).

Zapisují se sem JEN ta rozhodnutí, která z jiných dat poznat nejdou:
  * odmitnuta — konkrétní snímek jsme viděli a nechceme ho (a proč),
  * uzavrena  — u téhle chaty z Commons nebereme nic (a proč).
Vybraná fotka se sem NEPÍŠE: ta stojí v profilu chaty v bloku \`fotky:\`,
a dva zápisy téhož by se dřív nebo později rozešly.

Bez tohohle souboru by se odmítnutý snímek vracel do fronty při každém
dalším běhu DATA-02 — a redakce by tutéž fotku odmítala pořád dokola.`

const HLAVICKA_ODLOZENI = `Odložení kandidáti — aktivní „zatím ne", ne zapomenutí.

Kandidát bez rozhodnutí leží ve frontě a `+"`npm run kontrola`"+` ho počítá jako
nezpracovaného. Když ale víme, PROČ se rozhodnout nedá (chybí ověření
v terénu, čeká se na odpověď chataře), patří to sem — jinak fronta hlásí
práci, která se dělat nemá, a přestane se jí věřit.

Odložení není vyřazení: objekt se do fronty vrátí, jakmile se ze seznamu
odstraní. Vyřazené vede \`_vyrazeno.yaml\` a DATA-01 je znovu nezakládá.`

/**
 * Přidá rozhodnutí o fotce do `_rozhodnuti.yaml`. Když soubor ještě není,
 * založí ho i s hlavičkou, která vysvětluje, proč existuje.
 */
export const pridejRozhodnutiFotky = (yamlText: string | null, r: RozhodnutiFotky): string => {
  const dok = yamlText ? parseDocument(yamlText) : novyDokument('rozhodnuti', HLAVICKA_ROZHODNUTI)
  const seq = dok.get('rozhodnuti') as YAMLSeq | undefined
  const zaznam = dok.createNode(
    r.stav === 'uzavrena'
      ? { chata: r.chata, stav: r.stav, duvod: r.duvod, rozhodl: r.rozhodl, checked: r.checked }
      : { chata: r.chata, soubor: r.soubor, stav: r.stav, duvod: r.duvod, rozhodl: r.rozhodl, checked: r.checked },
  )
  if (seq && typeof seq.add === 'function') seq.add(zaznam)
  else dok.set('rozhodnuti', dok.createNode([zaznam]))
  return String(dok)
}

export type OdlozenyKandidat = {
  slug: string
  oblast: string
  duvod: string
  rozhodl: string
  checked: string
}

/** Přidá kandidáta mezi odložené (`_odlozeno.yaml`). */
export const pridejOdlozeni = (yamlText: string | null, o: OdlozenyKandidat): string => {
  const dok = yamlText ? parseDocument(yamlText) : novyDokument('odlozeno', HLAVICKA_ODLOZENI)
  const seq = dok.get('odlozeno') as YAMLSeq | undefined
  const zaznam = dok.createNode(o)
  if (seq && typeof seq.add === 'function') seq.add(zaznam)
  else dok.set('odlozeno', dok.createNode([zaznam]))
  return String(dok)
}

const novyDokument = (klic: string, hlavicka: string): Document => {
  const dok = new Document({ [klic]: [] })
  dok.commentBefore = hlavicka
    .split('\n')
    .map((r) => (r ? ` ${r}` : ''))
    .join('\n')
  return dok
}

export type VyrazenyKandidat = {
  slug: string
  osm?: string
  duvod: string
  rozhodl: string
  checked: string
}

/**
 * Přidá kandidáta mezi vyřazené (`_vyrazeno.yaml`) — seznam, kterým se řídí
 * DATA-01, aby objekt při dalším běhu nezaložila znovu. Identitou je proto
 * OSM URL, ne slug: ten se s přejmenováním v OSM mění, URL ne.
 */
export const pridejVyrazeni = (yamlText: string, v: VyrazenyKandidat): string => {
  const dok = parseDocument(yamlText)
  const seq = dok.get('vyrazeno') as YAMLSeq | undefined
  const zaznam = dok.createNode({
    ...(v.osm ? { osm: v.osm } : {}),
    slug: v.slug,
    duvod: v.duvod,
    rozhodl: v.rozhodl,
    checked: v.checked,
  })
  if (seq && typeof seq.add === 'function') seq.add(zaznam)
  else dok.set('vyrazeno', dok.createNode([zaznam]))
  return String(dok)
}
