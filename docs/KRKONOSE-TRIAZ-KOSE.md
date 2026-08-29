# Krkonoše — koše triáže po běhu DATA-01 z 22. 8. 2026

Podklad k triáži **187 nepovýšených kandidátů** oblasti `krkonose`, z toho
**173 přinesl běh z 22. 8. 2026** (Michalův klik, commit `d291689`). Vzniklo 23. 8. 2026 v denní bezobslužné session.

**Koš NENÍ rozhodnutí.** Klíč zařazení se ptá i na turistickou minulost objektu
a tu z tagu ani ze jména nepozná nikdo — bývalá bouda se dnes může jmenovat
„Apartmány u lesa". Vyřazení patří do `data/kandidati/_vyrazeno.yaml` a dělá ho
redakce s pramenem. Koš říká jen pořadí čtení.

## Dvě vrstvy, každá měří něco jiného

**① Podle JMÉNA** — `npx tsx scripts/triaz-kandidatu.ts krkonose --md`; ta část
je níž v oddíle „Koše podle jména". Rozdělení: **107 nadějných · 31
k posouzení · 47 mimo klíč dle jména**.

**② Podle OSM TAGŮ** (nové 23. 8. 2026) — jméno říká, jak se objekt jmenuje,
kdežto tagy říkají, co v OSM dělá. Rozdíl je podstatný: „Chata Jeřabinka" zní
nadějně a v OSM je `tourism=guest_house`, kdežto „Horská" nezní nijak a nese
`amenity=restaurant`. Změřeno nad exporty, které v repu leží, **bez jediného
dotazu do sítě**; zdrojem je první OSM URL v hlavičce kandidáta.

| koš   | kolik | co to znamená                                                 |
| ----- | ----- | ------------------------------------------------------------- |
| **A** | 7     | OSM typ horské chaty — nejsilnější signál, brát první         |
| **B** | 42    | OSM doloží **veřejné občerstvení**, tedy jádro klíče zařazení |
| **C** | 131   | OSM zná jen ubytování — číst hromadně, **není to vyřazení**   |
| **D** | 2     | jiné tagy (rozhledna, stezka) — přečte člověk                 |
| **E** | 5     | element se v exportech nedohledal (starší kandidáti)          |

**Předpověď z 22. 8. („drtivá většina jsou apartmány a penziony") tím platí
měřeně: 131 ze 187.** Zároveň je pojmenovaná i mez toho měření — _nepřítomnost_
tagu `amenity` NENÍ doklad, že objekt veřejné občerstvení nemá; OSM mlčí často.
Koš C proto není fronta na vyřazení, ale fronta na hromadné čtení.

## Co z toho vypadlo hned

**Tři kandidáti stojí pár metrů od publikovaného profilu téže oblasti** —
`schronisko-gorskie-dom-slaski` (4,2 m od `dom-slaski`),
`schronisko-szrenica-1362-m-n-p-m` (5,7 m od `schronisko-szrenica`)
a `restaurace-labska-bouda` (19,5 m od `labska-bouda`). Ani jeden nemá shodné
jádro názvu, takže je neohlásila žádná z dosavadních kontrol; od 23. 8. 2026 je
měří `npx tsx scripts/kontrola/blizke-body.ts`. **Nepovyšovat, dokud o páru
nerozhodne redakce** (a rozhodnutí zapsat do `data/_jmenovci.yaml`).

**Schronisko Wysoki Kamień je v korpusu.** Doložená mezera z 20. 8. 2026 —
objekt, který krkonošské okno stáhlo jen jako občerstvení u _nepojmenované_
věže — přišel novým během jako pojmenovaný kandidát `schronisko-wysoki-kamien`
s `amenity=cafe`, `ele=1058` a otvíračkou. Otázka na východní hranu jizerského
okna tím **nemizí** (objekt do jizerského dotazu dál nespadá), jen už není
slepou skvrnou celého korpusu.

**Vrátily se i tři ze čtyř mezer z 20.–22. 8.:** `velke-pardubicke-boudy`
(`amenity=restaurant`), `pension-jilemnicka-bouda` (`amenity=restaurant`,
otvíračka 9–21) a `hribeci-bouda`. **Bouda Svornost dál chybí** — v exportech
není pod žádným jménem a příčina zůstává otevřená.

## KOŠ A ODPRACOVÁN (25. 8. 2026) — a sedm položek je ve skutečnosti tři

Koš A byl postavený nad OSM tagy, a proto nevěděl nic o **rozhodnutích, která
už padla a žijí v `interniPoznamky` samotných kandidátů**. Po přečtení všech
sedmi souborů vypadá bilance takhle:

| kandidát         | stav ke 25. 8. 2026                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `zaly`           | **UŽ POVÝŠEN** — `data/chaty/krkonose/zaly.yaml`, týž OSM `way/151987319`, shodné GPS. Do koše neměl vůbec spadnout.                    |
| `chata-eliska`   | **ROZHODNUTO MIMO** (Michal 27. 7. 2026, otázka č. 13) — penzion u vleků ve Vítkovicích, bufet Stodola je samostatný podnik 30 m vedle. |
| `chata-mamut`    | **ROZHODNUTO VYŘADIT TRVALE** (Michal 20. 7. 2026 + triáž tier 4 26. 7.) — pronájmová roubenka, sdílená kuchyně, bez občerstvení.       |
| `sasanka`        | **KLÍČ SPLNĚN, ČEKÁ NA MICHALA** — Firmy.cz doslova „Restaurace v provozu po celý den"; visí jen na klíči střediska (Pec).              |
| `chata-hubertka` | **ODLOŽENO** — nově doloženo 25. 8. (viz níž), otázka pro Michala.                                                                      |
| `lokomotiva`     | **ODLOŽENO** — nově doloženo 25. 8. (viz níž), rozhodne Archa Krkonoš.                                                                  |
| `javorka`        | **ODLOŽENO** — re-check 25. 8. nepřinesl nic nového, stav z 20. 7. trvá.                                                                |

**Systémový nález, a je to táž díra jako včera u `blizke-body`:** rozhodnutí
redakce žije na **dvou místech** — v `data/kandidati/_vyrazeno.yaml` (odkud ho
kontroly čtou) a v `interniPoznamky` kandidáta, který v repu zůstává „jako
doklad" (odkud ho nečte nikdo). Změřeno nad celým repem 25. 8. 2026: z **1 628
kandidátů nese 46 v poznámkách marker rozhodnutí** (`ROZHODNUTÍ REDAKCE` 32,
`K RUČNÍ KONTROLE` 15, `NEZAŘAZOVAT` 9, `SPORNÉ S KLÍČEM` 2, po jednom
`POTVRZENO MIMO`, `ZŮSTÁVÁ MIMO`, `VYŘADIT TRVALE`, `ZŮSTÁVÁ ❓`). V koši A to
dělalo **tři sedminy zbytečné práce**; nad koši B–E to bude podobný podíl.
**Návrh:** `scripts/triaz-kandidatu.ts` má dostat koš **ROZHODNUTO** — ne aby
rozhodnutí přepisoval, ale aby už rozhodnuté kandidáty do front k práci
nedával. (Nezahrnuto do dnešní session, aby zůstala dokončená; otázka je
v deníku 25. 8.)

### Co k odloženým třem přibylo 25. 8. 2026

- **Chata Hubertka** — je ve **Vítkovicích** („Vítkovice 201", vystupuje jako
  „Resort Hubertka"), ne v Rokytnici. Vlastní web má stránku „Hospůdka"
  s rozvrhem „1.7. - 31.8. otevřeno 11:00 - dle QR denně", ale větu o přístupu
  neubytovaných nenese. Zároveň hlásí konec běžného provozu: „Restaurace již
  nebude v běžném provozu", „Nadále bude k dispozici pro svatby, oslavy,
  firemní a soukromé akce" — a místo ní „samoobslužný obchůdek 24 hodin denně,
  7 dní v týdnu". **Dvě otázky pro Michala:** je letní hospůdka i pro
  neubytované, a plní samoobslužný obchůdek 24/7 klíč občerstvení? Druhá
  odpověď založí pravidlo pro celou třídu objektů.
- **Lokomotiva** — Firmy.cz ji vede v kategorii „Horské chaty a chalupy"
  s popisem „Provoz horské chaty s nabídkou ubytování." a rovnou dodává „Tato
  firma nebo pobočka již není aktivní." O občerstvení mlčí (což není doklad, že
  ho nemá). Zato jsou tu **dva signály turistické role**: Archa Krkonoš eviduje
  „Pec čp. 17 Lokomotiva" a bergfex vede trasu „Pec pod Sněžkou - Lokomotiva -
  Konopindova chata - Jindřichův dům". Archa je ze sandboxu **nedostupná
  (robots.txt)** — a právě ona rozhodne.
- **Javorka** — nula nových dokladů: javorka.eu ze sandboxu nedostupná, Archa
  Krkonoš blokovaná robots.txt, vyhledávání vrací jen jiné objekty (Javořinka,
  Javoří mlýn, Javorka v Jeseníkách; jmenná podobnost se neztotožňuje).
  **Bezobslužně to potřetí nezkoušet.**

## KOŠ B — první čtení (26. 8. 2026): 42 položek, 4 už parkují, 6 odpracováno

**Nejdřív měření, ať se nedělá práce dvakrát** — táž otázka jako u koše A.
Průchod všech 42 kandidátů proti markerům rozhodnutí v `interniPoznamky`,
proti `_vyrazeno.yaml`, `_odlozeno.yaml`, `_jmenovci.yaml` a proti
publikovaným profilům (shoda OSM URL i vzdálenost do 60 m):

- **`horska-chata-portasky`** — SHODNÉ OSM URL i GPS (0 m) s publikovaným
  profilem `portasky`. Duplicita, ne kandidát; smazání čeká na Michala
  (otázka běží od 23. 8.).
- **`restaurace-labska-bouda` (19,5 m), `schronisko-gorskie-dom-slaski`
  (4,2 m), `schronisko-szrenica-1362-m-n-p-m` (5,7 m)** — krkonošská trojice
  gastro POI uvnitř publikovaných domů, zapsaná v `_jmenovci.yaml` 24. 8.,
  čeká na Michalovo „jeden objekt, nebo dva".
- **`swojska-chata`** je v registru jmenovců kvůli jesenickému jmenovci; to
  ale není rozhodnutí o zařazení, kandidát zůstává otevřený.
- **Zbytek koše B je od rozhodnutí čistý.** Na rozdíl od koše A (tři sedminy
  zbytečné práce) tu díra „rozhodnutí má dvě bydliště" skoro nebolí — 1 ze 42.

**Co koš B umí rozhodnout offline a co ne.** Plné OSM tagy z exportů v repu:
adresu nese 13 ze 42, web 14, `ele` **jediný** (Wysoki Kamień), `wikidata`
dva. Na otázku „role na trase" tedy tagy ve většině případů neodpovídají —
koš B se musí číst po jednom s prameny, stejně jako koš A.

**Odpracováno 6 kandidátů** (WebSearch + otevřené stránky, doklady s citacemi
zapsané přímo do `interniPoznamky`; do `data/chaty/` se nesáhlo):

| kandidát               | občerstvení pro veřejnost                                   | role na trase                                             | návrh redakci    |
| ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| `chata-boruvka`        | **doloženo** (11–17, foodtruck, terasa)                      | **doložena** (Kubátova cesta na Sněžku, 860 m)              | **POVÝŠIT**      |
| `karczma-hutnika`      | doloženo (a míří na kolemjdoucí)                             | doložena („przy głównym szlaku na wodospad Szklarki")       | K RUČNÍ KONTROLE |
| `johannova-bouda`      | doloženo (samoobslužný bufet)                                | ne — okraj Vrchlabí, ve skiareálu, 550 m                    | SPORNÉ S KLÍČEM  |
| `chata-ducha-gor`      | doloženo (restaurace 12–22)                                  | ne — pěší zóna 1 Maja, „w samym sercu Szklarskiej Poręby"   | NEZAŘAZOVAT      |
| `bouda-mila`           | **nedoloženo** (jen pro ubytované)                           | nedoložena; firma „v likvidaci"                             | NEZAŘAZOVAT      |
| `horska-chata-poutnik` | **nedoloženo** (pramen posílá do sousední Lysečinské boudy)  | poloha ano, trasa nedoložena; **provoz ukončen**            | NEZAŘAZOVAT      |

**Tři rozpory s OSM ze šesti čtených, všechny stejného druhu — tag tvrdí
občerstvení, prameny ne.** `chata-ducha-gor` nese `amenity=fast_food;
cuisine=kebab`, ale vlastní web i katalogy popisují restauraci s polskou
kuchyní (kebab na té adrese nikdo nezná). `horska-chata-poutnik` a
`bouda-mila` nesou `amenity=restaurant`, prameny u obou mluví jen o stravování
pro ubytované — a oba objekty jsou doloženě mimo provoz. **Je to mez celého
koše B:** tag `amenity` je signál k přečtení, ne doklad veřejného občerstvení.

**Vedlejší nález, systémový:** kandidáti bez OSM tagu `tourism` mají
v `interniPoznamky` větu „Typ odvozen z OSM tagu tourism=undefined" —
odvození z tagu, který neexistuje. **Nese ji 232 souborů v deseti oblastech**
(Šumava 62, Krušné hory 46, Beskydy 38, Krkonoše 35, …). Datový soubor tím
tvrdí nesmysl; opravit se to má u generátoru DATA-01 i zpětně v souborech.
Návrh je v deníku 26. 8. 2026, čeká na Michala.

## KOŠ B — druhé čtení (27. 8. 2026): pět kandidátů s vlastním webem v OSM

Postup podle „Příště" z 26. 8.: brát nejdřív ty, u kterých OSM nese vlastní
web — doklad je u nich nejlevnější. Přečteno pět, metoda beze změny (WebSearch,
pak otevřené stránky; vše `verified: false`, citace s URL zapsané přímo do
`interniPoznamky` kandidáta; do `data/chaty/` se nesáhlo).

| kandidát                | občerstvení pro veřejnost                                     | role na trase                                                | návrh redakci               |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------- |
| `bouda-mala-upa`        | **doloženo pro NEUBYTOVANÉ** (léto 11–17, zima 12–15)          | doložena (vlastní web: „přímo na trase k Sněžce", 1040 m)      | **POVÝŠIT**                 |
| `chata-stopa`           | **doloženo** (bufet Út–Ne 9–18, „zastávka všech výletníků")    | doložena (vlastní web)                                         | POVÝŠIT AŽ PO IDENTITĚ      |
| `chata-misecky`         | doloženo (Firmy.cz aktivní, 11–22; „hosté restaurace")         | ne — středisko Horní Mísečky, sjezdovky                        | SPORNÉ (klíč střediska)     |
| `chata-hradecanka`      | doloženo (Firmy.cz samostatný záznam „restaurace")             | ne — „hned u stejnojmenného svahu", obec ji vede mezi restauracemi | SPORNÉ S KLÍČEM         |
| `horska-chata-dimrovka` | **nedoloženo** (restaurace v penzionu, přístup zvenčí nikde)   | ne — „přímo u sjezdové tratě Klondike", cyklostezky            | NEZAŘAZOVAT                 |

**Nález dne, a je to riziko duplicity, ne drobnost.** Doména `stopamisecky.com`
kandidáta `chata-stopa` nese v titulku stránky **„Rerstaurace | Chata Mísečky |
Vítkovice"** — tedy jméno jiného kandidáta téhož koše (`chata-misecky`, vlastní
web `chatamisecky.cz`, Vítkovice 143). OSM body jsou od sebe **~465 m**, jsou to
tedy dvě různá místa, ale weby na sebe ukazují. Tři možnosti: jeden provozovatel
a dva objekty; bufet Stopa jako provozovna Chaty Mísečky; překlep v titulku cizí
šablony. **Bezobslužně to doložit nejde** — `chatamisecky.cz` zakazuje čtení
robotům, kontaktní podstránka Stopy se nenačetla. Do rozhodnutí se `chata-stopa`
nepovyšuje; jinak by vznikla táž duplicita jako u Portášek.

**Vzor z 26. 8. platí dál a přibyl mu protipól.** Včera se tag `amenity`
rozpadl třikrát ze šesti (tvrdil občerstvení, prameny ne) — dnes se u Dimrovky
rozpadl počtvrté, a to týmž způsobem jako u Boudy Míla: restaurace v objektu je,
přístup veřejnosti nikde. **Zato u kandidátů s vlastním webem v OSM je doklad
opravdu levnější:** čtyři z pěti měly veřejné občerstvení doložené a dva z nich
rovnou i s otvírací dobou rozlišující ubytované od neubytovaných. Pořadí „nejdřív
ti s webem" se osvědčilo, dá se v něm pokračovat.

**Klíč střediska se koncentruje na Horních Mísečkách.** `chata-misecky` a
`chata-stopa` stojí obě tam a obě na tuhle otázku visí; ve stejném koši čeká
`pension-jilemnicka-bouda` a `restaurace-havlova-bouda`. Jedna Michalova odpověď
rozhodne rovnou celý shluk. Rozdíl proti Vítkovicím a Rokytnici (Sasanka, Chata
Eliška, Hubertka) je, že **Horní Mísečky nejsou obec, ale horská osada v 1000 m**.

**Stav koše B po dvou čteních: 42 položek — 4 parkují, 11 přečteno, 27 zbývá.**

## KOŠ B — třetí čtení (28. 8. 2026): sedm kandidátů s webem v OSM, a jeden z nich není z Krkonoš

Pokračování podle „Příště" z 27. 8.: dojet kandidáty, u kterých OSM nese vlastní
web. Přečteno sedm, metoda beze změny (WebSearch, pak otevřené stránky; vše
`verified: false`, citace s URL zapsané přímo do `interniPoznamky` kandidáta; do
`data/chaty/` se nesáhlo). Osmý, `chata-karkonoska`, zůstal nepřečtený — došel
čas.

| kandidát                   | občerstvení pro veřejnost                                       | role na trase                                                     | návrh redakci                   |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- |
| `schronisko-wysoki-kamien` | **doloženo** (PTTK: „funguje jako skromný bufet")                | **doloženo** — Główny Szlak Sudecki, 1056 m                         | **POVÝŠIT**                     |
| `jestrebi-bouda`           | **doloženo** (bufet Po–Pá 11–16, So 10–22, Ne 10–15; KČT Úpice)  | **doloženo** — hřeben Jestřebích hor, 700 m                         | **JINÁ OBLAST** (viz níž)       |
| `velke-pardubicke-boudy`   | doloženo (výletní portál: „další možnost občerstvení")           | doloženo — po zelené k rozcestí Nad Modrými kameny                  | k ruční kontrole, sklon POVÝŠIT |
| `bouda-pod-snezkou`        | **nedoloženo** (OSM tvrdí restauraci, web mluví o ubytovaných)   | **doloženo nejlíp ze všech** — samota na konci Obřího dolu, modrá   | k ruční kontrole                |
| `sokoli-boudy`             | doloženo (obecní web vede mezi restauracemi obce, Po–Ne 11–23)   | nedoloženo — Dolní Malá Úpa                                         | k ruční kontrole                |
| `pension-jilemnicka-bouda` | doloženo (Firmy.cz aktivní samostatný záznam, 70 míst)           | ne — středisko Horní Mísečky                                        | SPORNÉ (klíč střediska)         |
| `restaurace-havlova-bouda` | doloženo (Firmy.cz aktivní: „restauraci v horské chatě")         | ne — Pec pod Sněžkou 8, středisko                                   | SPORNÉ (klíč střediska)         |

**Nález dne: `jestrebi-bouda` splňuje klíč, ale není z Krkonoš.** Souřadnice
50,5612 / 16,0361 leží v jihovýchodním rohu krkonošského okna (`bbox` je
50,55–50,87 / 15,3–16,05 v `scripts/oblasti.ts`) — je to **hřeben Jestřebích hor
u Radvanic**, vzdušnou čarou 25–30 km od krkonošského hřebene. Přitom je to
z celého dnešního čtení druhý nejčistší případ podle klíče: **víkendový bufet
a celoroční turistická ubytovna, provozovatel KČT Úpice**, otvírací doba na
vlastním webu se shoduje s OSM tagem. Nepovyšovat do `krkonose` a nevyřazovat —
podržet pro **DATA-29** (přesahové oblasti) a **DATA-41**, kde Michal sám
jmenoval Broumovsko. Ukazuje to i mez okna: rezerva „až po Rýchory" sahá o jedno
pohoří dál, než se čekalo.

**Oprava zápisu z 27. 8.:** včerejší oddíl i deník řadí `restaurace-havlova-bouda`
do shluku klíče střediska na **Horních Mísečkách**. To je omyl — Havlova bouda je
podle souřadnic (50,6866 / 15,7335) i podle adresy „Pec pod Sněžkou 8"
v **Peci pod Sněžkou**, přes celé pohoří od Mísečet. Mísečkový shluk má tedy tři
členy (`chata-misecky`, `chata-stopa`, `pension-jilemnicka-bouda`), ne čtyři;
u Havlovy boudy platí otázka klíče střediska pro Pec.

**Jmenný koš se u jednoho kandidáta prokazatelně mýlil.**
`pension-jilemnicka-bouda` je v koši „MIMO KLÍČ dle jména" se signálem
„ubytování bez veřejné služby — »Pension«". Doklad ukazuje opak: Firmy.cz vede
aktivní **samostatný záznam na restauraci** se 70 místy a vlastní web se tituluje
prostě „Jilemnická Bouda". Předtřídění podle jména je tedy pořadí čtení, ne
rozhodnutí — a stojí za to to mít v hlavě u zbylých 46 položek toho koše.

**Vzor „samostatný záznam restaurace na Firmy.cz" se potvrdil potřetí.** Po
Chatě Hradečance a Chatě Mísečce ho dnes mají `sokoli-boudy`,
`pension-jilemnicka-bouda` i `restaurace-havlova-bouda`. Je to zatím nejlevnější
doklad veřejného občerstvení, který se dá získat bezobslužně — a na rozdíl od
tagu `amenity` se zatím ani jednou nerozpadl.

**Zato `amenity` se rozpadl popáté** — u `bouda-pod-snezkou`: tag tvrdí
`restaurant`, vlastní web mluví o stravování ubytovaných a přístup kolemjdoucích
neuvádí. Zároveň má tenhle kandidát **nejlépe doloženou roli na trase z celého
koše** (samota na konci Obřího dolu, modrá značka, „na vrchol nejblíž").
Doložené půlky klíče se tedy dnes prohodily.

**Dvakrát rozpor v telefonu proti OSM:** `sokoli-boudy` (OSM +420 775 252 267 ×
web +420 731 186 000) a `bouda-pod-snezkou` (OSM +420 491 617 077, předvolba
Náchodska, × web +420 734 151 546). Při povyšování brát číslo z vlastního webu.

**Tři domény, na které sandbox nedosáhl:** `sokoliboudy.cz` a `havlovabouda.cz`
(robots.txt fetch timeout) a `wysokikamien.com.pl` (**nekonečný redirect
https → http**, 302 na tutéž adresu — nový vzor, dosud jsme viděli jen
robots.txt). `pardubickeboudy.cz` se nepřečetl z jiného důvodu: doména neprošla
přes WebSearch, takže ji WebFetch odmítl otevřít.

**Stav koše B po třech čteních: 42 položek — 4 parkují, 18 přečteno, 20 zbývá.**

## KOŠ B — čtvrté čtení (29. 8. 2026): devět kandidátů, dva k povýšení a tři beze stopy

Dočtena `chata-karkonoska` z minula a k ní osm kandidátů **bez webu v OSM** —
tedy poprvé skupina, kde je doklad znatelně dražší. Metoda beze změny (WebSearch,
pak otevřené stránky; vše `verified: false`, citace s URL zapsané přímo do
`interniPoznamky` kandidáta; do `data/chaty/` se nesáhlo).

| kandidát                   | občerstvení pro veřejnost                                            | role na trase                                                   | návrh redakci                     |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `dvorakova-bouda`          | **doloženo doslova** („restaurace, přístupné všem příchozím hostům")  | doloženo — 1 235 m, Sedmidolí pod Petrovou boudou                 | **POVÝŠIT**                       |
| `mumlavska-bouda`          | **doloženo** (restaurace, zavírá k 17:00 = shoda s OSM tagem)         | **doloženo** — u Mumlavského vodopádu                             | **POVÝŠIT**                       |
| `hoffmanovy-boudy`         | slabě (uživatelský pramen: „restaurace s pensionem")                  | **doloženo** — rozcestník pěších, běžeckých i cyklotras, 794 m    | k ruční kontrole, sklon POVÝŠIT   |
| `hladik-ziza-janska-bouda` | **doloženo výborně** (Firmy.cz aktivní, dvě kategorie, Čt–Ne)         | nedoloženo — Janské Lázně, středisko                              | k ruční kontrole (klíč střediska) |
| `chata-tyrolska`           | doloženo (městský portál: „mała gastronomia")                         | sporná — u dolní stanice lanovky na Szrenicu                      | SPORNÉ, sklon NE (je to stánek)   |
| `chata-karkonoska`         | doloženo (celoroční restaurace, 200 míst, svatby)                     | ne — Wolna 4, zástavba Karpacze, zázemí tříhvězdičkového hotelu   | NEPOVYŠOVAT (klíč střediska)      |
| `bar-zielona-chatka`       | nedoloženo                                                            | nedoloženo                                                        | NEROZHODNUTO — nic nenalezeno     |
| `chata-skrzata`            | nedoloženo                                                            | nedoloženo                                                        | NEROZHODNUTO — nic nenalezeno     |
| `chata-u-sportu`           | nedoloženo                                                            | nedoloženo                                                        | NEROZHODNUTO — nic nenalezeno     |

**Nález dne: poprvé máme přístup veřejnosti doložený doslovnou větou, ne
odvozením.** Kudy z nudy píše u Dvořákovy boudy „V restauraci, **přístupné všem
příchozím hostům**, na vás čeká spousta dobrot nejen z masa". Přesně tahle věta
nám u `bouda-pod-snezkou` chyběla a kvůli jejímu chybění tam klíč nespadl. Stojí
za to si to zapamatovat jako **nejsilnější možný doklad druhé půlky klíče** —
a hledat ho cíleně, protože ho očividně některé portály uvádějí.

**Vzor „samostatný záznam restaurace na Firmy.cz" se poprvé rozpadl — a je
důležité, jak.** U `mumlavska-bouda` samostatný záznam „Restaurace Mumlavská
Bouda" existuje, ale je **neaktivní** („This business or branch is no longer
active"), zatímco na téže adrese Harrachov 270 běží aktivní záznam pod jménem
bez slova „Restaurace". Po třech čteních, kdy vzor držel, je tedy nutné ho
upřesnit: **existence samostatného záznamu nestačí, musí se číst i jeho stav.**
Kdyby se tohle přehlédlo, dostali bychom u jinak dobrého kandidáta přesně
opačný závěr, než jaký je správný.

**Nezávislé potvrzení totožnosti přes e-mail.** U `hladik-ziza-janska-bouda` se
e-mail ve Firmy.cz (`richv@seznam.cz`) shoduje s e-mailem v OSM tagu. Je to
levný způsob, jak vyloučit shodu jmen — vedle telefonu druhý použitelný
identifikátor. Připsáno k metodám.

**Tři kandidáti nemají na webu žádnou stopu, a je to samostatné zjištění.**
`bar-zielona-chatka`, `chata-skrzata` i `chata-u-sportu` nevrátily ani jeden
použitelný výsledek. Zapsáno je to u nich i s tím, **co se hledalo** — aby to
příští běh neopakoval. **Absence dokladu není doklad absence:** žádný z nich se
nevyřazuje. U `chata-u-sportu` stojí za zmínku vysoké OSM ID (node/13970697329),
tedy nedávno vložený bod — může jít o čerstvý podnik. U `chata-skrzata` je past
ve jméně: vyhledávače nabízejí stejnojmenný objekt v Mikołajkách na Mazurech.

**Klíč střediska si dnes vyžádal třetí a čtvrtou položku.** K mísečkovému shluku
a Havlově boudě přibyly `chata-karkonoska` (Karpacz) a `chata-tyrolska`
(Szklarska Poręba), okrajově i `hladik-ziza-janska-bouda` (Janské Lázně).
**Nerozhodnutá otázka pro Michala tím drží už pět kandidátů ve třech střediscích
na obou stranách hranice** — z jednotlivosti se stala kategorie.

**Nedosažitelné domény, nově:** `krkonose.eu` (robots.txt fetch timeout) — mrzí
to dvakrát, protože oficiální portál vede výletní trasu „Z Janských Lázní přes
Rudolfovo údolí na Hoffmanovy boudy", což je přesně ten druhý pramen, který by
u `hoffmanovy-boudy` doplnil slabší půlku klíče. Dál `vrcholovka.cz` (týž
důvod). Obojí zkusit z jiné sítě.

**Stav koše B po čtyřech čteních: 42 položek — 4 parkují, 27 přečteno, 11 zbývá.**

## Koše podle OSM tagů

### A · OSM typ horské chaty (`alpine_hut` / `wilderness_hut`) — brát první — 7 _(odpracován 25. 8. 2026, viz oddíl výš)_

| kandidát                          | nový 22. 8. | rozhodující OSM tagy                                                                                                                                                                                                                         | web z OSM                |
| --------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `chata-eliska` — Chata Eliška     | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | https://chata-eliska.cz/ |
| `chata-hubertka` — Chata Hubertka | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | www.chatahubertka.cz     |
| `chata-mamut` — Chata Mamut       | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | —                        |
| `javorka` — Javorka               | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | —                        |
| `lokomotiva` — Lokomotiva         | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | —                        |
| `sasanka` — Sasanka               | —           | `tourism=alpine_hut`                                                                                                                                                                                                                         | —                        |
| `zaly` — Žalý                     | —           | `tourism=alpine_hut`; `amenity=restaurant`; `opening_hours=Dec 25-Jan 31 Mo-Su 10:00-16:00; Feb-Mar Mo-Su 10:00-16:30; Apr,Oct-Nov Sa-Su 10:00-16:00; May-Jun,Sep Tu-Su 10:00-17:00; Jul-Aug Mo-Su 10:00-17:30; Dec 01-24 Sa-Su 10:00-16:00` | http://www.zaly.cz/      |

### B · OSM doloží veřejné občerstvení (`amenity=restaurant/cafe/pub/fast_food`…) — 42

| kandidát                                                               | nový 22. 8. | rozhodující OSM tagy                                                                                                                        | web z OSM                              |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `bar-zielona-chatka` — Bar Zielona Chatka                              | ano         | `amenity=fast_food`; `opening_hours=10:00-20:00`                                                                                            | —                                      |
| `bouda-mala-upa` — Bouda Malá Úpa                                      | ano         | `amenity=restaurant`                                                                                                                        | https://boudamalaupa.cz/               |
| `bouda-mila` — Bouda Míla                                              | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `bouda-pod-snezkou` — Bouda pod Snežkou                                | ano         | `amenity=restaurant`                                                                                                                        | https://www.boudapodsnezkou.cz/        |
| `chata-boruvka` — Chata Borůvka                                        | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `chata-ducha-gor` — Chata Ducha Gór                                    | ano         | `amenity=fast_food`; `cuisine=kebab`                                                                                                        | —                                      |
| `chata-hradecanka` — Chata Hradečanka                                  | ano         | `tourism=wine_cellar`; `amenity=restaurant`; `cuisine=italian;pizza;coffee;wine`; `opening_hours=Mo-Su 11:00-22:00`                         | https://www.hradecanka.cz/             |
| `chata-karkonoska` — Chata Karkonoska                                  | ano         | `amenity=restaurant`; `cuisine=polish`                                                                                                      | https://chata.hotel-karkonosze.com.pl/ |
| `chata-misecky` — Chata Mísečky                                        | ano         | `tourism=guest_house`; `amenity=restaurant`; `cuisine=regional`; `opening_hours=Mo-Su 11:00-22:00`                                          | https://www.chatamisecky.cz/           |
| `chata-skrzata` — Chata Skrzata                                        | ano         | `amenity=fast_food`                                                                                                                         | —                                      |
| `chata-stopa` — Chata Stopa                                            | ano         | `amenity=restaurant`                                                                                                                        | https://www.stopamisecky.com/          |
| `chata-tyrolska` — Chata Tyrolska                                      | ano         | `amenity=fast_food`                                                                                                                         | —                                      |
| `chata-u-sportu` — Chata U Sportů                                      | ano         | `amenity=fast_food`                                                                                                                         | —                                      |
| `dvorakova-bouda` — Dvořákova bouda                                    | ano         | `tourism=chalet`; `amenity=restaurant`; `cuisine=regional`                                                                                  | —                                      |
| `hladik-ziza-janska-bouda` — Hladík & Žíža Janská Bouda                | ano         | `amenity=fast_food`                                                                                                                         | —                                      |
| `hoffmanovy-boudy` — Hoffmanovy Boudy                                  | ano         | `amenity=restaurant`; `cuisine=regional`                                                                                                    | —                                      |
| `horska-chata-dimrovka` — horská chata Dimrovka                        | ano         | `tourism=guest_house`; `amenity=restaurant`                                                                                                 | https://www.dimrovka.cz/               |
| `horska-chata-portasky` — Horská chata Portášky                        | ano         | `amenity=restaurant`; `ele=1050`                                                                                                            | http://www.portasky.cz/                |
| `horska-chata-poutnik` — Horská chata Poutník                          | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `horska-sluzba-cerny-dul` — Horská služba Černý Důl                    | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `horska` — Horská                                                      | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `hotel-bouda-jana` — Hotel Bouda Jana                                  | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `jestrebi-bouda` — Jestřebí bouda                                      | ano         | `tourism=chalet`; `amenity=pub`; `opening_hours=Jul-Aug Mo-Th 11:00-16:00; Jul-Aug Fr 11:00-22:00; Sa 10:00-22:00; Su 10:00-15:00; PH open` | http://www.jestrebibouda.cz/           |
| `johannova-bouda` — Johannova bouda                                    | ano         | `amenity=restaurant`; `cuisine=regional;international`                                                                                      | —                                      |
| `karczma-hutnika` — Karczma Hutnika                                    | ano         | `amenity=restaurant`                                                                                                                        | https://karczmahutnika.pl/             |
| `mumlavska-bouda` — Mumlavská Bouda                                    | ano         | `amenity=fast_food`; `cuisine=regional`; `opening_hours=Mo-Su 10:00-17:00`                                                                  | —                                      |
| `pension-jilemnicka-bouda` — Pension Jilemnická bouda                  | ano         | `tourism=guest_house`; `amenity=restaurant`; `cuisine=regional`; `opening_hours=Mo-Su 09:00-21:00`                                          | https://www.jilemnickabouda.cz/        |
| `prezesowa-chata` — Prezesowa Chata                                    | ano         | `amenity=biergarten`                                                                                                                        | —                                      |
| `restaurace-havlova-bouda` — Restaurace Havlova bouda                  | ano         | `amenity=restaurant`                                                                                                                        | https://www.havlovabouda.cz/           |
| `restaurace-labska-bouda` — Restaurace Labska Bouda                    | ano         | `amenity=restaurant`; `opening_hours=12:00-21:00`                                                                                           | —                                      |
| `schronisko-gorskie-dom-slaski` — Schronisko Górskie Dom Śląski        | ano         | `amenity=fast_food`                                                                                                                         | —                                      |
| `schronisko-szrenica-1362-m-n-p-m` — Schronisko Szrenica 1362 m n.p.m. | ano         | `amenity=cafe`; `cuisine=crepe`                                                                                                             | —                                      |
| `schronisko-wysoki-kamien` — Schronisko Wysoki Kamień                  | ano         | `amenity=cafe`; `opening_hours=Apr-Sep Mo-Su 10:00-18:00; Oct-Mar Mo-Su 10:00-16:00`; `ele=1058`                                            | http://www.wysokikamien.com.pl         |
| `sokoli-boudy` — Sokolí boudy                                          | ano         | `tourism=guest_house`; `amenity=restaurant`; `cuisine=local`; `opening_hours=09:30-22:00`                                                   | https://www.sokoliboudy.cz/            |
| `sudecka-chata-u-prezesa` — Sudecka chata u Prezesa                    | ano         | `amenity=restaurant`; `opening_hours=Mo-Su 09:00-22:00`                                                                                     | —                                      |
| `swojska-chata` — Swojska Chata                                        | ano         | `amenity=restaurant`; `cuisine=regional`                                                                                                    | —                                      |
| `szklana-chata` — Szklana chata                                        | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `trejbalova-bouda` — Trejbalova bouda                                  | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `turisticka-chata` — Turistická chata                                  | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `velke-pardubicke-boudy` — Velké pardubické boudy                      | ano         | `amenity=restaurant`; `cuisine=regional`                                                                                                    | https://pardubickeboudy.cz/            |
| `wiejska-chata` — Wiejska chata                                        | ano         | `amenity=restaurant`                                                                                                                        | —                                      |
| `zizkova-bouda` — Žižkova bouda                                        | ano         | `amenity=restaurant`                                                                                                                        | —                                      |

### D · jiné tagy — musí přečíst člověk — 2

| kandidát                                                            | nový 22. 8. | rozhodující OSM tagy                                                                                                                                                                                                       | web z OSM                      |
| ------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `rozhledna-zaly` — Rozhledna Žalý                                   | —           | `tourism=attraction`; `opening_hours=Dec 25-Jan 31 Mo-Su 10:00-16:00; Feb-Mar Mo-Su 10:00-16:30; Apr,Oct-Nov Sa-Su 10:00-16:00; May-Jun,Sep Tu-Su 10:00-17:00; Jul-Aug Mo-Su 10:00-17:30; Dec 01-Dec 24 Sa-Su 10:00-16:00` | http://www.zaly.cz/            |
| `stezka-korunami-stromu-krkonose` — Stezka korunami stromů Krkonoše | —           | `tourism=viewpoint`; `ele=826`                                                                                                                                                                                             | https://www.stezkakrkonose.cz/ |

### E · OSM element se v exportech nedohledal — 5

| kandidát                                  | nový 22. 8. | rozhodující OSM tagy | web z OSM |
| ----------------------------------------- | ----------- | -------------------- | --------- |
| `hotel-stumpovka` — Hotel Štumpovka       | —           | —                    | —         |
| `hrncirske-boudy` — Hrnčířské boudy       | —           | —                    | —         |
| `josefova-bouda` — Josefova bouda         | —           | —                    | —         |
| `modrokamenna-bouda` — Modrokamenná bouda | —           | —                    | —         |
| `postovna-na-snezce` — Poštovna na Sněžce | —           | —                    | —         |

### C · OSM zná jen ubytování (`guest_house`, `chalet`, `hotel`, `apartment`) — 131

| kandidát                                                                                  | nový 22. 8. | rozhodující OSM tagy                                                    | web z OSM                                                               |
| ----------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `amelkowa-chata` — Amelkowa chata                                                         | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `apartamenty-every-sky` — Apartamenty Every Sky                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `apartman-u-potoka` — Apartmán U potoka                                                   | ano         | `tourism=chalet`                                                        | https://www.ubytovanikrkonose-marsov.cz/                                |
| `apartmany-tri-boudy` — Apartmány tři boudy                                               | ano         | `tourism=hotel`                                                         | https://www.triboudy.cz                                                 |
| `arnika` — Arnika                                                                         | ano         | `tourism=chalet`                                                        | —                                                                       |
| `baronova-bouda` — Baronova Bouda                                                         | ano         | `tourism=guest_house`                                                   | http://www.ski-baron.cz                                                 |
| `bergpoolhaus` — Bergpoolhaus                                                             | ano         | `tourism=chalet`                                                        | https://www.bergpoolhaus.eu/                                            |
| `bouda-jirinka` — Bouda Jiřinka                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `bouda-mama` — Bouda Máma                                                                 | ano         | `tourism=hotel`                                                         | https://www.boudamama.cz/                                               |
| `bouda-sestidomi` — bouda Šestidomí                                                       | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `bouda-u-lesa` — Bouda U lesa                                                             | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `bouda-v-obrim-dole` — Bouda v Obřím Dole                                                 | ano         | `tourism=guest_house`                                                   | https://boudavobrimdole.cz                                              |
| `browarowka` — Browarówka                                                                 | ano         | `tourism=chalet`                                                        | https://www.browarowka.pl/                                              |
| `capkova-chata` — Čapkova chata                                                           | ano         | `tourism=guest_house`                                                   | https://chaty-krkonose.cz/                                              |
| `chalupa-baba-jaga` — Chalupa Baba Jaga                                                   | ano         | `tourism=apartment`                                                     | —                                                                       |
| `chalupa-marsovka` — Chalupa Maršovka                                                     | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chalupa-sport` — Chalupa Sport                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chalupa-u-medveda` — Chalupa u Medvěda                                                   | ano         | `tourism=chalet`                                                        | http://www.chalupaumedveda.cz                                           |
| `chalupa-u-rihu` — Chalupa U Říhů                                                         | ano         | `tourism=chalet`                                                        | http://www.chalupaurihu.cz                                              |
| `chata-advokatka` — chata Advokátka                                                       | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-baraba` — Chata Baraba                                                             | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-baronka` — Chata Baronka                                                           | ano         | `tourism=chalet`                                                        | http://www.ski-baron.cz                                                 |
| `chata-beata` — Chata Beata                                                               | ano         | `tourism=chalet`                                                        | http://www.chatabeata.cz                                                |
| `chata-biegacza` — Chata Biegacza                                                         | ano         | `tourism=guest_house`                                                   | https://www.chatabiegacza.pl/                                           |
| `chata-botas` — Chata Botas                                                               | ano         | `tourism=chalet`                                                        | https://www.e-chalupy.cz/krkonose/chata-botas-stazne-pronajem-15627.php |
| `chata-ferra` — Chata FERRA                                                               | ano         | `tourism=chalet`                                                        | http://www.chataferra.cz                                                |
| `chata-gall` — Chata Gall                                                                 | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chata-gracie` — Chata Grácie                                                             | ano         | `tourism=guest_house`                                                   | https://www.janskelazne.cz/cz/chata-gracie-janske-lazne-77.html         |
| `chata-honzik` — Chata Honzík                                                             | ano         | `tourism=chalet`                                                        | www.chatahonzik.cz                                                      |
| `chata-izerska` — Chata Izerska                                                           | ano         | `tourism=hotel`                                                         | https://www.chataizerska.pl/                                            |
| `chata-jasanka` — chata Jasanka                                                           | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-jerabinka` — Chata Jeřabinka                                                       | ano         | `tourism=guest_house`                                                   | https://www.chatajerabinka.cz/                                          |
| `chata-jestrab` — Chata Jestřáb                                                           | ano         | `tourism=guest_house`                                                   | https://plus.google.com/108159705772761019533/about                     |
| `chata-jitka` — Chata Jitka                                                               | ano         | `tourism=chalet`                                                        | http://www.chatajitka.cz                                                |
| `chata-kabrtova-bouda` — Chata Kábrtova Bouda                                             | ano         | `tourism=chalet`                                                        | https://www.janskelazne.cz/cz/chata-kabrtova-bouda-cerna-hora-19.html   |
| `chata-karolinka` — Chata Karolínka                                                       | ano         | `tourism=guest_house`                                                   | https://www.chatakarolinka.cz/                                          |
| `chata-katerina` — Chata Kateřina                                                         | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-kovarna` — Chata Kovárna                                                           | ano         | `tourism=chalet`                                                        | https://www.e-chalupy.cz/krkonose/chata-horni-marsov-kovarna-1586.php   |
| `chata-kubik` — Chata Kubík                                                               | ano         | `tourism=chalet`                                                        | http://www.chatakubik.cz/                                               |
| `chata-lom` — Chata Lom                                                                   | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chata-medika-2411927307` — Chata Medika                                                  | ano         | `tourism=chalet`                                                        | http://www.alberice.slinet.cz                                           |
| `chata-medika` — Chata Medika                                                             | ano         | `tourism=chalet`                                                        | http://www.chatamedika.cz/                                              |
| `chata-opavia` — Chata Opavia                                                             | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-orlik` — Chata Orlik                                                               | ano         | `tourism=hotel`                                                         | —                                                                       |
| `chata-pod-lipami` — Chata pod lipami                                                     | ano         | `tourism=guest_house`                                                   | https://www.chatapodlipami.cz/                                          |
| `chata-popelka` — Chata Popelka                                                           | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-protez` — chata Protěž                                                             | ano         | `tourism=guest_house`                                                   | https://www.dominant-protez.cz/chataprotez                              |
| `chata-silnicka` — Chata Silnička                                                         | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-solunka` — Chata Solunka                                                           | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-spindler` — Chata Špindler                                                         | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chata-sudecka-z-widokiem` — Chata Sudecka z widokiem                                     | ano         | `tourism=guest_house`                                                   | https://chatasudecka.pl/                                                |
| `chata-tereza` — Chata Tereza                                                             | ano         | `tourism=guest_house`                                                   | https://www.chatatereza.eu/                                             |
| `chata-tobisek` — Chata Tobísek                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chata-u-kohouta` — Chata U Kohouta                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `chata-uvaly` — Chata Úvaly                                                               | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `chata-varta` — Chata Varta                                                               | ano         | `tourism=guest_house`                                                   | http://www.chatavarta.cz                                                |
| `chata-viktorka` — Chata Viktorka                                                         | ano         | `tourism=chalet`                                                        | https://chataviktorka.cz/                                               |
| `chata-votocka` — Chata Votočka                                                           | ano         | `tourism=guest_house`; `ele=750`                                        | https://www.chatavotocka.cz                                             |
| `chata-za-wsia` — Chata za Wsią                                                           | ano         | `tourism=hotel`                                                         | https://www.chatazawsia.com/                                            |
| `chata-zapiecek` — Chata Zapiecek                                                         | ano         | `tourism=hotel`                                                         | —                                                                       |
| `chata` — Chata                                                                           | ano         | `tourism=hotel`                                                         | —                                                                       |
| `contemplace` — Contemplace                                                               | ano         | `tourism=chalet`                                                        | https://www.contemplace.pl                                              |
| `czarodziejska-gora` — Czarodziejska Góra                                                 | ano         | `tourism=chalet`                                                        | https://czarodziejskagora.eu                                            |
| `dalibor` — Dalibor                                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `decinska-bouda` — Děčínská bouda                                                         | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `dom-pod-jaworami` — Dom Pod Jaworami                                                     | ano         | `tourism=chalet`                                                        | http://dompodjaworami.pl/                                               |
| `domek-w-karkonoszach` — Domek w Karkonoszach                                             | ano         | `tourism=chalet`                                                        | —                                                                       |
| `dziewiecsil` — Dziewiećsił                                                               | ano         | `tourism=chalet`                                                        | —                                                                       |
| `felicity-grand-apartments` — Felicity Grand Apartments                                   | ano         | `tourism=chalet`                                                        | —                                                                       |
| `gorska-chata` — Górska Chata                                                             | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `goryczka` — Goryczka                                                                     | ano         | `tourism=chalet`                                                        | —                                                                       |
| `grohmanova-bouda` — Grohmanova bouda                                                     | ano         | `tourism=guest_house`                                                   | http://www.grohmanovabouda.cz                                           |
| `hajenka-haida` — Hájenka Haida                                                           | ano         | `tourism=guest_house`                                                   | https://www.chatahaida.cz/                                              |
| `hancova-bouda` — Hančova bouda                                                           | ano         | `tourism=hotel`                                                         | https://hancovabouda.cz/                                                |
| `happy-house` — Happy House                                                               | ano         | `tourism=chalet`                                                        | —                                                                       |
| `havlova-bouda` — Havlova bouda                                                           | ano         | `tourism=guest_house`                                                   | https://havlovabouda.cz/                                                |
| `hoffmannova-bouda` — Hoffmannova bouda                                                   | ano         | `tourism=guest_house`                                                   | https://www.hoffmanovabouda.cz/                                         |
| `holiday-park-resort` — Holiday Park & Resort                                             | ano         | `tourism=chalet`                                                        | https://holidaypark.pl/uzdrowisko-cieplice-zdroj                        |
| `horska-chata-hanapetr` — Horská chata HANAPETR                                           | ano         | `tourism=chalet`                                                        | http://hanapetr.cernypetr.com                                           |
| `hotel-cerna-bouda` — Hotel ČERNÁ BOUDA                                                   | ano         | `tourism=hotel`                                                         | https://www.cernabouda.cz/                                              |
| `hotel-spindlerova-bouda-depandance` — Hotel Špindlerova bouda - Depandance               | ano         | `tourism=hotel`                                                         | https://www.spindlerovabouda.cz/                                        |
| `hottur-osrodek-wczasowo-wypoczynkowy` — HOTTUR Ośrodek Wczasowo-Wypoczynkowy             | ano         | `tourism=chalet`                                                        | https://www.hottur.pl/                                                  |
| `hribeci-bouda` — Hříběcí Bouda                                                           | ano         | `tourism=hotel`                                                         | —                                                                       |
| `iskierka` — Iskierka                                                                     | ano         | `tourism=chalet`                                                        | www.iskierkadomek.pl                                                    |
| `janova-bouda` — Janova bouda                                                             | ano         | `tourism=guest_house`                                                   | https://www.skifamily.cz/                                               |
| `java` — Java                                                                             | ano         | `tourism=chalet`                                                        | —                                                                       |
| `jawa` — Jawa                                                                             | ano         | `tourism=chalet`                                                        | https://chatajawa.cz/                                                   |
| `krausovy-boudy` — Krausovy boudy                                                         | ano         | `tourism=guest_house`                                                   | —                                                                       |
| `lesna-chata` — Leśna Chata                                                               | ano         | `tourism=chalet`                                                        | https://www.chatalesna.pl/                                              |
| `lidicka-bouda` — Lidická bouda                                                           | ano         | `tourism=hotel`                                                         | https://www.lidickabouda.cz/                                            |
| `lilia` — Lilia                                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `lodge-1` — Lodge 1                                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `lodge-2` — Lodge 2                                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `lodge-3` — Lodge 3                                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `ludvikova-bouda` — Ludvikova bouda                                                       | ano         | `tourism=chalet`                                                        | http://www.ludvikovabouda.com/                                          |
| `lyzarsky-vlek-ubytovani` — Lyžařský vlek - ubytování                                     | ano         | `tourism=chalet`                                                        | https://www.vlekradvanice.cz/                                           |
| `makuka` — Makuka                                                                         | ano         | `tourism=chalet`                                                        | —                                                                       |
| `ministerska` — Ministerská                                                               | ano         | `tourism=chalet`                                                        | https://ministerska.cz/                                                 |
| `mlodziezowe-schronisko-w-staniszowie` — Młodzieżowe Schronisko w Staniszowie             | ano         | `tourism=guest_house`                                                   | https://www.schronisko.podgorzyn.pl/                                    |
| `mlynarka-ubytovani-v-krkonosich` — Mlynářka, ubytování v krkonoších                      | ano         | `tourism=chalet`                                                        | https://mlynarka-krkonose.cz/                                           |
| `mohwaldova-bouda` — Möhwaldova bouda                                                     | ano         | `tourism=hotel`                                                         | —                                                                       |
| `mounttain-holiday-lodges` — Mounttain Holiday Lodges                                     | ano         | `tourism=chalet`                                                        | —                                                                       |
| `osada-sniezka` — Osada Śnieżka                                                           | ano         | `tourism=chalet`; `amenity=spa`; `opening_hours=Mo-Su 7:00 - 22:00`     | http://www.osada-sniezka.com/                                           |
| `ostoja-karkonoska` — Ostoja Karkonoska                                                   | ano         | `tourism=chalet`                                                        | https://ostojakarkonoska.com.pl                                         |
| `pension-chata-lovrana` — Pension Chata Lovrana                                           | ano         | `tourism=guest_house`                                                   | http://www.lovrana.eu                                                   |
| `penzion-karlova-chata` — Penzion Karlova chata                                           | ano         | `tourism=guest_house`                                                   | http://www.karlovachata.cz                                              |
| `penzion-modrokamenna-bouda` — Penzion Modrokamenná bouda                                 | ano         | `tourism=guest_house`                                                   | http://www.penzion-modrokamenna-bouda-janske-lazne.az-ubytovani.net/    |
| `pod-zielonym-dachem` — Pod Zielonym Dachem                                               | ano         | `tourism=chalet`                                                        | http://www.podzielonymdachem.i-noclegi.pl/                              |
| `przystan-nad-bobrem` — Przystań nad Bobrem                                               | ano         | `tourism=chalet`                                                        | —                                                                       |
| `rozeniec` — Różeniec                                                                     | ano         | `tourism=chalet`                                                        | —                                                                       |
| `schronisko-liczyrzepa` — Schronisko Liczyrzepa                                           | ano         | `tourism=hostel`                                                        | https://schronisko-liczyrzepa.pl/                                       |
| `schronisko-mlodziezowe-lubawia` — Schronisko Młodzieżowe LUBAWIA                         | ano         | `tourism=hostel`                                                        | —                                                                       |
| `schronisko-srebrny-potok` — Schronisko Srebrny Potok                                     | ano         | `tourism=hostel`                                                        | http://www.srebrny-potok.net/                                           |
| `sliwkowa-chata-sliwkowa-chata` — Śliwkowa Chata / Sliwkowa Chata                         | ano         | `tourism=hotel`                                                         | —                                                                       |
| `sokolska-chata-babeta` — Sokolská chata Babeta                                           | ano         | `tourism=chalet`                                                        | https://sokolponikla.cz/                                                |
| `sosnowy-szept` — Sosnowy Szept                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `sporthotel-svycarska-bouda` — Sporthotel Švýcarská bouda                                 | ano         | `tourism=hotel`                                                         | —                                                                       |
| `sruby-podspalov` — sruby Podspálov                                                       | ano         | `tourism=chalet`                                                        | —                                                                       |
| `szkolne-schronisko-mlodziezowe-plum` — Szkolne Schronisko Młodzieżowe PLUM               | ano         | `tourism=guest_house`; `opening_hours=Mo-Su 17:00-10:00`                | https://www.schronisko-plum.pl/                                         |
| `szkolne-schronisko-mlodziezowe-skalnik` — Szkolne Schronisko Młodzieżowe "Skalnik"       | ano         | `tourism=hostel`                                                        | https://www.schronisko-skalnik.pl/                                      |
| `szkolne-schronisko-mlodziezowe-wojtek` — Szkolne Schronisko Młodzieżowe "Wojtek"         | ano         | `tourism=guest_house`                                                   | https://schronisko-wojtek.pl/                                           |
| `szkolne-schronisko-mlodziezowe-zloty-widok` — Szkolne Schronisko Młodzieżowe ZŁOTY WIDOK | ano         | `tourism=guest_house`; `opening_hours=Mo-Su 17:00-10:00`                | https://www.schronisko-wojtek.pl/                                       |
| `turisticka-chata-lajdacek` — Turistická chata Lajdáček                                   | ano         | `tourism=chalet`                                                        | —                                                                       |
| `wellness-hotel-liberecka-bouda` — Wellness hotel LIBERECKÁ BOUDA                         | ano         | `tourism=hotel`; `ele=860`                                              | https://www.libereckabouda.cz/                                          |
| `widok-na-sniezke` — Widok na Śnieżkę                                                     | ano         | `tourism=chalet`                                                        | https://widoknasniezke.pl/                                              |
| `widokowo` — Widokowo                                                                     | ano         | `tourism=chalet`                                                        | https://www.widokowo-karpacz.pl/                                        |
| `wiilla-jagoda-jagniatkow` — Wiilla Jagoda Jagniątków                                     | ano         | `tourism=chalet`                                                        | https://willajagodajagniatkow.business.site/                            |
| `wioska-finska-kalevala` — Wioska Fińska Kalevala                                         | ano         | `tourism=chalet`; `opening_hours=Mo-Fr 12:00, Sa-Su 12:00, Sa-Su 14:00` | —                                                                       |
| `zacisze-pod-smielcem` — Zacisze Pod Śmielcem                                             | ano         | `tourism=chalet`                                                        | https://domkiwgorach.eu/                                                |
| `zielony-domek` — Zielony Domek                                                           | ano         | `tourism=chalet`                                                        | —                                                                       |
| `zinneckerovy-boudy` — Zinneckerovy Boudy                                                 | ano         | `tourism=chalet`                                                        | https://zinneckerovy-boudy.cz/                                          |

## Koše podle jména

Vygeneroval `npx tsx scripts/triaz-kandidatu.ts krkonose --md` 23. 8. 2026.
**Přegenerovat po každém povýšení nebo vyřazení** — publikované, odložené
i vyřazené kandidáty skript sám vynechává.

### NADĚJNÉ — vzít v triáži nejdřív (107)

| kandidát                                                                                  | země | signál                  |
| ----------------------------------------------------------------------------------------- | ---- | ----------------------- |
| `amelkowa-chata` — Amelkowa chata                                                         | pl   | jméno nese „chata"      |
| `bar-zielona-chatka` — Bar Zielona Chatka                                                 | pl   | jméno nese „Chatka"     |
| `baronova-bouda` — Baronova Bouda                                                         | cz   | jméno nese „Bouda"      |
| `bouda-mala-upa` — Bouda Malá Úpa                                                         | cz   | jméno nese „Bouda"      |
| `bouda-mama` — Bouda Máma                                                                 | cz   | jméno nese „Bouda"      |
| `bouda-mila` — Bouda Míla                                                                 | cz   | jméno nese „Bouda"      |
| `bouda-pod-snezkou` — Bouda pod Snežkou                                                   | cz   | jméno nese „Bouda"      |
| `bouda-sestidomi` — bouda Šestidomí                                                       | cz   | jméno nese „bouda"      |
| `bouda-u-lesa` — Bouda U lesa                                                             | cz   | jméno nese „Bouda"      |
| `bouda-v-obrim-dole` — Bouda v Obřím Dole                                                 | cz   | jméno nese „Bouda"      |
| `capkova-chata` — Čapkova chata                                                           | cz   | jméno nese „chata"      |
| `chata-advokatka` — chata Advokátka                                                       | cz   | jméno nese „chata"      |
| `chata-baraba` — Chata Baraba                                                             | cz   | jméno nese „Chata"      |
| `chata-biegacza` — Chata Biegacza                                                         | pl   | jméno nese „Chata"      |
| `chata-boruvka` — Chata Borůvka                                                           | cz   | jméno nese „Chata"      |
| `chata-ducha-gor` — Chata Ducha Gór                                                       | pl   | jméno nese „Chata"      |
| `chata-eliska` — Chata Eliška                                                             | cz   | typ z OSM: obsluhovana  |
| `chata-gracie` — Chata Grácie                                                             | cz   | jméno nese „Chata"      |
| `chata-hradecanka` — Chata Hradečanka                                                     | cz   | jméno nese „Chata"      |
| `chata-hubertka` — Chata Hubertka                                                         | cz   | typ z OSM: obsluhovana  |
| `chata-jasanka` — chata Jasanka                                                           | cz   | jméno nese „chata"      |
| `chata-jerabinka` — Chata Jeřabinka                                                       | cz   | jméno nese „Chata"      |
| `chata-jestrab` — Chata Jestřáb                                                           | cz   | jméno nese „Chata"      |
| `chata-karkonoska` — Chata Karkonoska                                                     | pl   | jméno nese „Chata"      |
| `chata-karolinka` — Chata Karolínka                                                       | cz   | jméno nese „Chata"      |
| `chata-katerina` — Chata Kateřina                                                         | cz   | jméno nese „Chata"      |
| `chata-mamut` — Chata Mamut                                                               | cz   | typ z OSM: obsluhovana  |
| `chata-misecky` — Chata Mísečky                                                           | cz   | jméno nese „Chata"      |
| `chata-opavia` — Chata Opavia                                                             | cz   | jméno nese „Chata"      |
| `chata-orlik` — Chata Orlik                                                               | cz   | jméno nese „Chata"      |
| `chata-pod-lipami` — Chata pod lipami                                                     | cz   | jméno nese „Chata"      |
| `chata-popelka` — Chata Popelka                                                           | cz   | jméno nese „Chata"      |
| `chata-protez` — chata Protěž                                                             | cz   | jméno nese „chata"      |
| `chata-silnicka` — Chata Silnička                                                         | cz   | jméno nese „Chata"      |
| `chata-skrzata` — Chata Skrzata                                                           | pl   | jméno nese „Chata"      |
| `chata-solunka` — Chata Solunka                                                           | cz   | jméno nese „Chata"      |
| `chata-stopa` — Chata Stopa                                                               | cz   | jméno nese „Chata"      |
| `chata-sudecka-z-widokiem` — Chata Sudecka z widokiem                                     | pl   | jméno nese „Chata"      |
| `chata-tereza` — Chata Tereza                                                             | cz   | jméno nese „Chata"      |
| `chata-tyrolska` — Chata Tyrolska                                                         | pl   | jméno nese „Chata"      |
| `chata-u-sportu` — Chata U Sportů                                                         | cz   | jméno nese „Chata"      |
| `chata-uvaly` — Chata Úvaly                                                               | cz   | jméno nese „Chata"      |
| `chata-varta` — Chata Varta                                                               | cz   | jméno nese „Chata"      |
| `chata-votocka` — Chata Votočka                                                           | cz   | jméno nese „Chata"      |
| `chata-za-wsia` — Chata za Wsią                                                           | pl   | jméno nese „Chata"      |
| `chata-zapiecek` — Chata Zapiecek                                                         | pl   | jméno nese „Chata"      |
| `decinska-bouda` — Děčínská bouda                                                         | cz   | jméno nese „bouda"      |
| `gorska-chata` — Górska Chata                                                             | pl   | jméno nese „Chata"      |
| `grohmanova-bouda` — Grohmanova bouda                                                     | cz   | jméno nese „bouda"      |
| `hajenka-haida` — Hájenka Haida                                                           | cz   | jméno nese „Hájenka"    |
| `hancova-bouda` — Hančova bouda                                                           | cz   | jméno nese „bouda"      |
| `havlova-bouda` — Havlova bouda                                                           | cz   | jméno nese „bouda"      |
| `hladik-ziza-janska-bouda` — Hladík & Žíža Janská Bouda                                   | cz   | jméno nese „Bouda"      |
| `hoffmannova-bouda` — Hoffmannova bouda                                                   | cz   | jméno nese „bouda"      |
| `hoffmanovy-boudy` — Hoffmanovy Boudy                                                     | cz   | jméno nese „Boudy"      |
| `horska-chata-dimrovka` — horská chata Dimrovka                                           | cz   | jméno nese „horsk"      |
| `horska-chata-portasky` — Horská chata Portášky                                           | cz   | jméno nese „Horsk"      |
| `horska-chata-poutnik` — Horská chata Poutník                                             | cz   | jméno nese „Horsk"      |
| `horska-sluzba-cerny-dul` — Horská služba Černý Důl                                       | cz   | jméno nese „Horsk"      |
| `horska` — Horská                                                                         | cz   | jméno nese „Horsk"      |
| `hotel-bouda-jana` — Hotel Bouda Jana                                                     | cz   | jméno nese „Bouda"      |
| `hotel-cerna-bouda` — Hotel ČERNÁ BOUDA                                                   | cz   | jméno nese „BOUDA"      |
| `hotel-spindlerova-bouda-depandance` — Hotel Špindlerova bouda - Depandance               | pl   | jméno nese „bouda"      |
| `hotel-stumpovka` — Hotel Štumpovka                                                       | cz   | typ z OSM: horsky-hotel |
| `hribeci-bouda` — Hříběcí Bouda                                                           | cz   | jméno nese „Bouda"      |
| `hrncirske-boudy` — Hrnčířské boudy                                                       | cz   | jméno nese „boudy"      |
| `janova-bouda` — Janova bouda                                                             | cz   | jméno nese „bouda"      |
| `javorka` — Javorka                                                                       | cz   | typ z OSM: obsluhovana  |
| `jindrichuv-dum` — Jindřichův dům                                                         | cz   | typ z OSM: obsluhovana  |
| `johannova-bouda` — Johannova bouda                                                       | cz   | jméno nese „bouda"      |
| `josefova-bouda` — Josefova bouda                                                         | cz   | typ z OSM: obsluhovana  |
| `krausovy-boudy` — Krausovy boudy                                                         | cz   | jméno nese „boudy"      |
| `lidicka-bouda` — Lidická bouda                                                           | cz   | jméno nese „bouda"      |
| `lokomotiva` — Lokomotiva                                                                 | cz   | typ z OSM: obsluhovana  |
| `mlodziezowe-schronisko-w-staniszowie` — Młodzieżowe Schronisko w Staniszowie             | pl   | jméno nese „Schronisko" |
| `modrokamenna-bouda` — Modrokamenná bouda                                                 | cz   | typ z OSM: obsluhovana  |
| `mohwaldova-bouda` — Möhwaldova bouda                                                     | cz   | jméno nese „bouda"      |
| `mumlavska-bouda` — Mumlavská Bouda                                                       | cz   | jméno nese „Bouda"      |
| `postovna-na-snezce` — Poštovna na Sněžce                                                 | cz   | typ z OSM: obsluhovana  |
| `prezesowa-chata` — Prezesowa Chata                                                       | pl   | jméno nese „Chata"      |
| `restaurace-havlova-bouda` — Restaurace Havlova bouda                                     | cz   | jméno nese „bouda"      |
| `restaurace-labska-bouda` — Restaurace Labska Bouda                                       | cz   | jméno nese „Bouda"      |
| `rozhledna-zaly` — Rozhledna Žalý                                                         | cz   | typ z OSM: rozhledna    |
| `sasanka` — Sasanka                                                                       | cz   | typ z OSM: obsluhovana  |
| `schronisko-gorskie-dom-slaski` — Schronisko Górskie Dom Śląski                           | pl   | jméno nese „Schronisko" |
| `schronisko-liczyrzepa` — Schronisko Liczyrzepa                                           | pl   | jméno nese „Schronisko" |
| `schronisko-mlodziezowe-lubawia` — Schronisko Młodzieżowe LUBAWIA                         | pl   | jméno nese „Schronisko" |
| `schronisko-srebrny-potok` — Schronisko Srebrny Potok                                     | pl   | jméno nese „Schronisko" |
| `schronisko-szrenica-1362-m-n-p-m` — Schronisko Szrenica 1362 m n.p.m.                    | pl   | jméno nese „Schronisko" |
| `schronisko-wysoki-kamien` — Schronisko Wysoki Kamień                                     | pl   | jméno nese „Schronisko" |
| `sliwkowa-chata-sliwkowa-chata` — Śliwkowa Chata / Sliwkowa Chata                         | pl   | jméno nese „Chata"      |
| `sokoli-boudy` — Sokolí boudy                                                             | cz   | jméno nese „boudy"      |
| `sporthotel-svycarska-bouda` — Sporthotel Švýcarská bouda                                 | cz   | jméno nese „bouda"      |
| `stezka-korunami-stromu-krkonose` — Stezka korunami stromů Krkonoše                       | cz   | typ z OSM: rozhledna    |
| `sudecka-chata-u-prezesa` — Sudecka chata u Prezesa                                       | pl   | jméno nese „chata"      |
| `swojska-chata` — Swojska Chata                                                           | pl   | jméno nese „Chata"      |
| `szklana-chata` — Szklana chata                                                           | pl   | jméno nese „chata"      |
| `szkolne-schronisko-mlodziezowe-plum` — Szkolne Schronisko Młodzieżowe PLUM               | pl   | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-skalnik` — Szkolne Schronisko Młodzieżowe "Skalnik"       | pl   | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-wojtek` — Szkolne Schronisko Młodzieżowe "Wojtek"         | pl   | jméno nese „Schronisko" |
| `szkolne-schronisko-mlodziezowe-zloty-widok` — Szkolne Schronisko Młodzieżowe ZŁOTY WIDOK | pl   | jméno nese „Schronisko" |
| `trejbalova-bouda` — Trejbalova bouda                                                     | cz   | jméno nese „bouda"      |
| `turisticka-chata` — Turistická chata                                                     | cz   | jméno nese „chata"      |
| `velke-pardubicke-boudy` — Velké pardubické boudy                                         | cz   | jméno nese „boudy"      |
| `wellness-hotel-liberecka-bouda` — Wellness hotel LIBERECKÁ BOUDA                         | cz   | jméno nese „BOUDA"      |
| `wiejska-chata` — Wiejska chata                                                           | pl   | jméno nese „chata"      |
| `zizkova-bouda` — Žižkova bouda                                                           | cz   | jméno nese „bouda"      |

### K POSOUZENÍ — musí přečíst člověk (31)

| kandidát                                                | země | signál                                                       |
| ------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `bouda-jirinka` — Bouda Jiřinka                         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Bouda"   |
| `chalupa-marsovka` — Chalupa Maršovka                   | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-sport` — Chalupa Sport                         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-u-medveda` — Chalupa u Medvěda                 | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chalupa-u-rihu` — Chalupa U Říhů                       | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chalupa" |
| `chata-baronka` — Chata Baronka                         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-beata` — Chata Beata                             | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-botas` — Chata Botas                             | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-ferra` — Chata FERRA                             | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-gall` — Chata Gall                               | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-honzik` — Chata Honzík                           | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-jitka` — Chata Jitka                             | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-kabrtova-bouda` — Chata Kábrtova Bouda           | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Bouda"   |
| `chata-kovarna` — Chata Kovárna                         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-kubik` — Chata Kubík                             | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-lom` — Chata Lom                                 | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-medika-2411927307` — Chata Medika                | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-medika` — Chata Medika                           | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-spindler` — Chata Špindler                       | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-tobisek` — Chata Tobísek                         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-u-kohouta` — Chata U Kohouta                     | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `chata-viktorka` — Chata Viktorka                       | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `dvorakova-bouda` — Dvořákova bouda                     | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „bouda"   |
| `horska-chata-hanapetr` — Horská chata HANAPETR         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Horsk"   |
| `jestrebi-bouda` — Jestřebí bouda                       | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „bouda"   |
| `karczma-hutnika` — Karczma Hutnika                     | pl   | žádný signál ve jméně ani v tazích                           |
| `lesna-chata` — Leśna Chata                             | pl   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Chata"   |
| `ludvikova-bouda` — Ludvikova bouda                     | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „bouda"   |
| `sokolska-chata-babeta` — Sokolská chata Babeta         | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „chata"   |
| `turisticka-chata-lajdacek` — Turistická chata Lajdáček | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „chata"   |
| `zinneckerovy-boudy` — Zinneckerovy Boudy               | cz   | rozpor: OSM tourism=chalet (pronájem) × jméno nese „Boudy"   |

### MIMO KLÍČ dle jména — probrat hromadně, NENÍ to vyřazení (47)

| kandidát                                                                      | země | signál                                                                    |
| ----------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------- |
| `apartamenty-every-sky` — Apartamenty Every Sky                               | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `apartman-u-potoka` — Apartmán U potoka                                       | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `apartmany-tri-boudy` — Apartmány tři boudy                                   | cz   | ubytování bez veřejné služby — „Apartmán"                                 |
| `arnika` — Arnika                                                             | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `bergpoolhaus` — Bergpoolhaus                                                 | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `browarowka` — Browarówka                                                     | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `chalupa-baba-jaga` — Chalupa Baba Jaga                                       | cz   | OSM tourism=apartment — pronajímaná bytová jednotka, ne obsluhovaná chata |
| `contemplace` — Contemplace                                                   | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `czarodziejska-gora` — Czarodziejska Góra                                     | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `dalibor` — Dalibor                                                           | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `dom-pod-jaworami` — Dom Pod Jaworami                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `domek-w-karkonoszach` — Domek w Karkonoszach                                 | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `dziewiecsil` — Dziewiećsił                                                   | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `felicity-grand-apartments` — Felicity Grand Apartments                       | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `goryczka` — Goryczka                                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `happy-house` — Happy House                                                   | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `holiday-park-resort` — Holiday Park & Resort                                 | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `hottur-osrodek-wczasowo-wypoczynkowy` — HOTTUR Ośrodek Wczasowo-Wypoczynkowy | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `iskierka` — Iskierka                                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `java` — Java                                                                 | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `jawa` — Jawa                                                                 | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `lilia` — Lilia                                                               | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `lodge-1` — Lodge 1                                                           | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `lodge-2` — Lodge 2                                                           | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `lodge-3` — Lodge 3                                                           | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `lyzarsky-vlek-ubytovani` — Lyžařský vlek - ubytování                         | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `makuka` — Makuka                                                             | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `ministerska` — Ministerská                                                   | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `mlynarka-ubytovani-v-krkonosich` — Mlynářka, ubytování v krkonoších          | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `mounttain-holiday-lodges` — Mounttain Holiday Lodges                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `osada-sniezka` — Osada Śnieżka                                               | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `ostoja-karkonoska` — Ostoja Karkonoska                                       | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `pension-chata-lovrana` — Pension Chata Lovrana                               | cz   | ubytování bez veřejné služby — „Pension"                                  |
| `pension-jilemnicka-bouda` — Pension Jilemnická bouda                         | cz   | ubytování bez veřejné služby — „Pension"                                  |
| `penzion-karlova-chata` — Penzion Karlova chata                               | cz   | ubytování bez veřejné služby — „Penzion"                                  |
| `penzion-modrokamenna-bouda` — Penzion Modrokamenná bouda                     | cz   | ubytování bez veřejné služby — „Penzion"                                  |
| `pod-zielonym-dachem` — Pod Zielonym Dachem                                   | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `przystan-nad-bobrem` — Przystań nad Bobrem                                   | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `rozeniec` — Różeniec                                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `sosnowy-szept` — Sosnowy Szept                                               | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `sruby-podspalov` — sruby Podspálov                                           | cz   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `widok-na-sniezke` — Widok na Śnieżkę                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `widokowo` — Widokowo                                                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `wiilla-jagoda-jagniatkow` — Wiilla Jagoda Jagniątków                         | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `wioska-finska-kalevala` — Wioska Fińska Kalevala                             | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `zacisze-pod-smielcem` — Zacisze Pod Śmielcem                                 | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |
| `zielony-domek` — Zielony Domek                                               | pl   | OSM tourism=chalet — pronajímaný domek, ne obsluhovaná chata              |

oblast krkonose | kandidatu k triazi: 185 | NADEJNE 107 · POSOUDIT 31 · MIMO 47
preskoceno (publikovane/odlozene/vyrazene): 78
