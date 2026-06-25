"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner = require('node-pg-migrate').runner;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const runMigrations = async () => {
    const client = new pg_1.Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'tms_db',
        user: process.env.DB_USER || 'tms_user',
        password: process.env.DB_PASSWORD || 'tms_pass_2024',
    });
    await client.connect();
    try {
        const dir = path_1.default.join(__dirname, 'migrations');
        console.log(`Running migrations from ${dir}...`);
        await runner({
            dbClient: client,
            direction: 'up',
            dir: dir,
            migrationsTable: 'pgmigrations',
            log: console.log,
        });
        console.log('Migrations completed successfully.');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
};
runMigrations();
