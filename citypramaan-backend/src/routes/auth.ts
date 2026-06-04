import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const token = jwt.sign(
      { walletAddress, role: 'CITIZEN' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, walletAddress, role: 'CITIZEN' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;