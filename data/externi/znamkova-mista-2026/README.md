# Turistická známková místa — export od Michala (30. 7. 2026)

`znamkova-mista-2026-07-30.txt` — **doslovná kopie** toho, co Michal poslal
30. 7. 2026 v odpovědi na otázku „napadají tě další jizerské objekty, které
katalog nevede?". Podle hlavičky je to stav známkových míst k 30. 07. 2026.

## Co v tom je a čím se liší od dosavadních zdrojů

Dosud jsme měli `../znamky-vizitky-2026/turisticke-znamky-cr-vyber.csv` —
jen **číslo + název** známky, a to filtrovaně („horské chaty a boudy"). Tenhle
export nese **navíc prodejní místa** u každé známky, jejich adresy a weby.
To je pro nás cennější, než se zdá:

- **prodejní místo bývá i sám objekt** — u známky č. 42 je prvním prodejním
  místem „Horská chata Smědava, Bílý Potok (chatasmedava.cz)", což je zároveň
  doklad obce a oficiálního webu chaty;
- **ostatní prodejní místa** (trafika, cukrárna, infocentrum) jsou podklad pro
  budoucí „kde razítko/známku sehnat" a pro položku „Razítko dnes";
- **kategorie v hranatých závorkách** (Pohoří, Horské chaty a boudy, Ski
  areály, Rozhledny a vyhlídky, Ještědský hřbet…) říkají, jak objekt řadí
  sám vydavatel.

## Jak se s tím zachází

Zdroj je **externí a nepotvrzený** — jako každý katalog. Vede se tedy jako
`verified: false` se `source`, a **sám o sobě neurčuje, co do průvodce patří**;
to dělá klíč zařazení a redakční triáž. Křížovou kontrolu proti našemu korpusu
dělá `scripts/data22-znamky-oficialni-seznam.ts --mista`.

## Co z něj vyšlo hned (30. 7. 2026)

- **č. 42 Horská chata Smědava** — potvrzuje, že objekt do Jizerek patří,
  a dává mu obec (Bílý Potok) i web. V našem korpusu chyběl; je to jeden
  z osmi, na které narazil rozšířený dotaz DATA-01 téhož dne.
- **č. 1935 Chata Hubertka, Jizerské hory** — rozsoudila dvojici jmenovců,
  kterou DATA-22 vedla jako otevřenou otázku (poznámka 5 v hlavičce skriptu):
  známka patří jizerské Hubertce (Bílý Potok 370, `chatahubertka.cz`), ne
  krkonošskému kandidátovi u Benecka (lat 50.696). Náš jizerský kandidát
  `jizerske-hory/hubertka.yaml` sedí (lat 50.888, lng 15.230).
- **č. 39, 40, 1296 (Pláně pod Ještědem, Ještěd, Rašovka)** leží na
  **Ještědském hřbetu**, tedy MIMO okno Jizerských hor (všechny mají
  lng < 15,0; okno začíná na 15,05). Není to chyba exportu — vydavatel je
  řadí do libereckého okolí. Jsou to kandidáti na samostatnou oblast, nebo
  na položku „přesahové oblasti" (DATA-29); rozhodnutí je na Michalovi.
