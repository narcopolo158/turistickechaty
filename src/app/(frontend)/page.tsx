import Link from 'next/link'
import React from 'react'

import HeroKolaz from '@/components/HeroKolaz'
import HledaniChat from '@/components/HledaniChat'
import MapaChat from '@/components/MapaChat'
import NamatkouPas from '@/components/NamatkouPas'
import TiltDiv from '@/components/TiltDiv'
import TiskButton from '@/components/TiskButton'
import { SectionBar } from '@/components/ui'
import { getChatyProMapu, getIndexChat } from '@/lib/chaty'
import {
  denVRoce,
  feedNaposledyOvereno,
  kalendariumVeta,
  kalendariumVyber,
  pocetNoveOverenychZa,
  posledniOvereniFondu,
} from '@/lib/index-chat'
import { formatCheckedDatum, formatVyskaM } from '@/lib/katalog'
import { zanikleChaty } from '@/lib/zanikle'

// Denní rotace kalendária/namátkou a čerstvé countery: stránka se
// přegeneruje nejpozději po hodině (jinak s každým deployem).
export const revalidate = 3600

/**
 * Homepage dle handoffu F1 (design/handoff-f1/F1-Homepage.dc.html +
 * screenshots 01–05): hero „sběratelský stůl" (koláž faux-3D artefaktů
 * z DOLOŽENÝCH dat — hero fotka a reálný otisk Luční, známka č. 11),
 * dřevěné rozcestníkové CTA, poctivé countery s mikroblokem, kalendárium,
 * turistická mapa chat, pohoří grid, „Namátkou z průvodce" (seedovaný
 * Fisher–Yates), kurátorské pásy Z průvodce, manifest a printový
 * seznam (B13).
 *
 * Vědomé odchylky od prototypu (deník 28. 7. 2026): sekce 03 Pohlednice
 * vynechána (funkce Fáze 2 — mrtvá CTA neděláme, sekce přečíslovány);
 * RSS/Newsletter chipy a Konami sníh vynechány (backend/nízká priorita);
 * eyebrow říká „Krkonoše" (fond nese CZ i PL profily, „Česko" z prototypu
 * by lhalo). Malovaný poster band z návrhu NAHRAZEN skutečnou turistickou
 * mapou chat (rozhodnutí Michala 28. 7. 2026: 3D patří na stránku pohoří,
 * homepage nese reálnou mapu — dlaždice Mapy.com outdoor s markery).
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
  const overenoFeed = feedNaposledyOvereno(index, 4)

  // Artefakty koláže z doložených dat: hero fotka + reálný otisk Luční boudy.
  const lucni = index.find((ch) => ch.slug === 'lucni-bouda') ?? null
  const polaroid = lucni?.heroUrl
    ? {
        url: lucni.heroUrl,
        popisek: 'Luční bouda, 1 410 m',
        atribuce: 'foto: Stanislav Dusík · CC BY-SA · Wikimedia Commons',
      }
    : null
  const otiskLucni = lucni?.otiskUrl ? { url: lucni.otiskUrl, alt: lucni.otiskAlt ?? 'otisk razítka Luční boudy' } : null

  const pripravujeme = [
    { n: 'Jizerské hory', note: 'připravujeme — sbíráme kandidáty' },
    { n: 'Český ráj', note: 'připravujeme — sbíráme kandidáty' },
    { n: 'Podkrkonoší', note: 'přesahová oblast — s vysvětlením' },
  ]

  return (
    <>
      {/* SVG filtry sdílené kolážovými artefakty a dřevěnými cedulemi */}
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="hf1-wood">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.11" numOctaves="4" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.17  0 0 0 0 0.06  0 0 0 0.5 0" />
          </filter>
        </defs>
      </svg>

      <div className="hf1-jen-obrazovka">
        <section className="wrap hf1-hero" aria-label="Úvod">
          <div className="hf1-hero-text">
            <div className="hf1-eyebrow">Průvodce horskými chatami · Krkonoše</div>
            <h1 className="hf1-claim">
              Chaty, kterým
              <br />
              můžeš věřit.
            </h1>
            <p className="hf1-perex">
              Každý údaj má zdroj a datum ověření. Razítka, známky, skládané mapy a příběhy bud — začínáme
              v Krkonoších.
            </p>

            <HledaniChat polozky={index.map((ch) => ({ nazev: ch.nazev, url: ch.url }))} />

            <div className="hf1-cedule">
              <TiltDiv zaklad="rotate(-1deg)" className="hf1-cedule-prkno velke">
                <Link href="/cesko/krkonose" className="hf1-cedule-obsah">
                  <span className="hf1-cedule-kresba" aria-hidden="true">
                    <svg width="100%" height="100%">
                      <rect width="100%" height="100%" filter="url(#hf1-wood)" />
                    </svg>
                  </span>
                  <span className="hf1-sroubek" aria-hidden="true" />
                  <span className="hf1-cedule-titul">PROZKOUMAT KRKONOŠE</span>
                  <span className="hf1-cedule-pozn">stránka pohoří · 3D mapa</span>
                </Link>
              </TiltDiv>
              <TiltDiv zaklad="rotate(.8deg)" className="hf1-cedule-prkno">
                <Link href="/chaty" className="hf1-cedule-obsah">
                  <span className="hf1-cedule-kresba" aria-hidden="true">
                    <svg width="100%" height="100%">
                      <rect width="100%" height="100%" filter="url(#hf1-wood)" />
                    </svg>
                  </span>
                  <span className="hf1-sroubek" aria-hidden="true" />
                  <span className="hf1-cedule-titul">KATALOG CHAT</span>
                  <span className="hf1-cedule-pozn">{index.length} profilů</span>
                </Link>
              </TiltDiv>
            </div>

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
          </div>

          <HeroKolaz polaroid={polaroid} otiskLucni={otiskLucni} />
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

        {/* Skutečná turistická mapa (dlaždice Mapy.com outdoor + markery
            všech chat) — na místě, kde měl návrh malovaný poster. */}
        <div id="mapa">
          <MapaChat chaty={chatyProMapu} />
        </div>

        <section className="wrap sec" aria-label="Pohoří">
          <div className="hf1-sekce-hlava">
            <span className="hf1-sekce-num">01</span>
            <span className="hf1-sekce-titul">Pohoří</span>
            <span className="hf1-sekce-cara" aria-hidden="true" />
            <span className="hf1-sekce-tag">pilot → expanze, poctivě</span>
          </div>
          <div className="hf1-pohori-grid">
            <TiltDiv className="hf1-pohori-ziva">
              <Link href="/cesko/krkonose" className="hf1-pohori-obsah">
                <span className="hf1-pohori-panorama" aria-hidden="true">
                  <svg viewBox="0 0 460 110" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                    <path d="M0,64 L74,34 L140,54 L214,22 L292,52 L360,28 L420,48 L460,36 L460,110 L0,110 Z" fill="#b7c7d4" />
                    <path d="M214,22 L242,38 L188,44 Z" fill="#f2f5f7" opacity=".9" />
                    <path d="M0,84 L90,62 L180,80 L280,56 L380,76 L460,60 L460,110 L0,110 Z" fill="#7d9469" />
                    <path d="M-5,74 C100,66 220,58 330,50 C380,46 430,44 465,40" fill="none" stroke="#fdfaf2" strokeWidth="3" opacity=".65" />
                  </svg>
                  <span className="hf1-pohori-zive-badge">ŽIVÉ</span>
                </span>
                <span className="hf1-pohori-telo">
                  <span className="hf1-pohori-nazev">Krkonoše</span>
                  <span className="hf1-pohori-cisla">
                    <span>
                      <b>{index.length}</b> chat
                    </span>
                    <span>
                      <b>{zanikle.length}</b> zaniklých
                    </span>
                    <span>
                      <b>{sRazitkem}</b> s razítkem
                    </span>
                  </span>
                  <span className="hf1-pohori-cta">Prozkoumat ▸</span>
                </span>
              </Link>
            </TiltDiv>
            {pripravujeme.map((p) => (
              <div key={p.n} className="hf1-pohori-pripravujeme">
                <span className="hf1-pohori-silueta" aria-hidden="true">
                  <span>silueta</span>
                </span>
                <span className="hf1-pohori-telo">
                  <span className="hf1-pohori-nazev tichy">{p.n}</span>
                  <span className="hf1-pohori-note">{p.note}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap sec" aria-label="Namátkou z průvodce">
          <NamatkouPas index={index} seed={denVRoce(dnes)} />
        </section>

        {/* Komunitní apel (rozhodnutí Michala 28. 7. 2026): počty POČÍTANÉ
            z dat — kolika chatám otisk/fotka opravdu chybí. */}
        <section className="wrap" aria-label="Pomoz průvodci">
          <div className="hf1-apel">
            <div className="hf1-apel-text">
              <b>Máš v deníku otisk, který nám chybí?</b>
              <p>
                {index.length - sRazitkem} chat vedeme bez doloženého razítka a{' '}
                {index.filter((ch) => ch.heroUrl == null).length} bez fotky. Pošli sken otisku nebo
                snímek z výletu — po redakční kontrole je zveřejníme s tvým jménem u snímku.
              </p>
            </div>
            <Link href="/prispet" className="hf1-apel-cta">
              Přispět otiskem či fotkou ▸
            </Link>
          </div>
        </section>

        <section className="wrap sec" aria-label="Z průvodce">
          <SectionBar num="03" title="Z průvodce" variant="red" />
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

        <section className="wrap" aria-label="Jak to děláme">
          <div className="hf1-manifest">
            <span className="hf1-label">Jak to děláme</span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Ověřujeme u zdroje
            </span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Rozpory přiznáváme
            </span>
            <span className="hf1-manifest-bod">
              <i aria-hidden="true" /> Nic nedomýšlíme
            </span>
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
