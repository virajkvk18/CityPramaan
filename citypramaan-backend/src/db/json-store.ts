import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { DatabaseShape } from '../types/domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyDatabase(): DatabaseShape {
  return {
    version: 1,
    users: [],
    refreshTokens: [],
    walletChallenges: [],
    emailVerifications: [],
    issues: [],
    contractors: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeDatabase(input: Partial<DatabaseShape>): DatabaseShape {
  const base = emptyDatabase();
  return {
    version: input.version || base.version,
    users: Array.isArray(input.users)
      ? input.users.map((user) => ({
          ...user,
          emailVerified:
            typeof user.emailVerified === 'boolean'
              ? user.emailVerified
              : user.email.endsWith('@wallet.citypramaan.local'),
        }))
      : [],
    refreshTokens: Array.isArray(input.refreshTokens) ? input.refreshTokens : [],
    walletChallenges: Array.isArray(input.walletChallenges) ? input.walletChallenges : [],
    emailVerifications: Array.isArray(input.emailVerifications) ? input.emailVerifications : [],
    issues: Array.isArray(input.issues) ? input.issues : [],
    contractors: Array.isArray(input.contractors) ? input.contractors : [],
    updatedAt: input.updatedAt || base.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// JSONBin.io persistent store
// Falls back to local file if JSONBIN_API_KEY / JSONBIN_BIN_ID are not set.
// ---------------------------------------------------------------------------

const JSONBIN_API = 'https://api.jsonbin.io/v3';

async function jsonbinRead(): Promise<DatabaseShape> {
  const key = process.env.JSONBIN_API_KEY;
  const binId = process.env.JSONBIN_BIN_ID;
  if (!key || !binId) return emptyDatabase();

  const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
    headers: { 'X-Master-Key': key },
  });
  if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`);
  const json = await res.json() as { record: Partial<DatabaseShape> };
  return normalizeDatabase(json.record);
}

async function jsonbinWrite(db: DatabaseShape): Promise<void> {
  const key = process.env.JSONBIN_API_KEY;
  const binId = process.env.JSONBIN_BIN_ID;
  if (!key || !binId) return;

  const res = await fetch(`${JSONBIN_API}/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': key,
    },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// In-memory cache so we don't hit JSONBin on every request
// ---------------------------------------------------------------------------

let memCache: DatabaseShape | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 10_000; // re-fetch from JSONBin at most every 10s

async function getCached(): Promise<DatabaseShape> {
  if (memCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return memCache;
  }
  const db = await jsonbinRead();
  memCache = db;
  cacheLoadedAt = Date.now();
  return db;
}

function invalidateCache() {
  memCache = null;
}

// ---------------------------------------------------------------------------
// Local file fallback (used when JSONBin env vars are absent)
// ---------------------------------------------------------------------------

class LocalFileStore {
  constructor(private readonly filePath: string) {}

  read(): DatabaseShape {
    this.ensureFile();
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return normalizeDatabase(JSON.parse(raw));
  }

  write(db: DatabaseShape): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  private ensureFile(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) this.write(emptyDatabase());
  }
}

// ---------------------------------------------------------------------------
// Public JsonStore — same interface as before
// ---------------------------------------------------------------------------

export class JsonStore {
  private local: LocalFileStore;

  constructor(private readonly filePath: string) {
    this.local = new LocalFileStore(filePath);
  }

  read(): DatabaseShape {
    // Sync read: return cache if warm, otherwise local file
    // (JSONBin is async; use readAsync for fresh remote data)
    if (memCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
      return memCache;
    }
    return this.local.read();
  }

  async readAsync(): Promise<DatabaseShape> {
    if (process.env.JSONBIN_API_KEY && process.env.JSONBIN_BIN_ID) {
      return getCached();
    }
    return this.local.read();
  }

  update<T>(mutator: (db: DatabaseShape) => T): T {
    const db = this.read();
    const result = mutator(db);
    db.updatedAt = new Date().toISOString();
    this.local.write(db); // write locally immediately (sync)

    // persist to JSONBin in background (don't block the request)
    if (process.env.JSONBIN_API_KEY && process.env.JSONBIN_BIN_ID) {
      memCache = db;
      cacheLoadedAt = Date.now();
      jsonbinWrite(db).catch((err) =>
        console.error('[JSONBin] write failed:', err)
      );
    }

    return result;
  }

  async updateAsync<T>(mutator: (db: DatabaseShape) => T): Promise<T> {
    const db = await this.readAsync();
    const result = mutator(db);
    db.updatedAt = new Date().toISOString();
    this.local.write(db);

    if (process.env.JSONBIN_API_KEY && process.env.JSONBIN_BIN_ID) {
      memCache = db;
      cacheLoadedAt = Date.now();
      await jsonbinWrite(db);
    }

    return result;
  }
}

export const store = new JsonStore(env.dataFile);

// On startup: warm the cache from JSONBin so first request is fast
if (process.env.JSONBIN_API_KEY && process.env.JSONBIN_BIN_ID) {
  getCached()
    .then((db) => {
      // Also write to local file so sync reads work immediately
      new LocalFileStore(env.dataFile).write(db);
      console.log('[JSONBin] Cache warmed on startup. Users:', db.users.length);
    })
    .catch((err) => console.error('[JSONBin] Startup cache warm failed:', err));
}
