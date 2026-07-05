/**
 * Cloud Credentials routes — /api/credentials
 * All routes require authentication. Only the user can manage their own credentials.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import credentialsService from '../services/credentials.service.js';

const router = Router();
router.use(authenticate);

// GET /api/credentials/status — get connected/not-connected per provider
router.get('/status', asyncHandler(async (req, res) => {
  const data = await credentialsService.getStatus(req.user.id);
  return sendSuccess(res, { message: 'Credential status', data });
}));

// PUT /api/credentials/:provider — save credentials (encrypted)
router.put('/:provider', authLimiter, asyncHandler(async (req, res) => {
  const data = await credentialsService.saveCredentials(req.user.id, req.params.provider, req.body);
  return sendSuccess(res, { message: `${req.params.provider} credentials saved`, data });
}));

// DELETE /api/credentials/:provider — remove credentials
router.delete('/:provider', asyncHandler(async (req, res) => {
  const data = await credentialsService.removeCredentials(req.user.id, req.params.provider);
  return sendSuccess(res, { message: `${req.params.provider} credentials removed`, data });
}));

// POST /api/credentials/:provider/test — test connection
router.post('/:provider/test', authLimiter, asyncHandler(async (req, res) => {
  const data = await credentialsService.testConnection(req.user.id, req.params.provider);
  return sendSuccess(res, { message: 'Connection test complete', data });
}));

export default router;
