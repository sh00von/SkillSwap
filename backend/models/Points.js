// models/Points.js
const mongoose = require('mongoose');

const PointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true,
    unique:   true
  },
  totalPoints: {
    type:    Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Points', PointsSchema);
