import Link from 'next/link'
import React from 'react'

import { formatVyskaM } from '@/lib/katalog'

export type VitrinaOtisk = { url: string; alt: string; nazev: string; vyska: number | null }

/**
 * 07 Sběratelství — VITRÍNA KRKONOŠ (handoff stránky pohoří): fotorealistická
 * dřevěná skříňka — rám s pokosy a 4 mosaznými šrouby, ořechová dřevokresba
 * (feTurbulence), prkenná záda se spárami, 2 police s vrženým stínem;
 * artefakty STOJÍ na policích (align-items flex-end, mírné rotace).
 * Obsah je REÁLNÝ: paspartované skeny otisků (razitkuj.cz se svolením),
 * dřevěná známka se skutečným číslem z oficiálního seznamu (DATA-10)
 * a poctivá prázdná pasparta za chaty, kterým razítko zatím nemáme.
 * Počty na mosazném štítku se počítají z databáze.
 */
export default function VitrinaSberatelstvi({
  otisky,
  znamka,
  pocty,
}: {
  otisky: VitrinaOtisk[]
  znamka: { cislo: string; nazev: string; vyska: number | null } | null
  pocty: { sRazitkem: number; otisku: number; seZnamkou: number; bezRazitka: number }
}) {
  return (
    <div className="vit">
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="vit-wood">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="4" seed="11" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.26  0 0 0 0 0.14  0 0 0 0 0.05  0 0 0 0.55 0" />
          </filter>
        </defs>
      </svg>

      <div className="vit-skrinka">
        <span className="vit-kresba" aria-hidden="true">
          <svg width="100%" height="100%">
            <rect width="100%" height="100%" filter="url(#vit-wood)" />
          </svg>
        </span>
        <span className="vit-pokos horni" aria-hidden="true" />
        <span className="vit-pokos dolni" aria-hidden="true" />
        <span className="vit-sroub tl" aria-hidden="true" />
        <span className="vit-sroub tr" aria-hidden="true" />
        <span className="vit-sroub bl" aria-hidden="true" />
        <span className="vit-sroub br" aria-hidden="true" />

        <div className="vit-zada">
          <div className="vit-patro">
            <div className="vit-artefakty">
              {otisky.map((o, i) => (
                <figure key={o.nazev} className="vit-pasparta" style={{ '--vrot': `${((i % 3) - 1) * 2}deg` } as React.CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- sken otisku z DB */}
                  <img src={o.url} alt={o.alt} loading="lazy" decoding="async" />
                  <figcaption>
                    {o.nazev}
                    {o.vyska != null && <span> · {formatVyskaM(o.vyska)}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
            <span className="vit-police" aria-hidden="true" />
          </div>

          <div className="vit-patro">
            <div className="vit-artefakty">
              {znamka && (
                <div className="vit-znamka" style={{ '--vrot': '-2deg' } as React.CSSProperties}>
                  <span className="vit-znamka-kresba" aria-hidden="true">
                    <svg width="74" height="74">
                      <rect width="74" height="74" filter="url(#vit-wood)" />
                    </svg>
                  </span>
                  <span className="vit-znamka-lesk" aria-hidden="true" />
                  <span className="vit-znamka-stred">
                    <span className="c">Č. {znamka.cislo}</span>
                    <span className="n">{znamka.nazev}</span>
                    {znamka.vyska != null && <span className="v">{formatVyskaM(znamka.vyska)}</span>}
                  </span>
                </div>
              )}
              <figure className="vit-pasparta prazdna" style={{ '--vrot': '1.4deg' } as React.CSSProperties}>
                <span className="vit-prazdno" aria-hidden="true">
                  ?
                </span>
                <figcaption>
                  {pocty.bezRazitka} chatám razítko zatím nemáme — sháníme
                </figcaption>
              </figure>
              <div className="vit-stitek" style={{ '--vrot': '0deg' } as React.CSSProperties}>
                <span className="vit-nytek levy" aria-hidden="true" />
                <span className="vit-nytek pravy" aria-hidden="true" />
                <b>Sbírka Krkonoš</b>
                <span>
                  {pocty.sRazitkem} chat s razítkem · {pocty.otisku} otisků
                  <br />
                  {pocty.seZnamkou} se známkou · vizitky čekají na souhlas
                </span>
              </div>
            </div>
            <span className="vit-police" aria-hidden="true" />
          </div>
        </div>

        <span className="vit-sklo" aria-hidden="true" />
        <span className="vit-svetlo" aria-hidden="true" />
      </div>

      <div className="vit-info">
        <p>
          Otisky přebíráme se svolením razitkuj.cz a sbíráme vlastní — u každého vedeme zdroj.
          Svůj deník razítek plníš na profilech chat; zůstává ve tvém prohlížeči.
        </p>
        <Link href="/razitkovnik" className="pohori-cta-red">
          Otevřít razítkovník ▸
        </Link>
      </div>
    </div>
  )
}
