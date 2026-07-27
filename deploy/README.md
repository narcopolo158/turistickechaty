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

Oficiální postup, o který se opíráme: [Deploying your Next.js App To
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
3. **Env:** na serveru vytvořit `.env.local` dle
   `env.production.example` (vygenerovat PAYLOAD_SECRET, zvolit PORT —
   **na pticore už žije hub, takže NE 3000**; navrženo 3017 staging).
4. **Nginx:** Site → Edit Nginx Configuration → vlepit obsah
   `nginx-site.conf` (a smazat PHP pozůstatky dle poznámky v souboru).
   Restart nginx.
5. **Daemon:** Site → New Daemon — command `npm run start`, directory
   = kořen situ, user `forge`. Poznamenat si číslo daemonu. (Do prvního
   nasazení bude daemon padat — chybí mu .next; to je v pořádku.)
6. **Seed DB na serveru (jednorázově):** `ssh forge@pticore`, `cd` do
   situ, `npm ci && npx payload run scripts/seed-chaty.ts` — instalace
   i seed 4 GB RAM zvládnou, jen build ne.
7. **GitHub secrets + první deploy:** do repa přidat PTICORE_SSH_KEY /
   PTICORE_HOST / PTICORE_PATH / PTICORE_DAEMON (viz hlavička
   deploy-staging.yml) a spustit Actions → „INFRA-01: deploy staging" —
   workflow postaví .next, nahraje ho a restartuje daemon. Quick Deploy
   ve Forge NEzapínat (deploy řídí Actions; po ověření se ve workflow
   odkomentuje spouštění na push do main).
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

## Otevřené body (blokují start — odpovědi od Michala)

1. ~~Postgres~~ **VYŘEŠENO 27. 7.: PostgreSQL 17 na serveru běží**
   (Forge → Storage) — jen založit DB + uživatele.
2. ~~RAM serveru~~ **VYŘEŠENO 27. 7.: 4 GB (Active24 panel) → build
   v GitHub Actions, na server jen artefakt (workflow připraven).**
3. ~~Porty~~ **VYŘEŠENO 27. 7.: hub je čistě PHP** (jediný daemon =
   `artisan horizon`, Forge → Processes) — na 3xxx nic neposlouchá,
   **3017 staging / 3016 produkce platí**.
4. **Node na serveru — POSLEDNÍ NEZNÁMÁ:** Forge UI (Runtime → Node.js)
   verzi neukazuje, jen npm credentials → ověřit přes SSH: `node -v`
   (potřebujeme ≥ 20, ideálně 22). Když bude starý/chybět, doinstalujeme.

## Co schválně NEřešíme teď

Zálohy DB (noční dump) a fotky na R2 = **INFRA-02** po rozběhnutí
stagingu; produkční doména = až staging poběží pár dní v klidu.
