import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { config } from '../config/env.js';
import { AuditService } from '../services/auditService.js';
import { aiService } from '../services/aiService.js';
import { AlertEscalationService } from '../services/alertEscalationService.js';

export class AdminController {
  /**
   * Admin Authentication
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ? OR email = ?`).get(username.trim(), username.trim().toLowerCase());
      if (!admin) {
        AuditService.log({
          adminId: 'unauthenticated',
          action: 'LOGIN_FAILURE',
          targetType: 'admin_users',
          details: `Failed admin login attempt for identifier: ${username}`,
          ipAddress: req.ip
        });
        return res.status(401).json({ error: 'Invalid administrative credentials.' });
      }

      const isMatch = bcrypt.compareSync(password, admin.password_hash);
      if (!isMatch) {
        AuditService.log({
          adminId: admin.id,
          action: 'LOGIN_FAILURE',
          targetType: 'admin_users',
          details: 'Incorrect password entered.',
          ipAddress: req.ip
        });
        return res.status(401).json({ error: 'Invalid administrative credentials.' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role },
        config.adminJwtSecret,
        { expiresIn: '24h' }
      );

      AuditService.log({
        adminId: admin.id,
        action: 'LOGIN_SUCCESS',
        targetType: 'admin_users',
        targetId: admin.id,
        details: `Administrator logged in: ${admin.username}`,
        ipAddress: req.ip
      });

      res.status(200).json({
        message: 'Administrative authentication successful.',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin Dashboard Metrics Overview
   */
  static getDashboardStats(req, res, next) {
    try {
      const totalUsers = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
      const activeUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE status = 'active'`).get().count;
      const suspendedUsers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE status = 'suspended'`).get().count;
      
      const medicineSchedules = db.prepare(`SELECT COUNT(*) as count FROM medication_reminders`).get().count;
      const verifiedMedicines = db.prepare(`SELECT COUNT(*) as count FROM medication_logs WHERE status IN ('verified', 'taken')`).get().count;
      const missedMedicines = db.prepare(`SELECT COUNT(*) as count FROM medication_logs WHERE status = 'missed'`).get().count;
      
      // Today's pending medicines count
      const today = new Date().toISOString().split('T')[0];
      const verifiedTodayCount = db.prepare(`SELECT COUNT(*) as count FROM medication_logs WHERE scheduled_date = ? AND status IN ('verified', 'taken')`).get(today).count;
      const pendingMedicines = Math.max(0, medicineSchedules - verifiedTodayCount);

      const guardianAlerts = db.prepare(`SELECT COUNT(*) as count FROM guardian_alerts`).get().count;
      const careConnectActivity = db.prepare(`SELECT COUNT(*) as count FROM careconnect_sessions`).get().count;
      const uploadedReports = db.prepare(`SELECT COUNT(*) as count FROM medical_reports`).get().count;
      const uploadedPrescriptions = db.prepare(`SELECT COUNT(*) as count FROM prescriptions`).get().count;

      const totalArticles = db.prepare(`SELECT COUNT(*) as count FROM education_content`).get().count;
      const totalDictionary = db.prepare(`SELECT COUNT(*) as count FROM medical_dictionary`).get().count;
      const pendingFeedback = db.prepare(`SELECT COUNT(*) as count FROM feedback WHERE status = 'pending'`).get().count;
      const recentAuditCount = db.prepare(`SELECT COUNT(*) as count FROM audit_logs`).get().count;

      // Platform settings
      const settingsRows = db.prepare(`SELECT key, value FROM system_settings`).all();
      const settings = {};
      settingsRows.forEach(row => { settings[row.key] = row.value; });

      res.status(200).json({
        stats: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          medicineSchedules,
          totalSchedules: medicineSchedules,
          pendingMedicines,
          verifiedMedicines,
          missedMedicines,
          guardianAlerts,
          careConnectActivity,
          uploadedReports,
          uploadedPrescriptions,
          totalArticles,
          totalDictionary,
          pendingFeedback,
          recentAuditCount
        },
        languageConfiguration: {
          defaultLanguage: settings.default_language || 'en',
          supportedLanguages: [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
            { code: 'te', name: 'Telugu', flag: '🇮🇳' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
          ]
        },
        websiteConfiguration: settings,
        settings,
        activeAiProvider: aiService.provider
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Operational User Management
   * STRICT PRIVACY RULE: Does NOT return private health profiles, medical records, or conversations!
   */
  static getUsers(req, res, next) {
    try {
      const { search, status } = req.query;
      let query = `
        SELECT id, full_name, email, phone, guardian_email, guardian_phone, date_of_birth, is_verified, status, created_at
        FROM users
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'all') {
        query += ` AND status = ?`;
        params.push(status);
      }

      if (search && search.trim() !== '') {
        query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
        const wild = `%${search.trim()}%`;
        params.push(wild, wild, wild);
      }

      query += ` ORDER BY created_at DESC`;

      const users = db.prepare(query).all(...params);
      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update User Account Status (e.g. suspend or activate)
   */
  static updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Status must be active or suspended.' });
      }

      db.prepare(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, id);

      AuditService.log({
        adminId: req.admin.id,
        action: 'USER_STATUS_CHANGE',
        targetType: 'users',
        targetId: id,
        details: `Changed user account status to: ${status}`,
        ipAddress: req.ip
      });

      res.status(200).json({ message: `User status changed to ${status}.` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Educational Content Management: List
   */
  static getArticles(req, res, next) {
    try {
      const articles = db.prepare(`SELECT * FROM education_content ORDER BY created_at DESC`).all();
      res.status(200).json({ articles });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Educational Content: Create
   */
  static createArticle(req, res, next) {
    try {
      const { title, slug, category, summary, content, read_time, author, tags, is_published } = req.body;
      if (!title || !category || !summary || !content) {
        return res.status(400).json({ error: 'Title, category, summary, and content are required.' });
      }

      const id = uuidv4();
      const generatedSlug = slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check slug uniqueness
      const existing = db.prepare(`SELECT id FROM education_content WHERE slug = ?`).get(generatedSlug);
      if (existing) {
        return res.status(400).json({ error: 'An article with this slug or title already exists.' });
      }

      db.prepare(`
        INSERT INTO education_content (
          id, title, slug, category, summary, content, read_time, author, tags, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        title.trim(),
        generatedSlug,
        category,
        summary.trim(),
        content.trim(),
        read_time ? Number(read_time) : 5,
        author?.trim() || 'HealthGPT Clinical Editorial',
        tags?.trim() || '',
        is_published !== undefined ? (is_published ? 1 : 0) : 1
      );

      AuditService.log({
        adminId: req.admin.id,
        action: 'ARTICLE_CREATED',
        targetType: 'education_content',
        targetId: id,
        details: `Created article: "${title}"`,
        ipAddress: req.ip
      });

      const article = db.prepare(`SELECT * FROM education_content WHERE id = ?`).get(id);
      res.status(201).json({ message: 'Article created successfully.', article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Educational Content: Update
   */
  static updateArticle(req, res, next) {
    try {
      const { id } = req.params;
      const { title, category, summary, content, read_time, author, tags, is_published } = req.body;

      db.prepare(`
        UPDATE education_content SET
          title = COALESCE(?, title),
          category = COALESCE(?, category),
          summary = COALESCE(?, summary),
          content = COALESCE(?, content),
          read_time = COALESCE(?, read_time),
          author = COALESCE(?, author),
          tags = COALESCE(?, tags),
          is_published = COALESCE(?, is_published),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title?.trim(),
        category,
        summary?.trim(),
        content?.trim(),
        read_time ? Number(read_time) : null,
        author?.trim(),
        tags?.trim(),
        is_published !== undefined ? (is_published ? 1 : 0) : null,
        id
      );

      AuditService.log({
        adminId: req.admin.id,
        action: 'ARTICLE_UPDATED',
        targetType: 'education_content',
        targetId: id,
        details: `Updated article: ${id}`,
        ipAddress: req.ip
      });

      const article = db.prepare(`SELECT * FROM education_content WHERE id = ?`).get(id);
      res.status(200).json({ message: 'Article updated.', article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Educational Content: Delete
   */
  static deleteArticle(req, res, next) {
    try {
      const { id } = req.params;
      db.prepare(`DELETE FROM education_content WHERE id = ?`).run(id);

      AuditService.log({
        adminId: req.admin.id,
        action: 'ARTICLE_DELETED',
        targetType: 'education_content',
        targetId: id,
        details: `Deleted article: ${id}`,
        ipAddress: req.ip
      });

      res.status(200).json({ message: 'Article deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Medical Dictionary: Create
   */
  static createDictionaryTerm(req, res, next) {
    try {
      const { term, pronunciation, simple_definition, clinical_context, related_terms } = req.body;
      if (!term || !simple_definition) {
        return res.status(400).json({ error: 'Term and definition are required.' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO medical_dictionary (id, term, pronunciation, simple_definition, clinical_context, related_terms)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        term.trim(),
        pronunciation?.trim() || '',
        simple_definition.trim(),
        clinical_context?.trim() || '',
        related_terms?.trim() || ''
      );

      AuditService.log({
        adminId: req.admin.id,
        action: 'DICTIONARY_TERM_CREATED',
        targetType: 'medical_dictionary',
        targetId: id,
        details: `Created medical term: "${term}"`,
        ipAddress: req.ip
      });

      const item = db.prepare(`SELECT * FROM medical_dictionary WHERE id = ?`).get(id);
      res.status(201).json({ message: 'Medical dictionary entry created.', item });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Medical Dictionary: Update
   */
  static updateDictionaryTerm(req, res, next) {
    try {
      const { id } = req.params;
      const { term, pronunciation, simple_definition, clinical_context, related_terms } = req.body;

      db.prepare(`
        UPDATE medical_dictionary SET
          term = COALESCE(?, term),
          pronunciation = COALESCE(?, pronunciation),
          simple_definition = COALESCE(?, simple_definition),
          clinical_context = COALESCE(?, clinical_context),
          related_terms = COALESCE(?, related_terms),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        term?.trim(),
        pronunciation?.trim(),
        simple_definition?.trim(),
        clinical_context?.trim(),
        related_terms?.trim(),
        id
      );

      const item = db.prepare(`SELECT * FROM medical_dictionary WHERE id = ?`).get(id);
      res.status(200).json({ message: 'Dictionary entry updated.', item });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Medical Dictionary: Delete
   */
  static deleteDictionaryTerm(req, res, next) {
    try {
      const { id } = req.params;
      db.prepare(`DELETE FROM medical_dictionary WHERE id = ?`).run(id);

      AuditService.log({
        adminId: req.admin.id,
        action: 'DICTIONARY_TERM_DELETED',
        targetType: 'medical_dictionary',
        targetId: id,
        details: `Deleted dictionary term: ${id}`,
        ipAddress: req.ip
      });

      res.status(200).json({ message: 'Dictionary entry deleted.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Audit Logs View
   */
  static getAuditLogs(req, res, next) {
    try {
      const logs = AuditService.getLogs(150);
      res.status(200).json({ logs });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Feedback Management: List
   */
  static getFeedback(req, res, next) {
    try {
      const feedback = db.prepare(`SELECT * FROM feedback ORDER BY created_at DESC`).all();
      res.status(200).json({ feedback });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Feedback Management: Update Status
   */
  static updateFeedbackStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      db.prepare(`UPDATE feedback SET status = ? WHERE id = ?`).run(status, id);
      res.status(200).json({ message: 'Feedback status updated.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * AI Configuration & System Settings
   */
  static updateAiConfig(req, res, next) {
    try {
      const { provider, apiKey, temperature } = req.body;

      if (provider) {
        aiService.setProvider(provider, apiKey);
        db.prepare(`INSERT OR REPLACE INTO system_settings (id, key, value) VALUES (?, 'ai_provider', ?)`).run(uuidv4(), provider);
      }

      if (temperature) {
        db.prepare(`INSERT OR REPLACE INTO system_settings (id, key, value) VALUES (?, 'ai_temperature', ?)`).run(uuidv4(), String(temperature));
      }

      AuditService.log({
        adminId: req.admin.id,
        action: 'AI_CONFIG_UPDATED',
        targetType: 'system_settings',
        details: `Updated AI provider to: ${provider}`,
        ipAddress: req.ip
      });

      res.status(200).json({
        message: 'AI Configuration updated successfully.',
        activeAiProvider: aiService.provider
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all medication schedules across the platform
   */
  static getAllMedicines(req, res, next) {
    try {
      const medicines = db.prepare(`
        SELECT r.*, u.full_name as patient_name, u.email as patient_email
        FROM medication_reminders r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `).all();

      const parsed = medicines.map(m => ({
        ...m,
        intake_times: m.intake_times ? JSON.parse(m.intake_times) : [m.reminder_time]
      }));

      res.status(200).json({ medicines: parsed });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Add new medicine / schedule for a user
   */
  static createMedicineAdmin(req, res, next) {
    try {
      const { user_id, medicine_name, dosage, frequency = 'Once daily', reminder_time = '08:00 AM', intake_times, start_date, end_date, instructions = '', notes = '' } = req.body;
      if (!medicine_name || !dosage) {
        return res.status(400).json({ error: 'Medicine name and dosage are required.' });
      }

      let targetUserId = user_id;
      if (!targetUserId) {
        const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
        if (firstUser) targetUserId = firstUser.id;
      }

      if (!targetUserId) {
        return res.status(400).json({ error: 'No user account found to assign medication to.' });
      }

      const id = uuidv4();
      const validIntakeTimes = Array.isArray(intake_times) && intake_times.length > 0 ? intake_times : [reminder_time];
      const today = start_date || new Date().toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO medication_reminders (
          id, user_id, medicine_name, dosage, frequency, reminder_time, start_date, end_date, notes,
          call_reminder_enabled, video_verification_enabled, call_status, status,
          intake_times, duration_days, instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'idle', 'active', ?, 7, ?)
      `).run(
        id,
        targetUserId,
        medicine_name.trim(),
        dosage.trim(),
        frequency,
        validIntakeTimes[0] || '08:00 AM',
        today,
        end_date || null,
        notes?.trim() || '',
        JSON.stringify(validIntakeTimes),
        instructions?.trim() || ''
      );

      AuditService.log({
        adminId: req.admin.id,
        action: 'MEDICINE_CREATED',
        targetType: 'medication_reminders',
        targetId: id,
        details: `Admin added medicine: ${medicine_name} (${dosage})`,
        ipAddress: req.ip
      });

      const med = db.prepare('SELECT * FROM medication_reminders WHERE id = ?').get(id);
      res.status(201).json({ message: 'Medication schedule created successfully by administrator.', medicine: med });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Edit medicine
   */
  static updateMedicineAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { medicine_name, dosage, frequency, reminder_time, intake_times, status, instructions, notes } = req.body;

      db.prepare(`
        UPDATE medication_reminders SET
          medicine_name = COALESCE(?, medicine_name),
          dosage = COALESCE(?, dosage),
          frequency = COALESCE(?, frequency),
          reminder_time = COALESCE(?, reminder_time),
          intake_times = COALESCE(?, intake_times),
          status = COALESCE(?, status),
          instructions = COALESCE(?, instructions),
          notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(
        medicine_name?.trim(),
        dosage?.trim(),
        frequency,
        reminder_time,
        intake_times ? JSON.stringify(intake_times) : null,
        status,
        instructions?.trim(),
        notes?.trim(),
        id
      );

      AuditService.log({
        adminId: req.admin.id,
        action: 'MEDICINE_UPDATED',
        targetType: 'medication_reminders',
        targetId: id,
        details: `Admin modified medicine ID: ${id}`,
        ipAddress: req.ip
      });

      const updated = db.prepare('SELECT * FROM medication_reminders WHERE id = ?').get(id);
      res.status(200).json({ message: 'Medicine updated successfully.', medicine: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete medicine
   */
  static deleteMedicineAdmin(req, res, next) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM medication_reminders WHERE id = ?').run(id);

      AuditService.log({
        adminId: req.admin.id,
        action: 'MEDICINE_DELETED',
        targetType: 'medication_reminders',
        targetId: id,
        details: `Admin deleted medicine ID: ${id}`,
        ipAddress: req.ip
      });

      res.status(200).json({ message: 'Medicine removed successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all guardians
   */
  static getAllGuardians(req, res, next) {
    try {
      const guardians = db.prepare(`
        SELECT g.*, u.full_name as patient_name, u.email as patient_email
        FROM guardians g
        LEFT JOIN users u ON g.user_id = u.id
        ORDER BY g.created_at DESC
      `).all();

      res.status(200).json({ guardians });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update guardian info
   */
  static updateGuardianAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { name, phone, email, relationship, escalation_enabled } = req.body;

      db.prepare(`
        UPDATE guardians SET
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          relationship = COALESCE(?, relationship),
          escalation_enabled = COALESCE(?, escalation_enabled),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name?.trim(),
        phone?.trim(),
        email?.trim(),
        relationship?.trim(),
        escalation_enabled !== undefined ? (escalation_enabled ? 1 : 0) : null,
        id
      );

      const updated = db.prepare('SELECT * FROM guardians WHERE id = ?').get(id);
      res.status(200).json({ message: 'Guardian updated successfully.', guardian: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete guardian
   */
  static deleteGuardianAdmin(req, res, next) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM guardians WHERE id = ?').run(id);
      res.status(200).json({ message: 'Guardian removed successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all uploaded health reports & prescriptions
   */
  static getAllReportsAdmin(req, res, next) {
    try {
      const reports = db.prepare(`
        SELECT d.*, u.full_name as patient_name, u.email as patient_email
        FROM medical_reports d
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
      `).all();

      const prescriptions = db.prepare(`
        SELECT p.*, u.full_name as patient_name, u.email as patient_email
        FROM prescriptions p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `).all();

      res.status(200).json({ reports, prescriptions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete health report
   */
  static deleteReportAdmin(req, res, next) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM medical_reports WHERE id = ?').run(id);
      db.prepare('DELETE FROM prescriptions WHERE id = ?').run(id);
      res.status(200).json({ message: 'Report/Prescription removed.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Get all alert and escalation history
   */
  static getAllAlertsAdmin(req, res, next) {
    try {
      const alerts = AlertEscalationService.getAllAlertsAdmin();
      res.status(200).json({ alerts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Get website settings & configuration
   */
  static getSettingsAdmin(req, res, next) {
    try {
      const rows = db.prepare('SELECT key, value FROM system_settings').all();
      const settings = {};
      rows.forEach(r => { settings[r.key] = r.value; });
      res.status(200).json({ settings });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update website settings & configuration
   */
  static updateSettingsAdmin(req, res, next) {
    try {
      const updates = req.body;

      for (const [key, val] of Object.entries(updates)) {
        db.prepare(`
          INSERT INTO system_settings (id, key, value, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).run(uuidv4(), key, String(val));
      }

      AuditService.log({
        adminId: req.admin.id,
        action: 'SETTINGS_UPDATED',
        targetType: 'system_settings',
        details: `Admin updated settings: ${Object.keys(updates).join(', ')}`,
        ipAddress: req.ip
      });

      const rows = db.prepare('SELECT key, value FROM system_settings').all();
      const settings = {};
      rows.forEach(r => { settings[r.key] = r.value; });

      res.status(200).json({ message: 'System configuration updated successfully.', settings });
    } catch (err) {
      next(err);
    }
  }
}
