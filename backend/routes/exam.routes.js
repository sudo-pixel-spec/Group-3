const express = require('express');
const router = express.Router();
const { getDashboard, joinExam, getExam, createExam } = require('../controllers/exam.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/dashboard', protect, getDashboard);
router.post('/join-exam', protect, joinExam);
router.post('/create', protect, adminOnly, createExam);
router.get('/:id', protect, getExam);

module.exports = router;
