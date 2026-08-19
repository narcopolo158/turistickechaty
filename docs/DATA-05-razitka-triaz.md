# DATA-05 — triáž 139 razítkových kandidátů na zpětné dohledání chat

Vznikla 16. 8. 2026 (denní session, pokyn Michala „pokračuj triáží") nad
sekcí „Kandidáti na zpětné dohledání chat" reportu
`docs/DATA-05-razitka-parovani.md`: 139 razítek z razitkuj.cz nese chatový
název, ale jmenná shoda je na žádný náš profil nenavázala.

**Koš NENÍ rozhodnutí** (konvence z plošných triáží): říká, v jakém pořadí
se to má číst a co se dá probrat hromadně. Zařazení do koše je z velké
části **odhad z názvu razítka** — detail razítka je ze sandboxu nedostupný
a rešerše proběhla jen tam, kde je to výslovně uvedeno. Nic z tohoto
dokumentu se nezapisuje do dat.

**Jak triáž běžela:** mechanické porovnání názvů razítek s celým fondem
kandidátů (`data/kandidati/**`, jména + aliasy; přesná shoda, částečná
shoda a slovní podmnožina — s brzdou na obecná slova jako v párování),
zbytek ručně do košů podle místa, které razítko pojmenovává.

## Souhrn

| koš | počet | co s ním |
| --- | ----- | -------- |
| A — razítko k objektu, který UŽ vedeme jako kandidáta | 43 + 21 | nic nezakládat; razítko je další signál pro povyšování |
| B — přijde s Michalovým klikem na DATA-01 export | 6 | čekat na klik (zapadne-tatry, slovensky-raj) |
| C — v okně existující oblasti, ale export je nemá | ~8 | dohledávka dle jmen (vzor DATA-31), u Beskyd spadá pod DATA-37 |
| D — pojmenovávají místo, kde oblast NEMÁME | ~12 | otázka pro Michala: zakládat? |
| E — krkonošská jména mimo korpus | 21 | zvláštní prověrka proti DATA-03 a zaniklým |
| F — mimo dnešní záběr (Alpy, Jura, Beskid Niski) | 9 | nechat ležet; Alpy jsou budoucí fáze plánu |
| G — z názvu neidentifikovatelné | ~19 | potřebují detail razítka → ruční běh s Michalem |

## Koš A1 — přesná shoda s kandidátem (43)

Razítko nese jméno objektu, kterého už v `data/kandidati/**` vedeme.
Nezakládá se nic; při povýšení kandidáta se pár objeví v párování sám
(a půjde do fronty ke kontrole). Jmenovce nevylučuji — u povýšení je
potřeba pár zkontrolovat jako každý jiný.

- „Ateliér chalupa" → `beskydy/atelier-chalupa`
- „Berggasthof Nonnenfelsen" → `luzicke-hory/berggasthof-nonnenfelsen`
- „Chata Baców" → `beskydy/chata-bacow`
- „Chata Hrádek" → `beskydy/chata-hradek`
- „Chata Hvězda - Andrlův chlum" → `jizerske-hory/chata-hvezda` — **POZOR,
  nejspíš omyl mechaniky:** jizerskohorská Hvězda stojí u rozhledny
  Štěpánka; razítko míří na Andrlův chlum u Ústí nad Orlicí (doloženo
  v `_parovani-potvrzene.yaml`, vyloučení z 16. 8.). Tu chatu nevedeme —
  viz koš D.
- „Chata Martinské hole" → `mala-fatra/chata-martinske-hole`
- „Chata Mír" → `beskydy/chata-mir`
- „Chata Na Čiháku" → `orlicke-hory/chata-na-cihaku`
- „Chata na Grúni" → `mala-fatra/chata-na-gruni`
- „Chata Ostrá" → `beskydy/chata-ostra`
- „Chata pod Borišovom" → `velka-fatra/chata-pod-borisovom`
- „Chata pod Bukovcem" → `jizerske-hory/chata-pod-bukovcem`
- „Chata pod Chlebom" → `mala-fatra/chata-pod-chlebom`
- „Chata pod Lampášom" → `mala-fatra/chata-pod-lampasom`
- „Chata pod Suchým" → `mala-fatra/chata-pod-suchym`
- „Chata Slaměnka" → `jeseniky/chata-slamenka`
- „Chata Vilemína" → `jeseniky/chata-vilemina`
- „Chata vo Vyhnanej" → `mala-fatra/chata-vo-vyhnanej`
- „Chata Vrátna" → `mala-fatra/chata-vratna`
- „Chata Wuja Toma" → `beskydy/chata-wuja-toma`
- „Chata Záhradky" → `nizke-tatry/chata-zahradky`
- „Chatka AKT na Pietraszonce" → `beskydy/chatka-akt-na-pietraszonce`
  (razítko dřív vyloučené vůči krkonošské chatce AKT — teď má správný cíl)
- „Chatka Skalanka - Zwardoń" → `beskydy/chatka-skalanka`
- „Josefova bouda" → `krkonose/josefova-bouda` (doloženo 16. 8., viz
  `_parovani-potvrzene.yaml`)
- „Kašparova chata" → `orlicke-hory/kasparova-chata`
- „Lesní chata" → `jizerske-hory/lesni-chata` — obecné jméno, jmenovci
  jistí; rozhodne detail
- „Lužická bouda" → `luzicke-hory/luzicka-bouda`
- „Mikulášská chata" → `nizke-tatry/mikulasska-chata`
- „Modrokamenná bouda" → `krkonose/modrokamenna-bouda`
- „Orlická chata" → `orlicke-hory/orlicka-chata`
- „Severomoravská chata" → `jeseniky/severomoravska-chata`
- „Schronisko na Iglicznej" → `orlicke-hory/schronisko-na-iglicznej`
- „Schronisko PTTK Hala Lipowska" → `beskydy/schronisko-pttk-na-hali-lipowskiej`
- „Schronisko PTTK Markowe Szczawiny" → `beskydy/schronisko-pttk-markowe-szczawiny`
- „Schronisko PTTK na Hali Krupowej" → `beskydy/schronisko-pttk-na-hali-krupowej`
- „Schronisko PTTK na Przegibku" → `beskydy/schronisko-pttk-na-przegibku`
- „Schronisko PTTK Szwajcarka" → `rudawy-janowickie/schronisko-pttk-szwajcarka`
- „Schronisko PTTK Szyndzielnia" → `beskydy/schronisko-pttk-szyndzielnia`
- „Skalka - chata" → `beskydy/skalka` (v repu i druhá entita
  `skalka-1884089736` — duplicitní kandidáti, rozhodne se při povýšení)
- „Suchý vrch - Kramářova chata" → `orlicke-hory/kramarova-chata`
- „Szkolne Schronisko Młodzieżowe - Sławków" → `beskydy/szkolne-schronisko-mlodziezowe`
  — shodu jmen ověřit: Sławków je město v Zagłębiu, náš kandidát je
  z beskydského exportu; nejspíš jmenovec, rozhodne detail
- „Turistická chata Tisá" → `krusne-hory/turisticka-chata-tisa`
- „Turnovská chata" → `jizerske-hory/turnovska-chata`

## Koš A2 — částečná shoda s kandidátem (21, K OVĚŘENÍ jednotlivě)

Slovní podmnožina nebo substring; skloňování a přívlastky můžou klamat.
U tří polských jsem inflekci dohledal ručně v repu:

- „Schronisko Klimczok" → `beskydy/schronisko-pttk-klimczok`
- „Schronisko Leskowiec" → `beskydy/schronisko-pttk-leskowiec`
- „Schronisko na Błatniej" → `beskydy/schronisko-pttk-na-blatniej`
- „Schronisko Rysianka" → `beskydy/schronisko-pttk-na-rysiance`
- „Schronisko Skrzyczne" → `beskydy/schronisko-pttk-skrzyczne`
- „Schronisko Hala Boracza" → `beskydy/schronisko-pttk-na-hali-boraczej` (ručně, skloňování)
- „Schronisko PTTK Hala Miziowa" → `beskydy/schronisko-na-hali-miziowej` (ručně, skloňování)
- „Schronisko na Soszowie" → `beskydy/schronisko-soszow` (ručně, skloňování)
- „Schronisko PTTK Pod Muflonem" → `orlicke-hory/schronisko-pod-muflonem`
- „Schronisko „Na Śnieżniku”" → `jeseniky/na-sniezniku`
- „Schronisko Chata Grabowa Brenna" → `beskydy/grabowa-chata`
- „Masarykova chata na Beskydě" → `javorniky-vsetinske-vrchy/masarykova-chata`
  (doloženo 16. 8. ráno, viz `_parovani-potvrzene.yaml`)
- „Útulna Limba" → `nizke-tatry/horska-utulna-limba-pod-rakytovom` — ověřit,
  jmenovkyně útulny Limba existují i jinde
- „Chata Búřov" → `javorniky-vsetinske-vrchy/horska-chata-burov`
- „Chata Svoboda - Rejvíz" → `jeseniky/penzion-rejviz-noskova-chata` —
  NEJISTÉ: na Rejvízu je objektů víc, „Svoboda" v názvu kandidáta není
- „Chata Šumná Pustevny" → `beskydy/chata-sumna` — ověřit, že kandidát
  stojí na Pustevnách
- „Chata Šútovská Fatranka" → `mala-fatra/chata-fatranka` — ověřit
  (Šútovo sedí do Malé Fatry)
- „Chata Zátopek - Lysá hora (Plesnivka)" → `beskydy/chata-emil-zatopek-maraton`
  NEBO `beskydy/chata-emil-zatopek-desitka` — dvě Zátopkovy chaty, kterou
  z nich razítko myslí (a co je „Plesnivka"), rozhodne detail
- „Chata Zuzana" → `nizke-tatry/zuzana` NEBO `beskydy/horska-chata-zuzana`
  — jmenovkyně, rozhodne detail
- „Chata Pod Konečnou - Bílá" → `beskydy/chata-bila` — NEJISTÉ, jen shoda
  slova „Bílá" (obec); spíš samostatný objekt
- „Kozákov - rozhledna a Riegrova chata" → `cesky-raj/riegrova-chata-na-kozakove`
- „Lesní chata Na Tokáni" → `ceskosaske-svycarsko/lesni-chata-na-tokani-127`
- „Libín rozhledna a chata" → `sumava/rozhledna-libin`

**Omyl mechaniky k ignorování:** „Chata Kožiar - Žiarská dolina" →
`mala-fatra/chata-dolina` je falešná podmnožina ({chata, dolina}); Kožiar
patří do koše B (Žiarska dolina, Západné Tatry).

## Koš B — přijde s Michalovým klikem na DATA-01 (6)

Objekty v založených oblastech, jejichž plný export čeká na klik
(`docs/KLIKY-PRO-MICHALA.md`). Nezakládat ručně — přijdou s exportem
i s OSM doklady:

- **zapadne-tatry** (dnešní kandidáti jsou jen podhůří u Zuberce):
  „Žiarska chata", „Chata Kožiar - Žiarská dolina" (obě Žiarska dolina —
  odhad z názvu), „Schronisko PTTK - Polana Chochołowska",
  „Schronisko PTTK Hala Ornak" (polské Tatry Zachodnie, okno je dle
  popisu oblasti pokrývá)
- **slovensky-raj** (zatím nula kandidátů): „Chata na Rázcestí - Čingov",
  „Chata Piecky" (Čingov i Piecky jsou lokality Slovenského raje —
  odhad z názvu)

## Koš C — v okně existující oblasti, ale export je nemá (~8)

> **ROZPOUŠTĚNÍ ZAHÁJENO 19. 8. 2026 → `docs/DATA-05-kos-C-dohledavky.md`.**
> Hotové: **Schronisko Liczyrzepa** (mládežnická noclehárna v Karpaczi bez
> vlastního občerstvení → návrh vyřazení) a **Chata Paprsek** (doložená
> mezera — katalogová chata HUT-0055, jistota A, 1 022 m, restaurace přímo
> v chatě; v jesenickém exportu 0 výskytů ve 122 kandidátech).
> **Turistická chata Trosky** nedohledána. Do `data/` se nesáhlo.

Kandidáti na dohledávku dle jmen (vzor DATA-31); beskydské položky patří
k DATA-37 (re-export, který tiše nic neudělal). Vše odhad z názvu:

- **beskydy:** „Chata Ondřejník" (masiv Ondřejník), „Koliba u Záryša -
  Pustevny", „Chata pod Solniskiem" (Hala Solnisko?, Beskid Żywiecki),
  „Schronisko Dębowiec" a „Schronisko Stefanka - Kozia Góra" (oba
  Bielsko-Biała — kraj okna, ověřit), „Schronisko Czartak" (Beskid Mały —
  na hraně okna, ověřit), „Szkolne Schronisko Młodzieżowe Rajcza -
  Nickulina" (Rajcza je v Beskidu Żywieckém; zda mládežnická noclehárna
  plní klíč, rozhodne rešerše)
- **jizerske-hory:** „Schronisko Wysoki Kamień" (nad Szklarskou Porębou;
  polskou stranu okno pokrývá — Chatka Górzystów je publikovaná)
- **krkonose:** „Schronisko Liczyrzepa" (Liczyrzepa = Krakonoš; Karpacz?
  — ověřit, může to být i penzion v podhůří)
- **ceskosaske-svycarsko:** „Amselfall - Amselfallbaude" (bouda
  u vodopádu Amselfall u Rathenu, Saské Švýcarsko — ověřit okno)
- **cesky-raj:** „Turistická chata Trosky" (pod Troskami; oblast má
  zatím jen 2 kandidáty)
- **jeseniky:** „Chata Paprsek" (Rychlebské hory / Staré Město pod
  Sněžníkem — ověřit, jestli okno Jeseníků sahá tak daleko; jestli ne,
  patří do koše D)

## Koš D — pojmenovávají místo, kde oblast nemáme (~12) → OTÁZKA PRO MICHALA

- **Góry Stołowe (PL, soused Broumovska):** „Schronisko Pasterka",
  „Schronisko PTTK Na Szczelińcu Wielkim" — nejnavštěvovanější schroniska
  Kladska; nabízí se otázka, zda Góry Stołowe založit (vzor ORL-01, který
  zavřel Góry Bystrzyckie)
- **Góry Sowie / Kamienne / Bardzkie (PL):** „Schronisko Sowa",
  „Schronisko Orzeł", „Schronisko PTTK Zygmuntówka", „Schronisko PTTK
  Andrzejówka", „Villa Hubertus - Schronisko PTTK Srebrna Góra"
- **Pieniny (PL+SK):** „Schronisko PTTK Trzy Korony", „Chata Pieniny",
  „Salaš Podžiar" (SK strana), „Schronisko Pod Bereśnikiem" (Szczawnica —
  spíš Beskid Sądecki, na hraně)
- **Podorlicko / menší kopce ČR:** „Jiráskova chata na Dobrošově"
  (klasická KČT chata u Náchoda), „Chata Maxe Švabinského - Kozlov"
  (u České Třebové), „Chata Hvězda - Andrlův chlum" (Ústí nad Orlicí,
  chata KČT s restaurací — nález z ranního vyloučení), „Svinec chata"
  (Nový Jičín), „Jestřebí bouda, Řehačka" (odhad: Polabí u Lysé n. L.?)
  — jednotlivé solitéry; možná model „přesahové oblasti" (DATA-29)?

## Koš E — krkonošská jména mimo korpus (21) → zvláštní prověrka

> **PROVĚRKA PROBĚHLA 17. 8. 2026 → `docs/DATA-05-kos-E-krkonose.md`.**
> Výsledek: **3 doložené mezery v korpusu** (Pardubické boudy — objekt
> `way/88752514` z našeho vlastního OSM exportu, přeskočený 20. 7. pro
> chybějící tag `name`; Hříběcí bouda — aktivní chata z našeho zdrojového
> průzkumu, FACT-0131/0132; Jilemnická bouda — FACT-0048), 1 doložená
> zaniklá (Sokolská bouda = ZANIK-003) + 1 návrh (Bouda v Modrém dole ~
> ZANIK-004), 2 jména enkláv bez doloženého objektu (Sagasserovy,
> Zinneckerovy boudy), 1 objekt doložený jen zastávkou (Hančova bouda,
> Benecko), 2 nerozhodnutelné bez detailu (Obří důl, pod Sněžkou),
> **1 oprava zařazení — „Bouda Svornost" patří do koše C (Jeseníky)**
> a 10 jmen bez stopy v repu → ruční běh s detaily razítek.
> Do `data/` se prověrkou nesáhlo.

Krkonoše prošly křížovým ověřením (DATA-03) a katalogem (DATA-08); jméno
mimo korpus tu znamená spíš penzion bez veřejných služeb (vyřazený),
zaniklou boudu (razítko může být historické!) nebo jméno, které jsme
potkali a nevedeme. Projít proti `docs/DATA-03-master-krkonose.md`
a `data/zanikle/` — jedna soustředěná session:

„Bouda Hubertus", „Bouda Jana", „Bouda Malá Úpa", „Bouda pod Sněžkou",
„Bouda Svornost", „Bouda v Modrém dole", „Bouda v Obřím dole",
„Braunova chata", „Děčínská bouda", „Hančova Bouda", „Hříběcí bouda",
„Jilemnická bouda - Horní Mísečky", „Lesní Zátiší Harrachov",
„Ludvíkova bouda", „Mumlavská bouda", „Pardubické boudy",
„Pohořanská bouda", „Sagasserovy boudy", „Sokolí boudy",
„Sokolská bouda", „Zinneckerovy boudy"

## Koš F — mimo dnešní záběr (9)

Plán jde Krkonoše → ČR → SK → Alpy; tahle razítka nechat ležet, checklist
je neztratí:

- **Alpy:** „Grazerhütte Tauplitzalm" (AT, Totes Gebirge — odhad
  z názvu), „Höllentalangerhütte", „Knorrhütte", „Reintalangerhütte"
  (DE, Wetterstein/Zugspitze — odhad z názvu), „Rifugio Gardeccia -
  Hütte" (IT, Dolomity — odhad z názvu)
- **Jura / Zagłębie (PL):** „Szkolne Schronisko Młodzieżowe Jura -
  Olkusz", „Szkolne Schronisko Młodzieżowe Siedlec"
- **Beskid Niski (PL, daleko na východ):** „Teodorówka - Chata SKPB
  Warszawa"
- (sem časem možná spadne i „Schronisko Pod Bereśnikiem" z koše D)

## Koš G — z názvu neidentifikovatelné (~10) → potřebují detail razítka

Jméno je příliš obecné nebo ho nesou desítky objektů; sandbox na detail
razítka nedosáhne. Ruční běh s Michalem (otevřít detail, přečíst kontext):

„Horská chata Arnika", „Horská chata Ozon", „Chata Anička",
„Chata Borůvka", „chata Jeskyňka", „Chata Lúčky", „Chata Moravia",
„Chata Polanka", „Chata Poutník", „Chata Stará pila", „Chata Vatra"

## Doporučené pořadí dalších kroků

1. **Nic neblokuje kliky** — koš B čeká na DATA-01 exporty, které jsou
   v `docs/KLIKY-PRO-MICHALA.md` stejně první na řadě.
2. Koš C rozpustit dohledávkami při nejbližší práci na dotčených
   oblastech (beskydská část = DATA-37, která v backlogu už je).
3. ~~Koš E = jedna krkonošská prověrková session (může být bezobslužná —
   master seznam i zaniklé jsou v repu).~~ **HOTOVO 17. 8. 2026**,
   `docs/DATA-05-kos-E-krkonose.md`. Zbytek koše E (10 jmen bez stopy
   v repu + 2 nerozhodnutelná) padá do bodu 5 — ruční běh nad detaily.
4. Koš D = otázky pro Michala v deníku 16. 8.
5. Koš G = ruční běh s Michalem nad detaily razítek.
