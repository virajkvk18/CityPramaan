export type AuthRole = 'USER' | 'WARD_ADMIN' | 'CONTRACTOR';

export type IssueStatus =
  | 'OPEN'
  | 'PENDING_PROOF'
  | 'IN_PROGRESS'
  | 'ADMIN_APPROVED'
  | 'ASSIGNED_TO_CONTRACTOR'
  | 'WORK_ACCEPTED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'REPAIR_SUBMITTED'
  | 'REPAIR_REJECTED'
  | 'CITIZEN_DISPUTED'
  | 'RESOLVED'
  | 'UNDER_WARRANTY'
  | 'CLOSED';

export type Severity = 'Low' | 'Medium' | 'High';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  passwordHash?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  walletAddress?: string;
  address?: string;
  city?: string;
  ward?: string;
  department?: string;
  contractorLicense?: string;
  contractorIdentityNumber?: string;
  contractorArea?: string;
  contractorSpecialization?: string;
  agencyName?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Suspended';
  availabilityStatus?: 'Available' | 'Busy' | 'Offline';
  profileHash?: string;
  profileChainTxHash?: string;
  profileCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<StoredUser, 'passwordHash'>;

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  replacedByTokenId?: string;
  userAgent?: string;
  ip?: string;
}

export interface WalletChallengeRecord {
  id: string;
  walletAddress: string;
  nonce: string;
  message: string;
  requestedRole: AuthRole;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface EmailVerificationRecord {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  createdAt: string;
  usedAt?: string;
  sentAt?: string;
}

export interface IssueHistoryEvent {
  at: string;
  byUserId?: string;
  byRole?: AuthRole;
  action: string;
  note?: string;
  fromStatus?: IssueStatus;
  toStatus?: IssueStatus;
}

export interface IssueRecord {
  id: string;
  city: string;
  cityKey?: string;
  location: string;
  type: string;
  description: string;
  title: string;
  lat?: number;
  lng?: number;
  status: IssueStatus;
  severity: Severity;
  confidence?: number;
  priorityScore?: number;
  slaHours?: number;
  citizenId: string;
  citizenName: string;
  citizenContact: string;
  assignedContractorId?: string;
  contractor?: string;
  repairProofUrl?: string;
  repairNotes?: string;
  repairProofAt?: string;
  warrantyStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED';
  warrantyActivatedAt?: string;
  warrantyExpiresAt?: string;
  warrantyPeriodDays?: number;
  proofHash?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  history: IssueHistoryEvent[];
}

export interface ContractorRecord {
  contractorId: string;
  userId: string;
  name: string;
  identityNumber: string;
  email: string;
  phone: string;
  area: string;
  ward?: string;
  specialization: string;
  agencyName?: string;
  verificationStatus: 'Verified' | 'Pending' | 'Suspended';
  availabilityStatus: 'Available' | 'Busy' | 'Offline';
  assignedReports: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseShape {
  version: number;
  users: StoredUser[];
  refreshTokens: RefreshTokenRecord[];
  walletChallenges: WalletChallengeRecord[];
  emailVerifications: EmailVerificationRecord[];
  issues: IssueRecord[];
  contractors: ContractorRecord[];
  updatedAt: string;
}
