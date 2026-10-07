import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../database/db.js';

export function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Administrative authorization token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.adminJwtSecret);

    const admin = db.prepare(`
      SELECT id, username, email, role 
      FROM admin_users 
      WHERE id = ?
    `).get(decoded.id);

    if (!admin) {
      return res.status(401).json({ error: 'Administrator account does not exist.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin session expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid or forged administrative token.' });
  }
}
