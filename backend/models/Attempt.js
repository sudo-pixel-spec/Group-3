const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  score: {
    type: Number,
    default: null, // Populated after manual/auto grading
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'terminated'],
    default: 'in_progress',
  },
  risk_score: {
    type: Number,
    default: 0,
  },
  start_time: {
    type: Date,
    default: Date.now,
  },
  end_time: {
    type: Date,
  }
}, { timestamps: true });

// Ensure a user can only have one active attempt per exam
attemptSchema.index({ user_id: 1, exam_id: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);
