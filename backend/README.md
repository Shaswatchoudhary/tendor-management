# Tender Management System (TMS) Backend

This is the Node.js + Express backend for the TMS platform.

## Prerequisites

- PostgreSQL (running on port 5432)
- Node.js & npm

## Setup Instructions

1. Ensure PostgreSQL is running and create a database named `tms_db`:
   ```sql
   CREATE DATABASE tms_db;
   CREATE USER tms_user WITH ENCRYPTED PASSWORD 'tms_pass_2024';
   GRANT ALL PRIVILEGES ON DATABASE tms_db TO tms_user;
   ```

2. Configure environment variables.
   - Copy `.env.example` to `.env` if not already present.

3. Run migrations to setup the database schema:
   ```bash
   npm run migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start on port 3001.

## Scripts

- `npm run dev`: Starts the server in development mode using nodemon.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled JS code.
- `npm run migrate`: Runs the database migrations.
