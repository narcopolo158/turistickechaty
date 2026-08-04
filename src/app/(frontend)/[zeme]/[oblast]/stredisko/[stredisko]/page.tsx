import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import React from 'react'

import MapaChat, { type MapovaChata } from '@/components/MapaChat'
import { SectionBar, TrailBlaze } from '@/components/ui'
import { kreditFotky, nazevZdroje } from '@/lib/atribuce'
import {
  getIndexChat,
  getOblastBySlug,
  getSlugyOblasti,
  getStrediskaOblasti,
  strediskoPath,
  ZEME_NAZEV,
  ZEME_SLUG,
} from '@/lib/chaty'
import { fotkaStrediska } from '@/lib/fotky-stredisek'
import { redakcniFotkyStredisek } from '@/lib/fotky-redakcni'
import { bodyKatalogu, jakSeSemDostat } from '@/lib/jak-se-sem-dostat'
import { jsonLdStrediska } from '@/lib/jsonld-stredisko'
import { formatVyskaM, popisPuvoduVysky } from '@/lib/katalog'
import { lanovkySeSlugy } from '@/lib/lanovky'
import { cileOdtud, dalsiList, sousedniVychodiste } from '@/lib/odtud-dal'
import { pristupyStrediska, zdrojPristupu, type Usek } from '@/lib/pristupy'

import '../../../../pohori.css'
import '../../../../mini.css'

export const revalidate = 3600

/**
 * Mini-stránka střediska (F1e — zadání Michala 29. 7. 2026: „udělej
 * mini-stránky středisek").
 *
 * Proč vůbec vzniká: karta střediska na stránce pohoří je PŘEHLED a zkracuje
 * dlouhé věty na tři řádky. Doložené znění (perex, věta o lanovce i s prameny)
 * ale nikam zmizet nesmí — vypisuje se tady, celé.
 *
 * Co stránka umí navíc oproti kartě: seznam chat dostupných odtud s délkou
 * túry a PÁSOVÝMI ZNAČKAMI úseků (DATA-06), mapu těch chat a odkazy na
 * lanovky, které z místa vyjíždějí.
 *
 * POCTIVOST: všechno je z dat. Kde nemáme spočítané přístupy, stojí pomlčka
 * a věta proč — ne nula. Délka je půdorysná z geometrie tras, ne měřená
 * kolečkem, a značky pocházejí z OSM; obojí je napsané v patičce.
 */

type Params = { zeme: string; oblast: string; stredisko: string }

export async function generateStaticParams() {
  const slugy = await getSlugyOblasti()
  const out: { zeme: string; oblast: string; stredisko: string }[] = []
  for (const oblast of slugy) {
    for (const s of await getStrediskaOblasti(oblast)) {
      // Země v adrese je země OBJEKTU (rozhodnutí 1. 8. 2026) — Karpacz má
      // /polsko/…, stejně jako polská schroniska. Bez doložené země není
      // kanonická cesta, a tedy ani mini-stránka.
      const cesta = strediskoPath(s, oblast)
      if (cesta && s.slug) out.push({ zeme: cesta.split('/')[1], oblast, stredisko: s.slug })
    }
  }
  return out
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { oblast: oblastSlug, stredisko: slug } = await params
  const s = (await getStrediskaOblasti(oblastSlug)).find((x) => x.slug === slug)
  if (!s) return {}
  return {
    title: `${s.nazev} — východisko túr | turistickechaty.cz`,
    description:
      s.perex ??
      `Chaty dostupné z místa ${s.nazev}, přístupové trasy se značením a lanovky v okolí.`,
    alternates: { canonical: strediskoPath(s, oblastSlug) ?? undefined },
  }
}

/** Barvy značek z dat DATA-06 → komponenta pásové značky. */
const ZNACKY = ['cervena', 'modra', 'zelena', 'zluta', 'cerna'] as const
type Znacka = (typeof ZNACKY)[number]
const jeZnacka = (z: string | null): z is Znacka => !!z && (ZNACKY as readonly string[]).includes(z)

/** Značky v pořadí, v jakém se na trase střídají — opakování se slučuje. */
const znackyTrasy = (useky: Usek[]): Znacka[] => {
  const out: Znacka[] = []
  for (const u of useky) {
    if (!jeZnacka(u.znaceni)) continue
    if (out[out.length - 1] === u.znaceni) continue
    out.push(u.znaceni)
  }
  return out
}

const formatKm = (km: number | null): string =>
  km == null ? '—' : `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km`

export default async function StrediskoPage({ params }: { params: Promise<Params> }) {
  const { zeme, oblast: oblastSlug, stredisko: slug } = await params
  if (!Object.values(ZEME_SLUG).includes(zeme)) notFound()

  const [oblast, strediska, { index }] = await Promise.all([
    getOblastBySlug(oblastSlug),
    getStrediskaOblasti(oblastSlug),
    getIndexChat(),
  ])
  const s = strediska.find((x) => x.slug === slug)
  if (!oblast || !s) notFound()

  // Kanonická cesta nese zemi OBJEKTU (jako u chat). Stará adresa pod
  // /cesko/… u polských středisek nezmizí do 404 — přesměruje se natrvalo,
  // aby odkazy z indexů vyhledávačů i cizích webů dál fungovaly.
  const cesta = strediskoPath(s, oblastSlug)
  if (!cesta) notFound()
  if (`/${zeme}/${oblastSlug}/stredisko/${slug}` !== cesta) permanentRedirect(cesta)

  const foto = (await redakcniFotkyStredisek()).get(String(s.id)) ?? fotkaStrediska(oblastSlug, slug)
  const pristupy = pristupyStrediska(oblastSlug, s.nazev)
  const chataDle = new Map(index.map((ch) => [ch.slug, ch]))
  const radky = pristupy.map((p) => ({ ...p, chata: chataDle.get(p.slug) }))
  const delky = pristupy.map((p) => p.delkaKm).filter((d): d is number => d != null)

  // Lanovky, které z místa vyjíždějí: dolní stanice do 2,5 km od obce.
  const lanovky = s.lat != null && s.lng != null
    ? lanovkySeSlugy(oblastSlug).filter((l) => {
        const stred = ((s.lat! + l.dolni.lat) / 2) * (Math.PI / 180)
        const dx = (s.lng! - l.dolni.lng) * Math.cos(stred) * 111_320
        const dy = (s.lat! - l.dolni.lat) * 110_540
        return Math.hypot(dx, dy) < 2_500
      })
    : []

  // „Odtud dál" (handoff F1 §3 bod 6). Cíle jen s doloženou vazbou cíl↔chata
  // ↔trasa odtud; sousedi z GPS bodů obcí, tedy vzdušnou čarou.
  const cile = cileOdtud(oblast.topCile ?? [], pristupy)
  const sousedi = sousedniVychodiste(s, strediska)
  const list = dalsiList(strediska, slug)

  // Sekce se číslují průběžně podle toho, které se opravdu vykreslí — dřív
  // se čísla odvozovala od jediné podmínky (`s.lanovka`), což by po přibytí
  // čtvrté sekce začalo lhát u středisek bez lanovky.
  const maOdtudDal = cile.length > 0 || sousedi.length > 0

  // „Jak se sem dostat" (handoff F1 §3 bod 5). Ručně doložená próza z pole
  // `doprava` má přednost; kde chybí, složí se řádek z katalogu výchozích
  // bodů DATA-06 (železniční stanice a autobusové zastávky z OSM). Blok se
  // nevykreslí, dokud není aspoň jeden řádek — prázdná tabulka neříká nic.
  const dopravaRadky = jakSeSemDostat(s, bodyKatalogu(oblastSlug), s.doprava)

  const cisla = (() => {
    let n = 0
    const dal = () => String(++n).padStart(2, '0')
    return {
      lanovka: s.lanovka ? dal() : '',
      chaty: radky.length > 0 ? dal() : '',
      mapa: s.lat != null && s.lng != null ? dal() : '',
      dostat: dopravaRadky.length > 0 ? dal() : '',
      odtudDal: maOdtudDal ? dal() : '',
    }
  })()

  const naMapu: MapovaChata[] = radky
    .map((r) => r.chata)
    .filter((ch) => ch != null && ch.lat != null && ch.lng != null && ch.url)
    .map((ch) => ({
      slug: ch!.slug,
      nazev: ch!.nazev,
      vyska: ch!.vyska,
      stav: (ch!.stav as MapovaChata['stav']) ?? null,
      lat: ch!.lat!,
      lng: ch!.lng!,
      url: ch!.url!,
      typ: ch!.typ,
    }))

  return (
    <div className="wrap mini">
      {/* První článek je země OBJEKTU — Karpacz je „Polsko / Krkonoše /
          Karpacz", stejně jako ji nese profil chaty v hlavičce. Bez odkazu:
          domů vede logo v hlavičce a stránka země zatím neexistuje
          (/polsko přesměruje na úvod). Pohoří odkazuje na svou kanonickou
          adresu pod /cesko — přeshraniční celek, jedna stránka. */}
      <nav className="pohori-breadcrumb mn" aria-label="Drobečková navigace">
        <span>{ZEME_NAZEV[s.zeme ?? ''] ?? 'Česko'}</span> /{' '}
        <Link href={`/cesko/${oblastSlug}`}>{oblast.nazev}</Link> / <span>{s.nazev}</span>
      </nav>

      <header className="mini-hero">
        <div>
          <p className="mini-kicker">
            Východisko túr · {oblast.nazev}
            {s.zeme === 'pl' && <span className="pohori-tag-pl">PL</span>}
          </p>
          <h1>{s.nazev}</h1>
          {s.perex && <p className="mini-perex">{s.perex}</p>}
          <p className="pohori-mikropozn">
            <span aria-hidden="true">†</span> jen doložitelné údaje — co nemáme spočítané nebo
            ověřené, tu nestojí
          </p>
        </div>
        {foto && (
          <figure className="mini-foto">
            {/* eslint-disable-next-line @next/next/no-img-element -- statická příloha repa (DATA-33) */}
            <img src={foto.url} alt={foto.popis ?? `${s.nazev} — pohled na středisko`} loading="eager" />
            <figcaption>
              {/* Popiska = název souboru na Commons: snímek sám řekne, co je na něm,
                  takže případný přehmat výběru pozná čtenář i redakce hned. */}
              {foto.popis && <b className="foto-popis" title={foto.popis}>{foto.popis}</b>}
              {kreditFotky(foto.autor, foto.licence)}
              {foto.stranka && (
                <>
                  {' · '}
                  <a href={foto.stranka} target="_blank" rel="noopener noreferrer nofollow">
                    {nazevZdroje(foto.stranka)}
                  </a>
                </>
              )}
            </figcaption>
          </figure>
        )}
      </header>

      <div className="mini-tiles">
        <div className="pohori-tile">
          <b>{pristupy.length || '—'}</b>
          <span>{pristupy.length === 1 ? 'chata odtud' : 'chat odtud'}</span>
          <i>doložené přístupové trasy (DATA-06)</i>
        </div>
        {delky.length > 0 && (
          <>
            <div className="pohori-tile">
              <b>{formatKm(Math.min(...delky))}</b>
              <span>nejbližší chata</span>
              <i>půdorysná délka trasy</i>
            </div>
            <div className="pohori-tile">
              <b>{formatKm(Math.max(...delky))}</b>
              <span>nejvzdálenější</span>
              <i>z doložených tras odtud</i>
            </div>
          </>
        )}
        <div className="pohori-tile">
          <b>{lanovky.length || '—'}</b>
          <span>{lanovky.length === 1 ? 'lanovka v místě' : 'lanovek v místě'}</span>
          <i>dráhy s dolní stanicí do 2,5 km</i>
        </div>
        {/* Výška obce — dlaždice z handoffu F1e, která do 5. 8. 2026 neexistovala,
            protože ji nemělo čím naplnit ani jedno středisko. Po DATA-35 ji má
            18 z 22, a mikro-zdroj musí říct ČÍM je: hodnota z výškového modelu
            v referenčním bodě není totéž co číslo publikované obcí. */}
        {s.vyskaObce != null && (
          <div className="pohori-tile">
            <b>{formatVyskaM(s.vyskaObce)}</b>
            <span>výška obce</span>
            <i>{popisPuvoduVysky(s.overeniLokace?.source)}</i>
          </div>
        )}
      </div>

      {s.lanovka && (
        <section className="sec" aria-label="Lanovka">
          <SectionBar num={cisla.lanovka} title="Lanovka odtud" variant="blue" />
          <p className="mini-text">{s.lanovka}</p>
          {lanovky.length > 0 && (
            <ul className="mini-lanovky">
              {lanovky.map((l) => (
                <li key={l.id}>
                  <Link href={l.url}>{l.nazev ?? 'dráha bez názvu v mapových datech'}</Link>{' '}
                  <span className="lanovky-tise">
                    {l.typNazev}
                    {l.horni.vyska != null && `, nahoru do ${formatVyskaM(l.horni.vyska)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {radky.length > 0 && (
        <section className="sec" aria-label="Chaty dostupné odtud">
          <SectionBar num={cisla.chaty} title="Chaty dostupné odtud" variant="red" />
          <ul className="mini-chaty">
            {radky.map((r) => {
              const znacky = znackyTrasy(r.useky)
              return (
                <li key={r.slug} className="mini-chata">
                  {r.chata?.heroUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura z Payload (480×320) */
                    <img className="mini-chata-foto" src={r.chata.heroUrl} alt={r.chata.heroAlt ?? ''} loading="lazy" />
                  ) : (
                    <span className="mini-chata-foto mini-chata-foto--prazdna" aria-hidden="true" />
                  )}
                  <div className="mini-chata-text">
                    <b>
                      {r.chata?.url ? <Link href={r.chata.url}>{r.nazev}</Link> : r.nazev}
                    </b>
                    <span className="mini-chata-fakta">
                      {r.chata?.vyska != null && <>{formatVyskaM(r.chata.vyska)} · </>}
                      {formatKm(r.delkaKm)}
                      {r.podilNeznacenychProc != null && r.podilNeznacenychProc > 0 && (
                        <> · {Math.round(r.podilNeznacenychProc)} % bez značky</>
                      )}
                    </span>
                    {znacky.length > 0 && (
                      <span className="mini-znacky">
                        {znacky.map((z, i) => (
                          <TrailBlaze key={`${z}-${i}`} color={z} />
                        ))}
                      </span>
                    )}
                    {/* Upřesnění výchozího bodu se vypisuje, jen když opravdu
                        upřesňuje — „z bodu: Pec pod Sněžkou" na stránce Pece
                        je šum, kdežto „…, parkoviště P1" je informace. */}
                    {r.vychoziBod.trim().toLocaleLowerCase('cs') !== s.nazev.trim().toLocaleLowerCase('cs') && (
                      <span className="mini-chata-odkud">z bodu: {r.vychoziBod}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="pohori-mikropozn">
            Délka je půdorysná z geometrie tras (ne měřená), značky z OpenStreetMap. U chaty
            s víc trasami odtud se ukazuje ta nejkratší. Čas chůze neuvádíme — doložený ho nemáme.
          </p>
        </section>
      )}

      {/* Mapa ukazuje ZASAZENÍ MÍSTA, ne rozptyl cílů (Michal 29. 7. 2026:
          „spíš bych tam dal mapu zasazení samotného střediska"). Středisko
          proto dostane vlastní značku — kapku — a mapa se vystředí na ně;
          chaty v okolí zůstávají jako kontext, ne jako téma. Kdyby se výřez
          jako dřív přizpůsobil všem cílům, obec by se v něm ztratila: u Pece
          se rozpětí tras táhne přes deset kilometrů. */}
      {s.lat != null && s.lng != null && (
        <section className="sec" aria-label="Mapa zasazení střediska">
          <SectionBar num={cisla.mapa} title={`Kde ${s.nazev} leží`} variant="red" />
          <MapaChat
            chaty={naMapu}
            misto={{ nazev: s.nazev, lat: s.lat, lng: s.lng }}
            zoom={13}
          />
          <p className="pohori-mikropozn">
            Střed mapy je bod obce z katalogu výchozích bodů; kolečka jsou chaty průvodce v okolí
            — klikem se otevře profil. Podklad Mapy.com „outdoor“.
          </p>
        </section>
      )}

      {/* „Jak se sem dostat" (handoff F1 §3 bod 5: „Vlak/Bus/Auto/Lanovka —
          fakta, ne jízdní řády"). Řádek z katalogu OSM mluví o zastávce
          a stanici, ne o spojení: že tam něco jezdí, z mapových dat neplyne.
          Lanovka má vlastní sekci s odkazy na dráhy, takže se sem — oproti
          prototypu — nekopíruje. */}
      {dopravaRadky.length > 0 && (
        <section className="sec" aria-label="Jak se sem dostat">
          <SectionBar num={cisla.dostat} title="Jak se sem dostat" variant="blue" />
          <dl className="mini-doprava">
            {dopravaRadky.map((r) => (
              <div key={r.klic}>
                <dt>{r.klic}</dt>
                <dd>{r.hodnota}</dd>
              </div>
            ))}
          </dl>
          {dopravaRadky.some((r) => r.puvod === 'katalog') && (
            <p className="pohori-mikropozn">
              Stanice a zastávky pocházejí z katalogu výchozích bodů (OpenStreetMap, ODbL);
              vzdálenosti jsou vzdušné od bodu obce, ne pěší. Jízdní řády ani linky neuvádíme —
              doložené je ležení zastávky, ne provoz na ní.
            </p>
          )}
        </section>
      )}

      {/* „Odtud dál" (handoff F1 §3 bod 6). Cíl se vypisuje jen tehdy, když
          k němu vede řetěz dvou doložených vazeb: cíl→nejbližší chata (pole
          `nejblizChataSlug` se `source` v datech oblasti) a ta chata→trasa
          odtud (DATA-06). Sousední východiště jsou vzdušnou čarou z bodů
          obcí — jiná míra než délky tras výš, takže se tak i jmenuje. */}
      {maOdtudDal && (
        <section className="sec" aria-label="Odtud dál">
          <SectionBar num={cisla.odtudDal} title="Odtud dál" variant="red" />
          <div className="mini-dal">
            {cile.map((c) => (
              <article className="mini-dal-cil" key={c.nazev}>
                <b>{c.nazev}</b>
                {c.veta && <span>{c.veta}</span>}
                <span className="mini-dal-vazba">
                  Nejblíž stojí{' '}
                  {/* Cesta profilu se BERE z indexu, neskládá se ze slugu oblasti:
                      nese zemi objektu, takže polská schroniska mají `/polsko/…`.
                      Do 1. 8. 2026 se tu adresa skládala s natvrdo psaným „cesko"
                      a odkaz na Dom Śląski ze stránky Pece vracel 404. */}
                  {chataDle.get(c.chataSlug)?.url ? (
                    <Link href={chataDle.get(c.chataSlug)!.url!}>{c.chataNazev}</Link>
                  ) : (
                    c.chataNazev
                  )}
                  {c.delkaKm != null && <> — odtud {formatKm(c.delkaKm)} po značené trase</>}.
                </span>
              </article>
            ))}
            {sousedi.length > 0 && (
              <article className="mini-dal-sousedi">
                <b>
                  {sousedi.map((so, i) => {
                    // Soused může být za hranicí (Pec ↔ Karpacz) — cesta se
                    // bere z kanonického helperu, ne ze země téhle stránky.
                    const cestaSouseda = strediskoPath(
                      strediska.find((x) => x.slug === so.slug) ?? {},
                      oblastSlug,
                    )
                    return (
                      <React.Fragment key={so.slug}>
                        {i > 0 && ' · '}
                        {cestaSouseda ? <Link href={cestaSouseda}>{so.nazev}</Link> : so.nazev}
                      </React.Fragment>
                    )
                  })}
                </b>
                <span>
                  Sousední východiště —{' '}
                  {sousedi.map((so) => formatKm(Math.round(so.vzdusnaKm * 10) / 10)).join(', ')}{' '}
                  vzdušnou čarou (bod obce, ne pěší vzdálenost).
                </span>
              </article>
            )}
          </div>
        </section>
      )}

      <p className="mini-zdroje">
        Zdroje: data střediska (`data/strediska/{oblastSlug}/{slug}.yaml`) ·{' '}
        {zdrojPristupu(oblastSlug) ?? 'přístupové trasy DATA-06'}
      </p>

      {/* Listování šablonou (handoff §3, mikrodetaily: „další list —
          Špindlerův Mlýn →"). Pořadí je abecední a cyklické, takže se dá
          projít všechna střediska oblasti a vrátit se na začátek. */}
      <p className="mini-zpet">
        <Link href={`/cesko/${oblastSlug}`}>◂ zpět na {oblast.nazev}</Link>
        {(() => {
          // Další list může být jiná země než tenhle (Pec → Przesieka):
          // cesta se bere z kanonického helperu, ne ze země aktuální stránky.
          const dalsi = list && strediska.find((x) => x.slug === list.slug)
          const cestaDalsiho = dalsi && strediskoPath(dalsi, oblastSlug)
          return cestaDalsiho ? (
            <Link className="mini-dalsi-list" href={cestaDalsiho}>
              další list — {list!.nazev} →
            </Link>
          ) : null
        })()}
      </p>

      {/* Strukturovaná data (handoff F1 §3: „breadcrumb + JSON-LD"). Obsah se
          skládá v `@/lib/jsonld-stredisko` — tvrdí jen to, co je v datech. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLdStrediska(s, {
              // Země objektu (rozhodnutí 1. 8. 2026): kanonická adresa
              // i drobečky nesou zemi střediska, stejně jako profil chaty.
              zemeSlug: ZEME_SLUG[s.zeme ?? ''] ?? 'cesko',
              oblastSlug,
              oblastNazev: oblast.nazev,
              zemeNazev: ZEME_NAZEV[s.zeme ?? ''] ?? ZEME_NAZEV.cz,
            }),
          ),
        }}
      />
    </div>
  )
}
