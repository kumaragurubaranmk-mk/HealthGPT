import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { seedInitialContent } from './seedEducation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the directory for the database exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Clean up any stale or foreign WAL / SHM shared memory files before connecting
const shmPath = `${config.databasePath}-shm`;
const walPath = `${config.databasePath}-wal`;
if (fs.existsSync(shmPath)) {
  try { fs.unlinkSync(shmPath); } catch (e) {}
}
if (fs.existsSync(walPath)) {
  try { fs.unlinkSync(walPath); } catch (e) {}
}

export const db = new Database(config.databasePath);

// Enable WAL mode with graceful fallback to DELETE mode
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  try { db.pragma('journal_mode = DELETE'); } catch (e2) {}
}
db.pragma('foreign_keys = ON');

function runMigrations() {
  const alterStatements = [
    "ALTER TABLE medication_reminders ADD COLUMN call_reminder_enabled INTEGER DEFAULT 1",
    "ALTER TABLE medication_reminders ADD COLUMN video_verification_enabled INTEGER DEFAULT 1",
    "ALTER TABLE medication_reminders ADD COLUMN call_status TEXT DEFAULT 'idle'",
    "ALTER TABLE medication_reminders ADD COLUMN intake_times TEXT DEFAULT '[]'",
    "ALTER TABLE medication_reminders ADD COLUMN duration_days INTEGER DEFAULT 7",
    "ALTER TABLE medication_reminders ADD COLUMN instructions TEXT DEFAULT ''",
    "ALTER TABLE medication_reminders ADD COLUMN prescription_id TEXT DEFAULT NULL",
    "ALTER TABLE medication_logs ADD COLUMN verification_mode TEXT DEFAULT 'self'",
    "ALTER TABLE medication_logs ADD COLUMN video_session_id TEXT DEFAULT NULL",
    "ALTER TABLE medication_logs ADD COLUMN video_duration_seconds INTEGER DEFAULT 0",
    "ALTER TABLE medication_logs ADD COLUMN verified_at DATETIME DEFAULT NULL",
    "ALTER TABLE medication_logs ADD COLUMN guardian_alerted INTEGER DEFAULT 0",
    "ALTER TABLE medication_logs ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE medication_logs ADD COLUMN careconnect_session_id TEXT DEFAULT NULL",
    "ALTER TABLE medical_reports ADD COLUMN verified_data TEXT DEFAULT '[]'",
    "ALTER TABLE medical_reports ADD COLUMN ocr_confidence REAL DEFAULT 0.95",
    "ALTER TABLE medical_reports ADD COLUMN file_path TEXT DEFAULT ''",
    "ALTER TABLE guardian_alerts ADD COLUMN alert_type TEXT DEFAULT 'escalation'",
    "ALTER TABLE guardian_alerts ADD COLUMN attempt_number INTEGER DEFAULT 1",
    "ALTER TABLE guardian_alerts ADD COLUMN recipient_phone TEXT DEFAULT ''",
    "ALTER TABLE guardian_alerts ADD COLUMN recipient_name TEXT DEFAULT ''",
    "ALTER TABLE guardian_alerts ADD COLUMN acknowledged INTEGER DEFAULT 0",
    "ALTER TABLE guardian_alerts ADD COLUMN acknowledged_at DATETIME DEFAULT NULL",
    "ALTER TABLE guardian_alerts ADD COLUMN schedule_id TEXT DEFAULT NULL",
    "ALTER TABLE guardian_alerts ADD COLUMN call_status TEXT DEFAULT 'completed'",
    "ALTER TABLE guardian_alerts ADD COLUMN escalation_status TEXT DEFAULT 'escalated'",
    "ALTER TABLE guardian_alerts ADD COLUMN call_session_id TEXT DEFAULT NULL"
  ];
  for (const stmt of alterStatements) {
    try {
      db.prepare(stmt).run();
    } catch (e) {
      // Column already exists or already migrated
    }
  }

  // Create consumption_events table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumption_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      schedule_id TEXT,
      session_id TEXT,
      started_at DATETIME,
      detected_at DATETIME,
      completed_at DATETIME,
      status TEXT NOT NULL,
      verification_source TEXT NOT NULL,
      confidence_score REAL DEFAULT 0.0,
      device_info TEXT DEFAULT '',
      telemetry_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medication_reminders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reminder_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      call_type TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      recipient_role TEXT NOT NULL,
      status TEXT NOT NULL,
      call_duration_seconds INTEGER DEFAULT 0,
      provider_session_id TEXT,
      provider_response TEXT,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reminder_id) REFERENCES medication_reminders(id) ON DELETE CASCADE
    );
  `);

  // Seed default system configurations
  const defaultSettings = [
    { key: 'site_name', value: 'VitaCare AI' },
    { key: 'site_tagline', value: 'Your Health. Organized. Intelligent. Connected.' },
    { key: 'max_patient_warning_attempts', value: '2' },
    { key: 'warning_timeout_minutes', value: '15' },
    { key: 'careconnect_enabled', value: 'true' },
    { key: 'guardian_sms_gateway', value: 'active' },
    { key: 'default_language', value: 'en' },
    { key: 'emergency_number', value: '108' },
    { key: 'support_phone', value: '+1 (800) 848-2227' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (id, key, value) VALUES (?, ?, ?)
  `);

  for (const s of defaultSettings) {
    insertSetting.run(`cfg-${s.key}`, s.key, s.value);
  }

  // Seed Test Users (Requirement 16)
  seedTestUsers(db);
}

function seedTestUsers(db) {
  try {
    const bcryptModule = db; // helper
    import('bcryptjs').then(({ default: bcrypt }) => {
      const passwordHash = bcrypt.hashSync('TestPatient@123!', 10);
      
      const testUsers = [
        {
          id: 'test-patient-a-001',
          name: 'Patient A',
          email: 'patient_a@vitacare.test',
          phone: '+1 555-010-0001',
          guardianName: 'Guardian A',
          guardianPhone: '+1 555-010-0002',
          guardianEmail: 'guardian_a@vitacare.test'
        },
        {
          id: 'test-patient-b-002',
          name: 'Patient B',
          email: 'patient_b@vitacare.test',
          phone: '+1 555-020-0001',
          guardianName: 'Guardian B',
          guardianPhone: '+1 555-020-0002',
          guardianEmail: 'guardian_b@vitacare.test'
        }
      ];

      for (const u of testUsers) {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
        if (!existing) {
          db.prepare(`
            INSERT INTO users (id, full_name, email, phone, guardian_phone, guardian_email, password_hash, is_verified, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active')
          `).run(u.id, u.name, u.email, u.phone, u.guardianPhone, u.guardianEmail, passwordHash);

          db.prepare(`
            INSERT INTO user_profiles (id, user_id, preferred_language)
            VALUES (?, ?, 'en')
          `).run(`prof-${u.id}`, u.id);

          db.prepare(`
            INSERT INTO guardians (id, user_id, name, relation, phone, email, escalation_enabled)
            VALUES (?, ?, ?, 'Caregiver', ?, ?, 1)
          `).run(`guard-${u.id}`, u.id, u.guardianName, u.guardianPhone, u.guardianEmail);
        }
      }
    }).catch(e => console.warn('Could not async seed test users:', e));
  } catch (err) {
    console.warn('Seed test users error:', err);
  }
}


export function initDatabase() {
  console.log(`[Database] Initializing SQLite database at: ${config.databasePath}`);
  
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema tables and indexes
  db.exec(schemaSql);

  // Apply migrations
  runMigrations();

  // Seed default educational materials & admin credentials (ZERO patient records!)
  seedInitialContent(db);

  console.log('[Database] Database tables initialized successfully.');
}

