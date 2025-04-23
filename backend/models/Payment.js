// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  skill:  { type: mongoose.Schema.Types.ObjectId, ref: 'Skill',  required: true },
  amount: { type: Number,            required: true },
  method: { type: String,            default: 'bKash' },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
