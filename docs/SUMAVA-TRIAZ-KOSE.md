# Šumava — koše plošné triáže (krok 4b)

Vygeneroval `npx tsx scripts/triaz-kandidatu.ts sumava --md` dne 8. 8. 2026
(čtvrtý běh téhož dne, po dokončení bavorského koše Berggasthof/Berghaus
a skupiny podezřelých na Selbstversorger).
**Přegenerovat po každém povýšení nebo vyřazení** — publikované, odložené
i vyřazené kandidáty skript sám vynechává.

Koš NENÍ rozhodnutí. Klíč zařazení se ptá i na turistickou minulost objektu
a tu z názvu nepozná nikdo — bývalá bouda se dnes může jmenovat „Apartmány
u lesa". Koš jen říká, v jakém pořadí se to má číst a co se dá probrat
hromadně. Vyřazení patří do `data/kandidati/_vyrazeno.yaml` a dělá ho
redakce s pramenem.

Největší skupina je `tourism=chalet` (154 kandidátů): v OSM to znamená
pronajímaný domek k samostatnému vaření, ne obsluhovanou chatu. Když u něj
jméno přesto nese boudové slovo, jde kandidát do koše „k posouzení" jako
rozpor tagu a jména — přesně takový byl Zwieseler Hütte i Waldvereinshütte
(oba Selbstversorger, vyřazeni 6. 8. s pramenem).

## Postup triáže: koše 8. 8. 2026 ráno 110 · 35 · 160 → 71 · 35 · 173

**Ráno — dvě opravy skriptu a čtyři dopsaná rozhodnutí** (kandidátů
305 → 298): `tourism=apartment` se začal číst jako tag pronájmu; české
„chata / chalupa" je proti tagu pronájmu SLABÝ signál, u `apartment` ho tag
přebíjí, u `chalet` ne (protipříklad Turnerova chata); vyřazení zapsaná
s předponou oblasti byla skriptu neviditelná; čtyři rozhodnutí, která žila
jen v deníku, jsou v rozhodovacích seznamech.

**Odpoledne — ODPRACOVÁN CELÝ BAVORSKÝ KOŠ „Berggasthof / Berghaus",
čtrnáct kandidátů** (kandidátů 298 → 285, nadějných 89 → 76). Byla to
největší homogenní skupina koše a klíč u ní vyšel devětkrát z desíti
kladně:

- **POVÝŠENO 9** (korpus 137 → 146): Berghaus Loderhart (spolková chata
  NaturFreunde, „öffentliche Gaststätte" doslova), Berggasthof Lusen
  (Goldsteig, 5. etapa), Berggasthof Hochpröller (960 m pod vrcholem,
  Goldsteig přes vrchol), Berggasthof Menauer / Grandsberg (Goldsteig
  + evropská E8), Berghaus Hohenbogen (u horní stanice lanovky, 150 míst),
  Berggasthof Hinterwies (portál ho vede jako „Bewirtschaftet"),
  Berggasthof Hinhart (dům z roku 1700 — nejstarší doložený rok stavby
  bavorské části fondu), Berggasthof Waldmann (pivní zahrada s Brotzeit),
  Berggasthof Grobauer (rodina od doby okolo 1910; hraniční hotel, typ
  `horsky-hotel` — vzor Špindlerovky).
- **VYŘAZENO 1:** Berggasthof Geiß — vlastní web provozovatele dokládá, že
  hostinský provoz ukončil („den Gasthofbetrieb … eingestellt"), zůstal
  penzion pro ubytované.
- **ODLOŽENO 3:** Berggasthof Fritz (přejmenován na Hotel der Bäume,
  prameny si odporují o hospodě a nedatují to), Berggasthof Markbuchen
  (nejistá identita — dva podniky téhož jména, portály je mají zamotané),
  Berggasthof Hochstein (občerstvení pro veřejnost nedoloženo, kapacita
  6 × 28 pokojů).

### Co se z té dávky naučit pro zbytek koše

1. **Druhý pramen u bavorských domů = regionální turistický portál.**
   bayerischer-wald.de, ostbayern-tourismus.de, arberland-bayerischer-wald.de,
   goldsteig-wandern.de, weby obcí. Vlastní weby domů jsou ze sandboxu
   často za schvalovacím gatem (loderhart.de, hochstein, hotelderbaeume).
2. **Klíčová německá slova, která rozhodují klíč zařazení:**
   `bewirtschaftet`, `öffentliche Gaststätte`, `einkehren`, `Brotzeit`,
   `Ruhetag` → občerstvení pro veřejnost. Naopak `Selbstversorger`,
   `nur nach Buchung`, `Betrieb eingestellt`, `nur für Hausgäste` → klíč
   nesplňuje.
3. **Rozvrh se zavíracím dnem je sám dokladem veřejné hospody** — jídelna
   pro nocující zavírací dny nemá. Použito u Hochpröllera a Hinhartu.
4. **Výšku DOMU portály uvádějí zřídka.** Skoro vždy jde o výšku hory nebo
   obce; nesmí se dovozovat. Z devíti povýšených ji má pět, čtyři mají
   pole prázdné.
5. **„Žádná otvírací doba" je u téhle skupiny běžný a správný výsledek** —
   rozvrhy se rozcházejí tak často, že u čtyř z devíti profilů zůstalo
   pole prázdné.

**Večer — skupina podezřelých na Selbstversorger, šest objektů** (kandidátů
285 → 279, nadějných 76 → 71). Deník 7. 8. u dvou z nich vedl podezření, že
jde o chaty k pronájmu; pramen ho potvrdil u obou a přidal třetí.

- **VYŘAZENO 3:** Bärwurz-Resl-Hüttn (regionální portál sám: „Selbstversorger
  Hütte im Bayerischen Wald nur für ganze WE buchbar"), Berghütte Zum Pröller
  (táž firma 46 m odsud, „Selbstverpflegung", pronájem pro skupiny),
  Základna Bílého orla (Junák: „Základna otevírá pro výpravy a akce
  s minimálním počtem 20 plně platících účastníků").
- **ODLOŽENO 3:** Burglengenfelder-Hütte (podezření se nepodařilo ani
  potvrdit, ani vyvrátit — vyřadit bez pramene by bylo domýšlení stejně jako
  povýšit), Forsthaus Ödwies (dnes bez provozu a hledá nájemce, ALE má
  doloženou turistickou minulost — v 19. století „eine kleine Gastwirtschaft
  für Wanderer und Waldarbeiter"; otázka na rozšířený klíč),
  Höllbachschwellhütte (**nový typ případu:** spolková chata otevřená
  KOMUKOLI po ohlášení u hospodáře, bez hospody — blíž útulně než pronájmu,
  ale volně přístupná není; odpověď založí pravidlo pro celou třídu objektů).

Poučení: **tag `wilderness_hut` v OSM není doklad útulny.** U Forsthausu
Ödwies i u Höllbachschwellhütte ho pramen vyvrátil, u Waldvereinshütte
6. 8. taky. Útulnu dokládá až věta o volném přístupu, ne tag.


### NADĚJNÉ — vzít v triáži nejdřív (71)

| kandidát | země | signál |
|---|---|---|
| `abseits-hutte` — Abseits Hütte | de | jméno nese „Hütte" |
| `aussichtsturm` — Aussichtsturm | de | typ z OSM: rozhledna |
| `berggasthof-zottling` — Berggasthof Zottling | de | jméno nese „Berggasthof" |
| `bistro-bouda` — Bistro Bouda | cz | jméno nese „Bouda" |
| `blockhutte` — Blockhütte | de | OSM tourism=hut |
| `bokova-chata` — Bokova chata | cz | jméno nese „chata" |
| `bouda-burgers` — Bouda Burgers | cz | jméno nese „Bouda" |
| `brandl-hutte-neunussberg` — Brandl Hütte Neunußberg | de | jméno nese „Hütte" |
| `brotzeithutte-zum-turm` — Brotzeithütte Zum Turm | de | jméno nese „Turm" |
| `chalupa-malcice` — Chalupa Malčice | cz | jméno nese „Chalupa" |
| `chalupa-na-sumave` — Chalupa na Šumavě | cz | jméno nese „Chalupa" |
| `chalupa-pod-farou` — Chalupa pod farou | cz | jméno nese „Chalupa" |
| `chalupa-pod-jasanem` — Chalupa pod jasanem | cz | jméno nese „Chalupa" |
| `chalupa-sumava` — Chalupa Šumava | cz | jméno nese „Chalupa" |
| `chalupa-u-brcaku` — Chalupa u Brčáků | cz | jméno nese „Chalupa" |
| `chalupa-u-kacirku` — Chalupa U Kačírků | cz | jméno nese „Chalupa" |
| `chalupa-u-rezbarky` — Chalupa U Řezbářky | cz | jméno nese „Chalupa" |
| `chalupa-ubytovani-horice` — chalupa  Ubytování Hořice | cz | jméno nese „chalupa" |
| `chalupa-vaclav-lipno` — Chalupa Václav Lipno | cz | jméno nese „Chalupa" |
| `chalupa-ve-strani` — Chalupa Ve Stráni | cz | jméno nese „Chalupa" |
| `chata-betty` — Chata Betty | cz | jméno nese „Chata" |
| `chata-boubin` — Chata Boubín | cz | jméno nese „Chata" |
| `chata-cenkovka` — Chata Čeňkovka | cz | jméno nese „Chata" |
| `chata-cerchov` — Chata Čerchov | cz | jméno nese „Chata" |
| `chata-churanov` — Chata Churanov | cz | jméno nese „Chata" |
| `chata-kaltenbach` — Chata Kaltenbach | cz | jméno nese „Chata" |
| `chata-kvilda` — Chata Kvilda | cz | jméno nese „Chata" |
| `chata-lipno-u-hajenky` — Chata Lipno U Hájenky | cz | jméno nese „Chata" |
| `chata-mladi` — Chata Mládí | cz | jméno nese „Chata" |
| `chata-na-losenici` — Chata Na Losenici | cz | jméno nese „Chata" |
| `chata-orovsky` — Chata Ořovský | cz | jméno nese „Chata" |
| `chata-pod-kleti` — Chata pod Kletí | cz | typ z OSM: obsluhovana |
| `chata-pod-obrim-hradem` — Chata pod Obřím hradem | cz | jméno nese „Chata" |
| `chata-povydri` — Chata Povydří | cz | jméno nese „Chata" |
| `chata-rovina` — Chata Rovina | cz | jméno nese „Chata" |
| `chata-sumavska-chalupa` — Chata Šumavská Chalupa | cz | jméno nese „Chata" |
| `chata-thurmberg` — Chata Thurmberg | cz | jméno nese „Chata" |
| `chata-u-jakuba` — Chata U Jakuba | cz | jméno nese „Chata" |
| `chata-u-krtka` — Chata U krtka | cz | jméno nese „Chata" |
| `chata-valkovi-lipno-nad-vltavou` — Chata Valkovi - Lipno nad Vltavou | cz | jméno nese „Chata" |
| `chata-zivec` — Chata Živec | cz | typ z OSM: obsluhovana |
| `dobra-chata` — Dobrá chata | cz | jméno nese „chata" |
| `falter-hutte` — Falter Hütte | de | jméno nese „Hütte" |
| `haidsteiner-hutte` — Haidsteiner Hütte | de | jméno nese „Hütte" |
| `hajenka-na-brezniku` — Hájenka na Březníku | cz | jméno nese „Hájenka" |
| `hajenka-nebe` — Hájenka Nebe | cz | jméno nese „Hájenka" |
| `hajenka` — Hájenka | cz | jméno nese „Hájenka" |
| `hansl-hutte` — Hansl-Hütte | de | typ z OSM: obsluhovana |
| `haus-wolfsteiner-hutte` — Haus Wolfsteiner Hütte | de | jméno nese „Hütte" |
| `horska-chata-kamzik` — Horská chata Kamzík | cz | jméno nese „Horsk" |
| `horska-chata-korab` — Horská chata Koráb | cz | jméno nese „Horsk" |
| `hotel-certova-chata` — Hotel Certova Chata | cz | jméno nese „Chata" |
| `hotel-chata` — Hotel Chata | cz | jméno nese „Chata" |
| `jagdhutte` — Jagdhütte | de | OSM tourism=hut |
| `kreuzhaus` — Kreuzhaus | de | typ z OSM: obsluhovana |
| `kronberg-hutte` — Kronberg-Hütte | de | jméno nese „Hütte" |
| `lovecka-chata` — Lovecká chata | cz | jméno nese „chata" |
| `naturfreundehaus-viechtacher-hutte` — Naturfreundehaus Viechtacher Hütte | de | jméno nese „Hütte" |
| `pumpwerk` — Pumpwerk | de | OSM tourism=hut |
| `rozhledna-korab` — rozhledna Koráb | cz | typ z OSM: rozhledna |
| `rozhledna-libin` — Rozhledna Libín | cz | typ z OSM: rozhledna |
| `schachtenhaus` — Schachtenhaus | de | OSM tourism=hut |
| `schwarzbachklause-diensthutte` — Schwarzbachklause (Diensthütte) | de | OSM tourism=hut |
| `skihutte-kohlau` — Skihütte-Kohlau | de | typ z OSM: obsluhovana |
| `stezka-korunami-stromu-lipno` — Stezka korunami stromů Lipno | cz | typ z OSM: rozhledna |
| `strazni-vez-zelezne-opony` — Strážní věž Železné opony | cz | typ z OSM: rozhledna |
| `sumavska-chalupa` — Šumavská chalupa | cz | jméno nese „chalupa" |
| `ubytovna-lovecka-chata` — Ubytovna Lovecká chata | cz | jméno nese „chata" |
| `wellness-chalupa-na-samote-u-lesa` — Wellness chalupa Na samotě u lesa | cz | jméno nese „chalupa" |
| `wolfi-s-hutte` — Wolfi's Hütte | de | jméno nese „Hütte" |
| `zelena-chyse` — Zelená chýše | cz | typ z OSM: obsluhovana |

### K POSOUZENÍ — musí přečíst člověk (35)

| kandidát | země | signál |
|---|---|---|
| `alm-hausl` — Alm -Häusl | de | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Alm" |
| `almberghutte` — Almberghütte | de | žádný signál ve jméně ani v tazích |
| `berghaus-durnau` — Berghaus Dürnau | de | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Berghaus" |
| `berghaus-julia` — Berghaus Julia | de | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Berghaus" |
| `bergstadl-althutte` — Bergstadl Althütte | de | žádný signál ve jméně ani v tazích |
| `bergstuberl-althutte` — Bergstüberl Althütte | de | žádný signál ve jméně ani v tazích |
| `buchberg-hutte` — Buchberg Hütte | de | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Hütte" |
| `cafe-arberhutte` — Café Arberhütte | de | žádný signál ve jméně ani v tazích |
| `cafe-zur-waldglashutte` — Cafe Zur Waldglashütte | de | žádný signál ve jméně ani v tazích |
| `chalupa-eden` — Chalupa EDEN | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chata-cervena-nad-vltavou` — chata Červená nad Vltavou | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „chata" |
| `chata-lipno-dvorecna` — Chata Lipno-Dvorecna | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-simterka` — Chata Šimterka | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-svata-magdalena` — Chata svatá Magdalena | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `christl-s-schmankerlhutte` — Christl's Schmankerlhütte | de | žádný signál ve jméně ani v tazích |
| `ferienhaus-schonbacher-hutte` — Ferienhaus Schönbacher Hütte | de | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Hütte" |
| `ferienwohnung-pfenniggeiger-hutte` — Ferienwohnung Pfenniggeiger-Hütte | de | rozpor: OSM tourism=apartment (pronájem) × jméno nese „Hütte" |
| `forstdiensthutte-hohen-bogen` — Forstdiensthütte Hohen Bogen | de | žádný signál ve jméně ani v tazích |
| `gasthaus-zur-poschingerhutte` — Gasthaus zur Poschingerhütte | de | žádný signál ve jméně ani v tazích |
| `grenzglashutte` — Grenzglashütte | de | žádný signál ve jméně ani v tazích |
| `jagerhutte` — Jägerhütte | de | žádný signál ve jméně ani v tazích |
| `konditorei-tagescafe-landshuter` — Konditorei Tagescafe Landshuter | de | žádný signál ve jméně ani v tazích |
| `landhotel-hutter` — Landhotel Hutter | de | žádný signál ve jméně ani v tazích |
| `landshuter-hof-158417739` — Landshuter Hof | de | žádný signál ve jméně ani v tazích |
| `landshuter-hof` — Landshuter Hof | de | žádný signál ve jméně ani v tazích |
| `lovecka-chata-zamecek` — Lovecká chata Zámeček | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „chata" |
| `natschahutte` — Nätschahütte | de | žádný signál ve jméně ani v tazích |
| `naturfreundehutte` — Naturfreundehütte | de | žádný signál ve jméně ani v tazích |
| `racheldiensthutte` — Racheldiensthütte | de | žádný signál ve jméně ani v tazích |
| `restaurant-huttendorf-49-nord` — Restaurant Hüttendorf 49° Nord | de | žádný signál ve jméně ani v tazích |
| `rotwaldglashutte` — Rotwaldglashütte | de | žádný signál ve jméně ani v tazích |
| `schmugglerhutte` — Schmugglerhütte | de | žádný signál ve jméně ani v tazích |
| `seehutte-dreiburgensee` — Seehütte Dreiburgensee | de | žádný signál ve jméně ani v tazích |
| `tahutea` — Tahutea | de | žádný signál ve jméně ani v tazích |
| `wander-wellness-hotel-huttenhof` — Wander- & Wellness Hotel Hüttenhof | de | žádný signál ve jméně ani v tazích |

### MIMO KLÍČ dle jména — probrat hromadně, NENÍ to vyřazení (173)

| kandidát | země | signál |
|---|---|---|
| `1` — 1 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `7-sentidos` — 7 Sentidos | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `alps-resorts-englmar-chalets` — Alps Resorts - Englmar Chalets | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `am-nationalpark` — Am Nationalpark | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `apartman-diana` — Apartman Diana | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `atelierhaus-ida-segl` — Atelierhaus Ida Segl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `awo-feriendorf` — AWO-Feriendorf | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `backerei-hutterer` — Bäckerei Hutterer | de | služba mimo obor — „Bäckerei" |
| `backerwiese` — Bäckerwiese | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `bauer-s-ferienhauschen` — Bauer`s Ferienhäuschen | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `bauernhof-schedlbauer` — Bauernhof Schedlbauer | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `bayerwald-chalet-liebenstein` — Bayerwald Chalet Liebenstein | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `bayerwaldhaus` — Bayerwaldhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `beach-bar-el-bouda` — Beach Bar El Bouda | cz | městský podnik — „Beach Bar" |
| `bio-ferienhaus` — Bio-Ferienhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `cerny-kriz-73` — Černý Kříž 73 | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `chalupa-na-lipne-1` — Chalupa na Lipně 1 | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-na-lipne-2` — Chalupa na Lipně 2 | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-jistec` — Chata Jistec | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-kobylnice-lipno` — Chata Kobylnice Lipno | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-mrazkovi` — Chata Mrazkovi | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-mytinka` — Chata Mytinka | de | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-na-kobylnici` — Chata na Kobylnici | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-pisanka` — Chata Pišanka | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-rozhlas` — Chata Rozhlas | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-sandra` — Chata Sandra | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-sara` — Chata Sára | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-terezka` — Chata Terezka | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-u-lipna` — Chata u Lipna | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-vraz` — Chata Vráž | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `dimpfl-stadl` — Dimpfl-Stadl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dullhof-austragshausl` — Düllhof-Austragshäusl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `edlgutl-erdhaus` — Edlgütl, Erdhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `edlgutl-hoizhaus` — Edlgütl, Hoizhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `einod-finkenried` — Einöd Finkenried | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `eis` — Eis | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `endlhof` — Endlhof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `erde` — Erde | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ernstl-hof` — Ernstl Hof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ernstlhof` — Ernstlhof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienbauernhof-kimminger` — Ferienbauernhof Kimminger | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienbauernhof-weber` — Ferienbauernhof Weber | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `feriendomizil-leithenwald` — Feriendomizil Leithenwald | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `feriendorf-adalbert-stifter` — Feriendorf Adalbert Stifter | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `feriendorf-finsterau` — Feriendorf Finsterau | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `feriendorf-schwarzholz-rezeption` — Feriendorf Schwarzholz, Rezeption | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-altenstrasser` — Ferienhaus Altenstrasser | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-baier` — Ferienhaus Baier | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-bar` — Ferienhaus Bär | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-haslinger` — Ferienhaus Haslinger | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-holbeck` — Ferienhaus Holbeck | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-maria` — Ferienhaus Maria | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-marschollek` — Ferienhaus Marschollek | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-mitterdorf` — Ferienhaus Mitterdorf | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-natur-98649329` — Ferienhaus NATUR | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-natur` — Ferienhaus Natur | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-peehs` — Ferienhaus Peehs | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-plattenstein` — Ferienhaus Plattenstein | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-schellenberg` — Ferienhaus Schellenberg | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-schmidt` — Ferienhaus Schmidt | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-waldblick-mitterdorf` — Ferienhaus Waldblick Mitterdorf | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-waldspecht` — Ferienhaus Waldspecht | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-walter` — Ferienhaus Walter | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-wanninger` — Ferienhaus Wanninger | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-zinnocker` — Ferienhaus Zinnöcker | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus-zur-linde` — Ferienhaus zur Linde | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhaus` — Ferienhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhauser-in-der-waldperle` — Ferienhäuser In Der Waldperle | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhof-dreiburgenland` — Ferienhof Dreiburgenland | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhof-grundinger` — Ferienhof Gründinger | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhof-rauscher` — Ferienhof Rauscher | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhof-schauer` — Ferienhof Schauer | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienhof-schmid` — Ferienhof Schmid | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienland-sonnenwald` — Ferienland Sonnenwald | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienpark-arber` — Ferienpark Arber | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienpark-jagerwiesen` — Ferienpark Jägerwiesen | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ferienwohnungen-weitblick` — Ferienwohnungen Weitblick | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `feuer` — Feuer | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-1` — FH 1 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-10` — FH 10 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-11` — FH 11 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-12` — FH 12 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-13` — FH 13 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-14` — FH 14 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-15` — FH 15 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-16` — FH 16 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-17` — FH 17 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-18` — FH 18 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-19` — FH 19 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-2` — FH 2 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-20` — FH 20 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-21` — FH 21 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-22` — FH 22 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-23` — FH 23 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-24` — FH 24 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-25` — FH 25 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-26` — FH 26 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-27` — FH 27 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-28` — FH 28 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-29` — FH 29 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-3` — FH 3 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-30` — FH 30 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-31` — FH 31 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-32` — FH 32 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-33` — FH 33 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-34` — FH 34 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-4` — FH 4 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-5` — FH 5 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-6` — FH 6 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-7` — FH 7 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-8` — FH 8 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `fh-9` — FH 9 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `gillingerhof` — Gillingerhof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `goldenes-haus-71` — Goldenes Haus 71 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `goldenes-haus-72` — Goldenes Haus 72 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `goldenes-haus-73` — Goldenes Haus 73 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `goldenes-haus-74` — Goldenes Haus 74 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `goldenes-haus-75` — Goldenes Haus 75 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `hatzingerhof` — Hatzingerhof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-2-siebenschlafer` — Haus 2 - Siebenschläfer | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-aurelia` — Haus Aurelia | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-bergland-altreichenau` — Haus Bergland Altreichenau | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-christine` — Haus Christine | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-florian` — Haus Florian | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-guglod` — Haus Guglöd | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-ingrid` — Haus Ingrid | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-laura` — Haus Laura | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-lohwald` — Haus Lohwald | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-maria` — Haus Maria | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-rose` — Haus Rose | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `haus-viviane` — Haus Viviane | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `herzigs-ferienhaus-mitterdorf` — Herzigs Ferienhaus Mitterdorf | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `himmelreich-chalet-fichtenhaus` — Himmelreich-Chalet Fichtenhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `himmelreich-chalet-tannenhaus` — Himmelreich-Chalet Tannenhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `im-wiesenhaus` — im Wiesenhaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `jugendfreizeitstatte-althutte` — Jugendfreizeitstätte - Althütte | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `jugendwaldheim` — Jugendwaldheim | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `landhaus-friedl` — Landhaus Friedl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `life` — Life | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `luft` — Luft | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `moosham-13` — Moosham 13 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `natur` — Natur | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `naturfreundehaus-am-rotkot` — Naturfreundehaus Am Rotkot | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `naturfreundehaus-landauer-berghutte` — Naturfreundehaus Landauer Berghütte | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `naturfreundehaus-oberhaag` — Naturfreundehaus Oberhaag | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `nummer-56` — Nummer 56 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `pauch-huts` — Pauch Huts | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `penzion-bobesova-bouda` — Penzion Bobešova bouda | cz | ubytování bez veřejné služby — „Penzion" |
| `penzion-chata-florian` — Penzion Chata Florian | cz | ubytování bez veřejné služby — „Penzion" |
| `penzion-hajenka` — Penzion Hájenka | cz | ubytování bez veřejné služby — „Penzion" |
| `quellenhof-kollnburg` — Quellenhof Kollnburg | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ranzinger-hof` — Ranzinger Hof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `scariak` — Scariak | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schalterbachhof` — Schalterbachhof | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schlossberghaus` — Schloßberghaus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schlosser-haus` — Schlosser-Haus | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schreinerhausl` — schreinerHÄUSL | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzes-haus-61` — Schwarzes Haus 61 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzes-haus-62` — Schwarzes Haus 62 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzes-haus-63` — Schwarzes Haus 63 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzes-haus-64` — Schwarzes Haus 64 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzes-haus-65` — Schwarzes Haus 65 | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `schwarzkobel-privatlodge` — Schwarzkobel Privatlodge | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `sinne` — Sinne | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `u-josefu` — U Josefů | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `vier-jahreszeiten` — Vier Jahreszeiten | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `waldesruh` — Waldesruh | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `waldferiendorf-regen` — Waldferiendorf Regen | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `wasser` — Wasser | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `wiesnschlafhausl` — Wiesnschlafhäusl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `wolfsteiner-bergchalets` — Wolfsteiner Bergchalets | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `zoihausl` — Zoihäusl | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `zum-alten-wirt` — Zum Alten Wirt | de | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |

oblast sumava | kandidatu k triazi: 279 | NADEJNE 71 · POSOUDIT 35 · MIMO 173
preskoceno (publikovane/odlozene/vyrazene): 57
