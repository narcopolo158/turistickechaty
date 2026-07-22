# 03 — Moodboard spec + otevřená rozhodnutí

Dvě věci, které koncept nechává na session: **z čeho čerpat** (moodboard) a **co
rozhodnout** (decision log). Moodboard je tu jako **kurátorovaný seznam s pokyny**
(obrázky sbírá Michal/design — tady je co hledat a proč), rozhodnutí jsou
předžvýkaná na „potvrď / uprav", ne prázdná stránka.

---

## Část A — Moodboard spec (co hledat a co si z toho vzít)

Koncept §9.3 chce moodboard z 5 světů. Ke každému **co emulovat** a **čeho se
vyvarovat** — moodboard není „líbí/nelíbí", je to spec.

### 1. Moderní alpské / švýcarské tištěné průvodce
- **Hledat:** Rother Bergverlag (německé turistické průvodce), SAC/ÖAV ročenky,
  Bergwelten, Transa/Bächli katalogy, „Schweiz Mobil" tiskoviny.
- **Vzít:** klidná typografická hierarchie, hodně bílé/krémové plochy, data jako
  ukázněné tabulky, výškové profily jako čisté area-charty, symboly tras.
- **Vyhnout se:** turistické „adventure" klišé (fotky přes celou stránku s textem
  přes ně), přesycené barvy.

### 2. Prémiové zápisníky (substrát)
- **Hledat:** Leuchtturm1917, MD Paper (Midori), Traveler's Notebook, Moleskine
  detailní makra papíru; tečkovaná/linkovaná mřížka, ražba, šití.
- **Vzít:** **kultivovaná krémová** (ne béžová/pergamen), whisper mřížka jako
  substrát, kontaktní stíny „nalepených" věcí, prošití/perforace jako decentní
  motiv předělů.
- **Vyhnout se:** laciný „vintage paper" texturovaný JPG, sépiové filtry, kudrlinky.

### 3. Švýcarská infografika / typografie
- **Hledat:** Josef Müller-Brockmann (Grid systems), Massimo Vignelli, švýcarské
  železniční/mapové systémy, Unimark; horské cedule a KČT/PTTK rozcestníky.
- **Vzít:** mřížkový systém, silná levá sazba, vlasové linky, asymetrické sloupce,
  velký margin na marginálie, **data = design** (ne dekorace kolem dat).
- **Vyhnout se:** centrovaná sazba, dekorativní oddělovače.

### 4. Muzejní / katalogová typografie (nosič „ověřených dat")
- **Hledat:** popisky v galeriích, aukční katalogy (Sotheby's/Christie's popisky
  děl), přírodovědné sbírkové štítky, filatelistické/numismatické katalogy.
- **Vzít:** **drobný přesný štítek se zdrojem** u každého objektu → tak vypadá naše
  citace/`verified`/jistota A-B-C. Právě tady se „ověřená data stávají krásou".
- **Vyhnout se:** aby štítek křičel; má být elegantní okrajová poznámka.

### 5. Kultivovaná koláž / scrapbook editorial (jen emoční vrstva)
- **Hledat:** Kinfolk/Cereal/Monocle editorial, prémiové cestovní deníky, „flat
  lay" s fotorožky a washi, mountované tisky v pasparte.
- **Vzít:** **jak se s citem lepí** hmatatelné věci do čisté mřížky — polaroid s
  náklonem ±2°, fotorožky, washi, dobová pohlednice v pasparte.
- **Vyhnout se:** DIY scrapbook chaos, nálepky, cutesy — koncept §8: scrapbook
  nesmí zaplavit funkční data.

### Filmová/materiálová reference pro faux-3D
- Razítko: reálné otisky do papíru (emboss/deboss), inkoustové razítko na dokladu.
- Známka: **vypálené dřevo** (turistické známky reálně jsou dřevěné), zkosená hrana
  chytající světlo, spekulární odlesk.
- Vizitka: matný papír s ohnutým rohem, měkký kontaktní stín.

---

## Část B — Decision log (rozhodnout na session)

Sloučeno z: koncept §10 (rizika), §11.x (moje výhrady k otestování), model §8
(otevřené otázky). Každé s **doporučeným defaultem** — session to jen potvrdí nebo
upraví. Řazeno dle dopadu.

### B1. Serif pro názvy/historii, nebo grotesk-only? ⭐ typové rozhodnutí
- **Kontext:** v2.2 je Space Grotesk + Inter (grotesk-only). Koncept navrhuje
  knižní serif pro emoci/názvy/historii, grotesk pro data.
- **Doporučení:** **A/B otestovat** na profilu A (Luční) a E (Lovecká). Default:
  serif jen pro `nazev` + historickou osu + perex; data zůstávají grotesk/Inter.
  Rozhodnout na živých profilech, ne abstraktně.

### B2. Veřejný katalog vs. osobní zápisník — kde roste dekorace? ⭐ organizační
- **Kontext:** model + koncept §11 to zamkly: veřejná vrstva čistá/skenovatelná,
  osobní (přihlášený) bohatá. Osobní vrstva je ale Fáze 4.
- **Doporučení:** **potvrdit jako řídící princip** celého designu. Design v2 řeší
  hlavně veřejnou vrstvu tak, aby byla plnohodnotná **bez přihlášení**; osobní
  vrstvu navrhnout jako „náhled/ochutnávku" (ghost sloty), plná až Fáze 4.

### B3. Kolik faux-3D je „prémiové" a kdy „kýč"? ⭐ restraint
- **Doporučení:** **rozpočet 3 hrdinné objekty** (razítko, známka, vizitka) +
  hero polaroid. Faux-3D NIKDE jinde ve funkčních datech (koncept §8). Filtr I/A/V
  (Informace/Artefakt/Vzpomínka) z modelu je nástroj: faux-3D jen pro **A**.

### B4. Profil jako dvoustrana — chování na mobilu a nezdvojení obsahu
- **Kontext:** rozhodnuto: desktop = dvoustrana (levá emoce, pravá data), mobil =
  kapitoly. Model §8 varuje: identita/hero se nesmí zdvojit.
- **Doporučení:** navrhnout na profilu A (nejhustší) a E (nejřidší). Default pořadí
  mobilních kapitol: identita → hero → fakta → provoz → sběratelský pruh → nocleh →
  trasy → historie → zdroje. Ověřit, že levá/pravá sdílí jednu identitu.

### B5. Stav ověření jako viditelný motiv — jak vypadá `verified:false`?
- **Kontext:** DŮLEŽITÉ — dnes je **100 % údajů `verified:false`**. „Ověřeno
  redakcí" zatím nemáme ani jednou (viz doc 01, §15 Luční).
- **Doporučení:** navrhnout **5 stavů** (převzato ze zdroje / ověřeno redakcí /
  ověřeno provozovatelem / potvrzeno návštěvníky / starší 12 měsíců) jako drobné
  přesné znaky. **Klíč: „převzato ze zdroje" musí být elegantní, ne varovné** —
  jinak celý web dnes vypadá „nedůvěryhodně". Jistota A/B/C jako decentní znak.

### B6. Rozpor zdrojů a hedge — jak zobrazit „prameny se neshodnou" / „předpoklad"?
- **Kontext:** reálně v sadě: Vosecká kapacita 42/43, Samotnia výška 1195/1200,
  Vosecká fotovoltaika „projektový předpoklad", Luční superlativy „dle
  provozovatele".
- **Doporučení:** malý pattern „⚠ prameny se liší (42/43)" na rozklik; tvrzení/hedge
  = kurzíva + atribuce „dle …". Nenavrhovat, jako by každý údaj byl tvrdý fakt.

### B7. Dobové pohlednice a slider „tehdy/dnes" — návrh z placeholderu
- **Kontext:** **0 dobových pohlednic** reálně (doc 02 §3). Zaniklá stránka na nich
  stojí.
- **Doporučení:** navrhnout slider + líc/rub z **ghost placeholderů**; slot přijme
  reálný sken později. Neblokovat design, ale poctivě označit „zatím bez pohlednic".

### B8. Známka/vizitka faux-3D z placeholderu (svolení nedorazilo)
- **Doporučení:** navrhnout dřevěné kolečko a kartičku jako **prázdný slot + ghost**;
  reálný artwork se doplní po svolení (Michal oslovil firmy 22. 7.). **Razítko
  naopak z reálných 46 otisků** — může do finále.

### B9. Per-pohoří akcenty (Krkonoše červená, Šumava zelená…)
- **Kontext:** lákavé, ale riziko rozpadu jednoty v2.2.
- **Doporučení:** akcent jako **whisper — jediný prvek** (např. barva pásku/lišty),
  ne reskin. **Otestovat 2 pohoří vedle sebe** (teď máme jen Krkonoše — připravit
  hook v tokenech, rozhodnout, až přibude 2. pohoří). Default: zatím jednotná
  značka, akcent odložit.

### B10. Dark mode „za tmy" — lampové světlo na papíru
- **Kontext:** máme `--night`, ale ne jako teplé lampové světlo (jen invert by byl
  laciný).
- **Doporučení:** navrhnout jako **noční čtení deníku** — teplý tmavý papír, ztlumené
  akcenty, artefakty drží stín/bevel. Nižší priorita než světlý režim.

### B11. Rukopisný/„markerový" řez — kolik ho web unese?
- **Doporučení:** **jen** popisky polaroidů a osobní marginálie. **Nikdy** navigace
  ani hlavní obsah (na tom se koncept i Michalův vstup shodují). Default: 1 řez,
  ≤ 2 % plochy.

### B12. Výkonový rozpočet faux-3D / textur na mobilu — změřit early
- **Kontext:** SVG `feTurbulence`/`feDisplacementMap` + parallax na mobilu (60 %+
  provozu). Koncept §10: „změřit early".
- **Doporučení:** hned na začátku session **spike + měření LCP/paint** na 1 profilu
  na mobilu; `prefers-reduced-motion` vypne parallax, ale bevel/stín drží. Pokud
  textury sekají, fallback na statické SVG.

### B13. Print stylesheet (vytiskni si profil / pas)
- **Kontext:** máme `TiskButton.tsx` jako zárodek; koncept §8 chce nádherný print.
- **Doporučení:** navrhnout tiskovou verzi profilu jako **„list z deníku"** (propojení
  s fyzickým Pasem — monetizace). Nižší priorita, ale koncept si o to přímo říká.

### B14. Umístění atlasu zaniklých v navigaci
- **Kontext:** `/zanikle` existuje, nav umístění bylo označeno „na Michalovi".
- **Doporučení:** rozhodnout v rámci navigace (sekundární — „Objevovat/Historie",
  ne hlavní katalog; zaniklé nejsou cíl výletu).

---

## Priorita pro session (návrh pořadí)

1. **Nejdřív spike (B12)** — ověřit, že faux-3D technika je na mobilu únosná.
2. **Řídící principy (B2, B3, B5)** — vrstvy, restraint, stav ověření.
3. **Typo A/B (B1)** na profilu A + E.
4. **Dvoustrana (B4)** na A + E, pak C (přeshraniční) a D (zaniklá).
5. **Sběratelské objekty (B8)** z reálného razítka + placeholder známka/vizitka.
6. Zbytek (dark, print, per-pohoří, pohlednice) dle času.
