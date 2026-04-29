const Event = require('../models/Event');
const Attempt = require('../models/Attempt');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// In-memory simple throttle map: attempt_id_event_type -> timestamp
const lastEventCache = new Map();

// Risk score weights (from Planned.md)
const RISK_WEIGHTS = {
  MOBILE_DETECTED: 40,
  MULTIPLE_FACES: 30,
  HAND_DETECTED: 25,
  NO_FACE: 20,
  LOOKING_AWAY: 20,
  AUDIO_DETECTED: 15,
  TAB_SWITCH: 15,
  BLURRED_WINDOW: 15,
  MOUSE_OFF_SCREEN: 10,
  KEYBOARD_SHORTCUT: 15,
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
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const attempts = await Attempt.find({ 
      status: 'in_progress',
      updatedAt: { $gte: thirtySecondsAgo }
    })
      .populate('user_id', 'email')
      .populate('exam_id', 'title code');
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Upload a webcam frame snapshot + forward to AI service
// @route POST /api/monitoring/upload-frame
// @access Private (student)
const uploadFrame = async (req, res) => {
  try {
    const { attempt_id, frame } = req.body; // frame is base64 data URL
    if (!attempt_id || !frame) {
      return res.status(400).json({ message: 'attempt_id and frame are required' });
    }

    const attempt = await Attempt.findById(attempt_id);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Store latest frame for Admin live view
    attempt.last_frame = frame;
    await attempt.save();

    // Forward to Python AI service for face analysis
    let aiResult = { face_detected: true, face_count: 1, looking_away: false, mobile_detected: false, hand_detected: false };
    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/analyze-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame }),
        signal: AbortSignal.timeout(3000),
      });
      if (aiRes.ok) aiResult = (await aiRes.json()).data;
    } catch (_) {
      // AI service offline — skip analysis, don't crash
    }

    // Auto-log AI-detected violations
    const autoEvents = [];
    if (!aiResult.face_detected) autoEvents.push('NO_FACE');
    if (aiResult.face_count > 1) autoEvents.push('MULTIPLE_FACES');
    if (aiResult.looking_away) autoEvents.push('LOOKING_AWAY');
    if (aiResult.mobile_detected) autoEvents.push('MOBILE_DETECTED');
    if (aiResult.hand_detected) autoEvents.push('HAND_DETECTED');

    const now = Date.now();
    let riskUpdated = false;
    const newEvents = [];

    for (const event_type of autoEvents) {
      const cacheKey = `${attempt_id}_${event_type}`;
      const lastTime = lastEventCache.get(cacheKey) || 0;
      
      // Throttle: Max 1 event of same type every 15 seconds
      if (now - lastTime > 15000) {
        await Event.create({ user_id: req.user._id, attempt_id, event_type, confidence: 0.9 });
        const riskIncrement = RISK_WEIGHTS[event_type] || 0;
        attempt.risk_score = Math.min(100, attempt.risk_score + riskIncrement);
        lastEventCache.set(cacheKey, now);
        riskUpdated = true;
        newEvents.push(event_type);
      }
    }
    if (riskUpdated) await attempt.save();

    res.json({ status: 'ok', ai: aiResult, risk_score: attempt.risk_score, new_events: newEvents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get attempt detail with events (admin student detail view)
// @route GET /api/monitoring/attempt/:attempt_id/detail
// @access Private (admin)
const getAttemptDetail = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attempt_id)
      .populate('user_id', 'email')
      .populate('exam_id', 'title code start_time end_time');
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const events = await Event.find({ attempt_id: req.params.attempt_id }).sort({ timestamp: 1 });

    res.json({ attempt, events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { logEvent, getAttemptEvents, getLiveAttempts, uploadFrame, getAttemptDetail };
