// controllers/skillController.js
const Skill = require('../models/Skill');
const Notification = require('../models/Notification');

// GET /api/skills
exports.getSkills = async (req, res) => {
  try {
    const { category, experience, location, keyword } = req.query;
    const query = {};
    if (category)   query.category   = category;
    if (experience) query.experience = experience;
    if (location)   query.location   = location;
    if (keyword) {
      query.$or = [
        { title:       { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skills = await Skill
      .find(query)
      .select('title description category experience location price offeredBy createdAt')  // include price
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'username' }
      });

    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skills', error: error.message });
  }
};

// GET /api/skills/:skillId
// GET /api/skills/:skillId
exports.getSkillById = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await Skill
      .findById(skillId)
      .select('title description category experience location price offeredBy createdAt')  // include price
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'username' }
      })
      .populate({
        path: 'offeredBy',
        select: 'username'  // Select only the username for offeredBy
      });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Restructure the offeredBy to match the required format
    if (skill.offeredBy) {
      skill.offeredBy = {
        _id: skill.offeredBy._id,
        username: skill.offeredBy.username,
      };
    }

    res.status(200).json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skill', error: error.message });
  }
};

// POST /api/skills
exports.createSkill = async (req, res) => {
  try {
    const { title, description, category, experience, price, location } = req.body;
    const offeredBy = req.user?.userId || null;

    // 1. Create & save the new skill
    const newSkill = new Skill({
      title,
      description,
      category,
      experience,
      price,
      location,
      offeredBy
    });
    const saved = await newSkill.save();

    // 2. Send a system notification to the creator
    if (offeredBy) {
      await Notification.create({
        recipient: offeredBy,
        type:      'system',
        message:   `Your skill "${saved.title}" is now live!`,
        data:      { skillId: saved._id }
      });
    }

    // 3. Return the saved skill
    res.status(201).json(saved);

  } catch (err) {
    console.error('❌ createSkill error:', err);
    res.status(500).json({ message: 'Error creating skill', error: err.message });
  }
};