const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Forum = require('../models/Forum');

dotenv.config(); // Load .env

console.log('✅ MONGODB_URI =', process.env.MONGODB_URI); // DEBUG LINE

const predefinedCategories = [
  { name: 'Coding', description: 'Discuss programming languages, frameworks, and tools.' },
  { name: 'Art', description: 'Share and explore creative art and designs.' },
  { name: 'Language', description: 'Discuss language learning, grammar, and writing.' },
  { name: 'Music', description: 'Talk about music, instruments, and production.' },
];

async function seedCategories() {
  try {
    await mongoose.connect('mongodb+srv://minarsvn:idfKVrhgW5gFSW2S@cluster0.pad3few.mongodb.net/skill_swap?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    for (const cat of predefinedCategories) {
      const exists = await Forum.findOne({ name: cat.name });
      if (!exists) {
        await Forum.create(cat);
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`ℹ️  Already exists: ${cat.name}`);
      }
    }

    console.log('🎉 Forum categories seeding complete.');
    process.exit();
  } catch (err) {
    console.error('❌ Failed to seed forum categories:', err);
    process.exit(1);
  }
}

seedCategories();
