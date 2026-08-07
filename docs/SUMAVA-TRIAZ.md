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
   *(6. 8. 2026: HOTOVO, co šlo — 21 profilů; z katalogových zbývají jen
   Rovina a Churáňov na živý pramen/telefonát a čtveřice bez kandidáta.)*
2. Dohledat 6 chybějících katalogových (výš). *(6. 8.: zbývají 4, vše CZ.)*
3. DATA-06 řetěz (výchozí body → trasy → přístupy → výšky) — Actions.
   *(Běží; výšky doběhly 5.–6. 8.)*
4. Plošná triáž zbylých kandidátů — **začíná se tagovanou frontou (níž)**,
   teprve pak ~300 kandidátů bez typu (hlavně vyřazování).
   *(7. 8. 2026: postaven `scripts/triaz-kandidatu.ts`, který kandidáty
   předtřídí do košů podle jmenných a tagových signálů; výstup je
   `docs/SUMAVA-TRIAZ-KOSE.md`. Ze 305 kandidátů: **NADĚJNÉ 110,
   K POSOUZENÍ 35, MIMO KLÍČ 160**. Největší skupina je `tourism=chalet`
   — 154 kandidátů, v OSM pronajímaný domek, ne obsluhovaná chata.
   Skript nic nemaže a nic nepovyšuje, jen říká pořadí práce; koš NENÍ
   vyřazení, protože turistickou minulost z názvu nepozná nikdo.)*

## Tagovaná fronta (krok 4a) — kandidáti s typem z OSM tagů

Sestaveno 6. 8. 2026: kandidáti s `typ` rozhledna/obsluhovana/utulna,
kteří nejsou publikovaní ani vyřazení. **Výchozích 32; po průchodech 6. a 7. 8. zbývá 17.**

**ROZSAH ROZHODNUT (Michal 7. 8. 2026, doslova: „kleť i čerchov určitě
zařaď, koráb a libín prověřím"):** Kleť (Blanský les) i Čerchov (Český
les) do průvodce PATŘÍ — zařazují se do oblasti `sumava` stejnou cestou
jako Šumavské podhůří (Svatobor, Javorník). **Koráb a Libín zůstávají ve
frontě a nepovyšují se**, dokud Michal neodpoví. Oba objekty odemčené
tímto rozhodnutím byly povýšeny týž den (níž).

Rozhodnuto 7. 8. (blok 3, samostatná práce):

- **`rozhledna-spicak` POVÝŠENA** (korpus 135) — ocelová věž s dřevěným
  obložením z roku 2014 na vrcholu šumavského Špičáku (1202 m), 26,5 m,
  135 schodů, 50 m od horní stanice lanovky; kiosek pod věží doložen
  třemi prameny. **VYŘEŠENA OTÁZKA TRIÁŽE: s katalogovou „Chatou na
  Špičáku" NESOUVISÍ** — katalog ji vede v 865 m u Železné Rudy, tedy na
  úrovni střediska, věž stojí v 1202 m. Katalogová chata zůstává mezi
  čtyřmi bez kandidáta. Vstupné se nezapsalo (Kudy z nudy 90/60 Kč ×
  Regiontourist „zdarma"). **Nový nález pro dohledávku:** na vrcholu jsou
  dle Regiontouristu chaty **Hanička** (kandidát `chata-hanicka` ve
  frontě je) a **Blaženka** (v exportu chybí úplně).
- **`geisskopfhutte` POVÝŠENA** (korpus 136) — horský hostinec v 1097 m
  u horní stanice sedačkové lanovky na Geißkopfu. Do fronty se objekt
  dostal přes kandidáta `geisskopfturm`, jehož dokladem občerstvení byl
  právě tenhle dům — povyšuje se tedy nositel služby, ne věž.
  **`geisskopfturm` se NEPOVYŠUJE:** kdo věž provozuje, nevede žádný
  pramen (na rozdíl od Kleti, kde to pramen výslovně říká). Nocleh
  zapsán ZÁPORNĚ — portál regionu ho vylučuje výslovnou větou („Keine
  Übernachtungsmöglichkeit!"), ne mlčením. Na téže hoře čeká ještě
  kandidát `berggasthof-geiss`.
- **`sektor-f-hauptturm` POVÝŠENA** (korpus 137) — bývalá armádní
  odposlechová věž na Schwarzrieglu (1079 m) na hřbetu Hohen Bogen:
  75 m, památkově chráněná, vnější schodiště a vyhlídková plošina v 50 m
  od roku 2014. **Zrcadlo Poledníku z druhé strany hranice.** rokVzniku
  prázdný (rok stavby věží nevede žádný pramen — vzorec kontinuity),
  otviraciDoba prázdná (celoročně 9–18 h × březen–listopad od východu do
  západu slunce). V areálu tři podniky; `berghaus-hohenbogen`
  a `forstdiensthutte-hohen-bogen` jsou kandidáti ve frontě,
  „Berggasthof Schönblick" v exportu chybí.
- **`kadernberg-aussichtsturm` ODLOŽEN** (do `_odlozeno.yaml`) —
  dřevěná věž 30 m na Kadernbergu (700 m) u Schönbergu s občerstvením
  přímo u paty, tedy klíč splňuje. Jenže prameny si odporují o AKTUÁLNÍM
  STAVU: jeden vede věž jako zavřenou z požárních důvodů a hospodu
  přejmenovanou (Turmstüberl → Kadernberger Hütt'n) vedle *bývalého*
  lanového parku, druhý (web provozovatele gastronomie) ji popisuje jako
  fungující s výhledem na *činný* park. Stav objektu je pro plánování
  túry zásadní údaj a datum u zprávy o uzavření nikdo neuvádí —
  nepovyšovat, dokud to nedoloží pramen s datem.
- **Městské věže: `stadtturm-202211550` (Straubing) VYŘAZEN,
  `stadtturm` (Furth im Wald) ODLOŽEN.** Straubing leží v dunajské
  nížině desítky kilometrů od hor — do okna spadl jen geometrií a klíč
  nesplňuje v žádné čtené podobě. Furth im Wald je pohraniční město pod
  Českým lesem, a to je **táž otázka rozsahu jako věž v Mirsku**
  (`_odlozeno.yaml`, 3. 8.): jestli „role na trase" pokrývá i městskou
  věž pod horami. Dokud Michal nerozhodne, drží se obojí stejně.

Rozhodnuto 7. 8. (blok 2, s Michalem online):

- **`horska-chata-klet` + `josefova-vez` POVÝŠENY JAKO JEDEN PROFIL**
  (korpus 134) — vzor Žalý / Královka / Svatobor: provozovatelem
  rozhledny je dle Kudy z nudy Horská chata Kleť a vlastní doména se
  sama představuje jako „horská chata, rozhledna, penzion a hostel".
  Josefova věž z roku 1825 je nejstarší kamenná rozhledna v Česku (dva
  prameny to nesou v názvu), chata má restauraci i nocleh ve dvou
  úrovních. **rokVzniku prázdný** — areál má dvě stavby a dvě data (věž
  1825, Tereziina chata 1925) a že je dnešní chata touž budovou, netvrdí
  žádný pramen. **otviraciDoba prázdná** — prameny vedou zvlášť letní
  provoz restaurace a zvlášť provoz věže, mimosezónní hodiny nikdo.
  Kandidát `chata-pod-kleti` je JINÝ objekt 2,3 km severně, zůstává ve
  frontě.
- **`kurzova-vez` POVÝŠENA** (korpus 133) — kamenná věž z roku 1905 na
  Čerchově (1042 m), spravuje ji domažlický odbor KČT; hospůdka
  s chodskou kuchyní u paty doložena třemi prameny. Historie unese
  celou epochu: zábor 1938, pohraniční stráž od 1950, otevření po roce
  1989, návrat KČT 1999 a rekonstrukce 2000. Známkové místo č. 341.
  **`chata-cerchov` se NEPOVYŠUJE a zůstává zvlášť** — jestli je
  hospůdka u věže a Chata Čerchov (64 m) jeden provoz, nebo dva
  sousedi, prameny nerozhodují; kandidát na DATA-04.

Rozhodnuto 7. 8. (dřív téhož dne):

- **`klostermannova-rozhledna` POVÝŠEN** (korpus 132) — druhá šumavská
  rozhledna korpusu: kamenná věž z roku 1938 na Javorníku u Vacova
  (1066 m), po nástavbě z roku 2003 necelých 40 m, 197 schodů. Bufet
  pod věží doložen třemi nezávislými prameny (Regiontourist, InfoČesko,
  OSM `fast_food` 6 m) → klíč zařazení splněn. **Otvírací doba vědomě
  nezapsána** — prameny popisují dva neslučitelné režimy (sezónní
  rozvrh s obsluhou dle vacov.cz a InfoČeska × denní přístup
  5–19 / 7–17 h s bezhotovostním vstupným dle javorniksumava.cz);
  vzor Kötztinger Hütte. Výška vrcholu 1066 m dle čtyř shodných
  pramenů proti osamocenému 1089 m u InfoČeska. **Rozsah:** Šumavské
  podhůří, precedens Svatoboru — kdyby Michal rozhodl jinak, do
  DATA-29. Kolize jmen s Klostermannovou chatou na Modravě byla
  rozhodnuta už dřív (dva objekty 30 km od sebe), `_jmenovci.yaml`
  beze změny. **Weby za gatem znovu:** hansl-huette.de (permission
  gate) a loderhart.de — druhý pokus 7. 8. dopadl stejně jako první.

Rozhodnuto 6. 8.:

- **`hochwald-hutte` POVÝŠEN** (korpus 129) — chata sekce DAV Deggendorf
  u rozcestí Hölzerne Hand, 910 m; víkendové občerstvení pro veřejnost
  od dobrovolníků (káva/koláč/nápoje), nocleh jen při pronájmu celé
  chaty (přiznáno). Dva shodné prameny (vlastní stránka sekce + OSM).
  **První šumavský profil mimo externí katalog.**
- **`zwieseler-hutte` VYŘAZEN** — Selbstversorger k pronájmu skupinám
  (30–35 osob), bez služby pro kolemjdoucí; precedens Kynast. Poloha
  1443 m na Javoru je nápadná — kdyby se doložila turistická minulost,
  vrátit.
- **`waldvereinshutte` VYŘAZEN** — týž vzor: „Waldhäusl" spolku Waldverein
  Waldmünchen v Herzogau je Selbstversorger s rezervací (sekce BUCHUNGEN),
  ne volně přístupná útulna; OSM tag wilderness_hut je tu zavádějící.
- **`polednik` POVÝŠEN** (korpus 130) — první šumavská rozhledna korpusu:
  věž 37 m na vrcholu 1315 m, bývalý armádní objekt, rozhledna od 1998,
  kiosek u paty věže doložen dvěma prameny (regionální průvodce + OSM).
  Sezóna V–X s přiznaným rozporem (jeden pramen vede jen V–IX). Routing:
  z Prášil (Velký Bor) 7,87 km — sedí s 8 km, které vede Šumava Net.
- **`svatobor-rozhledna` POVÝŠEN** (korpus 131) — rozhledna S CHATOU nad
  Sušicí (845 m): nocleh 22 lůžek, restaurace, věž 31,6 m z roku 1934.
  Kolize `svatobor` ROZHODNUTA (vzor Žalý/Královka): chata i rozhledna
  jsou jeden areál s jedním provozem (shodný telefon a doména, od 1998
  majetek města) → jeden profil; kandidát `svatobor-chata` se nepovyšuje,
  záznam v `data/_jmenovci.yaml` aktualizován. Rozpory přiznány
  (letopočty první věže, otvírací doby — nezapsány). POZOR ROZSAH:
  Šumavské podhůří (precedens Frýdlantské výšiny v Jizerkách) — kdyby
  Michal rozhodl jinak, přesun do DATA-29. Routing: Svojšice 3,54 km
  po červené.
- **`rozhledna-pancir` je vyřešená jinak** — rozhledna je dle vlastního
  webu součástí publikované Horské chaty Pancíř (jeden objekt, precedens
  Žalý); kandidát se samostatně nepovyšuje a do fronty se nepočítá.

**Weby, které se 6. ani 7. 8. nenačetly:** hansl-huette.de (permission
gate), loderhart.de — oba zkusit jindy, jsou to obsluhované objekty
s vlastním webem, tedy nadějné; po druhém neúspěchu jsou to kandidáti
na jiný pramen (bavorský turistický svaz, NaturFreunde) nebo na
Michalův pokus z prohlížeče. **Zbytek fronty (17):** 7 obsluhovaných
(barwurz-resl-huttn, berghaus-loderhart, burglengenfelder-hutte-scb-hutte,
chata-pod-kleti, chata-zivec, hansl-hutte, kreuzhaus, skihutte-kohlau,
zakladna-bileho-orla, zelena-chyse — pozn.: Kleť je Blanský les, Živec
u Písku je mimo Šumavu → u obou nejdřív rozhodnout rozsah, vzor Kleti
u lanovek), 6 rozhleden (u každé nutno doložit občerstvení —
klíč DATA-23; POZOR ROZSAH u rozhledna-korab a rozhledna-libin —
Michal je 7. 8. výslovně odložil, NEPOVYŠOVAT bez jeho slova;
`geisskopfturm` čeká na doklad, kdo ho provozuje) a 2 útulny (forsthaus-odwies, hollbachschwellhutte).
