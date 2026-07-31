/**
 * KONTROLA „fronta" — kolik práce leží a kde.
 *
 * PROČ JE TO KONTROLA, A NE JEN OBRAZOVKA (31. 7. 2026): redakční prostředí
 * v adminu vidí jen ten, kdo si ho otevře. Fronta se ale nejlíp zanedbá tím,
 * že se na ni nikdo nepodívá — 45 kandidátů Jizerek leželo týden, protože
 * nikde nesvítilo číslo. Report proto běží při každé `npm run kontrola`
 * i v CI: nesestřelí build (nezpracovaný kandidát není vada, je to práce),
 * ale je vidět v každém běhu.
 *
 * CO UŽ VADA JE — a co tenhle krok hlásí nahlas:
 *  1. **Odložený nebo vyřazený objekt bez důvodu.** Rozhodnutí bez důvodu je
 *     k ničemu: za měsíc nikdo neví, proč tam ta chata není.
 *  2. **Odložený kandidát, který mezitím dostal profil.** Zůstal by ve dvou
 *     stavech naráz a fronta by lhala.
 *  3. **Rozhodnutí o fotce k objektu, který neexistuje.** Osiřelý zápis, na
 *     který se při dalším běhu nikdo nepodívá.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  frontaFotek,
  nactiOdlozene,
  nactiProfily,
  nactiRozhodnutiFotek,
  nactiVyrazene,
  souhrnFronty,
  stavKandidatu,
} from '../../src/lib/redakce/fronta'

export type NalezFronty = { zprava: string }

/** Vady, které fronta hlásí jako chybu (na rozdíl od pouhé rozpracovanosti). */
export const vadyFronty = (koren: string): NalezFronty[] => {
  const nalezy: NalezFronty[] = []
  const profily = nactiProfily(koren)
  const odlozeni = nactiOdlozene(koren)
  const vyrazeni = nactiVyrazene(koren)

  for (const [slug, o] of odlozeni) {
    if (!o.duvod?.trim()) nalezy.push({ zprava: `odložený kandidát „${slug}" nemá důvod — bez něj nikdo nepozná proč` })
    if (profily.has(slug))
      nalezy.push({ zprava: `„${slug}" je odložený, ale profil už existuje — smaž ho z _odlozeno.yaml` })
  }
  for (const [klic, v] of vyrazeni) {
    if (!v.duvod?.trim() && !klic.startsWith('http'))
      nalezy.push({ zprava: `vyřazený objekt „${klic}" nemá důvod` })
  }
  const znameChaty = new Set([...profily.keys(), ...stavKandidatu(koren).map((k) => k.slug)])
  for (const r of nactiRozhodnutiFotek(koren)) {
    if (!znameChaty.has(r.chata))
      nalezy.push({ zprava: `rozhodnutí o fotce míří na neznámý objekt „${r.chata}"` })
    if (!r.duvod?.trim()) nalezy.push({ zprava: `rozhodnutí o fotce u „${r.chata}" nemá důvod` })
  }
  return nalezy
}

export const spustFrontu = (koren = process.cwd()): { vady: number } => {
  const souhrn = souhrnFronty(koren)
  const k = souhrn.kandidati
  const f = souhrn.fotky

  console.log(
    `kandidati: ${k.nezpracovan} ceka | ${k.odlozen} odlozeno | ${k.povysen} povyseno | ${k.vyrazen} vyrazeno`,
  )
  console.log(
    `fotky: ${f.sFotkou}/${f.profilu} profilu ma fotku | ${f.cekaRozhodnuti} ceka na vyber | ${f.bezNabidky} bez nabidky | ${f.uzavrenych} uzavreno`,
  )
  for (const o of souhrn.dleOblasti) {
    if (o.kandidatiNezpracovani === 0 && o.profilyBezFotky === 0) continue
    console.log(`  ${o.oblast}: ${o.kandidatiNezpracovani} kandidatu, ${o.profilyBezFotky} profilu bez fotky`)
  }

  const pr = souhrn.profily
  console.log(
    `profily: ${pr.sMezerou}/${pr.celkem} ma aspon jednu mezeru | ${pr.zastaraleOvereni} s overenim starsim nez rok`,
  )
  if (pr.dleDruhu.length > 0) {
    console.log(`  chybi: ${pr.dleDruhu.map((d) => `${d.pocet}× ${d.druh}`).join(', ')}`)
  }

  // Profily, kterým Commons nenabídla vůbec nic — ty se z fronty samy
  // nevyřeší a je fér je vypsat jmenovitě, ne je nechat v čísle.
  const bezNabidky = frontaFotek(koren)
    .filter((ch) => ch.jeProfil && !ch.maFotku && !ch.uzavrena && ch.ceka.length === 0)
    .map((ch) => `${ch.oblast}/${ch.slug}`)
  if (bezNabidky.length > 0) {
    console.log(`  bez jedineho kandidata na fotku (${bezNabidky.length}): ${bezNabidky.slice(0, 12).join(', ')}${bezNabidky.length > 12 ? ' …' : ''}`)
  }

  const vady = vadyFronty(koren)
  for (const v of vady) console.log(` * ${v.zprava}`)
  console.log(`\nvad ve fronte: ${vady.length}`)
  return { vady: vady.length }
}

if (process.argv[1]?.endsWith('fronta.ts')) {
  const koren = process.cwd()
  if (!existsSync(join(koren, 'data'))) {
    console.error('Spouštěj z kořene repa (chybí data/).')
    process.exit(1)
  }
  const { vady } = spustFrontu(koren)
  process.exit(vady > 0 ? 1 : 0)
}
