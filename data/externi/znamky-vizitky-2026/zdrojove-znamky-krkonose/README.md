# Zdrojové obrázky turistických známek — Krkonoše (26 ks)

**Původ (poctivě):** obrázky stáhl **Michal** z `turisticke-znamky.cz` a poslal
22. 7. 2026 (zip `znamkykrkonosecast.zip`, 27 souborů; z toho 1 duplicitní kotouč
Klínovky → 26 unikátních). Názvy souborů = číslo známky + název kotouče, přečtený
z fyzického vyrytého kotouče (ne odhad). Výšky uvedeny, jen když jsou vyryté na
kotouči.

**Svolení:** Turistické známky s.r.o. (Mgr. David Holub) — e-mail + telefon
22. 7. 2026, kryje obě domény vydavatele. Viz `../PUVOD.md`. Podmínka: dát vědět,
až web pojede.

**Autorské právo:** grafika kotouče je autorské dílo vydavatele. Zde uložené
soubory jsou **zdrojová záloha se svolením**; na web (`public/znamky/…`) se
publikují **jen u chat, které v průvodci reálně máme** (publikované profily).

## Odkaz na detail (poznámka k poctivosti)
Odkazy na detail známky v katalogu (`data/znamky-vizitky/krkonose.json`) i v
manifestu (`obrazky.json`) jsou u nově doplněných čísel **sestaveny podle vzoru
webu** (`…/znamky/<slug>-c<číslo>`), protože ze sandboxu web neproklikneme.
**Číslo** je ověřené z fyzické známky; **odkaz** je k ověření klikem.

## Stav (26 známek)

### ✅ Publikováno — obrázek nasazen na profilu (4)
Obrázek je v `public/znamky/<slug>.png`, záznam v katalogu i manifestu.

| č. | název na známce | výška | slug profilu |
|----|-----------------|-------|--------------|
| 22 | Dvoračky · Štumpovka | 1140 m | `chata-dvoracky` (sdílená známka; po povýšení Štumpovky zvážit přeřazení) |
| 1347 | Tetřeví Boudy | — | `tetrevi-boudy` |
| 2012 | Bouda u Bílého Labe (Špindlerův Mlýn) | — | `bouda-bile-labe` |
| 3092 | Bouda Klínovka | 1227 m | `nova-klinovka` |

### 🕓 Kandidát — obrázek připraven, čeká na povýšení chaty (18)
Chatu máme mezi kandidáty (`data/kandidati/krkonose/`), ale ještě není publikovaná.
Až se povýší, stačí: přesunout obrázek → `public/znamky/<slug>.png`, přidat řádek
do `obrazky.json` a známku do `krkonose.json`.

| č. | název na známce | výška | cílový kandidát |
|----|-----------------|-------|-----------------|
| 12 | Chata Výrovka | 1356 m | `vyrovka` |
| 13 | Chalupa Na Rozcestí | 1349 m | `chalupa-na-rozcesti` |
| 19 | Osada Rezek · Jeruzalém | — | `chata-rezek` (známka pro osadu — prověřit vazbu) |
| 75 | Růžohorky | 1250 m | `bouda-ruzohorky` |
| 390 | Rýchorská bouda | — | `rychorska-bouda` |
| 394 | Brádlerovy Boudy | 1156 m | `bradlerovy-boudy` |
| 671 | Petrova bouda | — | `petrova-bouda` |
| 673 | Pomezní Boudy · Malá Úpa | 1050 m | `pomezni-bouda` |
| 674 | Martinova bouda | 1300 m | `martinova-bouda` |
| 675 | Portášky | 1050 m | `portasky` |
| 1274 | Medvědí bouda | — | `medvedi-bouda` |
| 1336 | Lysečinská bouda | — | `lysecinska-bouda` |
| 1367 | Horská bouda Jelenka | 1260 m | `jelenka` |
| 1602 | Richtrovy boudy | — | `richtrovy-boudy` |
| 1719 | Kolínská bouda · Pec pod Sněžkou | 1117 m | `kolinska-bouda` (číslo opravil Michal 22. 7.) |
| 1873 | Moravská bouda | 1225 m | `moravska-bouda` |
| 2049 | Friesovy Boudy | — | `friesovy-boudy` |
| 2210 | Lyžařská bouda · Liščí louka | 1206 m | `lyzarska-bouda` |

### 🔎 Nový tip — známkové místo mimo náš katalog (4) → prověřeno 22. 7. 2026
Bonus z plánu DATA-10 („zpětné dohledání chaty přes známkové místo"). Prověřeno
přes WebSearch (jen titulky/domény, obsah stránek NEotevřen) — výsledek:

**Nově založeni kandidáti** (`data/kandidati/krkonose/`, verified:false, bez
domýšlené GPS — jako Štumpovka; obrázek známky připraven ke povýšení):

| č. | název na známce | výška (dle známky) | stav |
|----|-----------------|--------------------|------|
| 14 | Chata Rozhled | 1207 m | ✅ kandidát `chata-rozhled` — horská chata Strážné, web chatarozhled.cz (veřejné občerstvení doložit) |
| 393 | Vrbatova bouda | 1400 m | ✅ kandidát `vrbatova-bouda` — bouda/restaurace Zlaté návrší (Wikipedie, Kudy z nudy, Restu); i nálepka existuje |

**Nezaloženo** (známkové místo ano, ale ne chata do průvodce):

| č. | název na známce | výška | proč ne |
|----|-----------------|-------|---------|
| 2027 | Medvědín | 1235 m | vrchol / horní stanice lanovky Špindl — není bouda (region-krkonose.cz, kudyznudy.cz „lanová dráha Medvědín") |
| 2640 | Modrokamenná bouda | — | *rodinný penzion* v Janských Lázních (modrokamennabouda.cz); dle klíče „penzion bez doloženého veřejného občerstvení → ne". Rozhodne Michal, kdyby chtěl přehodnotit. |

## Poznámka
Michal upozornil, že **Krkonoš je známkových míst víc** — tohle není úplný výčet
(„nemám všechny"). Checklist se bude doplňovat, jak přijdou další.

## Křížová kontrola proti ChatGPT katalogu chat (22. 7. 2026)
Otázka Michala: „jsou všechny boudy ze známkové sady v ChatGPT přehledu chat
(`data/externi/katalog-cr-sk-2026/katalog.json`, 307 objektů), abych podle něj
jel doplňování?" **Odpověď: NE — 4 skutečné boudy ze známek v přehledu chybí.**
(Porovnáno normalizovaně přes celý katalog + přímý grep; 0 výskytů = jistá
absence.)

**Chybí v ChatGPT katalogu (boudy do průvodce):**

| č. | bouda | u nás máme? |
|----|-------|-------------|
| 1347 | **Tetřeví Boudy** | **ANO — už publikováno** na webu (katalog ji přesto nemá!) |
| 1274 | Medvědí bouda | ano — kandidát (z OSM/DATA-01) |
| 14 | Chata Rozhled | ano — kandidát (založen 22. 7. přes známku) |
| 393 | Vrbatova bouda | ano — kandidát (založen 22. 7. přes známku) |

**Chybí, ale správně** (nejsou boudy do průvodce): č.2027 Medvědín (vrchol/lanovka),
č.2640 Modrokamenná bouda (penzion Janské Lázně — katalog vylučuje soukromé penziony).

**Závěr:** ostatních **20 známkových míst v katalogu je** a všech 20 už máme
(publikované nebo kandidáti). Katalog je dobrý vodicí základ pro doplňování, ale
**ne jediný zdroj** — sám o sobě by tyhle 4 boudy tiše vynechal (vč. jedné, kterou
už máme na webu). Známková sada + OSM kandidáti je zachytávají. Doporučení: jet
podle katalogu, ale křížit se známkovým checklistem a OSM kandidáty.
