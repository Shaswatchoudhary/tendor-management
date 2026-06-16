import { Request, Response } from 'express';
import { query } from '../db/pool';

export const createApplication = async (req: any, res: Response): Promise<void> => {
  try {
    const { 
      tender_id, quoted_price, timeline, turnover, gst, pan, 
      year_established, employees, address, city, state, pin, 
      certifications, references 
    } = req.body;

    const result = await query(
      `INSERT INTO applications (
        tender_id, vendor_id, quoted_price, timeline, turnover, gst, pan, 
        year_established, employees, address, city, state, pin, 
        certifications, "references", status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending') RETURNING *`,
      [
        tender_id, req.user.id, quoted_price, timeline, turnover, gst, pan, 
        year_established, employees, address, city, state, pin, 
        JSON.stringify(certifications || []), JSON.stringify(references || [])
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ error: 'Failed to submit application', details: (err as any).message });
  }
};

export const getApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT a.*, u.name as vendor_name, u.company_name as vendor_company 
       FROM applications a
       JOIN users u ON a.vendor_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

export const updateVerdict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { verdict } = req.body; // 'SELECTED', 'NOT_SELECTED', 'REVIEW'

    const result = await query(
      `UPDATE applications SET ai_verdict = $1 WHERE id = $2 RETURNING *`,
      [verdict, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update verdict' });
  }
};
