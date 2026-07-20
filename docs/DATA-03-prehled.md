# DATA-03 — přehled křížového ověření kandidátů Krkonoš

## ⚡ Rozhodnutí Michala (chat, 20. 7. 2026 — zapracováno session 26)

1. **✅ 18 potvrzených: POVÝŠIT en bloc** — povyšování běží od příštích sessions (doložené údaje se zdroji + hero fotky z DATA-02).
2. **⚖️ hraniční hotely (Špindlerovka, Tetřevky, Vebrovy): VŠECHNY ZAŘADIT** — v profilu poctivě přiznat charakter horského hotelu.
3. **🏠 penziony/pronájmy: NEZAŘAZOVAT** („penziony bych nezařazoval, horské hotely ano") — kandidáti zůstávají v repu jako doklad s rozhodnutím v interniPoznamky; u Javorky a Studenova výhrada možné revize po ruční kontrole.
4. **🗺️ mimo Krkonoše: založeny kandidátní oblasti** — `data/kandidati/jizerske-hory/` (Chatka Górzystów, Orle, Pešákovna) a `data/kandidati/rudawy-janowickie/` (Szwajcarka); pole `oblast` upraveno.
5. **👥 duplicity: SLOUČENO** (název i GPS se shodovaly) — dvojčata `chata-mamut-656462770` a `lyzarska-bouda-656504528` smazána; nový vyřazovací seznam `data/kandidati/_vyrazeno.yaml` zajišťuje, že je (ani přesunuté objekty) další OSM export znovu nezaloží.
6. **❓ k ruční kontrole: čeká na Michala** (podívá se na weby z domácí sítě).

Stav kandidátů po rozhodnutích: **70 v krkonose/** (76 − 2 duplicity − 4 přesunuté), 3 v jizerske-hory/, 1 v rudawy-janowickie/. Fronta povyšování: 18 ✅ + 3 ⚖️ = **21 profilů**.

---

Stav k 20. 7. 2026, sessions 22–25. Pokrytí: **76/76 kandidátů** má zápis v `interniPoznamky` (source + checked, vše `verified: false`). Tento dokument je souhrn pro rozhodování — plné nálezy s URL jsou v YAML jednotlivých kandidátů v `data/kandidati/krkonose/`.

**Metody podle dávek:** s22 (12 CZ) — obsah webů přes WebFetch + přehled ubytování treking.cz; s23 (18 PL) — jen WebSearch (titulky a domény výsledků: pttk.pl, korona-gor-polski.pl, pl.wikipedia…), obsah stránek neotevřen; s24 (20 CZ) — WebFetch na průchozí weby + checklist treking.cz; s25 (26 CZ) — WebSearch + GPS kontroly. Nic není domyšleno: co je jen z titulků, je tak v zápisu označeno.

**Legenda návrhů:** ✅ povýšit (charakter doložen) · 🔎 povýšit po dořešení detailu (silný signál, chybí otevření webu / doložení provozu) · ⚖️ hraniční případ — verdikt Michal · 🏠 penzion/pronájem — verdikt redakce · 🗺️ mimo Krkonoše · 👥 duplicita v OSM · ❓ k ruční kontrole (nedoloženo nic rozhodného)

## ✅ Navrženo povýšit — charakter doložen (16)

| Kandidát | Země | Nález (zkráceně) |
|---|---|---|
| labska-bouda | cz | web boudy: horský hotel a restaurace, 1340 m, Labská louka (s22) |
| bouda-bile-labe | cz | web boudy: 1000 m, restaurace s terasou (s22) |
| vosecka-bouda | cz | web boudy: 1. zóna, od 1896, bez elektřiny, sezónní; KČT ji řadí mezi 12 nejlepších (s22, s25) |
| chata-dvoracky | cz | web: areál „hotel Štumpovka + bouda Dvoračky“ — vztah objektů vyjasnit (s22) |
| dvorska-bouda | cz | web: 1313 m, 115 lůžek, restaurace 11–16 i pro turisty, od 20. let (s24) |
| nova-klinovka | cz | web (pozor: klinovka.cz → klinovka.com): „Bouda Klínovka“, jen pěšky, 1227 m, restaurace i pro neubytované; název vyjasnit (s24) |
| lesni-bouda | cz | web: bouda + eko farma nad Pecí, restaurace 10:30–17 i pro veřejnost, od 1996 (s24) |
| schronisko-samotnia | pl | pttk.pl + pttk.jgora.pl; **pozor: dle bryla.pl změna nájemce po 60 letech — prověřit provoz (DATA-04)**; možná nový web schroniskosamotnia.com (s23) |
| strzecha-akademicka | pl | pttk.pl, pttk.jgora.pl, vlastní web „Schronisko górskie“ (s23) |
| dom-slaski | pl | web „Dom Śląski … pod Śnieżką“, korona-gor-polski „Schronisko Górskie“; provozovatel z webu (s23) |
| schronisko-pttk-na-hali-szrenickiej | pl | pttk.pl + vlastní web s Noclegy + wikipedia (s23) |
| schronisko-szrenica | pl | web „Schronisko górskie Szrenica“ — prezentuje se i „hostel“, charakter ověřit (s23) |
| schronisko-odrodzenie | pl | vlastní web + „PTTK … na Przełęczy Karkonoskiej“ (s23) |
| schronisko-pttk-na-przeleczy-okraj | pl | pttk.pl + vlastní web + wikipedia; u Pomezních bud (s23) |
| schronisko-pod-labskim-szczytem | pl | pttk.pl + wikipedia; web v OSM chybí — zdroj = stránka PTTK (s23) |
| schronisko-kamienczyk | pl | wikipedia + regionální přehledy; u vodopádu Kamieńczyka; bez webu v OSM (s23) |

K povýšeným navíc s poznámkou o poloze (oba ✅, jen přiznat v profilu — **celkem v sekci 18**): **kochanowka** (PTTK, ale 510 m v podhůří u Wodospadu Szklarki, s23) a **srebrny-potok** (Dolina Srebrnika, Lasocki Grzbiet — východní okraj; PTTK status možná historický, s23).

## 🔎 Povýšit po dořešení detailu (17)

**Chybí jen otevření webu (silný signál charakteru):** bradlerovy-boudy (wikipedia + stránka chaty na kct.cz + článek KČT „12 nejlepších“, s25), medvedi-bouda (2 vlastní weby + wikipedia + „Boudy na hřebenech“, s25), moravska-bouda („Boudy na hřebenech“, turistika.cz, s25), jindrichuv-dum (web „Horská chata v Krkonoších“, s25), chata-jeleni-louky (web + „Horská chata“, s25), amor (web „Horská chata Amor — ubytování a restaurace“; weby dva, s25), sedmidoli (web „bouda Sedmidolí“ + booking, s25), chata-na-plani (pravděpodobně = „Bouda Na Pláni“, boudanaplani.com — potvrdit identitu, s25).

**Chybí doložení provozu (existence doložena checklistem treking.cz / KČT):** martinova-bouda (web opakovaně nedostupný), jelenka (web PROVENANCE), lyzarska-bouda (web nedostupný; duplicitní dvojče viz 👥), richtrovy-boudy (web self-signed SSL), vyrovka (web rozbité SSL; nově: KČT článek „12 nejlepších“ ji jmenuje — silný signál, s25), horska-chata-krakonos (treking.cz, ale zdroj 2019 a web z OSM mrtvý — provoz prověřit, priorita DATA-04, s22) — a bez webu husova-bouda, barborka (51 fotokandidátů DATA-02), helena.

## ⚖️ Hraniční případy — hotel/areál v historických boudách, verdikt Michal (3)

| Kandidát | Nález |
|---|---|
| hotel-spindlerova-bouda | hotel v roli historické hřebenové boudy — obdoba Luční (s22) |
| tetrevi-boudy | web: „Horský hotel Tetřeví Boudy“, 1030 m, wellness (s24) |
| vebrovy-boudy | web + katalogy: hotel/penzion v historických boudách nad Velkou Úpou (s25) |

## 🏠 Penzion / pronájem — verdikt redakce (10)

penzion-roxana (návrh NEzařadit, s22) · chata-studenov (jediný z „penzionové“ skupiny v treking přehledu — slabý pozitivní, s22) · nachodska-bouda („Horský penzion“, Hrnčířské boudy, s25) · u-kotle (= „Penzion U Kotle“, Horní Mísečky, s25) · chata-smetanka („Penzion chata Smetánka“, s25) · lovecka-chata („penzion s tradicí“; **OSM typ útulna je zjevně chybný — nepřebírat**, s25) · konopindova-chata (pronájem celé chaty, s25) · chata-mamut (roubenka k pronájmu, Dolní Malá Úpa, s25) · chata-u-jirky (údolní chata s restaurací, Dolní Dvůr, s24) · javorka (chata dle mapy.com, ale režim nedoložen — web rozhodne, s25)

## 🗺️ Mimo Krkonoše — návrh: nezařazovat, přesunout mezi kandidáty budoucích oblastí (4)

| Kandidát | Pohoří dle nálezů |
|---|---|
| schronisko-pttk-szwajcarka | Rudawy Janowickie / Góry Sokole (Karpniki, 520 m) — s23 |
| chatka-gorzystow | Góry Izerskie — Hala Izerska (PL strana Jizerek) — s23 |
| stacja-turystyczna-orle | Góry Izerskie (u Jakuszyc) — s23 |
| chata-pesakovna | osada Jizerka, Jizerské hory (CZ strana; treking.cz: „horská chata v horské osadě Jizerka“) — s25 |

## 👥 Duplicity v OSM — sloučit, jednoho z páru vyřadit (2)

chata-mamut-656462770 (= chata-mamut, GPS ~1 m) · lyzarska-bouda-656504528 (= lyzarska-bouda, GPS pár metrů; tím padá otázka „dvou Lyžařských bud“ ze s24)

## ❓ K ruční kontrole — nedoloženo nic rozhodného (17)

tereza, sasanka, zvonicka (žádný dosažitelný zdroj, s22) · chatka-puchatka (jméno nese ≥3 objekty, GPS nesedí k žádnému, s23) · betyna (web přes JS; treking sekce „chaty a penziony“, s24) · zaly (rozhledna — patří objekt do průvodce?, s24) · chata-eliska (web 503, s24) · bouda-ruzohorky, bouda-slovanka, chalupa-na-rozcesti, bouda-na-lucinach, chata-hubertka (weby nedostupné; podobnosti jmen z treking výtahu neztotožněny, s24) · zakouti (Vítkovice vs. Harrachov — identita nejasná, s25) · chata-aurora (web ano, ale režim ubytování vs. pronájem nedoložen, s25) · lokomotiva (rekreační zařízení dle mapy.com, charakter nejasný, s25) · novomisecna-bouda + staromisecna-bouda (společný areál na Mísečkách, charakter nedoložen, s25)

## 🎓 Účelové chaty se zvláštním režimem — povýšit jen s poctivým popisem, až se doloží provoz (5)

patejdlova-bouda (horská chata Univerzity Karlovy, s25) · na-mulde (horská bouda UK FTVS, Lučiny; webkamera Horské služby, s25) · chatka-akt-towarzystwa-bazynowego (studentská chatka, Hutniczy Grzbiet, s23) · chatka-smogorniak (turistická chatka nad Podgórzynem, s23) · chatka-wielkanocna (turistická chatka pod Śnieżnymi Kotły, 1251 m, s23)

---

**Kontrolní součet:** 18 ✅ + 17 🔎 + 3 ⚖️ + 10 🏠 + 4 🗺️ + 2 👥 + 17 ❓ + 5 🎓 = **76** ✓. Každý kandidát je právě v jedné sekci; při nesouladu platí zápis v YAML kandidáta (vyrovka a horska-chata-krakonos jsou tu oproti YAML ze s22 posunuty do 🔎 díky novým signálům z s24/s25 — KČT článek, treking checklist).

**Co tento dokument NENÍ:** rozhodnutí. Povyšování do `data/chaty/` proběhne až po Michalově souhlasu (otázky v DENIK.md, sessions 22–25); údaje se při povýšení přebírají jen doložené, se `source` a `verified: false`, hero fotky z kandidátů DATA-02.
