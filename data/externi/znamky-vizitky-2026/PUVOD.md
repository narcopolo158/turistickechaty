# Turistické známky a vizitky u chat — původ a použití

`znamky-vizitky.csv` = normalizovaná vazební tabulka (1 řádek = 1 produkt):
ID chaty, název, systém (Turistické známky / Turistické vizitky · Wander Card),
číslo/kód, oficiální název, **detail URL na webu vydavatele**, stav, typ shody,
jistota (A/B), poznámka, ověřeno k. Celkem 175 produktů u 132 chat.

## Původ (poctivě)
Zpracoval **ChatGPT** (zadal Michal, 22. 7. 2026) — AI kompilace nad oficiálními
seznamy vydavatelů (turisticke-znamky.cz/export.html, .sk, znaczki-turystyczne.pl,
cs.wander-book.com). Pravidlo katalogu: produkt musí označovat **samotnou chatu**
(ne se tam jen prodávat); „neuvedeno" = nenašla se jistá přímá shoda (ne důkaz
neexistence).

## Jak se v projektu bere (DATA-10)
- `scripts/data10-znamky-vizitky.ts` spáruje produkty s našimi publikovanými
  chatami (shoda názvu) → `data/znamky-vizitky/krkonose.json` (dle slugu).
- Na profilu blok **„Sběratelská místa"**: číslo známky/vizitky + **odkaz na
  oficiální detail** + stav. Vše `verified: false` se zdrojem (číslo/odkaz/fakt
  není chráněný — zveřejnit smíme; ověřit se má, že odkaz vede na správný detail).
- **Náhledy obrázků známek/vizitek se NEpřebírají** — grafika je autorské dílo
  vydavatele; doplní se JEN po písemném svolení (Michal oslovil 22. 7. 2026
  Turistické známky s.r.o. i Wander Book). Mechanismus „se-svolením" + zdrojUrl +
  atribuce je připraven z razítek.

## Pokrytí
13 z 23 publikovaných chat má známku a/nebo vizitku (vše jistota A). Zbytek
„neuvedeno" — doplní se, až katalog poroste nebo po ruční kontrole.

## Poznámka k ověřování
Systém = kdo produkt vydává (Turistické známky s.r.o. Rýmařov / Wander Book,
zal. R. Ropek). Stav („aktivní", „vyřazena z projektu", „vedeno v seznamu") je
z katalogu k datu ověření — před tvrzením o dostupnosti na místě vždy ověřit.
