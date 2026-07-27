# INFRA-01 — nasazení na VPS pticore přes Laravel Forge

Provedení rozhodnutí z plánu (kap. Infrastruktura, v1.8): web jede jako
další Forge *site* na pticore, Next.js jako *daemon* za nginx reverse
proxy, nasazení Quick Deploy na push do GitHubu. Tenhle adresář nese
všechno, co jde připravit bez přístupu k serveru; zbytek je ~30–45 minut
klikání ve Forge UI (kroky níž) + DNS na Active24.

**ROZHODNUTO 27. 7. 2026 (Active24 panel: pticore má 4 GB RAM):** build
na serveru neprojde (chce ~8 GB heap) → platí fallback z plánu — **build
i nasazení řídí GitHub Actions** (`.github/workflows/deploy-staging.yml`:
Postgres service + seed z data/chaty/** + build + artefakt přes SSH +
restart daemonu + health). Forge Quick Deploy se NEzapíná;
`forge-deploy.sh` v tomhle adresáři je záložní varianta pro silnější
server. Ověřeno 27. 7.: build bez DB spadne (prerender čte Postgres),
proto workflow seeduje — git je zdroj pravdy, obsah artefaktu = obsah
serverové DB po seedu.

**ZJIŠTĚNO při prvním Forge deployi (27. 7. večer):** nový Forge má
nativní typ situ **Next.js** a serverovou část dělá sám — nasazuje přes
`releases/<id>` + symlink `current` (linkuje env soubor i storage
adresáře, staré release maže) a proces řídí **PM2** (app
`site-3312291` = Site ID, cluster, user forge; nginx proxy na Server
port 3017 si typ konfiguruje také sám). Z toho plyne: **ruční daemon se
NEzakládá** (dialog „New background process" = supervisor, běžel by
navíc proti PM2 na tomtéž portu), secret PTICORE_DAEMON odpadl a
workflow pracuje v aktuální release (`current`) a restartuje
`pm2 restart site-3312291`. POZOR: tlačítko **Deploy ve Forge vytvoří
novou release bez `.next`** (build command je záměrně jen echo) → po
každém ručním Forge deployi spustit náš workflow, jinak site zůstane
na 502.

Oficiální postup, o který jsme se opírali (dnes už částečně překonaný
novým Forge UI, viz ZJIŠTĚNO výše): [Deploying your Next.js App To
Forge](https://laravel.com/blog/deploying-your-nextjs-app-to-forge)
(site typ Static/Next.js, daemon `npm run start`, proxy_pass na lokální
port) a praxe restartu daemonu z deploy skriptu přes
`sudo -S supervisorctl restart daemon-ID:*`
([podrobný postup](https://chimit.me/posts/nextjs-on-laravel-forge/)).

## Soubory

| soubor | k čemu |
|---|---|
| `../.github/workflows/deploy-staging.yml` | **hlavní cesta nasazení** — build v Actions (Postgres service + seed + build), artefakt přes SSH, restart daemonu, health |
| `forge-deploy.sh` | ZÁLOŽNÍ varianta pro silnější server (build na serveru) — na pticore se nepoužívá |
| `nginx-site.conf` | obsah server bloku pro „Edit Nginx Configuration" (proxy na port daemonu, cache statiky, limit uploadů) |
| `env.production.example` | šablona `.env.local` na serveru (DB, PAYLOAD_SECRET, PORT, URL) |
| `/api/health` (v aplikaci) | endpoint pro nginx/uptime monitoring — vrací `{ok:true}` bez dotyku DB |

## Postup ve Forge (staging `dev.turistickechaty.cz`)

1. **Postgres: JE — PostgreSQL 17** (ověřeno 27. 7. ve Forge → Storage;
   výchozí databáze `forge`, přístup přes SSH tunel uživatele forge).
   Zbývá jen Storage → Databases → **Add database**: jméno
   `turistickechaty` + stejnojmenný uživatel s vlastním heslem (nic
   sdíleného s hubem). POZOR: Forge zálohy DB jsou za Business plán —
   noční dump si uděláme sami (INFRA-02).
2. **New Site:** doména `dev.turistickechaty.cz`, typ **Static HTML /
   Nuxt.js / Next.js**, web directory `/`. Repo napojit na GitHub
   (Forge si vymění deploy key — PAT z chatu se NEpoužívá), větev `main`.
3. **Env:** Site → **Environment** (editor ve Forge, žádné SSH) —
   vložit obsah dle `env.production.example` s reálnými hodnotami
   (PAYLOAD_SECRET vygenerovat, heslo DB z kroku 1, PORT **3017** —
   NE 3000). Next.js čte `.env` z kořene situ, což je přesně soubor,
   který Forge editor spravuje.
4. **Nginx: ODPADÁ (27. 7.)** — typ Next.js si proxy na Server port
   3017 nastavil sám; `nginx-site.conf` zůstává jen jako reference
   (immutable cache statiky apod. případně doladíme později).
5. **Daemon: ODPADÁ (27. 7.)** — proces spravuje PM2 založené Forge
   (app `site-3312291`), viz ZJIŠTĚNO výše. Nic se nezakládá; do
   prvního běhu workflow bude PM2 app crash-loopovat (chybí `.next`,
   site vrací 502) — to je v pořádku.
6. **Seed DB: automaticky** — deploy workflow po `npm ci` na serveru
   spouští `npx payload run scripts/seed-chaty.ts` (idempotentní,
   doloženo u F0-06) při KAŽDÉM nasazení → serverová DB je vždy
   srovnaná s gitem. Ruční SSH krok odpadá.
7. **GitHub secrets + první deploy:** do repa přidat **tři** secrets
   PTICORE_SSH_KEY / PTICORE_HOST / PTICORE_PATH (viz hlavička
   deploy-staging.yml; PTICORE_DAEMON odpadl — PM2) a spustit Actions →
   „INFRA-01: deploy staging" — workflow postaví .next, nahraje ho do
   aktuální release a restartuje `pm2 restart site-3312291`. Quick
   Deploy ve Forge NEzapínat (deploy řídí Actions; po ověření se ve
   workflow odkomentuje spouštění na push do main).
8. **SSL:** Let's Encrypt certifikát ve Forge (až po DNS kroku).
9. **DNS (Active24):** A záznam `dev` → IP pticore (produkce potom
   `@` + `www`; maily zůstávají na Active24 — neměnit MX).
10. **Kontrola:** `https://dev.turistickechaty.cz/api/health` vrací
    `{"ok":true,…}`; `/admin` naběhne; druhé spuštění workflow projde
    čistě (idempotence).

## Seed dat (76 profilů Krkonoš)

Seed čte výhradně `data/chaty/**` (pipeline DATA-xx). Na serveru po
prvním buildu jednorázově spustit seed skript projektu (viz
`package.json` / docs k seedu) proti produkční DB — a dál už data tečou
jen přes deploye (git je zdroj pravdy, DB se plní seedem, ne ručně).
Fotky (public/znamky, media) jedou v repu, dokud nepřijde R2 (INFRA-02).

## Otevřené body — 27. 7. 2026 večer VŠECHNY VYŘEŠENY

1. ~~Postgres~~ **VYŘEŠENO 27. 7.: PostgreSQL 17 na serveru běží**
   (Forge → Storage) — jen založit DB + uživatele.
2. ~~RAM serveru~~ **VYŘEŠENO 27. 7.: 4 GB (Active24 panel) → build
   v GitHub Actions, na server jen artefakt (workflow připraven).**
3. ~~Porty~~ **VYŘEŠENO 27. 7.: hub je čistě PHP** (jediný daemon =
   `artisan horizon`, Forge → Processes) — na 3xxx nic neposlouchá,
   **3017 staging / 3016 produkce platí**.
4. ~~Node~~ **VYŘEŠENO 27. 7.: v22.23.0** (Michal, Forge site Command
   `node -v`) — shodná major verze s vývojem i CI. **VŠECHNY OTEVŘENÉ
   BODY VYŘEŠENY — start blokuje už jen provedení kroků 1–10.**

## Co schválně NEřešíme teď

Zálohy DB (noční dump) a fotky na R2 = **INFRA-02** po rozběhnutí
stagingu; produkční doména = až staging poběží pár dní v klidu.
