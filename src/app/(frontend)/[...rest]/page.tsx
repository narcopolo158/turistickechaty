import { notFound } from 'next/navigation'

/**
 * Catch-all pro neznámé URL frontendu → not-found „MIMO ZNAČKU".
 * Repo nemá společný root layout (skupiny (frontend) a (payload) mají každá
 * svůj), takže bez tohoto souboru by nenamatchovaná cesta dostala výchozí
 * 404 Next.js bez naší hlavičky a razítkové řeči. Konkrétnější routy
 * (statické stránky, /[zeme]/[oblast]/[chata] i /admin a /api ze skupiny
 * (payload)) mají dle pravidel Next.js přednost.
 */
export default function NeznamaCesta(): never {
  notFound()
}
