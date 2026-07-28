/**
 * Obnova statických stránek po redakčním zásahu (schválení fotky, publikace
 * razítka). Klíčová vlastnost: mimo Next runtime (seed, CLI skripty) se hook
 * NESMÍ zvrtnout — datová operace má přednost před obnovou cache.
 */
import { describe, expect, it } from 'vitest'

import { revaliduj, revalidujPoSmazani, revalidujPoZmene } from '@/hooks/revalidace'

describe('revalidace po redakčním zásahu', () => {
  it('mimo Next runtime nespadne (seed a skripty musí projít)', async () => {
    await expect(revaliduj(['/', '/chaty'])).resolves.toBeUndefined()
  })

  it('hook vrací dokument beze změny a nespadne ani bez vazby na chatu', async () => {
    const doc = { id: 1, typ: 'soucasna' }
    const vysledek = await (revalidujPoZmene as unknown as (a: unknown) => Promise<unknown>)({ doc })
    expect(vysledek).toBe(doc)
    const smazany = await (revalidujPoSmazani as unknown as (a: unknown) => Promise<unknown>)({ doc })
    expect(smazany).toBe(doc)
  })

  it('zvládne i dokument s populovanou chatou (profil se přidá k obnovovaným cestám)', async () => {
    const doc = { id: 2, chata: { slug: 'labska-bouda', zeme: 'cz', oblast: { slug: 'krkonose' } } }
    await expect((revalidujPoZmene as unknown as (a: unknown) => Promise<unknown>)({ doc })).resolves.toBe(doc)
  })
})
