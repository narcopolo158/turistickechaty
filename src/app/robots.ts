import type { MetadataRoute } from 'next'

/**
 * /robots.txt (31. 7. 2026).
 *
 * PROČ VZNIKL: web žádný robots.txt neměl. Mlčení sice většina crawlerů čte
 * jako „smíš", ale sítě před weby (Cloudflare a spol.) dnes AI roboty ve
 * výchozím stavu BLOKUJÍ a rozhodují se přesně podle tohohle souboru — bez
 * něj je průvodce pro jazykové modely neviditelný, i když je obsah veřejný.
 * Průvodce chce být citovaný zdroj, tak to říká nahlas a jmenovitě.
 *
 * Co se NEPOVOLUJE: administrace Payloadu a API — tam robot nemá co dělat
 * a stejně dostane přihlašovací obrazovku. Interní návrhová stránka /design
 * je vyloučená z téhož důvodu jako ze sitemapy: není to obsah pro čtenáře.
 *
 * Odkaz na sitemapu je povinná část; `llms.txt` se z robots.txt neodkazuje
 * konvencí, ale komentářem — čtou ho i lidé.
 */
const BASE = 'https://turistickechaty.cz'

/**
 * Cesty, které nejsou obsah pro čtenáře (ani pro roboty). Statické soubory
 * Next.js (`/_next/`) tu SCHVÁLNĚ nejsou: bez CSS a skriptů si crawler
 * stránku vykreslí špatně a potrestá ji za to.
 */
const ZAKAZANO = ['/admin', '/api/', '/design']

/**
 * Roboti jazykových modelů a AI vyhledávačů, kterým se přístup potvrzuje
 * jmenovitě. Obecné `User-agent: *` by stačilo, jenže část z nich se řídí
 * jen vlastním jménem — a hlavně: jmenovitý zápis je doklad rozhodnutí, ne
 * náhoda. Kdyby se průvodce někdy rozhodl některého vyloučit, mění se řádek,
 * ne filozofie souboru.
 */
const AI_ROBOTI = [
  'GPTBot', // OpenAI — trénink
  'OAI-SearchBot', // OpenAI — vyhledávání v ChatGPT
  'ChatGPT-User', // OpenAI — návštěva na žádost uživatele
  'ClaudeBot', // Anthropic
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended', // Gemini / AI Overviews
  'Applebot-Extended',
  'MistralAI-User',
  'Bytespider',
  'CCBot', // Common Crawl
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ZAKAZANO },
      ...AI_ROBOTI.map((robot) => ({ userAgent: robot, allow: '/', disallow: ZAKAZANO })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
