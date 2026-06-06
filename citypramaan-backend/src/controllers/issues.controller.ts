import { Response } from 'express';
import { store } from '../db/json-store';
import { AuthRequest } from '../middleware/auth';
import { IssueRecord, IssueStatus, PublicUser, Severity } from '../types/domain';

const VALID_STATUSES: IssueStatus[] = [
  'OPEN',
  'PENDING_PROOF',
  'IN_PROGRESS',
  'ADMIN_APPROVED',
  'ASSIGNED_TO_CONTRACTOR',
  'WORK_ACCEPTED',
  'WORK_STARTED',
  'WORK_COMPLETED',
  'REPAIR_SUBMITTED',
  'REPAIR_REJECTED',
  'CITIZEN_DISPUTED',
  'RESOLVED',
  'UNDER_WARRANTY',
  'CLOSED',
];

export const getAllIssues = async (req: AuthRequest, res: Response) => {
  try {
    const { city, cityKey, status, type, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const cityFilter = cleanQuery(cityKey || city);
    const statusFilter = cleanQuery(status)?.toUpperCase();
    const typeFilter = cleanQuery(type)?.toLowerCase();
    let issues = store.read().issues.slice();

    if (cityFilter) {
      issues = issues.filter(
        (issue) =>
          issue.city.toLowerCase() === cityFilter.toLowerCase() ||
          issue.cityKey?.toLowerCase() === cityFilter.toLowerCase()
      );
    }

    if (statusFilter) {
      issues = issues.filter((issue) => issue.status === statusFilter);
    }

    if (typeFilter) {
      issues = issues.filter((issue) => issue.type.toLowerCase() === typeFilter);
    }

    issues.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const offset = (pageNumber - 1) * pageSize;

    res.json({
      success: true,
      data: issues.slice(offset, offset + pageSize),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: issues.length,
        pages: Math.ceil(issues.length / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getIssueById = async (req: AuthRequest, res: Response) => {
  try {
    const issue = store.read().issues.find((item) => item.id === req.params.id);

    if (!issue) {
      res.status(404).json({ success: false, error: 'Issue not found' });
      return;
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const createIssue = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const city = clean(req.body.city || req.body.cityKey);
    const location = clean(req.body.location || req.body.address);
    const type = clean(req.body.type || req.body.issueCategory || req.body.assetType);
    const description = clean(req.body.description || req.body.title || req.body.aiSummary);

    if (!city || !location || !type || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: city, location, type, description',
      });
      return;
    }

    const now = new Date().toISOString();
    const issue: IssueRecord = {
      id: clean(req.body.id) || cryptoId(),
      city,
      cityKey: clean(req.body.cityKey) || city,
      location,
      type,
      description,
      title: clean(req.body.title) || description.slice(0, 120),
      lat: toNumber(req.body.lat ?? req.body.latitude),
      lng: toNumber(req.body.lng ?? req.body.longitude),
      status: normalizeStatus(req.body.status) || 'OPEN',
      severity: normalizeSeverity(req.body.severity),
      confidence: toNumber(req.body.confidence),
      priorityScore: toNumber(req.body.priorityScore ?? req.body.aiPriorityScore),
      slaHours: toNumber(req.body.slaHours),
      citizenId: user.id,
      citizenName: user.name,
      citizenContact: user.contactNumber,
      warrantyStatus: 'NONE',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          at: now,
          byUserId: user.id,
          byRole: user.role,
          action: 'ISSUE_CREATED',
          toStatus: normalizeStatus(req.body.status) || 'OPEN',
        },
      ],
    };

    store.update((db) => {
      if (db.issues.some((item) => item.id === issue.id)) {
        issue.id = cryptoId();
      }
      db.issues.push(issue);
    });

    res.status(201).json({
      success: true,
      message: 'Issue created',
      data: issue,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateIssueStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const nextStatus = normalizeStatus(req.body.status);

    if (!nextStatus && !req.body.assignedContractorId && !req.body.contractor) {
      res.status(400).json({ success: false, error: 'status or assignment fields are required' });
      return;
    }

    const updated = store.update((db) => {
      const issue = db.issues.find((item) => item.id === req.params.id);

      if (!issue) return null;

      if (!canUpdateIssue(user, issue, db.contractors, nextStatus)) {
        return 'FORBIDDEN' as const;
      }

      const now = new Date().toISOString();
      const previousStatus = issue.status;
      const assignedContractorId = clean(req.body.assignedContractorId);
      const contractorName = clean(req.body.contractor);

      if (assignedContractorId) {
        issue.assignedContractorId = assignedContractorId;
        const contractor = db.contractors.find(
          (item) => item.contractorId === assignedContractorId || item.userId === assignedContractorId
        );
        issue.contractor = contractor?.name || contractorName || assignedContractorId;

        if (contractor && !contractor.assignedReports.includes(issue.id)) {
          contractor.assignedReports.push(issue.id);
          contractor.updatedAt = now;
        }
      } else if (contractorName) {
        issue.contractor = contractorName;
      }

      if (nextStatus) {
        issue.status = nextStatus;
      }

      issue.updatedAt = now;
      issue.history.push({
        at: now,
        byUserId: user.id,
        byRole: user.role,
        action: nextStatus ? 'STATUS_UPDATED' : 'ISSUE_UPDATED',
        note: clean(req.body.note || req.body.rejectionReason),
        fromStatus: previousStatus,
        toStatus: issue.status,
      });

      return issue;
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Issue not found' });
      return;
    }

    if (updated === 'FORBIDDEN') {
      res.status(403).json({ success: false, error: 'You cannot update this issue.' });
      return;
    }

    res.json({ success: true, message: `Issue ${req.params.id} updated`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getIssueStats = async (req: AuthRequest, res: Response) => {
  try {
    const city = cleanQuery(req.query.city || req.query.cityKey);
    const issues = store
      .read()
      .issues.filter((issue) => !city || issue.city === city || issue.cityKey === city);
    const byStatus = Object.fromEntries(VALID_STATUSES.map((status) => [status, 0])) as Record<IssueStatus, number>;

    for (const issue of issues) {
      byStatus[issue.status] += 1;
    }

    res.json({
      success: true,
      data: {
        total: issues.length,
        open: byStatus.OPEN,
        inProgress:
          byStatus.IN_PROGRESS +
          byStatus.ASSIGNED_TO_CONTRACTOR +
          byStatus.WORK_ACCEPTED +
          byStatus.WORK_STARTED,
        repairSubmitted: byStatus.REPAIR_SUBMITTED,
        resolved: byStatus.RESOLVED + byStatus.CLOSED,
        underWarranty: byStatus.UNDER_WARRANTY,
        byStatus,
        city: city || 'all',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

function canUpdateIssue(
  user: PublicUser,
  issue: IssueRecord,
  contractors: { contractorId: string; userId: string }[],
  nextStatus?: IssueStatus
): boolean {
  if (user.role === 'WARD_ADMIN') return true;

  if (user.role === 'CONTRACTOR') {
    const contractor = contractors.find((item) => item.userId === user.id);
    return Boolean(
      issue.assignedContractorId === user.id ||
        (contractor && issue.assignedContractorId === contractor.contractorId)
    );
  }

  return issue.citizenId === user.id && nextStatus === 'CITIZEN_DISPUTED';
}

function normalizeStatus(value: unknown): IssueStatus | undefined {
  const status = clean(value).toUpperCase() as IssueStatus;
  return VALID_STATUSES.includes(status) ? status : undefined;
}

function normalizeSeverity(value: unknown): Severity {
  const severity = clean(value).toLowerCase();
  if (severity === 'low') return 'Low';
  if (severity === 'high') return 'High';
  return 'Medium';
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanQuery(value: unknown): string {
  return Array.isArray(value) ? clean(value[0]) : clean(value);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cryptoId(): string {
  return `issue_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
