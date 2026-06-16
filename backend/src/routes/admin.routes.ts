import { Router } from 'express';
import { getDashboardStats, updateTenderStatus } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/dashboard', getDashboardStats);
router.patch('/tenders/:id/status', updateTenderStatus);

export default router;
