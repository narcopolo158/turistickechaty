# Šumava — triážní podklad (krok 0)

Vzniklo 4. 8. 2026 večer, hned po doběhu DATA-01 (337 kandidátů: 96 CZ +
241 DE) a DATA-28 (z jeho vrstvy dopočteno 25 lanovek pro pěší ze 184 prvků
`aerialway`; 159 vleků mimo přehled). Účel: aby triáž v příštích sessions
nezačínala od nuly, ale od katalogem podložené fronty. **Nic tu není
rozhodnuto** — každé povýšení chce křížové ověření vzorem DATA-03.

Pozor na měřítko: 241 německých kandidátů je hlavně důsledek velkého okna
a hustého bavorského osídlení — budou mezi nimi penziony, apartmány
a pekárny (dotaz jménem chytá i `Bäckerei Hutterer`). Triáž bude víc
o vyřazování než u Jizerek; klíč zařazení (role na trase + občerstvení pro
veřejnost + turistická minulost) platí beze změny.

## Tier 1 — kandidáti s oporou v katalogu (21 z 27)

Jmenná shoda exportu s katalogem (u šesti se OSM jméno liší — v závorce):

| Katalog | Kandidát |
|---|---|
| Chata KČT Prášily | `chata-kct-prasily` |
| Klostermannova chata | `klostermannova-chata` |
| Hotel Alpská vyhlídka | `alpska-vyhlidka` |
| Hotel Belveder | `belveder` |
| Turnerova chata | `turnerova-chata` |
| Horský hotel Rovina | `chata-rovina` *(OSM: „Chata Rovina")* |
| Horský hotel Churáňov | `chata-churanov` *(OSM: „Chata Churáňov")* |
| Arberschutzhaus | `arberschutzhaus` |
| Eisensteiner Hütte | `eisensteiner-hutte` |
| Falkensteinschutzhaus | `falkenstein-schutzhaus` *(OSM: „Falkenstein-Schutzhaus")* |
| Lusenschutzhaus | `lusenschutzhaus` |
| Osserschutzhaus | `osserschutzhaus` |
| Kötztinger Hütte | `kotztinger-hutte` |
| Chamer Hütte | `chamer-hutte` |
| Berghütte Schareben | `berghutte-schareben` |
| Landshuter Haus | `landshuter-haus` |
| Berggasthof Dreisessel | `berggasthof-dreisessel` |
| Waldschmidthaus | `waldschmidthaus` |
| Berghaus Sonnenfels | `berghaus-sonnenfels` |
| Berggasthof Eck | `berggasthof-eck` |
| Berggasthof Mooshütte | `berghotel-mooshutte` *(OSM: „Berghotel Mooshütte" — rozdíl gasthof/hotel PROVĚŘIT, může to být přejmenování i jiný dům)* |

## Katalogové objekty BEZ kandidáta (6 z 27 — k 6. 8. 2026 zbývají 4)

> **Dohledávka 5. 8. 2026 (blok 8):** České weby jsou ze sandboxu plošně
> nedosažitelné — pancir.cz (permission gate), antygl.cz (robots 500),
> zadov.cz (timeout), hotelrovina.cz (mrtvá doména — ověřil Michal).
> Dohledávka šestice proto stojí na katalogu a čeká na lidský krok nebo
> Actions. **Nová otázka k Bučině:** katalog vede „Horská chata Bučina"
> (HUT-0109, 1170 m) VEDLE „Hotel Alpská vyhlídka" (HUT-0104, 1070 m,
> adresa Bučina 149) — dvě různé výšky naznačují DVA objekty v zaniklé
> Bučině, ne jeden; neztotožňovat bez pramene. Oprava: Berggasthof Eck
> kandidáta MÁ (povýšen v bloku 7) — bez kandidáta zbývá z DE jen
> Gibacht (HUT-0292, bez webu v katalogu).

> **Dohledávka 6. 8. 2026 (denní session): GIBACHT VYŘEŠEN a povýšen**
> (`data/chaty/sumava/berggasthof-gibacht.yaml`) — bez kandidáta, vzor
> Pancíře. Prameny: seznam turistických domů Bavorského turistického
> svazu (wanderverband-bayern.de) + vlastní web domu (berghofgibacht.de,
> ze sandboxu se načetl) + turistický popis okruhu. **Katalogových
> 934 m je výška HORY, ne domu** — popis okruhu vede Gibacht 934 m,
> Kreuzfelsen 932 m a parkoviště u hostince 850 m, svaz i vlastní web
> mají u domu 845 m; zapsáno 845 m. **GPS chybí** (v exportu není, živý
> dotaz na Overpass ze sandboxu neprojde — HTTP 000) → profil se
> nezobrazí na mapě a nedostane přístupové trasy. **Otevřená otázka:
> tři domény** (berghofgibacht.de × berghof-gibacht.de dle svazu ×
> glasschmiede-gibacht.de „Wirtshaus und Kunstgalerie") — vzor
> Dreisesselu, na jeden telefonát. Bez kandidáta zbývají **čtyři, všechny
> CZ**: Zlatá Studna, Špičák, Antýgl, Bučina.


Export je nenašel ani dohledávkou podle jmen — dohledat ručně nebo DATA-31:

- ~~**Horská chata Pancíř** (CZ)~~ — VYŘEŠENO 5. 8. 2026 (povýšena
  s obsahem vlastního webu od Michala; chata a rozhledna jeden objekt).
- **Chata Zlatá Studna** (CZ, Horská Kvilda) — v exportu není vůbec.
- **Chata na Špičáku** (CZ) — export má jen `rozhledna-spicak`; vztah
  PROVĚŘIT (jiná stavba na témže vrchu?).
- **Antýgl** (CZ, Srní) — bývalý královácký dvorec, dnes kemp s bufetem;
  v exportu není (OSM ho zřejmě tahuje jako kemp — mimo naše tagy).
- **Horská chata Bučina** (CZ, Kvilda) — v exportu není.
- ~~**Berggasthof Gibacht** (DE, Waldmünchen)~~ — VYŘEŠENO 6. 8. 2026
  (povýšeno bez kandidáta; GPS dál chybí, doplnit z Actions nebo ručně
  z OSM — pak zařadit do dalšího běhu tras DATA-06).

## Lanovky (hotovo, data/lanovky/sumava.json)

25 drah pro pěší — nejdelší LD Krasetín–Kleť (1770 m), Hochfichtbahn
(1544 m, +340 m), Špičák–Hofmanky (1473 m). Pozn.: Kleť je Blanský les,
ne Šumava — do okna spadla logicky (JV roh); až se povede katalog
středisek/lanovek na web, rozhodnout, jestli ji vypsat, nebo odfiltrovat
(vzor „Obří sud u Javorníku" na Ještědském hřbetu).

## Statistika typů kandidátů (z OSM tagů)

- —: 299
- rozhledna: 17
- obsluhovana: 17
- utulna: 4

## Další kroky (pořadí)

1. Křížové ověření a povyšování Tier 1 (21 kandidátů) — vzor DATA-03;
   bavorské objekty s německým jménem primárním (rozhodnutí 20. 7.).
2. Dohledat 6 chybějících katalogových (výš).
3. DATA-06 řetěz (výchozí body → trasy → přístupy → výšky) — Actions.
4. Teprve pak plošná triáž zbylých ~310 kandidátů (hlavně vyřazování).
