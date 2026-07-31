/**
 * ZÁPIS REDAKČNÍCH ROZHODNUTÍ PŘES GITHUB API.
 *
 * PROČ (rozhodnutí Michala 31. 7. 2026: „prostředí bych chtěl používat
 * z adminu"): rozhodnutí patří do repozitáře, protože ten je zdrojem pravdy —
 * jenže nasazený web nemá pracovní kopii, do které by šlo zapsat. Commit přes
 * API je jediná cesta, jak z nasazeného adminu dostat rozhodnutí tam, kam
 * patří: projde běžnou cestou commit → CI → deploy a v historii je vidět, kdo
 * a proč.
 *
 * DVĚ VĚCI, KTERÉ TU MUSÍ SEDĚT, JINAK SE TIŠE ZTRÁCÍ PRÁCE:
 *
 * 1. **Čte se ze stejného místa, kam se zapisuje.** Soubory v kontejneru jsou
 *    ze stavu při buildu; mezitím mohl přijít cizí commit (třeba noční běh
 *    DATA-02). Kdyby prostředí patchovalo verzi z disku a poslalo ji jako
 *    celý soubor, přepsalo by cizí změny. Proto se před každým zápisem načte
 *    AKTUÁLNÍ obsah z API i s jeho `sha`.
 * 2. **`sha` je zámek.** GitHub přijme zápis jen tehdy, když `sha` odpovídá
 *    tomu, co v repu opravdu leží. Když mezi čtením a zápisem někdo commitne,
 *    vrátí 409 — a my načteme znovu a patch zopakujeme nad novým obsahem.
 *    Slepé opakování by přepsalo cizí práci; opakuje se proto CELÝ postup,
 *    včetně úpravy textu.
 *
 * TOKEN se nikdy nedostane do odpovědi ani do logu: chybové hlášky se skládají
 * ze stavu a zprávy od GitHubu, nikdy z konfigurace.
 */

const API = 'https://api.github.com'

export type Konfigurace = {
  token: string
  /** `vlastnik/repo`, např. `narcopolo158/turistickechaty`. */
  repo: string
  vetev: string
}

/** Konfigurace z prostředí; `null` = zápis přes GitHub není nastavený. */
export const konfiguraceZProstredi = (
  env: Record<string, string | undefined> = process.env,
): Konfigurace | null => {
  const token = env.REDAKCE_GITHUB_TOKEN?.trim()
  const repo = env.REDAKCE_GITHUB_REPO?.trim()
  if (!token || !repo) return null
  return { token, repo, vetev: env.REDAKCE_GITHUB_BRANCH?.trim() || 'main' }
}

/**
 * Které proměnné pro zápis přes GitHub v prostředí chybí.
 *
 * PROČ JMENOVITĚ: `REDAKCE_GITHUB_REPO` má hodnotu v `.env.example`, což svádí
 * k domněnce, že je to výchozí nastavení — ale `.env.example` je jen vzor, do
 * běhu se nenačítá nikde. Kdo na nasazeném webu vyplní jen token, zůstane
 * v režimu jen pro čtení a obecná hláška „zápis není nastavený" mu neřekne
 * proč. (Nález 1. 8. 2026, když si Michal nastavoval token.)
 */
export const chybejiciProstredi = (
  env: Record<string, string | undefined> = process.env,
): string[] =>
  (['REDAKCE_GITHUB_TOKEN', 'REDAKCE_GITHUB_REPO'] as const).filter((jmeno) => !env[jmeno]?.trim())

const hlavicky = (k: Konfigurace) => ({
  authorization: `Bearer ${k.token}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'turistickechaty-redakce',
})

/** Chyba se zprávou pro člověka — bez tokenu a bez interních detailů. */
export class ChybaGitHubu extends Error {
  constructor(
    public stav: number,
    zprava: string,
  ) {
    super(zprava)
  }
}

const zprovaChyby = async (res: Response): Promise<string> => {
  try {
    const telo = (await res.json()) as { message?: string }
    return telo.message ?? res.statusText
  } catch {
    return res.statusText
  }
}

export type StavSouboru = { obsah: string; sha: string } | { obsah: null; sha: null }

/**
 * Načte soubor z repa i s jeho `sha`. Neexistující soubor NENÍ chyba —
 * `_rozhodnuti.yaml` vzniká až prvním rozhodnutím.
 */
export const nactiSoubor = async (
  k: Konfigurace,
  cesta: string,
  fetchFn: typeof fetch = fetch,
): Promise<StavSouboru> => {
  const url = `${API}/repos/${k.repo}/contents/${cesta.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(k.vetev)}`
  const res = await fetchFn(url, { headers: hlavicky(k), cache: 'no-store' })
  if (res.status === 404) return { obsah: null, sha: null }
  if (!res.ok) throw new ChybaGitHubu(res.status, `Čtení ${cesta} z GitHubu selhalo: ${await zprovaChyby(res)}`)
  const telo = (await res.json()) as { content?: string; encoding?: string; sha?: string }
  if (!telo.sha || telo.content == null)
    throw new ChybaGitHubu(500, `GitHub vrátil ${cesta} bez obsahu — je to opravdu soubor, ne složka?`)
  return { obsah: Buffer.from(telo.content, 'base64').toString('utf8'), sha: telo.sha }
}

/** Zapíše (commitne) obsah souboru. `sha` musí odpovídat stavu v repu. */
export const zapisSoubor = async (
  k: Konfigurace,
  cesta: string,
  obsah: string,
  zprava: string,
  sha: string | null,
  fetchFn: typeof fetch = fetch,
): Promise<{ commit: string }> => {
  const url = `${API}/repos/${k.repo}/contents/${cesta.split('/').map(encodeURIComponent).join('/')}`
  const res = await fetchFn(url, {
    method: 'PUT',
    headers: { ...hlavicky(k), 'content-type': 'application/json' },
    body: JSON.stringify({
      message: zprava,
      content: Buffer.from(obsah, 'utf8').toString('base64'),
      branch: k.vetev,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!res.ok) throw new ChybaGitHubu(res.status, `Zápis ${cesta} do GitHubu selhal: ${await zprovaChyby(res)}`)
  const telo = (await res.json()) as { commit?: { sha?: string } }
  return { commit: telo.commit?.sha ?? '' }
}

/**
 * Načti → uprav → zapiš, s opakováním při souběžné změně.
 *
 * `uprav` dostane AKTUÁLNÍ obsah (nebo `null`, když soubor ještě není) a vrací
 * nový. Při 409 (mezitím někdo commitnul) se celý postup zopakuje nad čerstvým
 * obsahem — slepé opakování zápisu by cizí commit přepsalo.
 */
export const upravSoubor = async (
  k: Konfigurace,
  cesta: string,
  uprav: (obsah: string | null) => string,
  zprava: string,
  fetchFn: typeof fetch = fetch,
  pokusu = 3,
): Promise<{ commit: string }> => {
  let posledni: unknown = null
  for (let pokus = 1; pokus <= pokusu; pokus++) {
    const stav = await nactiSoubor(k, cesta, fetchFn)
    try {
      return await zapisSoubor(k, cesta, uprav(stav.obsah), zprava, stav.sha, fetchFn)
    } catch (chyba) {
      posledni = chyba
      const souběh = chyba instanceof ChybaGitHubu && (chyba.stav === 409 || chyba.stav === 422)
      if (!souběh || pokus === pokusu) throw chyba
    }
  }
  throw posledni instanceof Error ? posledni : new Error('Zápis do GitHubu se nepovedl.')
}

/**
 * Ověří, že token na repo dosáhne a smí do něj psát. Volá se při otevření
 * prostředí, aby se chyba oprávnění neukázala až po vyplnění formuláře.
 */
export const overSpojeni = async (
  k: Konfigurace,
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: boolean; zprava: string }> => {
  try {
    const res = await fetchFn(`${API}/repos/${k.repo}`, { headers: hlavicky(k), cache: 'no-store' })
    if (!res.ok) return { ok: false, zprava: `GitHub odmítl přístup k ${k.repo}: ${await zprovaChyby(res)}` }
    const telo = (await res.json()) as { permissions?: { push?: boolean } }
    return telo.permissions?.push
      ? { ok: true, zprava: `Zapisuje se do ${k.repo} (větev ${k.vetev}).` }
      : { ok: false, zprava: `Token na ${k.repo} dosáhne, ale nemá právo zápisu (contents: write).` }
  } catch (chyba) {
    return { ok: false, zprava: `Na GitHub se nepodařilo dosáhnout: ${chyba instanceof Error ? chyba.message : 'neznámá chyba'}` }
  }
}
