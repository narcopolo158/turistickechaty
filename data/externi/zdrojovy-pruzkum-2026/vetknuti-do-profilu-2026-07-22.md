# DATA-12 — vetknutí ověřitelné barvy ze zdrojového průzkumu do 7 profilů

**Datum:** 2026-07-22 · **Zdroj:** `fakta_z_clanku_pro_turistickechaty_2026-07-22.csv`
(zdrojový průzkum, sekundární redakční média — viz `PUVOD.md`).

## Metoda a poctivostní mantinel

Do 7 vlajkových profilů (Luční, Labská, Vosecká, Špindlerova, Dvorská, Dvoračky,
Samotnia) se ručně („editorial pass", ne skript) vetkávala jen **stabilní**
ověřitelná fakta. Pravidla:

- **Fill-empty:** strukturovaná pole (kapacita, rokVzniku) se doplnila jen tam,
  kde byla prázdná — ruční/ověřená data se nepřepisují.
- **Přírůstek do seznamů:** milníky a zajímavosti se **přidávají** (tyto profily
  už seznamy měly), nededuplikují se roky ani se nemění stávající položky.
- **Každý údaj nese zdroj** (publikace + název článku, u milníku inline `#`
  komentář, u zajímavosti pole `zdroj`, blokově v `overeniHistorie`/`zdroje`) a
  je **`verified: false`** — sekundární médium, před publikací ověřit primárním
  pramenem (web chaty, KRNAP/KPN, KČT/PTTK, archiv).
- **Dynamické** údaje (`dynamické – ověřit před publikací`) se NEvetkávaly.
- Milníky pole schématu (`rok`, `udalost`) nemá `zdroj` → provenience jde
  komentářem + blokem `overeniHistorie` + `zdroje`.

## Co bylo vetknuto (po chatách)

### Luční bouda
- milník **1707** — první písemný doklad, kupní smlouva (Christoph Erben) — FACT-0005
- milník **1772** — rodina Rennerů (~100 let, výroba mléčných a bylinných sýrů) — FACT-0006 + FACT-0007
- zajímavost — válečný projekt s **tunelem pro tok řeky** (realizován zčásti) — FACT-0010
- zajímavost — plachtařská škola **Eugena Bönsche** — FACT-0011
- zdroj: Seznam Zprávy „Historie Luční boudy". *Cross-confirm:* FACT-0004 potvrzuje náš údaj o základním kameni 1623 (nalezen při přestavbě 1869).

### Labská bouda
- milník **1904** — první přírodní rezervace v Krkonoších (jistota A) — FACT-0027
- milník **1913** — úmrtí lyžaře **Bohumila Hanče** (jistota A) — FACT-0028
- milník **2012** — vlastníkem Salvario Holdings — FACT-0032
- zajímavost — **devítipodlažní železobetonová stavba** (vstup nahoře, výtahy dolů) — FACT-0022
- zdroje: Krkonose.eu, Seznam Zprávy „…betonový kolos". *Cross-confirm:* telefon FACT-0029 = shodný s naším; FACT-0023 (die Blasse) odpovídá našemu milníku 1830 (ponecháno webové znění).

### Vosecká bouda
- historické názvy (aliasy) — **Česká nová**, **Františkánská** (jistota A) — FACT-0059
- milník **1900** — přestavba a rozšíření — FACT-0060
- zajímavost — připravovaná **fotovoltaika** 12,74 kWp / baterie 70,4 kWh, ~11,5 t CO₂/rok (**projektový předpoklad**) — FACT-0067 + FACT-0068
- zdroje: Krkonose.eu, Časopis Turista (fotovoltaika), Seznam Zprávy.
- **Rozpor zapsán, nezměněn:** kapacita — Seznam Zprávy 43 (= náš údaj), Krkonose.eu 42 (FACT-0063). Ponecháno 43, poznámka pro DATA-04.

### Hotel Špindlerova bouda
- **kapacita 153** (fill-empty; web hotelu neuvádí) — FACT-0092
- milník **1824** — Franz Spindler vybudoval boudu — FACT-0088
- milník **1826** — požár a obnova — FACT-0089
- milník **1855** — Johann Hollmann, rozvoj jako horský hotel — FACT-0090
- milník **2005** — požár přístavby (ne hlavní budovy) — FACT-0091
- zdroje: Krkonose.eu, Seznam Zprávy „Legendární Špindlerovka". *Cross-confirm:* 2. telefon FACT-0094 už dřív zaznamenán v `overeniProvoz`; GPS FACT-0093 blízko naší OSM hodnotě.

### Dvorská bouda
- **rokVzniku 1707** (fill-empty; web uváděl jen „od 20. let") — FACT-0137
- milník **1707** — vznik, chov dobytka do 2. pol. 19. stol. — FACT-0138
- milník **1945** — rod Adolfů (vlastnictví do 1945) — FACT-0139
- zdroj: Kudy z nudy. *Cross-confirm:* kapacita 115 (FACT-0135) = shodná s naší.

### Chata Dvoračky (největší přírůstek — profil neměl historii)
- **rokVzniku 1688** (fill-empty) — FACT-0052
- milník **1688** — první písemná zmínka (letní boudy ~50 krav a 80 koz) — FACT-0052
- milník **1945** — po válce vrácena Elle Půhonné, později znárodněna — FACT-0053
- milník **1990** — rodina Starých provozuje od počátku 90. let — FACT-0054
- zajímavost — **borůvkové knedlíky** a domácí pečené housky — FACT-0051
- zdroj: Seznam Zprávy „Krkonošské Dvoračky…".

### Schronisko Samotnia
- milník **1934** — poslední významné rozšíření (jistota A) — FACT-0127
- zdroj: **Krkonose.eu „Polské Krkonoše"** — první nezávislý sekundární pramen
  profilu (dosud jen OSM + titulky), cross-confirm 1670, telefonu i e-mailu
  (FACT-0126, 0129, 0130). Výška: Krkonose.eu 1200 vs. naše OSM 1195 (drobný
  rozdíl, ponecháno OSM).

## Co bylo VĚDOMĚ přeskočeno (a proč)

- **Dynamické údaje** (`dynamické – ověřit před publikací`): Luční pivovar Paroháč
  (FACT-0013; už je ve `specialita`), Dvorská celoroční provoz / stanování /
  zimní přeprava (FACT-0136, 0140, 0141), Dvoračky výměna budovy kvůli dřevomorce
  (FACT-0056), Vosecká otvírací doba kuchyně (FACT-0066), Špindlerova jízdní řád
  autobusu (FACT-0095).
- **Duplicitní / už zapsané:** nadmořské výšky (všechny), GPS (Labská, Vosecká,
  Špindlerova), telefony/e-maily potvrzující stávající hodnoty (Labská, Vosecká,
  Špindlerova 2. číslo, Samotnia), Labská meteostanice/observatoř a Vosecká
  „bez elektřiny / nikdy nevyhořela" (už zajímavosti).
- **Nejednoznačné → nezapsáno jako strukturované pole:** Luční kapacita „až 150
  hostů" (FACT-0012 — nejasné, zda historická či dnešní; kapacita proto NEnastavena);
  Luční superlativ „nejvýše položená restaurace a pivovar střední Evropy"
  (FACT-0015, jistota C — slabší než náš stávající údaj).
- **Patří jinému objektu:** Dvoračky — požár Štumpovky 1990 (FACT-0055) náleží
  profilu Štumpovka, ne Dvoračkám.
- **Obecná fakta bez `hut_id`** (38 řádků o „Krkonošských boudách", historii
  regionu apod.): regionální kontext pro budoucí přehledovou stránku, nevkládá se
  do jednotlivých profilů.

## Souhrn přírůstku

| Chata | rokVzniku | kapacita | +milníky | +zajímavosti | +historické názvy | +zdroje |
|---|---|---|---|---|---|---|
| Luční | — (1623) | — | +2 | +2 | — | +1 |
| Labská | — (1975) | — | +3 | +1 | — | +2 |
| Vosecká | — (1743) | (43) | +1 | +1 | +2 | +3 |
| Špindlerova | — (1784) | **+153** | +4 | — | — | +2 |
| Dvorská | **+1707** | (115) | +2 | — | — | +1 |
| Dvoračky | **+1688** | — | +3 | +1 | — | +1 |
| Samotnia | — (1670) | (49) | +1 | — | — | +1 |

Vše `verified: false`. Primární ověření (překlopení na `verified: true`) je úkol
redakce / DATA-04.
