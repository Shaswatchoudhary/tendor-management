"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenderApplications = exports.createTender = exports.getTenders = void 0;
const pool_1 = require("../db/pool");
const getTenders = async (req, res) => {
    try {
        const status = req.query.status;
        let result;
        if (status) {
            result = await (0, pool_1.query)('SELECT * FROM tenders WHERE status = $1 ORDER BY created_at DESC', [status]);
        }
        else {
            result = await (0, pool_1.query)('SELECT * FROM tenders ORDER BY created_at DESC');
        }
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tenders' });
    }
};
exports.getTenders = getTenders;
const createTender = async (req, res) => {
    try {
        const { reference_number, title, category, description, budget_min, budget_max, deadline, required_documents, eligibility_criteria } = req.body;
        const result = await (0, pool_1.query)(`INSERT INTO tenders (reference_number, title, category, description, budget_min, budget_max, deadline, required_documents, eligibility_criteria, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING *`, [reference_number, title, category, description, budget_min, budget_max, deadline, JSON.stringify(required_documents), JSON.stringify(eligibility_criteria), req.user.id]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create tender' });
    }
};
exports.createTender = createTender;
const getTenderApplications = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, pool_1.query)(`SELECT a.*, u.name as vendor_name, u.company_name as vendor_company 
       FROM applications a
       JOIN users u ON a.vendor_id = u.id
       WHERE a.tender_id = $1 ORDER BY a.created_at DESC`, [id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};
exports.getTenderApplications = getTenderApplications;
