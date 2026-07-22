import { getChatyProMapu } from '@/lib/chaty'

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

  const dnes = new Date().toISOString().slice(0, 10)
  const chatyRadky = vlajkove.length
    ? vlajkove
        .map((c) => `- [${c.nazev}${c.vyska ? ` (${c.vyska} m n. m.)` : ''}](${BASE}${c.url}): profil chaty — data, přístupové trasy, razítko, historie.`)
        .join('\n')
    : '- Katalog se plní; viz [seznam chat](' + BASE + '/chaty).'

  const text = `# turistickechaty.cz

> turistickechaty.cz je průvodce po horských a turistických chatách pro české turisty — od Jeseníků po Alpy. U každé chaty najdete ověřená data (poloha, nadmořská výška, provoz, přístupové trasy s převýšením a časem), sběratelskou vrstvu (turistická razítka, známky a vizitky) a historii. Každý údaj nese zdroj a datum ověření. Pilotní pohoří: Krkonoše (česká i polská strana).

## Hlavní stránky

- [Katalog chat](${BASE}/chaty): mapa a seznam chat s ověřenými daty (zatím Krkonoše).
- [Razítkovník](${BASE}/razitkovnik): sbírka turistických razítek horských chat.
- [Výlety](${BASE}/vylety): připravované trasy a přechody mezi chatami.

## Vybrané chaty (Krkonoše)

${chatyRadky}

## Jak jsou data ověřená

- Každé pole nese zdroj a datum ověření. „Ověřeno redakcí" = doloženo telefonátem nebo oficiálním webem; jinak převzato ze zdroje a zatím neověřeno (poctivě označeno).
- Přístupové trasy se počítají po značených cestách KČT z OpenStreetMap (ODbL); převýšení z výškového modelu Mapy.com; čas je odhad dle normy DIN 33466.
- Turistické známky a vizitky u chat odkazují na oficiální detail vydavatele (číslo + odkaz); obrázky jen se svolením.

## Pro AI agenty a vyhledávače

- Každý profil chaty nese strukturovaná data JSON-LD (TouristAttraction / LodgingBusiness / FoodEstablishment + BreadcrumbList).
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
