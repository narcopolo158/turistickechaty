# Jmenovci: jak se rozlišují chaty téhož jména (DATA-17)

**Účel:** jedno pravidlo pro celý korpus, čím se od sebe odliší dva objekty se
shodným názvem — v názvu, v perexu, v URL a v těle článku. Sepsáno 26. 7. 2026
k položce DATA-17.

**Krátce:** rozlišovačem je **obec**, a nic jiného. Název objektu zůstává holý.
Rozlišovací věta se publikuje **jen tam, kde je jmenovec doložený pramenem** —
jinak zůstává v `interniPoznamky`. Hlídá to `scripts/kontrola/kolize-jmen.ts`.

---

## 1. Co měření ukázalo (a co z toho padlo)

Zadání DATA-17 stálo na dvou předpokladech a **oba měření převrátilo**. Je to
třetí položka v řadě po DATA-16 a DATA-18, u které se to stalo, takže to sem
patří napsané, ne uhlazené: kdo příště sáhne po backlogu, ať ví, že jeho věty
jsou návrh k ověření, ne zadání k provedení.

### Předpoklad 1: „jen v Krkonoších máme dvě dvojice objektů se shodným jménem"

Neplatí. Strojový sken celého korpusu přes **204 souborů, 130 profilů s názvem
a 89 různých objektů** hlásí **nula kolizí**. Ani jeden ze čtyř jmenovců, kvůli
kterým položka vznikla, v korpusu není — publikovaná je vždycky jen jedna půlka
dvojice a ta druhá stojí venku, mezi profily ani mezi kandidáty.

Naivní sken přitom napočítá zhruba čtyřicet „kolizí" a všechny jsou falešné:
je to tentýž objekt dvakrát, jednou jako publikovaný profil (`data/chaty/…`)
a jednou jako kandidát (`data/kandidati/…`). Proto se totožnost objektu počítá
jako `oblast/slug`, ne jako cesta k souboru.

Důsledek pro zadání: **z úklidu je prevence.** Pravidlo se nepíše pro dnešní
korpus, ale pro okamžik, kdy se druhá půlka dvojice do korpusu dostane — a ten
okamžik ohlídá stroj, ne čtenář.

### Předpoklad 2: „dvě dvojice"

Doložená je jedna a půl.

**Martinova bouda na Benecku — doložená.** Web obce Benecko ji vede jako rodinný
hotel s restaurací ve výšce 800 m; totéž nese krajský i regionální katalog
a další ubytovací servery. Je to jiný objekt v jiné obci, skoro o pět set metrů
níž. Poznámka nad rámec DATA-17: protože má veřejnou restauraci, **projde klíčem
zařazení a je to legitimní budoucí kandidát**, ne jen cizí jméno. Až se do
korpusu dostane, kolizi ohlásí stroj a pravidlo níže se použije poprvé naostro.

Že je jméno v terénu opravdu dvojznačné, potvrzuje i druhá strana: Kudy z nudy
vedou pod holým názvem „Martinova bouda" **náš** špindlerovský objekt.

**Lesní bouda ve Špindlerově Mlýně — nenalezena.** Čtyři vyhledávání nedala nic;
treking.cz má stránku „Lesní bouda" a jmenuje na ní jen objekt nad Pecí pod
Sněžkou. Česká Wikipedie je ze sandboxu nedostupná, ale OpenStreetMap označuje
náš objekt tagem `wikipedia: cs:Lesní bouda`, takže článek je o něm. V repozitáři
míří všechny výskyty jména na tentýž objekt.

**Odkud se to tvrzení vzalo — a to je vlastní nález položky.** `git log -S`
ukazuje, že do repozitáře vstoupilo commitem `0d728e2` (první povyšovací dávka)
jako holá věta v `interniPoznamky` **bez pramene**. Odtud ho převzal BACKLOG
i poznámka druhého profilu, obojí už jako hotovou věc, o kterou se dá opřít
další práce. Poučení: **konvence B platí i pro interní poznámky.** Nedoložená
věta v `interniPoznamky` není „zatím neověřený údaj" — je to pramen, ze kterého
začnou citovat ostatní dokumenty projektu, a po dvou krocích už nikdo nepozná,
že na začátku nestálo nic.

Zapisuje se proto jako **„hledali jsme a nenašli"**, ne jako „neexistuje".
Špindlerovská Lesní bouda klidně existovat může — historická, zaniklá, místním
jménem. Doložená ale není.

### Předpoklad 3 (můj vlastní, padl taky): „perex obec stejně jmenuje"

Pravidlo se mělo opřít o to, že perex obec už nese, takže by stačila věta v těle
článku. Census 42 publikovaných profilů to nepotvrdil — a stálo za to změřit ho
dvakrát, protože **první měření bylo špatně**:

| měření | jmenuje | nejmenuje | bez pole `obec` |
| --- | --- | --- | --- |
| shoda na podřetězci | 15 | 21 | 6 |
| shoda na kmenech slov | 23 | 13 | 6 |
| kmeny + oční kontrola | **27** | **9** | **6** |

První číslo srazila česká deklinace: perex Martinovy boudy říká „u Špindlerova
Mlýna", pole nese „Špindlerův Mlýn" a shoda na podřetězci to nenajde. Kmenová
shoda spravila většinu, ale zakopla o **střídání samohlásky v kořeni** — Důl →
Dolem, Dvůr → Dvoře — takže zbylo devět souborů k přečtení očima a čtyři z nich
obec jmenují („nad Černým Dolem", „v Dolním Dvoře", „nad Dolním Dvorem", „ve
Velké Úpě"). Na čtyřiceti dvou položkách je oční kontrola levnější než chytřejší
regulár; **kdyby jich byly stovky, chce to fold samohlásek, ne delší prefix.**

Závěr pro pravidlo: perex obec nejmenuje u devíti profilů ze čtyřiceti dvou
a u šesti není co jmenovat. Pravidlo tedy **musí říct, co má perex nést**, místo
aby se na dnešní stav spolehlo.

### Vedlejší nález: `obec` sama není vždy spolehlivá

Rozlišovač má smysl jen tak dobrý, jak je spolehlivé pole, o které se opírá.
Census ukázal dvě věci, které pravidlo musí unést.

**Za prvé, v horách čtenář orientuje podle osady, ne podle obce.** U pěti profilů
jmenuje perex jinou jednotku než pole `obec` — Pomezní Boudy místo Malé Úpy,
Velká Úpa místo Pece pod Sněžkou, Horní Lysečiny místo Malé Úpy. Většinou je to
v pořádku (osada je částí té obce) a Lovecká chata to dokonce sama vysvětluje:
„ve Velké Úpě, části Pece pod Sněžkou". Pravidlo to musí povolit, ne zakázat.

**Za druhé, `obec` může být sporná i vůči vnějším pramenům.** Dva doložené případy
z dnešního korpusu:

- **Lesní bouda** má `obec: Pec pod Sněžkou` podle vlastního webu boudy, ale
  firemní rejstřík u ní vede poštovní adresu v Černém Dole a ubytovací server ji
  řadí pod Pec pod Sněžkou, Černý Důl **i** Dolní Dvůr současně.
- **Lysečinská bouda** má `obec: Malá Úpa` z poštovní adresy „Horní Lysečiny 51,
  542 26 Malá Úpa" u Kudy z nudy, kdežto starší katalogový podklad uváděl Horní
  Maršov. Profil ten rozpor přiznává — ale **řeší ho nedoloženou glosou**, že
  „Horní Lysečiny jsou dnes částí Malé Úpy", a to místopisný rejstřík
  nepotvrzuje: vede Horní Lysečiny jako část **Horního Maršova**. Vypadá to na
  záměnu poštovní obce (PSČ) za obec administrativní. Glosa opravena na přiznanou
  neznalost; **ověření vedeno v BACKLOGu jako DATA-20**, protože jeden rejstřík
  proti jednomu médiu je spor, ne verdikt.

Obojí je pro pravidlo dobrá zpráva, ne špatná: rozlišovač se nemá vybírat podle
toho, které pole zní nejjistěji, ale podle toho, které je **doložené a opravitelné**.
`obec` je doložená v `overeniLokace` u 32 profilů ze 36, které ji mají — víc než
kterýkoli jiný kandidát.

---

## 2. Pravidlo

### R1 — `nazev` zůstává holý

Do pole `nazev` se rozlišovač **nepíše nikdy**. Ani „Martinova bouda
(Špindlerův Mlýn)", ani „Martinova bouda u Špindlerova Mlýna".

Dva důvody. Věcný: název objektu je údaj o objektu, ne naše pomůcka — bouda se
jmenuje Martinova bouda a přejmenovat ji nemůžeme. Provozní, a ten je horší:
`kolize-jmen.ts` porovnává právě `nazev`, takže **závorka v názvu kolizi zamaskuje**
a kontrola, která má na jmenovce hlídat, po prvním použití oslepne.

Nadpis stránky se tedy u jmenovců neliší. Odlišuje je až to, co je pod ním.

### R2 — rozlišovačem je `obec`, a nic jiného

Kde je rozlišovač potřeba (URL, rozlišovací věta), bere se hodnota pole `obec`.

**Proč ne nejbližší vrchol**, jak backlog navrhoval: v korpusu se vrchol
objevuje jen tam, kde ho nese pramen — Liščí hora u Lesní boudy, Zlaté návrší
u Vrbatovy boudy, Łabski Szczyt u polské chaty. Odvodit ho z GPS by znamenalo
vyrobit nový údaj, který žádný pramen neuvádí, a to konvence B zakazuje. Vrchol
tedy v próze zůstává tam, kde už doložený je, ale **rozlišovač z něj není**.

**Osada je povolená, obec je povinná.** Perex smí vést osadou, kterou profil
doloženou má (Pomezní Boudy, Velká Úpa, Horní Lysečiny), ale musí u ní říct, ke
které obci patří — vzorem je Lovecká chata: „ve Velké Úpě, části Pece pod
Sněžkou". Bez toho čtenář dvě boudy neodliší, protože osadu na mapě nenajde.

### R3 — perex profilu, který má doloženého jmenovce, obec jmenuje

Devět profilů ze čtyřiceti dvou dnes obec v perexu nemá. Dokud jmenovce nemají,
nic se neděje. **V okamžiku, kdy `kolize-jmen.ts` u profilu zahlásí kolizi, je
doplnění obce do perexu součástí té opravy**, ne pozdější úklid — perex je to
jediné, co čtenář uvidí ve výsledcích hledání.

### R4 — rozlišovací věta patří do těla článku a jen když je jmenovec doložený

Věta „existuje i jiná chata téhož jména" je tvrzení jako každé jiné. Publikuje se
tedy **jen s pramenem**, který ten druhý objekt doloží, a s odpovídajícím
záznamem ve `zdroje`. Bez pramene zůstává rozlišení v `interniPoznamky`.

Věta patří **do těla článku, ne do perexu**: perex má popisovat objekt, ne cizí
objekt. Formuluje se popisně, ne varovně — čtenáři se řekne, co ten druhý objekt
je a kde stojí, a ať si vybere.

Platí domácí zákazy prózy: **žádné domény, telefony, ceny, GPS ani čísla známek.**
Pramen se jmenuje v prvním pádě („web obce Benecko") a plná adresa jde do `zdroje`.

### R5 — `slug`: příponu obce dostává NOVÝ profil

Dokud je jmenovec mimo korpus, `slug` se nemění — jméno bez přípony patří tomu,
kdo je má. Až kolize nastane:

1. Nový profil dostane slug s příponou obce: `martinova-bouda-benecko`.
2. Starý profil si slug **ponechá**, aby se nerozbily živé adresy.
3. Rozlišovací věta se doplní na **obou** stranách, ne jen na nové.

Je to kompromis, a je poctivé říct proč: **lepší koncový stav je přejmenovat obě
strany** (`martinova-bouda-spindleruv-mlyn` i `-benecko`), aby žádná z nich
nevypadala jako ta „hlavní". To ale chce přesměrování ze staré adresy na novou,
které web zatím nemá. Až bude, pravidlo se překlopí na symetrické přejmenování;
do té doby platí asymetrická varianta, protože rozbitá adresa je horší vada než
nesymetrické URL.

### R6 — když `obec` chybí

Šest profilů pole `obec` nemá (pět polských a Bouda u Bílého Labe). Kdyby se
u některého objevil jmenovec, **rozlišovač se nevymýšlí**: doplní se `obec`
z pramene, a to je úkol pro DATA-04. Do té doby zůstává rozlišení interní —
publikovat „Schronisko X (někde u Szklarské Poręby)" bez pramene je přesně to,
čemu se celý projekt vyhýbá.

### R7 — když je `obec` sporná

Když se prameny o obci neshodnou, **rozlišovač se nepřehazuje na jiné pole**
a spor se nerozhoduje potichu. Publikuje se hodnota, kterou nese `overeniLokace`,
a **rozpor se v próze přizná** — přesně jak to dnes dělá Lysečinská bouda ve větě
o Malé Úpě proti Hornímu Maršovu.

Přiznaný rozpor je horší rozlišovač než jistota, ale je to pořád rozlišovač: dvě
boudy téhož jména se liší i tehdy, když u jedné z nich nevíme přesně, pod kterou
obec spadá.

---

## 3. Co z pravidla platí dnes

| dvojice | doložená? | co se udělalo |
| --- | --- | --- |
| Martinova bouda: Špindlerův Mlýn × Benecko | ano | rozlišovací věta **publikována** v těle článku + záznam ve `zdroje` |
| Lesní bouda: Pec pod Sněžkou × Špindlerův Mlýn | ne | tvrzení sneseno na „hledali jsme a nenašli" ve dvou profilech i v BACKLOGu |

Slugy se nezměnily ani u jedné dvojice — druhá půlka v korpusu není, takže R5
zatím nemá co spustit.

## 4. Co hlídá stroj

`scripts/kontrola/kolize-jmen.ts` projde `data/chaty/**` i `data/kandidati/**`,
seskupí profily podle jádra názvu (název bez typových slov „bouda", „chata",
„schronisko") a nahlásí každou skupinu, ve které je víc než jeden objekt.
Oddíl **A** je shodný celý název, oddíl **B** jen shodné jádro.

Na rozdíl od `ban-scan` a `audit-mech` tahle kontrola **rozhoduje**: jejich
ustálený stav je nenulový, kdežto tady je čistý stav přesně nula, takže každý
zásah je regrese a `npm run kontrola` na něm spadne. To je celý smysl —
pravidlo výš je k ničemu, když se na jmenovce přijde až od čtenáře.

Kontrola **nehlídá** dodržení pravidla samotného: že perex nese obec (R3), že
rozlišovací věta má pramen (R4) ani že slug dostal příponu (R5). To je redakční
práce spuštěná tím, že kontrola zahlásí. Nechat to tak je vědomé rozhodnutí —
strojově vynutitelná část je „všimni si", ne „naformuluj".
