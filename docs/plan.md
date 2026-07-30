# Turistické chaty — projektový plán

**Doména:** turistickechaty.cz
**Verze:** 1.8 · 19. 7. 2026
**Charakter:** srdcovka, která se má časem uživit · **Obsah:** redakčně, komunita ve 2. vlně · **Vývoj:** svépomocí s Claude Code

---

## 1. Vize

**Nejúplnější a nejživější průvodce horskými chatami pro českého turistu — od Jeseníků po Alpy.**

Web, kde najdeš úplně každou chatu: kde leží, jestli má otevřeno, co tam vaří, kde se spí, jak se tam dostat (i vlakem), jaké razítko tam razítkují, jaké má příběhy a jak vypadala před sto lety. Ne katalog, ale místo, kam se turista vrací před každým výletem — a po něm si přijde odškrtnout razítko do sbírky.

Tři hodnoty, o které se všechno opírá:

1. **Úplnost.** Chybějící chata je chyba v systému, ne redakční volba. Slib „jsou tu všechny" je hlavní konkurenční výhoda — nikdo jiný ho dnes neplní.
2. **Přesnost a živost.** Každý údaj nese datum ověření. Zastaralá otvíračka ničí důvěru rychleji než chybějící profil.
3. **Duše.** Chaty nejsou ubytovací zařízení, ale kulturní dědictví. Data dávají užitek, příběhy a razítka dávají vztah.

„Wow" od začátku = kombinace všech tří: návštěvník během pár sekund pozná, že tohle není další polomrtvý katalog, ale definitivní zdroj dělaný někým, kdo chaty miluje.

## 2. Pro koho web je

**Víkendový výletník (často s dětmi).** Hledá cíl výletu s jistotou jídla a záchodu. Potřebuje: filtry (dostupnost s kočárkem, délka trasy), návrhy výletů, aktuální otvíračku.

**Hřebenovkář / vícedenní turista.** Plánuje přechody se spaním na chatách. Potřebuje: kapacity a rezervace, časy mezi chatami, vodu, zimní provoz, GPX.

**Nostalgik a sběratel.** Miluje historii, dobové pohlednice, razítka. Potřebuje: příběhy, archiv tehdy/dnes, katalog razítek, sbírkový deník. Tahle skupina tvoří komunitu a šíří web dál — a jsi to i ty sám.

**Alpský začátečník.** Čech, který chce poprvé na chatu do Rakouska a neví, jak to tam chodí. Potřebuje: průvodce systémem (rezervace, Alpenverein, polopenze), česky. Přichází ve fázi 5, ale doména na něj musí být připravená.

## 3. Konkurence a mezera na trhu

| Web | Co dělá | Slabina |
|---|---|---|
| [Treking.cz](https://www.treking.cz/chaty/chaty.htm) | Rozsáhlé textové přehledy chat ČR/SK | Časopisecký formát, žádná strukturovaná data, zastarávající údaje |
| [ČeskéHory.cz](https://www.ceskehory.cz/horske-chaty/hory.html) | Seznamy chat po pohořích + ubytování | Katalogově-inzertní logika, neúplné, bez příběhů |
| [boudy.info](https://www.boudy.info/seznam.php?txt=cz&str=33) | Letitý komunitní katalog bud | Design i data z minulé éry, bez mapového rozhraní |
| [KČT](https://kct.cz/chaty/) | Síť vlastních chat | Pokrývá jen majetek KČT, ne celé hory |
| [vysoketatry.com](https://www.vysoketatry.com/chaty/chaty.html) a regionální weby | Chaty jedné oblasti | Roztříštěné, každý region jinak |
| [Wikipedie SK](https://sk.wikipedia.org/wiki/Zoznam_horsk%C3%BDch_ch%C3%A1t_na_Slovensku) | Nejúplnější slovenský seznam | Jen encyklopedický výčet, žádná praktičnost |
| [alpenvereinaktiv.com](https://www.alpenvereinaktiv.com/de/huetten/) + [hut-reservation.org](https://www.hut-reservation.org/login?language=de_CH) | Alpský benchmark: strukturovaná data, mapy, rezervace | Německy/anglicky, nepokrývá ČR/SK |

**Mezera:** nikdo v ČR/SK nekombinuje úplnost + mapu jako rozhraní + živá strukturovaná data + historii a razítka. Jednotlivé kusy existují roztroušeně; celek neexistuje. Alpský benchmark ukazuje, že model funguje — jen ho nikdo nepostavil česky a pro naše hory.

## 4. Produktové pilíře

**P1 — Katalog chat** *(fáze 1)*. Strukturovaný profil každé chaty, viz datový model. Základ všeho ostatního.

**P2 — Mapa jako hlavní rozhraní** *(fáze 1)*. Ne seznam se záložkou „mapa", ale mapa jako srdce webu s turistickým podkladem a vrstvami: otevřeno teď, s noclehem, zimní provoz, zaniklé chaty. První wow dojem vzniká tady.

**P3 — Výlety a přechody** *(fáze 1, přechody naplno fáze 3)*. Redakční výlety ke každé chatě; později plánovač vícedenních přechodů chata–chata postavený nad grafem sousedství (časy mezi chatami jsou přímo v datech).

**P4 — Historie a zaniklé chaty** *(fáze 1, průběžně)*. Časová osa každé chaty, dobové pohlednice vedle dnešních fotek (posuvník tehdy/dnes), samostatná kategorie zaniklých chat. Obsah, který nikdo nemá, s obrovským emočním i sdílecím potenciálem.

**P5 — Razítkovník: katalog turistických razítek** *(sběr od fáze 1, komunitně od fáze 2)*. Každá chata má u profilu své aktuální razítko (otisk/sken) + archiv historických variant. Komunita sběratelů (FB skupiny apod.) pomáhá katalog kompletovat a udržovat aktuální — „na chatě X už razítkují nové razítko" je přesně typ zprávy, kterou sběratelé sami hlásí rádi. Vzniká tak unikátní, jinde neexistující archiv — filatelie české turistiky.

**P6 — Deník chataře** *(fáze 4)*. Účet, odškrtávání navštívených chat, digitální sbírka razítek, odznaky za kompletní pohoří. Navazuje na skutečnou sběratelskou kulturu (razítka, KČT odznaky) — dává důvod k registraci a návratům.

**P7 — Aktuálnost a chataři** *(fáze 4)*. Chataři dostanou přístup ke správě svého profilu a novinek. Řeší největší dlouhodobý problém — zastarávání dat — a mění katalog v živý kanál.

**P8 — Česky do Alp** *(fáze 5)*. Průvodce alpskými chatami pro Čechy: jak fungují rezervace, Alpenverein a členské slevy, polopenze, pravidla. Neobsazená nika s největším byznysovým potenciálem domény.

## 5. Datový model

Zásada: **web se generuje nad daty, ne obráceně.** Oblasti, žebříčky („nejvýše položené", „kam s dětmi") i mapy jsou pohledy na databázi, ne ručně psané stránky. Model od prvního dne počítá s více zeměmi a do budoucna i jazyky.

### Chata (centrální entita)

| Skupina | Pole |
|---|---|
| Identifikace | název, slug, aliasy a historické názvy, země |
| Klasifikace | typ (obsluhovaná chata / útulna / bivak / horský hotel), stav (v provozu / dočasně mimo provoz / zaniklá) |
| Lokace | GPS, nadmořská výška, pohoří → podoblast, nejbližší obec |
| Nocleh | ano/ne, typy pokojů, kapacita, ceny orientačně, odkaz na rezervaci |
| Občerstvení | kuchyně ano/ne, typ (restaurace / bufet / kiosek), specialita |
| Služby | voda, WC, sprchy, platba kartou, wifi, psi, nabíjení, lyžárna |
| Provoz | sezóna, otvírací doba, zimní provoz, kontakty, web, sociální sítě |
| Přístup | trasy: výchozí bod, čas, převýšení, značení, obtížnost; přístup autem/parkování, lanovkou, veřejnou dopravou (zastávka + odkaz na IDOS) |
| Historie | rok vzniku, časová osa milníků (přestavby, požáry, přejmenování), volný text |
| Média | fotky (s datem, autorem, licencí), dobové pohlednice, webkamera |
| Vztahy | sousední chaty + čas přechodu (→ graf pro plánovač), výlety, razítka, články |
| Meta | zdroje údajů, **ověřeno kdy a kým** (klíčové pole!), interní poznámky |

### Razítko

Samostatná entita, ne jen obrázek u chaty: otisk (sken/foto), chata, období platnosti (od–do), stav (aktuálně k dispozici / nedostupné / historické), kde na chatě se razítkuje, kdo doložil (redakce / jméno sběratele — kredit motivuje komunitu), datum posledního potvrzení. Umožní to: archiv variant v čase, „chybějící razítka" jako výzvu pro komunitu, a později propojení s deníkem chataře.

### Další entity

**Oblast:** hierarchie země → pohoří → podoblast; popis, mapové ohraničení, přehled chat a výletů.
**Výlet:** typ (okruh / přechod / tam a zpět), délka, převýšení, čas, obtížnost, sezónnost, GPX, pořadí zastávek (chaty, vrcholy), doprava na start a z cíle, text po etapách.
**Článek/Příběh:** volný redakční obsah propojený s chatami a oblastmi (historie, rozhovory s chataři, žebříčky).
**Uživatel + Návštěva** *(fáze 4)*: účet, zalogovaná návštěva chaty (datum, poznámka, fotka), získaná razítka, odznaky.

### Taxonomie — rozhodnout ve fázi 0

Návrh definice: web pokrývá objekty v horském prostředí na značených trasách, které slouží turistům — **obsluhované chaty** (personál, občerstvení/nocleh), **útulny** (neobsluhované, volně přístupné), **bivaky** (nouzové přístřešky) a **horské hotely** jen pokud plní roli chaty na trase (hranice: poloha na hřebeni/trase vs. běžný hotel u silnice). **Zaniklé chaty ano** — jsou to plnohodnotné záznamy se stavem „zaniklá". **ROZHODNUTÍ MICHALA 30. 7. 2026 — rozsah je „turistické chaty“, a říká se nahlas:** definice výš mluvila o „objektech v horském prostředí“ a to přestalo stačit, jakmile do korpusu zamířila turistická chata v Prachovských skalách a Riegrova chata na Kozákově — turistické chaty, ale ne horské. Na dotaz („jak chceš zacházet s chatou na Kozákově a Prachovem?“) padlo: *„řekněme nahlas turistické chaty.“* Rozsah tedy zní **turistické chaty na značených trasách**: horské boudy a schroniska, útulny, bivaky, horské hotely v roli chaty na trase, rozhledny s občerstvením a chaty ve skalních městech. Rozhoduje **role na trase a občerstvení pro veřejnost, ne typ stavby ani nadmořská výška** (navazuje na rozšířený klíč z 26. 7. 2026). Web to nezamlčuje: FAQ na stránce oblasti rozsah vypisuje a u oblastí, které pohoří nejsou, to přiznává úrovní `turisticka-oblast`. Od této definice se odvíjí slib úplnosti, proto je to rozhodnutí č. 1; přesný počet objektů (odhadem nižší stovky pro ČR, desítky vysokohorských pro SK) vznikne jako první datový úkol.

**Rozhodnutí Michala k hranici (průběžně):** o zařazení rozhoduje **veřejné občerstvení**, ne typ stavby. Objekt s veřejně přístupným občerstvením patří dovnitř; penzion nebo pronájem chalupy bez veřejného občerstvení ne. **Doplněno 26. 7. 2026** (*„rozhledny a sedla s občerstvením bych zahrnul"*): platí to i pro **rozhledny a sedla** — pokud u nich občerstvení je, patří do průvodce stejně jako bouda. Enum `typ` na to zatím nemá hodnotu a schéma se kvůli tomu **nemění dřív, než bude spočítáno, kolika objektů se to týká**; vedeno jako DATA-23. **Doplněno 26. 7. 2026 podruhé** (*„všechny boudy, které sloužily turistům i v minulosti (a teď tomu tak není), bych uvedl, jen u nich bude poznámka, že neslouží veřejnosti"*): klíč se ptá na **službu turistům v celé historii objektu, ne jen dnes**. Bouda, která turistům sloužila a dnes neslouží (školicí středisko, jen ubytovaní hosté apod.), do průvodce **patří** — profil ale musí poctivě říct, co dnes veřejnosti nenabízí. Mimo průvodce tak zůstávají jen objekty **bez turistické služby v minulosti i dnes** (čisté pronájmy, apartmány) a objekty, kde služba není doložena vůbec.

## 6. Technická architektura

Navrženo pro sólo vývoj s Claude Code: co nejméně pohyblivých částí, nuda tam, kde nuda pomáhá, energie do toho, co je vidět.

**Doporučený stack:**

- **Next.js (App Router) + TypeScript** — profily chat staticky generované/ISR (rychlost = wow i SEO), zároveň připravené na interaktivní části (mapa, později účty). Claude Code tenhle stack zná do hloubky.
- **PostgreSQL + Prisma** — pár set až tisíců záznamů nepotřebuje nic exotického; geo dotazy („chaty v okolí") zvládne obyčejný výpočet vzdálenosti, PostGIS až kdyby bylo třeba.
- **Payload CMS (v3)** — admin rozhraní zadarmo nad naším datovým modelem, běží přímo uvnitř Next.js aplikace: kolekce = naše entity, knihovna médií, verzování, role (později přístupy pro chataře). Tvůj hlavní pracovní nástroj bude editor záznamů — jeho pohodlí rozhoduje o tempu plnění. Ověřit ve fázi 0 na vzorové chatě; záložní varianta je vlastní jednoduchá administrace.
- **Mapa: dlaždice Mapy.com** (dříve Mapy.cz) přes [REST API](https://developer.mapy.com/rest-api-mapy-cz/function/map-tiles/) — **rozhodnuto**: sada „outdoor" je přesně ta turistická mapa se značením KČT, kterou čtenáři znají z papíru i z dětství. Rastrové dlaždice 256/512 px (retina) ve standardním z/x/y formátu → snadné napojení do Leafletu či MapLibre ([tutoriál](https://developer.mapy.com/rest-api-mapy-cz/tutorials/map-display/)). Registrace Seznam účtem na [developer.mapy.com](https://developer.mapy.com/) → projekt a API klíč ihned; tarif Basic má **250 000 kreditů měsíčně zdarma** (nad rámec volitelné placené čerpání, na žádost zvýhodněný tarif 10 mil. kreditů). Povinná atribuce s logem Mapy.com. Záloha pro jistotu: OSM outdoor styly, kdyby se podmínky změnily.
- **Hosting: vlastní VPS „pticore"** (běží na něm hub.prague-tourism.com), **spravovaný přes Laravel Forge** — **rozhodnuto**: web přibude jako další Forge *site* (`turistickechaty.cz` + `www`; staging `dev.turistickechaty.cz` už na konci Fáze 0). Next.js poběží jako Forge **daemon** za nginx reverse proxy (oficiálně podporovaný postup), SSL Let's Encrypt ve Forge, nasazení **Quick Deploy** navázané na push do GitHub repa — deploy skript a nginx šablona budou součástí repozitáře. Postgres: ověřit na serveru (laravelové VPS bývají na MySQL), případně doinstalovat přes Forge recipe; oddělená databáze a uživatel. Kdyby byl build na serveru těsný na RAM, přesune se do GitHub Actions (na server jen artefakt). Zálohy = noční dump DB + fotky mimo server; fotky na S3-kompatibilním úložišti (Cloudflare R2). Multihosting Active24 aplikaci nespustí — poslouží pro DNS (A záznamy na pticore) a maily. Dodatečné náklady: prakticky nulové.
- **Vyhledávání:** zpočátku Postgres full-text, později Meilisearch, až bude co hledat.

**SEO/AI od prvního dne (architektonická rozhodnutí, ne dodatky):**

- URL: `/cesko/krkonose/lucni-bouda`, `/vylety/prechod-krkonos`, `/razitka/...` — čitelné, hierarchické, připravené na další země.
- Schema.org JSON-LD na každém profilu (LodgingBusiness/FoodEstablishment/TouristAttraction dle typu + BreadcrumbList), sitemap, OG obrázky generované z dat (foto + jméno + výška), `llms.txt`.
- Cíl: být zdrojem, který citují vyhledávače i AI asistenti, když se někdo zeptá „kde přespat na hřebeni Nízkých Tater".

**Práce s Claude Code:**

- Tento dokument do `/docs/plan.md` v repozitáři; `CLAUDE.md` s konvencemi (stack, struktura, čeština v obsahu, definice hotovosti profilu).
- Malé iterace s jasným cílem („profil chaty se generuje z DB včetně JSON-LD"), ne „udělej web".
- Import skripty jako první občan: bootstrap seznamu chat z OpenStreetMap (Overpass, tagy `tourism=alpine_hut/wilderness_hut`) — pozor na licenci ODbL (atribuce; převzatá data jen jako výchozí seznam k ručnímu ověření).
- Testy tam, kde to bolí: import dat, generování JSON-LD, sitemap.
- **Provozní model: 30 minut denně, autonomně.** Každodenní naplánovaná session, která stáhne repozitář → přečte `docs/BACKLOG.md` a pracovní deník `docs/DENIK.md` → zpracuje nejvyšší položku (vývoj, nebo sběr a ověřování dat o chatách) → commitne, zapíše do deníku a pošle krátké shrnutí. Řízení je jednoduché: Michal kdykoli přepíše pořadí v BACKLOG.md. Pojistky: datové záznamy vždy se zdrojem a příznakem ověření (session si nikdy nedomýšlí fakta), větší rozhodnutí se do backlogu vrací jako otázka, ne jako hotová věc. Předpoklad: **soukromý GitHub repozitář jako jediný zdroj pravdy** (kód, dokumenty, datové soubory) s přístupem přes fine-grained token.

## 7. Obsahová strategie (redakční)

**Pravidlo č. 1: žádný profil nejde ven poloprázdný.** Slib webu je úplnost a přesnost — deset dokonalých profilů buduje značku, sto pahýlů ji ničí. (Proto pilot, ne celá ČR najednou.)

**Šablona profilu** (checklist v příloze A) — každá chata: kompletní data + 2–4 odstavce živého textu (charakter místa, co si dát, kdy přijít) + minimálně 3 fotky + historie aspoň v bodech + razítko, pokud existuje. Tón: věcný a vřelý, žádný cestovkový marketing; píše člověk, který na té chatě byl.

**Tempo a realismus.** Při 2–3 kompletních profilech týdně po večerech je pilotní pohoří (~40–60 objektů podle definice) hotové za 3–5 měsíců. To je v pořádku — srdcovka se nesmí uštvat v prvním sprintu. Fotky vznikají při vlastních výletech (obsah = vedlejší produkt toho, co stejně rád děláš); co nestihneš nafotit, doplní se průběžně.

**Razítka — komunitní sběr od začátku.** Ještě před spuštěním účtů: jednoduchý formulář „nahraj otisk razítka" (foto/sken + chata + datum) s ruční moderací a kreditem pro přispěvatele. Oslovit existující FB skupiny sběratelů turistických razítek — pro ně je veřejný katalog splněný sen a web tím získává první živou komunitu a evangelisty. Výzva „chybí nám razítka těchto 12 chat" je samonosný komunitní mechanismus.

**Dobové materiály a práva.** Vlastní sbírka + oslovení sběratelů pohlednic, regionálních muzeí a spolků (kredit u fotky funguje); digitalizované fondy: eSbírky.cz a Europeana (u položek označených jako volné dílo / CC). U starých pohlednic řešit autorská práva případ od případu (bezpečné: díla, u nichž uplynulo 70 let od smrti autora, anonymní pohlednice ze začátku století; u ostatního souhlas).

**Zdroje současných fotografií (v pořadí priority).** Vlastní focení zůstává ideálem, ale nesmí brzdit plnění webu — startovací mix:

1. **Wikimedia Commons** — hlavní zdroj: česká komunita má nafocené stovky chat a bud pod licencemi CC BY / CC BY-SA; použití zdarma i komerčně s uvedením autora, licence a odkazu. Vyhýbat se variantám NC (nekomerční) a ND kvůli budoucí monetizaci.
2. **Přímo od chatařů** — součást ověřovacího telefonátu: žádost o 2–3 fotky se svolením, kredit + odkaz na rezervaci jako protihodnota. Dlouhodobě nejlepší zdroj.
3. **Openverse / Flickr s CC filtrem** — doplněk pro chybějící objekty; licenci ověřovat u každé fotky zvlášť.
4. **Unsplash / Pexels** — jen atmosférické záběry hor pro hero plochy; konkrétní české chaty tam prakticky nejsou.

**Nepoužívat:** fotografie uživatelů z Google Maps ani Mapy.com — podmínky obou služeb je nelicencují pro použití na cizích webech. Komunitní sběr fotek přijde s hotovějším produktem (spolu s razítky, fáze 2+). Každá převzatá fotka nese v databázi autora, zdrojové URL, licenci a datum převzetí; atribuce se zobrazuje přímo u fotky. Vlastní a chatařské snímky postupně převzaté nahrazují.

**Zdroje dat:** OSM (výchozí seznam), weby a sociální sítě chat, KČT/KST, obce a mikroregiony, literatura o historii bud, chataři napřímo (telefonát je nejrychlejší ověření a zároveň první kontakt pro budoucí partnerství).

## 8. Distribuce: SEO, sociální sítě, komunita

**SEO logika.** Tři vrstvy dotazů: navigační („chata Výrovka", „Rabštejn otevírací doba") — pokrývají profily; inspirační („výlet s dětmi Jeseníky", „kam na hřebenovku") — pokrývají výlety a žebříčky generované nad daty; praktické („kde se najíst na hřebeni Krkonoš") — pokrývají oblasti a filtry. Husté interní prolinkování entit (chata ↔ výlet ↔ oblast ↔ razítko) je u datového webu přirozené a Google ho miluje.

**Sociální sítě.** Formát „tehdy/dnes" (dobová pohlednice vedle dnešní fotky) je dělaný pro Instagram a Facebook — pravidelný, levný na výrobu, vysoce sdílený. Druhý formát: příběhy zaniklých chat. Cílit na existující komunity: FB skupiny sběratelů razítek, hřebenovkářů, fanoušků jednotlivých pohoří.

**Newsletter „Kam o víkendu"** — jednou týdně v sezóně tip na výlet s chatou. Vlastní kanál nezávislý na Googlu a Metě; sbírat adresy od prvního dne.

**PR:** outdoor média (recenze webu po spuštění pilotu), regionální média u historických témat („unikátní archiv razítek krkonošských bud").

## 9. Monetizace (srdcovka → uživí se)

Zásada: **monetizace nikdy nesmí rozbít wow.** Náklady projektu jsou malé (stovky Kč měsíčně + tvůj čas), break-even je nízko — není důvod spěchat a zaplevelit web reklamou. Pořadí nasazení:

1. **Provize z ubytování** *(od fáze 2–3)*: affiliate odkazy u chat, které jsou na rezervačních platformách; u ostatních přímá dohoda s chatou („ověřený odkaz na rezervaci" — třeba i výměnou za správu profilu).
2. **Partnerské programy** *(od fáze 3)*: členství Alpenverein přes české pobočky, outdoor vybavení, pojištění na hory — kontextově relevantní, ne bannery.
3. **Prémiový účet** *(s fází 4)*: export GPX, offline podklady, pokročilý plánovač přechodů, web bez reklam; nižší stovky Kč ročně. Deník a razítka zůstávají zdarma — jsou motorem komunity.
4. **Sponzoring rubrik a decentní reklama** *(až s návštěvností)*: např. „Historii bud podporuje…".
5. **Později:** tištěný razítkovník / ročenka / kalendář z dobových fotek — sběratelská komunita je přesně publikum, které si fyzickou věc koupí.

## 10. Fázový plán

| Fáze | Obsah | Milník | Orientační čas |
|---|---|---|---|
| **0 — Základy** | Taxonomie a datový model, repo + stack + admin (Payload). **Design uzavřen**: systém **„Moderní průvodce" v2.2** dle handoffu z Claude Design (složka `design/` v repozitáři) — bílá + krém, sytá červená #E0341F, modrá #1B6E9E, inkoust #384057, alpská zelená #61BA13 jen pro přírodu a výlety; barva výhradně v plochách, nikdy v rámečcích; Space Grotesk 700 + Inter, žádný monospace; pásové značky, výškové profily, razítkovací animace, dark mode a mobilní tab-bar dle klikacího prototypu (= závazná pixel-perfect reference); `tokens.css` jako první commit; fonty self-hosted (SIL OFL). Zbývá: logo mini-session, šablona profilu, pravidla fotek/licencí | **Vzorový profil jedné chaty, který vyvolá wow** | 4–6 týdnů |
| **1 — Pilot: jedno pohoří** | Všechny chaty pilotního pohoří (návrh: Krkonoše — nejhustší síť bud a nejsilnější příběhy; nebo tvoje srdcové pohoří), 10 výletů, 5 příběhů, mapa, razítkový formulář | **Veřejné spuštění** + Search Console, IG/FB, newsletter | 3–5 měsíců |
| **2 — Česko** | Pohoří po pohoří (Jeseníky, Beskydy, Šumava, Jizerky, Orlické, Krušné…), komunitní sběr razítek naplno | **Kompletní ČR dle taxonomie** | do ~12–18 měsíců od startu |
| **3 — Slovensko + přechody** | Tatry (prestižní obsah), Fatry, Nízké Tatry…; plánovač přechodů chata–chata v1 | Kompletní SK; přechody jako samostatný produkt | +6 měsíců |
| **4 — Komunita** | Účty, deník chataře, digitální razítka, odznaky; přístupy pro chataře | První 1 000 registrovaných deníků | souběžně s f. 3 |
| **5 — Alpy česky** | Průvodce „jak fungují alpské chaty" + první regiony (Rakousko), monetizace naplno | První alpská oblast kompletně česky | dle tempa |

Časy jsou záměrně volné — srdcovka po večerech potřebuje rezervy, ne deadliny. Důležité je pořadí a milníky, ne kalendář.

## 11. Rizika a protiopatření

**Rozsah a vyhoření** — největší riziko projektu. Protiopatření: pilot místo celé ČR, udržitelné tempo, „hotovo je lepší než dokonalé" u nástrojů (u obsahu platí opak), milníky, které jdou slavit.
**Zastarávání dat** — pole „ověřeno kdy", roční audit před sezónou, postupné zapojení chatařů a komunity, formulář „nahlásit změnu" na každém profilu od prvního dne.
**Právní** — licence fotek a pohlednic (pravidla ve fázi 0), atribuce OSM dat, GDPR a cookies až s účty (fáze 4 = konzultace).
**Závislost na Googlu** — newsletter, sociální kanály, komunita razítek a značka jako přímé zdroje návštěvnosti.
**Kopírovatelnost** — data lze opsat, ale ne archiv razítek a pohlednic, komunitu, hloubku a značku. Moat = duše + komunita, proto do nich investovat průběžně, ne až nakonec.

## 12. Metriky (orientační, kalibrovat po spuštění)

Fáze 1: spuštění + kompletní pilot + první stovky návštěv denně v sezóně a první komunitní razítka. Fáze 2: kompletní ČR, rostoucí organika (řádově tisíce návštěv denně v sezóně je u této niky reálná meta), stovky odběratelů newsletteru. Fáze 3–4: registrace, aktivní deníky, pokrytí razítek > 80 % chat. Fáze 5: příjmy stabilně pokrývají náklady + odměna za čas.

## 13. Prvních 10 kroků

1. Odsouhlasit taxonomii (kap. 5) a vybrat pilotní pohoří.
2. Založit **soukromý GitHub repozitář** (zdroj pravdy pro denní autonomní sessions), Next.js + TypeScript + Postgres + Payload; tento dokument do `/docs/plan.md`, napsat `CLAUDE.md`, `BACKLOG.md` a `DENIK.md`.
3. Naklikat datový model v Payload kolekcích (Chata, Oblast, Výlet, Razítko, Článek) a ověřit pohodlí zadávání.
4. Mini značka: logo, paleta, typografie — čistá, s nádechem nostalgie (dobové boudy, razítka), ne korporát.
5. Navrhnout a postavit šablonu profilu chaty včetně JSON-LD a OG obrázku.
6. Naplnit **jednu vzorovou chatu na 100 %** (např. Luční bouda: data, text, historie s pohlednicí, razítko, výlet) — tohle je test „wow", ukázat lidem a sbírat reakce.
7. Mapa MVP: registrace na developer.mapy.com (API klíč zdarma), Leaflet/MapLibre s dlaždicemi Mapy.com „outdoor", piny z DB, filtr otevřeno/nocleh, atribuce s logem.
8. Sestavit hrubý seznam všech chat pilotního pohoří (OSM export + křížové ověření zdroji z kap. 7) — první skutečné číslo místo odhadu.
9. Vytipovat a oslovit 2–3 FB skupiny sběratelů razítek — představit záměr katalogu, získat první přispěvatele.
10. Naplánovat letní/podzimní výlety = fotografický a razítkový plán pilotu.

---

## Příloha A — checklist kompletního profilu chaty

**Data:** název + aliasy · typ a stav · GPS + výška · pohoří/podoblast · nocleh (kapacita, rezervace) · kuchyně a specialita · služby (voda, WC, karta, psi…) · sezóna + otvíračka + zimní provoz · kontakty a web · min. 2 přístupové trasy (čas, převýšení, značení) · veřejná doprava · parkování/lanovka · sousední chaty s časy · zdroje + datum ověření

**Obsah:** 2–4 odstavce živého textu · min. 3 současné fotky (s právy) · historie: rok vzniku + časová osa · min. 1 dobová pohlednice (pokud existuje) · razítko: aktuální otisk + historické varianty (pokud jsou) · min. 1 propojený výlet

**Technika:** slug a URL dle konvence · JSON-LD validní · OG obrázek · interní odkazy (oblast, výlety, sousedé)

---

*Dokument je živý — po každé fázi aktualizovat. Verze 1.0 vznikla 19. 7. 2026 jako výstup úvodního plánování; v1.1 doplnila potvrzený mapový podklad Mapy.com a klikatelný prototyp (krok 6); v1.2 přidává infrastrukturu (VPS pticore, role Active24) a provozní model denních 30minutových autonomních sessions; v1.3 zamyká finální designový směr „Moderní průvodce" (Design Session 02); v1.4 doplňuje strategii zdrojů fotografií (Wikimedia Commons, chataři, CC zdroje); v1.5 aktualizuje design na systém v2.1 — barva v lištách a plochách, ne v rámečcích; v1.6 zjednodušuje typografii na Space Grotesk + Inter (bez monospace) a přidává self-hosted fonty (tokens v2.2); v1.7 uzavírá design přijetím handoffu z Claude Design (finální tokeny, klikací prototyp jako závazná reference) a připravuje start Fáze 0; v1.8 upřesňuje nasazení přes Laravel Forge (site + daemon + Quick Deploy, staging od konce Fáze 0).*




