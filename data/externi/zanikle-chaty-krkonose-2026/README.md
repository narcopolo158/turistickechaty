# Zaniklé horské chaty, boudy a schroniska v Krkonoších

Datum ověření: **2026-07-22**

## Obsah balíčku

- `zanikle_horske_chatky_krkonose_karkonosze_2026-07-22.csv` — importní CSV v UTF-8 s BOM, oddělovač čárka, všechna pole v uvozovkách
- `zanikle_horske_chatky_krkonose_karkonosze_2026-07-22.xlsx` — formátovaná pracovní verze s filtrem a listem metodiky
- `README_zanikle_chatky_krkonose_karkonosze.md` — tento soubor

## Rozsah

Katalog obsahuje **17 objektů**, z toho **11 v Česku** a **6 v Polsku**.

Jistota záznamů:

- A: 11
- B: 5
- C: 1

## Kritéria zařazení

Zařazen je objekt, který je doložen jako horská bouda, chata, schronisko, veřejný turistický hostinec nebo jednoduchý horský útulek a dnes už v této podobě ani funkci neexistuje. Zahrnuty mohou být zbořené objekty, požářiště bez obnovy a ruiny.

Nejsou zahrnuty objekty, které pouze změnily jméno, byly přestavěny a pokračují v provozu, ani objekty dočasně uzavřené. Vyřazeny byly také běžné zaniklé soukromé chalupy horských enkláv bez prokázané veřejné turistické funkce.

## Práce se zdroji

Každé faktické pole se samostatným zdrojovým sloupcem má přímou URL. Když údaj nebyl bezpečně doložen, je hodnota i její zdroj uveden jako `neuvedeno`. Sloupce `zdroj_1` až `zdroj_3` dokládají název, historické názvy, oblast a přístupnost, pro které zadání neurčilo samostatný zdrojový sloupec.

GPS jsou přebírány z mapových nebo objektových databází. Hodnota `odvozená` znamená, že bod pochází například z geolokace historické fotografie a nemusí označovat přesný půdorys.

## Jistota

- **A** — existence a zánik jsou doloženy více nezávislými zdroji
- **B** — hlavní údaje stojí na jednom solidním odborném nebo regionálním zdroji
- **C** — případ je prokazatelně zaniklý, ale část dat je sporná nebo se zdroje rozcházejí

## Známé limity

- Přesný rok zániku Bobí boudy je ve veřejně dostupných zdrojích rozporný, proto je v poli `rok_zaniku` uvedeno `neuvedeno`.
- Několik polských menších útulků nemá doložené přesné souřadnice ani ustálený historický název.
- Katalog je konzervativní první vydání, nikoli tvrzení o úplnosti všech zaniklých staveb v Krkonoších.
