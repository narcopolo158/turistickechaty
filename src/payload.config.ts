import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Oblasti } from './collections/Oblasti'
import { Chaty } from './collections/Chaty'
import { Fotky } from './collections/Fotky'
import { Razitka } from './collections/Razitka'
import { Vylety } from './collections/Vylety'
import { Clanky } from './collections/Clanky'
import { Strediska } from './collections/Strediska'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Chaty, Oblasti, Strediska, Vylety, Razitka, Clanky, Fotky, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // POZOR (doloženo měřením 28. 7. 2026): Payload propisuje schéma
    // (drizzle push) JEN když `NODE_ENV !== 'production'` — viz podmínka
    // v @payloadcms/db-postgres/dist/connect.js. Samotné `push: true`
    // v produkci NEUDĚLÁ NIC. Deploy proto pouští seed s NODE_ENV=development
    // (jinak nové sloupce v serverové DB nevzniknou a zápis padá až za běhu —
    // přesně tak spadlo první komunitní podání). Tady se dá push už jen
    // vypnout (PAYLOAD_DB_PUSH=0), až projekt přejde na řádné migrace.
    push: process.env.PAYLOAD_DB_PUSH !== '0',
  }),
  sharp,
  plugins: [],
})
