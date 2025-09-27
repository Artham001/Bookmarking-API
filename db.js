// Import the Pool class from the pg library
const { Pool } = require('pg');
    require('dotenv').config();

    const isProduction = process.env.NODE_ENV === 'production';
    const connectionString = process.env.DATABASE_URL;

    // Use the DATABASE_URL from Render in production, otherwise use local config
    const pool = new Pool({
        connectionString: isProduction ? connectionString : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:5432/bookmarking_db`,
        // In production, Render requires an SSL connection
        ssl: isProduction ? { rejectUnauthorized: false } : false,
    });

    module.exports = pool;