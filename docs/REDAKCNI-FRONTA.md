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

### 3. Pohled „mezery v profilech"

Fronta hlídá i to, co objektu chybí, **ačkoli už na webu stojí**: GPS (bez ní
se nedostane na mapu), kontakt, otvírací doba, přístupová trasa (z výstupu
DATA-06) a fotka. U každého profilu ukazuje i **nejstarší `checked`** napříč
bloky ověření — podle něj se pozná stárnutí. Nic z toho nespadne samo, tak to
musí někdo počítat.

### 4. `npm run kontrola` → krok `fronta`

Obrazovku vidí jen ten, kdo si ji otevře; číslo v CI vidí každý. Report běží
při každé kontrole a vypisuje rozpracovanost i jmenný seznam profilů, kterým
Commons nenabídla vůbec nic.

**Jako vada (a tedy červená kontrola) se hlásí:** rozhodnutí bez důvodu,
odložený objekt, který už má profil, a rozhodnutí o fotce k neexistujícímu
objektu. Samotná rozpracovanost vada není — je to práce.

### 5. `scripts/fotky-prehlidka.ts` — kontaktní arch mimo admin

Statická HTML stránka s týmiž daty, k projití bez spuštěné aplikace. Zůstává
jako záloha a pro rychlé přehlédnutí celé nabídky.

## Kde se rozhodnutí ukládají

Zdrojem pravdy je **repozitář**, ne databáze — seed jede jedním směrem
(`data/**` → Payload). Kdyby prostředí ukládalo jen do DB, přepsal by to první
deploy a nikdo by nepoznal proč. Prostředí proto zapisuje do týchž YAML
souborů, které čte seed a hlídá `npm run kontrola`; rozhodnutí pak projde
běžnou cestou commit → CI → deploy a je po něm stopa v historii.

Zápis má proto **dva režimy** (rozhodnutí Michala 31. 7. 2026: *„prostředí bych
chtěl používat z adminu"*):

* **`github`** — commit přes GitHub API. Tak to jede na nasazeném webu:
  kontejner pracovní kopii nemá, takže rozhodnutí jde rovnou do repa a v číslech
  se projeví po nejbližším nasazení. Zapíná ho `REDAKCE_GITHUB_TOKEN`
  + `REDAKCE_GITHUB_REPO`; token je jemnozrnný PAT s právem *Contents: Read and
  write* na tenhle repozitář a nikde jinde nemá co dělat.
* **`disk`** — zápis do pracovní kopie, když prostředí běží lokálně
  (`npm run dev`). Rychlejší smyčka: rozhodnutí je vidět hned, commit je ruční.

Když není nastavené ani jedno, prostředí je jen ke čtení a **říká to nahlas** —
tichá ztráta rozhodnutí je to nejhorší, co může redakční nástroj udělat. Režim
je vidět v barevném pruhu nahoře na obou obrazovkách.

Dvě věci, na kterých v režimu `github` stojí, jestli se práce neztratí:

1. **Čte se ze stejného místa, kam se zapisuje.** Soubory v kontejneru jsou ze
   stavu při buildu a mezitím mohl přijít cizí commit (noční běh pipeline).
   Před každým zápisem se proto načte aktuální obsah z API i s jeho `sha`.
2. **`sha` je zámek.** Když mezi čtením a zápisem někdo commitne, GitHub vrátí
   409 — a prostředí zopakuje **celý** postup nad čerstvým obsahem. Slepé
   opakování zápisu by cizí práci přepsalo.

Spojení se ověřuje hned při otevření prostředí, ne až při zápisu: chybu
oprávnění je lepší vidět dřív, než člověk vyplní popis snímku.

Zápis do YAML je **textový vpich**, ne přeparsování dokumentu: první verze
soubor načetla a vypsala zpátky, čímž přeformátovala dlouhé složené bloky a
diff jednoho přidaného snímku měl 97 změněných řádků. Teď mění jen to, co
přibylo.

## Co systém ZATÍM nehlídá

Poctivý seznam děr, ať se neztratí:

1. **Objekty, které OSM nemá.** Externí katalog vede tři jizerské objekty, které
   v exportu nejsou (DATA-31) — do fronty se nedostanou, protože kandidátní
   soubor pro ně nikdo nezaložil.
2. **Komunitní podání.** Otisky a fotky od čtenářů čekají jako koncepty
   v Payloadu; ve frontě zatím nejsou.
3. **Kadence ověřování.** Stáří `checked` se počítá a zastaralé profily se
   hlásí, ale hranice je zatím jedna pro všechno (rok). Backlog *Datová
   volatilita* chce různou kadenci pro stabilní pole (GPS, výška) a proměnlivá
   (telefon, otvíračka).
4. **Povýšení jedním klikem.** Vědomě chybí — viz výš.
