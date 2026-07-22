# 02 — Inventář aktiv, komponent a v2.2 tokenů

**Účel:** koncept (design-koncept-v2 §9.2) říká: *„Design session potřebuje
SKUTEČNÉ objekty, ne lorem."* Tady je poctivý soupis, **co reálně máme** a **co je
zatím jen placeholder** — aby se nenavrhovalo kolem neexistujících assetů.

## 1. Tři sběratelské faux-3D objekty — stav podkladů

Tohle je nejdůležitější tabulka celého kitu. Faux-3D hrdinné prvky stojí na
reálných podkladech — a ty jsou pro každý objekt v JINÉM stavu:

| Objekt | Podklad reálně? | Kolik | Zdroj / svolení | Pro design |
|---|---|---|---|---|
| **Razítko** | ✅ **ANO** | **46 otisků / 16 chat** | razitkuj.cz, **písemné svolení** Robert Šindler (KiBob), 21. 7. 2026 | Navrhovat faux-3D otisk z **reálných skenů** — hned. |
| **Turistická známka** | ⛔ jen číslo+odkaz | 11 chat | turisticke-znamky.cz / znaczki-turystyczne.pl | Obrázek = **autorské dílo vydavatele**, čeká na svolení (Michal oslovil 22. 7.). **Faux-3D dřevěné kolečko navrhovat z PLACEHOLDERU.** |
| **Turistická vizitka** | ⛔ jen číslo+odkaz | 10 chat | wander-book.com | Totéž — čeká na svolení Wander Book. **Placeholder kartička.** |

**Důsledek pro session:** razítko lze doladit do finále z reálných dat; známka a
vizitka se navrhují jako **prázdné/ghost sloty + placeholderová geometrie**, a až
dorazí svolení, jen se vymění textura/artwork. Návrh na to musí být připravený
(slot přijme reálný artwork bez přepisu layoutu).

### Razítko — detail otisků (data/razitka/skeny/)

46 otisků, GIF, metadata v `_otisky.json` (slug, id, zdrojUrl, obrazekUrl). Počty
na chatu: Luční 6 · chata-dvoracky 5 · Labská 3 · Špindlerova 3 · lesní 3 · Vosecká
4 · schr. pod Labskim 4 · tetřeví 4 · dom-slaski 2 · Odrodzenie 2 · Samotnia 2 ·
przełęcz Okraj 2 · strzecha 2 · bílé Labe 1 · Kamieńczyk 1 · Szrenica 1.

Navíc **1 „master" otisk** ve vysoké kvalitě: `data/razitka/krkonose/lucni-bouda-1410.png`
(+ `lucni-bouda.yaml` s modelem). Existuje i live komponenta `RazitkoMoment.tsx`
(dopad + rozpití) a `RazitkoSvg.tsx` — **zárodek faux-3D už běží** (viz §3).

Více otisků na chatu = přímo materiál pro koncept „**každý otisk trochu jiný**,
slabý duch druhého otisku" (design-koncept §2). Varianty (současné/historické)
jsou reálně po ruce.

## 2. Fotky chat — hero podklady

- **Zdroj:** Wikimedia Commons (DATA-02, licenční síto), stažení `stahnoutZ`.
- **Máme hero** u **16 z 23** chat (CC BY-SA 3.0/4.0, autor + `zdrojUrl` + licence
  doloženy). **Chybí u 7** — vč. Lovecké chaty a Špindlerovy boudy (bez
  jednoznačného záběru budovy), dále chata-u-jirky, nova-klinovka, tetřeví,
  Szrenica, przełęcz Okraj → placeholder.
- **Stav licencí:** všechny `verified:false` — licenci má očima potvrdit redakce
  (Michal), pak `verified:true`. Design „muzejní popiska u fotky" (`FotoAtribuce.tsx`
  komponenta už existuje) = přímo nosič atribuce autor/licence/zdroj.
- ⚠️ **Sandbox nestáhne** fotky (upload.wikimedia.org 403 přes proxy) — hero se
  plní v GitHub Actions / lokálně. Pro vizuální prototyp v session buď spustit seed
  mimo sandbox, nebo použít lokální placeholder + reálnou atribuci.
- **Polaroid rámeček** (koncept §3) je čistě CSS vrstva NAD touto fotkou — nevyžaduje
  nový asset.

## 3. Dobové pohlednice — ZATÍM NEMÁME

Koncept na nich staví „tehdy/dnes" slider a líc/rub pohlednice (§3, §11). **Reálně
0 dobových pohlednic** (autorská práva / archivy — řeší se zvlášť, jako fotky).
→ **Slider a rub pohlednice se navrhují z placeholderů**; zaniklá stránka (Obří
bouda) je na nich obzvlášť závislá. Poctivě: tohle je největší „prázdné místo"
sběratelské estetiky.

## 4. Odznaky / smaltované placky (koncept §6)

Koncept „sběratelského pasu" počítá s odznaky (pohoří, „nad 1000 m"). **Datově
zatím neexistují** — jsou to odvozená ocenění (z výšky/pohoří/počtu sebraných).
Design je může navrhnout jako **procedurální faux-3D** (nevyžaduje asset), logika
udělení = Fáze 4 (účty). Pro session: navrhnout vzhled, ne řešit backend.

## 5. Znovupoužitelné komponenty (co design NEkreslí od nuly)

Živý systém v2.2 už tyto prvky má (`src/components/`, `src/app/(frontend)/`):

| Komponenta | Co dělá | Role v konceptu |
|---|---|---|
| `RazitkoMoment.tsx` + `RazitkoSvg.tsx` | otisk razítka (dopad, rozpití, SVG) | **zárodek faux-3D razítka** (§2) |
| `RazitkovnikClient.tsx` | sběratelský režim razítek | základ „Sbírky" / pasu (§6, §11) |
| `MapaTrasy.tsx` | Leaflet nad turistickou mapou Mapy.com, čáry tras + značky | „mapa jako schéma" (§4, sekce 8/14) |
| `MapaChat.tsx` | přehledová mapa chat | katalog / mapa |
| `VyskovyProfil.tsx` | area-chart výškového profilu | „švýcarská infografika" (§4) |
| `ui.tsx` → `TrailBlaze` | **pásové značky KČT 1:1** | **podpisový grafický motiv** (§4) |
| `ui.tsx` → `SectionBar` | číslované sekční lišty (01/02…, varianty red/night) | „tabové předěly zápisníku" (§7) |
| `ui.tsx` → `StatusPill` | open / closed / **gone** | stavy provozu + zaniklá |
| `ui.tsx` → `Chip`, `HutRow`, `InfoBox`, `Button` | katalogové prvky | katalog, marginálie |
| `HutCard.tsx` | karta chaty (fakta, stav) | katalog / sousedé |
| `FotoAtribuce.tsx` | popiska autor/licence/zdroj | **„muzejní popiska"** (§3) |
| `TiskButton.tsx` | tisk profilu | zárodek **print stylesheetu** (§8) |
| `TabBar.tsx`, `SiteHeader/Footer` | navigace | shell |

**Existující stránky:** `/` katalog · `/chaty` · `/[zeme]/[oblast]` · profil chaty ·
`/razitkovnik` (sbírka razítek) · `/zanikle` (atlas) · `/vylety` · `/design`
(styleguide, neindexováno) · `sitemap.ts` + `llms.txt` + `robots.txt`.

## 6. Design tokeny v2.2 (baseline — design v2 z nich VYCHÁZÍ, neresetuje je)

Z `src/app/(frontend)/tokens.css` (+ `profil.css`, `components.css`,
`razitkovnik.css`):

```
Papír/plochy:  --paper #ffffff · --cream #f7f6f0 · --line #e6e6e1 · --night #12181d
Text:          --ink #384057 · --muted #5e6971
Akcenty:       --red #e0341f (KČT červená, topline) · --blue #1b6e9e
Stavy:         --open #1e8a4f · --gone #8a949c · --stamp #c92f1b
Příroda:       --alpine #61ba13
KČT značky:    --tr-red #e0341f · --tr-blue #2a5cb8 · --tr-green #2e8b57 · --tr-yellow #eab308 · --tr-black #1a1a1a
Písmo:         --font-display 'Space Grotesk'/'Inter' · --font-body 'Inter'
Tvar:          --radius 12px · --grid 8px · --topline 5px red · --shadow-float (0 16px 48px…)
```

**Co z toho design v2 dědí** (rozhodnutí konceptu): barva ukázněně v plochách (ne
rámečky) · KČT červená jako signatura · mřížka 8px · pásové značky jako motiv.

**Co je OTEVŘENÉ k rozhodnutí v session** (viz doc 03): přidat **krémový papír jako
substrát** (máme `--cream`, zesílit do „zápisníku") · **serif pro názvy/historii**
vs. grotesk-only (v2.2) · **rukopisný řez** jen pro popisky polaroidů/marginálie ·
**dark mode „za tmy"** (máme `--night`, ale ne jako lampové světlo na papíru).

## 7. Poctivá bilance „reálné vs. placeholder"

| Vrstva | Reálné dnes | Placeholder do... |
|---|---|---|
| Razítko (faux-3D) | ✅ 46 otisků / 16 chat, se svolením | — hotovo |
| Známka (faux-3D) | ⛔ číslo+odkaz | svolení Turistické známky s.r.o. |
| Vizitka (faux-3D) | ⛔ číslo+odkaz | svolení Wander Book |
| Hero fotky | ✅ 16/23 (Wikimedia, verified:false) | redakční kontrola licencí; 7 chat bez fotky |
| Dobové pohlednice | ⛔ 0 | práva / archivy (zvlášť) |
| Odznaky | ⛔ 0 (procedurální) | Fáze 4 logika |
| Osobní vrstva (razítka ve sbírce, poznámky) | ⛔ | Fáze 4 (účty) |
| Data profilu (16 sekcí) | ✅ 23 chat + 17 zaniklých, verified:false | DATA-04 → verified:true |

**Vzkaz pro session:** navrhuj tak, aby **sloty přijaly reálný artwork bez přepisu
layoutu** (známka/vizitka/pohlednice dorazí později). Razítko a fotky můžeš řešit
do finále hned.
