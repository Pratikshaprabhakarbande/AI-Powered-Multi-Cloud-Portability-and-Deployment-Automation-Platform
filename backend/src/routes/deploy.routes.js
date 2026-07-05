/**
 * Deployment routes — /api/deploy
 *
 *  POST   /                create deployment (DevOps Engineer+)
 *  GET    /                list user deployments
 *  GET    /:id             get deployment status + logs
 *  POST   /:id/rollback    rollback (Cloud Engineer+)
 *  DELETE /:id             cancel/terminate (Cloud Engineer+)
 *  GET    /regions/:provider   get available regions
 */
import { Router } from 'express';
import deployController from '../controllers/deployment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeMin } from '../middleware/rbac.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { ROLES } from '../config/constants.js';
import { createValidation, listValidation, idParam, providerParam } from '../validations/deployment.validation.js';

const router = Router();
router.use(authenticate);

router.post('/', authLimiter, authorizeMin(ROLES.DEVOPS_ENGINEER), validate(createValidation), deployController.create);
router.get('/', validate(listValidation), deployController.list);
router.get('/regions/:provider', validate(providerParam), deployController.regions);
router.get('/:id', validate(idParam), deployController.get);
router.post('/:id/rollback', authorizeMin(ROLES.CLOUD_ENGINEER), validate(idParam), deployController.rollback);
router.delete('/:id', authorizeMin(ROLES.CLOUD_ENGINEER), validate(idParam), deployController.cancel);

export default router;
