# INFRA-01 — nasazení na VPS pticore přes Laravel Forge

Provedení rozhodnutí z plánu (kap. Infrastruktura, v1.8): web jede jako
další Forge *site* na pticore, Next.js jako *daemon* za nginx reverse
proxy, nasazení Quick Deploy na push do GitHubu. Tenhle adresář nese
všechno, co jde připravit bez přístupu k serveru; zbytek je ~30–45 minut
klikání ve Forge UI (kroky níž) + DNS na Active24.

Oficiální postup, o který se opíráme: [Deploying your Next.js App To
Forge](https://laravel.com/blog/deploying-your-nextjs-app-to-forge)
(site typ Static/Next.js, daemon `npm run start`, proxy_pass na lokální
port) a praxe restartu daemonu z deploy skriptu přes
`sudo -S supervisorctl restart daemon-ID:*`
([podrobný postup](https://chimit.me/posts/nextjs-on-laravel-forge/)).

## Soubory

| soubor | k čemu |
|---|---|
| `forge-deploy.sh` | obsah Deploy Scriptu ve Forge (git pull → npm ci → build → restart daemonu → health kontrola) |
| `nginx-site.conf` | obsah server bloku pro „Edit Nginx Configuration" (proxy na port daemonu, cache statiky, limit uploadů) |
| `env.production.example` | šablona `.env.local` na serveru (DB, PAYLOAD_SECRET, PORT, URL) |
| `/api/health` (v aplikaci) | endpoint pro nginx/uptime monitoring — vrací `{ok:true}` bez dotyku DB |

## Postup ve Forge (staging `dev.turistickechaty.cz`)

1. **Postgres na serveru:** ověřit `psql --version` / služby — laravelové
   VPS bývají na MySQL. Když chybí → Forge recipe „Install PostgreSQL".
   Založit DB `turistickechaty` + stejnojmenného uživatele (oddělené
   heslo; nic sdíleného s hubem).
2. **New Site:** doména `dev.turistickechaty.cz`, typ **Static HTML /
   Nuxt.js / Next.js**, web directory `/`. Repo napojit na GitHub
   (Forge si vymění deploy key — PAT z chatu se NEpoužívá), větev `main`.
3. **Env:** na serveru vytvořit `.env.local` dle
   `env.production.example` (vygenerovat PAYLOAD_SECRET, zvolit PORT —
   **na pticore už žije hub, takže NE 3000**; navrženo 3017 staging).
4. **Nginx:** Site → Edit Nginx Configuration → vlepit obsah
   `nginx-site.conf` (a smazat PHP pozůstatky dle poznámky v souboru).
   Restart nginx.
5. **První build ručně:** `ssh forge@pticore`, `cd` do situ,
   `npm ci && npm run build`, jednorázově migrace/seed (viz Seed níž).
6. **Daemon:** Site → New Daemon — command `npm run start`, directory
   = kořen situ, user `forge`. Poznamenat si číslo daemonu.
7. **Deploy Script:** vlepit `forge-deploy.sh`, doplnit `DAEMON_ID`,
   zapnout **Quick Deploy**.
8. **SSL:** Let's Encrypt certifikát ve Forge (až po DNS kroku).
9. **DNS (Active24):** A záznam `dev` → IP pticore (produkce potom
   `@` + `www`; maily zůstávají na Active24 — neměnit MX).
10. **Kontrola:** `https://dev.turistickechaty.cz/api/health` vrací
    `{"ok":true,…}`; `/admin` naběhne; jeden testovací deploy pushnutím
    do main projde Quick Deployem.

## Seed dat (76 profilů Krkonoš)

Seed čte výhradně `data/chaty/**` (pipeline DATA-xx). Na serveru po
prvním buildu jednorázově spustit seed skript projektu (viz
`package.json` / docs k seedu) proti produkční DB — a dál už data tečou
jen přes deploye (git je zdroj pravdy, DB se plní seedem, ne ručně).
Fotky (public/znamky, media) jedou v repu, dokud nepřijde R2 (INFRA-02).

## Otevřené body (blokují start — odpovědi od Michala)

1. Běží na pticore **Postgres**, nebo instalujeme recipe? (plán s tím počítá)
2. **RAM** serveru — build chce `--max-old-space-size=8000`; kolik má
   pticore paměti a snese build vedle hubu? (fallback: build v GitHub
   Actions, na server artefakt — připraví se, kdyby první build spadl)
3. **Porty:** které porty hub už drží? (návrh 3017 staging / 3016 prod)
4. **Node na serveru:** potřebujeme ≥ 20 (ideálně 22, jako ve vývoji) —
   ověřit `node -v`, případně Forge recipe na novější Node.

## Co schválně NEřešíme teď

Zálohy DB (noční dump) a fotky na R2 = **INFRA-02** po rozběhnutí
stagingu; produkční doména = až staging poběží pár dní v klidu.
