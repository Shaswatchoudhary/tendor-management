const runner = require('node-pg-migrate').runner;
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const runMigrations = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tms_db',
    user: process.env.DB_USER || 'tms_user',
    password: process.env.DB_PASSWORD || 'tms_pass_2024',
  });

  await client.connect();

  try {
    const dir = path.join(__dirname, 'migrations');
    console.log(`Running migrations from ${dir}...`);
    
    await runner({
      dbClient: client,
      direction: 'up',
      dir: dir,
      migrationsTable: 'pgmigrations',
      log: console.log,
    });

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runMigrations();
