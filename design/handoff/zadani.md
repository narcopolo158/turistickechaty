# Turistické chaty — zadání design session (Claude Design)

**Projekt:** turistickechaty.cz — průvodce všemi horskými chatami: profily s ověřenými daty, mapa, výlety, historie s dobovými pohlednicemi a katalog turistických razítek. Start: Krkonoše, poté celé Česko a Slovensko, časem Alpy.
**Estetický cíl:** moderní knižní turistický průvodce. Čtyři kvality zároveň: **serióznost reference · dokonalá přehlednost · hravost sběratelství · atmosféra hor**.

## Úkol

Doladit design systém **„Moderní průvodce" v2.1** do finální podoby. Nejde o nový směr — jde o fúzi tří ověřených vstupů a obohacení o wow prvky. Vše potřebné je v kartách tohoto projektu; kompletní historie (Session 01 A/B, Session 02, v2.1) je v přiloženém ZIPu.

## Fúze — co odkud vzít

- **Session 01 / směr A („Moderní outdoor")** → velkorysá fotografická hero plocha, energie velkých čísel, vzduch mezi bloky, měkké stíny plovoucích prvků.
- **Session 01 / směr B („Datová čistota")** → hairline tabulky, štítky kapitálkami (souřadnice, časy, OVĚŘENO), tabulková čísla, hustota katalogu bez šumu.
- **v2.1 (závazný základ)** → bílá + krém #F7F6F0; sytá červená #E0341F a modrá #2A5CB8 **výhradně v plochách** — sekční lišty, tlačítka, aktivní stavy, zvýrazněná slova — **nikdy v rámečcích dlaždic**; tenká červená linka na horní hraně („hřbet průvodce"); pásové značky; výškové profily; razítko #C92F1B.

## Tvrdá pravidla (neměnit)

1. **Role barev:** červená = akce a sběratelská vrstva · modrá = navigace, odkazy, datové lišty · zelená = pouze stav „otevřeno" a příroda · žlutá = pouze pásové značky. Barva se nikdy nepoužívá jako obrys nebo rámeček bílé karty.
2. **Typografie:** pouze dvě rodiny — **Space Grotesk 700** (titulky, čísla, značka) a **Inter 400–600** (text, UI, popisky). Štítky a metadata jako Inter 600 kapitálky s prostrkáním .06–.1em. **Žádný monospace** — směr je moderní, čistý a elegantní, ne technický. Vždy s latin-ext, tabulková čísla u dat (`font-feature-settings: "tnum"`).
3. **Komponentní DNA:** pásové značky 1:1 s terénním značením; razítko vždy cihlové a mírně natočené — jediný záměrně „nedisciplinovaný" prvek; údaj „ověřeno + datum" je viditelnou součástí datových bloků; radius 12 px, mřížka 8 pt, stíny jen pod plovoucími prvky.
4. **Tón:** čistý moderní turistický look. Nostalgie žije v obsahu (pohlednice, razítka, příběhy), nikdy ve vintage stylizaci rozhraní. Nepřeplácat.

## Prostor pro wow (tady experimentuj)

1. **Razítkovací moment** — animace otisknutí při „Přidat do deníku": dopad, mikro-rozpití, natočení; stav „ve sbírce". Tohle je emoční srdce webu.
2. **Hero profilu chaty** — kompozice fotky, gradientu a typografie; varianta s mini-mapou; chování při skrolu.
3. **Interaktivní výškový profil** — hover s km a výškou, provázání s trasou na mapě.
4. **Odznaky pohoří** — vizuální jazyk odznaků za kompletní sbírku regionu (moderní, žádný skautský kýč).
5. **Tehdy/dnes** — rám a ovladač porovnání dobové pohlednice s dneškem.
6. **Prázdné a systémové stavy** — 404, prázdný deník, „razítko chybí, doložíš ho?" — mluví razítkovou řečí.
7. **Mikrointerakce** — hover karet a mapových markerů, načítání (vrstevnice?).
8. **Volitelně:** tmavý režim „hřebenovka po tmě" — jen pokud udrží čistotu systému.

## Inventář k pokrytí

**Základy:** barvy · typografie · mřížka, radius, stíny · ikonografie (lineární, tah 1.8 px).
**Komponenty:** navigace s horní linkou · tlačítka (červené/modré/ghost/odkaz) · sekční lišty · řádek faktů (hairline) · tabulka tras se značkami · výškový profil · chips (sousedé, filtry) · infoboxy (plná výplň, bez rámečků) · stavové odznaky · karta razítka + historické varianty · karta chaty · mapové markery (v provozu / zaniklá / vybraná) · vyhledávání · formulář „nahlásit změnu".
**Obrazovky:** profil chaty · úvod („obálka průvodce") · stránka pohoří · razítkovník.

## Kritéria kvality

- **Test tří sekund:** úvod musí okamžitě říct „definitivní moderní průvodce horskými chatami".
- Data čitelná jako jízdní řád, atmosféra jako v dobrém průvodci, hravost výhradně v razítkové vrstvě.
- Vše funguje na bílé i krému; mobil je první třída, ne dodatek.
- Výstup: karty komponent převoditelné do kódu (tokens + HTML/CSS vzory) — budou synchronizovány zpět do repozitáře.

## Podklady v projektu

`tokens.css` (v2.2, závazný výchozí bod) · `fonts/` (self-hosted Space Grotesk + Inter, SIL OFL) · karty Základy / Komponenty / Obrazovky (aktuální stav v2.1) · toto zadání. Kompletní design sessions 01, 02 a v2.1 + klikatelný prototyp jsou v ZIP balíčku u Michala.
