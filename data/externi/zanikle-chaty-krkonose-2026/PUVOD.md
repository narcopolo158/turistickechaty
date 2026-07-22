# Zaniklé horské chaty Krkonoš / Karkonosze — původ a použití

`zanikle-chaty.csv` = 17 zaniklých bud/chat/schronisek (11 Česko, 6 Polsko),
každé faktické pole se samostatným zdrojem: historické názvy, GPS (+ přesnost),
rok vzniku/zániku, příčina zániku, co je na místě dnes, patrné pozůstatky,
přístupnost, příběh, jistota (A/B/C), zdroje. Metodika v `README.md`.

## Původ (poctivě)
Zpracoval **ChatGPT** (zadal Michal, 22. 7. 2026, dle zadání sepsaného hlavní
session) — AI rešerše nad regionální historickou literaturou, KČT/PTTK,
zanikleobce.cz, KRNAP/KPN, Wikipedií (CZ/DE/PL) a dobovými prameny. Není to
primární pramen; doložení = uvedené zdrojové URL u pole. „neuvedeno" = zdroj to
bezpečně nedoložil (ne důkaz opaku).

## Jak se v projektu bere (DATA-11, atlas P4)
- `scripts/data11-zanikle.ts` → `data/zanikle/krkonose.json` (dle slugu).
- Samostatná stránka **Atlas zaniklých chat** (`/zanikle`) — NEmíchá se do
  živého katalogu, mapy ani routingu (zaniklé objekty nejsou cíl výletu).
- Vše `verified: false` se zdrojem; stav = „zaniklá". GPS ověřeny sanity-checkem
  (všech 10 se souřadnicemi leží v bboxu Krkonoš; 7 objektů souřadnice nemá —
  poctivě `neuvedeno`, `gps_presnost` rozlišuje přesná/přibližná/odvozená).

## Pokrytí a jistota
17 objektů: jistota A 11 · B 5 · C 1. Konzervativní první vydání — ne tvrzení o
úplnosti. Sporné případy poctivě označeny (např. rok zániku Bobí boudy je ve
zdrojích rozporný → `neuvedeno`).

## Poznámka k ověřování
`verified: true` až po ruční kontrole (archiv, literatura, terén). Historické
snímky/pohlednice zaniklých objektů řešit zvlášť (autorská práva, jako u fotek).
