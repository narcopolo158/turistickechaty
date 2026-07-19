# DENÍK — pracovní deník denních sessions

Formát zápisu (nejnovější nahoře):

```
## YYYY-MM-DD
**Hotovo:** co se dnes udělalo (položka backlogu, commity)
**Příště:** čím navázat
**Otázky pro Michala:** (pokud jsou — jinak vynechat)
```

---

## 2026-07-19 — denní session 04
**Hotovo:** F0-04 Payload kolekce dle plánu kap. 5. Nové kolekce: **Chaty** (taby Identifikace / Lokace / Nocleh / Občerstvení / Služby / Provoz / Přístup / Historie / Obsah a média / Vztahy / Meta; sidebar slug + země + typ + stav; drafty zapnuté), **Oblasti** (pohoří/podoblast + bbox pro mapu), **Výlety** (zastávky s vazbou na chaty, GPX, etapy, drafty), **Razítka** (samostatná entita s obdobím platnosti, stavem, kreditem dokladatele; otisk může chybět — výzva pro komunitu), **Fotky** (upload s povinným autorem a licencí, typ současná/dobová/otisk; náhledové velikosti), **Články** (drafty, vazby na chaty a oblasti). Sdílený blok `overeni` (source / verified / checked) je u každé věcné skupiny údajů — u Chaty per tab (overeniLokace, overeniNocleh…), protože taby bez name sdílejí jednu úroveň polí. Slug se generuje hookem z názvu (diakritika pryč), služby jsou tříhodnotové (ano / ne / nevyplněno = nezjištěno — checkbox by lhal). Nový access `verejneJenPublikovane`: veřejnost vidí jen publikované, koncepty jen přihlášená redakce — díru odhalil smoke test. `scripts/smoke-f004.ts` (idempotentní) prověřuje slug hook, vztahy, join razítek, access i draft režim proti lokální Postgres — prošel; lint + tsc čisté; admin editor vizuálně zkontrolován (screenshoty, taby a české labels sedí). Media přejmenována na „Soubory" (GPX apod.), fotky mají vlastní kolekci kvůli licencím.
**Příště:** F0-05 šablona profilu chaty nad daty + JSON-LD + generovaný OG obrázek.
**Otázky pro Michala:** 1) Granularita ověření je per tematická skupina (jeden telefonát ověří otvíračku i kontakty), ne per jednotlivé pole — per pole by byl admin nepoužitelný. Vyhovuje? 2) Sousední chaty se zapisují jednosměrně (u chaty A vazba na B); obousměrné dopočítání nechám na plánovači přechodů. OK? 3) Omezení Payloadu: join pole (razítka/fotky u chaty) se plní až po prvním publikování dokumentu — u čistých konceptů se seznam neukáže; pro web to nevadí, jen ať tě to v adminu nepřekvapí.

## 2026-07-19 — denní session 03
**Hotovo:** F0-03 komponenty. `components.css` s dlaždicemi, sekčními lištami (modrá/červená/night), tlačítky (červené CTA, modré, ghost, done, link), chips + filtr chips (aktivní plná červená), stavovými pilulkami (otevřeno plná zelená · zavřeno · zaniklá — vždy s textem, nikdy jen barvou), infoboxy (blue/alpine/red, plná plocha bez rámečku), pásovými značkami 1:1 s terénem (inline `.znm` i box `.znk`), tabulkovými řádky katalogu a kartou chaty (stav pilulkou ve fotce, hover zdvih + plovoucí stín) — hodnoty 1:1 z `prototyp.html`, vč. dark mode a mobilních breakpointů. React obaly prop-driven v `src/components/ui.tsx` + `HutCard.tsx` (žádná zadrátovaná data — vše přijde z Payloadu). Interní styleguide `/design` (noindex, s upozorněním, že jde o ukázková data z prototypu). Ověřeno: lint + tsc čisté, screenshoty light/dark proti prototypu a komponentovým kartám handoffu. CI blokace z session 01 potvrzena jako vyřešená (ci.yml je v `.github/workflows/`, commit bc36aa0).
**Příště:** F0-04 Payload kolekce dle plánu kap. 5: Chata, Oblast, Výlet, Razítko, Fotka, Článek + pole source/verified/checked všude.
**Otázky pro Michala:** Styleguide `/design` je veřejně dostupný (jen neindexovaný) — vyhovuje, nebo ho mám schovat za env flag / smazat, až poběží reálné šablony? Mapové markery z `karta-chaty.html` jsem nechal na F0-07 (patří k mapě).

## 2026-07-19 — denní session 02
**Hotovo:** F0-02 design základ. `tokens.css` přenesen 1:1 do `src/app/(frontend)/tokens.css`, self-hosted fonty (Space Grotesk + Inter, latin + latin-ext, SIL OFL) zkopírovány do `public/fonts/` včetně licence, `fonts.css` s @font-face dle handoffu. Globální layout dle `prototyp.html`: sticky header s červeným toplinem (brand SVG, nav pilulky, badge Deník, toggle ◐), vrstevnicové pozadí na krému, footer, mobilní tab-bar (<760 px, ikony dle prototypu, safe-area). Dark mode „hřebenovka po tmě" s persistencí (`localStorage tc-dark`, init skript před hydratací — žádný záblesk). Úvodní hero (kicker s mini pásovou značkou, H1 se dvěma akcenty, perex) — **bez demo čísel z prototypu** (347 chat apod. jsou nedoložená data, přijdou z DB). Placeholder stránky `/chaty`, `/vylety`, `/razitkovnik`, print CSS skrývá chrome, `:focus-visible` dle handoffu. Ověřeno: lint + tsc čisté, screenshoty (light/dark/mobil) proti prototypu — header a hero sedí, dark persistuje po reloadu.
**Příště:** F0-03 komponenty — sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty (`components/*.html` v handoffu).
**Otázky pro Michala:** Hero zatím bez vyhledávání a statistik — obojí potřebuje reálná data (F0-04+), doplním, jakmile bude nad čím. Badge Deník ukazuje staticky 0, oživí ho F0-08.

## 2026-07-19 — denní session 01
**Hotovo:** F0-01 scaffold aplikace. Next.js 16 (App Router) + TypeScript + Payload CMS 3.86 + Postgres adaptér, aplikace v kořeni repa (nejpřímější pro Forge Quick Deploy dle plánu kap. „Infrastruktura"). `docker-compose.yml` jen s Postgres 17 pro lokální DB, `.env.example` doplněn, README česky, úvodní stránka a metadata česky (`lang="cs"`). ESLint přepsán na flat config (šablonový FlatCompat padal s eslint-config-next 16) + CI workflow (lint + tsc) v `.github/workflows/ci.yml`. Smoke test proti běžící Postgres 16: frontend i `/admin` vrací 200, Payload si stáhl schéma. Kolekce zatím jen šablonové Users + Media — vlastní model přijde v F0-04.
**Příště:** F0-02 design základ — `tokens.css` 1:1 do aplikace, self-hosted fonty z `design/handoff/fonts/`, globální layout dle `prototyp.html` (červená topline, vrstevnicové pozadí, navigace, footer, dark mode).
**Otázky pro Michala:** V sandboxu session neběží Docker daemon — lokální DB jsem spouštěl přímo (postgres 16 z apt); `docker-compose.yml` pro tebe funguje normálně. Push CI workflow token odmítl (chybí oprávnění `workflow`) — předloha čeká v `docs/ci/ci.yml`. Přidáš tokenu oprávnění **Workflows: Read and write**, nebo soubor přesuneš do `.github/workflows/` ručně? *→ Vyřešeno 19. 7.: token má oprávnění Workflows, ci.yml přesunut do `.github/workflows/` (commit bc36aa0).*

## 2026-07-19 (příprava, ještě mimo denní režim)
**Hotovo:** Projekt naplánován (plán v1.7), design uzavřen — systém „Moderní průvodce" v2.2 z Claude Design (handoff v `design/`), klikací prototyp ověřen a opraven (null-guard u skeleton overlaye). Připraven tento repozitář.
**Příště:** F0-01 scaffold aplikace.
**Otázky pro Michala:** čas denní session · API klíč Mapy.com (až bude čas na F0-07).
