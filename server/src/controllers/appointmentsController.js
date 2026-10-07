import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentsController {
  static getAppointments(req, res, next) {
    try {
      const appointments = db.prepare(`
        SELECT * FROM appointments 
        WHERE user_id = ? 
        ORDER BY appointment_date ASC, appointment_time ASC
      `).all(req.user.id);
      res.status(200).json({ appointments });
    } catch (err) {
      next(err);
    }
  }

  static createAppointment(req, res, next) {
    try {
      const { doctor_name, specialty, appointment_date, appointment_time, location, is_virtual, notes } = req.body;
      if (!doctor_name || !appointment_date || !appointment_time) {
        return res.status(400).json({ error: 'Doctor name, date, and time are required.' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO appointments (
          id, user_id, doctor_name, specialty, appointment_date, appointment_time, location, is_virtual, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      `).run(
        id,
        req.user.id,
        doctor_name.trim(),
        specialty?.trim() || '',
        appointment_date,
        appointment_time,
        location?.trim() || '',
        is_virtual ? 1 : 0,
        notes?.trim() || ''
      );

      const appointment = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id);
      res.status(201).json({ message: 'Appointment added successfully.', appointment });
    } catch (err) {
      next(err);
    }
  }

  static updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { doctor_name, specialty, appointment_date, appointment_time, location, is_virtual, notes, status } = req.body;

      const existing = db.prepare(`SELECT id FROM appointments WHERE id = ? AND user_id = ?`).get(id, req.user.id);
      if (!existing) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      db.prepare(`
        UPDATE appointments SET
          doctor_name = COALESCE(?, doctor_name),
          specialty = COALESCE(?, specialty),
          appointment_date = COALESCE(?, appointment_date),
          appointment_time = COALESCE(?, appointment_time),
          location = COALESCE(?, location),
          is_virtual = COALESCE(?, is_virtual),
          notes = COALESCE(?, notes),
          status = COALESCE(?, status)
        WHERE id = ? AND user_id = ?
      `).run(
        doctor_name?.trim(),
        specialty?.trim(),
        appointment_date,
        appointment_time,
        location?.trim(),
        is_virtual !== undefined ? (is_virtual ? 1 : 0) : null,
        notes?.trim(),
        status,
        id,
        req.user.id
      );

      const updated = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id);
      res.status(200).json({ message: 'Appointment updated.', appointment: updated });
    } catch (err) {
      next(err);
    }
  }

  static deleteAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare(`DELETE FROM appointments WHERE id = ? AND user_id = ?`).run(id, req.user.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      res.status(200).json({ message: 'Appointment removed.' });
    } catch (err) {
      next(err);
    }
  }
}
