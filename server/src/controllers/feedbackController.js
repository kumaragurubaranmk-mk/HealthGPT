import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class FeedbackController {
  static submitFeedback(req, res, next) {
    try {
      const { category, message, rating } = req.body;
      if (!category || !message) {
        return res.status(400).json({ error: 'Feedback category and message are required.' });
      }

      const id = uuidv4();
      const userId = req.user ? req.user.id : null;
      const userEmail = req.user ? req.user.email : (req.body.email || null);

      db.prepare(`
        INSERT INTO feedback (id, user_id, user_email, category, message, rating, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        id,
        userId,
        userEmail,
        category,
        message.trim(),
        rating ? Number(rating) : 5
      );

      res.status(201).json({ message: 'Thank you for your valuable feedback!' });
    } catch (err) {
      next(err);
    }
  }

  static getMyFeedback(req, res, next) {
    try {
      const list = db.prepare(`SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC`).all(req.user.id);
      res.status(200).json({ feedback: list });
    } catch (err) {
      next(err);
    }
  }
}
