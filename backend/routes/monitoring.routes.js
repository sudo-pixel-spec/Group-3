const express = require('express');
const router = express.Router();
const { logEvent, getAttemptEvents, getLiveAttempts, uploadFrame, getAttemptDetail } = require('../controllers/monitoring.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/log-event', protect, logEvent);
router.post('/upload-frame', protect, uploadFrame);
router.get('/live', protect, adminOnly, getLiveAttempts);
router.get('/attempt/:attempt_id/events', protect, adminOnly, getAttemptEvents);
router.get('/attempt/:attempt_id/detail', protect, adminOnly, getAttemptDetail);

module.exports = router;