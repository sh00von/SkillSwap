// routes/skillRoutes.js
const express = require('express');
const router  = express.Router();
const { protect }      = require('../middleware/authMiddleware');
const skillController  = require('../controllers/skillController');
const reviewRoutes     = require('./reviewRoutes');

// public listing & filtering
router.get('/', skillController.getSkills);

// protected create
router.post('/', protect, skillController.createSkill);

// fetch a single skill by ID (with its reviews)
router.get('/:skillId', skillController.getSkillById);

// mount reviews routes under /api/skills/:skillId/reviews
router.use('/:skillId/reviews', reviewRoutes);

module.exports = router;
