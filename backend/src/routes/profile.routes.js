/**
 * Profile routes — /api/profile
 *
 *  GET    /              auth   get current user profile
 *  PUT    /              auth   update profile (name, organization)
 *  PUT    /email         auth   change email (requires password verification)
 *  PUT    /password      auth   change password
 *  POST   /avatar        auth   upload avatar (base64 data URL)
 */
import { Router } from 'express';
import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  updateProfileValidation,
  changeEmailValidation,
  changePasswordValidation,
  uploadAvatarValidation
} from '../validations/profile.validation.js';

const router = Router();

// All profile routes require authentication.
router.use(authenticate);

// GET /api/profile - get current user profile
router.get('/', authController.getProfile);

// PUT /api/profile - update basic profile fields (name, organization)
router.put('/', validate(updateProfileValidation), authController.updateProfile);

// PUT /api/profile/email - change email with password verification
router.put('/email', authLimiter, validate(changeEmailValidation), authController.changeEmail);

// PUT /api/profile/password - change password
router.put('/password', authLimiter, validate(changePasswordValidation), authController.changePassword);

// POST /api/profile/avatar - upload avatar (base64)
// Use a higher body size limit for avatar uploads (10MB to accommodate base64-encoded images)
router.post(
  '/avatar',
  express.json({ limit: '10mb' }),
  validate(uploadAvatarValidation),
  authController.uploadAvatar
);

export default router;
