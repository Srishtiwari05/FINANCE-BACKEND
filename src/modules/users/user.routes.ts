import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMinRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema, updateRoleSchema, updateStatusSchema, userListSchema } from './user.schema';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Own profile data
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update own profile (name or password)
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/me', validate(updateProfileSchema), userController.updateMe);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [viewer, analyst, admin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get('/', requireMinRole('admin'), validate(userListSchema, 'query'), userController.listUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', requireMinRole('admin'), userController.getUserById);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [viewer, analyst, admin] }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/:id/role', requireMinRole('admin'), validate(updateRoleSchema), userController.changeRole);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', requireMinRole('admin'), validate(updateStatusSchema), userController.changeStatus);

export default router;
