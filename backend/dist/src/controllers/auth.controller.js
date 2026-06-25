"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pool_1 = require("../db/pool");
const JWT_SECRET = process.env.JWT_SECRET || 'tms_super_secret_jwt_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const register = async (req, res) => {
    try {
        const { name, email, password, role, company_name } = req.body;
        // Check existing
        const existing = await (0, pool_1.query)('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        const result = await (0, pool_1.query)(`INSERT INTO users (name, email, password_hash, role, company_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company_name`, [name, email, hash, role, company_name]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await (0, pool_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = result.rows[0];
        const match = await bcrypt_1.default.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email, company_name: user.company_name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, company_name: user.company_name } });
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const result = await (0, pool_1.query)('SELECT id, name, email, role, company_name FROM users WHERE id = $1', [user.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getMe = getMe;
