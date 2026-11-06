import pg from 'pg'

// One pool per database, each with the role that owns it (ADR-04).
function pool(database, passwordVariable) {
  return new pg.Pool({
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    database,
    user: `${database}_svc`,
    password: process.env[passwordVariable],
    max: 10,
    connectionTimeoutMillis: 2000,
    statement_timeout: 2000,
  })
}

export const catalogue = pool('catalogue', 'CATALOGUE_DB_PASSWORD')
export const venues = pool('venues', 'VENUES_DB_PASSWORD')
