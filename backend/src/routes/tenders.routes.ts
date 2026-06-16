import { Router } from 'express';
import { getTenders, createTender, getTenderApplications } from '../controllers/tenders.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getTenders);
router.post('/', requireAuth, requireRole(['company', 'admin']), createTender);
router.get('/:id/applications', requireAuth, requireRole(['company', 'admin']), getTenderApplications);

export default router;
