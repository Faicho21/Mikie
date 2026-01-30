import 'dotenv/config'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { PrismaClient } = require('./node_modules/.prisma/client')

// SQLite: usar file: en prisma/ (el directorio existe). Si .env tiene otra URL, usarla solo si es file:
const defaultDbPath = path.join(__dirname, 'prisma', 'dev.db')
const url = process.env.DATABASE_URL?.startsWith('file:')
  ? process.env.DATABASE_URL
  : `file:${defaultDbPath}`

const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

export default prisma
