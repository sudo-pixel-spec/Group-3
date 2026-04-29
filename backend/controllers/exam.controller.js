const Exam = require('../models/Exam');
const Attempt = require('../models/Attempt');
const { sendExamReportEmail, extractMailerError } = require('../utils/sendExamReportEmail');

// @desc  Get student dashboard (upcoming + past exams)
// @route GET /api/exams/dashboard
// @access Private (student)
const getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const allExams = await Exam.find();
    const upcoming = allExams.filter(e => new Date(e.start_time) > now);
    const active = allExams.filter(e => new Date(e.start_time) <= now && new Date(e.end_time) >= now);

    const attempts = await Attempt.find({ user_id: req.user._id }).populate('exam_id');
    const completed = attempts.filter(a => a.status === 'submitted' || a.status === 'terminated');

    res.json({ upcoming, active, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Join an exam via code
// @route POST /api/exams/join-exam
// @access Private (student)
const joinExam = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();

    const exam = await Exam.findOne({ code: code.toUpperCase() });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (now < exam.start_time) return res.status(400).json({ message: 'Exam has not started yet' });
    if (now > exam.end_time) return res.status(400).json({ message: 'Exam has already ended' });

    // Check if attempt already exists
    const existing = await Attempt.findOne({ user_id: req.user._id, exam_id: exam._id });
    if (existing && existing.status !== 'in_progress') {
      return res.status(400).json({ message: 'You have already completed this exam' });
    }

    // Create or return attempt
    const attempt = existing || await Attempt.create({
      user_id: req.user._id,
      exam_id: exam._id,
    });

    res.json({ exam, attempt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get exam details by ID
// @route GET /api/exams/:id
// @access Private
const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let attempt = null;
    if (req.user && req.user.role !== 'admin') {
      const now = new Date();
      attempt = await Attempt.findOne({ user_id: req.user._id, exam_id: exam._id });
      
      // Auto-create attempt if student bypassed `joinExam` (e.g. from Dashboard shortcut)
      if (!attempt && now >= exam.start_time && now <= exam.end_time) {
        attempt = await Attempt.create({ user_id: req.user._id, exam_id: exam._id });
      }
    }

    res.json({ exam, attempt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a new exam (Admin only)
// @route POST /api/exams/create
// @access Private (admin)
const createExam = async (req, res) => {
  try {
    const { title, form_url, start_time, end_time, duration_minutes } = req.body;

    // Generate unique code
    const code = 'EXAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const exam = await Exam.create({
      code,
      title,
      form_url,
      start_time,
      end_time,
      duration_minutes,
      created_by: req.user._id,
    });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Submit an exam attempt
// @route POST /api/exams/:id/submit
// @access Private (student)
const submitExam = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ user_id: req.user._id, exam_id: req.params.id, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ message: 'Active attempt not found' });

    attempt.status = 'submitted';
    attempt.end_time = new Date();
    // Dummy score generation for demo purposes, could be customized later
    attempt.score = Math.floor(Math.random() * (100 - 40 + 1)) + 40; 
    await attempt.save();

    const exam = await Exam.findById(attempt.exam_id).select('title code');
    try {
      await sendExamReportEmail({
        toEmail: req.user.email,
        examTitle: exam?.title,
        examCode: exam?.code,
        score: attempt.score,
        riskScore: attempt.risk_score,
        startedAt: attempt.start_time,
        endedAt: attempt.end_time,
      });
    } catch (mailError) {
      // Do not block successful submission if email delivery fails.
      console.error('Failed to send exam report email:', extractMailerError(mailError));
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  List exams with admin stats
// @route GET /api/exams/admin/list
// @access Private (admin)
const getAdminExamList = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ start_time: -1 });
    const examIds = exams.map((exam) => exam._id);
    const attempts = await Attempt.find({ exam_id: { $in: examIds } }).select('exam_id status updatedAt');

    const now = Date.now();
    const liveWindowMs = 30000;
    const statsByExamId = new Map();

    attempts.forEach((attempt) => {
      const key = attempt.exam_id.toString();
      if (!statsByExamId.has(key)) {
        statsByExamId.set(key, { answering: 0, offline: 0, answered: 0, total: 0 });
      }

      const stats = statsByExamId.get(key);
      stats.total += 1;

      if (attempt.status === 'submitted' || attempt.status === 'terminated') {
        stats.answered += 1;
      } else if (attempt.status === 'in_progress') {
        const isLive = now - new Date(attempt.updatedAt).getTime() <= liveWindowMs;
        if (isLive) stats.answering += 1;
        else stats.offline += 1;
      }
    });

    const response = exams.map((exam) => {
      const stats = statsByExamId.get(exam._id.toString()) || { answering: 0, offline: 0, answered: 0, total: 0 };
      return { ...exam.toObject(), stats };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get categorized attempts for an exam
// @route GET /api/exams/admin/:id/attempts
// @access Private (admin)
const getAdminExamAttempts = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const attempts = await Attempt.find({ exam_id: exam._id })
      .populate('user_id', 'email')
      .sort({ updatedAt: -1 });

    const now = Date.now();
    const liveWindowMs = 30000;
    const grouped = { answering: [], offline: [], answered: [] };

    attempts.forEach((attempt) => {
      if (attempt.status === 'submitted' || attempt.status === 'terminated') {
        grouped.answered.push(attempt);
        return;
      }

      if (attempt.status === 'in_progress') {
        const isLive = now - new Date(attempt.updatedAt).getTime() <= liveWindowMs;
        if (isLive) grouped.answering.push(attempt);
        else grouped.offline.push(attempt);
      }
    });

    res.json({ exam, grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboard,
  joinExam,
  getExam,
  createExam,
  submitExam,
  getAdminExamList,
  getAdminExamAttempts,
};
