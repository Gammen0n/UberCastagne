// Applies pending SQL migrations, then demo seeds, to each service database.
//
//   db/migrations/<database>/NNN_description.sql   schema changes, applied in order, once
//   db/seeds/<database>/NNN_description.sql        demo data, applied once when DEMO_SEED=true
//
// Each file runs in its own transaction with the database's own role, so the service owns its
// tables (ADR-04). Applied files are recorded in schema_migrations with a checksum: editing a file
// that was already applied stops the run, because the change would never reach existing databases.
// Write a new migration instead.
//
// Run by the "migrate" service in compose.yaml before the back starts:
//   docker compose run --rm migrate
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATABASES = ['orders', 'catalogue', 'venues', 'payment']
const FILE_NAME = /^(\d{3})_[a-z0-9_]+\.sql$/
// Any constant works; it only has to be the same for every run.
const LOCK_KEY = 726_001

const seedDemo = (process.env.DEMO_SEED ?? 'true') === 'true'

function files(kind, database) {
  const folder = join(ROOT, kind, database)
  if (!existsSync(folder)) return []
  return readdirSync(folder)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => {
      if (!FILE_NAME.test(name)) {
        throw new Error(`${kind}/${database}/${name}: name must look like 002_add_something.sql`)
      }
      // Line endings are normalised so Windows and Linux checkouts give the same checksum.
      const sql = readFileSync(join(folder, name), 'utf8').replace(/\r\n/g, '\n')
      return { id: `${kind}/${name}`, sql, checksum: createHash('sha256').update(sql).digest('hex') }
    })
}

// PostgreSQL may still be finishing its start-up; retry for a few seconds.
// A pg.Client cannot be reused after a failed connect, so each attempt gets a new one.
async function connect(database) {
  for (let attempt = 1; ; attempt += 1) {
    const client = new pg.Client({
      host: process.env.PGHOST ?? 'localhost',
      port: Number(process.env.PGPORT ?? 5432),
      database,
      user: `${database}_svc`,
      password: process.env[`${database.toUpperCase()}_DB_PASSWORD`],
    })
    try {
      await client.connect()
      return client
    } catch (error) {
      if (attempt === 10) throw new Error(`[${database}] cannot connect: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

async function migrate(database) {
  const client = await connect(database)

  try {
    // Two runs at the same time (two replicas, two terminals) wait for each other.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY])

    const { rows: [{ fresh }] } = await client.query(`SELECT to_regclass('public.schema_migrations') IS NULL AS fresh`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         text PRIMARY KEY,
        checksum   text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`)

    const pending = [...files('migrations', database), ...(seedDemo ? files('seeds', database) : [])]

    // Databases created before migrations existed already contain the 001 files (schema and seed).
    // Record them as applied instead of running them again.
    if (fresh) {
      const { rows: [{ tables }] } = await client.query(
        `SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'`,
      )
      if (tables > 0) {
        for (const file of pending.filter((f) => f.id.endsWith('/001_initial.sql') || f.id.endsWith('/001_demo.sql'))) {
          await client.query('INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)', [file.id, file.checksum])
          console.log(`[${database}] ${file.id} recorded as already applied (existing database)`)
        }
      }
    }

    const { rows } = await client.query('SELECT id, checksum FROM schema_migrations')
    const applied = new Map(rows.map((row) => [row.id, row.checksum]))
    let count = 0

    for (const file of pending) {
      if (applied.has(file.id)) {
        if (applied.get(file.id) !== file.checksum) {
          throw new Error(
            `[${database}] ${file.id} was changed after it was applied. ` +
            'Revert the change and put it in a new numbered migration instead.',
          )
        }
        continue
      }
      await client.query('BEGIN')
      try {
        await client.query(file.sql)
        await client.query('INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)', [file.id, file.checksum])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`[${database}] ${file.id} failed and was rolled back: ${error.message}`)
      }
      console.log(`[${database}] applied ${file.id}`)
      count += 1
    }

    console.log(`[${database}] ${count ? `${count} file(s) applied` : 'up to date'}`)
  } finally {
    await client.end()
  }
}

try {
  for (const database of DATABASES) await migrate(database)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
