import { createHash, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import { store } from '../db/json-store';
import { EmailVerificationRecord, StoredUser } from '../types/domain';
import { HttpError } from '../utils/http-error';
import { sendVerificationEmail } from './email.service';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface EmailVerificationIssue {
  expiresAt: string;
  delivery: 'smtp' | 'console';
  devVerificationCode?: string;
}

export function normalizeEmailStrict(email?: string): string {
  const normalized = clean(email).toLowerCase();

  if (!normalized) {
    throw new HttpError(400, 'Email is required.', 'EMAIL_REQUIRED');
  }

  if (!isValidEmail(normalized)) {
    throw new HttpError(400, 'A valid email address is required.', 'INVALID_EMAIL');
  }

  return normalized;
}

export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const [localPart] = email.split('@');
  if (!localPart || localPart.length > 64 || localPart.includes('..')) return false;
  return EMAIL_PATTERN.test(email);
}

export async function issueEmailVerification(user: StoredUser): Promise<EmailVerificationIssue> {
  const pending = createVerificationRecord(user);

  store.update((db) => {
    const now = new Date();
    cleanupVerificationRecords(db.emailVerifications, now);
    invalidateActiveVerifications(db.emailVerifications, user.id, now);
    db.emailVerifications.push(pending.record);
  });

  const delivery = await sendVerificationEmail({
    email: user.email,
    name: user.name,
    code: pending.code,
    expiresAt: pending.record.expiresAt,
  });

  return {
    expiresAt: pending.record.expiresAt,
    delivery: delivery.delivery,
    devVerificationCode: delivery.devCodeExposed ? pending.code : undefined,
  };
}

export async function resendEmailVerification(emailInput?: string): Promise<EmailVerificationIssue & {
  alreadyVerified: boolean;
}> {
  const email = normalizeEmailStrict(emailInput);
  const prepared = store.update((db) => {
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      throw new HttpError(404, 'No account found for this email address.', 'USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      return {
        user,
        alreadyVerified: true,
        code: '',
        record: null,
      };
    }

    const now = new Date();
    cleanupVerificationRecords(db.emailVerifications, now);
    const latest = db.emailVerifications
      .filter((item) => item.userId === user.id && !item.usedAt)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

    if (latest?.sentAt) {
      const secondsSinceLastSend = (now.getTime() - Date.parse(latest.sentAt)) / 1000;
      if (secondsSinceLastSend < env.resendVerificationCooldownSeconds) {
        throw new HttpError(
          429,
          `Please wait ${Math.ceil(env.resendVerificationCooldownSeconds - secondsSinceLastSend)} seconds before requesting another code.`,
          'RESEND_COOLDOWN'
        );
      }
    }

    invalidateActiveVerifications(db.emailVerifications, user.id, now);
    const pending = createVerificationRecord(user);
    db.emailVerifications.push(pending.record);

    return {
      user,
      alreadyVerified: false,
      ...pending,
    };
  });

  if (prepared.alreadyVerified || !prepared.record) {
    return {
      alreadyVerified: true,
      expiresAt: new Date().toISOString(),
      delivery: 'console',
    };
  }

  const delivery = await sendVerificationEmail({
    email: prepared.user.email,
    name: prepared.user.name,
    code: prepared.code,
    expiresAt: prepared.record.expiresAt,
  });

  return {
    alreadyVerified: false,
    expiresAt: prepared.record.expiresAt,
    delivery: delivery.delivery,
    devVerificationCode: delivery.devCodeExposed ? prepared.code : undefined,
  };
}

export function hashVerificationCode(recordId: string, email: string, code: string): string {
  return createHash('sha256')
    .update(`${recordId}:${email}:${code}:${env.jwtSecret}`)
    .digest('hex');
}

export function codesMatch(expectedHash: string, candidateHash: string): boolean {
  const expected = Buffer.from(expectedHash, 'hex');
  const candidate = Buffer.from(candidateHash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function createVerificationRecord(user: StoredUser): {
  code: string;
  record: EmailVerificationRecord;
} {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.emailVerificationTtlMinutes * 60_000);
  const code = createOtpCode(env.emailVerificationCodeLength);
  const id = randomUUID();

  return {
    code,
    record: {
      id,
      userId: user.id,
      email: user.email,
      codeHash: hashVerificationCode(id, user.email, code),
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      createdAt: now.toISOString(),
      sentAt: now.toISOString(),
    },
  };
}

function createOtpCode(length: number): string {
  const normalizedLength = Math.min(10, Math.max(4, length));
  const min = 10 ** (normalizedLength - 1);
  const max = 10 ** normalizedLength;
  return String(randomInt(min, max));
}

function cleanupVerificationRecords(records: EmailVerificationRecord[], now: Date): void {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;

  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    const expiredLongAgo = Date.parse(record.expiresAt) < cutoff;
    const usedLongAgo = record.usedAt && Date.parse(record.usedAt) < cutoff;

    if (expiredLongAgo || usedLongAgo) {
      records.splice(index, 1);
    }
  }
}

function invalidateActiveVerifications(records: EmailVerificationRecord[], userId: string, now: Date): void {
  for (const record of records) {
    if (record.userId === userId && !record.usedAt) {
      record.usedAt = now.toISOString();
    }
  }
}

function clean(value?: string): string {
  return typeof value === 'string' ? value.trim() : '';
}
