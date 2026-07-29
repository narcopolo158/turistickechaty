# DATA-23 — průchod korpusu rozšířeným klíčem (rozhledny a sedla s občerstvením)

*Zapsáno 29. 7. 2026, denní bezobslužná session. Odpovídá na bod (4) položky
DATA-23: „Až se klíč rozšíří, projít znovu `data/kandidati/**` — kandidáti se
zakládali pod užším klíčem, takže se mohlo něco zamítnout, co dnes projde."*

Rozšířený klíč (rozhodnutí Michala 26. 7. 2026): **rozhoduje občerstvení, ne
typ stavby.** Rozhledna s bufetem a sedlo s chatou patří dovnitř.

Session neměla síť ven (Overpass, Commons ani weby chat ze sandboxu nejdou —
ověřeno znovu 29. 7.), takže průchod vychází **výhradně z dat, která už v repu
leží**: surové OSM exporty, kandidátní a publikované YAML, externí seznamy.
Co z nich nevyplývá, tady netvrdím.

## 1. Měření: kdo má občerstvení doložené přímo v OSM

Průchod všech surových exportů (`data/kandidati/*/_overpass-*.json`) na tag
`amenity` z gastro množiny (restaurant, cafe, bar, fast_food, pub…), spárováno
přes OSM URL s profily a kandidáty:

| stav objektu | počet | poznámka |
|---|---|---|
| publikovaný profil | 9 | Brádlerovy boudy, Chalupa Na Rozcestí, Chata na Pláni, Lesní bouda, Lyžařská bouda, Martinova bouda, Moravská bouda, Tetřeví Boudy, U Kotle |
| **kandidát** | **4** | **Žalý** (krkonose), Hubertka, Lesní bar Krömerova bouda, Stacja Turystyczna Orle (vše jizerske-hory) |
| mimo korpus | 14 | objekty z rozhlednového dotazu v Jizerkách — to jsou právě ty *doklady občerstvení* u věží (Chata Bramberk, Slovanka, Sluneční terasa, Čerťák…), ne samostatní kandidáti |

**Jediný krkonošský nález je `Žalý`** (OSM way/151987319): `amenity=restaurant`,
otvírací doba přes celý rok, telefon i e-mail restaurace. Kandidát z 20. 7. 2026
je označený „K RUČNÍ KONTROLE" s odůvodněním *„Žalý je známý především
rozhlednou — zda objekt u rozhledny patří do průvodce chat, rozhodne redakce"*.
To je přesně ten důvod, který rozšířený klíč ruší. Podrobnosti a otevřená
otázka (jde o restaurační budovu z roku 2013, kdežto rozhledna je stavba jiná
a starší) jsou v `interniPoznamky` kandidáta.

Ostatní tři kandidáti jsou jizerskohorští, tedy mimo pilot — patří do JIZ-01.

## 2. Vyřazené objekty (`data/kandidati/_vyrazeno.yaml`): beze změny

Deset záznamů, znovu přečteno pod rozšířeným klíčem: 2 duplicity OSM a 4 objekty
mimo Krkonoše se klíče netýkají vůbec; 4 penziony (Roxana, Tereza, Zvonička —
Sasanka už byla vrácena 27. 7.) padly na **chybějícím veřejném občerstvení**,
a to rozšíření klíče nemění, protože klíč se rozšířil o typ stavby, ne o měřítko
občerstvení. **Nikdo se nevrací.**

## 3. Externí seznamy v repu: pro pilot nic nového

- **Checklist razitkuj.cz** (`data/razitka/_razitkuj-checklist.json`, 354 míst):
  pět položek se jménem rozhledny nebo sedla, z toho krkonošská jediná —
  „Schronisko PTTK Na Przełęczy Okraj", což je **publikovaný profil**. Ostatní
  leží v Jeseníkách, Českém ráji, na Šumavě a v Kotlině Jeleniogórské.
- **Katalog ČR/SK** (`data/externi/katalog-cr-sk-2026/katalog.json`, 307
  objektů): sedlové a vyhlídkové položky jsou buď naše publikované profily
  (Chata Rezek, Pomezní bouda, Dom Śląski, Odrodzenie, Okraj), nebo jiná
  pohoří. Nic nového pro Krkonoše.
- **Oficiální seznam známkových míst** (DATA-22): krkonošské rozhledny už
  vytříděné 26. 7. — `2048 Rozhledna Panorama` bez doloženého občerstvení
  (nezakládá se), `20 Sněžka` řešena zvlášť.

## 4. Nález, kvůli kterému je průchod neúplný, a klik, který to napraví

**Pilotní oblast nikdy nedostala rozhlednový dotaz.** V `data/kandidati/krkonose/`
leží `_overpass-export-cz.json` a `_overpass-export-pl.json` (chaty), ale
`_overpass-rozhledny-*.json` tam **není** — druhý dotaz na `tower:type=observation`
vznikl 28. 7. 2026 a ostrý běh proběhl zatím jen pro Jizerské hory (kde rovnou
dal osm kandidátů). Krkonošská tabulka výš proto říká „mezi objekty, na které
jsme se ptali", ne „mezi objekty, které tam jsou".

Sandbox denních sessions na Overpass nedosáhne (ověřeno znovu 29. 7. 2026 —
overpass-api.de i kumi.systems nedostupné), takže to je jeden klik pro Michala:

> **Actions → „DATA-01: OSM export chat (dle oblasti)" → Run workflow →
> oblast: `krkonose`**

Skript i workflow jsou na to připravené (oblast je parametr, `scripts/oblasti.ts`
Krkonoše zná) a existující kandidáty ani ruční profily nepřepisují. Běh
commitne surový export i nové kandidáty; teprve pak bude průchod DATA-23 nad
pilotem úplný a položka se dá odškrtnout.

## 5. Vedlejší nález: kontrola jmenovců rozhledny neviděla

Typ `rozhledna` přinesl do korpusu jména, která typovým slovem **začínají**
(„rozhledna Slovanka", „Wieża Widokowa Mirsk"). `scripts/kontrola/kolize-jmen.ts`
mezi typovými slovy „rozhlednu" neměl, takže jádra `rozhledna slovanka`
a `slovanka` padla do dvou různých hromádek — a jeden skutečný jmenovec tím
zůstal nenahlášený:

- **krkonose/bouda-slovanka** — Bouda Slovanka, publikovaný profil, obec Černý Důl
- **jizerske-hory/rozhledna-slovanka** — rozhledna Slovanka, kandidát, ~40 km jinam

Opraveno týž den (typová slova `rozhledna`, `rozhledny`, `wieza`, `widokowa`,
`vyhlidka`), pár zapsán do `data/_jmenovci.yaml` k potvrzení Michalem. Kontrola
je zase na nule; byl to **jediný** nález opravy nad dnešním korpusem
(186 profilů s názvem, 111 objektů).
