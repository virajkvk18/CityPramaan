import path from 'path';

function getCsv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

const jwtSecret =
  process.env.JWT_SECRET ||
  'dev-only-citypramaan-jwt-secret-change-before-production';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production.');
}

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using a development-only secret.');
}

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || 'data');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: getNumber('PORT', 5000),
  jwtSecret,
  jwtIssuer: process.env.JWT_ISSUER || 'citypramaan-backend',
  jwtAudience: process.env.JWT_AUDIENCE || 'citypramaan',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenDays: getNumber('REFRESH_TOKEN_DAYS', 30),
  emailVerificationTtlMinutes: getNumber('EMAIL_VERIFICATION_TTL_MINUTES', 15),
  emailVerificationMaxAttempts: getNumber('EMAIL_VERIFICATION_MAX_ATTEMPTS', 5),
  emailVerificationCodeLength: getNumber('EMAIL_VERIFICATION_CODE_LENGTH', 6),
  resendVerificationCooldownSeconds: getNumber('RESEND_VERIFICATION_COOLDOWN_SECONDS', 60),
  exposeDevVerificationCode: getBoolean('EXPOSE_DEV_VERIFICATION_CODE', true),
  walletChallengeMinutes: getNumber('WALLET_CHALLENGE_MINUTES', 10),
  corsOrigins: getCsv('CORS_ORIGIN', [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]),
  dataDir,
  dataFile: path.resolve(dataDir, process.env.DATA_FILE || 'citypramaan-db.json'),
  uploadsDir: path.resolve(dataDir, process.env.UPLOADS_DIR || 'uploads'),
  maxUploadBytes: getNumber('MAX_UPLOAD_BYTES', 8 * 1024 * 1024),
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
  adminInviteCode: process.env.ADMIN_INVITE_CODE || '',
  contractorInviteCode: process.env.CONTRACTOR_INVITE_CODE || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: getNumber('SMTP_PORT', 587),
  smtpSecure: getBoolean('SMTP_SECURE', false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'CityPramaan <no-reply@citypramaan.local>',
  smtpTimeoutMs: getNumber('SMTP_TIMEOUT_MS', 10000),
};

export function hasPinataConfig(): boolean {
  return Boolean(env.pinataApiKey && env.pinataSecretKey);
}

export function hasSmtpConfig(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}
