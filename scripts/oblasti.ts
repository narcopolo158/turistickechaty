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

import { join } from 'node:path'

/**
 * Země, po kterých umíme dotazovat OSM. Seznam je TYP, ne volný řetězec:
 * `zeme` z konfigurace se propisuje do pole `zeme` u každého kandidáta, takže
 * překlep („SL" místo „SK") by se tiše rozlezl do dat. Rozšiřuje se vědomě —
 * až přibude pohoří, které tu zemi opravdu má. Slovensko sem přibylo
 * 30. 7. 2026 dopředu na Michalův pokyn („beskydy budou mít část na
 * Slovensku"), ať se pak přidává jen záznam oblasti, ne typ. Německo
 * přibylo 4. 8. 2026 se Šumavou (Michal: „pustíme se do šumavy + bavorskou
 * část, budeme muset založit německo").
 */
export type ZemeIso = 'CZ' | 'PL' | 'SK' | 'DE'

export type OblastKonfig = {
  slug: string
  nazev: string
  /**
   * ISO kódy zemí, po kterých se dotazuje OSM (průnik area × bbox) — a jen
   * po nich. Oblast celá v Česku má `['CZ']`; ptát se navíc Polska stálo
   * 30. 7. 2026 celý běh DATA-01 (prázdná odpověď = selhání instance).
   */
  zeme: ZemeIso[]
  /** Hrubé okno dotazu: jih, západ, sever, východ. */
  bbox: { latMin: number; lngMin: number; latMax: number; lngMax: number }
  /** Užší okno pro 3D reliéf (mřížka výškopisu) — bez okolního podhůří. */
  bbox3d: { latMin: number; lngMin: number; latMax: number; lngMax: number }
  poznamka: string
  /**
   * Jak se pohoří jmenuje v externím katalogu (`data/externi/katalog-cr-sk-2026`).
   * Slouží dohledávce DATA-01 podle jmen: katalog o objektu ví, ale OSM ho
   * tagovalo civilně (Kiosek Knajpa, Pyramida Jizerka), takže ho hutový dotaz
   * mine. Přeshraniční pohoří má v katalogu dva názvy — proto pole.
   */
  katalogPohori?: string[]
}

export const OBLASTI: OblastKonfig[] = [
  {
    slug: 'krkonose',
    nazev: 'Krkonoše',
    zeme: ['CZ', 'PL'],
    // Pokrývá Harrachov až Rýchory a na severu polské podhůří
    // (Szklarska Poręba, Karpacz) s rezervou.
    bbox: { latMin: 50.55, lngMin: 15.3, latMax: 50.87, lngMax: 16.05 },
    // Severní hrana 50,84 (dřív 50,82): pod 50,82 zůstávalo mimo model
    // Schronisko PTTK „Kochanówka" (50,830) — publikovaný profil, který by
    // model tiše vynechal. Rozšíření je 2,2 km polského podhůří nad Szklarskou
    // Porębou, ne půl Slezska: hřeben zůstává tam, kde byl (rozhodnutí
    // 28. 7. 2026 — Michal ho nechal na mně, viz deník).
    bbox3d: { latMin: 50.6, lngMin: 15.35, latMax: 50.84, lngMax: 15.95 },
    poznamka: 'pilotní oblast průvodce (76 publikovaných profilů k 28. 7. 2026)',
    katalogPohori: ['Krkonoše', 'Karkonosze'],
  },
  {
    slug: 'jizerske-hory',
    nazev: 'Jizerské hory',
    zeme: ['CZ', 'PL'],
    // Česká strana od Ještědsko-kozákovského předělu po Smrk a Jizerku,
    // polská Góry Izerskie po Świeradów-Zdrój a Szklarską Porębę.
    // Na východě se okno vědomě mírně překrývá s krkonošským (Jizerka /
    // Harrachov) — duplicity řeší kandidátní triáž, ne ořez okna.
    // Jižní hrana 50.70 (dřív 50.75 → 50.73 → 50.70): hrana se posouvá
    // už potřetí a pokaždé ze stejného důvodu — jižní hřebeny Jizerek
    // jsou pořád Jizerky. 29. 7. 2026 ji na 50.73 stáhly Štěpánka
    // (50.7465) a Maják Járy Cimrmana (50.7399), které chytilo krkonošské
    // okno; 2. 8. 2026 Michal doplnil rozhlednu Černá studnice (50.7120,
    // Černostudniční hřeben, katastr Smržovky), která ležela i pod novou
    // hranou → 50.70, aby okno pokrylo celý Černostudniční hřeben.
    // Po každém posunu je potřeba znovu spustit DATA-01 i oba exporty
    // DATA-06 (značené trasy, výchozí body) — starší exporty jižní pás
    // nemají.
    bbox: { latMin: 50.7, lngMin: 15.05, latMax: 51.02, lngMax: 15.45 },
    // Jižní hranu 3D okna drží stejně nízko jako okno dotazu: první běh
    // DATA-01 (28. 7. 2026) našel na jihozápadním úbočí nad Lučany
    // a Bedřichovem tři chaty z deseti (Barbora, Koryna, Lučanka) a užší okno
    // 50.78 by je z modelu tiše vyřízlo. Terén tam pořád stoupá, není to
    // město. Rozšíření na 50.73 (29. 7. 2026) drželo stejné pravidlo pro
    // Štěpánku a Maják; 2. 8. 2026 hrana klesla na 50.70 spolu s oknem
    // dotazu (Černá studnice na Černostudničním hřebeni).
    bbox3d: { latMin: 50.7, lngMin: 15.1, latMax: 50.98, lngMax: 15.42 },
    poznamka: 'druhá oblast (rozhodnutí Michala 28. 7. 2026) — přeshraniční s Górami Izerskimi',
    katalogPohori: ['Jizerské hory', 'Góry Izerskie'],
  },
  {
    slug: 'jestedsky-hrbet',
    nazev: 'Ještědský hřbet',
    zeme: ['CZ'],
    /**
     * Okno kryje VLASTNÍ Ještědský hřbet — od Rozstání a Kryštofova údolí na
     * severozápadě po Hodkovice nad Mohelkou na jihovýchodě, s Ještědem
     * (50.73, 14.98), Rašovkou a Plánemi pod Ještědem uprostřed.
     *
     * Dvě vědomá rozhodnutí:
     * (1) OKRAJ LIBERCE JE VEVNITŘ. Hřbet se zvedá přímo nad městem; bez
     *     městského okraje by okno minulo dolní stanici lanovky i parkoviště,
     *     odkud se na Ještěd chodí. Že dotaz přinese i pár městských hospod
     *     s „chatou" v názvu, vyřeší triáž — ořez okna by naopak vyřízl
     *     doložené výchozí body.
     * (2) KOZÁKOV VEVNITŘ NENÍ. Ještědsko-kozákovský hřbet je dlouhý bezmála
     *     60 km a jeho jihovýchodní část (Kozákov 744 m) vedeme u Českého
     *     ráje — Riegrova chata na Kozákově je tam kandidátem od dřívějška
     *     a tohle okno to nemění.
     */
    bbox: { latMin: 50.62, lngMin: 14.8, latMax: 50.84, lngMax: 15.12 },
    // 3D okno o kus užší: severozápadní i jihovýchodní konec hřbetu už
    // klesá do podhůří a model by z něj měl hlavně roviny.
    bbox3d: { latMin: 50.64, lngMin: 14.85, latMax: 50.82, lngMax: 15.08 },
    poznamka: 'třetí oblast (rozhodnutí Michala 30. 7. 2026) — Ještěd nepatří do Jizerek, je to jiná geomorfologická jednotka',
    katalogPohori: ['Ještědský hřbet'],
  },
  {
    slug: 'sumava',
    nazev: 'Šumava',
    // Čtvrtá oblast (rozhodnutí Michala 4. 8. 2026: „pustíme se do šumavy
    // + bavorskou část, budeme muset založit německo"). Princip „pohoří
    // vcelku": česká strana + Bavorský les. RAKOUSKÁ strana (Böhmerwald)
    // je zatím VĚDOMĚ MIMO — Michalovo zadání jmenuje jen bavorskou část;
    // katalog vede jediný rakouský objekt (Helfenberger Hütte), který na
    // tohle rozhodnutí čeká — poznámka v data/oblasti/sumava.yaml.
    zeme: ['CZ', 'DE'],
    /**
     * Okno je NEJVĚTŠÍ v korpusu (~0,9° × 1,9°): Šumava se táhne 120 km od
     * Všerubského průsmyku po Vyšebrodsko a bavorská strana přidává pás od
     * Waldmünchenu (Berggasthof Gibacht, 49,36 / 12,66 — nejseverozápadnější
     * objekt katalogu) po Dreisessel (48,78 / 13,80). Jihovýchod drží českou
     * stranu k Vítkovu kameni (~48,60 / 14,28). Velikost okna není problém
     * dotazu — Overpass jede přes průnik area státu × okno s tagovými
     * filtry; kdyby běh přesto padal na timeout, dělí se po zemích už teď
     * (každá země = vlastní dotaz).
     */
    bbox: { latMin: 48.5, lngMin: 12.55, latMax: 49.4, lngMax: 14.45 },
    // 3D okno téměř celé okno dotazu — poučení z Krkonoš (Kochanówka):
    // užší model by tiše vyřízl budoucí profily na okrajích. Cena: mřížka
    // 240×144 je nad takhle velkým oknem hrubší než u menších pohoří
    // (~600 m na buňku proti ~200 m u Krkonoš) — pro poster to stačí,
    // ladění hustoty až nad ostrými daty.
    bbox3d: { latMin: 48.52, lngMin: 12.6, latMax: 49.38, lngMax: 14.4 },
    poznamka:
      'čtvrtá oblast (rozhodnutí Michala 4. 8. 2026) — přeshraniční s Bavorským lesem; rakouská strana zatím mimo',
    // Böhmerwald (jediný rakouský řádek katalogu) sem VĚDOMĚ nepatří:
    // dohledávka podle jmen by hledala objekt v zemi, na kterou se dotaz
    // neptá, a mimo okno — doložený miss bez užitku.
    katalogPohori: ['Šumava', 'Bayerischer Wald'],
  },
  {
    slug: 'beskydy',
    nazev: 'Beskydy',
    // Pátá oblast (pověření Michala 8. 8. 2026: „můžeš se pustit do beskyd
    // a jeseníku"). Podklad pro volbu je Michalovo měření z 28. 7. 2026,
    // podle kterého Beskydy vedou — a jeho číslo 35 objektů se v externím
    // katalogu skládá přesně z Moravskoslezských Beskyd (18), Beskidu
    // Śląskiego (8) a Beskidu Żywieckiego (9). Tři země: Slovensko bylo do
    // typu ZemeIso přidáno 30. 7. 2026 dopředu právě na Beskydy („beskydy
    // budou mít část na Slovensku").
    zeme: ['CZ', 'PL', 'SK'],
    /**
     * Okno kryje celé ZÁPADNÍ BESKYDY, ne jen geomorfologický celek
     * „Moravskoslezské Beskydy". Kotvy okna jsou doložené souřadnice
     * krajních objektů a vrcholů (prameny v data/oblasti/beskydy.yaml):
     *   západ  18.00 — Vsacký Cáb (49.386 / 18.088), nejzápadnější objekt
     *                  katalogu v celku
     *   východ 19.75 — Hala Krupowa (49.625 / 19.653) a Polica
     *                  (49.623 / 19.619) na východním konci Żywieckiego
     *   sever  49.85 — Szyndzielnia (49.753 / 18.999) nad Bielskem-Białou
     *   jih    49.25 — Kohútka (49.293 / 18.229) v Javorníkách
     *
     * Vědomé rozhodnutí o ROZSAHU OKNA (ne o publikaci!): dovnitř se berou
     * i Javorníky a Vsetínské vrchy, které podle geomorfologického členění
     * NEJSOU součástí celku Moravskoslezské Beskydy — jsou to souřadné
     * celky v rámci nadřazené podsoustavy Západní Beskydy. Katalog v nich
     * drží sedm objektů s doloženým stravováním (Kohútka, Portáš, Čarták,
     * Vsacký Cáb, Kusalíno, Kmínek, Čerenka) a užší okno by je tiše
     * vyřízlo. Bbox je jen vyhledávací okno; jestli ty objekty do
     * PRŮVODCE patří jako Beskydy, nebo mají mít vlastní oblast po vzoru
     * Ještědského hřbetu, je rozhodnutí o rozsahu → Michal (otázka
     * v deníku 8. 8. 2026). Do té doby platí pravidlo z Ještědu naruby:
     * radši je najít a nechat ve frontě než je nenajít vůbec.
     *
     * Okno zahrne i okraje Bielska-Białej a Żywce. Že dotaz přinese
     * i městské hospody, vyřeší triáž — vzor okraje Liberce v okně
     * Ještědského hřbetu.
     */
    bbox: { latMin: 49.25, lngMin: 18.0, latMax: 49.85, lngMax: 19.75 },
    // 3D okno o kus užší z obou stran: západní konec (Vsetínské vrchy)
    // a východní (Orawa pod Policí) už klesají do podhůří a kotlin.
    bbox3d: { latMin: 49.3, lngMin: 18.1, latMax: 49.78, lngMax: 19.65 },
    poznamka:
      'pátá oblast (pověření Michala 8. 8. 2026) — Západní Beskydy vcelku přes tři země; rozsah vůči Javorníkům a Vsetínským vrchům čeká na rozhodnutí',
    /**
     * Katalogové názvy jednotek, které okno kryje. Je jich devět, protože
     * „Beskydy" nejsou v katalogu jedno pohoří, ale skupina celků — a bez
     * všech devíti by dohledávka podle jmen (DATA-01, druhý dotaz) minula
     * právě ty objekty, které OSM tagovalo civilně.
     */
    katalogPohori: [
      'Moravskoslezské Beskydy',
      'Beskid Śląski',
      'Beskid Żywiecki',
      'Slezské Beskydy',
      'Jablunkovské mezihoří',
      'Kysucké Beskydy',
      'Oravské Beskydy',
      'Javorníky',
      'Vsetínské vrchy',
    ],
  },
  {
    slug: 'jeseniky',
    nazev: 'Jeseníky',
    // Šestá oblast (pověření Michala 8. 8. 2026, tentýž pokyn jako
    // u Beskyd). Přeshraniční s polskou stranou Sudet.
    zeme: ['CZ', 'PL'],
    /**
     * Okno kryje jesenickou oblast od Králického Sněžníku po Zlatohorskou
     * vrchovinu. Kotvy (prameny v data/oblasti/jeseniky.yaml):
     *   západ  16.75 — Králický Sněžník / Śnieżnik (50.207 / 16.847);
     *                  rezerva na západní úbočí masivu
     *   východ 17.55 — Zlatohorská vrchovina za Biskupskou kupou
     *                  (50.256 / 17.430)
     *   sever  50.42 — severní konec Rychlebských hor u Javorníku a polské
     *                  Góry Opawskie nad Biskupskou kupou
     *   jih    49.93 — sedlo Skřítek (49.990 / 17.163) a Hraběšická
     *                  hornatina pod ním
     *
     * CO JE VĚDOMĚ MIMO OKNO: polské Góry Bystrzyckie (katalog tam vede
     * Schronisko Jagodna 50.252 / 16.565 a Schronisko Pod Muflonem). Leží
     * ZÁPADNĚ od Śnieżnika ve Středních Sudetech a do jesenické oblasti je
     * nepřiřazuje žádný pramen, který jsme našli — je to rozhodnutí
     * o rozsahu → Michal. Zapisuje se to sem výslovně, aby to nebyl tichý
     * miss: vzor rakouské strany Šumavy, která je taky mimo okno
     * a s poznámkou. Nízký Jeseník na východě sem nepatří vůbec (jiný
     * celek, ne hory v našem smyslu).
     */
    bbox: { latMin: 49.93, lngMin: 16.75, latMax: 50.42, lngMax: 17.55 },
    // 3D okno mírně užší — severní konec Rychlebských hor u Javorníku už
    // klesá do slezské nížiny.
    bbox3d: { latMin: 49.96, lngMin: 16.8, latMax: 50.34, lngMax: 17.5 },
    poznamka:
      'šestá oblast (pověření Michala 8. 8. 2026) — jesenická oblast vcelku vč. polské strany; Góry Bystrzyckie vědomě mimo okno',
    katalogPohori: [
      'Hrubý Jeseník',
      'Zlatohorská vrchovina',
      'Hraběšická hornatina',
      'Rychlebské hory',
      'Králický Sněžník',
      'Masyw Śnieżnika',
      'Góry Opawskie',
    ],
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

/**
 * Země, po kterých se oblast dotazuje — z konfigurace, ne napevno. Ještědský
 * hřbet je celý v Česku, takže polský dotaz by u něj byl jen prázdný soubor
 * navíc; přeshraniční pohoří mají v `zeme` obě.
 */
export const zemeDotazu = (o: OblastKonfig): { zeme: Lowercase<ZemeIso>; iso: ZemeIso }[] =>
  o.zeme.map((iso) => ({ zeme: iso.toLowerCase() as Lowercase<ZemeIso>, iso }))

/**
 * Kde v repu leží data oblasti. Jedno místo pro celou pipeline DATA-06 —
 * cesty byly do 30. 7. 2026 v každém kroku zvlášť a všechny napevno na
 * „krkonose", takže se oblast nedala vybrat (výtka Michala: „u data-06 nejde
 * vybrat oblast"). Půl generalizace by byla horší než žádná: krok 1 by stáhl
 * Jizerky a krok 3 by pak tiše routoval Krkonoše.
 */
export const cestyOblasti = (slug: string) => ({
  trasy: join(process.cwd(), 'data', 'trasy', slug),
  oblast: join(process.cwd(), 'data', 'oblasti', slug),
  chaty: join(process.cwd(), 'data', 'chaty', slug),
  // Střediska (F1e) — přibylo 4. 8. 2026 kvůli DATA-35 (výška obce
  // z referenčního bodu); do té doby si cestu skládal každý skript sám.
  strediska: join(process.cwd(), 'data', 'strediska', slug),
})
