// Zdravotní endpoint pro provoz (INFRA-01): nginx/Forge/uptime kontrola se
// ptá sem, ne na celou stránku. Vrací jen ok + čas — žádná DB (nesmí
// spadnout kvůli výpadku databáze, o tom ať mluví monitoring aplikace).
export const dynamic = 'force-dynamic'

export const GET = (): Response =>
  Response.json({ ok: true, cas: new Date().toISOString() })
