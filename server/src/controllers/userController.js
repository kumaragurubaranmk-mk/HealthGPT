import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class UserController {
  /**
   * Retrieve Health Profile
   */
  static getHealthProfile(req, res, next) {
    try {
      const profile = db.prepare(`SELECT * FROM health_profiles WHERE user_id = ?`).get(req.user.id);
      res.status(200).json({ profile: profile || {} });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Health Profile
   */
  static updateHealthProfile(req, res, next) {
    try {
      const {
        blood_group,
        height,
        weight,
        allergies,
        existing_conditions,
        current_medications,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        dietary_preferences,
        lifestyle_notes
      } = req.body;

      db.prepare(`
        UPDATE health_profiles SET
          blood_group = ?,
          height = ?,
          weight = ?,
          allergies = ?,
          existing_conditions = ?,
          current_medications = ?,
          emergency_contact_name = ?,
          emergency_contact_phone = ?,
          emergency_contact_relation = ?,
          dietary_preferences = ?,
          lifestyle_notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        blood_group ?? '',
        height !== undefined && height !== '' ? Number(height) : null,
        weight !== undefined && weight !== '' ? Number(weight) : null,
        allergies ?? '',
        existing_conditions ?? '',
        current_medications ?? '',
        emergency_contact_name ?? '',
        emergency_contact_phone ?? '',
        emergency_contact_relation ?? '',
        dietary_preferences ?? '',
        lifestyle_notes ?? '',
        req.user.id
      );

      const updated = db.prepare(`SELECT * FROM health_profiles WHERE user_id = ?`).get(req.user.id);
      res.status(200).json({ message: 'Health profile updated successfully.', profile: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve User Account and UI Profile
   */
  static getUserProfile(req, res, next) {
    try {
      const user = db.prepare(`SELECT id, full_name, email, guardian_email, phone, guardian_phone, date_of_birth FROM users WHERE id = ?`).get(req.user.id);
      const profile = db.prepare(`SELECT * FROM user_profiles WHERE user_id = ?`).get(req.user.id);
      res.status(200).json({ user, profile: profile || {} });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update User Account and UI Settings
   */
  static updateUserProfile(req, res, next) {
    try {
      const { full_name, phone, guardian_email, guardian_phone, preferred_language, dark_mode, notification_preferences } = req.body;

      if (full_name) {
        db.prepare(`
          UPDATE users SET 
            full_name = ?, 
            phone = ?, 
            guardian_email = ?, 
            guardian_phone = ?,
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(
          full_name.trim(),
          phone?.trim() || null,
          guardian_email?.trim() || null,
          guardian_phone?.trim() || null,
          req.user.id
        );
      }

      if (preferred_language !== undefined || dark_mode !== undefined || notification_preferences !== undefined) {
        db.prepare(`
          UPDATE user_profiles SET
            preferred_language = COALESCE(?, preferred_language),
            dark_mode = COALESCE(?, dark_mode),
            notification_preferences = COALESCE(?, notification_preferences)
          WHERE user_id = ?
        `).run(
          preferred_language,
          dark_mode !== undefined ? (dark_mode ? 1 : 0) : null,
          typeof notification_preferences === 'object' ? JSON.stringify(notification_preferences) : notification_preferences,
          req.user.id
        );
      }

      res.status(200).json({ message: 'Profile settings saved successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Privacy: Export Full User Data (GDPR & Data Ownership)
   */
  static exportUserData(req, res, next) {
    try {
      const userId = req.user.id;
      const user = db.prepare(`SELECT id, full_name, email, phone, guardian_email, guardian_phone, date_of_birth, created_at FROM users WHERE id = ?`).get(userId);
      const healthProfile = db.prepare(`SELECT * FROM health_profiles WHERE user_id = ?`).get(userId);
      const healthRecords = db.prepare(`SELECT * FROM health_records WHERE user_id = ?`).all(userId);
      const medicationReminders = db.prepare(`SELECT * FROM medication_reminders WHERE user_id = ?`).all(userId);
      const healthMetrics = db.prepare(`SELECT * FROM health_metrics WHERE user_id = ?`).all(userId);
      const appointments = db.prepare(`SELECT * FROM appointments WHERE user_id = ?`).all(userId);
      const conversations = db.prepare(`SELECT * FROM conversations WHERE user_id = ?`).all(userId);

      const exportBundle = {
        meta: {
          platform: 'HealthGPT – Personal Health Assistant',
          exportTimestamp: new Date().toISOString(),
          privacyStatement: 'Your health information is private and is only stored when you choose to provide it.'
        },
        account: user,
        healthProfile,
        healthRecords,
        medicationReminders,
        healthMetrics,
        appointments,
        conversations
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="healthgpt_export_${userId}.json"`);
      res.status(200).json(exportBundle);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Privacy: Delete Entire Account and All Associated Health Records
   */
  static deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;

      // Delete cascades via foreign keys or manual cleanup
      db.prepare(`DELETE FROM health_records WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM health_metrics WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM medication_logs WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM medication_reminders WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM appointments WHERE user_id = ?`).run(userId);
      
      const convs = db.prepare(`SELECT id FROM conversations WHERE user_id = ?`).all(userId);
      for (const conv of convs) {
        db.prepare(`DELETE FROM messages WHERE conversation_id = ?`).run(conv.id);
      }
      db.prepare(`DELETE FROM conversations WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM health_profiles WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM user_profiles WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM feedback WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

      res.status(200).json({ message: 'Account and all private medical data have been permanently purged.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update preferred language for user account (Requirement 4)
   */
  static updateLanguage(req, res, next) {
    try {
      const language = req.body.language || req.body.preferred_language;
      const validLanguages = ['en', 'ta', 'te', 'hi'];
      if (!language || !validLanguages.includes(language)) {
        return res.status(400).json({ error: 'Language must be one of: en, ta, te, hi' });
      }

      const updated = db.prepare(`
        UPDATE user_profiles SET
          preferred_language = ?
        WHERE user_id = ?
      `).run(language, req.user.id);

      if (updated.changes === 0) {
        db.prepare(`INSERT INTO user_profiles (id, user_id, preferred_language) VALUES (?, ?, ?)`).run(uuidv4(), req.user.id, language);
      }

      res.status(200).json({ message: 'Language updated successfully.', language });
    } catch (err) {
      next(err);
    }
  }
}
