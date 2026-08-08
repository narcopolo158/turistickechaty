# Beskydy — koše plošné triáže

Vygeneroval `npx tsx scripts/triaz-kandidatu.ts beskydy --md` dne 8. 8. 2026,
hned po Michalově kliku na DATA-01 (běh přinesl **385 kandidátů** ze tří
zemí). **Přegenerovat po každém povýšení nebo vyřazení** — publikované,
odložené i vyřazené kandidáty skript sám vynechává.

Koš NENÍ rozhodnutí. Klíč zařazení se ptá i na turistickou minulost objektu
a tu z názvu nepozná nikdo. Koš jen říká, v jakém pořadí se to má číst a co
se dá probrat hromadně. Vyřazení patří do `data/kandidati/_vyrazeno.yaml`
a dělá ho redakce s pramenem.

## Dvě věci, které se s exportem musely vyřešit hned

**① Osm kandidátů odešlo do Javorníků.** Export běžel ještě podle STARÉHO
beskydského okna, tedy před tím, než Michal rozhodl, že Javorníky
a Vsetínské vrchy budou samostatná oblast. Do `data/kandidati/beskydy/` se
proto dostaly objekty z javornického hřebene — mezi nimi **Hotel Portáš**,
který je i v externím katalogu. Přesunuty ručně do
`data/kandidati/javorniky-vsetinske-vrchy/`: Chata Alpina, Chata Čertov,
Chata Javorka, Chata u Hrbáčků, Hotel Portáš, Kohutka-Chata u Kríža,
Spartak, Turistická chata Celnice. Do `_vyrazeno.yaml` se ZÁMĚRNĚ
nezapsaly — ten seznam se od 8. 8. 2026 porovnává podle posledního úseku
cesty, takže záznam „beskydy/<slug>" by objekt umlčel i v nové oblasti.

**② Zúžení okna z 49.25 na 49.30 bylo oprava, ne kosmetika — a export to
doložil.** Osmdesát kandidátů z tohohle běhu leží MIMO nové okno, a když se
jejich souřadnice roztřídí podle pohoří, ukáže se proč:

| kolik | pohoří, do kterého objekty patří | příklady |
|---|---|---|
| 59 | **Malá Fatra** (Terchová, Biely Potok) | Chalupa Božka, Chata Tiesňavy, Chata pod sochou Jánošíka |
| 13 | **Západní Tatry / Roháče** (Zuberec, Oravice) | Chalupa Elen, Chata Oravice, Chata pod Roháčmi |
| 6 | **Oravská Magura a Orava** (Zázrivá, Kubínska hoľa) | Chata na Kubínskej holi, Drevenica Sedliacka Dubová |
| 1 | západní podhůří (Podbeskydská pahorkatina) | Relaxační centrum U-rybničku |
| 1 | slovenské Javorníky / Súľovské vrchy — hraniční | Skalka |

Staré okno tedy sahalo přes celou Malou Fatru až k Roháčům, tedy do pohoří,
o kterých průvodce nerozhodl vůbec nic. **Ty soubory se ale NEMAZALY**: až
se Malá Fatra nebo Roháče někdy stanou oblastí, bude to hotová práce.
Otázka pro Michala je v deníku — parkovat, nebo smazat a stáhnout znovu
s vlastním oknem.


### NADĚJNÉ — vzít v triáži nejdřív (202)

| kandidát | země | signál |
|---|---|---|
| `agro-chatka` — Agro Chatka | pl | jméno nese „Chatka" |
| `atelier-chalupa` — Ateliér Chalupa | cz | jméno nese „Chalupa" |
| `bacowka-912009699` — Bacówka | pl | typ z OSM: utulna |
| `bacowka-na-muncole` — Bacówka na Muńcole | pl | typ z OSM: utulna |
| `bacowka-pttk-na-krawcowym-wierchu` — Bacówka PTTK na Krawcowym Wierchu | pl | typ z OSM: obsluhovana |
| `bacowka-pttk-na-rycerzowej` — Bacówka PTTK na Rycerzowej | pl | typ z OSM: obsluhovana |
| `bacowka` — Bacówka | pl | typ z OSM: utulna |
| `beskidzka-baza-obozowa-zhp-w-zalesiu` — Beskidzka Baza Obozowa ZHP w Zalesiu | pl | typ z OSM: obsluhovana |
| `bezrucova-chata` — Bezručova chata | cz | typ z OSM: obsluhovana |
| `chalupa-fatra` — Chalupa Fatra | sk | jméno nese „Chalupa" |
| `chalupa-hrcava` — Chalupa Hrčava | cz | jméno nese „Chalupa" |
| `chalupa-janina` — Chalupa Janina | sk | jméno nese „Chalupa" |
| `chalupa-katka` — Chalupa Katka | sk | jméno nese „Chalupa" |
| `chalupa-magdalena` — Chalupa Magdaléna | sk | jméno nese „Chalupa" |
| `chalupa-mariana` — Chalupa Mariana | sk | jméno nese „Chalupa" |
| `chalupa-pod-lipami` — Chalupa pod lipami | sk | jméno nese „Chalupa" |
| `chalupa-pod-nebem` — Chalupa Pod nebem | cz | jméno nese „Chalupa" |
| `chalupa-pri-ulicke` — Chalupa pri Uličke | sk | jméno nese „Chalupa" |
| `chalupa-robo` — Chalupa Robo | sk | jméno nese „Chalupa" |
| `chalupa-u-zvonka` — Chalupa u Zvonka | cz | jméno nese „Chalupa" |
| `chalupa-vika` — Chalupa VIKA | sk | jméno nese „Chalupa" |
| `chalupa-zlatnik` — Chalupa Zlatník | cz | jméno nese „Chalupa" |
| `chata-avc-velka-raca` — Chata AVC Veľká Rača | sk | jméno nese „Chata" |
| `chata-backarka` — Chata Bačkárka | sk | jméno nese „Chata" |
| `chata-bacow` — Chata Baców | pl | typ z OSM: obsluhovana |
| `chata-bila` — Chata Bílá | cz | typ z OSM: obsluhovana |
| `chata-bystre` — Chata Bystre | pl | jméno nese „Chata" |
| `chata-celnica` — Chata Celnica | cz | typ z OSM: obsluhovana |
| `chata-doktora-hrstky` — Chata doktora Hrstky | cz | jméno nese „Chata" |
| `chata-emil-zatopek-desitka` — Chata Emil Zátopek - Desítka | cz | typ z OSM: obsluhovana |
| `chata-emil-zatopek-maraton` — Chata Emil Zátopek - Maraton | cz | typ z OSM: obsluhovana |
| `chata-ester-oravska-priehrada` — Chata Ester Oravská priehrada | sk | jméno nese „Chata" |
| `chata-evka` — Chata Evka | sk | jméno nese „Chata" |
| `chata-filipka` — Chata Filipka | cz | jméno nese „Chata" |
| `chata-gibasowka-lutecja` — Chata Gibasówka (Lutecja) | pl | typ z OSM: obsluhovana |
| `chata-girova` — chata Gírová | cz | typ z OSM: obsluhovana |
| `chata-goralska-aggeusz` — Chata Góralska Aggeusz | pl | jméno nese „Chata" |
| `chata-hradek` — Chata Hrádek | cz | jméno nese „Chata" |
| `chata-ilcik` — Chata Ilčík | sk | jméno nese „Chata" |
| `chata-javorovy-vrch` — Chata Javorový vrch | cz | typ z OSM: obsluhovana |
| `chata-kminek` — Chata Kmínek | sk | typ z OSM: obsluhovana |
| `chata-kozubova` — Chata Kozubová | cz | typ z OSM: obsluhovana |
| `chata-lacnov` — Chata Lačnov | cz | jméno nese „Chata" |
| `chata-lienka` — chata Lienka | sk | jméno nese „chata" |
| `chata-mir` — Chata Mír | cz | jméno nese „Chata" |
| `chata-na-groniu` — chata na Groniu | pl | jméno nese „chata" |
| `chata-na-konci-sveta` — Chata na konci sveta | sk | jméno nese „Chata" |
| `chata-na-kubinskej-holi` — Chata na Kubínskej holi | sk | typ z OSM: obsluhovana |
| `chata-na-szancach` — Chata Na Szańcach | pl | jméno nese „Chata" |
| `chata-natalie` — Chata Natalie*** | sk | jméno nese „Chata" |
| `chata-nikol` — Chata Nikol | sk | typ z OSM: utulna |
| `chata-olimpijczyka-jasia-i-helenki` — Chata Olimpijczyka Jasia i Helenki | pl | jméno nese „Chata" |
| `chata-orava` — Chata Orava | sk | jméno nese „Chata" |
| `chata-oravice` — Chata Oravice | sk | jméno nese „Chata" |
| `chata-ostra` — Chata Ostrá | cz | jméno nese „Chata" |
| `chata-p-o-m-a` — Chata P.O.M.A | cz | jméno nese „Chata" |
| `chata-pilsko` — Chata Pilsko | sk | jméno nese „Chata" |
| `chata-pod-horou` — Chata pod horou | sk | jméno nese „Chata" |
| `chata-pod-kwiatkiem` — Chata pod Kwiatkiem | pl | jméno nese „Chata" |
| `chata-pod-louckou` — Chata pod Loučkou | cz | jméno nese „Chata" |
| `chata-pod-lysou` — Chata pod Lysou | cz | jméno nese „Chata" |
| `chata-pod-repiskom` — Chata pod Repiskom | sk | jméno nese „Chata" |
| `chata-pod-rohacmi-mores` — Chata pod Roháčmi - Mores | sk | jméno nese „Chata" |
| `chata-polana-stancowa` — Chata Polana Stańcowa | pl | typ z OSM: obsluhovana |
| `chata-potocik-zazriva` — Chata Potôčik Zázrivá | sk | jméno nese „Chata" |
| `chata-prasiva` — Chata Prašivá | cz | jméno nese „Chata" |
| `chata-rajnoha` — Chata Rajnoha | sk | jméno nese „Chata" |
| `chata-severka` — Chata Severka | cz | typ z OSM: obsluhovana |
| `chata-slana-voda` — Chata Slaná voda | sk | typ z OSM: obsluhovana |
| `chata-snezna` — Chata Sněžná | cz | typ z OSM: obsluhovana |
| `chata-sofia` — Chata Sofia | sk | jméno nese „Chata" |
| `chata-sumna` — Chata Šumná | cz | jméno nese „Chata" |
| `chata-teplica` — Chata Teplica | sk | jméno nese „Chata" |
| `chata-trafo` — Chata TRAFO | sk | jméno nese „Chata" |
| `chata-tri-kopce` — Chata Tri kopce | sk | jméno nese „Chata" |
| `chata-u-svaka-jana` — Chata u sváka Jana | sk | jméno nese „Chata" |
| `chata-u-zaby` — Chata u Żaby | pl | jméno nese „Chata" |
| `chata-uhorcik` — Chata Uhorčík | sk | jméno nese „Chata" |
| `chata-visalaje` — Chata Visalaje | cz | jméno nese „Chata" |
| `chata-vlcek` — Chata Vlček | sk | jméno nese „Chata" |
| `chata-vrba` — Chata Vŕba | sk | jméno nese „Chata" |
| `chata-w-decche` — Chata w Decche | pl | jméno nese „Chata" |
| `chata-wuja-toma` — Chata Wuja Toma | pl | typ z OSM: obsluhovana |
| `chata-zapolanka` — Chata Zapolanka | pl | jméno nese „Chata" |
| `chatka-adamy` — Chatka Adamy | pl | jméno nese „Chatka" |
| `chatka-akt-dobrodziej` — Chatka AKT Dobrodziej | pl | typ z OSM: obsluhovana |
| `chatka-gibasowka-u-stacha` — Chatka Gibasówka (u Stacha) | pl | typ z OSM: obsluhovana |
| `chatka-klubu-turystyki-gorskiej-limba` — Chatka Klubu Turystyki Górskiej "Limba" | pl | typ z OSM: obsluhovana |
| `chatka-malinka` — Chatka Malinka | pl | jméno nese „Chatka" |
| `chatka-na-potrojnej` — Chatka na Potrójnej | pl | jméno nese „Chatka" |
| `chatka-na-rogaczu` — Chatka na Rogaczu | pl | typ z OSM: obsluhovana |
| `chatka-na-suchej-gorze` — Chatka na Suchej Górze | pl | typ z OSM: utulna |
| `chatka-na-wysnim` — Chatka na Wyśnim | pl | jméno nese „Chatka" |
| `chatka-oddzialu-pttk-beskid-slaski-w-cieszynie` — Chatka Oddziału PTTK "Beskid Śląski" w Cieszynie | pl | typ z OSM: utulna |
| `chatka-pod-lamana-skala` — Chatka pod Łamaną Skałą | pl | jméno nese „Chatka" |
| `chatka-pod-laskiem` — Chatka Pod Laskiem | pl | jméno nese „Chatka" |
| `chatka-pod-potrojna` — Chatka pod Potrójną | pl | typ z OSM: obsluhovana |
| `chatka-pod-szczytem-lachow-gron` — Chatka pod szczytem Lachów Groń | pl | typ z OSM: utulna |
| `chatka-pod-zarem` — Chatka pod Żarem | pl | jméno nese „Chatka" |
| `chatka-skalanka` — Chatka Skalanka | pl | jméno nese „Chatka" |
| `chatka-stracona-polana` — Chatka Stracona Polana | pl | typ z OSM: obsluhovana |
| `chatka-studniowka` — Chatka Studniówka | pl | jméno nese „Chatka" |
| `dom-turystyczno-rekolekcyjny-hrobacza-laka` — Dom Turystyczno-Rekolekcyjny Hrobacza Łąka | pl | typ z OSM: obsluhovana |
| `etno-chata-topolej` — Etno Chata Topolej | pl | jméno nese „Chata" |
| `fajno-chatka` — Fajno Chatka | pl | jméno nese „Chatka" |
| `gorska-chata` — Górska Chata | pl | jméno nese „Chata" |
| `grabowa-chata` — Grabowa Chata | pl | jméno nese „Chata" |
| `hajenka-pod-sjezdovkou` — Hájenka pod sjezdovkou | cz | jméno nese „Hájenka" |
| `hajenka` — Hájenka | cz | jméno nese „Hájenka" |
| `horska-chata-cantoryje` — Horská chata Čantoryje | cz | typ z OSM: obsluhovana |
| `horska-chata-kamenity` — Horská chata Kamenitý | cz | typ z OSM: obsluhovana |
| `horska-chata-na-kotari` — Horská chata na Kotáři | cz | typ z OSM: obsluhovana |
| `horska-chata-ostry` — Horská chata Ostrý | cz | typ z OSM: obsluhovana |
| `horska-chata-solan` — Horská chata Soláň | cz | jméno nese „Horsk" |
| `horska-chata-studenicne` — Horská chata Studeničné | cz | typ z OSM: obsluhovana |
| `horska-chata-velky-javornik` — Horská chata Velký Javorník | cz | typ z OSM: obsluhovana |
| `horska-chata-zuzana` — Horská chata Zuzana | cz | jméno nese „Horsk" |
| `horska-jizba` — Horská jizba | cz | jméno nese „Horsk" |
| `horsky-hotel-cartak` — Horský hotel Čarták | cz | typ z OSM: obsluhovana |
| `horsky-hotel-hajenka` — Horský hotel Hájenka | sk | jméno nese „Horsk" |
| `horsky-hotel-radegast` — Horský hotel Radegast | cz | typ z OSM: obsluhovana |
| `hotel-charbulak` — hotel Charbulák | cz | typ z OSM: obsluhovana |
| `jezofcie` — Jezofčie | sk | typ z OSM: utulna |
| `kamenna-chata` — Kamenná chata | cz | typ z OSM: obsluhovana |
| `karczma-dzika-chata` — Karczma „Dzika Chata” | pl | jméno nese „Chata" |
| `kolarova-chata-slavic` — Kolářova chata Slavíč | cz | jméno nese „chata" |
| `koliba-chata-grillowa` — Koliba Chata Grillowa | pl | jméno nese „Chata" |
| `krzywa-chata-nad-zapora` — Krzywa Chata nad Zaporą | pl | jméno nese „Chata" |
| `kusalino` — Kusalíno | cz | typ z OSM: utulna |
| `lubova-utulna-na-chotari` — Lubova útulňa na Chotári | sk | typ z OSM: utulna |
| `mamenka` — Maměnka | cz | typ z OSM: obsluhovana |
| `masarykova-chata` — Masarykova chata | cz | typ z OSM: obsluhovana |
| `moravska-chalupa` — Moravská chalupa | cz | jméno nese „chalupa" |
| `myslivecka-chata-pastevnik` — Myslivecká chata Pastevník | cz | jméno nese „chata" |
| `nasza-chata-na-adamach` — Nasza Chata na Adamach | pl | jméno nese „Chata" |
| `nova-radnice` — Nová Radnice | cz | typ z OSM: rozhledna |
| `oddychovy-bod-novot-punkt-odpoczynku-novot` — Oddychový bod Novoť/Punkt Odpoczynku Novoť | sk | typ z OSM: utulna |
| `pekata-chata` — Pękata Chata | pl | jméno nese „Chata" |
| `prasiva` — Prašivá | cz | typ z OSM: rozhledna |
| `rajska-bouda` — Rajská bouda | cz | jméno nese „bouda" |
| `restaurace-na-hristi` — Restaurace na Hristi | cz | typ z OSM: obsluhovana |
| `restaurace-podhorska-chalupa` — Restaurace Podhorská chalupa | cz | jméno nese „chalupa" |
| `restauracja-pelna-chata` — Restauracja Pełna Chata | pl | jméno nese „Chata" |
| `richtarova-utulna-u-ponista` — Richtárova útulňa u Poništa | sk | typ z OSM: utulna |
| `rozhledna-sobesovice` — Rozhledna Soběšovice | cz | typ z OSM: rozhledna |
| `rozhledna-tetrev` — Rozhledna Tetřev | cz | typ z OSM: rozhledna |
| `rozhledna-velka-cantoryje` — Rozhledna Velká Čantoryje | cz | typ z OSM: rozhledna |
| `schron-gorski-chata-pod-skalanka` — Schron Górski Chata Pod Skalanką | pl | typ z OSM: obsluhovana |
| `schronisko-mlodziezowe-wiecha` — Schronisko Młodzieżowe Wiecha | pl | jméno nese „Schronisko" |
| `schronisko-na-hali-miziowej` — Schronisko na Hali Miziowej | pl | typ z OSM: obsluhovana |
| `schronisko-ozna` — Schronisko Oźna | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-klimczok` — Schronisko PTTK Klimczok | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-leskowiec` — Schronisko PTTK Leskowiec | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-markowe-szczawiny` — Schronisko PTTK Markowe Szczawiny | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-blatniej` — Schronisko PTTK na Błatniej | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-hali-boraczej` — Schronisko PTTK na Hali Boraczej | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-hali-krupowej` — Schronisko PTTK na Hali Krupowej | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-hali-lipowskiej` — Schronisko PTTK na Hali Lipowskiej | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-magurce` — Schronisko PTTK na Magurce | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-przegibku` — Schronisko PTTK na Przegibku | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-rysiance` — Schronisko PTTK na Rysiance | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-na-wielkiej-raczy` — Schronisko PTTK na Wielkiej Raczy | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-przyslop-pod-barania-gora` — Schronisko PTTK Przysłop pod Baranią Górą | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-skrzyczne` — Schronisko PTTK Skrzyczne | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-stozek` — Schronisko PTTK Stożek | pl | typ z OSM: obsluhovana |
| `schronisko-pttk-szyndzielnia` — Schronisko PTTK Szyndzielnia | pl | typ z OSM: obsluhovana |
| `schronisko-soszow` — Schronisko „Soszów” | pl | typ z OSM: obsluhovana |
| `schronisko-ssm-korbielow` — Schronisko SSM Korbielów | pl | jméno nese „Schronisko" |
| `schronisko-ssm-rycerka-kolonia` — Schronisko SSM Rycerka Kolonia | pl | jméno nese „Schronisko" |
| `schronisko-ssm-soblowka` — Schronisko SSM Soblówka | pl | jméno nese „Schronisko" |
| `schronisko-w-slemieniu-szkolne-schronisko-mlodziezowe` — Schronisko w Ślemieniu - Szkolne Schronisko Młodzieżowe | pl | jméno nese „Schronisko" |
| `schronisko-w-zembrzycach` — Schronisko w Zembrzycach | pl | jméno nese „Schronisko" |
| `srub-celadna` — Srub Čeladná | cz | typ z OSM: utulna |
| `stacja-turystyczna-abrahamow` — Stacja Turystyczna Abrahamów | pl | typ z OSM: obsluhovana |
| `stacja-turystyczna-slowianka` — Stacja Turystyczna Słowianka | pl | typ z OSM: obsluhovana |
| `stramberska-truba` — Štramberská trúba | cz | typ z OSM: rozhledna |
| `studenckie-schronisko-turystyczne-chatka-lasek` — Studenckie Schronisko Turystyczne "Chatka Lasek" | pl | typ z OSM: obsluhovana |
| `sulov` — Sulov | cz | typ z OSM: obsluhovana |
| `svarna-hanka` — Švarná Hanka | cz | typ z OSM: obsluhovana |
| `szalas-na-polanie-gorowej` — Szałas na Polanie Górowej | pl | typ z OSM: utulna |
| `szalas` — Szałas | pl | typ z OSM: utulna |
| `szkolne-schronisko-mlodziezowe-hondrasik` — Szkolne Schronisko Młodzieżowe „Hondrasik” | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-im-bolka-i-lolka` — Szkolne Schronisko Młodzieżowe im. Bolka i Lolka | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-pod-jalowcem` — Szkolne Schronisko Młodzieżowe Pod Jałowcem | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-w-lanckoronie` — Szkolne Schronisko Młodzieżowe w Lanckoronie | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-w-rajczy-nickulinie` — Szkolne Schronisko Młodzieżowe w Rajczy-Nickulinie | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-w-slemieniu-filia-w-lesie` — Szkolne Schronisko Młodzieżowe w Ślemieniu - Filia w Lesie | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-w-zawoi-welczy` — Szkolne Schronisko Młodzieżowe w Zawoi Wełczy | pl | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe` — Szkolne Schronisko Młodzieżowe | pl | jméno nese „Schronisko" |
| `tabakowa-chata` — Tabakowa Chata | pl | jméno nese „Chata" |
| `tanecnica` — Tanečnica | cz | typ z OSM: obsluhovana |
| `tonka` — Tonka | sk | typ z OSM: rozhledna |
| `turisticka-chata-brian` — Turistická chata Brian | cz | jméno nese „chata" |
| `turisticka-chata-lkj-zlin` — Turistická chata LKJ Zlín | sk | typ z OSM: obsluhovana |
| `turisticka-chata-skalka` — Turistická Chata Skalka | cz | typ z OSM: obsluhovana |
| `utulna-pod-magurkou` — Útulňa pod Magurkou | sk | typ z OSM: utulna |
| `wieza-widokowa-na-mosornym-groniu` — Wieża widokowa na Mosornym Groniu | pl | typ z OSM: rozhledna |
| `wieza-widokowa-przy-kolei-linowej-szyndzielnia` — Wieża widokowa przy Kolei Linowej Szyndzielnia | pl | typ z OSM: rozhledna |
| `wrzosowa-chata` — Wrzosowa Chata | pl | jméno nese „Chata" |
| `zajazd-regionalny-chata-na-groniu` — Zajazd Regionalny "Chata Na Groniu" | pl | jméno nese „Chata" |
| `zbojnicka-chata` — Zbójnicka Chata | pl | jméno nese „Chata" |
| `zelena-bouda` — Zelená bouda | cz | jméno nese „bouda" |

### K POSOUZENÍ — musí přečíst člověk (73)

| kandidát | země | signál |
|---|---|---|
| `bistro-pochutnej-si` — Bistro Pochutnej si! | cz | žádný signál ve jméně ani v tazích |
| `chalupa-aden` — Chalupa Aden | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-chotar` — Chalupa Chotár | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-danka` — Chalupa Danka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-javornik` — Chalupa Javorník | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-maria` — Chalupa Mária | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-martincek` — Chalupa Martinček | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-maruska` — Chalupa Maruška | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-meri` — Chalupa Meri | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-na-mlynci` — Chalupa na Mlynci | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-na-tizine` — Chalupa na Tižine | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-papajka` — Chalupa Papajka | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-podolina` — Chalupa Podolina | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-sokolisko` — Chalupa Sokolisko | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-u-sance` — Chalupa u Šance | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-u-sasky` — Chalupa u Sašky | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-viktor` — Chalupa Viktor | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-vilma` — Chalupa Vilma | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-visalaje` — Chalupa Visalaje | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-za-kostelem` — Chalupa Za kostelem | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chata-bariny` — Chata Bariny | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-biely-potok-1275-terchova` — Chata Biely Potok 1275 Terchová | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-borik` — Chata Bôrik | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-caesar` — Chata Caesar | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-cucoriedka` — Chata Čučoriedka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-don-t-panic` — Chata Don´t Panic | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-dukla` — Chata Dukla | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-dybala` — Chata Dybala | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-golebiowka` — Chata Gołębiówka | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-horec` — Chata Horec | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-ivanka` — Chata Ivanka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-jan-oravska-lesna` — Chata Ján - Oravská Lesná | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-kaplicka` — Chata Kaplička | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-korchan` — Chata Korcháň | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-lucka` — Chata Lucka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-maria` — Chata Mária | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-mesicek` — Chata Měsíček | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-na-plostine` — Chata na Ploštině | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-na-skarpie` — Chata na Skarpie | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-na-zagroniu` — Chata na Zagroniu | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-obsivanka` — Chata Obšívanka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-panorama` — Chata Panoráma | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-paradise-residence` — Chata PARADiSE Residence | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-pod-kycerou` — Chata pod Kyčerou | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-pod-kykulou` — Chata pod Kykulou | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-pod-mnichom` — Chata pod Mníchom | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-polovica-terchova` — Chata Polovica Terchová | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-rodlo` — Chata Rodło | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-rohace` — Chata Roháče | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-samota` — Chata Samota | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-sipkova` — Chata Šípková | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-sustiak` — Chata Šuštiak | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-sylvester` — Chata Sylvester | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-tiesnavy` — Chata Tiesňavy | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-u-hajasov` — Chata u Hajasov | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-yetti` — Chata Yetti | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-zuzka` — Chata Zuzka | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata-zwierzowka` — Chata Zwierzówka | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chata` — Chata | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `chatka-akt-na-pietraszonce` — Chatka AKT na Pietraszonce | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chatka" |
| `chatka-gos` — Chatka Gos | sk | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chatka" |
| `dum-mladych-hutniku` — Dům mladých hutníků | cz | žádný signál ve jméně ani v tazích |
| `fabrika-na-chute` — Fabrika na chute | sk | žádný signál ve jméně ani v tazích |
| `goralska-chata` — Góralska Chata | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `hajenka-kolibiska` — Hájenka Kolibiska | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Hájenka" |
| `horska-chata-burov` — Horská chata Búřov | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Horsk" |
| `kohutka` — Kohutka | cz | žádný signál ve jméně ani v tazích |
| `lovecka-chata-baletka` — Lovecká Chata Baletka | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata" |
| `skalka-1884089736` — Skalka | sk | žádný signál ve jméně ani v tazích |
| `skalka` — Skalka | sk | žádný signál ve jméně ani v tazích |
| `valasska-chalupa-bukoriska` — Valašská chalupa Bukoriška | cz | rozpor: OSM tourism=chalet (pronájem) × jméno nese „chalupa" |
| `wasza-chata` — WASZA CHATA | pl | rozpor: OSM tourism=chalet (pronájem) × jméno nese „CHATA" |
| `wegechatka` — Wegechatka | pl | žádný signál ve jméně ani v tazích |

### MIMO KLÍČ dle jména — probrat hromadně, NENÍ to vyřazení (101)

| kandidát | země | signál |
|---|---|---|
| `a-b-bungalovy` — A&B Bungalovy | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `apartman-pri-fontane` — Apartmán pri Fontáne | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `aqua-glamp` — Aqua Glamp | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `basikowe-wzgorze` — Basikowe Wzgórze | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `beskid-apartament` — Beskid Apartament | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `bunny-glamp` — Bunny Glamp | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `chalety-vrescovske-sedlo` — Chalety Vreščovské sedlo | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `chalupa-bozka` — Chalupa Božka | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-elen` — Chalupa Elen | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-na-hutisku` — Chalupa na Hutisku | cz | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-synka` — Chalupa Synka | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-terchova` — Chalupa Terchová | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupa-vaclav` — Chalupa Václav | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chalupy-u-danci-obory` — Chalupy u dančí obory | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `chata-beresik` — Chata Berešík | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-hldocin-uhliska-ostrazica-zmrazov` — Chata Hldočín, Uhliská, Ostražica, Zmrazov | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-ilonka` — Chata Ilonka | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-mafis` — Chata MAFIS | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-makovica` — Chata Makovica | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-pod-sochou-janosika` — Chata Pod sochou Jánošíka | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-sekaniska` — Chata Sekaniská | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chata-za-potokom` — Chata za potokom | sk | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `chromcowka` — Chromcówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `cyrilovka` — Cyrilovka | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `czill-beczki` — Czill Beczki | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dom-na-mosornym-groniu` — Dom na Mosornym Groniu | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dom-na-vyhliadke` — Dom na vyhliadke | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dom-przy-starym-szlaku` — Dom przy starym szlaku | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dom-w-pogorzu` — Dom w Pogórzu | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dom-wypoczynkowy-agat` — Dom Wypoczynkowy Agat | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domeczki-aneczki-domek-jadzia` — Domeczki Aneczki - Domek Jadzia | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domek-jano` — Domek Jano | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domek-letniskowy-w-gorach` — Domek Letniskowy w Górach | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domek-maja` — Domek Maja | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domek-pod-latarnia` — Domek Pod Latarnią | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domek-u-zrodel-wisly` — Domek u źródeł Wisły | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-caloroczne-daglezja` — Domki Całoroczne Daglezja | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-cicha-dolina` — Domki Cicha Dolina | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-gorskie-zacisze` — Domki Górskie Zacisze | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-innatura` — Domki inNatura | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-piecykowo` — Domki Piecykowo | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `domki-wisla-domek-gabrysia` — Domki Wisła - Domek Gabrysia | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `dorotanka` — Doroťanka | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-jakub` — Drevenica Jakub | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-orava` — Drevenica Orava | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-podbiel` — Drevenica Podbiel | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-pri-kostole` — Drevenica pri kostole | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-sedliacka-dubova` — Drevenica Sedliacka Dubová | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-skorec` — Drevenica Škorec | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenica-u-bambulky` — Drevenica u Bambuľky | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drevenice-zuberec` — Drevenice Zuberec | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `drewutnia` — Drewutnia | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `family-resort-zazriva` — Family Resort Zázrivá | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `gazdowka-bialy-krzyz` — Gazdówka Biały Krzyż | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `gierkowka` — Gierkówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `glampspace` — Glampspace | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `gora-zar` — Góra Żar | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `gorska-stacja-turystyczna-matlakowka-im-bolka-gotowta` — Górska stacja turystyczna "Matlakówka" im Bolka Gotowta | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `highlander-house-szczyrk` — Highlander House Szczyrk | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `igor` — Igor | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `kefasowka` — Kefasówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `letniok` — Letniok | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `miami-tropic` — Miami Tropic | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `michalikowka` — Michalikówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `na-kameni` — Na Kameni | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `noclegi-na-golebiowce` — Noclegi na Gołębiówce | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `noconiowka` — Noconiówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ogrodek-u-witka` — Ogródek u Witka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `osada-poli-zawoja` — Osada Poli Zawoja | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `osrodek-szkoleniowo-wypoczynkowy-ponikiew` — Ośrodek Szkoleniowo-Wypoczynkowy „PONIKIEW” | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `osrodek-wypoczynkowy-beskid` — Ośrodek Wypoczynkowy „Beskid” | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `palkovicke-hurky` — Palkovické Hůrky | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `pizza-hut-13958510108` — Pizza Hut | pl | městský podnik — „Pizza" |
| `pizza-hut` — Pizza Hut | pl | městský podnik — „Pizza" |
| `polosamota` — Polosamota | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `privat-alenka` — Privát Alenka | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `privat-gustav-halas` — Privát Gustáv Halas | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `privat-monika` — Privát Monika | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `przytulisko-telesforowka` — Przytulisko "Telesforówka" | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `radhostsky-rybnik` — Radhošťský rybník | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `rekreacni-stredisko-skalka` — Rekreační středisko Skalka | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `relaxacni-centrum-u-rybnicku` — Relaxační centrum U-rybničku | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `retro-chaty-sobesky` — Retro Chaty Soběšky | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `rima` — Rima | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `romanticka-drevenica` — Romantická drevenica | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `roubenka-pod-lysou` — Roubenka pod Lysou | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `rychterowka` — Rychterówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `sikmina` — Šikmina | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `sokoli-dvor` — Sokolí dvor | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `swierkowa-oaza` — Świerkowa Oaza | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `tadziowka` — Tadziówka | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `u-deda` — U deda | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `u-nas` — U nás | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `u-stopy` — U stopy | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `ubytovaci-zarizeni-sos-frydek-mistek` — ubytovací zařízení SOŠ Frýdek-Místek | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `valasska-koliba` — Valašská Koliba | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `villa-603` — Villa 603 | cz | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `woodbox-istebna` — Woodbox Istebna | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `zakatek-jakuba` — Zakątek Jakuba | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `zawoja` — Zawoja | pl | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |
| `zlty-dom` — Žltý Dom | sk | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata |

oblast beskydy | kandidatu k triazi: 376 | NADEJNE 202 · POSOUDIT 73 · MIMO 101
preskoceno (publikovane/odlozene/vyrazene): 1
