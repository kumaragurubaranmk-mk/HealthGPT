import { initDatabase } from './db.js';

try {
  initDatabase();
  console.log('[InitDb] Successfully created tables and seeded educational data.');
  process.exit(0);
} catch (error) {
  console.error('[InitDb] Failed to initialize database:', error);
  process.exit(1);
}
