# BACKLOG — turistickechaty.cz

Řídicí páka projektu: Michal určuje pořadí, denní session bere první nehotovou položku shora. Hotové označit `[x]`, blokované okomentovat.

## Fáze 0 — základy

- [x] **F0-01** Scaffold: Next.js (App Router) + TypeScript + Payload + Postgres (docker-compose pro lokální DB), struktura repa, `.env.example`, CI lint
- [x] **F0-02** Design základ: `tokens.css` + self-hosted fonty + globální layout dle handoffu (červená topline, vrstevnicové pozadí, navigace, footer, dark mode)
- [x] **F0-03** Komponenty: sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty
- [x] **F0-04** Payload kolekce dle plánu kap. 5: Chata, Oblast, Výlet, Razítko, Fotka, Článek (+ pole source/verified/checked všude)
- [x] **F0-05** Šablona profilu chaty nad daty + JSON-LD + generovaný OG obrázek
- [ ] **F0-06** Vzorová Luční bouda: naplnit profil (data `verified: false`, postupně ověřovat), interaktivní výškový profil *(rozpracováno: data profilu + seed — session 06; komponenta profilu + datový model tras — session 07; `scripts/vyskovy-profil.ts` + testy + návod v README — session 08 (20. 7.). **Aktualizace 20. 7.:** GPX dodány a zpracovány v hlavní session (Špindl 6,8 km / +699 m / 3:15 orient.; Pec 8,0 km / +742 m / 3:40 orient.) — data tras jsou v `lucni-bouda.yaml` vč. decimovaných profilů a časů dle DIN 33466. Zbývá: doplnit `znaceni`/`obtiznost` (Michal potvrdí barvy), pustit seed a ověřit render profilu → pak F0-06 odškrtnout. Původní stav: **Blokované na Michalovi:** sandbox na api.mapy.com nedosáhne (proxy 403), zbývá jednorázově lokálně: exportovat GPX tras (Pec → Luční bouda, příp. další), spustit `npx tsx scripts/vyskovy-profil.ts trasa.gpx`, fragment vložit do `lucni-bouda.yaml` (doplnit vychoziBod/casMin/znaceni/obtiznost) a pustit seed — přesný postup README „Výškové profily tras". **Časy tras (rozhodnuto 20. 7.):** do `vyskovy-profil.ts` doplnit vypočtený orientační čas dle normy **DIN 33466** (tempo po rovině + přirážka za převýšení/klesání), publikovat označený jako „orientační čas (výpočet)" se vzorcem jako `source` a `verified: false`. **Upřesnění 20. 7. (Michal):** české rozcestníky KČT časy neuvádějí (jen km) — vypočtený čas dle DIN 33466 je tedy pro ČR **finální publikovaný údaj**; časy z rozcestníků se budou dokládat až na Slovensku a v Alpách, kde se uvádějí (foto rozcestníku = zdroj). Km z rozcestníku slouží jako křížová kontrola délky z GPX; časy z plánovače Mapy.com jen jako sanity-check, ne jako citovaný zdroj. K otázce typu ze session 06: Luční bouda zůstává **„obsluhovaná chata"** — veřejný jazyk webu; jemnější taxonomie („horský hotel v roli chaty") se rozhodne, až bude víc případů)*
- [ ] **F0-07** Mapa MVP: Leaflet + dlaždice Mapy.com „outdoor" + markery + hover preview (API klíč Mapy.com k dispozici v env konfiguraci sessions)
- [ ] **F0-08** Razítkovací moment + lokální deník (dle handoffu; účty až fáze 4)

## Datové úkoly (prokládat s vývojem)

- [ ] **DATA-01** OSM Overpass: export chat Krkonoš → `data/chaty/krkonose/*.yaml` (source: OSM, verified: false) + atribuce ODbL
- [ ] **DATA-02** Wikimedia Commons: dohledat fotky k prvním 10 chatám Krkonoš (URL, autor, licence do yaml)
- [ ] **DATA-03** Křížové ověření seznamu chat Krkonoš (weby chat, KRNAP, Treking) → doplnit/vyřadit, poznámky ke sporným
- [ ] **DATA-04** Ověřit otvíračky a kontakty 5 nejnavštěvovanějších bud (weby/sociální sítě chat, zapsat checked datum)
- [ ] **DATA-05** Razítkové weby (razitkuj.cz, turisticka-razitka.estranky.cz, příp. turistickarazitka.cz): používat **jen jako checklist** pokrytí razítek pro Krkonoše — fakta se `source:` odkazem a `verified: false`. **Skeny nekopírovat** (autorská i databázová práva; komunitu chceme jako partnera) — otisky převzít až po písemném souhlasu majitelů. Stav oslovení: 19. 7. 2026 Michal odeslal e-maily na **všechny tři weby** (panos-pe@volny.cz, kontakt razitkuj.cz i turistickarazitka.cz), čeká se na odpovědi.
- [ ] **DATA-06 · Trasová pipeline (autonomní trasy bez ruční práce)** — postavit po dokončení F0-07/F0-08, odhad 2–4 sessions. Cíl: pro každou chatu spočítat přístupové trasy automaticky. Návrh: (1) Overpass export relací `route=hiking` pohoří vč. `osmc:symbol` (barvy značení KČT jsou v OSM strukturovaně; ODbL atribuce) → routovatelný graf; (2) kurátorovaný seznam výchozích bodů oblasti v `data/oblasti/<slug>.yaml` (obce, terminály, zastávky — jednorázově rukou); (3) výpočet cest po značených trasách (preference značek) → geometrie, délka, `znaceni` po úsecích, výšky přes Mapy.com Elevation API, `casMin` dle DIN 33466; (4) **běží jako GitHub Actions workflow** (`workflow_dispatch`; sandbox na externí API nedosáhne, Actions ano — token má právo Workflows; MAPY klíč jako Actions secret, nastaví Michal v Settings → Secrets), výstup commitne YAML; (5) poctivost: vše `verified: false` se zdroji, trasy s >15 % délky mimo značené cesty označit k ruční kontrole. Zpětně doplní i `znaceni` dvou hotových tras Luční boudy.

## Zaparkováno (neber, dokud Michal neposune výš)

- [ ] Deployment na VPS pticore (reverse proxy vhost, Postgres, zálohy) — až ke konci Fáze 1
- [x] Registrace Mapy.com API — hotovo (projekt „turistickechaty", tarif Basic, placená spotřeba zakázána); atribuce s logem se řeší v F0-07
- [ ] Formulář „nahrát otisk razítka" s moderací
- [ ] Newsletter setup
