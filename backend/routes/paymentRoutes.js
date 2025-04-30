// routes/paymentRoutes.js
const express       = require('express')
const router        = express.Router()
const { protect }   = require('../middleware/authMiddleware')
const paymentCtrl   = require('../controllers/paymentController')

// Protected user endpoints
router.post(   '/initiate',           protect, paymentCtrl.initiatePayment)
router.put(    '/:paymentId/confirm', protect, paymentCtrl.confirmSlot)
router.get(    '/',                   protect, paymentCtrl.getPayments)
router.get(    '/check/:skillId',     protect, paymentCtrl.checkPaymentStatus)
router.get(    '/swaps',              protect, paymentCtrl.listSwaps)

// Public SSLCommerz callback endpoints
router.post(  '/success', paymentCtrl.success)
router.get(  '/fail',    paymentCtrl.fail)
router.get(  '/cancel',  paymentCtrl.cancel)
router.post( '/ipn',     paymentCtrl.ipn)

module.exports = router
