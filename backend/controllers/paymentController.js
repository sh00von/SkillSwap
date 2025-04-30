// controllers/paymentController.js

const qs           = require('qs')
const axios        = require('axios')
const Payment      = require('../models/Payment')
const Skill        = require('../models/Skill')
const Task         = require('../models/Task')
const Points       = require('../models/Points')
const Milestone    = require('../models/Milestone')
const Notification = require('../models/Notification')

// SSLCommerz config
const {
  SSL_STORE_ID,
  SSL_STORE_PASSWORD,
  SSL_SANDBOX,
  BASE_URL,
  FRONTEND_URL
} = process.env

const INIT_URL     = SSL_SANDBOX === 'true'
  ? 'https://sandbox.sslcommerz.com/gwprocess/v3/api.php'
  : 'https://securepay.sslcommerz.com/gwprocess/v3/api.php'

const VALIDATE_URL = SSL_SANDBOX === 'true'
  ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'


/**
 * POST /api/payments/initiate
 */
exports.initiatePayment = async (req, res) => {
  try {
    const userId   = req.user.userId
    const { skillId } = req.body

    const skill = await Skill.findById(skillId)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    const payment = await Payment.create({
      user:              userId,
      skill:             skillId,
      amount:            skill.price,
      method:            'sslcommerz',
      status:            'pending',
      transactionId:     null,
      gatewaySessionUrl: null
    })

    const payload = {
      store_id:     SSL_STORE_ID,
      store_passwd: SSL_STORE_PASSWORD,
      total_amount: skill.price,
      currency:     'BDT',
      tran_id:      payment._id.toString(),
      success_url:  `${BASE_URL}/api/payments/success`,
      fail_url:     `${BASE_URL}/api/payments/fail`,
      cancel_url:   `${BASE_URL}/api/payments/cancel`,
      ipn_url:      `${BASE_URL}/api/payments/ipn`,
      product_name: skill.title,
      cus_name:     req.user.username || '',
      cus_email:    req.user.email || ''
    }

    const response = await axios.post(
      INIT_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const url = response.data?.GatewayPageURL
    if (!url) {
      return res.status(502).json({
        message: 'Failed to initiate payment session',
        data:    response.data
      })
    }

    payment.gatewaySessionUrl = url
    payment.transactionId     = payment._id.toString()
    await payment.save()

    return res.status(200).json({ url })
  } catch (err) {
    console.error('❌ initiatePayment error:', err)
    return res.status(500).json({ message: err.message })
  }
}


/**
 * GET /api/payments/success
 */
exports.success = async (req, res) => {
  try {
    const { val_id, tran_id } = req.query
    const validateRes = await axios.get(
      `${VALIDATE_URL}?val_id=${val_id}&store_id=${SSL_STORE_ID}&store_passwd=${SSL_STORE_PASSWORD}&format=json`
    )
    const data = validateRes.data

    if (data.status === 'VALID' && data.tran_id === tran_id) {
      const payment = await Payment.findByIdAndUpdate(
        tran_id,
        {
          status:            'swapped',
          slotDate:          new Date(),
          valId:             data.val_id,
          currency:          data.currency,
          storeAmount:       parseFloat(data.currency_amount),
          cardType:          data.card_type,
          cardNo:            data.card_no
        },
        { new: true }
      ).populate('skill', 'title offeredBy')

      const requesterId = payment.user
      const skillObj    = payment.skill

      // award swap task & points
      await Task.create({
        user:          requesterId,
        skill:         skillObj._id,
        type:          'swap',
        status:        'completed',
        pointsAwarded: 10
      })
      await Points.findOneAndUpdate(
        { user: requesterId },
        { $inc: { totalPoints: 10 } },
        { upsert: true }
      )

      // check 3-swap milestone
      const completedCount = await Task.countDocuments({
        user:   requesterId,
        type:   'swap',
        status: 'completed'
      })
      if (completedCount === 3) {
        const exists = await Milestone.findOne({
          user:        requesterId,
          type:        'swap',
          targetCount: 3
        })
        if (!exists) {
          await Milestone.create({
            user:          requesterId,
            type:          'swap',
            targetCount:   3,
            isCompleted:   true,
            pointsAwarded: 5,
            completedAt:   new Date()
          })
          await Points.findOneAndUpdate(
            { user: requesterId },
            { $inc: { totalPoints: 5 } }
          )
        }
      }

      // notify requester
      await Notification.create({
        recipient: requesterId,
        type:      'swap_approved',
        message:   `Your payment for "${skillObj.title}" succeeded.`,
        data:      { paymentId: tran_id }
      })

      return res.redirect(`${FRONTEND_URL}/payment-success`)
    } else {
      return res.redirect(`${FRONTEND_URL}/payment-success`)
    }
  } catch (err) {
    console.error('❌ success callback error:', err)
    return res.status(500).send('Validation error')
  }
}


/**
 * GET /api/payments/fail
 */
exports.fail = async (req, res) => {
  const { tran_id } = req.query
  await Payment.findByIdAndUpdate(tran_id, { status: 'failed' })
  return res.redirect(`${FRONTEND_URL}/payment-fail?tran_id=${tran_id}`)
}


/**
 * GET /api/payments/cancel
 */
exports.cancel = async (req, res) => {
  const { tran_id } = req.query
  await Payment.findByIdAndUpdate(tran_id, { status: 'failed' })
  return res.redirect(`${FRONTEND_URL}/payment-cancel?tran_id=${tran_id}`)
}


/**
 * POST /api/payments/ipn
 */
exports.ipn = (req, res) => {
  res.sendStatus(200)
}


/**
 * PUT /api/payments/:paymentId/confirm
 * Skill owner confirms a pending swap request.
 */
exports.confirmSlot = async (req, res) => {
  try {
    const ownerId   = req.user.userId
    const paymentId = req.params.paymentId
    const { slotDate } = req.body

    const payment = await Payment
      .findById(paymentId)
      .populate('skill', 'offeredBy title')
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    // only the skill owner can confirm
    if (payment.skill.offeredBy.toString() !== ownerId) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending payments can be confirmed' })
    }

    const parsed = new Date(slotDate)
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'slotDate must be valid' })
    }

    payment.slotDate = parsed
    payment.status   = 'swapped'
    await payment.save()

    const requesterId = payment.user
    const skillObj    = payment.skill

    await Task.create({
      user:          requesterId,
      skill:         skillObj._id,
      type:          'swap',
      status:        'completed',
      pointsAwarded: 10
    })
    await Points.findOneAndUpdate(
      { user: requesterId },
      { $inc: { totalPoints: 10 } },
      { upsert: true }
    )

    const completedCount = await Task.countDocuments({
      user:   requesterId,
      type:   'swap',
      status: 'completed'
    })
    if (completedCount === 3) {
      const exists = await Milestone.findOne({
        user:        requesterId,
        type:        'swap',
        targetCount: 3
      })
      if (!exists) {
        await Milestone.create({
          user:          requesterId,
          type:          'swap',
          targetCount:   3,
          isCompleted:   true,
          pointsAwarded: 5,
          completedAt:   new Date()
        })
        await Points.findOneAndUpdate(
          { user: requesterId },
          { $inc: { totalPoints: 5 } }
        )
      }
    }

    await Notification.create({
      recipient: requesterId,
      type:      'swap_approved',
      message:   `Your swap for "${payment.skill.title}" is confirmed for ${parsed.toLocaleString()}.`,
      data:      { paymentId, slotDate: parsed }
    })

    return res.status(200).json(payment)
  } catch (err) {
    console.error('❌ confirmSlot error:', err)
    return res.status(500).json({ message: err.message })
  }
}


/**
 * GET /api/payments
 */
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment
      .find({ user: req.user.userId })
      .populate('skill', 'title price')
    return res.status(200).json(payments)
  } catch (err) {
    console.error('❌ getPayments error:', err)
    return res.status(500).json({ message: err.message })
  }
}


/**
 * GET /api/payments/check/:skillId
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { skillId } = req.params
    if (!skillId) {
      return res.status(400).json({ message: 'Skill ID required' })
    }
    const existing = await Payment.findOne({
      user:   req.user.userId,
      skill:  skillId,
      status: { $in: ['pending', 'swapped'] }
    })
    return res.status(200).json({ hasPaid: !!existing })
  } catch (err) {
    console.error('❌ checkPaymentStatus error:', err)
    return res.status(500).json({ message: err.message })
  }
}


/**
 * GET /api/payments/swaps
 */
exports.listSwaps = async (req, res) => {
  try {
    const userId  = req.user.userId
    const pending  = await Payment.find({ user: userId, status: 'pending' })
      .populate('skill', 'title price')
    const approved = await Payment.find({ user: userId, status: 'swapped' })
      .populate('skill', 'title price')
    return res.status(200).json({ pending, approved })
  } catch (err) {
    console.error('❌ listSwaps error:', err)
    return res.status(500).json({ message: err.message })
  }
}
