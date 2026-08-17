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
