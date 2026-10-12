const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSql(filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
  console.log(`Executing SQL file: ${absolutePath}`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`File does not exist: ${absolutePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(absolutePath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`Successfully executed SQL script: ${path.basename(absolutePath)}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Failed to execute SQL script:`, err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

const fileToRun = process.argv[2] || 'database/schema.sql';
runSql(fileToRun);
