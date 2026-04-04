import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboard summary and analytics
 */

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Get total income, expenses, net balance, and entry count
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2024-01-01" }
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2024-12-31" }
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Summary data
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 summary:
 *                   income: 50000
 *                   expense: 30000
 *                   transfer: 5000
 *                   netBalance: 20000
 *                   totalEntries: 42
 */
router.get('/summary', analyticsController.getSummary);

/**
 * @swagger
 * /analytics/by-category:
 *   get:
 *     summary: Get income/expense breakdown by category
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category breakdown with totals and counts
 */
router.get('/by-category', analyticsController.getByCategory);

/**
 * @swagger
 * /analytics/by-period:
 *   get:
 *     summary: Get trends grouped by time period (monthly/weekly/daily)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [monthly, weekly, daily], default: monthly }
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Period-based trend data
 */
router.get('/by-period', analyticsController.getByPeriod);

/**
 * @swagger
 * /analytics/recent:
 *   get:
 *     summary: Get recent financial entries
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: List of recent entries
 */
router.get('/recent', analyticsController.getRecentEntries);

export default router;
