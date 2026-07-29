import type { Oblasti as Oblast } from '@/payload-types'

/**
 * Titulní fotka oblasti — krajinný pás nad hlavičkou stránky pohoří.
 *
 * PROČ JE TO VLASTNÍ KOMPONENTA, a ne `FotoAtribuce` nad kolekcí Fotky:
 * jde o jiný druh snímku. Fotka chaty musí prokazatelně zachycovat TEN
 * objekt (proto síto DATA-02: geotag, popis souboru, adresa), kdežto
 * titulní fotka pohoří má být hezká a z toho pohoří — doložená lokalita
 * stačí. Rozlišení je popsané v `docs/FOTKY-ZDROJE-A-LICENCE.md`, oddíl 1,
 * a plyne z něj i to, co se smí napsat do popisku: **jen to, co dokládá
 * popis u zdroje.** Když autor budovu na snímku nejmenuje, nejmenujeme ji
 * ani my — od toho je pole `popisMista`, ne naše domněnka.
 *
 * Atribuce se zobrazuje i u licencí, které ji nevyžadují (Unsplash, Pexels).
 * Není to omyl: web u každého faktu říká, odkud je, a u obrázků by jinak
 * mlčel (rozhodnutí zapsané v rešerši FOTO-01).
 */

const LICENCE_TEXT: Record<string, string> = {
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  cc0: 'CC0',
  pd: 'volné dílo',
  'se-svolenim': 'se svolením',
}

export function PohoriHeroFoto({ foto }: { foto: Oblast['heroFoto'] }) {
  if (!foto?.soubor) return null

  const licence = foto.licence ? LICENCE_TEXT[foto.licence] : null
  const atribuce = ['Foto: ' + (foto.autor ?? 'neznámý autor'), licence].filter(Boolean).join(' · ')

  return (
    <figure className="pohori-herofoto">
      {/* Bez next/image schválně: soubor je statický, rozměry známe a poster
          nepotřebuje runtime optimalizaci — o velikost se stará build (dvě
          varianty, menší pro úzké displeje). */}
      <img
        className="pohori-herofoto-img"
        src={foto.soubor}
        srcSet={foto.nahled ? `${foto.nahled} 900w, ${foto.soubor} 1920w` : undefined}
        sizes="(max-width: 900px) 100vw, 1100px"
        alt={foto.alt ?? ''}
        loading="eager"
        decoding="async"
      />
      <figcaption className="pohori-herofoto-popis">
        {foto.popisMista && <span className="pohori-herofoto-misto">{foto.popisMista}</span>}
        {foto.zdrojUrl ? (
          <a
            className="pohori-herofoto-atr"
            href={foto.zdrojUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {atribuce}
          </a>
        ) : (
          <span className="pohori-herofoto-atr">{atribuce}</span>
        )}
      </figcaption>
    </figure>
  )
}

export default PohoriHeroFoto
