import { Router, Request, Response } from 'express';

const router = Router();

// GET all issues (with city filter)
router.get('/', (req: Request, res: Response) => {
  const { city, status } = req.query;
  res.json({
    message: 'Get all issues',
    filters: { city, status },
    data: [] // will connect to DB later
  });
});

// GET single issue by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ message: `Get issue ${id}`, data: null });
});

// POST create new issue
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  res.json({ message: 'Issue created', data: body });
});

// PATCH update issue status
router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ message: `Issue ${id} updated` });
});

export default router;