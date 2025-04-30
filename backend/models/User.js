// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username:        { type: String, required: true, unique: true },
    email:           { type: String, required: true, unique: true },
    password:        { type: String, required: true },
    studentId:       { type: String },
    phone:           { type: String },
    dob:             { type: Date },
    bio:             { type: String, default: "" },

    // ID‐verification fields:
    idCardUrl:       { type: String, default: null },
    idCardExpiresAt: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified'
    },
    isVerified:      { type: Boolean, default: false },

    // <-- New latitude & longitude fields -->
    latitude:        { type: Number, default: null },
    longitude:       { type: Number, default: null },

    ip:              { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
