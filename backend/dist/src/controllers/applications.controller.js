"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVerdict = exports.getApplication = exports.createApplication = void 0;
const pool_1 = require("../db/pool");
const createApplication = async (req, res) => {
    try {
        const { tender_id, quoted_price, timeline, turnover, gst, pan, year_established, employees, address, city, state, pin, certifications, references } = req.body;
        const result = await (0, pool_1.query)(`INSERT INTO applications (
        tender_id, vendor_id, quoted_price, timeline, turnover, gst, pan, 
        year_established, employees, address, city, state, pin, 
        certifications, "references", status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending') RETURNING *`, [
            tender_id, req.user.id, quoted_price, timeline, turnover, gst, pan,
            year_established, employees, address, city, state, pin,
            JSON.stringify(certifications || []), JSON.stringify(references || [])
        ]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create application error:', err);
        res.status(500).json({ error: 'Failed to submit application', details: err.message });
    }
};
exports.createApplication = createApplication;
const getApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, pool_1.query)(`SELECT a.*, u.name as vendor_name, u.company_name as vendor_company 
       FROM applications a
       JOIN users u ON a.vendor_id = u.id
       WHERE a.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch application' });
    }
};
exports.getApplication = getApplication;
const updateVerdict = async (req, res) => {
    try {
        const { id } = req.params;
        const { verdict } = req.body; // 'SELECTED', 'NOT_SELECTED', 'REVIEW'
        const result = await (0, pool_1.query)(`UPDATE applications SET ai_verdict = $1 WHERE id = $2 RETURNING *`, [verdict, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update verdict' });
    }
};
exports.updateVerdict = updateVerdict;
