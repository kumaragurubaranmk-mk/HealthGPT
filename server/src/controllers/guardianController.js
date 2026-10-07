import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class GuardianController {
  /**
   * Get all guardians configured for user
   */
  static getGuardians(req, res, next) {
    try {
      const guardians = db.prepare(`
        SELECT * FROM guardians 
        WHERE user_id = ? 
        ORDER BY created_at ASC
      `).all(req.user.id);

      const alerts = db.prepare(`
        SELECT * FROM guardian_alerts 
        WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 20
      `).all(req.user.id);

      res.status(200).json({ guardians, alerts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add a new guardian
   */
  static addGuardian(req, res, next) {
    try {
      const { name, relation, phone, email = '', escalation_enabled = 1, escalation_timeout_mins = 15 } = req.body;
      if (!name || !relation || !phone) {
        return res.status(400).json({ error: 'Guardian name, relation, and phone number are required.' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO guardians (id, user_id, name, relation, phone, email, escalation_enabled, escalation_timeout_mins)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        req.user.id,
        name.trim(),
        relation.trim(),
        phone.trim(),
        email.trim(),
        escalation_enabled ? 1 : 0,
        escalation_timeout_mins || 15
      );

      const guardian = db.prepare('SELECT * FROM guardians WHERE id = ?').get(id);
      res.status(201).json({ message: 'Guardian registered successfully.', guardian });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update guardian details
   */
  static updateGuardian(req, res, next) {
    try {
      const { id } = req.params;
      const { name, relation, phone, email, escalation_enabled, escalation_timeout_mins } = req.body;

      const existing = db.prepare('SELECT id FROM guardians WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!existing) {
        return res.status(404).json({ error: 'Guardian record not found.' });
      }

      db.prepare(`
        UPDATE guardians SET
          name = COALESCE(?, name),
          relation = COALESCE(?, relation),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          escalation_enabled = COALESCE(?, escalation_enabled),
          escalation_timeout_mins = COALESCE(?, escalation_timeout_mins)
        WHERE id = ? AND user_id = ?
      `).run(
        name?.trim(),
        relation?.trim(),
        phone?.trim(),
        email?.trim(),
        escalation_enabled !== undefined ? (escalation_enabled ? 1 : 0) : null,
        escalation_timeout_mins,
        id,
        req.user.id
      );

      const updated = db.prepare('SELECT * FROM guardians WHERE id = ?').get(id);
      res.status(200).json({ message: 'Guardian updated.', guardian: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete guardian
   */
  static deleteGuardian(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM guardians WHERE id = ? AND user_id = ?').run(id, req.user.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Guardian not found.' });
      }
      res.status(200).json({ message: 'Guardian deleted.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger demo alert to guardian
   */
  static sendDemoAlert(req, res, next) {
    try {
      const { guardian_id, medicine_name = 'Metformin 500mg', scheduled_time = '08:00 AM', reason = 'Missed scheduled dose' } = req.body;

      const guardian = guardian_id
        ? db.prepare('SELECT * FROM guardians WHERE id = ? AND user_id = ?').get(guardian_id, req.user.id)
        : db.prepare('SELECT * FROM guardians WHERE user_id = ? LIMIT 1').get(req.user.id);

      const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
      const guardianName = guardian?.name || 'Primary Guardian';
      const guardianPhone = guardian?.phone || '+1 (555) 234-5678';
      const patientName = user?.full_name || 'Patient';

      const alertId = uuidv4();
      const message = `[DEMO GUARDIAN ALERT] Attention ${guardianName}: ${patientName} did not take their scheduled medicine "${medicine_name}" scheduled for ${scheduled_time}. Reason: ${reason}. (SIMULATION - DEMO MODE)`;

      db.prepare(`
        INSERT INTO guardian_alerts (
          id, user_id, guardian_id, medicine_name, scheduled_time, reason, channel, status, message, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, 'demo_sms', 'sent', ?, 1)
      `).run(
        alertId,
        req.user.id,
        guardian?.id || null,
        medicine_name,
        scheduled_time,
        reason,
        message
      );

      const alert = db.prepare('SELECT * FROM guardian_alerts WHERE id = ?').get(alertId);
      res.status(200).json({
        message: 'Demo alert sent to guardian (simulation). Real SMS/Call service is in Demo Mode.',
        alert,
        recipient: { name: guardianName, phone: guardianPhone }
      });
    } catch (err) {
      next(err);
    }
  }
}
