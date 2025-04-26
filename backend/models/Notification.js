// models/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  // who receives it
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // classify it—no 'message' type here
  type: {
    type: String,
    enum: ['swap_request','swap_approved','review','system'],
    default: 'system'
  },

  // the human-readable text
  message: {
    type: String,
    required: true
  },

  // any extra payload you might need (e.g. { swapId, skillId })
  data: {
    type: Schema.Types.Mixed
  },

  // just unread/read
  isRead: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// speed up queries for unread notifications
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
