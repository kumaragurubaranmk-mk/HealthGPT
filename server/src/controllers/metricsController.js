import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class MetricsController {
  /**
   * Get health metrics for current user
   */
  static getMetrics(req, res, next) {
    try {
      const { metric_type, days } = req.query;
      let query = `SELECT * FROM health_metrics WHERE user_id = ?`;
      const params = [req.user.id];

      if (metric_type && metric_type !== 'all') {
        query += ` AND metric_type = ?`;
        params.push(metric_type);
      }

      if (days && Number(days) > 0) {
        const sinceDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();
        query += ` AND recorded_at >= ?`;
        params.push(sinceDate);
      }

      query += ` ORDER BY recorded_at ASC`;

      const metrics = db.prepare(query).all(...params);
      res.status(200).json({ metrics });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record new health metric
   */
  static addMetric(req, res, next) {
    try {
      const {
        metric_type,
        metric_value,
        secondary_value,
        unit,
        recorded_at,
        notes
      } = req.body;

      if (!metric_type || metric_value === undefined || !unit) {
        return res.status(400).json({ error: 'Metric type, value, and unit are required.' });
      }

      const id = uuidv4();
      const recordDate = recorded_at || new Date().toISOString();

      db.prepare(`
        INSERT INTO health_metrics (
          id, user_id, metric_type, metric_value, secondary_value, unit, recorded_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        req.user.id,
        metric_type,
        Number(metric_value),
        secondary_value !== undefined && secondary_value !== '' ? Number(secondary_value) : null,
        unit,
        recordDate,
        notes?.trim() || ''
      );

      const metric = db.prepare(`SELECT * FROM health_metrics WHERE id = ?`).get(id);
      res.status(201).json({ message: 'Health metric recorded.', metric });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete metric
   */
  static deleteMetric(req, res, next) {
    try {
      const { id } = req.params;
      const result = db.prepare(`DELETE FROM health_metrics WHERE id = ? AND user_id = ?`).run(id, req.user.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Metric not found.' });
      }
      res.status(200).json({ message: 'Metric record deleted.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get latest snapshot across all tracked metrics
   */
  static getDashboardSummary(req, res, next) {
    try {
      const metricTypes = ['weight', 'blood_pressure', 'heart_rate', 'blood_glucose', 'sleep', 'water', 'exercise'];
      const summary = {};

      const stmt = db.prepare(`
        SELECT * FROM health_metrics 
        WHERE user_id = ? AND metric_type = ? 
        ORDER BY recorded_at DESC 
        LIMIT 1
      `);

      for (const type of metricTypes) {
        const latest = stmt.get(req.user.id, type);
        summary[type] = latest || null;
      }

      res.status(200).json({ summary });
    } catch (err) {
      next(err);
    }
  }
}
