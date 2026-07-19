/**
 * Jednorázový smoke test kolekcí F0-04 (spouští se: npx payload run scripts/smoke-f004.ts).
 * Vytvoří zkušební záznamy, ověří slug hook, vztahy a join, pak po sobě uklidí.
 * Testovací data — žádná skutečná fakta o chatách.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

// Idempotence: úklid případných pozůstatků z dřívějšího přerušeného běhu
const uklid = async () => {
  await payload.delete({ collection: 'vylety', where: { slug: { equals: 'zkusebni-okruh' } } })
  await payload.delete({ collection: 'razitka', where: { nazev: { equals: 'Zkušební razítko' } } })
  await payload.delete({
    collection: 'chaty',
    where: { slug: { in: ['zkusebni-bouda-smaz-me', 'koncept-bouda'] } },
  })
  await payload.delete({ collection: 'oblasti', where: { slug: { equals: 'zkusebni-pohori' } } })
}
await uklid()

const oblast = await payload.create({
  collection: 'oblasti',
  data: { nazev: 'Zkušební pohoří', slug: 'zkusebni-pohori', typ: 'pohori', zeme: 'cz' },
})

const chata = await payload.create({
  collection: 'chaty',
  data: {
    nazev: 'Zkušební bouda (smaž mě)',
    // slug schválně s diakritikou a mezerami — hook ho má normalizovat
    slug: 'Zkušební Bouda (smaž mě)',
    typ: 'obsluhovana',
    stav: 'v-provozu',
    zeme: 'cz',
    oblast: oblast.id,
    lat: 50.0,
    lng: 15.0,
    vyska: 1234,
    voda: 'ano',
    overeniLokace: { source: 'smoke test', verified: false, checked: '2026-07-19' },
    _status: 'published',
  },
})
if (chata.slug !== 'zkusebni-bouda-smaz-me') throw new Error(`slug hook selhal: ${chata.slug}`)

// Draft-only dokument — nesmí prosáknout do veřejného výpisu
const koncept = await payload.create({
  collection: 'chaty',
  draft: true,
  data: { nazev: 'Koncept bouda', slug: 'koncept-bouda', _status: 'draft' },
})

const razitko = await payload.create({
  collection: 'razitka',
  data: {
    nazev: 'Zkušební razítko',
    chata: chata.id,
    stav: 'k-dispozici',
    overeni: { source: 'smoke test', verified: false },
  },
})

const vylet = await payload.create({
  collection: 'vylety',
  draft: true,
  data: {
    nazev: 'Zkušební okruh',
    slug: 'zkusebni-okruh',
    typ: 'okruh',
    oblast: oblast.id,
    zastavky: [{ typ: 'chata', chata: chata.id }],
    _status: 'draft',
  },
})

// Join: razítko se má objevit u (publikované) chaty.
// Pozn.: u draft-only dokumentů se joins nematerializují — frontend čte publikované, to nevadí.
const chataZpet = await payload.findByID({ collection: 'chaty', id: chata.id })
const joinDocs = (chataZpet.razitka?.docs ?? []).map((d) => (typeof d === 'object' ? d.id : d))
if (!joinDocs.includes(razitko.id)) throw new Error('join razitka → chata nefunguje')

// Public read: nepřihlášený dotaz vidí publikované, koncepty nikdy
const verejne = await payload.find({ collection: 'chaty', overrideAccess: false })
if (!verejne.docs.some((d) => d.slug === 'zkusebni-bouda-smaz-me'))
  throw new Error('publikovaná chata chybí ve veřejném výpisu')
if (verejne.docs.some((d) => d.slug === 'koncept-bouda'))
  throw new Error('koncept nesmí být ve veřejném výpisu')

// Úklid (vylet, razitko, koncept i chata jsou pokryté idempotentním úklidem)
void vylet
void koncept
await uklid()

console.log('SMOKE OK — slug hook, vztahy, join, access i draft režim fungují')
process.exit(0)
