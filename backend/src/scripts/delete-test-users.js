require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function deleteTestUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
  console.log('✅ Connected to MongoDB');

  const result = await User.deleteMany({
    email: { $in: ['party@test.com', 'attorney@test.com', 'mediator@test.com'] }
  });

  console.log(`🗑️  Deleted ${result.deletedCount} test users`);
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

deleteTestUsers().catch(console.error);
