const User = require("../models/User");
const Skill = require("../models/Skill");

const Points  = require('../models/Points');
const Task    = require('../models/Task');
const Milestone = require('../models/Milestone');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Get core user data (excluding password)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Get skills they offer
    const skills = await Skill.find({ offeredBy: userId })
                              .select('title category price');

    // 3. Get or default their points total
    const pointsDoc   = await Points.findOne({ user: userId });
    const totalPoints = pointsDoc ? pointsDoc.totalPoints : 0;

    // 4. Get their tasks, populating the skill for context
    const tasks = await Task.find({ user: userId })
                            .populate('skill','title price')
                            .sort('-createdAt');

    // count how many swaps they’ve completed
    const swapCount = await Task.countDocuments({
      user:   userId,
      type:   'swap',
      status: 'completed'
    });

    // 5. try to fetch any stored “3-swap” milestone
    let milestone = await Milestone.findOne({
      user:        userId,
      type:        'swap',
      targetCount: 3
    });

    // 6. if none exists, build a default in-memory one
    if (!milestone) {
      milestone = {
        _id:           'swap-3-default',
        user:          userId,
        type:          'swap',
        targetCount:   3,
        isCompleted:   swapCount >= 3,
        pointsAwarded: 5,
        completedAt:   swapCount >= 3 ? new Date() : null,
        createdAt:     null,
        updatedAt:     null
      };
    }

    // 7. return everything
    return res.status(200).json({
      user,
      skills,
      totalPoints,
      tasks,
      milestones: [milestone]
    });

  } catch (err) {
    console.error('❌ getProfile error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/profile (protected)
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, phone, dob } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { username, bio, phone, dob },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// GET /api/users/:id (public)
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username email createdAt bio phone dob");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

// GET /api/users - List all users
exports.getAllUsers = async (req, res) => {
  try {
    // Include latitude & longitude in the returned fields
    const users = await User.find()
      .select("username email createdAt latitude longitude")
      .lean();  // .lean() can be added if you want plain JS objects

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};
