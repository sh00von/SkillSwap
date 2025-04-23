const axios  = require('axios');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
// If using Node <18, uncomment the following line and install node-fetch:
// const fetch = require('node-fetch');

const User  = require('../models/User');
const Skill = require('../models/Skill');
const Task  = require('../models/Task');
const Points = require('../models/Points');
const Milestone = require('../models/Milestone');
/**
 * Get the client’s IP address.
 * If it’s localhost, fetch your public IP from ipify.
 */
async function getClientIp(req) {
  let ip = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',').shift().trim()
    : req.socket.remoteAddress;

  if (!ip) return null;

  // Normalize IPv6 loopback to IPv4
  if (ip === '::1') ip = '127.0.0.1';

  // Strip IPv6‑mapped IPv4 prefix ::ffff:
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);

  // If localhost, fetch public IP
  if (ip === '127.0.0.1') {
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const json = await resp.json();
      if (json.ip) ip = json.ip;
    } catch (err) {
      console.warn('Could not fetch public IP:', err);
    }
  }

  return ip;
}

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1) Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // 2) Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3) Determine client IP
    const ip = await getClientIp(req);

    // 4) Create & save user with their IP
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      ip,
    });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials' });

    // 2) Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    // 3) Update their IP
    const ip = await getClientIp(req);
    user.ip = ip;
    await user.save();

    // 4) Sign JWT
    const payload = { userId: user._id };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Get profile + their skills (protected)

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user   = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skills       = await Skill.find({ offeredBy: userId }).select('title category price');
    const pointsDoc    = await Points.findOne({ user: userId });
    const totalPoints  = pointsDoc ? pointsDoc.totalPoints : 0;
    const tasks        = await Task.find({ user: userId }).populate('skill', 'title price').sort('-createdAt');
    const milestones   = await Milestone.find({ user: userId }).sort('-completedAt');

    return res.status(200).json({
      user,
      skills,
      totalPoints,
      tasks,
      milestones
    });
  } catch (error) {
    console.error('❌ getProfile error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Verify profile (ID card)
exports.verifyProfile = async (req, res) => {
  try {
    const { image, name, expiration, imageUrl } = req.body;
    let finalUrl;

    if (imageUrl) {
      finalUrl = imageUrl;
    } else {
      if (!image) return res.status(400).json({ message: 'Image data is required' });
      const resp = await axios.post(
        'https://api.imgbb.com/1/upload', null,
        { params: { key: process.env.IMGBB_KEY, image, name, expiration } }
      );
      finalUrl = resp.data.data.url;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { idCardUrl: finalUrl, isVerified: true },
      { new: true, select: '-password' }
    );

    res.status(200).json({ message: 'Profile verified', idCardUrl: finalUrl, user: updated });
  } catch (err) {
    console.error('verifyProfile error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

// Remove verification
exports.removeVerification = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { idCardUrl: null, isVerified: false },
      { new: true, select: '-password' }
    );
    return res.json({ message: 'Verification cleared', user: updated });
  } catch (err) {
    console.error('removeVerification error:', err);
    return res.status(500).json({ message: 'Could not remove verification', error: err.message });
  }
};
