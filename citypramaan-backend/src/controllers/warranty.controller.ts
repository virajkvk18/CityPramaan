import { Request, Response } from 'express';

export const getAllWarranties = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    res.json({ success: true, data: [], city: city || 'all' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const submitProof = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { proofImageUrl, contractorId } = req.body;

    if (!proofImageUrl || !contractorId) {
      return res.status(400).json({ success: false, error: 'Missing proof image or contractor ID' });
    }

    res.json({ success: true, message: `Proof submitted for issue ${issueId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const approveWarranty = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    // TODO: call blockchain service here
    res.json({
      success: true,
      message: `Warranty activated for issue ${issueId}`,
      txHash: 'pending_blockchain'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};