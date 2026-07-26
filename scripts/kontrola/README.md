# Kontroly datové vrstvy

Čtyři skripty, které hlídají to, co dělá tenhle web webem: **že se údaje dají
ověřit a že se nic nedomýšlí**. Nejsou to unit testy aplikace — čtou YAML
profily v `data/chaty/**` a hlásí, kde próza tvrdí víc, než co je doložené.

```
npm run kontrola        # spustí všechny čtyři + regresní test
npm run kontrola:test   # jen regresní test proti fixtuře
```

Jednotlivě (každý bere volitelný seznam souborů, jinak vezme celé `data/chaty`):

```
npx tsx scripts/kontrola/validator.ts
npx tsx scripts/kontrola/zdroje.ts      [soubor.yaml …]
npx tsx scripts/kontrola/ban-scan.ts    [soubor.yaml …]
npx tsx scripts/kontrola/audit-mech.ts  [soubor.yaml …]
```

## Co která kontrola dělá

**`validator.ts` — verdikt.** Číselníky (`typ`, `stav`, `typObcerstveni`,
`zajimavosti.kategorie`), shoda `slug` s názvem souboru, duplicitní slugy,
milníky bez události. Navíc dvě věci, na kterých stojí poctivost projektu:
každý blok `overeni*` musí mít `verified: false`, dokud údaj neověříme vlastním
primárním dotazem (konvence B), a obrázky známek smějí pocházet **jen** z domén
Turistické známky s.r.o. (`turisticke-znamky.cz`, `znaczki-turystyczne.pl`),
protože jen na ty máme svolení vydavatele. Vizitky Wander Book svolení nemají,
a proto v manifestu nesmějí být. Vrací kód 1 při jakékoli chybě.

**`zdroje.ts` — verdikt.** Když próza jmenuje doménu jako zdroj tvrzení, musí ta
doména stát i v bloku `zdroje` (v `url` nebo v `popisu`), jinak si čtenář nemá
jak tvrzení ověřit a připsání je slepé.

**`ban-scan.ts` — seznam k posouzení.** Do veřejného textu nepatří URL, domény,
e-maily, telefony, ceny (mění se), GPS, čísla známek, názvy polí ani interní
terminologie. **Výstup není seznam vad.** Část zásahů jsou trvalé a známé falešné
poplachy: doména v prvním pádě jako jméno pramene („server Krkonose.eu") je
doložený domácí styl, „redakce" v závěrečném odstavci taky, a OpenStreetMap se
uvádí kvůli licenci ODbL. Od DATA-18 k nim patří ještě dvě rodiny: celá věta,
kterou se ta licence připisuje („Souřadnice … pocházejí z OpenStreetMap"),
spadá do třídy GPS, ač žádné souřadnice nenese — takových je dnes všech
**17 zásahů třídy GPS** a ani jeden neobsahuje číslo — a „katalogový profil"
ve významu stránky **cizího** serveru je běžná čeština, zakázaný je jen
„profil" ve významu naší vlastní stránky. Ustálený počet na dnešním korpusu je
**135 zásahů** — smysl má sledovat, jestli číslo neskočí, ne jestli je nula.

Bylo jich 135 a rozdíl je čistě náhodou malý: 25. 7. 2026 **odpadlo 17 zásahů**
třídy „číslo známky" (viz níže) a **pět naopak přibylo**, když se do prózy tří
profilů doplnilo připsání OpenStreetMap, které žádá licence ODbL. Rozdíl −12 je
tedy součet dvou pohybů opačným směrem, ne jeden úbytek — hezká ukázka toho,
proč se u tohohle skriptu sleduje **skok**, a ne hodnota sama.

Ze 123 na 122 to spadlo o pár hodin později a důvod je **úplně nezajímavý, což
je ta pointa**: druhá dávka jazykového auditu přepsala v Chatě U Jirky větu tak,
že se slovo „souřadnice" ocitlo na začátku věty — a vzor třídy GPS zní
`${WB0}souřadnic` **bez příznaku `i`**, takže velké „S" nechytí. O díru nejde:
skutečné souřadnice loví `\d{1,3}\.\d{4,}`, `\d+°\s?\d+'` a `N\s*\d{2}\.`,
kdežto samo slovo „souřadnice" je zdokumentovaný falešný poplach, který se stejně
škrtá ručně. Kdo bude příště hledat, proč se číslo pohnulo o jedničku, ať začne
tady — **ne každý skok má obsah**.

Ze 122 na 127 to vyskočilo večer 25. 7. 2026 s třetí dávkou jazykového auditu
a i tenhle skok je bez obsahu — tentokrát ale **doloženo měřením, ne odhadem**.
Osm přepsaných profilů se porovnalo se stavem v HEAD soubor po souboru
(`git archive HEAD data/chaty` do dočasného adresáře, pak `ban-scan.ts` nad
oběma verzemi a diff výstupů). Pět profilů získalo po jednom zásahu, žádný
neztratil ani jeden, takže +5 vysvětluje celý pohyb. Tři z nich chytil vzor
`profil` v domácí formulaci „starší katalogový podklad, ze kterého profil
vychází", kterou próza nově používá tam, kde se přiznává, že tvrzení stojí na
katalogu bez veřejně citovatelné adresy. Zbylé dva chytil `OpenStreetMap` —
v perexu Lesní boudy a v textu Lyžařské boudy, kde se nově připisuje, odkud
pochází výška a klasifikace objektu. `OpenStreetMap` mezi trvalými falešnými
poplachy stojí dodnes; **u `profil` to tehdejší zápis tvrdil taky a byl to
omyl**, který opravilo až DATA-18 o den později (poslední oddíl téhle sekce).
„Profil" ve významu naší vlastní stránky je interní žargon a z prózy patří
pryč, ať stojí v jakkoli ustálené vazbě.

Při té příležitosti se potvrdila i **hranice dosahu**. `proza()` v `lib.ts` čte
jen `perex` a `text[]`. Když se z položky `zajimavosti[0]` u Lyžařské boudy
odstranilo číslo známky, počet zásahů klesnout nemohl — a taky neklesl, ten
údaj tam skript nikdy neviděl (profil šel 3 → 4, tedy čistý přírůstek). Totéž
platí pro `zdroje.popis`, `autem`, `otviraciDoba` a `interniPoznamky`.
Rozšíření dosahu bylo vedené v BACKLOGu jako DATA-16 a **26. 7. 2026 se
udělalo** — jak dopadlo, stojí o dva odstavce níž.

Ze 127 na 131 to vyskočilo se **čtvrtou dávkou** jazykového auditu (jedenáct
profilů) a měřilo se stejnou metodou. Pohyb má dvě složky opačným směrem:
**dva profily zásah ztratily** — u Schroniska pod Łabskim Szczytem a u Szrenice
zmizel vyrobený rozpor, kde se rozdíl jednoho metru mezi výškou *budovy* z OSM
a výškou *hory* z katalogu vydával za neshodu pramenů — a **tři profily získaly
po dvou**. Kamieńczyk dvakrát slovem `profil` ve tvaru „katalogový profil", kterým
se nově pojmenovává skutečný prostředník tvrzení; Odrodzenie a Vébrovy boudy
dvakrát slovem `OpenStreetMap`, protože se doplnilo připsání ODbL tam, kde
dřív chybělo. Čistě +4, opět samé připsání. Kdo bude číslo prověřovat, ať se
dívá na **složení tříd**, ne na součet: mimo trvalé falešné poplachy zůstává
osm zásahů v pěti profilech, kterých se čtvrtá dávka netýkala.

Jeden z nich **není** falešný poplach a je vedený v BACKLOGu: Vrbatova bouda má
ve větě o rozdílných výškách číslo turistické známky, a to do veřejné prózy
podle konvence nepatří. Neopravovalo se to spolu se čtvrtou dávkou schválně,
aby měření dávky zůstalo čisté.

## Co skript čte (DATA-16)

Od 26. 7. 2026 sken nekončí u těla článku. Vedle `perex` a `text[]` čte i
**ostatní veřejný text profilu**: `zajimavosti[].text`, `otviraciDoba`, `autem`
a `sezona`. Drží to samostatná funkce `dalsiVerejnyText()` v `lib.ts` — `proza()`
zůstala nedotčená schválně, aby kontrola připsání (`zdroje.ts`) a šest kontrol
v `audit-mech.ts` dál pracovaly nad tělem článku, pro které byly psané.
**Dvě veřejná pole do skenu nepatří** a je to úmysl, ne opomenutí: `zdroje.popis`
nese odkazy a jména domén ze zadání, takže by sken hlásil vlastní návrh schématu,
a `interniPoznamky` veřejné vůbec nejsou. Fixtura `12-dalsi-verejny-text.yaml`
hlídá obojí — čtyři zásahy ze čtyř čtených polí a ani jeden z těch dvou past.

Ustálený počet **131 → 138**. Rozšíření samo přidalo **9 zásahů** (změřeno
napřed, jak backlog žádal: `otviraciDoba` 5, `autem` 3, `zajimavosti[].text` 1)
a **dva zase odpadly**, protože sken rovnou našel dvě skutečné vady. V poli
`autem` Luční boudy stálo číslo na smluvní přepravu, v `otviraciDoba` Tetřevích
bud rezervační linka restaurace — telefony do veřejného textu nepatří, a tyhle
dva se tam sedm měsíců schovávaly právě proto, že tam skript neviděl. Čísla se
nezahodila: obě jsou dál v `overeni*.source`, který se veřejně vykresluje jen
jako hostname. Zbylých sedm zásahů spadá do už popsaných falešných poplachů
(`OSM`, doména v prvním pádě, „ceny Mies van der Rohe Award").

## Když měření převrátí vlastní zadání (DATA-18)

Ustálený počet **138 → 135**, 26. 7. 2026. Backlog vedl tři drobnosti k jednomu
měřenému průchodu; měření z nich udělalo čtyři a ta čtvrtá je z nich nejcennější,
protože **zpochybnila zápis v tomhle souboru**.

Vada číslo tři zněla, že vzor třídy GPS `${WB0}souřadnic` je citlivý na velikost
písmen. Při jeho opravě bylo přirozené podívat se, jestli tímtéž netrpí i vzor
`profil`, který měl průchod zrovna v ruce — a trpěl dvojnásob: byl jen malým
písmenem a jen v prvním pádě. Bez toho by se nedalo vysvětlit, proč si backlog
i skript o rozsahu vady odporovaly (23 výskytů ve 20 souborech proti 19, které
skript viděl). Pravda je, že slovo mělo v korpusu **30 výskytů**, starý vzor jich
viděl 19 a z nich bylo 13 interním žargonem — což je přesně ono „zhruba 13"
z backlogu. Až tenhle rozpor tří čísel díru odhalil.

Rozvaha pohybu:

| směr | kolik | co to je |
| --- | --- | --- |
| −15 | 13 + 2 | skutečné opravy: 13× „profil" ve významu *naší* stránky, 2× u Vrbatovy boudy (číslo známky a doména v jedné větě) |
| +9 | 9 | nově viditelné věty připisující licenci ODbL — `souřadnic` nově chytá i velké „S" |
| +3 | 3 | nově viditelné odkazy na *cizí* katalogový profil — `profil` nově chytá i skloňované tvary |

138 − 15 + 12 = **135**. Nic z toho, co přibylo, není vada: obojí je připsání
pramene, tedy přesně to, co má próza dělat. Naopak **šest oprav se v čísle
neprojeví vůbec** — čtyři „Profil" na začátku věty a dva „profilu", které starý
vzor nikdy neviděl. Opravily se stejně; průchod, který si vybírá jen to, co mu
zlepší vlastní metriku, není audit, ale kosmetika.

Jedenáct výskytů slova v korpusu **zůstává schválně**: devět míří na katalogový
profil cizího serveru (Kamieńczyk pětkrát, Schronisko pod Łabskim Szczytem
dvakrát, Vébrovy boudy a Krakonoš po jednom) a dvakrát jde o sloveso „profiluje
se" u Friesových bud, což je běžná čeština bez vztahu k naší terminologii.
Fixtura `13-vzory-data18.yaml` drží obě strany: hlídá, že se nové tvary chytí,
a zároveň že se `profiluje` **nechytí**. Snímek se kvůli tomu přegeneroval
(o šest řádků nahoru), protože šlo o záměrné utažení, ne o chybu portu.

**`audit-mech.ts` — seznam k posouzení.** Strojově chytatelná část auditní
taxonomie z 25. 7. 2026, šest kontrol: **A** próza tvrdí hodnotu pole, které je
v datech záměrně prázdné · **B** blok `overeni` si žádá odklad publikace, ale
profil je publikovaný · **C** doména v próze je skloňovaná varianta doložené
domény · **D** superlativ ve větě bez připsání · **E** letopočet v próze, který
se nikde jinde v souboru nevyskytuje · **F** próza mluví o turistické známce
nebo vizitce, ale `zdroje` katalog vydavatele vůbec nevedou.

## Proč přibyla kontrola F

Ruční audit 25. 7. 2026 našel v perexu **šesti z osmi** čtených profilů větu
„Nese turistickou známku č. X." — bez jediného záznamu v `zdroje`. Číslo přitom
stálo jen v `interniPoznamky`, tedy tam, kam čtenář nevidí: veřejně to bylo
tvrzení bez pramene, a navíc zbytečné, protože číslo i odkaz vykresluje
sourcovaná karta „Sběratelská místa". Kontrola F tuhle vadu popsala pravidlem
a hned našla **dalších jedenáct profilů — dohromady 17 ze 42**. Jeden z nich by
hledání té konkrétní věty minulo: Chata Rezek nesla stejnou vadu v jiném hávu
(„je zároveň známkovým místem (známka č. 19)"). Přesně proto se kontrola ptá na
sběratelské tvrzení obecně, ne na jednu formulaci.

Přijaté pravidlo: holá věta z perexu pryč všude; záznam v `zdroje` se přidává
tam, kde se próza nebo blok `overeni*` o známku fakticky opírá (výška vyrytá na
rytině, rozpor mezi rytinou a prameny, vazba známky na osadu místo na objekt).
Obojí je teď v korpusu hotové a kontrola hlásí nulu.

## Proč jsou v kontrolách A a D ty výjimky

První běh 25. 7. 2026 dal 18 zásahů: 8 skutečných vad a 10 falešných poplachů.
Podle nich se kontroly utáhly a **výjimkové seznamy jsou tím nejcennějším, co
tyhle skripty mají** — každá položka v `PRIZNANI`, `NENI_REKORD` a `VNITRNI`
stála přečtení jednoho konkrétního odstavce.

Hradlo `PRIZNANI` u kontroly A říká, že když profil rozpor sám přiznává
(„prameny si odporují", „doložit neumíme"), nejde o vadu, ale o poctivost —
tak je psaná portáska, která nadmořskou výšku záměrně neuvádí. `NENI_REKORD`
vyřazuje superlativy, které nejsou tvrzením o rekordu („nejspíš", „nejbližší",
„nejde"), `VNITRNI` odděluje nejvyšší **patro domu** od nejvyšší **chaty**.
A kontrola D hledá připsání v okně tří vět, ne v jedné, protože legitimní
připsání často stojí až ve větě následující.

**Opravený falešný negativ:** `PRIPSANI` mělo holé `dle` a `nese`, které se
trefily i dovnitř slov („Špin**dle**rův", „ve**dle**", „při**nese**") — věta
s takovým slovem prošla jako připsaná, i když připsání neměla. Vada byla
zděděná z předlohy a odhalila ji až fixtura. Obojí teď musí stát jako slovo.
Na dnešním korpusu je rozdíl nulový, takže utažení nic neodkrylo; jen zavírá
díru do budoucna.

## Hranice slova: past, kvůli které tu je fixtura

Kontroly se portovaly z Pythonu a v jedné věci se jazyky liší tiše a zle:
**javascriptové `\b` a `\w` jsou ASCII-only, kdežto pythonovské jsou unicodové.**
Naivní přepis by tedy nespadl — jen by přestal zabírat na českých slovech:

| vzor | naivní `\b`/`\w` v JS | správně (`WB0`/`W` nad `u`) |
| --- | --- | --- |
| `\bKč\b`, `\bzł\b` | nenajde nic | „Kč", „zł" |
| `známk\w*\s*č\.\s*\d+` | nenajde nic | „známkách č. 673" |
| `\b[a-z-]+\.(cz)\b` | navíc „hory.cz" z „Českéhory.cz" | jen skutečné domény |

Proto se **v celém tomhle adresáři nepoužívá `\b` ani `\w`**, ale konstanty
`WB0`, `WB1` a `W` z `lib.ts` nad příznakem `u`. Kdo sem přidá nový vzor, ať to
dodrží — jinak kontrola tiše přestane zabírat.

## Fixtura

`fixture/*.yaml` je schválně vadný korpus: každý soubor cílí na jednu větev
kontroly a na jednu past (`08-hranice-slova.yaml` je celý o tabulce výše).
Očekávaný výstup ve `fixture/ocekavany-vystup/` **nebyl napsán ručně** —
vygenerovaly ho původní pythonovské skripty. Snímek je tedy důkaz, že se port
chová stejně jako předloha, a přežije to, že originály zmizely se sandboxem.

Fixtura se vyplatila hned: chytila v portu dvě odchylky, které se na zeleném
korpusu nemohly ukázat — mezeru navíc v úryvku u kontroly D (pythonovské
`str.split()` zahazuje prázdné okraje, `split(/\s+/)` v JS ne) a chybějící
mezeru ve formátování výstupu `zdroje.ts`.

Když test spadne, jsou dvě možnosti: buď je v portu chyba, nebo se kontrola
**záměrně zpřísnila** — pak se snímek přegeneruje a rozdíl se popíše v commitu.
Fixtura leží mimo `data/`, takže ji žádná ostrá kontrola ani seed nevidí.
