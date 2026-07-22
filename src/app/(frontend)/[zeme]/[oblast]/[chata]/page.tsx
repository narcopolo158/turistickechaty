import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ProfilZapisnik, {
  type ZapData,
  type ZapNote,
  type ZapRoute,
  type ZapSluzba,
} from '@/components/ProfilZapisnik'
import { prechodyChaty } from '@/lib/prechody'
import { pristupyChaty } from '@/lib/pristupove-trasy'
import { vizitkaObrazek, znamkaObrazek, znamkyVizitkyChaty } from '@/lib/znamky-vizitky'
import {
  chataPath,
  formatCislo,
  formatDatum,
  formatGps,
  getChataBySlug,
  posledniOvereni,
  TYP_NAZEV,
  ZEME_NAZEV,
  ZEME_SLUG,
  ZNACENI_BARVA,
} from '@/lib/chaty'
import type { Chaty as Chata, Fotky as Fotka, Razitka } from '@/payload-types'

export const revalidate = 600

type Params = { zeme: string; oblast: string; chata: string }

// ── Pomocníci ───────────────────────────────────────────────────────────────

/** Lexical richText → prosté odstavce (bez závislosti na RichText v klientu). */
type LexNode = { type?: string; text?: string; children?: LexNode[] }
const lexToParas = (rt: unknown): string[] => {
  const root = (rt as { root?: LexNode } | null)?.root
  if (!root?.children) return []
  const walk = (node: LexNode): string =>
    node.type === 'text' ? (node.text ?? '') : (node.children ?? []).map(walk).join('')
  const out: string[] = []
  for (const child of root.children) {
    if (child.type === 'list') {
      for (const li of child.children ?? []) {
        const t = walk(li).trim()
        if (t) out.push(t)
      }
    } else {
      const t = walk(child).trim()
      if (t) out.push(t)
    }
  }
  return out
}

/** Minuty → „2 h 30" / „45 min". */
const formatCasHodiny = (min: number): string => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`
}

/** První http(s) host ze zdrojového textu (bez www) — pro popisku ověření. */
const prvniHost = (s?: string | null): string | null => {
  if (!s) return null
  const m = s.match(/https?:\/\/[^\s)]+/)
  if (!m) return null
  try {
    return new URL(m[0]).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Blok ověření (source/verified/checked) → značka a popiska (†/✓). */
const overeniNote = (
  b?: { source?: string | null; verified?: boolean | null; checked?: string | null } | null,
): ZapNote => {
  if (!b || !b.checked) return null
  const host = prvniHost(b.source)
  const kdo = b.verified ? 'ověřeno redakcí' : 'převzato ze zdroje'
  return {
    mark: b.verified ? '✓' : '†',
    text: `${kdo}${host ? ` · ${host}` : ''} · ověř. ${formatDatum(b.checked)}`,
  }
}

/** Dlouhý zdroj zajímavosti → krátký štítek (publikace/provozovatel). */
const kratkyZdroj = (z?: string | null): string | null => {
  if (!z) return null
  const cut = z.split(/[„(—]/)[0].trim().replace(/[·-]\s*$/, '').trim()
  return `· ${cut || z}`
}

const pluralOtisk = (n: number): string => (n === 1 ? 'otisk' : n >= 2 && n <= 4 ? 'otisky' : 'otisků')

async function nactiChatu(params: Params): Promise<Chata> {
  const chata = await getChataBySlug(params.chata)
  if (!chata) notFound()
  const path = chataPath(chata)
  if (!path || path !== `/${params.zeme}/${params.oblast}/${params.chata}`) notFound()
  return chata
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params
  const chata = await getChataBySlug(params.chata)
  if (!chata) return {}
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const title = `${chata.nazev}${chata.vyska ? ` · ${formatCislo(chata.vyska)} m` : ''} — ${oblast?.nazev ?? 'Turistické chaty'}`
  return {
    title,
    description:
      chata.perex ??
      `${chata.nazev} — profil chaty na turistickechaty.cz: ověřená data, trasy, razítko.`,
    alternates: { canonical: chataPath(chata) ?? undefined },
  }
}

/** JSON-LD dle typu chaty (plán kap. 6) — jen z doložených polí. */
const jsonLd = (chata: Chata, path: string) => {
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const typy: string[] = ['TouristAttraction']
  if (chata.nocleh === 'ano') typy.push('LodgingBusiness')
  else if (chata.kuchyne === 'ano') typy.push('FoodEstablishment')

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': typy.length === 1 ? typy[0] : typy,
    name: chata.nazev,
    url: `https://turistickechaty.cz${path}`,
  }
  const aliasy = (chata.aliasy ?? []).map((a) => a.nazev).filter(Boolean)
  if (aliasy.length) data.alternateName = aliasy
  if (chata.perex) data.description = chata.perex
  if (chata.lat != null && chata.lng != null) {
    data.geo = {
      '@type': 'GeoCoordinates',
      latitude: chata.lat,
      longitude: chata.lng,
      ...(chata.vyska != null ? { elevation: chata.vyska } : {}),
    }
  }
  if (chata.zeme) data.address = { '@type': 'PostalAddress', addressCountry: chata.zeme.toUpperCase() }
  if (chata.kontakty?.telefon) data.telephone = chata.kontakty.telefon
  if (chata.kontakty?.email) data.email = chata.kontakty.email
  const sameAs = [chata.kontakty?.web, chata.kontakty?.facebook, chata.kontakty?.instagram].filter(Boolean)
  if (sameAs.length) data.sameAs = sameAs

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      chata.zeme && {
        '@type': 'ListItem',
        position: 1,
        name: ZEME_NAZEV[chata.zeme],
        item: `https://turistickechaty.cz/${ZEME_SLUG[chata.zeme]}`,
      },
      oblast && {
        '@type': 'ListItem',
        position: 2,
        name: oblast.nazev,
        item: `https://turistickechaty.cz/${chata.zeme ? ZEME_SLUG[chata.zeme] : ''}/${oblast.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: chata.nazev, item: `https://turistickechaty.cz${path}` },
    ].filter(Boolean),
  }
  return [data, breadcrumb]
}

// ── Sestavení dat pro dvoustranu (POCTIVĚ z reálných polí) ───────────────────
function sestavData(chata: Chata): ZapData {
  const oblast = typeof chata.oblast === 'object' ? chata.oblast : null
  const typLabel = chata.typ ? TYP_NAZEV[chata.typ] : null
  const eyebrow = [oblast?.nazev, typLabel].filter(Boolean).join(' · ')
  const crumb = [chata.zeme ? ZEME_NAZEV[chata.zeme] : null, oblast?.nazev, chata.obec].filter(Boolean).join(' · ')

  const fotky = (chata.fotky?.docs ?? []).filter((f): f is Fotka => typeof f === 'object')
  const heroFoto = fotky.find((f) => f.typ === 'soucasna' && f.url)
  const heroAtribuceText = heroFoto ? [heroFoto.autor, heroFoto.licencePoznamka].filter(Boolean).join(' · ') : ''

  // Fakta (specimen tabulka) — jen doložená
  const facts: ZapData['facts'] = []
  if (chata.vyska != null) facts.push({ k: 'Výška', v: `${formatCislo(chata.vyska)} m n. m.` })
  if (oblast?.nazev) facts.push({ k: 'Pohoří', v: oblast.nazev })
  if (chata.obec) facts.push({ k: 'Oblast', v: chata.obec })
  if (typLabel) facts.push({ k: 'Typ', v: typLabel })
  if (chata.rokVzniku) facts.push({ k: 'Založeno', v: String(chata.rokVzniku) })
  if (chata.lat != null && chata.lng != null) facts.push({ k: 'Souřadnice', v: formatGps(chata.lat, chata.lng) })

  // Status
  const status: ZapData['status'] =
    chata.stav === 'v-provozu'
      ? { kind: 'open', label: 'v provozu', sub: chata.sezona ?? null }
      : chata.stav === 'zanikla'
        ? { kind: 'gone', label: 'zaniklá', sub: null }
        : chata.stav === 'mimo-provoz'
          ? { kind: 'gone', label: 'dočasně mimo provoz', sub: null }
          : { kind: 'none', label: '', sub: null }

  // Provoz
  const provozKv: ZapData['facts'] = []
  if (chata.otviraciDoba) provozKv.push({ k: 'Otvírací doba', v: chata.otviraciDoba.split('\n').join(' · ') })
  if (chata.kontakty?.telefon) provozKv.push({ k: 'Telefon', v: chata.kontakty.telefon })
  if (chata.kontakty?.web) provozKv.push({ k: 'Web', v: chata.kontakty.web.replace(/^https?:\/\//, '').replace(/\/$/, '') })
  const provoz =
    chata.sezona || provozKv.length > 0 || chata.overeniProvoz
      ? {
          big: chata.sezona ?? null,
          kv: provozKv,
          dynamic:
            'provoz a otvírací doba se mění — nikdy neukazujeme falešné „otevřeno teď", ověřte aktuální stav.',
          note: overeniNote(chata.overeniProvoz),
        }
      : null

  // Nocleh
  const pokoje = (chata.pokoje ?? []).map((p) => p.typ).filter((t): t is string => !!t)
  const nocleh =
    chata.nocleh === 'ano'
      ? {
          pokoje,
          ceny: chata.cenyOrientacne ?? null,
          kapacita: chata.kapacita != null ? `≈ ${formatCislo(chata.kapacita)} lůžek` : null,
          warn: chata.kapacita == null ? 'web ji neuvádí' : null,
          note: overeniNote(chata.overeniNocleh),
        }
      : null

  // Občerstvení
  const obcerstveni = chata.specialita ? { specialita: chata.specialita } : null

  // Služby — jen když aspoň jedna známá (jinak zeď „nezjištěno" vynecháme)
  const SLUZBY_POLE: { key: keyof Chata; k: string }[] = [
    { key: 'wc', k: 'WC' },
    { key: 'platbaKartou', k: 'Platba kartou' },
    { key: 'voda', k: 'Pitná voda' },
    { key: 'wifi', k: 'Wi-Fi' },
    { key: 'psi', k: 'Psi vítáni' },
    { key: 'nabijeni', k: 'Nabíjení' },
    { key: 'sprchy', k: 'Sprchy' },
    { key: 'lyzarna', k: 'Lyžárna' },
  ]
  const sluzbyRaw = SLUZBY_POLE.map(({ key, k }): ZapSluzba => {
    const val = chata[key] as 'ano' | 'ne' | null | undefined
    return { k, v: val === 'ano' ? 'k dispozici' : val === 'ne' ? 'není' : 'nezjištěno', stav: val === 'ano' ? 'ano' : val === 'ne' ? 'ne' : 'nezjisteno' }
  })
  const sluzby = sluzbyRaw.some((s) => s.stav !== 'nezjisteno') ? sluzbyRaw : []

  // Odkud vyjít (reálné přístupy z DATA-06)
  const pristupy = pristupyChaty(chata.slug)
  const routes: ZapRoute[] = pristupy.map((p) => {
    const marks = (p.useky ?? []).map((u) => ZNACENI_BARVA[u.znaceni] ?? '#8a949c').slice(0, 12)
    const profil =
      Array.isArray(p.vyskovyProfil) &&
      p.vyskovyProfil.length >= 2 &&
      p.vyskovyProfil.every((b) => Array.isArray(b) && b.length === 2 && typeof b[0] === 'number' && typeof b[1] === 'number')
        ? (p.vyskovyProfil as [number, number][])
        : null
    const lo = profil ? `${formatCislo(Math.round(profil[0][1]))} m` : null
    const hiText = chata.vyska != null ? `${formatCislo(chata.vyska)} m` : profil ? `${formatCislo(Math.round(profil[profil.length - 1][1]))} m` : ''
    return {
      from: p.vychoziBod,
      km: `${formatCislo(p.delkaKm)} km`,
      time: p.casMin != null ? formatCasHodiny(p.casMin) : null,
      up: p.prevyseni != null ? `↑ ${formatCislo(p.prevyseni)} m` : null,
      marks,
      profil,
      lo,
      hiText,
    }
  })
  const pristupIntro = pristupy.length
    ? 'Doporučené nástupy a cesty po značených trasách (výpočet ze značení KČT v OpenStreetMap). U vyznačených chat pocházejí nástupy z ověřovaného katalogu se zdroji; jinak z nejbližších středisek.'
    : null

  // Mapa
  const mapa =
    chata.lat != null && chata.lng != null
      ? {
          lat: chata.lat,
          lng: chata.lng,
          trasy: pristupy.map((p) => ({ vychoziBod: p.vychoziBod, typ: p.typ, delkaKm: p.delkaKm, body: p.geometrie ?? [] })),
        }
      : null

  // Sousední chaty — ruční, jinak vypočítané přechody (DATA-06)
  const sousedeRucni = (chata.sousedniChaty ?? [])
    .map((s) => (typeof s.chata === 'object' ? s.chata : null))
    .filter((c): c is Chata => !!c)
  const prechody = prechodyChaty(chata.slug)
  const sousede: ZapData['sousede'] =
    sousedeRucni.length > 0
      ? sousedeRucni.map((c) => ({ nazev: c.nazev, km: '', url: chataPath(c) }))
      : prechody.map((p) => ({ nazev: p.cilNazev, km: `${formatCislo(p.delkaKm)} km`, url: p.cilUrl ?? null }))

  // Historie
  const milniky = (chata.milniky ?? []).map((m) => ({ rok: m.rok != null ? String(m.rok) : '—', text: m.udalost ?? '' }))
  const roky = (chata.milniky ?? []).map((m) => m.rok).filter((r): r is number => typeof r === 'number')
  const rozsah =
    chata.rokVzniku && roky.length > 0
      ? `${chata.rokVzniku} – ${Math.max(...roky)}`
      : chata.rokVzniku
        ? `od ${chata.rokVzniku}`
        : null
  const historieText = lexToParas(chata.historieText)
  const historie = chata.rokVzniku || milniky.length > 0 || historieText.length > 0 ? { rozsah, milniky, text: historieText } : null

  // Zajímavosti
  const zajimavosti = (chata.zajimavosti ?? []).map((z) => ({ text: z.text ?? '', tag: kratkyZdroj(z.zdroj) }))

  // Zdroje + datum ověření
  const overeni = posledniOvereni(chata)
  const datumOvereni = overeni ? formatDatum(overeni.checked) : null
  const zdroje = (chata.zdroje ?? []).map((z) => ({ nazev: z.popis ?? '', url: z.url ?? null, datum: datumOvereni }))

  // Sběratelské artefakty
  const razitka = (chata.razitka?.docs ?? []).filter((r): r is Razitka => typeof r === 'object')
  const razitkoRec = razitka.find((r) => r.stav === 'k-dispozici') ?? razitka[0]
  const otisk = razitkoRec && typeof razitkoRec.otisk === 'object' ? razitkoRec.otisk : null
  const razitko = razitkoRec
    ? {
        slug: chata.slug,
        nazev: chata.nazev,
        pohori: oblast?.nazev ?? null,
        vyska: chata.vyska ?? null,
        otiskUrl: otisk?.url ?? null,
        otiskAlt: otisk?.alt ?? null,
        caption: `Razítko · ${razitka.length} ${pluralOtisk(razitka.length)}`,
        stav: razitkoRec.stav === 'historicke' ? 'historický otisk' : 'k dispozici',
      }
    : null

  const zv = znamkyVizitkyChaty(chata.slug)
  const znamkaP = zv.find((p) => p.system === 'znamka')
  const vizitkaP = zv.find((p) => p.system === 'vizitka')
  const jeVyrazena = (s?: string | null): boolean => !!s && /vyřaz/i.test(s)
  const znObr = znamkaP ? znamkaObrazek(chata.slug) : null
  const znamka = znamkaP
    ? {
        cislo: znamkaP.cislo,
        url: znamkaP.url,
        stav: znamkaP.stav ?? 'aktivní',
        aktivni: !jeVyrazena(znamkaP.stav),
        obrazekUrl: znObr?.url ?? null,
        obrazekZdroj: znObr?.zdroj ?? null,
      }
    : null
  const vizObr = vizitkaP ? vizitkaObrazek(chata.slug) : null
  const vizitka = vizitkaP
    ? {
        cislo: vizitkaP.cislo,
        nazev: chata.nazev,
        url: vizitkaP.url,
        stav: vizitkaP.stav ?? 'aktivní',
        vyrazena: jeVyrazena(vizitkaP.stav),
        obrazekUrl: vizObr?.url ?? null,
        obrazekZdroj: vizObr?.zdroj ?? null,
      }
    : null

  return {
    nazev: chata.nazev,
    eyebrow: eyebrow || 'Turistická chata',
    crumb: crumb || chata.nazev,
    vyskaText: chata.vyska != null ? `${formatCislo(chata.vyska)} m n. m.` : null,
    hero: heroFoto?.url ? { url: heroFoto.url, alt: heroFoto.alt ?? chata.nazev } : null,
    heroAtribuce: heroFoto ? { text: heroAtribuceText || 'zdroj', url: heroFoto.zdrojUrl ?? null } : null,
    heroCaption: [chata.nazev, chata.obec].filter(Boolean).join(' · '),
    status,
    historickeNazvy: (chata.aliasy ?? []).map((a) => a.nazev).filter((x): x is string => !!x),
    lead: chata.perex ?? null,
    facts,
    identitaNote: overeniNote(chata.overeniLokace),
    charakteristika: lexToParas(chata.text),
    provoz,
    nocleh,
    obcerstveni,
    sluzby,
    pristupIntro,
    routes,
    mapa,
    sousede,
    historie,
    zajimavosti,
    zdroje,
    razitko,
    znamka,
    vizitka,
    dalsiList: sousede[0]?.nazev ?? null,
  }
}

export default async function ProfilChaty(props: { params: Promise<Params> }) {
  const params = await props.params
  const chata = await nactiChatu(params)
  const path = `/${params.zeme}/${params.oblast}/${params.chata}`
  const data = sestavData(chata)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(chata, path)) }} />
      <ProfilZapisnik data={data} />
    </>
  )
}
