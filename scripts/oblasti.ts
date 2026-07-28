/**
 * Konfigurace pilotních oblastí — jedno místo, ze kterého čerpají všechny
 * datové pipeline (DATA-01 export kandidátů z OSM, DATA-28 3D terén, další).
 * Rozšíření průvodce o nové pohoří tak znamená přidat sem záznam, ne kopírovat
 * skript (rozhodnutí Michala 28. 7. 2026: „po Krkonoších Jizerské hory").
 *
 * Poctivost: `bbox` je jen VYHLEDÁVACÍ OKNO dotazu, nikdy publikovaný údaj
 * o rozloze pohoří. Přeshraniční pohoří se dotazují po zemích (princip
 * „pohoří vcelku" — rozhodnutí Michala 20. 7. 2026 u polských schronisek).
 */

export type OblastKonfig = {
  slug: string
  nazev: string
  /** ISO kódy zemí, po kterých se dotazuje OSM (průnik area × bbox). */
  zeme: string[]
  /** Hrubé okno dotazu: jih, západ, sever, východ. */
  bbox: { latMin: number; lngMin: number; latMax: number; lngMax: number }
  /** Užší okno pro 3D reliéf (mřížka výškopisu) — bez okolního podhůří. */
  bbox3d: { latMin: number; lngMin: number; latMax: number; lngMax: number }
  poznamka: string
}

export const OBLASTI: OblastKonfig[] = [
  {
    slug: 'krkonose',
    nazev: 'Krkonoše',
    zeme: ['CZ', 'PL'],
    // Pokrývá Harrachov až Rýchory a na severu polské podhůří
    // (Szklarska Poręba, Karpacz) s rezervou.
    bbox: { latMin: 50.55, lngMin: 15.3, latMax: 50.87, lngMax: 16.05 },
    bbox3d: { latMin: 50.6, lngMin: 15.35, latMax: 50.82, lngMax: 15.95 },
    poznamka: 'pilotní oblast průvodce (76 publikovaných profilů k 28. 7. 2026)',
  },
  {
    slug: 'jizerske-hory',
    nazev: 'Jizerské hory',
    zeme: ['CZ', 'PL'],
    // Česká strana od Ještědsko-kozákovského předělu po Smrk a Jizerku,
    // polská Góry Izerskie po Świeradów-Zdrój a Szklarską Porębę.
    // Na východě se okno vědomě mírně překrývá s krkonošským (Jizerka /
    // Harrachov) — duplicity řeší kandidátní triáž, ne ořez okna.
    bbox: { latMin: 50.75, lngMin: 15.05, latMax: 51.02, lngMax: 15.45 },
    bbox3d: { latMin: 50.78, lngMin: 15.1, latMax: 50.98, lngMax: 15.42 },
    poznamka: 'druhá oblast (rozhodnutí Michala 28. 7. 2026) — přeshraniční s Górami Izerskimi',
  },
]

export const oblastDleSlugu = (slug: string): OblastKonfig => {
  const o = OBLASTI.find((x) => x.slug === slug)
  if (!o) throw new Error(`Neznámá oblast „${slug}". Známé: ${OBLASTI.map((x) => x.slug).join(', ')}`)
  return o
}

/** `--oblast <slug>` z argumentů (výchozí krkonose — zpětná kompatibilita). */
export const oblastZArgv = (argv: string[] = process.argv.slice(2)): OblastKonfig => {
  const i = argv.indexOf('--oblast')
  return oblastDleSlugu(i >= 0 && argv[i + 1] ? argv[i + 1] : 'krkonose')
}

/** Okno dotazu ve tvaru, jaký chce Overpass: „jih,západ,sever,východ". */
export const bboxStr = (b: OblastKonfig['bbox']): string =>
  `${b.latMin},${b.lngMin},${b.latMax},${b.lngMax}`
