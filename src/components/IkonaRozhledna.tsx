import React from 'react'

/**
 * Ikona typu „rozhledna s občerstvením" (rozhodnutí Michala 28. 7. 2026:
 * rozhledny bereme jen s občerstvením nebo s chatou, samotné věže ne).
 *
 * Dvě kresby, protože každá slouží jinému místu — a vyzkoušelo se to, ne
 * odhadlo: obě varianty se vyrenderovaly ve 14–44 px vedle sebe a rozhodl
 * pohled.
 *
 *  - **KATALOG A PROFIL** (`IkonaRozhledna`): věž s prolukou mezi nohama
 *    + šálek vedle. Věž říká, co to je, šálek proč to v průvodci je. Nohy
 *    jsou oddělené — plná silueta vypadá při 16 px jako maják nebo pěšák.
 *  - **MAPOVÝ MARKER** (`KRESBA_ROZHLEDNY_MARKER`): jen věž, bez šálku.
 *    Do kolečka o 20 px se šálek nevejde — přetéká přes okraj a rozbíjí
 *    kruh, kterým celá mapová vrstva mluví. Marker má říct „tady je věž",
 *    zbytek doví čtenář v kartě.
 *
 * Marker se skládá do `innerHTML` Leafletu, kde React není — proto řetězec.
 */

/** Bílá silueta věže do barevného kolečka markeru (viewBox 20×20). */
export const KRESBA_ROZHLEDNY_MARKER =
  '<g transform="translate(2.1 2.1) scale(0.66)" fill="#fff">' +
  '<path d="M12 2.2 7 7h10l-5-4.8Z"/>' +
  '<rect x="6.1" y="7.7" width="11.8" height="2" rx=".55"/>' +
  '<path d="M9.3 10.3h5.4l1.9 11.5h-2.6l-1-7h-2l-1 7H7.4l1.9-11.5Z"/>' +
  '</g>'

export default function IkonaRozhledna({
  size = 18,
  title = 'Rozhledna s občerstvením',
}: {
  size?: number
  title?: string
}) {
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
      {/* věž: stříška, vyhlídková plošina, rozkročené nohy */}
      <path d="M9 2.4 4.8 6.6h8.4L9 2.4Z" fill="currentColor" />
      <rect x="4" y="7.2" width="10" height="1.9" rx=".5" fill="currentColor" />
      <path d="M6.9 9.7h4.2l1.5 10h-2.2l-.9-6H8.5l-.9 6H5.4l1.5-10Z" fill="currentColor" />
      {/* šálek — proč rozhledna v průvodci je */}
      <path d="M14.8 15.6h6.4v2.8a3.2 3.2 0 0 1-3.2 3.2 3.2 3.2 0 0 1-3.2-3.2v-2.8Z" fill="currentColor" />
      <path d="M21.4 16.6h.5a1.5 1.5 0 0 1 0 3h-.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
