import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { DatabaseShape } from '../types/domain';

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
// JSONBin.io remote persistence
// ---------------------------------------------------------------------------

const JSONBIN_API = 'https://api.jsonbin.io/v3';

function hasJsonBin(): boolean {
  return Boolean(process.env.JSONBIN_API_KEY && process.env.JSONBIN_BIN_ID);
}

async function jsonbinRead(): Promise<DatabaseShape> {
  const res = await fetch(`${JSONBIN_API}/b/${process.env.JSONBIN_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY! },
  });
  if (!res.ok) throw new Error(`JSONBin read failed: ${res.status} ${await res.text()}`);
  const json = await res.json() as { record: Partial<DatabaseShape> };
  return normalizeDatabase(json.record);
}

async function jsonbinWrite(db: DatabaseShape): Promise<void> {
  const res = await fetch(`${JSONBIN_API}/b/${process.env.JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': process.env.JSONBIN_API_KEY!,
    },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`JSONBin write failed: ${res.status} ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Local file store
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
// JsonStore — same public interface as before
// ---------------------------------------------------------------------------

export class JsonStore {
  private local: LocalFileStore;

  constructor(private readonly filePath: string) {
    this.local = new LocalFileStore(filePath);
  }

  read(): DatabaseShape {
    return this.local.read();
  }

  update<T>(mutator: (db: DatabaseShape) => T): T {
    const db = this.local.read();
    const result = mutator(db);
    db.updatedAt = new Date().toISOString();
    this.local.write(db);

    // Persist to JSONBin in background — don't block the response
    if (hasJsonBin()) {
      jsonbinWrite(db).catch((err) =>
        console.error('[JSONBin] background write failed:', err)
      );
    }

    return result;
  }
}

export const store = new JsonStore(env.dataFile);

// ---------------------------------------------------------------------------
// Exported warm function — called in app.ts BEFORE server.listen()
// ---------------------------------------------------------------------------

export async function warmJsonBinCache(): Promise<void> {
  if (!hasJsonBin()) return;

  try {
    const db = await jsonbinRead();
    new LocalFileStore(env.dataFile).write(db);
    console.log(`[JSONBin] Loaded ${db.users.length} users, ${db.emailVerifications.length} verifications on startup.`);
  } catch (err) {
    console.error('[JSONBin] Startup load failed:', err);
  }
}
