# DENÍK — pracovní deník denních sessions

Formát zápisu (nejnovější nahoře):

```
## YYYY-MM-DD
**Hotovo:** co se dnes udělalo (položka backlogu, commity)
**Příště:** čím navázat
**Otázky pro Michala:** (pokud jsou — jinak vynechat)
```

---

## 2026-07-27 — pokračování 10: 3D mapa dostala panoramatický (malovaný) režim dle Michalových předloh

**Zadání Michala (s doslovným zněním):** „vymysli jak 3d mapu priblizit
panoramatickym mapam v priloze" — 7 předloh: kanadské ručně malované
panorama střediska (Niehues styl), letní malovaná mapa Pece pod Sněžkou
s boudami-domečky, tři zimní malované mapy Rokytnice/„horské středisko",
letecká fotomapa se zákresem tratí, staré malované panorama Špindlu.

**Hotovo — nový přepínač „🖼 panoramatická mapa" v šabloně (stejná data,
jiný kabát), vše lokální kompozice bez regenerace ostrých dat:**

- **kvašové stínování**: MeshToonMaterial s 6stupňovým gradientem
  (kvantované světlo jako malba); slunce v režimu drženo níž (boční
  světlo), ambient do modra → modré stíny na sněhu jako na předlohách
- **malovaná obloha** (svislý gradient) + atmosférická dálka (světlá
  modrá mlha), papírové zrno přes celý obraz (SVG šum, multiply)
- **trasy a řeky jako stuhy** (ribbon geometrie nad terénem, KČT barvy;
  potoky schválně decentní), body prořeďované pro hladší tah
- **boudy jako domečky** — bílé stěny, sedlová střecha (červená bouda /
  modrá hotel / šedá mimo provoz či kandidát), komín; schválně přehnané
  měřítko jako na malovaných mapách; klik na domeček i na JMÉNO
- **jména bud přímo v mapě** se stínovým halo + automatické proředění
  (screen-space kolize, přednost bližším; vrcholy mají prioritu) +
  perspektivní tlumení velikosti (blízko se nezvětšují do obludnosti)
- **plakátová kompozice**: nízký telefoto pohled od jihu (FOV 34),
  omezený náklon, titul KRKONOŠE; vypnutí vrátí vše beze zbytku
- **připraveno na lesy a sjezdovky**: data28 skript nově stahuje
  landuse=forest/natural=wood (spojování ringů multipolygonů, decimace,
  pojistka objemu) a piste:type=downhill (jen osové linie; polygonové
  plochy se přiznaně vynechávají). Šablona už umí smrčky (InstancedMesh
  v rastru lesní masky, sezónní barvy, strop 1350 m — nad ním kosodřevina,
  výkonová pojistka 45 tisíc instancí) i bílé koridory s lemem obtížnosti
  (jen zimní plakát). Ověřeno na SYNTETICKÝCH datech v /tmp — ostrá data
  potřebují jeden klik na workflow data28 v Actions.

Headless ověření: zapnutí/vypnutí režimu, léto/zima, klik na jméno →
fly-to + karta (Bouda Růžohorky), 0 pageerrors. Náhledy:
3d-teren-nahled-pan-{leto,zima,detail}.png. Poctivost: pata přiznává, že
smrčky jsou stylizace ploch OSM (ne stromy) a paseky se nekreslí.

**Příště:** Michal klikne Run workflow → lesy + sjezdovky naostro; pak
zpět k frontě povyšování (zbývá 6 silných od konce: Sedmidolí, Jindřichův
dům, Smetánka, Husova, Amor, U Kotle).

## 2026-07-27 — pokračování 9: třetí trojice od konce fronty — Náchodská, Na Lučinách, Betyna (58 profilů)

**Zadání Michala:** „pokracuj" (samostatný režim trvá; otázky až po uzavření Krkonoš).

**Hotovo:**

**Z fronty DATA-27 povýšena třetí trojice od konce — Náchodská bouda,
Bouda Na Lučinách a Chata Betyna (55 → 58 publikovaných profilů).**
Stavěno z citací triáže + tři cílené spot-fetche tam, kde triáž přiznávala
mezery (obec, atribuce lůžek):

- **Náchodská bouda** — první samostatně vedená bouda osady Hrnčířské
  boudy (osadní otázka pro Michala trvá). Spot-fetch Kudy z nudy přinesl
  i nové údaje: „20 pokojů a 56 lůžek", výška „1.100 m.n.m.", adresa
  Černý Důl. Výška se přesto NEZAPSALA: celostátní přehled atic vede 575 m
  (zjevně vadný záznam — nerozhodujeme, přiznáváme v próze) a místopisných
  1059 m platí pro osadu (1854 — letopočet osady, ne domu; próza to říká).
- **Bouda Na Lučinách** — enkláva Lučiny (Bodenwiesenbauden, dřevaři
  z Alp — katalog i blog shodně, o osadě). 42 lůžek, snídaně bufetem
  a večeře z menu (České hory doslova); „nejvýše položená pizzerie
  v Čechách" jen s výslovným připsáním blogu Krkonošské boudy, číselník
  občerstvení nevyplněn. Vlastní web z OSM padá na timeout 20. 7. i 27. 7.
  → kontakty NEZAPSÁNY, dokud se nepotvrdí, že web žije.
- **Chata Betyna** — web betyna.cz se tentokrát načetl (20. 7. padal):
  „celoroční ubytování o kapacitě 47 lůžek", „restaurace s dětským
  koutkem a dětskými židličkami", „barová místnost", „500 m od spodní
  lanovky na Sněžku"; Treking: „asi půl kilometru od okraje Pece" —
  souhlasné údaje, próza nese obojí. Výška bez pramene → nezapsána.
  Jediná časová stopa je rejstříkový zápis provozovatele 2016 — o firmě,
  ne o domě; próza to přiznává.

U všech tří: komu slouží restaurace/kuchyně, prameny neříkají — profily
to po zkušenosti DATA-25 říkají nahlas. POVÝŠENO hlavičky kandidátům,
master fronta přepsána (zbývá 6 silných: U Kotle, Amor, Husova, Smetánka,
Jindřichův dům, Sedmidolí — + 6 s výhradou). Paralelní session mezitím
povýšila Jelení Louky, Na Pláni a Helenu a sklízí hero fotky (DATA-02) —
kolize žádná (my od konce, ona odjinud).

Kontrola: validator 0 chyb (58 souborů), ban-scan na nových třech 9 zásahů
= jen dokumentované FP třídy (slovo „Souřadnice" + ODbL atribuce
OpenStreetMap v provenance odstavci, 3 na soubor).

**Příště:** zbylých 6 silných (od konce: Sedmidolí, Jindřichův dům,
Smetánka…), pak 6 s výhradou, pak DATA-25 bod (a) — 10 vyřazených novým
klíčem — a uzavření Krkonoš s kompletním seznamem otázek. Nově od Michala:
přiblížit 3D mapu panoramatickým mapám (poslal 7 předloh — zimní
panoramata stylu ručně malovaných piste map) — řeším hned po tomhle commitu.

## 2026-07-27 — pokračování 2: fronta DATA-27 otevřena — Jelení Louky, Na Pláni a Helena povýšeny (52 profilů)

**Zadání Michala:** „muzes pokracovat ted.“

**Hotovo:**

**Z fronty povyšování DATA-27 povýšena první trojice „silných“ — Chata
Jelení Louky, Bouda Na Pláni a Bouda Helena. Korpus má 52 publikovaných
profilů.** Ruční běh dovolil WebFetch: weby Na Pláně a Heleny načteny přímo
(checked 2026-07-27) — Helena potvrdila klíčovou větu o neubytovaných
(„…nabízíme pro neubytované hosty telefonickou rezervaci do 20:00…“, 70
míst) i adresu Černý Důl 183; Na Pláni dala kontakty, výšku 1180 m, GPS
(shoda s OSM ~35 m = potvrzená identita „Chata na Pláni“ = „Bouda Na
Pláni“) a doslovné znění historek. **jelenilouky.cz měl 27. 7. PROŠLÝ
certifikát** (nový nález — třída „zanedbaný web“ jako Výrovka/Richtrovy);
profil stojí na citacích rešerše z 26. 7. + Kudy z nudy (načteno dnes,
telefon +420 499 896 212 v dvojshodě KzN × OSM, adresa čp. 77).

**Poctivost drží:** rok 1530 (Na Pláni) i vyprávění o Stauffenbergovi
z března 1944 jsou důsledně připsané webu boudy (próza: „berte celé
vyprávění jako podání provozovatele“); 1530 by byl nejstarší letopočet
korpusu (další je 1623) — proto nevydáván za doložený. Kapacity Na Pláně
(53×50) a Heleny (28×23×20!) nevyplněny, rozpory v próze. Helena je
adresní exponát DATA-20 (Černý Důl × Lučiny/Pec) — do dotazu DATA-20
přidat. Jelení Louky: hospůdka „občerstvit i nasytit po celý den“ (web
i KzN), věta o neubytovaných chybí — přiznáno; kapacita 40 jen
z HotelyPenziony.cz (jediný zdroj, přiznáno). Hero: Na Pláni (76 m,
Semipepino), Helena (34 m, ŠJů — čp. 183 na fotce = adresa z webu, silné
ztotožnění); Jelení Louky BEZ hero (kandidát čp. 76 je sousední usedlost
— adresa chaty je čp. 77; zbytek kandidátů jsou kuriózně snímky Země
z ISS).

**Konvence auditu se znovu vyplatila:** nezávislý průchod (subagent)
vrátil „NENÍ připraven“ u všech tří a **25 nálezů** (2 vysoké: presupozice
„co chata kolemjdoucímu nabízí“ u nedoloženého; „mezi čísly nevybíráme“
u Heleny, zatímco pole výšku neslo; + mj. domyšlený překlad
„Zehgrundbauden = boudy v Zeeho dole“, ~20 m místo ~33 m u GPS shody,
neoznačený redakční superlativ). Vše opraveno před commitem; homepage-URL
tří katalogových zdrojů přiznány v popisech jako „detail dohledat“.

**Měření:** kontrola zelená (validator CHYB 0 na 52 souborech, audit-mech
0, kolize 0, fixtura 4/4); ban-scan 140 → **146** (+6 = přesně vzor
„OpenStreetMap/redakce neověřila“ v závěrečných odstavcích tří nových
profilů — dokumentovaný falešný poplach, žádná nová třída); seed 52 chat
idempotentně; int **216/216**; render všech tří profilů i katalogu 200
(dev server + obsahová kontrola frází). Master aktualizován (52/33/31)
vč. křížové kontroly souborů: 35 kandidátů bez hlavičky POVÝŠENO = 33
tierových + 2 ruční z 26. 7. (Poštovna, Modrokamenná — do tierů zařadit
při revizi, poznámka v masteru).

**Příště:** pokračovat frontou — U Kotle (klíč doslovně splněn), Amor,
Husova bouda, Smetánka, Srebrny Potok… (zbývá 12 silných + 6 s výhradou).
U Kotle má od Michala 20. 7. „zařadit hraničně, potvrdí nad profilem“ —
při povýšení mu profil ukázat.

**Otázky pro Michala:** žádná nová naléhavá — trvá oční kontrola licencí
hero (dnes +2: Na Pláni, Helena) a k DATA-20 přibyl třetí adresní exponát
(Helena). Poznámka: profily Na Pláně a Heleny čerpají z webů načtených
dnes — kdyby ses chtěl mrknout očima, odkazy jsou ve zdrojích profilů.

---

## 2026-07-27 — pokračování: Michal klikl na DATA-02 → fulltext sklizeň, +7 hero (32/49)

**Zadání Michala:** „spustil jsem data-02, az to dobehne, muzes pokracovat."

**Hotovo:**

**Workflow doběhl (commit cbd9774, 74 kandidátních YAML vč. nových oblastí
jizerske-hory a rudawy-janowickie) a z fulltext sklizně vybráno 7 dalších
hero — profily s fotkou 25 → 32 z 49.** Jistota podle síly dokladu: Černá
bouda (geosearch+fulltext, 51 m, popis „Horská 171, Hotel Černá Bouda" —
jediná dnešní s geotagem), Vrbatova bouda (kategorie+fulltext, popis
„Vrbatova Bouda — mountain hut … (right) and buffet (center)"), Bouda
Klínovka a Richtrovy boudy (oba Jiří Komárek, 8288×5520 — u Richtrových je
popis PRÁZDNÝ, objekt jmenuje jen název souboru „Richtrovy boudy (Krkonoše)",
výhrada zapsána nejsilněji), Tetřeví Boudy („Tetřeví boudy v zimě" —
jizerská jmenovka „U Tetřeví boudy" vyřazena), Hotel Špindlerova bouda
(první věta popisu „Špindlerova Bouda.", 6000×4000, Michal Klajban — geosearch
uměl jen parkoviště) a Schronisko Szrenica (Reifträgerbaude2, SchiDD).
Všechny fulltext nálezy jsou BEZ geotagu — v overeni.source každého bloku
je to výslovně, ověření objektu i licence očima = Michal.

**Poctivě dál bez hero (17) a hlavní systémový nález dne: skript DATA-02
zpracuje jen chaty, které mají v YAML GPS.** Dvanáct profilů povýšených
z katalogových/známkových kandidátů bez OSM podkladu (Pod Studničnou, Rezek,
Rozhled, Erlebachova, Kolínská, Lysečinská, Petrova, Pomezní, Portášky,
Pražská, Rychorská, Nad Łomniczką) GPS nemá — nedomýšleli jsme je, takže je
sklizeň vůbec nevidí. Cesty ven: doložit GPS (DATA-04/RÚIAN — stejně je
potřebujeme pro mapu!), nebo skriptu přidat režim „fulltext i bez GPS".
Druhý nález: **Lovecká chata je učebnicový jmenovec** — všech 6 fulltext
nálezů fráze jsou cizí lovecké chaty (Brdy, Žďárské vrchy, Hostěnice,
Květov, Beskydy, Bosna); zapsáno v profilu, hero dá jen chatař. Kochanówka
a Okraj: fulltext nepřidal nic; U Jirky a Friesovy boudy: 0 kandidátů.

**Měření:** kontrola zelená (validator 0, ban-scan drží 140, kolize 0,
fixtura 4/4), seed idempotentní, int 216/216, lint čistý.

**Příště:** fronta povyšování z DATA-27 (Jelení Louky, Bouda Na Pláni,
Helena, U Kotle…). K hero zbytku: GPS dvanáctky (DATA-04/RÚIAN) je
dvojitá výhra (mapa + fotky) — navrhnout Michalovi pořadí.

**Otázky pro Michala:** (1) Oční kontrola objektů a licencí 16 dnešních hero
(9 ranních + 7 fulltext — u fulltextových bez geotagu je klíčová, zvlášť
Richtrovy s prázdným popisem). (2) 12 profilů bez GPS: stačí ti dohledat
souřadnice ručně (mapy.cz → RÚIAN) po jedné při telefonátech DATA-04, nebo
mám skriptu DATA-02 přidat režim „fulltext bez GPS", aby fotky nečekaly na
souřadnice?

---

## 2026-07-27 — denní session (bezobslužný běh): hero fotky devíti profilů z kandidátů DATA-02

**Hotovo:**

**DATA-02 (nejvyšší nehotová položka): redakční výběr hero fotek z už
commitnutých kandidátních metadat — devět publikovaných profilů má hero.**
Martinova bouda (Petr Vodička, CC BY-SA 4.0, 4560×2864), Brádlerovy boudy,
Moravská bouda a Medvědí bouda (vše ŠJů, CC BY 4.0, záběry z 05/2023),
Bouda Růžohorky, Jelenka a Lyžařská bouda (Honza Groh — Jagro, CC BY-SA 3.0),
Výrovka (Stanislav Dusík, CC BY-SA 4.0, geotag 2 m!) a Chalupa Na Rozcestí
(Ladabohac, CC0). Kritérium poctivosti drženo tvrdě: vybráno JEN tam, kde
popis souboru na Commons výslovně jmenuje chatu a geotag je u budovy
(2–95 m); bloky `fotky:` nesou plnou atribuci (autor, licence, zdrojová
stránka, original URL) a `verified: false` — oční kontrolu licence na stránce
souboru udělá Michal, sandbox na Commons nedosáhne (výběr proveden nad
exportem z 20. 7., přiznáno v `overeni.source`).

**Poctivě BEZ hero:** Kochanówka — všech 35 geosearch kandidátů zobrazuje
vodospad Szklarki a okolí, žádný popis nepotvrzuje budovu; Richtrovy boudy —
jediný kandidát („Outside Pec pod Sněžkou", 152 m) budovu nepotvrzuje. Obojí
zapsáno v `interniPoznamky` profilů; pomůže až fulltext sklizeň (klik) nebo
oční výběr. Stav korpusu: **25 z 49 publikovaných profilů má hero** (bylo 16);
zbylých 22 bez hero: 19 kandidáty nemá (15 profilů z povyšování 25.–26. 7.
bez kandidátního YAML — geosearch pro ně nikdy neběžel + 4 s prázdným YAML
vč. Tetřevek) a 3 zamítly už sessions 29/31 (Špindlerovka, Szrenica, Okraj).

**Měření:** `npm run kontrola` zelené (validator CHYB 0, audit-mech 0,
kolize 0, zdroje 0, ban-scan drží 140 známých zásahů — žádný nový, fixtura
4/4). V sandboxu poprvé postaven lokální Postgres → **seed prošel plný
(SEED_BEZ_FOTEK=1) a idempotentně**, int testy **216/216** (25 souborů —
vč. tří DB-závislých, které bez DB neběží), lint i tsc čisté.

**Příště:** (1) po Michalově kliku na DATA-02 fulltext workflow projít novou
sklizeň — klik pokryje i 15 profilů bez kandidátních YAML (geosearch pro ně
neběžel; skript bere profily z `data/chaty/**` automaticky, stačí jeden
re-run); (2) fronta povyšování z DATA-27
(Jelení Louky, Bouda Na Pláni, Helena, U Kotle…) — materiál s citacemi je
připravený; (3) DATA-25 bod (a) — 10 vyřazených projít novým klíčem.

**Otázky pro Michala:** žádná nová — trvá klik na „DATA-02: fotky chat
z Wikimedia Commons" (Actions → Run workflow; teď pokryje i 18 nových
profilů bez kandidátů a 4 kandidáty mimo Krkonoše) a oční kontrola licencí
devíti dnešních hero (pak `overeni.verified: true` u bloku fotky).

---

## 2026-07-27 — pokračování 8: 3D mapa naostro (P0 + lanovky s opravou) a druhá trojice fronty (55 profilů)

**Zadání Michala:** vize 3D mapy „jdeme to rovnou udělat, pracuj samostatně";
k tomu screenshot s nálezem „to jsou vleky v detailu? nevypada to dobre";
průběžně „pokracuj samostatne dal".

**Hotovo:**

**3D mapa — P0 balík naostro (DATA-28).** Šablona dostala: posuvník hodiny dne
se skutečnou drahou slunce a stínovými mapami terénu; noc s hvězdami, měsíčním
světlem a SVÍTÍCÍMI boudami (jen publikované v provozu; v patě výslovně
„dekorace, ne data"); přepínač léto/podzim/zima se zasněženou zimní rampou;
plující stíny mraků; fly-to kameru na klik; muzejní sokl s bočnicemi
z obrysové výšky terénu a rohovými kótami. Pipeline data28 rozšířena o vrstvy
`aerialway` a `waterway`; workflow nově běží i na push při změně generátoru
nebo šablony — **push trigger ale nezafungoval** (běh se nespustil; příčina
nezjištěna, ruční Run workflow funguje — nechat jako známý stav, neřešit
naslepo). Michal spustil běh ručně: **295 lanovek a vleků, 1 330 řek
a pojmenovaných potoků** (běh #4, 2m 46s).

**Michalův nález na mobilu: vleky vypadaly jako rozbité zipy — potvrzeno
a opraveno.** Příčina: lano kopírovalo každý bod OSM s výškou z NEJBLIŽŠÍHO
uzlu mřížky (~230 m buňka), takže skákalo po schodech terénu, a podpěra stála
u každého druhého bodu. Oprava: (a) `eleNa()` nově **bilineární interpolace**
— vyhladila i trasy, řeky a piny; (b) lanovka je **rovná vzdušná úsečka mezi
stanicemi** s podpěrami od terénu k lanu po ~350 m (instancovaně) a mírným
průvěsem; (c) kabinky jen na kabinových/sedačkových (jeden InstancedMesh);
(d) **vleky odděleně** — tenčí, světlejší, výchozí stav VYPNUTO (nový
přepínač) → shluky ve skiareálech zmizely; (e) lana batchovaná do dvou
LineSegments. Ověřeno headless renderem, konzole čistá.

**Druhá trojice fronty DATA-27 — od konce, aby se nesrazila s paralelní
session (ta ráno povýšila Jelení Louky, Na Pláni a Helenu):**

**Srebrny Potok** — s opravou vlastního staršího zápisu: leží nad Jarkowicemi
na Grzbietu Lasockém (východní okraj polských Krkonoš, 615 m), NE u Przełęczy
Okraj. Nejníže položený a nejvýchodnější objekt korpusu; bar, nepřetržitý
celoroční provoz; kapacita 45 (vlastní web) × 35 (Naszesudety) přiznána.
Historie: hledali jsme a nenašli.

**Patejdlova bouda** — účelová chata Univerzity Karlovy (vzor Richtrovy):
46 lůžek / 13 pokojů pro posluchače a zaměstnance, veřejnosti neslouží
a próza to říká v perexu. Rok **1710** (vídeňská rodina Eichlerů) a převzetí
univerzitou **1961** připsány univerzitnímu magazínu — bez dokladu,
nevydáváno za doložené.

**Barborka** — **první profil korpusu se stavem `mimo-provoz`**: vlastní web
doslova „Z důvodu havarijního stavu objektu dočasně uzavřeno." Výška záměrně
nezapsána (jediný katalog si na dvou stránkách protiřečí 1000 × 1010 m),
kapacita nezapsána (15 × 20+5 × 25 z éry provozu). Jmenovec v Horní Malé Úpě
veden zatím interně dle DATA-17. V zásobě 51 fotokandidátů z Commons.

**Měření:** validator CHYB 0, `audit-mech` nula, `kolize-jmen` nula (226
souborů / 91 objektů), fixtura 4/4. `ban-scan` 140 (po 49) → **155** (po 55):
+9 mé trio (vše OpenStreetMap/ODbL připsání + slovo „souřadnice"), +6 ranní
trojice paralelní session — žádná nová třída.

**Příště:** zbývá 9 silných (U Kotle, Amor, Husova, Smetánka, Jindřichův dům,
Sedmidolí, Betyna, Na Lučinách, Náchodská) + 6 s výhradou; pak DATA-25 bod (a)
— 10 vyřazených novým klíčem — a uzavřít Krkonoše s kompletním seznamem
otázek pro Michala.

---

## 2026-07-26 — pokračování 7: Tier 4 komplet ztriážován — 15 + 6 do fronty povyšování, plné citace v DATA-27

**Zadání Michala:** „pokracuj samostatne komplet tier 4."

**Hotovo:**

**Všech 32 kandidátů Tier 4 prošlo rešerší a má verdikt.** Rešerše běžela
čtyřmi paralelními běhy s protokolem doslovných citací (úniková formulka,
zákaz domýšlení) — dohromady ~330 dotazů. Výstup je nový dokument
**`docs/DATA-27-tier4-triaz.md`**: u každého objektu verdikt + doslovné citace
s URL, ze kterých při povyšování vznikne profil bez nové rešerše; zkrácený
verdikt je zapsaný i v `interniPoznamky` každého kandidáta.

**Souhrn verdiktů: 15 silných do fronty povyšování** — mezi nimi tři perly:
Chata Jelení Louky (hospůdka s tradicí od **1731**, výčepní oprávnění Karla
Zee, do 1945 Zehgrundbauden), Bouda Na Pláni (Rennerové **1530** dle vlastního
webu — jen s připsáním; a březen **1944**: setkání odpůrců nacismu včetně
Stauffenberga) a Patejdlova bouda (**1710**, dnes chata Univerzity Karlovy —
vzor Richtrovy). Klíč doslovně splněn u Boudy Helena („pro neubytované hosty
telefonickou rezervaci") a U Kotle („otevřen i pro veřejnost…"). Smetánčin
verdikt „penzion" z 20. 7. je REVIDOVÁN — Kudy z nudy dokládá hostinské
pokoje ~1900 a přejmenování na Smetanovu boudu 1945. Barborka půjde jako
první profil se stavem **mimo-provoz** („Z důvodu havarijního stavu objektu
dočasně uzavřeno"). **6 s výhradou** (Slovanka, Studenov, Zákoutí, Na Muldě,
obě Mísečné). **Mamut vyřazen trvale** (čistý pronájem bez stravování i bez
minulosti), **Javorka zůstává nedoložená** (jen rozcestník; Archa Krkonoš
nedostupná). **Do otázek:** Konopinda (spolková lyžařská historie 1927/Kazbek/
Svaz lyžařů — je to „služba turistům"?), Aurora (chata 1880–1890 bez
občerstvení), čtyři polské zamčené spolkové chatky (AKT 1908, Wielkanocna,
Smogorniak, Puchatka — identita Puchatky VYŘEŠENA: schron v Sowí Dolině)
a forma Míseček (jeden areál × dva profily).

**Drobné opravy starších zápisů z rešerše:** webkameru u boudy Na Muldě
provozuje dle odkazu Humlnet, ne Horská služba; Srebrny Potok leží nad
Jarkowicemi na Grzbietu Lasockém, ne u Przełęczy Okraj; Zákoutí je
jednoznačně Vítkovice 297 (harrachovská „Chata V Zákoutí" je jiný podnik);
u Studenova stojí vedle sebe DVA objekty (72 + 25 lůžek) — náš je dle GPS
ten první.

**Měření:** `npm run kontrola` zelené (49 profilů beze změny, kandidáti
aktualizováni, kolize 0, fixtura 4/4).

**Příště:** psát profily z fronty — pořadí podle síly materiálu: Jelení
Louky, Bouda Na Pláni, Helena, U Kotle, Amor… (15 + 6). Pak už jen zbytky
(DATA-25 bod a — 10 vyřazených) a uzavřít Krkonoše s kompletním seznamem
otázek.

---

## 2026-07-26 — pokračování 6: Tier 3 dojet — tři povýšení (49 profilů), dva kandidáti blokovaní otázkou

**Zadání Michala:** „pokracuj dal." (Otázky se dál střádají na konec Krkonoš.)

**Hotovo:**

**Tier 3 zpracován celý — tři povýšení, dva odklady s důvodem. Korpus má 49
publikovaných profilů.**

**Chata Pod Studničnou:** chata KČT v Obřím dole (890 m, 47 lůžek / 15 pokojů,
adresa u nástupní stanice lanovky na Sněžku). Pod starým klíčem „z celé dávky
nejprůkazněji" neprošla — obě prezentace na přímý dotaz vrátily, že věta
o občerstvení pro kolemjdoucí na stránce není; pod DATA-25 povýšena a próza tu
nejistotu říká nahlas („poloha u nástupu na Sněžku k té domněnce svádí — a právě
proto ji odmítáme domýšlet"). Zajímavost z KČT: dnešní jméno nese chata jen
posledních šedesát let; starší jméno a rok stavby zůstávají k dohledání.

**Erlebachova bouda:** hřeben nad Špindlem (1 150 m), dnes část resortu Svatý
František. rokVzniku 1784 z jediného sekundárního pramene (Kudy z nudy — „kdysi
skromné útočiště pro poutníky") — připsáno, nevydáváno za doložené. Restaurace
Panorama denně 11–21 podle vlastního webu; věta o neubytovaných nikde, přiznáno.
Kapacita nezapsána — prameny popisují resort (čtyři budovy), číslo samotné boudy
nepadlo. **Josefova bouda = adept na kandidáta** (precedent Dvoračky × Štumpovka)
— do otázek.

**Schronisko PTTK „Nad Łomniczką":** první publikovaný objekt korpusu **bez
noclehu** (PTTK: „nie posiada miejsc noclegowych" + „oferuje wyżywienie") —
občerstvovací zastávka na sudetské magistrále pod Sněžkou, rokVzniku 1901
(a hned nato zkáza kamenitou lavinou, per Trasygorskie). Hlavní věc je přiznaný
**spor o dnešní provoz**: správce PTTK vede objekt jako fungující, dva polské
portály hlásí remont/nieczynny — stav: v-provozu zvolen podle oficiálního
pramene provozovatele, próza důrazně varuje a dotaz na PTTK (spojitelný
s Kochanówkou) to rozhodne.

**Dva kandidáti Tier 3 zůstávají, oba blokované otázkou, ne leností:**
Hrnčířské boudy nejsou objekt, ale enkláva (Chata Mír, Náchodská bouda,
Hájenka, Cihlářka) — profil osady by byl fikce; DATA-25 na tom nic nemění,
překážka je objektovost, ne služba. Raisova chata na Zvičině je Podkrkonoší —
klíč splněný má, ale oblast podkrkonosi neexistuje a vymyslet si ji nesmím;
navíc nájemní smlouva provozovatele končí 31. 7. 2026, takže provozní údaje
budou za pár dní stejně k přeověření.

**Měření:** `npm run kontrola` zelené — 49 souborů, validator CHYB 0, audit-mech
A–F nula, kolize-jmen nula, fixtura 4/4; `ban-scan` 137 → **140** (+3 = přesně
jeden zásah na každý nový profil, ve všech třech jde o slovo „souřadnice" ve
vzoru GPS — dokumentovaný trvalý falešný poplach, žádná nová třída). Při psaní
se navíc chytly a hned opravily dva skutečné zásahy, které by jinak prošly:
slovo „profilu" a slovo „ceny" v próze Chaty Pod Studničnou — ban-scan se
osvědčil jako brzda i při psaní, ne jen při auditu.

**STŘÁDANÉ OTÁZKY NA MICHALA (zatím čtyři nové z dneška):** (1) Hrnčířské boudy —
rozpustit na jednotlivé boudy, nebo vést jen jako místopisný pojem? (2) Raisova
chata na Zvičině — založit oblast Podkrkonoší, nebo odložit za pilot?
(3) Josefova bouda (resort Sv. František) — založit kandidáta? (4) Sněžka —
observatoř s restaurací na polské straně: posoudit po doložení, co nabízí.
Plus trvající: Jelenka 25/26 lůžek, sémantika `obec` (DATA-20), rotace tokenů,
telefonáty DATA-04 (teď 7 otázek na 7 objektů), rozpor čísla Modrokamenné
2640 × 2540.

**Příště:** Tier 4 — 34 OSM kandidátů (hodně vyřazování: pojmenované sjezdovky,
soukromé chalupy…); pak DATA-25 bod (a) — projít 10 vyřazených novým klíčem;
pak už jen zbytky a uzavřít Krkonoše.

---

## 2026-07-26 — pokračování 5: klíč zařazení rozšířen o turistickou minulost → povýšena celá držená čtveřice (46 publikovaných profilů)

**Zadání Michala:** *„všechny boudy, které sloužily turistům i v minulosti (a teď tomu
tak není), bych uvedl, jen u nich bude poznámka, že neslouží veřejnosti. ale třeba na
Medvědí jsme si minulé léto dávali borůvkové knedlíky a nebydleli jsme tam. zbytek si
ověřím, ty pracuj samostatně dál podle plánu, otázky mi dej až na konci — až uzavřeš
Krkonoše."*

**Hotovo:**

**Klíč zařazení rozšířen (DATA-25, zapsáno v plan.md §Taxonomie):** rozhoduje služba
turistům v celé historii objektu, ne jen dnes; kdo dnes veřejnosti neslouží, dostane
poctivou poznámku, ne vyřazení. Mimo průvodce zůstávají jen čisté pronájmy bez
turistické služby kdykoli v historii. Tvoje svědectví z Medvědí (borůvkové knedlíky
v létě 2025 bez noclehu) je zapsané v profilu jako datovaný pramen — a stojí v próze
vedle dnešní věty webu „jen pro ubytované": nerozhodnuto, přiznáno.

**Povýšena celá čtveřice držená na staré bráně — korpus má 46 publikovaných profilů:**

**Medvědí bouda (č. 1274):** 1 060 m na úbočí Medvědína, až 145 hostů (vlastní web),
kořeny v budním hospodářství počátku 19. století „již spojeného s ubytováním pro
návštěvníky hor", přestavba v 70. letech. rokVzniku záměrně prázdný (web nedává
letopočet). Bouda má dvě živé webové domény — obě ve zdrojích, poznámka v profilu.
Kandidátská čísla kapacity 110/120 „dle různých zdrojů" byla bez pramene — nepřevzata.

**Richtrovy boudy (č. 1602):** jediná položka Tier 1; ranní verdikt „nepovyšovat"
revidován novým klíčem, materiál beze změny. Profil nese celou vlastnickou linku
(1946 Obchodní akademie → 1950 ministerstvo školství → NIDV/NPI → 27. 11. 2020
Policejní prezidium, primární pramen ÚZSVM), šest milníků, a hlavně poctivý třetí
odstavec: školicí středisko bezpečnostních sborů, firemní zápis neaktivní, popisy
restaurace předpřevodové — ale známka je i v letošním seznamu vydavatele, takže úplně
uzavřený svět to nejspíš není. Rozpory přiznány: výška 1136 × 1206 m, čtyři čísla
kapacity (žádné nezapsáno).

**Chata Rozhled (č. 14):** roubenka nad Strážným, 1 207 m — číslo se vzácně shoduje
ve třech pramenech včetně rytiny známky. Bufet doložen, komu slouží, neříká nikdo —
próza to přiznává. Kapacita nezapsána (26 × 55 × rozpis 24). GPS nemáme — na mapě
se neukazuje, „raději prázdné místo než odhad".

**Pražská bouda (č. 2249):** horský hotel na křižovatce mezi Pecí, Černou horou
a Černým Dolem, 1 115 m, 24 pokojů, restaurace s barem a otvíračkou 11–22 denně
(firemní katalog) — výslovná věta o neubytovaných ale nikde, přiznáno. `obec`
přepsána na adresní **Černý Důl** (katalogová „Pec pod Sněžkou" neměla oporu) —
exponát DATA-20. Historie nedoložena vůbec a profil to říká nahlas.

**Známky nasazeny (24 z Michalova zipu je na webu, 0 čeká):** kotouče 14, 1274
a 1602 zkopírovány do public/, manifest i katalog doplněny ručně po vzoru
stávajících záznamů. **Při tom druhý úlovek třídy DATA-24 → DATA-26:** zkušební
regenerace katalogu přes `data10` by **smazala šest ručně kurátorovaných známek
a tři degradovala** — JSON není čistě generovaný soubor, nese kurátorská data,
která vstupní CSV nemá. Vráceno z HEAD, čtyři nové záznamy doplněny ručně;
data10 se do rozhodnutí (merge / CSV jako zdroj pravdy / zámek) nepouští naostro.
A ještě rozpor: fyzický kotouč Modrokamenné nese **č. 2640**, oficiální seznam
**2540** — dvě čísla z téhož vydavatele, ověřit u něj.

**Měření:** `npm run kontrola` zelené — 46 souborů, validator CHYB 0, `audit-mech`
A–F nula, `kolize-jmen` nula (210 souborů / 91 objektů), fixtura 4/4. `ban-scan`
**129 → 137**, doměřeno soubor po souboru: +8 = přesně nové profily (Medvědí 3,
Richtrovy 3, Rozhled 1, Pražská 1), všechno zdokumentované trvalé falešné poplachy
(ODbL připsání OpenStreetMap, slovo „souřadnice" ve vzoru GPS). Žádná nová třída.

**Příště (směr „uzavřít Krkonoše"):** Tier 3 — Chata Pod Studničnou, Erlebachova
bouda, Hrnčířské boudy, Raisova chata na Zvičině (pozor: Zvičina je Podkrkonoší —
posoudit příslušnost k pilotu), Nad Łomniczką; pak Tier 4 (34 OSM kandidátů,
hodně vyřazování); pak DATA-25 bod (a) — projít 10 vyřazených novým klíčem.
Otázky pro Michala se střádají a dostane je najednou, až se Krkonoše uzavřou.

---

## 2026-07-26 — pokračování 4: Tier 2 přeověřen — Rozhled, Medvědí ani Pražská klíčem neprošly; všechny čtyři držené kandidáty teď rozhodne telefonát

**Zadání Michala:** „pokracuj tier 2."

**Hotovo:**

**Tier 2 (Chata Rozhled č. 14, Medvědí bouda č. 1274) — přeověřen, ani jedna nepovýšena.**
Obě už jednou branou prošly 25. 7.; dnešní přeověření stav potvrdilo, s čerstvými
doslovnými citacemi. **Chata Rozhled:** vlastní web má bufetovou větu beze změny
(„Bufet s nápoji a sladkostmi v provozu po celý den.") a o určení bufetu dál mlčí;
druhý pramen (ceskehory) přidal kapacitu 26 lůžek, lokalitu Přední Rennerovky a zimní
dopravu rolbou — ale větu o veřejnosti taky nemá. **Medvědí bouda:** web dnes doslova
„Pro naše ubytované hosty nabízíme útulnou horskou restauraci s domácí kuchyní." —
jiná formulace než 25. 7., obsahově totéž: jen pro ubytované. Nově vytěžena historická
věta (vznik na počátku 19. století jako budní hospodářství s ubytováním) — do kandidáta,
pro budoucí profil.

**Bonus mimo zadání, ale v logice fronty: Pražská bouda je podle DATA-22 fakticky
Tier 1** (známka č. 2249 + katalog — tabulky tierů vznikly před vydavatelovým seznamem).
Přeověřena třemi prameny: Firmy.cz vede samostatný zápis „Pražská bouda - Restaurace"
s otvírací dobou 11–22 denně a popisem „Provozujeme restauraci a bar.", Kudy z nudy má
24 dvoulůžkových pokojů, ceskehory sál pro 100 lidí a výšku 1115 m. **Věta o obsluze
neubytovaných ale není nikde** — a exponát Medvědí dokazuje, že hotelová restaurace
může být jen pro hosty. Nepovýšena; veřejná otvíračka na Firmy.cz je zatím nejsilnější
signál, rozhodne telefonát.

**Nová past matcheru DATA-22 (č. 5 v hlavičce skriptu):** `1935 Chata Hubertka,
Jizerské hory` se s naším kandidátem páruje neprávem — jadro() odřízne krajový
přívlastek, jenže tady to není ozdoba, ale rozlišovač jmenovců: známka patří objektu
v Jizerských horách, náš kandidát z OSM je od Benecka (past třídy DATA-17). Alias
nepřidán, zapsáno.

**Souhrn brány po dnešku: čtyři kandidáty se známkou (Richtrovy, Rozhled, Medvědí,
Pražská) drží jedna a táž otázka — „obsloužíte i neubytovaného turistu?" — a všechny
čtyři ji vyřeší jeden telefonát na kus (DATA-04).** Do té doby se z master fronty
povyšovat nedá; Tier 3/4 jsou na tom hůř (bez známky), takže další autonomní práce
vede spíš na trasovou pipeline (DATA-06) nebo dotažení Poštovny.

**Měření:** `npm run kontrola` zelené, ban-scan drží 129 (měněny jen kandidáti, docs
a hlavička skriptu), kolize-jmen 0, fixtura 4/4.

**Příště:** buď DATA-06 (trasová pipeline — velký blok fáze 1), nebo po tvých
telefonátech dorazit povýšení připravených kandidátů (materiál je u všech čtyř
nachystaný v kandidátských souborech).

**Otázky pro Michala:** (1) **Čtyři telefonáty** (čísla jsou v kandidátech; Rozhled ho
má jen na webu): Richtrovy boudy, Chata Rozhled, Medvědí bouda, Pražská bouda — otázka
u všech stejná: „obsloužíte i neubytovaného turistu?" (2) trvají: Jelenka 25/26 lůžek,
sémantika `obec`, rotace tokenů.

---

## 2026-07-26 — pokračování 3: pokus o Tier 1 povýšení zastaven — Richtrovy boudy od 2020 patří Policejnímu prezidiu

**Zadání Michala:** „pokracuj samostatne dal podle planu."

**Hotovo:**

**Richtrovy boudy (jediná položka Tier 1 master fronty) — NEPOVÝŠENY, a to je výsledek,
ne selhání.** Kandidát nesl podmínku „povýšit až po doložení provozu" a rešerše ji
nesplnila, nýbrž vyvrátila: podle primárního pramene (ÚZSVM) byl areál **27. 11. 2020
předán Policejnímu prezidiu** jako školicí středisko pro příslušníky bezpečnostních
sborů, firemní zápis objektu je vedený jako **neaktivní**, a všechny stránky, které
popisují veřejnou restauraci (treking, ceskehory — „účelové zařízení NIDV", VisitCzechia),
jsou nedatované a nejspíš z éry před převodem. Zda dnes objekt slouží veřejnosti — na čemž
stojí klíč zařazení — tedy doloženo není. Do kandidáta je zapsán kompletní materiál na
budoucí profil: vlastnická linka 1946 Obchodní akademie → 1950 ministerstvo školství →
NIDV/NPI → 2020 Policejní prezidium; historie (Richtrova bouda postavena před 1911,
požár 1938, Červená bouda 1934 jako depandance 300 m); **čtyři různé kapacity** (50/18 ×
77+29 × „přes 100" × 106/34 — nesčítáno, pole prázdné) a **rozpor výšky** 1136 (OSM) ×
1206 m (tři weby). Protiznak, který kandidaturu drží při životě: známka č. 1602 je i ve
vydavatelově seznamu z ČERVENCE 2026, takže nějaký veřejný prodej nejspíš existuje.
Rozhodne telefonát (DATA-04) nebo tvůj pohled na web (sandbox ho nenačte — rozbité
HTTPS už 20. 7., teď PROVENANCE). Master fronta je u Tier 1 anotovaná; další na řadě
je Tier 2 (Chata Rozhled, Medvědí bouda).

**Rozhledna Panorama — prověřena, NEZAKLÁDÁ SE.** Dva prameny (Kudy z nudy, krajský
katalog) ji popisují — upravená předposlední podpěra lanovky z 1928, rozhledna od 1998,
plošina 21 m ve výšce 1289 m, 100 m od horní stanice — a **ani jeden u ní neuvádí
občerstvení**. Bez občerstvení klíčem DATA-23 neprochází. Zapsáno v BACKLOGu
s podmínkou znovuotevření, kdyby se občerstvení doložilo.

**Vedlejší nález při prověřování Černé hory:** Sokolská bouda (zanikla 2019 podle Archy
Krkonoš; na místě se připravuje minipivovar) — prověřeno, že **zaniklé pipeline o ní ví**
(`data/zanikle/krkonose.json` ji vede), takže žádná mezera.

**Měření:** validator kandidáta CHYB 0, `npm run kontrola` zelené, ban-scan drží 129
(měněn jen kandidát a docs).

**Příště:** Tier 2 master fronty — Chata Rozhled (č. 14) a Medvědí bouda (č. 1274):
stejný postup, napřed doložit provoz a klíč zařazení, pak teprve psát. Nebo počkat na
tvou odpověď k Richtrovým boudám a dorazit Tier 1.

**Otázky pro Michala:** (1) **Richtrovy boudy** — otevře se ti richtrovyboudy.cz
v prohlížeči? Slouží restaurace veřejnosti i po převodu na Policejní prezidium? (ANO →
povýším, materiál je nachystaný; NE → vyřadit, nebo vést mimo provoz?) (2) trvají:
Jelenka 25/26 lůžek, povýšení kandidátů se známkou, sémantika `obec`, rotace tokenů.

---

## 2026-07-26 — pokračování 2: sedm profilů prověřeno u vydavatele známek — žádný známku nemá; vydavatel má i suvenýry

**Zadání Michala:** „pokracuj dal."

**Hotovo:**

**DATA-22 bod (3) — sedm publikovaných profilů bez shody v seznamu vydavatele prověřeno,
výsledek: žádný z nich turistickou známku nemá.** S podstatnou výhradou k síle dokladu:
**detailní stránky vydavatele se ze sandboxu nově nenačtou** (smyčka přesměrování),
takže doklad jsou titulky ve vyhledávání omezeném na doménu vydavatele, ne projití
katalogu — je to „hledali jsme a nenašli", ne důkaz. Po jednom: Černá bouda, Chata
U Jirky, Dvorská bouda, Horská chata Krakonoš, Lesní bouda (vizitku CZ-1632 vedeme dál),
Lovecká chata, Vebrovy boudy — všude známka nenalezena.

**Tři vedlejší nálezy hledání stojí za víc než hlavní výsledek:** (a) **vydavatel vede
i jiné produktové řady než známky** — u Černé boudy existuje SUVENÝR č. 833 „Hotel Černá
Bouda"; filtr `jeStazitelna` z DATA-13 je stavěný jen na známky, takže je správně
nepustí, ale při čtení katalogu se to teď musí rozlišovat (suvenýr ≠ známka). Zapsáno
do `interniPoznamky` profilu Černé boudy i s druhou položkou: známka č. 18 „Černá hora
1299m" je pro HORU, ne pro boudu — táž logika jako Sněžka × Poštovna. (b) **`673 Pomezní
boudy` je na webu vydavatele vidět** — potvrzení z vydavatelovy strany, že ve filtrovaném
xlsx chybí neprávem. (c) **`2048 Rozhledna Panorama - Černá Hora, Krkonoše`** — druhý
krkonošský adept rozšířeného klíče DATA-23 (po Sněžce); jestli má občerstvení, zatím
nedoloženo, prověřit před založením. A ještě `680 Vrbatovo Návrší` — samostatná známka
vedle `393 Vrbatova bouda`; návrší ≠ bouda, do profilu se nepřidává.

**Poštovna — malé dotažení:** Overpass export DATA-01 prověřen (60 prvků, filtroval
boudy) — poštovna v něm není, GPS tedy zůstává k ručnímu dotažení; zapsáno do kandidáta,
ať se hledání neopakuje.

**Měření:** `npm run kontrola` zelené, `ban-scan` drží 129 (měněny jen `interniPoznamky`
a kandidát — neskenovaná pole), `kolize-jmen` 0, fixtura 4/4.

**Příště:** projít katalog vydavatele doopravdy, až bude cesta k detailním stránkám
(Actions, nebo Michal ručně) — povýšit „hledali jsme a nenašli" na doklad. Nebo
prověřit občerstvení u Rozhledny Panorama (druhý adept DATA-23).

**Otázky pro Michala:** trvají z minula — Jelenka (25/26 lůžek), povýšení kandidátů se
známkou (teď jich je šest), sémantika `obec`, rotace tokenů.

---

## 2026-07-26 — pokračování: Sněžka rozhodnuta, DATA-24 hotová, dva noví kandidáti (Poštovna, Modrokamenná)

**Zadání Michala:** „snezka - udelal bych profil kazdeho objektu zvlast" + „pokracuj
samostatne dal."

**Hotovo:**

**Rozhodnutí o Sněžce zapsáno (DATA-23) a hned provedeno.** Objekt průvodce na Sněžce je
každá stavba sama za sebe. Poštovna klíčem prochází (občerstvení dokládá vlastní web
doslovnou větou) → **založen kandidát `postovna-na-snezce`**. Kaple občerstvení nemá,
pod dnešním klíčem se nezakládá — rozhodnutí o granularitě klíč nerozšiřuje. Polská
observatoř se posoudí, až bude doloženo, co veřejnosti nabízí. Dom Śląski se nemění.
Rešerše Poštovny stojí na čtyřech pramenech (vlastní web, Krkonose.eu, Kudy z nudy,
archiweb) a nese dvě poučení z DATA-21 rovnou v datech: **rokVzniku je 2007** (symbolické
otevření dnešní budovy; plný provoz 10. 8. 2008), ne 1899 — tradice místa a stavba
budovy jsou dvě veličiny (poučení Kolínská); a **1603 × 1602 m se NEzapisuje jako
rozpor**, protože vlastní web mluví o poštovně a archiweb o hoře — dvě veličiny, ne
neshoda (poučení Hala Szrenicka). Skutečný rozpor je jinde a je přiznaný: první poštovna
byla otevřena 1. září 1899 (Krkonose.eu), nebo 11. září (Kudy z nudy)? Nerozhodnuto.
Známka č. 20 „Sněžka" je vydána pro horu — vazba na poštovnu se bez dokladu o prodejním
místě neuzavírá (logika Rezek).

**DATA-24 hotová — a nutnost pojistky jsem předvedl sám na sobě.** `data09` otočen na
`--zapis` (výchozí běh nasucho). Při ověřování jsem si přes `git stash` odložil vlastní
úpravu a pustil „pro kontrolu" skript bez argumentů — jenže tím jsem pustil **starou
verzi**, a ta okamžitě zapsala do pracovního stromu přesně ty tři hodnoty, které DATA-21
téhož dne zamítla (telefon dopravce, rok koupě 1927, součtová kapacita 65). Vráceno
z HEAD, do commitu se nic nedostalo — ale lepší důkaz si položka nemohla přát. Audit:
`writeFileSync` má 16 skriptů, do `data/chaty/**` zapisoval jedině data09. Zbytkové
riziko vedeno v BACKLOGu: nasucho běh ty tři zamítnuté hodnoty navrhuje dál, katalog je
pořád nese.

**Triáž DATA-22 bodu (2) — a oprava vlastního zápisu: „čtyři krkonošské položky" byly
tři.** Položku 3080 jsem do seznamu zapsal podle jména, bez kontroly — **Mariánskohorské
Boudy jsou osada v CHKO Jizerské hory** u Albrechtic a Josefova Dolu; infocentrum tam
otevřeli 12. 6. 2026, provozuje ho krajská organizace STŘEVLIK a má „drobné občerstvení,
možnost posezení a WC", takže pod rozšířeným klíčem kvalifikuje — ale až pro budoucí
oblast, ne pro pilot. **`2540 Modrokamenná Bouda` je jediná, ze které je objekt: založen
kandidát** — veřejnou restauraci dokládá web obce Janské Lázně doslovnou větou „pro
veřejnost slouží restaurace" (pozor: stránka obce má rozbité kódování, citace
rekonstruovány; vlastní web boudy se ze sandboxu nenačte — smyčka přesměrování; výška
787 × 790 m je skutečný rozpor a je vedený v kandidátovi). **`1592 Luisino údolí`
nezakládat** — podle Turistika.cz soubor historických roubenek podél Husího potoka,
scenérie, žádný objekt s občerstvením. **`1909 Horní Mísečky` nezakládat** — jméno
osady; Novomísečnou a Staromísečnou boudu už jako kandidáty vedeme.

**Měření:** `npm run kontrola` zelené — validator CHYB 0 (i s oběma novými kandidáty),
`ban-scan` drží 129 (kandidáti se neskenují, korpus se neměnil), `audit-mech` nula,
`kolize-jmen` nula při 206 souborech / 132 jménech / 91 objektech, fixtura 4/4.
Seznam vydavatele po založení Modrokamenné páruje 22 + 6 kandidátů, bez shody 100.

**Příště:** DATA-22 bod (3) — u sedmi profilů bez shody ověřit u vydavatele, jestli
známku mají (Černá bouda, U Jirky, Dvorská, Krakonoš, Lesní, Lovecká, Vebrovy). Nebo
dotáhnout kandidáta Poštovny (GPS, provozovatel) k povýšení.

**Otázky pro Michala:** Sněžka je rozhodnutá (díky). Trvají: (1) **Jelenka** — 26 lůžek
ve čtyřech pokojích, nebo 25 v pěti? (2) povýšit některé ze **šesti** kandidátů se
známkou v seznamu vydavatele (Chata Rozhled, Medvědí bouda, Richtrovy boudy, Chata
Hubertka, Pražská bouda — a nově Modrokamenná bouda)? (3) sémantika pole `obec`
(DATA-20). (4) rotace GitHub tokenu a klíče Mapy.com v zadání naplánované session.

---

## 2026-07-26 — navazující session (Opus, inline): DATA-21 uzavřena — polovina katalogových návrhů byla vadná. Plus první primární seznam vydavatele známek

**Zadání Michala:** „pokračuj samostatně dál." Vzato **DATA-21**, první nehotová položka,
kterou jde dodělat bez tvého rozhodnutí. Uzavřena celá; z ní vypadly tři nové položky
(DATA-22, DATA-23, DATA-24).

**Hotovo:**

**DATA-21 — osm profilů, osm katalogových údajů, poměr 4 : 4.** Katalog `data09` navrhoval
doplnit prázdná pole u osmi profilů. Každý návrh se ověřoval proti prameni, který u něj
katalog uvádí jako zdroj. **Čtyři návrhy potvrzené, čtyři odmítnuté** — a to je hlavní
zpráva dneška: kdyby se skript pustil naostro, jak to dělá ve výchozím stavu, **zapsal by
do publikovaných profilů čtyři vady**. Odmítnuté: Martinova bouda 1642 (pramen ten rok
nenese; zapsán 1795 odjinud), Výrovka kapacita 65 (**součet** dvou různě spolehlivých
čísel, ne údaj pramene — pole zůstává prázdné), Brádlerovy boudy telefon (číslo patří
**smluvní dopravě**, ne boudě) a Kolínská bouda 1927. Ta poslední je z celé série
nejzajímavější: **rok v prameni je, ale je to rok koupě, ne stavby.** Kronika boudy je
obsáhlá, popisuje devadesát let dějin a rok postavení **neuvádí vůbec**, takže
`rokVzniku` zůstává prázdné a devět doložených milníků 1927–2017 nese `milniky`.
Potvrzené: Moravská bouda 1876, Jelenka 1936, Lyžařská bouda 1717 + 1930, Friesovy boudy
(katalog nabízel tři milníky, ověřením jich vyšlo devět).

**Uzavřena i tvoje otázka „Kolínská je 1719".** Nebyl to rozpor s katalogovým rokem 1927,
byly to **dvě různé veličiny vedle sebe: 1719 je číslo turistické známky.** Potvrzuje to
oficiální seznam vydavatele, který nese položku `1719 Kolínská bouda - Pec pod Sněžkou`.

**Metodický nález, který mi stojí za zvláštní odstavec.** Čtení webových stránek přes
shrnující nástroj **si třikrát vymyslelo nebo popletlo věc, kterou by profil publikoval
jako fakt** — a všechny tři chytila až doptávka na doslovný citát. U Kolínské boudy
shrnutí připsalo boudě starší jméno „Waldhaus" a majitele, ačkoli Waldhaus je **jiná
bouda**, o které kolínský odbor jen jednal a nikdy ji nekoupil; vydalo za koupenou
budovu inzerát na dům, u kterého kronika výslovně říká, že se o koupi nejednalo; a
datovalo návrat boudy klubu na červen 1991, kdežto doslovné znění je **3. července 1991**.
Ta třetí by prošla bez povšimnutí. **Postup, který zabral a platí od teď: nežádat
shrnutí, ale doslovný citát, a k tomu výslovnou únikovou cestu („pokud tam ta věta není,
napiš NENÍ NA STRÁNCE").** Bez té únikové cesty nástroj radši něco složí, než by přiznal,
že to tam není.

**Opraven vlastní publikovaný text, ne jen doplněna data.** U Lyžařské boudy jsme dosud
tvrdili, že web provozovatele je nedostupný a historii se doložit nepodařilo. Web se
načíst **podařilo**, takže obě věty byly nepravdivé a jsou pryč. Konvence B platí i proti
nám. Zároveň ale platí i pro to, co z toho webu přišlo: rok **1717 stojí na jediné větě
provozovatele bez jakéhokoli dokladu**, a próza to teď říká nahlas.

**Dva nové rozpory přiznané, nerozhodnuté.** Jelenka má 25 lůžek v pěti pokojích podle
jednoho pramene a 26 ve čtyřech podle druhého; obě rozpisy jsou vnitřně konzistentní,
takže to nejspíš nejsou dvě čísla, ale dvě doby. Druhý je adresní a jde do DATA-20: web
Kolínské boudy uvádí „Velká Úpa 319", Kudy z nudy „Pec pod Sněžkou 319".

**Zpracován tvůj seznam známkových míst → DATA-22.** Z xlsx, který jsi stáhl přímo z webu
vydavatele, je `…-vyber.csv` (128 položek) a křížová kontrola proti korpusu
(`scripts/data22-znamky-oficialni-seznam.ts`): 22 shod s publikovaným profilem, 5 shod jen
s kandidátem, 20 publikovaných profilů v seznamu není. **To poslední číslo se ale nesmí
číst jako nález** — deset z nich jsou polská schroniska a seznam je český; u Rezku a
Dvoraček se nepáruje **správně**, protože známka patří osadě a dvoubudovému areálu, což
naše profily vědomě netvrdí; a Pomezní bouda v seznamu chybí, ačkoli známku č. 673
doloženou má. Tvoje odpověď, že filtr zněl „horské chaty a boudy" a **může v něm být
chyba**, je proto zapsaná rovnou do hlavičky skriptu jako pravidlo: **nepřítomnost
v seznamu není doklad, že objekt známku nemá.** Skutečně otevřených zůstává sedm profilů.

**Zapsáno tvé rozhodnutí o rozhlednách a sedlech → DATA-23.** Klíč zařazení se rozšířil:
rozhoduje **veřejné občerstvení, ne typ stavby**. Doplněno do `docs/plan.md` §Taxonomie.
V pilotu se to zatím dotýká jediného objektu — **Sněžky** (známka č. 20, Poštovna);
Ovčárna, Šerlich a Komáří vížka leží v jiných pohořích. Sněžku ale **nezakládám naslepo**:
je to vrchol s několika objekty a jeden z nich (Dom Śląski) v korpusu už máme, takže se
napřed musí rozhodnout, co je tam „objekt", jinak vznikne profil konkurující sousedovi.

**Měření:** `npm run kontrola` zelené (42 souborů; `audit-mech` A–F nula, `kolize-jmen`
nula, fixtura 4/4). `ban-scan` **133 → 129**, doměřeno soubor po souboru proti
`git show HEAD` nad osmi dotčenými profily (25 → 21). Všech 21 je zdokumentovaný trvalý
falešný poplach, **žádná nová třída nepřibyla**; úbytek vyrobilo přepsání závěrečných
odstavců, kde vypadlo slovo „redakce".

**Příště:** DATA-22 body (1)–(3) — posoudit pět kandidátů se známkou, rozhodnout o čtyřech
krkonošských položkách seznamu, které v korpusu nejsou (Luisino údolí, Horní Mísečky,
Modrokamenná bouda, Mariánskohorské boudy), a u sedmi profilů bez shody ověřit u
vydavatele. Nebo DATA-24 (jednořádková pojistka proti zápisu naostro), která je levná a
plyne přímo z dneška.

**Otázky pro Michala:** (1) **Sněžka** — co je tam samostatný objekt průvodce? Poštovna
sama, nebo celý vrchol včetně Domu Śląského, který už profil má? (2) **Jelenka** — 26
lůžek ve čtyřech pokojích, nebo 25 v pěti? Vypadá to na dvě různé doby, ne na chybu
pramene; při telefonátu (DATA-04) by to byla jedna otázka. (3) Pět objektů ze seznamu
známek existuje **jen jako kandidáti** (Chata Rozhled, Medvědí bouda, Richtrovy boudy,
Chata Hubertka, Pražská bouda) — povýšit některé? (4) Trvají otázky z minula: sémantika
pole `obec` (DATA-20, visí na ní 27 hodnot) a **rotace GitHub tokenu a klíče Mapy.com**,
které leží v plaintextu v zadání naplánované session.

---

## 2026-07-26 — navazující session (Opus, inline): DATA-20 — otázka není „která obec", ale „co to pole znamená". Jedna hodnota opravená, dvě domněnky vyvrácené

**Zadání Michala:** „pokračuj samostatně dál." Vzato **DATA-20**, první nehotová položka
shora. Datová část je hotová a zapsaná, položka ale **zůstává otevřená**, protože to, co
zbývá, rozhodnout nemůžu — je to tvoje volba a je dole mezi otázkami.

**Tři premisy zadání byly mylné.** Je to pátá položka v řadě po DATA-16 až DATA-19,
u které měření převrátilo vlastní zadání; píšu to sem tak, jak to je, protože vyvrácená
domněnka jinak zmizí a příští průchod ji udělá znovu.

**Za prvé, nadpis lhal počtem.** Zněl „ověřit administrativní obec u dvou profilů".
Průchod celého publikovaného korpusu Krkonoš: ze 42 profilů má `obec` vyplněnou **37**.
Z nich nese `overeniLokace` u **19** směrovací číslo, u dalších **8** slovo „adresa"
bez čísla a jen u **2** cokoli rejstříkového. Zhruba **27 hodnot ze 37 tedy pochází
z poštovní adresy a dvě z registru**. Není to otázka o dvou profilech — je to otázka
o korpusu a odpověď se bude přepisovat sedmadvacetkrát.

**Za druhé, pole nemá dvě jména, ale tři, a každé v jiné vrstvě.** Ve schématu nese
popisek **„Nejbližší obec"**. Ve veřejné tabulce faktů ho `page.tsx` vypisuje pod klíčem
**„Oblast"** — a sedí přímo pod klíčem „Pohoří", takže i kdyby hodnota byla správná,
čtenář ji čte špatně. A v drobečkové navigaci ho tentýž soubor skládá do řetězce typu
„Česko · Krkonoše · Špindlerův Mlýn", což každý návštěvník přečte jako **příslušnost**,
ať schéma říká, co chce. Rozhodnutí o sémantice tedy nesáhne jen do dat, ale i do
popisku a do `page.tsx`.

**Za třetí, ze dvou jmenovaných profilů byl vadný jeden — a přibyla mi vlastní mylná
domněnka o třetím.**

**Lysečinská bouda — hodnota změněna** na `obec: Horní Maršov`, `verified` zůstává
`false`. Nerozhodlo to, že by se pro Horní Maršov našel silnější pramen, nýbrž že se
**jediná opora Malé Úpy rozpadla sama**: adresa u Kudy z nudy páruje směrovací číslo
pošty Horní Maršov se jménem Malá Úpa, přičemž ta pošta Horní Lysečiny ve svém obvodu
skutečně vede a Malá Úpa má číslo jiné. K tomu se shodly tři nezávislé přehledy —
místopisný rejstřík, soupis částí obce Horní Maršov a poštovní obvod. Rozpor je přiznaný
ve veřejné próze i s tím, že primární pramen nemáme. Zároveň tím byla **odvolána vlastní
poznámka z předchozího dne**, která u téhož profilu tvrdila, že to směrovací číslo patří
Malé Úpě; stojí to teď v `interniPoznamky` vedle sebe, výrok i jeho vyvrácení.

**Lovecká chata — vada se nepotvrdila, nemění se nic.** Zapsal jsem si ji jako třetí
případ s odůvodněním, že `Velká Úpa` není obec, nýbrž část obce. Je to pravda a je to
irelevantní: `docs/DATA-17-jmenovci.md` tenhle případ **už výslovně řeší a povoluje**
(pravidlo R2 osadu připouští, je-li obec v profilu přítomná) a profil obec nese hned
dvakrát, v doložené adrese i v próze. Lovecká chata je tam dokonce jmenovaná jako příklad
toho, jak to má vypadat. Domněnka byla moje, ne nález, a je zapsaná jako vyvrácená.

**Lesní bouda — hodnota se nemění, ale rozpor se nově přiznává veřejně.** Domnělý trojí
spor byl **špatné čtení**: tři obce, které se u boudy objevují pohromadě, jsou místa,
odkud se dá vyjet autem, ne tři adresy. Zároveň ale zeslábla opora publikované hodnoty —
web boudy **neuvádí adresu vůbec** a o poloze říká jen „nad Pecí pod Sněžkou", což je
popis polohy vůči obci, ne přihlášení k ní, kdežto `overeniLokace` z toho dosud dělalo
údaj „poloha Pec pod Sněžkou". Opraveno. Proti stojí adresa v Černém Dole shodně na
portálu Královéhradeckého kraje a ve čtyřech firemních katalozích — jenže to nejsou
nezávislé prameny, nýbrž nejspíš **jeden rejstřík rozmnožený pětkrát**, a rejstřík vede
sídlo provozovatele, ne polohu stavby. Podmínka, kterou si položka sama stanovila („jeden
rejstřík proti jednomu médiu je spor, ne verdikt"), tím padla: teď je to adresní pramen
proti webu, který adresu nemá.

**A hlavně je Lesní bouda učebnicový exponát celé otázky.** Pod výkladem „nejbližší obec"
je Pec pod Sněžkou skoro jistě správně — vede odtud žlutá značka zhruba tři kilometry,
do Černého Dolu je to podstatně dál. Pod výkladem „správní příslušnost" může být správně
Černý Důl. Obě odpovědi jsou obhajitelné, obě různé a jedno pole je nepojme. Přesně proto
se musí rozhodnout nejdřív sémantika: bez ní se ověřuje proti nezadané otázce.

**Vedlejší nález: podmínka u DATA-21 neplatí.** Založil jsem ji včera s tím, že se má
dělat až po DATA-20, „protože doplňování se dotkne i skupiny `lokace`". Naměřený seznam
osmi čekajících položek to nepodporuje — jsou to telefon, milníky, roky vzniku
a kapacita, **ani jedna není v `lokace`**. Podmínka zrušena, DATA-21 se dá dělat hned
a nemusí čekat na tvoje rozhodnutí.

**Kontroly:** `zdroje` 0, `audit-mech` 0, `kolize-jmen` 0 (204 souborů, 130 profilů se
jménem, 89 objektů), fixtura 4 kontroly / 0 spadlo. **`ban-scan` 133, beze změny** —
doměřeno proti `git show HEAD` na všech třech dotčených souborech: 8 zásahů před i po,
všechny starší (slova „OpenStreetMap" a „redakce"). Nová próza tedy nepřinesla ani jeden
nový zásah, přestože jí přibyly tři odstavce.

**Příště:** **DATA-21** (osm profilů čekajících na katalogová data, po jednom s oční
kontrolou), protože ta už na nic nečeká. DATA-20 se dozavře, až rozhodneš sémantiku.

**Otázky pro Michala:**
1. **Co má pole `obec` znamenat?** Tohle je teď nejdražší nerozhodnutá věc — visí na ní
   27 hodnot. Tři možnosti: (1) zůstane „nejbližší obec" a správní příslušnost dostane
   vlastní pole, (2) překlopí se na správní příslušnost a opraví se popisek, (3) obojí
   splyne tam, kde se neliší, a rozdíl se přizná v próze tam, kde ano. Varianta (1) je
   nejblíž tomu, co v datech dnes opravdu stojí, ale koliduje s DATA-17, kde `obec`
   slouží jako rozlišovač jmenovců — a k tomu je „nejbližší obec" slabý nástroj. Ať
   padne kterákoli, k tabulce faktů se bude muset opravit klíč „Oblast", který dnes nad
   hodnotou stojí a plete.
2. **Kolínská bouda: 1927, nebo 1719?** (nesplaceno ze včerejška) Ty jsi uváděl 1719,
   katalogový podklad dává 1927. Víš, odkud tvůj letopočet je?
3. Pořád visí ty starší: rotovat GitHub token a klíč k Mapy.com, které leží v otevřeném
   textu v zadání naplánované úlohy? Má `kontakty` dostat druhé telefonní pole pro
   rezervační linku? A má se benecká Martinova bouda založit jako kandidát?

---

## 2026-07-26 — navazující session (Opus, inline): DATA-19 hotovo — z osmi „nespárovaných" byly skutečné dvě a spravily se data, ne kód

**Zadání Michala:** „pokračuj samostatně dál." Vzato **DATA-19** (přehodnotit shodu jmen
v pipeline DATA-09), první nehotová položka shora. Backlog žádal pustit párování znovu pro
všech osm objektů, které `PUVOD.md` vede jako nespárované, s tolerantnějším porovnáním —
normalizace diakritiky a koncovek, shoda na podřetězci, GPS jako rozhodčí — výsledky ručně
potvrdit a teprve pak doplnit, co u dotčených profilů chybí.

**Zadání se mýlilo ve čtyřech bodech.** Je to čtvrtá položka v řadě po DATA-16, DATA-17
a DATA-18, u které měření převrátilo vlastní zadání, takže to sem píšu tak, jak to je.

**Za prvé, ukazovalo na špatný soubor.** Seznam osmi nestojí v `PUVOD.md` u katalogu
`katalog-cr-sk-2026`, kam věta odkazuje, ale u `fakticka-data-krkonose-2026`.

**Za druhé, dvě ze tří žádaných věcí už dávno hotové byly.** `normalizuj()` skládá `ł→l`,
`ß→ss` a rozklad `NFD` se zahozením diakritických znamének; `shodaNazvu()` porovnává
oboustranně na podřetězci od pěti znaků. Diakritika ani podřetězce tedy chybět nemohly —
a obě neshody, o které jde, jimi nikdy způsobené nebyly.

**Za třetí — a to je jádro — „v katalogu není" u dvou z osmi neplatí.** Bouda Bílé Labe
v katalogu je jako řádek HUT-0011 „Bouda u Bílého Labe", Hali Szrenickiej jako HUT-0224
„Hala Szrenicka". Obě neshody způsobil **pád**: druhý pád s vsunutým „u" a polský lokativ
proti nominativu. U zbylých šesti věta platí, ty v katalogu opravdu nejsou. Skutečná
selhání párování jsou tedy **dvě, ne osm**.

**Za čtvrté, číslo osm platilo pro korpus o 23 profilech.** Dnes jich je 42 a ke dni
řešení byla ta věta „devět" — přibyla Vrbatova bouda.

**Spravila se data, ne porovnávač.** `shodaNazvu()` čte i `aliasy`, takže stačilo
katalogové jméno u obou profilů zapsat jako alias s poznámkou, odkud pochází. Shoda od té
chvíle vzniká sama, bez zásahu do funkce, kterou sdílí i párování razítek (DATA-05) —
takže tam prospěje taky. Tolerantnější porovnávač by ty dva případy chytil rovněž, ale
**platilo by se za něj falešnými shodami**: jednorázový skript s osekáváním koncovek
a Haversinem prokřížil nespárované z obou stran a nabídl dvě dvojice, které jsou si blízko
na mapě, a přitom jsou to jiné objekty — Horská chata Krakonoš × Pražská bouda 254 m
a Vebrovy boudy × Pražská bouda 1039 m. GPS tady tedy neposloužila k párování, ale
**k zamítnutí**. Skript byl jednorázový a v repozitáři nezůstal.

**Měření po opravě:** katalog 41 řádků × 42 publikovaných profilů Krkonoš, shoda **33 →
35**. Bez shody zůstává 7 profilů (U Jirky, Dvorská, Krakonoš, Lovecká, Tetřeví, Vebrovy,
Vrbatova) a 6 řádků katalogu — a **těch šest není chyba párování**: Erlebachova, Pražská,
Hrnčířské, Richtrovy, Chata Pod Studničnou a Nad Łomniczką u nás existují jen jako
kandidáti a skript čte pouze `data/chaty/`. Nespárovatelné z definice, ne kvůli jménu.
`PUVOD.md` má odstavec „Pokrytí" přepsaný — původní věta je tam nechaná citovaná, aby bylo
vidět, co se opravovalo.

**Druhá půlka zadání — doplnit Boudu Bílé Labe — proběhla ručně proti pramenům**, ne
převzetím katalogu. Dvě stránky serveru Krkonose.eu popisují týž objekt (1913, 28 lůžek ve
dvou- až čtyřlůžkových pokojích, 1000 m) a publikují polohu shodnou s HUT-0011 na deset
metrů; historii nese průvodce Poznej domy. Profil narostl o alias, obec, kapacitu, pokoje,
rok vzniku, pět milníků, ověřovací blok k historii, čtyři prameny a prózu ze tří odstavců
na šest. **Tři rozpory se přiznaly, nerozhodly:** tři různá telefonní čísla ve třech
pramenech, dvojí psaní příjmení zakladatele (Hollman × Hollmann) a poštovní adresa proti
katastru. Dry-run potvrdil, že skript profil nově najde a **nic nepřepíše**.

**Dva vedlejší nálezy.** (1) Pole `obec` má ve schématu popisek **„Nejbližší obec"**, ne
administrativní — což podrývá část zadání DATA-20, kde se poštovní obec vede jako chyba;
dopsáno tam s tím, že se nejdřív musí rozhodnout, co pole znamená, a teprve pak dohledávat
hodnoty. (2) **DATA-09 od růstu korpusu z 23 na 42 profilů neběželo** a nasucho hlásí, že
by doplnilo osm profilů. Založeno jako **DATA-21**, protože se to nesmí pustit naostro bez
oční kontroly — u Kolínské dává katalog rok 1927, kdežto ty uvádíš 1719.

**Kontroly:** validátor 0 chyb (publikováno 42, známky 32, obrázky 25), `zdroje` 0,
`audit-mech` 0, `kolize-jmen` 0, fixtura 4 kontroly / 0 spadlo. **`ban-scan` 135 → 133**,
doměřeno proti `git show HEAD` na obou dotčených souborech (7 → 5), takže rozdíl sedí do
jedné: −3 za tři místa, kde se „OpenStreetMap"/„OSM" nahradilo obecnějším pojmenováním,
+1 za nový závěrečný odstavec o provenienci. Fixtura beze změny — nová jména jsou aliasy,
ne názvy, do kolizí tedy nespadají.

**Příště:** **DATA-20** (sémantika pole `obec`, pak hodnoty u Lysečinské a Lesní boudy),
a po ní **DATA-21** (osm profilů čekajících na katalogová data).

**Otázky pro Michala:**
1. **Kolínská bouda: 1927, nebo 1719?** Ty jsi uváděl 1719, katalogový podklad dává 1927.
   Může to být starší bouda proti dnešní stavbě — víš, odkud tvůj letopočet je?
2. **Co má pole `obec` znamenat** — nejbližší obec (jak říká popisek), nebo administrativní
   příslušnost (jak to bere DATA-17 při rozlišování jmenovců)? Na tom stojí DATA-20.
3. Pořád visí ty starší: rotovat GitHub token a klíč k Mapy.com, které leží v otevřeném
   textu v zadání naplánované úlohy? Má `kontakty` dostat druhé telefonní pole pro
   rezervační linku? A má se benecká Martinova bouda založit jako kandidát?

---

## 2026-07-26 — navazující session (Opus, inline): DATA-17 hotovo — položka, u které měření převrátilo obě věty zadání

**Zadání Michala:** „pokračuj samostatně dál." Vzato **DATA-17** (konvence pro kolidující
názvy chat), první nehotová položka shora. Backlog žádal dvě věci: redakční pravidlo, čím
se objekt odlišuje, a pramen na každou kolizi zvlášť — a rovnou dodával, že kolize se
dají hledat strojově a stálo by to skoro nic. Ta věta byla dobrá rada a začal jsem
u ní.

**Sken hned na začátku převrátil zadání.** Backlog stál na tom, že „jen v Krkonoších máme
dvě dvojice objektů se shodným jménem". Strojový průchod 204 souborů, 130 profilů
s názvem a 89 různých objektů hlásí **nula kolizí**. Publikovaná je vždycky jen jedna
půlka dvojice; ta druhá stojí venku, mezi profily ani mezi kandidáty. Naivní sken přitom
napočítá zhruba čtyřicet „kolizí" a všechny jsou tentýž objekt dvakrát — jednou jako
publikovaný profil, jednou jako kandidát. Proto se totožnost objektu počítá jako
`oblast/slug`, ne jako cesta k souboru; a oblast v tom být musí, protože filtr „týž slug
⇒ týž objekt" by sám o sobě zakryl přesně ten případ, kvůli kterému kontrola vzniká.
**Ze zadaného úklidu se tím stala prevence** — pravidlo se nepíše pro dnešní korpus, ale
pro okamžik, kdy druhá půlka přibude, a ten má ohlásit stroj, ne čtenář.

**Druhá věta zadání padla taky: „dvě dvojice" jsou jedna a půl.** Martinova bouda na
Benecku doložená je — web obce Benecko ji vede jako rodinný hotel s restaurací ve výšce
800 m a totéž nese krajský i regionální katalog. Nad rámec DATA-17: protože má veřejnou
restauraci, **projde tvým klíčem zařazení a je to legitimní budoucí kandidát**, ne jen
cizí jméno. Zato Lesní boudu ve Špindlerově Mlýně se najít nepodařilo: čtyři vyhledávání
nedala nic, treking.cz má stránku „Lesní bouda" a jmenuje na ní jen objekt nad Pecí pod
Sněžkou, a OpenStreetMap náš objekt značí tagem `wikipedia: cs:Lesní bouda`, takže
i encyklopedický článek je o něm.

**A tady je vlastní nález položky, protože je obecnější než ona sama.** `git log -S`
ukazuje, odkud se to tvrzení vzalo: do repozitáře vstoupilo commitem `0d728e2` jako holá
věta v `interniPoznamky` **bez pramene**. Odtud ho převzal backlogový záznam i poznámka
druhého profilu — obojí už jako hotovou věc, o kterou se dá opřít další práce. **Konvence
B tedy platí i pro interní poznámky.** Nedoložená věta v `interniPoznamky` není „zatím
neověřený údaj", je to pramen, ze kterého začnou citovat ostatní dokumenty projektu,
a po dvou krocích už nikdo nepozná, že na začátku nestálo nic. Zapsáno proto jako
**„hledali jsme a nenašli"**, ne jako „neexistuje" — špindlerovská Lesní bouda klidně
existovat může, historická nebo jen místním jménem; doložená ale není.

**Můj vlastní předpoklad padl jako třetí, a měřil jsem ho dvakrát špatně.** Pravidlo se
mělo opřít o to, že perex obec už nese, takže by stačila věta v těle článku. Census 42
publikovaných profilů to nepotvrdil, a cesta k číslu stojí za zápis: shoda na podřetězci
dala 15, kmenová shoda 23, kmeny plus oční kontrola **27 jmenuje / 9 ne / 6 nemá pole
`obec`**. První číslo srazila česká deklinace — perex Martinovy boudy říká „u Špindlerova
Mlýna", pole nese „Špindlerův Mlýn". Chybu odhalilo to, že jeden ze dvou profilů, kvůli
kterým celá položka vznikla, seděl v negativním seznamu, ač obec v perexu viditelně má.
Druhé měření zakoplo o **střídání samohlásky v kořeni** (Důl → Dolem, Dvůr → Dvoře), což
prefixové kmeny nepřeklenou; poznalo se to podle toho, že tři soubory se do negativního
seznamu **přesunuly**, což by při volnějším porovnání nešlo. Na 42 položkách je oční
kontrola levnější než chytřejší regulár — na stovkách by to chtělo fold samohlásek, ne
delší prefix.

**Pravidlo je v `docs/DATA-17-jmenovci.md`,** sedm klauzulí, a rozlišovačem je **`obec`,
a nic jiného**. Nejbližší vrchol, který backlog nabízel, neprošel: v korpusu se vrchol
objevuje jen tam, kde ho nese pramen, a odvodit ho z GPS by znamenalo vyrobit údaj, který
žádný pramen neuvádí. Do `nazev` se rozlišovač nepíše nikdy — kromě věcného důvodu
i z provozního, který je horší: kontrola porovnává právě `nazev`, takže závorka v názvu
kolizi **zamaskuje** a kontrola po prvním použití oslepne. Příponu obce dostává **nový**
profil, starý si slug ponechá, aby se nerozbily živé adresy; je to kompromis a v dokumentu
je napsané proč — lepší koncový stav je přejmenovat obě strany, což ale chce přesměrování,
které web zatím nemá.

**Vedlejší nález, který si vynutil vlastní položku:** rozlišovač má smysl jen tak dobrý,
jak spolehlivé je pole, o které se opírá — a `obec` spolehlivá vždycky není. Lesní bouda
má `Pec pod Sněžkou` z webu boudy, ale firemní rejstřík u ní vede poštovní adresu
v Černém Dole. **Lysečinská bouda** rozpor Malá Úpa × Horní Maršov sice poctivě
přiznávala, ale pak ho **rozhodla nedoloženou glosou** „Horní Lysečiny jsou dnes částí
Malé Úpy" — a místopisný rejstřík ji popírá: vede Horní Lysečiny jako část **Horního
Maršova**. Vypadá to na záměnu poštovní doručovací obce (PSČ) za obec administrativní.
Je to strukturálně tatáž vada jako u Lesní boudy: nedoložená věta, na kterou se pak
odkazuje další text. Profil navíc v DATA-15 tuhle glosu **výslovně obhájil** jako
„nedorozumění auditu" — audit měl pravdu a zamítnutí je teď v souboru opravené na sebe
sama. Glosa pryč z `overeniLokace` i z `text[0]`, rozpor přiznaný v próze, pramen na
rejstřík doplněn. Hodnota pole se **nemění**: jeden rejstřík proti jednomu médiu je spor,
ne verdikt. Vedeno jako **DATA-20** s tím, že se má stejnou otázkou projít celý korpus —
kolik dalších profilů má `obec` jen z poštovní adresy?

**Hotovo:**

- `scripts/kontrola/kolize-jmen.ts` — nová kontrola, pátá v řadě, zapojená do
  `npm run kontrola`. **Jediná ze seznamových kontrol, která rozhoduje:** u `ban-scan`
  a `audit-mech` je ustálený stav nenulový, tady je čistý stav přesně nula, takže každý
  zásah je regrese. Pět nových souborů fixtury (`14-`…`18-kolize-*.yaml`) drží obě pasti.
- `docs/DATA-17-jmenovci.md` — redakční pravidlo R1–R7 i s tím, co měření převrátilo.
- `martinova-bouda.yaml` — **veřejná** rozlišovací věta v posledním odstavci `text`
  + záznam ve `zdroje` (web obce Benecko). Slug se nemění, benecká bouda v korpusu není.
- `lesni-bouda.yaml` — tvrzení o jmenovci sneseno na „hledali jsme a nenašli"
  i s jeho původem; veřejně se nepublikuje nic, protože pramen není.
- `lysecinska-bouda.yaml` — glosa opravena na přiznanou neznalost, pramen na rejstřík.
- `scripts/kontrola/README.md`, `docs/BACKLOG.md` (DATA-17 zavřeno, DATA-20 založeno).

Kontroly zelené, `ban-scan` zůstal na 135 zásazích, `audit-mech` a `kolize-jmen` na nule,
fixtura sedí.

**Příště:** **DATA-19** (přehodnotit shodu jmen v pipeline DATA-09 tolerantnějším
porovnáním), pak **DATA-20**.

**Otázky pro Michala:** dvě starší pořád visí — (1) mám rotovat GitHub PAT a klíč
Mapy.com, které leží v plaintextu v promptu naplánované úlohy? (2) má `kontakty` dostat
druhé pole na telefon (rezervační linka)? Nová třetí: benecká Martinova bouda projde
klíčem zařazení — **chceš ji založit jako kandidáta?** Až vznikne, kolizi ohlásí stroj
a pravidlo se použije poprvé naostro.

---

## 2026-07-26 — navazující session (Opus, inline): DATA-18 hotovo — průchod, který našel čtvrtou vadu tím, že přestal věřit vlastnímu zadání

**Zadání Michala:** „můžeš spustit další session." Vzato **DATA-18**, tedy první nehotová
položka shora. Backlog u ní výslovně žádal, aby se všechny tři drobnosti udělaly **spolu
a s měřením proti `git archive HEAD`**, ne rozsypaně mezi jinou práci — každá totiž hýbe
počtem zásahů `ban-scan` a poodděleně by se nedalo poznat, co kterou změnu způsobilo.

**Hotovo: tři zadané vady a jedna nezadaná, která je z nich nejdůležitější.**

Vada (3) zněla, že vzor třídy GPS `${WB0}souřadnic` je citlivý na velikost písmen. Při
její opravě bylo přirozené podívat se, jestli tímtéž netrpí vzor `profil`, který měl
průchod stejně v ruce kvůli vadě (2) — **a trpěl dvojnásob:** hlídal jen malé písmeno
a jen první pád. To zpětně vysvětlilo rozpor, se kterým se tahle položka odkládala už
z Výrovky: backlog mluvil o 23 výskytech ve 20 souborech, skript hlásil 19. Napsal jsem
proto vlastní výpis nezávislý na obou a pravda je třetí: slovo mělo v korpusu **30
výskytů**, starý vzor jich viděl 19 a z těch bylo 13 interním žargonem — což je přesně
ono „zhruba 13" z backlogu. Všechna tři čísla najednou sedí a díra je vysvětlená. Do
prózy se tak dalo bez povšimnutí napsat 4× „Profil" na začátku věty a 5× „profilu".

**Rozvaha ustáleného počtu 138 → 135**, změřená souborovým diffem proti HEAD:

| směr | kolik | co to je |
| --- | --- | --- |
| −15 | 13 + 2 | skutečné opravy: 13× „profil" ve významu *naší* stránky, 2× u Vrbatovy boudy (číslo známky a doména v jedné větě) |
| +9 | 9 | nově viditelné věty připisující licenci ODbL — `souřadnic` chytá i velké „S" |
| +3 | 3 | nově viditelné odkazy na *cizí* katalogový profil — `profil` chytá i skloňované tvary |

Nic z toho, co přibylo, není vada; obojí je připsání pramene, tedy přesně to, co má próza
dělat. **Šest oprav se v čísle neprojeví vůbec** — čtyři „Profil" a dva „profilu", které
starý vzor nikdy neviděl. Opravily se stejně. Průchod, který by si vybral jen to, co mu
zlepší vlastní metriku, není audit, ale kosmetika.

**Co se v próze skutečně změnilo.** U Vrbatovy boudy zmizelo z `text[0]` číslo známky
i doména, **rozpor výšek 1 400 / 1 396 / 1 390 m ale zůstává přiznaný v plném rozsahu** —
smazalo se to, co do veřejného textu nepatří, ne to, co je nepohodlné. Číslo známky se
neztratilo: drží ho `zdroje` (s odkazem na katalog vydavatele, na který máme svolení)
i `interniPoznamky`. Devatenáct výskytů žargonu se přepsalo ve **třinácti** souborech
(census veřejné prózy HEAD × pracovní strom: 30 tvarů slova → 11, mimo sloveso 28 → 9);
default byl „ze kterého profil vychází" → „ze kterého vycházíme". **Dvakrát to ale nešlo
mechanicky:** u Lysečinské boudy a u Výrovky by vazba přímo odporovala následující větě
„Vycházíme z údajů Kudy z nudy", takže se vypustila celá. Jedenáct výskytů slova zůstává
schválně — devět míří na katalogový profil cizího serveru (Kamieńczyk pětkrát, Schronisko
pod Łabskim Szczytem dvakrát, Vébrovy boudy a Krakonoš po jednom), dvakrát jde o sloveso
„profiluje se" u Friesových bud.

**Nová trvalá rodina falešných poplachů.** Oprava `[Ss]ouřadnic` zviditelnila devět vět
a při čtení všech sedmnácti dnešních zásahů třídy GPS vyšlo, že **ani jeden neobsahuje
číslo** — všechny jsou věta připisující ODbL („Souřadnice … pocházejí z OpenStreetMap").
Zapsáno do README kontrol i do hlavičky skriptu. Vzor je psaný `[Ss]`, ne příznakem `i`,
protože ten by zbytečně rozvolnil i `GPS` a holé `N` ve stejném výrazu.

**README kontrol opravil svůj vlastní chybný zápis.** Od třetí dávky tam stálo, že vazba
„starší podklad, ze kterého profil vychází" je přijatý falešný poplach. Nebyla — a právě
tenhle spor dvou dokumentů projektu držel položku odloženou. Historický odstavec jsem
nepřepisoval, jen k němu připsal, že šlo o omyl a kdy se opravil.

**Fixtura.** Nová `13-vzory-data18.yaml` drží obě nové větve a hlavně **past**: sloveso
„profiluje" se chytit nesmí. Ověřeno i mechanikou vzoru, ne jen během — alternativa `u`
spotřebuje „u" a `WB1` pak padne na „j". Snímky přegenerovány (+6 řádků: jeden zásah
navíc v `08-hranice-slova` z velkého „Souřadnice", pět z nové fixtury), protože šlo
o **záměrné utažení**, ne o chybu portu — přesně ten případ, na který test-fixtura
v hlavičce pamatuje.

**Příště:** **DATA-17** (konvence pro kolidující názvy chat — dvě dvojice jmenovců
v Krkonoších, dnes rozlišené jen v `interniPoznamky`) nebo **DATA-19** (přehodnotit
shodu jmen v pipeline DATA-09 pro osm nespárovaných objektů). DATA-17 má větší dopad
na čtenáře, DATA-19 přinese do korpusu chybějící data — pořadí ať určí Michal, jinak
beru DATA-17 jako první shora.

**Otázky pro Michala** (obě přenesené z minulé session, zatím bez odpovědi):
1. PAT a klíč Mapy.com v otevřeném textu promptu naplánované úlohy — otočit a prompt
   přepsat, nebo nechat být?
2. Nemá `kontakty` dostat druhé pole na rezervační linku? Schéma má dnes jediný
   `telefon` a jsou to už dva objekty ze 42, kde to nestačí.

---

## 2026-07-26 — denní session (Opus, inline): DATA-16 hotovo — sken vidí i mimo tělo článku a hned našel dva telefony

**Zadání Michala:** „spusť naplánovanou session, do dneška byla zastavena." Naplánovaná
úloha *turistickechaty — denní session 6:30* naposledy proběhla **21. 7.** a od té doby
byla pozastavená; **znovu zapnuta** (další běh 27. 7. ráno). Práce se udělala rovnou
v běžící session, protože v pracovním stromu leželo rozdělané DATA-16 — kdyby se úloha
spustila zvlášť, naklonovala by si čisté repo a dělala totéž podruhé.

**Hotovo:** **DATA-16 — rozšíření dosahu `ban-scan.ts` za `perex` + `text[]`.** Sken
nově čte i ostatní veřejný text profilu: `zajimavosti[].text`, `otviraciDoba`, `autem`
a `sezona`.

**Měření rozhodlo o rozsahu, a to jinak, než položka backlogu předpokládala.** Backlog
chtěl rozšířit hlavně na `zajimavosti[].text` a `otviraciDoba` s `autem` odkládal s tím,
že „chtějí vlastní, mírnější sadu vzorů". Měření (povinné, položka ho žádala napřed)
ukázalo pravý opak: samotné `zajimavosti[].text` přidává **jediný** zásah, kdežto celá
čtveřice **devět** — a hlavně, **obě skutečné vady, které rozšíření našlo, byly právě
v těch dvou odkládaných polích.** V `autem` Luční boudy stálo číslo na smluvní přepravu,
v `otviraciDoba` Tetřevích bud rezervační linka restaurace. Telefony do veřejného textu
podle konvence nepatří a tyhle dva tam byly přesně proto, že tam skript neviděl; mírnější
sada vzorů by je nechala být. **Ustálený počet 131 → 138** = +9 za rozšíření, −2 za
opravené telefony.

Čísla se nezahodila, jen se přesunula tam, kam patří: obě zůstávají v `overeni*.source`,
který frontend vykresluje **pouze jako hostname** (`prvniHost()` v `page.tsx` z celého
zdroje vytáhne první http(s) host a zbytek zahodí) — ověřeno ve zdrojáku, ne odhadnuto.
Veřejná próza místo čísla říká, že se rezervuje telefonicky a že jde o jinou linku než
hlavní kontakt; u Luční boudy je to doslova tak, čísla se liší poslední číslicí.

**Implementace záměrně nesahá na `proza()`.** Přidána samostatná `dalsiVerejnyText()`
v `lib.ts` a zapojena do skenovací smyčky vedle ní. Důvod: `proza()` používá i `zdroje.ts`
a všech šest kontrol v `audit-mech.ts` a ty jsou psané nad **tělem článku** — rozšířit ji
by tiše změnilo sémantiku sedmi dalších kontrol kvůli jedné. **Dvě veřejná pole zůstala
vynechaná a je to úmysl:** `zdroje.popis` nese odkazy a jména domén ze zadání (sken by
hlásil vlastní návrh schématu), `interniPoznamky` veřejné vůbec nejsou.

**Fixtura hlídá obě strany.** `12-dalsi-verejny-text.yaml` má v každém ze čtyř čtených
polí jeden zakázaný vzor a jako past telefon i doménu v obou vynechaných polích. Snímek
sedí: čtyři zásahy ze čtyř polí, z pasti ani jeden. Snímky všech tří kontrol
přegenerovány — u `audit-mech` a `zdroje` se změnil **jen počet souborů**, žádný nový
nález, takže rozšíření skutečně nikam neprosáklo.

**Poznámka mimo backlog:** prompt naplánované úlohy nese v otevřeném textu GitHub PAT
i klíč k Mapy.com. Do repa se nedostaly (tam je jen `.env.example`), ale kdokoli s
přístupem k výpisu úloh je vidí. Nedělal jsem s tím nic — je to Michalovo rozhodnutí.

**Příště:** **DATA-18** — tři drobné vady korpusu v jednom měřeném průchodu: číslo známky
ve veřejné próze Vrbatovy boudy, celokorpusový úklid slova „profil" ve významu „naše
stránka" (23 výskytů ve 20 souborech, asi 13 z nich je ten náš) a case-sensitive vzor GPS
na `ban-scan.ts:36`. Všechny tři hýbou počtem zásahů, proto najednou a s měřením.

**Otázky pro Michala:**
1. Ten PAT a klíč Mapy.com v promptu naplánované úlohy — chceš je otočit a prompt
   přepsat, nebo to necháváme být?
2. U Luční boudy i Tetřevích bud teď próza říká „rezervace telefonicky na jiné lince, než
   je hlavní kontakt". Je to poctivé, ale čtenáři to práci nešetří. **Nemá `kontakty`
   dostat druhé pole na rezervační linku?** Schéma má dnes jen jeden `telefon` a tohle
   je druhý objekt ze 42, kde to nestačí.

---

## 2026-07-25 — navazující session (Opus, inline): DATA-15 krok (b) **dokončen** — čtvrtá dávka a jedna vada, kterou jsem vyrobil sám

**Zadání Michala:** stále „pokračuj samostatně dál". Vzato **zbylých jedenáct profilů**: Nová Klínovka, Schronisko Kamieńczyk, Schronisko Odrodzenie, Schronisko pod Łabskim Szczytem, Schronisko PTTK na Hali Szrenickiej, Schronisko PTTK na Przełęczy Okraj, Schronisko Szrenica, Strzecha Akademicka, Vébrovy boudy, Vosecká bouda a Výrovka. **Krok (b) je tím hotový: všech 42 publikovaných profilů prošlo jazykovým auditem.**

**Hotovo:** 45 oprav napříč jedenácti profily. Nejzajímavější číslo je ale poměr přijetí: **43 ze 43 nálezů agentů přijato, žádný zamítnutý** — proti třetí dávce, kde jich z padesáti padlo dvanáct. Nezlepšili se agenti, zpřesnilo se zadání: do briefu se z minule přidal seznam **„CO NENÍ NÁLEZ"** (vazba „nad <obec>", položka `zajimavosti` s vlastním `zdroj`em, schválené domácí tvary) a povinná sekce **„Co jsem zvažoval a zamítl"**, která agenta nutí zamítnutí sepsat místo toho, aby je poslal jako nálezy. Dva nálezy jsem navíc našel sám při čtení.

**Dominantní vada dávky je jedna a jmenuje se „katalog vydávaný za přečtenou stránku".** Próza psala „web schroniska uvádí" tam, kde jsme web nikdy neotevřeli a údaj přišel přes **externí katalogový podklad**, který se na ten web jen odvolává. Nesly to všechny tři poslední polské profily, každý na několika místech. Opravný tvar je ten, který se ustálil už u Domu Śląského: *„máme z druhé ruky s odkazem na …; samotné stránky jsme zatím neotevřeli, takže to číslo bereme jako nepotvrzené"* — plus **záznam v `zdroje` bez `url`**, který katalog jmenuje jako skutečného prostředníka. Že `zdroje.url` je nepovinné (`popis` je povinný, `url` ne), je pro tuhle třídu klíčové: pramen bez veřejně citovatelné adresy se dá přiznat, místo aby se zamlčel.

**Nejnepříjemnější nález dávky jsem vyrobil já sám, v téže session.** U Hali Szrenickiej jsem dřív napsal, že „mapová data ho kladou těsně pod vrchol Szrenice, kdežto jeho vlastní web píše, že je přímo na vrcholu". Audit Szrenice o pár hodin později ukázal, že ta věta je **vyrobený rozpor**: OSM nese 1 361 m jako výšku *budovy*, katalog 1 362 m jako výšku *hory*. To nejsou dva prameny, které si odporují — to jsou dvě různé veličiny, mezi nimiž je jeden metr, a redakční odečtení jsem připsal OpenStreetMap. K tomu „jeho vlastní web píše" u tvrzení, které přišlo přes katalog. Opraveno v obou profilech v témže běhu, aby si dvě stránky o téže budově neodporovaly. **Pravidlo, které z toho plyne:** když oprava odhalí třídu vady, prohledat korpus **včetně vlastních úprav z téže session** — ne jen soubory, které dávka ještě nevzala.

**Vlastní nález u Przełęczy Okraj: próza popírala data, která repozitář má.** Věta „Podobu občerstvení ani otvírací dobu doloženou nemáme" stála v profilu, k němuž externí katalog vede HUT-0227 se stravováním a celoročním provozem, jistota A. Podle pravidla zavedeného ve druhé dávce se v takovém případě **data zavedou dovnitř**, ne že se věta zúží: doplněno `kuchyne: ano` (bez `typObcerstveni` — pramen neříká, jestli restaurace, bufet, nebo kiosek, a domýšlet se nebude), `sezona: celoročně` a nový odstavec. `otviraciDoba` **zůstala schválně prázdná**, protože druhý podklad z téhož běhu ji vede jako „neuvedeno" — a próza teď říká proč. Přiznaný rozpor mezi dvěma prameny je poctivější než tichý výběr toho vstřícnějšího.

**Vedlejší zjištění, které stálo pár minut a mělo dopad na tři profily:** světové strany („ve východních Krkonoších", „ve východní části Krkonoš") nemá v korpusu oporu **nikde**, protože katalogové pole „Oblast / část pohoří" nese jen místní jméno, nikdy sektor. Není to tedy vada tří profilů, je to vada jednoho pramene promítnutá do tří — a hledat ji šlo rovnou dotazem na strukturu zdroje, ne čtením prózy.

**Sken zakázaných vzorů: 127 → 131, měřeno soubor po souboru** proti `git archive HEAD`. Pohyb má tentokrát **dvě složky opačným směrem**, což je proti minulým dávkám nové: dva profily zásah **ztratily** (zmizel právě ten vyrobený rozpor o metru) a tři získaly po dvou — Kamieńczyk slovem „katalogový profil", Odrodzenie a Vébrovy boudy připsáním OpenStreetMap, které žádá ODbL. Obojí jsou zdokumentované falešné poplachy: **přibylo připsání, ne domýšlení.** Při té příležitosti vyšlo najevo, že jeden zásah v korpusu falešný poplach **není** — Vrbatova bouda má ve veřejné próze číslo turistické známky. Neopravoval jsem to spolu s dávkou, aby zůstalo měření čisté; jde do BACKLOGu jako samostatná položka s vlastním měřením.

**Příště:** DATA-16 (rozšířit dosah `ban-scan` z `perex`+`text[]` i na `zajimavosti[].text` — napřed změřit, kolik zásahů to přidá), pak číslo známky ve Vrbatově boudě a celokorpusový úklid slova „profil" ve významu „naše stránka".

**Otázky pro Michala:** 1) Co u Strzechy Akademické a u chaty Pod Łabskim Szczytem znamená „nejstarší chata v Krkonoších"? Provozovatel to tvrdí o obou, my u Strzechy vedeme hospodáře k roku 1642 a dnešní budovu k roku 1896, u Pod Łabskim Szczytem budovu z roku 1938. Nejstarší **stavba**, nejdelší **nepřetržitá služba**, nebo **kontinuita hospodaření na místě**? Rozpor je zatím přiznaný v próze na obou stranách, ale rozhodnout ho můžeš jen ty. 2) Souřadnice Szrenice: máme výšku budovy z OSM a výšku hory z katalogu, ale ne odpověď na to, jestli schronisko stojí **na vrcholu, nebo pod ním**. Při ručním běhu stačí otevřít web schroniska a najít v OSM uzel `natural=peak`.

## 2026-07-25 — navazující session (Opus, inline): DATA-15 krok (b), třetí dávka — čtvrtina toho, co audit nahlásí, jsou nedorozumění

**Zadání Michala:** stále „pokračuj samostatně dál". Vzata **třetí dávka osmi** podle abecedy: Friesovy boudy, Hotel Špindlerova bouda, Kolínská bouda, Lesní bouda, Lovecká chata, Lysečinská bouda, Lyžařská bouda a Martinova bouda. Po ní zbývá **11 profilů**.

**Hotovo:** 38 oprav napříč všemi osmi profily, tedy **4,75 na profil** — nejvyšší průměr ze tří dávek a žádný profil nevyšel čistý. Dvouprůchodové čtení zavedené včera platilo dál, ale nejdůležitější číslo dneška je jiné: **12 nálezů auditu jsem po ověření proti souboru zamítl.** To je skoro čtvrtina všeho, co průchody nahlásily. Kdyby se opravovaly bez čtení, vyrobily by nové vady — nejhezčí případ je Špindlerova bouda, kde agent tvrdil, že věta „zasáhl přístavbu, historickou hlavní budovu nikoli" je domyšlená. Četl totiž jen zkratku v `overeniHistorie.source` („2005 (požár přístavby)") a přehlédl `milniky[4].udalost`, kde stojí přesně to, co próza říká. Nález auditu je hypotéza, ne verdikt; **platí na něj stejná laťka jako na prózu, kterou soudí.**

**Dvě obecná pravidla, která z těch zamítnutí vyšla** a platí pro zbytek kroku (b). První: **„nad <obec>" není nález**, když jsou doložené `vyska` i `obec` — plyne z nich a stejnou vazbu nese i dvakrát auditovaná Dvorská bouda („ve výšce 1 313 m nad Strážným"). Nálezem je až tvrzení o **typu terénu nebo světové straně** — „na hřebeni", „na hraničním hřebeni", „v údolí", „ve východních Krkonoších", „pod Liščí horou" — protože to z výšky a obce neplyne. Tahle jediná třída vyrobila 3 z 12 zamítnutí, takže se vyplatí ji mít napsanou. Druhé: **položka `zajimavosti` s vlastním polem `zdroj` je připsaná ze své konstrukce**; ptát se u ní na chybějící připsání je záměna, správná otázka zní, jestli pramen to tvrzení opravdu nese.

**Čtyři třídy vad, které předchozí dvě dávky neměly.** (1) **Tvrzení o terénu opřené o jméno kopce v adrese** — Martinova i Lesní bouda „na (hraničním) hřebeni", ač připsané prameny nesou jen výšku a adresu. U Lesní boudy jsem ale totéž tvrzení zamítl, protože tam ho `overeniLokace` cituje přímo z webu boudy: **stejná formulace je v jednom profilu vada a v druhém ne, rozhoduje pramen, ne slovo.** (2) **Údaj vyrytý na známce vydávaný za náš** — Lyžařská bouda nesla číslo známky v `zajimavosti`, kam do veřejného obsahu nepatří (číslo i odkaz stejně vykresluje sourcovaná karta „Sběratelská místa"). (3) **Položka `zajimavosti`, ze které po odečtení nedoloženého nezbude nic** — u Martinovy boudy by po škrtnutí hřebene zůstalo holé „stojí ve výšce 1 288 m", tedy duplikát pole `vyska`. Položku jsem smazal celou, **místo abych dovymýšlel, co je na objektu zajímavého** — prázdné místo je poctivější než vata. (4) **Rozpor mezi polem a citací zdroje**: `otviraciDoba` u Lesní boudy tvrdila „denně", ač citace webu v `overeniObcerstveni` nese jen „10:30–17:00, přístupné i neubytovaným". Opraveno rovnou v poli i v próze, ne odloženo do BACKLOGu.

**Vedlejší nález je měřicí a je nepříjemný: souřadnice Lovecké chaty skoro jistě nesedí.** Spočítal jsem haversinovské vzdálenosti publikovaného bodu (OSM node 13298087649) k referenčním objektům korpusu: Dvorská bouda 2,32 km, Špindlerova bouda 4,73 km, Lyžařská bouda 5,12 km, Lesní bouda 6,08 km, Martinova bouda 8,26 km. Bod tedy leží u Strážného, zhruba **6 km západně** od druhého objektu korpusu v Peci pod Sněžkou — kdežto doložená adresa Velká Úpa 204 je od Pece na **východ**. Buď je uzel umístěný špatně, nebo popisuje úplně jiný objekt, což by sedělo i s jeho chybným tagem `wilderness_hut` u penzionu s obsluhou. Souřadnice jsem **nemazal** (jsou jediné, co máme, a nesou `verified: false`), rozpor je přiznaný ve veřejné próze a otázka jde do DATA-04. Za pozornost stojí, že tohle nenašlo čtení — našel to výpočet, který stál dvě minuty.

**Sken zakázaných vzorů skočil 122 → 127 a je to skok bez obsahu — ale poprvé doložený měřením soubor po souboru.** Rozbalil jsem korpus z HEAD přes `git archive` do dočasného adresáře a pustil `ban-scan.ts` zvlášť nad oběma verzemi každého z osmi souborů. Pět profilů získalo po jednom zásahu, žádný neztratil ani jeden, takže +5 vysvětluje celý pohyb beze zbytku. Tři nové chytil vzor `profil` v nové domácí formulaci „starší katalogový podklad, ze kterého profil vychází", dva vzor `OpenStreetMap` v nově doplněném připsání — obě třídy vede README jako trvalé falešné poplachy. Po včerejších dvou pohybech je tohle třetí zápis téhož poučení a začíná to být rutina, což je dobře: **skok se měří, ne odhaduje.**

**Při té příležitosti se potvrdila hranice dosahu skriptu.** `proza()` čte jen `perex` a `text[]`, takže když se z `zajimavosti[0]` u Lyžařské boudy odstranilo číslo známky, počet zásahů klesnout nemohl — a taky neklesl (3 → 4, čistý přírůstek z jiných důvodů). Ten údaj tam skript nikdy neviděl. Kdyby se na kontrolu u téhle položky spoléhalo, vada by prošla; rozšíření dosahu na `zajimavosti[].text` je proto v BACKLOGu jako **DATA-16**, s tím, že se napřed změří, kolik zásahů to přidá.

**Nová konvence k dořešení (DATA-17):** dva profily téhle dávky mají v Krkonoších jmenovce — Martinova bouda u Špindlerova Mlýna × Martinova bouda na Benecku, a Lesní bouda nad Pecí pod Sněžkou × Lesní bouda ve Špindlerově Mlýně. Rozlišení dnes stojí jen v `interniPoznamky`, tedy tam, kam čtenář nevidí. Chce to redakční pravidlo, čím se objekt v nadpisu a perexu odlišuje, **a pramen na každou kolizi zvlášť** — „existuje i jiná chata téhož jména" je tvrzení jako každé jiné a podle konvence B se bez doložení nepublikuje.

**Příště:** čtvrtá a poslední dávka kroku (b) — zbývá 11 profilů: nova-klinovka, schronisko-kamienczyk, schronisko-odrodzenie, schronisko-pod-labskim-szczytem, schronisko-pttk-na-hali-szrenickiej, schronisko-pttk-na-przeleczy-okraj, schronisko-szrenica, strzecha-akademicka, vebrovy-boudy, vosecka-bouda, vyrovka. Sedm z jedenácti jsou polské profily, u kterých jsou prameny hůř dostupné (část domén je ze sandboxu blokovaná), takže se dá čekat víc nálezů třídy „tvrzení bez doloženého pramene" a míň třídy „misatribuce".

**Otázky pro Michala:** žádné nové nad rámec toho, co už leží u DATA-04 — přibyla jen jedna konkrétní: **ověřit souřadnice Lovecké chaty** u chataře nebo z katastru (viz měření výše).

---

## 2026-07-25 — navazující session (Opus, inline): DATA-15 krok (b), druhá dávka — jeden auditní průchod vyrobí sebejistý falešně čistý verdikt

**Zadání Michala:** stále „pokračuj samostatně dál". Po první dávce zbývalo 27 profilů, vzata **druhá dávka osmi** podle abecedy: Bouda Bílé Labe, Bouda Růžohorky, Chalupa Na Rozcestí, Chata Dvoračky, Chata Rezek, Chata U Jirky, Dom Śląski a Dvorská bouda.

**Hlavní věc dneška není žádný nález, ale metoda.** U prvních dvou profilů, které audit prohlásil za čisté, jsem pustil **druhý, nepřátelský průchod**: dostal verdikt „jiný auditor tenhle profil prohlásil za bezvadný" a jediný úkol — vybrat tři věty, na které by se nejdřív vrhl nepřátelský čtenář, a pokusit se je zlomit. U **Chaty Rezek** to čistý verdikt potvrdilo. U **Chalupy Na Rozcestí** ho to **zvrátilo a našlo tři skutečné vady**. První průchod přitom nevrátil „nejsem si jistý" — vrátil sebevědomé „0 nálezů" s dlouhým, věcně znějícím zdůvodněním. To je nepříjemnější zjištění než kterákoli z těch tří vad: **jeden průchod umí vyrobit falešně čistý verdikt, který se čte jako důkladnost.** Od téhle chvíle platí dvouprůchodové čtení jako standard pro zbývajících 19 profilů, a to hlavně na profily, které vyjdou čisté — u nálezů se stroj kontroluje sám tím, že něco našel.

**Co ta trojice u Chalupy Na Rozcestí byla:** (1) „obcí patří pod Pec pod Sněžkou" stálo jako holé tvrzení hned před větou, která poctivě připisuje polohu a výšku Kudy z nudy — jenže obecní příslušnost **nenese žádný pramen** a objekt stojí na trojmezí tří obcí, takže šlo o tichý výběr jedné ze tří možností; (2) nocleh se opírá **jedině o značku v OpenStreetMap**, ale byl napsaný uprostřed odstavce připsaného Kudy z nudy, které o ubytování nepíší vůbec — čtenář si připsání přirozeně přenesl na špatný pramen; (3) závěrečná výzva „potvrďte si to přímo u chalupy" **zamlčovala, že rozpor je i v samotných kontaktech** — `overeniProvoz` nese dvě telefonní čísla a zveřejněné je jedno, doména se mezi prameny liší (.com vs. .cz). Všechno přiznáno v próze, nic vyřešeno.

**Celkem 22 nálezů na osmi profilech, tedy 2,75 na profil** — proti 3,75 z první dávky. **Nečtu to jako zlepšení korpusu.** Dvě z osmi (Bouda Bílé Labe, Chata Rezek) vyšly opravdu čistě, což tenhle průměr táhne dolů samo o sobě; a hlavně: kdyby první průchod u Chalupy zůstal poslední, průměr by byl 2,4 a vypadal by ještě líp. **Nižší číslo tu klidně může znamenat slabší čtení, ne lepší profily.** Přesně proti té dvojznačnosti druhý průchod je.

**Čtyři vzorce, které se v první dávce neukázaly.** (1) **Profil tvrdí obě strany rozporu ve dvou odstavcích, aniž si toho všimne** — Bouda Růžohorky kladla v `text[0]` boudu do ochranného pásma KRNAP a v `text[3]` do druhé zóny ochrany přírody; ta zařazení se pod zonací KRNAP vylučují. Ani jedno nebyla vada připsání: každé mělo svůj pramen. Vadné bylo, že profil obojí odříkal a rozpor nezaznamenal. (2) **Citát v uvozovkách bez doloženého originálu** — Dom Śląski měl v perexu „poslední zastávka před výstupem na Śnieżku" jako by šlo o titulek, jenže **žádný titulek v souboru tu formulaci nemá** a hlavička profilu sama říká „obsah stránek NEotevřen". Uvozovky slibují doslovnost, kterou nemáme čím krýt. (3) **Reklamní heslo povýšené na tvrdý fakt** — Dvorská bouda tvrdila „na běžecké tratě je z boudy přímý přístup" a teprve pak dodala, že to vlastní web shrnuje heslem „z chaty rovnou do běžek"; dva odstavce nato profil přiznává, že nemá doložené ani pěší trasy, ani dojezd autem. (4) **Charakteristika terénu odvozená z adresy v odstavci, který zároveň odmítá uvést výšku** — Chata U Jirky psala „údolní chata", „v údolí obce" a „nejde o hřebenovou boudu" přímo vedle věty „nadmořskou výšku web neuvádí, takže ji neuvádíme ani my". Buď se z adresy odvozovat smí, nebo ne; obojí v jednom odstavci je nekonzistence, kterou nepřátelský čtenář uvidí okamžitě.

**Jeden nález agenta jsem zamítl, a stojí to za zápis.** U Boudy Růžohorky mi audit ohlásil misatribuci: próza připisuje druhou zónu ochrany přírody Českým horám, ale `zdroje` u toho pramene vypočítávají jen výšku, kapacitu, restauraci, speciality a psa po domluvě. Ověřeno proti souboru — **neplatí**: pole `autem` ten údaj Českým horám výslovně připisuje, a `popis` v `zdroje` je souhrn, ne vyčerpávající výčet. Zato pozorování samo mířilo na něco skutečného, jen jinam — a odtud vyšel vzorec (1) výše. **Nálezy auditu se ověřují proti souboru stejně přísně jako próza proti datům**, jinak se do korpusu dostane oprava vyrobená na základě nedorozumění.

**Dvě evidenční díry zalepeny.** Dom Śląski připisoval kapacitu 58 lůžek „prezentaci schroniska", jenže tu **nikdo neotevřel** — číslo stojí na externím katalogu, který se na prezentaci jen odvolává. Katalog je teď veden v `zdroje` a próza navíc přiznává, že v přehledu ubytování PTTK objekt vůbec není (což je rozpor s komentářem u vlastní sekce Nocleh, který říká „nedomýšlet", zatímco kapacita publikovaná byla). Týž katalog jsem ze stejného důvodu doplnil do `zdroje` u **Chaty Rezek**, kde se próza na „jediný katalogový soupis" odvolává kvůli výšce 880 m. Oba záznamy jsou bez URL — a to je právě ta informace: **pramen, který nemá veřejně citovatelné umístění, má být vidět jako takový**, ne schovaný v `interniPoznamky`.

**Sken zakázaných vzorů: 123 → 122, a tentokrát ten pohyb nic neznamená.** Přepis jedné věty v Chatě U Jirky posunul slovo „souřadnice" na začátek věty a vzor třídy GPS je psaný bez příznaku `i`, takže velké „S" nechytí. O díru nejde — skutečné souřadnice loví číselné vzory a samo to slovo je zdokumentovaný falešný poplach. Zapsáno do README u skriptu, protože po včerejším „−12 je součet dvou pohybů" je tohle druhá půlka téhož poučení: **ne každý skok má obsah, a rozeznat to jde jen měřením po souborech.** Změřeno rozdílem proti stavu v HEAD, ne z paměti.

**Ověřeno:** `npm run kontrola` zeleně — validátor `CHYB: 0` (42 publikovaných), připisování zdrojů 0, mechanický audit **A–F všechno 0**, regresní test 12 souborů / 3 kontroly / 0 rozdílů, sken 122 zásahů.

**Příště:** **třetí dávka kroku (b)** — zbývá **19 profilů**, dvouprůchodově. Pak Tier 3/4, GPS přes DATA-01, fotky z DATA-02.

**Otázky pro Michala:** přibyla jedna do DATA-04 — **Bouda Růžohorky: ochranné pásmo KRNAP, nebo II. zóna?** Prameny si odporují a profil to teď veřejně přiznává; při telefonátu se to dá vyřešit jednou větou.

## 2026-07-25 — navazující session (Opus, inline): DATA-15 krok (b), první dávka — a systémová vada u turistických známek

**Zadání Michala:** „můžeš pokračovat dál" / „pokračuj samostatně dál" — průchod backlogem bez doptávání. Vzat **krok (b) DATA-15**, tedy ta drahá půlka, kterou stroj neumí: přísný jazykový audit publikovaných profilů po dávkách.

**Hotovo — první dávka osmi profilů:** Brádlerovy boudy, Jelenka, Labská bouda, Moravská bouda, Pomezní bouda, Portášky, Rýchorská bouda a Tetřeví boudy. Každý článek se četl větu po větě proti YAML datům téhož profilu. **Podle mého sčítání 30 nálezů, všechny opravené** — počítám jednu vadu jako jeden nález i tam, kde stála současně v perexu, v `zajimavosti` i v textu (typicky se opravovala na třech místech naráz). To dělá 3,75 nálezu na profil, tedy **přesně tolik, kolik vyšlo na stratifikovaném vzorku čtyř starších profilů**. Extrapolace z minulé session tím dostala druhé nezávislé měření a drží.

**Vzorec nálezů se opakuje, ale přibyly dvě nové třídy.** Známé z DATA-14: tichý výběr jedné hodnoty tam, kde profil vede rozpor (Jelenka podala v perexu 1 260 m, ačkoli prameny nesou 1 260 i 1 263; Moravská bouda 1 225 m a 52 lůžek, ačkoli druhý pramen říká 1 220 a 54 — obojí přepsáno tak, aby rozpor byl vidět), tvrzení z druhé ruky podané naším hlasem (Portášky měly v perexu otvírací dobu i vybavení bez připsání, Rýchorská bouda restauraci a nepřístupnost autem) a falešná plynulost času (Brádlerovy boudy „místo je osídleno od roku 1637, hostinec tu funguje od 1890" — ten letopočet ale patří místu, ne dnešní boudě; Rýchorská „od roku 1976 boudu spravuje Správa KRNAP", ačkoli pramen mluví o převzetí, ne o dnešku). **Nové jsou tyhle dvě:** (1) **údaj v `zajimavosti` bez opory kdekoli jinde v souboru** — Tetřeví boudy měly jedinou zapsanou zajímavost (vlastní sjezdovka 300 m s vlekem a svoz do Ski resortu Pec), kterou nekryl žádný blok `overeni*` ani citace v `zdroje`; vypuštěna celá, i z textu, a nahrazena komentářem s úkolem doložit ji. (2) **připsání, které ukazuje na nesprávný pramen** — Labská bouda připisovala meteorologickou stanici a „solární a ozónovou observatoř ČHMÚ" webu boudy, jenže ten údaj nese Krkonose.eu a mluví jen o observatoři; opraveno připsání i rozsah tvrzení. Drobnější, ale téže rodiny: Portášky měly „naučnou" stezku Pecka tam, kde pramen píše jen „interaktivní", a Labská „necelý kilometr" od pramene Labe tam, kde zdroj takovou přesnost nedává.

**Vedlejší nález, a ten je systémový.** V perexu šesti z těch osmi profilů stála věta **„Nese turistickou známku č. X."** — a v `zdroje` k ní nebyl **jediný záznam**. Číslo přitom v souboru je, ale v `interniPoznamky`, tedy tam, kam čtenář nevidí: veřejně to bylo holé tvrzení bez pramene. A navíc **zbytečné**, protože číslo i odkaz na katalog vykresluje sourcovaná karta „Sběratelská místa" pod článkem. Ručním čtením bych na tohle přišel až za tři dávky, tak jsem vadu **rovnou popsal pravidlem** — nová **kontrola F** v `audit-mech.ts`: próza mluví o turistické známce nebo vizitce, ale `zdroje` katalog vydavatele vůbec nevedou. Běh přes všech 42 profilů vrátil **17 zásahů**, tedy dalších jedenáct profilů nad rámec čtené dávky. **Jeden z nich by hledání té konkrétní věty minulo** — Chata Rezek nesla stejnou vadu v jiném hávu („je zároveň známkovým místem (známka č. 19)"). Přesně proto se kontrola ptá na sběratelské tvrzení obecně, ne na jednu formulaci.

**Co mě na tom zajímá nejvíc:** ta věta **přežila tři nezávislé auditní průchody**. Petrova bouda ji měla i po stratifikovaném vzorku minulé session, Vrbatova bouda i po třech auditech, kterými procházela **při publikaci**. Lidské čtení ji nevidělo, protože zní neškodně a je pravdivá — vadná je jen tím, že ji čtenář nemá jak ověřit. To je docela přesná ilustrace toho, k čemu jsou mechanické kontroly dobré a k čemu ne: **nenajdou nic, co se musí pochopit, zato bezchybně najdou to, co se dá popsat pravidlem** — a lidské oko takovou vadu míjí právě proto, že není nápadná.

**Přijaté pravidlo (a je záměrně dvoudílné):** holá věta z perexu **pryč všude** — je bez pramene a karta ji stejně vykresluje líp; **záznam v `zdroje` se přidává jen tam, kde se próza nebo blok `overeni*` o známku fakticky opírá**. To je pět profilů: Moravská bouda a Portášky (výška vyrytá na rytině), Vrbatova bouda a Bouda Růžohorky (rozpor mezi rytinou a ostatními prameny, u Růžohorek navíc vazba známky na osadu), Pomezní bouda (známka vydaná pro celé sedlo, ne pro objekt) a Lyžařská bouda (rytina se s profilem shoduje). Každý takový záznam nese **svou vlastní výhradu** včetně toho, že odkaz na detail je sestaven podle vzoru webu a **klikem neověřený**. U Chaty Rezek zůstala výhrada i ve veřejném perexu, protože ta karta by jinak tvrdila vazbu, o které data říkají, že prokázaná není — formulace teď zní, že známkovým místem je celá osada Rezek · Jeruzalém, ne prokazatelně sama chata. **Celkem 17 ze 42 profilů opraveno, kontrola F hlásí nulu.**

**Kontrolu jsem přitom hned utáhl, protože měla díru.** Vzor, který v `zdroje` hledá katalog, matchoval holé `známk` — takže **jakýkoli `popis` se slovem „poznámka" by celou kontrolu pro ten soubor umlčel**. Přesně ta třída chyby, kvůli které v tomhle adresáři existuje `WB0`; doplněna hranice slova. K tomu **dvě nové fixtury**: `10-kontrola-f.yaml` je pozitivní případ a past na hranici slova v jednom souboru (perex je celý o „poznámce", nález musí přijít z `text[0]` — a protože `proza()` vydává nejdřív perex, je hlášený `text[0]` sám o sobě důkazem, že perex neprošel), `11-kontrola-f-dolozeno.yaml` je negativní kontrola s doloženým katalogem, kde kontrola musí mlčet. Obě jsou psané tak, aby **nepřidaly ani jeden zásah** ostatním dvěma skriptům — ověřeno, oba jejich snímky se změnily jen v počtu souborů.

**Snímky fixtury přegenerovány, rozdíl popsán** — přesně jak to žádá docblock `test-fixtura.ts` („buď je v portu chyba, nebo se kontrola záměrně zpřísnila"). Tady jde o to druhé.

**Sken zakázaných vzorů: 135 → 123, a ten rozdíl je zrádný.** Vypadá jako úbytek dvanácti, ale je to **součet dvou pohybů opačným směrem**: odpadlo **17 zásahů** třídy „číslo známky" a **pět naopak přibylo**, protože do prózy Brádlerových bud, Jelenky a Tetřevích bud se doplnilo připsání OpenStreetMap, které žádá licence ODbL. Kdybych se díval jen na součet, čtyři z těch pěti nových bych přehlédl. Všech pět patří do zdokumentovaných tříd falešných poplachů. Zapsáno do README u skriptu, protože je to nejlepší argument pro to, proč se u něj sleduje **skok**, a ne hodnota.

**Ověřeno:** `npm run kontrola` zeleně — validátor `CHYB: 0` (42 publikovaných), připisování zdrojů 0, mechanický audit **A–F všechno 0**, regresní test 12 souborů / 3 kontroly / 0 rozdílů. Sken 123 zásahů, každý přírůstek prověřen jednotlivě.

**Oprava čísla v obou dokumentech:** krok (b) se dosud psal jako „audit zbylých **38** profilů". To číslo bylo špatně už ve chvíli, kdy vzniklo — počítalo 42 minus čtyři ze vzorku, ale zapomnělo na tři profily publikované podle konvence DATA-14, které auditem prošly **při publikaci** (Vrbatova bouda, Černá bouda, Kochanówka). Správně jich bylo **35**; po dnešní dávce osmi jich zbývá **27**.

**Málem rozbité, chyceno před commitem:** při vkládání záznamu do `zdroje` u Chaty Rezek jsem si smazal klíč `interniPoznamky: >-` a celý blok interních poznámek osiřel jako neplatné pokračování seznamu. Chyceno zpětným přečtením souboru a opraveno. Poučení do příště: když `old_string` u editace končí kotvicím řádkem, `new_string` ho musí zopakovat.

**Příště:** **druhá dávka kroku (b)** — zbývá 27 profilů, odhad další 2–3 session. Pak Tier 3/4, GPS přes DATA-01, fotky z DATA-02.

**Otázky pro Michala:** 1) **Chata Rezek — držet u ní známku č. 19 vůbec?** Je vydaná pro osadu Rezek · Jeruzalém, ne prokazatelně pro chatu; teď je to v perexu poctivě přiznané, ale je to na profilu cizí těleso. Stačí jeden telefonát („prodává se u vás?"). Totéž v menším u Pomezní boudy (známka č. 673 pro celé sedlo). 2) Jinak beze změny — pořád visí telefonáty z DATA-04 a rozhodnutí u Medvědí boudy, Chaty Rozhled, Erlebachovy boudy a Chaty pod Studničnou.

---

## 2026-07-25 — navazující session (Opus, inline): kontrolní skripty přeneseny do repa (`scripts/kontrola`)

**Zadání Michala:** „můžeš pokračovat dál" / „pokračuj samostatně dál" — průchod backlogem bez doptávání. Vzata poslední otevřená položka z předchozí session: kontrolní skripty žily mimo repo, v sandboxu, a se sandboxem by zmizely.

**Hotovo:** Čtyři kontroly datové vrstvy (validátor, kontrola připisování zdrojů, sken zakázaných vzorů, mechanický audit A–E) **portovány z Pythonu do TypeScriptu** jako `scripts/kontrola/`. Volba mezi „zavést Python do repa" a „přepsat" padla na přepis: repo nemělo jediný `.py` soubor, kdežto `scripts/` má 22 TypeScriptů puštěných přes `npx tsx`. Kontroly teď spadají pod `lint` i `typecheck`, mají README a dvě npm zkratky — `npm run kontrola` (všechny čtyři a nakonec regresní test) a `npm run kontrola:test`. Commity `48e270a` a `3c0fc3e`.

**Port se neodhadoval, ověřil se.** Všechny čtyři skripty vracejí **bajt po bajtu stejný výstup jako pythonské originály**, a to na ostrém korpusu (42 profilů) i na fixtuře. Bylo proč to hlídat: javascriptové `\b` a `\w` jsou ASCII-only, kdežto pythonovské unicodové, takže naivní přepis by **nespadl — jen by tiše přestal zabírat na českých slovech**. Změřeno na fixtuře: `\bKč\b` a `\bzł\b` by v JS nenašly nic (správně 2 nálezy), `známk\w*\s*č\.\s*\d+` by minulo „známkách č. 673", protože `\w` se zastaví na „á", a `\b` před doménou by naopak vyrobilo falešné „hory.cz" z „Českéhory.cz". Řešeno konstantami `WB0`/`WB1`/`W` nad příznakem `u`; v celém adresáři se `\b` ani `\w` nepoužívá a stojí to i v komentáři nahoře, aby to příští ruka nerozbila.

**Nová fixtura se vyplatila hned.** `scripts/kontrola/fixture/` je 10 schválně vadných profilů, každý cílí na jednu větev kontroly a na jednu past. Očekávaný výstup **nebyl psán ručně — vygenerovaly ho pythonské originály**, takže snímek je důkaz shody s předlohou a přežil to, že originály zmizely se sandboxem. Chytila dvě odchylky portu, které se na zeleném korpusu nemohly ukázat, protože ten vrací samé nuly: mezeru navíc v úryvku u kontroly D (pythonovské `str.split()` zahazuje prázdné okraje, `split(/\s+/)` v JS ne) a chybějící mezeru ve formátování výstupu kontroly zdrojů.

**A jeden nález navíc, tenhle věcný:** vzor `PRIPSANI` u kontroly D měl holé `dle` a `nese`, které se trefily i dovnitř slov — „Špin**dle**rův", „ve**dle**", „v se**dle**", „při**nese**". Věta s takovým slovem tedy prošla jako připsaná, i když žádné připsání neměla, a to zrovna na slovech, co jsou v horském textu všude. Vada zděděná z předlohy; utažena na hranici slova ve vlastním commitu, odděleně od portu, aby důkaz „port se chová jako předloha" zůstal celý. **Na korpusu je rozdíl nulový** — utažení nic neodkrylo, jen zavírá díru do budoucna.

**Výsledky kontrol beze změny:** validátor `CHYB: 0` (42 publikovaných, 32 chat se známkou, 25 obrázků, 162 kandidátů), připisování zdrojů 0 chybějících, sken zakázaných vzorů 135 zásahů (ustálený počet, samé známé falešné poplachy), mechanický audit 0 zásahů.

**Dodatek — kontroly zapojeny do CI a běh ověřen nasucho.** Do `.github/workflows/ci.yml` přibyl druhý job „Kontroly datové vrstvy" (`npm run kontrola`), commit `746034d`. Na skutečném runneru GitHubu to zatím **nikdo neviděl běžet** — `gh` v sandboxu není a přístup k API GitHubu je z téhle session zavřený. Místo abych to odbyl větou „lokálně to jde", **nasimuloval jsem podmínky CI**: čerstvý `git clone` HEADu do dočasného adresáře, tedy jen to, co je opravdu zacommitované, a `npm run kontrola` nad ním. Prošlo **exit 0** — všech pět kroků zeleně, včetně fixtury (10 souborů) a jejích snímků. Tím padá **nejpravděpodobnější příčina pádu CI**, totiž soubor, který existuje lokálně, ale do repa se nedostal (fixtura i očekávané výstupy leží pod `scripts/`, žádné pravidlo `.gitignore` je nebere). Zbývá jediná neověřená proměnná: jestli po `npm ci` na runneru vyjde `npx tsx`, na které se `vse.ts` a `test-fixtura.ts` odkazují přes `spawnSync`. Riziko je malé a doložitelně malé — `tsx 4.22.4` je **devDependency**, `npm ci` devDependencies instaluje a `node_modules/.bin/tsx` z ní vzniká, takže `npx` sáhne po lokální binárce; navíc týmž `npm ci` prochází i job `lint`, který běhá odjakživa. **Michale, stačí se jednou koutkem oka podívat do záložky Actions** — když by to přece jen padlo, bude to na tomhle jediném místě.

**Příště:** čeká pořád jen **krok (b) DATA-15** — jazykový audit zbylých ~~38~~ profilů po dávkách, na potvrzení Michalem (otázka níže). Jinak Tier 3/4, GPS přes DATA-01, fotky z DATA-02. *(Oprava z 25. 7. 2026, zápis nahoře: správně jich bylo **35**, ne 38 — číslo počítalo 42 minus čtyři ze vzorku a zapomnělo na tři profily auditované už při publikaci. Krok (b) mezitím **začal**, první dávka osmi je hotová, zbývá 27.)*

**Otázky pro Michala:** beze změny oproti zápisu níže — pořád visí ta jedna o kroku (b) a telefonáty z DATA-04.

---

## 2026-07-25 — navazující session (Opus, inline): tři nové profily (Vrbatova bouda, Černá bouda, Kochanówka) → 42 publikovaných
**Zadání Michala:** „můžeš pokračovat dál" / „pokračuj samostatně dál" — průchod backlogem bez doptávání. Vzata fronta z `docs/DATA-03-master-krkonose.md`: zbytek Tier 2 a začátek Tier 3.
**Hotovo:** publikovány **tři nové profily** — 🇨🇿 **Vrbatova bouda** (Zlaté návrší, známka č. 393, obrázek nasazen do `public/znamky/`), 🇨🇿 **Černá bouda** (horský hotel kousek pod vrcholem Černé hory nad Janskými Lázněmi) a 🇵🇱 **Kochanówka** (schronisko PTTK v rokli pod vodopádem Szklarki, nezvykle nízko — asi 510 m). Publikovaných **39 → 42**, kandidátů ve frontě **45 → 42** (Tier 2 3 → 2, Tier 3 7 → 5). Podle konvence z DATA-14 se **článek psal rovnou při povýšení**, ne dodatečně. Aktualizován `docs/DATA-03-master-krkonose.md`: souhrnná čísla, tabulka klíčového zjištění (u známky č. 393 „kandidát" → **„publikováno 25. 7. 2026"**), tři nové řádky v tabulce publikovaných, vyřazené řádky z Tier 2 i Tier 3 — a **přepočtena věta, která se sama tiše rozbila**: „navíc **6** našich publikovaných chat v katalogu není" → **7** (Vrbatova bouda v ChatGPT katalogu chybí). Všechna odvozená čísla v dokumentu pak **znovu odvozena awkem přímo z tabulek**, ne převzata z prózy — publikovaná tabulka 42 řádků, Tier 1–4 dohromady 42.
**Audit před publikací a jeho verdikt:** tři nové články prošly **třemi nezávislými auditními průchody** (jeden na profil, každý proti YAML datům téhož profilu). Všechny tři vrátily **„NENÍ připraven k publikaci"** a dohromady **37 nálezů**. Opraveno **20 odstavců a všechny 3 perexy**. Vzorec nálezů se opakuje z DATA-14 a stojí za zapamatování: (1) **údaj z pramene o něčem jiném** — u Černé boudy podáno „1 260 m" jako výška objektu, ačkoli jde o výšku hory; (2) **falešná plynulost času** — z prvního sezónního hostince roku 1888 se stala nepřerušená tradice, ačkoli stará bouda roku 1984 padla a dnešní budovu dostavěli až roku 1993; (3) **nedoložený superlativ** — Kochanówka „nejníže položené schronisko v našem katalogu" (nikdo to nespočítal); (4) **„zde" u události, která se stala jinde nebo jindy** — Vrbatova bouda z roku 1964 nemohla být místem úmrtí Václava Vrbaty roku 1913; (5) **vlastnost odvozená ze seznamu materiálů** — z „pohledového betonu" v projektové stránce se v perexu stala „betonová bouda"; (6) **tichý výběr jedné hodnoty tam, kde profil vede rozpor** — u Vrbatovy boudy hned trojí (výška 1 390 vs. 1 400 m, rok stavby, infocentrum). Vše přepsáno tak, aby rozpor byl vidět ve veřejném textu, ne jen v `interniPoznamky`.
**Co jsem našel navíc sám (a co audit minul):** dvě vážnější věci, obě u Vrbatovy boudy. (1) **Misatribuce zdroje.** `overeniLokace` i `interniPoznamky` připisovaly výšku 1 400 m webu ateliéru IXA (autoři přestavby). Dohledáním doslovného znění staršího WebFetche v transkriptu se ukázalo, že **ixa.cz nadmořskou výšku vůbec neuvádí** — má ji výslovně mezi tím, co stránka neříká. Připsání opraveno na obou místech i s poznámkou, že dřívější údaj byl nepřesný, a **ixa.cz zaveden do `zdroje` jako samostatná šestá položka** s poctivým výčtem toho, co doopravdy nese (rok stavby „na počátku šedesátých let", autor Vladimír Šír, rozsah přestavby, materiály, adresa) a s větou „Nadmořskou výšku NEUVÁDÍ". (2) **Třetí pramen k infocentru, který rozpor prohlubuje.** Profil vedl obyčejnou dvojznačnost; ve skutečnosti si dva prameny **přímo odporují** — ixa.cz počítá „infocentrum KRNAPu" mezi novostavby vzniklé přestavbou, Archiweb u téže přestavby píše „nakonec bez infocentra", a krnap.cz popisuje sezónní infocentrum Zlaté návrší otevřené pro léto 2024 „v blízkosti autobusové zastávky", aniž řekne, ve které budově. Zapsáno jako třípramenný rozpor ve veřejném textu i v `interniPoznamky` — **netvrdíme ani jedno**. Přidán úkol do DATA-04: zeptat se přímo Správy KRNAP.
**Nové pravidlo domácího stylu (ověřené na korpusu, ne odhadnuté):** kontrola připsání zdrojů označila v textu Černé boudy tvary „Turistiky.cz" a „Českýchhor". Místo abych to odbyl jako falešný poplach a přidal do výjimek, **spočítal jsem výskyty domén ve všech 42 profilech**: jmenovat doménu zdroje ve veřejné próze **je** zavedený styl (9 souborů, 7 různých domén), ale doména musí vždy stát **v prvním pádě** a zpravidla ji uvozuje řídicí podstatné jméno — „server Krkonose.eu", „průvodce treking.cz", „katalogový profil na Schroniskaturystyczne.pl". Skloňovaná doména je tedy **skutečná vada**, ne styl; opraveno na „server Turistika.cz" a „server Českéhory.cz". **Poučení je obecnější než tenhle případ:** než něco prohlásím za domácí styl (nebo za falešný poplach), ověřím to na korpusu — je to táž chyba jako dřívější záměna „IXA" a „ixa.cz" při hledání podřetězce.
**Ověřeno (3 kontrolní vrstvy, všechny čisté):** validátor — `publikováno: 42 | známky (chaty): 32 | obrázky: 25 | PNG: 25`, `kandidáti: 161`, **0 chyb** (trvalá informační hláška: 7 chat má známku bez obrázku — dom-slaski, schronisko-kamienczyk, schronisko-odrodzenie, schronisko-pttk-na-przeleczy-okraj, schronisko-samotnia, schronisko-szrenica, strzecha-akademicka, všechny polské); kontrola připsání zdrojů přes 42 souborů — **0 nálezů, 0 chybějících připsání**; sken zakázaných vzorů přes 42 souborů — 133 zásahů, všechny prověřeny jako domácí styl nebo známé falešné poplachy (slovo „redakce", OpenStreetMap, „známku č. 393" ve stejném tvaru jako v deseti dalších profilech, „ceny Mies van der Rohe Award" = ocenění, ne cena v korunách, a domény v prvním pádě).
**Neověřeno:** seed ani render naživo — Postgres/docker v sandboxu nejede. Tři nové profily zatím nikdo neviděl vykreslené.
**Dodatek (téhož dne, po pushi `3175cd9`):** dojet poslední otevřený tip z ChatGPT katalogu. Založen ruční kandidát 🇵🇱 **Schronisko PTTK „Nad Łomniczką"** (`data/kandidati/krkonose/schronisko-nad-lomniczka.yaml`) — jediný objekt z katalogu, který jsme neměli ani jako kandidáta. Rešerše přinesla dvě věci, o kterých katalog mlčí a které přitom o zařazení rozhodují: podle oficiální stránky PTTK objekt **nemá nocleh a nabízí stravování**, což je přesně profil občerstvovací zastávky na trase (tvůj klíč zařazení tedy vychází kladně, a průkazněji než u české čtveřice z téže dávky) — ale **prameny si přímo odporují v tom, jestli objekt vůbec funguje**: PTTK ho vede jako fungující, trasygorskie.pl nese varování „jest w remoncie" a goryiludzie.pl ho označuje za „nieczynny (remontowany)". Proto **nepovyšovat** a pole `stav` nechat **záměrně prázdné** — ani `v-provozu`, ani `mimo-provoz`; publikovat profil možná zavřené chaty je přesně ta chyba, které se konvencí B vyhýbáme. Nedostupné prameny (`pttk.jgora.pl`, oficiální přehled schronisek KPN) **neobcházet jinými nástroji** — zapsáno rovnou do souboru. Tím je **ChatGPT katalog pokrytý celý**: všech 42 katalogových krkonošských objektů máme buď publikovaných, nebo jako kandidáta, a sekce „Nové tipy" v masteru je poprvé prázdná (nechána na místě pro příští externí seznam). Master přepočten — kandidáti 42 → 43, Tier 3 5 → 6, „v ChatGPT katalogu" 41 → 42 — a čísla zase odvozena awkem přímo z tabulek, **nově navíc zkřížena s daty**: 43 řádků fronty přesně odpovídá 43 kandidátským souborům bez hlavičky „POVÝŠENO", jediná odchylka byl právě nový objekt. Druhý nález dodatku: **Chata pod Studničnou** má ještě **druhou doménu** `chatapodstudnicnou.cz`, která z našeho prostředí dostupná je (na rozdíl od `podstudnicnoukct.cz`, kterou uvádí KČT) — klíč zařazení ale nemění, přímý dotaz na větu o obsluze neubytovaných vrátil i tam „TAKOVA VETA NA STRANCE NENI" a stravování je zase popsáno jako služba ubytovaným hostům. Zapsáno do kandidáta jako stav k vyjasnění při povýšení.
**Poučení k postupu (dodatek):** než jsem se u čtyř zablokovaných kandidátů (Medvědí, Rozhled, Erlebachova, Pod Studničnou) pustil do hledání, měl jsem si přečíst jejich `interniPoznamky` — celé rešeršní kolečko jen potvrdilo, co tam už týž den zapsané bylo. Zbytečné to nebylo (záznamy se potvrdily a vypadla z toho ta druhá doména u Chaty pod Studničnou), ale mělo přijít až druhé. **Existující poznámky číst před rešerší, ne po ní.**
**Dořešeno bez čekání na tebe — sporná doména u Kochanówky:** `interniPoznamky` publikovaného profilu tvrdily, že „ze sandboxu byla kochanowka.com.pl nedostupná", ačkoli doména z OSM zní `kochanowka.wszklarskiej.net`. Držel jsem to jako úkol na DATA-04, protože načtení té stránky si žádá tvoje svolení — jenže **ověřovat nebylo co**: `kochanowka.com.pl` se v celém fondu nevyskytuje nikde jinde, byl to překlep, ne druhý pramen. A hlavně ta věta tvrdila **výsledek pokusu, o kterém nemáme doklad, že vůbec proběhl** — což je přesně ten druh tiché nepravdy, kvůli kterému konvenci B držíme. Poznámka přepsána na prostý stav: doména z OSM **ověřená není** a proč se nenačetla, nevíme; pokus zopakovat to 25. 7. skončil na vyžádaném svolení a jinými nástroji se neobcházel. K DATA-04 tedy zůstává jen skutečný úkol — ověřit tu doménu a telefon. **Poučení:** do poznámek psát, co víme, ne co si pamatujeme, že jsme zkoušeli — a než něco odložím jako „zablokované", ověřit, jestli tam vůbec je co odblokovávat.
**Dodatek 2 — změřená chybovost staršího korpusu (tohle je odpověď na otázku 2 níže, ne další otázka):** místo abych se ptal, jestli pouštět přísný audit zpětně, **změřil jsem to**. Vzal jsem **vzorek 4 starších profilů**, a to schválně **stratifikovaně, ne náhodně**: vlajková loď (**Luční bouda** — nejdelší článek korpusu, 555 slov), polský profil s tenkými prameny (**Schronisko Samotnia**), profil s vůbec nejchudšími daty (**Horská chata Krakonoš**) a obyčejný průměr (**Petrova bouda**). Na každý jsem pustil samostatný auditní průchod s **toutéž taxonomií 11 typů vad**, jaká našla 37 nálezů ve třech nových článcích. **Výsledek: všechny čtyři vrátily „NENÍ připraven k publikaci", dohromady 15 nálezů** — Luční 5, Samotnia 6, Krakonoš 1, Petrova 3. To je **3,75 nálezu na profil proti 12,3 u tří nových článků**: starší korpus je tedy zhruba **třikrát čistší**, ale čistý není ani jeden ze čtyř profilů. Prostá extrapolace na zbylých 38 neauditovaných profilů dává kolem **140 nálezů** — ber to jako **řádový odhad, ne předpověď**, vzorek je stratifikovaný právě proto, aby zachytil krajní případy, ne aby dal reprezentativní průměr.
**Všech 15 nálezů jsem rovnou opravil** (v této dávce, čtyři soubory). Nejzávažnější: (1) **Samotnia** tvrdila „kapacitu 49 lůžek uvádí web schroniska", ačkoli číslo pochází z ChatGPT katalogu a stránku jsme nikdy neotevřeli — a **o dvacet řádků výš v témže souboru stál komentář „kapacita nedoložena"**, takže si soubor protiřečil sám se sebou; opraveno na obou místech. (2) **Luční bouda** připisovala článku ČeskéNoviny.cz větu o tom, že restaurace vaří i pro neubytované po rezervaci — jenže ten článek je podle vlastního titulku o bufetu a toaletách; **pramen toho údaje tedy neznáme**, což teď říká i veřejný text. (3) **Petrova bouda** psala, že nová budova nahradila vyhořelou „na témže místě" — to nenese žádný pramen a přitom **právě ta spojka svařovala historickou linku 1790–1811–1887 s přestavbou po roce 2011**. (4) **Krakonoš** v perexu umisťoval chatu „u Pece pod Sněžkou" jako fakt, ačkoli pole `obec` je kvůli doloženému rozporu **záměrně prázdné** a text[0] ten rozpor o dvě věty dál přiznává. Dál: „na Bílé louce" u Luční boudy stálo **jen na redakčně psaném altu u fotky** (alt není pramen — upraven taky), Samotnia měla u milníku 1934 v `overeniHistorie` napsáno „před publikací ověřit primárním pramenem" a **přesto byl publikován**, a u Petrovy boudy próza mlčky vynechávala rozpor v doméně (`petrovyboudy.cz` × `petrovabouda.cz`), ačkoli jedna z variant je publikovaná v kontaktech. Vedle toho jsem doplnil `zdroje` u Samotnie o dvě položky, které profil dosud používal, ale čtenáři neukazoval (`schroniskosamotnia.com`, `kpn.gov.pl`) — obě výslovně označené jako **NEOTEVŘENO**.
**Doporučení (a je jiné, než jak byla otázka položená):** audit **pustit — a pustit ho PŘED DATA-04, ne po něm**, protože DATA-04 tyhle vady neopraví. Telefonát doplní chybějící fakta; **misatribuci ani zamlčený rozpor ale žádný telefonát nesmaže**, ty zůstanou ve větách, dokud je někdo nepřečte. Naopak to funguje obráceně: **audit sám vyrábí otázky pro DATA-04**, a to konkrétní, telefonicky položitelné — dnešní čtveřice jich vydala hned několik (odkud je rezervační režim restaurace u Luční boudy? platí u Petrovy boudy `petrovyboudy.cz`, nebo `petrovabouda.cz`? stojí nová Petrova bouda na místě té vyhořelé?), na které by se bez něj nikdo nezeptal. Pořadí navrhuju takové: **(a) nejdřív mechanické kontroly přes všech 42 profilů naráz** — část taxonomie je totiž strojově chytatelná a je to prakticky zadarmo: „profil tvrdí v próze hodnotu pole, které je záměrně prázdné" (tak se chytil Krakonoš), „v `overeni` stojí *před publikací ověřit primárním pramenem*, a profil je přesto publikovaný" (tak se chytila Samotnia), „skloňovaná doména", „doména jmenovaná v próze chybí v `zdroje`" (tahle už běží). **(b) teprve pak jazykový audit zbylých 38 profilů po dávkách**, protože zbytek taxonomie — falešná plynulost času, nedoložený superlativ, „zde" u události jinde — se strojově chytit nedá, musí se to číst. Odhad: **2–3 session**, přičemž větší půlka práce nejsou nálezy, ale jejich opravy.
**Co mi z toho vyšlo jako obecnější poučení:** **čím delší a ambicióznější článek, tím vyšší chybovost** — 12,3 nálezu na nový (dlouhý, bohatě podložený) článek proti 3,75 na starší. Není to tím, že bych psal hůř než dřív; je to tím, že **plynulá próza potřebuje spojky, a spojky se vyrábějí, ne dokládají**. U tenkých profilů jako Krakonoš (1 nález) není z čeho splétat, takže se ani nesplétá. Praktický důsledek: audit při publikaci nového článku (což už je konvence z DATA-14) je důležitější než zpětný průchod, a zpětný průchod má smysl brát jako **jednorázový úklid**, ne jako opakovaný proces.
**Dodatek 3 — krok (a) doporučení je HOTOVÝ: mechanické kontroly proběhly přes všech 42 profilů.** Nečekal jsem na potvrzení, protože tahle část je prakticky zadarmo (napsat kontrolu a pustit ji stojí zlomek toho, co jazykový audit) a **nezavazuje tě k tomu drahému kroku (b)**. Napsal jsem kontrolní skript s pěti pravidly, která odpovídají té části auditní taxonomie, co je strojově chytatelná: **A** próza tvrdí hodnotu pole, které je záměrně prázdné (tak se chytil Krakonoš) · **B** v bloku `overeni` stojí *před publikací ověřit primárním pramenem*, a profil je přesto publikovaný (tak se chytila Samotnia) · **C** skloňovaná doména · **D** superlativ bez připsání (kdo to tvrdí?) · **E** letopočet v próze, který nikde jinde v souboru není. První běh vrátil **18 zásahů k posouzení** (A 2 · B 5 · C 0 · D 11 · E 0); každý jsem přečetl v profilu.
**Výsledek triáže: 8 skutečných vad, 10 falešných poplachů — a všech 8 je opraveno.** **B dalo 5 z 5 zásahů, všechny skutečné** a všechny stejného druhu jako Samotnia: **Dvoračky, Špindlerovka, Labská, Luční a Vosecká** měly v `overeniHistorie.source` napsáno *před publikací ověřit primárním pramenem* — a přitom byly publikované. Důležité je, **co jsem u nich našel ve veřejném textu**: všech pět tu slabinu čtenáři **poctivě přiznává** („Primárním pramenem nic z toho zatím ověřené nemáme.", „jde o sekundární médium, jehož údaje zatím nemáme potvrzené primárním pramenem" atd.). Vada tedy nebyla v tom, co čteme na webu, ale v tom, že si **interní poznámka vedla nesplněnou podmínku, kterou jsme vědomě obešli** — z takového záznamu se za měsíc nedá poznat, jestli se na to zapomnělo, nebo se to rozhodlo. Přepsal jsem je proto na záznam skutečnosti (publikováno bez potvrzení, slabina přiznaná veřejně, ověření zůstává úkolem pro DATA-04) a `checked` jsem **nezvedal** — pramen se znovu nekontroloval, opravil se náš vlastní zápis.
**Z D (superlativ bez připsání) bylo 11 zásahů, z toho 5 skutečných.** Nejzajímavější je **Luční bouda**: text[0] říká opatrně „podle provozovatele je největší a nejstarší boudou Krkonoš… obojí jsou tvrzení provozovatele", ale o dva odstavce dál stálo plnou vahou „Přestavba z roku 1914 udělala z Luční boudy největší boudu Krkonoš" — **týž údaj na dvou různých stupních jistoty uvnitř jednoho článku**. Dál: **Pod Łabskim Szczytem** měl v perexu „jedno z **nejstarších a nejpůvabnějších**" a „je **výborným** východiskem" — estetický soud v našem hlase, který nenese žádný blok `overeni` (ty dokládají budovu z roku 1938 a PTTK od 1945), a „nejstarší" navíc **odporovalo vlastnímu text[1]**, který pečlivě rozlišuje kontinuitu místa od stáří stavby; **Kamieńczyk** tvrdil v perexu „jeden z nejvyšších vodopádů polských Sudet", což nedokládá žádný pramen profilu; **Pomezní** a **Rýchorská** měly v perexu holý superlativ, který jejich vlastní text správně připisoval Kudy z nudy — perex tedy tvrdil víc než článek pod ním. Falešné poplachy byly poučné jinak: „nejistota", „nejpozději", „v nejvyšším patře" (patro toho domu, ne rekord) a případ, kdy **připsání stálo v sousední větě**, ne v té se superlativem.
**Vedlejší nález, který za to stál nejvíc: křížový rozpor mezi dvěma profily.** Když jsem z perexu Pod Łabskim Szczytem odstranil „nejstarších", všiml jsem si, že profil **Strzechy Akademické** nese tvrzení jejího provozovatele, že **Strzecha spolu s chatou Pod Łabskim Szczytem jsou nejstarší chaty v Krkonoších** — kdežto u Pod Łabskim vedeme budovu z roku **1938**. Formálně si to neodporuje (tvrzení provozovatele proti datované stavbě), ale čtenář, který si obě stránky otevře vedle sebe, to uvidí. Podle konvence B se takové věci **nemají tiše srovnat**, takže je teď rozpor **přiznaný na obou stranách** v samotném textu, u Pod Łabskim přibyl zdroj `strzechaakademicka.pl/historia` (s poznámkou, že jsme ho neotevřeli) a do DATA-04 přibyla konkrétní otázka na PTTK Jelenia Góra: **co se tím „nejstarší" myslí — stavba, nepřetržitá služba, nebo kontinuita místa?**
**Skript jsem podle triáže utáhl** (kontrola A hradluje výšku a stav na přiznání i připsání, kontrola D umí sousední větu a zná seznam „superlativů", které nejsou rekordy) a **napsal k němu regresní test** — umělý profil s přesně těmi vadami, které jsme opravili, aby bylo vidět, že kontroly po utažení pořád zabírají. Po opravách vrací korpus **0 zásahů ve všech pěti kontrolách**, a ověřil jsem si, že to není slepota: 12 superlativů typu rekord v korpusu pořád je, jen mají všechny doložené připsání. **Tohle je celý krok (a). Zbývá jen krok (b), tj. jazykový audit zbylých 38 profilů — a ten pořád čeká na tvoje slovo.**
**Příště:** dojet **Tier 2 a Tier 3** — u zbylých pěti se to ale láme na tvůj klíč zařazení, viz níže. Pak **Tier 4** (34 kandidátů jen z OSM — nejtenčí signál, ověřit existenci a provoz). Beze změny dál: GPS pro profily bez souřadnic přes DATA-01 Actions, hero fotky z DATA-02, **DATA-04 = první `verified: true`** (nově i dotaz Správě KRNAP na infocentrum Zlaté návrší), polské známky (7 chat má známku bez obrázku), vizitky Wander Book až po svolení, notifikovat Mgr. Holuba po spuštění webu. Položka „prověřit Schronisko Nad Łomniczką" **je hotová dodatkem téhož dne** (viz výše) — nově z ní ale vzešel úkol do DATA-04: rozhodnout jeho provoz dotazem na PTTK Jelenia Góra, což je **týž správce jako u Kochanówky**, takže se to dá spojit do jednoho dotazu. Drobnost s doménou Kochanówky **dořešena** — viz dodatek níže.
**⚠ Rozhodnutí pro Michala — zbylých pět kandidátů Tier 2/3 neprojde klíčem zařazení samo od sebe:** **Medvědí bouda** (č.1274) a **Chata Rozhled** (č.14) — veřejné občerstvení se mi nepodařilo doložit, a bez něj podle tvého klíče dovnitř nepatří; **Erlebachova bouda** a **Chata pod Studničnou** — totéž; **Raisova chata na Zvičině** — leží **mimo Krkonoše** (Zvičina je Podkrkonoší), takže než ji povýším, potřebuju vědět, jestli zakládat další `oblast`, nebo ji nechat ležet. Dva další nálezy z fronty: **Hrnčířské boudy** nejsou jeden objekt, ale skupina (katalog je vede jako jednu položku — profil by lhal už názvem), a u **Pražské boudy** si prameny odporují v adrese. **Richtrovy Boudy** (č.1602) zůstávají zadržené beze změny — čekají na tebe od minulé dávky.
**Otázky pro Michala:** 1) Těch pět kandidátů výše — mám je zkusit doložit dál (dotazem na provozovatele, tj. přesunout do DATA-04), nebo je zatím odložit? 2) ~~Stojí ti za to, abych stejný auditní průchod pustil zpětně i na starší profily?~~ **ODPOVĚZENO MĚŘENÍM, viz Dodatek 2 výše** — místo ptaní jsem vzal stratifikovaný vzorek 4 starších profilů, všechny čtyři neprošly (15 nálezů, 3,75 na profil proti 12,3 u nových článků) a všech 15 jsem opravil. Doporučení mělo dva kroky a **krok (a) — mechanické kontroly přes všech 42 profilů naráz — je mezitím taky hotový** (viz Dodatek 3 výše: 18 zásahů → 8 skutečných vad, všechny opravené, korpus vrací 0). Pustil jsem ho bez ptaní, protože je prakticky zadarmo a **nezavazuje tě k ničemu dalšímu**. Otevřený tedy zůstává **jen krok (b): jazykový audit zbylých 38 profilů po dávkách** — ta drahá část, kterou stroj neumí a musí se číst. Pořád platí, že má smysl **před DATA-04** (telefonát misatribuci nesmaže, zato audit vyrábí konkrétní otázky pro telefonát). Odhad **2–3 session**, větší půlka práce nejsou nálezy, ale jejich opravy. Když řekneš „ne", nechám to ležet a půjdu dál na Tier 3/4 — krok (a) tím nepadá, ten je odvedený tak jako tak.

## 2026-07-25 — hlavní session (Opus, inline): článek jako v knižním průvodci u všech 39 profilů (DATA-14)
**Zadání Michala:** „pošli + rovnou u všech chat vytvoř textový popis se vším, co o chatě víš = jako článek v knižním průvodci — kde o chatě nic moc nevíš, aspoň popiš umístění a základní fakta textem." Dvě rozhodnutí přes doptání: **rozšířit stávající pole `text`** (ne nové pole — žádná změna schématu ani frontendu, texty se hned renderují v sekci Charakteristika) a **délku řídit tím, „kolik data unesou"** (u dobře podložených bud 400–600 slov, u chudě doložených 120–200, nic nedomýšlet).
**Hotovo:** přepsáno pole `text` u **všech 39 publikovaných profilů** z holých odrážek na souvislou prózu. Stavba článku: poloha a okolí → historie → dnešní provoz a zázemí → přístup → **závěrečný odstavec o tom, odkud údaje pocházejí a co ověřené není**. Korpus vyrostl z mediánu 102 slov na **10 022 slov celkem, min/medián/max 125 / 244 / 555 slov, 3–7 odstavců** na profil. Nejdelší články mají Luční bouda (555 slov), Brádlerovy boudy (529) a Pomezní bouda (405), nejkratší Schronisko PTTK na Hali Szrenickiej (125), Lovecká chata (128) a Chata U Jirky (133) — tedy objekty, o kterých toho doložené moc nemáme; u nich článek poctivě popíše polohu, jméno a to málo doloženého, a víc netvrdí. Doplněna **nápověda pole `text` v Payload adminu** (`src/collections/Chaty.ts`), aby stejný standard platil i pro ručně psané profily; `npx tsc --noEmit` čistý. Vedle textů opravena **jedna skutečná datová chyba**: milník Dom Śląski měl `rok: 1921` a v `udalost` řetězec „1922 — postavena současná budova" (artefakt našeho vlastního YAML, ne alternativní datace z pramene) → sjednoceno na 1922. Commity `412c11e`, `d68ad10`, `c604a75`, pushnuto na origin/main.
**Poctivost (klíč této session):** próza je nejnebezpečnější formát, jaký zatím na webu máme — plynulá věta svádí doplnit spojku, vysvětlení nebo důvod, který v datech není. Proto: tvrzení z druhé ruky se **připisují zdroji** („podle Kudy z nudy", „podle prezentace boudy"), **rozpory pramenů se přiznávají** místo tichého výběru jedné hodnoty (Jelenka 1260 vs. 1263 m, Výrovka 1368 vs. 1356 m, Vosecká 43 vs. 42 lůžek, Brádlerovy KČT vs. vlastní web u veřejné přístupnosti restaurace), a do veřejné prózy **nejdou ceny** („ceny se mění"), telefony, e-maily, URL, GPS, čísla turistických známek ani interní terminologie (`verified`, kandidát, názvy polí, čísla profilů). Interní podklad ChatGPT se v textech smí zmínit jen jako „starší podklad, ze kterého profil vychází" — nikdy jako pramen, který by si čtenář mohl dohledat.
**Ověřeno (4 nezávislé vrstvy):** (1) validátor 0 chyb, 39 publikovaných / 31 známek / 24 obrázků beze změny; (2) skript, který u každého souboru porovná klíče pracovní kopie proti `git show HEAD:` — potvrzeno, že se **ve 38 souborech změnil výhradně klíč `text`** a v `dom-slaski.yaml` navíc jen zamýšlený `milniky`; (3) mechanický sken na zakázané vzory (URL, TLD, e-mail, telefon, ceny/Kč, GPS, čísla známek, názvy polí, interní pojmy) — 15 zásahů, všechny prověřeny jako falešně pozitivní (jména médií jako treking.cz uvnitř věty, české „osm" trefené vzorem /OSM/); (4) **šest paralelních auditních průchodů** přes všech 39 článků proti YAML datům, ze kterých vzešlo **37 opravených odstavců ve 20 souborech**.
**Co audit našel (stojí za zapamatování):** opakovaně se objevil vzorec, kdy článek tvrdil, že jsme něco **četli na webu chaty** („web schroniska uvádí kapacitu 58 lůžek"), ačkoli profil ten údaj vede jako převzatý z druhé ruky a stránku jsme nikdy neotevřeli — všechny takové věty přepsány na „máme z druhé ruky, nepotvrzené". Dál: jedna **mnou vymyšlená věta** o „přirozené zastávce na hřebenových trasách" u Hali Szrenickiej (smazána i s nedoloženým detailem o lanovce), sebeprotiřečení u Odrodzenie ohledně provozovatele (přerámováno na otevřenou otázku, zda objekt spadá pod PTTK), aritmetický rozpor u Kamieńczyku (19 míst vs. 6×2+1×3 pokojů — teď se říká rovnou, že si to neodpovídá), časy u Luční boudy sjednocené s `casMin` v datech, u Szrenice požár „zasáhl" místo „zničil" a vypuštěná výška vrcholu, u Kolínské bazén „8 × 4 × 1,5 metru" bez tvrzení, který rozměr je hloubka. Vyházené prosáklé redakční poznámky („text článku jsme neotevřeli", „bude potřeba podepřít lepším pramenem").
**Neověřeno:** seed a render naživo — Postgres/docker v sandboxu nejede jako v předchozích sessions. Texty jsou psané tak, aby `lexToParas` viděl prostý seznam odstavců (stejný tvar jako dosud), ale vizuální kontrola sekce Charakteristika na profilu zbývá.
**Příště:** **Tier 2** (Chata Rozhled č.14, Medvědí bouda č.1274, Vrbatova bouda č.393) a Tier 3 — **článek se u nových profilů píše rovnou při povýšení**, ne dodatečně (zapsáno do backlogu jako konvence). Dál beze změny: rozhodnutí o Richtrových a Brádlerových (Michal), GPS pro 8 profilů bez souřadnic přes DATA-01 Actions, hero fotky z DATA-02, DATA-04 = první `verified: true`, polské známky (7 chat má známku bez obrázku), vizitky Wander Book po svolení, notifikovat Holuba po spuštění webu, prověřit Schronisko Nad Łomniczką.
**Otázky pro Michala:** 1) **Přečti si dva tři články** (doporučuji Luční boudu jako nejdelší, Loveckou chatu jako nejkratší a Dom Śląski jako polský minimalismus) a řekni, jestli tón sedí — píšu spíš věcně-průvodcovsky, bez lyriky, a každý článek končí odstavcem „odkud to víme". Kdyby ti ten závěrečný odstavec přišel příliš úřední, umím ho zkrátit na dvě věty. 2) U několika bud je nejzajímavější věc v článku zároveň ta nejhůř doložená (Richtrovy, Brádlerovy, Moravská) — mám u takových pasáží časem zvážit viditelný infobox „sporné", nebo stačí, jak to teď říká próza?

## 2026-07-25 — hlavní session (Opus, inline): třetí dávka Tier 1 — fronta dojetá (7 bud, 1 zadržena)
**Zadání Michala:** „pokračuj samostatně dál" → dojet zbytek master fronty Tier 1 bez doptávání.
**Hotovo:** povýšeno **7 z posledních 8 Tier-1 bud**: **Bouda Růžohorky** (č.75), **Chata Rezek** (č.19), **Lysečinská bouda** (č.1336), **Lyžařská bouda** (č.2210), **Moravská bouda** (č.1873), **Pomezní bouda** (č.673), **Portášky** (č.675). Publikovaných chat 32→**39**, **Tier 1 ve frontě 8→1** (zbývá jen zadržená Richtrovy boudy — viz níže). Ke každé přidán záznam známky do `krkonose.json` (pocetChat 25→**32**) a nasazen obrázek do `public/znamky/` + `obrazky.json` (17→**24**), vše ze sady Turistické známky s.r.o. se svolením Mgr. Holuba; vizitky Wander Book se dál nedotýkáme (bez svolení). Regenerován `docs/DATA-03-master-krkonose.md`. GPS doplněna **jen tam, kde je doložená z OSM** — Růžohorky way/291722059, Lyžařská way/218896623, Moravská way/31126083; u Rezku, Lysečinské, Pomezní a Portášek **záměrně prázdná** (katalog souřadnice nenese, v OSM exportu objekty nejsou; Overpass je ze sandboxu nedosažitelný → doplnit přes Actions nebo ručně). Typ `horsky-hotel` zvolen u Lyžařské boudy (Kudy z nudy ji vede jako hotel, 70 lůžek, pokoje s vlastní koupelnou, polopenze) oproti OSM tagu `tourism=alpine_hut` — rozhodnutí redakce zapsáno v `interniPoznamky`.
**Poctivost (klíč):** vše `verified:false` s `checked: 2026-07-25` a jmenovaným zdrojem v každém bloku. Vlastní weby ruzohorky.cz, lyzarskabouda.com, moravskabouda.cz a portasky.cz jsou ze sandboxu nedostupné (rozbité HTTPS / self-signed / timeout), krkonose.eu a cs.wikipedia.org dál taky → data ze sekundárních médií (Kudy z nudy, České hory, malaupa.cz) + OSM. **Zaznamenáno 7 rozporů** místo tichého výběru jedné hodnoty: výška Růžohorek 1280 m (Kudy z nudy + České hory) vs. **1250 m vyrytých na známce č.75**; tři konkurenční domény u Rezku (rezek.cz / hotelrezek.cz / krkonose-rezek.cz) + výška 880 m jen z katalogu; otvírací doba Lyžařské 10:30–17:00 (Kudy z nudy) vs. „Mo-Su 10:30-22:00" (OSM); Moravská 1225 vs. 1220 m a 52 vs. 54 lůžek; e-mail Pomezní info@pomezni-bouda.cz vs. pomezbouda@gmail.com. **Dvě opravy proti kandidátovi** u Lysečinské: výška 950→**1000 m** a obec Horní Maršov→**Malá Úpa** (adresa Horní Lysečiny 51), plus doména .cz→.eu. **U Portášek výška vědomě NEVYPLNĚNA** — katalog nese 1060 m, rytina známky č.675 nese 1050 m a ani Kudy z nudy, ani České hory výšku neuvádějí, takže žádná varianta nemá druhý nezávislý doklad; je to jediný profil dávky bez výšky (radši prázdné pole než tipovaná hodnota). U Moravské **`rokVzniku` nevyplněn** (zdroj má jen „první polovina 19. století") → milník zapsán bez roku. U Pomezní **`typObcerstveni` vědomě nevyplněno** (viz níže). **Stale-data guard:** prezentace Moravské i Portášek na Českých horách jsou **archivní** — v profilu i v `zdroje` je to napsáno.
**Poctivost (známky):** u **tří** nových záznamů dána `jistota: "B"` s vysvětlující poznámkou, protože známka je vydána pro **místo/osadu, ne prokazatelně pro objekt**: č.19 „Osada Rezek · Jeruzalém", č.673 „Pomezní Boudy · Malá Úpa" (sedlo s více objekty) a č.75 „Růžohorky" (jméno osady i boudy, navíc rozdíl výšek 1250 vs. 1280 m). Precedens: sdílená známka Dvoračky · Štumpovka. Odkazy na detail jsou u všech nových čísel dál **sestaveny dle vzoru webu** — číslo je z fyzické známky, odkaz „ověřit klikem".
**⚠ Rozhodnutí pro Michala — Richtrovy boudy (č.1602) ZADRŽENY, nepublikovány:** Kudy z nudy uvádí, že objekty **„již nejsou veřejnosti přístupné"** a jsou majetkem Policejního prezidia (jako web dokonce vede policie.cz). Protidůkazy jsou **zastaralé**: prezentace na Českých horách (1206 m, 106 lůžek, restaurace, MŠMT) je výslovně archivní a článek na rizeniskoly.cz o pobytech „školám i veřejnosti" (NIDV) je **z 27. 3. 2014**. Podle tvého klíče zařazení (veřejné občerstvení) to takhle neprojde, tak bouda zůstává kandidátem a rozhodnutí je na tobě — obrázek známky č.1602 čeká připravený ve staging.
**⚠ Klíč zařazení — tři profily s viditelným otazníkem:** **Lyžařská bouda** (zdroj píše „především pro školky a školy v přírodě, lyžařské kurzy", ale zveřejněná denní otvírací doba restaurace odpovídá veřejnému provozu), **Moravská bouda** (restauraci uvádí **jen archivní** prezentace Českých hor, Kudy z nudy stravování vůbec nepopisuje — nejslabší doložení dávky), **Pomezní bouda** (doložena jen polopenze a plná penze, tedy služba pro ubytované → `kuchyne: ano`, ale `typObcerstveni` **nevyplněno** a v textu profilu je to otevřeně řečeno). Naopak nejsilněji doložené jsou **Portášky** — Kudy z nudy zveřejňuje otvírací dobu restaurace „po–ne 10:00–23:00" a celoroční provoz. Přenáší se i **starší otevřený bod: Brádlerovy boudy** (KČT píše „i pro průchozí turisty", vlastní web boudy naopak, že restaurace veřejně přístupná není).
**Ověřeno:** YAML parse 39/39 profilů, enumy proti `src/collections/Chaty.ts` + `src/fields/overeni.ts` (typ, stav, typObcerstveni, kategorie zajímavostí), každý blok `overeni*` má `verified:false` + `source` + `checked`, slug = název souboru, JSON katalog i manifest platné, `pocetChat` sedí, párování známka↔obrázek↔soubor↔publikovaný profil OK, **md5 všech 7 nových PNG sedí se zdrojovými**, filtr DATA-13 (jen `system:znamka`, jen domény vydavatele) drží, žádný osiřelý PNG. **Seed/render naživo NEOVĚŘENO** — Postgres/docker v sandboxu nejede, stejně jako v předchozích sessions.
**Příště:** Tier 1 je dojetý → na řadě je **Tier 2** (Chata Rozhled č.14, Medvědí bouda č.1274, Vrbatova bouda č.393) a Tier 3 z katalogu. Dál čeká: rozhodnutí o Richtrových a Brádlerových (Michal), **GPS pro 8 profilů bez souřadnic** (Petrova, Kolínská, Rýchorská, Friesovy + nové Rezek, Lysečinská, Pomezní, Portášky) přes DATA-01 Actions, hero fotky z DATA-02, **DATA-04 = první `verified: true`**, polské známky (struktura znaczki-turystyczne.pl neprozkoumána — 7 chat má známku bez obrázku), vizitky Wander Book po svolení, notifikovat Holuba po spuštění webu, prověřit Schronisko Nad Łomniczką. Kandidátní YAML povýšených ponechány (jako u dřívějších dávek).

## 2026-07-24 — hlavní session (Opus, inline): druhá dávka Tier 1 z master fronty (5 bud)
**Zadání Michala:** „pokračuj další dávkou" → další várka z master fronty stejným vzorem (Kudy z nudy + OSM + známka).
**Hotovo:** povýšeno **5 dalších Tier-1 bud** z kandidátů na publikované profily: **Jelenka** (č.1367), **Kolínská bouda** (č.1719), **Brádlerovy boudy** (č.394), **Rýchorská bouda** (č.390), **Friesovy boudy** (č.2049). Publikovaných chat 27→**32**, Tier 1 ve frontě 13→**8**. Ke každé přidán záznam známky do `data/znamky-vizitky/krkonose.json` (pocetChat 20→**25**) a nasazen obrázek známky do `public/znamky/` + `obrazky.json` (12→**17**) — vše ze sady Turistické známky s.r.o., ke které máme svolení Mgr. Holuba (22. 7. 2026); vizitky Wander Book se dál nedotýkáme (bez svolení). Regenerován `docs/DATA-03-master-krkonose.md`. GPS doplněna jen tam, kde je doložená z OSM (Jelenka way/108114544, Brádlerovy way/32597735) — u Kolínské, Rýchorské a Friesových **záměrně prázdná** (katalog souřadnice nenese, v OSM exportu objekty nejsou; Overpass je ze sandboxu nedosažitelný → doplnit přes Actions nebo ručně). Typ `horsky-hotel` zvolen u Kolínské a Friesových (rozsah služeb i vlastní pojmenování), oproti katalogu, který je vedl jako „horská bouda" — rozhodnutí redakce zapsáno v `interniPoznamky`.
**Poctivost (klíč):** vše `verified:false` s `checked: 2026-07-24` a jmenovaným zdrojem v každém bloku. Vlastní weby bud jelenka.eu, kolinskabouda.cz a martinovka.cz jsou ze sandboxu nedostupné, nově je **cache-only i cs.wikipedia.org** („This domain is cache-only and cannot be fetched") a krkonose.eu/treking.cz padají na robots ConnectTimeout — data tedy ze sekundárních zdrojů (Kudy z nudy, kct.cz, malaupa.cz, ceskehory.cz, vlastní weby Brádlerových a Rýchorské). **Rok vzniku u Jelenky, Kolínské a Friesových nevyplněn** — žádný dosažitelný zdroj ho nenese, nedomýšleno (v každém profilu je to napsáno v `overeniHistorie`). Zaznamenáno **6 rozporů zdrojů** místo tichého výběru jedné hodnoty: výška Jelenky 1260 (OSM+malaupa) vs. 1263 (Kudy z nudy); sociální zařízení Jelenky na patře vs. na pokoji; Wi-Fi Jelenky je/není (pole proto **nevyplněno**); kapacita Kolínské 102 vs. 100; noclehárny Brádlerových 10+12 vs. jedna pro 20; e-mail Rýchorské; pokoje/lůžka Friesových 24/75 vs. 21/66 (HotelStars). Dvě opravy proti kandidátům: oficiální doména Rýchorské je **rychorska-bouda.cz** (s pomlčkou), u Friesových zůstává rozpor friesovyboudy.cz vs. friesovy-boudy.cz. **Stale-data guard:** sezónní údaje na webu Rýchorské se vztahují k sezóně 2025 — vědomě nepřevzaty jako aktuální.
**⚠ Rozhodnutí pro Michala — Brádlerovy boudy:** zdroje si odporují u **veřejné přístupnosti stravování**, což je přesně tvůj klíč zařazení. KČT (provozovatel) píše o druhé jídelně „i pro průchozí turisty", vlastní web boudy naopak, že restaurace veřejně přístupná není a vaří se jen ubytovaným nebo na objednávku. Profil je zatím publikován s rozporem přiznaným na třech místech (hlavičkový komentář, `overeniObcerstveni`, samostatný odstavec v `text`) — po tvém primárním ověření buď rozpor zmizí, nebo objekt vypadne dle klíče.
**Ověřeno:** YAML parse 32/32 profilů, enumy proti `src/collections/Chaty.ts` + `src/fields/overeni.ts` (typ, stav, typObcerstveni, kategorie zajímavostí, tříhodnotové služby), JSON katalog i manifest platné, párování známka↔obrázek↔soubor↔publikovaný profil OK, md5 všech 5 nových PNG sedí se zdrojovými, filtr DATA-13 (jen `system:znamka`, jen domény vydavatele) drží, žádný osiřelý PNG. **Seed/render naživo NEOVĚŘENO** — Postgres/docker v sandboxu nejede, stejně jako v předchozích sessions.
**Příště:** zbývá **8 Tier-1** bud (Růžohorky č.75, Rezek č.19, Lysečinská č.1336, Lyžařská č.2210, Moravská č.1873, Pomezní č.673, Portášky č.675, Richtrovy č.1602) — stejným vzorem; pak hero fotky z DATA-02 a primární ověření (DATA-04) na první `verified: true`. Kandidátní YAML povýšených ponechány (jako u dřívějších dávek).

## 2026-07-22 — hlavní session (Opus, inline): povýšena dávka Tier 1 z master fronty (4 boudy)
**Zadání Michala:** „myslel jsem to tak, abys s tím seznamem pracoval, pokračuj libovolně" → jet doplňování podle master fronty.
**Hotovo:** povýšeny **4 nejsilnější Tier-1 boudy** (známka + katalog + OSM) z kandidátů na publikované profily: **Martinova bouda** (č.674), **Výrovka** (č.12), **Petrova bouda** (č.671), **Chalupa Na Rozcestí** (č.13). Publikovaných chat 23→**27**. Data z **Kudy z nudy** (sekundární médium, reachable ze sandboxu — na rozdíl od vlastních webů bud, které padají na robots ConnectTimeout) + OSM GPS + katalog výška + známka číslo. Vše `verified:false` se zdroji, honest empty states. Ke každé přidána známka do `krkonose.json` (pocetChat 16→20) a **nasazen obrázek známky** ze staging → `public/znamky/` + `obrazky.json` (12 obrázků celkem). Master přegenerován (`DATA-03-master-krkonose.md`): Tier 1 17→13.
**Poctivost (klíč):** primární weby bud ze sandboxu nedosažitelné (WebFetch robots ConnectTimeout; provenance se dá obejít přes WebSearch, ale síť je zeď) → data ze sekundárního Kudy z nudy, v každém bloku `source` přiznáno „sekundární médium, ověřit primárně (DATA-04)". **Petrova bouda:** poctivě uvedeno, že jde o novou budovu (2020) po požáru 2011, restaurace jen pro hosty + veřejná útulna 8–18; bez GPS (katalog ji nenesl — nedomýšleno). **Výrovka:** rozpor výšky Kudy z nudy 1368 vs. katalog 1356 ponechán viditelný. **Chalupa Na Rozcestí:** splňuje klíč (veřejný bufet doložen). Kolize jmen ošetřeny (Martinova bouda ≠ ta na Benecku; Chalupa ≠ „Cestník").
**Ověřeno:** YAML parse 4/4, enumy zkontrolovány proti schématu (oprava `kategorie: poloha`→`jine`/`gastro` — poloha není platná hodnota; typObcerstveni `bufet` OK), JSON katalog+manifest platné, párování známka+obrázek+soubor OK. **Seed/render naživo NEOVĚŘENO** — Postgres v této session neběží (docker nedostupný), stejně jako u jiných sandbox sessions; schéma ověřeno konstrukcí dle funkčního profilu dvorska-bouda + kontrolou enumů.
**Příště:** dotáhnout zbylých 13 Tier-1 (Brádlerovy, Kolínská, Jelenka, Lysečinská, Rýchorská, Moravská, Friesovy, Lyžařská, Portášky, Růžohorky, Rezek, Richtrovy) — stejným vzorem z Kudy z nudy; hero fotky z DATA-02; primární ověření (DATA-04). Kandidátní YAML povýšených ponechány (jako u dřívějších dávek).

## 2026-07-22 — hlavní session (Opus, inline): master seznam krkonošských chat (sjednocení 4 zdrojů)
**Zadání Michala:** ověřit, zda ChatGPT přehled chat (`katalog-cr-sk-2026`) obsahuje všechny boudy ze známkové sady (chtěl podle něj jet doplňování) → zjištěno, že NE (4 boudy chybí) → „udělej master seznam" (ano).
**Hotovo:** `docs/DATA-03-master-krkonose.md` — sloučení **našich publikovaných (23) + kandidátů (61) + ChatGPT katalogu (42 Krkonoš) + známkové sady (35 spárovaných čísel)** do jedné tabulky se stavem. Skript `/home/claude/master.py` (mimo repo — jednorázová pomůcka): načte YAML obou složek + katalog.json + krkonose.json, normalizované párování názvů s alias overridy (Klínovka, Bouda u Bílého Labe, Špindlerova, Bouda Jelenka, Hala Szrenicka — skloňování/varianty), diagnostika nespárovaných. **Fronta k doplnění dle síly signálu:** Tier 1 = známka i katalog (17, promovat první), Tier 2 = jen známka (3 — Rozhled/Medvědí/Vrbatova), Tier 3 = jen katalog (7), Tier 4 = jen OSM (34). **Klíčové zjištění pro Michala:** katalog nemá 4 známkové boudy (vč. Tetřevích, které už jsou na webu) + 6 našich publikovaných (Dvorská, Krakonoš, U Jirky, Lovecká, Vebrovy, Tetřeví) → nejet jen podle katalogu. **Nový tip z katalogu, co nemáme ani jako kandidáta:** Schronisko Nad Łomniczką (PL, 1002 m). Vyřazených 10 uvedeno, ať se nezakládají znovu.
**Poctivost:** master je čistě organizační pomůcka, nic „ověřeno"; discrepance výšek katalog vs. OSM ponechány viditelné (např. Richtrovy 1206 vs. 1136). Párování ověřeno diagnostikou (0 známek bez objektu, 1 katalogová mezera).
**Příště:** Michal jede doplňování dle Tieru 1→2; u každého povýšení dotáhnout primární zdroj (konvence B). Prověřit Nad Łomniczką.

## 2026-07-22 — hlavní session (Opus, inline): 26 obrázků známek Krkonoš od Michala (ruční sklizeň)
**Zadání Michala:** poslal zip `znamkykrkonosecast.zip` (27 souborů, 1 duplicitní Klínovka → **26 unikátních známek Krkonoš**), stažené ručně z `turisticke-znamky.cz`; „Krkonoš je známkových míst víc, než myslíš — nemám všechny, ale dalších 27". Cíl: identifikovat a umístit k chatám.
**Metoda:** názvy souborů byly hashe (Laravel `item_images`), tak jsem z každého kotouče **přečetl vyryté číslo + název** (kontaktní arch přes `montage`, sporné čtyři zvětšeny 2×2). Křížově porovnáno s katalogem DATA-10 i s fondem kandidátů (`data/kandidati/krkonose/`).
**Hotovo:** **4 známky nasazeny na publikované profily** (obrázek → `public/znamky/<slug>.png` + řádek v `obrazky.json` + známka v `krkonose.json`): **Dvoračky·Štumpovka č.22** (`chata-dvoracky` — měly jen vizitku, doplněna známka; sdílený kotouč), **Tetřeví Boudy č.1347** (`tetrevi-boudy`), **Bouda u Bílého Labe č.2012** (`bouda-bile-labe`), **Bouda Klínovka č.3092** (`nova-klinovka`, 1227 m sedí). Katalog `pocetChat` 13→16. Zbylých 22 = **18 už máme jako kandidáty** (obrázek uložen k povýšení) + **4 nové tipy mimo katalog**: **Vrbatova bouda č.393** (Zlaté návrší — silný tip, i nálepka existuje), **Modrokamenná bouda č.2640**, **Chata Rozhled č.14**, **Medvědín č.2027** (spíš vrchol/areál — prověřit). Všech 26 zdrojů uloženo pojmenovaně do `data/externi/znamky-vizitky-2026/zdrojove-znamky-krkonose/` + `README.md` (checklist s původem, výškami a stavem).
**Poctivost:** obrázky se svolením Holuba (obě domény). **Číslo** ověřeno z fyzického kotouče; **odkaz na detail** u nových čísel sestaven dle vzoru webu `…/znamky/<slug>-c<č.>` (ze sandboxu neproklikneme) → v manifestu i katalogu poznámka „ověřit klikem", u Kolínské číslo **1719** (opravil Michal 22. 7.). Na web publikuji jen chaty, které reálně máme; kandidátní obrázky čekají mimo `public/`. Live render vyžaduje Postgres (docker v této session neběží) — data ověřena parsem + simulací párování; mechanismus identický s už vyrenderovanou Labskou.
**Doplněno (Michal „pokračuj podle libosti"):** 4 nové tipy prověřeny WebSearchem (jen titulky, obsah neotevřen). **Založeni 2 kandidáti** (bez domýšlené GPS, jako Štumpovka): **Vrbatova bouda** (`vrbatova-bouda`, č.393 — bouda/restaurace Zlaté návrší, doložena Wikipedií/Kudy z nudy/Restu) a **Chata Rozhled** (`chata-rozhled`, č.14 — horská chata Strážné, web chatarozhled.cz; veřejné občerstvení doložit před povýšením). **Nezaloženo:** **Medvědín** (č.2027 = vrchol/horní stanice lanovky Špindl, ne bouda) a **Modrokamenná bouda** (č.2640 = rodinný penzion Janské Lázně — dle klíče „penzion bez veřejného občerstvení → ne"). Kandidátů Krkonoš teď 83. Obrázky obou nových známek čekají ve staging složce ke povýšení.
**Příště:** doplnit další známky (Michal má víc), polské známky pořád čekají na `znaczki-turystyczne.pl` strukturu/ruční sklizeň. Notifikovat Holuba po spuštění webu. U Vrbatovy/Rozhledu dotáhnout GPS+provoz (DATA-03) před povýšením.

## 2026-07-22 — hlavní session (Opus, inline): DATA-13 stahovač obrázků známek (se svolením)
**Zadání Michala:** „napiš data-13 stahovač" — po **telefonickém souhlasu Mgr. Davida Holuba** (Turistické známky s.r.o.) s uveřejněním obrázků známek (+ jeho e-mail „v principu souhlasím").
**Hotovo:** `scripts/data13-znamky-obrazky.ts` — z detailů **turisticke-znamky.cz** vytáhne URL obrázku známky (og:image / twitter:image / image_src / fallback `<img>`), stáhne a uloží do `public/znamky/<slug>.<ext>` + manifest `data/znamky-vizitky/obrazky.json` s atribucí „se svolením". **Poctivostní filtr `jeStazitelna` (klíč):** bere JEN `system:'znamka'` a JEN `turisticke-znamky.cz` — **vizitky (Wander Book) i polský `znaczki-turystyczne.pl` (Samotnia) se přeskakují** (jiní vydavatelé, bez svolení). Dry-run potvrdil 4 kandidáty (Špindlerova č. 1889, Labská č. 74, Luční č. 11, Vosecká č. 24); Samotnia i vizitky vyloučeny. Síť: sandbox na turisticke-znamky.cz nedosáhne (proxy) → běží v GitHub Action `.github/workflows/data13-znamky-obrazky.yml` (idempotentní, commit obrázků + manifestu). **Napojení:** lib `znamkaObrazek(slug)` z manifestu → `page.tsx` → `ProfilZapisnik` vykreslí reálný obrázek v dřevěném disku (bevel/spec/atribuce drží), když existuje; jinak placeholder faux-3D (slot beze změny layoutu — jak design zamýšlel). Souhlas zapsán do `PUVOD.md`. +14 testů (extrakce URL, přípona z MIME, absolutizace, filtr svolení), **211/211 int**, typecheck + lint čisté.
**Poctivost:** stahujeme jen to, k čemu je svolení — filtr je i v testech. Verbální souhlas + e-mail doložen v provenienci; Wander Book (vizitky) bez odpovědi → placeholder. Podmínka Holuba: dát vědět, až web pojede.
**Oprava (Michal 22. 7.):** `znaczki-turystyczne.pl` je **polská verze TÉŽE firmy** (Turistické známky s.r.o.), takže Holubův souhlas kryje i ji → do povolených domén přidána polská; filtr i test upraveny, provenience doplněna. Dry-run nově **10 kandidátů** (4 CZ + 6 PL vč. Samotnie/Szrenice/Strzechy/Odrodzenie/Kamieńczyku/Okraje). Vizitky (Wander Book) dál mimo (jiný vydavatel).
**Oprava extrakce (Michal poslal reálnou URL):** 1. běh Action stáhl **0 obrázků** — „naslepo" psaná extrakce (og:image apod.) na turisticke-znamky.cz nesedla. Skutečná cesta obrázku je `…/storage/item_images/<velikost>/<hash>.png` (Laravel; hash ≠ číslo → nutno vytáhnout z HTML). Extrakce přepsána: primárně hledá cestu `item_images` (preferuje větší velikost), + browser-like User-Agent proti WAF blokům, + kontrola HTTP stavu detailu. **16 testů DATA-13.**
**Příště:** Michal znovu spustí Action → obrázky se stáhnou/commitnou (10 chat, CZ+PL), na profilu naskočí reálné známky. Notifikovat pana Holuba po spuštění webu.

## 2026-07-22 — hlavní session (Opus, inline): implementace profilu v2 „Sběratelský zápisník"
**Zadání Michala:** design session vrátila návrh profilu Luční boudy (handoff HTML + screenshoty) → „pusť se do implementace, cely profil".
**Hotovo:** profil chaty přepsán z v2.2 jednosloupce na **dvoustranu „list z deníku"** dle handoffu, ale **napojenou na REÁLNÁ data Payloadu** (ne prototypové placeholdery). `src/components/ProfilZapisnik.tsx` (klientská komponenta — dvoustrana 42/58, hřbet, papírový substrát, běžící hlavička + KČT pruh; hover parallax, skládaná mapa s unfold, tehdy/dnes slider; noc = globální body.dark, serif Newsreader default). `page.tsx` sestavuje serializovatelná data z reálných polí a rendruje ji (JSON-LD/metadata/notFound zachovány; RichText nahrazen vlastním lexToParas, ať klient nemusí tahat Payload RichText). `profil-zapisnik.css` (~330 řádků, hodnoty portované z handoffu). **3 faux-3D artefakty:** razítko (reálné/stylizované SVG + „do deníku" přes lib/denik), dřevěná známka a vizitka (placeholdery se slotem — artwork po svolení), vizitka s páskem „VYŘAZENO 2025". **Fonty self-hostnuty** (Newsreader serif + Caveat rukopis, @fontsource woff2 latin+latin-ext do public/fonts, @font-face + tokeny --font-emph/--font-hand). **Stavy ověření jako motiv** (†/◷ z per-sekčních overeni bloků + legenda 5 stavů). **Poctivé prázdné stavy:** „historické názvy nedoloženo", „kapacita — neuvádíme: web ji neudává", „nezjištěno" u služeb, ghost slot pohlednic.
**Poctivost (klíč):** při review handoffu jsem zvedl, že prototyp měl vymyšlené/přestřelené ukázkové texty (tunel jako fakt, 1938 jako přestavba, „vlastní průzkum redakce"). Implementace váže **naše sourcovaná pole** → render ověřen: historie ukazuje reálný **1938 = požár**, milníky 1707/1772 z DATA-12, zajímavost tunelu poctivě „projekt počítal… realizován jen zčásti · Seznam Zprávy". Žádný prototypový řetězec se do produkce nepřenesl.
**Ověřeno:** typecheck + lint (0 chyb) + `next build` OK (profil = dynamická route ƒ); **197/197 int**; e2e nedotčeny (testují jen URL profilu + 404, ne DOM). Render na produkčním serveru: desktop dvoustrana i mobil (kapitoly) sedí; dlaždice Mapy.com + hero foto v sandboxu blokované (proxy) → placeholder, v produkci naběhnou.
**Příště:** mobilní jemnosti, ostatní stránky „wow na každé stránce" (katalog/sbírka/zaniklé/výlety), print stylesheet (B13), výkonový spike faux-3D na mobilu (B12+B15), výměna placeholder artworku známky/vizitky po svolení vydavatelů.

## 2026-07-22 — hlavní session (Opus, inline): příprava na design session v2 (kit)
**Zadání Michala:** „ok - priprav to na design session" — po dokončení dat/struktury (DATA-12) připravit VSTUPY pro budoucí design session „Sběratelský zápisník" (ne dělat design teď — ten zůstává samostatná session s Michalem; koncept výslovně „ne pokyn ke stavbě teď").
**Hotovo:** nová složka `docs/design-session-kit/` — jedno místo, které session otevře a má vše po ruce (přesně to, co koncept §9 „co připravit PŘED session" žádá). Čtyři dokumenty: **README** (vstup, zamčená rozhodnutí, jak session začít, poctivá bilance chybějícího) · **01 datový snapshot 5 validačních profilů** po 16 sekcích s reálným obsahem a STAVY k navržení (prázdná sekce, verified:false všude, dynamické varování, rozpor zdrojů, hedge, chybějící výška) · **02 inventář aktiv/komponent** (co reálné vs. placeholder + v2.2 tokeny) · **03 moodboard spec + decision log** (14 rozhodnutí s doporučenými defaulty, seřazeno dle dopadu). Validační sada schválně rozbíjí každý předpoklad: **Luční** (max, 10 milníků, vyřazená vizitka), **Vosecká** (sezónní, rozpor 42/43, hedge fotovoltaika), **Samotnia** (přeshraniční PL, dynamické varování — změna nájemce), **Obří bouda** (zaniklá, jen historie), **Lovecká chata** (minimální — bez hera i bez výšky). Aktiva ověřena v repu: **razítko 46 otisků/16 chat se svolením** (razitkuj.cz, KiBob 21. 7.) → faux-3D do finále; **známky/vizitky jen číslo+odkaz** → placeholder do svolení; **hero 16/23**; **dobové pohlednice 0** (největší prázdné místo, zaniklá stránka je na nich závislá). Zdokumentovány znovupoužitelné komponenty (RazitkoMoment/Svg, MapaTrasy, VyskovyProfil, TrailBlaze, SectionBar, FotoAtribuce…) a v2.2 tokeny (tokens.css) jako baseline, ze kterého v2 vychází (neresetuje).
**Klíčový vzkaz pro session:** dnes je **100 % údajů `verified:false`** (ověřeno redakcí ani jednou) → design nesmí předpokládat zelené fajfky; nejdůležitější úkol estetiky = udělat ze stavu „převzato ze zdroje" něco elegantního, ne varovného. A: navrhovat sloty, které přijmou reálný artwork (známka/vizitka/pohlednice) bez přepisu layoutu.
**Poctivost:** oprava vlastního odhadu při psaní — hero fotky 16/23 (ne ~19), 7 chat bez fotky. Nic se needituje v datech ani kódu (jen dokumenty), testy/kód beze změny.
**Doplněno (Michal 22. 7.):** do zadání přidána **skládaná turistická mapa** jako podpisový prvek (linie skladů, unfold reveal, papírová vrstva nad živými dlaždicemi Mapy.com; koncept §12, rozhodnutí B15) a direktiva **wow na každé stránce** — zápisník jako designový jazyk CELÉHO webu, každá stránka svůj podpisový moment (koncept §13, kit doc 03 část C), s disciplínou „wow = řemeslo a konzistence, ne dekorace všude" (funkční data ostrá).
**Příště:** samostatná **design session v2** (start dle README kitu: spike faux-3D **i skládaná mapa** na mobilu → řídící principy → typo A/B → dvoustrana na 5 profilech → wow-pass po stránkách). Paralelně stále čeká DATA-04 (verified:true), svolení k obrázkům známek/vizitek, časy přechodů přes Actions.

## 2026-07-22 — hlavní session (Opus, inline): ověřitelná barva ze zdrojového průzkumu do 7 profilů (DATA-12)
**Zadání Michala:** „jasně" — po odblokování sekundárních médií (Kudy z nudy i Seznam jsou přijaté zdroje) vetkat ověřitelnou barvu ze zdrojového průzkumu (`data/externi/zdrojovy-pruzkum-2026/`, ChatGPT nad 4 weby — Seznam Zprávy, Kudy z nudy, Časopis Turista, Krkonose.eu) do 7 vlajkových profilů: Luční, Labská, Vosecká, Špindlerova, Dvorská, Dvoračky, Samotnia.
**Hotovo:** ruční editorial pass (ne skript — jde o redakční obsah v hlasu profilů) nad 66 fakty u těchto 7 chat, **jen stabilní** ověřitelná fakta. Fill-empty strukturovaných polí + přírůstek do milníků/zajímavostí/aliasů, každý údaj se zdrojem (publikace + název článku), **vše `verified:false`**. **Největší přínos = Dvoračky** (profil neměl žádnou historii → rokVzniku 1688 + 3 milníky: první zmínka 1688 / Ella Půhonná po válce / rodina Starých od 90. let + borůvkové knedlíky). Dále: **Špindlerova** kapacita 153 (fill-empty, web hotelu neuvádí) + 4 milníky (Franz Spindler 1824, požáry 1826 a 2005, Johann Hollmann 1855); **Dvorská** rokVzniku 1707 (odpověď na dosud otevřené „přesný rok dohledat") + milníky (chov dobytka, rod Adolfů do 1945); **Luční** milníky 1707 (Christoph Erben) a 1772 (Rennerovi + výroba sýrů) + zajímavosti (válečný tunel pro řeku, plachtařská škola E. Bönsche); **Labská** milníky 1904 (první přírodní rezervace), 1913 (úmrtí lyžaře B. Hanče), 2012 (Salvario Holdings) + devítipodlažní železobetonová stavba; **Vosecká** historické názvy Česká nová / Františkánská + milník 1900 + fotovoltaika (12,74 kWp / 70,4 kWh — projektový předpoklad); **Samotnia** milník 1934 + Krkonose.eu jako první nezávislý sekundární pramen (cross-confirm 1670 + kontaktů). Seed **23/23 upsert bez ValidationError**, milníky se v DB řadí chronologicky (ověřeno dotazem: Luční 1707/1772 mezi 1625 a 1809, Labská 1904/1913 mezi 1830 a 1965). **197/197 int** (bez nových testů — jde o editorial nad daty; validace přes seed + parse). Proveniencní záznam `data/externi/zdrojovy-pruzkum-2026/vetknuti-do-profilu-2026-07-22.md` (co vetknuto = fact_id + zdroj, co **vědomě přeskočeno** a proč).
**Poctivost:** sekundární média NEsnižují laťku „ověřených dat" — vše `verified:false` s odkazem na konkrétní článek, poznámka „sekundární médium, před publikací ověřit primárním pramenem". **Vědomě přeskočeno:** dynamické údaje (`dynamické – ověřit před publikací` — provoz, jízdní řády, otvíračky), duplicitní (výšky/GPS/telefony potvrzující stávající), nejednoznačné (Luční kapacita „až 150 hostů" — historická vs. dnešní → NEnastavena), fakta jiného objektu (požár Štumpovky → patří Štumpovce). **Rozpor zapsán, nezměněn:** Vosecká kapacita 43 (Seznam) vs. 42 (Krkonose.eu) — ponecháno 43 + poznámka pro DATA-04. U už bohatých profilů (Luční, Labská, Vosecká) je stopa menší — hlubší hodnota je redakční (historie prózou), na budoucí ruční běh.
**Příště:** struktura a údaje profilů jsou tím pro 7 vlajkových chat „pohromadě" → dozrává **design session v2** (sběratelský zápisník). Primární ověření faktů (`verified:true`) = DATA-04. Časy přechodů + výšky přes Actions dál čekají.

## 2026-07-22 — hlavní session (Opus, inline): Atlas zaniklých chat (DATA-11, P4)
**Zadání Michala:** poslal balík zaniklých chat od ChatGPT (dle zadání sepsaného minule hlavní session) — zapojit.
**Hotovo:** nový katalog (ChatGPT nad historickými prameny — regionální literatura, KČT/PTTK, zanikleobce.cz, KRNAP/KPN, Wikipedie) — **17 zaniklých bud/chat/schronisek** (11 Česko, 6 Polsko), jistota A 11 / B 5 / C 1, per-pole zdroje. `scripts/data11-zanikle.ts` → `data/zanikle/krkonose.json` (slug, historické názvy, GPS+přesnost, rok vzniku/zániku, příčina, co je dnes, přístupnost, příběh, jistota, zdroje). **GPS sanity: všech 10 se souřadnicemi leží v bboxu Krkonoš, 7 objektů poctivě bez GPS.** Nová stránka **`/zanikle` — Atlas zaniklých chat** (design systém, night lišty pro historickou atmosféru): karta na objekt s roky, příčinou zániku, „co je dnes", přístupem, příběhem a zdroji; sekce Česko/Polsko; poctivě „data zatím neověřena redakcí". Samostatná kategorie — **NEmíchá se do živého katalogu, mapy ani routingu** (zaniklé objekty nejsou cíl výletu). Odkaz z /chaty; přidáno do sitemap + llms.txt. Render ověřen (Obří bouda/Riesenbaude 1847–1982; Česká bouda na Sněžce → dnes stojí Česká poštovna; Sokolská bouda 1928–2019). +6 testů, **197/197 int**, typecheck + lint čisté.
**Poctivost:** vše `verified: false` se zdrojem; „neuvedeno" → null (nedomýšlet); GPS jen doložené, s přesností (přesná/přibližná/odvozená). Historické snímky/pohlednice zaniklých objektů se řeší zvlášť (autorská práva, jako u fotek).
**Příště:** navigační umístění atlasu = na Michalovi (nav je v prototypu); později mapka zaniklých (10 s GPS) a případně detailní stránky. Časy přechodů + výšky přes Actions dál čekají na spuštění.

## 2026-07-22 — hlavní session (Opus, inline): přechody mezi chatami / sousední chaty (DATA-06, P3)
**Zadání Michala:** „pracuj dál dle svého uvážení" — vybrán pilíř P3 (graf sousedství): karta „Sousední chaty" byla u všech 23 chat prázdná a routovací graf z DATA-06 na to stačí.
**Hotovo:** `scripts/data06-prechody.ts` — nad grafem značených tras spočítá ke každé chatě 4 nejbližší JINÉ chaty po značených (Dijkstra na chatu, řazení dle skutečné délky, cap 18 km, dedup, ne sebe): délka, značení po úsecích, podíl neznačených, cílová URL. **Ostrý běh: 23/23 chat, 92 přechodů, 0 k ruční kontrole.** Namátkou sedí (Dom Śląski ← Luční 2,52 / Strzecha 2,84 / Samotnia 3,46; Špindlerovka ← Odrodzenie 0,3 km — sousedi na hřebeni). `data/trasy/krkonose/prechody.json` (64 kB — geometrie vypuštěna, karta ji nepotřebuje; vrátí se s časy/mapou). `src/lib/prechody.ts` + render: karta „Sousední chaty" ukazuje vypočítané přechody (název + km + odkaz), když chybí ruční `sousedniChaty`; prolinkuje chaty navzájem i cz↔pl — bonus pro interní prolinkování/SEO. +3 testy, **191/191 int**, typecheck + lint čisté.
**Poctivost:** vše `verified: false`, zdroj OSM (ODbL); karta poctivě říká „orientační vzdálenost, čas s převýšením doplníme".
**Příště:** časy přechodů přes Mapy.com Elevation (rozšířit workflow výšek i na prechody.json + doplnit geometrii); později plánovač vícedenních přechodů nad tímto grafem. Michalovi předáno zadání pro ChatGPT na atlas zaniklých chat Krkonoš (pilíř P4).

## 2026-07-22 — hlavní session (Opus, inline): SEO/AI základ — sitemap, robots, llms.txt
**Zadání Michala:** „můžeš pracovat dál" — vybráno z plánu (SEO/AI „od prvního dne": sitemap + llms.txt + citovatelnost vyhledávači a AI). Blokované značení Lučních tras (potvrzení barev na Michalovi) vědomě nebráno; parkoviště nápadů se nebere bez posunu.
**Hotovo:** tři chybějící discovery vrstvy (dle skillu ai-agent-readiness):
`src/app/sitemap.ts` — mapa webu z DB: statické stránky + všech 23 publikovaných chat (kanonická cesta /zeme/pohori/chata), bez `/design` (noindex) a 404; odolné vůči nedostupné DB. Ostrý výstup 27 URL. `public/robots.txt` — explicitní Allow pro AI crawlery (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot, CCBot…) + vyhledávače vč. **SeznamBot** (český trh); catch-all Allow / s Disallow /admin/, /api/, /design; Content-Signal + Sitemap + LLM-Resources. `src/app/llms.txt/route.ts` — **kurátorovaný** vstup pro AI (ne úplná mapa): definiční věta + USP ověřených dat, hlavní stránky, 8 vlajkových chat dle výšky (Luční 1410 … Odrodzenie 1230), sekce „jak jsou data ověřená" + „pro AI/vyhledávače" (JSON-LD, sitemap), datum aktualizace; text/plain, ISR. Layout: **metadataBase** (canonical/OG) + `<link rel=alternate type=text/markdown href=/llms.txt>` z hlavičky (discovery link, který dle skillu 100 % top webů vynechává). Render ověřen (robots/sitemap/llms 200, homepage nese absolutní link). +2 testy (sitemap má chaty a ne /design; llms má definiční větu + odkaz na sitemapu; warmup Payloadu proti flaku studeného startu), **188/188 int**, typecheck + lint čisté.
**Poctivost:** llms.txt i sitemapa jen odkazují na veřejný obsah; JSON-LD z doložených polí (F0-05) beze změny.
**Příště:** po nasazení ověřit v Google Rich Results Testu + validator.schema.org; případně `.well-known/ai-agent.json` (Aiia) a markdown content-negotiation (Accept: text/markdown) — teď předčasné. Dál dle Michala (parkoviště nápadů, DATA-04/05).

## 2026-07-22 — hlavní session (Opus, inline): turistické známky a vizitky u chat (DATA-10)
**Zadání Michala:** „rovnou zapoj, podle odpovědi pak přidáme náhledy nebo ne" — po oslovení obou vydavatelů (Turistické známky s.r.o., Wander Book) zapojit vrstvu číslo+odkaz; obrázky až po svolení.
**Hotovo:** nový balík (ChatGPT nad oficiálními seznamy vydavatelů) — 175 produktů u 132 chat, u našich **13 z 23 chat** známka a/nebo vizitka (vše jistota A). `scripts/data10-znamky-vizitky.ts` spáruje produkty s publikovanými chatami (shoda názvu) → `data/znamky-vizitky/krkonose.json` (11 známek + 10 vizitek). `src/lib/znamky-vizitky.ts` + blok **„Sběratelská místa"** na profilu (karta u razítka, kotva v subnav): číslo známky/vizitky + **odkaz na oficiální detail** + stav (poctivě i „vyřazena z projektu 2025"), vše `verified:false` se zdrojem. **URL vzor ověřen** (search: „No. 11 Luční bouda" = turisticke-znamky.cz/znamky/lucni-bouda-c11 sedí). Katalog v `data/externi/znamky-vizitky-2026/` (CSV + README + PUVOD). Render ověřen (Luční: známka č. 11 + vizitka CZ-411 s odkazy a stavem). +6 testů, **186/186 int**, typecheck + lint čisté.
**Poctivost:** bereme JEN vrstvu číslo+odkaz+fakt (číslo/odkaz není chráněný, zveřejnit smíme). **Náhledy obrázků NEpřebíráme** — grafika je autorské dílo vydavatele; doplní se jen po písemném svolení (Michal oslovil 22. 7. obě firmy, e-maily napsala hlavní session). Mechanismus „se-svolením" + zdrojUrl + atribuce je z razítek připraven.
**Příště:** podle odpovědí firem případně náhledy (kolekce Fotky, licence „se-svolením"); zbylých 10 chat „neuvedeno" doplní růst katalogu / ruční kontrola. V backlogu parkoviště nápadů (známky/vizitky + 7 návrhů z revize ChatGPT přehledu).

## 2026-07-22 — hlavní session (Opus, inline): výšky, převýšení a čas přístupových tras (DATA-06)
**Zadání Michala:** „můžeš se do toho pustit" — dopočet převýšení a času (DIN 33466) přes Mapy.com Elevation API.
**Hotovo:** nový `scripts/data06-vysky-pristupu.ts` — nad `pristupove-trasy.json` dopočítá ke KAŽDÉMU nástupu výšky přes Mapy.com Elevation API: převýšení (stoupání/klesání), decimovaný výškový profil [km, výška] a **odhad času chůze DIN 33466** (4 km/h, 300 m/h nahoru, 500 m/h dolů; větší složka + půlka menší). Reuse `vyskovy-profil.ts` (stahniVysky, decimace Douglas–Peucker, prevyseni). Orientace geometrie z routingu je chata→nástup → **otočena na nástup→chata** (stoupání k chatě); km osa profilu škálovaná na routovanou délku (autoritativní). Nový workflow `.github/workflows/data06-vysky-pristupu.yml` (workflow_dispatch, secret MAPY_API_KEY, klíč hlavičkou) — sandbox na api.mapy.com nedosáhne, Actions ano; commituje JSON s výškami. Profil rozšířen: sekce „Odkud vyjít" ukazuje u nástupu **~čas + převýšení** a **výškový profil** (VyskovyProfil) u hlavního nástupu; úvod upraven. **Oprava MapaTrasy:** značka startu byla na body[0] = chata (geometrie je chata→nástup) → přesunuta na výchozí bod (poslední bod). Render ověřen s podvrženými výškami (Dvoračky: Rokytnice 9,32 km ~3:05 +452 m + křivka od Rokytnice k chatě, značka startu správně dole). +7 testů (DIN 33466, zpracování s mock fetch), **180/180 int**, typecheck + lint čisté.
**Poctivost:** výšky = výškový model Mapy.com (nemusí odpovídat realitě), čas = ODHAD z délky a převýšení (ne z rozcestníku KČT) — obojí `verified:false`, na profilu poctivě označené jako odhad/model.
**Příště:** Michal spustí Actions „DATA-06: výšky přístupových tras" (potřebuje secret MAPY_API_KEY v repu) → JSON dostane reálné výšky a časy. Pak polské nástupní podbody (Karpacz Wang/Kopa) pro 3 chaty z fallbacku; ověřování faktů → `verified:true`.

## 2026-07-21 — hlavní session (Opus, inline): doplňková faktická data do profilů (DATA-09)
**Zadání Michala:** balík `doplnkova_fakticka_data_chat_krkonose_2026` (poslán v průběhu) — věcná data se zdrojem u KAŽDÉHO pole (weby chat, kct.cz).
**Hotovo:** nový `scripts/data09-fakticka-data.ts` — doplní do YAML chat prázdná věcná pole z katalogu (rok vzniku, kapacita lůžek, historické milníky, telefon/e-mail/web, zajímavost), **jen prázdné, nikdy nepřepíše** ruční/ověřená data; „neuvedeno" ignoruje. Vše `verified:false` se zdrojem pole (skupina bez `overeni…` bloku → založí se; s blokem → inline `# zdroj`). Editace **chirurgická textová** (ne round-trip knihovny — ta přeformátuje celý soubor) → ruční formát i komentáře YAML beze změny, jen přidané řádky. **Doplněno u 13/15 chat se shodou** (161 řádků; Luční a Labská už měly vše ručně → nedotčeny), 8 chat mimo katalog beze změny. Katalog v `data/externi/fakticka-data-krkonose-2026/` (CSV + PUVOD, původ ChatGPT poctivě). **Render ověřen** (Szrenica: dřív bez historie → teď „od 1922" + milníky 1921/1972/1992, kapacita 90 lůžek, telefon — vše ze szrenica.pl). +10 testů (parseMilniky, nactiFakta, doplnText vč. regrese na duplicitní klíč), **173/173 int**, typecheck + lint čisté.
**Oprava (moje regrese z routingu):** seed četl `data/oblasti/` rekurzivně → pokoušel se seedovat `oblasti/krkonose/vychozi-body.yaml` (kurátorovaná střediska) jako oblast → ValidationError. Fix: oblasti se čtou nerekurzivně (jen top-level `data/oblasti/*.yaml`); podsložky drží oblastní data, ne oblasti.
**Pozn.:** seed v sandboxu spadne na stažení fotky (upload.wikimedia.org 403 — proxy); věcná data se seednou, fotky doběhnou v Actions. U pár chat je letopočet v `rokVzniku` mírně jiný než první milník (vznik vs. zahájení stavby) — katalogová data, `verified:false`.
**Příště:** výšky/`casMin` (DIN 33466, Mapy.com Elevation API v Actions) pro přístupové trasy; ověřování faktů → `verified:true` při ručním běhu.

## 2026-07-21 — hlavní session (Opus, inline): zapojení katalogu doporučených nástupů do routingu
**Zadání Michala:** „zapoj ten balík výchozích bodů" (`katalog_chat_s_vychozimi_body_2026`).
**Hotovo:** nový `scripts/data06-katalog-vychozi.ts` — parser CSV katalogu (uvozovky/zalomení/BOM) + **geokódování nástupů přes OSM katalog výchozích bodů**. Shoda názvu místa po **celých slovech**, ne podřetězci — schválně: podřetězcová shoda dávala „…stanice **lanovky**" → obec **Lánov** 20 km vedle; teď „Szrenica, horní stanice lanovky" správně sedne na stanici Szrenica (0,3 km). `data06-pristupove-trasy.ts`: pro chatu se shodou v katalogu bere **doporučené nástupy v pořadí katalogu** (pořadí 1 = hlavní východisko — lidská znalost, nepřebíjí se routovací cenou), geokódované přes OSM, s reálnou trasou po značených; metadata (doprava, sezóna, poznámka, **zdroje**) jdou na profil. Chaty bez shody → fallback na kurátorovaná střediska. Sanity: nástup >12 km vzdušně od chaty = špatný geokód → zahodit; dedup na uzel. Profil („Odkud vyjít"): pod nástupem řádek doprava·sezóna + poznámka + „zdroj: dvoracky.cz, krkonose.eu" (odkazy). **Ostrý běh: 23/23 chat má trasu — 13 z katalogu (s pořadím/zdroji), 10 ze středisek**, 0 k ruční kontrole. Data v `data/externi/vychozi-body-cr-sk-2026/` (CSV + README + PUVOD, `verified:false`, původ ChatGPT poctivě uveden). Render ověřen screenshotem Dvoraček (Rokytnice 9,32 km + Lysá hora 0,62 km, s dopravou/sezónou/zdroji). **163/163 int** (nové: 15 parser + 4 routing z katalogu), typecheck + lint čisté.
**Známé omezení:** Karpacz nemá v OSM katalogu podbody (Wang/Kopa) → 3 polské chaty (Samotnia, Strzecha, Dom Śląski) jedou částečně z fallbacku (středisko Karpacz) — trasy správné, jen bez katalogových zdrojů. Doplnit polské nástupní podbody do OSM/středisek příště.
**Příště:** zapojit **doplňková faktická data** (`doplnkova_fakticka_data_chat…` — rok vzniku, kapacita, historie, otvíračka, kontakty, zajímavost; per-pole zdroje, 15/23 chat) do profilů; pak výšky/`casMin` (DIN 33466, Mapy.com Elevation API v Actions).

## 2026-07-21 — hlavní session (Opus, inline): Phase 2 — čáry tras na turistické mapě
**Hotovo:** `src/components/MapaTrasy.tsx` — Leaflet nad **turistickou mapou Mapy.com „outdoor"** (pod ní barevné KČT značky), vykreslí chatu (červený marker) + čáry vypočtených přístupových tras z geometrie (bílý podklad + barevná čára, odlišné barvy per trasa) + značky startů s tooltipem (výchozí bod + km). Zapojeno do sekce „Odkud vyjít" na profilu (nad seznamem). Lib `pristupove-trasy.ts` rozšířen o `geometrie`. Render ověřen (Dvoračky: 2 trasy — Lysá hora + Rokytnice — konvergují na chatu; 4 polyliny + 3 markery, žádná JS chyba). Dlaždice ze sandboxu blokované (proxy) → screenshot má prázdný podklad, turistická mapa naskočí v prohlížeči (jako F0-07). Typecheck + lint čisté.
**Balík výchozích bodů dorazil (ChatGPT, Michal 21. 7.):** `katalog_chat_s_vychozimi_body_2026` (xlsx + csv + README) — 307 chat, **667 výchozích bodů, 1–3 doporučené nástupy/chatu** s pořadím (1 = hlavní), typem, dopravou/návazností, sezónou, **jistotou (A 208 / B 99), ZDROJI a poznámkou** (bez GPS). Uloženo v `/home/user/inbox-vb` (pracovní). **Příště:** geokódovat body přes OSM (cross-check GPS), zapojit jako „doporučené nástupy" (pořadí 1 = primární výchozí bod), poznámky/zdroje na profil — nahradí/doplní dosavadní OSM-nearest heuristiku.

## 2026-07-21 — hlavní session (Opus, inline): render přístupových tras na profilu („Odkud vyjít")
**Hotovo:** nová sekce **„Odkud vyjít"** na profilu chaty — vypisuje přístupové trasy z DATA-06 3b (`data/trasy/krkonose/pristupove-trasy.json`): výchozí bod + typ, délka, značení sloučené po barvách jako **pásové značky KČT** (`TrailBlaze`, km na barvu) + příznak „část mimo značku". `src/lib/pristupove-trasy.ts` čte katalog server-side (cache). Kotva v subnav, sekce za „Trasy" (ruční GPX má zatím jen Luční, tahle doplní zbylých 22 chat). **Render ověřen screenshotem Dvoraček** (Lysá hora lanovka 2,71 km — žlutá 2,2 + modrá 0,6; Rokytnice obec 5,18 km — žlutá/modrá/červená/zelená). Typecheck + lint čisté.
**Příště:** Phase 2 — čáry tras na mapě profilu (Leaflet polyline z geometrie, barva dle značení); po Michalově balíku výchozích bodů přegenerovat routing (cross-check GPS s OSM); výšky/`casMin` (Actions).

## 2026-07-21 — hlavní session (Opus, inline): výchozí body — zastávky + zdroje tras
**Zadání Michala:** brát i autobusové zastávky; zjistit populární výchozí body/trasy z webů chatařů / jiných zdrojů (mapy.com, diskuze).
**Hotovo:** (1) **exportér výchozích bodů rozšířen o zastávky** — `highway=bus_stop` s názvem → typ `zastavka` (parser + dotaz + test). Po dalším běhu workflow „DATA-06: výchozí body oblasti" se objeví i pojmenované zastávky (Špindlerova bouda, Zlaté návrší…), pak je zařadím do kurátorovaných středisek. 10 testů, typecheck + lint čisté.
**Poznatek k „zdrojům tras" (rešerše):** weby chatařů dávají **směrové vodítko, ne přesné trasy** — Dvoračky uvádějí „na křižovatce cest Rokytnice – Harrachov – Mísečky – Špindlerův Mlýn – Rezek" a doporučují lanovku, což **přesně potvrzuje kurátorovaný routing** (Lysá hora lanovka + Rokytnice). Přesné trasy (geometrie, značení, km) máme z **OSM route=hiking (KČT značení)** — to je nejlepší minovatelný zdroj a už ho používáme. mapy.com i pl.wikipedia jsou ze sandboxu nedosažitelné; diskuze nejsou strukturovaně minovatelné. Návrh: weby chat použít k označení „primárního" doporučeného východiska u chaty (lehká rešerše per chata), routing zůstává jádro.
**Příště:** po Michalově běhu doplnit zastávky do středisek; render přístupových tras na profilu; výšky/`casMin` (Actions).

## 2026-07-21 — hlavní session (Opus, inline): DATA-06 increment 3b — přístupové trasy k chatám
**Hotovo:** `scripts/data06-pristupove-trasy.ts` (+ testy `tests/int/data06-pristupove.int.spec.ts`). Nad routovacím grafem (inc. 1) a katalogem výchozích bodů (inc. 2, Michal naplnil — 358 bodů) spočítá ke každé publikované chatě 2 nejbližší dosažitelné výchozí body a trasu po značených (geometrie, délka, `znaceni` po úsecích, podíl neznačených, příznak k ruční kontrole >15 %). Efektivně: **jeden Dijkstra na chatu** (single-source) — refactor grafu na `dijkstraOdUzlu` + `slozTrasu` + tenký `najdiTrasu` (chování zachováno, 9 testů grafu dál zelených). Chaty/body dál než 1500 m od sítě se nepřipojují (nedomýšlet cestu). Výstup `data/trasy/krkonose/pristupove-trasy.json` (474 kB, s geometrií). **Ostrý běh: všech 23 chat dostalo trasu (46 přístupů), 0 k ruční kontrole** (vše po značených), 11 s. Namátkou sedí: Dvoračky ← lanovka Dvoračky 0,12 km; U Jirky ← Dolní Dvůr 1,36 km; Dom Śląski ← Sněžka 1,2 km; Labská ← lanovka Lysá hora 3,82 km. 143/143 int, typecheck + lint čisté.
**Oprava (Michalův postřeh 21. 7.):** routing bral nejbližší z 358 OSM bodů → často degenerovaný bod přímo u chaty (lanovka na hřebeni = 0,1–0,4 km, nereálné). Michal správně: východiska zúžit na ~20 reálných středisek. Zaveden **kurátorovaný `data/oblasti/krkonose/vychozi-body.yaml`** (22 středisek dle jeho návrhů — Špindl, Medvědín, Harrachov, Rokytnice, Pec, Malá Úpa, Pomezní boudy, Janské Lázně, Vrchlabí, Horní Mísečky, Černá/Čertova/Lysá hora, Strážné, Velká Úpa, Svoboda, Dolní Dvůr, Karpacz, Szklarska Poręba, Przesieka…; GPS z OSM, u lanovek DOLNÍ stanice). Routing bere přednostně tento seznam. Trasy teď realistické: Dvoračky ← Lysá hora 2,71 km (dřív 0,42), Dom Śląski ← Karpacz 6 km, Luční ← Špindl 6,8 km, Samotnia ← Karpacz 7,7 km. „Na Przełęczy Okraj ← Pomezní boudy 0,32 km" je správně (chata na sedle). Nedohledáno (GPS nedomýšlet): Pláň, Zlaté návrší, Špindlerova bouda (bus), Jagniątków.
**Příště (dokončení DATA-06):** (1) **render přístupových tras na profilu** (mapa/seznam „odkud se dá vyjít") — dnes profil ukazuje jen ručně vložené trasy Luční; (2) výšky + `casMin` dle DIN 33466 přes Mapy.com Elevation API (Actions); (3) zpětně `znaceni` dvou tras Luční z grafu. Pozn.: část výchozích bodů jsou lyžařské vleky (legitimní motorizovaný přístup na hřeben) — ponecháno.

## 2026-07-21 — hlavní session (Opus, inline): zajímavosti vlajkových chat (ověřené z webů)
**Hotovo:** doplněny `zajimavosti` třem chatám — poctivě z jejich **vlastních webů** (ne z AI katalogu; ověřeno WebFetchem, `verified` implicitně false, zdroj = web chaty): **Vosecká bouda** (nikdy nevyhořela a není na elektrické síti — dieselagregát; turistům slouží od 1896, původně seník před 1743), **Labská bouda** (necelý km od pramene Labe, observatoř ČHMÚ; budova z 1975, místo od 1830), **Chata Dvoračky** (otevřeno 363 dní v roce, vlastní pekárna). Seed OK, ověřeno `getChataBySlug` (2/2/1 zajímavostí); render sekce „Zajímavosti" doložen dřív (Luční). **Katalog ČR/SK posloužil jen jako vodítko — fakta vzata z primárního zdroje** (viz doporučení u AI katalogu: citace katalogu neplatí doslova).
**Dávka 2 (+4 chaty, ověřeno z webů):** **Špindlerova bouda** (na hřebeni 1208 m, příjezd autem + wellness), **Klínovka** (restaurace v 1227 m, auto nevjede; kapacita 50 už v profilu byla), **Bílé Labe** (údolí Bílého Labe 1000 m, křižovatka 4 tras), **Tetřeví Boudy** (vlastní sjezdovka 300 m s vlekem). Zajímavosti má teď **8 z 23 chat**.
**Příště:** zajímavosti zbylým chatám (polská schroniska, Krakonoš, Dvorská, Lesní, U Jirky, Lovecká…) + `rokVzniku`/`kapacita`, kde web dokládá; pak „nej" žebříčky (výškový jde hned, ostatní až přibude rok/kapacita).

## 2026-07-21 — hlavní session (Opus, inline): razítka fáze 3c — otisky na webu 🎉
**Michal spustil 3b** (Actions, commit 77beba6): staženo **16 chat / 46 otisků** z razitkuj.cz (platné GIFy, 1,4 MB, i historické varianty — Luční 6, Dvoračky 5). **Hotovo — 3c:** `scripts/data05-razitkuj-zaloz.ts` z manifestu vygeneruje razítkový YAML na každý otisk (vedle obrázku, `skeny/<slug>/<id>.yaml`): `prevzato-se-svolenim`, `prevzeti` (zdroj/zdrojUrl/svolil), otisk (typ `otisk-razitka`, licence `se-svolenim`, autor „razitkuj.cz (sbírka přispěvatelů)"), `verified:false`; `stav` NEnastaven (razitkuj neuvádí, která varianta je aktuální — nedomýšlet). Seed (`SEED_BEZ_FOTEK=1`, lokální obrázky) nahrál všech 46 otisků do Fotek + razítka, idempotentně. **Ověřeno přes `getChataBySlug`:** Luční bouda **7 razítek** (Michalův historický + 6 razitkuj), Vosecká 4, Dvoračky 5 — publikovaná, s otiskem i atribucí zdroje. Web se poprvé zaplnil reálnými otisky. Test +1 (generátor). 140/140 int, typecheck + lint čisté.
**Příště:** vizuální kontrola profilu s otiskem (dev/screenshot); zvážit výběr „hlavní" varianty (dnes se zobrazí razitka[0]); dořešit 7 chat zatím bez razítka (U Jirky, Dvorská, Krakonoš, Lovecká, Klínovka, Hali Szrenickiej — jinak pojmenované, Vebrovy). Turistikarazitka.cz stejným mechanismem (má málo horských chat — Jan Novotný).

## 2026-07-21 — hlavní session (Opus, inline): razítka fáze 3b — pipeline stažení otisků
**Rozhodnutí Michala:** rozsah skenů = **16 spárovaných chat i s historickými variantami** (svolení ke stažení dáno v chatu). **Hotovo — stahovací pipeline:** `scripts/data05-razitkuj-otisky.ts` (Actions): spočítá shody (párování z checklistu + katalog chat), z detailu každé chaty vytáhne všechny otisky — parser `otiskyZDetailu` drží URL vzor `/razitka_thumb/{ID}_{slug}.{ext}` (dedup dle ID; Luční má 6), stáhne je (nejdřív plná verze bez `_thumb`, fallback náhled) do `data/razitka/skeny/{slug}/{ID}.{ext}` a zapíše manifest `_otisky.json` (chata, zdrojUrl, seznam otisků). Workflow `data05-razitkuj-otisky.yml`. Struktura razitkuj ověřena WebFetchem (Luční: 6× `razitka_thumb/*.gif`, ID 180–12133). Testy +2 (extrakce otisků, dedup, plná verze bez `_thumb`; ignorace loga). 11 testů DATA-05, typecheck + lint čisté.
**Čeká na Michala: klik** Actions → „DATA-05: stažení otisků razítek (razitkuj.cz)" → stáhne otisky 16 chat i s variantami, commitne je + manifest. **Příště (3c):** z manifestu založit razítka `prevzato-se-svolenim` (otisk → Fotky, `prevzeti.zdroj/zdrojUrl/svolil`; historické varianty stav `historicke`) — rozšířit seed nebo generátor YAML do `data/razitka/krkonose/`; pak render na profilu (atribuce z 3a) ověřit.

## 2026-07-21 — hlavní session (Opus, inline): razítka fáze 3a — atribuce „převzato se svolením"
**Hotovo (podmínka před přebíráním skenů, DATA-05):** model razítka (`Razitka.ts`) rozšířen o původ **`prevzato-se-svolenim`** (partnerský web) + skupina `prevzeti` (`zdroj`, `zdrojUrl`, `svolil`), viditelná jen u tohoto původu. `beforeChange` hook: převzaté razítko **nelze publikovat bez `zdrojUrl`** (APIError) — atribuce je podmínka svolení i poctivosti. Na profilu (sekce Razítko) se u převzatého otisku vždy zobrazí „Otisk převzat se svolením — <zdroj>" s odkazem (nofollow). Payload typy přegenerovány. Testy `razitka-moderace` +2 (bez zdroje blokováno; se zdrojem publikuje a nese atribuci). 137/137 int, typecheck + lint čisté. (Vizuální potvrzení atribuce přijde s prvním nasazeným razítkem ve 3b — teď doloženo typy + datovým testem.)
**Příště — fáze 3b (skeny naostro):** stažení otisků z razitkuj.cz (se svolením Roberta Šindlera). Potřeba: (1) rozsah (nejdřív 16 spárovaných krkonošských chat? i historické varianty — počty `pocetOtisku` je ukážou), (2) **Michalovo svolení ke stažení souborů** (bezpečnostní pravidlo — uvedu zdroj/velikost), (3) Actions/seed krok, který z detailu razítka stáhne otisk a založí razítko `prevzato-se-svolenim` se `zdrojUrl`. Sandbox na razitkuj.cz nedosáhne → přes Actions/seed. Turistikarazitka.cz stejným mechanismem (podmínka odkazu Jana Novotného splněna týmž polem `zdrojUrl`).

## 2026-07-21 — hlavní session (Opus, inline): DATA-08 — externí katalog ČR/SK do Krkonoš
**Kontext:** Michal dodal od kámoše katalog turistických chat ČR/SK/přeshraniční (307 záznamů — ČR 124, SK 92, PL 61, DE 25, AT 2, HU 3; jistota A/B/C, dva zdroje na řádek, bez GPS). Rozhodnutí Michala: zapojit do Krkonoš — „kandidáti + obohatit". **Poctivost:** jistota „A" katalogu ≠ naše `verified` (konvence B); vše `verified:false` se zdrojem (původní krkonose.eu / kct.cz), křížově ověřit před povýšením; katalog je nejspíš AI-kompilace (jednotné datum, /mnt/data cesty) → brát jako kandidátní podklad, ne jako pravdu. Soubor NEcommitnut (licence) — jen pracovní vstup v sandboxu.
**Hotovo:** `scripts/data08-katalog-krkonose.ts` + testy (5). Z 31 krkonošských záznamů katalogu: **7 shoda s publikovanou** (→ report obohacení), **9 shoda s kandidátem** (→ report: výška/web/kapacita/zdroje navíc), **14 opravdu nových → založeny kandidátní YAML** (`verified:false`, zdroje z katalogu, „BEZ GPS" flag): Erlebachova, Petrova, Chata Rezek, Rýchorská, Pomezní, Portášky, Pražská, Kolínská, Černá, Hrnčířské, Friesovy, Chata Pod Studničnou, Lysečinská, Raisova chata na Zvičině. **1 možný duplikát správně odchycen** slabou tokenovou shodou: „Bouda u Bílého Labe" ~ naše „Bouda Bílé Labe" — NEzaložen, k ruční kontrole. Report `docs/DATA-08-katalog-krkonose.md` s konkrétními hodnotami (mj. „zajímavosti": Luční pivovar, Vosecká zimní přístup…). 133/133 int, typecheck + lint čisté.
**Příště:** (1) doplnit obohacení do 7 publikovaných + 9 kandidátů vědomě (ověřit weby, poznámky → pole `zajimavosti`); (2) 14 novým kandidátům doplnit GPS z OSM (nebo ručně) a křížově ověřit → povýšení dle Michala; (3) SK + zbytek katalogu = zásoba pro fázi ČR→SK→Alpy.

## 2026-07-21 — hlavní session (Opus, inline): razitkuj.cz — souhlas + checklist pipeline
**Souhlas razitkuj.cz:** Robert Šindler (KiBob) svolil se zveřejněním razítek (21. 7., screenshot od Michala: „Se zveřejněním razítek nemám problém"), bez podmínky odkazu — přesto zdroj uvedeme. Web stagnuje (zemřel hlavní programátor, řešení na míru) → Michal mu nabídne pomoc s převodem na spravovatelnou platformu (návrh e-mailu poslán Michalovi ke schválení). Zaznamenáno v DATA-05 (druhý ze tří webů se souhlasem, po turistikarazitka.cz).
**Rozhodnutí Michala (21. 7.):** sbírat razítka ke všem chatám, projít kategorii „Horské chaty" (810 razítek / 36 stran), zpětně dohledat další chaty. **Rozsah = celá kategorie (810)**, **zatím jen checklist + zdroj** (skeny až po dobudování atribuce v UI).
**Hotovo — pipeline checklistu:** `scripts/data05-razitkuj-checklist.ts` (Actions scraper: parsuje odkazy na detail dle URL vzorů `/{ID}_{slug}` a `/misto-{slug}/1`, stránkování 1..36 se zastavením na prázdné/404, dedup dle URL, katalog `data/razitka/_razitkuj-checklist.json` — jen **název + URL, NEstahuje skeny**) + workflow `data05-razitkuj-checklist.yml`. `scripts/data05-razitkuj-parovani.ts` (offline: spáruje checklist s katalogem chat — normalizace názvu vč. ł/ß, silná shoda přes název i aliasy; vypíše naše chaty s razítkem / bez razítka / kandidáty na zpětné dohledání dle krkonošských klíčů). Testy `tests/int/data05-razitkuj.int.spec.ts` (7). Struktura webu ověřena WebFetchem (str. 1–2): 810 položek, vzory sedí, „Bouda Bílé Labe" = `/5469_bouda-bile-labe` (naše chata → párování potvrzeno). Typecheck + lint + testy zelené.
**Čeká na Michala: klik** Actions → „DATA-05: checklist razítek razitkuj.cz" → naplní checklist; pak spustím párování a ukážu shody + kandidáty nových chat. **Příště:** párování naostro; pak fáze skenů (model razítka `zpusobZiskani: prevzato-se-svolenim` + viditelná atribuce v UI + řízené stažení otisků se souhlasem).

## 2026-07-21 — hlavní session (Opus, inline): DATA-06 increment 3 — routovací jádro
**Hotovo:** `scripts/data06-graf.ts` — z commitnutého exportu značených tras staví neorientovaný routovací graf (uzel = bod geometrie; sdílené křižovatky OSM mají identické souřadnice → po kvantizaci na 6 des. míst splynou a spojí trasy), hrana nese barvu KČT a délku (haversine). `najdiNejblizsiUzel` (prostorový index mřížkou 0,01° → rychlé přichycení chaty/výchozího bodu), `najdiTrasu` (Dijkstra binární haldou, **preference značených** — neznačená hrana ×4 dráž, ale průchozí jako spojka), rozklad cesty na úseky po značení + podíl neznačené délky (>15 % = k ruční kontrole). Testy `tests/int/data06-graf.int.spec.ts` (9): sdílený uzel spojí trasy, snapping, nejkratší cesta, preference značené i když delší, rozklad úseků, nedosažitelný cíl → null, start=cíl. **Smoke nad reálným exportem (310 tras):** graf 148 660 uzlů / 149 150 hran za 750 ms; Luční↔Labská bouda přichyceny 37/35 m, trasa 14,17 km celá po značených (modrá/zelená, 0 % neznačené). **121/121 int** (14 souborů), typecheck + lint čisté.
**Pozn. k prostředí:** kontejner se během session obnovil ze staršího snapshotu (HEAD spadl na starý commit, necommitnuté soubory zmizely) — vyřešeno `git fetch` + `reset --hard origin/main`; pushnutá práce i obě Michalovy Actions data (výchozí body 73861cb, značené trasy df9094f) v pořádku. Ponaučení: rozdělanou práci hned commitovat.
**Příště — increment 3b (Actions):** nad grafem spočítat přístupové trasy z výchozích bodů (katalog inc. 2 už naplněný Michalovým během) ke každé chatě → YAML do profilů; výšky přes Mapy.com Elevation API, `casMin` DIN 33466; zpětně `znaceni` dvou tras Luční boudy. Poctivost: trasy s >15 % délky mimo značené k ruční kontrole.

## 2026-07-21 — hlavní session (Opus, inline): DATA-06 increment 2 (výchozí body oblasti)
**Hotovo — DATA-06 increment 2 (odkud se vychází):** `scripts/data06-vychozi-body.ts` sesbírá z OSM Overpass výchozí body startu túry v Krkonoších (CZ i PL, průnik area státu + bbox — stejně jako DATA-01): **obce** `place=town/village`, **lanovky** `aerialway=station`, **železnice** `railway=station/halt`. Parser `typBoduZTagu` (typ z jednoznačného tagu, jinak null — nedomýšlet), souřadnice (node přímo / way-relation `out center`), výška z `ele`; `zpracujBody` roztřídí na body (typ+název+GPS → katalog) vs. vynechané (k ruční kontrole) a **dedupuje fyzicky týž bod** (stanice jako node i way, sídlo dvakrát — klíč typ+název+GPS na ~100 m; dvě různá stejnojmenná sídla daleko od sebe klíč nesloučí). Výstup: surový `_vychozi-body-export-<zeme>.json` (doklad) + katalog `data/oblasti/krkonose/vychozi-body-kandidati.json` (osmId, název, typ, GPS, výška, zeme). Reuse pomocníků z DATA-01 (`BBOX_KRKONOSE`, `ZEME_DOTAZU`, `stahniOverpass`, `nactiExport`, `osmUrl`). Workflow `.github/workflows/data06-vychozi-body.yml` (`workflow_dispatch`, commit `data/oblasti`). Testy `tests/int/data06-vychozi-body.int.spec.ts` (9: typ pro obec/lanovku/železnici + null; roztřídění; výška; dedup i nesloučení; tvar dotazu). Offline `--z-jsonu` ověřen smoke nad mockem (7 objektů → 4 body: 2 obce, 1 lanovka, 1 železnice; 2 vynechány — obchod = neznámý typ, lanovka bez názvu; Sněžka node+way sloučena). **112/112 int** (nová 9 + stávající 103 — celková sada projede, 13 souborů), typecheck + lint čisté.
**Návrh k pozdějšímu zvážení:** katalog výchozích bodů drží zvlášť v `data/oblasti/krkonose/` (auto z Actions, přepisuje se), oddělený od ručně psaného `data/oblasti/krkonose.yaml` (metadata oblasti) — ať běh workflow neklobrne ruční data. Kurátorské zúžení „primárních" bodů je až volitelná vrstva; pipeline poběží i bez ní (cíl DATA-06: trasy bez ruční práce).
**Příště — DATA-06 increment 3 (jádro pipeline):** routing z výchozích bodů po značených trasách (katalog inc. 1) ke každé chatě → geometrie, `znaceni` po úsecích, délka, výšky přes Mapy.com Elevation API, `casMin` dle DIN 33466 (funkce už ve `vyskovy-profil.ts`); běží jako Actions, commit YAML tras do profilů; zpětně doplní `znaceni` dvou tras Luční boudy (dnes „—"). Graf lze stavět offline nad commitnutým `_overpass-trasy.json`, takže kód i testy jdou v sandboxu; ostrý běh (Elevation API + plný export) přes Actions. Poctivost: trasy s >15 % délky mimo značené cesty označit k ruční kontrole.
**Čeká na Michala: dva kliky Actions** — „DATA-06: výchozí body oblasti" (naplní katalog výchozích bodů) a už dřív „DATA-06: export značených tras" (poslední běh s černou, pokrytí ~100 %). Bez nich má inc. 3 prázdné vstupy.

## 2026-07-21 — hlavní session (Opus, inline): zajímavosti/rekordy + highlight na profilu
**Hotovo:** (a) **Pole `zajimavosti` na chatě** (nápad Michala — sbírat pozoruhodnosti/rekordy rovnou při zjišťování dat): `text`, volitelně `kategorie` (stari/vyska/velikost/gastro/jine) a `zdroj`; pravidlo v CLAUDE.md (superlativ = tvrzení se zdrojem, nedomýšlet; spočitatelná „nej" z rokVzniku/výšky/kapacity); backlog položka „Rekordy / žebříčky nej"; příklad naplněn u Luční boudy (3 fakty: největší+nejstarší bouda, nejvýše položené restaurační zařízení v ČR, pivovar Paroháč — vše claim provozovatele se zdrojem). (b) **Highlight na profilu** — nová sekce „Zajímavosti" (číslovaná, v subnav) nad trasami; render ověřen z HTML Luční boudy (sekce 01 + všechny 3 fakty se zdrojem). 103/103 int, typy, lint, tsc čisté. **Data pro plné žebříčky zatím nevyvážená** (výška 21/23, ale rok vzniku jen 5, kapacita 6) — plné „nej" žebříčky až po DATA-04 doplní víc; výškový žebříček by šel hned.
**Příště:** DATA-06 increment 2 (kurátorské výchozí body oblasti — GPS se zdrojem), pak increment 3 (routing tras k chatám). Případně stránka „Rekordy / nej" (nejdřív výškový žebříček + zajímavosti), až přibude rok vzniku/kapacita.

## 2026-07-21 — hlavní session (Opus, inline): DATA-06 increment 1 (značené trasy)
**Hotovo — DATA-06 increment 1 (routovatelný podklad):** `scripts/data06-trasy.ts` stáhne z OSM Overpass relace `route=hiking` v Krkonoších i s geometrií (`out geom`) a z tagů určí barvu značení KČT: parser `znaceniZTagu` bere `osmc:symbol` (první pole = barva cesty, „red:white:red_bar" → červená), fallback `kct_red/blue/green/yellow`, pak `colour` (název i vybrané hexy); nerozpoznané = null (nedomýšlet → do reportu, ne do katalogu). Výstup: surový `_overpass-trasy.json` (doklad) + katalog `data/trasy/krkonose/znacene-trasy.json` (osmId, název, ref, znaceni, délka haversine, počet úseků). Reuse pomocníků z DATA-01 (`stahniOverpass`, `nactiExport`, `BBOX_KRKONOSE`, `vzdalenostM`). Workflow `.github/workflows/data06-trasy.yml` (`workflow_dispatch`, commit exportu+katalogu). Testy `tests/int/data06-trasy.int.spec.ts` (8: parser všech barev + fallbacky + přednost osmc:symbol + null; délka; roztřídění; tvar dotazu). Offline `--z-jsonu` ověřen smoke nad mockem (červená z osmc:symbol, modrá z colour, 1 bez barvy do reportu). Typecheck + lint + celá sada zelené.
**Příště — DATA-06 increment 2–3:** (2) kurátorovaný seznam výchozích bodů oblasti `data/oblasti/krkonose.yaml` (obce, terminály, zastávky — jednorázově rukou / z OSM); (3) routing po značených trasách z výchozích bodů ke každé chatě → geometrie, `znaceni` po úsecích, délka, výšky přes Mapy.com Elevation API, `casMin` dle DIN 33466 (funkce už je ve `vyskovy-profil.ts`); běží jako Actions, commit YAML tras do profilů; zpětně doplní `znaceni` dvou tras Luční boudy (dnes „—"). Poctivost: trasy s >15 % délky mimo značené cesty označit k ruční kontrole.
**Ostrý běh (Michal spustil 21. 7., commit c048ad6):** 310 relací `route=hiking` v Krkonoších, **280 (90 %) dostalo barvu KČT** — červená 46, modrá 70, zelená 78, žlutá 86 (278× z `osmc:symbol`, 2× z `colour`). 30 „bez značení" jsou vesměs **černé** trasy (`black:white:black_bar`, hlavně polská `rwn`) + jeden bezbarvý tematický okruh — parser je správně nevynutil do špatné barvy. **Chyba nalezena a opravena (commit 190124c):** délky vyšly 0 km — dotaz `out geom tags;` vrací tagy bez geometrie; opraveno na `out geom;` (výpočet i parser byly správné). **Katalog s délkami se dorovná při dalším běhu workflow.**
**Vyřešeno (21. 7. odpoledne):** (1) **délky dorovnány** — Michalův re-run s `out geom;` (commit d502991): 280 tras, součet 4 711 km, nejdelší 443 km, jen 3 nulové (degenerované relace bez cest). Fix `out geom;` potvrzen na reálných datech. (2) **Černá přidána** (rozhodnutí Michala; commit 5f2606f): 5. značení `cerna` napříč — parser (`black`/`kct_black`/hex), model `ZNACENI_OPTIONS`, `ZNACENI_BARVA/NAZEV`, `TRAIL_COLORS`, token `--tr-black:#1a1a1a` (app i design/tokens.css). **Zbývá jeden poslední běh workflow** — main teď umí černou, takže ~30 dnes vyřazených černých tras se příště zahrne (pokrytí → skoro 100 %). Pak increment 1 hotový nadobro; dál increment 2 (výchozí body oblastí).

## 2026-07-21 — hlavní session (Opus, inline): konvence „ověřeno" B + DATA-03 (3 chaty)
**Rozhodnutí Michala — význam `verified: true` = konvence B:** `true` jen po **vlastní kontrole Michala** (telefon/návštěva/přímá znalost); data z webu/OSM/katalogů zůstávají `verified: false` se `source`. Zapsáno do CLAUDE.md. Zpětně srovnáno: 20 web-citovaných `verified: true` ze session 30 přepnuto → `false` ve 4 profilech (Špindlerovka, Lovecká, U Jirky, Tetřevky), zdroje zachovány (commit ec4702b). V DB už 0 chat s `verified` na datech.
**DATA-03 — povýšeny 3 chaty (katalog 20 → 23):** **Vebrovy boudy** (horský penzion 1 100 m nad Velkou Úpou, 75 lůžek; zdroj info-cechy.cz — oficiální web vebrovyboudy.com se ze sandboxu nenačte: robots ConnectTimeout; commit 3518f59); **Schronisko Kamieńczyk** (830 m u vodopádu, 19 lůžek, bufet, soukromé od 1995; zdroj schroniskaturystyczne.pl; 717b441); **Schronisko PTTK „Pod Łabskim Szczytem"** (1 168 m, PTTK od 1945, 38 lůžek, bufet 8–20, budova 1938; f8688da). Hero fotky z DATA-02 kandidátů (CC BY-SA), vše `verified: false`. Poznatek k WebFetch v hlavním chatu: projdou katalogy/portály přes provenienci z WebSearch; **oficiální malé weby (vebrovyboudy.com) a pl.wikipedia se nenačtou** (robots timeout / cache-only) — dotáhnout v DATA-04.
**Rozhodnutí Michala (21. 7.): zbývající 3 (U Kotle, Kochanówka, Srebrny Potok) NECHAT jako kandidáty — nepovyšovat** (případně později smazat). Povyšování DATA-03 je tím **uzavřeno na 23 chatách**; hraniční podhorské/hotelové objekty už dál nepřidáváme bez výslovného pokynu.
**Příště:** **DATA-04** — telefonické/terénní ověření prvních profilů (tady se začne objevovat `verified: true`) a dotažení kontaktů/GPS u web-povýšených (Vebrovy, obě polská schroniska). Souběžně: hero fotky k profilům bez snímku (z DATA-02 kandidátů), případně DATA-06 (trasy).
**Otázky pro Michala:** žádné otevřené — fronta DATA-03 uzavřena dle jeho rozhodnutí.

## 2026-07-21 — hlavní session (Opus, inline): zázemí komunitních razítek
**Kontext modelu:** Michal má přes prázdniny vyčerpaný limit na Fable, pokračuje na Opusu (do 26. 7.). Model spouštěných/naplánovaných sessions přepnout nejde (API vrací „model update disabled", konfigurace úlohy je napevno na `claude-fable-5`), takže **noční 6:30 úloha je dočasně pozastavená** a tuhle práci dělám přímo v chatu na Opusu (repo + Postgres + testy v tomto prostředí). Od 26. 7. se noční úloha zase zapne (Fable).
**Hotovo:** **Komunitní sběr razítek — datové a moderační zázemí** (rozhodnutí Michala 21. 7.: host i účet, zázemí teď, veřejný formulář až s nasazením). Kolekce Razitka: zapnuta moderace přes koncept/publikaci (`versions.drafts`); nová pole — `zpusobZiskani` (redakce | komunitni-podani, default redakce), skupina `podani` (relace `ucet` na users pro přihlášené + `hostJmeno`/`hostEmail` pro hosty, `licencniSouhlas`, `souhlasZneni`, `souhlasDatum`), kredit `dolozil`. `beforeChange` hook: **komunitní razítko nelze publikovat bez licenčního souhlasu** (APIError). Veřejné čtení (`lib/chaty.ts`): join Payloadu vrací i koncepty (ověřeno — prosakovaly), proto přidán filtr `jenPublikovanaRazitka` do `getChataBySlug` i `getChatyProRazitkovnik` → na webu jen publikovaná. Seed: redakční razítka se publikují (`_status: published`), jinak by po zapnutí drafts zmizel historický otisk Luční boudy. Ověřeno naostro nad DB: koncept skrytý → po publikaci viditelný; publikace bez souhlasu odmítnuta. Test `tests/int/razitka-moderace.int.spec.ts` (2 případy), README sekce „Komunitní razítka", BACKLOG položka aktualizována. Sada **95/95 int**, typecheck + lint čisté. Render komponent nezměněn (jen model + filtr čtení); render nechán ověřený datovým testem (dev server v sandboxu vrtošivý).
**Příště:** veřejný nahrávací formulář „nahrát razítko" — až s nasazením webu (Fáze 1): stránka + `create` access kolekce Razitka pro veřejná podání jako koncept + ochrana proti spamu; napojit kredit `dolozil` z podání. Do té doby moderace funguje přes admin (koncept → publikovat).
**Otázky pro Michala:** znění licenčního souhlasu u formuláře doladíme, až ho budeme stavět (návrh: „Potvrzuji, že otisk jsem sám naskenoval / vlastním a uděluji turistickechaty.cz souhlas s jeho zveřejněním s uvedením mého kreditu.").

## 2026-07-21 — denní session 33 (bezobslužný běh — trojice „přednostně")
*(Poznámka k číslování: původně zapsáno jako s32, ale souběžný ruční běh — dotažení ověření z webů — si číslo 32 vzal a pushnul dřív; při rebase vyřešeno zachováním obojího a přečíslováním na 33.)*
**Hotovo:** **DATA-03: čtvrtá dávka — trojice z rozhodnutí Michala (21. 7. ráno) povýšena do `data/chaty/krkonose/`: Bouda Bílé Labe, Chata Dvoračky, Horská chata Krakonoš + založen ruční kandidát Hotel Štumpovka.** Bezobslužný běh — WebFetch nefunguje (vzor s29/s31), dávka stavěná výhradně z doložených zápisů DATA-03 (weby čteny 20. 7. v ručním běhu s22, `checked` poctivě drží 2026-07-20; v hlavičce každého profilu přiznáno). **Bílé Labe:** homepage byla na údaje skoupá (bez kontaktů/kapacity — zápis s28), takže kontakty + otvíračka (denně 10:30–18:00) jen z OSM tagů s výslovnou výhradou „před cestou ověřit na webu"; kapacita nevyplněna, dotažení z podstránek čeká na ruční běh. **Dvoračky:** areál „hotel Štumpovka + bouda Dvoračky" poctivě vysvětlen v textu (1140 m, Rokytnice n. J., restaurace s vlastní pekárnou denně 9–24, otevřeno 363 dní); dle rozhodnutí Michala založen kandidát `data/kandidati/krkonose/hotel-stumpovka.yaml` (typ horsky-hotel) — **bez GPS** (objekt nebyl v OSM exportu a souřadnice hotelu nedomýšlím z bodu sousední boudy; doplní ruční běh z OSM/mapy), s odkazem na fotokandidáty ve složce Dvoraček; vzájemný odkaz v UI se doplní po povýšení, text Dvoraček hotel už zmiňuje. **Krakonoš (nejchoulostivější):** jediný obsahový zdroj treking.cz naposledy aktualizovaný 11/2019 a web z OSM mrtvý (DNS) → `stav` záměrně NEvyplněn, kontakty z OSM (telefon/e-mail na mrtvé doméně) do profilu NEpřevzaty (jen interní poznámka pro DATA-04), kapacita 54 lůžek uvedena s výslovnou výhradou stáří zdroje a perex i text nesou upozornění „aktuální stav před cestou ověřte / s chatou nepočítejte najisto"; existenci budovy dokládají fotky ŠJů z 27. 5. 2023 (o provozu neříkají nic — v profilu rozlišeno). Cestou chyceny dva vlastní přešlapy: do textů jsem málem zapsal nedoložený polohopis („pod Lysou horou" u Dvoraček, „oblíbená cesta Dolem Bílého Labe") — škrtnuto, lekce „nedomýšlet" platí i pro vatu v textech. Hero fotky z kandidátů DATA-02: Bílé Labe krysi@ CC BY 3.0 (geosearch 28 m; popis = jen název boudy, redakce potvrdí záběr), Dvoračky ŠJů CC BY-SA 3.0 (23 m, popis „Dvoračky Hostel"; na výšku — alternativa File:Štumpovka a Dvoračky.jpg na šířku v poznámce), Krakonoš ŠJů CC BY 4.0 (40 m, popis „bouda Krakonoš" — jistý záběr). Kontroly: YAML 3+1 validní, seed 20 chat + druhý běh idempotentní (0 nových), render všech tří profilů + katalogu HTTP 200 (screenshot Krakonoše s poctivým upozorněním poslán do chatu), **93/93 int**, lint i tsc čisté.
**Příště:** fronta DATA-03 — zbývá 6: (1) **Vebrovy boudy** (⚖️ zařadit, ale zatím jen WebSearch signál — doložit obsah webu, ideálně ruční běh; formulaci perexu vzít ze Špindlerovky); (2) **Kamieńczyk + Pod Łabskim Szczytem** (ruční běh — bez webu v OSM by profily byly jen „OSM + název"); (3) **Kochanówka + Srebrny Potok** (✅ s povinnou poznámkou o poloze v podhůří/na okraji); (4) **U Kotle** na konec (Michal potvrdí nad profilem). Bezobslužně jde mezitím: po Michalově kliku na DATA-02 (fulltext) vybrat hero pro Klínovku/Tetřevky/Jirku/Loveckou/Špindlerovku a zkusit Szrenicu+Okraj; nebo příprava DATA-06.
**Otázky pro Michala:** 1) **Krakonoš — mrkni na render** (screenshot v chatu / lokálně `/cesko/krkonose/horska-chata-krakonos`): sedí ti takhle poctivý profil s upozorněním, nebo bys ho radši nechal jako kandidáta, dokud DATA-04 neověří provoz? Snadno vrátím. 2) Štumpovka: kandidát založen bez GPS — najdeš při ruční kontrole objekt v OSM (případně ho tam doplníš?), nebo mám GPS vzít z mapy.cz při ručním běhu? 3) Trvá: klik na DATA-02 workflow (fulltext, s30), ❓ ruční kontrola CZ sporných, licence hero fotek ze s28/s31.
## 2026-07-21 — session 32 (ruční běh, Michal online — dotažení ověření z webů)
*(Poznámka k číslování: běželo souběžně s bezobslužnými sessions 30 (DATA-02 fulltext) a 31 (polská schroniska) — proto je tento ruční běh přečíslován na 32; při pushi vznikl konflikt v deníku/backlogu, vyřešen zachováním obojího.)*
**Hotovo:** **Data 4 profilů z dřívější dávky s29 dotažena přímo z oficiálních webů** — Michal online odemkl WebFetch (zadání: „zkus dotáhnout ověření na webu sám, kde to nepůjde, ověřím ručně sám"). Načteno: spindlerovabouda.cz, tetreviboudy.com (+ podstránky historie.htm, restaurace.htm, ubytovani.htm), chataujirky.cz, lovecka-chata.cz (poslední dvě prošly až na 2.–3. pokus po jednom — paralelní schválení se nestíhalo odkliknout). **Nová věc v projektu: `verified: true`** — u bloků doložených přímou citací z oficiálního webu (adresa, kontakty, otvíračka, historie, ubytování/wellness). Poprvé se tím na profilech rozsvítí badge „OVĚŘENO · redakce" (logika `posledniOvereni`: verified když aspoň jeden blok true). **Poctivě `verified: false` ponecháno** u: GPS (z OSM, v terénu neověřeno — ale adresa/výška z webu potvrzeny), kapacit (weby neuvádějí), dostupnosti hotelových restaurací pro veřejnost (Špindl/Tetřevky to výslovně neříkají — netvrdím veřejnou restauraci). Přírůstky dat: **Špindlerovka** — tradice od 1784, 5 kategorií pokojů (Economy…Premium), wellness (bazén/sauny/vířivka/masáže), PSČ 543 51, 2. telefon 725 855 397 (pole telefon je jen jedno → druhé číslo ve zdroji); **Tetřeví Boudy** — kompletní historie (tři dřevěné boudy 18. stol. od německých starousedlíků → 1945 odsun → 1976 zbořena prostřední → 1980 budovy A+B → 1989 další dvě → 2014 koupě Green Garden → renovace 2014–2017), otvíračka restaurace (obědy 11–16, večeře raut 390/250 Kč), wellness výčet, hlavní tel. 602 322 399 + rezervační restaurace 602 311 301; **Chata U Jirky** — tel. 773 087 796, e-mail, „Vaříme pro všechny – bez rozdílu" (přímý doklad veřejné kuchyně → klíč splněn i po dotažení); **Lovecká** — tel. 724 038 622, e-mail, otvíračka 11–21 denně potvrzena. Poctivost historie: u milníku „18. století" jsem NEfabrikoval rok — pole `rok` vynecháno, časová osa u něj renderuje „—" (`{m.rok ?? '—'}`); web přesný letopočet neuvádí. Cestou opraven YAML bug (dvojtečka+mezera „pokojů: Economy" a „citace: …" v nezalomeném `source` rozbila parser — jako v s28; převedeno na blokový `>-`). Kontroly: YAML 4/4 validní, seed chat aktualizoval, render 4/4 HTTP 200 + screenshoty Špindlerovky a Tetřevek (badge, časová osa 18. stol.→2014, otvíračky). Po sloučení se souběžnými sessions 30/31 (rebase): **93/93 int**, lint i tsc čisté na sloučeném stromu (17 chat vč. 7 polských z s31). Commit + push.
**Příště:** fronta DATA-03 — po souběžné session 31 (povýšila 7 polských schronisek) **zbývá ~8**: přednostně trojice **Bílé Labe, Dvoračky (+ založit kandidáta Hotel Štumpovka, vzájemný odkaz), Krakonoš** (rozhodnutí Michala 21. 7. ráno), pak **dotáhnout z webů 2 polské profily bez detailů** (Szrenica, Okraj — hero i obsah), Vebrovy (doložit web), Kamieńczyk + Pod Łabskim (ruční běh), U Kotle na konec. Metoda ověřená dnes: **s Michalem online projdou i menší CZ domény přes WebFetch** → dotáhnout obsah a u citovaných bloků dát `verified: true`. Ideálně pokračovat opět s Michalem online, ať fronta neroste jen z OSM/titulků.
**Otázky pro Michala:** 1) **Zavedl jsem `verified: true`** u faktů citovaných přímo z oficiálních webů (profily teď hlásí „OVĚŘENO · redakce") — sedí ti to jako význam „ověřeno"? Nebo si chceš `verified: true` nechat výhradně pro svou vlastní ruční kontrolu a já mám u web-dotažených dat zůstat na `verified: false`? Řekni a hned to sjednotím napříč. 2) **Ruční doplnění** (weby neuvádějí): kapacity všech 4 objektů, otvíračka Špindlerovky, výšky Jirky a Lovecké, kapacita + vlastní e-mail Tetřevek (web má jen kontakt na správce webu). 3) Trvá: ❓ ruční kontrola sporných (Smetánka, Náchodská, Studenov, Javorka + sedmnáctka) a licence hero fotek ze s28.

## 2026-07-21 — session 31 (ruční běh se zadáním — polská schroniska)
**Hotovo:** **DATA-03: třetí dávka — 7 polských schronisek povýšeno do `data/chaty/krkonose/`: Samotnia, Strzecha Akademicka, Dom Śląski, Hala Szrenicka, Szrenica, Odrodzenie, Okraj.** Zadání ručního běhu mířilo na PL devítku; ověřil jsem ho proti repu — povýšení PL schronisek i primární polské názvy jsou Michalova rozhodnutí zapsaná v kandidátech a backlogu (✅ en bloc, chat 20. 7.), takže se jelo. **Trojici Bílé Labe/Dvoračky/Krakonoš („vzít přednostně" dle zápisu hlavní session z 21. 7. ráno) jsem vědomě nechal na příští běh dle textu zadání** — pokud ji mezitím nebere hlavní session, vezme ji hned další session jako první. Metoda: WebFetch bezobslužně znovu nefunguje (PROVENANCE_REQUIRED i na pl.wikipedia — 1 kontrolní pokus), takže **fakta jen z OSM (ODbL) a z titulků WebSearch** (obsah stránek NEotevřen — v hlavičce každého profilu i v každém `source` výslovně přiznáno; checked 2026-07-21 u dnešních titulků, 2026-07-20 u OSM stavu). Poctivost: `nocleh: ano` jen s dokladem (pttk.pl/accommodations — Samotnia, Strzecha, Hala Szrenicka, Okraj; szrenica.pl/hostel titulek — Szrenica), u Dom Śląski a Odrodzenie nocleh NEvyplněn (v pttk.pl přehledu chybí — provozovatele u Dom Śląski netvrdíme vůbec); žádná lůžka/otvíračky/historie se nezapisovaly (nedoloženo), místo toho „ověřit na webu schroniska" + seznam k dotažení v interniPoznamkách; z perexu Szrenice jsem škrtl výšku vrcholu, kterou žádný otevřený zdroj nedokládal (málem domyšleno — lekce trvá). **Kamieńczyk a Pod Łabskim Szczytem NEpovýšeny** — bez webu/kontaktů (Kamieńczyk i bez výšky) by profil byl „jen OSM + název", přesně co zadání zakazuje; zůstávají kandidáty. Hero: Samotnia (Takasamarasa, CC BY-SA 4.0, 8 m, popis budovy), Strzecha (Takasamarasa, CC BY-SA 4.0, 6 m, geosearch+kategorie), Odrodzenie (Suisant7, CC BY-SA 4.0, v kategorii objektu), Dom Śląski (Zawadzki, CC BY-SA 3.0, 4 m — jen 1280×960, vyměnit až bude líp), Hala Szrenicka s výhradou (popis „Hala Szrenicka" = jméno louky; vzor Dvorská — redakce potvrdí záběr); **Szrenica a Okraj bez hero** (v kandidátech žádný popis budovy — samé krajiny/hraniční kameny; vzor Špindlerovka: bez očního potvrzení nepřebírám). Aliasy se zdrojem: PTTK tvary názvů, u Strzechy „Hamplova bouda" (z popisů fotek na Commons — doložit líp), u Dom Śląski „Śląski Dom"/„Schronisko Pod Śnieżką" (titulky). Kontroly: YAML 17/17 validní, seed 17 chat + druhý běh idempotentní (0 nových), render `/polsko/krkonose/*` HTTP 200 (breadcrumb POLSKO, badge, zdroje v patičce — screenshot Samotnie), katalog 17 markerů, **93/93 int**, lint i tsc čisté.
**Příště:** (1) **trojice přednostně: Bouda Bílé Labe, Chata Dvoračky (+ založit kandidátní profil Hotel Štumpovka, typ horský hotel, vzájemný odkaz — rozhodnutí Michala 21. 7.), Horská chata Krakonoš** — vše z už doložených zápisů s22 (u Krakonoše poctivě přiznat mrtvý web + priorita DATA-04); (2) pak Vebrovy (jen WebSearch signál — doložit), Kamieńczyk + Pod Łabskim (ruční běh), U Kotle na konec. (3) Po Michalově kliku na DATA-02 (fulltext ze s30) zkusit hero pro Szrenicu, Okraj a spol.
**Otázky pro Michala:** 1) **Mrkni na Samotnii** (screenshot v chatu / lokálně `/polsko/krkonose/schronisko-samotnia`) — sedí ti rozsah „titulkových" profilů, než je ruční běh dotáhne z obsahu webů? 2) U Samotnie visí změna nájemce (bryla.pl) — chceš ji řešit přednostně v DATA-04, nebo počká na dotažení celé PL devítky? 3) Hala Szrenicka: hero má popis jen „Hala Szrenicka" — potvrď prosím očima, že je to budova schroniska (jinak vyměním). 4) Trvá: klik na DATA-02 workflow (fulltext, s30) + ❓ ruční kontrola CZ sporných.

## 2026-07-21 — denní session 30 (bezobslužný běh — DATA-02 fulltext)
**Hotovo:** **DATA-02: skript rozšířen o fulltextové hledání názvu chaty na Commons** (třetí dotaz vedle geosearch + kategorie; `generator=search`, namespace File, přesná fráze v uvozovkách — bez nich by CirrusSearch rozložil „Lovecká chata" na slova a vrátil lovecké chaty z celé ČR). Motivace přímo z povyšování: **Klínovka, Tetřevky, U Jirky a Lovecká mají 0 fotokandidátů a Špindlerovka jen záběry parkoviště** — geosearch 300 m z principu mine pojmenované fotky bez geotagu, a těch je na Commons hodně. Pojistky proti šumu cizích objektů: (1) nález POUZE z fulltextu s geotagem dál než 1 km od chaty se vyřazuje rovnou s metráží v reportu („pravděpodobně jiný objekt téhož jména"); (2) negeotagovaný fulltext nález zůstává kandidátem s původem `fulltext`, hlavička YAML nese varování a report počítá „z toho jen fulltext — ověřit objekt: N", takže redakce ví, kde být ostražitá; (3) kombinace původů se skládá kanonicky („geosearch + fulltext"…) a geotag filtr se na ni neuplatňuje (geosearch si radius hlídá sám, kategorie je přesná). Cestou chycen vlastní přešlap: první verze psala do hlavičky všech YAML „+ fulltext", i když transformovaný starý export žádný fulltext dotaz neobsahoval — hlavička by tvrdila víc, než se hledalo; opraveno příznakem `sFulltextem` odvozeným z obsahu exportu (starý export teď projde `--z-jsonu` beze změny souborů, doloženo testem i smoke během). Smoke `--z-jsonu` nad commitnutým exportem: jediné diffy = **9 chat povýšených v s28/s29 přepnulo `profil chaty` na data/chaty** (a Klínovka nese ruční název místo OSM „Nová Klínovka") — legitimní posun stavu, commitnuto; 4 kandidáti oblastí jizerske-hory/rudawy-janowickie hlášeni jako „bez dotazu v exportu" (přibyli po posledním stažení — pokryje je příští klik). Kontroly: **93/93 int** (+6: tvar fulltext URL, průchod negeotagovaného nálezu, vyřazení dalekého geotagu, kanonické skládání původů, zpětná kompatibilita bez fulltextu, poctivá hlavička), lint i tsc čisté; e2e sada v sandboxu neběžela (potřebuje build + dev server, int pokrytí změny je úplné). Do lokálního `.env` použit klíč Mapy.com ze zadání (jen lokálně, repo má prázdný `.env.example`).
**Příště:** po Michalově kliku na DATA-02 workflow projít report (hlavně řádky „jen fulltext") a vybrat hero pro Klínovku, Tetřevky, U Jirky, Loveckou a lepší záběr Špindlerovky postupem ze s21; pak dál fronta DATA-03 (15 profilů — polská schroniska ideálně ruční běh, Bílé Labe podstránky, Vebrovy doložit).
**Otázky pro Michala:** 1) **Nový klik prosím:** Actions → „DATA-02: fotky chat z Wikimedia Commons" → Run workflow — doplní fulltext dotazy všem chatám (pokryje i Jizerky/Rudawy) a s trochou štěstí najde hero pro čtveřici bez fotky. 2) Trvá ze s29: render Špindlerovky/Tetřevek (formulace perexu), tenkost hotelových profilů, ❓ ruční kontrola a licence hero fotek ze s28.

## 2026-07-21 — denní session 29 (bezobslužný běh — druhá dávka povyšování)
**Hotovo:** **DATA-03: druhá dávka — 4 profily do `data/chaty/krkonose/`: Hotel Špindlerova bouda, Tetřeví Boudy, Chata U Jirky, Lovecká chata.** Bezobslužný běh: WebFetch znovu potvrzeně nefunguje (PROVENANCE_REQUIRED i na spindlerovabouda.cz — schválení nemá kdo dát), takže dávka stavěná výhradně z **už doložených zápisů DATA-03** (weby čteny 20. 7. v ručních bězích s22/s24/s27 — `checked` poctivě drží 2026-07-20, ne dnešek; v hlavičce každého profilu přiznáno, že tato session web znovu nečetla). Oba hotely nesou `typ: horsky-hotel` (rozhodnutí Michala) a perex charakter přiznává („horský hotel v roli historické hřebenové boudy/historických bud"); U Jirky a Lovecká zařazeny klíčem občerstvení — v textu poctivě „údolní chata s restaurací" / „penzion s veřejnou restaurací", žádné předstírání hřebenové boudy. Poctivost u restaurací hotelů: web dostupnost pro neubytované výslovně neuvádí → v profilu „před cestou doporučujeme ověřit" (na rozdíl od Jirky „i pro neubytované" a Lovecké „denně 11–21 pro veřejnost", kde to doloženo je). Lovecká: do profilu jen lovecka-chata.cz (doména z OSM je cizí e-shop), OSM tag útulna vyhodnocen jako chybný → obsluhovana, obojí v interniPoznamky (+ návrh ohlásit opravu do OSM). Hero fotky: Tetřevky/Jirka/Lovecká mají 0 kandidátů DATA-02; Špindlerovka 10 kandidátů, ale vesměs parkoviště/autobusy/rozcestníky (ŠJů) — jediný nadějný „File:Špindlerova bouda, z parkoviště.jpg" má v popisu jen parkoviště, bez očního potvrzení nepřebírám (poznámka v profilu). Chybějící údaje (kapacity, kontakty, historie Tetřevek ze zamčené podstránky, výšky Jirky/Lovecké) NEdomýšleny — sepsány v interniPoznamky k dotažení. Kontroly: YAML 4/4 validní, lokální Postgres nastartován (vzor s23), **seed 10 chat, druhý běh idempotentní (0 nových)**, render všech 4 profilů HTTP 200, screenshot Špindlerovky (badge HORSKÝ HOTEL · KRKONOŠE, 1208 m, statistiky, zdroje — light OK), **87/87 int**, lint i tsc čisté. Katalog má nyní **10 chat na mapě**.
**Příště:** fronta DATA-03 — **zbývá 15**: (1) polská schroniska 9× ✅ — bezobslužně jen z OSM + PTTK signálů by byla moc tenká, ideálně ruční běh (pttk.jgora.pl + weby objektů), případně WebSearch dávka na detaily; (2) Bílé Labe (podstránky webu — ruční běh); (3) Vebrovy boudy (zatím jen WebSearch signál — doložit obsah webu); (4) U Kotle na konec fronty (Michal potvrdí nad profilem). Bezobslužně jde mezitím: razítkovník/katalog drobky, nebo příprava DATA-06.
**Otázky pro Michala:** 1) **Špindlerovka/Tetřevky — mrkni na render** (lokálně seed + `/cesko/krkonose/hotel-spindlerova-bouda`): sedí ti formulace „horský hotel v roli historické hřebenové boudy" v perexu? Použiju ji pak i pro Vebrovy. 2) U hotelů chybí kapacita/otvíračka (weby je na homepage neuvádějí) — stačí ti to takhle tenké s odkazem „ověřit na webu", nebo je mám v ručním běhu dotáhnout z podstránek? 3) Trvá: ❓ ruční kontrola (Smetánka, Náchodská, Studenov, Javorka + sedmnáctka) a kontrola licence hero fotek ze s28 (Dvorská — záběr budovy?).

## 2026-07-20 — denní session 28 (povyšování — první dávka profilů)
**Hotovo:** **Povýšeno prvních 5 profilů z fronty DATA-03 do `data/chaty/krkonose/`** (běží na claude-opus-4-8): **Labská bouda, Vosecká bouda, Dvorská bouda, Bouda Klínovka, Lesní bouda.** Postup: každou boudu jsem znovu natáhl z jejího webu WebFetchem (čerstvé `checked: 2026-07-20`, vše `verified: false`), do profilu zapsal jen doložené údaje se `source` u každé skupiny (lokace/nocleh/občerstvení/služby/provoz/historie) přesně jako vzorová Luční bouda; GPS z OSM (ODbL), výšku/adresu/kontakty/otvíračku z webu. Hero fotky vybrány z kandidátů DATA-02 (licenční síto už proběhlo): Labská — Ciacho5 CC BY-SA 4.0 (16 m, „Mountain hotel Labská bouda"), Vosecká — Balaban CC BY-SA 3.0 (2 m), Dvorská — Michal Klajban CC BY-SA 4.0 (vysoký sken; u něj poznámka, ať redakce potvrdí, že záběr je budova — popis zmiňuje Cestu č-p přátelství), Lesní — Stanislav Dusík CC BY-SA 4.0 (14 m); **Klínovka bez hero** (DATA-02 = 0 licenčně čistých kandidátů — poznámka v profilu). Poctivost: **Vosecká má `kuchyne` NEvyplněno** — web gastronomii pro veřejnost nepopisuje, nedomýšlím (na rozdíl od ostatních, kde je restaurace pro veřejnost doložena přímo). Labská zapsána jako `obsluhovana` (web „Hotel Labská bouda" — stejný přístup jako Luční, poznámka v interni). Klínovka: web `klinovka.cz` → `klinovka.com`, OSM název „Nová Klínovka" ponechán jako alias, slug drží OSM původ. Kontroly: YAML validní; **seed proti lokální DB vytvořil všech 6 chat** (Payload přijal schéma — enum/pole sedí); render ověřen dev serverem + Playwrightem: katalog `/chaty` ukazuje **6 markerů** správně shluknutých v Krkonoších, profil Labské (light) vykresluje hero placeholder, statistiky, perex + 3 odstavce, časovou osu historie (1830/1965/1975), badge „zatím neověřeno" a zdroje; **87/87 int**, lint i tsc čisté. Cestou opraven YAML bug (dvojtečka+mezera „historie: 1830" v source rozbila parser → přepsáno na pomlčku). Screenshot Labské poslán Michalovi.
**Příště:** pokračovat ve frontě (**zbývá 19**): (1) **Bílé Labe** — data z homepage tenká (bez telefonu/e-mailu/kapacity, jen restaurace s terasou) → dotáhnout z podstránek webu, pak povýšit; (2) **polská schroniska** (9× ✅) — weby přes WebFetch/WebSearch, detaily z pttk.jgora.pl a vlastních webů; jazyk: originální názvy primárně (rozhodnutí s20); (3) **3 hotely** (Špindlerovka, Tetřevky, Vebrovy) s poctivým označením `horsky-hotel`; (4) Jirka, Lovecká (veřejná restaurace doložena), U Kotle (hraničně, potvrdit nad profilem). Po další dávce pustit seed a mrknout na web.
**Otázky pro Michala:** 1) **Mrkni na profil Labské** (screenshot v chatu, nebo lokálně `npx payload run scripts/seed-chaty.ts` + web) — sedí ti rozsah údajů a tón textu? Podle toho doladím zbylé. 2) Až budeš u počítače, pusť seed naostro (stáhne 4 hero fotky z Commons) a zkontroluj u nich licenci na stránce souboru — pak přepnu `verified: true`. 3) U Dvorské je hero Klajbanův vysoký sken, ale popis na Commons mluví o cestě, ne o budově — potvrď prosím, že je to budova (jinak přepnu na menší File:Dvorská bouda.jpg).

## 2026-07-20 — denní session 27 (Michal upřesnil klíč pro penziony)
**Hotovo:** **Nový klíč zapracován a hned aplikován:** „pokud mají občerstvení nebo restauraci pro veřejnost, pak je můžeme zařadit — u sporných objektů podle tohoto klíče" (Michal, chat 20. 7.). Prošel jsem weby sporných 🏠 objektů WebFetchem (v této session částečně průchozí): (1) **REVIDOVÁNO NA ZAŘADIT:** Chata u Jirky (restaurace s domácí kuchyní pro všechny — doklad už ze s24) a **Lovecká chata** (lovecka-chata.cz: restaurace pro veřejnost denně 11–21, „Přijeďte se k nám ubytovat, nebo skvěle najíst"; cestou odhalen matoucí OSM kontakt — doména loveckachatakrkonose.cz je nesouvisející e-shop se zahradními domky, do profilu patří jen lovecka-chata.cz); (2) **ZAŘADIT HRANIČNĚ:** U Kotle (hornimisecky.eu: bar „otevřen i pro veřejnost", jídlo jen polopenze pro ubytované — klíč formálně splněn, půjde na konec fronty a Michal potvrdí nad hotovým profilem); (3) **NEZAŘAZENY TRVALE (klíč prověřen, občerstvení žádné):** Roxana (web dál nedostupný), Konopinda (konopinda.com gastro neuvádí), Mamut (pronájem roubenky, sdílená kuchyň); (4) **SPORNÉ S KLÍČEM (weby ze sandboxu nedostupné):** Smetánka, Náchodská, Studenov, Javorka — ruční kontrola Michala teď má jasnou otázku: „má občerstvení pro veřejnost?"; (5) Aurora (❓): web otevřen, občerstvení neuvádí → zůstává k ruční kontrole. Zápisy „AKTUALIZACE ROZHODNUTÍ" v 11 kandidátech, přehled i backlog aktualizovány. Kontroly: YAML validní, 87/87 int, lint i tsc čisté. **Fronta povyšování: 24 profilů** (18 ✅ + 3 ⚖️ + Jirka + Lovecká + hraničně U Kotle).
**Příště:** povyšování — první dávka českých bud s nejbohatšími doklady (Labská, Bílé Labe, Vosecká, Dvorská, Klínovka, Lesní) vč. hero fotek z DATA-02; postup viz zápis s26.
**Otázky pro Michala:** žádné nové — u ruční kontroly (Smetánka, Náchodská, Studenov, Javorka + ❓ sedmnáctka) používej prosím klíč občerstvení; U Kotle potvrdíš nad hotovým profilem.

## 2026-07-20 — denní session 26 (Michal odpověděl na otázky DATA-03)
**Hotovo:** **Michalova rozhodnutí zapracována do repa** (provenience „chat 20. 7. 2026" u každého zápisu): (1) **✅ povýšit en bloc + ⚖️ hotely všechny zařadit + 🏠 penziony nezařazovat** — rozhodnutí zapsáno do `interniPoznamky` všech 34 dotčených kandidátů (u Javorky a Studenova s výhradou možné revize po ruční kontrole — mapy.com/treking signály); (2) **založeny kandidátní oblasti:** `data/kandidati/jizerske-hory/` (Chatka Górzystów, Stacja Orle, Pešákovna — Michal: „nebo rovnou založ Jizerky") a `data/kandidati/rudawy-janowickie/` (Szwajcarka); pole `oblast` v YAML upraveno, seed je nečte (kandidáti), DATA-02 fotky je pokryjí automaticky; (3) **duplicity sloučeny** (Michalovo kritérium „název i GPS" splněno u obou párů): dvojčata `chata-mamut-656462770` a `lyzarska-bouda-656504528` smazána, hlavní kandidáti nesou zápis o sloučení vč. obou OSM ID; (4) **nový vyřazovací mechanismus DATA-01:** `data/kandidati/_vyrazeno.yaml` (klíč = OSM URL, důvod, kdo rozhodl, kdy) + `nactiVyrazene()` ve skriptu — bez toho by další OSM export smazané/přesunuté objekty znovu založil v krkonose/ (objekty v OSM dál existují a bbox je chytá); report běhu vyřazené vypisuje s důvody. Málem jsem do seznamu zapsal OSM ID po paměti — kontrola proti hlavičkám YAML je opravila (way/278729479, 122672323, 98214072, 30778232), lekce trvá: nikdy nedomýšlet, ani ID. (5) Přehled `docs/DATA-03-prehled.md` dostal nahoru blok „⚡ Rozhodnutí Michala". Kontroly: **87/87 int** (+3: vyřazení v zapisKandidaty, nactiVyrazene z YAML i bez souboru, ostrý seznam kryje smazané/přesunuté; jeden test napoprvé spadl na tmp adresáři smazaném afterEach — opraveno mkdirSync), lint i tsc čisté, **smoke `--z-jsonu` nad reálným exportem: 6 vyřazených přeskočeno s důvody, 0 nových kandidátů, git status po běhu čistý**. Stav kandidátů: 70 krkonose + 3 jizerske-hory + 1 rudawy-janowickie (+ _vyrazeno.yaml).
**Příště:** **POVYŠOVÁNÍ — fronta 21 profilů** (18 ✅ + 3 ⚖️). Postup per profil: YAML do `data/chaty/krkonose/` jen s doloženými údaji (zdroje z DATA-03 zápisů: weby objektů, PTTK, KČT; verified false), `zeme` dle kandidáta, u hotelů poctivé označení charakteru; hero fotka výběrem z `data/kandidati/fotky/krkonose/<slug>.yaml` postupem ze session 21 (geotag, kategorie, rozlišení, licence ze surového exportu). Dávkovat po ~4–6 profilech na session, začít českými s nejbohatšími doklady (Labská, Bílé Labe, Vosecká, Dvorská, Klínovka, Lesní). Po povýšení pustit seed a zkontrolovat katalog/mapu/razítkovník.
**Otázky pro Michala:** žádné nové — ❓ sedmnáctka ruční kontroly trvá (až budeš u počítače); až povýšíme první dávku, mrkni na profily na webu (lokální seed) a řekni, jestli rozsah údajů sedí.

## 2026-07-20 — denní session 25 (Michal online: „pokračuj, podívám se na otázky")
**Hotovo:** **DATA-03 čtvrtá dávka — posledních 26 CZ kandidátů bez webu, POKRYTÍ KOMPLETNÍ 76/76** + **syntéza `docs/DATA-03-prehled.md`** (všech 76 v 8 kategoriích s návrhy; kontrolní součet sedí, křížová kontrola slugů proti YAML strojově). Metoda dávky: WebSearch + GPS kontroly souřadnic kandidátů proti nálezům. Hlavní objevy: (1) **Chata Pešákovna leží v osadě Jizerka** (GPS 50,825, 15,337; treking.cz/chaty/pesakovna.htm „horská chata v horské osadě Jizerka") — čtvrtý objekt mimo Krkonoše, do bboxu spadl západním přesahem; (2) **dvě OSM duplicity:** chata-mamut vs. chata-mamut-656462770 (GPS ~1 m, Dolní Malá Úpa) a lyzarska-bouda vs. lyzarska-bouda-656504528 (pár metrů, Lučiny) — návrh sloučit, tím padá otázka „dvou Lyžařských bud" ze s24; (3) **KČT signály:** kct.cz má stránky chat (kct.cz/chaty/bradlerovy-boudy/) a článek „12 nejlepších horských chat v Krkonoších" (otevřen WebFetchem) jmenuje Brádlerovky, Voseckou a Výrovku — Výrovka se tím z „rozbité SSL, k ruční kontrole" posouvá mezi kandidáty povýšení; (4) **potvrzené charaktery:** Brádlerovy boudy, Medvědí bouda (2 vlastní weby + wikipedia), Jindřichův dům, Jelení louky, Amor (chata s restaurací, weby dva), Sedmidolí, Moravská bouda („Boudy na hřebenech"), Bouda Na Pláni (pravděpodobně = OSM „Chata na Pláni" — GPS Přední Planiny sedí, jméno potvrdit); (5) **účelové chaty univerzit:** Patejdlova bouda (UK) a Na Muldě (UK FTVS, webkamera Horské služby) — povyšovat jen s poctivým popisem režimu; (6) **penzionové signály:** Náchodská bouda, U Kotle (= Penzion U Kotle, Horní Mísečky), Smetánka, Lovecká chata (pozor: OSM typ útulna je zjevně chybný), Konopinda a Mamut (pronájmy), Vebrovy boudy (hotel v boudách — do hraničních k Špindlerovce a Tetřevkám); (7) k ruční kontrole zbývají mj. Zákoutí (Vítkovice vs. Harrachov), Aurora a Lokomotiva (režim nejasný), Novomísečná+Staromísečná (společný areál). Kontroly: 26 appendů bezpečných, YAML 76/76 parsovatelné, **84/84 int**, lint i tsc čisté. Přehled poslán Michalovi i jako soubor do konverzace.
**Příště:** podle Michalových verdiktů nad přehledem začít **povyšování do `data/chaty/`** (po dávkách, s údaji se zdroji z už doložených webů + hero fotky z kandidátů DATA-02 postupem ze session 21); bez verdiktů dál dle pořadí backlogu (DATA-04 příprava: seznam 5 nejnavštěvovanějších z povýšených, nebo DATA-06 návrh). Duplicity OSM (Mamut, Lyžařská) po potvrzení sloučit — a zvážit hlášení duplicit do OSM (dobrý soused).
**Otázky pro Michala:** hlavní balík je v `docs/DATA-03-prehled.md` (poslán i do chatu) — stačí verdikty per kategorie: 1) ✅ 18 potvrzených povýšit en bloc? 2) ⚖️ hraniční hotely (Špindlerovka, Tetřevky, Vebrovy) — brát s poctivým označením „hotel v roli boudy", nebo nechat mimo? 3) 🏠 penziony/pronájmy — plošně nezařazovat (a nechat jako kandidáty), nebo případ od případu? 4) 🗺️ mimo-pohoří čtveřici (Szwajcarka, Górzystów, Orle, Pešákovna) přesunout do `data/kandidati/<oblast>/`? 5) 👥 duplicity sloučit (vyřadit -656… dvojčata)? 6) ❓ sedmnáctka k ruční kontrole — mrkneš na weby z domácí sítě, až budeš mít chvíli?

## 2026-07-20 — session 24 (ruční běh, zadání k DATA-03 dávce 2)
**Hotovo:** **DATA-03 třetí dávka — 20 českých kandidátů, celkem ověřeno 50/76.** Zadání ručního běhu bylo psané ke stavu před session 23 (polská schroniska „čekají" — dopoledne už ověřena WebSearchem, commit d7dbc90), vzal jsem z něj platné jádro: **zbytek českých bud s webem**. Klíčové zjištění o síti: **v ručním běhu WebFetch částečně funguje** (treking.cz, dvorska-bouda.cz, tetreviboudy.com, klinovka.com, chataujirky.cz, lesnibouda.cz prošly) — vzorec ze session 22 potvrzen, bezobslužně (s23) nepadá jen část domén, ale úplně všechny; malé domény padají i teď (PROVENANCE/timeouty). Nálezy z obsahu webů (vše v `interniPoznamky`, checked 2026-07-20): (1) **POTVRZENO a navrženo povýšit:** Dvorská bouda (1313 m, Strážné, 115 lůžek, restaurace 11–16 i pro turisty, celoročně, ubytovává od 20. let), Bouda Klínovka (pozor: klinovka.cz z OSM přesměrovává na **klinovka.com**; „odlehlá horská bouda… pouze pěšky", 1227 m, 50 lůžek, restaurace s vlastní produkcí i pro neubytované, vědomě bez Wi-Fi; OSM jméno „Nová Klínovka" vs. web „Bouda Klínovka" — vyjasnit při povýšení), Lesní bouda (nad Pecí, eko farma, krkonošská kuchyně 10:30–17 i pro veřejnost, rodinný provoz od 1996); (2) **hraniční případ:** Tetřeví Boudy — web se prezentuje „Horský hotel Tetřeví Boudy" (1030 m, Dolní Dvůr, wellness) → stejná otázka jako Špindlerovka; (3) **verdikt redakci:** Chata u Jirky — chata/penzion s restaurací na adrese v údolí Dolního Dvora, horský charakter web neuvádí; (4) **checklist treking.cz** (načten v tomto běhu) dal křížový signál existence pro Martinovku (web dál timeout), Jelenku (web PROVENANCE), Lyžařskou boudu (pozor: kandidáti jsou DVA stejného jména — 656504528 bez kontaktů; při povýšení rozlišit) a Richtrovy boudy (web self-signed SSL jako Výrovka) — a nově i pro tři kandidáty úplně bez webu: Husova bouda, Barborka (navíc 51 fotokandidátů DATA-02 — nepřímý signál významu), Helena; (5) **k ruční kontrole:** Betyna (kořen webu se načte prázdný — JS; treking ji řadí do sekce „chaty a penziony", ne mezi hřebenové boudy), Žalý (rozhledna — patří objekt do průvodce chat?), Eliška (web 503), Růžohorky, Slovanka, Chalupa na rozcestí, Bouda na Lučinách, Hubertka (weby nedostupné). Poctivost: podobnosti jmen z treking výtahu („Bouda na rozcestí Cestník" vs. Chalupa na rozcesti, „Bouda Hubertus" vs. Hubertka) vědomě NEztotožněny — výtah malého modelu končí „a další", absence v něm se nikde nebere jako důkaz. Kontroly: 20 YAML appendů bezpečných, adresář zpětně parsovatelný, **84/84 int** (lokální Postgres ze s23 stále běží), lint i tsc čisté. Povyšování dle zadání NEDĚLÁNO — Michalovy odpovědi na otázky ze s22/s23 zatím nepřišly.
**Příště:** zbývá **26 kandidátů bez zápisu** — vesměs CZ bez webu (Amor, Aurora, Bradlerovy boudy, oba Mamuti, Moravská, Medvědí, Náchodská, Patejdlova, Sedmidolí, Vebrovy, Zákoutí, U Kotle, Na Mulde…): na ně WebSearch dávka (jako PL v s23) + treking checklist; pak DATA-03 zbude jen syntéza pro Michala (tabulka povýšit/nezařadit/prověřit). Po Michalových odpovědích: povyšování profilů s fotkami z DATA-02.
**Otázky pro Michala:** 1) Trvají otázky ze s22 (CZ šestice, Roxana, Tereza/Sasanka/Zvonička, Štumpovka) a s23 (PL devítka, mimo-pohoří trojice, ruční běhy na CZ weby). 2) Nově: **Tetřeví Boudy** — horský hotel v roli historických bud: brát jako Špindlerovku (do průvodce s poctivým označením), nebo nezařadit? 3) **Chata u Jirky** (údolní chata s restaurací v Dolním Dvoře) — patří do průvodce horských chat? 4) Až budeš u počítače: **Betyna** (web přes JS), **Žalý**, **Eliška**, Růžohorky, Slovanka, Chalupa na rozcestí, Bouda na Lučinách, Hubertka — stačí rychlý pohled do webů z domácí sítě a verdikt bouda/penzion do zadání příštího ručního běhu.

## 2026-07-20 — denní session 23 (bezobslužný běh)
**Hotovo:** **DATA-03 druhá dávka — všech 18 polských kandidátů, celkem ověřeno 30/76.** Nejdřív nepříjemné zjištění: **WebFetch v bezobslužné session nefunguje vůbec** — PROVENANCE_REQUIRED padá i na doménách, které v ručním běhu (session 22) prošly (treking.cz, weby velkých bud); interaktivní schválení nemá kdo dát, takže „velké domény projdou" platilo jen s Michalem online. Náhradní metoda: **WebSearch** — funguje i bezobslužně, ale dává jen titulky a domény výsledků, žádný obsah stránek. Pro polská schroniska to naštěstí stačí na solidní křížový signál: většina jádra je vedena přímo v přehledu ubytování **pttk.pl** a u provozovatele **pttk.jgora.pl** (Sudeckie Hotele i Schroniska PTTK), k tomu korona-gor-polski.pl, mapa-turystyczna.pl, pl.wikipedia. Každý zápis v `interniPoznamky` poctivě přiznává metodu („signál z titulků, obsah NEotevřen") a checked 2026-07-20. Nálezy: (1) **POTVRZENO a navrženo povýšit — 9 schronisek jádra:** Samotnia (kotel Małego Stawu; **pozor: dle titulku bryla.pl po 60+ letech odchází rodina Siemaszków, nový nájemce → aktuální provoz prověřit, priorita DATA-04**; navíc možný novější web schroniskosamotnia.com vedle samotnia.com.pl z OSM), Strzecha Akademicka, Dom Śląski (na Równi pod Śnieżką; v pttk.pl přehledu chybí — provozovatele rozhodne web), Hala Szrenicka, Szrenica (web se prezentuje i jako „hostel" — charakter upřesnit), Odrodzenie (Przełęcz Karkonoska), Okraj (u přechodu k Pomezním boudám), Kamieńczyk (u vodopádu; bez webu v OSM), Pod Łabskim Szczytem (bez webu v OSM, zdroj = stránka PTTK); (2) **potvrzeno s poznámkou o poloze:** Kochanówka (PTTK, ale 510 m v podhůří u Wodospadu Szklarki) a Srebrny Potok (Dolina Srebrnika, Lasocki Grzbiet — východní okraj; PTTK status možná historický); (3) **mimo Krkonoše — návrh NEzařazovat (přesah bboxu):** Szwajcarka → Rudawy Janowickie/Góry Sokole, Chatka Górzystów (Hala Izerska) a Stacja Turystyczna Orle → polská strana Jizerských hor; navrhuju nemazat a nechat jako kandidáty budoucích oblastí (princip „přeshraniční pohoří vcelku" pak pokryje i Jizerky/Rudawy); (4) **studentské/turistické chatky:** AKT (Hutniczy Grzbiet), Smogorniak (nad Podgórzynem), Wielkanocna (pod Śnieżnymi Kotły, 1251 m) — charakter chatek doložen (wikipedia, přehledy chatek, odborný text K. Tęczy), ale provoz/režim nikde — povyšovat až po doložení; (5) **Chatka Puchatka K RUČNÍ KONTROLE:** jméno nesou ≥3 objekty (noclegi Karpacz, willa Michałowice, „Szklarska Poręba" dle karkonosze.pl) a GPS kandidáta u Karpacze nesedí k žádnému z nalezených webů — identita nedoložena, nepovyšovat. Kontroly: všech 18 YAML appendnuto bezpečně (interniPoznamky poslední klíč, kontrola duplicit), celý adresář zpětně parsovatelný; **84/84 int** — poprvé v sandboxu včetně api testu naostro (docker daemon tu neběží → nastartován lokální PostgreSQL 16 ručně: initdb + role user/heslo + DB turistickechaty dle docker-compose); lint i tsc čisté.
**Příště:** zbylých **46 českých kandidátů** potřebuje obsah webů — WebSearch u malých penzionových domén charakter nerozhodne. Nejlepší cesta: **ruční běh s Michalem online** (WebFetch se schvalováním) po dávkách; bezobslužné sessions mezitím mohou: (a) po Michalově souhlasu povyšovat schválené kandidáty do `data/chaty/` (údaje z už doložených zdrojů + fotky z kandidátů DATA-02), (b) případně začít návrh DATA-06 (graf značených tras). Otisky razítek: čekáme na odpovědi razitkuj.cz a estranky.
**Otázky pro Michala:** 1) **Povyšování:** trvá otázka ze s22 k první CZ šestici (Labská, Bílé Labe, Vosecká, Dvoračky, Krakonoš, Špindlerovka) — a nově: souhlasíš s povýšením 9 polských schronisek jádra (+ Kochanówka a Srebrny Potok s poznámkou o poloze)? Stačí palec, povýším po dávkách i s hero fotkami z DATA-02. 2) **Mimo pohoří:** Szwajcarka (Rudawy), Chatka Górzystów a Orle (Jizerky) — souhlasíš s vyřazením z Krkonoš? Návrh: soubory nemazat, jen je příští session přesune do `data/kandidati/<budouci-oblast>/` ať fronta Krkonoš zůstane čistá. 3) **Zbylých 46 CZ kandidátů:** uděláme na ně jeden až dva ruční běhy s tebou online (WebFetch schvalování)? Bez toho je bezobslužně nedokážu poctivě rozsoudit.

## 2026-07-20 — session 22 (ruční běh, poslední dnešní session)
**Hotovo:** **DATA-03 zahájena — první dávka křížového ověření 12/76 kandidátů.** Zadání ručního běhu bylo psané ke stavu před sessions 20–21 (DATA-01 „čeká na klik" — už hotová a odškrtnutá; DATA-02 „čeká na klik" — klik proběhl a dopoledne přibyla hero fotka Luční boudy), vzal jsem z něj platné jádro: DATA-03 dle pořadí backlogu, metodou WebFetch. **Zjištění o síti:** WebFetch ze sandboxu skutečně projde, ale jen na část domén — krnap.cz, treking.cz, cs.wikipedia (ta jen „cache-only", obsah nedá) a weby velkých bud (labskabouda.cz, boudabilelabe.cz, voseckabouda.cz, dvoracky.cz, spindlerovabouda.cz) fungují; malé/http domény (rokytnice.com, chata-tereza.com, martinovka.cz…) končí na PROVENANCE_REQUIRED — interaktivním schválení, které v bezobslužné session nemá kdo odkliknout — nebo na timeoutu robots.txt. Dávka tedy stavěná na dosažitelném: weby objektů + přehled ubytování treking.cz jako křížový checklist. **Nálezy (v `interniPoznamky` kandidátů, checked 2026-07-20, verified false):** (1) potvrzeno a navrženo POVÝŠIT: Labská bouda (1340 m, restaurace + bufet), Bouda Bílé Labe (1000 m, restaurace s terasou), Vosecká bouda (1260 m, 1. zóna, od 1896 turistům, bez elektřiny, sezóna 1. 6.–28. 10.), Chata Dvoračky (web popisuje areál „hotel Štumpovka + bouda Dvoračky" — vztah objektů vyjasnit při povýšení), Horská chata Krakonoš (existence z treking.cz — ale stránka aktualizovaná 2019 a web z OSM je mrtvá DNS → provoz ověřit, priorita DATA-04) a hraniční Hotel Špindlerova bouda (hotel v roli historické hřebenové boudy — obdoba Luční, verdikt na Michalovi); (2) návrh NEZAŘADIT: Penzion Roxana (web nedostupný, v treking přehledu ubytování chybí, jméno běžného penzionu — definitivně rozhodne redakce); (3) K RUČNÍ KONTROLE: Tereza, Sasanka, Zvonička (žádný dosažitelný zdroj je nezná), Výrovka (web z OSM má certifikát pro jinou doménu — rozbité HTTPS), Chata Studenov (jediný z „penzionové" skupiny, který treking přehled uvádí — slabý pozitivní signál). Nic nepovýšeno, nic nevyřazeno — vše jen poznámky s URL zdrojů a návrhy pro redakci, přesně dle zadání. Kontroly: všech 12 YAML zpětně parsovatelných, `--z-jsonu` idempotentní (0 nových / 76 nepřepsáno), **84/84 int**, lint i tsc čisté.
**Příště (ranní 6:30):** pokračovat v DATA-03 druhou dávkou — nejdřív polská schroniska (weby PTTK objektů mají vlastní domény, šance na průchod WebFetch je slušná: samotnia.com.pl, szrenica.pl, halaszrenicka.pl…), pak zbytek českých bud s webem (Betyna, Slovanka, Růžohorky, Lesní bouda, Martinovka znovu…); sporné bez zdrojů nechat Michalovi. Případně mini-krok: hero fotky pro první povýšené profily, až Michal odsouhlasí návrhy povýšení.
**Otázky pro Michala:** 1) **Souhlasíš s povýšením první šestice?** (Labská, Bílé Labe, Vosecká, Dvoračky, Krakonoš s výhradou provozu, Špindlerovka jako hraniční) — příští session by je povýšila do `data/chaty/` s údaji doloženými z webů. 2) **Penzion Roxana vyřadit?** (návrh ano — ale ze sandboxu jsem charakter přímo nedoložil, jen nepřímé signály). 3) Tereza/Sasanka/Zvonička: mrkni prosím z domácí sítě (weby ze sandboxu nedosažitelné) — stačí verdikt bouda/penzion do zadání. 4) U Dvoraček: chceš Štumpovku jako samostatný objekt průvodce, nebo jen zmínku v profilu Dvoraček?

## 2026-07-20 — denní session 21
**Hotovo:** **DATA-02: první fotka end-to-end u chaty — hero Luční boudy.** Třetí klik na workflow (po fixu tempa/backoffu) doběhl čistě: commit 707b624, **77 kandidátních YAML** (57 chat s alespoň jednou fotkou po licenčním sítu, 20 poctivě prázdných s `fotky: []`; nejbohatší Barborka 51, Labská bouda 49, Samotnia 48, Luční bouda 32). Z kandidátů Luční boudy vybrán hero snímek: **„Krkonoše, Luční bouda.jpg" — Stanislav Dusík, CC BY-SA 4.0** (jediný kandidát s popisem přímo boudy, geotag 41 m od chaty, nalezen geosearchem i v Category:Luční bouda, největší rozlišení mezi záběry budovy 4048×2024; licence, autor i popis doloženy ze surového `_commons-export.json` — extmetadata, bez Restrictions; stránku souboru očima zkontroluje redakce, do té doby `overeni.verified: false`). Zapsán do nového bloku `fotky:` v `lucni-bouda.yaml` (plná metadata kolekce Fotky + `stahnoutZ` = originál URL + blok overeni). **Seed rozšířen o sekci 2b:** fotky z YAML chat stáhne z Commons a nahraje do kolekce Fotky s vazbou na chatu — idempotentně dle `zdrojUrl` (opakovaný běh jen srovná metadata, nic nestahuje znovu); `fotky` se zároveň vyjímá z upsertu chaty (v kolekci je to join pole jen ke čtení — poslat ho v datech by byla chyba). Stahování potřebuje síť na upload.wikimedia.org (sandbox: proxy 403 — ověřeno, hláška čitelně říká „pusť lokálně/v Actions"); `SEED_BEZ_FOTEK=1` sekci vědomě přeskočí, ať budoucím sessions seed v sandboxu dál funguje pro zbytek dat. Cestou chycen skutečný bug: User-Agent hlavička s diakritikou („repozitář") shodí fetch — HTTP hlavičky jsou ASCII; opraveno s komentářem. **Atribuce u fotky:** nová komponenta `FotoAtribuce` + `.fatr` — mini tmavá kapsle vpravo nahoře hero, „Foto: Stanislav Dusík · CC BY-SA 4.0" jako odkaz na stránku souboru (rel noopener); povinnost CC BY/BY-SA („u převzatých se atribuce zobrazuje přímo u fotky", komentář kolekce Fotky od F0-04 — prototyp fotoatribuci neřeší, image-slot je placeholder, kapsle jde vědomě minimálně nad jeho rámec ve vizuálním jazyce hero). U `licence: vlastni` nebo bez autora se nezobrazuje nic. Čisté funkce seedu v novém `scripts/seed-fotky-lib.ts` (seed-chaty.ts běží celý při importu, testy importují odsud). Testy: **84/84 int** (+11: název souboru z URL Commons vč. diakritiky a %2C, MIME dle přípony s odmítnutím neznámé, konzistence bloku `fotky:` v YAML s poli kolekce a sítem DATA-02, právě jedna hero fotka; atribuce — odkaz/fallback textu licence/span bez zdrojUrl/nic u vlastní/nic bez autora), lint i tsc čisté. Vizuálně ověřeno nad lokální DB s dočasným placeholder obrázkem (do repa nic; skutečný snímek se ze sandboxu stáhnout nedá): hero zobrazuje fotku z DB, kapsle čitelná light i dark, href míří na Commons. Seed ověřen oběma cestami: bez přepínače čitelně spadne na síti, s `SEED_BEZ_FOTEK=1` doběhne celý vč. razítek.
**Příště:** dle pořadí **DATA-03** (křížové ověření seznamu chat: weby chat, KRNAP, Treking; kandidáti ready, vč. rozhodnutí o penzionech tagovaných alpine_hut a originálních názvů polských schronisek) — povýšené profily pak rovnou dostanou fotky z kandidátů DATA-02 stejným postupem jako dnes Luční bouda. Případný mini-krok: hero fotky pro první povýšené chaty.
**Otázky pro Michala:** 1) **Pusť prosím lokálně seed** (`npx payload run scripts/seed-chaty.ts`) — stáhne hero fotku Luční boudy z Commons a profil ožije; mrkni, že snímek i atribuce vypadají dobře. 2) Při té příležitosti **zkontroluj očima licenci na stránce souboru** (odkaz přímo v kapsli atribuce nebo v YAML `zdrojUrl`) — pak v `lucni-bouda.yaml` přepnu `overeni.verified: true` (sandbox na Commons nedosáhne, ověřovala jsem jen ze surového exportu API). 3) Vyhovuje umístění a nenápadnost atribuční kapsle (vpravo nahoře na fotce)? Je to jediné dnešní vybočení z prototypu — licenčně povinné, ale podoba je na tobě.

## 2026-07-20 — session 20 (ruční běh 2/2 „autonomní hodiny")
**Hotovo:** (1) **DATA-01 dokončena a odškrtnuta.** Druhý klik na workflow mezitím doběhl (+18 polských kandidátů + 1 nový český — Chata Pešákovna, v OSM přibyla mezi běhy; celkem **76 kandidátů**), zbýval slíbený průchod PL části: GPS všech 18 v bboxu, výšky v pásmu Krkonoš (11 s výškou, 13 s kontakty, 5 s obcí), `zeme: pl` všude, typy 14 obsluhovaná / 4 útulna, Samotnia/Strzecha/Dom Śląski se správnými PTTK kontakty; `--z-jsonu` nad oběma exporty idempotentní (0 nových / 76 stávajících / Luční bouda jen porovnána / 1 přeskočený bez name trvá). **Jediný nález — a opraven: slugify ztrácel polské ł** (na rozdíl od ostatní diakritiky nemá NFD dekompozici): „Schronisko pod Łabskim Szczytem" → slug `…-abskim-…`, „Przełęczy" → `prze-eczy`. Do `slugify` doplněn přepis nedekomponovatelných písmen (ł→l, ß→ss, đ→d, ø→o, æ→ae, œ→oe — ß a spol. se budou hodit v Alpách), dva postižené kandidáty přejmenovány i se slugem uvnitř (git mv, `schronisko-pod-labskim-szczytem`, `schronisko-pttk-na-przeleczy-okraj`) a idempotence po opravě ověřena. Payload hook slug sdílí — existující DB záznamy to nemění (hook běží až při uložení). (2) **Štítek historického otisku na padu** (drobek z hlavní session): `RazitkoMoment` má nový prop `stitek` — mikro-štítek `.pad-stitek` (`.mn`, 9px, muted, šířka padu) pod padem; šablona profilu ho skládá **jen z doložených polí**: `stav === 'historicke'` → „historický otisk · {platnostOd}" — u Luční boudy tedy „historický otisk · cca konec 80. let (odhad)". Aktuální razítka žádné označení nedostávají; sloty Razítkovníku zatím také ne (viz otázka). Ověřeno komponentovým testem (štítek jen s propem) a vizuálně nad seedem: light před dopadem i po něm, dark — štítek čitelný, dopad animace nezměněn. Testy: **72/72 int** (+1 ł, +1 štítek), lint i tsc čisté.
**Příště:** dle pořadí **DATA-02 čeká na Michalův klik** (teď už pokryje všech 76 kandidátů + Luční boudu) a pak **DATA-03** (křížové ověření — kandidáti jsou ready, vč. postřehu ze CZ průchodu o penzionech tagovaných alpine_hut); souběžně lze začít návrh **DATA-06** (graf značených tras z OSM relací).
**Otázky pro Michala:** 1) **Klik na DATA-02** („DATA-02: fotky chat z Wikimedia Commons") — teď je ideální chvíle, kandidáti DATA-01 jsou kompletní. 2) Má štítek „historický otisk" viset i na slotech Razítkovníku (tam teď historický otisk Luční boudy leží bez označení)? Přidám stejný mikro-štítek do slotu. 3) Polská schroniska mají v kandidátech polské názvy (Schronisko Samotnia…) — nechat jako primární název (místní jméno) a české ekvivalenty řešit přes aliasy, nebo obráceně? Vyplyne z DATA-03, ale směr určíš ty.
**Dodatek (první běh DATA-02, Michal online):** otázka 3 rozhodnuta — **originální (místní) názvy jako primární**, české ekvivalenty jen aliasy (zapsáno k DATA-03 v backlogu, commit 659fa15). První klik na DATA-02 spadl a Michal poslal log: Commons limituje sdílené IP runnerů **po dávkách ~10 dotazů** — na tempu 2 dotazy/s přišla 429 po 5 chatách, 30s pauza pomohla na dalších 5 chat, druhá 429 už vyčerpala jediný povolený retry. Pipefail z minula odvedl svou práci: krok spadl s čitelnou hláškou skriptu, žádná maskovaná chyba. Oprava: tempo dotazů 250 ms → **1200 ms** (pod 1 dotaz/s; 77 chat × 2 dotazy ≈ 3–4 min čistého času, pořád pohodlné), retry **4 pokusy s exponenciálním backoffem 30 → 60 → 120 s** (strop 150 s) a **respekt k hlavičce `Retry-After`**, kterou Wikimedia u 429 posílá (bere se delší z obou hodnot; výpočet v čisté funkci `dobaCekaniMs` s testy); 403 a jiné 4xx se dál neopakují — blokaci retry nespraví. Testy: **73/73 int** (přežití dvou 429 po sobě, 403 bez opakování, backoff/Retry-After), lint i tsc čisté. Míč: Michal klikne na DATA-02 ještě jednou.

## 2026-07-20 — session 19 (ruční běh 1/2 „autonomní hodiny", zadání k DATA-02)
**Hotovo:** **DATA-02 postaveno** dle zadání — skript `scripts/data02-commons-fotky.ts` + workflow `.github/workflows/data02-commons.yml` („DATA-02: fotky chat z Wikimedia Commons", `workflow_dispatch` s volitelným radiusem, default 300 m). Návrh kopíruje ověřený vzor DATA-01: (1) **seznam chat se čte z repa za běhu** — `data/chaty/<oblast>/` i kandidáti `data/kandidati/<oblast>/` (adresář `fotky` a `_*` soubory se přeskakují; při shodě slugu má ruční profil přednost) — žádný natvrdo psaný seznam „prvních 10", po Michalově kliku na DATA-01 pokryje další běh automaticky celé Krkonoše; (2) na chatu dva dotazy Commons API (`formatversion=2`): geosearch v okruhu kolem GPS (namespace 6, limit 50) + `Category:<název>` (neexistující kategorie není chyba), s identifikačním User-Agentem a 250ms rozestupy; (3) **tvrdé licenční síto**: povoleno jen CC0 / CC BY / CC BY-SA / public domain (i přes `Copyrighted=False`), vyřazeno vše s NC/ND — včetně NC schovaného v UsageTerms pod hezkým LicenseShortName — a nerozpoznané licence (nerozpoznaná ≠ volná); CC BY(-SA) bez dohledatelného autora ven, protože atribuci by nešlo splnit, u CC0/PD poctivé „neuveden (atribuci nevyžaduje)"; (4) výstup jen **metadata** do `data/kandidati/fotky/<oblast>/<slug>.yaml` (soubor, autor po očištění HTML, licence + licenceUrl, stránka souboru, originál, náhled 640px, rozměry, vzdálenost geotagu od chaty haversinem sdíleným s DATA-01, datum, popis, kde nalezeno) — fotky se nestahují; prázdný výsledek dostane YAML s `fotky: []` jako doklad, že se hledalo; strojově generované soubory, běh je přepisuje (redakční výběr patří do YAML chaty); (5) surový export `_commons-export.json` se commituje (doklad, `checked` = datum dotazu — Commons snapshot timestamp nemá) a transformace umí offline `--z-jsonu`; (6) vyřazené fotky s důvody jdou do reportu (step summary), ne do YAML. Testy: 16 nových (síto vč. NC v UsageTerms a PD z Copyrighted, čištění HTML/entit, dedup geosearch∩kategorie s označením původu, řazení dle vzdálenosti, přednost ručního profilu, tvar dotazů, mock API vč. 429, offline export), lint i tsc čisté; e2e smoke celého CLI proti lokálnímu mock serveru prošel (report, YAML, `--z-jsonu`), testovací data smazána. **Dodatek po rebase:** hlavní session mezitím pushnula fix DATA-01 workflow (d5c7214 — pipe přes tee bez pipefail maskovala pád skriptu; první ostrý běh spadl nejspíš na rate limitu sdílených IP runnerů) — obojí zrcadlím do DATA-02 ještě před prvním během: `shell: bash` + input přes env ve workflow a v `stahniJson` jeden retry s 30s pauzou na 429/5xx (+2 testy, celkem **68/68 int**).
**Příště (session 2/2):** dle zadání drobek z hlavní session — **štítek „otisk z konce 80. let" na padu historického razítka** (poctivost v UI); případně začít návrh **DATA-06** (graf značených tras). Ostrý běh DATA-02 čeká na Michalův klik — ideálně až po kliku na DATA-01, ať jedna dávka pokryje všechny chaty Krkonoš.
**Otázky pro Michala:** 1) V Actions teď čekají **dva kliky**: nejdřív „DATA-01: OSM export chat Krkonoš", pak „DATA-02: fotky chat z Wikimedia Commons" (pořadí ať fotky dostanou i noví kandidáti; DATA-02 klidně opakovaně — kandidátní YAML se přepisují aktuálním stavem). 2) Radius geosearch je 300 m (fotky boudy bývají foceny zblízka; širší okruh = víc šumu z hřebenovek) — kdyby výsledků bylo málo, pustíš workflow znovu s radiusem 500–800 m, je to input.

## 2026-07-20 — denní session 18
**Hotovo:** mini-krok DATA-01 dle plánu ze session 17 — **tiráž „Zdroje dat" v patičce webu**. Nová komponenta `SiteFooter.tsx` (footer vytažen z layoutu beze změny brand řádku — prototyp drží 1:1) + tichý druhý řádek `.zdroje` ve vizuálním jazyce patičky (11px, muted, běžné modré odkazy, mobil zalamuje): „každý údaj o chatě má svůj zdroj uvedený přímo na profilu" + **atribuce OpenStreetMap dle ODbL** (odkaz na openstreetmap.org/copyright i na text licence opendatacommons.org), mapové podklady **Mapy.com © Seznam.cz a.s. a další** (odkaz na api.mapy.com/copyright — stejný text i cíl jako fallback atribuce přímo na mapě v MapaChat) a zmínka správce značení **KČT** (patička ho v mini-kreditu už měla, teď má i odkaz). Formulace „databázi chat stavíme nad weby jednotlivých chat a nad daty OpenStreetMap" je vědomě mírně dopředná: OSM kandidáti z DATA-01 ještě nejsou povýšeni (čeká na tvůj klik), ale atribuce o pár dní dřív je bezpečný směr — opačné pořadí (OSM data bez atribuce) by bylo porušení licence; jestli ti formulace nesedí, klidně přepíšu. Testy: 4 nové komponentové (`site-footer.int.spec.tsx`: brand řádek beze změny, odkazy OSM/ODbL, shoda atribuce Mapy.com s mapou, věta o zdrojích na profilech) — **50/50 int** (poprvé včetně api testu naostro proti lokální DB), lint i tsc čisté; vizuálně ověřeno screenshoty light/dark/mobil nad běžícím serverem se seedem. Kandidáti DATA-01 v repu zatím nejsou — workflow klik trvá.
**Příště:** po Michalově kliku na workflow „DATA-01: OSM export chat Krkonoš" projít kandidáty + report (GPS/výška vs. ruční Luční bouda); jinak dle pořadí začít **DATA-02** (fotky Wikimedia Commons). *Sonda pro DATA-02 (dnes):* commons.wikimedia.org i upload.wikimedia.org jsou ze sandboxu nedosažitelné (proxy, jako ostatní externí API) — plán: rešerši fotek udělá session přes WebFetch (ten skrz proxy projde), do YAML jen URL + autor + licence po ruční kontrole; hromadné stahování/ověřování případně skript + Actions jako u DATA-01.
**Otázky pro Michala:** 1) **Trvá jeden klik:** Actions → „DATA-01: OSM export chat Krkonoš" → Run workflow (commitne kandidáty do `data/kandidati/`, na web nic nepustí). 2) Mrkni na patičku (stačí lokálně) — sedí ti znění tiráže „Zdroje dat"? Je to jediné místo, kde jsem šel drobně nad rámec prototypu (zdůvodnění: povinná ODbL atribuce; vizuálně drží jazyk patičky). 3) Trvá ze session 16: chceš do pilotu i polská schroniska? Dotaz DATA-01 je zatím vědomě jen ČR.

## 2026-07-20 — session 17 (ruční běh, zadání k DATA-01)
**Hotovo:** zadání ručního běhu bylo psané ke stavu před session 16 (F0-07 „nedotýkej se snímků" — už posouzena a odškrtnuta; základ DATA-01 už stál) — vzal jsem z něj tedy to nové a DATA-01 přestavěl: (1) **Staging kandidátů:** výstup jde do `data/kandidati/krkonose/` místo přímo do `data/chaty/` — seed čte jen `data/chaty/**`, kandidáti se tedy na webu neobjeví, dokud je redakce po křížovém ověření (DATA-03) ručně nepovýší. Souhlasím se zdůvodněním ze zadání (web nezaplaví desítky polotenkých profilů): řádek faktů by neověřenost sice poctivě přiznal, ale katalog plný skoro prázdných profilů by průvodci spíš škodil; kandidáti v repu dávají redakci jasnou frontu práce a diff při povýšení je čitelný. (2) **Surový export se commituje:** `data/kandidati/krkonose/_overpass-export.json` — doklad exportu vč. copyright hlavičky Overpass; `checked` se nově bere z `osm3s.timestamp_osm_base` (datum **stavu OSM dat**, ne datum transformace) a transformace umí `--z-jsonu` (offline nad commitnutým exportem — přesně vzor „skript s testy běží offline" ze zadání). (3) **Ruční profily se porovnávají:** místo tichého skipu report vypíše GPS rozdíl v metrech (haversine), výšku OSM vs. ruční a případný odlišný název — nic se nepřepisuje (Luční bouda nedotčena, doloženo testem i smoke během: „GPS rozdíl 10 m; výška OSM 1413 m vs. ruční 1410 m" na mock datech). (4) Dotaz rozšířen o **nestandardní `tourism=hut`** dle zadání — typ u něj skript nevyplňuje (wiki tag nezná, určí redakce; poznámka přímo v YAML kandidáta). Workflow nově commituje `data/kandidati/**` a report jde do step summary. Testy přepsány: **46/46 int** (14 pro DATA-01: dotaz, mapování, hut bez typu, checked z timestampu, porovnání, idempotence, ochrana ručních profilů, mock API), lint i tsc čisté; e2e smoke proti lokálnímu mock serveru prošel (stažení → export → kandidáti → report → `--z-jsonu`), testovací data smazána — ostrý export nechávám na workflow (zadání: klidně jen skript + testy, data příště).
**Příště:** (1) mini-krok: ODbL atribuce OpenStreetMap do tiráže/footeru webu (zadání: může počkat — navrhnu obecnou sekci „Zdroje dat", ať pokryje i Mapy.com a weby chat); (2) po Michalově kliku na workflow projít kandidáty + report (reálné GPS/výška vs. ruční Luční bouda) a začít DATA-02/DATA-03 dle pořadí.
**Otázky pro Michala:** 1) Trvá jeden klik: Actions → „DATA-01: OSM export chat Krkonoš" → Run workflow — teď už commitne kandidáty do `data/kandidati/` (na web nic nepustí, klidně klikej bez obav). 2) Trvá ze session 16: chceš do pilotu i polská schroniska (Szrenica, Samotnia…)? Dotaz je zatím vědomě jen ČR.
**Dodatek (po prvním ostrém běhu, Michal online):** první klik na workflow spadl za 40 s („All jobs have failed"; log ze sandboxu nevidím, Michal poslal mail-notifikaci). Při rozboru nalezeny a opraveny dvě věci: (1) krok exportu měl `npx tsx … | tee` bez pipefail (GitHub Actions bez explicitního `shell: bash` pipefail nezapíná) — pád skriptu se maskoval a job spadl až na `git add` neexistujícího adresáře, takže anotace ukazovala nepravou příčinu; teď `shell: bash` + chyba skriptu shodí přímo krok exportu s čitelnou hláškou. (2) Nejpravděpodobnější skutečná příčina: overpass-api.de rate-limituje sdílené IP GitHub Actions runnerů (pád za pár vteřin po npm ci tomu odpovídá) — skript má nově **automatický fallback instancí** (overpass-api.de → zrcadlo kumi.systems; `--api`/input fallback vypne a vynutí jedinou), selhání všech instancí dává souhrnnou chybu se všemi pokusy. Bonus: workflow vizuální kontroly mapy už neběží při každém pushi na main (F0-07 uzavřena) — jen ručně nebo při změně `MapaChat.tsx`/screenshot skriptu; viselý běh z dnešních pushů může Michal klidně zrušit. Testy: **47/47 int** (3 nové na fallback), lint i tsc čisté. Míč: Michal klikne znovu (input nechat prázdný).
**Dodatek 2 (kandidáti v repu, průchod hotov):** druhý běh po opravě **prošel bez chyby** (Michal potvrdil; commit b719207 z Actions) — **57 kandidátů** v `data/kandidati/krkonose/` + surový export. Průchod nad commitnutým exportem (`--z-jsonu` lokálně): 59 elementů, **58× alpine_hut, 1× wilderness_hut, 0× hut**; stav OSM dat 2026-06-12 (zrcadlo kumi.systems má pár týdnů staré minutely — pro checklist nevadí, `checked` to poctivě nese). 1 objekt přeskočen (way/88752514 bez name — k ruční kontrole), žádné kolize slugů. Kvalita: 8 kandidátů s výškou, 26 s kontakty, 9 s obcí, 0 aliasů; všechny GPS v bboxu, výšky v pásmu Krkonoš, západní okraj čistý (Studenov a Roxana u Rokytnice jsou ještě Krkonoše, Jizerky se nechytly). **Porovnání ruční Luční boudy s OSM: GPS rozdíl 3 m** (OSM way/19921110), výšku OSM nenese (ruční 1410 m z webu boudy) — ruční profil je přesnější i bohatší, nic k převzetí. Postřeh pro **DATA-03**: mezi kandidáty jsou objekty tagované `alpine_hut` se jmény penzionů („Penzion Roxana", „Sasanka", „Tereza", „Zvonička"…) — křížové ověření rozhodne, zda do průvodce horských chat patří (typ ani zařazení nedomýšlím); a Tetřeví boudy jsou v OSM relation — `out center` je pokryl správně.
**Dodatek 3 (rozhodnutí: polská schroniska bereme):** Michal rozhodl otázku ze session 16 — **Krkonoše bereme celé včetně polské strany**, a jako obecný princip pro přeshraniční pohoří (až dojde na Šumavu, přibere se německá strana stejně). Implementováno hned: dotaz je parametrický po zemích (`overpassDotaz(iso)`, `ZEME_DOTAZU` = CZ + PL — každý kandidát nese doloženou `zeme` z area filtru, hranici nic nedomýšlí), exporty per země (`_overpass-export-cz.json` — dnešní běh přejmenován git mv, data platí dál — a `_overpass-export-pl.json`), bbox na severu rozšířen 50.82 → 50.87 (polské podhůří: Szklarska Poręba, Karpacz; pro ČR bez efektu — area filtr), `--z-jsonu` čte oba exporty a chybějící zemi čitelně přeskočí, kolize slugů se řeší i napříč zeměmi. Web je připraven: `ZEME_SLUG.pl → polsko` v `lib/chaty.ts` existuje od F0-05 (URL `/polsko/krkonose/<slug>`). Testy: **70/70 int** (3 nové/upravené na PL větev; číslo zahrnuje i testy DATA-02 souběžné denní session), lint i tsc čisté; `--z-jsonu` nad reálným CZ exportem idempotentní (0 nových / 57 stávajících / 1 ruční / 1 přeskočen). **Míč: Michal ještě jednou klikne na workflow** — doplní polské kandidáty (CZ se nezmění, jen se přejmenovaný export znovu uloží) — a DATA-01 tím bude hotová k odškrtnutí.

## 2026-07-20 — denní session 16
**Hotovo:** **DATA-01 postaveno** dle plánu ze session 14 — skript `scripts/data01-overpass-krkonose.ts` + workflow `.github/workflows/data01-overpass.yml` („DATA-01: OSM export chat Krkonoš", `workflow_dispatch` s volitelným endpointem — default overpass-api.de, při přetížení input přepne na zrcadlo kumi.systems). Dotaz: `tourism=alpine_hut` + `wilderness_hut`, **průnik area ČR (ISO3166-1=CZ) a bboxu Krkonoš** — bbox sám by přibral polská schroniska, a ta jsou zatím otevřená otázka (viz níže); `out center` kvůli way/relacím. Mapování jen doložených tagů: name → nazev + slug (stejný `slugify` jako Payload hook — import z `src/fields/slug`), GPS (node přímo / center), ele → vyska (validace 0–4900 m, jinak se nezapisuje), addr:city → obec, phone/email/website (i contact:*) → kontakty, alt_name/old_name → aliasy s poznámkou původu; typ z významu tagu dle OSM wiki (alpine_hut = obsluhovaná, wilderness_hut = útulna) s poznámkou v YAML; **`stav` se vědomě nevyplňuje** — OSM provoz spolehlivě nenese, nedomýšlíme. Každý soubor: hlavičkový komentář se zdrojem a upozorněním redakci, `overeniLokace`/`overeniProvoz` se `source` = URL konkrétního OSM objektu + atribuce ODbL, `verified: false`, `checked` = datum běhu; operator/opening_hours/note jdou do interniPoznamky. Poctivost a bezpečí: **existující YAML se nikdy nepřepisuje** (ruční profil Luční boudy je v bezpečí — doloženo testem i smoke během), kolize jmen řeší suffix `-<osm id>`, řazení výstupu deterministické. Workflow: report do step summary + commit nových YAML do main (github-actions bot, `git pull --rebase` před pushem). Testy: 10 nových (tvar dotazu, mapování, poctivost, ochrana ručních profilů, kolize, mock API vč. 429 hlášky se zrcadlem) — **42/42 int**, lint i tsc čisté; CLI ověřeno end-to-end proti lokálnímu mock serveru (report sedí, YAML zpětně parsovatelný, `checked` je string — přesně co čeká seed). **F0-07 posouzena a odškrtnuta:** snímky z workflow session 15 dorazily do main až v průběhu dnešní session (commit 23c3533 z Actions — proto rebase před pushem); posouzení proti handoffu: reálné dlaždice outdoor (vrstevnice, stínovaný reliéf, značené trasy KČT, kóty Sněžka/Luční/Studniční hora), modrý marker přesně na Luční boudě, hover preview „Luční bouda · 1 410 m · V provozu · Profil →" light i tmavá dark pilulka 1:1 s prototypem, logo Mapy.com vlevo dole + atribuce „© Seznam.cz a.s. a další" vpravo dole — vše sedí, **F0-07 hotová a Fáze 0 je tím vývojově kompletní**.
**Příště:** po Michalově kliku na workflow projít vygenerované YAML (report: počty, přeskočené bez jména/souřadnic, podezřelé objekty) a pustit seed — katalog, mapa i razítkovník se rázem naplní; pak dle pořadí **DATA-02** (fotky z Wikimedia Commons pro prvních 10 chat).
**Otázky pro Michala:** 1) **Klikni prosím:** Actions → „DATA-01: OSM export chat Krkonoš" → Run workflow — commitne YAML nových chat do main a report najdeš v summary běhu. 2) Polská strana Krkonoš (schroniska — Szrenica, Samotnia…): dotaz je zatím vědomě jen ČR; chceš je do pilotu? Přidal bych větev s area PL a `zeme: pl` (URL by byly `/polsko/krkonose/...`).

## 2026-07-20 — hlavní session (první doložené razítko: Luční bouda)
**Hotovo:** Michal poslal sken razítka Luční boudy ze své dětské sbírky a upřesnil stáří: **historické, nejspíš konec 80. let**. Zapsáno poctivě do `data/razitka/krkonose/lucni-bouda.yaml` (stav `historicke`, platnostOd „cca konec 80. let (odhad)", zdroj odhadu Michal; licence `vlastni`, doložil Michal (redakce)) + ořezaný otisk `lucni-bouda-1410.png` (330×330 z dodaného skenu). Seed rozšířen o sekci razítek (`data/razitka/**` → upload do Fotek s metadaty + upsert Razítka dle (chata, nazev)). Cestou nalezena a opravena skutečná chyba zobrazování: Payload join `chata.razitka` nepopuluje vnořený `otisk` ani při vyšší `depth` → reálný sken by se nikdy nezobrazil, vždy padal fallback na stylizované SVG; opraveno společným dotazem `populujOtiskyRazitek` v `src/lib/chaty.ts` (profil i razítkovník). Ověřeno lokálně naostro: otisk dopadá na profil, Razítkovník ukazuje 1/1 + odznak Krkonoš; typecheck + 32/32 int testů. Do `.gitignore` přidán adresář uploadů `/fotky`.
**Příště:** (1) na pad přidat k historickému otisku jemný štítek „otisk z konce 80. let" (poctivost i v UI — teď dopadá bez označení); (2) pozor na seed upsert: přejmenování `nazev` razítka založí v dlouhodobé DB nový záznam (klíč (chata, nazev)) — po renamu smazat starý, časem zvážit stabilní klíč; (3) shánět **aktuální** razítko Luční boudy (dotaz na chatu / komunita / DATA-05) — vznikne druhá varianta v archivu.
**Otázky pro Michala:** žádné nové — otázka SVG vs. šedý stav u nedoložených otisků (session 12) zůstává otevřená pro chaty bez skenu.

## 2026-07-20 — session 15 (ruční běh, bonus: F0-07 odblokována zadáním)
**Hotovo:** ruční běh přinesl Michalova rozhodnutí k F0-07 (učiněná po startu sessions 11–13): kontrola dlaždic přes Actions a mapa i v katalogu. (1) **Workflow „Vizuální kontrola: mapa (F0-07)"** (`.github/workflows/vizualni-kontrola-mapy.yml`): `workflow_dispatch` + push na main, postgres:17-alpine jako service (parametry dle docker-compose), npm ci → seed → **kontrola, že secret `MAPY_API_KEY` existuje, a build s `NEXT_PUBLIC_MAPY_API_KEY` v env** (inlinuje se při buildu — proto před ním) → `npx playwright install --with-deps chromium` → start + čekání na :3000 → `scripts/ci/screenshot-mapa.mjs` → artifact `mapa-f0-07` **a** commit PNG do `docs/screenshots/f0-07/` (git pull --rebase před pushem). Proti nekonečné smyčce dvojitá pojistka: commit snímků nese `[skip ci]` a workflow má `paths-ignore: docs/screenshots/**`; navrch `concurrency` s cancel-in-progress. Skript fotí 4 stavy: homepage light, s otevřeným hover preview, dark, katalog `/chaty`; čeká nejen na dlaždice (complete + naturalWidth), ale i na **atribuci a logo Mapy.com** — přesně to se posuzuje; selhání je tvrdá chyba, nic se nedomýšlí. Lokálně ověřen s `MOCK_MAPY=1` (routy jako v e2e), CI běží bez mocku. (2) **Mapa v katalogu `/chaty`**: stejná MapaChat, všechny publikované chaty (`getChatyProMapu`), text stránky už neslibuje jen „připravujeme" — mapa žije; nový e2e test (marker, hover preview, klik → profil z katalogu). Sada **32/32 int, 16/16 e2e**, lint i tsc čisté. Rozhodnutí zapsána k F0-07 v backlogu s provenience „zadání ručního běhu 20. 7."; **F0-07 zůstává neodškrtnutá** do posouzení snímků. Bod 4 zadání (404 „MIMO ZNAČKU") už hotový ze session 14 — neduplikováno.
**Doplněk po doběhnutí workflow (táž session):** běh z pushe a2129aa prošel a commitl 4 snímky (23c3533, github-actions[bot], `[skip ci]` fungoval — žádná smyčka). Posouzení ze snímků: reálné dlaždice outdoor (vrstevnice, stínovaný reliéf, značené trasy KČT, Sněžka/Luční/Studniční hora, Špindl), modrý marker přesně na Luční boudě, hover preview 1:1 s prototypem (light i tmavá pilulka), **logo Mapy.com vlevo dole a atribuce „© Seznam.cz a.s. a další" vpravo dole viditelné**, v dark zůstávají dlaždice světlé dle prototypu; `mapa-katalog.png` je bajtově identický s `mapa-light.png` (deterministický render téže komponenty). Kuriozita, ne chyba: na dark snímku je otevřená hover preview — kurzor po reloadu zůstal nad markerem a mouseover se vystřelil znovu; příští zásah do skriptu může před dark snímkem uhnout myší stranou, ale záběr je vlastně užitečný (dokládá dark variantu `.mpre`).
**Příště:** hlavní session: mrknout na snímky v `docs/screenshots/f0-07/` a při souhlasu **odškrtnout F0-07** (z mého posouzení vše sedí). Pak dle pořadí DATA-01 (skript + workflow dle plánu v backlogu).
**Otázky pro Michala:** žádné nové — snímky jsou v repu i jako artifact `mapa-f0-07`.

## 2026-07-20 — denní session 14
**Hotovo:** poslední drobek F0-08 — **404 stránka „MIMO ZNAČKU"** 1:1 dle handoffu `razitko-moment.html`: `(frontend)/not-found.tsx` (šedý přerušovaný obrys razítka #8a949c s „404 / MIMO ZNAČKU", opacity .45, natočení −7°, „Tady cesta nevede — možná zanikla jako Obří bouda", akce „Zpět na rozcestí →"; noindex) + nový catch-all `(frontend)/[...rest]/page.tsx`, který na razítkovou 404 posílá i úplně neznámé URL — repo nemá společný root layout (skupiny (frontend)/(payload)), takže dřív by nenamatchovaná cesta dostala výchozí 404 Next.js bez hlavičky; konkrétnější routy vč. /admin a /api mají přednost, celá sada to dokládá. Cestou odhalen a opraven skrytý buglet: **tmavý režim se na 404 po reloadu ztrácel** — not-found boundary React kreslí na klientu a inline `darkInit` script z layoutu se tam neprovede (ověřeno i na staré default 404, nebyla to moje regrese) → pojistka `useLayoutEffect` v SiteHeaderu (na SSR stránkách no-op po darkInit, záblesk nepřibyl). S tím souvisí dev-only hláška „Encountered a script tag while rendering React component" na 404 v dev overlayi — je preexistující (React si při client renderu boundary stěžuje na script tag v layoutu), v produkci se neukazuje a funkčně je po dnešní pojistce neškodná; nechávám být. Testy: 3 nové e2e (`not-found.e2e.spec.ts`: neznámá URL → 404 + obrazovka + layout s badge + proklik na úvod; neexistující chata na kanonické cestě; dark po reloadu na 404). Sada **32/32 int, 15/15 e2e** (admin napoprvé spadl jen na známou studenou kompilaci, druhý běh čistý), lint + tsc čisté; screenshoty light/dark/mobil sedí s handoffem. **F0-08 je tím definitivně kompletní.** Navíc průzkum pro DATA-01: Overpass API (hlavní instance i zrcadla) je ze sandboxu nedosažitelný — plán přes GitHub Actions zapsán přímo k položce v backlogu.
**Příště:** **DATA-01** — skript `scripts/data01-overpass-krkonose.ts` (Overpass dotaz `tourism=alpine_hut`/`wilderness_hut` pro Krkonoše → YAML se `source` OSM + atribucí ODbL, `verified: false`) + workflow `workflow_dispatch` dle vzoru smoke-mapy; spuštění pak jedním klikem na Michalovi.
**Otázky pro Michala:** 1) Mrkni na `/tudy-cesta-nevede` (nebo jakýkoli překlep v URL) — 404 „MIMO ZNAČKU" žije, i v dark režimu. 2) Trvá: F0-07 čeká na tvou lokální kontrolu dlaždic + rozhodnutí o mapě v katalogu; foto otisku razítka Luční boudy při nejbližší návštěvě; volba stylizované SVG vs. šedý stav u nedoložených otisků (session 12).

## 2026-07-20 — session 13 (ruční běh, 2. z fronty)
**Hotovo:** **F0-08 dokončena a odškrtnuta.** Zadání ručního běhu („vezmi F0-08 moment + deník") bylo psané ke stavu před session 12, která moment i deník právě dopushovala — neduplikoval jsem tedy hotové a dostavěl zbývající část položky: stránku **Razítkovník** (obrazovka 5 prototypu) nad reálnými daty. Server: `getChatyProRazitkovnik()` v `lib/chaty.ts` (publikované chaty řazené názvem, výběr razítka stejně jako na profilu — přednost „k dispozici", otisk poctivě null, když sken chybí). Klient `RazitkovnikClient.tsx` nad `useDenik()`: hero se skóre X/N (X = **průnik** lokálního deníku s chatami v DB — slugy v deníku bez chaty v průvodci se sem nepočítají, badge v hlavičce dál počítá celou sbírku), progress bar s „PCT % · ZBÝVÁ K · ODZNAK POHOŘÍ" (odznak v textu jen když je pohoří jediné), skupiny slotů per oblast s červenou lištou, sloty: sbírkové razítko s deterministickou rotací −8° až +8° z indexu (žádný Math.random — hydratace) a datem z deníku vs. chybějící šedý přerušovaný obrys „?"/CHYBÍ s hintem `kdeSeRazitkuje` z DB (bez něj poctivé „Zatím bez otisku" — hint „1:20 od Výrovky" z prototypu nemáme doložený, vynechán), odznak pohoří (progres po obvodu stroke-dasharray X/N·302, silueta hřebene, žádné stuhy), infobox VÝZVA s poctivým počtem chat bez doloženého otisku (formulář neslibuje — jen „připravujeme", nahrávání je v Zaparkováno). Prázdné stavy dle handoffu s akcí: prázdný deník → „Najít první razítko →" `/chaty`, prázdná DB → „Zpět na úvod". Titulek z dat: jediné pohoří → „Krkonoše — sbírka razítek", víc → obecný. Sdílené SVG razítko vytaženo z RazitkoMomentu do `RazitkoSvg.tsx` (jeden zdroj kresby pro moment i sloty). H1 stránky je nově v client části (kvůli skóre v hero řádku) — server předává jen titulek. Testy: 6 nových komponentových (skóre/progress/sloty/odznak nad 3 chatami, průnik s deníkem, přednost otisku z DB, víc oblastí, prázdné stavy) + 2 e2e nad reálným serverem (0/1 s výzvou; 1/1 s datem, plným odznakem a proklikem slotu na profil). Sada: **32/32 int, 12/12 e2e**, lint i tsc čisté; screenshoty light/dark/mobil sedí s prototypem (mobil 2sloupcový grid, tab-bar badge živý).
**Příště:** drobek razítkové řeči: **404 stránka „MIMO ZNAČKU"** dle razitko-moment.html (Next.js not-found.tsx, šedý přerušovaný obrys, „Zpět na rozcestí →"). Pak je Fáze 0 vývojově vyčerpaná — dál čekají datové úkoly **DATA-01** (OSM Overpass export chat Krkonoš — víc chat naplní katalog, mapu i razítkovník) a na Michalovi F0-07 (vizuální kontrola + rozhodnutí o mapě v katalogu).
**Otázky pro Michala:** 1) Razítkovník žije — mrkni na `/razitkovnik` (stačí lokálně, data nepotřebuje kromě seedu). Skóre počítá jen chaty, které v průvodci reálně jsou — až DATA-01 přidá zbytek Krkonoš, sbírka se sama rozroste. OK? 2) Trvají otázky ze session 12: stylizované SVG u nedoložených otisků vs. šedý prázdný stav; a foto otisku Luční boudy při nejbližší návštěvě (odblokuje razítkovací sekci na profilu). 3) F0-07 pořád čeká na tebe (lokální kontrola dlaždic + scope katalogu).

## 2026-07-20 — denní session 12
**Hotovo:** F0-07 zůstává blokovaná na Michalovi (dnes potvrzeno, že api.mapy.com je nedosažitelné i z tohoto cloud sandboxu — vizuální kontrolu reálných dlaždic za tebe neudělám), dle pravidel tedy **začata F0-08: razítkovací moment + lokální deník**. Nová client komponenta `RazitkoMoment.tsx` — pad 150×150 s hintem „SEM DOPADNE RAZÍTKO", klik na „＋ Razítko do deníku" spustí dopad 1:1 dle handoffu `razitko-moment.html` (scale 2.1 → 0.94, mikro-odskok, konečné natočení −7°, blur 2 px → 0, 550 ms, cubic-bezier(.2,1.4,.35,1), rozpití inkoustu feTurbulence + feDisplacementMap, jednou — žádné smyčky); v okamžiku dopadu (480 ms) se otisk zapíše do deníku a tlačítko se přepne na ghost „✓ Ve sbírce · 20. 7. 2026". Do padu dopadá **skutečný otisk z DB** (sken/foto, bývalý `.p-otisk` blok tím nahrazen), a teprve když chybí, stylizované kruhové SVG složené jen z doložených údajů (název · pohoří · výška — bez výšky v DB se řádek nevykreslí; id v SVG přes useId, ať se instance na stránce nehádají). Po reloadu otisk drží bez přehrání animace (třída `.set` — prototyp animaci pouští při každém přepnutí obrazovky, což je artefakt SPA, ne záměr). **Lokální deník** `lib/denik.ts`: localStorage klíč `tc-denik`, verzovaný formát `{verze:1, zaznamy:{slug:{datum}}}` s validací při čtení (poškozený zápis = prázdný deník, nic se nedomýšlí), mini-store pro useSyncExternalStore, změny z jiných tabů přes storage event, SSR-safe (server renderuje 0). Badge Deník v hlavičce i mobilním tab-baru konečně žije — čte skutečný počet ze sbírky (statická nula z F0-02 končí). Sekce razítka na profilu má „Sbírka →" jako odkaz na `/razitkovnik`. Testy: 8 nových komponentových (idempotence a persistence deníku, poškozený localStorage, klik → `.hit` → zápis až v momentu dopadu → done stav, `.set` po reloadu, přednost otisku z DB, unikátní SVG id) + 2 nové e2e na badge (hlavička s 2 záznamy, mobilní tab-bar) — sada 26/26 int, 10/10 e2e, lint i tsc čisté. Vizuálně ověřeno na dočasném zkušebním razítku v lokální DB (po screenshotech smazáno, do repa nic): light/dark/po reloadu sedí s handoffem. Pozn.: admin e2e v čerstvé DB napoprvé spadne na timeout studené kompilace `/admin` (druhý běh 3/3) — kdyby tě to lokálně potkalo, není to regrese.
**Příště:** dokončit F0-08 — stránka **Razítkovník** dle obrazovky 5 prototypu: hero se skóre X/N červeně, progress bar, červená lišta, grid slotů (sbírková razítka s rotací a datem z lokálního deníku vs. chybějící se šedým přerušovaným obrysem a hintem cesty), odznak pohoří s progresem po obvodu, infobox „Výzva". Pak F0-07 čeká už jen na tebe.
**Otázky pro Michala:** 1) Razítkovací moment se ukáže jen u chat se záznamem razítka v DB — a Luční bouda zatím žádný nemá (sekce razítka je teď na webu skrytá, DATA-05 čeká na odpovědi razítkových webů). Nejčistší odblokování: až budeš u některé boudy, vyfoť vlastní otisk — je to doložený zdroj bez licenčních otazníků. 2) Když sken otisku chybí, dopadá stylizované kruhové SVG z doložených údajů (ilustrace sběratelské vrstvy dle handoffu) — vyhovuje, nebo bys u nedoložených otisků radši šedý prázdný stav „razítko nedoloženo" z razitko-moment.html? 3) Trvá dvojice k F0-07 ze session 11: lokální kontrola mapy s reálným klíčem + rozhodnutí, zda Mapa MVP zahrnuje i katalog `/chaty`.

## 2026-07-20 — denní session 11
**Hotovo:** **F0-07 implementována** — mapový pás na homepage. Nová client komponenta `MapaChat.tsx`: Leaflet (import až na klientu v useEffect, žádné SSR triky), dlaždice Mapy.com „outdoor" s klíčem z `NEXT_PUBLIC_MAPY_API_KEY` (retina displeje dostávají `256@2x` — mapset outdoor to dle dokumentace podporuje), atribuce se načítá **za běhu z tiles.json** mapsetu s fallbackem na text z oficiálního příkladu („© Seznam.cz a.s. a další" — přesnější než dřív plánovaný „Mapy.com · OpenStreetMap", pochází přímo z dokumentace map-tiles, kterou jsem dnes ověřil z veřejného repa mapycom/developer; git clone ze sandboxu kupodivu projde, HTTPS fetch ne), povinné logo Mapy.com jako LogoControl vlevo dole (přesně dle dokumentace vč. URL `api.mapy.com/img/api/logo.svg`). Markery `L.divIcon` se SVG 1:1 z handoffu `karta-chaty.html` (v provozu modrý r8/stroke 2.5 · zaniklá bílá čárkovaná · vybraná červená r12 se střechou a stínem — jediná; „dočasně mimo provoz" jsem zobrazil modře jako existující chatu, stav řekne preview červeně). Hover preview `.mpre` 1:1 z prototypu (top 12 px, left dle markeru, název · výška · stav zeleně/červeně · „Profil →"), klik na marker naviguje na profil, mapa se přizpůsobí markerům (fitBounds, maxZoom 13), scrollWheelZoom vypnutý (pás nemá krást scroll stránky). Server strana: `getChatyProMapu()` v `lib/chaty.ts` (jen publikované chaty s lat+lng, žádné domýšlení), homepage pás renderuje pod hero; bez klíče nebo bez chat se pás nevykreslí vůbec. Bacha na fintu: client komponenta nesmí importovat z `lib/chaty.ts` (server-only payload config) — formátování čísel má lokálně. Testy: 4 nové e2e s **mockem Mapy.com API přes route interception** (tvar URL dlaždic s klíčem v query, marker dle handoffu + hover preview + klik, atribuce z tiles.json, fallback při nedostupném tiles.json), screenshoty light/dark sedí s prototypem (v dark se mění jen podklad pásu, dlaždice zůstávají světlé — jako prototyp). Vedlejší úklid: `playwright.config.ts` umí `PW_CHROMIUM_PATH` pro předinstalovaný Chromium sandboxu (lokálně/CI se nic nemění) a opraveny dva **zastaralé šablonové e2e testy** rozbité dávno před dneškem (H1 z F0-01 scaffoldu vs. hero z F0-02; admin list Payload přesměrovává s `?depth=&limit=` a „Users" má od F0-04 label „Uživatelé"). Sada: 18/18 int, 8/8 e2e, lint + tsc čisté.
**Příště:** Michalova vizuální kontrola s reálnými dlaždicemi (viz otázka) → odškrtnout F0-07, případně dle rozhodnutí přidat mapu do katalogu `/chaty`. Pak dle pořadí **F0-08 razítkovací moment + lokální deník**.
**Otázky pro Michala:** 1) **Pusť si prosím lokálně homepage s reálným klíčem** (`.env` dle `.env.example`, `npm run dev`) a mrkni, že dlaždice outdoor, logo a atribuce vypadají správně — sandbox na api.mapy.com nedosáhne, testy jedou na mocku; potvrzení = odškrtnu F0-07. 2) Má „Mapa MVP" zahrnovat i mapu v katalogu `/chaty` (README handoffu bod 4 „Katalog + mapa"), nebo katalog přijde až s více chatami po DATA-01 a F0-07 uzavřeme homepage pásem? 3) Výška pásu je 210 px dle prototypu i na mobilu — kdyby ti na telefonu přišla mapa nízká, řekni, přidám breakpoint. 4) Trvá otázka přepínání křivek profilu (session 09/10) — není blokační.

## 2026-07-20 — session 10 (ruční běh, dopoledne)
**Hotovo:** **F0-06 dokončena a odškrtnuta.** Ruční běh přinesl upřesnění: `znaceni` tras se nečeká od Michala ručně — doplní ho zpětně trasová pipeline DATA-06 (což backlog u DATA-06 už sliboval, commit 93543ec; otázka č. 1 ze session 09 je tím bezpředmětná a stahuji ji). Zbývalo doložit render výškových křivek obou tras: šablona zobrazuje křivku první trasy (rozhodnutí session 07 — beze změny, otázka č. 2 z 09 na přepínání křivek trvá), proto nový komponentový test `tests/int/vyskovy-profil-komponenta.int.spec.tsx` — renderuje `VyskovyProfil` nad reálnými daty přímo z `lucni-bouda.yaml` (zdroj pravdy, žádná fixture): pro každou trasu s profilem ověří aria-label s délkou, dvě path (výplň uzavřená k základně + hladká křivka s C segmentem na každý bod), popisky paty (start s výškou, cíl s km), skrytý hover bod a krajní body křivky přesně na X0/X1. Test odhalil a zdokumentoval vlastnost Catmull-Rom interpolace: kontrolní body bezieru smí mírně přestřelit plátno (např. y 88,3 > 88), ale nikdy ven z viewBoxu — přesně tak to kreslí i prototyp, assertion to teď hlídá. Kvůli `.tsx` testům rozšířen vitest include na `{ts,tsx}`; doinstalována chybějící peer dependency `@testing-library/dom`. 18/18 testů, lint i tsc čisté. Seed + vizuální ověření (light/dark screenshoty, hover tooltip) proběhly už v session 09 dnes ráno — nedublovalo se.
**Navíc (začátek F0-07):** prostudována design reference mapy — mapový pás `.band` s hover preview `.mpre` (název · výška · stav zeleně/červeně · „Profil →", translateX(-50%), stín, opacity .15s) v `prototyp.html` a přesné markery v `components/karta-chaty.html` (v provozu: modrý kruh r8 `#1b6e9e` stroke bílá 2.5 · zaniklá: bílá se šedým čárkovaným okrajem · vybraná: červená r12 `#e0341f` s bílou střechou, jediná se stínem · cluster s číslem · odznáček razítka). A nový workflow `.github/workflows/smoke-mapy.yml` (`workflow_dispatch`): přes Actions ověří tvar URL mapsetu outdoor — tiles.json (vypíše atribuci, zoomy, šablonu dlaždic bez apikey) + vzorovou dlaždici Luční boudy (z13 x4453 y2752, spočteno z GPS); klíč jde hlavičkou ze secretu, do logu nesmí. Spustit ho ze sandboxu nejde (proxy pouští jen git, Actions API vrací 403 „not enabled for this session") — **Michale, klikni prosím v repu na Actions → „Smoke: Mapy.com API" → Run workflow**; výstup dá příští session ověřenou šablonu dlaždic a skutečný text atribuce.
**Příště:** **F0-07 mapa MVP** — implementace: Leaflet (dynamic import, ssr: false), dlaždice outdoor s klíčem z env, markery dle handoffu z dat Payloadu, hover preview, atribuce za běhu z tiles.json (fallback „Mapy.com · OpenStreetMap" do doby ověření); v Playwright testech mock tiles.json + dlaždic přes route interception; výstup smoke workflow převzít, až doběhne.
**Otázky pro Michala:** 1) Spusť prosím jednou workflow „Smoke: Mapy.com API" (viz výše) — odblokuje ověřenou atribuci. 2) Trvá otázka č. 2 ze session 09 — chceš časem přepínání křivky profilu mezi trasami (chips pod tabulkou)? Není blokační.

## 2026-07-20 — denní session 09
**Hotovo:** F0-06 poslední ověřovací krok — seed a render tras Luční boudy. Lokální Postgres 16 + čerstvá DB, `npx payload run scripts/seed-chaty.ts` puštěn 2× (první běh vytvořil oblast i chatu, druhý jen aktualizoval — idempotence drží, v DB 1 chata + 2 trasy). Render `/cesko/krkonose/lucni-bouda` ověřen Playwrightem: tabulka ukazuje obě trasy (Špindl 3:15 / +699 m, Pec 3:40 / +742 m; značení poctivě „—", dokud není doloženo), výškový profil Špindlu renderuje (SVG křivka, popisky paty „0 KM · ŠPINDLERŮV MLÝN 737 M" / „6,8 KM · LUČNÍ BOUDA", aria-label s trasou a délkou), hover funguje: tooltip „3,7 KM · 1 232 M" sedí s datovým bodem `[3.71, 1233]`, červený bod po odjetí myši zmizí; dark režim mění jen podklad profilu dle prototypu; řádek faktů hlásí poslední `checked` 20. 7. 2026 se sub-textem „zatím neověřeno" (žádný blok `verified` — poctivé). Do kódu aplikace se nesahalo — jen ověření a aktualizace backlogu. Pozn. k sandboxu: Playwright potřebuje `executablePath` na předinstalovaný Chromium a hover test scrollIntoView (souřadnice myši jsou viewportové, profil byl pod ohybem).
**Příště:** dle pravidel **F0-07 mapa MVP** (Leaflet + dlaždice Mapy.com „outdoor", markery, hover preview; atribuci načíst z tiles.json mapsetu; klíč připraven v env). F0-06 čeká už jen na `znaceni` od Michala — pak jednořádkové doplnění YAML + seed a odškrtnutí. *Průzkum pro F0-07 (dnes ověřeno):* api.mapy.com je ze sandboxu blokované i pro dlaždice/tiles.json (proxy 403 na CONNECT, stejně jako v session 08) a GitHub API je tokenem omezené jen na naše repo (dokumentace mapycom se nedohledá). Plán: mapa se implementuje normálně (dlaždice tahá prohlížeč klienta, ten blokovaný není), atribuce za běhu z tiles.json; v sandboxových Playwright testech se tiles.json + dlaždice mocknou přes route interception; smoke test proti skutečnému API může běžet v GitHub Actions (na externí API dosáhnou, secret `MAPY_API_KEY` už Michal nastavil pro DATA-06) — a vizuálně mapu ověří Michal lokálně.
**Otázky pro Michala:** 1) Potvrď prosím barvy značení obou tras z plánovače (Špindl → Luční bouda, Pec → Luční bouda): cervena / modra / zelena / zluta — doplním do YAML a F0-06 uzavřu. 2) Profil se renderuje u první trasy s daty (Špindl) dle rozhodnutí ze session 07 — chceš časem přepínání křivky mezi trasami (např. chips pod tabulkou)? Zapíšu do backlogu, kam řekneš; do té doby nechávám jednu křivku.

## 2026-07-20 — denní session 08
**Hotovo:** F0-06 předposlední krok — `scripts/vyskovy-profil.ts` dle rozhodnutí z 19. 7. (zdroj výšek = Mapy.com Elevation API). Vstup GPX (`trkpt`/`rtept`, libovolné pořadí atributů, více segmentů) → kumulativní km haversinem → rovnoměrný výběr ≤ 256 bodů **po vzdálenosti** (limit API na dotaz) → výšky z `GET /v1/elevation` (páry `lon,lat` — lon první, klíč hlavičkou `X-Mapy-Api-Key`, čitelné hlášky pro 401/403/422/429, chybějící výška −100000 = tvrdá chyba, nikdy odhad) → decimace Douglas–Peucker se svislou tolerancí 2 m (vrcholy a sedla zůstávají) → hotový YAML fragment trasy: `delkaKm`, `prevyseni` (stoupání, klesání v komentáři), `vyskovyProfil` zalomený po šesti dvojicích, komentáře se zdrojem + `checked` a s tím, co doplnit ručně (`vychoziBod`, `casMin` — čas skript záměrně nedokládá, `znaceni`, `obtiznost`). `--dry-run` a `--tolerance`; klíč z `.env` (dotenv). Tvar API ověřen z oficiální dokumentace (repo mapycom/developer na GitHubu — web developer.mapy.com ze sandboxu nedostupný). 13 vitest testů (parsování, haversine 1° ≈ 111,19 km, decimace, DP na vrcholu vs. šumu, mock API vč. dávkování >256 bodů a pořadí lon,lat, YAML fragment zpětně parsovatelný); CLI ověřeno dry-runem na zkušebním GPX; lint + tsc čisté. Návod „Výškové profily tras" v README. **Ostrý běh ze sandboxu nejde** — proxy blokuje api.mapy.com (403 na CONNECT), ověřeno; přesně pro tento případ je skript stavěný na jednorázové lokální spuštění.
**Příště:** F0-06 je teď blokovaná na Michalovi (GPX + jeden příkaz lokálně, viz README) — příští session bere dle pravidel **F0-07 mapa MVP** (Leaflet + dlaždice Mapy.com „outdoor", markery, hover preview; atribuci načíst z tiles.json mapsetu). Až budou data tras v YAML, F0-06 odškrtnout.
**Otázky pro Michala:** 1) Vyexportuj prosím GPX trasy Pec pod Sněžkou → Luční bouda (a klidně další: Špindlerovka, Výrovka…) a projeď README postup — pak je F0-06 hotová. Vlastní nahrávka je nejčistší; u exportu z plánovače nad OSM přidej do `overeniPristup.source` atribuci ODbL (skript na to v komentáři upozorní). 2) `casMin` skript nedokládá — nejlepší zdroj budou rozcestníky KČT z terénu, do té doby nechat prázdné?

**Hotovo:** F0-06 druhá část — interaktivní výškový profil dle handoffu. Nová client komponenta `VyskovyProfil.tsx`: SVG 1030×110 jako v prototypu, hladká křivka (Catmull-Rom → bezier) s výplní soft blue a modrou linkou 2 px, mousemove → binární vyhledání bodu na path (18 iterací, přesně dle JS prototypu), červený bod + tmavá pilulka „2,9 KM · 1 086 M", popisky start/cíl v patě, aria-label; styly `.prof`/`.tipp` 1:1 z prototypu vč. dark režimu (mění se jen podklad, jako v prototypu). Datový model: trasy v kolekci Chaty nově nesou `delkaKm` a `vyskovyProfil` (json — pole dvojic `[km, výška]`, validace ≥ 2 bodů); šablona profilu renderuje křivku jen u první trasy s doloženými body — bez dat se nic nevymýšlí ani nezobrazuje. Ověřeno: Playwright hover test (tooltip a bod reagují, hodnota sedí s interpolací testovacích bodů), screenshoty light/dark; dočasná testovací trasa v lokální DB po testu smazána (web je opět bez tras — poctivě prázdný); lint + tsc čisté, `generate:types` proběhl, seed idempotentní. Časy tras jsem znovu zkoušel doložit (ceskehory.cz, kudyznudy.cz) — citovatelný údaj nikde, trasy v YAML tedy stále nejsou.
**Příště:** F0-06 zbývá poslední krok — doložená data tras (časy/převýšení + body výškového profilu). Je to **blokované** rozhodnutím o zdroji výškových dat (otázka ze session 06 trvá) a sandbox geodata hromadně stahovat neumí (jen WebFetch). Návrh řešení: připravím `scripts/gpx-profil.ts` (GPX → decimovaná pole `[km, výška]` do YAML se zdrojem), ty vyexportuješ GPX tras — a data budou doložená. Dokud není rozhodnuto, další session bere dle pravidel F0-07 (mapa MVP, klíč Mapy.com připraven).
**Otázky pro Michala:** 1) Trvá volba zdroje výškových dat: GPX z Mapy.com (ověřit podmínky užití), nebo OSM + DMR 5G ČÚZK (licenčně čisté, ale potřebuje běžet mimo sandbox)? Případně vlastní GPX nahrávky z výletů — nejčistší. 2) Popisek pod profilem zatím říká jen „najeď myší po křivce" — provázání s mapou doplním s F0-07, ať netvrdíme, co ještě neexistuje.

## 2026-07-19 — denní session 06
**Hotovo:** F0-06 první část — doložená data Luční boudy. `data/chaty/krkonose/lucni-bouda.yaml` (+ `data/oblasti/krkonose.yaml`): lokace s GPS přepočtenou z webu boudy, výška 1 410 m, nocleh (typy pokojů, ceny „od"), občerstvení (bufet celoročně 10–17, restaurace, speciality vč. piva Paroháč), služby (WC, karty), provoz a kontakty, přístup (terminál P1 Pec + smluvní přeprava, 8,5 km / +750 m), historie 1623→2004 v milnících, perex + 3 odstavce živého textu, zdroje. Vše `verified: false`, `checked: 2026-07-19`, zdroje: lucnibouda.cz (profil, historie, doprava) a ČeskéNoviny.cz 9. 8. 2025 (návrat do běžného provozu po sporu s KRNAP). **Vědomě nezapsáno:** celková kapacita lůžek (web boudy ji neuvádí — demo „≈ 90 lůžek" z prototypu nepřevzato), pěší trasy s časy (zatím nedoloženy), URL webkamery. Nový `scripts/seed-chaty.ts`: idempotentní upsert YAML → Payload dle slugu (oblasti + chaty, odstavce textu → Lexical, publikuje) — zdroj pravdy zůstává v repu; `yaml` v devDependencies. Ověřeno: seed 2× po sobě bez duplikátů, profil `/cesko/krkonose/lucni-bouda` renderuje light i dark (screenshoty), řádek faktů poctivě říká „zatím neověřeno", JSON-LD validní (TouristAttraction + LodgingBusiness), lint + tsc čisté.
**Příště:** dokončit F0-06 — doložit pěší trasy (časy a převýšení z rozcestníků KČT / plánovače, ideálně s GPX) a postavit interaktivní výškový profil dle handoffu (SVG křivka, hover bod, tooltip km · m n. m.). Pak F0-07 mapa (API klíč Mapy.com je k dispozici).
**Otázky pro Michala:** 1) Typ: web se prezentuje jako „Hotel Luční bouda" — nechal jsem „obsluhovaná chata" dle prototypu; chceš přepnout na „horský hotel v roli chaty"? 2) Výšková data pro profil trasy: preferuješ GPX z plánovače Mapy.com (nutno ověřit podmínky užití), nebo výpočet z OSM cest + otevřeného DMR 5G ČÚZK? Druhé je licenčně čisté, dám mu přednost, pokud neřekneš jinak. 3) Provoz boudy se po sporu s KRNAP (6–8/2025) vrátil k běžnému režimu — kdyby ses doslechl o změně, hoď mi to do zadání, ať profil nelže.

## 2026-07-19 — denní session 05
**Hotovo:** F0-05 šablona profilu chaty. Route `/[zeme]/[oblast]/[chata]` dle URL konvence plánu (`/cesko/krkonose/lucni-bouda`, mapování kódů zemí na české slugy v `src/lib/chaty.ts`); nekanonická cesta vrací 404. Šablona 1:1 dle prototypu (sekce #profil): breadcrumb s GPS, sticky subnav s dynamickými kotvami, hero s gradient overlayem (fotka z DB, jinak ilustrační silueta hor), badges, řádek faktů s hairline dělítky (Výška / Otevřeno / Nocleh / **Ověřeno** / Webkamera s pulzující tečkou — jen doložené buňky, grid se přizpůsobí), trasy s pásovými značkami, razítko (červená lišta, otisk z DB), sousedé (chips s časy, prolinkované), historie (night lišta + milníky), tlačítka + tisková patička `.pfoot`. „Ověřeno" bere nejnovější `checked` napříč bloky ověření; sub-text poctivě říká „zatím neověřeno", dokud není žádný blok `verified`. JSON-LD: TouristAttraction + LodgingBusiness/FoodEstablishment dle dat + BreadcrumbList, jen z doložených polí. **Generovaný OG obrázek** (next/og): silueta hor + červený topline + doména/oblast + název s výškou + stav — fonty pro satori jsou sloučené TTF subsety latin+latin-ext (fonttools; satori neumí woff2 ani fallback mezi subsety, `src/lib/og-fonty/`). Ověřeno na zkušebním záznamu v lokální DB (po testu smazán): screenshoty light/dark proti prototypu, OG s kompletní diakritikou, JSON-LD validní JSON, 404 na špatnou oblast; lint + tsc čisté.
**Příště:** F0-06 vzorová Luční bouda (naplnit profil, `verified: false`, postupně ověřovat) + interaktivní výškový profil. Ze šablony zbývá na pozdější položky: počasí v heru (potřebuje zdroj dat), tehdy/dnes slider (potřebuje pohlednici — F0-06), razítkovací animace (F0-08), plánovač přechodů (F0-07+).
**Otázky pro Michala:** 1) Tlačítko „Nahlásit změnu" z prototypu zatím nedávám — potřebuje cíl (formulář, nebo aspoň e-mail; plán ho slibuje „od prvního dne", ale nechci do repa domýšlet adresu). Jaký kontakt použít? 2) OG fonty: přibalil jsem sloučené TTF (SIL OFL, ~220 kB) do `src/lib/og-fonty/` — vyhovuje, nebo je chceš generovat při buildu? 3) Styleguide `/design` nechávám beze změny, otázka z session 03 trvá.

## 2026-07-19 — denní session 04
**Hotovo:** F0-04 Payload kolekce dle plánu kap. 5. Nové kolekce: **Chaty** (taby Identifikace / Lokace / Nocleh / Občerstvení / Služby / Provoz / Přístup / Historie / Obsah a média / Vztahy / Meta; sidebar slug + země + typ + stav; drafty zapnuté), **Oblasti** (pohoří/podoblast + bbox pro mapu), **Výlety** (zastávky s vazbou na chaty, GPX, etapy, drafty), **Razítka** (samostatná entita s obdobím platnosti, stavem, kreditem dokladatele; otisk může chybět — výzva pro komunitu), **Fotky** (upload s povinným autorem a licencí, typ současná/dobová/otisk; náhledové velikosti), **Články** (drafty, vazby na chaty a oblasti). Sdílený blok `overeni` (source / verified / checked) je u každé věcné skupiny údajů — u Chaty per tab (overeniLokace, overeniNocleh…), protože taby bez name sdílejí jednu úroveň polí. Slug se generuje hookem z názvu (diakritika pryč), služby jsou tříhodnotové (ano / ne / nevyplněno = nezjištěno — checkbox by lhal). Nový access `verejneJenPublikovane`: veřejnost vidí jen publikované, koncepty jen přihlášená redakce — díru odhalil smoke test. `scripts/smoke-f004.ts` (idempotentní) prověřuje slug hook, vztahy, join razítek, access i draft režim proti lokální Postgres — prošel; lint + tsc čisté; admin editor vizuálně zkontrolován (screenshoty, taby a české labels sedí). Media přejmenována na „Soubory" (GPX apod.), fotky mají vlastní kolekci kvůli licencím.
**Příště:** F0-05 šablona profilu chaty nad daty + JSON-LD + generovaný OG obrázek.
**Otázky pro Michala:** 1) Granularita ověření je per tematická skupina (jeden telefonát ověří otvíračku i kontakty), ne per jednotlivé pole — per pole by byl admin nepoužitelný. Vyhovuje? 2) Sousední chaty se zapisují jednosměrně (u chaty A vazba na B); obousměrné dopočítání nechám na plánovači přechodů. OK? 3) Omezení Payloadu: join pole (razítka/fotky u chaty) se plní až po prvním publikování dokumentu — u čistých konceptů se seznam neukáže; pro web to nevadí, jen ať tě to v adminu nepřekvapí.

## 2026-07-19 — denní session 03
**Hotovo:** F0-03 komponenty. `components.css` s dlaždicemi, sekčními lištami (modrá/červená/night), tlačítky (červené CTA, modré, ghost, done, link), chips + filtr chips (aktivní plná červená), stavovými pilulkami (otevřeno plná zelená · zavřeno · zaniklá — vždy s textem, nikdy jen barvou), infoboxy (blue/alpine/red, plná plocha bez rámečku), pásovými značkami 1:1 s terénem (inline `.znm` i box `.znk`), tabulkovými řádky katalogu a kartou chaty (stav pilulkou ve fotce, hover zdvih + plovoucí stín) — hodnoty 1:1 z `prototyp.html`, vč. dark mode a mobilních breakpointů. React obaly prop-driven v `src/components/ui.tsx` + `HutCard.tsx` (žádná zadrátovaná data — vše přijde z Payloadu). Interní styleguide `/design` (noindex, s upozorněním, že jde o ukázková data z prototypu). Ověřeno: lint + tsc čisté, screenshoty light/dark proti prototypu a komponentovým kartám handoffu. CI blokace z session 01 potvrzena jako vyřešená (ci.yml je v `.github/workflows/`, commit bc36aa0).
**Příště:** F0-04 Payload kolekce dle plánu kap. 5: Chata, Oblast, Výlet, Razítko, Fotka, Článek + pole source/verified/checked všude.
**Otázky pro Michala:** Styleguide `/design` je veřejně dostupný (jen neindexovaný) — vyhovuje, nebo ho mám schovat za env flag / smazat, až poběží reálné šablony? Mapové markery z `karta-chaty.html` jsem nechal na F0-07 (patří k mapě).

## 2026-07-19 — denní session 02
**Hotovo:** F0-02 design základ. `tokens.css` přenesen 1:1 do `src/app/(frontend)/tokens.css`, self-hosted fonty (Space Grotesk + Inter, latin + latin-ext, SIL OFL) zkopírovány do `public/fonts/` včetně licence, `fonts.css` s @font-face dle handoffu. Globální layout dle `prototyp.html`: sticky header s červeným toplinem (brand SVG, nav pilulky, badge Deník, toggle ◐), vrstevnicové pozadí na krému, footer, mobilní tab-bar (<760 px, ikony dle prototypu, safe-area). Dark mode „hřebenovka po tmě" s persistencí (`localStorage tc-dark`, init skript před hydratací — žádný záblesk). Úvodní hero (kicker s mini pásovou značkou, H1 se dvěma akcenty, perex) — **bez demo čísel z prototypu** (347 chat apod. jsou nedoložená data, přijdou z DB). Placeholder stránky `/chaty`, `/vylety`, `/razitkovnik`, print CSS skrývá chrome, `:focus-visible` dle handoffu. Ověřeno: lint + tsc čisté, screenshoty (light/dark/mobil) proti prototypu — header a hero sedí, dark persistuje po reloadu.
**Příště:** F0-03 komponenty — sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty (`components/*.html` v handoffu).
**Otázky pro Michala:** Hero zatím bez vyhledávání a statistik — obojí potřebuje reálná data (F0-04+), doplním, jakmile bude nad čím. Badge Deník ukazuje staticky 0, oživí ho F0-08.

## 2026-07-19 — denní session 01
**Hotovo:** F0-01 scaffold aplikace. Next.js 16 (App Router) + TypeScript + Payload CMS 3.86 + Postgres adaptér, aplikace v kořeni repa (nejpřímější pro Forge Quick Deploy dle plánu kap. „Infrastruktura"). `docker-compose.yml` jen s Postgres 17 pro lokální DB, `.env.example` doplněn, README česky, úvodní stránka a metadata česky (`lang="cs"`). ESLint přepsán na flat config (šablonový FlatCompat padal s eslint-config-next 16) + CI workflow (lint + tsc) v `.github/workflows/ci.yml`. Smoke test proti běžící Postgres 16: frontend i `/admin` vrací 200, Payload si stáhl schéma. Kolekce zatím jen šablonové Users + Media — vlastní model přijde v F0-04.
**Příště:** F0-02 design základ — `tokens.css` 1:1 do aplikace, self-hosted fonty z `design/handoff/fonts/`, globální layout dle `prototyp.html` (červená topline, vrstevnicové pozadí, navigace, footer, dark mode).
**Otázky pro Michala:** V sandboxu session neběží Docker daemon — lokální DB jsem spouštěl přímo (postgres 16 z apt); `docker-compose.yml` pro tebe funguje normálně. Push CI workflow token odmítl (chybí oprávnění `workflow`) — předloha čeká v `docs/ci/ci.yml`. Přidáš tokenu oprávnění **Workflows: Read and write**, nebo soubor přesuneš do `.github/workflows/` ručně? *→ Vyřešeno 19. 7.: token má oprávnění Workflows, ci.yml přesunut do `.github/workflows/` (commit bc36aa0).*

## 2026-07-19 (příprava, ještě mimo denní režim)
**Hotovo:** Projekt naplánován (plán v1.7), design uzavřen — systém „Moderní průvodce" v2.2 z Claude Design (handoff v `design/`), klikací prototyp ověřen a opraven (null-guard u skeleton overlaye). Připraven tento repozitář.
**Příště:** F0-01 scaffold aplikace.
**Otázky pro Michala:** čas denní session · API klíč Mapy.com (až bude čas na F0-07).
