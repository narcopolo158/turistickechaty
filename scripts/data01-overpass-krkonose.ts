/**
 * DATA-01: export chat Krkonoš z OpenStreetMap (Overpass API) — kandidáti.
 *
 * Stáhne objekty s hutovým tagem (`tourism=alpine_hut` / `wilderness_hut` /
 * `hut` / `chalet`) a k tomu **civilně tagované boudy** — restaurace, hotely
 * a penziony, které mají v NÁZVU „chata", „bouda", „schronisko" a spol.
 * (nález 30. 7. 2026: v Jizerkách je tak mapovaná většina známých bud, viz
 * `SLOVA_BOUDY`). Třetí vrstvou je **dohledávka podle jmen z externího
 * katalogu** pro objekty, které nemají ani hutový tag, ani slovo boudy
 * v názvu (Kiosek Knajpa, Pyramida Jizerka). Vše po zemích (průnik area
 * státu + bbox pohoří; rozhodnutí Michala 20. 7.: přeshraniční pohoří
 * bereme celá).
 * Surové odpovědi uloží do `data/kandidati/krkonose/_overpass-export-<zeme>.json`
 * (commitují se — doklad exportu vč. timestampu a copyright hlavičky
 * Overpass) a transformuje je na `data/kandidati/krkonose/<slug>.yaml` —
 * jen doložené údaje z OSM tagů, vše `verified: false` se zdrojem
 * (URL OSM objektu) a atribucí ODbL.
 *
 * STAGING (rozhodnutí ručního běhu 20. 7.): kandidáti NEJSOU na webu — seed
 * čte jen `data/chaty/**`. Do `data/chaty/<pohori>/` se YAML povyšuje ručně
 * až po křížovém ověření (DATA-03), ať web nezaplaví desítky polotenkých
 * profilů naráz. Ručně kurátorované profily (Luční bouda) se NIKDY
 * nepřepisují — export je jen porovná a rozdíly vypíše do reportu.
 *
 * Spuštění (sandbox denních sessions na Overpass nedosáhne — ostrý běh dělá
 * GitHub Actions workflow „DATA-01: OSM export chat Krkonoš"):
 *   npx tsx scripts/data01-overpass-krkonose.ts                  # stáhne + transformuje
 *   npx tsx scripts/data01-overpass-krkonose.ts --api https://overpass.kumi.systems/api/interpreter
 *   npx tsx scripts/data01-overpass-krkonose.ts --z-jsonu        # offline: jen transformace commitnutého exportu
 *
 * ROZHLEDNY (rozhodnutí Michala 28. 7. 2026): druhý dotaz sbírá rozhledny
 * (`tower:type=observation`) a k nim občerstvení v okolí. Kandidátem se stane
 * jen rozhledna s DOLOŽENÝM občerstvením (restaurace, bufet, kavárna…) —
 * volně přístupná věž bez občerstvení do průvodce nepatří a zůstane jen
 * v reportu. Když je tím občerstvením chata, která už kandidátem je,
 * rozhledna se zvlášť nezakládá (byl by to druhý objekt na témž místě) —
 * dvojici posoudí redakce. Doklad (objekt, tag, vzdálenost) jde do
 * `interniPoznamky` kandidáta, ať je co ověřovat.
 *
 * Poctivost dat (CLAUDE.md): skript nic nedomýšlí — zapisuje pouze to, co
 * v OSM je. Stav provozu OSM spolehlivě nenese → `stav` se nevyplňuje.
 * Typ jen z jednoznačného významu tagu dle OSM wiki: alpine_hut = obsluhovaná
 * chata, wilderness_hut = útulna; nestandardní `tourism=hut` typ nedostane —
 * určí redakce. `checked` = datum stavu OSM dat (osm3s.timestamp_osm_base
 * z odpovědi), ne datum transformace.
 *
 * Atribuce: data © přispěvatelé OpenStreetMap, licence ODbL 1.0
 * (https://www.openstreetmap.org/copyright) — v source každého bloku ověření.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse, stringify } from 'yaml'

import { bboxStr, oblastZArgv, zemeDotazu, type OblastKonfig, type ZemeIso } from './oblasti'

// Slug generujeme stejně jako Payload hook — jeden zdroj pravdy.
import { slugify } from '../src/fields/slug'

/**
 * Veřejné instance Overpass — zkoušejí se po řadě (hlavní instance
 * overpass-api.de sdílené IP GitHub Actions runnerů často rate-limituje,
 * kumi.systems bývá benevolentnější). `--api URL` fallback vypíná a vynutí
 * jedinou instanci.
 *
 * Do seznamu smí JEN instance s celosvětovými daty. Regionální zrcadla
 * (overpass.osm.ch = jen Švýcarsko, atownsend.org.uk = Britské ostrovy…) by
 * na náš dotaz odpověděla HTTP 200 a prázdným seznamem — tedy tiše prázdným
 * exportem, což je horší než pád. Proto se u nich drží zdroj:
 * wiki.openstreetmap.org/wiki/Overpass_API, oddíl veřejných instancí,
 * kontrolováno 28. 7. 2026 (private.coffee je tam vedená jako „global data
 * coverage"). Prázdnou odpověď navíc `stahniZInstance` bere jako selhání
 * instance — viz `povolitPrazdno`.
 */
export const VYCHOZI_API_INSTANCE = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Adresáře i dotaz se odvozují z konfigurace oblasti (scripts/oblasti.ts) —
// nové pohoří se přidává tam, ne kopií tohohle skriptu.
const kandidatiAdresar = (oblast: string) => join(process.cwd(), 'data', 'kandidati', oblast)
const rucniAdresar = (oblast: string) => join(process.cwd(), 'data', 'chaty', oblast)
const VYRAZENO_SOUBOR = join(process.cwd(), 'data', 'kandidati', '_vyrazeno.yaml')

/**
 * Vyřazené OSM objekty (redakční rozhodnutí v `data/kandidati/_vyrazeno.yaml`):
 * duplicity v OSM a objekty mimo Krkonoše přesunuté do jiných oblastí. Bez
 * tohoto seznamu by je další běh exportu znovu založil v krkonose/ — objekty
 * v OSM dál existují a bbox je dál chytá. Klíč = URL objektu v OSM (stabilní
 * identita nezávislá na slugu). Chybějící soubor = prázdný seznam.
 */
export const nactiVyrazene = (soubor: string = VYRAZENO_SOUBOR): Map<string, string> => {
  if (!existsSync(soubor)) return new Map()
  const data = parse(readFileSync(soubor, 'utf8')) as {
    vyrazeno?: { osm?: string; duvod?: string }[]
  } | null
  const mapa = new Map<string, string>()
  for (const z of data?.vyrazeno ?? []) {
    if (z.osm) mapa.set(z.osm, z.duvod ?? 'bez udaného důvodu')
  }
  return mapa
}

/**
 * Přeshraniční pohoří bereme celá — přes státní hranici (rozhodnutí Michala
 * 20. 7.; obecný princip, příště německá strana Šumavy). Země se dotazuje po
 * jedné (průnik area státu + okno), aby každý kandidát nesl doloženou `zeme` —
 * okno samo hranici nezná a domýšlet ji nebudeme.
 *
 * KTERÉ země to jsou, říká konfigurace oblasti (`zemeDotazu` v oblasti.ts), ne
 * konstanta tady. Do 30. 7. 2026 tu stálo napevno CZ + PL a běh pro Ještědský
 * hřbet — celý v Česku — se proto ptal i Polska. Prázdná odpověď se přitom
 * počítá za selhání instance (instance bez celosvětových dat vrací totéž), tak
 * to zkusil třikrát u tří instancí, 17 minut se přesypávalo a nakonec spadlo
 * na exit 1. Úspěšný český export (7 objektů) tím propadl bez commitu.
 */

/**
 * Země kandidáta — odvozená od seznamu v konfiguraci oblastí, ne psaná zvlášť.
 * Kdyby to byly dva nezávislé seznamy, přidání Slovenska do oblasti by prošlo
 * typovou kontrolou a `zeme: 'sk'` by se do dat dostalo přes přetypování.
 */
export type Zeme = Lowercase<ZemeIso>

/** Jak dopadl dotaz na jednu zemi. */
export type StavZeme = { iso: string; ok: boolean; chyba?: string }

/**
 * Verdikt o úplnosti běhu — a jestli se smí zapisovat.
 *
 * Rozhodnutí Michala 30. 7. 2026 („uprav to tak, že zacommituje co najde"):
 * když spadne jedna země, běh **není** k zahození. Předtím platilo všechno,
 * nebo nic: 30. 7. spadl polský dotaz na Ještěd, a s ním přišel vniveč
 * i hotový český export (7 objektů, 17 minut běhu).
 *
 * Co se tím NEsmí ztratit, je pravda o tom, co v datech je: neúplný běh musí
 * být vidět ve výpisu i v commit message, jinak by „zelený" běh tvrdil úplný
 * export. Proto `sentinel` — řádek, který si workflow přečte a přilepí do
 * commitu. Kandidáti se jen přidávají a nic se nepřepisuje, takže zapsat
 * neúplný výsledek není destruktivní; zamlčet ho by bylo.
 */
export const verdiktBehu = (
  stavy: StavZeme[],
): {
  zapsat: boolean
  neuplny: boolean
  hotove: string[]
  selhale: string[]
  zprava: string
  sentinel: string | null
} => {
  const hotove = stavy.filter((z) => z.ok).map((z) => z.iso)
  const selhale = stavy.filter((z) => !z.ok).map((z) => z.iso)
  const zapsat = hotove.length > 0
  const neuplny = zapsat && selhale.length > 0
  const zprava = !zapsat
    ? `Nestáhla se ani jedna země (${selhale.join(', ') || '—'}) — není co zapsat. Overpass instance bývají přetížené, zopakuj běh.`
    : neuplny
      ? `NEÚPLNÝ BĚH: staženo ${hotove.join(', ')}, NEPOVEDLO SE ${selhale.join(', ')}. Zapisuje se, co je — kandidáti z chybějících zemí v tomhle běhu NEJSOU. Až Overpass pustí, spusť workflow znovu; běh je idempotentní (nic se nepřepisuje, jen doplní).`
      : `Staženy všechny země oblasti (${hotove.join(', ')}).`
  return { zapsat, neuplny, hotove, selhale, zprava, sentinel: neuplny ? `NEUPLNY_BEH: ${selhale.join(',')}` : null }
}

/**
 * Hrubé vyhledávací okno Krkonoš (jih, západ, sever, východ) — jen okno
 * dotazu, ne publikovaný údaj: pokrývá Harrachov až Rýchory a na severu
 * polské podhůří (Szklarska Poręba, Karpacz) s rezervou.
 */
export const BBOX_KRKONOSE = '50.55,15.30,50.87,16.05'

// `tourism=hut` je nestandardní (wiki zná alpine_hut/wilderness_hut), ale
// zadání ručního běhu ho chce v checklistu — kandidáty nic nekazí, nanejvýš
// přinese pár objektů k ruční kontrole navíc.
const HUTOVE_TAGY = '^(alpine_hut|wilderness_hut|hut|chalet)$'

/**
 * SLOVA V NÁZVU, po kterých je objekt horská bouda, i když ho OSM tagovalo
 * jako restauraci nebo penzion.
 *
 * Proč to tu je (nález 30. 7. 2026 po prvním jizerském běhu): Michal se divil,
 * že v seznamu nejsou Smědava, Knajpa ani chaty na Jizerce. Nebyl to bbox —
 * ten Jizerky pokrývá celé. Byl to dotaz: ptal se na tři „hut" tagy a v KRKONOŠÍCH
 * to stačí, protože tamní boudy jsou v OSM skoro vždy `alpine_hut`. V Jizerkách
 * je táž věc mapovaná jako `amenity=restaurant`, `tourism=hotel` nebo
 * `guest_house` — a je to vidět na našich vlastních datech: dotaz na rozhledny,
 * který okolní občerstvení bere podle `amenity`, vytáhl „Chata Proseč"
 * (restaurant), „Chata Bramberk" (restaurant), „Ski Chata" (restaurant),
 * „Slovanka" (guest_house) i „U Čápa" (hotel). Tytéž objekty by hutový dotaz
 * nikdy nenašel.
 *
 * Rozšířit dotaz na všechny restaurace v okně nejde — bbox Jizerských hor
 * obsahuje Liberec i Jablonec a vrátil by stovky hospod. Filtruje se proto
 * NÁZVEM: „chata", „bouda", „schronisko" a spol. nese horská hospoda i tehdy,
 * když je tagovaná jako restaurace, a nenese ho pizzerie na náměstí.
 *
 * Klíč zařazení („rozhoduje občerstvení, ne typ stavby", Michal 26. 7. 2026)
 * tím dotaz konečně dohání — dosud platil jen při ruční triáži nad tím, co
 * dotaz náhodou přinesl.
 */
// Německá slova přibyla 4. 8. 2026 se Šumavou (zeme CZ+DE): bavorské objekty
// se jmenují Hütte / Schutzhaus / Berggasthof / Berghaus a dosavadní vzor
// `hut[ae]?` na „Hütte" nedosáhne (ü ≠ u). Čistě tagová vrstva (alpine_hut…)
// je chytala i dřív — tohle rozšiřuje jen jménem filtrované vrstvy
// (restaurace a ubytování se slovem v názvu).
const SLOVA_BOUDY =
  'chata|chatka|chalupa|bouda|boudy|schronisko|hut[ae]?|útuln|utuln|hájenka|hajenka|horská|horska|baude|hütte|hutte|schutzhaus|berggasthof|berghaus'
const OBCERSTVENI_TAGY = '^(restaurant|cafe|fast_food|bar|pub|biergarten)$'
const UBYTOVANI_TAGY = '^(hotel|guest_house|hostel|motel|apartment)$'
/** Hutové i ubytovací tagy v jednom regexu — pro dohledávku podle jmen. */
const HUTOVE_TAGY_A_UBYTOVANI = '^(alpine_hut|wilderness_hut|hut|chalet|hotel|guest_house|hostel|motel|apartment)$'

export const overpassDotaz = (iso: string, okno: string = BBOX_KRKONOSE): string => `[out:json][timeout:180];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
  nwr["tourism"~"${HUTOVE_TAGY}"](area.stat)(${okno});
  nwr["amenity"~"${OBCERSTVENI_TAGY}"]["name"~"${SLOVA_BOUDY}",i](area.stat)(${okno});
  nwr["tourism"~"${UBYTOVANI_TAGY}"]["name"~"${SLOVA_BOUDY}",i](area.stat)(${okno});
);
out center;`

/**
 * DOHLEDÁVKA PODLE JMEN Z KATALOGU — druhá záchranná síť.
 *
 * Ani rozšířený dotaz nechytí objekt, který se jmenuje „Kiosek Knajpa",
 * „Pyramida Jizerka" nebo „Hřebínek": slovo „chata" v názvu nemá a tag má
 * civilní. Přitom o jeho existenci VÍME — vede ho externí katalog v repu
 * (`data/externi/katalog-cr-sk-2026/katalog.json`, sběratelské zdroje).
 *
 * Dotaz proto vezme jména z katalogu pro danou oblast a hledá je v OSM
 * jmenovitě. Je to obrácený směr než u ostatních dotazů: tam se ptáme „co
 * v tom okně je?", tady „kde je tohle, o čem víme?". Co se nenajde, se
 * NEVYMÝŠLÍ — zůstane v reportu jako „katalog vede, OSM nemá" a je to
 * úkol pro ruční dohledání souřadnic (DATA-31).
 */
export const overpassDotazDleJmen = (iso: string, jmena: string[], okno: string = BBOX_KRKONOSE): string => {
  // Regex s alternativami je jeden dotaz místo N — Overpass sdílené instance
  // rate-limitují a padesát dotazů po jednom by běh protáhlo o minuty.
  const alternativy = jmena
    .map((j) => j.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
    .join('|')
  /**
   * SÍTO DRUHU JE POVINNÉ. První běh s dohledávkou (30. 7. 2026) se ptal jen
   * na jméno — a přinesl 25 objektů, které chatou nejsou: deset informačních
   * tabulí „Jizerka", dvě autobusové zastávky, osadu, katastrální území,
   * vrchol Hřebínek, piknikové místo i kus silnice. Jméno „Jizerka" totiž
   * v OSM nese kdeco. Dohledávka proto hledá jméno JEN u objektů, které by
   * chatou být mohly; ostatní by triáž musela probírat ručně a utopila by se.
   */
  return `[out:json][timeout:180];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
(
  nwr["name"~"^(${alternativy})$",i]["tourism"~"${HUTOVE_TAGY_A_UBYTOVANI}"](area.stat)(${okno});
  nwr["name"~"^(${alternativy})$",i]["amenity"~"${OBCERSTVENI_TAGY}"](area.stat)(${okno});
);
out center;`
}

/**
 * ROZHLEDNY (rozhodnutí Michala 28. 7. 2026): „v Jizerkách je hodně rozhleden,
 * většina jich má občerstvení nebo restauraci nebo je její součástí chata —
 * všechny takové bych určitě zahrnul. Samotné rozhledny (volně přístupné bez
 * občerstvení) nebereme."
 *
 * Občerstvení u rozhledny OSM skoro nikdy netagguje na věži samotné — bufet
 * bývá vedle jako vlastní objekt. Dotaz proto vybere rozhledny do množiny
 * `.rozhledny` a k nim přibalí objekty s občerstvením v okolí; spárování
 * a rozhodnutí „bereme / nebereme" dělá skript nad odpovědí (`parujRozhledny`),
 * ne dotaz — ať je v surovém exportu vidět i to, co jsme NEvzali.
 *
 * `tower:type=observation` je společný jmenovatel obou obvyklých zápisů
 * (`man_made=tower` i `building=tower`), proto se selektuje jím.
 */
export const OKOLI_OBCERSTVENI_M = 100

export const overpassDotazRozhledny = (iso: string, okno: string = BBOX_KRKONOSE): string => `[out:json][timeout:180];
area["ISO3166-1"="${iso}"][admin_level="2"]->.stat;
nwr["tower:type"="observation"](area.stat)(${okno})->.rozhledny;
(
  .rozhledny;
  nwr(around.rozhledny:${OKOLI_OBCERSTVENI_M})["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten)$"];
  nwr(around.rozhledny:${OKOLI_OBCERSTVENI_M})["tourism"~"^(alpine_hut|wilderness_hut|hut|chalet)$"];
);
out center;`

/**
 * Jména objektů, o kterých VÍME z externího katalogu, ale dotaz je nemusí
 * najít. Bere se jen název — katalog neurčuje, co do průvodce patří (to dělá
 * klíč a redakční triáž), jen říká „tenhle objekt v tomhle pohoří existuje".
 */
export const jmenaZKatalogu = (katalogCesta: string, pohori: string[] | undefined): string[] => {
  if (!pohori?.length || !existsSync(katalogCesta)) return []
  const katalog = JSON.parse(readFileSync(katalogCesta, 'utf8')) as { Pohoří?: string; Název?: string }[]
  const jmena = new Set<string>()
  for (const z of katalog) {
    if (!z.Pohoří || !pohori.includes(z.Pohoří) || !z.Název) continue
    jmena.add(z.Název.trim())
    // Katalog píše plné názvy („Horská chata Smědava"), OSM často jen jádro
    // („Smědava"). Bez zkrácené varianty by dohledávka minula právě to, kvůli
    // čemu vznikla.
    const jadro = z.Název.replace(/^(Horská chata|Chata|Kiosek|Bouda|Penzion|Hotel|Schronisko( PTTK)?)\s+/iu, '').trim()
    if (jadro && jadro !== z.Název.trim()) jmena.add(jadro)
  }
  return [...jmena].sort((a, b) => a.localeCompare(b, 'cs'))
}

export type OsmElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// ── Stažení a načtení exportu ───────────────────────────────────────────────

/** Stáhne surovou odpověď z jedné instance a ověří, že je to validní export. */
const stahniZInstance = async (api: string, dotaz: string, povolitPrazdno = false): Promise<string> => {
  const odpoved = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Slušnost vůči veřejné instanci — ať provozovatel ví, kdo se ptá.
      'User-Agent': 'turistickechaty.cz (DATA-01 export; repo narcopolo158/turistickechaty)',
    },
    body: `data=${encodeURIComponent(dotaz)}`,
  })
  if (!odpoved.ok) {
    const napoveda = odpoved.status === 429 ? ' (rate limit)' : odpoved.status === 504 ? ' (přetížená instance)' : ''
    throw new Error(`HTTP ${odpoved.status}${napoveda}`)
  }
  const text = await odpoved.text()
  const { elementy } = nactiExport(text) // validace už při stažení — vadný export se neukládá
  // Prázdno není výsledek, ale podezření: instance s regionálními daty odpoví
  // na dotaz mimo svůj výřez HTTP 200 a `elements: []`. Bez téhle pojistky by
  // se takový export uložil a běh by hlásil „0 nových kandidátů" jako úspěch.
  if (!elementy.length && !povolitPrazdno) {
    throw new Error('0 objektů — instance nejspíš nemá celosvětová data (nebo dotaz minul); prázdno vynutíš přepínačem --povolit-prazdno')
  }
  return text
}

export type StahniVolby = {
  /** Kolik kol se seznam instancí projde (výchozí 3). */
  kola?: number
  /** Pauzy mezi koly v ms; poslední hodnota platí i pro další kola. */
  pauzy?: number[]
  /** Vstřik spánku (testy si ho nahradí, aby nečekaly). */
  spanek?: (ms: number) => Promise<void>
  /** Prázdná odpověď je legitimní výsledek, ne selhání instance. */
  povolitPrazdno?: boolean
}

const VYCHOZI_PAUZY = [30_000, 90_000]
const usni = (ms: number) => new Promise<void>((hotovo) => setTimeout(hotovo, ms))

/**
 * Zkouší instance po řadě, dokud jedna nevrátí validní export — rate limit
 * či výpadek jedné veřejné instance běh neshodí. Selžou-li všechny, počká
 * a projde je ZNOVU: HTTP 504 z Overpassu znamená „teď mám nával", ne „tvůj
 * dotaz je špatně", a po půl minutě zpravidla projde (28. 7. 2026 spadl běh
 * DATA-01 pro Jizerské hory právě takhle — obě tehdejší instance vrátily 504
 * ve stejné vteřině a jediný pokus na instanci znamenal konec).
 * Selžou-li všechna kola, chyba nese souhrn všech pokusů (do anotace Actions).
 */
export const stahniOverpass = async (
  instance: string[],
  dotaz: string,
  volby: StahniVolby = {},
): Promise<{ raw: string; api: string }> => {
  const kola = Math.max(1, volby.kola ?? 3)
  const pauzy = volby.pauzy ?? VYCHOZI_PAUZY
  const spanek = volby.spanek ?? usni
  const chyby: string[] = []

  for (let kolo = 1; kolo <= kola; kolo++) {
    for (const api of instance) {
      try {
        return { raw: await stahniZInstance(api, dotaz, volby.povolitPrazdno), api }
      } catch (chyba) {
        const zprava = chyba instanceof Error ? chyba.message : String(chyba)
        chyby.push(`${api} (kolo ${kolo}/${kola}): ${zprava}`)
        console.error(`Instance selhala — ${api} (kolo ${kolo}/${kola}): ${zprava}`)
      }
    }
    if (kolo < kola) {
      const pauza = pauzy[Math.min(kolo - 1, pauzy.length - 1)] ?? 0
      console.error(`Všechny instance v kole ${kolo} selhaly — čekám ${Math.round(pauza / 1000)} s a zkusím znovu.`)
      await spanek(pauza)
    }
  }
  throw new Error(`Všechny Overpass instance selhaly:\n${chyby.map((ch) => `- ${ch}`).join('\n')}`)
}

/**
 * Načte surový export: elementy + `checked` = datum stavu OSM dat
 * (osm3s.timestamp_osm_base); bez něj datum dneška (transformace).
 */
export const nactiExport = (rawJson: string): { elementy: OsmElement[]; checked: string } => {
  let telo: { elements?: OsmElement[]; osm3s?: { timestamp_osm_base?: string } }
  try {
    telo = JSON.parse(rawJson)
  } catch {
    throw new Error('Export není validní JSON — Overpass zřejmě vrátil chybovou stránku.')
  }
  if (!Array.isArray(telo.elements)) throw new Error('Export bez pole `elements` — neplatný výstup Overpass.')
  const timestamp = telo.osm3s?.timestamp_osm_base
  const checked =
    typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}/.test(timestamp)
      ? timestamp.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  return { elementy: telo.elements, checked }
}

// ── Mapování OSM elementu na data chaty ─────────────────────────────────────

export const osmUrl = (el: OsmElement): string => `https://www.openstreetmap.org/${el.type}/${el.id}`

export const ATRIBUCE = 'data © přispěvatelé OpenStreetMap, ODbL 1.0 (openstreetmap.org/copyright)'

/** Souřadnice: node je nese přímo, way/relation dává Overpass přes `out center`. */
export const souradnice = (el: OsmElement): { lat: number; lng: number } | null => {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

/** Nadmořská výška z tagu `ele` — jen rozumné číslo, jinak se nezapisuje. */
const vyskaZTagu = (ele: string | undefined): number | null => {
  if (!ele) return null
  const cislo = Number(ele.replace(',', '.').replace(/\s*m$/i, ''))
  return Number.isFinite(cislo) && cislo > 0 && cislo < 4900 ? Math.round(cislo) : null
}

/** Vícehodnotové OSM tagy (alt_name apod.) oddělují hodnoty středníkem. */
const hodnoty = (tag: string | undefined): string[] =>
  (tag ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

export type Preskoceni = { duvod: 'bez-nazvu' | 'bez-souradnic'; url: string }

/**
 * Sestaví data chaty z OSM tagů — jen doložená pole. Bez názvu nebo souřadnic
 * se objekt přeskakuje (nemá jak dostat slug, resp. nepatří na mapu ani do
 * katalogu bez lokace) a jde do reportu k ruční kontrole.
 */
export const chataZElementu = (
  el: OsmElement,
  checked: string,
  zeme: Zeme = 'cz',
  volby: { oblast?: string; obcerstveni?: ObcerstveniUObjektu[] } = {},
): { data: Record<string, unknown> } | Preskoceni => {
  const tagy = el.tags ?? {}
  const url = osmUrl(el)
  if (!tagy.name) return { duvod: 'bez-nazvu', url }
  const gps = souradnice(el)
  if (!gps) return { duvod: 'bez-souradnic', url }

  const data: Record<string, unknown> = {
    nazev: tagy.name,
    slug: slugify(tagy.name),
    zeme, // zaručeno průnikem s area ISO3166-1 daného státu přímo v dotazu
    oblast: volby.oblast ?? 'krkonose',
    // `stav` vědomě chybí: OSM provoz spolehlivě nenese, nedomýšlíme.
  }
  // Typ jen z jednoznačného tagu; nestandardní `hut` nechává typ redakci.
  if (tagy.tourism === 'alpine_hut') data.typ = 'obsluhovana'
  if (tagy.tourism === 'wilderness_hut') data.typ = 'utulna'
  // Rozhledna se sem dostane jen s doloženým občerstvením (viz parujRozhledny),
  // takže typ je jednoznačný — číselník ho od 28. 7. 2026 zná.
  if (jeRozhledna(el)) data.typ = 'rozhledna'

  const aliasy = [
    ...hodnoty(tagy.alt_name).map((nazev) => ({ nazev, poznamka: 'alternativní název (OSM alt_name)' })),
    ...hodnoty(tagy.old_name).map((nazev) => ({ nazev, poznamka: 'historický název (OSM old_name)' })),
  ]
  if (aliasy.length > 0) data.aliasy = aliasy

  data.lat = gps.lat
  data.lng = gps.lng
  const vyska = vyskaZTagu(tagy.ele)
  if (vyska != null) data.vyska = vyska
  if (tagy['addr:city']) data.obec = tagy['addr:city']
  data.overeniLokace = {
    source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
    verified: false,
    checked,
  }

  const kontakty: Record<string, string> = {}
  const telefon = tagy.phone ?? tagy['contact:phone']
  const email = tagy.email ?? tagy['contact:email']
  const web = tagy.website ?? tagy['contact:website']
  if (telefon) kontakty.telefon = telefon
  if (email) kontakty.email = email
  if (web) kontakty.web = web
  if (Object.keys(kontakty).length > 0) {
    data.kontakty = kontakty
    data.overeniProvoz = {
      source: `OpenStreetMap ${url} — ${ATRIBUCE}`,
      verified: false,
      checked,
    }
  }

  const poznamky = [
    `KANDIDÁT z OSM (DATA-01, stav dat ${checked}) — na web povýšit do data/chaty/ až po křížovém ověření (DATA-03).`,
    jeRozhledna(el)
      ? 'ROZHLEDNA S OBČERSTVENÍM (rozhodnutí Michala 28. 7. 2026: rozhledny bereme jen s občerstvením/restaurací nebo s chatou) — typ `rozhledna`.'
      : tagy.tourism === 'hut'
        ? 'OSM tag tourism=hut je nestandardní — typ nevyplněn, určí redakce.'
        : `Typ odvozen z OSM tagu tourism=${tagy.tourism} (alpine_hut = obsluhovaná, wilderness_hut = útulna).`,
    // Doklad občerstvení: konkrétní OSM objekty a vzdálenosti, ať je co ověřit.
    // Bez dokladu se rozhledna kandidátem vůbec nestane (viz parujRozhledny).
    ...(volby.obcerstveni?.length
      ? [
          `Doklad občerstvení (OSM, ${OKOLI_OBCERSTVENI_M} m okolí): ${volby.obcerstveni
            .map((o) => `${o.nazev ?? '(bez názvu)'} — ${o.znacka}, ${o.vzdalenostM} m, ${o.url}`)
            .join(' · ')}`,
        ]
      : []),
    ...(tagy.height ? [`Výška věže dle OSM: ${tagy.height} m`] : []),
    ...(tagy.operator ? [`Provozovatel dle OSM: ${tagy.operator}`] : []),
    ...(tagy.opening_hours ? [`Otvírací doba dle OSM (surový formát, neověřeno): ${tagy.opening_hours}`] : []),
    ...(tagy.note ? [`Poznámka z OSM: ${tagy.note}`] : []),
  ]
  data.interniPoznamky = poznamky.join('\n')

  return { data }
}

// ── Porovnání s ručně kurátorovaným profilem ────────────────────────────────

// ── rozhledny s občerstvením ────────────────────────────────────────────────

const OBCERSTVENI_AMENITY = new Set(['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'biergarten'])
const CHATA_TOURISM = new Set(['alpine_hut', 'wilderness_hut', 'hut', 'chalet'])

export type ObcerstveniUObjektu = {
  url: string
  nazev: string | null
  znacka: string
  vzdalenostM: number
  /** Občerstvení je samo chata (pak rozhledna nejspíš patří k ní, ne naopak). */
  jeChata: boolean
}
export type Rozhledna = { el: OsmElement; obcerstveni: ObcerstveniUObjektu[] }

/**
 * Nejnižší doložená výška, při které objekt ještě bereme jako rozhlednu.
 * První ostrý běh v Jizerských horách (28. 7. 2026) přinesl mezi devíti nálezy
 * i „vyhlídku na Harrachov" s `height=5` — pětimetrová plošina u skokanských
 * můstků není rozhledna a v průvodci nemá co dělat. Filtr sahá JEN na objekty,
 * které výšku doloženou mají: co OSM neuvádí, se nedomýšlí a jde k posouzení.
 */
export const MIN_VYSKA_ROZHLEDNY_M = 8

/** Doložená výška věže z tagu `height` (jen číslo v metrech), jinak null. */
export const vyskaVeze = (el: OsmElement): number | null => {
  const h = Number.parseFloat((el.tags?.height ?? '').replace(',', '.'))
  return Number.isFinite(h) && h > 0 ? h : null
}

export const jeRozhledna = (el: OsmElement): boolean => el.tags?.['tower:type'] === 'observation'

/** Rozhledna, jejíž doložená výška je pod prahem — vyhlídková plošina, ne věž. */
export const jePrilisNizka = (el: OsmElement): boolean => {
  const v = vyskaVeze(el)
  return v != null && v < MIN_VYSKA_ROZHLEDNY_M
}

/** Doklad občerstvení z tagů objektu — `null`, když objekt občerstvení nenese. */
export const znackaObcerstveni = (el: OsmElement): { znacka: string; jeChata: boolean } | null => {
  const t = el.tags ?? {}
  if (t.amenity && OBCERSTVENI_AMENITY.has(t.amenity)) return { znacka: `amenity=${t.amenity}`, jeChata: false }
  if (t.tourism && CHATA_TOURISM.has(t.tourism)) return { znacka: `tourism=${t.tourism}`, jeChata: true }
  return null
}

/**
 * Ke každé rozhledně z odpovědi najde objekty s občerstvením do `limitM`.
 * Rozhledna, která občerstvení nese sama (bufet zatagovaný přímo na věži),
 * dostane doklad se vzdáleností 0. Prázdný seznam = rozhledna, kterou dle
 * rozhodnutí Michala NEBEREME — ale zůstane v reportu, ať je vidět, co se
 * zahodilo a proč.
 */
export const parujRozhledny = (elementy: OsmElement[], limitM: number = OKOLI_OBCERSTVENI_M): Rozhledna[] => {
  const rozhledny = elementy.filter(jeRozhledna)
  const zdroje = elementy.filter((el) => !jeRozhledna(el) && znackaObcerstveni(el))
  return rozhledny.map((el) => {
    const gps = souradnice(el)
    const obcerstveni: ObcerstveniUObjektu[] = []
    const vlastni = znackaObcerstveni(el)
    if (vlastni) {
      obcerstveni.push({ url: osmUrl(el), nazev: el.tags?.name ?? null, znacka: vlastni.znacka, vzdalenostM: 0, jeChata: vlastni.jeChata })
    }
    if (gps) {
      for (const z of zdroje) {
        const zGps = souradnice(z)
        if (!zGps) continue
        const d = vzdalenostM(gps.lat, gps.lng, zGps.lat, zGps.lng)
        if (d > limitM) continue
        const zn = znackaObcerstveni(z)!
        obcerstveni.push({ url: osmUrl(z), nazev: z.tags?.name ?? null, znacka: zn.znacka, vzdalenostM: d, jeChata: zn.jeChata })
      }
    }
    obcerstveni.sort((a, b) => a.vzdalenostM - b.vzdalenostM || a.url.localeCompare(b.url))
    return { el, obcerstveni }
  })
}

/** Vzdálenost dvou GPS bodů v metrech (haversine — stačí na sanity check). */
export const vzdalenostM = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371008.8
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

export type Porovnani = {
  slug: string
  url: string
  nazevOsm: string
  nazevRucni: string | null
  /** Vzdálenost OSM bodu od ručně zapsané GPS (m); null, když ruční profil GPS nemá. */
  gpsRozdilM: number | null
  vyskaOsm: number | null
  vyskaRucni: number | null
}

/** OSM objekt vs. ruční YAML — nic nepřepisuje, jen doloží rozdíly do reportu. */
export const porovnejSRucnim = (el: OsmElement, rucniYaml: string, slug: string): Porovnani => {
  const rucni = parse(rucniYaml) as { nazev?: string; lat?: number; lng?: number; vyska?: number } | null
  const gps = souradnice(el)
  const maRucniGps = typeof rucni?.lat === 'number' && typeof rucni?.lng === 'number'
  return {
    slug,
    url: osmUrl(el),
    nazevOsm: el.tags?.name ?? '',
    nazevRucni: rucni?.nazev ?? null,
    gpsRozdilM: gps && maRucniGps ? vzdalenostM(gps.lat, gps.lng, rucni.lat as number, rucni.lng as number) : null,
    vyskaOsm: vyskaZTagu(el.tags?.ele),
    vyskaRucni: typeof rucni?.vyska === 'number' ? rucni.vyska : null,
  }
}

// ── YAML soubor ─────────────────────────────────────────────────────────────

/**
 * YAML s hlavičkovým komentářem (zdroj, atribuce, upozornění redakci).
 * Hodnoty serializuje knihovna `yaml` — žádné ruční escapování názvů.
 */
export const yamlChaty = (data: Record<string, unknown>, url: string, checked: string): string =>
  [
    `# ${data.nazev} — KANDIDÁT z OpenStreetMap (DATA-01, stav OSM dat ${checked})`,
    `# Zdroj: ${url} · ${ATRIBUCE}`,
    '# Vše verified: false — údaje převzaty z OSM tagů, redakčně neověřeno. Na web',
    `# (data/chaty/${data.oblast ?? 'krkonose'}/) povyšovat až po křížovém ověření (DATA-03). Stav`,
    '# provozu OSM nenese, proto tu není. Nic nedomýšlet!',
    '',
    stringify(data),
  ].join('\n')

export type Report = {
  zapsano: { slug: string; nazev: string; url: string }[]
  jizKandidat: { slug: string; url: string }[]
  rucni: Porovnani[]
  preskoceno: Preskoceni[]
  vyrazeno: { url: string; duvod: string }[]
}

/** Element s metadaty svého exportu (země dle area v dotazu, checked dle stavu dat). */
export type ExportPolozka = { el: OsmElement; zeme: Zeme; checked: string; obcerstveni?: ObcerstveniUObjektu[] }

/**
 * Zapíše YAML kandidátů (obě země do téhož adresáře pohoří — Krkonoše jsou
 * jedno pohoří, zemi nese chata). Ruční profily v `data/chaty/krkonose/` se
 * nikdy nepřepisují — jen porovnají; existující kandidát zůstává
 * (idempotence, případné ruční úpravy kandidáta se neztrácejí). Kolizi
 * slugů dvou OSM objektů v jednom běhu — i napříč zeměmi — řeší
 * deterministický suffix `-<osm id>`.
 */
export const zapisKandidaty = (
  polozky: ExportPolozka[],
  kandidatiAdresar: string,
  rucniAdresar: string,
  vyrazene: Map<string, string> = new Map(),
  // Oblast se zapisuje do YAML kandidáta. Výchozí „krkonose" drží zpětnou
  // kompatibilitu; běh pro jinou oblast ji předává z konfigurace (28. 7. 2026
  // právě tenhle hardcode poslal sedm jizerskohorských kandidátů do Krkonoš).
  oblast: string = 'krkonose',
): Report => {
  const report: Report = { zapsano: [], jizKandidat: [], rucni: [], preskoceno: [], vyrazeno: [] }
  const slugyBehu = new Set<string>()
  mkdirSync(kandidatiAdresar, { recursive: true })

  // Deterministické pořadí výstupu nezávislé na pořadí z API.
  const serazene = [...polozky].sort(
    (a, b) => (a.el.tags?.name ?? '').localeCompare(b.el.tags?.name ?? '', 'cs') || a.el.id - b.el.id,
  )

  for (const { el, zeme, checked, obcerstveni } of serazene) {
    // Redakčně vyřazené objekty (duplicity, mimo pohoří) se znovu nezakládají.
    const duvodVyrazeni = vyrazene.get(osmUrl(el))
    if (duvodVyrazeni !== undefined) {
      report.vyrazeno.push({ url: osmUrl(el), duvod: duvodVyrazeni })
      continue
    }
    const vysledek = chataZElementu(el, checked, zeme, { oblast, obcerstveni })
    if ('duvod' in vysledek) {
      report.preskoceno.push(vysledek)
      continue
    }
    const { data } = vysledek

    // Ručně kurátorovaný profil má absolutní přednost — jen porovnat.
    const rucniCesta = join(rucniAdresar, `${data.slug as string}.yaml`)
    if (existsSync(rucniCesta)) {
      report.rucni.push(porovnejSRucnim(el, readFileSync(rucniCesta, 'utf8'), data.slug as string))
      continue
    }

    let slug = data.slug as string
    if (slugyBehu.has(slug)) slug = `${slug}-${el.id}` // dvě chaty téhož jména v OSM
    data.slug = slug
    slugyBehu.add(slug)

    const cesta = join(kandidatiAdresar, `${slug}.yaml`)
    if (existsSync(cesta)) {
      report.jizKandidat.push({ slug, url: osmUrl(el) })
      continue
    }
    writeFileSync(cesta, yamlChaty(data, osmUrl(el), checked), 'utf8')
    report.zapsano.push({ slug, nazev: data.nazev as string, url: osmUrl(el) })
  }
  return report
}

// ── CLI ─────────────────────────────────────────────────────────────────────

/**
 * SLOUČENÍ TÉHOŽ OBJEKTU, KTERÝ PŘIŠEL DVAKRÁT.
 *
 * OSM běžně vede jednu boudu jako POI uzel A ZÁROVEŇ jako budovu (way).
 * Dokud se dotaz ptal na jediný tag, přišla vždycky jen jedna z těch dvou
 * entit. Rozšířený dotaz (30. 7. 2026) se ptá na hutové tagy, na civilně
 * tagované boudy i na jména z katalogu — a týž objekt tak propadne dvěma
 * vrstvami naráz. První ostrý běh vyrobil pět takových dvojic
 * (Šámalova chata 0 m, Hubertka 4 m, Prezidentská chata 5 m, chata Hvězda
 * 6 m, Schronisko Halny 100 m) a shodil kontrolu kolizí jmen.
 *
 * Slučuje se jen při shodě OBOJÍHO: jádro názvu i poloha do
 * `SLOUCIT_DO_M`. Sama shoda jména nestačí — jmenovci v různých pohořích
 * jsou legitimní (Hubertka jizerská × krkonošská, 33 km) a sloučit je by
 * znamenalo smazat objekt. Sama poloha taky ne: chata a rozhledna na témž
 * kopci jsou dva objekty a rozhoduje o nich redakce.
 *
 * Zůstává entita s VÍC TAGY (nese víc doložených údajů); URL té druhé se
 * vrací, aby se dala zapsat do `interniPoznamky` — ať je co ověřovat.
 */
export const SLOUCIT_DO_M = 150

const jadroNazvu = (s: string | undefined): string =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .replace(/(^| )(chata|chatka|bouda|boudy|schronisko|horska|horsky|hotel|penzion|rozhledna|turystyczne|turisticka)( |$)/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()

export const slucDuplicity = <T extends { el: OsmElement }>(
  polozky: T[],
): { polozky: T[]; slouceno: { zustava: string; slouceno: string; nazev: string; vzdalenostM: number }[] } => {
  const bod = (el: OsmElement) => ({ lat: el.center?.lat ?? el.lat, lng: el.center?.lon ?? el.lon })
  const pocetTagu = (el: OsmElement) => Object.keys(el.tags ?? {}).length
  const vysledek: T[] = []
  const slouceno: { zustava: string; slouceno: string; nazev: string; vzdalenostM: number }[] = []

  for (const p of polozky) {
    const jadro = jadroNazvu(p.el.tags?.name)
    const a = bod(p.el)
    const dvojnik = jadro
      ? vysledek.find((q) => {
          const b = bod(q.el)
          if (jadroNazvu(q.el.tags?.name) !== jadro) return false
          if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return false
          return vzdalenostM(a.lat, a.lng, b.lat, b.lng) <= SLOUCIT_DO_M
        })
      : undefined
    if (!dvojnik) {
      vysledek.push(p)
      continue
    }
    const b = bod(dvojnik.el)
    const vzdal = Math.round(vzdalenostM(a.lat!, a.lng!, b.lat!, b.lng!))
    // Vítězí entita s víc tagy; při rovnosti zůstává ta dřívější.
    const prohral = pocetTagu(p.el) > pocetTagu(dvojnik.el) ? dvojnik : p
    const vitez = prohral === p ? dvojnik : p
    if (prohral === dvojnik) vysledek[vysledek.indexOf(dvojnik)] = p
    slouceno.push({
      zustava: osmUrl(vitez.el),
      slouceno: osmUrl(prohral.el),
      nazev: vitez.el.tags?.name ?? '(bez názvu)',
      vzdalenostM: vzdal,
    })
  }
  return { polozky: vysledek, slouceno }
}

const main = async () => {
  const argv = process.argv.slice(2)
  const apiIndex = argv.indexOf('--api')
  const instance = apiIndex >= 0 && argv[apiIndex + 1] ? [argv[apiIndex + 1]] : VYCHOZI_API_INSTANCE
  const zJsonu = argv.includes('--z-jsonu')
  // Prázdný výsledek je ve výchozím stavu selhání instance (viz stahniZInstance).
  // Přepínač je pro případ, kdy víme, že v okně opravdu nic není.
  const povolitPrazdno = argv.includes('--povolit-prazdno')

  const oblast: OblastKonfig = oblastZArgv(argv)
  // Země dotazu bere konfigurace oblasti (přeshraniční pohoří „vcelku").
  const kandAdr = kandidatiAdresar(oblast.slug)
  const rucAdr = rucniAdresar(oblast.slug)
  const okno = bboxStr(oblast.bbox)
  console.log(`Oblast: ${oblast.nazev} (${oblast.slug}) — okno dotazu ${okno}`)

  // Jeden seznam pro všechny tři dotazy (chaty, dohledávka podle jmen,
  // rozhledny) — kdyby se lišily, ptala by se každá část jiných zemí.
  const zeme_dotazu = zemeDotazu(oblast)
  console.log(`Země dotazu: ${zeme_dotazu.map((z) => z.iso).join(', ')} (dle konfigurace oblasti)`)

  const polozky: ExportPolozka[] = []
  const stavy: string[] = []
  // Pád jedné země NERUŠÍ celý běh (rozhodnutí Michala 30. 7. 2026) — zapíše
  // se, co se stáhlo, a `verdiktBehu` se postará, aby neúplnost byla vidět.
  const stavyZemi: StavZeme[] = []
  for (const { zeme, iso } of zeme_dotazu) {
    const soubor = join(kandAdr, `_overpass-export-${zeme}.json`)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export ${soubor} neexistuje — země ${zeme} se přeskakuje (stáhne ji běh bez --z-jsonu).`)
        continue
      }
      console.log(`Offline transformace commitnutého exportu ${soubor}…`)
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (hutové tagy + civilně tagované boudy podle názvu, ${iso} ∩ okno ${oblast.nazev}); instance: ${instance.join(', ')}…`)
      try {
        const vysledek = await stahniOverpass(instance, overpassDotaz(iso, okno), { povolitPrazdno })
        raw = vysledek.raw
        console.log(`Staženo z ${vysledek.api}.`)
        mkdirSync(kandAdr, { recursive: true })
        writeFileSync(soubor, raw, 'utf8')
        console.log(`Surový export uložen: ${soubor} (commituje se jako doklad).`)
      } catch (chyba) {
        const zprava = chyba instanceof Error ? chyba.message : String(chyba)
        console.error(`\n::warning::Dotaz ${iso} se nepovedl — pokračuji bez něj. ${zprava.split('\n')[0]}`)
        stavyZemi.push({ iso, ok: false, chyba: zprava })
        continue
      }
    }
    const { elementy, checked } = nactiExport(raw)
    console.log(`Export ${zeme}: ${elementy.length} objektů, stav OSM dat ${checked}.`)
    stavy.push(`${zeme} ${checked}`)
    stavyZemi.push({ iso, ok: true })
    polozky.push(...elementy.map((el) => ({ el, zeme, checked })))
  }
  if (polozky.length === 0 && zJsonu) {
    throw new Error('--z-jsonu: žádný commitnutý export nenalezen — nejdřív ho stáhne workflow/běh bez --z-jsonu.')
  }
  const verdikt = verdiktBehu(stavyZemi)
  if (!zJsonu && !verdikt.zapsat) throw new Error(verdikt.zprava)

  // ── dohledávka podle jmen z katalogu ──────────────────────────────────────
  // Druhá záchranná síť po nálezu 30. 7. 2026 (chyběly Smědava, Knajpa,
  // chaty na Jizerce). Co katalog vede a dotaz nenajde, se NEVYMÝŠLÍ —
  // vypíše se na konci jako úkol pro ruční dohledání (DATA-31).
  const jmena = jmenaZKatalogu(join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json'), oblast.katalogPohori)
  const nalezenaJmena = new Set<string>()
  if (jmena.length) {
    console.log(`\nDohledávka podle ${jmena.length} jmen z externího katalogu (${oblast.katalogPohori?.join(', ')})…`)
    for (const { zeme, iso } of zeme_dotazu) {
      const soubor = join(kandAdr, `_overpass-dle-jmen-${zeme}.json`)
      let raw: string
      if (zJsonu) {
        if (!existsSync(soubor)) continue
        raw = readFileSync(soubor, 'utf8')
      } else {
        try {
          // Prázdno je tu legitimní: v druhé zemi nemusí být z katalogu nic.
          const vysledek = await stahniOverpass(instance, overpassDotazDleJmen(iso, jmena, okno), { povolitPrazdno: true })
          raw = vysledek.raw
          mkdirSync(kandAdr, { recursive: true })
          writeFileSync(soubor, raw, 'utf8')
        } catch (chyba) {
          // Dohledávka je záchranná síť, ne podmínka: bez ní se jen nedoplní
          // civilně tagované boudy z katalogu — a to se vypíše.
          console.error(`::warning::Dohledávka podle jmen (${iso}) se nepovedla — pokračuji bez ní. ${(chyba instanceof Error ? chyba.message : String(chyba)).split('\n')[0]}`)
          continue
        }
      }
      const { elementy, checked } = nactiExport(raw)
      console.log(`  ${zeme}: ${elementy.length} objektů dohledáno podle jména.`)
      for (const el of elementy) {
        const nazev = el.tags?.name?.trim()
        if (nazev) nalezenaJmena.add(nazev)
        // Duplicity s hlavním exportem se zahodí — týž objekt jednou.
        if (!polozky.some((p) => p.el.type === el.type && p.el.id === el.id)) {
          polozky.push({ el, zeme, checked })
        }
      }
    }
  }

  // ── sloučení téhož objektu z různých vrstev dotazu ────────────────────────
  {
    const pred = polozky.length
    const { polozky: bezDuplicit, slouceno } = slucDuplicity(polozky)
    polozky.length = 0
    polozky.push(...bezDuplicit)
    if (slouceno.length) {
      console.log(`\nSloučeno ${pred - polozky.length} duplicit (týž objekt z víc vrstev dotazu, do ${SLOUCIT_DO_M} m):`)
      for (const d of slouceno) console.log(`- ${d.nazev}: zůstává ${d.zustava}, sloučeno ${d.slouceno} (${d.vzdalenostM} m)`)
    }
  }

  // ── rozhledny (jen s doloženým občerstvením) ──────────────────────────────
  // URL chat z hlavního exportu: rozhledna, u které je občerstvením PRÁVĚ
  // takováto chata, se nezakládá zvlášť — byl by to druhý objekt na témž
  // místě. Do reportu jde jako dvojice a redakce rozhodne, co je hlavní.
  const urlChat = new Set(polozky.map((p) => osmUrl(p.el)))
  const rozhlednyVzate: { nazev: string; url: string; doklad: string }[] = []
  const rozhlednyUChaty: { nazev: string; url: string; chata: string }[] = []
  const rozhlednyBezObcerstveni: { nazev: string; url: string }[] = []
  const rozhlednyNizke: { nazev: string; url: string; vyska: number }[] = []

  for (const { zeme, iso } of zeme_dotazu) {
    const soubor = join(kandAdr, `_overpass-rozhledny-${zeme}.json`)
    let raw: string
    if (zJsonu) {
      if (!existsSync(soubor)) {
        console.log(`--z-jsonu: export rozhleden ${soubor} neexistuje — země ${zeme} se přeskakuje.`)
        continue
      }
      raw = readFileSync(soubor, 'utf8')
    } else {
      console.log(`Overpass dotaz ${iso} (rozhledny tower:type=observation + občerstvení do ${OKOLI_OBCERSTVENI_M} m)…`)
      let vysledek: Awaited<ReturnType<typeof stahniOverpass>>
      try {
        // Oblast bez jediné rozhledny je legitimní stav, prázdno tu neplaší.
        vysledek = await stahniOverpass(instance, overpassDotazRozhledny(iso, okno), { povolitPrazdno: true })
      } catch (chyba) {
        console.error(`::warning::Dotaz na rozhledny (${iso}) se nepovedl — pokračuji bez nich. ${(chyba instanceof Error ? chyba.message : String(chyba)).split('\n')[0]}`)
        continue
      }
      raw = vysledek.raw
      mkdirSync(kandAdr, { recursive: true })
      writeFileSync(soubor, raw, 'utf8')
      console.log(`Surový export rozhleden uložen: ${soubor}.`)
    }
    const { elementy, checked } = nactiExport(raw)
    for (const r of parujRozhledny(elementy)) {
      const nazev = r.el.tags?.name ?? '(bez názvu)'
      // Doložená výška pod prahem = vyhlídková plošina, ne rozhledna.
      if (jePrilisNizka(r.el)) {
        rozhlednyNizke.push({ nazev, url: osmUrl(r.el), vyska: vyskaVeze(r.el)! })
        continue
      }
      if (!r.obcerstveni.length) {
        rozhlednyBezObcerstveni.push({ nazev, url: osmUrl(r.el) })
        continue
      }
      const chataVedle = r.obcerstveni.find((o) => o.jeChata && urlChat.has(o.url))
      if (chataVedle) {
        rozhlednyUChaty.push({ nazev, url: osmUrl(r.el), chata: `${chataVedle.nazev ?? '(bez názvu)'} (${chataVedle.vzdalenostM} m, ${chataVedle.url})` })
        continue
      }
      polozky.push({ el: r.el, zeme, checked, obcerstveni: r.obcerstveni })
      rozhlednyVzate.push({
        nazev,
        url: osmUrl(r.el),
        doklad: r.obcerstveni.map((o) => `${o.nazev ?? '(bez názvu)'} — ${o.znacka}, ${o.vzdalenostM} m`).join(' · '),
      })
    }
  }

  const report = zapisKandidaty(polozky, kandAdr, rucAdr, nactiVyrazene(), oblast.slug)

  console.log(`\n## DATA-01 report (stav OSM dat: ${stavy.join(', ')})`)
  // Verdikt se týká STAHOVÁNÍ, offline transformace ho nemá co hlásit.
  if (!zJsonu) {
    console.log(`\n${verdikt.zprava}`)
    // Sentinel čte workflow a přilepí ho do commit message — aby ani po
    // měsících nešlo z historie vyčíst „export hotov", když v něm země chybí.
    if (verdikt.sentinel) console.log(verdikt.sentinel)
  }
  console.log(`\nNoví kandidáti: ${report.zapsano.length}`)
  for (const ch of report.zapsano) console.log(`- ${ch.nazev} (\`${ch.slug}.yaml\`) — ${ch.url}`)
  console.log(`\nUž kandidátem z dřívějška (nepřepsáno): ${report.jizKandidat.length}`)
  for (const ch of report.jizKandidat) console.log(`- ${ch.slug} — ${ch.url}`)
  console.log(`\nRučně kurátorované profily (nedotčeny — jen porovnání s OSM): ${report.rucni.length}`)
  for (const p of report.rucni) {
    const gps = p.gpsRozdilM != null ? `GPS rozdíl ${p.gpsRozdilM} m` : 'GPS v ručním profilu chybí'
    const vyska =
      p.vyskaOsm != null && p.vyskaRucni != null
        ? `výška OSM ${p.vyskaOsm} m vs. ruční ${p.vyskaRucni} m`
        : `výška OSM ${p.vyskaOsm ?? '—'} / ruční ${p.vyskaRucni ?? '—'}`
    console.log(`- ${p.slug}: ${gps}; ${vyska}${p.nazevOsm !== p.nazevRucni ? `; název OSM „${p.nazevOsm}" vs. „${p.nazevRucni}"` : ''} — ${p.url}`)
  }
  console.log(`\nPřeskočeno — neúplné v OSM (k ruční kontrole): ${report.preskoceno.length}`)
  for (const p of report.preskoceno) console.log(`- ${p.url} (${p.duvod === 'bez-nazvu' ? 'chybí name' : 'chybí souřadnice'})`)
  console.log(`\nVyřazeno redakcí (data/kandidati/_vyrazeno.yaml — nezakládá se): ${report.vyrazeno.length}`)
  for (const v of report.vyrazeno) console.log(`- ${v.url} — ${v.duvod}`)

  console.log(`\n### Rozhledny (bereme jen s doloženým občerstvením — rozhodnutí Michala 28. 7. 2026)`)
  console.log(`\nVzaté jako kandidáti: ${rozhlednyVzate.length}`)
  for (const r of rozhlednyVzate) console.log(`- ${r.nazev} — doklad: ${r.doklad} — ${r.url}`)
  console.log(`\nU chaty, která už kandidátem je (dvojici posoudí redakce, zvlášť se nezakládá): ${rozhlednyUChaty.length}`)
  for (const r of rozhlednyUChaty) console.log(`- ${r.nazev} × ${r.chata} — ${r.url}`)
  console.log(`\nBez doloženého občerstvení (NEBEREME): ${rozhlednyBezObcerstveni.length}`)
  for (const r of rozhlednyBezObcerstveni) console.log(`- ${r.nazev} — ${r.url}`)
  console.log(`\nPod prahem výšky ${MIN_VYSKA_ROZHLEDNY_M} m — vyhlídková plošina, ne rozhledna (NEBEREME): ${rozhlednyNizke.length}`)
  for (const r of rozhlednyNizke) console.log(`- ${r.nazev} (${r.vyska} m) — ${r.url}`)

  // Co katalog vede a OSM nemá: úkol pro ruční dohledání, ne důvod k výmyslu.
  if (jmena.length) {
    const nenalezene = jmena.filter((j) => ![...nalezenaJmena].some((n) => n.localeCompare(j, 'cs', { sensitivity: 'accent' }) === 0))
    console.log(`\nKatalog vede, OSM podle jména nenašlo (${nenalezene.length} z ${jmena.length}) — souřadnice doplní ruční dohledávka DATA-31:`)
    for (const j of nenalezene) console.log(`- ${j}`)
  }
}

// Spuštěno přímo (tsx) → CLI; import z testů main nespouští.
if (process.argv[1]?.endsWith('data01-overpass-krkonose.ts')) {
  main().catch((chyba: unknown) => {
    console.error(chyba instanceof Error ? chyba.message : chyba)
    process.exit(1)
  })
}
