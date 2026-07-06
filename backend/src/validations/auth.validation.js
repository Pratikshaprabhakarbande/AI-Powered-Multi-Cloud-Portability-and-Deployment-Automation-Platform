/**
 * express-validator chains for auth endpoints.
 * Used via the `validate([...])` middleware.
 */
import { body } from 'express-validator';
import { ROLE_VALUES } from '../config/constants.js';

const strongPassword = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[a-z]/)
  .withMessage('Password must contain a lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password must contain an uppercase letter')
  .matches(/\d/)
  .withMessage('Password must contain a number');

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPassword,
  // Role is optional at registration; if provided it must be valid.
  // (Assigning privileged roles is restricted in the service layer.)
  body('role').optional().isIn(ROLE_VALUES).withMessage('Invalid role'),
  body('organization').optional().trim().isLength({ max: 120 })
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required')
];

export const refreshValidation = [
  // Optional: the refresh token may come from the body (Bearer flow) or the
  // HttpOnly cookie (cookie flow). A missing/invalid token yields 401 in the service.
  body('refreshToken').optional().isString()
];

export const logoutValidation = [
  body('refreshToken').optional().isString()
];

export const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('organization').optional().trim().isLength({ max: 120 }),
  body('avatarUrl').optional().custom((value) => {
    // Allow both standard URLs and base64 data URLs
    if (value.startsWith('data:image/')) return true;
    // Basic URL validation for non-data URLs
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('avatarUrl must be a valid URL or a base64 data URL');
    }
  }),
  body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
  body('preferences.defaultProvider').optional().isIn(['aws', 'azure', 'gcp']),
  body('preferences.emailNotifications').optional().isBoolean(),
  // Password change (optional): requires current + new password
  body('currentPassword').optional().isString(),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
];

export const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail()
];

export const resetPasswordValidation = [
  body('token').isString().notEmpty().withMessage('Reset token is required'),
  strongPassword
];
