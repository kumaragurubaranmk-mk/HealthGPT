import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'healthgpt_super_secure_jwt_secret_dev_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'healthgpt_super_admin_jwt_secret_dev_2026',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../database/healthgpt.db'),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  activeAiProvider: process.env.ACTIVE_AI_PROVIDER || 'builtin', // 'builtin' | 'gemini' | 'openai'
  nodeEnv: process.env.NODE_ENV || 'development'
};
