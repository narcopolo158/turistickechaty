import Link from 'next/link'
import React from 'react'

/**
 * Statický poster band (handoff homepage „3D panorama band"): malované
 * hřebeny s toon stíny, Sněžka s halo popiskem, staticky nakreslená lanovka
 * (3 podpěry, prohnuté lano, 2 zmrzlé gondoly), oblaka a slunce bez animace.
 * Rozhodnutí návrhu: lanovky jezdí až na stránce pohoří — poster šetří data.
 * Zimní vrstva jen podle KALENDÁŘE (XII–III), žádná fake předpověď.
 *
 * Poctivost (vědomé odchylky od prototypu, deník 28. 7. 2026): CTA vede na
 * živou mapu chat (#mapa) — stránka pohoří s plnou 3D zatím neexistuje (F1d),
 * mrtvé odkazy neděláme; atribuce „© Mapy.com · OSM · KČT · terén ČÚZK"
 * z prototypu VYNECHÁNA — tenhle poster je ilustrace, žádná z těch dat
 * nenese (atribuci dostane až skutečný render z pipeline DATA-28).
 */
export default function PosterBand({ zima }: { zima: boolean }) {
  return (
    <div className="hf1-poster">
      <div className="hf1-poster-ram">
        <div className="hf1-poster-scena">
          <svg viewBox="0 0 1200 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="hf1-poster-svg" aria-hidden="true">
            <defs>
              <radialGradient id="hf1-sun">
                <stop offset="0" stopColor="#fdf0cf" stopOpacity=".95" />
                <stop offset="1" stopColor="#fdf0cf" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="980" cy="74" r="98" fill="url(#hf1-sun)" />
            <circle cx="980" cy="74" r="28" fill="#faeac6" />
            <g>
              <ellipse cx="230" cy="86" rx="86" ry="14" fill="#fdf8ec" opacity=".7" />
              <ellipse cx="288" cy="98" rx="54" ry="10" fill="#fdf8ec" opacity=".55" />
            </g>
            <g>
              <ellipse cx="700" cy="60" rx="100" ry="15" fill="#fdf8ec" opacity=".6" />
              <ellipse cx="770" cy="73" rx="62" ry="10" fill="#fdf8ec" opacity=".5" />
            </g>
            <path d="M0,218 L146,158 L262,190 L380,124 L516,178 L648,116 L780,170 L900,134 L1040,182 L1200,144 L1200,400 L0,400 Z" fill="#bccbd8" />
            <path d="M380,124 L432,152 L334,166 Z" fill="#f4f7f9" opacity=".9" />
            <path d="M648,116 L706,152 L594,162 Z" fill="#f4f7f9" opacity=".9" />
            <path d="M0,218 L146,158 L262,190 L380,124 L516,178 L648,116 L780,170 L900,134 L1040,182 L1200,144 L1200,178 C1040,206 900,180 780,200 C620,226 480,204 340,224 C220,240 100,234 0,250 Z" fill="#a7bacb" opacity=".6" />
            <path d="M0,264 L128,228 L248,256 L384,204 L520,246 L640,196 L760,238 L880,210 L1010,248 L1130,222 L1200,240 L1200,400 L0,400 Z" fill="#9db2c3" />
            <path d="M0,264 L128,228 L248,256 L384,204 L520,246 L640,196 L760,238 L880,210 L1010,248 L1130,222 L1200,240 L1200,272 C1040,254 900,268 762,266 C600,264 420,248 252,282 C140,302 60,292 0,298 Z" fill="#84a0b5" opacity=".7" />
            <path d="M0,316 L118,286 L240,310 L360,274 L500,306 L620,268 L740,302 L860,278 L990,308 L1112,284 L1200,302 L1200,400 L0,400 Z" fill="#7e9569" />
            <path d="M0,316 L118,286 L240,310 L360,274 L500,306 L620,268 L740,302 L860,278 L990,308 L1112,284 L1200,302 L1200,330 C1060,314 940,330 800,326 C640,320 480,330 320,344 C200,354 90,342 0,348 Z" fill="#5f7a52" opacity=".7" />
            <g fill="#4f6a45" opacity=".85">
              <path d="M84,304 l6,-16 l6,16 Z" />
              <path d="M196,308 l6,-17 l6,17 Z" />
              <path d="M310,292 l6,-16 l6,16 Z" />
              <path d="M448,300 l6,-17 l6,17 Z" />
              <path d="M574,286 l6,-16 l6,16 Z" />
              <path d="M700,296 l6,-17 l6,17 Z" />
              <path d="M826,284 l6,-16 l6,16 Z" />
              <path d="M952,298 l6,-17 l6,17 Z" />
              <path d="M1076,288 l6,-16 l6,16 Z" />
            </g>
            <path d="M0,362 L142,340 L282,358 L422,336 L562,354 L702,334 L842,352 L982,336 L1122,352 L1200,342 L1200,400 L0,400 Z" fill="#6b8a4f" />
            <path d="M-10,306 C120,296 250,284 410,278 C600,270 770,272 950,260 C1070,252 1150,252 1215,246" fill="none" stroke="#fdfaf2" strokeWidth="4.4" opacity=".6" />
            <path d="M120,352 C190,332 280,352 350,338 C430,322 500,344 570,334" fill="none" stroke="var(--tr-red, #c92f1b)" strokeWidth="3" strokeDasharray="10 7" opacity=".9" />
            <path d="M570,334 C650,320 730,332 820,314 C900,298 970,312 1050,300" fill="none" stroke="var(--tr-blue, #2a5cb8)" strokeWidth="3" strokeDasharray="10 7" opacity=".86" />
            <g stroke="#3c4552" strokeWidth="3" opacity=".9">
              <path d="M108,236 l0,34" />
              <path d="M104,270 l8,0" />
            </g>
            <g stroke="#3c4552" strokeWidth="3" opacity=".9">
              <path d="M560,206 l0,30" />
              <path d="M556,236 l8,0" />
            </g>
            <g stroke="#3c4552" strokeWidth="3" opacity=".9">
              <path d="M852,128 l0,28" />
              <path d="M848,156 l8,0" />
            </g>
            <path d="M108,236 C240,268 420,262 560,206 C660,166 760,150 852,128" fill="none" stroke="#3c4552" strokeWidth="1.6" opacity=".75" />
            <g transform="translate(318,257)">
              <path d="M0,0 l0,7" stroke="#3c4552" strokeWidth="1.6" />
              <rect x="-7" y="7" width="14" height="11" rx="3" fill="var(--red)" stroke="#a8250f" strokeWidth="1" />
              <rect x="-4.5" y="9.5" width="9" height="4" rx="1" fill="#fdf4e4" />
            </g>
            <g transform="translate(742,153)">
              <path d="M0,0 l0,7" stroke="#3c4552" strokeWidth="1.6" />
              <rect x="-7" y="7" width="14" height="11" rx="3" fill="var(--red)" stroke="#a8250f" strokeWidth="1" />
              <rect x="-4.5" y="9.5" width="9" height="4" rx="1" fill="#fdf4e4" />
            </g>
          </svg>
          <div className="hf1-poster-vineta" aria-hidden="true" />
          {zima && (
            <>
              <div className="hf1-poster-zima" aria-hidden="true" />
              <span className="hf1-poster-zima-chip">zimní poster · podle kalendáře</span>
            </>
          )}
          <div className="hf1-poster-snezka" aria-hidden="true">
            <span className="nazev">SNĚŽKA</span>
            <span className="vyska">1 603 m</span>
          </div>
          <div className="hf1-poster-podpis">
            <span className="hf1-poster-eyebrow">Podpis webu</span>
            <span className="hf1-poster-titul">Malovaná 3D mapa Krkonoš</span>
          </div>
          <div className="hf1-poster-lista">
            <div className="hf1-poster-cta-blok">
              <Link href="#mapa" className="hf1-poster-cta">
                Otevřít mapu chat ▸
              </Link>
              <span className="hf1-poster-mikro">
                statický poster šetří data — plná 3D mapa (i s jedoucí lanovkou)
                <br />
                přijde na stránce pohoří, three.js až po kliknutí
              </span>
            </div>
            <span className="hf1-poster-mikro">ilustrační panorama</span>
          </div>
        </div>
      </div>
    </div>
  )
}
