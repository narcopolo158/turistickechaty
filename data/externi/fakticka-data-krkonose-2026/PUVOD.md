# Doplňková faktická data chat (Krkonoše 2026) — původ a použití

`fakticka-data.csv` = 41 chat Krkonoš, věcná data se **zdrojem u KAŽDÉHO pole**:
rok vzniku, historické milníky, kapacita lůžek, provoz, otevírací doba, web,
telefon, e-mail, GPS a „zajímavost" (+ kategorie). Jistota A/B/C, `ověřeno k`.

## Původ (poctivě)
Zpracoval **ChatGPT** (zadal Michal, 21. 7. 2026) — AI kompilace nad
primárními zdroji (weby chat, kct.cz). Není to primární pramen; doložení =
uvedené zdrojové URL u pole. „neuvedeno" = zdroj to neuvádí (nedomýšlet).

## Jak se v projektu bere (DATA-09)
- `scripts/data09-fakticka-data.ts` doplňuje **jen prázdná** pole do YAML chat
  (`data/chaty/krkonose/*.yaml`) — **nikdy nepřepisuje** ruční/ověřená data.
- Vše `verified: false`; provenience: u skupiny bez `overeni…` bloku se založí
  (verified:false, se zdrojem pole), u skupiny s blokem se přidá inline `# zdroj`.
- „neuvedeno" a hodnoty s existující ruční verzí se přeskočí (report to vypíše).
- Editace je chirurgická (textová) — ruční formát i komentáře YAML zůstávají.

## Pokrytí
15/23 publikovaných chat má v katalogu shodu; doplněno u 13 (Luční a Labská už
měly vše ručně → nedotčeny). Zbylých 8 (Bílé Labe, U Jirky, Dvorská, Krakonoš,
Lovecká, Hali Szrenickiej, Tetřeví, Vebrovy) v katalogu není → beze změny.

## Poznámka k ověřování
Data jsou vodítko, ne pravda. `verified: true` až po ruční kontrole Michalem
(telefonát/návštěva/oficiální zdroj) — pak se `verified` přepne v YAML chaty.
