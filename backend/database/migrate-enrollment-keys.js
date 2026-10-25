const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

function generateSecureKey() {
  const buf = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ELMS-${buf.slice(0, 4)}-${buf.slice(4, 8)}`;
}

async function migrate() {
  console.log('--- Applying Migration 004: Course Enrollment Keys ---');
  const sqlPath = path.join(__dirname, 'migrations', '004_course_enrollment_keys.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Execute SQL DDL
    await client.query(sql);
    console.log('✓ Schema updated with enrollment_key column and index.');

    // 2. Backfill existing courses that do not have an enrollment_key
    const coursesRes = await client.query('SELECT id, title, enrollment_key, enrollment_key_hash FROM courses ORDER BY id ASC');
    console.log(`Found ${coursesRes.rows.length} total courses in database.`);

    for (const course of coursesRes.rows) {
      if (!course.enrollment_key) {
        const newKey = generateSecureKey();
        const newHash = await bcrypt.hash(newKey, 10);
        await client.query(
          `UPDATE courses 
           SET enrollment_key = $1, 
               enrollment_key_hash = COALESCE(enrollment_key_hash, $2),
               requires_enrollment_key = TRUE 
           WHERE id = $3`,
          [newKey, newHash, course.id]
        );
        console.log(`  ✓ Assigned key [${newKey}] to Course #${course.id}: "${course.title}"`);
      } else {
        console.log(`  - Course #${course.id} already has key [${course.enrollment_key}]`);
      }
    }

    await client.query('COMMIT');
    console.log('✓ Migration 004 completed successfully!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
