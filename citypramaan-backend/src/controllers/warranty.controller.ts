import { createHash } from 'crypto';
import { Response } from 'express';
import { store } from '../db/json-store';
import { AuthRequest } from '../middleware/auth';

export const getAllWarranties = async (req: AuthRequest, res: Response) => {
  try {
    const city = clean(req.query.city || req.query.cityKey);
    const warranties = store
      .read()
      .issues.filter((issue) => {
        const cityMatches = !city || issue.city === city || issue.cityKey === city;
        return cityMatches && issue.warrantyStatus && issue.warrantyStatus !== 'NONE';
      })
      .map((issue) => ({
        issueId: issue.id,
        title: issue.title,
        city: issue.city,
        location: issue.location,
        status: issue.status,
        warrantyStatus: issue.warrantyStatus,
        warrantyActivatedAt: issue.warrantyActivatedAt,
        warrantyExpiresAt: issue.warrantyExpiresAt,
        warrantyPeriodDays: issue.warrantyPeriodDays,
        proofHash: issue.proofHash,
        txHash: issue.txHash,
        contractor: issue.contractor,
      }));

    res.json({ success: true, data: warranties, city: city || 'all' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const submitProof = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { issueId } = req.params;
    const proofImageUrl = clean(req.body.proofImageUrl || req.body.repairProofUrl);
    const repairNotes = clean(req.body.repairNotes || req.body.notes);
    const contractorId = clean(req.body.contractorId) || user.id;

    if (!proofImageUrl) {
      res.status(400).json({ success: false, error: 'proofImageUrl is required' });
      return;
    }

    const updated = store.update((db) => {
      const issue = db.issues.find((item) => item.id === issueId);
      if (!issue) return null;

      const contractor = db.contractors.find(
        (item) => item.contractorId === contractorId || item.userId === contractorId || item.userId === user.id
      );
      const isAssigned =
        user.role === 'WARD_ADMIN' ||
        issue.assignedContractorId === user.id ||
        (contractor && issue.assignedContractorId === contractor.contractorId);

      if (user.role === 'CONTRACTOR' && !isAssigned) {
        return 'FORBIDDEN' as const;
      }

      const now = new Date().toISOString();
      issue.repairProofUrl = proofImageUrl;
      issue.repairNotes = repairNotes;
      issue.repairProofAt = now;
      issue.assignedContractorId = contractor?.contractorId || issue.assignedContractorId || contractorId;
      issue.contractor = contractor?.name || issue.contractor || user.name;
      issue.status = 'REPAIR_SUBMITTED';
      issue.updatedAt = now;
      issue.history.push({
        at: now,
        byUserId: user.id,
        byRole: user.role,
        action: 'REPAIR_PROOF_SUBMITTED',
        note: repairNotes,
        toStatus: 'REPAIR_SUBMITTED',
      });

      return issue;
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Issue not found' });
      return;
    }

    if (updated === 'FORBIDDEN') {
      res.status(403).json({ success: false, error: 'This issue is not assigned to you.' });
      return;
    }

    res.json({ success: true, message: `Proof submitted for issue ${issueId}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const approveWarranty = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { issueId } = req.params;
    const warrantyPeriodDays = Math.max(1, Number(req.body.warrantyPeriodDays) || 365);
    const closureNote = clean(req.body.closureNote || req.body.note);

    const updated = store.update((db) => {
      const issue = db.issues.find((item) => item.id === issueId);
      if (!issue) return null;

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + warrantyPeriodDays);
      const proofHash = `0x${createHash('sha256')
        .update(`${issue.id}:${issue.repairProofUrl || ''}:${now.toISOString()}`)
        .digest('hex')}`;

      issue.status = 'UNDER_WARRANTY';
      issue.warrantyStatus = 'ACTIVE';
      issue.warrantyActivatedAt = now.toISOString();
      issue.warrantyExpiresAt = expiresAt.toISOString();
      issue.warrantyPeriodDays = warrantyPeriodDays;
      issue.proofHash = proofHash;
      issue.txHash = req.body.txHash || `local-${proofHash.slice(2, 18)}`;
      issue.updatedAt = now.toISOString();
      issue.history.push({
        at: now.toISOString(),
        byUserId: user.id,
        byRole: user.role,
        action: 'WARRANTY_APPROVED',
        note: closureNote,
        toStatus: 'UNDER_WARRANTY',
      });

      return issue;
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Issue not found' });
      return;
    }

    res.json({
      success: true,
      message: `Warranty activated for issue ${issueId}`,
      data: updated,
      txHash: updated.txHash,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
