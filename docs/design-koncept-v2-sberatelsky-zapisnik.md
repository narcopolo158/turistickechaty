# Design koncept v2 — „Sběratelský zápisník"

**Stav:** vize pro budoucí design session (v1 „Moderní průvodce" v2.2 zůstává v provozu).
**Sekvence (rozhodnutí Michala, 22. 7. 2026):** nejdřív naplnit daty a ujasnit
strukturu/údaje profilu chaty → teprve pak design session. Tento dokument je
zadání/moodboard pro ni, ne pokyn ke stavbě teď.

**Cíl jednou větou:** *„mokrý sen turisty a sběratele"* — web, který působí jako
**dokonale graficky zpracovaný památníček**, jaký by si vedl precizní grafický
designér: ve stylu moderních **německých a švýcarských tištěných průvodců**, ale
s **„nalepenými" pohlednicemi a polaroidy** a se sběratelskými objekty (razítko,
turistická známka, vizitka) jako **faux-3D**, aby působily hmatatelně jako reálné věci.

---

## 1. Jádro: napětí, které koncept drží

Nefunguje to jako scrapbook ani jako sterilní katalog. Funguje to díky **kontrastu**:

- **Chladná švýcarská přesnost** (mřížka, typografická hierarchie, klid, ukázněné
  plochy) = nese **důvěryhodnost**. To je vizuální jazyk našeho USP „ověřená data".
- **Teplé hmatatelné artefakty** (razítko, dřevěná známka, polaroid, dobová
  pohlednice) = nesou **duši a sběratelskou slast**.

Precizní grafik = někdo, kdo do dokonalé mřížky **s citem lepí** hmatatelné věci.
Pravidlo: **data zůstávají editorialně ostrá; hmatatelnost (faux-3D, „nalepení")
si šetříme pro sběratelské objekty a emoční momenty.** Kdyby scrapbook zaplavil i
funkční data, ubližuje důvěře.

## 2. Tři sběratelské objekty jako faux-3D

Klíčové hrdinné prvky. Cíl: působí jako **reálný předmět ležící na stránce** —
bevel, stín z kontaktu s papírem, materiálová textura, na hover mírný „zvednutí".

**Razítko (otisk).** Otisk vražený do papíru: emboss/deboss (vnitřní stín +
světlo), lehké **nedokonalosti** (každý otisk trochu jinak natočený, rozpité
okraje, slabý „duch" druhého otisku) — nikdy strojově dokonalé. Máme
`RazitkoMoment` (dopad + rozpití) → to je zárodek. Faux-3D: gumové razítko se
„propíše", otisk se usadí s drobným doskočením.

**Turistická známka (dřevěné kolečko).** Nejvíc „3D-ovatelný" objekt: vypálené
dřevo, **zkosená hrana chytající světlo**, kulatý tvar se spekulárním odleskem,
reálný vržený stín. Na hover **mírný náklon/parallax** (jako bys ji zvedl), světlo
přejede po bevelu.

**Vizitka (kartička).** Papír s **ohnutým rohem**, měkký stín, přichycená
**fotorožky** (album corners) nebo washi páskou. Jemná tisková textura, pocit
soutisku.

**Technika (výkon > efekt):** vrstvené `box-shadow` (těsný + měkký) pro lift;
CSS gradienty pro bevel/ohnutý roh; `transform: perspective() rotateX/Y` na hover
pro parallax; **SVG filtry `feTurbulence`/`feDisplacementMap` pro papírové/dřevěné
zrno a rozpité okraje razítka procedurálně** (nulová váha assetů, ostré v každém
DPI); seedovaná náhodná rotace na instanci = každý otisk unikátní. **Žádný WebGL.**

**Stavy sebráno / nesebráno.** Nesebraný objekt = **duch/vyražený obrys** (slot),
který „vyplníš" sebráním. Sebráním se objekt s materiálovým zvukem/pohybem
**usadí na stránku**. To je sběratelský dopamin — a přímý motor registrací (deník).

## 3. Estetika zápisníku / památníčku

- **Papír jako podklad:** kultivovaná krémová stránka (prémiový zápisník à la
  Leuchtturm / MD Paper), **ne** laciný pergamen. Whisper-quiet **designérská
  mřížka** (tečkovaná/jemné linky) jako substrát — cítíš řád, nekřičí.
- **„Nalepené" fotky = polaroidy:** bílý asymetrický rámeček (těžší dole),
  rukopisný popisek (střídmě), náklon ±2° (variovaný), **fotorožky nebo washi
  páska**, kontaktní stín (ne odlepený drop-shadow). Uživatelské i dobové fotky.
- **Dobové pohlednice** mountované stejně; **slider „tehdy/dnes"** = historická
  pohlednice a dnešní fotka jako dva mountované tisky s taženou dělicí čárou.
- **Editorial popisky všude:** každý obrázek i údaj má drobný přesný štítek se
  zdrojem — jako **popiska v muzeu / švýcarský infopanel**. Tady se **ověřená data
  stávají krásou**: citace zdroje = elegantní okrajová poznámka; „ověřeno 22. 7.
  2026" = drobná knihtisková značka; jistota A/B/C = decentní přesný znak.

## 4. Švýcarsko-německý tiskový vliv — konkrétně

- Mřížkové systémy (Müller-Brockmann), silná levá sazba, štědrá krémová plocha,
  vlasové linky, **asymetrické sloupce**, velký okraj na marginálie.
- **Barva ukázněně v plochách**, ne v rámečcích (drží se v2.2). Teplo přinášejí
  objekty; layout zůstává disciplinovaný.
- **Data jako švýcarská infografika:** výškový profil = čistý editorial area-chart
  (máme); úseky trasy = vodorovný pruh **pásových značek KČT** (už teď dokonalý
  modulární prvek — udělejme z něj podpisový grafický motiv: dělítka, index,
  schéma trasy); přechody chata–chata = malý uzlový diagram. Vše v jazyce dobrého
  tištěného průvodce.
- **Typografie:** Space Grotesk (struktura/nadpisy) + Inter (text) drží; přidat
  jeden **rukopisný/„markerový" řez** *jen* pro popisky polaroidů a marginálie.

## 5. Profil chaty jako „list z deníku"

Každý profil = konzistentní **stránka/rozklad zápisníku** se stabilní šablonou:

- **Hero polaroid** chaty (mountovaný), vedle **přesná hlavička** (název, historické
  názvy, výška, pohoří, stav) jako muzejní štítek.
- **Fakta jako přesné marginálie** (otvíračka, nocleh, služby) — každý údaj s
  drobnou značkou ověření/zdroje.
- **Trasa jako švýcarské schéma** (pruh značek + výškový profil + km/čas/převýšení).
- **Sběratelský pruh:** razítko (faux-3D otisk) + známka (dřevěné kolečko) +
  vizitka (kartička) pohromadě — hmatatelné srdce stránky.
- **Historie jako mountovaná pohlednicová osa** (tehdy/dnes).
- **Sousední chaty** jako „záložky" na okraji deníku (vazba na přechody).

## 6. Sběratelský pas / deník — emoční vrchol

„Mokrý sen sběratele" doslova: **albový rozklad** s mřížkou slotů — sebrané
razítka/známky/vizitky jsou reálné faux-3D artefakty, prázdné sloty jsou
**duchové obrysy (cíle)**. Odznaky (pohoří, „nad 1000 m"…) jako **smaltované
placky** (faux-3D). Postup = plnící se stránky. Tady kulminuje registrace i návraty
a napojuje se to na fyzický **Pas turistických chat** (monetizace).

## 7. Pohyb a mikrointerakce (s mírou)

- Sebrání razítka = dopad + usazení (máme); známky = „doskočení" se dřevěným
  stínem; vizitky = zasunutí do fotorožků. Sparingly, s citem.
- Hover parallax na 3 objektech; sekce oddělené jako **tabové předěly zápisníku**
  (ne kýčovité 3D otáčení stránek — to je dnes už trapné; spíš pocit svázaného
  svazku).
- **`prefers-reduced-motion`:** dimenze přežívá i bez pohybu (stín/bevel drží).

## 8. Reálné mantinely (co pohlídat)

- **Důvěra vs. craft:** funkční data ostře editorialně; faux-3D a „nalepení" jen
  pro objekty a hero. Scrapbook nesmí podkopat „ověřená data".
- **Výkon:** SVG-filter textury (nulové assety), lazy-load polaroidů, žádný WebGL;
  držet rychlé LCP (rychlost = wow i SEO).
- **Přístupnost:** kontrast, focus stavy, reduced-motion; hmatatelnost je vizuální
  vrstva nad **čistým sémantickým HTML** (které už máme — bonus pro SEO i AI).
- **Mobil first (60 %+):** album do jednoho sloupce, objekty stackují, parallax
  lehčí/vypnutý; rozklad → scroll.
- **Tiskové CSV:** koncept „deníku" si přímo říká o **nádherný print stylesheet**
  (vytiskni si profil / svůj pas) → propojení s fyzickým produktem.

## 9. Co připravit PŘED design session (návaznost na sekvenci)

1. **Zamknout informační architekturu profilu** (sekce + pole + co je vždy
   přítomné). Můžu teď rozpracovat kanonický „content model" profilu — to je přesně
   ta „struktura a údaje", co chceš mít pohromadě.
2. **Sehnat reálné artefakty, na kterých estetika stojí:** kvalitní fotky chat
   (polaroidy), **skeny razítek** (část máme), **obrázky známek/vizitek**
   (čeká na svolení firem — bez nich se sběratelská vrstva navrhuje jen z placeholderů!),
   **dobové pohlednice** (práva). Design session potřebuje **skutečné objekty**, ne lorem.
3. **Moodboard:** moderní alpské/švýcarské průvodce, prémiové zápisníky
   (Leuchtturm, MD Paper), švýcarská infografika (Müller-Brockmann), muzejní
   katalogová typografie, kultivovaná koláž/scrapbook editorial.

## 10. Rizika / otevřené otázky pro session

- Kolik faux-3D je „prémiové" a kdy už „kýč"? → držet **restraint**, objekty jako
  vzácnost, ne všude.
- Rukopisný řez: kolik ho unese, aby to nebylo roztomilé na úkor důvěry.
- Dark mode „za tmy": album v noci — teplé lampové světlo na papíru, ne jen
  invertované barvy.
- Výkonový rozpočet na textury/parallax na mobilu — změřit early.

---

## 11. Doplnění (Michalův vstup 22. 7.) — nosné myšlenky navíc

Následující body přišly z druhé iterace a jsou dost silné, aby řídily celý design:

- **Veřejný katalog ≠ osobní zápisník.** Dvě odlišné vrstvy hustoty:
  *veřejná část* = čistá, přesná, málo dekorativní, skenovatelná (fakta, plánování);
  *osobní zápisník* (přihlášený) = víc vrstev, razítka, polaroidy, poznámky,
  vzpomínky. Tím nikoho nenutíme procházet „těžký scrapbook", když jen chce
  otvíračku. **Tohle je hlavní organizační rozhodnutí — dekorace roste s osobní
  vrstvou, ne ve veřejném katalogu.**
- **Filtr každého prvku — patří do jedné ze tří kategorií:** **Informace** (rychlá,
  přesná, čitelná) · **Artefakt** (působí jako reálný fyzický předmět) · **Vzpomínka**
  (osobní, emoční). Nepatří-li prvek ani do jedné, na stránce nemá co dělat.
  Skvělá designová disciplína proti kýči a přeplácání.
- **Organizační metafora / tagline:** *„Každá chata má svůj list. Každá návštěva
  zanechá stopu."* Propíše se všude: profil = list, razítko = stopa, trasa = čára,
  fotka = vzpomínka, známka = artefakt, deník = vlastní kniha uživatele.
- **Stavy ověření jako viditelný designový motiv:** *ověřeno provozovatelem /
  redakcí / potvrzeno návštěvníkem / údaj starší 12 měsíců / provoz nepotvrzen /
  historický údaj* — malý přesný znak u proměnlivého údaje. Spojuje datovou
  kvalitu a estetiku (navazuje na „razítko dnes" + datovou volatilitu z backlogu).
- **Profil jako dvoustrana:** levá strana = emoce/identita (hero, název, historické
  názvy, výška, charakteristika, razítko/známka/vizitka, „navštíveno", osobní
  poznámka); pravá = tvrdá data (provoz, nocleh, kontakty, výchozí body, trasy,
  doprava, mapa, historie, zdroje, datum ověření). Na mobilu ne fyzicky vedle sebe,
  ale jako kapitoly — pocit zápisníku zůstává.
- **Pohlednice s lícem i rubem:** otočení → na rubu historická data, poštovní
  razítko, rok, původní název, zdroj (rozšíření slideru tehdy/dnes).
- **Sbírka jako samostatný režim** (vedle katalogu): razítka / známky / vizitky /
  pohlednice / odznaky, přepínač *mám / chybí mi / vyřazené / dle pohoří / roku /
  série* — sběratelská vitrína, ale stále čistě.
- **Opt-in „hmatový režim":** zvuk (otisk razítka, otočení pohlednice, šustnutí
  mapy) i silnější haptika **default vypnuté**, uživatel si je zapne.
- **Filtry mapy jako papírové záložky** (razítko, nocleh, jídlo, otevřeno, lanovka,
  vlak, pes, děti, zaniklé) — drobný artefaktový detail nad čistou mapou.

### Moje výhrady / co v session otestovat (ne slepě převzít)

- **Per-pohoří akcenty** (Krkonoše červená, Šumava zelená…): lákavé, ale **hlídat
  jednotu v2.2** — akcent jako *whisper* (jeden prvek), ne reskin celého pohoří,
  jinak se rozpadne značka. Otestovat na 2 pohořích vedle sebe.
- **Serif pro názvy/historii vs. náš Space Grotesk:** návrh „kvalitní knižní serif
  pro emoci, grotesk pro data" je pro pocit „zápisníku" možná **silnější než
  současné řešení** — stojí za A/B v session (v2.2 je grotesk-only). Rozhodnutí typu.
- **Rukopisný font jen pro osobní poznámky a popisky polaroidů** — nikdy pro
  navigaci a hlavní obsah (na tom se oba materiály shodují — držet).
