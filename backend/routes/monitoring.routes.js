const express = require('express');
const router = express.Router();
const { logEvent, getAttemptEvents, getLiveAttempts } = require('../controllers/monitoring.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/log-event', protect, logEvent);
router.get('/live', protect, adminOnly, getLiveAttempts);
router.get('/attempt/:attempt_id/events', protect, adminOnly, getAttemptEvents);

module.exports = router;
