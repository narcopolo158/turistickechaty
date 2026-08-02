# CLAUDE.md — turistickechaty.cz

Průvodce **turistickými chatami**: profily s ověřenými daty, mapa, výlety, historie, katalog razítek. Pilot: Krkonoše → ČR → SK → Alpy. Obsah česky.

**Rozsah (rozhodnutí Michala 30. 7. 2026: „řekněme nahlas turistické chaty"):** vedle horských bud a schronisek i útulny, bivaky, rozhledny s občerstvením a chaty ve skalních městech (Prachov, Kozákov). Rozhoduje **role na trase a občerstvení pro veřejnost, ne typ stavby ani nadmořská výška**. Kde to nejsou hory, průvodce to říká — oblast má úroveň `turisticka-oblast` a FAQ rozsah vypisuje. Slib „všemi horskými chatami" se proto na webu už neobjevuje; ve veřejné próze se píše „turistické chaty".

## Stack a reference
- Next.js (App Router) + TypeScript + Payload CMS + PostgreSQL. Mapa: Leaflet/MapLibre + dlaždice Mapy.com „outdoor" (API klíč v env, nikdy v repu).
- **Závazný design:** `design/tokens.css` (custom properties přenést 1:1) a `design/handoff/` — `prototyp.html` je primární vizuální reference (pixel-perfect), `README.md` handoffu popisuje chování a pořadí implementace.
- Projektový plán: `docs/plan.md`. Datový model: kap. 5 plánu.

## Pravidla pro denní 30min session
1. `git pull` → přečti `docs/BACKLOG.md` a posledních ~5 zápisů v `docs/DENIK.md`.
2. Vezmi **nejvyšší nehotovou položku** backlogu (pořadí určuje Michal — neměň ho, jen odškrtávej `[x]`). Když je položka blokovaná (chybí klíč, rozhodnutí), zapiš to k ní, přeskoč na další a polož otázku v deníku.
3. Pracuj v rozsahu ~30 minut: raději menší hotový krok než rozdělaný velký. Vždy `commit + push` (konvence: `feat:`, `data:`, `fix:`, `docs:` — česky).
4. Na konci: zápis do `docs/DENIK.md` (datum, co je hotovo, co dál, otázky) + krátké shrnutí Michalovi.

## Veřejná próza
- **Souvislý „lidský" text, prameny až pod článkem (rozhodnutí Michala 2. 8. 2026: „nelíbí se mi, že v textu u chaty je několikrát napsáno ‚podle Kudy z nudy' apod. — chtěl bych souvislý lidský text a zdroje až pod článkem, ať se to dobře čte").** Jména pramenů („podle Kudy z nudy", „dle portálu Trasygorskie", „podle oficiální stránky PTTK") do vět NEPATŘÍ — pramen žije v `zdroje` (vypisují se pod článkem) a v `overeni*.source`. Poctivostní věty BEZ jména pramene zůstávají žádoucí („časovou osu přebíráme z jediného pramene a ověřená není"); typicky stačí jedna, v závěrečném odstavci. Hlídá to ban-scan (vzor „vsuvka pramene").

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
