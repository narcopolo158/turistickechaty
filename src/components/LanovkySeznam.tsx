import Link from 'next/link'

import LanovkyScena from './LanovkyScena'

import { slugLanovky } from '@/lib/lanovky'
import type { Lanovka, LanovkyOblasti } from '@/lib/lanovky'

/**
 * Výpis lanovek oblasti (DATA-32) — „odkud se dá vyjet nahoru".
 *
 * Řazení dělá skript: nejdřív dráhy, které někam k chatě vyvezou, pak podle
 * délky. Tabulka drží jazyk ostatních tabulek profilu (řádky s tenkou linkou,
 * mikropoznámka pod tabulkou), ne vlastní vzhled.
 *
 * Nad tabulkou stojí od 29. 7. 2026 tři zvýrazněné karty a animované pozadí
 * (handoff F1, sekce 06 — „grafický prvek, ne panel"). Návrh v kartách jmenuje
 * konkrétní trojici (Sněžka, Černá hora, Medvědín) a uvádí u nich dobu jízdy;
 * ani jedno převzít nemůžeme, a proto:
 *
 *   — **trojici vybírá pravidlo, ne vkus**: dráhy, které vyvezou nejvýš
 *     a nahoře u nich stojí chata průvodce. Úseky téže dráhy se počítají
 *     jednou — jinak by v kartách stála Sněžka dvakrát, protože lanovka na ni
 *     má dva úseky s přestupem na Růžové hoře. Pravidlo je napsané i v UI, ať
 *     čtenář ví, proč vidí zrovna tyhle tři.
 *   — **doba jízdy v kartách není**: doloženou ji nemáme a dopočítat ji
 *     z délky dráhy by znamenalo vydávat vlastní výpočet za údaj provozovatele.
 *
 * POCTIVOST, kterou tahle komponenta MUSÍ držet:
 * — vleky v přehledu nejsou a je to napsané, ne zamlčené (jinak by čtenář četl
 *   41 drah jako „všechny lanovky v Krkonoších", což by nesedělo s tím, co
 *   uvidí v terénu);
 * — převýšení je z výškového modelu, ne z měření → značka „≈" a poznámka;
 * — vzdálenost k chatě je vzdušná čára, ne délka cesty;
 * — provozní doba ani ceny tu NEJSOU: mění se každou sezónu a doložené je
 *   nemáme. Radši chybějící údaj než údaj, kterému nejde věřit.
 */

const format = (n: number): string => n.toLocaleString('cs-CZ').replace(/ /gu, ' ')

/** Vzdušná vzdálenost dvou bodů v metrech (na těchhle délkách stačí rovina). */
const vzdalenostM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const stred = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const dx = (a.lng - b.lng) * Math.cos(stred) * 111_320
  const dy = (a.lat - b.lat) * 110_540
  return Math.hypot(dx, dy)
}

/** Dva body téže stanice — hranice odpovídá rozptylu koncových bodů v OSM. */
const TATAZ_STANICE_M = 250

/**
 * Tři dráhy do karet: vyvezou nejvýš a nahoře u nich stojí chata průvodce.
 * Úsek, jehož horní stanice je zároveň dolní stanicí (nebo vrcholem) některé
 * už vybrané dráhy, se přeskočí — je to totéž stoupání, jen na etapy.
 */
export const vyberKarty = (lanovky: Lanovka[], kolik = 3): Lanovka[] => {
  const vybrane: Lanovka[] = []
  const kandidati = lanovky
    .filter((x) => x.uHorniStanice.length && x.horni.vyska != null)
    .sort((a, b) => b.horni.vyska! - a.horni.vyska!)
  for (const l of kandidati) {
    const navazuje = vybrane.some(
      (v) =>
        vzdalenostM(l.horni, v.dolni) < TATAZ_STANICE_M ||
        vzdalenostM(l.horni, v.horni) < TATAZ_STANICE_M,
    )
    if (navazuje) continue
    vybrane.push(l)
    if (vybrane.length === kolik) break
  }
  return vybrane
}

const AKCENTY = ['cerv', 'jantar', 'alpska'] as const

/** Barva útržku podle druhu dráhy — kabinky červeně, sedačky modře. */
const TRIDA_TYPU: Record<string, string> = {
  gondola: 'kabina',
  chair_lift: 'sedacka',
  mixed_lift: 'kombi',
}

export function LanovkySeznam({ data }: { data: LanovkyOblasti | null }) {
  if (!data || !data.lanovky.length) return null
  const karty = vyberKarty(data.lanovky)
  const vKartach = new Set(karty.map((l) => l.id))
  // Útržky nesou zbytek — nejdřív ty, které vyvezou k chatě, pak podle délky
  // (totéž pořadí, v jakém dráhy chodí z pipeline).
  const jizdenky = data.lanovky.filter((l) => !vKartach.has(l.id))
  // URL mini-stránky lanovky — slug se počítá stejně jako v `lanovkySeSlugy`,
  // včetně přípony u kolize názvů, jinak by odkaz vedl na cizí dráhu.
  const pouzite = new Map<string, number>()
  const urlLanovky = new Map<string, string>()
  for (const l of data.lanovky) {
    const zaklad = slugLanovky(l.nazev, l.id)
    const kolikrat = (pouzite.get(zaklad) ?? 0) + 1
    pouzite.set(zaklad, kolikrat)
    urlLanovky.set(l.id, `/cesko/${data.oblast}/lanovka/${kolikrat === 1 ? zaklad : `${zaklad}-${kolikrat}`}`)
  }

  return (
    <div className="lanovky">
      {karty.length > 0 && (
        <div className="lan-blok">
          <LanovkyScena />
          <div className="lan-karty">
            {karty.map((l, i) => (
              <article key={l.id} className={`lan-karta lan-karta--${AKCENTY[i] ?? 'cerv'}`}>
                <span className="lan-pill">vyveze do {format(l.horni.vyska!)} m</span>
                <h3>
                  <Link href={urlLanovky.get(l.id)!}>{l.nazev ?? 'bez názvu v mapových datech'}</Link>
                </h3>
                <dl className="lan-udaje">
                  <div>
                    <dt>Trasa</dt>
                    <dd>
                      {l.dolni.vyska != null
                        ? `${format(l.dolni.vyska)} → ${format(l.horni.vyska!)} m`
                        : `nahoru do ${format(l.horni.vyska!)} m`}
                      {l.useku > 1 && <span className="lanovky-tise"> · {l.useku} úseky</span>}
                    </dd>
                  </div>
                  <div>
                    <dt>Převýšení</dt>
                    <dd>{l.prevyseniM != null ? `≈ ${format(l.prevyseniM)} m` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Typ</dt>
                    <dd>{l.typNazev}</dd>
                  </div>
                </dl>
                <p className="lan-chaty">
                  Nahoře:{' '}
                  {l.uHorniStanice.map((ch, j) => (
                    <span key={ch.slug}>
                      {j > 0 && ', '}
                      <Link href={`/cesko/${data.oblast}/${ch.slug}`}>{ch.nazev}</Link>
                    </span>
                  ))}
                </p>
              </article>
            ))}
          </div>
          <p className="lan-pravidlo">
            Vybráno pravidlem, ne redakčním vkusem: <b>dráhy, které vyvezou nejvýš a nahoře u nich
            stojí chata průvodce</b>; úseky téže dráhy se počítají jednou. Doba jízdy v kartách
            chybí schválně — doloženou ji nemáme a z délky dráhy se nedopočítává.
          </p>
        </div>
      )}

      {/* Jízdenkové karty (handoff F1 v2, zadání Michala 29. 7.: „jízdenkové
          karty lanovek chci"). Nesou dráhy, které nejsou v kartách výše —
          každá jako útržek jízdenky s perforací a punčem. Údaje jsou tytéž
          jako v tabulce, jen v čitelnějším tvaru; tabulka zůstává pod nimi
          rozbalovací, protože nese navíc délku, převýšení a vzdálenost
          k chatě, a ty by karty jen zahltily. */}
      {jizdenky.length > 0 && (
        <div className="lan-jizdenky">
          <h3 className="lan-jizdenky-nadpis">Další lanovky v oblasti</h3>
          <div className="lan-jizdenky-mrizka">
            {jizdenky.map((l) => (
              <article key={l.id} className={`jzd jzd--${TRIDA_TYPU[l.typ] ?? 'jina'}`}>
                <div className="jzd-pas" aria-hidden="true">
                  {/* Kresba se NEnatahuje (`meet`): natažená sedačka vypadala
                      jako kbelík. Vůz visí u horní hrany, zbytek pásu je volný
                      jako na útržku jízdenky. */}
                  <svg viewBox="0 0 34 46" preserveAspectRatio="xMidYMin meet">
                    <path className="jzd-lano" d="M0,9 L34,5" />
                    <g className="jzd-vuz">
                      {l.typ === 'chair_lift' ? (
                        <>
                          <path className="jzd-tah" d="M17,7 L17,20 M13,20 L25,20" />
                          <path className="jzd-tah" d="M25,20 L25,11 M15,20 L14,27 M23,20 L22,27" />
                          <path className="jzd-telo" d="M13,20 L25,20 L25,24 L15,24 Z" />
                        </>
                      ) : (
                        <>
                          <path className="jzd-tah" d="M17,6 L17,15" />
                          <rect className="jzd-telo" x="9" y="15" width="16" height="14" rx="4" />
                          <rect className="jzd-okno" x="12" y="18" width="10" height="5" rx="1.5" />
                        </>
                      )}
                    </g>
                  </svg>
                </div>
                <span className="jzd-punc" aria-hidden="true" />
                <div className="jzd-telo-karty">
                  <b>
                    <Link href={urlLanovky.get(l.id)!}>
                      {l.nazev ?? 'bez názvu v mapových datech'}
                    </Link>
                  </b>
                  {l.dolni.vyska != null && l.horni.vyska != null && (
                    <span className="jzd-trasa">
                      {format(l.dolni.vyska)} → {format(l.horni.vyska)} m
                    </span>
                  )}
                  {l.uHorniStanice.length > 0 && (
                    <span className="jzd-chaty">
                      nahoře:{' '}
                      {l.uHorniStanice.slice(0, 2).map((ch, i) => (
                        <span key={ch.slug}>
                          {i > 0 && ', '}
                          <Link href={`/cesko/${data.oblast}/${ch.slug}`}>{ch.nazev}</Link>
                        </span>
                      ))}
                      {l.uHorniStanice.length > 2 && ` +${l.uHorniStanice.length - 2}`}
                    </span>
                  )}
                  <span className="jzd-pill">{l.typNazev}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="lan-pravidlo">
            Jízdní řády ani ceny na kartách nejsou schválně — mění se každou sezónu a doložené je
            nemáme. Kompletní údaje (délka, převýšení, vzdálenost k chatě) drží tabulka níž.
          </p>
        </div>
      )}

      <details className="lanovky-tabulka">
        <summary>Celý přehled tabulkou — {data.lanovky.length} drah s délkou a převýšením</summary>
      <table className="lanovky-tab">
        <thead>
          <tr>
            <th scope="col">Lanovka</th>
            <th scope="col">Typ</th>
            <th scope="col">Délka</th>
            <th scope="col">Převýšení</th>
            <th scope="col">Vyveze k</th>
          </tr>
        </thead>
        <tbody>
          {data.lanovky.map((l) => (
            <tr key={l.id}>
              <th scope="row">
                {l.nazev ?? <span className="lanovky-tise">bez názvu v mapových datech</span>}
                {l.horni.vyska != null && l.dolni.vyska != null && (
                  <span className="lanovky-stanice">
                    {format(l.dolni.vyska)} → {format(l.horni.vyska)} m
                  </span>
                )}
              </th>
              <td>{l.typNazev}</td>
              <td>{format(l.delkaM)} m</td>
              <td>{l.prevyseniM != null ? `≈ ${format(l.prevyseniM)} m` : '—'}</td>
              <td>
                {l.uHorniStanice.length ? (
                  <span className="lanovky-chaty">
                    {l.uHorniStanice.map((ch, i) => (
                      <span key={ch.slug}>
                        {i > 0 && ', '}
                        <Link href={`/cesko/krkonose/${ch.slug}`}>{ch.nazev}</Link>{' '}
                        <span className="lanovky-tise">({format(ch.vzdalenostM)} m)</span>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="lanovky-tise">žádná chata průvodce do 1,5 km</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </details>

      <p className="lanovky-pozn">
        Přehled vede jen dráhy, které vyvezou pěšího — kabinkové, kombinované a sedačkové.{' '}
        <b>Vleky a dětské pásy v něm nejsou</b> ({format(data.vleku)} jich mají tatáž mapová data).
        Délka je půdorysná z geometrie tras, převýšení <b>odhad z výškového modelu</b> zaokrouhlený
        na desítky metrů, vzdálenost k chatě vzdušná čára. Provozní dobu ani ceny neuvádíme —
        doložené je nemáme a mění se každou sezónu; ověřte je u provozovatele.
      </p>
      <p className="lanovky-zdroj">
        Zdroj: {data.zdroj}
        {data.stavOsm && ` · stav dat ${data.stavOsm}`}
        {data.zdrojVysek && ` · výšky: ${data.zdrojVysek}`}
      </p>
    </div>
  )
}

export default LanovkySeznam
