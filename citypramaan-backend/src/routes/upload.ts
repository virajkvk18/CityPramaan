import { Router, Response } from 'express';
import { upload } from '../middleware/upload';
import { uploadImageToIPFS, uploadProofBundle } from '../services/ipfs.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/issue-image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }

    const result = await uploadImageToIPFS(
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      cid: result.cid,
      url: result.url,
      message: 'Image permanently stored on IPFS'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'IPFS upload failed' });
  }
});

router.post('/proof-bundle', authMiddleware, upload.fields([
  { name: 'before', maxCount: 1 },
  { name: 'after', maxCount: 1 }
]), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { issueId } = req.body;

    if (!files?.before || !files?.after) {
      res.status(400).json({ error: 'Both before and after images required' });
      return;
    }

    if (!issueId) {
      res.status(400).json({ error: 'issueId is required' });
      return;
    }

    const result = await uploadProofBundle(
      files.before[0].buffer,
      files.after[0].buffer,
      issueId
    );

    res.json({
      success: true,
      cid: result.cid,
      url: result.url,
      proofHash: result.proofHash,
      message: 'Proof bundle stored on IPFS — ready for blockchain'
    });

  } catch (error) {
    console.error('Proof bundle error:', error);
    res.status(500).json({ success: false, error: 'Proof bundle upload failed' });
  }
});

export default router;