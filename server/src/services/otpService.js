import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export class OTPService {
  /**
   * Generates a 6-digit OTP code and records it in the database
   */
  static generateOTP(email, purpose = 'register') {
    // Generate secure 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Invalidate prior unused OTPs for this email and purpose
    db.prepare(`
      UPDATE otp_verifications 
      SET is_used = 1 
      WHERE email = ? AND purpose = ? AND is_used = 0
    `).run(email, purpose);

    // Insert new OTP record
    const id = uuidv4();
    db.prepare(`
      INSERT INTO otp_verifications (id, email, otp_code, purpose, expires_at, is_used)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, email, otpCode, purpose, expiresAt);

    console.log(`[OTP] Generated verification OTP for ${email} (${purpose}): [ ${otpCode} ] (Valid for 10 minutes)`);

    return {
      otpCode,
      expiresAt
    };
  }

  /**
   * Verifies if the provided OTP code is valid and unexpired
   */
  static verifyOTP(email, otpCode, purpose = 'register') {
    const record = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE email = ? AND otp_code = ? AND purpose = ? AND is_used = 0
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(email, otpCode, purpose);

    if (!record) {
      return { valid: false, message: 'Invalid or expired verification code.' };
    }

    const now = new Date();
    const expiry = new Date(record.expires_at);

    if (now > expiry) {
      return { valid: false, message: 'Verification code has expired. Please request a new code.' };
    }

    // Mark as used
    db.prepare(`UPDATE otp_verifications SET is_used = 1 WHERE id = ?`).run(record.id);

    return { valid: true };
  }
}
