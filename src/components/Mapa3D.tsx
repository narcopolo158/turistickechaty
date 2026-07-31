'use client'

import React, { useEffect, useState } from 'react'

/**
 * 3D mapa oblasti na stránce pohoří (F1d): poster → klik/tap → plná 3D
 * aplikace (public/3d/<oblast>.html — samostatný soubor z pipeline DATA-28:
 * výškopis Mapy.com Elevation, trasy/lanovky/řeky/vrcholy OSM, three.js
 * přibalený). Poster šetří data — WebGL a ~3,4 MB dat se načte AŽ po
 * kliknutí (handoff: „three.js až po kliknutí, mobil poster→tap").
 * Aplikace nese vlastní ovládání (hledání chaty, sezóny, čas, vrstvy,
 * panoramatický malovaný režim) i vlastní atribuci v patičce.
 */
export default function Mapa3D({
  posterUrl,
  appUrl,
  oblastNazev,
}: {
  posterUrl: string
  appUrl: string
  /**
   * Jméno oblasti do titulku iframu, aria-labelu tlačítka a altu posteru.
   * Do 31. 7. 2026 tu stálo „Krkonoš" napevno, takže na stránce Jizerských hor
   * četla čtečka „Spustit 3D mapu Krkonoš" — vidoucí čtenář si toho nevšiml,
   * nevidomý dostal cizí pohoří.
   */
  oblastNazev: string
}) {
  // stav: 'poster' | 'app' | 'app+deeplink' — deep-link „Ukázat na 3D mapě"
  // z profilů (?chata=<název>) spouští 3D rovnou a dotaz předá aplikaci
  // (přílet kamery). Query se čte až na klientu (useEffect) — server i první
  // klientský render kreslí poster (žádný hydration mismatch), stránka SSG.
  const [stav, setStav] = useState<{ spusteno: boolean; deepLink: string | null }>({ spusteno: false, deepLink: null })

  useEffect(() => {
    const chata = new URLSearchParams(window.location.search).get('chata')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- záměrné jednorázové převzetí query po hydrataci (SSG bez searchParams)
    if (chata) setStav({ spusteno: true, deepLink: chata })
  }, [])

  const spusteno = stav.spusteno
  const iframeSrc = stav.deepLink ? `${appUrl}?chata=${encodeURIComponent(stav.deepLink)}` : appUrl

  return (
    <div className="m3d">
      {spusteno ? (
        <iframe
          className="m3d-app"
          src={iframeSrc}
          title={`3D mapa — ${oblastNazev} — chaty průvodce`}
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <button type="button" className="m3d-poster" onClick={() => setStav((s) => ({ ...s, spusteno: true }))} aria-label={`Spustit 3D mapu — ${oblastNazev}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- statický poster z public/3d */}
          <img src={posterUrl} alt={`Náhled 3D mapy — ${oblastNazev}, malovaný panoramatický režim`} loading="lazy" decoding="async" />
          <span className="m3d-poster-overlay">
            <span className="m3d-poster-cta">▶ Spustit 3D mapu</span>
            <span className="m3d-poster-pozn">poster šetří data — 3D scéna (~3,4 MB) se načte až po kliknutí</span>
          </span>
        </button>
      )}
      <div className="m3d-lista">
        <span className="m3d-atribuce">
          výškopis: Mapy.com Elevation API · trasy, lanovky, řeky a vrcholy: © přispěvatelé OpenStreetMap (ODbL)
        </span>
        <a className="m3d-fullscreen" href={appUrl} target="_blank" rel="noopener">
          otevřít na celou obrazovku ↗
        </a>
      </div>
    </div>
  )
}
