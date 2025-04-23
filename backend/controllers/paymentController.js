// controllers/paymentController.js
const Payment   = require('../models/Payment');
const Skill     = require('../models/Skill');
const Task      = require('../models/Task');
const Points    = require('../models/Points');
const Milestone = require('../models/Milestone');

exports.createPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillId, amount, method, status } = req.body;

    // 1. Validate required fields
    if (!skillId || typeof amount !== 'number') {
      return res
        .status(400)
        .json({ message: 'skillId (string) and amount (number) are required.' });
    }

    // 2. Ensure skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // 3. Create & save the payment
    const payment = new Payment({
      user:   userId,
      skill:  skillId,
      amount,
      method: method || 'unknown',
      status: status || 'pending'
    });
    const saved = await payment.save();

    // 4. Log the completed “swap” task & award 10 points
    await Task.create({
      user:          userId,
      skill:         skillId,
      type:          'swap',
      status:        'completed',
      pointsAwarded: 10
    });
    await Points.findOneAndUpdate(
      { user: userId },
      { $inc: { totalPoints: 10 } },
      { upsert: true }
    );

    // 5. Check for the “3 swaps” milestone
    const completedSwaps = await Task.countDocuments({
      user:   userId,
      type:   'swap',
      status: 'completed'
    });

    if (completedSwaps === 3) {
      // only award once per user
      const already = await Milestone.findOne({
        user:        userId,
        type:        'swap',
        targetCount: 3
      });

      if (!already) {
        // record milestone and award bonus 5 points
        await Milestone.create({
          user:          userId,
          type:          'swap',
          targetCount:   3,
          isCompleted:   true,
          pointsAwarded: 5,
          completedAt:   new Date()
        });
        await Points.findOneAndUpdate(
          { user: userId },
          { $inc: { totalPoints: 5 } }
        );
      }
    }

    return res.status(201).json(saved);

  } catch (err) {
    console.error('❌ createPayment error:', err);
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
