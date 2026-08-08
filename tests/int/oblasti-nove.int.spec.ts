/**
 * OSM oblasti založené 8. 8. 2026 — od páté (Beskydy) po dvanáctou (Nízké
 * Tatry). Vznikly ve třech vlnách podle tří Michalových pokynů téhož dne:
 * „můžeš se pustit do beskyd a jeseníku" (Beskydy, Jeseníky), „javorniky
 * a vsetinske vrchy bych udelal jako jednu samostatnou oblast" a „kandidaty
 * budoucich oblasti nech a rovnou je zaloz" (Malá Fatra, Oravská Magura,
 * Západné Tatry), nakonec „kdyz uz jsme na slovensku, vezmi rovnou i vysoke
 * a nizke tatry".
 *
 * Testy hlídají čtyři věci, které se u založení oblasti dají tiše zkazit —
 * tiše proto, že se neprojeví chybou, ale MENŠÍM VÝSLEDKEM:
 *   1. Okno dotazu obsahuje krajní doložené body pohoří. Malé okno je
 *      nejtišší chyba ze všech: Overpass prostě vrátí míň a nikdo neví, že
 *      něco chybí. Jizerská jižní hrana se kvůli tomu posouvala třikrát.
 *   2. `katalogPohori` sedí na SKUTEČNÁ jména v externím katalogu. Překlep
 *      by vypnul dohledávku podle jmen, tedy druhou záchrannou síť DATA-01,
 *      a to úplně beze slova.
 *   3. Slovensko je zapojené celou cestou — od dotazu (`zemeDotazu`) po URL
 *      (`ZEME_SLUG`). Kdyby chybělo v jednom článku, slovenská část oblasti
 *      by z pipeline vypadla bez hlášky. Totéž Polsko u Jeseníků.
 *   4. Rozhodnutí o rozsahu zůstávají v datech zapsaná — jak ta hotová
 *      (rozdělení Beskyd a Javorníků), tak ta otevřená (Góry Bystrzyckie).
 *      Hotové proto, aby je nikdo nevrátil naslepo; otevřené proto, že
 *      rozsah, který vypadá hotově, je horší než přiznaná otázka.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { ZEME_SLUG } from '@/lib/chaty'
import { bboxStr, oblastDleSlugu, zemeDotazu } from '../../scripts/oblasti'

type OblastYaml = {
  nazev?: string
  slug?: string
  sklonovani?: { druhy?: string; sesty?: string }
  charakteristika?: string
  overeniCharakteristika?: { source?: string; verified?: boolean; checked?: string }
  nejvyssiHora?: { nazev?: string; vyska?: number; source?: string }
  topCile?: { nazev?: string; source?: string }[]
  interniPoznamky?: string
}

const nactiYaml = (slug: string): OblastYaml =>
  parse(readFileSync(join(process.cwd(), 'data', 'oblasti', `${slug}.yaml`), 'utf8')) as OblastYaml

type Katalog = { Pohoří?: string }[]
const KATALOG = JSON.parse(
  readFileSync(
    join(process.cwd(), 'data', 'externi', 'katalog-cr-sk-2026', 'katalog.json'),
    'utf8',
  ),
) as Katalog
const POHORI_V_KATALOGU = new Set(KATALOG.map((r) => r['Pohoří']).filter(Boolean) as string[])

/**
 * Body, které okno MUSÍ obsáhnout. Souřadnice jsou z pramenů dohledaných
 * 8. 8. 2026 (PeakVisor, turistika.cz, treking.cz) a jsou zapsané
 * i v komentáři u konfigurace oblasti. Nejsou to publikované údaje —
 * slouží jen jako kotvy okna, přesně jako bbox sám.
 */
const KOTVY: Record<string, { nazev: string; lat: number; lng: number }[]> = {
  beskydy: [
    { nazev: 'Lysá hora', lat: 49.546, lng: 18.448 },
    { nazev: 'Radhošť', lat: 49.492, lng: 18.223 },
    { nazev: 'Barania Góra', lat: 49.612, lng: 19.011 },
    { nazev: 'Skrzyczne', lat: 49.685, lng: 19.03 },
    { nazev: 'Szyndzielnia (severní kotva)', lat: 49.753, lng: 18.999 },
    { nazev: 'Babia Góra', lat: 49.573, lng: 19.53 },
    { nazev: 'Wielka Racza / Veľká Rača', lat: 49.413, lng: 18.968 },
    { nazev: 'Gírová', lat: 49.532, lng: 18.8 },
    { nazev: 'Hala Krupowa (východní kotva)', lat: 49.625, lng: 19.653 },
  ],
  // Vsacký Cáb a Kohútka z tohohle seznamu 8. 8. 2026 ODEŠLY do vlastní
  // oblasti — Michalovo rozhodnutí. Kdyby se sem někdy vrátily, vrátí se
  // s nimi i jižní a západní hrana beskydského okna.
  'javorniky-vsetinske-vrchy': [
    { nazev: 'Velký Javorník (SK strana hřebene)', lat: 49.319, lng: 18.373 },
    { nazev: 'Kohútka', lat: 49.295, lng: 18.23 },
    { nazev: 'Portáš', lat: 49.2945, lng: 18.2328 },
    {
      nazev: 'Vysoká (severní kotva, nejvyšší vrchol Vsetínských vrchů)',
      lat: 49.404,
      lng: 18.362,
    },
    { nazev: 'Soláň', lat: 49.394, lng: 18.25 },
    { nazev: 'Vsacký Cáb', lat: 49.375, lng: 18.096 },
    { nazev: 'Chata Kusalíno', lat: 49.3332, lng: 18.061 },
    { nazev: 'Vsetín (západní kotva)', lat: 49.3386, lng: 17.9961 },
    { nazev: 'Kmínek (východní kotva, SK)', lat: 49.385, lng: 18.448 },
    { nazev: 'Makov (SK)', lat: 49.3564, lng: 18.4336 },
    { nazev: 'Střelná (jižní kotva)', lat: 49.1772, lng: 18.0978 },
  ],
  'mala-fatra': [
    { nazev: 'Veľký Kriváň', lat: 49.18778, lng: 19.03111 },
    { nazev: 'Veľký Rozsutec', lat: 49.23194, lng: 19.10083 },
    { nazev: 'Chleb', lat: 49.187544, lng: 19.051661 },
    { nazev: 'Terchová', lat: 49.2553, lng: 19.0532 },
    { nazev: 'Chata Vrátna', lat: 49.2084, lng: 19.0425 },
    { nazev: 'Strečno (hranice obou částí)', lat: 49.19, lng: 18.87 },
    { nazev: 'Veľká lúka (Lúčanská část)', lat: 49.091049, lng: 18.813401 },
    { nazev: 'Krížava (Lúčanská část)', lat: 49.097117, lng: 18.819037 },
    { nazev: 'Žilina (severozápadní kotva)', lat: 49.22, lng: 18.73 },
    { nazev: 'Martin (jižní kotva)', lat: 49.065, lng: 18.92194 },
    { nazev: 'Zázrivá (východní kotva)', lat: 49.27, lng: 19.15 },
  ],
  'oravska-magura': [
    { nazev: 'Minčol (nejvyšší vrchol)', lat: 49.271777, lng: 19.248503 },
    { nazev: 'Kubínska hoľa', lat: 49.274156, lng: 19.26842 },
    { nazev: 'Dolný Kubín (jižní kotva)', lat: 49.21, lng: 19.3 },
    { nazev: 'Oravský Podzámok', lat: 49.27, lng: 19.37 },
    { nazev: 'Sedliacka Dubová (východní kotva)', lat: 49.270881, lng: 19.42179 },
    { nazev: 'Zázrivá (západní kotva)', lat: 49.27, lng: 19.15 },
  ],
  'zapadne-tatry': [
    { nazev: 'Bystrá (nejvyšší vrchol)', lat: 49.18861, lng: 19.84278 },
    { nazev: 'Baranec', lat: 49.173337, lng: 19.740853 },
    { nazev: 'Volovec', lat: 49.207486, lng: 19.763347 },
    { nazev: 'Sivý vrch', lat: 49.21135, lng: 19.64184 },
    { nazev: 'Zuberec', lat: 49.235575, lng: 19.67207 },
    { nazev: 'Oravský Biely Potok (západní kotva)', lat: 49.272626, lng: 19.561068 },
    { nazev: 'Oravice (severní kotva)', lat: 49.295328, lng: 19.756671 },
    { nazev: 'Chata Zverovka', lat: 49.248, lng: 19.711 },
    { nazev: 'Ťatliakova chata', lat: 49.213709, lng: 19.747423 },
    { nazev: 'Žiarska chata', lat: 49.1812, lng: 19.7197 },
    { nazev: 'Pribylina (jižní kotva)', lat: 49.15244, lng: 19.842541 },
    { nazev: 'Schronisko na Hali Ornak (PL, východní kotva)', lat: 49.228942, lng: 19.85881 },
    { nazev: 'Schronisko na Polanie Chochołowskiej (PL)', lat: 49.236521, lng: 19.788535 },
  ],
  jeseniky: [
    { nazev: 'Praděd', lat: 50.083, lng: 17.233 },
    { nazev: 'Šerák', lat: 50.186, lng: 17.107 },
    { nazev: 'sedlo Skřítek (jižní kotva)', lat: 49.99, lng: 17.163 },
    { nazev: 'Králický Sněžník / Śnieżnik (západní kotva)', lat: 50.207, lng: 16.847 },
    { nazev: 'Rejvíz', lat: 50.224, lng: 17.313 },
    { nazev: 'Biskupská kupa (východní kotva)', lat: 50.256, lng: 17.43 },
    { nazev: 'chata Paprsek', lat: 50.21, lng: 16.991 },
  ],
  // Vysoké Tatry: kotvy jsou jednak hranice pohoří (Ľaliové sedlo dle
  // TANAPu), jednak samotné chaty — ty jsou tu spolehlivější kotva než
  // vrcholy, protože právě chaty jsou předmětem dotazu.
  'vysoke-tatry': [
    {
      nazev: 'Ľaliové / Liliowe sedlo (západní hranice pohoří dle TANAPu)',
      lat: 49.225,
      lng: 19.992,
    },
    { nazev: 'Kasprowy Wierch (PL)', lat: 49.232, lng: 19.982 },
    { nazev: 'Zakopané (severozápadní kotva, PL)', lat: 49.3, lng: 19.95 },
    { nazev: 'Ždiar (severovýchodní kotva)', lat: 49.271, lng: 20.261 },
    { nazev: 'Kežmarské Žľaby (východní kotva)', lat: 49.195, lng: 20.299 },
    { nazev: 'Štrbské Pleso (jižní kotva)', lat: 49.117, lng: 20.067 },
  ],
  // Nízké Tatry: hřeben je z celého korpusu nejdelší (~80 km), takže kotvy
  // musejí držet oba konce — Prašivá na západě a Vernár s Telgártem za
  // Kráľovou hoľou na východě — i oba svahy, liptovský a hronský.
  'nizke-tatry': [
    { nazev: 'Ďumbier (nejvyšší vrchol)', lat: 48.936, lng: 19.64 },
    { nazev: 'Kráľova hoľa (východní část hřebene)', lat: 48.883, lng: 20.133 },
    { nazev: 'Donovaly (západní kotva)', lat: 48.883, lng: 19.233 },
    { nazev: 'Prašivá (západní konec hřebene)', lat: 48.876, lng: 19.318 },
    { nazev: 'Telgárt (východní kotva)', lat: 48.852, lng: 20.188 },
    { nazev: 'Vernár (východní kotva)', lat: 48.92, lng: 20.27 },
    { nazev: 'Brezno (jižní kotva)', lat: 48.804, lng: 19.636 },
    { nazev: 'Demänovská dolina (severní svah)', lat: 48.97, lng: 19.58 },
    { nazev: 'Chata Opalisko (severní kotva)', lat: 49.045, lng: 19.642 },
  ],
}

describe.each([
  ['beskydy', 'Beskydy'],
  ['jeseniky', 'Jeseníky'],
  ['javorniky-vsetinske-vrchy', 'Javorníky a Vsetínské vrchy'],
  ['mala-fatra', 'Malá Fatra'],
  ['oravska-magura', 'Oravská Magura'],
  ['zapadne-tatry', 'Západné Tatry'],
  ['vysoke-tatry', 'Vysoké Tatry'],
  ['nizke-tatry', 'Nízké Tatry'],
])('oblast %s', (slug, nazev) => {
  const konfig = oblastDleSlugu(slug)
  const yaml = nactiYaml(slug)

  it('konfigurace a YAML se shodují na jménu i slugu', () => {
    expect(konfig.nazev).toBe(nazev)
    expect(yaml.nazev).toBe(nazev)
    expect(yaml.slug).toBe(slug)
  })

  it('má skloňované tvary — čeština je algoritmem neskloní', () => {
    expect(yaml.sklonovani?.druhy).toBeTruthy()
    expect(yaml.sklonovani?.sesty).toBeTruthy()
  })

  it('charakteristika má ověření a zůstává verified:false (konvence B)', () => {
    expect(yaml.charakteristika).toBeTruthy()
    expect(yaml.overeniCharakteristika?.source).toBeTruthy()
    expect(yaml.overeniCharakteristika?.verified).toBe(false)
    expect(yaml.overeniCharakteristika?.checked).toBe('2026-08-08')
  })

  it('nejvyšší hora nese výšku i zdroj', () => {
    expect(yaml.nejvyssiHora?.nazev).toBeTruthy()
    expect(yaml.nejvyssiHora?.vyska).toBeGreaterThan(0)
    expect(yaml.nejvyssiHora?.source).toBeTruthy()
  })

  it('každý top cíl (až přibudou) nese zdroj', () => {
    for (const c of yaml.topCile ?? []) {
      expect(c.source, `cíl ${c.nazev} bez zdroje`).toBeTruthy()
    }
  })

  it('okno dotazu obsahuje všechny doložené kotvy pohoří', () => {
    const b = konfig.bbox
    const venku = KOTVY[slug].filter(
      (k) => k.lat < b.latMin || k.lat > b.latMax || k.lng < b.lngMin || k.lng > b.lngMax,
    )
    expect(
      venku.map((k) => k.nazev),
      `okno ${bboxStr(b)} nechává venku kotvy — dotaz by je tiše minul`,
    ).toEqual([])
  })

  it('3D okno leží uvnitř okna dotazu', () => {
    const { bbox: b, bbox3d: t } = konfig
    expect(t.latMin).toBeGreaterThanOrEqual(b.latMin)
    expect(t.lngMin).toBeGreaterThanOrEqual(b.lngMin)
    expect(t.latMax).toBeLessThanOrEqual(b.latMax)
    expect(t.lngMax).toBeLessThanOrEqual(b.lngMax)
  })

  it('každý katalogový název pohoří v katalogu opravdu existuje', () => {
    const chybne = (konfig.katalogPohori ?? []).filter((p) => !POHORI_V_KATALOGU.has(p))
    expect(chybne, 'název nesedí na katalog — dohledávka podle jmen by se tiše vypnula').toEqual([])
  })

  it('každá země dotazu má slug pro URL', () => {
    for (const { zeme } of zemeDotazu(konfig)) {
      expect(ZEME_SLUG[zeme], `země ${zeme} nemá slug — profily by neměly URL`).toBeTruthy()
    }
  })

  it('poznámka jmenuje další krok, kterým je Michalův klik na DATA-01', () => {
    const p = String(yaml.interniPoznamky)
    expect(p).toMatch(/DATA-01/)
    expect(p).toMatch(/klik/i)
  })
})

describe('rozhodnutí o rozsahu — hotová i otevřená', () => {
  /**
   * ROZHODNUTO 8. 8. 2026 (Michal: „javorniky a vsetinske vrchy bych udelal
   * jako jednu samostatnou oblast"). Ráno téhož dne to byla otevřená otázka
   * a Javorníky se Vsetínskými vrchy byly v beskydském okně; test to tehdy
   * hlídal opačně. Dnes hlídá, že se rozdělení nevrátí zpátky omylem.
   */
  it('Javorníky a Vsetínské vrchy se z Beskyd přesunuly do vlastní oblasti', () => {
    const beskydy = oblastDleSlugu('beskydy')
    expect(beskydy.katalogPohori).not.toContain('Javorníky')
    expect(beskydy.katalogPohori).not.toContain('Vsetínské vrchy')
    const nova = oblastDleSlugu('javorniky-vsetinske-vrchy')
    expect(nova.katalogPohori).toEqual(['Javorníky', 'Vsetínské vrchy'])
    // Poznámka Beskyd musí rozhodnutí držet, aby ho nikdo nevrátil naslepo.
    expect(String(nactiYaml('beskydy').interniPoznamky)).toMatch(/samostatnou oblast/)
  })

  it('okna Beskyd a nové oblasti se v hraničním pásu ZÁMĚRNĚ překrývají', () => {
    // Ostrý řez na hranici dvou pohoří tiše vyřízne objekty na sedle mezi
    // nimi — vzor překryvu Krkonoš a Jizerek u Jizerky a Harrachova. Kdyby
    // někdo okna „uklidil" tak, aby na sebe jen navazovala, tenhle test
    // spadne a vysvětlí proč.
    const b = oblastDleSlugu('beskydy').bbox
    const j = oblastDleSlugu('javorniky-vsetinske-vrchy').bbox
    const prekryvLat = Math.min(b.latMax, j.latMax) - Math.max(b.latMin, j.latMin)
    const prekryvLng = Math.min(b.lngMax, j.lngMax) - Math.max(b.lngMin, j.lngMin)
    expect(prekryvLat, 'okna se v šířce nepřekrývají').toBeGreaterThan(0)
    expect(prekryvLng, 'okna se v délce nepřekrývají').toBeGreaterThan(0)
  })

  it('nová oblast je přeshraniční se Slovenskem a Vsetín je vevnitř okna', () => {
    const konfig = oblastDleSlugu('javorniky-vsetinske-vrchy')
    expect(zemeDotazu(konfig).map((z) => z.iso)).toEqual(expect.arrayContaining(['CZ', 'SK']))
    // Město je v okně schválně: hřeben se zvedá přímo nad ním a chodí se
    // odtud na Vsacký Cáb i Kusalíno (vzor okraje Liberce u Ještědu).
    const b = konfig.bbox
    expect(49.3386 >= b.latMin && 49.3386 <= b.latMax).toBe(true)
    expect(17.9961 >= b.lngMin && 17.9961 <= b.lngMax).toBe(true)
  })

  it('nová oblast varuje před třemi záměnami, které u ní hrozí', () => {
    // Dva Velké Javorníky (1071 m na hranici × 918 m u Frenštátu), Malý
    // Javorník jako nejvyšší bod ČESKÉ části a Vysoká místo Ptáčnice jako
    // nejvyšší vrchol Vsetínských vrchů. Všechno jsou to pasti, do kterých
    // se dá spadnout při povyšování — musí zůstat zapsané.
    const src = String(nactiYaml('javorniky-vsetinske-vrchy').nejvyssiHora?.source)
    expect(src).toMatch(/Frenštát/)
    expect(src).toMatch(/Malý Javorník/)
    expect(src).toMatch(/Vysoká/)
  })

  it('Beskydy jsou přeshraniční přes tři země — Slovensko musí být v dotazu', () => {
    const iso = zemeDotazu(oblastDleSlugu('beskydy')).map((z) => z.iso)
    expect(iso).toEqual(expect.arrayContaining(['CZ', 'PL', 'SK']))
  })

  it('Jeseníky: Góry Bystrzyckie jsou vědomě mimo okno a je to zapsané', () => {
    const konfig = oblastDleSlugu('jeseniky')
    expect(konfig.katalogPohori).not.toContain('Góry Bystrzyckie')
    // Katalog tu jednotku vede — kdyby ne, test by hlídal neexistující riziko.
    expect(POHORI_V_KATALOGU.has('Góry Bystrzyckie')).toBe(true)
    // Bez ohledu na velikost písmen: poznámka jednotku někdy jmenuje verzálkami
    // („polské GÓRY BYSTRZYCKIE"), a to je pořád platný zápis rozhodnutí.
    const p = String(nactiYaml('jeseniky').interniPoznamky)
    expect(p).toMatch(/Bystrzyckie/i)
  })

  it('Jeseníky: poznámka drží opravu mé chyby v zadání (Sněžník × Śnieżnik je jeden vrchol)', () => {
    // Zadání rešerše tvrdilo, že jsou to dva různé vrcholy. Prameny to
    // vyvrátily. Kdyby ta poznámka z YAMLu vypadla, chyba by se mohla vrátit
    // do dat při dalším rozšiřování oblasti.
    const p = String(nactiYaml('jeseniky').interniPoznamky)
    expect(p).toMatch(/JEDEN vrchol/)
  })
})

describe('tři oblasti založené s daty (pokyn Michala „kandidáty budoucích oblastí nech a rovnou je založ")', () => {
  /**
   * Malá Fatra, Oravská Magura a Západné Tatry vznikly 8. 8. 2026 jinak než
   * všechny ostatní: NE dopředu a prázdné, ale kvůli kandidátům, které už
   * ležely v repu. Beskydský export DATA-01 běžel podle širokého okna
   * a stáhl 78 objektů ze sousedních pohoří; Michal rozhodl je nemazat.
   * Testy drží, že přesun byl úplný a že se objekty nedostaly zpátky.
   */
  const POCTY: Record<string, number> = {
    'mala-fatra': 59,
    'oravska-magura': 6,
    'zapadne-tatry': 13,
  }

  it.each(Object.keys(POCTY))('%s má přesunuté kandidáty a všichni míří do své oblasti', (slug) => {
    const dir = join(process.cwd(), 'data', 'kandidati', slug)
    const soubory = readdirSync(dir).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    expect(soubory.length).toBe(POCTY[slug])
    for (const f of soubory) {
      const d = parse(readFileSync(join(dir, f), 'utf8')) as { oblast?: string }
      expect(d.oblast, `${slug}/${f} nese cizí oblast`).toBe(slug)
    }
  })

  it.each(Object.keys(POCTY))('%s: žádný kandidát nezůstal v okně Beskyd', (slug) => {
    // Kdyby zůstal, znamenalo by to, že se okna neposunula tak, jak si
    // poznámky myslí — a příští beskydský export by objekt založil dvakrát.
    const b = oblastDleSlugu('beskydy').bbox
    const dir = join(process.cwd(), 'data', 'kandidati', slug)
    const uvnitr = readdirSync(dir)
      .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
      .map((f) => ({
        f,
        d: parse(readFileSync(join(dir, f), 'utf8')) as { lat?: number; lng?: number },
      }))
      .filter(
        ({ d }) =>
          typeof d.lat === 'number' &&
          typeof d.lng === 'number' &&
          d.lat >= b.latMin &&
          d.lat <= b.latMax &&
          d.lng >= b.lngMin &&
          d.lng <= b.lngMax,
      )
      .map(({ f }) => f)
    expect(uvnitr).toEqual([])
  })

  it('každý přesunutý kandidát vysvětluje, PROČ se nezapsal do _vyrazeno.yaml', () => {
    // Je to jediný netriviální krok celého přesunu: záznam „beskydy/<slug>"
    // by objekt od ranní opravy porovnávání umlčel i v nové oblasti. Kdyby
    // to poznámka neříkala, příští session to udělá špatně.
    for (const slug of Object.keys(POCTY)) {
      const dir = join(process.cwd(), 'data', 'kandidati', slug)
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml') && !x.startsWith('_'))) {
        const d = parse(readFileSync(join(dir, f), 'utf8')) as { interniPoznamky?: string }
        expect(String(d.interniPoznamky), `${slug}/${f}`).toMatch(/_vyrazeno\.yaml/)
      }
    }
  })

  it('Západné Tatry jsou první vysokohorská oblast a je to v poznámce přiznané', () => {
    // Není to kosmetika: u tatranské chaty znamená „otevřeno" jinou věc než
    // u bavorského hostince (sezónní uzávěry, horská služba). Poznámka to
    // má říkat, aby to profily nepřehlédly.
    const p = String(nactiYaml('zapadne-tatry').interniPoznamky)
    expect(p).toMatch(/TANAP/)
    // TANAP vznikl 1949, ale Západné Tatry k němu přibyly až 1987 — častá
    // chyba, kterou poznámka musí držet.
    expect(p).toMatch(/1987/)
  })
})

describe('Tatry — jedenáctá a dvanáctá oblast (pokyn Michala „vezmi rovnou i vysoke a nizke tatry")', () => {
  /**
   * Tady testy nehlídají jen tvar dat. Tatry přinášejí do korpusu dvě věci,
   * které se v žádné dosavadní oblasti nevyskytly, a obě se dají tiše
   * zkazit tím, že se na ně zapomene:
   *   – VE VYSOKÝCH TATRÁCH neznamená „otevřeno" totéž jako „dostupné":
   *     hřebenové trasy mají sezónní uzávěru a na Gerlachovský štít se bez
   *     vůdce nesmí. Kdyby to poznámka nedržela, profily by u chaty napsaly
   *     celoroční provoz a mlčely by o tom, že se k ní půl roku nedojde.
   *   – V NÍZKÝCH TATRÁCH je čtveřice útulen, u kterých se stav přístupu
   *     liší (volně / za poplatek / na rezervaci). To je přesně rozlišení,
   *     na kterém stojí klíč zařazení u typu `utulna`, a nesmí se
   *     zprůměrovat do jednoho slova.
   */
  const katalogPocet = (pohori: string) => KATALOG.filter((r) => r['Pohoří'] === pohori).length

  it('katalog opravdu drží ta množství, o kterých poznámky mluví', () => {
    // Kdyby se katalog vyměnil za jinou verzi, čísla v poznámkách by přestala
    // být pravda — a nikdo by si toho nevšiml, protože jsou to jen věty.
    expect(katalogPocet('Vysoké Tatry')).toBe(14)
    expect(katalogPocet('Tatry Wysokie')).toBe(4)
    expect(katalogPocet('Nízké Tatry')).toBe(14)
  })

  it('Vysoké Tatry: poznámka drží sezónní uzávěru — „otevřeno" ≠ „dostupné"', () => {
    const p = String(nactiYaml('vysoke-tatry').interniPoznamky)
    expect(p).toMatch(/uzávěr|uzavř/i)
    expect(p).toMatch(/1\.\s*11\./)
  })

  it('Vysoké Tatry: past na tři různé Kriváně je zapsaná u nejvyšší hory', () => {
    // Tatranský Kriváň, Veľký Kriváň v Malé Fatře a Kriváň v Nízkých Tatrách
    // jsou tři různé kopce a všechny tři jsou od 8. 8. 2026 v korpusu. Bez
    // téhle věty se při povyšování spojí objekty ve třech různých pohořích —
    // chyba, kterou nezachytí nic jiného, protože jméno je stejné a data
    // vypadají v pořádku. Poznámka patří k nejvyšší hoře, ne do interních:
    // je to údaj o publikovaném čísle, ne provozní vzkaz.
    const s = String(nactiYaml('vysoke-tatry').nejvyssiHora?.source)
    expect(s).toMatch(/Kriváň/)
    expect(s).toMatch(/Malé Fatře/)
    expect(s).toMatch(/Nízkých Tatrách/)
  })

  it('Nízké Tatry: poznámka rozlišuje stav přístupu u všech čtyř útulen', () => {
    const p = String(nactiYaml('nizke-tatry').interniPoznamky)
    for (const u of ['Ďurková', 'Andrejcová', 'Ramža', 'Hiadeľské']) {
      expect(p, `útulna ${u} v poznámce chybí`).toContain(u)
    }
    // Andrejcová je ze čtveřice jediná na rezervaci — kdyby se to setřelo,
    // dostala by v profilu volný přístup, který nemá.
    expect(p).toMatch(/REZERVACE POVINNÁ/)
  })

  it('Nízké Tatry: Kamenná chata pod Chopkom NENÍ nejvýše položená — drží to katalog i poznámka', () => {
    // Superlativ, který se sám nabízí a je nepravdivý. Test ho neověřuje
    // z pramene, ale z vlastního korpusu: v katalogu jsou nad ní dva objekty.
    const vyssi = KATALOG.filter(
      (r) => Number((r as Record<string, unknown>)['Nadmořská výška (m)']) > 2000,
    )
    expect(vyssi.length).toBeGreaterThanOrEqual(2)
    const p = String(nactiYaml('nizke-tatry').interniPoznamky)
    expect(p).toMatch(/TŘETÍ/)
  })

  it('Nízké Tatry: tři čertovické zápisy katalogu se nesmějí tiše slít', () => {
    const certovica = KATALOG.filter((r) =>
      String((r as Record<string, unknown>)['Název'] ?? '').match(/Čertovic/i),
    )
    expect(certovica.length).toBe(3)
    const p = String(nactiYaml('nizke-tatry').interniPoznamky)
    expect(p).toMatch(/TŘI RŮZNÉ ZÁPISY|tři různé zápisy/)
  })

  it('Nízké Tatry: jméno drží Michalovo rozhodnutí a slovenský tvar je přiznaný', () => {
    // Otázku na nekonzistenci (Nízké česky × Západné slovensky) zavřel Michal
    // 8. 8. 2026 slovy „nizke tatry je slovensky stejne jako cesky". Test drží
    // dvě věci zároveň: jméno podle jeho rozhodnutí, a zapsaný pravopisný
    // detail, že slovenský tvar je „Nízke Tatry" bez „é" — aby se rozhodnutí
    // neopíralo o mlčení o pramenu, ale stálo vedle něj.
    const y = nactiYaml('nizke-tatry')
    expect(y.nazev).toBe('Nízké Tatry')
    expect(y.sklonovani?.sesty).toBe('Nízkých Tatrách')
    const p = String(y.interniPoznamky)
    expect(p).toMatch(/Nízke Tatry/)
    expect(p).toMatch(/nizke tatry je slovensky stejne jako cesky/)
  })

  it('obě tatranské oblasti mají Slovensko zapojené celou cestou (dotaz i URL)', () => {
    for (const slug of ['vysoke-tatry', 'nizke-tatry']) {
      const konfig = oblastDleSlugu(slug)
      const zeme = zemeDotazu(konfig)
      expect(zeme.length).toBeGreaterThan(0)
      for (const { zeme: z } of zeme) {
        expect(ZEME_SLUG[z], `${slug}: země ${z} nemá URL slug`).toBeTruthy()
      }
      expect(
        zeme.map((z) => z.iso),
        `${slug} bez Slovenska`,
      ).toContain('SK')
    }
    // Vysoké Tatry navíc Polsko — bez něj by vypadla čtyři schroniska PTTK.
    expect(zemeDotazu(oblastDleSlugu('vysoke-tatry')).map((z) => z.iso)).toContain('PL')
    // Nízké Tatry jsou naopak jednozemní a je to správně: hřeben celý leží
    // na Slovensku, takže by tu žádná druhá země být neměla.
    expect(zemeDotazu(oblastDleSlugu('nizke-tatry')).map((z) => z.iso)).toEqual(['SK'])
  })
})
