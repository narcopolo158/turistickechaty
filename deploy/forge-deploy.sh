#!/usr/bin/env bash
# INFRA-01 · Quick Deploy skript pro Laravel Forge (VPS pticore)
# Vloží se do Forge → Site → Deployments → Deploy Script (a zapne se
# Quick Deploy, ať jede na každý push do main).
#
# PŘED POUŽITÍM doplnit:
#   - DAEMON_ID: číslo daemonu z Forge (Site → Daemons) — objeví se až po
#     založení daemonu `npm run start`.
#   - případně větev, pokud nepůjde o main.
#
# Pozn.: build má v package.json --max-old-space-size=8000; kdyby RAM
# serveru nestačila (viz plán kap. Infrastruktura), přesune se build do
# GitHub Actions a sem půjde jen rozbalení artefaktu.

set -euo pipefail

cd "$FORGE_SITE_PATH"

git pull origin "$FORGE_SITE_BRANCH"

# čisté, reprodukovatelné závislosti
npm ci --no-audit --no-fund

# produkční build (Payload admin + Next)
npm run build

# migrace schématu Payloadu (bezpečně selže hlasitě, když DB neběží)
# TODO(INFRA-01): ověřit po prvním nasazení, že příkaz odpovídá verzi
# Payloadu v repu (payload migrate vs. drizzle push) — do té doby
# zakomentováno, schéma řeší první ruční `npm run payload migrate`.
# npm run payload migrate -- --yes

# restart Next.js daemonu (číslo z Forge → Daemons)
DAEMON_ID="DOPLNIT"
if [ "$DAEMON_ID" != "DOPLNIT" ]; then
  sudo -S supervisorctl restart "daemon-${DAEMON_ID}:*"
else
  echo "!! DAEMON_ID není doplněn — daemon nerestartován (první nasazení?)"
fi

# rychlá sebekontrola: health endpoint musí odpovědět do 20 s
PORT_KONTROLA="${PORT:-3017}"
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT_KONTROLA}/api/health" >/dev/null 2>&1; then
    echo "OK: aplikace odpovídá na /api/health (port ${PORT_KONTROLA})"
    exit 0
  fi
  sleep 1
done
echo "!! aplikace po restartu neodpovídá na /api/health (port ${PORT_KONTROLA})" >&2
exit 1
