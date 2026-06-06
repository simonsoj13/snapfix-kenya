const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='job_requests' AND column_name='image_urls'")
  .then(r => console.log(r.rows.length ? 'Column EXISTS' : 'Column NOT FOUND'))
  .catch(e => console.error(e.message))
  .finally(() => pool.end())
