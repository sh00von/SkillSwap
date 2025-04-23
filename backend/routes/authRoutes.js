const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
// router.get('/:id', authController.getUserById);

// Profile routes (protected)
router.get('/profile', protect, profileController.getProfile);
router.put('/profile', protect, profileController.updateProfile);
router.get('/users', profileController.getAllUsers);
router.post('/verify-profile', protect, authController.verifyProfile);
router.delete('/verify-profile', protect, authController.removeVerification);

// Public user profile route
router.get('/users/:id', profileController.getPublicProfile);

module.exports = router;
