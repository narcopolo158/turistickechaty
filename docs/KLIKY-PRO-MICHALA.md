# Kliky pro Michala — co je připravené a čeká na spuštění

Vznikl 8. 8. 2026 na Michalovu otázku: *„pišes Beskydy a Jeseníky se rozjedou
hned po tvém kliku — co mam spustit?"* Ta otázka je oprávněná výtka: dosud
byly kliky rozesety po deníku a po backlogu a nikde nebyl jeden seznam.
Tady je.

**Jak se sem chodí:** GitHub → repozitář `turistickechaty` → záložka
**Actions** → v levém sloupci vyber workflow podle jména → tlačítko **Run
workflow** vpravo → vyplň políčko a potvrď zeleným **Run workflow**.

**Proč to vůbec musíš klikat ty:** denní session běží v sandboxu, který na
Overpass API ani na většinu mapových služeb nedosáhne (proxy vrací HTTP 000).
GitHub Actions dosáhne. Sandbox proto pipeline napíše a otestuje, ale
nespustí. Ověřeno znovu 8. 8. 2026.

**Údržba tohoto souboru:** hotový klik se odsud VYMAŽE a jeho výsledek se
zapíše do deníku, ne aby tu zůstal odškrtnutý. Seznam má být krátký a mít
pravdu — dlouhý seznam s odškrtnutými řádky se přestane čtít.

---

## 1. DATA-01 pro nové oblasti

Beskydy i Jeseníky máš odklikané (8. 8. 2026, 385 a 122 kandidátů) — díky.
Zbývá šest oblastí. U obou tatranských to znamená „nemají zatím ani jednoho
kandidáta"; u zbylých čtyř už kandidáti JSOU (přišli omylem s beskydským
exportem, protože běžel podle širokého okna), ale jen ti z podhůří — vlastní
běh s vlastním oknem přinese hřebeny, které beskydské okno vůbec nepokrývalo.

| workflow | políčko `oblast` | co to udělá |
|---|---|---|
| **DATA-01: OSM export chat (dle oblasti)** | `vysoke-tatry` | Vysoké a Belianske Tatry (SK, PL) — **nejcennější klik ze všech**: katalog tu vede 14 slovenských vysokohorských chat a 4 polská schroniska PTTK, u většiny s doloženým rokem vzniku i stavitelem. Kandidáta tam zatím nemáme ani jednoho |
| **DATA-01: OSM export chat (dle oblasti)** | `nizke-tatry` | Nízké Tatry (SK) — 80 km hřebene od Donovalů po Kráľovu hoľu; katalog v okně vede 14 objektů a mezi nimi **čtyři turistické útulny**, což je pro průvodce skupina, jaká se dosud nikde neopakovala |
| **DATA-01: OSM export chat (dle oblasti)** | `javorniky-vsetinske-vrchy` | stáhne kandidáty Javorníků a Vsetínských vrchů (CZ, SK) — oblast vznikla 8. 8. 2026 tvým rozhodnutím, že nepatří pod Beskydy; 36 kandidátů už tam je z beskydského exportu |
| **DATA-01: OSM export chat (dle oblasti)** | `mala-fatra` | Malá Fatra (SK) — 59 kandidátů z beskydského exportu už v repu je, ale všichni z okolí Terchové; běh přinese Lúčanskou část, Martinské hole a hřeben pod Veľkým Kriváňom |
| **DATA-01: OSM export chat (dle oblasti)** | `oravska-magura` | Oravská Magura (SK) — 6 kandidátů v repu; běh přinese podcelky Paráč a Budín |
| **DATA-01: OSM export chat (dle oblasti)** | `zapadne-tatry` | Západné Tatry / Roháče (SK, PL) — 13 kandidátů v repu, všichni z podhůří u Zuberce; běh přinese hřebenové chaty a polská schroniska |

Kdybys chtěl klikat jen část, **začni Vysokými Tatrami**: je to nejbohatší
chatařská síť, jakou průvodce dosud bral, a zbytek slovenských oblastí na ní
nijak nezávisí. Kandidáti se ze sousedních oken navzájem nezaloží dvakrát —
od 8. 8. 2026 to drží DATA-36 (objekt vedený jinou oblastí se v překryvu oken
přeskočí a napíše se to do reportu).

Políčko `api` nech prázdné — skript sám zkouší `overpass-api.de` a při
selhání zrcadlo `kumi.systems` (fallback přibyl 20. 7. 2026 kvůli rate
limitu na IP runnerů).

Běh commitne do repa surový JSON export jako doklad i hotové YAML kandidátů
do `data/kandidati/<oblast>/`. **Kandidáti NEJSOU na webu** — seed čte jen
`data/chaty/**`; na web se povyšují ručně po křížovém ověření. Opakované
spuštění je idempotentní, přidá jen nově vzniklé objekty.

Co dělat po běhu: nic, další session si výstup přebere, projede triáží
a začne povyšovat. V summary běhu je report — kdyby tam bylo nula objektů
nebo pád, stačí to zmínit.

## 2. DATA-06 výšky přístupových tras — Šumava

| workflow | políčko `oblast` |
|---|---|
| **DATA-06: výšky přístupových tras (dle oblasti)** | `sumava` |

Čeká na to **čtrnáct nových šumavských profilů** povýšených 6.–8. 8. 2026
(Kurzova věž, Kleť, Rozhledna Špičák, Geisskopfhütte, sektor.f Hauptturm
a devítka bavorských Berggasthofů z 8. 8.). Bez tohohle běhu mají jejich
přístupové trasy prázdné výškové profily a chybí orientační čas dle
DIN 33466. Klíč Mapy.com je v Actions jako secret `MAPY_API_KEY` (nastaven
20. 7. 2026), takže nic vyplňovat nemusíš.

## 3. DATA-35 výška obce u středisek — Jizerské hory

| workflow | políčko `oblast` |
|---|---|
| **DATA-35: výška obce u středisek (dle oblasti)** | `jizerske-hory` |

Poslední oblast, které chybí výšky středisek z referenčního bodu. Krkonoše
i Ještědský hřbet už doběhly (4. 8. 2026), u Ještědu čistě.

## 4. DATA-28 3D terén — Krkonoše

| workflow | políčko `oblast` |
|---|---|
| **DATA-28: 3D terén (dle oblasti)** | `krkonose` |

Čeká nejdéle ze všeho (od 27. 7. 2026). Skript je hotový včetně lesů,
sjezdovek, panoramatického režimu a animovaného turisty; všechny vrstvy mají
retry a fallback na data z posledního úspěšného běhu, takže série pádů
z konce července už build neshodí. Po běhu se posoudí velikost JSON,
čitelnost tras a jestli z toho udělat interaktivní sekci webu.

---

## Co NEČEKÁ na klik, ale čeká na tebe jinak

Pro úplnost, ať je na jednom místě i to, co se klikem nevyřeší:

- **Telefonáty (DATA-04).** Podklady drží `docs/TELEFONATY-KRKONOSE.md`.
  Nejžhavější trojice: Kurzova věž +420 722 166 875 (je hospůdka u věže
  a Chata Čerchov jeden provoz?), Kleť +420 724 700 300 (kapacita lůžek,
  mimosezónní provoz), Špičák +420 376 397 167 (vstupné, a jestli je areál
  totožný s katalogovou „Chatou na Špičáku").
- **Výběr fotek v adminu.** `/admin/vyber-fotek`, 31 profilů čeká. Ze
  sandboxu se nedá rozhodnout, co je na snímku.
- **Rozhodnutí o rozsahu a o konvencích.** Otevřené otázky vede vždy
  poslední zápis v `docs/DENIK.md` v oddílu „Otázky pro Michala".
