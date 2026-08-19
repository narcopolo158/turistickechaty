# DATA-05 · Koš C — rozpouštění dohledávkami

Koš C z triáže razítkového checklistu (`docs/DATA-05-razitka-triaz.md`) drží
jména, která **leží v okně některé už založené oblasti, ale náš OSM export je
nemá**. Každé jméno je buď doložená mezera v korpusu, nebo objekt, který
klíčem zařazení neprojde — a to se pozná jen dohledávkou u pramenů.

Pravidla stejná jako u koše E: **do `data/` se nesahá**, všechno níž je
podklad s prameny. Cokoli by se odtud zapisovalo, je `verified: false`
(konvence B) s `checked` dle data dohledávky.

---

## Stav položek

| položka | oblast | stav | rozhodnuto |
|---|---|---|---|
| Schronisko Liczyrzepa | krkonose | **klíčem NEPROJDE** — návrh vyřazení | 19. 8. 2026 |
| Chata Paprsek | jeseniky | **doložená mezera v korpusu** | 19. 8. 2026 |
| Turistická chata Trosky | cesky-raj | nedohledáno, zůstává ve frontě | — |
| Schronisko Wysoki Kamień | jizerske-hory | čeká | — |
| Amselfall - Amselfallbaude | ceskosaske-svycarsko | čeká | — |
| Bouda Svornost | jeseniky (přesun z koše E) | čeká | — |
| beskydská sedmička | beskydy | patří k DATA-37 (re-export) | — |

---

## 1 · Schronisko Liczyrzepa (Karpacz) — klíčem zařazení NEPROCHÁZÍ

*Dohledáno 19. 8. 2026, pramen naszesudety.pl.*

| údaj | hodnota |
|---|---|
| adresa | Karpacz, ul. Skalna 45 (tedy **uvnitř města**, ne na hřebeni) |
| typ | **Szkolne Schronisko Młodzieżowe** — celoroční školské zařízení |
| kapacita | 50 lůžek v pokojích pro 2–6 osob |
| stravování | „wyposażoną kuchnię, w której można przygotować własne posiłki"; jídlo na objednávku **v sousedním penzionu** („Smaczne posiłki na zamówienia w pensjonacie po sąsiedzku") |
| kontakt | tel. 75 761 92 90, szkolne@schronisko-liczyrzepa.pl |

**Proč to rozhoduje:** klíč zařazení stojí na **občerstvení pro veřejnost
a roli na trase**. Tenhle pramen říká obojí naopak — vlastní kuchyň pro
samoobslužné vaření a jídlo objednávané u souseda znamená, že objekt sám
občerstvení neposkytuje, a adresa v ulici v Karpaczi ho nestaví na trasu.
Polské slovo *schronisko* tu neznamená horskou chatu, ale mládežnickou
noclehárnu (PTSM) — **stejná past jako „Szkolne Schronisko Młodzieżowe
Rajcza - Nickulina" v beskydské části koše C**; obě je proto potřeba
posuzovat podle obsahu, ne podle slova v názvu.

**Návrh:** zapsat do `data/kandidati/_vyrazeno.yaml` s tímto zdrojem.
**Nezapisuji sám** — vyřazení je redakční rozhodnutí a doklad je z jednoho
pramene (vlastní web `schronisko-liczyrzepa.pl` ze sandboxu nečten).
Otázka pro Michala v deníku.

---

## 2 · Chata Paprsek (Velké Vrbno) — doložená mezera v jesenickém korpusu

*Dohledáno 19. 8. 2026; prameny: náš vlastní katalog, sumperk.cz,
staremesto.info.*

| údaj | hodnota | pramen |
|---|---|---|
| katalogový záznam | **HUT-0055** „Horská chata Paprsek", Rychlebské hory, oblast Paprsek, nejbližší uzel Staré Město pod Sněžníkem, **jistota A**, stav aktivní, stravování ano, provoz celoročně, `Ověřeno k: 2026-07-21` | `data/externi/katalog-cr-sk-2026/katalog.json` (zdroj kct.cz) |
| výška | **1 022 m** | katalog i sumperk.cz („v nadmořské výšce 1022 metrů nad mořem") |
| adresa | Velké Vrbno 27, Staré Město, 788 32 | sumperk.cz |
| poloha | „na rozhraní tří horských celků: Hrubého Jeseníka, Rychlebských hor a Králického Sněžníku" | staremesto.info |
| restaurace | „Restaurace se nachází přímo v chatě Paprsek", **70 míst + 50 na terase**, jídelna pro hosty 55 míst | staremesto.info |
| ubytování | pokoje pro 2–5 osob | sumperk.cz |
| historie | postavena **1932**, původně **„Slezský Dům" (Schlesierhaus)**; na svou dobu ústřední topení, vlastní elektrárna, studna, teplá i studená voda na pokojích | staremesto.info |
| kontakt | +420 777 076 542, info@paprsek.cz | sumperk.cz |

**Klíčem zařazení prochází bez pochybností:** restaurace přímo v chatě
s vlastní kapacitou pro hosty zvenčí, KČT chata, aktivní, na hřebeni nad
Velkým Vrbnem.

**Že je to mezera, je změřeno, ne odhadnuto:** v `data/kandidati/jeseniky/`
je 122 kandidátů a **ani jeden se nejmenuje Paprsek**; jméno nemá 0 výskytů
ani v hlavním exportu `_overpass-export-cz.json`, ani v jmenné vrstvě
`_overpass-dle-jmen-cz.json`. Poloha přitom leží uvnitř okna oblasti
(bbox jeseniky 49.93–50.42 / 16.75–17.55) a Rychlebské hory i Králický
Sněžník jsou v `katalogPohori` téže oblasti.

**Hypotéza, proč propadla i jmenná vrstva** (neověřená — na OSM ze sandboxu
nedosáhnu): objekt je v OSM nejspíš veden jako **hotel** a pod jménem
*Horský hotel Paprsek* (tak ho titulkuje i Wikipedie), takže na slovo
„chata" v názvu se nechytí. Jestli to platí, je to **měřitelná mezera jmenné
vrstvy dotazu**, ne jednorázová náhoda — a týká se všech objektů, které
katalog vede jako chatu, kdežto OSM je pojmenoval hotelem.

**Drobný rozpor k dořešení:** katalog vede web `paprsek.net`, portály
i e-mail ukazují na `paprsek.cz`. Doména z katalogu ze sandboxu ověřena
nebyla (robots.txt).

**Nezakládám kandidáta ručně** — stejná úvaha jako u krkonošských mezer
18. 8.: poctivější je pustit export znovu (tady by ale musela napřed padnout
odpověď na hypotézu výše, protože samotný re-export by objekt s „hotelem"
v názvu nemusel přinést). Otázka pro Michala v deníku.

---

## 3 · Turistická chata Trosky — nedohledáno

Hledání pod tímto jménem vrací jen **Hotel Trosky** v Rovensku pod Troskami
a **Bistro Pod Troskami**; ani jeden není „Turistická chata Trosky"
z razítkového checklistu. Zůstává ve frontě — nejspíš půjde o razítkové místo
u hradu, které se dnes jmenuje jinak, a bez detailu razítka se to nepozná
(týž případ jako koš G).
