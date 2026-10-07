import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { config } from '../config/env.js';
import { OTPService } from '../services/otpService.js';

export class AuthController {
  /**
   * User Registration
   * Creates unverified user, generates OTP for verification
   */
  static async register(req, res, next) {
    try {
      const {
        full_name,
        email,
        guardian_email,
        phone,
        guardian_phone,
        date_of_birth,
        password,
        confirmPassword
      } = req.body;

      // Validation
      if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Full name, email, and password are required.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const emailClean = email.trim().toLowerCase();

      // Check if user already exists
      const existing = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(emailClean);
      if (existing) {
        if (existing.is_verified) {
          return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
        } else {
          // Resend OTP for unverified user
          const { otpCode } = OTPService.generateOTP(emailClean, 'register');
          return res.status(200).json({
            message: 'An unverified account exists with this email. A new verification OTP has been sent.',
            email: emailClean,
            devOtp: otpCode // Provided for hackathon/presentation convenience
          });
        }
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const userId = uuidv4();

      // Insert new unverified user
      db.prepare(`
        INSERT INTO users (id, full_name, email, guardian_email, phone, guardian_phone, date_of_birth, password_hash, is_verified, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
      `).run(
        userId,
        full_name.trim(),
        emailClean,
        guardian_email?.trim() || null,
        phone?.trim() || null,
        guardian_phone?.trim() || null,
        date_of_birth || null,
        passwordHash
      );

      // Generate verification OTP
      const { otpCode } = OTPService.generateOTP(emailClean, 'register');

      res.status(201).json({
        message: 'Account created successfully! Please verify your email with the OTP code.',
        email: emailClean,
        devOtp: otpCode
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Registration OTP
   * Activates account and initializes completely empty health profile
   */
  static async verifyOtp(req, res, next) {
    try {
      const { email, otpCode } = req.body;
      if (!email || !otpCode) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const emailClean = email.trim().toLowerCase();
      const verification = OTPService.verifyOTP(emailClean, otpCode.trim(), 'register');

      if (!verification.valid) {
        return res.status(400).json({ error: verification.message });
      }

      // Mark user as verified
      db.prepare(`UPDATE users SET is_verified = 1 WHERE email = ?`).run(emailClean);

      const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(emailClean);

      // Initialize empty health profile & empty user profile if not exists
      const existingHealthProfile = db.prepare('SELECT id FROM health_profiles WHERE user_id = ?').get(user.id);
      if (!existingHealthProfile) {
        db.prepare(`
          INSERT INTO health_profiles (id, user_id) 
          VALUES (?, ?)
        `).run(uuidv4(), user.id);
      }

      const existingUserProfile = db.prepare('SELECT id FROM user_profiles WHERE user_id = ?').get(user.id);
      if (!existingUserProfile) {
        db.prepare(`
          INSERT INTO user_profiles (id, user_id) 
          VALUES (?, ?)
        `).run(uuidv4(), user.id);
      }

      // Generate JWT session token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const userProfileRow = db.prepare('SELECT preferred_language FROM user_profiles WHERE user_id = ?').get(user.id);

      res.status(200).json({
        message: 'Account verified successfully!',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          guardian_email: user.guardian_email,
          guardian_phone: user.guardian_phone,
          date_of_birth: user.date_of_birth,
          preferred_language: userProfileRow?.preferred_language || 'en'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resend Verification OTP
   */
  static async resendOtp(req, res, next) {
    try {
      const { email, purpose = 'register' } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const emailClean = email.trim().toLowerCase();
      const user = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(emailClean);
      if (!user) {
        return res.status(404).json({ error: 'No account associated with this email.' });
      }

      const { otpCode } = OTPService.generateOTP(emailClean, purpose);

      res.status(200).json({
        message: 'Verification code resent successfully.',
        devOtp: otpCode
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User Login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const emailClean = email.trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailClean);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (!user.is_verified) {
        // Send fresh OTP and prompt client for verification step
        const { otpCode } = OTPService.generateOTP(emailClean, 'register');
        return res.status(403).json({
          error: 'Your email has not been verified yet.',
          unverified: true,
          email: user.email,
          devOtp: otpCode
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'This account has been suspended. Please contact platform support.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const userProfileRow = db.prepare('SELECT preferred_language FROM user_profiles WHERE user_id = ?').get(user.id);

      res.status(200).json({
        message: 'Sign in successful.',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          guardian_email: user.guardian_email,
          guardian_phone: user.guardian_phone,
          date_of_birth: user.date_of_birth,
          preferred_language: userProfileRow?.preferred_language || 'en'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Forgot Password - Send OTP
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const emailClean = email.trim().toLowerCase();
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(emailClean);

      if (!user) {
        // Obscure account presence for privacy
        return res.status(200).json({
          message: 'If an account matches this email, a password reset code has been issued.'
        });
      }

      const { otpCode } = OTPService.generateOTP(emailClean, 'forgot_password');

      res.status(200).json({
        message: 'Password reset code generated.',
        email: emailClean,
        devOtp: otpCode
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset Password with OTP
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, otpCode, newPassword, confirmPassword } = req.body;
      if (!email || !otpCode || !newPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const emailClean = email.trim().toLowerCase();
      const verification = OTPService.verifyOTP(emailClean, otpCode.trim(), 'forgot_password');

      if (!verification.valid) {
        return res.status(400).json({ error: verification.message });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(newPassword, salt);

      db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?`).run(
        passwordHash,
        emailClean
      );

      res.status(200).json({ message: 'Password has been reset successfully. Please sign in.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Current Authenticated User Session Info
   */
  static async me(req, res, next) {
    try {
      const user = db.prepare(`
        SELECT id, full_name, email, guardian_email, phone, guardian_phone, date_of_birth, created_at 
        FROM users 
        WHERE id = ?
      `).get(req.user.id);

      const userProfile = db.prepare(`SELECT * FROM user_profiles WHERE user_id = ?`).get(req.user.id) || {};
      const healthProfile = db.prepare(`SELECT * FROM health_profiles WHERE user_id = ?`).get(req.user.id) || {};

      if (user) {
        user.preferred_language = userProfile?.preferred_language || 'en';
      }

      res.status(200).json({
        user,
        userProfile,
        healthProfile
      });
    } catch (err) {
      next(err);
    }
  }
}
