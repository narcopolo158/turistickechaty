# Výchozí body pěších túr k chatám (ČR/SK 2026) — původ a použití

`vychozi-body.csv` = 667 výchozích bodů k 307 chatám, 1–3 doporučené nástupy na
chatu (pořadí 1 = hlavní), s typem, dopravou, sezónou, jistotou (A/B), ZDROJI a
poznámkou. Metodika v `README.md`.

## Původ (poctivě)
Zpracoval **ChatGPT** (zadal Michal, 21. 7. 2026) — AI kompilace nad ozdrojovanými
podklady, ne primární pramen. **Bez GPS.**

## Jak se v projektu bere
- **Doporučené nástupy** (pořadí) nahrazují/doplňují dosavadní „nejbližší OSM bod"
  heuristiku v routingu přístupových tras (DATA-06 3b).
- **GPS se geokódují z OSM** (`data06-pristupove-trasy.ts` matchuje název bodu /
  „nejbližší obec/uzel" na OSM katalog) — cross-check, ať bod sedí na místo.
- Vše `verified: false`; poznámky a zdroje z katalogu se ukazují u trasy jako
  vodítko, primární doložení = uvedené zdrojové URL.
