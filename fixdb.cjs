const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query("ALTER TABLE job_requests ADD COLUMN IF NOT EXISTS image_urls text DEFAULT '[]'")
  .then(r => console.log('Column added!'))
  .catch(e => console.error(e.message))
  .finally(() => pool.end())
