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

## Pokrytí (přeměřeno 26. 7. 2026, DATA-19)

Původní věta zněla: „15/23 publikovaných chat má v katalogu shodu; doplněno
u 13. Zbylých 8 (Bílé Labe, U Jirky, Dvorská, Krakonoš, Lovecká, Hali
Szrenickiej, Tetřeví, Vebrovy) v katalogu není." Byla nepřesná ve dvou
věcech a je nahrazena tímhle. Nechávám ji tu citovanou, aby bylo vidět, co
se opravovalo.

**Za prvé: „v katalogu není" neplatilo.** Dvě z osmi chat v katalogu jsou,
jen je párování minulo kvůli skloňování — ne kvůli diakritice, tu
`normalizuj()` řeší odjakživa:

| náš název | v katalogu | důvod neshody |
| --- | --- | --- |
| Bouda Bílé Labe | Bouda u Bílého Labe (HUT-0011) | 2. pád + vsunuté „u" |
| Schronisko PTTK na Hali Szrenickiej | Hala Szrenicka (HUT-0224) | 6. pád, polsky |

Opraveno v datech, ne v porovnávači: obě jména jsou zapsaná jako `aliasy`
v profilech, a protože `shodaNazvu()` aliasy čte, shoda od té chvíle vzniká
sama. Prospívá to i DATA-05 (párování razítek). Tolerantnější porovnávač
(osekávání koncovek) by tyhle dva případy chytil taky, ale platilo by se za
to falešnými shodami jinde — křížová kontrola našla dvě dvojice, které jsou
si blízko na mapě a přitom to jsou jiné objekty (Krakonoš × Pražská bouda
254 m, Vebrovy × Pražská bouda 1039 m).

**Za druhé: číslo 8 platilo pro korpus o 23 profilech.** Dnes jich je 42.

Stav po opravě: katalog má 41 řádků, korpus 42 publikovaných profilů
Krkonoš, shodu má **35 profilů ↔ 35 řádků**.

Bez shody zůstává 7 profilů — ty v katalogu opravdu nejsou: Chata U Jirky,
Dvorská bouda, Horská chata Krakonoš, Lovecká chata, Tetřeví Boudy, Vebrovy
boudy, Vrbatova bouda.

Bez shody zůstává 6 řádků katalogu — a to není chyba párování: všech šest
objektů u nás existuje jen jako kandidát, a `data09-fakticka-data.ts` čte
pouze `data/chaty/`. Jde o Erlebachovu boudu (HUT-0008), Pražskou boudu
(HUT-0021), Hrnčířské boudy (HUT-0024), Richtrovy boudy (HUT-0028), Chatu
Pod Studničnou (HUT-0029) a Schronisko Nad Łomniczką (HUT-0220). Až se
některý z nich povýší mezi publikované, katalogová data si najde sám.

## Co čeká na doplnění

DATA-09 od doby, kdy korpus vyrostl z 23 na 42 profilů, neběželo. Nasucho
teď hlásí, že by doplnilo 8 profilů — a doplnit se to samo nesmí, viz
poznámka o ověřování níž. K oční kontrole tedy zbývá:

- Brádlerovy boudy — telefon
- Friesovy boudy — 3 milníky
- Jelenka — rok vzniku 1936, 1 milník
- Kolínská bouda — rok vzniku 1927, 1 milník
- Lyžařská bouda — rok vzniku 1717, 2 milníky
- Martinova bouda — rok vzniku 1642, 1 milník
- Moravská bouda — rok vzniku 1876
- Výrovka — kapacita 65

U Kolínské je to rovnou vidět: katalog dává 1927, Michal uvádí 1719. Nemusí
si to odporovat (starší bouda × dnešní stavba), ale rozhodnout to od stolu
nejde. Přesně proto se dávka nepřebírá automaticky.

## Poznámka k ověřování
Data jsou vodítko, ne pravda. `verified: true` až po ruční kontrole Michalem
(telefonát/návštěva/oficiální zdroj) — pak se `verified` přepne v YAML chaty.
