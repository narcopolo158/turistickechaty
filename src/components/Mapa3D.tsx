'use client'

import React, { useState } from 'react'

/**
 * 3D mapa Krkonoš na stránce pohoří (F1d): poster → klik/tap → plná 3D
 * aplikace (public/3d/krkonose.html — samostatný soubor z pipeline DATA-28:
 * výškopis Mapy.com Elevation, trasy/lanovky/řeky/vrcholy OSM, three.js
 * přibalený). Poster šetří data — WebGL a ~3,4 MB dat se načte AŽ po
 * kliknutí (handoff: „three.js až po kliknutí, mobil poster→tap").
 * Aplikace nese vlastní ovládání (hledání chaty, sezóny, čas, vrstvy,
 * panoramatický malovaný režim) i vlastní atribuci v patičce.
 */
export default function Mapa3D({ posterUrl, appUrl }: { posterUrl: string; appUrl: string }) {
  const [spusteno, setSpusteno] = useState(false)

  return (
    <div className="m3d">
      {spusteno ? (
        <iframe
          className="m3d-app"
          src={appUrl}
          title="3D mapa Krkonoš — chaty průvodce"
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <button type="button" className="m3d-poster" onClick={() => setSpusteno(true)} aria-label="Spustit 3D mapu Krkonoš">
          {/* eslint-disable-next-line @next/next/no-img-element -- statický poster z public/3d */}
          <img src={posterUrl} alt="Náhled 3D mapy Krkonoš — malovaný panoramatický režim" loading="lazy" decoding="async" />
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
