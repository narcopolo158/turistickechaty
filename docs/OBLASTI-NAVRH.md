# Jaké oblasti vytvářet — návrh konvence k odsouhlasení

Zadání Michala 30. 7. 2026: *„nevím jestli vytvářet ještědský hřbet jako
samostatné pohoří, nebo jestli ho raději nepřipojit k většímu celku. btw. jak
chceš zacházet s chatou na Kozákově a turistickou chatou v Prachovských
skalách? jaké oblasti a pohoří chceš vytvářet? pojďme to vyřešit rovnou, ať
máme konsensus od začátku."*

Tohle je **návrh**, ne rozhodnutí — plán se bez Michalova zadání nemění.

---

## 1. Proč to není samozřejmé: prameny se rozcházejí

Michalovy vlastní nálezy z téhož dne to ukazují líp než jakýkoli výklad:

- **ceskehory.cz** vede Jizerské hory a Ještědský hřbet jako **jednu** oblast;
- **risy.cz** vede „turistickou oblast **Lužické hory a Ještědský hřbet**" —
  tedy tentýž hřbet přilepený na opačnou stranu;
- **Jizersko-ještědský horský spolek** je bere jako dvě věci, o které se stará
  jeden spolek („oproti Jizerským horám zde provádíme trochu odlišné…");
- **vydavatel turistických známek** má „Ještědský hřbet" jako vlastní
  kategorii;
- **geomorfologie** (Wikipedie, cumbres.cz) říká, že Ještěd do Jizerských hor
  nepatří vůbec: je v celku **Ještědsko-kozákovský hřbet**, který je
  Jizerským horám sousední, ne nadřazený. Společné mají až *oblast*
  (Krkonošská) a *subprovincii* (Krkonošsko-jesenická).

Tři prameny, tři různé řezy. **Neexistuje jeden správný**, takže nemá smysl
hledat pravdu — je potřeba napsat konvenci a držet ji.

## 2. Co je vlastně `oblast` v tomhle průvodci

Dnes plní tři role naráz, a to je zdroj zmatku:

1. **Adresu** — `/[zeme]/[oblast]/[chata]`, tedy trvalý odkaz;
2. **Rozcestník pro čtenáře** — stránka pohoří, kde se prochází nabídka;
3. **Okno pro pipeline** — bbox pro DATA-01, DATA-28, DATA-33.

Role 3 je čistě technická a je jedno, jak se okno jmenuje. Role 1 a 2 ale
mluví ke čtenáři, a tam rozhoduje, jak lidé hledají.

## 3. Dvě čisté varianty

### Varianta A — oblast = geomorfologický celek

Krkonoše · Jizerské hory · Ještědsko-kozákovský hřbet · Lužické hory ·
Jičínská pahorkatina …

**Pro:** jednoznačné, doložitelné z autoritativního pramene, nepřekrývá se,
odvoditelné ze souřadnic. Každé zařazení má oporu, kterou lze přezkoumat.

**Proti:** některá jména nikdo nehledá. „Turistická chata v Prachovských
skalách, Jičínská pahorkatina" je věcně správně a čtenářsky bezcenné.
A „Ještědsko-kozákovský hřbet" slepí Ještěd s Kozákovem, který si každý
spojuje s Českým rájem.

### Varianta B — oblast = turistická oblast, jak ji hledá turista

Krkonoše · Jizerské hory · Ještědský hřbet · Český ráj · Lužické hory …

**Pro:** čtenář to najde, vydavatel známek (náš hlavní externí katalog) to
tak řadí, a odpovídá to i tomu, jak se o horách mluví.

**Proti:** hranice jsou měkké a prameny se rozcházejí — přesně jak Michal
ukázal. Bez psaného pravidla by zařazení bylo dojmem, což je jinde v tomhle
projektu zakázané.

## 4. Návrh: varianta B, ale s tvrdým pravidlem doložení

Doporučuju **B** — průvodce je pro turisty, ne pro geomorfology — jenže
s tím, co dělá měkkou hranici tvrdou:

**(1) Každá oblast má v YAML napsáno, co obsahuje a co ne.** Nejen bbox, ale
věta: které geomorfologické celky/podcelky pokrývá a kde je hrana. Už teď to
tak děláme (Jizerky mají poznámku o překryvu s Krkonošemi, Ještěd o Kozákovu).

**(2) Každá oblast přiznává, kde ji prameny řežou jinak.** Na stránce pohoří
jedna věta: „ceskehory.cz vede Ještědský hřbet společně s Jizerskými horami,
risy.cz s Lužickými horami; průvodce ho vede zvlášť, protože geomorfologicky
je to samostatný celek." Rozpor se **nezamlčí**, přizná se — stejně jako
u faktů o chatách.

**(3) Profil chaty nese geomorfologický celek jako doložený údaj**, když se
liší od oblasti, ve které je vedený. Tím se nic neztratí: Kozákov může být
v Českém ráji a v datech mít poznamenáno „geomorfologicky Ještědsko-kozákovský
hřbet, podcelek Kozákovský hřbet".

**(4) Oblasti se nepřekrývají.** Objekt patří právě do jedné; hraniční případy
řeší triáž a zapisuje se důvod (jako dnes u duplicit v `_vyrazeno.yaml`).

## 5. Co z toho plyne pro tři konkrétní objekty

| Objekt | Návrh | Proč |
|---|---|---|
| **Ještěd, Rašovka, Pláně** | **samostatná oblast Ještědský hřbet** | Do Jizerek nepatří geomorfologicky a dva turistické prameny ho lepí na opačné strany — když se prameny přou, je poctivější nechat ho stát samostatně a rozpor napsat. Navíc: samostatnou oblast lze později sloučit, sloučenou rozdělit bolí (URL, slugy, přesměrování). |
| **Riegrova chata na Kozákově** | **Český ráj** (beze změny) | Kozákovský hřbet je sice týž geomorfologický celek jako Ještěd, ale je 40 km daleko a turisticky patří k Českému ráji — Kozákov je jeho vyhlídka. V datech se dopíše geomorfologický celek. |
| **Turistická chata Prachov** | **Český ráj** | Skalní město, žádné pohoří; geomorfologicky Jičínská pahorkatina, což nikdo nehledá. |

**Z toho plyne, že „Český ráj" bude oblast typu `turisticka-oblast`, ne
`pohori`** — pole `typ` v kolekci Oblasti to už dnes umožňuje. Je to poctivé:
Český ráj opravdu pohoří není a průvodce by neměl předstírat, že ano.

## 6. Otevřená otázka, kterou tohle neřeší: kam až průvodce sahá

Průvodce se představuje jako *„průvodce všemi horskými chatami"*. Prachovská
chata ani Riegrova chata na Kozákově ale nejsou horské chaty v tom smyslu jako
Luční bouda — jsou to turistické chaty v pískovcových skalách a na vyhlídkovém
kopci. Buď:

- **(a) rozsah zůstane „horské chaty"** a Prachov s Kozákovem se nevedou
  (a vyřadí se s důvodem), nebo
- **(b) rozsah se rozšíří na „turistické chaty"** a průvodce to i tak řekne —
  včetně toho, že v Českém ráji jde o skály, ne o hory.

**Doporučuju (b)**, protože oba objekty už v repu jako kandidáti leží, mají
turistickou známku a čtenář, který sbírá razítka, mezi nimi nedělá rozdíl.
Ale je to rozhodnutí o povaze průvodce, ne technikálie — patří Michalovi.

## 7. Co se stane, když se rozhodne jinak

Dnes je to levné: Ještědský hřbet má **nula profilů**, takže přejmenování,
sloučení s Jizerkami i zrušení je otázka jednoho commitu. Jakmile v oblasti
budou publikované profily, mění se URL a je potřeba přesměrování — proto je
dobře, že se to řeší teď.
