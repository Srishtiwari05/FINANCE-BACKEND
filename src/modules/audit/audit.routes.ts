import { Router } from 'express';
import * as auditController from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMinRole } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireMinRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log management (admin only)
 */

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: List audit logs with filters (admin only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [USER_REGISTERED, USER_LOGIN, USER_LOGOUT, USER_UPDATED, USER_ROLE_CHANGED, USER_STATUS_CHANGED, ENTRY_CREATED, ENTRY_UPDATED, ENTRY_DELETED]
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2024-01-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2024-12-31" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated audit log entries
 *       403:
 *         description: Admin access required
 */
router.get('/', auditController.listAuditLogs);

export default router;
