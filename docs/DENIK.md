# DENÍK — pracovní deník denních sessions

Formát zápisu (nejnovější nahoře):

```
## YYYY-MM-DD
**Hotovo:** co se dnes udělalo (položka backlogu, commity)
**Příště:** čím navázat
**Otázky pro Michala:** (pokud jsou — jinak vynechat)
```

---

## 2026-07-19 — denní session 01
**Hotovo:** F0-01 scaffold aplikace. Next.js 16 (App Router) + TypeScript + Payload CMS 3.86 + Postgres adaptér, aplikace v kořeni repa (nejpřímější pro Forge Quick Deploy dle plánu kap. „Infrastruktura"). `docker-compose.yml` jen s Postgres 17 pro lokální DB, `.env.example` doplněn, README česky, úvodní stránka a metadata česky (`lang="cs"`). ESLint přepsán na flat config (šablonový FlatCompat padal s eslint-config-next 16) + CI workflow (lint + tsc) v `.github/workflows/ci.yml`. Smoke test proti běžící Postgres 16: frontend i `/admin` vrací 200, Payload si stáhl schéma. Kolekce zatím jen šablonové Users + Media — vlastní model přijde v F0-04.
**Příště:** F0-02 design základ — `tokens.css` 1:1 do aplikace, self-hosted fonty z `design/handoff/fonts/`, globální layout dle `prototyp.html` (červená topline, vrstevnicové pozadí, navigace, footer, dark mode).
**Otázky pro Michala:** V sandboxu session neběží Docker daemon — lokální DB jsem spouštěl přímo (postgres 16 z apt); `docker-compose.yml` pro tebe funguje normálně. Push CI workflow token odmítl (chybí oprávnění `workflow`) — předloha čeká v `docs/ci/ci.yml`. Přidáš tokenu oprávnění **Workflows: Read and write**, nebo soubor přesuneš do `.github/workflows/` ručně?


**Hotovo:** Projekt naplánován (plán v1.7), design uzavřen — systém „Moderní průvodce" v2.2 z Claude Design (handoff v `design/`), klikací prototyp ověřen a opraven (null-guard u skeleton overlaye). Připraven tento repozitář.
**Příště:** F0-01 scaffold aplikace.
**Otázky pro Michala:** čas denní session · API klíč Mapy.com (až bude čas na F0-07).
