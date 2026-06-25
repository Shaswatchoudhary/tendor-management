"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTenderStatus = exports.getDashboardStats = void 0;
const pool_1 = require("../db/pool");
const getDashboardStats = async (req, res) => {
    try {
        const tendersCount = await (0, pool_1.query)('SELECT COUNT(*) FROM tenders');
        const applicationsCount = await (0, pool_1.query)('SELECT COUNT(*) FROM applications');
        const usersCount = await (0, pool_1.query)('SELECT COUNT(*) FROM users');
        res.json({
            tenders: parseInt(tendersCount.rows[0].count),
            applications: parseInt(applicationsCount.rows[0].count),
            users: parseInt(usersCount.rows[0].count)
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const updateTenderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await (0, pool_1.query)(`UPDATE tenders SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Tender not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update tender status' });
    }
};
exports.updateTenderStatus = updateTenderStatus;
