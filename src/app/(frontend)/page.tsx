import Link from 'next/link'
import React from 'react'

import MapaChat from '@/components/MapaChat'
import TiskButton from '@/components/TiskButton'
import { SectionBar } from '@/components/ui'
import { getChatyProMapu, getIndexChat } from '@/lib/chaty'
import {
  feedNaposledyOvereno,
  kalendariumVeta,
  kalendariumVyber,
  pocetNoveOverenychZa,
  posledniOvereniFondu,
} from '@/lib/index-chat'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'
import { zanikleChaty } from '@/lib/zanikle'

// Denní rotace kalendária a čerstvé countery: stránka se přegeneruje
// nejpozději po hodině (jinak s každým deployem).
export const revalidate = 3600

/**
 * Homepage — mezistav F1c: hero z F0-02 doplněný o poctivé countery
 * s mikroblokem, kalendárium pás (build-time výběr z milníků, žádné falešné
 * „přesně dnes"), sekci „Z průvodce" (Naposledy ověřeno · Atlas zaniklých ·
 * Razítka a známky) a printový čistý seznam chat (B13). Hero koláž
 * „sběratelský stůl", poster band a pohoří grid přijdou dalším průchodem
 * F1c (handoff design/handoff-f1/).
 * Všechna čísla POČÍTANÁ z dat — nikde žádné ručně psané.
 */
export default async function HomePage() {
  const [chatyProMapu, { index, kalendarium }] = await Promise.all([getChatyProMapu(), getIndexChat()])

  const dnes = new Date().toISOString().slice(0, 10)
  const sRazitkem = index.filter((ch) => ch.razitko).length
  const seZnamkou = index.filter((ch) => ch.znamka).length
  const zanikle = zanikleChaty()
  const posledniOvereni = posledniOvereniFondu(index)
  const nedavno = pocetNoveOverenychZa(index, dnes, 14)
  const vyroci = kalendariumVyber(kalendarium, dnes)
  const overenoFeed = feedNaposledyOvereno(index, 3)

  return (
    <>
      <div className="hf1-jen-obrazovka">
        <section className="wrap hero">
          <div className="kick mn">
            <i aria-hidden="true" />
            Průvodce horskými chatami · Česko a Slovensko
          </div>
          <h1>
            Každá bouda, <span style={{ color: 'var(--red)' }}>útulna</span> i bivak.
            <br />S horami, příběhem a <span style={{ color: 'var(--blue)' }}>razítkem</span>.
          </h1>
          <p>
            Připravujeme profily chat s ověřenými otvíračkami a trasami, historii s dobovými
            pohlednicemi a sbírku razítek jako za mlada. Začínáme Krkonošemi.
          </p>

          <div className="hf1-countery">
            <div>
              <b>{index.length}</b> <span>profilů chat</span>
            </div>
            <div>
              <b>{sRazitkem}</b> <span>s razítkem</span>
            </div>
            {zanikle.length > 0 && (
              <div>
                <b>{zanikle.length}</b> <span>zaniklých v Atlasu</span>
              </div>
            )}
            {posledniOvereni && (
              <div className="hf1-overeno">
                naposledy ověřeno <b>{formatCheckedDatum(posledniOvereni)}</b>
              </div>
            )}
          </div>
          <div className="hf1-pozn">jen čísla doložená v databázi — žádná vymyšlená</div>
          <div className="hf1-mikroblok">
            {nedavno > 0 && (
              <span className="hf1-chip-nedavno">
                <i aria-hidden="true" />
                {nedavno}× nově ověřeno za 14 dní
              </span>
            )}
            <TiskButton className="hf1-chip-tisk">Tisk seznamu ▸</TiskButton>
          </div>
        </section>

        {vyroci && (
          <section className="wrap" aria-label="Kalendárium">
            <div className="hf1-kalendarium">
              <span className="hf1-label">Kalendárium</span>
              <span className="hf1-kosoctverec" aria-hidden="true" />
              <span className="hf1-vyroci">{kalendariumVeta(vyroci, dnes)}</span>
              {vyroci.chataUrl && <Link href={vyroci.chataUrl}>číst na profilu ▸</Link>}
              <span className="hf1-mikropozn">z milníků historie · střídá se denně</span>
            </div>
          </section>
        )}

        <MapaChat chaty={chatyProMapu} />

        <section className="wrap sec" aria-label="Z průvodce">
          <SectionBar num="04" title="Z průvodce" variant="red" />
          <div className="hf1-zpruvodce">
            <div className="hf1-panel">
              <div className="hf1-panel-hlava">
                <b>Naposledy ověřeno</b>
                <span className="hf1-tag">živý důkaz</span>
              </div>
              <div className="hf1-panel-seznam">
                {overenoFeed.map((ch) =>
                  ch.url ? (
                    <Link key={ch.slug} href={ch.url} className="hf1-panel-radek">
                      <span>{ch.nazev}</span>
                      <span className="hf1-datum-overeni">
                        <i aria-hidden="true" />
                        {formatCheckedDatum(ch.checked)}
                      </span>
                    </Link>
                  ) : null,
                )}
              </div>
              <div className="hf1-pozn">řadí se podle „checked“ v databázi</div>
            </div>

            <div className="hf1-panel tmavy">
              <span className="hf1-kruh" aria-hidden="true" />
              <div className="hf1-panel-hlava">
                <b>Z Atlasu zaniklých</b>
                <span className="hf1-tag">{zanikle.length} příběhů</span>
              </div>
              <p>
                Boudy a schroniska, které už nestojí — rok a příčina zániku, co je na místě dnes.
                Samostatná kategorie: do živého katalogu se nemíchá.
              </p>
              <div style={{ flex: 1 }} />
              <Link href="/zanikle" className="hf1-panel-cta">
                Otevřít Atlas ▸
              </Link>
            </div>

            <div className="hf1-panel">
              <div className="hf1-panel-hlava">
                <b>Razítka a známky</b>
                <span className="hf1-tag" style={{ color: 'var(--label)' }}>
                  sbírka
                </span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', margin: '8px 0 0' }}>
                {sRazitkem} chat s doloženým razítkem a {seZnamkou} se známkovým místem. Otisky
                sbíráš na profilech, deník zůstává ve tvém prohlížeči.
              </p>
              <div style={{ flex: 1 }} />
              <Link href="/razitkovnik" className="hf1-panel-cta">
                Otevřít razítkovník ▸
              </Link>
            </div>
          </div>
        </section>
        <div style={{ paddingBottom: 30 }} />
      </div>

      {/* Print (B13): homepage tiskne čistý černobílý seznam všech chat. */}
      <div className="hf1-print" aria-hidden="true">
        <h2>turistickechaty.cz — seznam chat</h2>
        <p className="hf1-print-pozn">
          {index.length} vedených profilů · stav k {formatCheckedDatum(dnes)} · jen doložené údaje
          (— = nedoloženo)
        </p>
        <table>
          <thead>
            <tr>
              <th>Chata</th>
              <th>Pohoří</th>
              <th>Výška</th>
              <th>Stav</th>
              <th>Ověřeno</th>
              <th>Razítko</th>
            </tr>
          </thead>
          <tbody>
            {index.map((ch) => (
              <tr key={ch.slug}>
                <td>{ch.nazev}</td>
                <td>{ch.oblastNazev ?? '—'}</td>
                <td>{formatVyskaM(ch.vyska)}</td>
                <td>{ch.stav === 'v-provozu' ? 'v provozu' : ch.stav === 'mimo-provoz' ? 'mimo provoz' : ch.stav === 'zanikla' ? 'zaniklá' : '—'}</td>
                <td>{formatCheckedDatum(ch.checked)}</td>
                <td>{ch.razitko ? '●' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
