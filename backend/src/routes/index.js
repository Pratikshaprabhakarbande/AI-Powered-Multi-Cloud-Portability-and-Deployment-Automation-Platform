/**
 * Root API router. Mounts feature routers under the API prefix.
 * Additional module routers (dashboard, security, finops, ...) are added in
 * later phases.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import terraformRoutes from './terraform.routes.js';
import securityRoutes from './security.routes.js';
import advisorRoutes from './advisor.routes.js';
import complianceRoutes from './compliance.routes.js';
import finopsRoutes from './finops.routes.js';
import migrationRoutes from './migration.routes.js';
import adminRoutes from './admin.routes.js';
import deploymentsRoutes from './deployments.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: {
      service: 'cloud-portability-backend',
      demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
      timestamp: new Date().toISOString()
    }
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/terraform', terraformRoutes);
router.use('/security', securityRoutes);
router.use('/ai', advisorRoutes);
router.use('/compliance', complianceRoutes);
router.use('/finops', finopsRoutes);
router.use('/migration', migrationRoutes);
router.use('/admin', adminRoutes);
router.use('/deployments', deploymentsRoutes);

export default router;
