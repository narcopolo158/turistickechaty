# Design session kit — „Sběratelský zápisník" (v2)

**Jedno místo, které design session otevře a má vše po ruce.** Sekvence, na které
jsme se shodli (Michal 22. 7.): *nejdřív naplnit daty a zamknout strukturu → teprve
pak design session.* **Ta část je hotová** — tenhle kit je ten přechod.

> **Cíl jednou větou:** „mokrý sen turisty a sběratele" — web jako **dokonale
> graficky zpracovaný památníček** precizního grafika: styl moderních německých /
> švýcarských tištěných průvodců, ale s „nalepenými" polaroidy a pohlednicemi a se
> sběratelskými objekty (razítko, známka, vizitka) jako **faux-3D**.
>
> **Tagline / metafora:** *„Každá chata má svůj list. Každá návštěva zanechá stopu."*

---

## Co je hotové (vstupy pro session)

1. ✅ **Informační architektura profilu zamčená** — `../profil-chaty-model.md`
   (16 sekcí, dvoustrana, minimální profil, stavy ověření, volatilita).
2. ✅ **Data naplněná** — 23 chat + 17 zaniklých, každý údaj se zdrojem, DATA-06…12.
   Poslední vrstva (DATA-12) vetkla ověřitelnou barvu do 7 vlajkových profilů.
3. ✅ **Reálné artefakty zmapované** — 46 razítkových otisků (se svolením), 16 hero
   fotek (ze 23); známky/vizitky jako číslo+odkaz (obrázky čekají na svolení).
4. ✅ **Vize + moodboard + rozhodnutí sepsané** — tento kit.

## Obsah kitu

| Soubor | Co v něm je |
|---|---|
| **README.md** (tento) | vstup, zamčená rozhodnutí, jak session začít |
| **01-datovy-snapshot-validacni-profily.md** | reálný obsah 5 profilů po sekcích + stavy k navržení |
| **02-inventar-aktiv-a-komponent.md** | co je reálné vs. placeholder; komponenty; v2.2 tokeny |
| **03-moodboard-a-rozhodnuti.md** | moodboard spec + decision log (14 rozhodnutí s defaulty) |

**Zdrojové dokumenty** (delší, tento kit z nich vychází):
- `../design-koncept-v2-sberatelsky-zapisnik.md` — plná vize / moodboard / rizika.
- `../profil-chaty-model.md` — kanonická struktura profilu (16 sekcí).

---

## Zamčená rozhodnutí (nekřísit na session, jen z nich stavět)

Tohle už rozhodl Michal — design nad tím kreslí, neotvírá to znovu:

1. **Profil = dvoustrana.** Desktop: levá = emoce/identita, pravá = tvrdá data.
   Mobil = kapitoly (pocit zápisníku zůstává).
2. **Veřejný katalog ≠ osobní zápisník.** Veřejná vrstva čistá/skenovatelná;
   dekorace a artefakty rostou v **osobní** (přihlášené) vrstvě. Profil musí být
   plnohodnotný **i bez přihlášení**.
3. **Filtr I/A/V.** Každý prvek je Informace / Artefakt / Vzpomínka — jinak na
   stránce nemá co dělat. **Faux-3D jen pro Artefakty.**
4. **Přijaté zdroje.** Kudy z nudy, Seznam Zprávy i další sekundární média jsou OK
   jako `verified:false` s citací; primární ověření (→ `verified:true`) je DATA-04.
5. **Restraint.** Chladná švýcarská přesnost nese důvěru (USP „ověřená data");
   hmatatelnost (faux-3D, „nalepení") jen pro artefakty a hero. Scrapbook nesmí
   zaplavit funkční data.
6. **Rukopisný font** jen popisky polaroidů / osobní marginálie — nikdy navigace
   ani hlavní obsah.

## Jeden fakt, který řídí všechno ostatní

**Dnes je 100 % údajů `verified:false`.** „Ověřeno redakcí" nemáme ani jednou.
→ Design **nesmí** předpokládat zelené fajfky. Nejdůležitější jednotlivý úkol
estetiky: **udělat ze stavu „převzato ze zdroje" něco elegantního, ne varovného**
(decision B5). Právě tady se „ověřená data stávají krásou" — citace = muzejní
popiska, ne patička.

## Validační sada (design se ověří na 5 reálných, ne na lorem)

Detaily v doc 01. Pět profilů schválně rozbíjí každý předpoklad:

| Profil | Role | Klíčový stav k navržení |
|---|---|---|
| **Luční bouda** | maximální | 10 milníků, 3 artefakty (vč. **vyřazené vizitky**) — hustota bez chaosu |
| **Vosecká bouda** | střední/sezónní | **rozpor 42/43**, **hedge fotovoltaika**, historické názvy |
| **Schronisko Samotnia** | přeshraniční PL | **dynamické varování** (změna nájemce), PL+CZ sběratelské systémy |
| **Obří bouda** | zaniklá | jen historie, **žádný provoz**, závislá na (chybějících) pohlednicích |
| **Lovecká chata** | minimální | **bez hera i bez výšky** — důstojný placeholder, prázdné sekce |

## Realita artefaktů (jedním řádkem)

**Razítko** ✅ reálné (46 otisků, se svolením) → do finále. **Známka + vizitka** ⛔
jen číslo+odkaz → faux-3D z **placeholderu**, artwork po svolení. **Dobové
pohlednice** ⛔ zatím žádné → slider „tehdy/dnes" z placeholderu. → **Navrhuj sloty,
které přijmou reálný artwork bez přepisu layoutu.**

---

## Jak session začít (návrh prvních kroků)

1. **Spike + měření (B12):** ověřit, že SVG-filter faux-3D + parallax je na mobilu
   únosné (LCP/paint). Bez tohohle se nekreslí zbytek — technika musí sednout.
2. **Potvrdit řídící principy** (B2 vrstvy, B3 restraint, B5 stav ověření).
3. **Typo A/B (B1):** serif pro názvy/historii vs. grotesk-only — na Luční + Lovecké.
4. **Dvoustrana (B4)** na Luční (nejhustší) a Lovecké (nejřidší), pak Samotnia + Obří.
5. **Sběratelské objekty** z reálného razítka + placeholder známka/vizitka.

Kompletní decision log (14 položek s doporučeními) je v doc 03, část B.

## Co ještě chybí (poctivě — mimo design)

- **Svolení k obrázkům známek/vizitek** (Michal oslovil firmy 22. 7.) — do té doby
  placeholder.
- **Dobové pohlednice** (autorská práva / archivy) — největší prázdné místo
  sběratelské estetiky; zaniklá stránka je na nich závislá.
- **`verified:true`** — primární ověřování faktů (DATA-04); teprve to rozsvítí stav
  „ověřeno redakcí", který design navrhne.
- **Fáze 4 (účty)** — osobní zápisník, sbírka, odznaky: design navrhne jako
  ghost/náhled, plná funkce s přihlášením.
