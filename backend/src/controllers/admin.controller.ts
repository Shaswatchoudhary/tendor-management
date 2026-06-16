import { Request, Response } from 'express';
import { query } from '../db/pool';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tendersCount = await query('SELECT COUNT(*) FROM tenders');
    const applicationsCount = await query('SELECT COUNT(*) FROM applications');
    const usersCount = await query('SELECT COUNT(*) FROM users');

    res.json({
      tenders: parseInt(tendersCount.rows[0].count),
      applications: parseInt(applicationsCount.rows[0].count),
      users: parseInt(usersCount.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const updateTenderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE tenders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tender not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tender status' });
  }
};
