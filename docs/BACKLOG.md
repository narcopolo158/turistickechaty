# BACKLOG — turistickechaty.cz

Řídicí páka projektu: Michal určuje pořadí, denní session bere první nehotovou položku shora. Hotové označit `[x]`, blokované okomentovat.

## Fáze 0 — základy

- [ ] **F0-01** Scaffold: Next.js (App Router) + TypeScript + Payload + Postgres (docker-compose pro lokální DB), struktura repa, `.env.example`, CI lint
- [ ] **F0-02** Design základ: `tokens.css` + self-hosted fonty + globální layout dle handoffu (červená topline, vrstevnicové pozadí, navigace, footer, dark mode)
- [ ] **F0-03** Komponenty: sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty
- [ ] **F0-04** Payload kolekce dle plánu kap. 5: Chata, Oblast, Výlet, Razítko, Fotka, Článek (+ pole source/verified/checked všude)
- [ ] **F0-05** Šablona profilu chaty nad daty + JSON-LD + generovaný OG obrázek
- [ ] **F0-06** Vzorová Luční bouda: naplnit profil (data `verified: false`, postupně ověřovat), interaktivní výškový profil
- [ ] **F0-07** Mapa MVP: Leaflet + dlaždice Mapy.com „outdoor" + markery + hover preview — ⏳ čeká na API klíč (Michal: developer.mapy.com)
- [ ] **F0-08** Razítkovací moment + lokální deník (dle handoffu; účty až fáze 4)

## Datové úkoly (prokládat s vývojem)

- [ ] **DATA-01** OSM Overpass: export chat Krkonoš → `data/chaty/krkonose/*.yaml` (source: OSM, verified: false) + atribuce ODbL
- [ ] **DATA-02** Wikimedia Commons: dohledat fotky k prvním 10 chatám Krkonoš (URL, autor, licence do yaml)
- [ ] **DATA-03** Křížové ověření seznamu chat Krkonoš (weby chat, KRNAP, Treking) → doplnit/vyřadit, poznámky ke sporným
- [ ] **DATA-04** Ověřit otvíračky a kontakty 5 nejnavštěvovanějších bud (weby/sociální sítě chat, zapsat checked datum)

## Zaparkováno (neber, dokud Michal neposune výš)

- [ ] Deployment na VPS pticore (reverse proxy vhost, Postgres, zálohy) — až ke konci Fáze 1
- [ ] Registrace Mapy.com API + atribuce s logem — potřebuje Michalův Seznam účet
- [ ] Formulář „nahrát otisk razítka" s moderací
- [ ] Newsletter setup
