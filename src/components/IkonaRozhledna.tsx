import React from 'react'

/**
 * Ikona typu „rozhledna s občerstvením" (rozhodnutí Michala 28. 7. 2026:
 * rozhledny bereme jen s občerstvením nebo s chatou, samotné věže ne).
 *
 * KRESBA VYCHÁZÍ Z LEGENDY ČESKÝCH TURISTICKÝCH MAP (zadání Michala — předloha
 * SHOCart / SmartMaps / KČT / GOL / VKÚ). Ve všech těch klíčích je rozhledna
 * táž věc: **štíhlá věž se špičatou stříškou, ochozem a rozšířenou patou** —
 * ne příhradový stožár a ne rozkročené nohy. Čtenář, který zná mapu, tak pozná
 * značku dřív, než si přečte popisek. Občerstvení kreslí SHOCart jako půllitr
 * (řádek „bufet a jiné občerstvení"), KČT jako stolek; půllitr je při 16 px
 * čitelnější, proto je v kompozitní variantě on.
 *
 * Dvě varianty, protože každá slouží jinému místu — a rozhodl render ve
 * 14–40 px vedle sebe, ne odhad:
 *  - `vez` (výchozí) — do mapového markeru a do katalogu. Sama věž drží tvar
 *    i ve 14 px; v katalogu navíc vedle stojí služba ☕, takže by se šálek
 *    v ikoně opakoval.
 *  - `vez-obcerstveni` — na profil, kde je ikona 16–18 px a má nést celý
 *    význam typu i bez okolních značek.
 *
 * `KRESBA_ROZHLEDNY_MARKER` je táž věž jako řetězec: mapový marker se skládá
 * do `innerHTML` Leafletu, kde React není. Jeden zdroj pravdy pro obě cesty.
 */

/** Věž v souřadnicích viewBoxu 24×24, vycentrovaná (pro marker i samostatnou ikonu). */
const VEZ_STRED =
  '<path d="M12 2.2 9.2 6.9h5.6L12 2.2Z"/>' +
  '<rect x="10.5" y="7.4" width="3" height="2.6"/>' +
  '<rect x="9.1" y="10.3" width="5.8" height="1.9" rx=".3"/>' +
  '<path d="M10.3 12.6h3.4l1.7 9.2H8.6l1.7-9.2Z"/>'

/** Věž posunutá vlevo — dělá místo půllitru (kompozitní varianta). */
const VEZ_VLEVO =
  '<path d="M7 2.2 4.7 6.3h4.6L7 2.2Z"/>' +
  '<rect x="5.5" y="6.7" width="3" height="2.4"/>' +
  '<rect x="4.3" y="9.3" width="5.4" height="1.7" rx=".3"/>' +
  '<path d="M5.4 11.4h3.2l1.5 9.2H3.9l1.5-9.2Z"/>'

/** Bílá silueta věže do barevného kolečka markeru (viewBox 20×20). */
export const KRESBA_ROZHLEDNY_MARKER =
  `<g transform="translate(2.6 2.6) scale(0.62)" fill="#fff">${VEZ_STRED}</g>`

export default function IkonaRozhledna({
  size = 18,
  varianta = 'vez',
  title = 'Rozhledna s občerstvením',
}: {
  size?: number
  varianta?: 'vez' | 'vez-obcerstveni'
  title?: string
}) {
  const jenVez = varianta === 'vez'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      focusable="false"
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      <title>{title}</title>
      <g fill="currentColor" dangerouslySetInnerHTML={{ __html: jenVez ? VEZ_STRED : VEZ_VLEVO }} />
      {!jenVez && (
        <>
          {/* půllitr dle SHOCart („bufet a jiné občerstvení") — pata zarovnaná s patou věže */}
          <path d="M13.2 14.8h5.6v5.8h-5.6z" fill="currentColor" />
          <path d="M19.4 16.1h1a1.6 1.6 0 0 1 0 3.2h-1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </>
      )}
    </svg>
  )
}
