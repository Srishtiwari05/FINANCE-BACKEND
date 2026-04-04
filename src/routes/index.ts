import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import entryRoutes from '../modules/entries/entry.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import auditRoutes from '../modules/audit/audit.routes';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Finance Backend API v1',
    docs: '/api/docs',
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/entries', entryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit', auditRoutes);

export default router;
