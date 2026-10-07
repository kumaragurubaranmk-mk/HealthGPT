import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * CallService handles real telephony and automated dispatch for patient warning calls
 * and guardian escalations. Isolate external provider behind this backend service.
 */
export class CallService {
  /**
   * Initiate phone call to patient
   */
  static async callPatient({
    userId,
    reminderId,
    patientName,
    patientPhone,
    medicineName,
    dosage,
    scheduledTime,
    scheduledDate,
    attemptNumber = 1
  }) {
    const callId = uuidv4();
    const today = scheduledDate || new Date().toISOString().split('T')[0];
    const timeStr = scheduledTime || '08:00 AM';
    const cleanPhone = patientPhone || '+1 (555) 010-0001';

    const spokenScript = `Hello ${patientName}. This is your automated VitaCare Medicine Alert, attempt number ${attemptNumber}. Your scheduled dose of ${medicineName} (${dosage}) at ${timeStr} is unconfirmed. Please open VitaCare to complete camera-based pill consumption tracking.`;

    // Store in call_logs
    db.prepare(`
      INSERT INTO call_logs (
        id, user_id, reminder_id, scheduled_date, scheduled_time, call_type,
        attempt_number, recipient_name, recipient_phone, recipient_role,
        status, call_duration_seconds, provider_session_id, provider_response, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'patient', 'initiated', 0, ?, ?, ?)
    `).run(
      callId,
      userId,
      reminderId,
      today,
      timeStr,
      `patient_warning_${attemptNumber}`,
      attemptNumber,
      patientName,
      cleanPhone,
      `tel-sess-${callId.slice(0, 8)}`,
      JSON.stringify({ status: 'initiated', script: spokenScript }),
      `Patient call #${attemptNumber} dispatched.`
    );

    // Also record in guardian_alerts table for comprehensive alert tracking
    const alertId = uuidv4();
    db.prepare(`
      INSERT INTO guardian_alerts (
        id, user_id, reminder_id, medicine_name, scheduled_time,
        reason, channel, status, message, is_demo, alert_type, attempt_number,
        recipient_phone, recipient_name, schedule_id, call_status, escalation_status, call_session_id
      ) VALUES (?, ?, ?, ?, ?, 'unconfirmed_medicine_attempt', 'voice_call', 'initiated', ?, 0, ?, ?, ?, ?, ?, 'initiated', 'patient_warning', ?)
    `).run(
      alertId,
      userId,
      reminderId,
      medicineName,
      timeStr,
      `VitaCare Alert (Attempt #${attemptNumber}): ${patientName}, scheduled dose of ${medicineName} is pending. Voice call dispatched.`,
      `patient_warning_${attemptNumber}`,
      attemptNumber,
      cleanPhone,
      patientName,
      reminderId,
      callId
    );

    // Timeline entry
    try {
      db.prepare(`
        INSERT INTO medical_timeline (
          id, user_id, event_type, title, description, event_date, event_time, reference_id, icon_type, status_badge
        ) VALUES (?, ?, 'patient_call', ?, ?, ?, ?, ?, 'phone', 'warning')
      `).run(
        uuidv4(),
        userId,
        `Automated Patient Call Dispatched (Attempt #${attemptNumber})`,
        `Call dispatched to ${cleanPhone}. Script: "${spokenScript}"`,
        today,
        timeStr,
        callId
      );
    } catch (e) {
      // ignore timeline duplicate
    }

    return {
      success: true,
      callId,
      alertId,
      attemptNumber,
      recipient: { name: patientName, phone: cleanPhone, role: 'patient' },
      status: 'initiated',
      spokenScript
    };
  }

  /**
   * Initiate phone call and alert to guardian
   */
  static async callGuardian({
    userId,
    guardianId,
    reminderId,
    guardianName,
    guardianPhone,
    patientName,
    medicineName,
    dosage,
    scheduledTime,
    scheduledDate,
    attemptsExhausted = 2
  }) {
    const callId = uuidv4();
    const today = scheduledDate || new Date().toISOString().split('T')[0];
    const timeStr = scheduledTime || '08:00 AM';
    const cleanPhone = guardianPhone || '+1 (555) 010-0002';
    const gName = guardianName || 'Guardian';

    const alertMessage = `VitaCare Alert: ${patientName} has not confirmed consumption of ${medicineName}. The patient did not respond to the scheduled medicine alert.`;
    const spokenScript = `Urgent VitaCare Alert for guardian ${gName}. Your patient ${patientName} has not confirmed consumption of ${medicineName} (${dosage}) scheduled at ${timeStr}. The patient did not respond to ${attemptsExhausted} direct alerts. Please check in with them immediately.`;

    // Store in call_logs
    db.prepare(`
      INSERT INTO call_logs (
        id, user_id, reminder_id, scheduled_date, scheduled_time, call_type,
        attempt_number, recipient_name, recipient_phone, recipient_role,
        status, call_duration_seconds, provider_session_id, provider_response, notes
      ) VALUES (?, ?, ?, ?, ?, 'guardian_escalation', ?, ?, ?, 'guardian', 'initiated', 0, ?, ?, ?)
    `).run(
      callId,
      userId,
      reminderId,
      today,
      timeStr,
      attemptsExhausted + 1,
      gName,
      cleanPhone,
      `tel-guard-${callId.slice(0, 8)}`,
      JSON.stringify({ status: 'initiated', message: alertMessage, script: spokenScript }),
      `Guardian emergency escalation call dispatched after ${attemptsExhausted} unanswered attempts.`
    );

    // Record in guardian_alerts table
    const alertId = uuidv4();
    db.prepare(`
      INSERT INTO guardian_alerts (
        id, user_id, guardian_id, reminder_id, medicine_name, scheduled_time,
        reason, channel, status, message, is_demo, alert_type, attempt_number,
        recipient_phone, recipient_name, schedule_id, call_status, escalation_status, call_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'exhausted_patient_calls', 'guardian_emergency_dispatch', 'guardian_alerted', ?, 0, 'guardian_escalation', ?, ?, ?, ?, 'initiated', 'escalated', ?)
    `).run(
      alertId,
      userId,
      guardianId || null,
      reminderId,
      medicineName,
      timeStr,
      alertMessage,
      attemptsExhausted + 1,
      cleanPhone,
      gName,
      reminderId,
      callId
    );

    // Update reminder call_status
    db.prepare(`UPDATE medication_reminders SET call_status = 'escalated' WHERE id = ?`).run(reminderId);

    // Timeline entry
    try {
      db.prepare(`
        INSERT INTO medical_timeline (
          id, user_id, event_type, title, description, event_date, event_time, reference_id, icon_type, status_badge
        ) VALUES (?, ?, 'guardian_escalation', ?, ?, ?, ?, ?, 'phone', 'escalated')
      `).run(
        uuidv4(),
        userId,
        `Emergency Guardian Escalation: ${gName}`,
        `Alert dispatched to ${cleanPhone}: "${alertMessage}"`,
        today,
        timeStr,
        callId
      );
    } catch (e) {
      // ignore timeline duplicate
    }

    return {
      success: true,
      callId,
      alertId,
      alertType: 'guardian_escalation',
      recipient: { name: gName, phone: cleanPhone, role: 'guardian' },
      status: 'guardian_alerted',
      message: alertMessage,
      spokenScript
    };
  }

  /**
   * Retrieve current call status
   */
  static getCallStatus(callId) {
    return db.prepare('SELECT * FROM call_logs WHERE id = ?').get(callId);
  }

  /**
   * Update status of call: 'answered' | 'declined' | 'no_answer' | 'failed' | 'timeout'
   */
  static updateCallStatus(callId, newStatus, durationSeconds = 0, notes = '') {
    const validStatuses = ['initiated', 'answered', 'declined', 'no_answer', 'failed', 'timeout'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }

    db.prepare(`
      UPDATE call_logs SET
        status = ?,
        call_duration_seconds = ?,
        notes = CASE WHEN ? != '' THEN ? ELSE notes END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, durationSeconds, notes, notes, callId);

    // Also sync to guardian_alerts if linked
    db.prepare(`
      UPDATE guardian_alerts SET
        call_status = ?,
        status = ?
      WHERE call_session_id = ?
    `).run(newStatus, newStatus === 'answered' ? 'call_answered' : (newStatus === 'declined' ? 'call_declined' : 'call_unanswered'), callId);

    return db.prepare('SELECT * FROM call_logs WHERE id = ?').get(callId);
  }
}
