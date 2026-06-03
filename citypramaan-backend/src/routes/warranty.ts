import { Router, Request, Response } from 'express';

const router = Router();

// GET all warranties (public registry)
router.get('/', (req: Request, res: Response) => {
  const { city } = req.query;
  res.json({ message: 'Get warranties', city, data: [] });
});

// POST activate warranty (issuer approves)
router.post('/:issueId/approve', (req: Request, res: Response) => {
  const { issueId } = req.params;
  res.json({ message: `Warranty activated for ${issueId}` });
});

// POST contractor submits repair proof
router.post('/:issueId/submit-proof', (req: Request, res: Response) => {
  const { issueId } = req.params;
  res.json({ message: `Proof submitted for ${issueId}` });
});

export default router;