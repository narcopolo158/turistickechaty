# Zdrojový průzkum článků o horských a turistických chatách

**Ověřeno k:** 2026-07-22

Balíček vznikl pro projekt **turistickechaty.cz** průchodem webů Seznam Zprávy, Kudy z nudy, Časopis Turista a Krkonose.eu. Obsah je rozdělen tak, aby šel importovat do redakční/databázové vrstvy a současně bylo možné dohledat zdroj každého jednotlivého tvrzení.

## Obsah balíčku

- `zdrojove_clanky_horske_chatky_2026-07-22.csv` – jeden řádek = jeden článek, profil nebo rozcestník.
- `fakta_z_clanku_pro_turistickechaty_2026-07-22.csv` – jeden řádek = jeden faktický údaj s URL zdroje.
- `souhrn_objektu_ze_zdrojoveho_pruzkumu_2026-07-22.csv` – agregace podle chaty/objektu.
- `zdrojovy_pruzkum_horskych_chat_2026-07-22.xlsx` – stejné tabulky v jednom sešitu + metodika.

## Počty

- Nalezených článků a profilů: **63**
- Samostatných faktických řádků: **165**
- Objektů nebo obecných témat: **38**
- Jistota faktů: **A 62 / B 96 / C 7**

### Články podle webu
- Krkonose.eu: 15
- Kudy z nudy: 22
- Seznam Zprávy: 23
- Časopis Turista: 3

### Fakta podle zdrojového webu
- Krkonose.eu: 65
- Kudy z nudy: 21
- Seznam Zprávy: 74
- Časopis Turista: 5


## Metodika

1. Zadané URL byly použity jako vstupní rozcestníky.
2. Byly projity související články a profily chat, tematický štítek Seznam Zpráv, odkazy z hlavního článku Kudy z nudy a jednotlivé profily na Krkonose.eu.
3. Každý použitelný údaj byl zapsán samostatně a parafrázován. Zdrojová URL je u každého řádku.
4. Časově proměnlivé údaje jsou označeny `dynamické – ověřit před publikací`.
5. Rozpory a superlativy jsou označeny jistotou C nebo formulovány jako tvrzení konkrétního zdroje.
6. Automaticky generované otázky a odpovědi na Kudy z nudy nebyly považovány za samostatný zdroj.

## Důležitá omezení

- Weby neposkytují veřejný kompletní export historického archivu. Balíček zachycuje nalezené relevantní stránky k datu ověření, ale nemůže garantovat absolutní úplnost všech starších nebo neindexovaných URL.
- Seznam Zprávy a Kudy z nudy jsou sekundární redakční zdroje. Pro finální faktografické profily doporučujeme jejich údaje ověřit proti webu chaty, KRNAP/KPN, KČT/PTTK, archivu nebo odborné literatuře.
- Fotografie z článků nejsou součástí balíčku. Jejich použití vyžaduje licenci nebo souhlas držitele práv.
- Maxova bouda je označena jako kandidát pro katalog zaniklých objektů. Před importem potřebuje druhý nezávislý zdroj, přesný rok zániku a souřadnice.
