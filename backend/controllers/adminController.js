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
