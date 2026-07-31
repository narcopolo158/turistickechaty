/**
 * Zápis redakčních rozhodnutí přes GitHub API (`src/lib/redakce/github.ts`).
 *
 * Na api.github.com se ze sandboxu nedosáhne (proxy vrací 403), takže se
 * testuje proti mocku `fetch` — zato důkladně, protože tenhle kód rozhoduje
 * o tom, jestli se rozhodnutí opravdu uloží, nebo se tiše ztratí:
 *  1. čte se ze STEJNÉHO místa, kam se zapisuje (ne z disku kontejneru, který
 *     je ze stavu při buildu),
 *  2. `sha` funguje jako zámek a při souběžném commitu se patch zopakuje nad
 *     ČERSTVÝM obsahem — slepé opakování zápisu by cizí práci přepsalo,
 *  3. token se nikdy nedostane do chybové hlášky.
 */
import { describe, expect, it, vi } from 'vitest'

import {
  ChybaGitHubu,
  konfiguraceZProstredi,
  nactiSoubor,
  overSpojeni,
  upravSoubor,
  zapisSoubor,
} from '@/lib/redakce/github'

const KONF = { token: 'tajny-token-123', repo: 'kdo/repo', vetev: 'main' }

const odpoved = (stav: number, telo: unknown): Response =>
  ({
    ok: stav >= 200 && stav < 300,
    status: stav,
    statusText: `HTTP ${stav}`,
    json: async () => telo,
  }) as Response

const base64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')

describe('konfigurace z prostředí', () => {
  it('bez tokenu nebo repa se GitHub režim nezapíná', () => {
    expect(konfiguraceZProstredi({})).toBeNull()
    expect(konfiguraceZProstredi({ REDAKCE_GITHUB_TOKEN: 'x' })).toBeNull()
    expect(konfiguraceZProstredi({ REDAKCE_GITHUB_REPO: 'a/b' })).toBeNull()
  })

  it('výchozí větev je main, dá se přebít', () => {
    expect(konfiguraceZProstredi({ REDAKCE_GITHUB_TOKEN: 'x', REDAKCE_GITHUB_REPO: 'a/b' })?.vetev).toBe('main')
    expect(
      konfiguraceZProstredi({ REDAKCE_GITHUB_TOKEN: 'x', REDAKCE_GITHUB_REPO: 'a/b', REDAKCE_GITHUB_BRANCH: 'test' })
        ?.vetev,
    ).toBe('test')
  })
})

describe('čtení souboru', () => {
  it('dekóduje base64 a nese sha', async () => {
    const fetchFn = vi.fn(async () => odpoved(200, { content: base64('nazev: Chata\n'), sha: 'abc123' }))
    const stav = await nactiSoubor(KONF, 'data/chaty/x.yaml', fetchFn as unknown as typeof fetch)
    expect(stav).toEqual({ obsah: 'nazev: Chata\n', sha: 'abc123' })
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/repos/kdo/repo/contents/data/chaty/x.yaml?ref=main')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tajny-token-123')
  })

  /** `_rozhodnuti.yaml` vzniká až prvním rozhodnutím — 404 není chyba. */
  it('neexistující soubor vrací prázdno, ne výjimku', async () => {
    const fetchFn = vi.fn(async () => odpoved(404, { message: 'Not Found' }))
    await expect(nactiSoubor(KONF, 'a.yaml', fetchFn as unknown as typeof fetch)).resolves.toEqual({
      obsah: null,
      sha: null,
    })
  })

  it('chyba nese stav a zprávu GitHubu, ale NIKDY token', async () => {
    const fetchFn = vi.fn(async () => odpoved(403, { message: 'Bad credentials' }))
    const chyba = await nactiSoubor(KONF, 'a.yaml', fetchFn as unknown as typeof fetch).catch((e) => e)
    expect(chyba).toBeInstanceOf(ChybaGitHubu)
    expect((chyba as Error).message).toContain('Bad credentials')
    expect((chyba as Error).message).not.toContain('tajny-token')
  })
})

describe('zápis souboru', () => {
  it('pošle base64 obsah, větev i sha', async () => {
    const fetchFn = vi.fn(async () => odpoved(200, { commit: { sha: 'deadbeef1234' } }))
    const { commit } = await zapisSoubor(
      KONF,
      'data/x.yaml',
      'obsah\n',
      'data: zpráva',
      'sha-puvodni',
      fetchFn as unknown as typeof fetch,
    )
    expect(commit).toBe('deadbeef1234')
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    const telo = JSON.parse(init.body as string) as Record<string, string>
    expect(Buffer.from(telo.content!, 'base64').toString('utf8')).toBe('obsah\n')
    expect(telo).toMatchObject({ message: 'data: zpráva', branch: 'main', sha: 'sha-puvodni' })
  })

  it('u nového souboru sha neposílá', async () => {
    const fetchFn = vi.fn(async () => odpoved(201, { commit: { sha: 'x' } }))
    await zapisSoubor(KONF, 'a.yaml', 'o', 'z', null, fetchFn as unknown as typeof fetch)
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('sha')
  })
})

describe('načti → uprav → zapiš', () => {
  it('patch se dělá nad obsahem z API, ne nad tím, co má kontejner', async () => {
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? odpoved(200, { commit: { sha: 'c1' } })
        : odpoved(200, { content: base64('a: 1\n'), sha: 's1' }),
    )
    let videl: string | null = 'nenastaveno'
    await upravSoubor(
      KONF,
      'a.yaml',
      (obsah) => {
        videl = obsah
        return `${obsah}b: 2\n`
      },
      'z',
      fetchFn as unknown as typeof fetch,
    )
    expect(videl).toBe('a: 1\n')
    const put = fetchFn.mock.calls.find((c) => (c[1] as RequestInit)?.method === 'PUT')!
    const telo = JSON.parse((put[1] as RequestInit).body as string) as { content: string }
    expect(Buffer.from(telo.content, 'base64').toString('utf8')).toBe('a: 1\nb: 2\n')
  })

  /**
   * SOUBĚH JE TU NORMÁLNÍ STAV: běhy pipeline commitují samy. Když mezi
   * čtením a zápisem přijde cizí commit, musí se zopakovat CELÝ postup —
   * kdyby se opakoval jen zápis, cizí změna by zmizela.
   */
  it('při 409 načte znovu a patch zopakuje nad novým obsahem', async () => {
    let putu = 0
    const obsahy = ['puvodni\n', 'mezitim-zmeneny\n']
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return odpoved(200, { content: base64(obsahy[putu]!), sha: `s${putu}` })
      putu += 1
      return putu === 1 ? odpoved(409, { message: 'is at ... but expected ...' }) : odpoved(200, { commit: { sha: 'c2' } })
    })
    const { commit } = await upravSoubor(
      KONF,
      'a.yaml',
      (o) => `${o}pridano\n`,
      'z',
      fetchFn as unknown as typeof fetch,
    )
    expect(commit).toBe('c2')
    const posledniPut = fetchFn.mock.calls.filter((c) => (c[1] as RequestInit)?.method === 'PUT').at(-1)!
    const telo = JSON.parse((posledniPut[1] as RequestInit).body as string) as { content: string; sha: string }
    // Druhý pokus staví na obsahu, který v repu OPRAVDU je.
    expect(Buffer.from(telo.content, 'base64').toString('utf8')).toBe('mezitim-zmeneny\npridano\n')
    expect(telo.sha).toBe('s1')
  })

  it('jiná chyba než souběh se neopakuje — nemá to smysl', async () => {
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? odpoved(403, { message: 'Resource not accessible by personal access token' })
        : odpoved(200, { content: base64('a\n'), sha: 's' }),
    )
    await expect(
      upravSoubor(KONF, 'a.yaml', (o) => `${o}x`, 'z', fetchFn as unknown as typeof fetch),
    ).rejects.toThrow(/not accessible/)
    expect(fetchFn.mock.calls.filter((c) => (c[1] as RequestInit)?.method === 'PUT')).toHaveLength(1)
  })

  it('chyba z úpravy (např. „tuhle fotku už profil má") se ven pustí beze změny', async () => {
    const fetchFn = vi.fn(async () => odpoved(200, { content: base64('a\n'), sha: 's' }))
    await expect(
      upravSoubor(
        KONF,
        'a.yaml',
        () => {
          throw new Error('Tuhle fotku už profil má.')
        },
        'z',
        fetchFn as unknown as typeof fetch,
      ),
    ).rejects.toThrow('Tuhle fotku už profil má.')
  })
})

describe('ověření spojení při otevření prostředí', () => {
  it('token s právem zápisu projde', async () => {
    const fetchFn = vi.fn(async () => odpoved(200, { permissions: { push: true } }))
    await expect(overSpojeni(KONF, fetchFn as unknown as typeof fetch)).resolves.toMatchObject({ ok: true })
  })

  /** Token jen ke čtení je horší než žádný: chyba by přišla až po vyplnění. */
  it('token bez práva zápisu prostředí rovnou přizná', async () => {
    const fetchFn = vi.fn(async () => odpoved(200, { permissions: { push: false } }))
    const v = await overSpojeni(KONF, fetchFn as unknown as typeof fetch)
    expect(v.ok).toBe(false)
    expect(v.zprava).toContain('contents: write')
  })

  it('nedostupný GitHub neshodí prostředí, jen se přizná', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network down')
    })
    const v = await overSpojeni(KONF, fetchFn as unknown as typeof fetch)
    expect(v.ok).toBe(false)
    expect(v.zprava).toContain('network down')
  })
})
