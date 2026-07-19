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
