# Zdrojový průzkum článků o chatách — původ a použití

Balík = průzkum článků a faktů o horských chatách ze **4 českých webů**
(Seznam Zprávy, Kudy z nudy, Časopis Turista, Krkonose.eu). Tři tabulky:
`zdrojove_clanky` (63 článků), `fakta_z_clanku` (165 faktů, každý se zdrojovou
URL, návrhem cílového pole, časovou povahou a jistotou), `souhrn_objektu`
(38 objektů, nalinkováno na hut_id / zanik_id). Metodika v `README.md`.

## Původ (poctivě)
Zpracoval **ChatGPT** (zadal Michal, 22. 7. 2026) průchodem uvedených webů.
**Klíčové: jde o SEKUNDÁRNÍ redakční média**, ne primární prameny. README to
říká výslovně — pro finální profily ověřit proti webu chaty, KRNAP/KPN, KČT/PTTK,
archivu či literatuře. Jistota faktů A 62 / B 96 / C 7.

## Jak to v projektu brát (NENÍ to drop-in katalog)
- **Leads + barva + editorial reference**, ne verified data. Cokoli odsud →
  `verified: false` s odkazem na konkrétní článek; časově proměnlivé
  (`dynamické – ověřit před publikací`, 16 faktů) NEpublikovat bez ověření.
- **Pokrytí našich 23 chat:** 66 faktů u 7 chat (Luční, Labská, Vosecká,
  Špindlerova, Dvorská, Dvoračky, Samotnia) — většina **stabilní** (historie,
  výška, gastro, architektura, osobnosti). Vhodné jako doplnění/barva, fill-empty
  a bez přepisu ručně ověřených polí (jako DATA-09), s uvedením článku jako zdroje.
- **Maxova bouda / Maxhütte** → kandidát do atlasu zaniklých (DATA-11); README
  žádá druhý nezávislý zdroj, přesný rok zániku a GPS → zatím NEpřidávat.
- **Zbytek 31 objektů** = z větší části už známí kandidáti z DATA-03 (Výrovka,
  Martinova, Richtrovy, Rýchorská, Brádlerovy, Jelenka, Hrnčířské, Petrova,
  Vrbatova…) nebo objekty mimo Krkonoše pro budoucí pohoří (Beskydy, Šumava,
  Jizerky) — reference, ne akce teď.
- **Seznam článků** = užitečná **verifikační a editoriální reference** (DATA-04
  primární ověřování, psaní příběhů) — ne fakta k automatickému importu.

## Poctivostní mantinel
Sekundární média nesmí snížit laťku „ověřených dat". Fakta odsud jsou vodítko a
barva se zdrojem; `verified: true` až po doložení primárním pramenem.
