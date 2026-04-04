import { Router } from 'express';
import * as entryController from './entry.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMinRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createEntrySchema, updateEntrySchema, entryFilterSchema } from './entry.schema';

const router = Router();

// All entry routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Entries
 *   description: Financial records management
 */

/**
 * @swagger
 * /entries:
 *   post:
 *     summary: Create a new financial entry (analyst, admin)
 *     tags: [Entries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, amount, type, category, date]
 *             properties:
 *               title: { type: string, example: "Office Supplies" }
 *               amount: { type: number, example: 150.00 }
 *               type: { type: string, enum: [income, expense, transfer] }
 *               category: { type: string, example: "Operations" }
 *               date: { type: string, example: "2024-01-15" }
 *               notes: { type: string }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Entry created
 *       403:
 *         description: Insufficient role
 */
router.post('/', requireMinRole('analyst'), validate(createEntrySchema), entryController.createEntry);

/**
 * @swagger
 * /entries:
 *   get:
 *     summary: List financial entries with filters and pagination
 *     tags: [Entries]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense, transfer] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2024-01-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2024-12-31" }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt], default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated entries list. Viewers only see their own entries.
 */
router.get('/', validate(entryFilterSchema, 'query'), entryController.listEntries);

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     summary: Get a single entry by ID
 *     tags: [Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entry data
 *       403:
 *         description: Viewers can only access own entries
 *       404:
 *         description: Entry not found
 */
router.get('/:id', entryController.getEntryById);

/**
 * @swagger
 * /entries/{id}:
 *   patch:
 *     summary: Update an entry. Analysts can update own entries; admins can update any.
 *     tags: [Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialEntry'
 *     responses:
 *       200:
 *         description: Entry updated
 *       403:
 *         description: Cannot update another analyst's entry
 */
router.patch('/:id', requireMinRole('analyst'), validate(updateEntrySchema), entryController.updateEntry);

/**
 * @swagger
 * /entries/{id}:
 *   delete:
 *     summary: Soft delete an entry (admin only)
 *     tags: [Entries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entry soft-deleted
 *       404:
 *         description: Entry not found
 */
router.delete('/:id', requireMinRole('admin'), entryController.deleteEntry);

export default router;
