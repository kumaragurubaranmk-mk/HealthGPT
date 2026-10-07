import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class RecordsController {
  /**
   * Get all health records for current user with optional category & search filter
   */
  static getRecords(req, res, next) {
    try {
      const { category, search } = req.query;
      let query = `SELECT * FROM health_records WHERE user_id = ?`;
      const params = [req.user.id];

      if (category && category !== 'all') {
        query += ` AND category = ?`;
        params.push(category);
      }

      if (search && search.trim() !== '') {
        query += ` AND (title LIKE ? OR doctor_name LIKE ? OR facility_name LIKE ? OR notes LIKE ?)`;
        const wild = `%${search.trim()}%`;
        params.push(wild, wild, wild, wild);
      }

      query += ` ORDER BY record_date DESC, created_at DESC`;

      const records = db.prepare(query).all(...params);
      res.status(200).json({ records });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new health record
   */
  static createRecord(req, res, next) {
    try {
      const {
        title,
        category,
        record_date,
        doctor_name,
        facility_name,
        notes,
        attachment_url,
        attachment_name
      } = req.body;

      if (!title || !category || !record_date) {
        return res.status(400).json({ error: 'Title, category, and record date are required.' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO health_records (
          id, user_id, title, category, record_date, doctor_name, facility_name, notes, attachment_url, attachment_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        req.user.id,
        title.trim(),
        category,
        record_date,
        doctor_name?.trim() || '',
        facility_name?.trim() || '',
        notes?.trim() || '',
        attachment_url || '',
        attachment_name || ''
      );

      const record = db.prepare(`SELECT * FROM health_records WHERE id = ?`).get(id);
      res.status(201).json({ message: 'Health record saved successfully.', record });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update existing record
   */
  static updateRecord(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        category,
        record_date,
        doctor_name,
        facility_name,
        notes,
        attachment_url,
        attachment_name
      } = req.body;

      // Verify ownership
      const existing = db.prepare(`SELECT id FROM health_records WHERE id = ? AND user_id = ?`).get(id, req.user.id);
      if (!existing) {
        return res.status(404).json({ error: 'Record not found or access denied.' });
      }

      db.prepare(`
        UPDATE health_records SET
          title = COALESCE(?, title),
          category = COALESCE(?, category),
          record_date = COALESCE(?, record_date),
          doctor_name = COALESCE(?, doctor_name),
          facility_name = COALESCE(?, facility_name),
          notes = COALESCE(?, notes),
          attachment_url = COALESCE(?, attachment_url),
          attachment_name = COALESCE(?, attachment_name)
        WHERE id = ? AND user_id = ?
      `).run(
        title?.trim(),
        category,
        record_date,
        doctor_name?.trim(),
        facility_name?.trim(),
        notes?.trim(),
        attachment_url,
        attachment_name,
        id,
        req.user.id
      );

      const updated = db.prepare(`SELECT * FROM health_records WHERE id = ?`).get(id);
      res.status(200).json({ message: 'Record updated successfully.', record: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete record
   */
  static deleteRecord(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare(`DELETE FROM health_records WHERE id = ? AND user_id = ?`).run(id, req.user.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      res.status(200).json({ message: 'Record deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
