import Link from 'next/link'

import type { LanovkyOblasti } from '@/lib/lanovky'

/**
 * Výpis lanovek oblasti (DATA-32) — „odkud se dá vyjet nahoru".
 *
 * Řazení dělá skript: nejdřív dráhy, které někam k chatě vyvezou, pak podle
 * délky. Tabulka drží jazyk ostatních tabulek profilu (řádky s tenkou linkou,
 * mikropoznámka pod tabulkou), ne vlastní vzhled.
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

export function LanovkySeznam({ data }: { data: LanovkyOblasti | null }) {
  if (!data || !data.lanovky.length) return null

  return (
    <div className="lanovky">
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
