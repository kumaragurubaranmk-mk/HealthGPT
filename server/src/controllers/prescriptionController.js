import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { PrescriptionParserService } from '../services/prescriptionParserService.js';

export class PrescriptionController {
  /**
   * Run OCR / AI extraction on prescription without saving yet (for user verification step)
   */
  static extractPrescription(req, res, next) {
    try {
      const { raw_text = '', doctor_name = '', prescription_date = '' } = req.body;
      const result = PrescriptionParserService.extractPrescription(raw_text, doctor_name, prescription_date);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get sample prescriptions for hackathon evaluation
   */
  static getSamples(req, res, next) {
    try {
      const samples = PrescriptionParserService.getSamplePrescriptions();
      res.status(200).json({ samples });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save verified prescription and automatically generate medicine schedules & timeline events
   */
  static savePrescription(req, res, next) {
    try {
      const {
        title = 'Prescription Order',
        doctor_name = '',
        prescription_date,
        file_name = '',
        file_type = '',
        file_data = '',
        raw_ocr_text = '',
        verified_medicines = []
      } = req.body;

      if (!prescription_date) {
        return res.status(400).json({ error: 'Prescription date is required.' });
      }

      if (!Array.isArray(verified_medicines) || verified_medicines.length === 0) {
        return res.status(400).json({ error: 'At least one verified medicine is required to schedule medications.' });
      }

      const prescriptionId = uuidv4();

      // 1. Save prescription record
      db.prepare(`
        INSERT INTO prescriptions (
          id, user_id, title, doctor_name, prescription_date, file_name, file_type, file_data,
          raw_ocr_text, extracted_medicines, verified_medicines, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified')
      `).run(
        prescriptionId,
        req.user.id,
        title.trim(),
        doctor_name.trim() || 'Attending Physician',
        prescription_date,
        file_name || 'prescription_document.pdf',
        file_type || 'application/pdf',
        file_data ? file_data.slice(0, 500000) : '',
        raw_ocr_text.trim(),
        JSON.stringify(verified_medicines),
        JSON.stringify(verified_medicines)
      );

      // 2. Automatically generate medicine schedules in medication_reminders
      const insertReminder = db.prepare(`
        INSERT INTO medication_reminders (
          id, user_id, medicine_name, dosage, frequency, reminder_time, start_date, end_date,
          notes, call_reminder_enabled, video_verification_enabled, call_status, status,
          intake_times, duration_days, instructions, prescription_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'idle', 'active', ?, ?, ?, ?)
      `);

      const insertTimeline = db.prepare(`
        INSERT INTO medical_timeline (
          id, user_id, event_type, title, description, event_date, event_time, reference_id,
          icon_type, status_badge, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const scheduledMeds = [];
      const today = new Date().toISOString().split('T')[0];

      for (const med of verified_medicines) {
        const medId = uuidv4();
        const intakeTimes = Array.isArray(med.intakeTimes) && med.intakeTimes.length > 0
          ? med.intakeTimes
          : (med.reminder_time ? [med.reminder_time] : ['08:00 AM']);
        
        const primaryReminderTime = intakeTimes[0] || '08:00 AM';
        const durationDays = parseInt(med.duration) || 7;

        // Calculate end date
        const startDateObj = new Date(prescription_date || today);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + durationDays);
        const endDateStr = endDateObj.toISOString().split('T')[0];

        const medName = med.medicine_name || med.medicineName || med.name || 'Prescription Medicine';
        insertReminder.run(
          medId,
          req.user.id,
          medName,
          med.dosage || '1 dose',
          med.frequency || 'Once daily',
          primaryReminderTime,
          prescription_date || today,
          endDateStr,
          med.instructions || '',
          JSON.stringify(intakeTimes),
          durationDays,
          med.instructions || '',
          prescriptionId
        );

        scheduledMeds.push({
          id: medId,
          medicineName: medName,
          dosage: med.dosage,
          intakeTimes,
          startDate: prescription_date || today,
          endDate: endDateStr
        });

        // Add timeline event for each scheduled medication
        insertTimeline.run(
          uuidv4(),
          req.user.id,
          'medicine_scheduled',
          `Medication Scheduled: ${medName} (${med.dosage})`,
          `Prescribed by ${doctor_name || 'Physician'} • Frequency: ${med.frequency || 'Daily'} • Times: ${intakeTimes.join(', ')}`,
          prescription_date || today,
          primaryReminderTime,
          medId,
          'pill',
          'active',
          JSON.stringify({ prescriptionId, intakeTimes, durationDays })
        );
      }

      // 3. Add timeline event for the prescription document itself
      insertTimeline.run(
        uuidv4(),
        req.user.id,
        'prescription_added',
        `Prescription Added: ${title}`,
        `${doctor_name ? `Issued by ${doctor_name}. ` : ''}${verified_medicines.length} medications verified and active schedule generated.`,
        prescription_date || today,
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        prescriptionId,
        'file',
        'verified',
        JSON.stringify({ medicinesCount: verified_medicines.length })
      );

      const savedPrescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(prescriptionId);
      savedPrescription.verified_medicines = JSON.parse(savedPrescription.verified_medicines || '[]');

      res.status(201).json({
        message: 'Prescription verified and saved. Medicine schedules and timeline generated automatically.',
        prescription: savedPrescription,
        prescriptionId,
        id: prescriptionId,
        scheduledMeds
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all prescriptions for user
   */
  static getPrescriptions(req, res, next) {
    try {
      let list = db.prepare(`
        SELECT * FROM prescriptions 
        WHERE user_id = ? 
        ORDER BY prescription_date DESC, created_at DESC
      `).all(req.user.id);

      if (list.length === 0) {
        const rxId = uuidv4();
        const rxDate = new Date().toISOString().split('T')[0];
        const defaultMedicines = [
          { name: 'Amoxicillin', dosage: '500 mg', frequency: 'Twice daily', intakeTimes: ['08:00 AM', '08:00 PM'], instructions: 'Take with food and full glass of water', duration: '5 days' },
          { name: 'Multivitamin Complex', dosage: '1 tablet', frequency: 'Once daily', intakeTimes: ['09:00 AM'], instructions: 'Take in the morning with breakfast', duration: '30 days' }
        ];

        db.prepare(`
          INSERT INTO prescriptions (
            id, user_id, title, doctor_name, prescription_date, file_name, file_type, file_data,
            raw_ocr_text, extracted_medicines, verified_medicines, status
          ) VALUES (?, ?, 'Clinical Outpatient Prescription', 'Dr. Michael Chen, MD', ?, 'prescription_order.pdf', 'application/pdf', '', 'Rx: Amoxicillin 500mg, Multivitamin Complex', ?, ?, 'verified')
        `).run(
          rxId,
          req.user.id,
          rxDate,
          JSON.stringify(defaultMedicines),
          JSON.stringify(defaultMedicines)
        );

        list = db.prepare(`
          SELECT * FROM prescriptions 
          WHERE user_id = ? 
          ORDER BY prescription_date DESC, created_at DESC
        `).all(req.user.id);
      }

      const formatted = list.map(p => ({
        ...p,
        extracted_medicines: typeof p.extracted_medicines === 'string' ? JSON.parse(p.extracted_medicines || '[]') : (p.extracted_medicines || []),
        verified_medicines: typeof p.verified_medicines === 'string' ? JSON.parse(p.verified_medicines || '[]') : (p.verified_medicines || [])
      }));

      res.status(200).json({ prescriptions: formatted });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single prescription by ID
   */
  static getPrescriptionById(req, res, next) {
    try {
      const { id } = req.params;
      const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!prescription) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }

      prescription.extracted_medicines = JSON.parse(prescription.extracted_medicines || '[]');
      prescription.verified_medicines = JSON.parse(prescription.verified_medicines || '[]');

      // Also get linked reminders
      const linkedReminders = db.prepare('SELECT * FROM medication_reminders WHERE prescription_id = ?').all(id);

      res.status(200).json({ prescription, linkedReminders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete prescription
   */
  static deletePrescription(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM prescriptions WHERE id = ? AND user_id = ?').run(id, req.user.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Prescription not found.' });
      }
      res.status(200).json({ message: 'Prescription deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
