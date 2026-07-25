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
uvádí kvůli licenci ODbL. Ustálený počet na dnešním korpusu je **135 zásahů** —
smysl má sledovat, jestli číslo neskočí, ne jestli je nula.

**`audit-mech.ts` — seznam k posouzení.** Strojově chytatelná část auditní
taxonomie z 25. 7. 2026, pět kontrol: **A** próza tvrdí hodnotu pole, které je
v datech záměrně prázdné · **B** blok `overeni` si žádá odklad publikace, ale
profil je publikovaný · **C** doména v próze je skloňovaná varianta doložené
domény · **D** superlativ ve větě bez připsání · **E** letopočet v próze, který
se nikde jinde v souboru nevyskytuje.

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

**Známý falešný negativ:** `PRIPSANI` obsahuje holé `dle`, které se trefí i
dovnitř slov („Špin**dle**rův", „ve**dle**"), takže věta s takovým slovem projde
jako připsaná, i když připsání nemá. Je to vada zděděná z předlohy; nechává se
tu vědomě, protože oprava mění chování na celém korpusu a patří do vlastního
commitu s vlastním přečtením nálezů.

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
