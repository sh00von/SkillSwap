const express = require('express');
const router  = express.Router();
const mc      = require('../controllers/messageController');

// Fetch history
router.get('/private/:user1/:user2', mc.getPrivateMessages);

// Send a new message
router.post('/private', mc.sendPrivateMessage);

module.exports = router;
