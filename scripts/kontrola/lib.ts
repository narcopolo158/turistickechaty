/**
 * Sdílené kousky kontrolních skriptů (`scripts/kontrola/*`).
 *
 * POZOR na hranici slova: JavaScriptové `\b` a `\w` jsou ASCII-only, kdežto
 * v Pythonu (odkud se tyhle kontroly portovaly) jsou unicodové. Kvůli tomu se
 * `\bKč\b`, `\bzł\b` nebo `známk\w*` chovají v JS JINAK než v Pythonu — třeba
 * „známkách č. 673" by JS vzor minul, protože `\w` se zastaví na „á".
 * Proto se v celém adresáři NEPOUŽÍVÁ `\b` ani `\w`, ale konstanty níže
 * (`WB0`, `WB1`, `W`) nad příznakem `u`. Kdo sem přidá nový vzor, ať to
 * dodrží — jinak kontrola tiše přestane zabírat na českých slovech.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

/** Hranice slova PŘED vzorem (unicodová obdoba pythonovského `\b`). */
export const WB0 = '(?<![\\p{L}\\p{N}_])'
/** Hranice slova ZA vzorem. */
export const WB1 = '(?![\\p{L}\\p{N}_])'
/** Znak slova (unicodová obdoba pythonovského `\w`). */
export const W = '[\\p{L}\\p{N}_]'

/** Doména v textu — společná pro kontrolu připsání i pro audit. */
export const DOMENA = new RegExp(
  `${WB0}((?:[a-z0-9][a-z0-9-]*\\.)+(?:cz|pl|eu|com|net|org|info))${WB1}`,
  'giu',
)

/** Rozdělení na věty (týž vzor jako v pythonovské předloze). */
export const VETA = /(?<=[.!?])\s+/u

/** Rekurzivní seznam .yaml souborů pod adresářem, lexikograficky (jako glob). */
export function najdiYaml(korenAdresare: string): string[] {
  const out: string[] = []
  const projdi = (dir: string) => {
    let polozky: string[]
    try {
      polozky = readdirSync(dir)
    } catch {
      return
    }
    for (const jm of polozky) {
      if (jm.startsWith('.')) continue // glob skryté soubory nebere
      const p = join(dir, jm)
      if (statSync(p).isDirectory()) projdi(p)
      else if (jm.endsWith('.yaml')) out.push(p)
    }
  }
  projdi(korenAdresare)
  return out.sort()
}

export function nactiYaml(cesta: string): Record<string, unknown> {
  const d = parse(readFileSync(cesta, 'utf8')) as unknown
  return d && typeof d === 'object' ? (d as Record<string, unknown>) : {}
}

/**
 * Veřejná próza profilu jako dvojice (popisek, text): perex + text[].
 * `textJakoRetezec` odpovídá volnější variantě z kontroly zdrojů a ban skenu,
 * kde se počítá i `text` zapsaný jako jeden řetězec místo seznamu.
 */
export function proza(
  d: Record<string, unknown>,
  textJakoRetezec = false,
): Array<[string, string]> {
  const out: Array<[string, string]> = []
  if (typeof d.perex === 'string') out.push(['perex', d.perex])
  const t = d.text
  if (Array.isArray(t)) {
    t.forEach((v, i) => {
      if (typeof v === 'string') out.push([`text[${i}]`, v])
    })
  } else if (textJakoRetezec && typeof t === 'string') {
    out.push(['text', t])
  }
  return out
}

/** Pole se seznamem map (`zdroje`, `zajimavosti`, `milniky`…). */
export function seznamMap(hodnota: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(hodnota)) return []
  return hodnota.filter(
    (z): z is Record<string, unknown> => !!z && typeof z === 'object',
  )
}

/** Domény obsažené v řetězci, bez `www.` prefixu. */
export function domeny(text: unknown): Set<string> {
  const out = new Set<string>()
  if (typeof text !== 'string') return out
  for (const m of text.matchAll(DOMENA)) {
    const dom = m[1].toLowerCase()
    out.add(dom.startsWith('www.') ? dom.slice(4) : dom)
  }
  return out
}
