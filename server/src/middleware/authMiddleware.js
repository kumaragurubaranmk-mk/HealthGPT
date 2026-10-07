import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../database/db.js';

export function authenticateUser(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required. Please sign in.' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = db.prepare(`
      SELECT id, full_name, email, is_verified, status 
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been temporarily suspended. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

export function optionalAuthUser(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = db.prepare(`
          SELECT id, full_name, email, is_verified, status 
          FROM users 
          WHERE id = ?
        `).get(decoded.id);

        if (user && user.status !== 'suspended') {
          req.user = user;
          return next();
        }
      } catch (e) {}
    }

    // Default guest/demo user for unauthenticated copilot sessions
    const defaultUser = db.prepare('SELECT id, full_name, email, is_verified, status FROM users ORDER BY created_at ASC LIMIT 1').get();
    req.user = defaultUser || {
      id: 'guest-patient-default',
      full_name: 'Patient',
      email: 'patient@vitacare.ai',
      is_verified: 1,
      status: 'active'
    };
    next();
  } catch (err) {
    next();
  }
}
