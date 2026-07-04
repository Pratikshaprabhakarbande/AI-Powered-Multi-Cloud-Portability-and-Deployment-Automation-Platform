/**
 * Auth routes — /api/auth
 *
 *  POST   /register          public   register + receive tokens
 *  POST   /login             public   authenticate
 *  POST   /logout            auth     revoke refresh token
 *  POST   /refresh-token     public   rotate tokens
 *  GET    /profile           auth     current user
 *  PUT    /profile           auth     update profile / change password
 *  POST   /forgot-password   public   request reset token
 *  POST   /reset-password    public   complete reset
 */
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../validations/auth.validation.js';

const router = Router();

// Stricter rate limit on sensitive, unauthenticated endpoints.
router.post('/register', authLimiter, validate(registerValidation), authController.register);
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.post('/refresh-token', authLimiter, validate(refreshValidation), authController.refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordValidation), authController.resetPassword);

router.post('/logout', authenticate, validate(logoutValidation), authController.logout);
router.get('/profile', authenticate, authController.getProfile);
// DEPRECATED: Use the dedicated /api/profile endpoints instead (PUT /api/profile,
// PUT /api/profile/email, PUT /api/profile/password, POST /api/profile/avatar).
router.put('/profile', authenticate, validate(updateProfileValidation), authController.updateProfile);

export default router;
