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
     * Okno kryje BESKYDY V UŽŠÍM SMYSLU — hřebenový celek od Vsetínska
     * (Moravskoslezské Beskydy) přes polský Beskid Śląski a Żywiecki až po
     * Babí horu, s kysuckou a oravskou stranou. Kotvy jsou doložené
     * souřadnice krajních objektů a vrcholů (prameny
     * v data/oblasti/beskydy.yaml):
     *   západ  18.05 — Veřovické vrchy nad Frenštátem, západní výběžek
     *                  Moravskoslezských Beskyd
     *   východ 19.75 — Hala Krupowa (49.625 / 19.653) a Polica
     *                  (49.623 / 19.619) na východním konci Żywieckiego
     *   sever  49.85 — Szyndzielnia (49.753 / 18.999) nad Bielskem-Białou
     *   jih    49.30 — Wielka Racza / Veľká Rača (49.413 / 18.968)
     *                  s dvanáctikilometrovou rezervou
     *
     * JAVORNÍKY A VSETÍNSKÉ VRCHY SEM UŽ NEPATŘÍ — rozhodnutí Michala
     * 8. 8. 2026: *„javorniky a vsetinske vrchy bych udelal jako jednu
     * samostatnou oblast (jestedsky hrbet jsme taky nepripojili
     * k jizerkam)"*. Mají vlastní oblast `javorniky-vsetinske-vrchy` níž
     * a jejich dva katalogové názvy se odsud přesunuly tam. Jižní hrana
     * okna se proto zvedla z 49.25 na 49.30 a západní z 18.00 na 18.05.
     *
     * PŘEKRYV OBOU OKEN JE ZÁMĚRNÝ, ne nedbalost: pás 49.30–49.47 /
     * 18.05–18.50 kryjí obě oblasti, protože právě tam se obě pohoří
     * potkávají (Rožnovská Bečva, Soláň) a ostrý řez by na hranici tiše
     * vyřízl objekty. Duplicity řeší kandidátní triáž, ne ořez okna —
     * stejně jako u překryvu Krkonoš a Jizerek v okolí Jizerky
     * a Harrachova.
     *
     * Okno zahrne i okraje Bielska-Białej a Żywce. Že dotaz přinese
     * i městské hospody, vyřeší triáž — vzor okraje Liberce v okně
     * Ještědského hřbetu.
     */
    bbox: { latMin: 49.3, lngMin: 18.05, latMax: 49.85, lngMax: 19.75 },
    // 3D okno o kus užší z obou stran: východní konec (Orawa pod Policí)
    // už klesá do kotlin.
    bbox3d: { latMin: 49.34, lngMin: 18.1, latMax: 49.78, lngMax: 19.65 },
    poznamka:
      'pátá oblast (pověření Michala 8. 8. 2026) — Beskydy v užším smyslu přes tři země; Javorníky a Vsetínské vrchy mají od 8. 8. 2026 vlastní oblast',
    /**
     * Katalogové názvy jednotek, které okno kryje. Je jich sedm, protože
     * „Beskydy" nejsou v katalogu jedno pohoří, ale skupina celků — a bez
     * všech sedmi by dohledávka podle jmen (DATA-01, druhý dotaz) minula
     * právě ty objekty, které OSM tagovalo civilně. Javorníky a Vsetínské
     * vrchy tu vědomě NEJSOU, viz rozhodnutí výš.
     */
    katalogPohori: [
      'Moravskoslezské Beskydy',
      'Beskid Śląski',
      'Beskid Żywiecki',
      'Slezské Beskydy',
      'Jablunkovské mezihoří',
      'Kysucké Beskydy',
      'Oravské Beskydy',
    ],
  },
  {
    slug: 'javorniky-vsetinske-vrchy',
    nazev: 'Javorníky a Vsetínské vrchy',
    // Sedmá oblast — ROZHODNUTÍ MICHALA 8. 8. 2026, doslova: „javorniky
    // a vsetinske vrchy bych udelal jako jednu samostatnou oblast
    // (jestedsky hrbet jsme taky nepripojili k jizerkam)". Otázka na to
    // padla v deníku téhož dne: Javorníky patří geomorfologicky do
    // Slovensko-moravských Karpat, ne do Moravskoslezských Beskyd, a to je
    // týž důvod, proč Ještěd nespadl pod Jizerky.
    zeme: ['CZ', 'SK'],
    /**
     * Okno kryje hraniční hřeben Javorníků i Vsetínské vrchy, tedy pás
     * mezi Vsetínem a Makovem. Kotvy jsou doložené souřadnice (prameny
     * v data/oblasti/javorniky-vsetinske-vrchy.yaml):
     *   západ  17.95 — Vsetín (49.339 / 17.996) pod hřebenem Vsetínských
     *                  vrchů; město je vevnitř schválně, viz níž
     *   východ 18.50 — Kmínek (49.385 / 18.448) a Makov (49.356 / 18.434)
     *                  na slovenské straně Javorníků
     *   sever  49.47 — Vysoká (49.404 / 18.362), nejvyšší vrchol
     *                  Vsetínských vrchů, a Soláň (49.394 / 18.250);
     *                  hrana leží v dolině Rožnovské Bečvy
     *   jih    49.15 — Střelná (49.177 / 18.098) na jihozápadním konci
     *                  javornického hřebene
     *
     * DVĚ VĚDOMÁ ROZHODNUTÍ. (1) VSETÍN JE VEVNITŘ. Hřeben Vsetínských
     * vrchů se zvedá přímo nad městem a chata Vsacký Cáb i Kusalíno se
     * z něj chodí; bez městského okraje by okno minulo výchozí body.
     * Že dotaz přinese i městské hospody, vyřeší triáž — vzor okraje
     * Liberce v okně Ještědského hřbetu. (2) OKNO SE PŘEKRÝVÁ
     * S BESKYDSKÝM v pásu 49.30–49.47 / 18.05–18.50, kde obě pohoří
     * hraničí. Je to úmysl: ostrý řez na hranici dvou pohoří tiše vyřízne
     * objekty, které leží na sedle mezi nimi. Duplicity řeší triáž.
     */
    bbox: { latMin: 49.15, lngMin: 17.95, latMax: 49.47, lngMax: 18.5 },
    // 3D okno bez městského okraje Vsetína a bez jihozápadního konce
    // hřebene u Střelné, kde už terén klesá k Vlárskému průsmyku.
    bbox3d: { latMin: 49.18, lngMin: 18.0, latMax: 49.45, lngMax: 18.46 },
    poznamka:
      'sedmá oblast (rozhodnutí Michala 8. 8. 2026) — Javorníky a Vsetínské vrchy jako jedna samostatná oblast, ne pod Beskydy; vzor Ještědského hřbetu vůči Jizerkám',
    katalogPohori: ['Javorníky', 'Vsetínské vrchy'],
  },
  {
    slug: 'mala-fatra',
    nazev: 'Malá Fatra',
    /**
     * Osmá oblast — POKYN MICHALA 8. 8. 2026: „kandidaty budoucich oblasti
     * nech a rovnou je zaloz". Beskydský export DATA-01 totiž běžel podle
     * ještě širokého okna a přinesl 59 kandidátů z Malé Fatry (Terchová,
     * Biely Potok, Zázrivá). Michal rozhodl je nemazat a oblast rovnou
     * založit — takže na rozdíl od ostatních oblastí tahle vzniká S DATY,
     * ne kvůli nim.
     */
    zeme: ['SK'],
    /**
     * Okno kryje OBĚ ČÁSTI Malé Fatry, které od sebe u Strečna odděluje
     * Váh — Krivánskou na severu a Lúčanskou na jihu. Kotvy jsou doložené
     * souřadnice (prameny v data/oblasti/mala-fatra.yaml):
     *   západ  18.70 — Žilina (49.22 / 18.73) na severozápadním úpatí
     *   východ 19.22 — Zázrivá (49.27 / 19.15) na východním okraji
     *   sever  49.35 — nejsevernější kandidáti nad Terchovou (49.296)
     *   jih    49.02 — Martin (49.065 / 18.922) pod Lúčanskou částí
     *
     * OBĚ MĚSTA JSOU VEVNITŘ SCHVÁLNĚ (Žilina, Martin): Malá Fatra se
     * zvedá přímo nad nimi a jsou to výchozí body na hřeben — vzor okraje
     * Liberce u Ještědu a Vsetína u Vsetínských vrchů. Městské podniky
     * vyřeší triáž.
     *
     * PŘEKRYV S ORAVSKOU MAGUROU v pásu 19.10–19.22 je záměrný: obec
     * Zázrivá leží přesně na hranici obou pohoří (nad ní Veľký Rozsutec,
     * za ní Paráč a Minčol), takže ostrý řez by objekty v dolině vyřízl.
     */
    bbox: { latMin: 49.02, lngMin: 18.7, latMax: 49.35, lngMax: 19.22 },
    // 3D okno bez městských okrajů Žiliny a Martina, kde už terén klesá
    // do Turčianské a Žilinské kotliny.
    bbox3d: { latMin: 49.05, lngMin: 18.75, latMax: 49.32, lngMax: 19.18 },
    poznamka:
      'osmá oblast (pokyn Michala 8. 8. 2026 „kandidáty budoucích oblastí nech a rovnou je založ") — vznikla s 59 kandidáty z beskydského exportu',
    katalogPohori: ['Malá Fatra', 'Lúčanská Malá Fatra'],
  },
  {
    slug: 'oravska-magura',
    nazev: 'Oravská Magura',
    // Devátá oblast, týž pokyn Michala 8. 8. 2026 — přišla s ní šestice
    // kandidátů z beskydského exportu (Zázrivá, Kubínska hoľa, Sedliacka
    // Dubová). Je to nejmenší oblast korpusu; kdyby ji Michal chtěl radši
    // sloučit s Malou Fatrou nebo s Beskydami, je to otázka v deníku.
    zeme: ['SK'],
    /**
     * Okno kryje všechny tři podcelky Oravské Magury — Paráč, Kubínsku
     * hoľu a Budín — mezi Malou Fatrou na západě a Oravskými Beskydami
     * na severu. Kotvy (prameny v data/oblasti/oravska-magura.yaml):
     *   západ  19.10 — Zázrivá (49.27 / 19.15) na západním okraji,
     *                  s rezervou do doliny
     *   východ 19.50 — Sedliacka Dubová (49.271 / 19.422) a Oravský
     *                  Podzámok (49.27 / 19.37)
     *   sever  49.42 — podcelek Paráč a Hruštínska hoľa nad Zákamenným
     *   jih    49.18 — Dolný Kubín (49.21 / 19.30) pod Kubínskou hoľou
     */
    bbox: { latMin: 49.18, lngMin: 19.1, latMax: 49.42, lngMax: 19.5 },
    bbox3d: { latMin: 49.2, lngMin: 19.14, latMax: 49.4, lngMax: 19.46 },
    poznamka:
      'devátá oblast (pokyn Michala 8. 8. 2026) — nejmenší oblast korpusu, vznikla se šesticí kandidátů z beskydského exportu',
    katalogPohori: ['Oravská Magura'],
  },
  {
    slug: 'zapadne-tatry',
    nazev: 'Západné Tatry',
    // Desátá oblast, týž pokyn Michala 8. 8. 2026 — přišla s ní třináctka
    // kandidátů z beskydského exportu (Zuberec, Oravský Biely Potok,
    // Oravice). PRVNÍ VYSOKOHORSKÁ OBLAST PRŮVODCE: hlavní hřeben má
    // podle pramene 31 dvoutisícovek, což je jiná liga než dosavadní
    // středohory — a bude to znamenat i jiná data (útulny, sedla,
    // sezónní uzávěry, horská služba).
    zeme: ['SK', 'PL'],
    /**
     * Okno kryje slovenské Západné Tatry (Roháče, Liptovské hole, Sivý
     * vrch, Osobitá, Červené vrchy) i polské Tatry Zachodnie s dolinami
     * Chochołowskou a Kościeliskou. Kotvy (prameny
     * v data/oblasti/zapadne-tatry.yaml):
     *   západ  19.48 — Oravský Biely Potok (49.273 / 19.561) a nejzápadnější
     *                  kandidát (19.525), s rezervou na Sivý vrch
     *   východ 19.95 — polská hranice Západních Tater u Liliového sedla;
     *                  schroniska na Hali Ornak (19.859) a Polanie
     *                  Chochołowskiej (19.789) jsou vevnitř
     *   sever  49.36 — Oravice (49.295 / 19.757) a Rów Podtatrzański
     *   jih    49.10 — podhorské obce Liptova, Pribylina (49.152 / 19.843)
     *
     * DVĚ VĚDOMÁ ROZHODNUTÍ. (1) ZAKOPANÉ JE VENKU. Leží na 49.300 /
     * 19.950, tedy přesně na hraně, a je to město pod VYSOKÝMI Tatrami,
     * ne pod Západními; jeho pensiony by okno zaplavily. U Žiliny
     * a Vsetína se město dovnitř bralo, protože se hory zvedají přímo nad
     * nimi — tady to tak není. (2) LIPTOVSKÝ MIKULÁŠ JE TAKY VENKU
     * (49.073 / 19.625): leží v Liptovské kotlině deset kilometrů od
     * úpatí, kdežto podhorské obce (Pribylina, Žiar) okno kryje.
     */
    bbox: { latMin: 49.1, lngMin: 19.48, latMax: 49.36, lngMax: 19.95 },
    // 3D okno bez severního podhůří (Rów Podtatrzański) a bez liptovského
    // úpatí — model má být o hřebeni.
    bbox3d: { latMin: 49.13, lngMin: 19.52, latMax: 49.33, lngMax: 19.92 },
    poznamka:
      'desátá oblast (pokyn Michala 8. 8. 2026) — první vysokohorská oblast průvodce, přeshraniční s polskými Tatry Zachodnie',
    katalogPohori: ['Západní Tatry', 'Tatry Zachodnie'],
  },
  {
    slug: 'vysoke-tatry',
    nazev: 'Vysoké Tatry',
    /**
     * Jedenáctá oblast — POKYN MICHALA 8. 8. 2026: „kdyz uz jsme na
     * slovensku, vezmi rovnou i vysoke a nizke tatry". Je to zdaleka
     * nejcennější chatařská síť, jakou průvodce dosud bral: externí katalog
     * vede na slovenské straně 14 vysokohorských chat a na polské 4
     * schroniska PTTK, a u většiny je doložený rok vzniku i to, kdo je
     * postavil (Uhorský karpatský spolok, Karpathenverein, Klub
     * československých turistov, Towarzystwo Tatrzańskie).
     *
     * ROZSAH: Východné Tatry vcelku, tedy Vysoké Tatry i Belianske Tatry,
     * které od sebe dělí Kopské sedlo — TANAP je vede jako dva podcelky
     * jednoho celku a katalog s tím zachází stejně (Chatu Plesnivec
     * v Belianskych Tatrách řadí pod Vysoké Tatry). Polská strana je
     * součástí dle principu „pohoří vcelku".
     */
    zeme: ['SK', 'PL'],
    /**
     * Kotvy okna jsou doložené souřadnice (prameny
     * v data/oblasti/vysoke-tatry.yaml):
     *   západ  19.93 — Ľaliové (Liliowe) sedlo (49.225 / 19.992), které je
     *                  dle TANAPu hranicí Východných a Západných Tater,
     *                  a Kasprowy Wierch (49.232 / 19.982)
     *   východ 20.40 — Kežmarské Žľaby (49.195 / 20.299) a východní úpatí
     *                  Belianskych Tater
     *   sever  49.35 — Zakopané (49.300 / 19.950) a Ždiar (49.271 / 20.261)
     *   jih    49.09 — pás tatranských osad: Štrbské Pleso (49.117 /
     *                  20.067), Starý Smokovec (49.142), Tatranská Lomnica
     *                  (49.167)
     *
     * TŘI VĚDOMÁ ROZHODNUTÍ. (1) ZAKOPANÉ JE VEVNITŘ — a je to tatáž úvaha,
     * kvůli které je u Západných Tater venku: je to město pod VYSOKÝMI
     * Tatrami, výchozí bod k Morskiemu Oku i na Halu Gąsienicową. (2)
     * POPRAD JE VENKU (49.059 / 20.298): leží v Popradské kotlině deset
     * kilometrů od úpatí, kdežto pás tatranských osad okno kryje — stejné
     * pravidlo jako u Liptovského Mikuláše. (3) PŘEKRYV SE ZÁPADNÝMI
     * TATRAMI v pásu 19.93–19.95 je záměrný: hranice obou pohoří vede
     * Ľaliovým sedlem a ostrý řez by v sedle vyřízl objekty.
     */
    bbox: { latMin: 49.09, lngMin: 19.93, latMax: 49.35, lngMax: 20.4 },
    // 3D okno bez podhorského pásu a bez okraje Zakopaného — model má být
    // o hřebeni, a ten je tady nejdramatičtější z celého korpusu.
    bbox3d: { latMin: 49.11, lngMin: 19.96, latMax: 49.32, lngMax: 20.35 },
    poznamka:
      'jedenáctá oblast (pokyn Michala 8. 8. 2026) — Východné Tatry vcelku (Vysoké i Belianske) přes dvě země; nejbohatší chatařská síť korpusu',
    katalogPohori: ['Vysoké Tatry', 'Tatry Wysokie'],
  },
  {
    slug: 'nizke-tatry',
    nazev: 'Nízké Tatry',
    /**
     * Dvanáctá oblast, týž pokyn Michala 8. 8. 2026. Katalog v ní vede
     * 14 objektů, a z nich ČTYŘI ÚTULNY — Ďurková, Andrejcová, Ramža
     * a Hiadeľské sedlo. To je pro průvodce zvlášť cenné, protože typ
     * `utulna` má v číselníku od začátku, ale doložených útulen měl dosud
     * jen pár; tady jich přichází celá skupina a u dvou je doložený VOLNÝ
     * přístup bez rezervace, což je přesně to, na čem klíč zařazení
     * u útulny stojí.
     *
     * JMÉNO: nominativ je zapsaný česky („Nízké Tatry"), ne slovensky
     * („Nízke Tatry"). Důvod je jazykový, ne nedbalost — název je v češtině
     * plně zdomácnělý a průvodce je psaný česky, takže věty jako „v Nízkých
     * Tatrách" musejí znít přirozeně. Slovenský tvar patří do aliasů.
     * U Západných Tater se to rozhodlo naopak (slovenský tvar), protože
     * tam čeština ustálený vlastní tvar nemá.
     */
    zeme: ['SK'],
    /**
     * Okno kryje celý osmdesát kilometrů dlouhý hřeben od Donovalů po
     * Kráľovu hoľu, tedy oba podcelky — Ďumbierske i Kráľovohoľské Tatry,
     * které dělí sedlo Čertovica. Kotvy (prameny
     * v data/oblasti/nizke-tatry.yaml):
     *   západ  19.18 — Donovaly (48.883 / 19.233) a Prašivá (48.876 /
     *                  19.318) na západním konci hřebene
     *   východ 20.35 — Vernár (48.92 / 20.27) a Telgárt (48.852 / 20.188)
     *                  za Kráľovou hoľou (48.883 / 20.133)
     *   sever  49.12 — liptovské úpatí, Chata Opalisko (49.045 / 19.642)
     *                  a Demänovská dolina (48.97 / 19.58)
     *   jih    48.78 — Brezno (48.804 / 19.636) pod Ďumbierom
     *
     * DVĚ MĚSTA JSOU VENKU a je to totéž pravidlo jako u Popradu:
     * Banská Bystrica (48.739 / 19.149) leží dvacet kilometrů od úpatí
     * a Liptovský Mikuláš (49.081 / 19.622) v Liptovské kotlině — okno
     * kryje podhorské obce, ne kotlinová města.
     */
    bbox: { latMin: 48.78, lngMin: 19.18, latMax: 49.12, lngMax: 20.35 },
    bbox3d: { latMin: 48.81, lngMin: 19.22, latMax: 49.08, lngMax: 20.3 },
    poznamka:
      'dvanáctá oblast (pokyn Michala 8. 8. 2026) — osmdesátikilometrový hřeben od Donovalů po Kráľovu hoľu; katalog v ní vede čtyři útulny',
    katalogPohori: ['Nízké Tatry'],
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
