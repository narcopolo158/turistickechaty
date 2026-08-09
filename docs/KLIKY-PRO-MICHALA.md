# Kliky pro Michala — co je připravené a čeká na spuštění

Vznikl 8. 8. 2026 na Michalovu otázku: _„pišes Beskydy a Jeseníky se rozjedou
hned po tvém kliku — co mam spustit?"_ Ta otázka je oprávněná výtka: dosud
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

> **Stop-stav z 9. 8. večer VYŘEŠEN týž večer:** Actions padaly na
> vyčerpaném billingu privátního repa; Michal repo přepnul na public
> (minuty zdarma) a kliky zase jedou — DATA-32 doběhl týž večer pro
> všechny tři oblasti (vysoke-tatry, nizke-tatry, beskydy; commity
> 3b4b8c3, e1f4956, 62dc1a3) a jeho oddíl je odsud vymazán jako hotový.
> Poučení pro příště: velké běhy (DATA-02 přes celý korpus, DATA-28)
> umí spálit stovky minut.

---

## 1. DATA-01 pro nové oblasti

Odklikané máš Beskydy, Jeseníky, Vysoké Tatry, Malou Fatru (8. 8.)
a od večera 9. 8. i Krušné hory (+300), Orlické hory (+50) a Veľkou
Fatru (+45) — díky! Kolize z nich jsou rozhodnuté a katalogové pokrytí
je hned napoprvé skvělé (Orlické hory 8/8 objektů).

Zbývá šest oblastí: Slovenský raj, Lužické hory a Bieszczady bez
jediného kandidáta — a Javorníky, Oravská Magura a Západné Tatry, kde
kandidáti JSOU, ale jen ti z podhůří (přišli omylem s beskydským
exportem; vlastní běh s vlastním oknem přinese hřebeny).

| workflow                                   | políčko `oblast`            | co to udělá                                                                                                                                                                                  |
| ------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DATA-01: OSM export chat (dle oblasti)** | `javorniky-vsetinske-vrchy` | stáhne kandidáty Javorníků a Vsetínských vrchů (CZ, SK) — oblast vznikla 8. 8. 2026 tvým rozhodnutím, že nepatří pod Beskydy; 36 kandidátů už tam je z beskydského exportu                   |
| **DATA-01: OSM export chat (dle oblasti)** | `oravska-magura`            | Oravská Magura (SK) — 6 kandidátů v repu; běh přinese podcelky Paráč a Budín                                                                                                                 |
| **DATA-01: OSM export chat (dle oblasti)** | `zapadne-tatry`             | Západné Tatry / Roháče (SK, PL) — 13 kandidátů v repu, všichni z podhůří u Zuberce; běh přinese hřebenové chaty a polská schroniska                                                          |
| **DATA-01: OSM export chat (dle oblasti)** | `slovensky-raj`             | Slovenský raj (SK) — **nová oblast z 8. 8. 2026**; krasová plošina s roklinami, 6 katalogových objektů. Je to první oblast korpusu s jednosměrnými trasami a vstupným                        |
| **DATA-01: OSM export chat (dle oblasti)** | `luzicke-hory`              | Lužické hory se saskými Žitavskými horami (CZ, DE) — **nová oblast z 8. 8. 2026**; 5 katalogových objektů. Na Hvozdu stojí chata i rozhledna na německé straně, ale chodí se k nim i z Česka |
| **DATA-01: OSM export chat (dle oblasti)** | `bieszczady`                | Bieszczady vč. slovenských Bukovských vrchů (PL, SK) — **nová oblast z 8. 8. 2026** a nejvýchodnější v korpusu; 10 katalogových objektů, mezi nimi bacówky PTTK a Chatka Puchatka            |

Kdybys chtěl klikat jen část, **začni Bieszczadami nebo Slovenským
rájem** — obě oblasti mají katalogové objekty a zatím nula kandidátů.
Kandidáti se ze sousedních oken navzájem nezaloží dvakrát — drží to
DATA-36. A pořád platí: **každý export přinese nová jména, a tím i nové
jmenné kolize, které shodí `npm run kontrola`** (kontrola kolizí
rozhoduje a čistý stav je přesně nula). Není to porucha běhu, je to
práce pro další session — večerní čtyřka exportů jich přinesla 22
a všechny jsou rozhodnuté.

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

## 2. DATA-02 fotky chat — druhý běh pro nové oblasti (9. 8. 2026)

| workflow                                    | políčko             |
| ------------------------------------------- | ------------------- |
| **DATA-02: fotky chat z Wikimedia Commons** | `radius` nech `300` |

První běh (4. 8. 2026) pokryl Krkonoše, Jizerky a Ještědský hřbet — z jeho
commitnutých metadat jsem 9. 8. přiřadil deset fotek bez jediného dotazu.
Jenže od té doby přibylo přes 60 profilů v ŠUMAVĚ, BESKYDECH a VYSOKÝCH
TATRÁCH, které kandidátní fotky nemají vůbec. Běh jede přes všechny objekty
najednou (políčko oblasti nemá) a potrvá dlouho; kdyby summary hlásilo
„NEUPLNY_BEH", stačí ho spustit znovu — je idempotentní.

## 4. DATA-06 výšky přístupových tras — Šumava

| workflow                                           | políčko `oblast` |
| -------------------------------------------------- | ---------------- |
| **DATA-06: výšky přístupových tras (dle oblasti)** | `sumava`         |

Čeká na to **čtrnáct nových šumavských profilů** povýšených 6.–8. 8. 2026
(Kurzova věž, Kleť, Rozhledna Špičák, Geisskopfhütte, sektor.f Hauptturm
a devítka bavorských Berggasthofů z 8. 8.). Bez tohohle běhu mají jejich
přístupové trasy prázdné výškové profily a chybí orientační čas dle
DIN 33466. Klíč Mapy.com je v Actions jako secret `MAPY_API_KEY` (nastaven 20. 7. 2026), takže nic vyplňovat nemusíš.

## 5. DATA-35 výška obce u středisek — Jizerské hory

| workflow                                          | políčko `oblast` |
| ------------------------------------------------- | ---------------- |
| **DATA-35: výška obce u středisek (dle oblasti)** | `jizerske-hory`  |

Poslední oblast, které chybí výšky středisek z referenčního bodu. Krkonoše
i Ještědský hřbet už doběhly (4. 8. 2026), u Ještědu čistě.

## 6. DATA-28 3D terén — Krkonoše

| workflow                            | políčko `oblast` |
| ----------------------------------- | ---------------- |
| **DATA-28: 3D terén (dle oblasti)** | `krkonose`       |

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
