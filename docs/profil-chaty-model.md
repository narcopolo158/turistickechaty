# Obsahový model profilu chaty (kanonická struktura)

**Účel:** zamknout **strukturu a údaje profilu** dřív, než začne design session v2
(„Sběratelský zápisník"). Design pak kreslí nad pevným modelem, ne naopak.
**Stav:** návrh k odsouhlasení Michalem. Vychází z reálného stavu (Payload kolekce
`Chaty` + datové vrstvy DATA-06/09/10/11 + kolekce Razitka/Fotky).

## 0. Principy (z konceptu v2)

- **Profil = „list z deníku".** Metafora: *každá chata má svůj list, každá návštěva
  zanechá stopu.*
- **Dvě vrstvy hustoty:** **veřejný profil** (čistý, faktický, skenovatelný) vs.
  **osobní zápisník** (přihlášený — razítka, poznámky, vzpomínky). Dekorace roste
  s osobní vrstvou, ne ve veřejném katalogu.
- **Každý prvek patří do jedné kategorie:** **I** = Informace (rychlá, přesná) ·
  **A** = Artefakt (faux-3D fyzický objekt) · **V** = Vzpomínka (osobní, emoční).
- **Volatilita řídí ověřování:** **S** = stabilní (ověřit jednou) · **P** = proměnlivé
  (roční audit) · **D** = velmi dynamické (stárne nejrychleji).
- **Poctivost:** každý věcný údaj nese zdroj a datum; `verified` odlišuje redakčně
  ověřené od převzatého. Stav ověření je **viditelný designový prvek**, ne patička.

## 1. Mapa sekcí profilu

Pořadí = návrh toku „listu". Sloupce: **Vrstva** (veřejná/osobní), **Kat.** (I/A/V),
**Vol.** (S/P/D), **Přítomnost** (vždy / když doloženo / volitelné), **Zdroj dat**.

| # | Sekce | Vrstva | Kat. | Vol. | Přítomnost | Zdroj dat (kde už je / plán) |
|---|---|---|---|---|---|---|
| 1 | **Identita** — název, historické/cizí názvy, typ, stav, země→pohoří→oblast | veř. | I | S (stav P) | vždy | Chaty: nazev, aliasy, typ, stav, zeme, oblast |
| 2 | **Hero + řádek faktů** — hlavní fotka, výška, „otevřeno", nocleh, „ověřeno" | veř. | I + A(hero) | mix | vždy | Fotky (hero), Chaty: vyska, sezona, kapacita, overeni |
| 3 | **Charakteristika (perex + 2–4 odst.)** — kdo/co/proč, tón „byl jsem tam" | veř. | I | S | vždy (redakční) | Chaty: perex, text |
| 4 | **Provoz** — sezóna, otvíračka, stav dnes, „poslední objednávka" | veř. | I | **D** | když doloženo | Chaty: sezona, otviraciDoba, provoz; + stav ověření |
| 5 | **Nocleh** — ano/ne, kapacita, typy pokojů, ceny „od", rezervace | veř. | I | P | když doloženo | Chaty: nocleh, kapacita, pokoje, cenyOrientacne |
| 6 | **Občerstvení** — kuchyně, specialita, otevírací doba kuchyně | veř. | I | P/D | když doloženo | Chaty: kuchyne, specialita |
| 7 | **Služby** — voda, WC, karta, wifi, psi, nabíjení, lyžárna (+ nová: nouzové přespání, zimní místnost, bez rezervace, signál, bezbariér/kočárek) | veř. | I | P | vždy (i „nezjištěno") | Chaty: sluzby (rozšířit — backlog) |
| 8 | **Odkud vyjít** — nástupy, km, čas, převýšení, značení po úsecích, doprava, zdroje | veř. | I (švýc. infografika) | S geom / D doprava | když má trasy | `pristupove-trasy.json` (DATA-06) |
| 9 | **Sousední chaty / přechody** — nejbližší chaty, km (čas později) | veř. | I | S | když má sousedy | `prechody.json` (DATA-06) |
| 10 | **Sběratelská místa** — razítko (otisk), turistická známka, vizitka + stav dostupnosti | veř. + osob. | **A** | D (dostupnost) | když existují | Razitka; `znamky-vizitky/krkonose.json` (DATA-10) |
| 11 | **Historie** — rok vzniku, časová osa milníků, dobové pohlednice (líc/rub) | veř. | I + A(pohlednice) | S | když doloženo | Chaty: rokVzniku, milniky; Fotky (typ dobova) |
| 12 | **Zajímavosti / „nej"** — superlativy a kuriozity se zdrojem | veř. | I | S | volitelné | Chaty: zajimavosti (DATA-09) |
| 13 | **Média** — galerie (exteriér/interiér/jídlo/výhledy/zima), pohlednice | veř. | A/V | — | když jsou fotky | Fotky (typ) |
| 14 | **Mapa** — turistická mapa s chatou, nástupy, čarami tras | veř. | I | — | vždy (má GPS) | Mapy.com outdoor + geometrie tras |
| 15 | **Zdroje a ověření** — přehled zdrojů + datum/typ ověření | veř. | I (motiv) | — | vždy | Chaty: overeni bloky (source/verified/checked) |
| 16 | **Osobní stopa** — navštíveno, získané razítko, osobní poznámka, vlastní fotka | **osob.** | **V** | — | přihlášený (Fáze 4) | Uživatel + Návštěva (plán) |

## 2. Minimální profil (co je vždy, i u „tenké" chaty)

Slib úplnosti = žádný profil nejde ven pahýlový. **Vždy přítomné:** identita (1),
hero nebo důstojný placeholder + výška + pohoří (2), aspoň krátká charakteristika
(3), mapa (14), sekce Zdroje/ověření (15). Vše ostatní se zobrazí, **jen když je
doloženo** — chybějící sekce se **nezobrazí prázdná** (žádné „neuvedeno" pole vedle
pole; radši sekci vynechat a poctivě přiznat v „co ještě doplňujeme").

## 3. Volatilita → kadence ověřování

- **Stabilní (S)** — GPS, výška, rok vzniku, historie, typ, pohoří. Ověřit jednou,
  pak neřešit.
- **Proměnlivé (P)** — telefon, e-mail, kapacita, sezóna, služby, ceny. **Roční
  audit před sezónou.**
- **Velmi dynamické (D)** — otevřeno dnes, menu, dostupnost razítka, stav lanovky,
  uzavírky. Stárnou nejrychleji → nejviditelnější stav stáří údaje.

Design má pro každou volatilitu jiný „stav ověření" (viz níže). Toto je zároveň
backlogová položka „datová volatilita" — sem se zamkne.

## 4. Stavy ověření (viditelný designový prvek)

Malý přesný znak u proměnlivého/dynamického údaje:

- **Ověřeno redakcí** — telefonát/oficiální web (`verified: true`).
- **Ověřeno provozovatelem** — až budou účty chatařů (P7).
- **Potvrzeno návštěvníky** — komunitní hlášení (× počet nezávislých potvrzení).
- **Převzato ze zdroje** — `verified: false`, s odkazem (výchozí stav dnes).
- **Údaj starší 12 měsíců / provoz nepotvrzen / historický údaj** — poctivé
  varování u zastarávajících dynamických polí.

Každý údaj → hover/rozklik ukáže **přesný zdroj + datum**. „Ověřeno" v řádku faktů
bere nejnovější `checked` napříč bloky.

## 5. Sběratelská vrstva (Artefakt) — datový model

Tři objekty, každý má **stav dostupnosti** (à la „razítko dnes"):

- **Razítko** (kolekce Razitka): otisk/sken, kde se razítkuje, období, stav
  (k dispozici / historické), způsob získání (vlastní / převzato se svolením + zdroj),
  více variant (současné/historické/výroční).
- **Turistická známka** (DATA-10): číslo, oficiální název, detail URL, stav
  (aktivní/vyřazená), náhled *jen po svolení vydavatele* (čeká na odpověď firem).
- **Turistická vizitka** (DATA-10): kód, detail URL, stav, náhled *jen po svolení*.

Ve veřejném profilu: číslo + odkaz + stav (máme). Faux-3D náhledy + „sebráno/
nesebráno" sloty → osobní zápisník (Fáze 4/6).

## 6. Přeshraniční a jazyk

Polské chaty: **originální (místní) název primární**, český/německý do historických
názvů. Model počítá s `zeme` a do budoucna s jazykovými verzemi (pole se překládají
dřív než redakční texty). Historické názvy (DE/PL) jsou u starých bud klíč k dohledání.

## 7. Validační sada pro design session (5 profilů)

Design se musí ověřit nejen na vlajkových, ale i na běžných/neúplných:

1. **Luční bouda** — bohatý ikonický profil (vše: data, trasy, razítko, známka+vizitka, historie, zajímavosti).
2. **Vosecká bouda** — tradiční jednodušší (sezónní, bez elektřiny; známka+vizitka).
3. **Schronisko Samotnia (PL)** — přeshraniční, polský název, změna nájemce (dynamika).
4. **zaniklá** (např. Obří bouda) — historická vrstva, stav „zaniklá", žádný provoz.
5. **řídká chata** (málo dat, bez hero fotky) — test minimálního profilu, ať design nespadne na neúplnosti.

## 8. Otevřené otázky (k rozhodnutí před/na session)

1. **Dvoustrana levá/pravá** vs. **jednosloupcový tok** jako výchozí (desktop) —
   dvoustrana je hezká, ale musí přežít na mobilu a nezdvojit obsah.
2. **Kolik sekcí „nad čarou"** (bez scrollu): identita + hero + fakta + provoz +
   sběratelský pruh? Určit prioritu.
3. **Provoz „dnes"** potřebuje zdroj živých dat (chataři/komunita) — do té doby
   ukazovat jen „obvykle otevřeno" + stáří údaje (nikdy falešné „otevřeno").
4. **Osobní vrstva** je Fáze 4 (účty) — v modelu je, ale profil musí být plnohodnotný
   i **bez přihlášení**.
5. **Rozšíření Služeb** (nová pole) + **žebříčky „nej"** (data hotová) — zapnout teď,
   nebo až se session? Doporučuji data-pole zavést teď, vizuál doladit v session.

---

*Až tohle Michal odsouhlasí (nebo upraví), je to pevný podklad pro design session:
design kreslí nad známou strukturou a otestuje ji na 5 reálných profilech.*
