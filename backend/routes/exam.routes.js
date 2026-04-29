const express = require('express');
const router = express.Router();

// Placeholder for exam controllers
router.get('/dashboard', (req, res) => res.send('Dashboard endpoint'));
router.post('/join-exam', (req, res) => res.send('Join exam endpoint'));
router.get('/:id', (req, res) => res.send('Get exam endpoint'));

module.exports = router;
