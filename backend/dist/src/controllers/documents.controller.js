"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentOcr = exports.uploadDocument = void 0;
const pool_1 = require("../db/pool");
const ocr_service_1 = require("../services/ocr.service");
const uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { application_id, doc_name } = req.body;
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const result = await (0, pool_1.query)(`INSERT INTO documents (application_id, doc_name, file_name, file_path, mime_type, size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [application_id && application_id !== 'null' && application_id !== 'undefined' ? application_id : null, doc_name, file.originalname, file.path, file.mimetype, file.size]);
        const doc = result.rows[0];
        // Trigger OCR processing synchronously
        const { rawText, confidence, verification } = await (0, ocr_service_1.processDocumentOcr)(doc.id, doc.file_path, doc.mime_type, doc_name);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to upload document' });
    }
};
exports.uploadDocument = uploadDocument;
const getDocumentOcr = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, pool_1.query)(`SELECT * FROM ocr_results WHERE document_id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'OCR result not found or processing' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch OCR result' });
    }
};
exports.getDocumentOcr = getDocumentOcr;
