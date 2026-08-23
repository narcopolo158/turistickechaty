/**
 * Spustí všechny kontroly datové vrstvy najednou.
 *
 * Na rozdíl od řetězení přes `&&` se nezastaví na první chybě — validátor sice
 * vrací nenulový kód, ale zbylé tři kontroly stejně doběhnou, protože jejich
 * výstup je seznam k posouzení, ne verdikt, a chce se vidět celý.
 *
 *   npx tsx scripts/kontrola/vse.ts
 *
 * Návratový kód 1, když spadne validátor nebo regresní test fixtury.
 */
import { spawnSync } from 'node:child_process'

const KROKY = [
  ['validator', 'ciselniky, konvence B, svoleni u obrazku', true],
  ['zdroje', 'domena jmenovana v proze musi stat i ve `zdroje`', false],
  ['ban-scan', 'zakazane vzory ve verejne proze (seznam k posouzeni)', false],
  ['audit-mech', 'mechanicky audit A-F (seznam k posouzeni)', false],
  // NEROZHODUJE: osirela fotka je bezny dusledek triaze (objekt povysen nebo
  // vyrazen), ne chyba, ktera by mela blokovat cizi PR. Ma byt videt v logu.
  ['osirele-fotky', 'kandidatni fotky k neexistujicimu objektu', false],
  // jako jedina z trojice seznamovych kontrol ROZHODUJE: cisty stav je presne
  // nula, takze kazdy zasah je regrese, ne polozka k posouzeni
  ['kolize-jmen', 'kolize nazvu chat v celem korpusu', true],
  // ROZHODUJE, ale jen o VADACH fronty (rozhodnuti bez duvodu, odlozeny objekt,
  // ktery uz ma profil, osirele rozhodnuti o fotce) — ne o tom, ze neco ceka.
  // Nezpracovany kandidat je prace, ne chyba; report ho ukaze a tim vlastne
  // plni zadani „at nic nezustane nezpracovane".
  ['fronta', 'rozpracovanost redakce (kandidati, fotky) + vady rozhodnuti', true],
  // ROZHODUJE: cisty stav je presne nula. Overpass hlasi behovou chybu jako
  // HTTP 200 s prazdnym `elements`, takze vadny export se do repa dostane jako
  // platny doklad — a to je nejtissi porucha, jakou pipeline umi (8. 8. 2026
  // kvuli ni chybeli v beskydskych kandidatech Libusin a Chata na Radhosti).
  // Rozhoduje jen ta prvni vec; uzky dotaz (18. 8.) a chybejici vrstva (21. 8.)
  // jsou upozorneni — je to prace (pustit oblast v Actions), ne vada souboru.
  ['exporty', 'surove Overpass exporty (behova chyba, uzky dotaz, chybejici vrstva)', true],
  // NEROZHODUJE: mezera v pokryti katalogu je PRACE, ne vada. Objekt muze
  // v OSM chybet, byt pod jinym jmenem, byt zanikly nebo mimo klic zarazeni.
  // Report ma rict, kde hledat; rozhodnout musi redakce s pramenem. Kontrola,
  // ktera blokuje CI kvuli rozdelane praci, se stejne vypne.
  ['katalog-pokryti', 'katalogove objekty bez zaznamu v repu (seznam k posouzeni)', false],
  // NEROZHODUJE: duplicita mezi oblastmi je ROZPRACOVANOST, ne vada. Objekt na
  // hranici dvou pohori nekam patri a rozhodne to triaz s pramenem o
  // prislusnosti, ne kontrola; ta ma jen zajistit, ze se na par nezapomene.
  ['duplicity-oblasti', 'tyz OSM objekt vede vic oblasti (DATA-36 b, k rozhodnuti)', false],
  // NEROZHODUJE: blizky par je PRACE (rozhodnout, jestli jde o jeden objekt),
  // ne vada souboru. Doplnuje trojici, mezi kterou zustavala mereno dira:
  // identita podle OSM URL (duplicity-oblasti) dve entity teze stavby nevidi,
  // pojistka DATA-38 se pta jen na JINE oblasti a jen pri shodnem jadru nazvu,
  // kolize-jmen vidi jen jmena. Krkonossky beh 22. 8. 2026 spadl doprostred.
  ['blizke-body', 'kandidat par metru od profilu teze oblasti (k rozhodnuti)', false],
  // ROZHODUJE: vadne razitko neshodi sebe, ale cely deploy — seed razitek
  // bezi uvnitr nasazeni. Cisty stav je presne nula.
  ['razitka', 'razitkovy korpus: profil chaty, sken, atribuce prevzetí', true],
  // jedina kontrola mimo datovou vrstvu: definice GitHub Actions. Rozhoduje,
  // protoze vadny workflow se jinak pozna az na webu Actions (padly beh).
  ['workflows', 'definice GitHub Actions (.github/workflows)', true],
  ['test-fixtura', 'regresni test kontrol proti fixture', true],
] as const

let spadlo = 0
for (const [jmeno, popis, rozhoduje] of KROKY) {
  console.log(`\n${'─'.repeat(78)}\n▶ ${jmeno} — ${popis}\n${'─'.repeat(78)}`)
  const beh = spawnSync('npx', ['tsx', `scripts/kontrola/${jmeno}.ts`], {
    stdio: 'inherit',
  })
  if (rozhoduje && beh.status !== 0) spadlo++
}

console.log(`\n${'─'.repeat(78)}`)
console.log(spadlo ? `HOTOVO — ${spadlo} rozhodujicich kontrol spadlo` : 'HOTOVO — vse zelene')
process.exit(spadlo ? 1 : 0)
