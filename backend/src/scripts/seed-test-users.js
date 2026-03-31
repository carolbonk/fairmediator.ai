/**
 * Test User Seeder
 * Creates sample users for testing authentication and role-based features
 *
 * Creates 3 test accounts:
 * - party@test.com (Party account)
 * - attorney@test.com (Attorney account)
 * - mediator@test.com (Mediator account with linked profile)
 *
 * All passwords: "Password123!" (test credentials only) pragma: allowlist secret
 *
 * Usage: node backend/src/scripts/seed-test-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mediator = require('../models/Mediator');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedTestUsers() {
  console.log('🌱 Test User Seeder');
  console.log('='.repeat(70));

  try {
    // Check if test users already exist
    const existingUsers = await User.find({
      email: { $in: ['party@test.com', 'attorney@test.com', 'mediator@test.com'] }
    });

    if (existingUsers.length > 0) {
      console.log('\n⚠️  Test users already exist:');
      existingUsers.forEach(u => console.log(`   - ${u.email}`));
      console.log('\n💡 Delete them first or use different emails.');
      return;
    }

    // Don't pre-hash password - let User model pre-save hook handle it!
    const plainPassword = 'Password123!';

    // 1. Create Party user
    console.log('\n👤 Creating Party user...');
    const partyUser = await User.create({
      email: 'party@test.com',
      password: plainPassword, // Will be hashed by User model
      name: 'John Party',
      accountType: 'party',
      emailVerified: true
    });
    console.log(`   ✅ Created: ${partyUser.email} (ID: ${partyUser._id})`);

    // 2. Create Attorney user
    console.log('\n⚖️  Creating Attorney user...');
    const attorneyUser = await User.create({
      email: 'attorney@test.com',
      password: plainPassword, // Will be hashed by User model
      name: 'Sarah Attorney',
      accountType: 'attorney',
      emailVerified: true
    });
    console.log(`   ✅ Created: ${attorneyUser.email} (ID: ${attorneyUser._id})`);

    // 3. Create Mediator user and link to existing mediator profile
    console.log('\n🏛️  Creating Mediator user...');

    // Find a mediator profile without a userId (unlinked)
    const unlinkedMediator = await Mediator.findOne({
      userId: { $exists: false },
      email: { $exists: true }
    });

    const mediatorUser = await User.create({
      email: 'mediator@test.com',
      password: plainPassword, // Will be hashed by User model
      name: 'Michael Mediator',
      accountType: 'mediator',
      emailVerified: true
    });
    console.log(`   ✅ Created: ${mediatorUser.email} (ID: ${mediatorUser._id})`);

    // Link to mediator profile if available
    if (unlinkedMediator) {
      unlinkedMediator.userId = mediatorUser._id;
      await unlinkedMediator.save();
      console.log(`   🔗 Linked to mediator profile: ${unlinkedMediator.name}`);
    } else {
      console.log('   ⚠️  No unlinked mediator profiles found (user created but not linked)');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Test users created successfully!\n');
    console.log('📝 LOGIN CREDENTIALS:');
    console.log('─'.repeat(70));
    console.log('   Email: party@test.com');
    console.log('   Password: Password123!');
    console.log('   Account Type: party');
    console.log('   Dashboard: /dashboard/party\n');

    console.log('   Email: attorney@test.com');
    console.log('   Password: Password123!');
    console.log('   Account Type: attorney');
    console.log('   Dashboard: /dashboard/attorney\n');

    console.log('   Email: mediator@test.com');
    console.log('   Password: Password123!');
    console.log('   Account Type: mediator');
    console.log('   Dashboard: /dashboard/mediator');
    if (unlinkedMediator) {
      console.log(`   Linked Profile: ${unlinkedMediator.name}`);
    }
    console.log('─'.repeat(70));
    console.log('\n💡 You can now test authentication and role-based features!\n');

  } catch (error) {
    console.error('\n❌ Error creating test users:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await seedTestUsers();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

main();
