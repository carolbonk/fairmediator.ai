/**
 * ConflictAlerts Routes
 *
 * GET  /api/alerts          — list alerts for the authenticated user (unread first)
 * GET  /api/alerts/unread-count — lightweight poll for bell-icon badge
 * PATCH /api/alerts/:id/read — mark one alert as read
 * PATCH /api/alerts/read-all — mark all alerts as read
 *
 * @module routes/alerts
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, sendSuccess, sendError, sendNotFound } = require('../utils/responseHandlers');
const logger = require('../config/logger');
const ConflictAlert = require('../models/ConflictAlert');

/**
 * GET /api/alerts/unread-count
 * Lightweight endpoint polled by the bell icon every 60s.
 * Returns only the unread count — no full alert objects.
 */
router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = await ConflictAlert.countDocuments({
    userId: req.user._id,
    isRead: false
  });
  sendSuccess(res, { count });
}));

/**
 * GET /api/alerts
 * Return the 20 most recent alerts for the authenticated user, unread first.
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const alerts = await ConflictAlert.find({ userId: req.user._id })
    .sort({ isRead: 1, createdAt: -1 })
    .limit(20)
    .lean();

  const unreadCount = alerts.filter(a => !a.isRead).length;

  sendSuccess(res, { alerts, unreadCount });
}));

/**
 * PATCH /api/alerts/read-all
 * Mark all of the user's unread alerts as read.
 * Must be defined BEFORE /:id to avoid Express treating "read-all" as an ObjectId.
 */
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  const result = await ConflictAlert.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  logger.info('[Alerts] Marked all read', { userId: req.user._id, modified: result.modifiedCount });
  sendSuccess(res, { modified: result.modifiedCount });
}));

/**
 * PATCH /api/alerts/:id/read
 * Mark a single alert as read.
 */
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid alert ID', 400);
  }

  const alert = await ConflictAlert.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!alert) return sendNotFound(res, 'Alert not found');

  sendSuccess(res, { alert });
}));

module.exports = router;
