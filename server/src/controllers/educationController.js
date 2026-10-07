import { db } from '../database/db.js';

export class EducationController {
  /**
   * Get educational articles with category filter and search
   */
  static getArticles(req, res, next) {
    try {
      const { category, search } = req.query;
      let query = `SELECT id, title, slug, category, summary, read_time, author, tags, created_at FROM education_content WHERE is_published = 1`;
      const params = [];

      if (category && category !== 'all') {
        query += ` AND category = ?`;
        params.push(category);
      }

      if (search && search.trim() !== '') {
        query += ` AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)`;
        const wild = `%${search.trim()}%`;
        params.push(wild, wild, wild);
      }

      query += ` ORDER BY created_at DESC`;

      const articles = db.prepare(query).all(...params);
      res.status(200).json({ articles });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single article by slug
   */
  static getArticleBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const article = db.prepare(`SELECT * FROM education_content WHERE slug = ? AND is_published = 1`).get(slug);

      if (!article) {
        return res.status(404).json({ error: 'Article not found.' });
      }

      res.status(200).json({ article });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get list of categories with article counts
   */
  static getCategories(req, res, next) {
    try {
      const categories = db.prepare(`
        SELECT category, COUNT(*) as article_count 
        FROM education_content 
        WHERE is_published = 1 
        GROUP BY category
      `).all();

      res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Search and retrieve medical dictionary entries
   */
  static getDictionary(req, res, next) {
    try {
      const { search, letter } = req.query;
      let query = `SELECT * FROM medical_dictionary WHERE 1=1`;
      const params = [];

      if (letter && letter.length === 1) {
        query += ` AND UPPER(SUBSTR(term, 1, 1)) = ?`;
        params.push(letter.toUpperCase());
      }

      if (search && search.trim() !== '') {
        query += ` AND (term LIKE ? OR simple_definition LIKE ? OR clinical_context LIKE ?)`;
        const wild = `%${search.trim()}%`;
        params.push(wild, wild, wild);
      }

      query += ` ORDER BY term ASC`;

      const terms = db.prepare(query).all(...params);
      res.status(200).json({ terms });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single dictionary entry
   */
  static getDictionaryTerm(req, res, next) {
    try {
      const { id } = req.params;
      const term = db.prepare(`SELECT * FROM medical_dictionary WHERE id = ?`).get(id);

      if (!term) {
        return res.status(404).json({ error: 'Medical term not found.' });
      }

      res.status(200).json({ term });
    } catch (err) {
      next(err);
    }
  }
}
