# Redakční fronta — jak se rozhoduje a proč nic nezapadne

Zadání Michala (31. 7. 2026): *„udělej mi prostředí v adminu na výběr fotek…
zamysli se i nad povyšováním kandidátních chat celkově a systematicky a ujisti
se, že k tomu budu mít všechny potřebné nástroje a nic nám neproklouzne a nic
nezůstane nezpracované."*

Tenhle dokument popisuje výsledný systém: kde vzniká práce, jak se pozná, že
je hotová, a co systém **zatím nehlídá** (aby se na to nezapomnělo taky).

## Proč to bylo potřeba

Pipeline sype rychleji, než redakce stíhá. Jeden běh DATA-01 přinesl 147
kandidátních objektů, jeden běh DATA-02 skoro tři tisíce fotek. Dokud stav
rozpracovanosti nikde nestál, poznalo se jen ručním porovnáváním složek, co je
hotové a co leží — a tak se stalo, že 45 kandidátů Jizerek leželo týden.
Nikdo je nezahodil; jen na ně nebylo vidět.

## Základní princip: stav se ODVOZUJE z dat

Nikde se nevede druhý seznam „co je hotové". Ten by se rozešel s realitou
první den, kdy by někdo povýšil chatu ručně nebo smazal soubor.

| Stav objektu | Jak se pozná |
|---|---|
| **povýšen** | existuje `data/chaty/<oblast>/<slug>.yaml` |
| **vyřazen** | slug nebo OSM URL stojí v `data/kandidati/_vyrazeno.yaml` |
| **odložen** | slug stojí v `data/kandidati/_odlozeno.yaml` (s důvodem) |
| **nezpracován** | nic z toho → **leží ve frontě** |

U fotek totéž: **vybraná** je ta, která stojí v profilu chaty v bloku
`fotky:`; **odmítnutá** ta, která stojí v `data/kandidati/fotky/_rozhodnuti.yaml`;
zbytek čeká.

Zvlášť se tedy zapisují jen rozhodnutí, která z jiných dat poznat **nejdou** —
odložení a odmítnutí. Obojí je aktivní volba člověka, ne nepřítomnost práce,
a obojí **musí mít důvod** (kontrola to vynucuje).

## Nástroje

### 1. `/admin/fronta` — co ještě čeká

Čísla po oblastech, filtr podle stavu, u každého nezpracovaného kandidáta
signály z OSM (GPS, občerstvení, výška, odkaz do OSM) a dvě tlačítka:
**Odložit…** a **Vyřadit…** — obojí s povinným důvodem, který se zapíše do dat.

**Povyšovat se odsud nedá, a je to záměr.** Povýšení znamená křížové ověření
druhým pramenem (DATA-03), sepsání profilu se zdroji a datem kontroly — to je
redakční práce, ne jedno tlačítko. Fronta k ní dává podklad a hlídá, že se na
objekt nezapomene.

### 2. `/admin/vyber-fotek` — výběr fotky do profilu

Miniatury z Commons, silné nálezy (geotag u chaty) oddělené od slabých (pouhá
shoda jména), u každé autor, licence, rozměry, datum, popis a odkaz na stránku
souboru. Kliknutí otevře panel; po vyplnění **altu** se snímek zapíše do
profilu chaty se `verified: false`.

Dvě pojistky, které vypadají jako obtěžování a nejsou:

* **Alt je povinný a píše ho člověk.** Metadata říkají autora a licenci, ale ne
  to, CO je na snímku — a přesně tohle tvrzení jde na web (konvence B).
* **Odmítnutí vyžaduje důvod.** Jinak by se odmítnutý snímek vracel do fronty
  při každém dalším běhu DATA-02.

Slabé nálezy jsou schované schválně: kategorie i fulltext jsou shoda **jména**.
Chata Barborka si takhle přitáhla 50 snímků polské „Barbórky" (hornického
svátku v Bytomi), chata Barbora 28 portrétů herečky Barbory Štěpánové.

### 3. `npm run kontrola` → krok `fronta`

Obrazovku vidí jen ten, kdo si ji otevře; číslo v CI vidí každý. Report běží
při každé kontrole a vypisuje rozpracovanost i jmenný seznam profilů, kterým
Commons nenabídla vůbec nic.

**Jako vada (a tedy červená kontrola) se hlásí:** rozhodnutí bez důvodu,
odložený objekt, který už má profil, a rozhodnutí o fotce k neexistujícímu
objektu. Samotná rozpracovanost vada není — je to práce.

### 4. `scripts/fotky-prehlidka.ts` — kontaktní arch mimo admin

Statická HTML stránka s týmiž daty, k projití bez spuštěné aplikace. Zůstává
jako záloha a pro rychlé přehlédnutí celé nabídky.

## Kde se rozhodnutí ukládají

Zdrojem pravdy je **repozitář**, ne databáze — seed jede jedním směrem
(`data/**` → Payload). Kdyby prostředí ukládalo jen do DB, přepsal by to první
deploy a nikdo by nepoznal proč. Prostředí proto zapisuje do týchž YAML
souborů, které čte seed a hlídá `npm run kontrola`; rozhodnutí pak projde
běžnou cestou commit → CI → deploy a je po něm stopa v historii.

Z toho plyne omezení: **zápis funguje tam, kde je pracovní kopie repa** (tedy
lokálně, `npm run dev`). Na nasazeném webu je prostředí jen ke čtení a říká to
nahlas — proměnná `REDAKCE_ZAPIS` (výchozí: zapnuto ve vývoji, vypnuto
v produkci).

Zápis do YAML je **textový vpich**, ne přeparsování dokumentu: první verze
soubor načetla a vypsala zpátky, čímž přeformátovala dlouhé složené bloky a
diff jednoho přidaného snímku měl 97 změněných řádků. Teď mění jen to, co
přibylo.

## Co systém ZATÍM nehlídá

Poctivý seznam děr, ať se neztratí:

1. **Úplnost profilů.** Fronta hlídá, jestli profil vznikl a má fotku — ne
   jestli má GPS, otvírací dobu, kontakty nebo přístupové trasy. Chata může být
   „hotová" a přitom skoro prázdná.
2. **Stárnutí údajů.** `checked` se nikde nesleduje proti kalendáři; profil
   ověřený před rokem vypadá stejně jako včerejší. (Backlog: *Datová volatilita
   → kadence ověřování*.)
3. **Objekty, které OSM nemá.** Externí katalog vede tři jizerské objekty, které
   v exportu nejsou (DATA-31) — do fronty se nedostanou, protože kandidátní
   soubor pro ně nikdo nezaložil.
4. **Komunitní podání.** Otisky a fotky od čtenářů čekají jako koncepty
   v Payloadu; ve frontě zatím nejsou.
5. **Povýšení jedním klikem.** Vědomě chybí — viz výš.
