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
uvádí kvůli licenci ODbL. Ustálený počet na dnešním korpusu je **127 zásahů** —
smysl má sledovat, jestli číslo neskočí, ne jestli je nula.

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
pochází výška a klasifikace objektu. Obě třídy stojí mezi trvalými falešnými
poplachy vyjmenovanými o dva odstavce výš: přibylo připsání, ne domýšlení.

Při té příležitosti se potvrdila i **hranice dosahu**. `proza()` v `lib.ts` čte
jen `perex` a `text[]`. Když se z položky `zajimavosti[0]` u Lyžařské boudy
odstranilo číslo známky, počet zásahů klesnout nemohl — a taky neklesl, ten
údaj tam skript nikdy neviděl (profil šel 3 → 4, tedy čistý přírůstek). Totéž
platí pro `zdroje.popis`, `autem`, `otviraciDoba` a `interniPoznamky`.
Rozšíření dosahu na `zajimavosti[].text` je vedené v BACKLOGu; napřed se změří,
kolik zásahů to přidá, aby se ustálený počet neposunul naslepo.

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
