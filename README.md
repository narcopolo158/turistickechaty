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
