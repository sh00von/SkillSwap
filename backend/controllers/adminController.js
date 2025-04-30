const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Skill = require('../models/Skill');

const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET;

// POST /api/admin/login
exports.login = (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: '1h' });
  res.json({ token });
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('username email isVerified createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// GET /api/admin/skills
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().populate('offeredBy', 'username');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch skills' });
  }
};

// GET all pending verifications
exports.listPendingVerifications = async (req, res) => {
  try {
    const pendings = await User.find({ verificationStatus: 'pending' })
      .select('username email studentId idCardUrl createdAt');
    return res.status(200).json(pendings);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch pending verifications', error: err.message });
  }
};

// PUT approve a user’s verification
exports.approveVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'approved',
        isVerified: true
      },
      { new: true, select: '-password' }
    );
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User verified', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};

// PUT reject a user’s verification
exports.rejectVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        verificationStatus: 'rejected',
        isVerified: false,
        // optional: clear idCardUrl if you want
        // idCardUrl: null
      },
      { new: true, select: '-password' }
    );
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'Verification rejected', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
};