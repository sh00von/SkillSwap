// routes/reviewRoutes.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const { createReview, getReviewsBySkill } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Create a review (protected)
router.post('/', protect, createReview);

// List all reviews for a skill
router.get('/', getReviewsBySkill);

module.exports = router;
