/**
 * Kontrola razítkového korpusu (`scripts/kontrola/razitka.ts`, DATA-05).
 *
 * Testuje se přesně to, kvůli čemu kontrola vznikla: seed razítek běží UVNITŘ
 * nasazení, takže vadné razítko neshodí sebe, ale celý deploy. Každý případ
 * níž odpovídá jedné větvi, která by v produkci vyhodila výjimku — a poslední
 * test drží stav skutečného repa na nule, aby se vada nedostala do main.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { zkontrolujRazitka } from '../../scripts/kontrola/razitka'

/** Bezvadné převzaté razítko — základ, ze kterého se v testech ubírá. */
const RAZITKO = `chata: barborka
nazev: Barborka — otisk z razitkuj.cz (var. 1/2)
zpusobZiskani: prevzato-se-svolenim
prevzeti:
  zdroj: razitkuj.cz
  zdrojUrl: http://www.razitkuj.cz/misto-barborka/1
otisk:
  soubor: 52.gif
  autor: razitkuj.cz (sbírka přispěvatelů)
  licence: se-svolenim
`

const korpus = (soubory: Record<string, string>, skeny: string[] = ['52.gif']) => {
  const koren = mkdtempSync(join(tmpdir(), 'razitka-'))
  mkdirSync(koren, { recursive: true })
  for (const [jmeno, obsah] of Object.entries(soubory)) writeFileSync(join(koren, jmeno), obsah)
  for (const s of skeny) writeFileSync(join(koren, s), 'GIF89a')
  return koren
}

const PROFILY = new Set(['barborka', 'lucni-bouda'])

describe('zkontrolujRazitka', () => {
  it('bezvadné převzaté razítko projde', () => {
    expect(zkontrolujRazitka(korpus({ 'barborka.yaml': RAZITKO }), PROFILY)).toEqual([])
  })

  it('razítko chaty bez profilu se hlásí — jinak seed při nasazení vyhodí Error', () => {
    // Tenhle případ je nejnebezpečnější: razítko se zakládá dávkou z
    // razitkuj.cz podle jmenné shody, takže může snadno předběhnout povýšení
    // chaty z kandidáta. Seed pak nespadne na razítku, ale shodí celý deploy.
    const v = zkontrolujRazitka(
      korpus({ 'x.yaml': RAZITKO.replace('chata: barborka', 'chata: jeste-neni') }),
      PROFILY,
    )
    expect(v).toHaveLength(1)
    expect(v[0]!.kod).toBe('chata')
    expect(v[0]!.zprava).toContain('jeste-neni')
  })

  it('převzaté razítko bez odkazu na zdroj je vada, ne kosmetika', () => {
    // Odkaz je PODMÍNKA svolení (turistickarazitka.cz) a kolekce Razitka
    // publikaci bez něj odmítne APIError — tedy zase padlý deploy.
    const v = zkontrolujRazitka(
      korpus({ 'x.yaml': RAZITKO.replace('  zdrojUrl: http://www.razitkuj.cz/misto-barborka/1\n', '') }),
      PROFILY,
    )
    expect(v.map((x) => x.kod)).toEqual(['atribuce'])
  })

  it('chybějící sken otisku se pozná dřív než ENOENT v uploadu', () => {
    const v = zkontrolujRazitka(korpus({ 'x.yaml': RAZITKO }, []), PROFILY)
    expect(v.map((x) => x.kod)).toEqual(['otisk-soubor'])
  })

  it('otisk bez autora nebo licence se nesmí zveřejnit', () => {
    const v = zkontrolujRazitka(
      korpus({ 'x.yaml': RAZITKO.replace('  licence: se-svolenim\n', '') }),
      PROFILY,
    )
    expect(v.map((x) => x.kod)).toEqual(['licence'])
  })

  it('dvě razítka téže chaty se shodným názvem — seed by jedno tiše přepsal', () => {
    // Nejtišší z vad: deploy projde zeleně a na webu prostě jedna varianta
    // chybí. Seed páruje dvojicí (chata, nazev), druhý zápis přepíše první.
    const v = zkontrolujRazitka(
      korpus({ 'a.yaml': RAZITKO, 'b.yaml': RAZITKO }, ['52.gif']),
      PROFILY,
    )
    expect(v.map((x) => x.kod)).toEqual(['dvojnik'])
  })

  it('registry a manifesty (soubory s podtržítkem) se nečtou jako razítka', () => {
    // `_parovani-potvrzene.yaml` pole `chata` nemá a mít nemá — seed ho taky
    // přeskakuje. Kdyby ho kontrola hlásila, hlásila by věčnou falešnou vadu.
    const v = zkontrolujRazitka(
      korpus({ 'barborka.yaml': RAZITKO, '_parovani-potvrzene.yaml': 'potvrzene:\n  - barborka\n' }),
      PROFILY,
    )
    expect(v).toEqual([])
  })

  it('nad skutečným repem je korpus čistý (152 razítek, 151 převzatých)', () => {
    expect(zkontrolujRazitka()).toEqual([])
  })
})
