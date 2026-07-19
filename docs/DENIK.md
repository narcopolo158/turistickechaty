# DENÍK — pracovní deník denních sessions

Formát zápisu (nejnovější nahoře):

```
## YYYY-MM-DD
**Hotovo:** co se dnes udělalo (položka backlogu, commity)
**Příště:** čím navázat
**Otázky pro Michala:** (pokud jsou — jinak vynechat)
```

---

## 2026-07-19 — denní session 02
**Hotovo:** F0-02 design základ. `tokens.css` přenesen 1:1 do `src/app/(frontend)/tokens.css`, self-hosted fonty (Space Grotesk + Inter, latin + latin-ext, SIL OFL) zkopírovány do `public/fonts/` včetně licence, `fonts.css` s @font-face dle handoffu. Globální layout dle `prototyp.html`: sticky header s červeným toplinem (brand SVG, nav pilulky, badge Deník, toggle ◐), vrstevnicové pozadí na krému, footer, mobilní tab-bar (<760 px, ikony dle prototypu, safe-area). Dark mode „hřebenovka po tmě" s persistencí (`localStorage tc-dark`, init skript před hydratací — žádný záblesk). Úvodní hero (kicker s mini pásovou značkou, H1 se dvěma akcenty, perex) — **bez demo čísel z prototypu** (347 chat apod. jsou nedoložená data, přijdou z DB). Placeholder stránky `/chaty`, `/vylety`, `/razitkovnik`, print CSS skrývá chrome, `:focus-visible` dle handoffu. Ověřeno: lint + tsc čisté, screenshoty (light/dark/mobil) proti prototypu — header a hero sedí, dark persistuje po reloadu.
**Příště:** F0-03 komponenty — sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty (`components/*.html` v handoffu).
**Otázky pro Michala:** Hero zatím bez vyhledávání a statistik — obojí potřebuje reálná data (F0-04+), doplním, jakmile bude nad čím. Badge Deník ukazuje staticky 0, oživí ho F0-08.

## 2026-07-19 — denní session 01
**Hotovo:** F0-01 scaffold aplikace. Next.js 16 (App Router) + TypeScript + Payload CMS 3.86 + Postgres adaptér, aplikace v kořeni repa (nejpřímější pro Forge Quick Deploy dle plánu kap. „Infrastruktura"). `docker-compose.yml` jen s Postgres 17 pro lokální DB, `.env.example` doplněn, README česky, úvodní stránka a metadata česky (`lang="cs"`). ESLint přepsán na flat config (šablonový FlatCompat padal s eslint-config-next 16) + CI workflow (lint + tsc) v `.github/workflows/ci.yml`. Smoke test proti běžící Postgres 16: frontend i `/admin` vrací 200, Payload si stáhl schéma. Kolekce zatím jen šablonové Users + Media — vlastní model přijde v F0-04.
**Příště:** F0-02 design základ — `tokens.css` 1:1 do aplikace, self-hosted fonty z `design/handoff/fonts/`, globální layout dle `prototyp.html` (červená topline, vrstevnicové pozadí, navigace, footer, dark mode).
**Otázky pro Michala:** V sandboxu session neběží Docker daemon — lokální DB jsem spouštěl přímo (postgres 16 z apt); `docker-compose.yml` pro tebe funguje normálně. Push CI workflow token odmítl (chybí oprávnění `workflow`) — předloha čeká v `docs/ci/ci.yml`. Přidáš tokenu oprávnění **Workflows: Read and write**, nebo soubor přesuneš do `.github/workflows/` ručně?

## 2026-07-19 (příprava, ještě mimo denní režim)
**Hotovo:** Projekt naplánován (plán v1.7), design uzavřen — systém „Moderní průvodce" v2.2 z Claude Design (handoff v `design/`), klikací prototyp ověřen a opraven (null-guard u skeleton overlaye). Připraven tento repozitář.
**Příště:** F0-01 scaffold aplikace.
**Otázky pro Michala:** čas denní session · API klíč Mapy.com (až bude čas na F0-07).
