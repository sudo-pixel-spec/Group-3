const Event = require('../models/Event');
const Attempt = require('../models/Attempt');

// Risk score weights (from Planned.md)
const RISK_WEIGHTS = {
  MULTIPLE_FACES: 30,
  NO_FACE: 20,
  LOOKING_AWAY: 20,
  AUDIO_DETECTED: 15,
  TAB_SWITCH: 15,
  BLURRED_WINDOW: 15,
};

// @desc  Log a proctoring event
// @route POST /api/monitoring/log-event
// @access Private (student)
const logEvent = async (req, res) => {
  try {
    const { attempt_id, event_type, confidence } = req.body;

    if (!attempt_id || !event_type) {
      return res.status(400).json({ message: 'attempt_id and event_type are required' });
    }

    const attempt = await Attempt.findById(attempt_id);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Store the event
    const event = await Event.create({
      user_id: req.user._id,
      attempt_id,
      event_type,
      confidence: confidence || 1.0,
    });

    // Update risk score on the attempt
    const riskIncrement = RISK_WEIGHTS[event_type] || 0;
    attempt.risk_score = Math.min(100, attempt.risk_score + riskIncrement);
    await attempt.save();

    res.status(201).json({ event, risk_score: attempt.risk_score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all events for an attempt (admin view)
// @route GET /api/monitoring/attempt/:attempt_id/events
// @access Private (admin)
const getAttemptEvents = async (req, res) => {
  try {
    const events = await Event.find({ attempt_id: req.params.attempt_id }).sort({ timestamp: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all live attempts (admin view)
// @route GET /api/monitoring/live
// @access Private (admin)
const getLiveAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ status: 'in_progress' })
      .populate('user_id', 'email')
      .populate('exam_id', 'title code');
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { logEvent, getAttemptEvents, getLiveAttempts };
