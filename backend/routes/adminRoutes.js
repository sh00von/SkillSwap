const express = require('express');
const router  = express.Router();
const adminC  = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/login', adminC.login);
router.get('/users', adminAuth, adminC.getUsers);
router.get('/skills', adminAuth, adminC.getSkills);

module.exports = router;
