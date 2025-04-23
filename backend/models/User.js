const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username:   { type: String, required: true, unique: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    idCardUrl:  { type: String },      // URL of uploaded ID card
    isVerified: { type: Boolean, default: false },
    ip:         { type: String },      // last known IP address
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
