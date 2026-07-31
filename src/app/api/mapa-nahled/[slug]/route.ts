import { getChataBySlug } from '@/lib/chaty'
import { urlNahleduMapy } from '@/lib/mapa-nahled'
import { pristupyChaty } from '@/lib/pristupove-trasy'

/**
 * NÁHLED MAPY CHATY — statický obrázek místo dvaceti živých dlaždic.
 *
 * Nápad Michala (1. 8. 2026): mapa má být na profilu vidět vždycky, ale plná
 * interaktivní verze se má načíst až po kliknutí.
 *
 * POZOR — PROČ TU NENÍ KEŠ, AČ O NI MICHAL ŽÁDAL:
 * Dokumentace statických map Mapy.com říká doslova: „Images are intended for
 * online display only. Long-term storage or caching is not permitted – see
 * terms of service." (docs/rest-api/static-maps.md, repozitář mapycom/developer).
 * Držet si obrázek týden na serveru je přesně to, co tahle věta zakazuje —
 * a je to Michalův klíč a jeho účet, ne náš. Úspora se proto bere jinudy:
 *
 *   živá mapa   ≈ 20 dlaždic při každém zobrazení profilu
 *   náhled      = 1 dotaz při zobrazení + živá mapa až na kliknutí
 *
 * To je pořád asi dvacetinásobně méně dotazů — cíl („šetřili bysme načítání
 * plné mapy") splněný, jen bez kroku, který smlouva zapovídá. Zbytek cesty
 * (1 dotaz na chatu za období místo 1 na čtenáře) je jedna konstanta níž;
 * otevřená otázka pro Michala je v deníku 1. 8. 2026.
 */

// Bez serverové keše: obrázek si nedržíme, jen ho podáváme dál.
export const revalidate = 0

/**
 * Jak dlouho si smí náhled nechat PROHLÍŽEČ ČTENÁŘE. Tohle není naše úložiště —
 * je to běžné zobrazení obrázku, které dělá každý web; bez něj by se náhled
 * stahoval znovu při každém překreslení stránky. `private` schválně: keše po
 * cestě (CDN, proxy) si kopii dělat nemají.
 *
 * Kdyby tarif Mapy.com keš výslovně dovoloval, mění se tady jedno číslo
 * a `revalidate` výš — nic jiného.
 */
const KES_PROHLIZECE = 3600

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params
  const klic = process.env.NEXT_PUBLIC_MAPY_API_KEY
  if (!klic) return new Response('Náhled mapy není nastavený (chybí API klíč).', { status: 404 })

  const chata = await getChataBySlug(slug)
  if (!chata || chata.lat == null || chata.lng == null)
    return new Response('Chata nemá doložené souřadnice.', { status: 404 })

  const trasy = pristupyChaty(slug)
    .map((p) => ({ body: p.geometrie ?? [] }))
    .filter((t) => t.body.length > 1)

  const odpoved = await fetch(urlNahleduMapy(klic, { lat: chata.lat, lng: chata.lng, trasy }), {
    headers: { 'user-agent': 'turistickechaty.cz nahled/1.0 (+https://turistickechaty.cz)' },
    cache: 'no-store',
  })
  if (!odpoved.ok) {
    // Chybu nepředáváme dál jako obrázek — profil má ukázat papír, ne křížek.
    return new Response(`Mapy.com náhled odmítly (HTTP ${odpoved.status}).`, { status: 404 })
  }

  return new Response(await odpoved.arrayBuffer(), {
    headers: {
      'content-type': odpoved.headers.get('content-type') ?? 'image/jpeg',
      'cache-control': `private, max-age=${KES_PROHLIZECE}`,
    },
  })
}
