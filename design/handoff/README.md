# Handoff: turistickechaty.cz — design systém „Moderní průvodce" v2.2 + klikací prototyp

## Přehled
Kompletní design systém a hi-fi klikací prototyp webu turistickechaty.cz — průvodce horskými chatami (profily s ověřenými daty, mapa, výlety, historie, katalog razítek). Estetika: moderní knižní turistický průvodce — serióznost reference · přehlednost · hravost sběratelství · atmosféra hor.

## O souborech v balíku
Soubory jsou **designové reference v HTML** — prototypy ukazující zamýšlený vzhled a chování, **ne produkční kód ke zkopírování**. Úkol kodéra: **znovu postavit tyto návrhy v cílovém prostředí** dle projektového plánu — Next.js (App Router) + TypeScript + Payload CMS, mapa Leaflet/MapLibre s dlaždicemi Mapy.com „outdoor". CSS zdroj pravdy je `tokens.css` (custom properties) — přenést 1:1, ideálně jako CSS vars + Tailwind theme mapping.

## Fidelity
**Hi-fi.** Barvy, typografie, rozměry, stavy i animace jsou finální — implementovat pixel-perfect. Fotografie jsou placeholder/drop zóny (`image-slot.js` je jen prototypová utilita — v produkci nahradit reálnou správou médií z Payload).

## Soubory
- `prototyp.html` — klikací prototyp, **primární reference** (5 obrazovek + všechny interakce, mobilní breakpoint, dark mode, print)
- `tokens.css` — design tokeny v2.2 (závazné)
- `fonts/` — self-hosted Space Grotesk + Inter (woff2, SIL OFL, latin + latin-ext) + `fonts.css` s @font-face
- `foundations/` — barvy a role, typografie, ikonografie (karty)
- `components/` — tlačítka/chips/stavy, lišty a infoboxy, značky/profil/razítko, navigace/vyhledávání/formulář, karta chaty + markery, razítkovací moment, tehdy/dnes + odznaky
- `screens/` — úvod, profil, pohoří, razítkovník (statické referenční obrazovky)
- `zadani.md` — původní zadání s tvrdými pravidly

## Design tokeny (tokens.css)
Plochy: `--paper #FFFFFF` · `--cream #F7F6F0` · `--ink #384057` (text) · `--muted #5E6971` · `--line #E6E6E1` · `--night #12181D`
Značka: `--red #E0341F` (deep `#B82413`, soft `#FDEEEA`) · `--blue #1B6E9E` (deep `#124D6E`, soft `#E7F1F6`)
Sémantika: `--open #1E8A4F` · `--gone #8A949C` · `--stamp #C92F1B` · `--alpine #61BA13` (deep/text `#4C930E`, soft `#EFF8E3`)
Pásové značky (terénní, neměnit): `--tr-red #E0341F` · `--tr-blue #2A5CB8` · `--tr-green #2E8B57` · `--tr-yellow #EAB308`
Geometrie: radius **12 px** · mřížka **8 pt** · topline `5px solid var(--red)` · stín `0 16px 48px -26px rgba(18,24,29,.3)` **jen pod plovoucími prvky**

### Tvrdá pravidla (neporušovat)
1. **Role barev:** červená = akce a sběratelská vrstva · modrá = navigace, odkazy, datové lišty, mapa · zelená #1E8A4F = pouze stav „otevřeno" · alpská zelená #61BA13 = příroda a výlety (plochy štítků/kickery, NIKDY CTA; jako text vždy tmavší #4C930E) · žlutá = pouze pásové značky. **Barva nikdy jako obrys/rámeček bílé dlaždice** — vždy plná plocha nebo text.
2. **Typografie:** Space Grotesk 500–700 (titulky, čísla, značka) · Inter 400–700 (text, UI) · štítky/metadata = Inter 600 kapitálky, letter-spacing .05–.14em, `font-variant-numeric: tabular-nums` u všech dat. Žádný monospace. Vždy latin-ext.
3. **Komponentní DNA:** pásové značky 1:1 s terénním značením (bílá-barva-bílá, 33 % pásy) · razítko vždy #C92F1B a natočené −8° až +8° — jediný „nedisciplinovaný" prvek · „ověřeno + datum" viditelnou součástí datových bloků · dlaždice bílé s 1px linkou #E6E6E1.
4. **Tón:** nostalgie žije v obsahu (pohlednice, razítka), nikdy ve vintage stylizaci UI.

## Obrazovky (prototyp.html — `data-screen-label` na sekcích)

### 1. Úvod
Hero na krému: kicker s mini pásovou značkou → H1 Space Grotesk 700 46px/-0.02em (max 2 barevné akcenty) → perex → vyhledávání (plovoucí, stín, CTA červené) → 4 statistiky (hairline dělítka, jen jedna červená). Mapový pás (bílá dlaždice) s markery: modré ○ 8px = v provozu, červený ○ 11px = vybraná; hover = plovoucí preview karta (název · výška · stav · Profil →). Sekce 01: 3 karty chat (hover: translateY(-2px) + stín). Sekce 02 „Výlet týdne": karta 1fr/1.4fr, zelený kicker.

### 2. Chaty (katalog pohoří)
Breadcrumb → H1 → filtr chips (aktivní = plná červená) → modrá sekční lišta → hairline tabulka (grid 1.8fr .55fr .6fr .85fr .5fr): název+podtrasa / výška / lůžka / stavová pilulka / odkaz. Zaniklé chaty plnohodnotné řádky (šedá pilulka „Zaniklá · rok"). Infobox alpine (plná výplň, bez rámečku).

### 3. Profil chaty (nejdůležitější)
- **Sticky mini-nav**: pilulka pod hlavičkou (top:62px, blur backdrop), kotvy 01–04, smooth scroll s offsetem ~120px.
- **Hero foto** 300px, radius 14, gradient overlay 40→74 % ink; v něm breadcrumb+GPS (kapitálky), H2 38px, badge pilulky (stav „otevřeno" plná zelená); **počasí** vpravo nahoře (rgba(18,24,29,.72), blur): teplota SG 15px + vítr/dohlednost + zdroj ČHMÚ.
- **Řádek faktů**: 5 sloupců s hairline dělítky — Výška / Otevřeno / Nocleh / **Ověřeno (datum + kdo!)** / **Webkamera** (pulzující červená tečka „Živě", animace box-shadow 1.6s). Mobil: horizontální scroll-snap pás, buňky 46 %.
- **Trasy**: modrá lišta → tabulka s časem, převýšením, pásovou značkou a GPX odkazem.
- **Interaktivní výškový profil**: SVG křivka (modrá 2px, výplň soft blue), mousemove → binární vyhledání bodu na path, červený bod + tooltip „km · m n. m." (tmavá pilulka).
- **Razítko** (červená lišta): razítko SVG rotate(-7°), CTA „＋ Razítko do deníku" → animace otisku: scale 2.1→0.94→1.03→1, rotate → −7°, blur 2px→0, 550 ms, cubic-bezier(.2,1.4,.35,1), rozpití = SVG feTurbulence+feDisplacementMap; po dopadu tlačítko → ghost „✓ Ve sbírce · datum", counter deníku +1 (persist localStorage).
- **Sousedé + plánovač**: chips s časy; klik přidává etapu do „Moje hřebenovka" se součtem chůze; Vymazat.
- **Tehdy/dnes**: slider (input range přes celou plochu, cursor ew-resize), pravá vrstva clip-path inset(0 0 0 var(--x)), bílá dělicí linka 2px + kruhový úchyt 32px se stínem, mono-štítky roků v rozích.
- **OG náhled**: karta 380px generovaná z dat (doména · název+výška · stav) — v produkci generovat skutečné OG obrazy.
- Tlačítka: Rezervovat (modré) · Nahlásit změnu (ghost) · **Tisk** (ghost, window.print; print CSS skryje chrome a přidá patičku s URL + datem ověření).

### 4. Výlety
Zelený kicker, seznam výletů (grid 110px/1fr/auto): thumbnail, název + metadata (KM · ČAS · PŘEVÝŠENÍ · N RAZÍTEK červeně), štítek typu (alpine soft). Infobox alpine.

### 5. Razítkovník
Hero s velkým skóre (SG 36–38px červeně, X/28) → progress bar (červená, transition width .5s) → červená lišta → grid 5 slotů (mobil 2): sbírková razítka (různé tvary, rotace −8° až +8°, datum) vs. chybějící (šedý přerušovaný obrys #8A949C, „?", hint nejbližší cesty). Odznak pohoří: kruh, silueta hřebene, progres po obvodu (stroke-dasharray), skóre tabulkově — žádné stuhy. Infobox „Výzva" pro komunitní sběr.

## Globální chování
- **Topline**: 5px červená na horní hraně každé stránky („hřbet průvodce").
- **Pozadí**: krém + vrstevnicový SVG pattern (stroke #EFEDE3, 1.2px, 900×620 tile) — velmi subtilní. Dark: stroke #1C2733.
- **Loading skeleton**: overlay s vrstevnicemi, stroke-dashoffset animace „dokreslení" 1.1s (stagger 120ms), fade out po load.
- **Přepínání obrazovek**: fade+posun 6px, 280ms; stav v URL hash.
- **Dark mode „hřebenovka po tmě"**: toggle ◐, persist; povrchy #171F27/#1B242E, linky #242F39/#2A3541, text #E7ECF1, odkazy #6FB1D8; barvy značky beze změny.
- **Mobil <760px**: horní nav skrytá, **spodní tab-bar** (Úvod · Chaty · Výlety · Deník s badge), padding-bottom 72px, safe-area-inset; mřížky do 1 sloupce; hit targety ≥44px.
- **A11y**: `:focus-visible` outline 2px modrá; stavy nikdy jen barvou (vždy text); aria-label na range/inputech.
- Odkazy: `a{color:#1B6E9E}`, hover `#124D6E`. Žádný scrollIntoView — scrollTo s offsetem.

## State management (produkce)
- Deník/sbírka: server-side per user (fáze 4), prototyp má localStorage (`tc-proto-lucni`, `tc-proto-dark`).
- Plánovač: pole etap {chata, čas}, součet minut; v produkci nad grafem sousedství z DB.
- Filtry katalogu: URL query parametry (sdílitelné).

## Assets
- Fonty: Google Fonts self-host (SIL OFL, licence přiložena) — Inter 400/500/600/700, Space Grotesk 500/600/700, latin + latin-ext.
- Ikony: vlastní SVG dle `foundations/ikonografie.html` — vycházejí z kartografických značek KČT/VKÚ, tah 1.8px, kulatá zakončení, mřížka 24px, jednobarevné.
- Fotografie: v prototypu drop zóny — v produkci Wikimedia Commons / chataři / vlastní (viz projektový plán, kap. 7); dodržet atribuce.
- Razítka: SVG s textPath — v produkci skeny/otisky z DB (entita Razítko).
- Mapa: dlaždice Mapy.com „outdoor" + povinná atribuce s logem.

## Pořadí implementace (doporučení)
1. tokens.css + fonty + globální layout (topline, vrstevnice, nav, footer, dark mode)
2. Komponenty: lišty, tlačítka, chips, pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty
3. Profil chaty (šablona nad Payload daty, JSON-LD, OG generování)
4. Katalog + mapa (Leaflet + Mapy.com, markery + hover preview)
5. Razítkovník + razítkovací animace + deník (lokálně, účty později)
6. Výlety, tisk profilu, skeleton, mobilní tab-bar
