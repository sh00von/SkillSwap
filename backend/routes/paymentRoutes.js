// routes/paymentRoutes.js
const router       = require('express').Router();
const { protect }  = require('../middleware/authMiddleware');
const { createPayment, getPayments,checkPaymentStatus,confirmSlot,listSwaps  } = require('../controllers/paymentController');

// now each of these routes will run protect() first
router.post('/', protect, createPayment);
router.get('/',  protect, getPayments);
router.get("/check/:skillId", protect, checkPaymentStatus); // ✅ new route
router.put('/:paymentId/confirm', protect, confirmSlot); // ✅ new route
router.get('/swaps', protect, listSwaps); // ✅ new route

module.exports = router;
