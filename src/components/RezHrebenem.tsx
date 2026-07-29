import Link from 'next/link'
import React from 'react'

import type { Vrchol } from '@/lib/vrcholy'

/**
 * Řez hřebenem — výškový profil oblasti (handoff F1 v2, nová sekce mezi 01
 * a 02).
 *
 * JEDNA ODCHYLKA OD NÁVRHU, A JE TO VYLEPŠENÍ, NE ÚSPORA: návrh u řezu píše
 * „vodorovné rozestupy jsou ilustrační", protože prototyp neměl data. My je
 * máme — chaty i vrcholy nesou souřadnice — takže vodorovná osa je skutečná
 * zeměpisná délka (západ → východ). Řez tím přestává být kulisou: kdo si
 * najde chatu na křivce, vidí, kde na hřebeni doopravdy stojí.
 *
 * CO SE KRESLÍ A Z ČEHO:
 *   — silueta hřebene z pojmenovaných vrcholů OSM (nejvyšší vrchol v každém
 *     svislém pruhu; mezi nimi se interpoluje — proto „schematický řez");
 *   — body chat z publikovaných profilů, které mají výšku i polohu;
 *   — popisky tří nejvyšších vrcholů oblasti.
 * Co výšku nebo polohu nemá, se nekreslí. Radši prázdno než odhad.
 *
 * PŘÍSTUPNOST: každý bod chaty je odkaz na profil (ne div s `onClick`), takže
 * ho klávesnice projde tabem a čtečka přečte název i výšku. Popisek se ukáže
 * na hover i na focus.
 */

/** Svislý rozsah řezu: pod 1000 m se v Krkonoších hřeben nekreslí. */
const V_MIN = 1000
const V_MAX = 1650
const Y0 = 180
const VYSKA_KRIVKY = 150

export const yProVysku = (v: number): number =>
  Y0 - ((Math.min(Math.max(v, V_MIN), V_MAX) - V_MIN) / (V_MAX - V_MIN)) * VYSKA_KRIVKY

export type BodChaty = { slug: string; nazev: string; vyska: number; lng: number; url: string }

/** Silueta z vrcholů: nejvyšší vrchol v každém z `pruhu` svislých pruhů. */
export const siluetaZVrcholu = (
  vrcholy: Vrchol[],
  lngMin: number,
  lngMax: number,
  pruhu = 26,
): { x: number; y: number }[] => {
  if (!vrcholy.length || lngMax <= lngMin) return []
  const nejvyssiVPruhu = new Map<number, Vrchol>()
  for (const v of vrcholy) {
    const pruh = Math.min(pruhu - 1, Math.floor(((v.lng - lngMin) / (lngMax - lngMin)) * pruhu))
    const stavajici = nejvyssiVPruhu.get(pruh)
    if (!stavajici || v.vyska > stavajici.vyska) nejvyssiVPruhu.set(pruh, v)
  }
  return [...nejvyssiVPruhu.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => ({
      x: ((v.lng - lngMin) / (lngMax - lngMin)) * 1000,
      y: yProVysku(v.vyska),
    }))
}

type Props = {
  chaty: BodChaty[]
  vrcholy: Vrchol[]
  zdrojVrcholu?: string | null
}

export function RezHrebenem({ chaty, vrcholy, zdrojVrcholu }: Props) {
  const body = chaty.filter((ch) => ch.vyska >= V_MIN)
  if (body.length < 3) return null

  const lngs = [...body.map((b) => b.lng), ...vrcholy.map((v) => v.lng)]
  const lngMin = Math.min(...lngs)
  const lngMax = Math.max(...lngs)
  const x = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * 100

  const silueta = siluetaZVrcholu(vrcholy, lngMin, lngMax)
  const cesta = silueta.length
    ? `M0,${silueta[0].y.toFixed(1)} ${silueta
        .map((b) => `L${b.x.toFixed(1)},${b.y.toFixed(1)}`)
        .join(' ')} L1000,${silueta[silueta.length - 1].y.toFixed(1)} L1000,200 L0,200 Z`
    : null

  // Popisky vrcholů: tři nejvyšší, ale s odstupem — Luční hora (1 556 m)
  // a Studniční hora (1 555 m) stojí 1,5 km od sebe a jejich jména se
  // v řezu překryla do nečitelné kaše. Kdo je druhý nejvyšší, se tím
  // nemění; jen se místo něj popíše nejvyšší vrchol jinde na hřebeni.
  const popisky: Vrchol[] = []
  for (const v of [...vrcholy].sort((a, b) => b.vyska - a.vyska)) {
    if (popisky.length === 3) break
    if (popisky.some((p) => Math.abs(x(p.lng) - x(v.lng)) < 11)) continue
    popisky.push(v)
  }

  return (
    <div className="rez">
      <div className="rez-plocha">
        <svg className="rez-svg" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="rezVypln" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(157,178,195,.34)" />
              <stop offset="1" stopColor="rgba(157,178,195,.04)" />
            </linearGradient>
          </defs>
          <g className="rez-mrizka">
            {[1600, 1400, 1200].map((v) => (
              <line key={v} x1="0" y1={yProVysku(v)} x2="1000" y2={yProVysku(v)} />
            ))}
          </g>
          {cesta && <path className="rez-hreben" d={cesta} fill="url(#rezVypln)" />}
        </svg>

        {[1600, 1400, 1200].map((v) => (
          <span key={v} className="rez-osa" style={{ top: `${(yProVysku(v) / 200) * 100}%` }}>
            {v.toLocaleString('cs-CZ')} m
          </span>
        ))}

        {popisky.map((v) => (
          <span
            key={v.nazev}
            className="rez-vrchol"
            style={{ left: `${x(v.lng)}%`, top: `${(yProVysku(v.vyska) / 200) * 100}%` }}
          >
            {v.nazev.toUpperCase()}
            <br />
            {v.vyska.toLocaleString('cs-CZ')}
          </span>
        ))}

        {body.map((ch) => (
          <Link
            key={ch.slug}
            href={ch.url}
            className="rez-bod"
            style={{ left: `${x(ch.lng)}%`, top: `${(yProVysku(ch.vyska) / 200) * 100}%` }}
            aria-label={`${ch.nazev}, ${ch.vyska.toLocaleString('cs-CZ')} m — otevřít profil`}
          >
            <span className="rez-bod-popis">
              {ch.nazev} · {ch.vyska.toLocaleString('cs-CZ')} m
            </span>
            <span className="rez-bod-stopka" aria-hidden="true" />
            <span className="rez-bod-tecka" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <p className="rez-pozn">
        <span aria-hidden="true">†</span> schematický řez západ → východ:{' '}
        <b>svislá osa je nadmořská výška, vodorovná zeměpisná délka</b> — obojí z doložených
        dat, ne z odhadu. Silueta hřebene vede přes nejvyšší pojmenované vrcholy, mezi nimi je
        dokreslená; vykreslují se jen chaty, které mají doloženou výšku i polohu ({body.length}{' '}
        z {chaty.length}).{zdrojVrcholu ? ` Vrcholy: ${zdrojVrcholu}` : ''}
      </p>
    </div>
  )
}

export default RezHrebenem
