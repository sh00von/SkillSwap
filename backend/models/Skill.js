// models/Skill.js
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    title:       { type: String,  required: true },
    description: { type: String },
    category:    { type: String,  required: true },
    experience:  {
      type:     String,
      required: true,
      enum:     ['Beginner', 'Intermediate', 'Expert'],
    },
    location:  { type: String },
    offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ← New field for your “Swap for ₹…” button
    price: {
      type:     Number,
      required: true,
      default:  0
    }
  },
  { timestamps: true }
);

// virtual populate for reviews
SkillSchema.virtual('reviews', {
  ref:         'Review',
  localField:  '_id',
  foreignField:'skill',
  justOne:     false
});

// include virtuals in JSON output
SkillSchema.set('toObject', { virtuals: true });
SkillSchema.set('toJSON',   { virtuals: true });

module.exports = mongoose.model('Skill', SkillSchema);
