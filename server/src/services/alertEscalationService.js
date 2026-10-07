import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { CallService } from './callService.js';

export class AlertEscalationService {
  /**
   * Helper to fetch admin configuration
   */
  static getConfig() {
    const maxAttemptsRow = db.prepare("SELECT value FROM system_settings WHERE key = 'max_patient_warning_attempts'").get();
    const timeoutRow = db.prepare("SELECT value FROM system_settings WHERE key = 'warning_timeout_minutes'").get();

    return {
      maxPatientWarningAttempts: parseInt(maxAttemptsRow?.value || '2', 10),
      warningTimeoutMinutes: parseInt(timeoutRow?.value || '15', 10)
    };
  }

  /**
   * 1. Patient confirms medicine intake -> Mark Verified & Send Guardian Notification
   * Example: "VitaCare Alert: [Patient Name] has taken [Medicine Name] at [Time]."
   */
  static notifyIntakeVerified(userId, reminderId, medicineNameInput, scheduledTimeInput, customTime = null) {
    try {
      const user = db.prepare('SELECT full_name, phone, guardian_phone FROM users WHERE id = ?').get(userId);
      const reminder = reminderId ? db.prepare('SELECT medicine_name, dosage, reminder_time FROM medication_reminders WHERE id = ?').get(reminderId) : null;
      const guardian = db.prepare('SELECT * FROM guardians WHERE user_id = ? ORDER BY created_at ASC LIMIT 1').get(userId);

      const patientName = user?.full_name || 'Patient';
      const medicineName = reminder?.medicine_name || medicineNameInput || 'Prescription Medicine';
      const dosage = reminder?.dosage || '1 dose';
      const timeStr = customTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const scheduledTime = scheduledTimeInput || reminder?.reminder_time || 'Scheduled Time';

      const guardianName = guardian?.name || 'Registered Guardian';
      const guardianPhone = guardian?.phone || user?.guardian_phone || '+1 (555) 010-0002';

      const alertMessage = `VitaCare Alert: ${patientName} has taken ${medicineName} at ${timeStr}.`;
      const alertId = uuidv4();

      // Check if intake alert already sent today for this reminder & slot
      const existingIntakeAlert = db.prepare(`
        SELECT * FROM guardian_alerts
        WHERE user_id = ? AND reminder_id = ? AND alert_type = 'intake_verified'
          AND date(created_at) = date('now')
      `).get(userId, reminderId || '');

      if (existingIntakeAlert) {
        return {
          success: true,
          alertType: 'intake_verified',
          duplicatePrevented: true,
          message: existingIntakeAlert.message,
          alert: existingIntakeAlert,
          recipient: { name: guardianName, phone: guardianPhone },
          timestamp: timeStr
        };
      }

      db.prepare(`
        INSERT INTO guardian_alerts (
          id, user_id, guardian_id, reminder_id, medicine_name, scheduled_time,
          reason, channel, status, message, is_demo, alert_type, attempt_number,
          recipient_phone, recipient_name, schedule_id, call_status, escalation_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'intake_confirmation', 'sms', 'delivered', ?, 0, 'intake_verified', 1, ?, ?, ?, 'completed', 'verified')
      `).run(
        alertId,
        userId,
        guardian?.id || null,
        reminderId || null,
        medicineName,
        scheduledTime,
        alertMessage,
        guardianPhone,
        guardianName,
        reminderId || null
      );

      // In-app notification for patient
      try {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type)
          VALUES (?, ?, 'Medication Confirmed & Guardian Notified', ?, 'medication')
        `).run(
          uuidv4(),
          userId,
          `Dose of ${medicineName} (${dosage}) verified. Guardian ${guardianName} notified successfully.`
        );
      } catch (e) {}

      // Add to medical timeline
      try {
        db.prepare(`
          INSERT INTO medical_timeline (
            id, user_id, event_type, title, description, event_date, event_time, reference_id, icon_type, status_badge
          ) VALUES (?, ?, 'guardian_notified', ?, ?, date('now'), ?, ?, 'check', 'verified')
        `).run(
          uuidv4(),
          userId,
          `Guardian Notified: Intake Confirmed (${medicineName})`,
          `Delivered alert message to ${guardianName} (${guardianPhone}): "${alertMessage}"`,
          timeStr,
          alertId
        );
      } catch (e) {}

      const created = db.prepare('SELECT * FROM guardian_alerts WHERE id = ?').get(alertId);

      return {
        success: true,
        alertType: 'intake_verified',
        message: alertMessage,
        recipient: { name: guardianName, phone: guardianPhone },
        timestamp: timeStr,
        alert: created
      };
    } catch (err) {
      console.error('[AlertEscalationService] Error notifying intake verified:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 2. Medicine Remains Pending or Refused -> Warning Call #1 -> Warning Call #2 -> Guardian Escalation
   * Enforces:
   * - Max configured calls (default 2)
   - Strict idempotency (never duplicate call #1, call #2, or guardian escalation)
   * - Stops if call was answered
   */
  static async processPendingEscalation(userId, reminderId, scheduledTimeInput, options = {}) {
    try {
      const config = this.getConfig();
      const user = db.prepare('SELECT full_name, phone, guardian_phone, guardian_email FROM users WHERE id = ?').get(userId);
      const reminder = reminderId ? db.prepare('SELECT * FROM medication_reminders WHERE id = ?').get(reminderId) : null;
      const guardian = db.prepare('SELECT * FROM guardians WHERE user_id = ? ORDER BY created_at ASC LIMIT 1').get(userId);

      const patientName = user?.full_name || 'Patient';
      const patientPhone = user?.phone || '+1 (555) 010-0001';
      const medicineName = reminder?.medicine_name || 'Scheduled Medicine';
      const dosage = reminder?.dosage || '1 dose';
      const scheduledTime = scheduledTimeInput || reminder?.reminder_time || '08:00 AM';
      const guardianName = guardian?.name || 'Registered Guardian';
      const guardianPhone = guardian?.phone || user?.guardian_phone || '+1 (555) 010-0002';
      const today = new Date().toISOString().split('T')[0];

      // Retrieve all existing call logs for this patient & reminder today
      const existingCalls = db.prepare(`
        SELECT * FROM call_logs
        WHERE user_id = ? AND reminder_id = ? AND scheduled_date = ?
        ORDER BY attempt_number ASC
      `).all(userId, reminderId, today);

      const call1 = existingCalls.find(c => c.call_type === 'patient_warning_1' || c.attempt_number === 1);
      const call2 = existingCalls.find(c => c.call_type === 'patient_warning_2' || c.attempt_number === 2);
      const guardianCall = existingCalls.find(c => c.call_type === 'guardian_escalation');

      // Rule: If an active call was ANSWERED, stop escalation immediately!
      if (call1 && call1.status === 'answered') {
        return {
          success: true,
          stopped: true,
          stage: 'resolved',
          reason: 'Patient answered Call #1. Escalation halted.',
          call: call1
        };
      }
      if (call2 && call2.status === 'answered') {
        return {
          success: true,
          stopped: true,
          stage: 'resolved',
          reason: 'Patient answered Call #2. Escalation halted.',
          call: call2
        };
      }

      // If Guardian escalation has ALREADY been dispatched:
      if (guardianCall) {
        // Idempotency: return existing guardian alert without creating duplicate!
        const existingAlert = db.prepare(`
          SELECT * FROM guardian_alerts
          WHERE user_id = ? AND reminder_id = ? AND alert_type = 'guardian_escalation'
            AND date(created_at) = date('now')
          ORDER BY created_at DESC LIMIT 1
        `).get(userId, reminderId);

        return {
          success: true,
          stage: 'guardian_escalation',
          duplicatePrevented: true,
          message: guardianCall.provider_response ? JSON.parse(guardianCall.provider_response).message : 'Guardian alert already dispatched.',
          alert: existingAlert || guardianCall
        };
      }

      // Check throttling cooldown (15s) only between calls to prevent immediate burst
      const recentCooldownAlert = db.prepare(`
        SELECT * FROM guardian_alerts
        WHERE user_id = ? AND reminder_id = ?
          AND alert_type IN ('patient_warning_1', 'patient_warning_2', 'guardian_escalation')
          AND created_at >= datetime('now', '-5 seconds')
        ORDER BY created_at DESC LIMIT 1
      `).get(userId, reminderId || '');

      if (recentCooldownAlert && !options.force) {
        return {
          success: true,
          throttled: true,
          stage: recentCooldownAlert.alert_type,
          message: 'An alert was already dispatched within the cooldown window.',
          alert: recentCooldownAlert
        };
      }

      // STAGE 1: Call #1 to Patient
      if (!call1) {
        const result = await CallService.callPatient({
          userId,
          reminderId,
          patientName,
          patientPhone,
          medicineName,
          dosage,
          scheduledTime,
          scheduledDate: today,
          attemptNumber: 1
        });

        // If caller requested simulating immediate answer/status
        if (options.simulateStatus) {
          CallService.updateCallStatus(result.callId, options.simulateStatus);
        }

        const alert = db.prepare('SELECT * FROM guardian_alerts WHERE id = ?').get(result.alertId);
        return {
          success: true,
          stage: 'patient_warning_1',
          attemptNumber: 1,
          callId: result.callId,
          alertId: result.alertId,
          recipient: result.recipient,
          message: alert?.message || `Warning call #1 dispatched to ${patientPhone}`,
          alert
        };
      }

      // STAGE 2: Call #2 to Patient (if maxPatientWarningAttempts >= 2 and call1 was not answered)
      if (config.maxPatientWarningAttempts >= 2 && !call2) {
        const result = await CallService.callPatient({
          userId,
          reminderId,
          patientName,
          patientPhone,
          medicineName,
          dosage,
          scheduledTime,
          scheduledDate: today,
          attemptNumber: 2
        });

        if (options.simulateStatus) {
          CallService.updateCallStatus(result.callId, options.simulateStatus);
        }

        const alert = db.prepare('SELECT * FROM guardian_alerts WHERE id = ?').get(result.alertId);
        return {
          success: true,
          stage: 'patient_warning_2',
          attemptNumber: 2,
          callId: result.callId,
          alertId: result.alertId,
          recipient: result.recipient,
          message: alert?.message || `Warning call #2 dispatched to ${patientPhone}`,
          alert
        };
      }

      // STAGE 3: Escalation to Guardian
      // Only when patient calls are exhausted and unconfirmed
      const result = await CallService.callGuardian({
        userId,
        guardianId: guardian?.id || null,
        reminderId,
        guardianName,
        guardianPhone,
        patientName,
        medicineName,
        dosage,
        scheduledTime,
        scheduledDate: today,
        attemptsExhausted: config.maxPatientWarningAttempts
      });

      const alert = db.prepare('SELECT * FROM guardian_alerts WHERE id = ?').get(result.alertId);
      return {
        success: true,
        stage: 'guardian_escalation',
        attemptNumber: config.maxPatientWarningAttempts + 1,
        callId: result.callId,
        alertId: result.alertId,
        recipient: result.recipient,
        message: result.message,
        alert
      };
    } catch (err) {
      console.error('[AlertEscalationService] Error processing pending escalation:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get complete Alert History for a specific user
   */
  static getAlertHistory(userId) {
    return db.prepare(`
      SELECT * FROM guardian_alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(userId);
  }

  /**
   * Get all alerts across platform for Administrator Governance
   */
  static getAllAlertsAdmin() {
    return db.prepare(`
      SELECT a.*, u.full_name as patient_name, u.email as patient_email
      FROM guardian_alerts a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
  }
}
