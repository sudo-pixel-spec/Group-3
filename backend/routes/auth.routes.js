const express = require('express');
const router = express.Router();

// Placeholder for auth controllers
router.post('/login', (req, res) => res.send('Login endpoint'));
router.post('/register', (req, res) => res.send('Register endpoint'));

module.exports = router;
