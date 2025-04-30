// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true
  },

  // bKash or SSLCommerz
  method: {
    type: String,
    enum: ['bKash', 'sslcommerz'],
    default: 'bKash'
  },

  // When owner confirms
  slotDate: {
    type: Date
  },

  // pending/swapped/failed
  status: {
    type: String,
    enum: ['pending', 'swapped', 'failed'],
    default: 'pending'
  },

  // —– SSLCommerz fields —–
  // the URL the user must be redirected to
  gatewaySessionUrl: {
    type: String
  },
  // your local payment._id is used as tran_id, but store it separately too
  transactionId: {
    type: String,
    unique: true,
    index: true
  },
  // returned by the validation API
  valId: {
    type: String
  },
  // store amount and currency from gateway
  currency: {
    type: String
  },
  storeAmount: {
    type: Number
  },
  // optional card details
  cardType: {
    type: String
  },
  cardNo: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
