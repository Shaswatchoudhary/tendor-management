import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, getDocumentOcr } from '../controllers/documents.controller';
import { requireAuth } from '../middleware/auth';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.OCR_UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024 }
});

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/:id/ocr', getDocumentOcr);

export default router;
