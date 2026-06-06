import { createHash, randomBytes, randomUUID } from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRole, StoredUser } from '../types/domain';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: AuthRole;
  name: string;
}

export function createAccessToken(user: StoredUser): string {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.accessTokenTtl as SignOptions['expiresIn'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as AccessTokenPayload;
}

export function createRefreshToken(): { id: string; token: string; tokenHash: string } {
  const id = randomUUID();
  const secret = randomBytes(48).toString('base64url');
  const token = `${id}.${secret}`;

  return {
    id,
    token,
    tokenHash: hashToken(token),
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
