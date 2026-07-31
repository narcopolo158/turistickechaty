import React from 'react'

import TiltDiv from './TiltDiv'

/**
 * Hero koláž „sběratelský stůl" (handoff F1-Homepage, pravý sloupec hero):
 * 5 faux-3D artefaktů — výřez turistické mapy (roztrhané okraje, vrstevnice,
 * trasy), polaroid, otisky razítek, dřevěná známka, smaltová pásová značka.
 * Poctivost dle popisky návrhu: „reálné skeny se svolením, jinak ghost" —
 * polaroid nese hero fotku Luční boudy s viditelnou atribucí, otisk Luční je
 * reálný sken (razitkuj.cz se svolením), hranatý otisk Výrovky je ghost
 * (sken zatím nemáme), dřevěná známka nese SKUTEČNÉ číslo 11 z oficiálního
 * seznamu vydavatele (DATA-10, jistota A) a rok 1623 je doložený milník.
 * `prefers-reduced-motion` vypíná tilt (TiltDiv) i transition (CSS).
 */
export default function HeroKolaz({
  polaroid,
  otiskLucni,
}: {
  /** Hero fotka do polaroidu (Luční bouda) — null = ghost slot s popiskou. */
  polaroid: { url: string; popisek: string; atribuce: string } | null
  /** Reálný sken otisku Luční (razitkuj.cz se svolením) — null = ghost SVG. */
  otiskLucni: { url: string; alt: string } | null
}) {
  return (
    <div className="hf1-kolaz" aria-label="Sběratelská koláž — mapa, fotka, otisky, známka">
      {/* 1 · výřez turistické mapy s roztrhanými okraji */}
      <TiltDiv zaklad="rotate(-5deg)" className="hf1-mapa">
        <div className="hf1-mapa-papir">
          <div className="hf1-mapa-plocha">
            <div className="hf1-mapa-vrstevnice" aria-hidden="true" />
            <svg viewBox="0 0 296 238" width="100%" height="100%" className="hf1-mapa-kresba" aria-hidden="true">
              <path d="M-8,196 C60,178 120,186 170,150 C220,114 250,122 306,96" fill="none" stroke="var(--tr-blue, #2a5cb8)" strokeWidth="2.4" opacity=".75" />
              <path d="M24,244 C70,190 130,168 178,140 C220,116 248,86 262,44" fill="none" stroke="var(--tr-red, #c92f1b)" strokeWidth="2.8" strokeDasharray="8 6" />
              <path d="M-6,120 C60,112 130,124 200,108 C250,96 280,100 302,92" fill="none" stroke="#fff" strokeWidth="3.4" opacity=".7" />
              <circle cx="66" cy="196" r="4.5" fill="#fff" stroke="var(--ink-artefakt)" strokeWidth="1.8" />
              <g transform="translate(196,118)">
                <path d="M-10,5 L0,-10 L10,5 Z" fill="var(--red)" />
                <rect x="-7" y="5" width="14" height="8" fill="var(--red)" />
                <rect x="-1.5" y="7" width="4" height="6" fill="#fff" />
              </g>
              <path d="M262,44 l6,-3 M262,44 l-1,7" stroke="var(--ink-artefakt)" strokeWidth="1.4" />
            </svg>
            <span className="hf1-mapa-popisek" style={{ left: 44, top: 200 }}>
              Špindlerův Mlýn
            </span>
            <span className="hf1-mapa-popisek cerveny" style={{ left: 160, top: 130 }}>
              LUČNÍ BOUDA
            </span>
            <span className="hf1-mapa-sklad" aria-hidden="true" />
            <span className="hf1-mapa-atribuce">© Mapy.com · KČT</span>
          </div>
        </div>
        <span className="hf1-washi levy" aria-hidden="true" />
        <span className="hf1-washi pravy" aria-hidden="true" />
      </TiltDiv>

      {/* 2 · polaroid — reálná hero fotka s atribucí, jinak ghost slot */}
      <TiltDiv zaklad="rotate(3.2deg)" className="hf1-polaroid">
        <div className="hf1-polaroid-ram">
          <div className="hf1-polaroid-foto">
            {polaroid ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload
              <img src={polaroid.url} alt={polaroid.popisek} loading="lazy" decoding="async" />
            ) : (
              // Prázdný rámeček mluví za sebe; slovo „doložený" v popisce
              // znělo jako poznámka z redakčního systému (31. 7. 2026).
              <span className="hf1-polaroid-ghost">fotku sem teprve hledáme</span>
            )}
            <span className="hf1-rozek levy" aria-hidden="true" />
            <span className="hf1-rozek pravy" aria-hidden="true" />
            {polaroid && <span className="hf1-polaroid-atribuce">{polaroid.atribuce}</span>}
          </div>
          <span className="hf1-polaroid-popisek">{polaroid ? polaroid.popisek : 'hřebenovka'}</span>
        </div>
        <span className="hf1-washi horni" aria-hidden="true" />
      </TiltDiv>

      {/* 3a · otisk Luční — reálný sken se svolením, jinak ghost SVG */}
      <div className="hf1-otisk kulaty" aria-hidden="true">
        {otiskLucni ? (
          // eslint-disable-next-line @next/next/no-img-element -- sken otisku (razitkuj.cz se svolením)
          <img src={otiskLucni.url} alt="" loading="lazy" decoding="async" />
        ) : (
          <svg viewBox="0 0 120 120" width="118" height="118">
            <defs>
              <path id="hkA" d="M18,60 a42,42 0 0 1 84,0" fill="none" />
              <path id="hkB" d="M22,62 a38,38 0 0 0 76,0" fill="none" />
            </defs>
            <g fill="var(--stamp, #c92f1b)" stroke="var(--stamp, #c92f1b)">
              <circle cx="60" cy="60" r="53" fill="none" strokeWidth="3" />
              <circle cx="60" cy="60" r="42" fill="none" strokeWidth="1.4" />
              <text fontFamily="'Space Grotesk',sans-serif" fontWeight="700" fontSize="11" letterSpacing="1.5" stroke="none">
                <textPath href="#hkA" startOffset="50%" textAnchor="middle">
                  LUČNÍ BOUDA
                </textPath>
              </text>
              <text fontFamily="'Space Grotesk',sans-serif" fontWeight="600" fontSize="9" letterSpacing="1.2" stroke="none">
                <textPath href="#hkB" startOffset="50%" textAnchor="middle">
                  KRKONOŠE · 1410 m
                </textPath>
              </text>
              <path d="M40,66 L50,52 L57,60 L67,45 L80,66 Z" stroke="none" />
              <path d="M34,72 L86,72" strokeWidth="1.6" />
              <text x="60" y="83" fontFamily="'Space Grotesk',sans-serif" fontWeight="700" fontSize="8" letterSpacing="1" textAnchor="middle" stroke="none">
                EST. 1623
              </text>
            </g>
          </svg>
        )}
      </div>

      {/* 3b · hranatý otisk Výrovky — ghost (sken zatím nemáme) */}
      <div className="hf1-otisk hranaty" aria-hidden="true">
        <svg viewBox="0 0 110 110" width="96" height="96">
          <g fill="#2a5cb8" stroke="#2a5cb8">
            <rect x="10" y="10" width="90" height="90" rx="7" fill="none" strokeWidth="2.6" />
            <rect x="17" y="17" width="76" height="76" rx="4" fill="none" strokeWidth="1.1" />
            <text x="55" y="38" fontFamily="'Space Grotesk',sans-serif" fontWeight="700" fontSize="10" letterSpacing="1" textAnchor="middle" stroke="none">
              VÝROVKA
            </text>
            <path d="M38,62 L47,49 L54,57 L62,44 L73,62 Z" stroke="none" />
            <path d="M33,68 L77,68" strokeWidth="1.4" />
            <text x="55" y="80" fontFamily="'Space Grotesk',sans-serif" fontWeight="600" fontSize="7.5" letterSpacing=".8" textAnchor="middle" stroke="none">
              1370 m · KRKONOŠE
            </text>
          </g>
        </svg>
      </div>

      {/* 4 · dřevěná turistická známka — reálné č. 11 (oficiální seznam vydavatele) */}
      <TiltDiv className="hf1-znamka">
        <span className="hf1-znamka-kresba" aria-hidden="true">
          <svg width="88" height="88">
            <rect width="88" height="88" filter="url(#hf1-wood)" />
          </svg>
        </span>
        <span className="hf1-znamka-lesk" aria-hidden="true" />
        <span className="hf1-znamka-stred">
          <span className="hf1-znamka-c">Č. 11</span>
          <span className="hf1-znamka-nazev">
            LUČNÍ
            <br />
            BOUDA
          </span>
          <span className="hf1-znamka-vyska">1410 m</span>
        </span>
      </TiltDiv>

      {/* 5 · smaltová pásová značka KČT */}
      <TiltDiv zaklad="rotate(-2deg)" className="hf1-smaltovka">
        <span className="pruh bily" />
        <span className="pruh cerveny" />
        <span className="pruh bily" />
        <span className="sroubek levy" aria-hidden="true" />
        <span className="sroubek pravy" aria-hidden="true" />
      </TiltDiv>

      {/* Popiska „sběratelské artefakty — reálné skeny se svolením, jinak
          ghost" tu byla do 31. 7. 2026. Slovo „ghost" je název stavu ze
          šablony, ne čeština, a původ skenů patří k tiráži, ne pod obrázek
          (zadání Michala: zdroje pohromadě v patičce). Autor a licence
          konkrétní fotky zůstávají přímo na ní. */}
    </div>
  )
}
