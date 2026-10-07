import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
  /**
   * Records an administrative action in the audit_logs table
   */
  static log({ adminId = 'system', action, targetType, targetId = '', details = '', ipAddress = '' }) {
    try {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, adminId, action, targetType, targetId, details, ipAddress);
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err.message);
    }
  }

  static getLogs(limit = 100) {
    return db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  }
}
