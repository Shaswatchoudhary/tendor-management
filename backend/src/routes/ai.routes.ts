import { Router } from 'express';
import { generateAIContent } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect this route so only authenticated users can invoke AI generation
router.post('/generate', requireAuth, generateAIContent);

export default router;
