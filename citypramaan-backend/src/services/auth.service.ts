import { createHash, randomBytes, randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env';
import { store } from '../db/json-store';
import {
  AuthRole,
  ContractorRecord,
  DatabaseShape,
  PublicUser,
  StoredUser,
  WalletChallengeRecord,
} from '../types/domain';
import { HttpError } from '../utils/http-error';
import { hashPassword, verifyPassword } from './password.service';
import {
  addDays,
  createAccessToken,
  createRefreshToken,
  hashToken,
} from './token.service';
import {
  codesMatch,
  hashVerificationCode,
  issueEmailVerification,
  normalizeEmailStrict,
} from './email-verification.service';

const VALID_ROLES: AuthRole[] = ['USER', 'WARD_ADMIN', 'CONTRACTOR'];

export interface AuthMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface RegistrationResult {
  user: PublicUser;
  emailVerificationRequired: true;
  verificationExpiresAt: string;
  delivery: 'smtp' | 'console';
  devVerificationCode?: string;
}

export interface RegisterInput {
  email?: string;
  password?: string;
  name?: string;
  contactNumber?: string;
  role?: string;
  inviteCode?: string;
  walletAddress?: string;
  address?: string;
  city?: string;
  ward?: string;
  department?: string;
  contractorLicense?: string;
  contractorIdentityNumber?: string;
  contractorArea?: string;
  contractorWard?: string;
  contractorSpecialization?: string;
  agencyName?: string;
}

export interface LoginInput {
  email?: string;
  password?: string;
}

export async function registerUser(input: RegisterInput): Promise<RegistrationResult> {
  const email = normalizeEmailStrict(input.email);
  const password = input.password || '';
  const role = normalizeRole(input.role);

  if (!input.name?.trim()) throw new HttpError(400, 'Name is required.', 'NAME_REQUIRED');
  if (!input.contactNumber?.trim()) {
    throw new HttpError(400, 'Contact number is required.', 'CONTACT_REQUIRED');
  }
  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters.', 'WEAK_PASSWORD');
  }

  assertInviteCode(role, input.inviteCode);

  const user = store.update((db) => {
    if (db.users.some((user) => user.email === email)) {
      throw new HttpError(409, 'An account already exists with this email address.', 'EMAIL_EXISTS');
    }

    const now = new Date().toISOString();
    const userBase: StoredUser = {
      id: randomUUID(),
      email,
      name: input.name!.trim(),
      contactNumber: input.contactNumber!.trim(),
      role,
      passwordHash: hashPassword(password),
      emailVerified: false,
      walletAddress: normalizeOptionalWallet(input.walletAddress) || createProfileWallet(email),
      address: clean(input.address),
      city: clean(input.city),
      ward: clean(input.contractorWard) || clean(input.ward),
      department: clean(input.department),
      contractorLicense: clean(input.contractorLicense),
      contractorIdentityNumber: clean(input.contractorIdentityNumber),
      contractorArea: clean(input.contractorArea),
      contractorSpecialization: clean(input.contractorSpecialization),
      agencyName: clean(input.agencyName),
      verificationStatus: role === 'CONTRACTOR' ? 'Verified' : undefined,
      availabilityStatus: role === 'CONTRACTOR' ? 'Available' : undefined,
      createdAt: now,
      updatedAt: now,
    };
    const user: StoredUser = {
      ...userBase,
      ...createProfileProof(userBase),
    };

    db.users.push(user);

    return user;
  });

  let verification;

  try {
    verification = await issueEmailVerification(user);
  } catch (error) {
    store.update((db) => {
      db.users = db.users.filter((item) => item.id !== user.id);
      db.emailVerifications = db.emailVerifications.filter((item) => item.userId !== user.id);
      db.contractors = db.contractors.filter((item) => item.userId !== user.id);
    });
    throw error;
  }

  return {
    user: toPublicUser(user),
    emailVerificationRequired: true,
    verificationExpiresAt: verification.expiresAt,
    delivery: verification.delivery,
    devVerificationCode: verification.devVerificationCode,
  };
}

export function loginUser(input: LoginInput, meta: AuthMeta = {}): AuthResult {
  const email = normalizeEmailStrict(input.email);

  if (!input.password) {
    throw new HttpError(400, 'Password is required.', 'PASSWORD_REQUIRED');
  }

  return store.update((db) => {
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      throw new HttpError(404, 'No account found for this email address.', 'USER_NOT_FOUND');
    }

    if (!verifyPassword(input.password!, user.passwordHash)) {
      throw new HttpError(401, 'Incorrect password.', 'INVALID_PASSWORD');
    }

    assertEmailVerified(user);
    upsertContractorForUser(db, user);
    return createAuthResult(db, user, meta);
  });
}

export function refreshSession(refreshToken: string, meta: AuthMeta = {}): AuthResult {
  if (!refreshToken) {
    throw new HttpError(400, 'Refresh token is required.', 'REFRESH_TOKEN_REQUIRED');
  }

  return store.update((db) => {
    const tokenHash = hashToken(refreshToken);
    const record = db.refreshTokens.find((item) => item.tokenHash === tokenHash);
    const now = new Date();

    if (!record || record.revokedAt) {
      throw new HttpError(401, 'Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
    }

    if (new Date(record.expiresAt).getTime() <= now.getTime()) {
      record.revokedAt = now.toISOString();
      throw new HttpError(401, 'Refresh token expired.', 'REFRESH_TOKEN_EXPIRED');
    }

    const user = db.users.find((item) => item.id === record.userId);
    if (!user) {
      record.revokedAt = now.toISOString();
      throw new HttpError(401, 'Refresh token user no longer exists.', 'USER_MISSING');
    }

    assertEmailVerified(user);
    record.revokedAt = now.toISOString();
    const result = createAuthResult(db, user, meta);
    const replacement = db.refreshTokens[db.refreshTokens.length - 1];
    record.replacedByTokenId = replacement?.id;

    return result;
  });
}

export function verifyEmailCode(input: {
  email?: string;
  code?: string;
}, meta: AuthMeta = {}): AuthResult {
  const email = normalizeEmailStrict(input.email);
  const code = clean(input.code);

  if (!/^\d{4,10}$/.test(code)) {
    throw new HttpError(400, 'A valid numeric verification code is required.', 'INVALID_VERIFICATION_CODE');
  }

  const result = store.update((db) => {
    const now = new Date();
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      return { status: 'USER_NOT_FOUND' as const };
    }

    if (user.emailVerified) {
      upsertContractorForUser(db, user);
      return { status: 'OK' as const, auth: createAuthResult(db, user, meta) };
    }

    const record = db.emailVerifications
      .filter((item) => item.userId === user.id && item.email === email && !item.usedAt)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

    if (!record) {
      return { status: 'NO_ACTIVE_CODE' as const };
    }

    if (Date.parse(record.expiresAt) <= now.getTime()) {
      record.usedAt = now.toISOString();
      return { status: 'CODE_EXPIRED' as const };
    }

    if (record.attempts >= env.emailVerificationMaxAttempts) {
      record.usedAt = now.toISOString();
      return { status: 'TOO_MANY_ATTEMPTS' as const };
    }

    const candidateHash = hashVerificationCode(record.id, email, code);
    if (!codesMatch(record.codeHash, candidateHash)) {
      record.attempts += 1;
      if (record.attempts >= env.emailVerificationMaxAttempts) {
        record.usedAt = now.toISOString();
        return { status: 'TOO_MANY_ATTEMPTS' as const };
      }
      return { status: 'INVALID_CODE' as const };
    }

    record.usedAt = now.toISOString();
    user.emailVerified = true;
    user.emailVerifiedAt = now.toISOString();
    user.updatedAt = now.toISOString();
    Object.assign(user, createProfileProof(user));
    upsertContractorForUser(db, user);

    return { status: 'OK' as const, auth: createAuthResult(db, user, meta) };
  });

  switch (result.status) {
    case 'OK':
      return result.auth;
    case 'USER_NOT_FOUND':
      throw new HttpError(404, 'No account found for this email address.', 'USER_NOT_FOUND');
    case 'NO_ACTIVE_CODE':
      throw new HttpError(404, 'No active verification code found. Request a new code.', 'NO_ACTIVE_CODE');
    case 'CODE_EXPIRED':
      throw new HttpError(410, 'Verification code expired. Request a new code.', 'CODE_EXPIRED');
    case 'TOO_MANY_ATTEMPTS':
      throw new HttpError(429, 'Too many incorrect attempts. Request a new verification code.', 'TOO_MANY_ATTEMPTS');
    case 'INVALID_CODE':
    default:
      throw new HttpError(401, 'Incorrect verification code.', 'INVALID_CODE');
  }
}

export function logoutSession(refreshToken?: string): void {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);

  store.update((db) => {
    const record = db.refreshTokens.find((item) => item.tokenHash === tokenHash);
    if (record && !record.revokedAt) {
      record.revokedAt = new Date().toISOString();
    }
  });
}

export function getPublicUserById(userId: string): PublicUser | null {
  const user = store.read().users.find((item) => item.id === userId);
  return user ? toPublicUser(user) : null;
}

export function updateUserProfile(userId: string, changes: Partial<RegisterInput>): PublicUser {
  return store.update((db) => {
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new HttpError(404, 'User not found.', 'USER_NOT_FOUND');

    const allowedStringFields: Array<keyof StoredUser> = [
      'name',
      'contactNumber',
      'walletAddress',
      'address',
      'city',
      'ward',
      'department',
      'contractorLicense',
      'contractorIdentityNumber',
      'contractorArea',
      'contractorSpecialization',
      'agencyName',
    ];

    for (const field of allowedStringFields) {
      const value = changes[field as keyof RegisterInput];
      if (typeof value === 'string') {
        (user as any)[field] = field === 'walletAddress' ? normalizeOptionalWallet(value) : value.trim();
      }
    }

    if (changes.contractorWard) user.ward = changes.contractorWard.trim();
    user.updatedAt = new Date().toISOString();
    Object.assign(user, createProfileProof(user));
    upsertContractorForUser(db, user);

    return toPublicUser(user);
  });
}

export function createWalletChallenge(walletAddress: string, roleInput?: string): WalletChallengeRecord {
  const normalizedWallet = normalizeWallet(walletAddress);
  const requestedRole = normalizeRole(roleInput);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.walletChallengeMinutes * 60 * 1000);
  const nonce = randomBytes(16).toString('hex');
  const message = [
    'CityPramaan wallet login',
    `Wallet: ${normalizedWallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${now.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`,
  ].join('\n');

  const challenge: WalletChallengeRecord = {
    id: randomUUID(),
    walletAddress: normalizedWallet,
    nonce,
    message,
    requestedRole,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  store.update((db) => {
    db.walletChallenges = db.walletChallenges.filter((item) => {
      const expired = new Date(item.expiresAt).getTime() <= now.getTime();
      return !expired && !item.usedAt;
    });
    db.walletChallenges.push(challenge);
  });

  return challenge;
}

export function verifyWalletLogin(input: {
  walletAddress?: string;
  signature?: string;
  message?: string;
}, meta: AuthMeta = {}): AuthResult {
  if (!input.walletAddress || !input.signature || !input.message) {
    throw new HttpError(400, 'walletAddress, signature, and message are required.', 'WALLET_FIELDS_REQUIRED');
  }

  const normalizedWallet = normalizeWallet(input.walletAddress);
  let recovered: string;

  try {
    recovered = ethers.getAddress(ethers.verifyMessage(input.message, input.signature));
  } catch {
    throw new HttpError(401, 'Invalid wallet signature.', 'INVALID_WALLET_SIGNATURE');
  }

  if (recovered !== normalizedWallet) {
    throw new HttpError(401, 'Wallet signature does not match the requested wallet.', 'WALLET_MISMATCH');
  }

  return store.update((db) => {
    const now = new Date();
    const challenge = db.walletChallenges.find(
      (item) =>
        item.walletAddress === normalizedWallet &&
        item.message === input.message &&
        !item.usedAt
    );

    if (!challenge) {
      throw new HttpError(401, 'No active wallet challenge found. Request a new challenge first.', 'CHALLENGE_REQUIRED');
    }

    if (new Date(challenge.expiresAt).getTime() <= now.getTime()) {
      challenge.usedAt = now.toISOString();
      throw new HttpError(401, 'Wallet challenge expired.', 'CHALLENGE_EXPIRED');
    }

    challenge.usedAt = now.toISOString();
    let user = db.users.find((item) => item.walletAddress === normalizedWallet);

    if (!user) {
      const walletSeed = normalizedWallet.toLowerCase();
      const userBase: StoredUser = {
        id: randomUUID(),
        email: `${walletSeed.slice(2)}@wallet.citypramaan.local`,
        name: `Wallet ${normalizedWallet.slice(0, 6)}...${normalizedWallet.slice(-4)}`,
        contactNumber: '',
        role: challenge.requestedRole,
        walletAddress: normalizedWallet,
        emailVerified: true,
        emailVerifiedAt: now.toISOString(),
        verificationStatus: challenge.requestedRole === 'CONTRACTOR' ? 'Verified' : undefined,
        availabilityStatus: challenge.requestedRole === 'CONTRACTOR' ? 'Available' : undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      user = { ...userBase, ...createProfileProof(userBase) };
      db.users.push(user);
    }

    upsertContractorForUser(db, user);
    return createAuthResult(db, user, meta);
  });
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash, ...publicUser } = user;
  void passwordHash;
  return publicUser;
}

export function normalizeRole(roleInput?: string, fallback: AuthRole = 'USER'): AuthRole {
  const role = (roleInput || fallback).toUpperCase();
  if (role === 'CITIZEN') return 'USER';
  if (VALID_ROLES.includes(role as AuthRole)) return role as AuthRole;
  throw new HttpError(400, 'Invalid role.', 'INVALID_ROLE');
}

function createAuthResult(db: DatabaseShape, user: StoredUser, meta: AuthMeta): AuthResult {
  assertEmailVerified(user);
  const refresh = createRefreshToken();
  const expiresAt = addDays(new Date(), env.refreshTokenDays).toISOString();

  db.refreshTokens.push({
    id: refresh.id,
    userId: user.id,
    tokenHash: refresh.tokenHash,
    expiresAt,
    createdAt: new Date().toISOString(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenTtl,
  };
}

function assertEmailVerified(user: StoredUser): void {
  if (!user.emailVerified) {
    throw new HttpError(403, 'Please verify your email before logging in.', 'EMAIL_NOT_VERIFIED');
  }
}

function upsertContractorForUser(db: DatabaseShape, user: StoredUser): void {
  if (user.role !== 'CONTRACTOR') return;

  const now = new Date().toISOString();
  const contractorId =
    clean(user.contractorIdentityNumber) ||
    clean(user.contractorLicense) ||
    `CTR-${Math.abs(hashNumber(user.email)).toString().padStart(4, '0').slice(0, 4)}`;
  const existing = db.contractors.find(
    (item) => item.userId === user.id || item.contractorId === contractorId
  );
  const contractor: ContractorRecord = {
    contractorId,
    userId: user.id,
    name: user.name,
    identityNumber: contractorId,
    email: user.email,
    phone: user.contactNumber || '+91 demo contractor',
    area: clean(user.contractorArea) || clean(user.address) || clean(user.city) || 'City service area',
    ward: clean(user.ward),
    specialization: clean(user.contractorSpecialization) || 'GENERAL',
    agencyName: clean(user.agencyName) || 'Independent contractor',
    verificationStatus: user.verificationStatus || 'Verified',
    availabilityStatus: user.availabilityStatus || 'Available',
    assignedReports: existing?.assignedReports || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existing) {
    Object.assign(existing, contractor);
  } else {
    db.contractors.push(contractor);
  }
}

function assertInviteCode(role: AuthRole, inviteCode?: string): void {
  if (role === 'WARD_ADMIN' && env.adminInviteCode && inviteCode !== env.adminInviteCode) {
    throw new HttpError(403, 'A valid ward admin invite code is required.', 'ADMIN_INVITE_REQUIRED');
  }

  if (role === 'CONTRACTOR' && env.contractorInviteCode && inviteCode !== env.contractorInviteCode) {
    throw new HttpError(403, 'A valid contractor invite code is required.', 'CONTRACTOR_INVITE_REQUIRED');
  }
}

function createProfileProof(user: StoredUser): Pick<StoredUser, 'profileHash' | 'profileChainTxHash'> {
  const profileHash = hashText(
    [
      user.id,
      user.email,
      user.emailVerified,
      user.emailVerifiedAt,
      user.name,
      user.contactNumber,
      user.role,
      user.walletAddress,
      user.address,
      user.city,
      user.ward,
      user.department,
      user.contractorLicense,
      user.contractorIdentityNumber,
      user.contractorArea,
      user.contractorSpecialization,
      user.agencyName,
      user.verificationStatus,
      user.availabilityStatus,
      user.updatedAt,
    ].join('|')
  );

  return {
    profileHash,
    profileChainTxHash: `${profileHash.slice(0, 14)}...${profileHash.slice(-8)}`,
  };
}

function createProfileWallet(seed: string): string {
  const hash = hashText(`profile-wallet:${seed}`);
  return `0x${hash.slice(2, 10)}...${hash.slice(-6)}`;
}

function hashText(value: string): string {
  return `0x${createHash('sha256').update(value).digest('hex')}`;
}

function hashNumber(value: string): number {
  return Array.from(value).reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}

function normalizeWallet(walletAddress: string): string {
  if (!ethers.isAddress(walletAddress)) {
    throw new HttpError(400, 'Invalid wallet address.', 'INVALID_WALLET');
  }

  return ethers.getAddress(walletAddress);
}

function normalizeOptionalWallet(walletAddress?: string): string | undefined {
  if (!walletAddress) return undefined;
  return normalizeWallet(walletAddress);
}

function clean(value?: string): string {
  return typeof value === 'string' ? value.trim() : '';
}
