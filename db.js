// Import the Pool class from the pg library
const { Pool } = require('pg');

// Create a new Pool instance
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bookmarking_db',
  password: 'artham_17', // Replace with the password you set during PostgreSQL installation
  port: 5432,
});

// Export the pool object so we can use it in other files
module.exports = pool;