/**
 * Kredit pod fotkou — jedno místo pro všechny šablony.
 *
 * Vznikl 30. 7. 2026, když se do repa dostaly první snímky z mediabanky
 * CzechTourism a ukázalo se, že karta střediska měla dvě věci napevno:
 * pořadí slov v kreditu („foto X, licence") a název zdroje („Wikimedia
 * Commons"). U mediabanky je obojí špatně — podmínky předepisují znění
 * kreditu doslova a odkaz nevede na Commons. Výsledek zněl „foto Tomáš
 * Rucký, © CzechTourism – mediabanka · Wikimedia Commons", tedy nepravda
 * o zdroji a porušené znění kreditu v jedné řádce.
 */

/**
 * Text kreditu. Mediabanka CzechTourism má znění dané podmínkami
 * („© CzechTourism – mediabanka, autor: <jméno>"), takže se neskládá po
 * našem; u ostatních licencí zůstává obvyklý tvar „foto <autor>, <licence>".
 */
export const kreditFotky = (autor: string, licence: string): string =>
  licence.includes('CzechTourism') ? `${licence}, autor: ${autor}` : `foto ${autor}, ${licence}`

/**
 * Jméno zdroje pro odkaz — odvozené z domény, ne napevno. Když doménu
 * neznáme, ukáže se doslova: raději „example.org" než nesprávné „Wikimedia
 * Commons".
 */
export const nazevZdroje = (url: string): string => {
  if (url.includes('wikimedia.org') || url.includes('commons.wikimedia')) return 'Wikimedia Commons'
  if (url.includes('visitczechia.com')) return 'mediabanka CzechTourism'
  try {
    return new URL(url).host.replace(/^www\./u, '')
  } catch {
    return 'zdroj'
  }
}
