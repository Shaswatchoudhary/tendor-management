import { Router } from 'express';
import { createApplication, getApplication, updateVerdict } from '../controllers/applications.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, requireRole(['vendor']), createApplication);
router.get('/:id', requireAuth, getApplication);
router.patch('/:id/verdict', requireAuth, requireRole(['company', 'admin']), updateVerdict);

export default router;
