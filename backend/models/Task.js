// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Skill',
    required: true
  },
  type: {
    type: String,
    enum: ['swap'],
    default: 'swap'
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  },
  pointsAwarded: {
    type:    Number,
    default: 10
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
