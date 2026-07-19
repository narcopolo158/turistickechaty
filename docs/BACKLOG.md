# BACKLOG — turistickechaty.cz

Řídicí páka projektu: Michal určuje pořadí, denní session bere první nehotovou položku shora. Hotové označit `[x]`, blokované okomentovat.

## Fáze 0 — základy

- [x] **F0-01** Scaffold: Next.js (App Router) + TypeScript + Payload + Postgres (docker-compose pro lokální DB), struktura repa, `.env.example`, CI lint
- [x] **F0-02** Design základ: `tokens.css` + self-hosted fonty + globální layout dle handoffu (červená topline, vrstevnicové pozadí, navigace, footer, dark mode)
- [x] **F0-03** Komponenty: sekční lišty, tlačítka, chips, stavové pilulky, infoboxy, pásové značky, tabulkové řádky, karta chaty
- [x] **F0-04** Payload kolekce dle plánu kap. 5: Chata, Oblast, Výlet, Razítko, Fotka, Článek (+ pole source/verified/checked všude)
- [x] **F0-05** Šablona profilu chaty nad daty + JSON-LD + generovaný OG obrázek
- [ ] **F0-06** Vzorová Luční bouda: naplnit profil (data `verified: false`, postupně ověřovat), interaktivní výškový profil *(rozpracováno 19. 7.: data profilu + seed hotovy — session 06; komponenta výškového profilu + datový model tras hotovy — session 07. Zbývá jen doložit data tras (časy, body profilu) — **odblokováno 19. 7. večer, rozhodnutí:** zdroj výšek = **Mapy.com Elevation API** (běží pod naším klíčem, oficiálně podporované — existuje i tutoriál přímo na výškové profily tras). Postavit `scripts/vyskovy-profil.ts`: vstup GPX/souřadnice → decimované body `[km, výška]` do YAML se `source: "Mapy.com Elevation API"` + `checked`; pokud API nejde volat ze sandboxu, skript dotáhnout a jednorázové spuštění nechat Michalovi lokálně (jeden příkaz, návod do README). Geometrie tras pro pilot: vlastní GPX od Michala, případně OSM s ODbL atribucí. K otázce typu ze session 06: Luční bouda zůstává **„obsluhovaná chata"** — veřejný jazyk webu; jemnější taxonomie („horský hotel v roli chaty") se rozhodne, až bude víc případů)*
- [ ] **F0-07** Mapa MVP: Leaflet + dlaždice Mapy.com „outdoor" + markery + hover preview (API klíč Mapy.com k dispozici v env konfiguraci sessions)
- [ ] **F0-08** Razítkovací moment + lokální deník (dle handoffu; účty až fáze 4)

## Datové úkoly (prokládat s vývojem)

- [ ] **DATA-01** OSM Overpass: export chat Krkonoš → `data/chaty/krkonose/*.yaml` (source: OSM, verified: false) + atribuce ODbL
- [ ] **DATA-02** Wikimedia Commons: dohledat fotky k prvním 10 chatám Krkonoš (URL, autor, licence do yaml)
- [ ] **DATA-03** Křížové ověření seznamu chat Krkonoš (weby chat, KRNAP, Treking) → doplnit/vyřadit, poznámky ke sporným
- [ ] **DATA-04** Ověřit otvíračky a kontakty 5 nejnavštěvovanějších bud (weby/sociální sítě chat, zapsat checked datum)
- [ ] **DATA-05** Razítkové weby (razitkuj.cz, turisticka-razitka.estranky.cz, příp. turistickarazitka.cz): používat **jen jako checklist** pokrytí razítek pro Krkonoše — fakta se `source:` odkazem a `verified: false`. **Skeny nekopírovat** (autorská i databázová práva; komunitu chceme jako partnera) — otisky převzít až po písemném souhlasu majitelů. Stav oslovení: 19. 7. 2026 Michal odeslal e-maily na **všechny tři weby** (panos-pe@volny.cz, kontakt razitkuj.cz i turistickarazitka.cz), čeká se na odpovědi.

## Zaparkováno (neber, dokud Michal neposune výš)

- [ ] Deployment na VPS pticore (reverse proxy vhost, Postgres, zálohy) — až ke konci Fáze 1
- [x] Registrace Mapy.com API — hotovo (projekt „turistickechaty", tarif Basic, placená spotřeba zakázána); atribuce s logem se řeší v F0-07
- [ ] Formulář „nahrát otisk razítka" s moderací
- [ ] Newsletter setup
