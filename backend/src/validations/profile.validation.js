/**
 * express-validator chains for profile endpoints.
 * Used via the `validate([...])` middleware.
 */
import { body } from 'express-validator';

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Organization must be at most 120 characters')
];

export const changeEmailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required')
];

export const changePasswordValidation = [
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('New password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('New password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain a special character'),
  body('confirmPassword')
    .isString()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Password confirmation must match new password')
];

export const uploadAvatarValidation = [
  body('avatar')
    .isString()
    .notEmpty()
    .withMessage('Avatar data is required')
    .matches(/^data:image\/(jpeg|jpg|png|webp);base64,/)
    .withMessage('Avatar must be a base64 data URL (data:image/jpeg|jpg|png|webp;base64,...)')
];
