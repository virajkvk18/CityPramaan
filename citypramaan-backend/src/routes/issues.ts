import { Router } from 'express';
import { getAllIssues, getIssueById, createIssue, updateIssueStatus, getIssueStats } from '../controllers/issues.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getAllIssues);
router.get('/stats', getIssueStats);
router.get('/:id', getIssueById);
router.post('/', authMiddleware, createIssue);
router.patch('/:id', authMiddleware, updateIssueStatus);

export default router;