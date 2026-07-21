# CLAUDE.md — turistickechaty.cz

Průvodce všemi horskými chatami: profily s ověřenými daty, mapa, výlety, historie, katalog razítek. Pilot: Krkonoše → ČR → SK → Alpy. Obsah česky.

## Stack a reference
- Next.js (App Router) + TypeScript + Payload CMS + PostgreSQL. Mapa: Leaflet/MapLibre + dlaždice Mapy.com „outdoor" (API klíč v env, nikdy v repu).
- **Závazný design:** `design/tokens.css` (custom properties přenést 1:1) a `design/handoff/` — `prototyp.html` je primární vizuální reference (pixel-perfect), `README.md` handoffu popisuje chování a pořadí implementace.
- Projektový plán: `docs/plan.md`. Datový model: kap. 5 plánu.

## Pravidla pro denní 30min session
1. `git pull` → přečti `docs/BACKLOG.md` a posledních ~5 zápisů v `docs/DENIK.md`.
2. Vezmi **nejvyšší nehotovou položku** backlogu (pořadí určuje Michal — neměň ho, jen odškrtávej `[x]`). Když je položka blokovaná (chybí klíč, rozhodnutí), zapiš to k ní, přeskoč na další a polož otázku v deníku.
3. Pracuj v rozsahu ~30 minut: raději menší hotový krok než rozdělaný velký. Vždy `commit + push` (konvence: `feat:`, `data:`, `fix:`, `docs:` — česky).
4. Na konci: zápis do `docs/DENIK.md` (datum, co je hotovo, co dál, otázky) + krátké shrnutí Michalovi.

## Pravidla pro data o chatách
- Každý údaj má `source:` (URL/„telefonát"/kniha) a `verified: true|false` + `checked: YYYY-MM-DD`. **Nikdy nedomýšlet fakta** — co není doloženo, je `verified: false` nebo se nezapisuje.
- **Význam `verified: true` (rozhodnutí Michala 21. 7. 2026, „konvence B"):** `true` jen tehdy, když údaj **ověřil sám Michal** vlastní kontrolou (telefonát, návštěva, přímá znalost). Data převzatá z webu, OSM, katalogů apod. zůstávají **`verified: false`** — mají jen `source`. „Ověřeno" na webu tedy znamená, že to potvrdil člověk, ne že je to jen citované z internetu.
- **Zajímavosti a „nej" (rozhodnutí Michala 21. 7. 2026):** při zjišťování dat o chatě rovnou zaznamenávej pozoruhodnosti a rekordy do pole `zajimavosti` (`text`, volitelně `kategorie`: stari/vyska/velikost/gastro/jine, a `zdroj`) — poslouží pro budoucí žebříčky „nej" (nejstarší, nejvýše položená, největší…) i highlight na profilu. Superlativ je tvrzení → **uveď zdroj, nedomýšlet** (často to bude claim provozovatele — tak to i napiš). Spočitatelné „nej" (dle `rokVzniku`/`vyska`/`kapacita`) sem psát nemusíš, vezmou se z polí.
- Datové soubory: `data/chaty/<pohori>/<slug>.yaml` (než poběží Payload, pak migrace).
- Fotky jen s licencí (Wikimedia Commons CC BY/BY-SA, od chatařů se svolením) — u každé autor, licence, zdrojové URL. Žádné fotky z Google Maps / Mapy.com.

## Bezpečnost a hygiena
- Žádné tokeny, hesla ani API klíče do repa (jen `.env.example`).
- Neměnit `docs/plan.md` bez zadání od Michala; návrhy změn → `docs/DENIK.md`.
- Texty webu česky, s diakritikou; typografie dle tokens (Space Grotesk + Inter, žádný monospace).
