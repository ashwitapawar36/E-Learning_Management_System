const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'elms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'ashwita',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5000 // return an error after 5 seconds if connection cannot be established
});

pool.on('connect', () => {
  // console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

/**
 * Executes a parameterized SQL query
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
};

/**
 * Gets a client from the pool for transactions (BEGIN, COMMIT, ROLLBACK)
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query;
  const originalRelease = client.release;

  // Set timeout to prevent leaked clients
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
  };

  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
