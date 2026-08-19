# DATA-05, koš E — prověrka 21 krkonošských jmen mimo korpus

**Stav k 17. 8. 2026** (denní bezobslužná session). Navazuje na
`docs/DATA-05-razitka-triaz.md`, koš E: 21 razítkových jmen, která znějí
krkonošsky, ale v našem korpusu nejsou. Triáž je odhadem z názvu —
tahle prověrka odhad zkoušela vyvrátit nebo doložit **výhradně z podkladů
v repu**, žádné externí volání.

## Co se prohledávalo

- publikované profily `data/chaty/**` (názvy + `aliasy` + `nazvyHistoricke`)
- kandidáti `data/kandidati/**` (97 souborů jen v Krkonoších)
- zaniklé `data/zanikle/krkonose.json` (17 objektů) a jejich historické názvy
- `data/kandidati/_vyrazeno.yaml`, `_odlozeno.yaml`
- surové exporty OSM (`_overpass-export-cz/pl.json`, `_vychozi-body-export-*.json`)
- externí korpusy `data/externi/**` — katalog ČR/SK, známková sada,
  zdrojový průzkum 22. 7., zaniklé chaty
- `docs/DATA-03-master-krkonose.md`, `docs/DATA-08-katalog-krkonose.md`, `docs/DENIK.md`

Shoda jména **není** identita objektu (precedent z 28. 7.: jmenovci existují
i uvnitř Krkonoš). Všechno níž je proto **návrh s dokladem**, ne zápis do dat.
Do `data/` se touhle prověrkou nesáhlo.

## Souhrn

| výsledek | počet |
|---|---|
| **mezera v korpusu — reálný objekt doložený našimi vlastními daty** | **3** |
| zaniklá bouda (razítko je nejspíš historické) | 1 + 1 návrh |
| jméno enklávy / lokality, ne doložený objekt | 2 |
| doložený objekt jen jako výchozí bod (zastávka) | 1 |
| nerozhodnutelné bez detailu razítka | 2 |
| špatně zařazeno do koše E (patří jinam) | 1 |
| riziko záměny s vyřazeným jmenovcem | 1 |
| bez jakékoli stopy v repu | 10 |

---

## A · Mezery v korpusu — tři objekty, které máme doložené a nevedeme

### A1 · Pardubické boudy — objekt Z NAŠEHO OSM EXPORTU, který propadl

Nejzávažnější nález prověrky. V `data/kandidati/krkonose/_overpass-export-cz.json`
leží:

```
way/88752514 · center 50.6569832, 15.7558359
tags: tourism=alpine_hut, building=yes, source=cuzk:km,
      website=https://pardubickeboudy.cz/
```

Objekt **nemá tag `name`**, a proto ho běh DATA-01 přeskočil. Doslova to
zaznamenal deník (session 20. 7., „Dodatek 2"): *„1 objekt přeskočen
(way/88752514 bez name — k ruční kontrole)"*. Ruční kontrola se od té doby
nekonala a objekt nemá kandidáta, není ve vyřazených ani v odložených.

Razítko „Pardubické boudy" (razitkuj.cz/9859) je **druhý nezávislý signál**
a doména v OSM tagu se se jménem razítka shoduje. Je to tedy pravděpodobně
tentýž objekt — a `alpine_hut` s vlastním webem je přesně to, co klíč
zařazení bere.

**Návrh:** kandidáti podle pravidla vznikají exportem, ne ručním zápisem,
takže ho nezakládám. Systémový návrh je ale širší než jeden objekt:
`data01-overpass-krkonose.ts` by objekt bez `name` neměl mlčky zahodit —
buď ho pojmenovat z `website`/`operator`/`wikidata`, nebo ho vypsat do
samostatné fronty „bez jména, k ruční kontrole", aby druhý takový případ
nečekal měsíc na razítko.

### A2 · Hříběcí bouda — aktivní chata z našeho vlastního zdrojového průzkumu

`data/externi/zdrojovy-pruzkum-2026/` ji vede se dvěma fakty a s výslovným
`typ_objektu=aktivní chata`, přitom `hut_id=neuvedeno` (= nespárována s naším
korpusem):

- **FACT-0131** (`rok_vzniku`): Kudy z nudy klade vznik objektu do konce
  17. století na staré Slezské cestě.
- **FACT-0132** (`zajimavost`): Vlasta Burian tam podle článku v 50. letech
  pobýval téměř rok.

Pramen: kudyznudy.cz, „Vydejte se do Krkonoš za příběhy kultovních horských
bud", čteno 22. 7. 2026, jistota B. Razítko razitkuj.cz/9841 je třetí signál.

**Návrh:** dohledávka a kandidát při nejbližší krkonošské práci. Fakta
z FACT-0131/0132 jsou hotový základ profilu (`verified: false`, `source` je
u obou zapsaný).

### A3 · Jilemnická bouda (Horní Mísečky) — uzel na Zlatém návrší

**FACT-0048** (Seznam Zprávy, „Vrbatova bouda: příběh stavby na Zlatém
návrší", 3. 8. 2025, jistota B) ji uvádí jako výchozí bod trasy:
*„Ze směru od Jilemnické boudy článek uvádí žlutou trasu přibližně 2,8 km /
1,5 hodiny"* — tedy objekt, od kterého se chodí na Vrbatovu boudu. Sedí to
i s upřesněním razítka „- Horní Mísečky". V korpusu, v katalogu ani ve
známkové sadě není.

**Návrh:** dohledávka spolu s A2 — obě leží ve stejném koutě Krkonoš.

---

## B · Zaniklé boudy — razítko může být historické

### B1 · Sokolská bouda → ZANIK-003 (doloženo)

Přesná shoda názvu i historického názvu: `Sokolská bouda` / `Sokolbaude`,
Černá hora — Volské boudy, **zanikla 2019**. Razítko razitkuj.cz/8776 tedy
pravděpodobně pochází z doby provozu. Zakládat kandidáta se nemá.

### B2 · „Bouda v Modrém dole" → Modrodolská bouda ZANIK-004 (návrh, ne doklad)

V Modrém dole vedeme jediný objekt: **Modrodolská bouda** / `Blaugrundbaude`,
zanikla 1954. Razítko ale pojmenovává **místo** („bouda v Modrém dole"), ne
objekt, takže shoda je nepřímá a mohla by patřit i jinému stavení v témže
dole. Ponechávám jako návrh; rozhodne detail razítka.

---

## C · Nerozhodnutelné bez detailu razítka

### C1 · „Bouda v Obřím dole" — tři možnosti, žádný rozhodčí

V Obřím dole a jeho okolí vedeme:

- **Kovárna** / `Bergschmiede`, ZANIK-008, zanikla 1979 — přímo v Obřím dole
- **Obří bouda** / `Riesenbaude`, ZANIK-001, zanikla 1982 — Obří pláň / Obří sedlo
- živé profily **Chata Betyna** a **Chata Pod Studničnou** (obě Pec pod Sněžkou,
  Obří důl mají v textu)

Razítko opět pojmenovává místo. Bez otevření detailu se nerozhodne.

### C2 · „Bouda pod Sněžkou"

Pod Sněžkou stojí celá řada našich objektů (Dom Śląski, Poštovna na Sněžce,
Jelenka, Luční…). Jméno je popis polohy, ne identifikátor. Vyžaduje detail —
patří vlastně k principu koše G.

---

## D · Jméno lokality žije, objekt doložen není

### D1 · Sagasserovy boudy

V OSM je jméno doloženo **jen jako stanice vleku**:
`node/9353722326` a `node/9353722329`, `aerialway=station`,
`name=Sagasserovy boudy`, 50.7044/15.7701 a 50.7032/15.7735 (Černá hora).
Táž dvojice bodů je v terénních datech jako vlek typu `platter`. Žádný
objekt s občerstvením se stejným jménem v exportu není.

### D2 · Zinneckerovy boudy

V terénních datech figuruje pouze **„Zinneckerova strouha"** (vodní tok,
50.70/15.6652, nad Špindlerovým Mlýnem). Jméno enklávy tedy v krajině žije,
objekt doložen není.

U obou platí totéž: razítko může patřit enklávě (a pak není co zakládat),
i konkrétní boudě v ní (a pak je to mezera). Bez detailu se to nepozná.

---

## E · Doložený objekt, zatím jen jako výchozí bod

### E1 · Hančova bouda — Benecko

OSM zná zastávku **„Benecko, Hančova bouda"** (`node/8243433481`
a `node/8243433482`, `highway=bus_stop`, `ref:idol=898`, 50.6701/15.5514).
Zastávka pojmenovaná po boudě je slušný doklad, že bouda stojí a je
místně známá — ale o občerstvení pro veřejnost neříká nic, a v exportu
`alpine_hut` objekt není.

**Návrh:** zařadit k dohledávkám A2/A3 — Benecko je Krkonoše a máme GPS
odkud začít.

---

## F · Špatné zařazení a riziko záměny

### F1 · „Bouda Svornost" nejspíš není krkonošská → přesunout do koše C

Jediná jmenná shoda v celém fondu je kandidát **`jeseniky/chata-svornost`**
(OSM `node/2831748399`, 50.2010/17.2376). Triáž ji dala do koše E podle slova
„bouda"; to byl odhad z názvu a tenhle doklad ho oslabuje.

**Návrh:** přeřadit do koše C (rozpustit dohledávkou Jeseníků) —
s poznámkou, že jméno „Svornost" nese v ČR víc objektů.

### F2 · „Lesní Zátiší Harrachov" — pozor na vyřazeného jmenovce

Fond obsahuje **„Lesní Zátiší"** v Krušných horách (`node/709051641`),
které jsme 10. 8. 2026 vyřadili jako pronajímanou chalupu bez občerstvení.
Razítko ale výslovně říká **Harrachov** — jiné pohoří, jiný objekt.
Vyřazení krušnohorského objektu tedy o harrachovském NIC neříká
a nesmí ho automaticky vyřadit.

Dnes to nehrozí (párování jede nad publikovanými profily, ne nad vyřazenými),
ale kdyby se heuristika kdy rozšířila i na `_vyrazeno.yaml`, tenhle pár je
přesně ten, na kterém by se spálila.

---

## G · Bez jakékoli stopy v repu (10)

Prohledání všech výše uvedených korpusů nevrátilo nic:

„Bouda Hubertus", „Bouda Jana", „Bouda Malá Úpa", „Braunova chata",
„Děčínská bouda", „Ludvíkova bouda", „Mumlavská bouda", „Pohořanská bouda",
„Sokolí boudy" — a k nim výše řešené „Bouda pod Sněžkou".

Poznámky, aby se příště nehledalo znovu:

- **Bouda Hubertus** ≠ náš kandidát **Chata Hubertka** (50.6964/15.5363) —
  jiné jméno, jiné místo; a ≠ lužickohorská **Hubertusbaude**.
- **Bouda Malá Úpa** — Malá Úpa je u nás **středisko**
  (`data/strediska/krkonose/mala-upa.yaml`), ne bouda. Razítko může
  pojmenovávat obec i konkrétní stavení v ní.
- **Mumlavská bouda** — v datech je jen Mumlavský vodopád (výchozí bod
  Vosecké boudy) a naučná stezka; bouda sama ne.
- **Sokolí boudy** ≠ jesenické **Chaty pod Sokolím hřbetem**
  (jiné pohoří, jiná stavba).
- **Děčínská bouda** — jediný nález slova v repu je „Děčínská vrchovina"
  v rozsahovém rozhodnutí pro Krušné hory; nesouvisí.

Tahle desítka je **ta správná fronta pro ruční běh s Michalem** nad detaily
razítek (stejně jako koš G): bez detailu se z nich v repu víc nedostane.

---

## Co z prověrky plyne

1. **Tři dohledávky** (A1 Pardubické boudy, A2 Hříběcí bouda,
   A3 Jilemnická bouda) + **jedna přidružená** (E1 Hančova bouda) —
   všechny leží v Krkonoších a mají v repu odkud začít.
2. **Jedna systémová oprava:** DATA-01 nesmí mlčky zahodit objekt bez
   `name`. Návrh míří do backlogu přes deník, ne do `plan.md`.
3. **Jedna oprava triáže:** „Bouda Svornost" z koše E do koše C.
4. **Deset jmen** zůstává na ruční běh s detaily razítek.
5. Koš E tím **není uzavřen** — je rozdělen na to, co jde bezobslužně
   (hotovo), a na to, co potřebuje detail razítka nebo Michala.

---

# Dohledávka tří mezer — 18. 8. 2026

Denní bezobslužná session navázala tam, kde prověrka skončila: tři objekty
z oddílu A dohledány u pramenů mimo repo. **Do `data/` se ani dnes nesáhlo** —
všechno níž je podklad s prameny, ne zápis. Všechny údaje by při zápisu byly
`verified: false` (konvence B: `true` jen po Michalově vlastní kontrole),
`checked: 2026-08-18`.

## A1 · Pardubické boudy — rozpor NENÍ mezi prameny, je v čase

| údaj | hodnota | pramen |
|---|---|---|
| poloha | Janské Lázně, Horská 133, u vrcholu Černé hory | kudyznudy.cz |
| výška | 1 125 m | ceskehory.cz (archivní prezentace) |
| historie | „existují již od 16. století, kdy sloužily hospodářům"; do katastru zapsány v 1. pol. 18. stol.; 1922 zásah blesku, který zabil hospodáře, a požár | kudyznudy.cz |
| dnešní provoz | od roku 2020 noví majitelé rekonstruovali na **„moderní privátní chalupu"** — sauna, vířivka, venkovní bazén, plně vybavená kuchyně | kudyznudy.cz |
| dřívější provoz | „vlastní restaurac[e] a bar", letní vyhlídková terasa s grilem, polopenze, vlastní vlek | ceskehory.cz — **prezentace označená „objekt v archivu"** |

**Co z toho plyne pro klíč zařazení:** rozhoduje občerstvení pro veřejnost
a role na trase. Starší pramen popisuje penzion s restaurací, novější
**privátní chalupu k pronájmu s vlastní kuchyní** — tedy objekt, který dnes
klíčem zařazení **neprojde**, stejně jako krušnohorské „Lesní Zátiší"
vyřazené 10. 8. Prameny si tedy neodporují, jen popisují dvě různá období.

**Nezakládám kandidáta ani vyřazení.** Na vyřazení je doklad nepřímý —
kudyznudy.cz popisuje privátní chalupu, ale nikde neříká „bez občerstvení pro
veřejnost", a vlastní web `pardubickeboudy.cz` je ze sandboxu nedostupný
(robots.txt). Otázka pro Michala je proto níž v deníku.

## A2 · Hříběcí bouda — a jedno rozlišení, které podklady nedělaly

| údaj | hodnota | pramen |
|---|---|---|
| obec | **Strážné**, „cca 2 km za obcí" na hřebenové cestě | ceskehory.cz |
| výška | 840 m | ceskehory.cz |
| typ | penzion po rekonstrukci, **„stylová restaurace"** | ceskehory.cz |
| kapacita | 45 lůžek | ceskehory.cz |
| stravování | polopenze s možností rozšíření o obědy | ceskehory.cz |

**Rozlišení, které je nutné udělat dřív, než se cokoli zapíše:**
podklad `zdrojovy-pruzkum-2026` vede FACT-0132 (Vlasta Burian tam v 50. letech
pobýval téměř rok) k **Hříběcí boudě** v jednotném čísle, kdežto dohledaný
pramen (Český rozhlas, „Komik Vlasta Burian svého času pásl krávy na
**Hříběcích boudách** v Krkonoších") mluví o **enklávě v množném čísle**.
Hříběcí boudy jsou skupina stavení; „bouda" a „boudy" nemusí být tentýž objekt
a historka se může vázat k místu, ne k dnešnímu penzionu. **Do profilu se tedy
nesmí přenést jako fakt o objektu** — leda s výslovnou poznámkou, že pramen
mluví o enklávě. Totéž platí pro FACT-0131 (vznik na konci 17. století).

Obec je navíc **Strážné**, ne Benecko — dohad z prověrky se nepotvrdil.
Vlastní web `hribeciboudy.cz` je nedostupný (server cyklí redirect
https → http), prezentace na ceskehory.cz je archivní; **aktuálnost provozu
tedy doložená není**.

## A3 · Jilemnická bouda — nejsilnější z trojice, klíčem zařazení projde

| údaj | hodnota | pramen |
|---|---|---|
| adresa | Horní Mísečky, 512 38 Vítkovice v Krkonoších | treking.cz |
| výška | „asi 1 040 m" | treking.cz |
| kapacita | 50 lůžek (pokoje pro 2–4 osoby) | treking.cz |
| restaurace | v přízemí, **„posezení pro 70 hostů"**, letní zahrádka, dětské hřiště | jilemnickabouda.cz |
| kuchyně | „poctivá česká klasika, domácí speciality", čepované pivo | jilemnickabouda.cz |
| otevírací doba | Po–Čt 10:00–18:00, Pá–Ne 9:00–20:00 | jilemnickabouda.cz |
| provoz | celoročně | treking.cz |

Vlastní web je živý a uvádí otevírací dobu restaurace **bez vazby na
ubytování** — to je právě ten doklad, který u A1 a A2 chybí. Klíčem zařazení
(občerstvení pro veřejnost + role na trase, Horní Mísečky jsou nástup na
Vrbatovu boudu) **prochází**. Kontakty a přesná otevírací doba patří do polí
profilu, ne do veřejné prózy.

## A4 · Hančova bouda — nedohledáno

Nezbyl čas; zůstává ve frontě tak, jak ji prověrka nechala (doložena jen
zastávkou „Benecko, Hančova bouda", `node/8243433481`).

## A nakonec: dohledávka ukázala příčinu, ne jen tři jména

Hříběcí ani Jilemnická bouda **nejsou v našem krkonošském OSM exportu vůbec** —
ani jménem. Důvod je systémový a je popsaný v deníku k 18. 8. 2026: krkonošský
export je poslední v repu, který běžel **starou, užší verzí dotazu**
(jen hutové tagy). Boudy mapované v OSM jako restaurace nebo hotel do něj
propadly. Nový běh DATA-01 nad Krkonošemi je tedy pravděpodobně přinese sám —
a je to lepší odpověď než ruční zápis kandidáta, na který se prověrka ptala.

---

# Dohledávka A4 — Hančova bouda (19. 8. 2026)

Denní bezobslužná session dojela poslední otevřenou položku oddílu A.
**Do `data/` se nesáhlo** — níž je podklad s prameny, ne zápis. Vše by při
zápisu bylo `verified: false` (konvence B), `checked: 2026-08-19`.

| údaj | hodnota | pramen |
|---|---|---|
| adresa | Benecko 32, 512 37, okres Semily | kudyznudy.cz, info-cechy.cz |
| poloha | „na mírném svahu uprostřed luk a lesů a přece blízko silnice" | kudyznudy.cz |
| pokoje | „18 dvoulůžkových pokojů, 4 třílůžkové pokoje, 2 čtyřlůžkové pokoje", všechny s vlastním sociálním zařízením | obecbenecko.cz, shodně info-cechy.cz |
| občerstvení | „zahradní restaurace s grilem", „rustikální prostředí restaurace s krbem" | obecbenecko.cz |
| kuchyně | „dobře ošetřená piva a dobrá domácí jídla"; vaří se „podle kuchařského umění z dob našich babiček" | kudyznudy.cz |
| akce | „svatby, oslavy, firemní akce s kapacitou až 50 osob" | kudyznudy.cz, info-cechy.cz |
| přestavba | „our ancestors rebuilt it in 1936 roughly into its current form" | hancovabouda.cz/en/history/ |
| další služby | snowtubing u objektu (zima), šestijamkové public golfové hřiště (léto), dětský koutek | obecbenecko.cz, kudyznudy.cz |

**Nadmořská výška: nedoložena.** Neuvádí ji ani jeden ze čtyř přečtených
pramenů. Nedopočítávat z výšky Benecka — obec se táhne přes výškové rozpětí
(týž případ, jaký řeší DATA-35).

## Dvě věci, které se nesmí zapsat jako fakt

1. **„Zakladatel Bohumil Hanč".** Vlastní web mluví o duchu zakladatele
   (`in the spirit of the founder Bohumil Hanč`) — je to **tvrzení
   provozovatele**, ne doložený fakt, a jméno je zároveň jméno legendárního
   závodníka, který zahynul v roce 1913. Jestli jde o téhož člověka, o jeho
   příbuzného, nebo o pojmenování po něm, **žádný náš pramen neříká**. Do
   profilu jen s uvedením, že to říká provozovatel; do `zajimavosti` s tímtéž
   uvozením (pravidlo CLAUDE.md: superlativ/claim → uveď zdroj).
2. **Rok 1936 je rok PŘESTAVBY, ne vzniku.** Vlastní web výslovně píše
   „rebuilt … roughly into its current form"; kdy bouda vznikla, neříká.
   `rokVzniku` proto nevyplňovat.

## Rozpor v kontaktech — telefonní otázka

| pramen | telefon | e-mail |
|---|---|---|
| kudyznudy.cz (a vlastní web) | +420 734 667 041, +420 603 176 094 | hancovabouda@gmail.com |
| obecbenecko.cz, info-cechy.cz | +420 481 582 632 | hancovabouda@quick.cz |

Vypadá to na starou pevnou linku na stránkách obce proti dnešním mobilům, ale
**doklad to není** — obojí je dnes veřejně publikované. Patří to k otázkám do
`docs/TELEFONATY-KRKONOSE.md`, ne do profilu.

## Klíč zařazení: hraniční, doklad chybí právě ten rozhodující

Restaurace je doložena třemi na sobě nezávislými prameny, ale **ani jeden
neuvádí otevírací dobu restaurace nezávislou na ubytování** — tedy přesně ten
doklad, kterým prošla Jilemnická bouda (18. 8.) a který chyběl Hříběcí boudě.
Objekt navíc stojí v obci u silnice, takže „role na trase" je slabší než
u hřebenových bud. **Nezakládám kandidáta** — otázka pro Michala níž v deníku.

## A znovu tentýž systémový nález

Hančova bouda **není v krkonošském OSM exportu** — jediné, co v repu pod tím
jménem je, je **autobusová zastávka** („Benecko, Hančova bouda",
`node/8243433481`, viz oddíl E1) v exportu výchozích bodů. Je to třetí objekt
v řadě (po Hříběcí a Jilemnické boudě), který propadl **starou, užší verzí
dotazu** z 29. 7. — a přesně ten typ objektu (penzion/restaurace v obci), kvůli
kterému fix z 30. 7. vznikl. Argument pro nový běh DATA-01 nad Krkonošemi tím
sílí ze dvou nálezů na tři.
