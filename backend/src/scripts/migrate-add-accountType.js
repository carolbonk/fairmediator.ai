/**
 * Database Migration: Add accountType field to existing User documents
 *
 * This migration adds the new accountType field to all existing users:
 * - Users with linked Mediator profiles → 'mediator'
 * - All other users → 'party' (default)
 *
 * Usage: node backend/src/scripts/migrate-add-accountType.js
 *
 * Run with --dry-run to preview changes without applying:
 * node backend/src/scripts/migrate-add-accountType.js --dry-run
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Mediator = require('../models/Mediator');

const isDryRun = process.argv.includes('--dry-run');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateAccountTypes() {
  console.log('\n🔄 Account Type Migration');
  console.log('='.repeat(60));

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }

  try {
    // Find all users without accountType
    const usersWithoutAccountType = await User.find({
      accountType: { $exists: false }
    });

    if (usersWithoutAccountType.length === 0) {
      console.log('✅ All users already have accountType field');
      return;
    }

    console.log(`📊 Found ${usersWithoutAccountType.length} users without accountType\n`);

    const stats = {
      total: usersWithoutAccountType.length,
      mediators: 0,
      parties: 0,
      errors: 0
    };

    // Get all mediators with userId for quick lookup
    const linkedMediators = await Mediator.find({ userId: { $exists: true } });
    const mediatorUserIds = new Set(linkedMediators.map(m => m.userId.toString()));

    console.log(`🔗 Found ${mediatorUserIds.size} linked mediator profiles\n`);

    // Process each user
    for (const user of usersWithoutAccountType) {
      try {
        let accountType;
        let reason;

        // Check if user has a linked mediator profile
        if (mediatorUserIds.has(user._id.toString())) {
          accountType = 'mediator';
          reason = 'Linked to mediator profile';
          stats.mediators++;
        } else {
          accountType = 'party';
          reason = 'Default (no mediator profile)';
          stats.parties++;
        }

        console.log(`  ${user.email}`);
        console.log(`    → ${accountType} (${reason})`);

        if (!isDryRun) {
          user.accountType = accountType;
          await user.save();
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${user.email}:`, error.message);
        stats.errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total users processed:     ${stats.total}`);
    console.log(`Set to 'mediator':         ${stats.mediators}`);
    console.log(`Set to 'party':            ${stats.parties}`);
    console.log(`Errors:                    ${stats.errors}`);

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN - No changes were saved');
      console.log('💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await migrateAccountTypes();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

main();
