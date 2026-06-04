import { Request, Response } from 'express';

export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { city, status, page = 1, limit = 10 } = req.query;
    
    // TODO: replace with DB query later
    res.json({
      success: true,
      data: [],
      pagination: { page, limit, total: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    res.json({ success: true, data: null, id });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const createIssue = async (req: Request, res: Response) => {
  try {
    const { city, location, type, description, lat, lng } = req.body;

    if (!city || !location || !type || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: city, location, type, description' 
      });
    }

    // TODO: save to DB, call AI service
    res.status(201).json({
      success: true,
      message: 'Issue created',
      data: { city, location, type, description, lat, lng }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'REPAIR_SUBMITTED', 'RESOLVED', 'UNDER_WARRANTY'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    res.json({ success: true, message: `Issue ${id} updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getIssueStats = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    res.json({
      success: true,
      data: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        underWarranty: 0,
        city: city || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};