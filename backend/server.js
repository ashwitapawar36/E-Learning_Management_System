const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity
    const res = await db.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`Connected to PostgreSQL: ${res.rows[0].db_name} at ${res.rows[0].current_time}`);

    const server = app.listen(PORT, () => {
      console.log(`🚀 ELMS Backend Server running on port ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });

    const shutdown = async () => {
      console.log('\nShutting down server gracefully...');
      server.close(async () => {
        console.log('HTTP server closed.');
        await db.pool.end();
        console.log('PostgreSQL pool has ended.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server due to database error:', error);
    process.exit(1);
  }
}

startServer();
