// controllers/reviewController.js

const Review = require('../models/Review');

// POST /api/skills/:skillId/reviews
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { skillId } = req.params;
    const userId = req.user.userId; // from protect middleware

    // Prevent multiple reviews by same user on same skill?
    const existing = await Review.findOne({ skill: skillId, user: userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this skill.' });
    }

    const review = new Review({
      skill: skillId,
      user: userId,
      rating,
      comment
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
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
