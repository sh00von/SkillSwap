// routes/paymentRoutes.js
const router       = require('express').Router();
const { protect }  = require('../middleware/authMiddleware');
const { createPayment, getPayments,checkPaymentStatus  } = require('../controllers/paymentController');

// now each of these routes will run protect() first
router.post('/', protect, createPayment);
router.get('/',  protect, getPayments);
router.get("/check/:skillId", protect, checkPaymentStatus); // ✅ new route

module.exports = router;
