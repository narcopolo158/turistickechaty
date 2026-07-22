# 01 — Datový snapshot 5 validačních profilů

**Účel:** design session nekreslí nad lorem ipsum. Tady je **reálný obsah** pěti
profilů napříč 16 sekcemi obsahového modelu (`docs/profil-chaty-model.md`), včetně
**stavů**, které musí design zvládnout: prázdné sekce, `verified:false` všude,
dynamické varování, rozpor zdrojů, hedgované tvrzení, chybějící výška.

Pět profilů je zvoleno tak, aby **rozbilo** každý pohodlný předpoklad:

| # | Profil | Role v testu | Skóre dat |
|---|---|---|---|
| A | **Luční bouda** | maximální profil — vše naráz, hlídat, ať se nezahltí | 25 (nejvyšší) |
| B | **Vosecká bouda** | střední, sezónní, historické názvy, hedgované tvrzení | 14 |
| C | **Schronisko Samotnia** | přeshraniční PL, dynamické varování (změna nájemce) | 11 |
| D | **Obří bouda** | zaniklá — jen historická vrstva, žádný provoz | (atlas) |
| E | **Lovecká chata** | řídká — bez hera, bez výšky, údolní penzion (minimální profil) | 5 (nejnižší) |

Legenda stavů: **✅ vyplněno** · **▫️ prázdné → sekce se nezobrazí** (model §2:
nikdy prázdné pole vedle pole) · **⚠️ dynamické / stárne** · **⛔ rozpor / hedge**.

---

## A · Luční bouda — „maximální profil"

*Test: nejbohatší stránka průvodce. Design musí unést hustotu, aniž ztratí klid.
Když funguje tady i u profilu E, funguje všude.*

- **1 Identita** ✅ Luční bouda · typ obsluhovaná (web „Hotel Luční bouda" —
  přiznáno) · stav v-provozu · CZ → Krkonoše · Pec pod Sněžkou.
- **2 Hero + fakta** ✅ **hero foto** (Wikimedia, S. Dusík, CC BY-SA 4.0) · výška
  **1 410 m** · celoročně · „ověřeno" = nejnovější `checked` napříč bloky (dnes
  2026-07-22).
- **3 Charakteristika** ✅ perex + 3 odstavce „byl jsem tam" tónem.
- **4 Provoz** ✅ ⚠️ celoročně; bufet 10–17; restaurace na rezervaci. *Pozn.:
  provoz 2025 byl omezen sporem s KRNAP → typický dynamický údaj, který stárne.*
- **5 Nocleh** ✅ 5 typů pokojů (Gallery → spacákové patro), ceny „od". ▫️
  **kapacita lůžek chybí** (web ji neuvádí; „až 150 hostů" z článku vědomě
  NEnastaveno — historické vs. dnešní nejasné). Design: sekce nocleh je bohatá i
  bez čísla kapacity.
- **6 Občerstvení** ✅ specialita: rohlíky, borůvkové koláče, pivo Paroháč.
- **7 Služby** ⛔ jen část (wc, karty ano; voda/wifi/psi = „nezjištěno"). Test
  modelového „vždy zobrazit, i nezjištěno" — kontrast s tím, že jinde se prázdné
  skrývá.
- **8 Odkud vyjít** ✅ **2 trasy s profily** (Špindlerův Mlýn 6,8 km, Pec 8,0 km) —
  km, čas DIN, převýšení, **výškový profil** (area-chart), geometrie pro mapu. ⚠️
  značení úseků zatím nedoplněno (čeká na Michalovo potvrzení barev).
- **9 Sousední chaty** ✅ přechody z grafu (DATA-06).
- **10 Sběratelská místa** ✅ **razítko: 6 reálných otisků** (razitkuj.cz, se
  svolením) · **známka č. 11** (aktivní) · **vizitka CZ-411 ⛔ „vyřazena z projektu
  2025"**. → Design tu má všechny tři faux-3D objekty + jeden ve stavu „vyřazená".
- **11 Historie** ✅ **10 milníků** (1623 → 2004), rok vzniku 1623. Nejdelší časová
  osa v sadě — test „mountované pohlednicové osy".
- **12 Zajímavosti** ✅ **5** (vč. válečného tunelu pro řeku a plachtařské školy).
- **13 Média** ✅ 1 hero foto. ▫️ galerie/pohlednice zatím ne.
- **14 Mapa** ✅ GPS + 2 trasy (geometrie).
- **15 Zdroje/ověření** ✅ 3 zdroje, všechny bloky `verified:false`, mix `checked`
  dat (2026-07-19 web + 2026-07-22 průzkum). Test „stav ověření jako motiv".
- **16 Osobní stopa** ▫️ Fáze 4 (přihlášení) — v modelu je, teď prázdná.

---

## B · Vosecká bouda — „střední, sezónní, s historií"

*Test: sezónnost, historické názvy do hlavičky, hedgované („projektový
předpoklad") tvrzení, rozpor zdrojů.*

- **1 Identita** ✅ + **historické názvy: „Česká nová", „Františkánská"** (aliasy) →
  design hlavičky musí unést cizí/historické názvy jako muzejní štítek.
- **2 Hero + fakta** ✅ hero foto (Wikimedia, CC BY-SA 3.0) · 1 260 m · ⚠️
  **sezónní** („1. 6. – 28. 10. 2026" — datum stárne rok co rok).
- **3 Charakteristika** ✅ perex + 2 odstavce.
- **4 Provoz** ✅ ⚠️ sezónní.
- **5 Nocleh** ✅ ⛔ **kapacita 43 — rozpor: Seznam 43 vs. Krkonose.eu 42** (zapsáno
  43 + poznámka). Design: jak ukázat údaj, u kterého se prameny neshodnou?
- **6 Občerstvení** ▫️ web gastro pro veřejnost nepopisuje → **nezapsáno** (poctivě
  prázdné). Test: sekce se prostě nezobrazí.
- **7 Služby** ▫️ nespecifikováno; jen „bez elektřiny — dieselagregát" jako fakt.
- **8 Odkud vyjít** ✅ trasa (Harrachov ~8 km).
- **9 Sousední chaty** ✅ přechody.
- **10 Sběratelská místa** ✅ razítko **4 otisky** · známka č. 24 (aktivní) · vizitka
  CZ-2065 (aktivní). Plný aktivní komplet — kontrast s Luční „vyřazenou".
- **11 Historie** ✅ 3 milníky (1743, 1896, 1900), rok 1743.
- **12 Zajímavosti** ✅ 3 — vč. ⛔ **fotovoltaiky (12,74 kWp / 70,4 kWh) jako
  „projektový předpoklad"**. Design hedge: jak vizuálně odlišit fakt od záměru?
- **14 Mapa** ✅. **15 Zdroje** ✅ 5 zdrojů (nejvíc v sadě po vetknutí DATA-12).
- **16 Osobní** ▫️.

---

## C · Schronisko Samotnia — „přeshraniční + dynamické varování"

*Test: polský název primární, CZ/DE do historických, a hlavně **dynamický stav**
— provozovatele nedávno vystřídal nový nájemce.*

- **1 Identita** ✅ **Schronisko Samotnia (PL název primární)** · alias „Schronisko
  PTTK Samotnia" · PL → Krkonoše/Karkonosze · Karpacz.
- **2 Hero + fakta** ✅ hero foto (Wikimedia, CC BY-SA 4.0, „nad Małym Stawem") ·
  výška 1195 m (⛔ Krkonose.eu uvádí 1200 — drobný rozpor, ponecháno OSM).
- **3 Charakteristika** ✅ perex + 2 odstavce — **oba nesou dynamické varování.**
- **4 Provoz** ⚠️⚠️ **KLÍČOVÝ TEST:** „po 60+ letech skončila rodina Siemaszków,
  nastupuje nový nájemce → provoz PROVĚŘIT" (bryła.pl). Kontakty možná neplatné.
  Design **musí** mít stav „provoz nepotvrzen / údaj se mění" jako viditelný prvek,
  ne skrytou poznámku.
- **5 Nocleh** ✅ kapacita 49. **6 Občerstvení** ▫️.
- **8 Odkud vyjít** ✅ (částečně z fallbacku — Karpacz nemá v OSM podbody Wang/Kopa).
- **10 Sběratelská místa** ✅ razítko **2 otisky** · **známka č. 52 (polský systém
  znaczki-turystyczne.pl)** · vizitka PL-40 („Turistická chata Samota"). → Design
  faux-3D musí zvládnout **polský i český sběratelský systém** vedle sebe.
- **11 Historie** ✅ 2 milníky (1670, 1934), rok 1670.
- **12 Zajímavosti** ✅ 1. **15 Zdroje** ✅ 6 (vč. bryła.pl titulku „neotevřeno").
- **16 Osobní** ▫️.

---

## D · Obří bouda — „zaniklá" (jiná šablona: atlas)

*Test: objekt bez provozu. NEmíchá se do živého katalogu/mapy/routingu — má
vlastní stránku `/zanikle`. Design „za tmy" / historická atmosféra.*

- **Identita** ✅ Obří bouda · **historický název Riesenbaude** · Česko · Obří pláň
  pod Sněžkou · **stav: zaniklá**.
- **Časový rozsah** ✅ **1847 → 1982** (postavil kupec Mittlöhner → demolice po
  devastaci). Éra místo „provozu".
- **Co je dnes** ✅ „upravené vyhlídkové místo a zbytky základů" · patrné
  pozůstatky ano.
- **Přístupnost** ✅ „na značené trase" (mezi Sněžkou a Obřím sedlem; ⚠️ Obří důl
  sezónní omezení).
- **Příběh** ✅ jeden odstavec.
- **GPS** ✅ přesná (v bboxu). **Jistota** A. **Zdroje** ✅ 3 (zanikleobce.cz,
  archakrkonos.cz, krkonose.eu).
- **Sběratelské** ▫️ žádné razítko/známka/vizitka. **Pohlednice** ▫️ zatím žádné
  (dobové snímky = autorská práva, řeší se zvlášť). → **Design zaniklé stránky
  stojí a padá s dobovými pohlednicemi, které ZATÍM nemáme** → navrhovat
  z placeholderu „ghost pohlednice".
- **Provoz / nocleh / trasy / sousedé** ⛔ **záměrně žádné** — zaniklý objekt není
  cíl výletu. Design nesmí nabízet „naplánovat cestu".

---

## E · Lovecká chata — „minimální profil"

*Test: nejtenčí legitimní profil. Když se design rozsype na neúplnosti tady,
rozsype se v provozu. Slib modelu §2: žádný profil nejde ven pahýlový.*

- **1 Identita** ✅ Lovecká chata · obsluhovaná (penzion) · CZ → Krkonoše · Velká
  Úpa. **Poctivě: údolní penzion, ne hřebenová bouda.**
- **2 Hero + fakta** ⛔⛔ **BEZ HERO FOTKY** (DATA-02 nenašla licenčně čistou) **A
  BEZ VÝŠKY** (web ji neuvádí). → Test úplně nejtvrdší: model slibuje „hero nebo
  důstojný placeholder + výška + pohoří" — a tady chybí i výška. Design musí mít
  **důstojný placeholder** (ne rozbité prázdno) a zvládnout hlavičku bez výšky.
- **3 Charakteristika** ✅ perex + 2 odstavce (jediná bohatá sekce).
- **4 Provoz** ✅ restaurace denně 11–21.
- **5 Nocleh** ✅ ano, ▫️ kapacita neuvedena.
- **6 Občerstvení** ✅ veřejná restaurace (důvod zařazení).
- **7 Služby** ▫️. **8 Odkud vyjít** ▫️ (údolní objekt, trasy neřešeny).
- **9 Sousední** ▫️. **10 Sběratelská místa** ▫️ **žádné** — razítko/známka/vizitka
  všechny **prázdné → „duch/slot" stavy**. Test: jak vypadá sběratelský pruh, když
  se nedá nic sebrat? (Model: buď skrýt, nebo „tady zatím sběratelský objekt není".)
- **11 Historie** ▫️. **12 Zajímavosti** ▫️.
- **13 Média** ▫️ **žádné foto** → placeholder. **14 Mapa** ✅ jen bod (GPS z OSM).
- **15 Zdroje** ✅ 2 (web + OSM), `verified:false`.
- **16 Osobní** ▫️.

**Souhrn E:** z 16 sekcí je reálně naplněných ~6. Design minimálního profilu =
identita + důstojný placeholder + charakteristika + provoz + mapa-bod + zdroje.
Vše ostatní se **poctivě nezobrazí** (a „co ještě doplňujeme" smí být přiznané).

---

## Co z toho pro design plyne (shrnutí stavů k navržení)

Design session musí navrhnout vizuál pro **každý** z těchto stavů — všechny jsou
v sadě reálně přítomné:

1. **Prázdná sekce** → nezobrazit (E, D, B-občerstvení). Nikdy „neuvedeno" vedle
   plného pole.
2. **`verified:false` všude** → to je výchozí stav CELÉHO webu dnes. „Ověřeno
   redakcí" (`verified:true`) zatím **nemáme ani jednou** — design nesmí
   předpokládat zelené fajfky. Stav „převzato ze zdroje" musí být elegantní, ne
   varovný.
3. **Dynamické / stárnoucí** (C-provoz, B-sezóna, A-provoz) → viditelný znak stáří.
4. **Rozpor zdrojů** (B-kapacita 42/43, C-výška 1195/1200) → jak zobrazit „prameny
   se neshodnou".
5. **Hedge / tvrzení** (B-fotovoltaika „předpoklad", A-superlativy „dle
   provozovatele") → odlišit fakt od tvrzení/záměru.
6. **Chybějící kotva** (E bez výšky, E/lovecká + Špindl. bez hero) → důstojný
   placeholder.
7. **Sběratelské stavy:** plný aktivní (B), s „vyřazenou" (A), přeshraniční PL+CZ
   (C), úplně prázdný/ghost (E), historický bez objektů (D).
