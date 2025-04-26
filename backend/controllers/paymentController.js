// controllers/paymentController.js
const Payment   = require('../models/Payment');
const Skill     = require('../models/Skill');
const Task      = require('../models/Task');
const Points    = require('../models/Points');
const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');

exports.createPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillId, amount, method, slotDate } = req.body;

    // 1. Validate required fields
    if (!skillId || typeof amount !== 'number') {
      return res
        .status(400)
        .json({ message: 'skillId (string) and amount (number) are required.' });
    }

    // 2. Ensure skill exists
    const skill = await Skill.findById(skillId).populate('offeredBy', 'username');
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    // 3. Parse & validate optional slotDate
    let parsedSlotDate = null;
    if (slotDate) {
      parsedSlotDate = new Date(slotDate);
      if (isNaN(parsedSlotDate.getTime())) {
        return res.status(400).json({ message: 'slotDate must be a valid date string.' });
      }
    }

    // 4. Create & save the payment (status stays 'pending')
    const payment = await Payment.create({
      user:     userId,
      skill:    skillId,
      amount,
      method:   method || 'bKash',
      status:   'pending',
      slotDate: parsedSlotDate
    });

    // 5. Notify the skill owner about this new swap request
    await Notification.create({
      recipient: skill.offeredBy._id,             // the owner of the skill
      type:      'swap_request',
      message:   `${skill.offeredBy.username}, you have a new swap request for "${skill.title}".`,
      data: {
        paymentId: payment._id,
        skillId:   skill._id,
        requester: userId,
        slotDate:  parsedSlotDate
      }
    });

    // 6. Return the created payment
    return res.status(201).json(payment);

  } catch (err) {
    console.error('❌ createPayment error:', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/payments/:paymentId/confirm
 * Owner confirms a slot, sets slotDate and flips status to 'swapped',
 * then logs the swap task, awards points, and checks the 3-swap milestone.
 */
exports.confirmSlot = async (req, res) => {
  try {
    const ownerId   = req.user.userId;
    const paymentId = req.params.paymentId;
    const { slotDate } = req.body; // ISO date string

    // 1. Find & validate payment (populate skill for notification text)
    const payment = await Payment
      .findById(paymentId)
      .populate('skill', 'title offeredBy');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Only pending payments can be confirmed' });
    }

    // 2. Update slotDate & status
    payment.slotDate = new Date(slotDate);
    payment.status   = 'swapped';
    await payment.save();

    // 3. Award the swap task & 10 points
    const { user: requesterId, skill: skillObj } = payment;
    const skillId = skillObj._id;
    await Task.create({
      user:          requesterId,
      skill:         skillId,
      type:          'swap',
      status:        'completed',
      pointsAwarded: 10
    });
    await Points.findOneAndUpdate(
      { user: requesterId },
      { $inc: { totalPoints: 10 } },
      { upsert: true }
    );

    // 4. Check & award 3-swap milestone bonus
    const completedSwaps = await Task.countDocuments({
      user:   requesterId,
      type:   'swap',
      status: 'completed'
    });

    if (completedSwaps === 3) {
      const already = await Milestone.findOne({
        user:        requesterId,
        type:        'swap',
        targetCount: 3
      });

      if (!already) {
        await Milestone.create({
          user:          requesterId,
          type:          'swap',
          targetCount:   3,
          isCompleted:   true,
          pointsAwarded: 5,
          completedAt:   new Date()
        });
        await Points.findOneAndUpdate(
          { user: requesterId },
          { $inc: { totalPoints: 5 } }
        );
      }
    }

    // 5. Notify the requester that their swap was approved
    await Notification.create({
      recipient: requesterId,
      type:      'swap_approved',
      message:   `Your swap request for "${skillObj.title}" has been approved for ${payment.slotDate.toLocaleString()}.`,
      data: {
        paymentId,
        skillId,
        slotDate: payment.slotDate
      }
    });

    return res.status(200).json(payment);

  } catch (err) {
    console.error('❌ confirmSlot error:', err);
    return res.status(500).json({ message: err.message });
  }
};


// GET /api/payments — return all payments for the logged in user
exports.getPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payments = await Payment
      .find({ user: userId })
      .populate('skill', 'title price');
    return res.status(200).json(payments);
  } catch (err) {
    console.error('❌ getPayments error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/check/:skillId — check if user has paid for a skill
exports.checkPaymentStatus = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { skillId } = req.params;

    if (!skillId) {
      return res.status(400).json({ message: "Skill ID is required" });
    }

    const existingPayment = await Payment.findOne({
      user:   userId,
      skill:  skillId,
      status: { $in: ["pending", "completed"] }
    });

    return res.status(200).json({ hasPaid: !!existingPayment });
  } catch (err) {
    console.error("❌ checkPaymentStatus error:", err);
    return res.status(500).json({ message: err.message });
  }
};
exports.listSwaps = async (req, res) => {
  try {
    const userId = req.user.userId;

    // fetch all pending swap payments
    const pending = await Payment.find({
      user:   userId,
      status: 'pending'
    })
    .populate('skill', 'title price');

    // fetch all approved (swapped) payments
    const approved = await Payment.find({
      user:   userId,
      status: 'swapped'
    })
    .populate('skill', 'title price');

    return res.status(200).json({ pending, approved });
  } catch (err) {
    console.error('❌ listSwaps error:', err);
    return res.status(500).json({ message: err.message });
  }
};