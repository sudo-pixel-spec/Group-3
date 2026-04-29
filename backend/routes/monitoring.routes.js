const express = require('express');
const router = express.Router();

// Placeholder for monitoring controllers
router.post('/upload-frame', (req, res) => res.send('Upload frame endpoint'));
router.post('/log-event', (req, res) => res.send('Log event endpoint'));

module.exports = router;
