import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class SosController {
  /**
   * Trigger Emergency SOS
   * Gathers dual emergency contacts + clinical snapshot (medications, allergies, blood group)
   * Enforces DEMO SOS disclosure
   */
  static triggerSos(req, res, next) {
    try {
      const {
        location_coords = null,
        user_notes = '',
        include_clinical_snapshot = true
      } = req.body;

      // 1. Gather User & Health Profile
      const user = db.prepare('SELECT id, full_name, phone, guardian_phone, guardian_email FROM users WHERE id = ?').get(req.user.id);
      const healthProfile = db.prepare(`
        SELECT blood_group, allergies, existing_conditions, current_medications,
               emergency_contact_name, emergency_contact_phone, emergency_contact_relation
        FROM health_profiles WHERE user_id = ?
      `).get(req.user.id) || {};

      // 2. Active medications
      const activeMeds = db.prepare(`
        SELECT medicine_name, dosage, frequency FROM medication_reminders 
        WHERE user_id = ? AND status = 'active'
      `).all(req.user.id);

      // 3. Registered guardian
      const guardian = db.prepare('SELECT name, relation, phone FROM guardians WHERE user_id = ? LIMIT 1').get(req.user.id);

      // Contact 1: Ambulance / Emergency Services
      const contact1 = {
        name: 'National Emergency Dispatch (Ambulance)',
        phone: '108 / 112 / 911',
        type: 'ambulance',
        action: 'Simulated Emergency Dispatch Request'
      };

      // Contact 2: Guardian / Primary Emergency Contact
      const contact2 = {
        name: guardian?.name || healthProfile.emergency_contact_name || 'Designated Guardian',
        phone: guardian?.phone || healthProfile.emergency_contact_phone || user?.guardian_phone || 'Unassigned',
        relation: guardian?.relation || healthProfile.emergency_contact_relation || 'Family / Guardian',
        type: 'guardian',
        action: 'Simulated High-Priority Alert & Location Push'
      };

      // 4. Clinical Emergency Snapshot
      const clinicalSnapshot = include_clinical_snapshot ? {
        patientName: user.full_name,
        bloodGroup: healthProfile.blood_group || 'Unknown',
        allergies: healthProfile.allergies || 'No known drug allergies reported',
        existingConditions: healthProfile.existing_conditions || 'None specified',
        activeMedications: activeMeds.map(m => `${m.medicine_name} (${m.dosage})`).join(', ') || healthProfile.current_medications || 'None recorded',
        location: location_coords ? `${location_coords.latitude}, ${location_coords.longitude}` : 'Current Device Geolocation',
        timestamp: new Date().toISOString()
      } : null;

      // 5. Log SOS in database
      const id = uuidv4();
      const locationText = location_coords
        ? `Lat: ${location_coords.latitude}, Lon: ${location_coords.longitude} (${location_coords.accuracy || 10}m accuracy)`
        : 'Browser GPS Simulation';

      db.prepare(`
        INSERT INTO emergency_sos_logs (
          id, user_id, contact1_type, contact1_phone, contact2_name, contact2_phone,
          location_info, medical_snapshot, status, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo_dispatched', 1)
      `).run(
        id,
        req.user.id,
        contact1.type,
        contact1.phone,
        contact2.name,
        contact2.phone,
        locationText,
        JSON.stringify(clinicalSnapshot)
      );

      res.status(200).json({
        id,
        status: 'demo_dispatched',
        is_demo: true,
        contact1,
        contact2,
        clinicalSnapshot,
        notes: user_notes,
        disclaimer: 'DEMO SOS WORKFLOW: Telephony and real-time ambulance dispatch systems are running in simulation/demonstration mode. HealthGPT did NOT call actual paramedics or 911/108. In a real life-threatening emergency, immediately dial your local emergency telephone number directly.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get SOS activation history
   */
  static getHistory(req, res, next) {
    try {
      const logs = db.prepare(`
        SELECT * FROM emergency_sos_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 10
      `).all(req.user.id);

      const parsed = logs.map(l => ({
        ...l,
        medical_snapshot: l.medical_snapshot ? JSON.parse(l.medical_snapshot) : null
      }));

      res.status(200).json({ logs: parsed });
    } catch (err) {
      next(err);
    }
  }
}
