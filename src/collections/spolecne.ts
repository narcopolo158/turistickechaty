import type { OptionObject } from 'payload'

/** Země — model od prvního dne počítá s více zeměmi (plán kap. 5). */
export const ZEME_OPTIONS: OptionObject[] = [
  { label: 'Česko', value: 'cz' },
  { label: 'Slovensko', value: 'sk' },
  { label: 'Polsko', value: 'pl' },
  { label: 'Rakousko', value: 'at' },
  { label: 'Německo', value: 'de' },
  { label: 'Švýcarsko', value: 'ch' },
  { label: 'Itálie', value: 'it' },
  { label: 'Slovinsko', value: 'si' },
  { label: 'Francie', value: 'fr' },
]

/** Barvy pásového značení KČT — používají je trasy chat i výlety. */
export const ZNACENI_OPTIONS: OptionObject[] = [
  { label: 'Červená', value: 'cervena' },
  { label: 'Modrá', value: 'modra' },
  { label: 'Zelená', value: 'zelena' },
  { label: 'Žlutá', value: 'zluta' },
  { label: 'Černá', value: 'cerna' }, // polská strana Krkonoš značí i černě (DATA-06)
  { label: 'Bez značení / jiné', value: 'jine' },
]

/** Obtížnost tras a výletů. */
export const OBTIZNOST_OPTIONS: OptionObject[] = [
  { label: 'Snadná', value: 'snadna' },
  { label: 'Střední', value: 'stredni' },
  { label: 'Náročná', value: 'narocna' },
]

/**
 * Tříhodnotový údaj o službě: ano / ne / nevyplněno (= nezjištěno).
 * Checkbox by lhal — nezaškrtnuto by splývalo s „nemá". Fakta nedomýšlíme.
 */
export const ANO_NE_OPTIONS: OptionObject[] = [
  { label: 'Ano', value: 'ano' },
  { label: 'Ne', value: 'ne' },
]
