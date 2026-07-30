/**
 * F1f „noc na horách" — hlídka nad zdrojem CSS.
 *
 * Noc je čistě CSS věc: nemá funkci, kterou by šlo zavolat, ani komponentu,
 * která by se dala vyrenderovat s tvrzením „tady je tmavo". Ke čtenáři se
 * dostane commitnutý stylopis — tak ho kontrolujeme přímo, stejně jako
 * u manifestu fotek (DATA-33).
 *
 * Co test drží:
 *  (1) noční sada tokenů existuje na `body.dark` a nese hodnoty z handoffu
 *      (`design/handoff-f1/README.md`, sekce „Dark mode ‚noc na horách'");
 *  (2) šablony F1 (katalog, homepage) nezůstaly bez noci — dokud tokeny
 *      nebyly přepínané, `katalog.css` ani `home-f1.css` neměly ani jednu
 *      noční deklaraci a v noci svítily bíle;
 *  (3) kresba na FYZICKÝCH artefaktech (papírová mapa v koláži, tooltip
 *      výškového profilu) nejede přes `--ink`, protože ten se v noci
 *      obrací — artefakty se v noci nepřekreslují a zůstala by na nich
 *      světlá tuš na světlém papíře, tedy nic.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const KOREN = join(import.meta.dirname, '..', '..')
const cssSoubor = (jmeno: string) => readFileSync(join(KOREN, 'src/app/(frontend)', jmeno), 'utf8')

const styles = cssSoubor('styles.css')
const katalog = cssSoubor('katalog.css')
const homeF1 = cssSoubor('home-f1.css')

/** Blok `body.dark { … }`, ve kterém stojí noční sada tokenů. */
const nocniBlok = (() => {
  const zacatek = styles.indexOf('body.dark {')
  const konec = styles.indexOf('}', zacatek)
  return styles.slice(zacatek, konec)
})()

describe('F1f — noční sada tokenů', () => {
  // Hodnoty 1:1 z handoffu; kdyby je někdo přepsal, ať to není omylem.
  const ocekavane: Record<string, string> = {
    '--paper': '#161d22',
    '--cream': '#1a2228',
    '--card': '#212a30',
    '--desk': '#0d1215',
    '--ink': '#ece6d7',
    '--muted': '#a6afac',
    '--label': '#b7ad99',
    '--red': '#f26a4b',
    '--gone': '#7a848c',
  }

  for (const [token, hodnota] of Object.entries(ocekavane)) {
    it(`${token} má v noci hodnotu z handoffu (${hodnota})`, () => {
      expect(nocniBlok).toMatch(new RegExp(`${token}:\\s*${hodnota};`))
    })
  }

  it('značené trasy KČT mají noční, světlejší odstíny (kontrast tras nesmí klesnout)', () => {
    expect(nocniBlok).toMatch(/--tr-red:\s*#ff7b60;/)
    expect(nocniBlok).toMatch(/--tr-blue:\s*#7da2ee;/)
    expect(nocniBlok).toMatch(/--tr-green:\s*#5fc98e;/)
    expect(nocniBlok).toMatch(/--tr-yellow:\s*#f2c94c;/)
  })

  it('vlasové linky jsou v noci světlé, ne tmavé z denní sady', () => {
    expect(nocniBlok).toMatch(/--line:\s*rgba\(255, 255, 255, 0\.1\)/)
    expect(nocniBlok).toMatch(/--hair:\s*rgba\(255, 255, 255, 0\.13\)/)
  })

  it('lampa a hvězdy existují jen jako noční tokeny (ve dne se nezapínají)', () => {
    expect(nocniBlok).toContain('--lamp:')
    expect(nocniBlok).toContain('--stars:')
    // v denní sadě `tokens.css` nemají co dělat
    expect(cssSoubor('tokens.css')).not.toContain('--lamp')
    expect(cssSoubor('tokens.css')).not.toContain('--stars')
  })

  it('hero „sběratelský stůl" lampu i hvězdy skutečně vykresluje', () => {
    expect(homeF1).toMatch(/background-image:\s*var\(--lamp[^)]*\), var\(--stars/)
  })

  it('malovaný poster dostane v noci soumrak, ne novou kresbu', () => {
    expect(homeF1).toMatch(/body\.dark \.hf1-poster-scena::after/)
    expect(homeF1).toMatch(/rgba\(10, 14, 24, 0\.26\)/)
  })
})

describe('F1f — fyzické artefakty se v noci nepřekreslují', () => {
  it('--ink-artefakt je definovaný a nezávisí na režimu', () => {
    expect(styles).toMatch(/:root\s*\{\s*--ink-artefakt:\s*#384057;/)
    expect(nocniBlok).not.toContain('--ink-artefakt')
  })

  it('popisky na papírové mapě v koláži kreslí artefaktovou tuší', () => {
    const radek = homeF1.split('\n').find((r) => r.includes('.hf1-mapa-popisek'))
    expect(radek).toBeDefined()
    expect(radek).toContain('var(--ink-artefakt)')
  })

  it('pasparta mini-otisku razítka zůstává v noci papírová (multiply by otisk pohltil)', () => {
    expect(katalog).toMatch(/body\.dark \.ktl-otisk\s*\{[^}]*background:\s*#f4efe3/)
  })

  it('tooltip výškového profilu nemá v noci světlé pozadí pod bílým textem', () => {
    const profil = cssSoubor('profil.css')
    const tipp = profil.slice(profil.indexOf('.tipp {'), profil.indexOf('.prof-pop'))
    expect(tipp).toContain('var(--ink-artefakt)')
    expect(tipp).not.toContain('background: var(--ink)')
  })

  it('kresba v HeroKolaz nekreslí přes --ink (v noci by zmizela na bílém papíře)', () => {
    const kolaz = readFileSync(join(KOREN, 'src/components/HeroKolaz.tsx'), 'utf8')
    expect(kolaz).not.toContain('stroke="var(--ink)"')
    expect(kolaz).toContain('stroke="var(--ink-artefakt)"')
  })
})

/**
 * Jedna noc, ne dvě (dokončení F1f, 30. 7. 2026).
 *
 * Noc se do repa dostávala ve dvou vlnách. Starší komponenty (F0-03) měly
 * pravidla `body.dark .x` s ručně psanými barvami z CHLADNÉ modrošedé sady
 * (`#1b242e` plocha, `#2a3541` linka, `#e7ecf1` text); noční sada tokenů
 * z handoffu je naopak TEPLÁ (`--card #212a30`, `--ink #ece6d7`). Na jedné
 * stránce se pak potkaly dvě různé noci — karta střediska svítila modrošedě
 * vedle teplého papíru sekce pod ní.
 *
 * Test hlídá, že se pevná modrošedá sada nevrátí. Nezakazuje barvu úplně:
 * BAREVNÉ tinty (infoboxy, stavy) a fyzické artefakty (papírová pasparta)
 * token nemají a mít nemají — proto se hlídají jen konkrétní hodnoty té
 * staré neutrální sady.
 */
describe('F1f — starší šablony berou noc z týchž tokenů', () => {
  const SOUBORY = [
    'components.css', 'home-f1.css', 'katalog.css', 'mini.css', 'pohori.css',
    'profil.css', 'profil-zapisnik.css', 'razitkovnik.css', 'styles.css',
  ]
  /** Hodnoty staré chladné noční sady — každá má dnes svůj token. */
  const STARA_SADA: Record<string, string> = {
    '#1b242e': '--card', '#171f27': '--paper', '#141c24': '--desk', '#141b21': '--desk',
    '#1b232b': '--cream', '#1f2933': '--cream', '#20272d': '--card', '#232c35': '--card',
    '#2a333a': '--card', '#242f39': '--hair', '#2a3541': '--hair', '#2a343d': '--line',
    '#39434d': '--hair', '#e7ecf1': '--ink', '#a9b6c2': '--muted', '#93a4b2': '--muted',
  }

  /**
   * Malovaná scéna řezu hřebenem má vlastní paletu (`--rez-nebe-*`,
   * `--rez-sever/hreben/jih`) — je to obraz krajiny, ne plocha rozhraní,
   * a její noční obloha se náhodou trefuje do jedné staré hodnoty. Barvy
   * scény se proto z kontroly vyjímají; že je scéna má, hlídá test níž.
   */
  const bezScenyRezu = (blok: string): string =>
    blok.split('\n').filter((r) => !r.trim().startsWith('--rez-')).join('\n')

  /** Deklarace uvnitř pravidel, jejichž selektor obsahuje `body.dark`. */
  const nocniDeklarace = (zdroj: string): string[] => {
    const out: string[] = []
    let i = 0
    for (;;) {
      const j = zdroj.indexOf('body.dark', i)
      if (j < 0) return out
      const o = zdroj.indexOf('{', j)
      if (o < 0) return out
      let hloubka = 1
      let k = o + 1
      while (hloubka && k < zdroj.length) {
        if (zdroj[k] === '{') hloubka += 1
        else if (zdroj[k] === '}') hloubka -= 1
        k += 1
      }
      out.push(zdroj.slice(o, k))
      i = k
    }
  }

  it('žádné pravidlo `body.dark` nepíše barvy staré chladné sady natvrdo', () => {
    const nalezy: string[] = []
    for (const jmeno of SOUBORY) {
      for (const blok of nocniDeklarace(cssSoubor(jmeno))) {
        const cisty = bezScenyRezu(blok).toLowerCase()
        for (const [barva, token] of Object.entries(STARA_SADA)) {
          if (cisty.includes(barva)) nalezy.push(`${jmeno}: ${barva} → má být var(${token})`)
        }
      }
    }
    expect(nalezy, `pevné noční barvy mimo tokeny:\n${nalezy.join('\n')}`).toEqual([])
  })

  it('kontrola samotné kontroly — sada, kterou hlídáme, opravdu byla v repu', () => {
    // Kdyby se seznam jednou omylem vyprázdnil, test výš by procházel vždy.
    expect(Object.keys(STARA_SADA).length).toBeGreaterThan(10)
    expect(STARA_SADA['#1b242e']).toBe('--card')
  })

  it('malovaná scéna řezu hřebenem si drží vlastní noční paletu', () => {
    // Řez je obraz: obloha, severní svahy, hřeben, jižní svahy. Kdyby se
    // převedl na tokeny rozhraní, panorama by zplihlo do jedné plochy.
    const pohori = cssSoubor('pohori.css')
    const blok = pohori.slice(pohori.indexOf('body.dark .rez {'))
    expect(blok.slice(0, blok.indexOf('}'))).toMatch(/--rez-nebe-h:.*--rez-jih:/su)
  })

  it('barevné tinty a fyzické artefakty zůstávají — token pro ně neexistuje', () => {
    // Infoboxy a stavové pilulky nesou význam barvou, ne plochou; papírová
    // pasparta otisku se v noci nepřekresluje. Kdyby je někdo „sjednotil"
    // na neutrální tokeny, zmizel by rozdíl mezi poznámkou a výstrahou.
    const components = cssSoubor('components.css')
    expect(components).toMatch(/body\.dark \.ibox\.red\s*\{[^}]*#331712/)
    expect(components).toMatch(/body\.dark \.ibox\.alp\s*\{[^}]*#1a2b14/)
    expect(cssSoubor('katalog.css')).toMatch(/body\.dark \.ktl-otisk\s*\{[^}]*#f4efe3/)
  })
})
