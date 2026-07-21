# Externí katalog turistických chat ČR/SK 2026 — původ a způsob použití

## Co to je
`katalog.json` (+ `README-katalog.md` s metodikou a `verification.json` se
souhrnem) je katalog 307 turistických/horských chat v ČR, SR, PL, DE, AT a HU:
název, země, pohoří, výška, typ, provoz, kapacita, web, **dva zdroje** na řádek
a úroveň jistoty A/B/C. Metodika a definice jsou v `README-katalog.md`.

## Původ (poctivě)
Katalog **vypracoval ChatGPT** (zadal Michal, 21. 7. 2026, aby ušetřil ruční
práci). Je to tedy **AI kompilace**, ne primární pramen. Michal potvrdil, že ho
lze používat jako regulérní zdroj.

## Jak ho v projektu bereme
- **Vodicí / kandidátní zdroj, ne verifikace.** Slouží k dohledání chat a jako
  vodítko k údajům. Zapracováno pipeline `scripts/data08-katalog-krkonose.ts`
  (Krkonoše → kandidáti `data/kandidati/` + report obohacení).
- **`verified: false`** u všeho převzatého (konvence B: `verified: true` až po
  vlastní kontrole Michala). Katalogová „jistota A" ≠ naše `verified`.
- **Citace nebrat doslova.** Kontrola vzorku (21. 7.) ukázala, že *fakta* často
  sedí (Erlebachova bouda: 1150 m, Resort sv. František — potvrzeno z jejího
  webu), ale *citované zdroje* ne vždy podkládají konkrétní údaj (uváděný
  `krkonose.eu/krkonosske-boudy` je obecná stránka bez výšek a bez těch bud).
  Proto se před publikací u každého údaje dokládá **skutečný primární zdroj**
  (web chaty, KČT, KRNAP…), ne katalogová citace.

Zkráceně: rychlý start a dobré vodítko — ale doložitelnost webu (naše hlavní
hodnota) stavíme na ověřených primárních zdrojích, ne na AI citacích.
