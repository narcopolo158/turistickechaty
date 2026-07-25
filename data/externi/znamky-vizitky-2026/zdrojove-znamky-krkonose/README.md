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

## Stav (26 známek) — aktualizováno 25. 7. 2026

Souhrn: **21 nasazeno**, **3 čekají na povýšení chaty**, **2 vyloučeny**.

### ✅ Publikováno — obrázek nasazen na profilu (21)
Obrázek je v `public/znamky/<slug>.png`, záznam v katalogu (`krkonose.json`)
i v manifestu (`obrazky.json`).

| č. | název na známce | výška | slug profilu |
|----|-----------------|-------|--------------|
| 12 | Chata Výrovka | 1356 m | `vyrovka` |
| 13 | Chalupa Na Rozcestí | 1349 m | `chalupa-na-rozcesti` |
| 19 | Osada Rezek · Jeruzalém | — | `chata-rezek` (známka pro osadu — vazba k prověření) |
| 22 | Dvoračky · Štumpovka | 1140 m | `chata-dvoracky` (sdílená známka; po povýšení Štumpovky zvážit přeřazení) |
| 75 | Růžohorky | 1250 m | `bouda-ruzohorky` (známka pro osadu i boudu — vazba k prověření) |
| 390 | Rýchorská bouda | — | `rychorska-bouda` |
| 393 | **Vrbatova bouda** | 1400 m | `vrbatova-bouda` — **nasazeno 25. 7. 2026** |
| 394 | Brádlerovy Boudy | 1156 m | `bradlerovy-boudy` |
| 671 | Petrova bouda | — | `petrova-bouda` |
| 673 | Pomezní Boudy · Malá Úpa | 1050 m | `pomezni-bouda` (známka pro sedlo/osadu — vazba k prověření) |
| 674 | Martinova bouda | 1300 m | `martinova-bouda` |
| 675 | Portášky | 1050 m | `portasky` |
| 1336 | Lysečinská bouda | — | `lysecinska-bouda` |
| 1347 | Tetřeví Boudy | — | `tetrevi-boudy` |
| 1367 | Horská bouda Jelenka | 1260 m | `jelenka` |
| 1719 | Kolínská bouda · Pec pod Sněžkou | 1117 m | `kolinska-bouda` (číslo opravil Michal 22. 7.) |
| 1873 | Moravská bouda | 1225 m | `moravska-bouda` |
| 2012 | Bouda u Bílého Labe (Špindlerův Mlýn) | — | `bouda-bile-labe` |
| 2049 | Friesovy Boudy | — | `friesovy-boudy` |
| 2210 | Lyžařská bouda · Liščí louka | 1206 m | `lyzarska-bouda` |
| 3092 | Bouda Klínovka | 1227 m | `nova-klinovka` |

### 🕓 Kandidát — obrázek připraven, čeká na povýšení chaty (3)
Chatu máme mezi kandidáty (`data/kandidati/krkonose/`), ale publikovaná není.
Až se povýší, stačí: zkopírovat obrázek → `public/znamky/<slug>.png`, přidat řádek
do `obrazky.json` a známku do `krkonose.json`. Dřív ne — filtr `jeStazitelna`
(DATA-13) pracuje jen s publikovanými chatami.

| č. | název na známce | výška | cílový kandidát | proč ještě čeká |
|----|-----------------|-------|-----------------|-----------------|
| 14 | Chata Rozhled | 1207 m | `chata-rozhled` | veřejné občerstvení NEDOLOŽENO — web zmiňuje jen „Bufet s nápoji a sladkostmi v provozu po celý den.", neříká komu (ověřeno 25. 7. 2026) |
| 1274 | Medvědí bouda | — | `medvedi-bouda` | klíč zařazení NESPLNĚN — web: „Naše restaurace je v současné době otevřena pouze pro ubytované hosty." (ověřeno 25. 7. 2026); formulace „v současné době" → přeověřit |
| 1602 | Richtrovy boudy | — | `richtrovy-boudy` | rešerše zatím neproběhla (fronta Tier 1) |

### ⛔ Vyloučeno — známkové místo ano, ale ne chata do průvodce (2)

| č. | název na známce | výška | proč ne |
|----|-----------------|-------|---------|
| 2027 | Medvědín | 1235 m | vrchol / horní stanice lanovky Špindl — není bouda (region-krkonose.cz, kudyznudy.cz „lanová dráha Medvědín") |
| 2640 | Modrokamenná bouda | — | *rodinný penzion* v Janských Lázních (modrokamennabouda.cz); dle klíče „penzion bez doloženého veřejného občerstvení → ne". Rozhodne Michal, kdyby chtěl přehodnotit. |

### 🔎 Historie: nový tip — známkové místo mimo náš katalog (4) → prověřeno 22. 7. 2026
Bonus z plánu DATA-10 („zpětné dohledání chaty přes známkové místo"). Tehdy
prověřeno přes WebSearch (jen titulky/domény, obsah stránek NEotevřen), obsah
webů obou objektů otevřen až 25. 7. 2026. Výsledek: z č.14 a č.393 vznikli
kandidáti, z nichž **Vrbatova bouda (č.393) je od 25. 7. 2026 publikovaná**
a **Chata Rozhled (č.14) zůstává kandidátem** (viz tabulka výše).
Objekty č.2027 a č.2640 se nezakládaly.

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
| 1274 | Medvědí bouda | ano — kandidát (z OSM/DATA-01); 25. 7. 2026 NEPOVÝŠENA, neprošla klíčem zařazení |
| 14 | Chata Rozhled | ano — kandidát (založen 22. 7. přes známku); 25. 7. 2026 stále kandidát |
| 393 | Vrbatova bouda | ano — **od 25. 7. 2026 publikováno** (založena 22. 7. přes známku) |

**Chybí, ale správně** (nejsou boudy do průvodce): č.2027 Medvědín (vrchol/lanovka),
č.2640 Modrokamenná bouda (penzion Janské Lázně — katalog vylučuje soukromé penziony).

**Závěr:** ostatních **20 známkových míst v katalogu je** a všech 20 už máme
(publikované nebo kandidáti). Katalog je dobrý vodicí základ pro doplňování, ale
**ne jediný zdroj** — sám o sobě by tyhle 4 boudy tiše vynechal (vč. jedné, kterou
už máme na webu). Známková sada + OSM kandidáti je zachytávají. Doporučení: jet
podle katalogu, ale křížit se známkovým checklistem a OSM kandidáty.
