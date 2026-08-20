# DATA-05 · Koš C — rozpouštění dohledávkami

Koš C z triáže razítkového checklistu (`docs/DATA-05-razitka-triaz.md`) drží
jména, která **leží v okně některé už založené oblasti, ale náš OSM export je
nemá**. Každé jméno je buď doložená mezera v korpusu, nebo objekt, který
klíčem zařazení neprojde — a to se pozná jen dohledávkou u pramenů.

Pravidla stejná jako u koše E: **do `data/` se nesahá**, všechno níž je
podklad s prameny. Cokoli by se odtud zapisovalo, je `verified: false`
(konvence B) s `checked` dle data dohledávky.

---

## Stav položek

| položka | oblast | stav | rozhodnuto |
|---|---|---|---|
| Schronisko Liczyrzepa | krkonose | **klíčem NEPROJDE** — návrh vyřazení | 19. 8. 2026 |
| Chata Paprsek | jeseniky | **doložená mezera v korpusu** | 19. 8. 2026 |
| Turistická chata Trosky | cesky-raj | nedohledáno, zůstává ve frontě | — |
| Schronisko Wysoki Kamień | jizerske-hory | **doložená mezera — leží 2,9 km VÝCHODNĚ od okna Jizerek** | 20. 8. 2026 |
| Amselfall - Amselfallbaude | ceskosaske-svycarsko | **mimo všech 18 oken; od 2017 zavřená** (klíč DATA-25) | 20. 8. 2026 |
| Bouda Svornost | **krkonose** (oprava zařazení) | **čtvrtá doložená mezera krkonošského korpusu** | 20. 8. 2026 |
| beskydská sedmička | beskydy | patří k DATA-37 (re-export) | — |

**Koš C je tím dojet** — otevřená zůstává jediná položka („Turistická chata
Trosky"), a ta čeká na detail razítka, ne na dohledávku.

---

## 1 · Schronisko Liczyrzepa (Karpacz) — klíčem zařazení NEPROCHÁZÍ

*Dohledáno 19. 8. 2026, pramen naszesudety.pl.*

| údaj | hodnota |
|---|---|
| adresa | Karpacz, ul. Skalna 45 (tedy **uvnitř města**, ne na hřebeni) |
| typ | **Szkolne Schronisko Młodzieżowe** — celoroční školské zařízení |
| kapacita | 50 lůžek v pokojích pro 2–6 osob |
| stravování | „wyposażoną kuchnię, w której można przygotować własne posiłki"; jídlo na objednávku **v sousedním penzionu** („Smaczne posiłki na zamówienia w pensjonacie po sąsiedzku") |
| kontakt | tel. 75 761 92 90, szkolne@schronisko-liczyrzepa.pl |

**Proč to rozhoduje:** klíč zařazení stojí na **občerstvení pro veřejnost
a roli na trase**. Tenhle pramen říká obojí naopak — vlastní kuchyň pro
samoobslužné vaření a jídlo objednávané u souseda znamená, že objekt sám
občerstvení neposkytuje, a adresa v ulici v Karpaczi ho nestaví na trasu.
Polské slovo *schronisko* tu neznamená horskou chatu, ale mládežnickou
noclehárnu (PTSM) — **stejná past jako „Szkolne Schronisko Młodzieżowe
Rajcza - Nickulina" v beskydské části koše C**; obě je proto potřeba
posuzovat podle obsahu, ne podle slova v názvu.

**Návrh:** zapsat do `data/kandidati/_vyrazeno.yaml` s tímto zdrojem.
**Nezapisuji sám** — vyřazení je redakční rozhodnutí a doklad je z jednoho
pramene (vlastní web `schronisko-liczyrzepa.pl` ze sandboxu nečten).
Otázka pro Michala v deníku.

---

## 2 · Chata Paprsek (Velké Vrbno) — doložená mezera v jesenickém korpusu

*Dohledáno 19. 8. 2026; prameny: náš vlastní katalog, sumperk.cz,
staremesto.info.*

| údaj | hodnota | pramen |
|---|---|---|
| katalogový záznam | **HUT-0055** „Horská chata Paprsek", Rychlebské hory, oblast Paprsek, nejbližší uzel Staré Město pod Sněžníkem, **jistota A**, stav aktivní, stravování ano, provoz celoročně, `Ověřeno k: 2026-07-21` | `data/externi/katalog-cr-sk-2026/katalog.json` (zdroj kct.cz) |
| výška | **1 022 m** | katalog i sumperk.cz („v nadmořské výšce 1022 metrů nad mořem") |
| adresa | Velké Vrbno 27, Staré Město, 788 32 | sumperk.cz |
| poloha | „na rozhraní tří horských celků: Hrubého Jeseníka, Rychlebských hor a Králického Sněžníku" | staremesto.info |
| restaurace | „Restaurace se nachází přímo v chatě Paprsek", **70 míst + 50 na terase**, jídelna pro hosty 55 míst | staremesto.info |
| ubytování | pokoje pro 2–5 osob | sumperk.cz |
| historie | postavena **1932**, původně **„Slezský Dům" (Schlesierhaus)**; na svou dobu ústřední topení, vlastní elektrárna, studna, teplá i studená voda na pokojích | staremesto.info |
| kontakt | +420 777 076 542, info@paprsek.cz | sumperk.cz |

**Klíčem zařazení prochází bez pochybností:** restaurace přímo v chatě
s vlastní kapacitou pro hosty zvenčí, KČT chata, aktivní, na hřebeni nad
Velkým Vrbnem.

**Že je to mezera, je změřeno, ne odhadnuto:** v `data/kandidati/jeseniky/`
je 122 kandidátů a **ani jeden se nejmenuje Paprsek**; jméno nemá 0 výskytů
ani v hlavním exportu `_overpass-export-cz.json`, ani v jmenné vrstvě
`_overpass-dle-jmen-cz.json`. Poloha přitom leží uvnitř okna oblasti
(bbox jeseniky 49.93–50.42 / 16.75–17.55) a Rychlebské hory i Králický
Sněžník jsou v `katalogPohori` téže oblasti.

**Hypotéza, proč propadla i jmenná vrstva** (neověřená — na OSM ze sandboxu
nedosáhnu): objekt je v OSM nejspíš veden jako **hotel** a pod jménem
*Horský hotel Paprsek* (tak ho titulkuje i Wikipedie), takže na slovo
„chata" v názvu se nechytí. Jestli to platí, je to **měřitelná mezera jmenné
vrstvy dotazu**, ne jednorázová náhoda — a týká se všech objektů, které
katalog vede jako chatu, kdežto OSM je pojmenoval hotelem.

**Drobný rozpor k dořešení:** katalog vede web `paprsek.net`, portály
i e-mail ukazují na `paprsek.cz`. Doména z katalogu ze sandboxu ověřena
nebyla (robots.txt).

**Nezakládám kandidáta ručně** — stejná úvaha jako u krkonošských mezer
18. 8.: poctivější je pustit export znovu (tady by ale musela napřed padnout
odpověď na hypotézu výše, protože samotný re-export by objekt s „hotelem"
v názvu nemusel přinést). Otázka pro Michala v deníku.

---

## 3 · Turistická chata Trosky — nedohledáno

Hledání pod tímto jménem vrací jen **Hotel Trosky** v Rovensku pod Troskami
a **Bistro Pod Troskami**; ani jeden není „Turistická chata Trosky"
z razítkového checklistu. Zůstává ve frontě — nejspíš půjde o razítkové místo
u hradu, které se dnes jmenuje jinak, a bez detailu razítka se to nepozná
(týž případ jako koš G).

---

## 4 · Schronisko Wysoki Kamień — mezera, kterou nezpůsobil dotaz, ale okno

*Dohledáno 20. 8. 2026; prameny: vlastní OSM export, externí katalog,
korona-gor-polski.pl.*

| údaj | hodnota | pramen |
|---|---|---|
| katalogový záznam | **HUT-0232** „Wysoki Kamień", Góry Izerskie, nejbližší uzel Szklarska Poręba, typ *schronisko górskie*, **jistota A**, stav aktivní, stravování ano, provoz celoročně, web `wysokikamien.com.pl`, `Ověřeno k: 2026-07-21` | `data/externi/katalog-cr-sk-2026/katalog.json` |
| OSM objekt | `way/518439272`, **50.8456719 / 15.4917689**, `amenity=cafe`, `proposed:tourism=alpine_hut`, `ele=1058`, `beds=0`, `rooms=0`, `wikidata=Q9334436` | `data/kandidati/krkonose/_overpass-rozhledny-pl.json` (stav dat 29. 7. 2026) |
| otevírací doba | `Apr-Sep Mo-Su 10:00-18:00; Oct-Mar Mo-Su 10:00-16:00` | týž OSM objekt |
| občerstvení | „bufet czynny w godzinach otwarcia obiektu"; **„czynny wyłącznie bufet"** | OSM `description:pl`; korona-gor-polski.pl |
| noclehy | **nejsou** — „Schronisko nie oferuje jeszcze noclegów ze względu na brak bieżącej wody" (`beds=0`, `drinking_water=no`, `toilets=no`) | OSM; korona-gor-polski.pl |
| historie | první schronisko postavili **1882** Schaffgotschové, **rozebráno 1963**; nové schronisko **otevřeno 2010** | korona-gor-polski.pl |
| německý název | *Hochsteinbaude* (`name:de`) | OSM |
| rozhledna | vedle stojí věž `way/513097031` (`tower:type=observation`, `man_made=tower`), **46 m** od bufetu | `_overpass-rozhledny-pl.json` |

**Klíčem zařazení prochází** — bufet otevřený veřejnosti s vlastní otevírací
dobou, na hřebeni s rozhlednou (rozšíření klíče o rozhledny s občerstvením,
DATA-23). Že nemá noclehy, klíč neřeší; ubytování v něm nikdy nebylo podmínkou.

**Rozpor k dořešení, nedomýšlet:** výška je **1058 m** dle OSM i katalogu,
ale **1050 m** dle korona-gor-polski.pl. Do profilu patří ta hodnota, kterou
unese doklad — tedy zatím obě s poznámkou, ne průměr.

### Proč propadl — a je to jiná porucha než 18. 8.

Krkonošská mezera z 18. 8. vznikla **starou verzí dotazu**. Tahle vznikla
**oknem**, a to se měří přímo nad konfigurací (`npx tsx` nad `scripts/oblasti.ts`):

- Objekt leží na **15,4918 °** v. d. Okno Jizerských hor končí na **15,45 °**
  → objekt je **2,9 km východně od hrany** a do jizerského dotazu se nikdy
  nedostal. Ani do jmenné vrstvy: ta se ptá katalogovými jmény, ale ptá se
  jich **uvnitř téhož okna**, takže „Wysoki Kamień" v jizerském běhu padlo
  do prázdna.
- Do **krkonošského** okna přitom spadá (50,55–50,87 / 15,30–16,05) a
  krkonošský běh ho **skutečně stáhl** — jenže jen jako *občerstvení
  u rozhledny*. Krkonošský `katalogPohori` je `Krkonoše, Karkonosze`, takže
  jméno z *Gór Izerskich* si tenhle běh nevyžádal.
- Kandidáta nezaložil, protože **věž nemá tag `name`**: `zapisKandidaty` ji
  odloží do `preskoceno` s důvodem `bez-nazvu` — **týž mechanismus, který
  17. 8. schoval Pardubické boudy.** Sám bufet kandidátem není: v hlavním
  exportu není (nese `amenity=cafe`, ne hutový tag) a civilní vrstvu
  krkonošský export nemá vůbec.

**Změřený vedlejší nález:** `data/kandidati/krkonose/` **nemá ani jeden soubor
`_overpass-dle-jmen-*.json`**, ačkoli ostatní oblasti ho mají. Krkonošský
export je tedy starší nejen o civilní vrstvu (nález 18. 8.), ale i o **celou
jmennou dohledávku podle katalogu**. Pilotní oblast běží na verzi dotazu
o dvě vrstvy pozadu.

**Návrh (nezapisuji sám — je to zásah do konfigurace oblasti):** posunout
východní hranu okna Jizerských hor z 15,45 na ~15,53, aby pokryla Wysoki
Kamień a hřeben nad Szklarskou Porębou. Překryv s Krkonošemi je u téhle
dvojice oblastí **záměrný už dnes** (komentář v `oblasti.ts` u Jizerky
a Harrachova), duplicity řeší triáž. Po posunu je nutné pustit DATA-01
i oba exporty DATA-06 znovu.

---

## 5 · Amselfall – Amselfallbaude — mimo všechna okna a od 2017 zavřená

*Dohledáno 20. 8. 2026; prameny: basteibruecke.de, ostsachsen.de.*

| údaj | hodnota | pramen |
|---|---|---|
| co to je | výletní hospoda u desetimetrového vodopádu Amselfall v Amselgrundu, Saské Švýcarsko | basteibruecke.de, ostsachsen.de |
| poloha | „knapp zwei Kilometer nördlich von Rathen"; přístup pěšky ~20 min od P7 v Rathewalde | ostsachsen.de, basteibruecke.de |
| stav provozu | **zavřená od roku 2017** — „Die früher im Sommer geöffnete Amselfallbaude schloss jedoch 2017 nach mehreren kleinen Felsabgängen." | ostsachsen.de |
| důvod | opakované skalní odvaly; geologický průzkum shledal zvýšené riziko, v roce 2021 stále zavřeno | basteibruecke.de |
| minulost | provoz zhruba 200 let, od 1991 sloužila i jako informační místo národního parku | ostsachsen.de |
| razítko | `razitkuj.cz/8984_amselfall-amselfallbaude`, 1 otisk | `data/razitka/_razitkuj-checklist.json` |

**Klíčem zařazení podle rozhodnutí Michala z 26. 7. 2026 (DATA-25) PROCHÁZÍ** —
objekt turistům prokazatelně sloužil a dnes neslouží, což je přesně případ,
který klíč nově bere *s poznámkou, že neslouží veřejnosti*. Není to tedy
vyřazení jako Liczyrzepa; je to profil se stavem „mimo provoz".

**Jenže náš aparát na něj nedosáhne — a to je změřené:**

- Jméno „Amselfall" má **0 výskytů ve všech surových OSM exportech v repu**
  (prohledány všechny soubory `data/kandidati/*/_overpass-*.json`).
- Bod u Rathenu **nespadá do žádného z 18 oken**. Pás **14,05–14,38 ° v. d.
  nad 50,7 ° s. š. nekryje ani jedna oblast**: krušnohorské okno končí na
  14,05 a lužické začíná na 14,38.
- Složka `data/kandidati/ceskosaske-svycarsko/` přesto existuje a drží
  **čtyři kandidáty** — a je vidět, že spadli z okrajů dvou sousedních oken:
  Daxensteinbaude (50,836/14,048) a Räuberhütte (50,848/14,044) z krušnohorského,
  obě chaty na Tokáni (50,877/14,41) z lužického. **Střed Českosaského
  Švýcarska — Hřensko, Pravčická brána, Bastei, Rathen — nekryje nic.**

**Návrh (nezapisuji sám):** Českosaské Švýcarsko dnes v průvodci existuje jako
*vedlejší produkt* dvou oken, ne jako oblast. Buď mu dát vlastní záznam
v `scripts/oblasti.ts` s vlastním oknem, nebo ty čtyři kandidáty přeřadit
a složku zrušit. Dnešní stav je nejhorší ze tří: složka budí dojem pokrytí,
které neexistuje.

---

## 6 · Bouda Svornost — patří do Krkonoš, ne do Jeseníků (oprava triáže)

*Dohledáno 20. 8. 2026; prameny: ceskehory.cz, vlastní OSM exporty.*

**Oprava:** 17. 8. jsem „Boudu Svornost" přeřadil z koše E do koše C s tím, že
jediná jmenná shoda v repu je jesenický kandidát `jeseniky/chata-svornost`
(`node/2831748399`, 50,2010/17,2376). **To byla chybná úvaha z jediné jmenné
shody.** Dohledávka ukazuje jiný objekt:

| údaj | hodnota | pramen |
|---|---|---|
| poloha | **Pec pod Sněžkou**, „u konečné stanice sedačkové lanovky Zahrádky expres", Na zahrádkách 35, 542 21 | ceskehory.cz |
| výška | 1 100 m | ceskehory.cz |
| kapacita | 45 lůžek ve 2–4lůžkových pokojích s vlastním sociálním zařízením | ceskehory.cz |
| občerstvení | vlastní **restaurace a bar**; „sluneční terasa s venkovním bufetem, pizzerie" — tedy i mimo plnou penzi ubytovaných | ceskehory.cz |
| razítko | `razitkuj.cz/5569_bouda-svornost`, 1 otisk | `data/razitka/_razitkuj-checklist.json` |

Jesenická **Chata Svornost** je jiný objekt (jiná obec, jiná výška, jiný web
`chatasvornost.cz`) a kandidátem už je. Jmenovci se tím řadí k případům
z `docs/DATA-17-jmenovci.md`.

**Změřeno, že jde o mezeru krkonošského korpusu:** slovo „Svornost" má
v celém `data/chaty/` a `data/kandidati/krkonose/` **nula výskytů** a ve všech
krkonošských OSM exportech rovněž **nula**. Je to tedy **čtvrtý** objekt
v řadě — po Pardubických, Hříběcí a Jilemnické boudě — který v krkonošském
korpusu chybí a jehož nepřítomnost dobře vysvětluje stará verze dotazu
(terasa s bufetem a pizzerií je přesně civilně tagovaný případ).

**Stejná past jako u Hříběcí boudy:** prezentace na ceskehory.cz je označená
**„Objekt v archivu – prezentace není aktivní"**, takže *dnešní* provoz
doložený není. Klíčem zařazení objekt prochází podle popisu, ale jestli je
dnes v provozu, je otázka na telefonát, ne na sandbox.

**Nezakládám kandidáta ručně** — poctivější je pustit krkonošský export znovu;
tenhle objekt by ho měl přinést sám.
