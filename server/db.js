import pg from 'pg';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let dbError = null;

export function isDbConnected() {
  return isConnected;
}

export function getDbError() {
  return dbError;
}

export async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[Database] Notice: DATABASE_URL not detected. Running in local filesystem mode.');
    return { connected: false, reason: 'NO_DATABASE_URL' };
  }

  try {
    const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[Database Pool Unexpected Error]:', err.message);
    });

    // Test connection
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      
      // Create permanent key-value table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bingo_store (
          key VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isConnected = true;
      dbError = null;
      console.log('[Database] PostgreSQL connected successfully! Permanent persistence active.');
      return { connected: true };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    isConnected = false;
    dbError = err.message;
    return { connected: false, error: err.message };
  }
}

export async function loadAllFromDatabase() {
  if (!isConnected || !pool) return null;
  try {
    const result = await pool.query('SELECT key, data FROM bingo_store');
    const store = {};
    for (const row of result.rows) {
      store[row.key] = row.data;
    }
    return store;
  } catch (err) {
    console.error('[Database] Failed to load store:', err.message);
    return null;
  }
}

export async function saveKeyToDatabase(key, data) {
  if (!isConnected || !pool) return false;
  try {
    await pool.query(
      `INSERT INTO bingo_store (key, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
       SET data = EXCLUDED.data, updated_at = NOW()`,
      [key, JSON.stringify(data)]
    );
    return true;
  } catch (err) {
    console.error(`[Database] Failed to save key "${key}":`, err.message);
    return false;
  }
}

export async function saveMultipleKeysToDatabase(keyValueMap) {
  if (!isConnected || !pool) return false;
  try {
    for (const [key, data] of Object.entries(keyValueMap)) {
      await saveKeyToDatabase(key, data);
    }
    return true;
  } catch (err) {
    console.error('[Database] Failed to batch save keys:', err.message);
    return false;
  }
}
