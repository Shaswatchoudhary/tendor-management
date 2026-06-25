"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tms_db',
    user: process.env.DB_USER || 'tms_user',
    password: process.env.DB_PASSWORD || 'tms_pass_2024',
});
// Test DB Connection
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
const query = (text, params) => {
    return pool.query(text, params);
};
exports.query = query;
const getClient = () => {
    return pool.connect();
};
exports.getClient = getClient;
exports.default = pool;
