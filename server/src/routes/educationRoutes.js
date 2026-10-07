import { Router } from 'express';
import { EducationController } from '../controllers/educationController.js';

const router = Router();

// Public educational routes (accessible without login)
router.get('/articles', EducationController.getArticles);
router.get('/articles/:slug', EducationController.getArticleBySlug);
router.get('/categories', EducationController.getCategories);
router.get('/dictionary', EducationController.getDictionary);
router.get('/dictionary/:id', EducationController.getDictionaryTerm);

export default router;
