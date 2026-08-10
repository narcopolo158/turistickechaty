'use client'

import React, { useRef, useState } from 'react'

/**
 * Varianty otisku jednoho razítka na profilu chaty (zadání Michala 28. 7. 2026:
 * „škoda ukazovat jen jednu verzi razítka, když jich máme víc").
 *
 * Proč zrovna takhle: sběratel nemá jednu verzi, má LIST — několik otisků téhož
 * místa z různých let, natlačených přes sebe na jedné stránce deníku. Profil je
 * zápisník, takže varianty leží jako otisky na papíře: mírně pootočené, tiskovým
 * `multiply` do papíru (ne nalepené obrázky), přesah přes sebe jako v deníku.
 * Vybraná varianta se „vytáhne" nahoru a dostane velký otisk v paspartě.
 *
 * Natočení je DETERMINISTICKÉ (odvozené z pořadí, ne z náhody) — jinak by se
 * server a klient rozešly při hydrataci a listem by při každém renderu cuklo.
 *
 * Poctivost: pod velkým otiskem stojí jen doložená pole varianty (období
 * užívání, stav, kdo doložil, odkud je otisk převzatý). Co v datech není,
 * se nedopisuje — proto ty podmínky, ne šablona s pomlčkami.
 *
 * Přístupnost: list je `radiogroup`, varianty `radio` — šipkami se přepíná,
 * Home/End skáče na kraje, změnu ohlásí `aria-live` popiskou. Při
 * `prefers-reduced-motion` se otisk nepřitiskne, jen vymění.
 */

export type VariantaOtisku = {
  id: string
  poradi: number
  nazev: string
  otiskUrl: string | null
  otiskAlt: string | null
  historicke: boolean
  stav: string
  obdobi: string | null
  dolozil: string | null
  zdroj: string | null
  zdrojUrl: string | null
}

/** Pootočení otisku ve vějíři: −6° … +6°, ale vždy stejné pro tentýž index. */
const natoceni = (i: number, celkem: number): number => {
  if (celkem < 2) return 0
  const stred = (celkem - 1) / 2
  return Math.round(((i - stred) / stred) * 60) / 10
}

/** Posun po mělkém oblouku — kraje vějíře klesají, střed je nejvýš (0…4 px). */
const oblouk = (i: number, celkem: number): number => {
  if (celkem < 3) return 0
  const stred = (celkem - 1) / 2
  return Math.round(Math.abs(i - stred) / stred * 40) / 10
}

export default function RazitkaVarianty({
  varianty,
  vybranaId,
  onVyber,
  reduced = false,
}: {
  varianty: VariantaOtisku[]
  vybranaId: string
  onVyber: (id: string) => void
  reduced?: boolean
}) {
  const listRef = useRef<HTMLDivElement>(null)
  // Název otisku pod kurzorem (nebo pod fokusem) — ať se dá vějíř přečíst
  // bez klikání. Bez najetí drží řádek nápovědu, jak se přepíná.
  const [nahled, setNahled] = useState<string | null>(null)
  if (varianty.length < 2) return null

  const index = Math.max(0, varianty.findIndex((v) => v.id === vybranaId))

  const posun = (delta: number) => {
    const dalsi = varianty[(index + delta + varianty.length) % varianty.length]
    onVyber(dalsi.id)
    // Fokus putuje s výběrem — jinak by šipka přepnula otisk, ale čtečka
    // by dál ohlašovala starý prvek.
    listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${dalsi.id}"]`)?.focus()
  }

  const klavesa = (e: React.KeyboardEvent) => {
    const skok: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (e.key in skok) {
      e.preventDefault()
      posun(skok[e.key])
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const cil = e.key === 'Home' ? varianty[0] : varianty[varianty.length - 1]
      onVyber(cil.id)
      listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${cil.id}"]`)?.focus()
    }
  }

  return (
    <div className="zap-listovnik">
      <div
        className={`zap-list${reduced ? ' bez-pohybu' : ''}`}
        ref={listRef}
        role="radiogroup"
        aria-label={`Varianty otisku — ${varianty.length}`}
        onKeyDown={klavesa}
      >
        {varianty.map((v, i) => {
          const vybrana = v.id === vybranaId
          return (
            <button
              key={v.id}
              type="button"
              data-id={v.id}
              role="radio"
              aria-checked={vybrana}
              tabIndex={vybrana ? 0 : -1}
              className={`zap-list-otisk${vybrana ? ' je-vybrana' : ''}${v.historicke ? ' je-historicka' : ''}`}
              style={
                {
                  '--rot': `${natoceni(i, varianty.length)}deg`,
                  '--dy': `${oblouk(i, varianty.length)}px`,
                } as React.CSSProperties
              }
              onClick={() => onVyber(v.id)}
              onMouseEnter={() => setNahled(v.nazev)}
              onMouseLeave={() => setNahled(null)}
              onFocus={() => setNahled(v.nazev)}
              onBlur={() => setNahled(null)}
            >
              {v.otiskUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.otiskUrl} alt="" aria-hidden="true" loading="lazy" />
              ) : (
                <span className="bez-otisku" aria-hidden="true">
                  ?
                </span>
              )}
              <span className="cislo" aria-hidden="true">
                {v.poradi}
              </span>
              <span className="sr">{v.nazev}</span>
            </button>
          )
        })}
      </div>
      <div className={`zap-list-napoveda${nahled ? ' je-nahled' : ''}`}>{nahled ?? 'klikni na otisk nebo přepínej šipkami'}</div>
    </div>
  )
}

/** Velký otisk vybrané varianty v paspartě + její doložené údaje. */
export function VybranyOtisk({
  varianta,
  celkem,
  nazevChaty,
  reduced = false,
}: {
  varianta: VariantaOtisku
  celkem: number
  nazevChaty: string
  reduced?: boolean
}) {
  const radky = [
    celkem > 1 ? `varianta ${varianta.poradi} z ${celkem}` : null,
    varianta.obdobi,
    varianta.dolozil ? `doložil ${varianta.dolozil}` : null,
  ].filter(Boolean) as string[]

  return (
    <div className="zap-otisk-pasparta">
      {/* Přitisknutí: `key` = id varianty, takže výměnou otisku se element
          přemontuje a CSS animace se přehraje znovu — bez stavu v efektu. */}
      <div className={`zap-otisk-plocha${reduced ? '' : ' tiskne'}`}>
        {varianta.otiskUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={varianta.id} src={varianta.otiskUrl} alt={varianta.otiskAlt ?? `Otisk razítka — ${nazevChaty}`} />
        ) : (
          <span className="zap-otisk-chybi">otisk téhle varianty zatím nemáme</span>
        )}
      </div>
      <div className="zap-otisk-udaje" aria-live="polite">
        <span className={`dot${varianta.historicke ? ' hist' : ''}`} aria-hidden="true">
          ●
        </span>{' '}
        {varianta.stav}
        {radky.length > 0 && <span className="det"> · {radky.join(' · ')}</span>}
      </div>
      <OtiskZdroj varianta={varianta} />
    </div>
  )
}

/**
 * Odkaz na web, ze kterého je otisk převzatý (DATA-05).
 *
 * NENÍ to zdvořilost, ale PODMÍNKA SVOLENÍ: Jan Novotný (turistickarazitka.cz)
 * svolil 20. 7. 2026 s tím, že u každého převzatého razítka bude odkaz na jeho
 * web. Robert Šindler (razitkuj.cz) svolil 21. 7. 2026 bez výslovné podmínky —
 * odkaz uvádíme stejně, protože partnerství stojí na tom, že je vidět, čí ta
 * práce je. Kolekce `Razitka` totéž hlídá i z druhé strany: převzaté razítko
 * bez `prevzeti.zdrojUrl` nejde publikovat.
 *
 * `nofollow` proto, že jde o povinnou atribuci, ne o redakční doporučení;
 * `noopener` je bezpečnostní hygiena u `target="_blank"`.
 */
export function OtiskZdroj({ varianta }: { varianta: VariantaOtisku }) {
  if (!varianta.zdrojUrl) return null
  return (
    <div className="zap-otisk-zdroj">
      otisk převzat se svolením —{' '}
      <a href={varianta.zdrojUrl} target="_blank" rel="noopener noreferrer nofollow">
        {varianta.zdroj ?? 'zdroj otisku'}
      </a>
    </div>
  )
}
