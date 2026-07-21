# turistickechaty.cz

Průvodce všemi horskými chatami: profily s ověřenými daty, mapa, výlety, historie, katalog razítek. Pilot: Krkonoše. Obsah česky.

## Stack

Next.js (App Router) + TypeScript + Payload CMS + PostgreSQL. Závazný design: `design/` (tokens + handoff s prototypem). Projektový plán: `docs/plan.md`, řízení práce: `docs/BACKLOG.md` + `docs/DENIK.md`, konvence: `CLAUDE.md`.

## Lokální spuštění

1. `cp .env.example .env` a vyplň hodnoty (`PAYLOAD_SECRET` = libovolný náhodný řetězec).
2. `docker compose up -d` — spustí lokální PostgreSQL (odpovídá výchozímu `DATABASE_URL`).
3. `npm install`
4. `npm run dev` — web na `http://localhost:3000`, administrace na `http://localhost:3000/admin`.

## Užitečné příkazy

`npm run lint` (ESLint) · `npm run typecheck` (tsc) · `npm run generate:types` (typy z Payload kolekcí, commitují se do `src/payload-types.ts`).

## Výškové profily tras

Body `[km, výška]` pro pole `vyskovyProfil` v `data/chaty/**.yaml` se dokládají z Mapy.com Elevation API — nikdy se nedomýšlejí. Postup (lokálně, potřebuje `NEXT_PUBLIC_MAPY_API_KEY` v `.env`; ze sandboxu denních sessions API volat nejde):

1. Exportuj trasu jako GPX (vlastní nahrávka, plánovač; u geometrie z OSM patří do zdroje atribuce ODbL).
2. `npx tsx scripts/vyskovy-profil.ts trasa.gpx` — vypíše hotový YAML fragment trasy (délka, převýšení, decimované body se zdrojem a `checked`). `--dry-run` jen spočítá body bez volání API, `--tolerance 3` dá hrubší křivku.
3. Fragment vlož do pole `trasy` v YAML chaty, ručně doplň `vychoziBod`, `casMin` (z rozcestníku KČT / plánovače — vlastní zdroj!), `znaceni`, `obtiznost` a rozšiř `overeniPristup.source`. Pak `npx payload run scripts/seed-chaty.ts`.

Jedna trasa = 1 dotaz na API (max 256 bodů/dotaz) — hluboko ve free kvótě tarifu Basic; placená spotřeba je u projektu zakázána.

## Fotky chat (Wikimedia Commons)

Kandidáty s licenčně čistými metadaty sbírá workflow „DATA-02: fotky chat z Wikimedia Commons" do `data/kandidati/fotky/`. Redakční výběr se zapisuje do bloku `fotky:` v YAML chaty (autor, licence, `zdrojUrl`, `stahnoutZ`, blok `overeni`) — vzor v `data/chaty/krkonose/lucni-bouda.yaml`. Seed (`npx payload run scripts/seed-chaty.ts`) pak soubor stáhne z `stahnoutZ` a nahraje do kolekce Fotky; opakovaný běh jen srovná metadata (idempotence dle `zdrojUrl`). Stahování potřebuje síť na `upload.wikimedia.org` — běží lokálně nebo v Actions; v prostředí bez ní `SEED_BEZ_FOTEK=1` sekci přeskočí. Převzaté fotky dostávají atribuci přímo na snímku (komponenta `FotoAtribuce` — povinnost CC BY/BY-SA).

## Komunitní razítka (moderace)

Otisky razítek může nahrávat komunita sběratelů přímo na web — **s účtem i bez (host)**. Zázemí je hotové v datovém modelu, veřejný nahrávací formulář se spustí až s nasazením webu.

Kolekce **Razítka** má zapnutou moderaci přes Payload koncept/publikaci (`versions.drafts`):

- Redakční záznamy (seed, `data/razitka/**`) se rovnou **publikují** (`_status: published`).
- Komunitní podání (`zpusobZiskani: komunitni-podani`) přijde jako **koncept** a na webu se objeví, teprve až ho redakce v adminu publikuje. Veřejné čtení (`lib/chaty.ts` — `getChataBySlug`, razítkovník) pouští jen publikovaná razítka (join Payloadu vrací i koncepty, proto se filtrují funkcí `jenPublikovanaRazitka`).
- Podání nese odesílatele (relace `podani.ucet` pro přihlášené sběratele, nebo `podani.hostJmeno`/`hostEmail` pro hosty), **licenční souhlas** (`podani.licencniSouhlas` + znění a datum) a veřejný kredit `dolozil`.
- Poctivost a právo: komunitní razítko **nelze publikovat bez licenčního souhlasu** (hlídá `beforeChange` hook kolekce). Licence otisku je „se svolením" a kredit se u razítka zobrazuje.

Plné účty (registrace, deníček raziče, žebříček) přijdou ve Fázi 4; model už s relací na účet počítá. Test moderace: `tests/int/razitka-moderace.int.spec.ts`.

## Značené trasy (DATA-06)

Podklad pro automatické přístupové trasy k chatám. Workflow „DATA-06: export značených tras" (Actions → Run workflow) stáhne z OSM Overpass relace `route=hiking` v Krkonoších i s geometrií a skript `scripts/data06-trasy.ts` z tagů `osmc:symbol` / `kct_*` / `colour` určí **barvu značení KČT** (červená/modrá/zelená/žlutá). Výstup: surový export `data/trasy/krkonose/_overpass-trasy.json` (doklad) + katalog `znacene-trasy.json` (osmId, název, ref, `znaceni`, délka, počet úseků). Trasy bez rozpoznaného značení jdou do reportu, ne do katalogu (nedomýšlet). Offline nad commitnutým exportem: `npx tsx scripts/data06-trasy.ts --z-jsonu`.

Tohle je **increment 1** (routovatelný podklad). Navazuje: (2) kurátorovaný seznam výchozích bodů oblasti v `data/oblasti/<slug>.yaml`; (3) routing po značených trasách z výchozích bodů → geometrie, `znaceni` po úsecích, výšky přes Mapy.com Elevation API, `casMin` dle DIN 33466; zpětně doplní i `znaceni` dvou tras Luční boudy. Vše `verified: false` se zdrojem (ODbL); trasy s >15 % délky mimo značené cesty k ruční kontrole.
