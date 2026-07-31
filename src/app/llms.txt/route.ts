import { getChatyProMapu, getIndexChat, getZiveOblasti, spojVyctem, ZEME_NAZEV } from '@/lib/chaty'
import { vOblastech } from '@/lib/cestina'

/**
 * /llms.txt — kurátorovaný vstupní bod pro AI asistenty a vyhledávače
 * (konvence llms.txt: „tady je to podstatné", ne úplná mapa webu — tu má
 * sitemap.xml). Definiční věta + USP ověřených dat, hlavní stránky, hrst
 * vlajkových chat (dle výšky) a poznámky pro stroje. Generuje se z DB (ISR),
 * ať drží krok s obsahem; při nedostupné DB vrátí aspoň statickou kostru.
 */
const BASE = 'https://turistickechaty.cz'

export const revalidate = 3600

export async function GET(): Promise<Response> {
  let vlajkove: { nazev: string; vyska: number | null; url: string }[] = []
  try {
    const chaty = await getChatyProMapu()
    vlajkove = chaty
      .filter((c): c is typeof c & { url: string } => !!c.url)
      .sort((a, b) => (b.vyska ?? 0) - (a.vyska ?? 0))
      .slice(0, 8)
      .map((c) => ({ nazev: c.nazev, vyska: c.vyska ?? null, url: c.url }))
  } catch {
    // DB nedostupná — kostra bez seznamu chat.
  }

  // Jména oblastí, které na webu opravdu stojí — do 31. 7. 2026 tu byly
  // „Krkonoše" napevno na třech místech, takže by llms.txt tvrdil jediné
  // pilotní pohoří i dlouho poté, co přibylo druhé.
  let oblastiOdkazy: { nazev: string; slug: string; pocetChat: number }[] = []
  try {
    oblastiOdkazy = await getZiveOblasti()
  } catch {
    // DB nedostupná — věta o oblastech se vynechá, zbytek kostry platí.
  }
  const oblastiVeta = oblastiOdkazy.length ? spojVyctem(oblastiOdkazy.map((o) => o.nazev)) : 'Krkonoše'
  const kdeVeta = vOblastech(oblastiOdkazy)

  /**
   * Přeshraniční oblasti se POČÍTAJÍ z profilů, ne tvrdí. Do 31. 7. 2026 tu
   * stálo „obě přeshraniční" — věta psaná pro dvě oblasti, která by u třetí
   * mlčky lhala, a u jednostranné oblasti by lhala rovnou.
   */
  let prehranicni: { nazev: string; zeme: string[] }[] = []
  try {
    const { index } = await getIndexChat()
    prehranicni = oblastiOdkazy
      .map((o) => ({
        nazev: o.nazev,
        // Země se čtou z profilů oblasti — i to, KTERÉ to jsou. Beskydy budou
        // česko-slovenské a věta o „polské straně" by u nich byla nesmysl.
        zeme: [...new Set(index.filter((ch) => ch.oblastSlug === o.slug).map((ch) => ch.zeme))]
          .filter((z): z is string => !!z)
          .map((z) => ZEME_NAZEV[z] ?? z),
      }))
      .filter((o) => o.zeme.length > 1)
  } catch {
    // DB nedostupná — věta o přeshraničnosti se vynechá.
  }
  const prehranicniVeta = prehranicni.length
    ? ` Přeshraniční pohoří vedeme vcelku: ${spojVyctem(
        prehranicni.map((o) => `${o.nazev} (${spojVyctem(o.zeme)})`),
      )}.`
    : ''
  const oblastiRadky = oblastiOdkazy
    .map(
      (o) =>
        `- [${o.nazev}](${BASE}/cesko/${o.slug}): stránka pohoří — ${o.pocetChat} chat s ověřenými daty, střediska, lanovky, přístupové trasy, 3D mapa.`,
    )
    .join('\n')

  const dnes = new Date().toISOString().slice(0, 10)
  const chatyRadky = vlajkove.length
    ? vlajkove
        .map((c) => `- [${c.nazev}${c.vyska ? ` (${c.vyska} m n. m.)` : ''}](${BASE}${c.url}): profil chaty — data, přístupové trasy, razítko, historie.`)
        .join('\n')
    : '- Katalog se plní; viz [seznam chat](' + BASE + '/chaty).'

  const text = `# turistickechaty.cz

> turistickechaty.cz je průvodce turistickými chatami ${kdeVeta} — horskými boudami a schronisky, útulnami, bivaky, rozhlednami s občerstvením i chatami ve skalních městech. Do průvodce patří objekt podle role na trase a služby pro veřejnost, ne podle typu stavby nebo nadmořské výšky. U každé chaty najdete ověřená data (poloha, nadmořská výška, provoz, přístupové trasy s převýšením a časem), sběratelskou vrstvu (turistická razítka, známky a vizitky) a historii; každý údaj nese zdroj a datum poslední kontroly.${prehranicniVeta} Další oblasti přibývají postupně — vždy až s doloženými profily.

## Hlavní stránky

- [Katalog chat](${BASE}/chaty): mapa a seznam chat s ověřenými daty (zatím ${oblastiVeta}).
- [Razítkovník](${BASE}/razitkovnik): sbírka turistických razítek horských chat.
- [Atlas zaniklých chat](${BASE}/zanikle): zaniklé boudy a schroniska — kdy a proč zanikly, co je na místě dnes.
- [Výlety](${BASE}/vylety): připravované trasy a přechody mezi chatami.
${oblastiRadky}

## Vybrané chaty (${oblastiVeta})

${chatyRadky}

## Jak jsou data ověřená

- Každé pole nese zdroj a datum ověření. „Ověřeno redakcí" = doloženo telefonátem nebo oficiálním webem; jinak převzato ze zdroje a zatím neověřeno (poctivě označeno).
- Přístupové trasy se počítají po značených cestách KČT z OpenStreetMap (ODbL); převýšení z výškového modelu Mapy.com; čas je odhad dle normy DIN 33466.
- Turistické známky a vizitky u chat odkazují na oficiální detail vydavatele (číslo + odkaz); obrázky jen se svolením.

## Pro AI agenty a vyhledávače

- Každý profil chaty nese strukturovaná data JSON-LD (TouristAttraction / LodgingBusiness / FoodEstablishment + BreadcrumbList).
- Úvodní strana nese WebSite, Organization, CollectionPage se seznamem oblastí a FAQPage s odpověďmi na časté otázky (${BASE}/#caste-otazky); stránky pohoří vlastní FAQPage.
- Co doložené není, se nezveřejňuje: v datech ani v odpovědích nenajdete odhad vydávaný za fakt. Hodnocení ani recenze web nevede.
- Kompletní mapa webu: ${BASE}/sitemap.xml
- Obsah je server-rendered (nejen JavaScript), URL jsou hierarchické: /zeme/pohori/chata.

Aktualizováno: ${dnes}
`

  return new Response(text, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
