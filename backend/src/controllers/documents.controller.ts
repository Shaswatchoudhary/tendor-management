import { Request, Response } from 'express';
import { query } from '../db/pool';
import { processDocumentOcr } from '../services/ocr.service';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { application_id, doc_name } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const result = await query(
      `INSERT INTO documents (application_id, doc_name, file_name, file_path, mime_type, size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [application_id && application_id !== 'null' && application_id !== 'undefined' ? application_id : null, doc_name, file.originalname, file.path, file.mimetype, file.size]
    );

    const doc = result.rows[0];

    // Trigger OCR processing synchronously
    const { rawText, confidence, verification } = await processDocumentOcr(doc.id, doc.file_path, doc.mime_type, doc_name);

    res.status(201).json({
      document: {
        id: doc.id,
        docName: doc.doc_name,
        fileName: doc.file_name,
        size: doc.size
      },
      ocr: {
        rawText,
        confidence
      },
      verification
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getDocumentOcr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ocr_results WHERE document_id = $1`, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'OCR result not found or processing' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OCR result' });
  }
};
