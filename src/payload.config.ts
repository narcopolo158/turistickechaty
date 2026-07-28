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
    // Propis schématu (drizzle push) je jinak řízen NODE_ENV a v produkci se
    // MLČKY vypne — nové sloupce a hodnoty enumů by pak v serverové databázi
    // nevznikly a zápis by padal až za běhu. Deploy proto pouští seed
    // s PAYLOAD_DB_PUSH=1 a schéma se propíše deterministicky, ne náhodou.
    push: process.env.PAYLOAD_DB_PUSH ? process.env.PAYLOAD_DB_PUSH === '1' : process.env.NODE_ENV !== 'production',
  }),
  sharp,
  plugins: [],
})
