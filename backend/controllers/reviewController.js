const Review       = require('../models/Review');
const Skill        = require('../models/Skill');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/skills/:skillId/reviews
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { skillId }         = req.params;
    const userId              = req.user.userId; // from protect middleware

    // Prevent multiple reviews by same user on same skill
    const existing = await Review.findOne({ skill: skillId, user: userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'You have already reviewed this skill.' });
    }

    // 1. Save the review
    const review = new Review({
      skill:   skillId,
      user:    userId,
      rating,
      comment
    });
    await review.save();

    // 2. Fetch the skill (to get its owner) and the reviewer (for username)
    const [skill, reviewer] = await Promise.all([
      Skill.findById(skillId).populate('offeredBy', 'username'),
      User.findById(userId).select('username')
    ]);

    if (skill && skill.offeredBy) {
      // 3. Notify the skill owner
      await Notification.create({
        recipient: skill.offeredBy._id,
        type:      'review',
        message:   `${reviewer.username} left a new review on "${skill.title}".`,
        data: {
          reviewId: review._id,
          skillId
        }
      });
    }

    // 4. Return the created review
    res.status(201).json(review);

  } catch (err) {
    console.error('❌ createReview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/skills/:skillId/reviews
exports.getReviewsBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const reviews = await Review.find({ skill: skillId })
      .populate('user', 'username')  // populate reviewer username
      .sort('-createdAt');
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
