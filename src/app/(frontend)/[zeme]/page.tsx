import { notFound, permanentRedirect } from 'next/navigation'

import { ZEME_SLUG } from '@/lib/chaty'

/**
 * Adresa země bez oblasti (`/cesko`, `/polsko`, …) — trvalé přesměrování
 * na úvod.
 *
 * PROČ TA ROUTE EXISTUJE (nález 1. 8. 2026): drobečková navigace v JSON-LD —
 * na profilech chat od začátku a od dneška i na mini-stránkách středisek —
 * má první článek „země" s adresou `/{zeme}`. Ta adresa ale žádnou stránku
 * neměla, takže KAŽDÝ profil posílal stroje na 404; u 89 profilů to nebyl
 * okraj, ale pravidlo. Než vznikne skutečný rozcestník země (dává smysl až
 * s druhou zemí s vlastním obsahem — dnes je všechno česky pod jedním
 * úvodem), je poctivé přesměrovat, ne mlčet čtyřstovkou.
 *
 * `permanentRedirect` (308) schválně: až rozcestník vznikne, dostane tuhle
 * adresu a přesměrování zmizí — do té doby je úvod nejbližší pravdivý cíl.
 */
export function generateStaticParams() {
  return Object.values(ZEME_SLUG).map((zeme) => ({ zeme }))
}

export default async function ZemePage({ params }: { params: Promise<{ zeme: string }> }) {
  const { zeme } = await params
  if (!Object.values(ZEME_SLUG).includes(zeme)) notFound()
  permanentRedirect('/')
}
