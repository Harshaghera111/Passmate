// db.js — Knex + SQLite3 database layer
import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
// On Vercel: use /tmp (writable). Locally: use file beside db.js
const DB_PATH = process.env.VERCEL ? '/tmp/passmate.db' : join(__dirname, 'passmate.db');

export const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
});

// ─── Schema Migration ────────────────────────────────────────────────────────

export async function setupSchema() {
  // Hostels
  if (!(await db.schema.hasTable('hostels'))) {
    await db.schema.createTable('hostels', t => {
      t.string('id').primary();
      t.string('name').notNullable();
      t.enu('type', ['boys', 'girls']).notNullable();
      t.string('block');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Users
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', t => {
      t.string('id').primary();
      t.string('usn').unique();
      t.string('name').notNullable();
      t.enu('role', ['student', 'warden', 'guard', 'admin']).notNullable();
      t.string('mobile').notNullable();
      t.string('email');
      t.string('parent_mobile');
      t.string('hostel_id').references('id').inTable('hostels');
      t.string('room');
      t.string('branch');
      t.integer('year');
      t.string('password_hash');
      t.integer('violations').defaultTo(0);
      t.integer('total_passes').defaultTo(0);
      t.integer('on_time_returns').defaultTo(0);
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Gate Passes
  if (!(await db.schema.hasTable('gate_passes'))) {
    await db.schema.createTable('gate_passes', t => {
      t.string('id').primary();
      t.string('student_id').notNullable().references('id').inTable('users');
      t.string('reason').notNullable();
      t.string('reason_detail').notNullable();
      t.string('out_time').notNullable();
      t.string('expected_return').notNullable();
      t.string('actual_return');
      t.string('status').notNullable().defaultTo('pending');
      t.string('parent_status').notNullable().defaultTo('pending');
      t.string('parent_approved_at');
      t.string('parent_token').unique();
      t.string('warden_id').references('id').inTable('users');
      t.string('warden_note');
      t.string('warden_approved_at');
      t.string('exit_scanned_at');
      t.string('guard_exit_id').references('id').inTable('users');
      t.string('entry_scanned_at');
      t.string('guard_entry_id').references('id').inTable('users');
      t.boolean('is_late').defaultTo(false);
      t.string('qr_code');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // OTP Sessions
  if (!(await db.schema.hasTable('otp_sessions'))) {
    await db.schema.createTable('otp_sessions', t => {
      t.string('id').primary();
      t.string('mobile').notNullable();
      t.string('usn');
      t.string('otp').notNullable();
      t.string('expires_at').notNullable();
      t.boolean('used').defaultTo(false);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Audit Logs
  if (!(await db.schema.hasTable('audit_logs'))) {
    await db.schema.createTable('audit_logs', t => {
      t.string('id').primary();
      t.string('actor_id').references('id').inTable('users');
      t.string('actor_name');
      t.string('role');
      t.string('action').notNullable();
      t.string('entity_id');
      t.string('entity_type');
      t.string('ip').defaultTo('127.0.0.1');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Violations
  if (!(await db.schema.hasTable('violations'))) {
    await db.schema.createTable('violations', t => {
      t.string('id').primary();
      t.string('student_id').notNullable().references('id').inTable('users');
      t.string('pass_id').references('id').inTable('gate_passes');
      t.string('type').notNullable();
      t.string('note');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  console.log('✅ Schema verified/created');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function log(actorId, actorName, role, action, entityId, entityType, ip = '127.0.0.1') {
  await db('audit_logs').insert({
    id: uuidv4(), actor_id: actorId, actor_name: actorName, role,
    action, entity_id: entityId, entity_type: entityType, ip
  });
}

export { uuidv4 };
export default db;
