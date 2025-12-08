import { Pool } from 'pg';
import config from '../config/config.js';



// Create a single database connection pool to be reused
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

export default pool;