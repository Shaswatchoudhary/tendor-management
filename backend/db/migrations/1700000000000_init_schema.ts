// @ts-ignore
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // UUID Extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Users Table
  pgm.createTable('users', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(50)', notNull: true }, // 'company', 'vendor', 'admin'
    company_name: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Tenders Table
  pgm.createTable('tenders', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    reference_number: { type: 'varchar(255)', notNull: true, unique: true },
    title: { type: 'varchar(255)', notNull: true },
    category: { type: 'varchar(100)', notNull: true },
    description: { type: 'text', notNull: true },
    budget_min: { type: 'numeric', notNull: true },
    budget_max: { type: 'numeric', notNull: true },
    deadline: { type: 'timestamp', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: 'draft' }, // 'active', 'closed', 'draft'
    required_documents: { type: 'jsonb', default: '[]' },
    eligibility_criteria: { type: 'jsonb', default: '[]' },
    created_by: { type: 'uuid', references: '"users"', notNull: true, onDelete: 'CASCADE' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Applications Table
  pgm.createTable('applications', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    tender_id: { type: 'uuid', references: '"tenders"', notNull: true, onDelete: 'CASCADE' },
    vendor_id: { type: 'uuid', references: '"users"', notNull: true, onDelete: 'CASCADE' },
    quoted_price: { type: 'numeric', notNull: true },
    timeline: { type: 'integer', notNull: true }, // in days
    turnover: { type: 'numeric' },
    gst: { type: 'varchar(50)' },
    pan: { type: 'varchar(50)' },
    year_established: { type: 'integer' },
    employees: { type: 'integer' },
    address: { type: 'text' },
    city: { type: 'varchar(100)' },
    state: { type: 'varchar(100)' },
    pin: { type: 'varchar(20)' },
    certifications: { type: 'jsonb', default: '[]' },
    references: { type: 'jsonb', default: '[]' },
    status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // 'pending', 'approved', 'rejected'
    ai_score: { type: 'numeric' },
    ai_verdict: { type: 'varchar(50)' }, // 'SELECTED', 'NOT_SELECTED', 'REVIEW'
    ai_summary: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Unique constraint so one vendor can apply only once to a tender
  pgm.addConstraint('applications', 'unique_tender_vendor', {
    unique: ['tender_id', 'vendor_id'],
  });

  // Documents Table
  pgm.createTable('documents', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    application_id: { type: 'uuid', references: '"applications"', notNull: true, onDelete: 'CASCADE' },
    doc_name: { type: 'varchar(255)', notNull: true },
    file_name: { type: 'varchar(255)', notNull: true },
    file_path: { type: 'varchar(255)', notNull: true },
    mime_type: { type: 'varchar(100)', notNull: true },
    size: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // OCR Results Table
  pgm.createTable('ocr_results', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true },
    document_id: { type: 'uuid', references: '"documents"', notNull: true, onDelete: 'CASCADE' },
    raw_text: { type: 'text', notNull: true },
    confidence: { type: 'numeric' },
    processed_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('ocr_results');
  pgm.dropTable('documents');
  pgm.dropTable('applications');
  pgm.dropTable('tenders');
  pgm.dropTable('users');
  pgm.dropExtension('uuid-ossp');
}
