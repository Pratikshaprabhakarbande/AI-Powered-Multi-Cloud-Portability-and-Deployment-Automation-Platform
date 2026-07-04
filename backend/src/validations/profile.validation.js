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

// ---- Extended profile validations ----

export const updateExtendedProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Organization must be at most 120 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be at most 500 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-().]{7,20}$/)
    .withMessage('Phone must be a valid phone number'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Country must be at most 80 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must be at most 100 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be at most 100 characters')
];

export const verify2FAValidation = [
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Verification token is required')
    .matches(/^\d{6}$/)
    .withMessage('Token must be a 6-digit code')
];

export const disable2FAValidation = [
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required')
];

export const updateNotificationPrefsValidation = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  body('securityAlerts')
    .optional()
    .isBoolean()
    .withMessage('securityAlerts must be a boolean'),
  body('deploymentNotifications')
    .optional()
    .isBoolean()
    .withMessage('deploymentNotifications must be a boolean'),
  body('monitoringAlerts')
    .optional()
    .isBoolean()
    .withMessage('monitoringAlerts must be a boolean'),
  body('marketingEmails')
    .optional()
    .isBoolean()
    .withMessage('marketingEmails must be a boolean')
];

export const connectCloudAccountValidation = [
  body('provider')
    .isString()
    .notEmpty()
    .withMessage('Provider is required')
    .isIn(['aws', 'azure', 'gcp'])
    .withMessage('Provider must be one of: aws, azure, gcp'),
  body('accountId')
    .isString()
    .notEmpty()
    .withMessage('Account ID is required'),
  body('region')
    .isString()
    .notEmpty()
    .withMessage('Region is required')
];

export const deleteAccountValidation = [
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required')
];
