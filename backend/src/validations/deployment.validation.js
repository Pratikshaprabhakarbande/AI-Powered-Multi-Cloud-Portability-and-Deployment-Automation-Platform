import { body, query, param } from 'express-validator';
import { PROVIDER_VALUES, DEPLOYMENT_STATUS_VALUES } from '../config/constants.js';

export const createValidation = [
  body('provider').isIn(PROVIDER_VALUES).withMessage('Provider must be aws, azure, or gcp'),
  body('image').isString().trim().notEmpty().withMessage('Docker image is required'),
  body('region').optional().isString().trim(),
  body('name').optional().isString().trim().isLength({ max: 80 }),
  body('config').optional().isObject()
];

export const listValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('provider').optional().isIn(PROVIDER_VALUES),
  query('status').optional().isIn(DEPLOYMENT_STATUS_VALUES)
];

export const idParam = [
  param('id').isMongoId().withMessage('Invalid deployment ID')
];

export const providerParam = [
  param('provider').isIn(PROVIDER_VALUES).withMessage('Invalid provider')
];
