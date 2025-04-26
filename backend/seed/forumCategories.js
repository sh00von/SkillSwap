// scripts/seed/forumCategories.js

require('dotenv').config();
const mongoose = require('mongoose');
const Forum    = require('../models/Forum');

const predefinedCategories = [
  {
    name:        'Coding',
    description: 'Discuss programming languages, frameworks, and tools.'
  },
  {
    name:        'Art',
    description: 'Share and explore creative art and designs.'
  },
  {
    name:        'Language',
    description: 'Discuss language learning, grammar, and writing.'
  },
  {
    name:        'Music',
    description: 'Talk about music, instruments, and production.'
  },
];

async function seedCategories() {
  try {
    console.log('🔗 Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    for (const cat of predefinedCategories) {
      const exists = await Forum.findOne({ name: cat.name });
      if (!exists) {
        await Forum.create(cat);
        console.log(`➕ Created category: ${cat.name}`);
      } else {
        console.log(`ℹ️  Already exists: ${cat.name}`);
      }
    }

    console.log('🎉 Forum categories seeding complete.');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedCategories();
