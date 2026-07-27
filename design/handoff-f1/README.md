# Handoff F1: Homepage · Stránka pohoří (Krkonoše) · Mini-stránka střediska

## Přehled
Hi-fi návrh tří šablon F1 pro turistickechaty.cz v jazyce **„Sběratelský
zápisník" / „Moderní průvodce" v2.2**: (1) **Homepage** — sběratelský stůl
s poctivými čísly, (2) **Stránka pohoří /cesko/krkonose** — vlajková loď
s malovaným 3D panoramatem, (3) **Mini-stránka střediska** (Pec pod Sněžkou,
šablona pro 7 středisek). K tomu **9 nových komponent** s dokumentovanými stavy
(záložka „Nové komponenty" v souboru pohoří).

Návrhy ctí rozhodnutí z design session: poster na homepage (plná 3D jen na
pohoří), „nejstarší" = rok z prvního doloženého milníku, FAQ generované z dat,
katalog s kartami jako výchozím zobrazením, střediska rovnou s mini-stránkou.

## O design souborech (čti první)
`F1-Homepage.dc.html` a `F1-Pohori-Krkonose.dc.html` jsou **designové reference
v HTML** — prototypy zamýšleného vzhledu a chování, **ne produkční kód**. Úkol =
znovu postavit v prostředí turistickechaty.cz (Next.js + React + Payload CMS,
TypeScript) nad existujícími komponentami v2.2. Vlastní mini-runtime
(`support.js`, `<x-dc>`, `<sc-for>`) se **nepřenáší**; přenáší se vizuál,
rozměry, interakce a tokeny. `image-slot.js` = prototypový drag-drop
placeholder fotek (v produkci Payload media / `next/image`).

V souboru pohoří přepíná horní lišta tří pohledů: **Stránka pohoří /
Mini-stránka střediska / Nové komponenty** — v produkci jde o samostatné routy.

## Fidelity
Hi-fi desktop (1240px sešit na stole) + mobilní klíčové sekce (sekce „M" na
stránce pohoří: hero, poster→tap, žebříček+filtr; tab-bar < 760 px). Light
mode; dark „hřebenovka po tmě" je záměrně dalším průchodem. Kde poběží živá
data/mapy, je v prototypu kreslený poster (viz níže) — vždy označeno kurzívní
popiskou pod prvkem.

---

## Sdílená DNA všech stránek
- **Sešit na stole:** `--desk` pozadí → krémová dvoustrana (max 1240, radius
  5px, float stín) s **5px červenou toplinou** (`--red`), zrno `feTurbulence`
  (opacity .05, multiply), tečkovaný raster `radial-gradient(circle,var(--hair)
  1px,transparent 1.5px)` / 23×23px.
- **SectionBar:** červený index-chip 26×26 + uppercase titulek (Space Grotesk
  12px, LS .16em) + vlasovka; volitelný tag vpravo (`ui.tsx → SectionBar`).
- **Poctivost:** countery jen z DB; `†` = převzato ze zdroje (elegantní, ne
  varovné); chybějící údaj = „—" nebo důstojný placeholder, nikdy 0; rozpor =
  přiznat; superlativ jen s dokladem. Mikropoznámky kurzívou (Newsreader italic).
- **Typo:** Space Grotesk (struktura/data/labely) · Inter (text) · Newsreader
  (názvy, emoce, kurzívní poznámky) · Caveat **jen** rukopisné marginálie
  (popisek polaroidu, pohlednice; ≤2 % plochy).
- **Faux-3D artefakty** (jen Artefakty dle filtru I/A/V): CSS+SVG, žádné
  obrázky ani WebGL. Hover parallax `perspective(760px) rotateY/X(±8°)`
  + `translateY(-4px)`, transition `.35s cubic-bezier(.2,.7,.2,1)`;
  `prefers-reduced-motion` vše vypíná.

---

## 1) HOMEPAGE (`F1-Homepage.dc.html`)

### Hero — „sběratelský stůl"
Grid 53/47. Vlevo: eyebrow, claim (Newsreader 54px/1.02 „Chaty, kterým můžeš
věřit."), perex, **hledání** (papírová karta, datalist všech profilů),
**CTA jako dřevěný rozcestník** — 2 šipkové cedule (clip-path
`polygon(0 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,0 100%)`,
dřevo gradient + `feTurbulence` kresba, frézovaný text se stínem
`0 -1px rgba(50,28,8,.7)`, mosazný šroubek), countery **76 · 16 · 12 +
naposledy ověřeno** a mikroblok (viz níže).

Vpravo **koláž** (5 faux-3D objektů, hover tilt, prop `artefakty` plno/decentně):
1. **Výřez turistické mapy** — roztrhané okraje (dva vnořené divy se stejným
   ~15bodovým `clip-path: polygon(...)`, vnější = bílý papír 6–7px), uvnitř
   vrstevnice (repeating-radial-gradient), červená dash + modrá trasa, bílá
   hřebenovka, bod nástupu, domeček chaty, sklad (svislý gradient), popisky,
   atribuce „© Mapy.com · KČT", 2× washi páska.
2. **Polaroid** — bílý rám, foto-slot (drag-drop), fotorožky, Caveat popisek
   „hřebenovka, srpen ’25", washi nahoře.
3. **2 otisky razítek** — kruhové Luční + hranaté Výrovka (`textPath`,
   `feTurbulence`+`feDisplacementMap` rozpití, multiply, přes okraje mapy
   i polaroidu).
4. **Dřevěná známka č. 11** — radial dřevo, bevel inset stíny, spekulár,
   embossed text.
5. **Smaltová pásová značka KČT** — bílo-červeno-bílá cedulka se 2 šroubky.

### Nové prvky homepage (přidané v posledním kole)
- **Mikroblok u counterů:** zelený chip `{n}× nově ověřeno za 14 dní`
  (POČÍTAT z `checked` — v mocku vychází 1), chipy RSS / Newsletter,
  **„Tisk seznamu ▸"** → `window.print()`.
- **Kalendárium** — pás pod herem: `Před {rok−Y} lety ({Y}) {událost}.`
  Generovat z milníků historie (kolekce Chaty→historie), rotace
  `dayOfYear % events.length` — **žádné falešné „přesně dnes"**, popiska
  říká „z milníků historie · střídá se denně". CTA „číst v Atlasu".
- **3D panorama band = STATICKÝ poster** (rozhodnutí: lanovky jezdí jen na
  stránce pohoří). Malované hřebeny (toon, modré stíny), Sněžka halo popisek,
  **lanovka nakreslená staticky** (3 podpěry, prohnuté lano, 2 zmrzlé gondoly),
  oblaka a slunce bez animace. Overlay: titulek inkoustem (`#333c50` +
  světlý halo — na papírovém nebi nefunguje bílá), CTA „Otevřít 3D mapu ▸",
  popiska „statický poster šetří data — plná 3D (i s jedoucí lanovkou) na
  stránce pohoří", atribuce. **Zimní vrstva:** `#homeZima` (jemný studený
  gradient shora, opacity 0/1) + chip „zimní poster · podle kalendáře".
- **01 Pohoří grid** — karta Krkonoš ŽIVÁ (mini panorama, 41/12/16, hover
  tilt) + 3× „připravujeme" (silueta rastr, dashed border; Podkrkonoší
  s poznámkou „přesahová oblast").
- **02 Namátkou z průvodce** — 5 kartotéčních lístků: červená horní linka,
  silueta thumb, náhodná rotace ±1.2°, hover srovná+zvedne; **kulaté
  mini-razítko** u chat s doloženým razítkem — na hover karty „dokvákne"
  (keyframe `settlePop`, JS re-trigger `style.animation`); poctivá „—" u výšky
  (Lovecká) i zaniklé. Tlačítko **„↻ jiných pět"** — seedovaný Fisher-Yates
  (LCG), výběr z celé DB. Popiska: „náhodný výběr… žádná doporučení bez dokladu".
- **03 Pohlednice z hor** — návrh virální smyčky (Fáze 2): rub pohlednice
  (faux-3D, tilt) s Caveat vzkazem, adresními linkami, **poštovní známkou**
  (bílý okraj + perforace dashed, mini hřebeny, „1410 m" místo nominále)
  a **kulatým poštovním razítkem** (šedé, rough filter, vlnky, datum).
  CTA „Složit pohlednici z profilu ▸". Kodér: generovat kompozici
  z dat profilu (foto + otisk + výška), export PNG/sdílení.
- **04 Z průvodce** — Naposledy ověřeno (řazení dle `checked`) · Z Atlasu
  zaniklých (tmavá karta) · Razítka a známky (mini-koláž + ghost vizitek).
- **Manifest pás** + footer s atribucemi.
- **Konami easter egg** — ↑↑↓↓←→←→BA spustí 12s sníh přes celou stránku
  (fixed overlay, 3 vrstvy radial-gradient vloček, keyframe `snowFallH`)
  + toast „Tajný sníh nad hřebenem!". Respektuje reduced-motion. V produkci
  volitelné (nízká priorita, ale dělá radost).
- **Print (B13):** `@media print` skryje `#homeScreen`, ukáže `#homePrint` —
  čistý černobílý **seznam všech chat** (název/výška/stav/ověřeno/razítko)
  s hlavičkou a zdrojovou poznámkou. V produkci: print stylesheet routy
  `/chaty` nebo dedikovaná `/tisk` s SSG.

### Stav & tweaky (homepage)
`seed` (namátkou), `artefakty` plno/decentně, `sezonaHero` auto/léto/zima
(auto = XII–III zima → zimní tint + chip; **jen kalendář, žádná fake předpověď**).

---

## 2) STRÁNKA POHOŘÍ (`F1-Pohori-Krkonose.dc.html`, pohled „Stránka pohoří")

Pořadí: breadcrumb → **hero** (název 52px, kurátorská charakteristika se
zdrojovou popiskou, **4 stat-tiles** s mikro-zdroji) → **01 Malovaná 3D mapa**
→ 02 Chaty oblasti → 03 Žebříčky → 04 Střediska → 05 Top cíle → 06 Zaniklé →
07 Sběratelství (vitrína) → 08 FAQ → 09 Přesahy → manifest → **M Mobil**.

### 01 — Malovaná 3D mapa (centerpiece, 520px)
Poster placeholder + **funkční UI overlay** (v produkci three.js z experimentu,
`Mapa3D*`, dynamic import, SSR off):
- **5 hloubkových vrstev** (`data-depth` .25–2.3) s myším parallaxem
  (translate dle kurzoru, JS na `[data-depth]`, transition .5s);
- toon hřebeny s modrými stíny, sněhové čepice, smrky, haze pásy, slunce
  (pulz `sunGlow`), **2 plující oblaky** (`cloudDrift` 34/46s protisměrně);
- **hřebenovka** (bílá stopa) + **animovaný turista** (SMIL `animateMotion`
  26s, batoh `--red`) — v produkci „Projít hřebenovku" animace kamery;
- **léto/zima:** zima = **sněhové přemalování, ne mlha** — samostatná SVG
  vrstva `#snegLayer` (duplikát hřebenů ve sněhových tónech `#e3eaf1…#eff4f7`,
  bílé čepice, smrky tmavé se sněhovými vršky, hřebenovka šedomodrá,
  **KČT trasy plný kontrast**), crossfade opacity .6s + jemný tint oblohy
  (horních ~50 %) + padající sníh (background-position anim). Ovládá se
  přímo přes DOM id (starší runtime; v Reactu normální state).
- overlay: hledání, léto/zima toggle, legenda, **„Projít hřebenovku ▸"**,
  klik na domeček → **preview bublina** (název/výška/stav + „Otevřít profil"
  / „Přijít po značené trase"), kompas+měřítko, atribuce. Deep-link
  `?chata=slug` → přílet kamery; mobil poster→tap; reduced-motion bez animací.
- **hover řádku seznamu ↔ zvýraznění markeru** (scale 1.45 + bílé halo).

### 02–09 (stručně; plné detaily viditelné v souboru)
- **02 Chaty oblasti** — filtr chips, řazení dle výšky, tabulkové řádky
  (název+tag, výška, StatusPill, ikonky služeb, ověřeno). Lovecká bez výšky
  = „—" + vysvětlující popiska; Obří bouda `zaniklá` v šedé.
- **03 Žebříčky** — 3 karty: Nejvýše (zaniklá se značí †, nevyřazuje) ·
  Nejstarší (rok z 1. milníku; bez roku = vůbec se neobjeví — dnes 14/41) ·
  Největší (nižší číslo při rozporu; **Luční záměrně chybí** — kapacitu
  neuvádíme). Každá karta: poznámka o doloženosti v hlavičce + foot-note.
- **04 Střediska** — 7 karet; PL bez čísla (chybí vazba `vychoziBod`).
- **05 Top cíle** — 1 poctivá věta + „Nejblíž: …" (vazby na chaty).
- **06 Zaniklé** — tmavá karta Atlasu, 2 příběhy, ghost pohlednic (P5).
- **07 Sběratelství — VITRÍNA KRKONOŠ:** fotorealistická dřevěná skříňka:
  rám s **pokosy** (diagonální gradient rohy) a **4 mosaznými šrouby**
  (radial + drážka), ořech `linear-gradient` + `feTurbulence` dřevokresba,
  **prkenná záda** (spáry 120px + tónování prken + hluboké inset stíny),
  **2 police** (hrana: světlý horní lem + tmavé čelo, vržený stín dolů
  `0 14px 20px -7px`), artefakty **stojí na policích** (transform-origin
  50% 100%, align-items:flex-end, mírné rotace ±2°) — 3 paspartované otisky
  + známka + **prázdná pasparta „razítko zatím nemáme"**, mosazný rytý
  štítek s nýtky, malované počty (16/46/11/0), skleněné odlesky (diagonální
  gradienty) + horní světlo. CTA razítkovník + „Kde razítka seženeš".
- **08 FAQ** — akordeon, odpovědi generované z dat + JSON-LD FAQPage.
- **09 Přesahy** — Podkrkonoší (modrý levý border) + „připravujeme".
- **M Mobil** — 3 rámy (hero+tiles, poster→tap+řádky, žebříček+filtr).

---

## 3) MINI-STRÁNKA STŘEDISKA (pohled „Mini-stránka střediska")
Šablona pro 7 středisek (Pec p. S., Špindl, Harrachov, Janské Lázně, Malá
Úpa; Karpacz, Szklarska Poręba — PL bez čísel):
1. breadcrumb Česko/Krkonoše/Pec pod Sněžkou + hero (název 44px, 2 věty,
   popiska „jen doložitelné údaje, žádné ceníky ani hodnocení");
2. **4 stat-tiles**: chat dostupných odtud (z vazby tras) · Sněžka lanovkou ·
   rozpětí přístupů (jen doložené trasy) · výška obce (ČÚZK);
3. **mapový pás** (2D Mapy.com placeholder, trasa středisko→Luční);
4. **01 Chaty dostupné odtud** — řádky: název/výška/km/čas/**pásové značky
   úseků** (`TrailBlaze`); vazba `vychoziBod`;
5. **02 Jak se sem dostat** — Vlak/Bus/Auto/Lanovka (fakta, ne jízdní řády);
6. **03 Odtud dál** — Sněžka, hřebenovka, sousední východiště (dashed ghost).
Mikrodetaily: stejná dvoustrana/topline; sekce 02/03 vedle sebe; „další list —
Špindlerův Mlýn →" v patičce (listování šablonou).

---

## 4) Nové komponenty (pohled „Nové komponenty" — 9 karet se stavy)
1. **Stat-tile „poctivé číslo"** — hodnota (clamp 19–26px, nowrap) + popisek +
   mikro-zdroj kurzívou; **bez zdroje se nevykresluje** (ukázán ghost stav).
2. **Žebříčkový řádek + hlavička** — pořadí/název/hodnota/›; hlavička nese
   poznámku o doloženosti; hover stav.
3. **Karta pohoří** — živá (panorama thumb, statistiky, CTA) vs.
   „připravujeme" (silueta, dashed, bez CTA).
4. **Karta střediska** — s počtem / bez čísla (PL); chybí foto → silueta.
5. **Filtr-bar** — chips (aktivní = plná červená s ×), přepínač
   **Karty (výchozí) / Řádky / Mapa**, řazení; stav v URL; poctivý prázdný
   výsledek: „Téhle kombinaci zatím nic neodpovídá — vedeme jen doložené
   profily."
6. **3D band UI overlay** — hledání, léto/zima, „Projít hřebenovku",
   preview bublina, mobilní poster CTA; vše na poloprůhledném papíru
   `rgba(255,253,247,.94)`.
7. **FAQ blok** — otevřený/zavřený stav, generováno z dat.
8. **Pás „Naposledy ověřeno"** — mini-karty se zeleným datem; silueta bez fota.
9. **Manifest pás** — 3 body + odkaz, čistá sazba.

(Neformálně vzniklé další: kartotéční lístek chaty, kalendárium pás,
pohlednice, rozcestníkové CTA, vitrína — popsané u homepage/pohoří.)

---

## Instrukce pro kodéra

### Mapování na stávající v2.2
| Prvek | Komponenta |
|---|---|
| SectionBar, StatusPill, chips, InfoBox | `ui.tsx` |
| Pásové značky (trasy, katalog) | `ui.tsx → TrailBlaze` |
| Razítka (otisky, vitrína, badge) | `RazitkoMoment.tsx` / `RazitkoSvg.tsx` + skeny `data/razitka/` |
| Razítkovník | `RazitkovnikClient.tsx` |
| 2D mapy (středisko, katalog) | `MapaTrasy.tsx` / `MapaChat.tsx` |
| 3D panorama | experiment → `src/components/Mapa3D*` (three.js dyn. import, terén JSON do `public/3d/`, poster PNG z CI) |
| Výškový profil | `VyskovyProfil.tsx` |
| Foto atribuce | `FotoAtribuce.tsx` |
| Tisk | `TiskButton.tsx` + print stylesheet |

### Data / SSG (z brainstormu F1 §6)
- **SSG JSON index chat** (slug, název, pohoří, stav, výška, služby,
  razítko/známka, `checked`) — pohání hledání, namátkou, filtry, countery.
- Oblasti: metadata (charakteristika se zdroji, nejvyšší hora {n,v,source},
  střediska, top cíle) → `data/oblasti/krkonose.yaml`.
- „Nejstarší" = extrakce roku z **prvního milníku historie** (rozhodnuto);
  chata bez milníku v žebříčku není.
- „Naposledy ověřeno" + „n× za 14 dní" = `max/count(checked)` v build kroku.
- Kalendárium = build-time výběr z milníků (`dayOfYear % n`), SSR-safe.
- Namátkou: shuffle client-side nad indexem (seed → deterministické
  „↻ jiných pět" bez hydration mismatch: první render ze seedu v props/state).

### Interakce (rekonstruovat 1:1)
- Hover tilt artefaktů: ±8°, translateY(-4px), `.35s cubic-bezier(.2,.7,.2,1)`.
- Parallax panoramatu: vrstvy `data-depth`, translate −x·d·15 / −y·d·5 px.
- Léto/zima: crossfade 0,6 s; zima nesmí snížit kontrast tras (sněhová
  paleta výše). Padající sníh jen v zimě.
- Turista: 26 s po dráze hřebenovky (SMIL v prototypu; v produkci klidně
  requestAnimationFrame/Framer podél SVG path).
- Preview bublina: fadeUp .22s; zavírání ×; „Ukázat na 3D mapě" z profilu
  = deep-link `?chata=slug`.
- Razítko settle: `settlePop` .5s při hoveru karty (re-trigger přes
  `style.animation='none'; offsetWidth; style.animation=…`).
- Konami: overlay + toast, 12 s, cleanup listeneru.
- Vše za `prefers-reduced-motion: reduce` → bez pohybu (dimenze/stíny drží).

### Tokeny (beze změn v2.2 + dřevo/mosaz)
```
--paper #fff  --cream #f7f6f0  --card #fffdf7  --line #e6e6e1  --desk #e7e2d6
--ink #384057  --muted #5e6971  --label #8a8172  --hair rgba(56,64,87,.14)
--red #e0341f  --stamp #c92f1b  --open #1e8a4f  --gone #8a949c  --alpine #2a5cb8
KČT: --tr-red #e0341f · --tr-blue #2a5cb8 · --tr-green #2e8b57 · --tr-yellow #eab308
Dřevo: světlé #a87c46→#4d3013 (police/rozcestník), ořech #6a4d2e→#3d2812 (vitrína)
Mosaz: #e6c68a→#aa7e40, rytý text #4f3812 + text-shadow 0 1px rgba(255,236,190,.55)
Panorama léto: nebe #f6efe1→#dae4e6 · hřebeny #bccbd8/#9db2c3/#84a0b5 ·
les #7e9569/#5f7a52/#6b8a4f · čepice #f4f7f9 · smrky #4f6a45
Panorama zima: #e3eaf1/#edf2f6/#e6edf1/#eff4f7 + stíny #c6d4e1/#ccd9e4/#c2d1dd ·
hřebenovka #93a2b2 · smrk #3f5a44 + sníh #fff
```
SVG filtry: `rough*` (feTurbulence .04–.05 + feDisplacementMap 2.9–4.4, různé
seedy = každý otisk jiný), `wood*` (feTurbulence .013–.016/.11–.14 + hnědá
feColorMatrix), `grain*` (feTurbulence .9, saturate 0, opacity .045–.06).

### Akceptační kritéria (z §8 + nové prvky)
Ban-scan poctivosti (žádná nedoložitelná čísla) · všechny stavy komponent
(hover, aktivní filtr, prázdný výsledek, chybějící foto→silueta, „—" hodnoty)
· 3D band: mobil poster→tap + reduced-motion definováno · zima nesnižuje
čitelnost tras · print homepage dává čistý seznam · šablony staví z tokens
bez zásahu do profilu chaty.

## Co v balíku NENÍ (další kroky)
Plné mobilní šablony · reálné three.js panorama · pohlednice-generátor (zde jen
návrh) · RSS/newsletter backend.

## Dark mode „noc na horách“ — všechny tři šablony
Homepage, pohoří (vč. střediska a komponent) i katalog mají přepínač ☀/☾
v hlavičce + tweak `rezim`. Implementace v prototypu: **CSS custom properties
přepisované na `documentElement`** (kompletní sada v sekci katalogu níže) —
v produkci totožná sada na `:root[data-theme="noc"]`. Detaily: noční světlejší
KČT odstíny (--tr-*), lampa + hvězdy nad stolem (--lamp, --stars), malované
panorama dostane soumrakový dim (`rgba(10,14,24,.26)` overlay — poster je
fyzický artefakt, nepřekresluje se), dřevo/mosaz/razítka zůstávají (fyzické
objekty), noční mapa katalogu = hvězdy + měsíc + **svítící okna chat**.

## Soubory
- `F1-Homepage.dc.html` — homepage (hero koláž, kalendárium, poster band,
  pohoří grid, namátkou, pohlednice, pásy, manifest, print, konami).
- `F1-Pohori-Krkonose.dc.html` — pohoří + středisko + 9 komponent (přepínač
  nahoře); léto/zima, parallax, turista, vitrína.
- `F1-Katalog.dc.html` — katalog /chaty (viz níže).
- `image-slot.js` — prototypový foto-slot (drag-drop).
- `screenshots/` — homepage (5), pohoří vč. zimy a vitríny (8),
  středisko + komponenty (5), katalog vč. noci a noční mapy (5).

---

## 5) KATALOG /chaty (`F1-Katalog.dc.html`) — doplněno

**Funkční prototyp** — filtry, hledání, řazení, přepínač zobrazení i den/noc
režim skutečně běží (client-side nad mock indexem 12 profilů; v produkci SSG
JSON index všech 76).

- **Hero:** breadcrumb, titulek, poctivý counter `{n} zobrazeno` + „v ukázce
  12 profilů ze 76“; žádné ceny/hvězdičky (anti-vzor ceskehory).
- **Filtr-bar** (komponenta 05 v akci): hledání · přepínač **Karty (výchozí)
  / Řádky / Mapa** · řazení abecedně / podle výšky / naposledy ověřeno ·
  chips: v provozu · zaniklá · nocleh · občerstvení · razítko · známka
  (aktivní = plná červená s ×; stavové chips OR, službové AND). Popiska:
  stav filtrů patří do URL (`?stav=…&sluzby=…`).
- **Karty** — kartotéční lístky (červená horní linka, mikro-label POHOŘÍ nad
  názvem, silueta thumb, **mini-otisk razítka** — v produkci miniatura
  reálného skenu přes `RazitkoSvg.tsx`, v prototypu procedurální náhled na
  bílé paspartě, multiply — rotace ±0.7°, hover srovná+zvedne, fadeUp při
  přefiltrování); poctivá „—“ u výšky (Lovecká) i ověření (Obří †).
- **Řádky** — tabulkový výpis z F0-03 (název+tag, výška, StatusPill,
  služby, ověřeno).
- **Mapa** — 2D placeholder (živé dlaždice `MapaChat.tsx`), markery =
  **přefiltrovaná množina**, klik → bublina s CTA.
- **Poctivý prázdný stav** — ghost kruh „?“ + „Téhle kombinaci zatím nic
  neodpovídá — vedeme jen doložené profily.“ + Zrušit filtry.
- **Kam dál** — Žebříčky pohoří (kotvy) + Atlas zaniklých.

### Dark mode „noc na horách“ (B10/v2.2 „hřebenovka po tmě“)
Přepíná tlačítko v hlavičce (☀/☾) i tweak `rezim`; v produkci CSS vars na
`:root[data-theme]`:
```
--paper #161d22  --cream #1a2228  --card #212a30  --desk #0d1215
--ink #ece6d7  --muted #a6afac  --label #b7ad99  --red #f26a4b
--line rgba(255,255,255,.10)  --hair rgba(255,255,255,.13)  --gone #7a848c
--lamp radial-gradient(130% 90% at 30% -5%, rgba(255,206,140,.14), transparent 62%)
--stars 4× radial-gradient tečky nad stolem (jemné, jen v noci)
noční KČT trasy (světlejší pro kontrast): --tr-red #ff7b60 · --tr-blue #7da2ee
· --tr-green #5fc98e · --tr-yellow #f2c94c
```
**Noční mapa — wow moment:** tmavě modrá obloha (#141b2b→#1a2536),
**bliktající hvězdy** (keyframe `twinkle`), **měsíční srpek** (2 kruhy),
domečky ztmavnou (#3a4552) a **okna se rozsvítí teple žlutě** (#ffd27a +
drop-shadow záře) — zaniklé chaty zůstávají šedé a nesvítí (poctivost
i v atmosféře). Lampa + hvězdy na stole (`--lamp`, `--stars`).

### Stav & data
`q, chips{}, sort, view, sel, rezimOverride`; filtrování/řazení čisté funkce
nad indexem — přenést 1:1 (včetně `localeCompare(cs)` a parsování dat
ověření). Mock index má pole: slug, název, výška (číslo|null), stav,
checked, razítko/známka/nocleh/občerstvení (bool), tag, x/y (mapa).
