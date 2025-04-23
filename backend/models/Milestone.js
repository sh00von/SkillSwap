const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true
  },
  type: {
    type: String,
    enum: ['swap'],
    required: true
  },
  targetCount: {
    type:    Number,
    required: true    // e.g. 3 swaps
  },
  isCompleted: {
    type:    Boolean,
    default: false
  },
  pointsAwarded: {
    type:    Number,
    default: 5       // bonus for hitting target
  },
  completedAt: Date   // when they hit it
}, {
  timestamps: true
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
