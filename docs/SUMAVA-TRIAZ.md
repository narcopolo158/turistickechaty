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

## Katalogové objekty BEZ kandidáta (6 z 27)

Export je nenašel ani dohledávkou podle jmen — dohledat ručně nebo DATA-31:

- **Horská chata Pancíř** (CZ) — export má `rozhledna-pancir`; na Pancíři
  je chata s rozhlednou v jednom areálu, PROVĚŘIT, zda OSM objekt „Rozhledna
  Pancíř" je táž budova (netvrdit, dokud se neověří).
- **Chata Zlatá Studna** (CZ, Horská Kvilda) — v exportu není vůbec.
- **Chata na Špičáku** (CZ) — export má jen `rozhledna-spicak`; vztah
  PROVĚŘIT (jiná stavba na témže vrchu?).
- **Antýgl** (CZ, Srní) — bývalý královácký dvorec, dnes kemp s bufetem;
  v exportu není (OSM ho zřejmě tahuje jako kemp — mimo naše tagy).
- **Horská chata Bučina** (CZ, Kvilda) — v exportu není.
- **Berggasthof Gibacht** (DE, Waldmünchen) — v exportu není; leží u samé
  severozápadní hrany okna (49,36/12,66), PROVĚŘIT i hranu.

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
