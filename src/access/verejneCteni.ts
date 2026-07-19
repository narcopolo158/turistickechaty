import type { Access } from 'payload'

/**
 * Čtení pro kolekce s koncepty (drafts): přihlášená redakce vidí vše,
 * veřejnost jen publikované dokumenty. Bez tohoto omezení by REST API
 * leakovalo rozpracované profily — „žádný profil nejde ven poloprázdný".
 */
export const verejneJenPublikovane: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
