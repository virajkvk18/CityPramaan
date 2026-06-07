import { Router, Response } from 'express';
import { store } from '../db/json-store';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { ContractorRecord } from '../types/domain';

const router = Router();
const availabilityValues = ['Available', 'Busy', 'Offline'];

router.get('/', (req, res) => {
  const specialization = clean(req.query.specialization).toLowerCase();
  const ward = clean(req.query.ward).toLowerCase();
  const availability = clean(req.query.availability);
  let contractors = store.read().contractors.slice();

  if (specialization) {
    contractors = contractors.filter((item) => item.specialization.toLowerCase() === specialization);
  }

  if (ward) {
    contractors = contractors.filter((item) => item.ward?.toLowerCase() === ward);
  }

  if (availability) {
    contractors = contractors.filter((item) => item.availabilityStatus === availability);
  }

  contractors.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, data: contractors, count: contractors.length });
});

router.post('/', (req, res) => {
  const contractorId = clean(req.body?.contractorId || req.body?.identityNumber);
  const name = clean(req.body?.name);

  if (!contractorId || !name) {
    res.status(400).json({
      success: false,
      error: 'contractorId and name are required.',
    });
    return;
  }

  const now = new Date().toISOString();
  const updated = store.update((db) => {
    const existing = db.contractors.find((item) => item.contractorId === contractorId);
    const contractor: ContractorRecord = {
      contractorId,
      userId: clean(req.body?.userId) || existing?.userId || '',
      name,
      identityNumber: clean(req.body?.identityNumber) || contractorId,
      email: clean(req.body?.email) || existing?.email || '',
      phone: clean(req.body?.phone) || existing?.phone || '+91 demo contractor',
      area: clean(req.body?.area) || existing?.area || 'City service area',
      ward: clean(req.body?.ward) || existing?.ward,
      specialization: clean(req.body?.specialization) || existing?.specialization || 'GENERAL',
      agencyName: clean(req.body?.agencyName) || existing?.agencyName || 'Independent contractor',
      verificationStatus: normalizeVerificationStatus(req.body?.verificationStatus) || existing?.verificationStatus || 'Verified',
      availabilityStatus: normalizeAvailabilityStatus(req.body?.availabilityStatus) || existing?.availabilityStatus || 'Available',
      assignedReports: Array.isArray(req.body?.assignedReports)
        ? req.body.assignedReports.map(String)
        : existing?.assignedReports || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, contractor);
      return existing;
    }

    db.contractors.push(contractor);
    return contractor;
  });

  res.status(201).json({ success: true, data: updated, contractor: updated });
});

router.get('/:id', (req, res) => {
  const contractor = store
    .read()
    .contractors.find((item) => item.contractorId === req.params.id || item.userId === req.params.id);

  if (!contractor) {
    res.status(404).json({ success: false, error: 'Contractor not found' });
    return;
  }

  res.json({ success: true, data: contractor });
});

router.patch(
  '/:id/availability',
  authMiddleware,
  requireRoles('CONTRACTOR', 'WARD_ADMIN'),
  (req: AuthRequest, res: Response) => {
    const availabilityStatus = clean(req.body.availabilityStatus);

    if (!availabilityValues.includes(availabilityStatus)) {
      res.status(400).json({
        success: false,
        error: `availabilityStatus must be one of: ${availabilityValues.join(', ')}`,
      });
      return;
    }

    const updated = store.update((db) => {
      const contractor = db.contractors.find(
        (item) => item.contractorId === req.params.id || item.userId === req.params.id
      );

      if (!contractor) return null;
      if (req.user!.role === 'CONTRACTOR' && contractor.userId !== req.user!.id) {
        return 'FORBIDDEN' as const;
      }

      contractor.availabilityStatus = availabilityStatus as any;
      contractor.updatedAt = new Date().toISOString();

      const user = db.users.find((item) => item.id === contractor.userId);
      if (user) {
        user.availabilityStatus = contractor.availabilityStatus;
        user.updatedAt = contractor.updatedAt;
      }

      return contractor;
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Contractor not found' });
      return;
    }

    if (updated === 'FORBIDDEN') {
      res.status(403).json({ success: false, error: 'You can only update your own availability.' });
      return;
    }

    res.json({ success: true, data: updated });
  }
);

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeVerificationStatus(value: unknown): ContractorRecord['verificationStatus'] | undefined {
  const status = clean(value);
  if (status === 'Verified' || status === 'Pending' || status === 'Suspended') return status;
  return undefined;
}

function normalizeAvailabilityStatus(value: unknown): ContractorRecord['availabilityStatus'] | undefined {
  const status = clean(value);
  if (status === 'Available' || status === 'Busy' || status === 'Offline') return status;
  return undefined;
}

export default router;
