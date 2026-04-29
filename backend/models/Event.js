const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true,
  },
  event_type: {
    type: String,
    enum: ['LOOKING_AWAY', 'MULTIPLE_FACES', 'NO_FACE', 'AUDIO_DETECTED', 'TAB_SWITCH', 'BLURRED_WINDOW'],
    required: true,
  },
  confidence: {
    type: Number,
    default: 1.0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Event', eventSchema);
