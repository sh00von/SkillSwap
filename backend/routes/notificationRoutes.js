// routes/notificationRoutes.js
const express = require('express');
const { protect }  = require('../middleware/authMiddleware');
const {getNotifications, markAllAsRead, markAsRead}    = require('../controllers/notificationController');

const router = express.Router();

router.get('/',              protect, getNotifications);
router.put('/:id/read',      protect, markAsRead);
router.put('/read-all',      protect, markAllAsRead);

module.exports = router;
