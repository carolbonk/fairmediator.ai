/**
 * Demo User Seeder
 * Creates a single demo account for showcasing the platform.
 *
 * One account only:
 * - demo@fairmediator.ai (Mediator account, linked to a mediator profile)
 *
 * The mediator role is used because it unlocks the role-gated surfaces
 * (CRM, earnings, invoices, dashboard). The mediators marketplace is public,
 * so the lawyer/party experience is reachable without logging in.
 *
 * Password: "Password123!" (demo credentials only) pragma: allowlist secret
 *
 * Usage: node backend/src/scripts/seed-test-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Mediator = require('../models/Mediator');

const DEMO_EMAIL = 'demo@fairmediator.ai';
const DEMO_PASSWORD = 'Password123!';

// Legacy per-role test accounts this seeder used to create — removed so the
// platform ends up with exactly one demo login.
const LEGACY_EMAILS = ['party@test.com', 'attorney@test.com', 'mediator@test.com'];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedDemoUser() {
  console.log('🌱 Demo User Seeder');
  console.log('='.repeat(70));

  // Remove the legacy test accounts and any prior demo account so we converge
  // on a single login. Unlink any mediator profiles first to avoid dangling refs.
  const toRemove = await User.find({ email: { $in: [...LEGACY_EMAILS, DEMO_EMAIL] } });
  if (toRemove.length > 0) {
    const ids = toRemove.map(u => u._id);
    await Mediator.updateMany({ userId: { $in: ids } }, { $unset: { userId: '' } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`\n🧹 Removed ${toRemove.length} existing demo/test account(s):`);
    toRemove.forEach(u => console.log(`   - ${u.email}`));
  }

  // Create the single demo account (password hashed by the User pre-save hook).
  console.log('\n🏛️  Creating demo account...');
  const demoUser = await User.create({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    name: 'Demo Mediator',
    accountType: 'mediator',
    emailVerified: true
  });
  console.log(`   ✅ Created: ${demoUser.email} (ID: ${demoUser._id})`);

  // Link to an unlinked mediator profile so the CRM/dashboard demo has data.
  const unlinkedMediator = await Mediator.findOne({
    userId: { $exists: false },
    email: { $exists: true }
  });
  if (unlinkedMediator) {
    unlinkedMediator.userId = demoUser._id;
    await unlinkedMediator.save();
    console.log(`   🔗 Linked to mediator profile: ${unlinkedMediator.name}`);
  } else {
    console.log('   ⚠️  No unlinked mediator profiles found (account created but not linked)');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ Demo account ready!\n');
  console.log('📝 LOGIN CREDENTIALS (single account for all demos):');
  console.log('─'.repeat(70));
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('   Role:     mediator → /dashboard, /mediators-crm/*');
  console.log('   Public:   /mediators-marketplace (no login required)');
  console.log('─'.repeat(70) + '\n');
}

async function main() {
  try {
    await connectDB();
    await seedDemoUser();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

main();
