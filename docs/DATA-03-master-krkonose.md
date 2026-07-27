# Master seznam krkonošských chat — sjednocení zdrojů

**Stav k 25. 7. 2026.** Jedna tabulka, podle které lze doplňovat průvodce bez rizika, že bouda propadne mezi zdroji. Slučuje čtyři zdroje:

- **Naše publikované** profily (`data/chaty/krkonose/`)
- **Naši kandidáti** (`data/kandidati/krkonose/`, hlavně OSM/DATA-01 + ruční)
- **ChatGPT katalog** chat ČR/SK/PL (`data/externi/katalog-cr-sk-2026/`, jen Krkonoše)
- **Turistické známky** — sada od Michala (číslo = zpětný checklist míst)

Poctivost: sloučení je čistě organizační pomůcka. Nic tu není „ověřeno" — publikuje se dál jen po vlastní kontrole (konvence B). Známka 📷 = obrázek už nasazen na profilu.

## Souhrn

- **Publikováno:** 55 *(aktualizováno 27. 7. 2026 podruhé — z fronty DATA-27 povýšena i druhá trojice, tentokrát od konce fronty: Srebrny Potok, Patejdlova bouda a Barborka — první profil korpusu se stavem mimo-provoz)*
- **Kandidáti k doplnění:** 33 — z toho Tier 1 (známka + katalog) 0, Tier 2 (jen známka) 0, Tier 3 (jen katalog) 2 (**oba blokované otázkou na Michala:** Hrnčířské boudy = enkláva, ne objekt — rozpustit?; Raisova chata na Zvičině = Podkrkonoší — založit oblast?), Tier 4 (jen OSM) 31. *Křížová kontrola 27. 7. 2026: kandidátských souborů bez hlavičky POVÝŠENO je v `data/kandidati/krkonose/` **35** — rozdíl proti 33 jsou přesně dva ruční kandidáti založení 26. 7. (Poštovna na Sněžce, Modrokamenná bouda), kteří do tierové struktury zatím nejsou zařazení (Modrokamenná nese známkový spor 2640×2540, Poštovna známku č. 20 — oba by patřili nejspíš do Tier 2; zařadit při příští revizi tabulek).*
- **Vyřazeno** (nezakládat): 10
- Objektů se známkou: 35 · v ChatGPT katalogu: 42 · katalogových Krkonoš celkem: 42
- **Katalog je od 25. 7. 2026 pokrytý celý** — poslední objekt, který nám z něj chyběl (Schronisko PTTK „Nad Łomniczką"), je nově kandidátem. Pokrytí znamená jen „víme o něm", ne „ověřeno".

## Klíčové zjištění — nejet jen podle ChatGPT katalogu

Katalog **nemá 4 boudy**, které jsou ve známkové sadě (a jednu z nich už máme na webu):

| č. známky | bouda | u nás |
|---|---|---|
| 14 | Chata Rozhled | kandidát |
| 393 | Vrbatova bouda | **publikováno 25. 7. 2026** |
| 1274 | Medvědí bouda | kandidát |
| 1347 | Tetřeví Boudy | publikováno |

Navíc **7 našich publikovaných** chat v katalogu není: Chata U Jirky, Dvorská bouda, Horská chata Krakonoš, Lovecká chata, Tetřeví Boudy, Vebrovy boudy, Vrbatova bouda. → katalog je dobrý vodicí základ, ale ne úplný; křížit se známkami a OSM.

## Fronta k doplnění — kandidáti dle síly signálu

### Tier 1 — potvrzeno známkou i katalogem (doplňovat první)

| Bouda | Známka | ChatGPT katalog | Naše výška | Typ |
|---|---|---|---|---|
| 🇨🇿 Richtrovy Boudy | č.1602 | ✓ 1206 m | 1136 m | obsluhovana |

~~**Pokus o povýšení 26. 7. 2026 (ráno) — NEPOVÝŠENO, blokuje klíč zařazení.**~~
**POVÝŠENO 26. 7. 2026 večer** — Michal týž den rozšířil klíč zařazení (DATA-25:
bouda s turistickou minulostí se uvádí i bez dnešní veřejné služby, s poctivou
poznámkou). Profil `data/chaty/krkonose/richtrovy-boudy.yaml` nese celou vlastnickou
linku (1946 Obchodní akademie → 1950 ministerstvo školství → NIDV/NPI → 2020
Policejní prezidium), přiznává nedoložený dnešní veřejný provoz i rozpory (výška
1136 × 1206 m; čtyři čísla kapacity — žádné nezapsáno). Ranní rešerše je celá
zachycená v kandidátovi.

### Tier 2 — jen známka (katalog je nemá — přesto reálné boudy)

| Bouda | Známka | ChatGPT katalog | Naše výška | Typ |
|---|---|---|---|---|
| 🇨🇿 Chata Rozhled | č.14 | — | — | obsluhovana |
| 🇨🇿 Medvědí bouda | č.1274 | — | — | obsluhovana |

~~**Přeověřeno 26. 7. 2026 (ráno) — ani jedna nepovýšena, obě drží klíč zařazení.**~~
**OBĚ POVÝŠENY 26. 7. 2026 večer** po rozšíření klíče zařazení (DATA-25). Chata
Rozhled: profil přiznává, že komu bufet slouží, žádný pramen neříká; kapacita
nezapsána (26 × 55 × rozpis 24). Medvědí bouda: profil nese rozpor „restaurace jen
pro ubytované" (oba weby) × svědectví Michala z léta 2025 (borůvkové knedlíky bez
noclehu) — nerozhodnuto, přiznáno v próze. Telefonáty (DATA-04) zůstávají cestou
k rozhodnutí obou otázek, povýšení na nich už neviselo.

**Pozn. 26. 7. 2026 — tabulky tierů zastaraly proti DATA-22:** oficiální seznam
vydavatele doložil známku č. 2249 u **Pražské boudy** (v tabulce níž vedena v Tier 3
„jen katalog") — fakticky tedy patří do Tier 1 (známka + katalog). Přeověřena
26. 7. 2026 stejným výsledkem: restaurace s barem a veřejnou otvírací dobou na
Firmy.cz, ale **věta o obsluze neubytovaných nikde** — nepovýšena, rozhodne
telefonát. A pozor: párování `1935 Chata Hubertka, Jizerské hory` s naším
kandidátem je **falešná shoda** (známka patří jmenovci v Jizerských horách, náš
kandidát je od Benecka) — Hubertka tier nemění.

### Tier 3 — jen katalog (bez známky)

| Bouda | Známka | ChatGPT katalog | Naše výška | Typ |
|---|---|---|---|---|
| ~~🇨🇿 Chata Pod Studničnou~~ | — | ✓ 890 m | 890 m | obsluhovana — **POVÝŠENA 26. 7. 2026** (DATA-25; veřejnost občerstvení nedoložena → přiznáno v profilu) |
| ~~🇨🇿 Erlebachova bouda~~ | — | ✓ 1150 m | 1150 m | obsluhovana — **POVÝŠENA 26. 7. 2026** (DATA-25; restaurace s veřejnou otvíračkou, věta o neubytovaných chybí → přiznáno) |
| 🇨🇿 Hrnčířské boudy | — | ✓ 1150 m | 1150 m | **NENÍ OBJEKT** — enkláva; rozhodnutí Michala (rozpustit na jednotlivé boudy?) |
| ~~🇨🇿 Pražská bouda~~ | č.2249 | ✓ 1115 m | 1115 m | obsluhovana — **POVÝŠENA 26. 7. 2026** (podle DATA-22 měla známku, patřila fakticky do Tier 1) |
| 🇨🇿 Raisova chata na Zvičině | — | ✓ 671 m | 671 m | **MIMO KRKONOŠE** (Podkrkonoší) — čeká na rozhodnutí o oblasti |
| ~~🇵🇱 Schronisko PTTK „Nad Łomniczką"~~ | — | ✓ 1002 m | 1002 m | obsluhovana — **POVÝŠENO 26. 7. 2026** (DATA-25; spor o provoz PTTK × portály přiznán v próze; bez noclehu) |

### Tier 4 — jen OSM (bez známky i katalogu — nejtenčí signál, ověřit existenci/provoz)

**TRIÁŽ CELÉHO TIERU HOTOVÁ 26. 7. 2026 — viz `docs/DATA-27-tier4-triaz.md`**
(plné citace s URL u všech 32 objektů; verdikt je i v `interniPoznamky` každého
kandidáta). Souhrn: **15 do fronty povyšování** (Jelení Louky, Bouda Na Pláni,
Helena, U Kotle, Amor, Husova bouda, Smetánka, Srebrny Potok, Patejdlova,
Jindřichův dům, Sedmidolí, Betyna, Na Lučinách, Náchodská, Barborka — ta jako
mimo-provoz), **6 s výhradou** (Slovanka, Studenov, Zákoutí, Na Muldě,
Novomísečná + Staromísečná), **1 vyřazen trvale** (Mamut), **1 nedoloženo**
(Javorka), **9 v otázkách na Michala** (Konopinda, Aurora, Eliška potvrzení,
4 polské zamčené chatky, Mísečky-forma). Tabulka níž je tím nahrazena jako
pracovní seznam; nechává se jako historický zápis stavu z 20. 7.

**Postup fronty 27. 7. 2026: povýšena první trojice — Chata Jelení Louky,
Bouda Na Pláni (profil nese název dle webu boudy; OSM tvar „Chata na Pláni"
v aliasech) a Bouda Helena (OSM tvar „Helena"). Ve frontě zbývá 12 silných:
U Kotle, Amor, Husova bouda, Smetánka, Srebrny Potok, Patejdlova, Jindřichův
dům, Sedmidolí, Betyna, Na Lučinách, Náchodská, Barborka (mimo-provoz) —
+ 6 s výhradou.**

**Postup fronty 27. 7. 2026 podruhé (od konce, kvůli paralelní session):
povýšeny Srebrny Potok (s opravou polohy — Jarkowice/Grzbiet Lasocki, ne
Okraj; nejníže položený a nejvýchodnější objekt korpusu), Patejdlova bouda
(účelová UK, rok 1710 připsán univerzitnímu magazínu) a Barborka — PRVNÍ
profil se stavem `mimo-provoz` („Z důvodu havarijního stavu objektu dočasně
uzavřeno" dle vlastního webu). Ve frontě zbývá 9 silných: U Kotle, Amor,
Husova bouda, Smetánka, Jindřichův dům, Sedmidolí, Betyna, Na Lučinách,
Náchodská — + 6 s výhradou.**

| Bouda | Známka | ChatGPT katalog | Naše výška | Typ |
|---|---|---|---|---|
| 🇨🇿 Amor | — | — | — | obsluhovana |
| 🇨🇿 Barborka | — | — | — | obsluhovana |
| 🇨🇿 Betyna | — | — | — | obsluhovana |
| 🇨🇿 Bouda Na Lučinách | — | — | 1100 m | obsluhovana |
| 🇨🇿 Bouda Slovanka | — | — | 1120 m | obsluhovana |
| 🇨🇿 Chata Aurora | — | — | — | obsluhovana |
| 🇨🇿 Chata Eliška | — | — | — | obsluhovana |
| 🇨🇿 Chata Hubertka | — | — | — | obsluhovana |
| 🇨🇿 Chata Jelení Louky | — | — | — | obsluhovana |
| 🇨🇿 Chata Mamut | — | — | — | obsluhovana |
| 🇨🇿 Chata Smetánka | — | — | — | obsluhovana |
| 🇨🇿 Chata Studenov | — | — | — | obsluhovana |
| 🇨🇿 Chata na Pláni | — | — | — | obsluhovana |
| 🇵🇱 Chatka AKT Towarzystwa Bażynowego | — | — | — | utulna |
| 🇵🇱 Chatka Puchatka | — | — | — | utulna |
| 🇵🇱 Chatka Smogorniak | — | — | — | utulna |
| 🇵🇱 Chatka Wielkanocna | — | — | 1251 m | utulna |
| 🇨🇿 Helena | — | — | — | obsluhovana |
| 🇨🇿 Hotel Štumpovka | — | — | — | horsky-hotel |
| 🇨🇿 Husova bouda | — | — | — | obsluhovana |
| 🇨🇿 Javorka | — | — | — | obsluhovana |
| 🇨🇿 Jindřichův dům | — | — | — | obsluhovana |
| 🇨🇿 Konopindova chata | — | — | — | obsluhovana |
| 🇨🇿 Lokomotiva | — | — | — | obsluhovana |
| 🇨🇿 Na Muldě | — | — | — | obsluhovana |
| 🇨🇿 Novomísečná bouda | — | — | — | obsluhovana |
| 🇨🇿 Náchodská bouda | — | — | — | obsluhovana |
| 🇨🇿 Patejdlova bouda | — | — | — | obsluhovana |
| 🇨🇿 Sedmidolí | — | — | — | obsluhovana |
| 🇵🇱 Srebrny Potok | — | — | — | obsluhovana |
| 🇨🇿 Staromísečná bouda | — | — | — | obsluhovana |
| 🇨🇿 U Kotle | — | — | — | obsluhovana |
| 🇨🇿 Zákoutí | — | — | — | obsluhovana |
| 🇨🇿 Žalý | — | — | — | obsluhovana |

## Publikováno na webu (42)

| Bouda | Známka | ChatGPT katalog | Naše výška | Typ |
|---|---|---|---|---|
| 🇨🇿 Bouda Bílé Labe | č.2012 📷 | ✓ 1000 m | 1000 m | obsluhovana |
| 🇨🇿 Bouda Klínovka | č.3092 📷 | ✓ 1227 m | 1227 m | obsluhovana |
| 🇨🇿 Bouda Růžohorky | č.75 📷 | ✓ 1250 m | 1280 m | obsluhovana |
| 🇨🇿 Brádlerovy boudy | č.394 📷 | ✓ 1156 m | 1156 m | obsluhovana |
| 🇨🇿 Černá bouda | — | ✓ 1260 m | 1260 m | horsky-hotel |
| 🇨🇿 Chalupa Na Rozcestí | č.13 📷 | ✓ 1345 m | 1349 m | obsluhovana |
| 🇨🇿 Chata Dvoračky | č.22 📷 | ✓ 1140 m | 1140 m | obsluhovana |
| 🇨🇿 Chata Rezek | č.19 📷 | ✓ 880 m | 880 m | obsluhovana |
| 🇨🇿 Chata U Jirky | — | — | — | obsluhovana |
| 🇵🇱 Dom Śląski | č.94 | ✓ 1400 m | 1400 m | obsluhovana |
| 🇨🇿 Dvorská bouda | — | — | 1313 m | obsluhovana |
| 🇨🇿 Friesovy boudy | č.2049 📷 | ✓ 1217 m | 1217 m | horsky-hotel |
| 🇨🇿 Horská chata Krakonoš | — | — | 1127 m | obsluhovana |
| 🇨🇿 Hotel Špindlerova bouda | č.1889 📷 | ✓ 1208 m | 1208 m | horsky-hotel |
| 🇨🇿 Jelenka | č.1367 📷 | ✓ 1260 m | 1260 m | obsluhovana |
| 🇵🇱 Kochanówka | — | ✓ 510 m | 510 m | obsluhovana |
| 🇨🇿 Kolínská bouda | č.1719 📷 | ✓ 1117 m | 1117 m | horsky-hotel |
| 🇨🇿 Labská bouda | č.74 📷 | ✓ 1340 m | 1340 m | obsluhovana |
| 🇨🇿 Lesní bouda | — | ✓ 1102 m | 1102 m | obsluhovana |
| 🇨🇿 Lovecká chata | — | — | — | obsluhovana |
| 🇨🇿 Luční bouda | č.11 📷 | ✓ 1410 m | 1410 m | obsluhovana |
| 🇨🇿 Lysečinská bouda | č.1336 📷 | ✓ 950 m | 1000 m | obsluhovana |
| 🇨🇿 Lyžařská bouda | č.2210 📷 | ✓ 1206 m | 1206 m | horsky-hotel |
| 🇨🇿 Martinova bouda | č.674 📷 | ✓ 1288 m | 1288 m | obsluhovana |
| 🇨🇿 Moravská bouda | č.1873 📷 | ✓ 1225 m | 1225 m | obsluhovana |
| 🇨🇿 Petrova bouda | č.671 📷 | ✓ 1288 m | 1288 m | obsluhovana |
| 🇨🇿 Pomezní bouda | č.673 📷 | ✓ 1050 m | 1050 m | obsluhovana |
| 🇨🇿 Portášky | č.675 📷 | ✓ 1060 m | — | obsluhovana |
| 🇨🇿 Rýchorská bouda | č.390 📷 | ✓ 1000 m | 1000 m | obsluhovana |
| 🇵🇱 Schronisko Kamieńczyk | č.29 | ✓ 840 m | 830 m | obsluhovana |
| 🇵🇱 Schronisko Odrodzenie | č.98 | ✓ 1236 m | 1230 m | obsluhovana |
| 🇵🇱 Schronisko PTTK "Na Przełęczy Okraj" | č.47 | ✓ 1046 m | 1046 m | obsluhovana |
| 🇵🇱 Schronisko PTTK na Hali Szrenickiej | — | ✓ 1200 m | 1200 m | obsluhovana |
| 🇵🇱 Schronisko PTTK „Pod Łabskim Szczytem" | — | ✓ 1168 m | 1168 m | obsluhovana |
| 🇵🇱 Schronisko Samotnia | č.52 | ✓ 1195 m | 1195 m | obsluhovana |
| 🇵🇱 Schronisko Szrenica | č.88 | ✓ 1362 m | 1361 m | obsluhovana |
| 🇵🇱 Strzecha Akademicka | č.39 | ✓ 1258 m | 1258 m | obsluhovana |
| 🇨🇿 Tetřeví Boudy | č.1347 📷 | — | 1030 m | horsky-hotel |
| 🇨🇿 Vebrovy boudy | — | — | 1100 m | horsky-hotel |
| 🇨🇿 Vosecká bouda | č.24 📷 | ✓ 1260 m | 1260 m | obsluhovana |
| 🇨🇿 Vrbatova bouda | č.393 📷 | — | 1400 m | obsluhovana |
| 🇨🇿 Výrovka | č.12 📷 | ✓ 1356 m | 1368 m | obsluhovana |

## Nové tipy z ChatGPT katalogu (nemáme ani jako kandidáta)

**Prázdné — vyřízeno 25. 7. 2026.** Poslední položka, **Schronisko Nad Łomniczką** (1002 m, PL), byla prověřena a založena jako kandidát (`data/kandidati/krkonose/schronisko-nad-lomniczka.yaml`, Tier 3). Rešerše přinesla dvě věci, které katalog nenesl a které rozhodují o zařazení: objekt podle správce (PTTK) **nemá nocleh a nabízí stravování** — je to tedy občerstvovací zastávka na trase, ne penzion s jídlem pro vlastní hosty — ale **prameny si odporují v tom, jestli vůbec funguje** (PTTK ho vede jako fungující, trasygorskie.pl a goryiludzie.pl jako uzavřený kvůli rekonstrukci). Do vyřešení rozporu se nepovyšuje a pole `stav` zůstává schválně nevyplněné.

Sekci nechávat na místě: až přijde další externí seznam, tipy se sem zapisují znovu.

## Vyřazeno — nezakládat znovu (10)

Objekty, které redakce vědomě vyloučila (`data/kandidati/_vyrazeno.yaml`): chata-mamut-656462770, chata-pesakovna, chatka-gorzystow, lyzarska-bouda-656504528, penzion-roxana, sasanka, schronisko-pttk-szwajcarka, stacja-turystyczna-orle, tereza, zvonicka.

