import type { Bod } from './pristupove-trasy'

/**
 * NÁHLED MAPY — statický obrázek místo živých dlaždic.
 *
 * PROČ (nápad Michala 1. 8. 2026): „natáhli bysme mapu (výřez na profilu) do
 * cache a načetla by se až po kliknutí — tím pádem by tam mapa vždy byla, ale
 * šetřili bysme načítání plné mapy."
 *
 * Živá mapa stáhne při každém zobrazení kolem dvaceti dlaždic. Statická mapa
 * je JEDEN dotaz — a když si ho web zapamatuje, je to jeden dotaz za celé
 * období, ne za každého čtenáře. Čtenář přitom mapu vidí hned; kliknutím ji
 * „rozhýbe" na plnou interaktivní verzi.
 *
 * Sestavuje se tu jen URL; samotné stahování a keš má na starosti route
 * `/api/mapa-nahled/[slug]`, aby klíč nikdy neopustil server.
 */

const STATICKA_MAPA = 'https://api.mapy.com/v1/static/map'

/** Barvy tras — stejné jako v živé mapě, ať přechod na klik nikoho nepřekvapí. */
export const BARVY_TRAS = ['#d81f6a', '#7a3ea8', '#0e6e6e']

/**
 * Zředí čáru na nejvýš `limit` bodů. Trasa má klidně tisíc bodů, ale URL má
 * strop — a na náhledu velikosti dlaně je rozdíl stejně nevidět. Bere se
 * každý n-tý bod a VŽDY oba konce, aby čára nekončila kus před chatou.
 */
export const zredCaru = (body: Bod[], limit = 40): Bod[] => {
  if (body.length <= limit) return body
  const krok = (body.length - 1) / (limit - 1)
  return Array.from({ length: limit }, (_, i) => body[Math.round(i * krok)]!)
}

export type NahledVstup = {
  lat: number
  lng: number
  trasy?: { body: Bod[] }[]
  sirka?: number
  vyska?: number
  /** `2` = retina; dvojnásobek pixelů, tentýž jeden dotaz. */
  scale?: 1 | 2
}

/**
 * URL statické mapy: výřez kolem chaty, značka na chatě a přístupové trasy.
 *
 * Když trasy máme, výřez se dopočítá z jejich rozsahu (parametr `zoom` se
 * neposílá a API zvolí nejlepší přiblížení) — na náhledu je pak vidět, ODKUD
 * se k chatě chodí, ne jen samotná střecha. Bez tras se centruje na chatu.
 */
export const urlNahleduMapy = (
  klic: string,
  { lat, lng, trasy = [], sirka = 760, vyska = 420, scale = 2 }: NahledVstup,
): string => {
  const p = new URLSearchParams()
  p.set('mapset', 'outdoor')
  p.set('width', String(sirka))
  p.set('height', String(vyska))
  p.set('scale', String(scale))
  p.set('format', 'jpg')
  p.set('lang', 'cs')

  const sCarou = trasy.filter((t) => t.body.length > 1).slice(0, 3)
  if (sCarou.length === 0) {
    // Bez tras nemá API z čeho výřez odvodit — přiblížení volíme sami tak, aby
    // bylo vidět okolí chaty, ne jen budova.
    p.set('lon', lng.toFixed(5))
    p.set('lat', lat.toFixed(5))
    p.set('zoom', '14')
  } else {
    p.set('padding', '28')
  }
  for (const [i, t] of sCarou.entries()) {
    const cara = zredCaru(t.body)
      .map((b) => `${b.lng.toFixed(5)},${b.lat.toFixed(5)}`)
      .join(';')
    p.append('shapes', `color:${BARVY_TRAS[i % BARVY_TRAS.length]};width:4;path:[(${cara})]`)
  }
  // Značka chaty jde POSLEDNÍ, aby ji čáry nepřekryly.
  p.append('markers', `color:red;size:normal;${lng.toFixed(5)},${lat.toFixed(5)}`)
  p.set('apikey', klic)
  return `${STATICKA_MAPA}?${p.toString()}`
}
