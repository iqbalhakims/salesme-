const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'carcrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Wrap pool.query to record DB latency metrics
const originalQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  const start = Date.now();
  try {
    return await originalQuery(...args);
  } finally {
    // lazy-require to avoid circular dependency at startup
    const { recordDbQuery } = require('../utils/metricsStore');
    recordDbQuery(Date.now() - start);
  }
};

module.exports = pool;
