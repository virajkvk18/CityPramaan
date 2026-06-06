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

export class JsonStore {
  constructor(private readonly filePath: string) {}

  read(): DatabaseShape {
    this.ensureFile();
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return normalizeDatabase(JSON.parse(raw));
  }

  update<T>(mutator: (db: DatabaseShape) => T): T {
    const db = this.read();
    const result = mutator(db);
    db.updatedAt = new Date().toISOString();
    this.write(db);
    return result;
  }

  private ensureFile(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      this.write(emptyDatabase());
    }
  }

  private write(db: DatabaseShape): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempFile = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempFile, this.filePath);
  }
}

export const store = new JsonStore(env.dataFile);
