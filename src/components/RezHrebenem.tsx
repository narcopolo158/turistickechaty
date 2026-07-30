import Link from 'next/link'
import React from 'react'

import type { Vrchol, Vrstva } from '@/lib/vrcholy'

/**
 * Řez hřebenem — panoramatický výškový profil oblasti (handoff F1 v2, sekce
 * mezi 01 a 02). Druhá verze: první byla graf s puntíky, tahle je pohled na
 * hory.
 *
 * CO SE ZMĚNILO A PROČ (Michal 29. 7. 2026: „řez hřebenem udělej lépe,
 * výsledek není wow ani dobrý"):
 *
 *   1. **Silueta je teď skutečný terén, ne spojnice vrcholů.** Kreslí se ze
 *      stejného výškového modelu, ze kterého žije 3D mapa (Mapy.com Elevation,
 *      mřížka 240×144): pro každý sloupec se vezme nejvyšší terén ve třech
 *      zeměpisných pásech — jižní podhůří, hřeben, severní strana. Bližší
 *      hřbety tak překrývají vzdálenější a vznikne hloubka. Lomená čára mezi
 *      vrcholy vypadala jako kardiogram, protože jím taky byla.
 *   2. **Puntíky přestaly být mračnem.** Chaty se nekreslí jako 55 stejných
 *      teček: nejvyšší z nich mají popisku napevno (s odstupem, ať se
 *      nepřekrývají), ostatní se ukážou při najetí. Kdo si sáhne na kteroukoli,
 *      dostane jméno a výšku.
 *   3. **Přibyla obloha, opar a orientace** (západ → východ, výškové linky).
 *      Bez nich to byl graf bez jednotek.
 *
 * POCTIVOST BEZE ZMĚNY: vodorovná osa je zeměpisná délka, svislá nadmořská
 * výška, obojí z dat. Terén je MODEL (nemusí odpovídat realitě na metry) a je
 * to napsané pod řezem, ne schované.
 *
 * PŘÍSTUPNOST: bod chaty je odkaz na profil s popisem v `aria-label`, takže
 * ho klávesnice projde tabem a čtečka přečte název i výšku.
 */

const SIRKA = 1000
const VYSKA = 260
/** Spodní hrana kresby: pod ní je patka s popiskami os. */
const Y0 = 232
const V_MIN = 400

export type BodChaty = { slug: string; nazev: string; vyska: number; lng: number; url: string }

type Props = {
  chaty: BodChaty[]
  vrcholy: Vrchol[]
  vrstvy?: Vrstva[]
  bbox?: { lngMin: number; lngMax: number } | null
  zdrojVrcholu?: string | null
  zdrojVyskopisu?: string | null
}

/** Výška → y v plátně. Rozsah se počítá z dat, ne z konstant pro Krkonoše. */
export const mapaVysky = (vMax: number) => {
  const strop = Math.ceil((vMax + 60) / 100) * 100
  return (v: number) => Y0 - ((Math.min(Math.max(v, V_MIN), strop) - V_MIN) / (strop - V_MIN)) * (Y0 - 24)
}

/** Hladká křivka (Catmull-Rom → bezier) — terén nemá lomené hrany. */
export const hladkaCesta = (body: { x: number; y: number }[]): string => {
  if (body.length < 2) return ''
  const d = [`M${body[0].x.toFixed(1)},${body[0].y.toFixed(1)}`]
  for (let i = 0; i < body.length - 1; i++) {
    const p0 = body[Math.max(0, i - 1)]
    const p1 = body[i]
    const p2 = body[i + 1]
    const p3 = body[Math.min(body.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d.push(`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`)
  }
  return d.join(' ')
}

/** Vybere popisky s vodorovným odstupem — jinak splynou v kaši. */
const sOdstupem = <T,>(polozky: T[], x: (p: T) => number, minOdstup: number, kolik: number): T[] => {
  const vybrane: T[] = []
  for (const p of polozky) {
    if (vybrane.length === kolik) break
    if (vybrane.some((v) => Math.abs(x(v) - x(p)) < minOdstup)) continue
    vybrane.push(p)
  }
  return vybrane
}

export function RezHrebenem({
  chaty,
  vrcholy,
  vrstvy = [],
  bbox,
  zdrojVrcholu,
  zdrojVyskopisu,
}: Props) {
  /**
   * Panorama je terén a vrcholy; chaty jsou popisky NAVÍC.
   *
   * Do 30. 7. 2026 se komponenta bez tří chat nekreslila vůbec — a u nové
   * oblasti to znamenalo prázdnou sekci s nadpisem: Jizerské hory měly
   * výškopis i šest vrcholů z DATA-28, ale ani jeden zveřejněný profil.
   * Nakreslit hory a přiznat, že chaty ještě nemáme, je poctivější než
   * nekreslit nic a tvrdit nadpisem, že tam něco je.
   *
   * Kreslí se tedy, když je čím: buď tři chaty (jako dřív), nebo výškopisné
   * vrstvy a k nim bbox, podle kterého se určí vodorovná osa. Bez bboxu by
   * osa musela vyjít z chat — a těch může být nula.
   */
  const maTeren = vrstvy.length > 0 && bbox != null
  if (chaty.length < 3 && !maTeren) return null

  const lngMin = bbox?.lngMin ?? Math.min(...chaty.map((c) => c.lng))
  const lngMax = bbox?.lngMax ?? Math.max(...chaty.map((c) => c.lng))
  const x = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * 100

  const vMaxTerenu = vrstvy.length ? Math.max(...vrstvy.flatMap((v) => v.vysky)) : 0
  const vMax = Math.max(vMaxTerenu, ...chaty.map((c) => c.vyska), ...vrcholy.map((v) => v.vyska))
  const y = mapaVysky(vMax)

  // Vrstvy se kreslí odzadu: sever (nejdál), hřeben, jih (nejblíž pozorovateli
  // stojícímu na české straně). Pořadí je v datech, tady se jen respektuje.
  const poradi: Vrstva['pas'][] = ['sever', 'hreben', 'jih']
  const kresby = poradi
    .map((pas) => vrstvy.find((v) => v.pas === pas))
    .filter((v): v is Vrstva => !!v && v.vysky.length > 1)
    .map((v) => {
      const krok = SIRKA / (v.vysky.length - 1)
      const body = v.vysky.map((h, i) => ({ x: i * krok, y: y(h) }))
      return { pas: v.pas, d: `${hladkaCesta(body)} L${SIRKA},${VYSKA} L0,${VYSKA} Z` }
    })

  const linky = [1600, 1400, 1200, 1000].filter((v) => v < vMax)
  const popiskyVrcholu = sOdstupem([...vrcholy].sort((a, b) => b.vyska - a.vyska), (v) => x(v.lng), 12, 3)
  const stale = sOdstupem([...chaty].sort((a, b) => b.vyska - a.vyska), (ch) => x(ch.lng), 9, 5)
  const staleSlugy = new Set(stale.map((ch) => ch.slug))

  return (
    <div className="rez">
      <div className="rez-plocha">
        <svg className="rez-svg" viewBox={`0 0 ${SIRKA} ${VYSKA}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="rezNebe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--rez-nebe-h)" />
              <stop offset="1" stopColor="var(--rez-nebe-d)" />
            </linearGradient>
            <radialGradient id="rezSlunce" cx="0.78" cy="0.16" r="0.34">
              <stop offset="0" stopColor="rgba(255,236,190,.75)" />
              <stop offset="1" stopColor="rgba(255,236,190,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={SIRKA} height={VYSKA} fill="url(#rezNebe)" />
          <rect x="0" y="0" width={SIRKA} height={VYSKA} fill="url(#rezSlunce)" />
          <g className="rez-mrizka">
            {linky.map((v) => (
              <line key={v} x1="0" y1={y(v)} x2={SIRKA} y2={y(v)} />
            ))}
          </g>
          {kresby.map((k) => (
            <path key={k.pas} className={`rez-vrstva rez-vrstva--${k.pas}`} d={k.d} />
          ))}
        </svg>

        {linky.map((v) => (
          <span key={v} className="rez-osa" style={{ top: `${(y(v) / VYSKA) * 100}%` }}>
            {v.toLocaleString('cs-CZ')} m
          </span>
        ))}

        {popiskyVrcholu.map((v) => (
          <span
            key={v.nazev}
            className="rez-vrchol"
            style={{ left: `${x(v.lng)}%`, top: `${(y(v.vyska) / VYSKA) * 100}%` }}
          >
            {/* Název se nekrátí: hraniční vrcholy nesou v OSM obě jména
                („Śnieżka / Sněžka") a průvodce vede místní názvy tak, jak jsou
                — u polských schronisek to platí taky. */}
            <b>{v.nazev}</b>
            {v.vyska.toLocaleString('cs-CZ')} m
          </span>
        ))}

        {chaty.map((ch) => (
          <Link
            key={ch.slug}
            href={ch.url}
            className={`rez-bod${staleSlugy.has(ch.slug) ? ' rez-bod--stale' : ''}`}
            style={{ left: `${x(ch.lng)}%`, top: `${(y(ch.vyska) / VYSKA) * 100}%` }}
            aria-label={`${ch.nazev}, ${ch.vyska.toLocaleString('cs-CZ')} m — otevřít profil`}
          >
            <span className="rez-bod-popis">
              {ch.nazev} · {ch.vyska.toLocaleString('cs-CZ')} m
            </span>
            <span className="rez-bod-tecka" aria-hidden="true" />
          </Link>
        ))}

        <span className="rez-smer rez-smer--z">západ</span>
        <span className="rez-smer rez-smer--v">východ</span>
      </div>

      <p className="rez-pozn">
        <span aria-hidden="true">†</span> pohled na pohoří od jihu:{' '}
        <b>vodorovně zeměpisná délka, svisle nadmořská výška</b> — obojí z dat, ne z odhadu.
        Terén je <b>výškový model</b> (tři pásy: jižní podhůří, hřeben, severní strana), ne obrys
        změřený v terénu.{' '}
        {chaty.length > 0 ? (
          <>
            Vykresleno {chaty.length} chat s doloženou výškou i polohou; popisku napevno má pět
            nejvyšších, ostatní se ukážou po najetí nebo tabulátorem.
          </>
        ) : (
          <>
            Chaty v panoramatu <b>zatím nejsou</b> — oblast nemá zveřejněné profily, a domýšlet
            jejich polohu do obrázku by tvrdilo víc, než víme. Popisky vrcholů jsou z dat.
          </>
        )}
        {zdrojVyskopisu ? ` Výškopis: ${zdrojVyskopisu}.` : ''}
        {zdrojVrcholu ? ` Vrcholy: ${zdrojVrcholu}.` : ''}
      </p>
    </div>
  )
}

export default RezHrebenem
