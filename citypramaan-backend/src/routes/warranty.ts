import { Router } from 'express';
import { getAllWarranties, submitProof, approveWarranty } from '../controllers/warranty.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', getAllWarranties);
router.post('/:issueId/submit-proof', authMiddleware, requireRoles('CONTRACTOR', 'WARD_ADMIN'), submitProof);
router.post('/:issueId/approve', authMiddleware, requireRoles('WARD_ADMIN'), approveWarranty);

export default router;
