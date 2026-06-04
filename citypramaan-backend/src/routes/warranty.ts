import { Router } from 'express';
import { getAllWarranties, submitProof, approveWarranty } from '../controllers/warranty.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getAllWarranties);
router.post('/:issueId/submit-proof', authMiddleware, submitProof);
router.post('/:issueId/approve', authMiddleware, approveWarranty);

export default router;