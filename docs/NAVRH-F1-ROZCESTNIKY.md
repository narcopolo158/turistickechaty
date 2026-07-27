# NÁVRH F1 — Homepage · Katalog chat · Stránka pohoří (+ 3D mapa)

*Brainstorm + návrhy + zadání pro design session. Vzniklo 27. 7. 2026 večer
na pokyn Michala („navrhni uspořádání homepage, rozcestníky a stránky
pohoří — vlastní žebříčky, charakteristika pohoří a hlavně ta 3D mapa!!!
…připrav zadání pro design session"). Kapitola 8 je samostatně předatelné
zadání.*

---

## 1. Co jsem prošel za inspiraci — a co si z toho bereme

**PeakVisor (stránka pohoří/parku)** — nejbližší vzor toho, co chceme:
hero se základními čísly (nejvyšší vrchol, počet pojmenovaných vrcholů,
rozloha), seznamy vrcholů s **dvojím řazením** (podle prominence / podle
výšky), dlouhé výkladové sekce (geografie, historie), hlavní trasy, města
jako východiska — a **3D mapa provázaná s každou položkou**. Bereme:
stat-hero, žebříčky s přepínatelným řazením, 3D jako podpis značky,
provázání seznam ↔ mapa. My navíc povyšujeme na první místo CHATY (u nich
jsou vrcholy kulisa, u nás je to naopak).

**SAC Hüttenportal / alpské kluby** — čistě rezervační utilita (volná
lůžka, rezervace; SPA bez veřejné struktury). Bereme: disciplinovaná
datová karta chaty (výška, typ, vlastník-klub). NEbereme: rezervační
logiku — nejsme booking, jsme průvodce. (Rezervace možná někdy jako
odkaz na chatu, nikdy jako naše UI.)

**ceskehory.cz (domácí konkurence)** — lineární stránkovaný výpis
ceníkových karet (kapacita, ceny ve 3 sezónách, „se psem, s bazénem"),
40+ lokalit ve filtru, mapa až na okraji, žádné zdroje údajů. Pro nás
hlavně **anti-vzor**, který vymezuje odlišení: my jsme mapa-první,
kurátorští, se zdrojem u každého údaje, bez ceníkové optiky; ale
potvrzuje to poptávku po filtrování dle lokalit a služeb.

**Komoot guide („Top 20 míst v KRNAP")** — kurátorský žebříček, kde
každá položka má jednu větu „proč" (citace komunity) a CTA na související
obsah; dole FAQ blok a křížové rozcestníky na sousední oblasti a
aktivity. Bereme: formát Top-cílů s jednou poctivou větou a vazbou na
nejbližší chaty; FAQ blok (skvělé pro SEO/AEO — odpovědi máme z vlastních
dat); křížové rozcestníky (sousední pohoří, přesahové oblasti).

*(SAC portál je SPA a víc z něj odsud nejde vyčíst; treking.cz přehled a
web města Lomnice jsou ze sandboxu nedostupné — vzory jsem bral z toho,
co šlo skutečně načíst.)*

## 2. Principy napříč vším (naše DNA, ať to drží pohromadě)

1. **Mapa-první navigace.** 2D mapa pro orientaci a proklik, 3D malované
   panorama jako podpis pohoří. Seznamy a mapy jsou vždy provázané
   (hover/klik na jedné straně zvýrazní druhou).
2. **Poctivá čísla.** Každý counter i žebříček se počítá jen z toho, co
   je v DB doložené; u žebříčků vždy mikropoznámka „jen doložené hodnoty,
   zdroj na profilu". Žádné „347 chat" z prototypu.
3. **Kurátorství místo ceníku.** Karty bez cen; místo toho stav, výška,
   služby, razítko/známka, „naposledy ověřeno".
4. **Zaniklé jsou plnohodnotný obsah** (Atlas, paměť hor) — ne přílepek.
5. **Přesahy přiznané** (DATA-29): Podkrkonoší a spol. vždy s dodatkem.
6. **Výkon:** 3D se načítá líně (poster → tap → three.js), SSG všude,
   filtry client-side nad malým JSON indexem.

## 3. HOMEPAGE — navržené pořadí sekcí

1. **Hero s hledáním.** Claim (stávající), pod ním hledací pole
   „Najdi chatu…" (datalist všech profilů — stejný vzor jako v 3D mapě)
   a dvě CTA: „Prozkoumat Krkonoše" (stránka pohoří) / „Katalog chat".
   Vedle poctivé countery z DB: **76 profilů · N s razítkem · naposledy
   ověřeno DD. MM.** (přesná sada dle toho, co umíme doložit).
2. **3D panorama band.** Široký pás s malovaným panoramatem Krkonoš —
   **ROZHODNUTO (Michal 27. 7.): na homepage vždy statický poster**
   (render z CI), klik vede na plnou 3D mapu na stránce pohoří.
   Homepage zůstane rychlá; „wow" dělá samotný malovaný obraz.
3. **Pohoří grid.** Karta Krkonoš (živá: mini-statistiky, vstup) +
   karty „připravujeme" (Jizerské hory, Český ráj, Podkrkonoší…) — jen
   s poctivým stavem („sbíráme kandidáty"), ať je vidět pilot → expanze.
4. **Kurátorské pásy** (výběr 2–3, ať homepage není nekonečná):
   „Naposledy ověřeno" (3–4 chaty dle nejnovějšího `checked` — živý
   důkaz USP), „Z Atlasu zaniklých" (1 příběh + počet), „Razítka a
   známky" (sběratelský teaser s počty).
5. **Manifest pás.** Tři krátké body: ověřujeme u zdroje · rozpory
   přiznáváme · nic nedomýšlíme → odkaz „Jak ověřujeme" (stránka metody,
   může vzniknout později — pás na ni jen ukazuje).
6. Footer (stávající, beze změny).

## 4. KATALOG /chaty — z placeholderu na skutečný rozcestník

- **Nahoře hledání + filtry jako chips** (komponenty z F0-03): pohoří ·
  stav (v provozu / mimo provoz / zaniklá) · nocleh · občerstvení ·
  razítko/známka · typ (bouda/hotel/útulna…). Client-side nad SSG JSON
  indexem — 76 položek, žádné stránkování (anti-vzor ceskehory).
- **Přepínač zobrazení — ROZHODNUTO (Michal 27. 7.): výchozí KARTY**
  (s fotkou/siluetou), přepínač na Řádky (tabulkové řádky z F0-03:
  název, výška, stav-pilulka, služby ikonky, naposledy ověřeno) a na
  **Mapu** (2D Leaflet přes celou šířku, markery = přefiltrovaná
  množina). Mobil: karty. Design session AŤ VYZKOUŠÍ i hybridní
  variantu B z Michalova návrhu: nahoře blok 6–9 karet (kurátorský
  výběr / naposledy ověřené), pod ním zbytek jako řádky — a vybere se,
  co funguje líp.
- **Řazení:** abecedně · podle výšky · naposledy ověřeno.
- **Stav filtrů v URL** (`?pohori=krkonose&stav=v-provozu`) — sdílení a
  zpětné tlačítko fungují.
- Pod výpisem: vstupy na **Žebříčky** (kotvy na stránkách pohoří) a
  **Atlas zaniklých chat**.
- Prázdný výsledek poctivě: „Téhle kombinaci zatím nic neodpovídá —
  vedeme jen doložené profily."

## 5. STRÁNKA POHOŘÍ /cesko/krkonose — vlajková loď

1. **Hero pohoří.** Breadcrumb, název, 2–3 věty charakteristiky
   (kurátorský text se zdroji v datech oblasti) a **stat-tiles**:
   nejvyšší hora (Sněžka 1 603 m — se zdrojem), počet chat v průvodci,
   rozpětí výšek chat (od–do z DB), počet zaniklých v Atlasu. Jen
   doložitelné dlaždice; co nemáme, neukazujeme.
2. **3D MALOVANÁ MAPA — centerpiece.** Plnoformátový band hned pod
   herem: léto/zima, vyhledávání chaty, klik na domeček → preview
   bublina (název, výška, stav) s tlačítkem „Otevřít profil",
   tlačítko **„Projít hřebenovku"** (animovaný turista) a z karty chaty
   „Přijít po značené trase". Deep-link `?chata=slug` → přílet kamery;
   profily chat dostanou zpětné tlačítko „Ukázat na 3D mapě". Mobil:
   statický poster (render z CI) + „Otevřít 3D mapu" (three.js se
   načte až po tapu; `prefers-reduced-motion` → bez auto-animací).
3. **Chaty oblasti.** Lehký filtr (stav) + tabulkové řádky; výchozí
   řazení podle výšky. Hover řádku ↔ zvýraznění na mapě (desktop).
4. **Žebříčky pohoří** (PeakVisor vzor dvojího pohledu): **Nejvýše
   položené** (top 10 dle `vyska`) · **Nejstarší** — ROZHODNUTO
   (Michal 27. 7.): rok se bere **z milníků historie** (nejstarší
   doložený letopočet), žádné nové pole; popisek žebříčku proto
   poctivě říká „nejstarší doložený rok v historii" (milník může být
   první zmínka i stavba — netvrdíme „založena") · **Největší**
   (kapacita — platí konvence nižšího čísla při rozporu). Každý
   žebříček nese mikropoznámku „jen doložené hodnoty, zdroj na
   profilu" — žebříčky jsou tím pádem zároveň výkladní skříň
   poctivosti.
5. **Střediska a východiska.** Karty (Pec p. S., Špindl, Harrachov,
   Janské Lázně, Malá Úpa; Karpacz, Szklarska Poręba) s počtem chat
   „dostupných odtud" — vazba přes `vychoziBod` tras; kde vazbu nemáme,
   karta jen naviguje (bez čísla). ROZHODNUTO (Michal 27. 7.):
   **mini-stránky středisek vznikají rovnou** — karta vede na vlastní
   stránku střediska (viz kap. 6: URL a data).
6. **Top cíle** (komoot vzor, kurátorské, se zdroji): Sněžka, Sněžné
   jámy, prameny Labe, Mumlavský vodopád… — položka = 1 věta proč +
   „nejbližší chaty: …". Žádný superlativ bez dokladu.
7. **Zaniklé a paměť hor.** Teaser Atlasu (počet + 1–2 příběhy),
   výhled na dobové pohlednice (P5).
8. **Sběratelství oblasti.** Razítka/známky: počty, odkaz na
   razítkovník; placeholder vizitek (čekáme na souhlas).
9. **FAQ pohoří** (AEO/SEO): „Která chata v Krkonoších leží nejvýš?",
   „Kde přespat na hřebenovce?", „Které boudy fungují i v zimě?" —
   odpovědi generované z našich doložených dat + JSON-LD FAQPage.
10. **Přesahy a sousedé.** „Podkrkonoší a okolí" (Raisova + budoucí,
    s vysvětlením přesahu), výhled na sousední pohoří.

## 6. Co pro to musí vzniknout v datech a kódu (mimo design)

- **Oblast dostane metadata:** charakteristika (rich text se zdroji),
  nejvyšší hora {název, výška, source}, seznam středisek, kurátorské
  top cíle {název, věta, source, vazby na chaty}. → rozšíření kolekce
  Oblasti + YAML `data/oblasti/krkonose.yaml`.
- **Žebříček „nejstarší" (rozhodnuto):** rok = nejstarší letopočet
  v doložených milnících historie chaty; počítá se při buildu (žádné
  nové pole, žádné ruční dublování). Chaty bez jediného milníku
  s rokem v žebříčku prostě nejsou. Popisek „nejstarší doložený rok
  v historii" — netvrdíme „rok založení".
- **Střediska (rozhodnuto: mini-stránky hned):** nový datový typ
  Středisko (YAML `data/strediska/<oblast>/<slug>.yaml` + kolekce):
  název, obec, GPS, výška, doprava/parkování (jen doložené — u Pece
  už máme terminál P1 z profilu Luční), vazby „chaty dostupné odtud"
  (z `vychoziBod` tras + ruční doplnění), zdroje. **URL: vlastní
  segment** `/cesko/krkonose/strediska/<slug>` — NESMÍ sdílet
  namespace s profily chat (`/cesko/krkonose/<chata>`), jinak kolize
  slugů.
- **„Naposledy ověřeno":** max(`checked`) napříč bloky ověření — už
  dnes to počítá profil, přidat do SSG indexu.
- **SSG JSON index chat** pro filtry/hledání (slug, název, pohoří, stav,
  výška, služby ano/ne, razítko/známka, checked) — generuje build.
- **3D integrace do aplikace:** přesun z docs/experimentu do
  `src/components/Mapa3D*` — three.js dynamic import (SSR off), terén
  JSON z data28 do `public/3d/` (build ho kopíruje, lokálně se
  negeneruje!), poster PNG z CI vizuální kontroly, mobil: nižší DPR +
  strop instancí smrčků, `prefers-reduced-motion`.

## 7. Otázky pro Michala — ZODPOVĚZENO 27. 7. 2026 večer (promítnuto výše)

1. **Homepage 3D band:** ~~živá vs. poster~~ → **„poster na homepage,
   plná 3D jen na pohoří — homepage zůstane rychlá."** ✓ kap. 3 i 8.
2. **„Nejstarší chata":** → **„z milníků"** — extrakce nejstaršího
   doloženého letopočtu při buildu, poctivý popisek. ✓ kap. 5 a 6.
3. **Výchozí zobrazení katalogu:** → **„výchozí karty, přepínač na
   řádky?"** + záložní hybrid „pár karet (6–9) a pak dále řádky na
   desktopu, karty na mobilu" → karty výchozí, hybrid jako varianta B
   k otestování v design session. ✓ kap. 4 a 8.
4. **FAQ blok:** → **„ano, ale generovaný z dat, ať se neudržuje
   ručně."** ✓ kap. 5 (beze změny — návrh s tím počítal).
5. **Střediska:** → **„mini-stránky rovnou."** ✓ kap. 5, 6 (datový
   model + URL segment /strediska/) a 8 (čtvrtá šablona).

---

## 8. ZADÁNÍ PRO DESIGN SESSION (předatelné samostatně)

**Projekt:** turistickechaty.cz — průvodce horskými chatami s ověřenými
daty. Design systém **„Moderní průvodce" v2.2** je hotový a závazný:
tokens (krémový podklad s vrstevnicemi, červená CTA, alpská modrá,
night; Space Grotesk + Inter), komponenty (karta chaty, tabulkový řádek
katalogu, chips + filtr chips, stavové pilulky, sekční lišty, infoboxy,
pásové značky, tlačítka), dark mode „hřebenovka po tmě", mobilní
tab-bar, print. Hotová je šablona profilu chaty a Atlas zaniklých.
**Art-direction kotva nových stránek: malovaná 3D panoramatická mapa**
(toon shading, modré stíny, papírové nebe, halo popisky) — nové sekce ji
mají rámovat a ladit s ní, ne s ní soupeřit.

**Úkol: navrhnout 4 šablony a jejich nové komponenty.**

1. **Homepage** — sekce: hero s hledáním + poctivé countery · 3D
   panorama band jako **statický poster** (rozhodnuto — klik vede na
   plnou 3D na stránce pohoří) · grid pohoří (1 živé + N
   „připravujeme") · kurátorské pásy („Naposledy ověřeno", Atlas
   zaniklých, razítka/známky) · manifest pás („každý údaj se zdrojem")
   · footer.
2. **Katalog /chaty** — hledání, filtr chips, zobrazení **Karty
   (výchozí) / Řádky / 2D mapa**, řazení, výpis bez stránkování,
   vstupy na žebříčky a Atlas, poctivý prázdný stav. Navrhnout A/B:
   (A) čisté přepínání karty↔řádky, (B) hybrid — nahoře 6–9 karet
   (kurátorský výběr), pod nimi řádky; mobil vždy karty.
3. **Stránka pohoří** — hero se stat-tiles · plnoformátový 3D band
   s UI overlay · seznam chat provázaný s mapou · žebříčky (nejvýše /
   nejstarší dle doloženého roku z milníků / největší) · karty
   středisek (proklik na mini-stránky) · top cíle · teaser Atlasu ·
   sběratelská sekce · FAQ (generované z dat) · přesahy.
4. **Mini-stránka střediska** (`/cesko/krkonose/strediska/<slug>`) —
   hero (název, obec, výška, 1–2 věty se zdrojem) · „chaty dostupné
   odtud" (řádky s časy tras, kde je máme doložené) · praktické
   (doprava/parkování — jen doložené, vzor: terminál P1 Pec) · mapka
   (2D výřez) · zpět na pohoří. Malá, hutná šablona — žádná
   marketingová vata.

**Nové komponenty k navržení:** stat-tile „poctivé číslo" (hodnota +
popisek + mikro-zdroj); žebříčkový řádek (pořadí, název, hodnota,
proklik) + hlavička žebříčku s poznámkou o doloženosti; karta pohoří
(živá vs. „připravujeme"); karta střediska (proklik na mini-stránku);
položka „chata dostupná odtud" (řádek s časem trasy) pro mini-stránku
střediska; položka top cíle (věta + vazby na chaty); filtr-bar s chips
+ přepínač zobrazení + řazení; 3D poster band (statický obraz + CTA
„Otevřít 3D mapu"); 3D band UI overlay pro stránku pohoří (hledací
pole, léto/zima toggle, legenda, tlačítko „Projít hřebenovku", preview
bublina chaty s CTA); FAQ blok (rozbalovací); manifest pás; pás
„Naposledy ověřeno" (mini-karty s datem ověření).

**Tvrdá omezení:** (a) poctivost — v návrzích jen čísla/údaje, které
umí dát DB (76 profilů, výšky, stavy, `checked`); žádná vymyšlená
hodnocení, hvězdičky, ceny, počty návštěvníků; (b) stavové pilulky vždy
text + barva (ne jen barva); (c) dark mode pro všechno; (d) mobil-first
breakpointy dle stávajícího prototypu (tab-bar < 760 px), 3D na mobilu
vždy poster→tap; (e) print styly pro katalog a pohoří (bez mapy);
(f) atribuce Mapy.com/OSM/KČT kde je mapa.

**Výstup:** klikací HTML prototyp (jako u v2.2 handoffu) se všemi
čtyřmi šablonami light + dark + mobilní varianty klíčových sekcí
(u katalogu obě varianty A/B zobrazení); komponentové karty nových
prvků; krátký handoff (tokens/typografie beze změn).

**Akceptační kritéria:** návrh projde ban-scanem poctivosti (žádná
nedoložitelná čísla), všechny stavy komponent (hover, aktivní filtr,
prázdný výsledek, chybějící fotka → silueta), 3D band má definované
chování na mobilu i `prefers-reduced-motion`, a šablony jdou postavit
z existujících tokens bez zásahu do profilu chaty.

---

*Zdroje inspirace (čteno 27. 7. 2026): PeakVisor — stránka Krkonošského
NP (peakvisor.com/park/krkonose-national-park.html); SAC Hüttenportal
(huettenportal.sac-cas.ch — SPA, jen orientačně); ceskehory.cz — výpis
horských chat Krkonoš (ceskehory.cz/horske-chaty/krkonose.html); komoot
— guide „Attractions in Krkonošský Národní Park"
(komoot.com/guide/514905). Nedostupné odsud: treking.cz přehled,
huettenportal detaily (SPA).*
