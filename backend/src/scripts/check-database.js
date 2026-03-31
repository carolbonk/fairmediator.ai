/**
 * Database Status Checker
 * Quickly inspects MongoDB collections to see what data exists
 *
 * Usage: node backend/src/scripts/check-database.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Mediator = require('../models/Mediator');
const ModelVersion = require('../models/ModelVersion');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkDatabase() {
  console.log('🔍 FairMediator Database Status');
  console.log('='.repeat(70));

  try {
    // Check Users
    const userCount = await User.countDocuments();
    const usersWithAccountType = await User.countDocuments({ accountType: { $exists: true } });
    const usersWithoutAccountType = await User.countDocuments({ accountType: { $exists: false } });

    console.log('\n👥 USERS:');
    console.log(`   Total users: ${userCount}`);
    console.log(`   With accountType: ${usersWithAccountType}`);
    console.log(`   Without accountType: ${usersWithoutAccountType}`);

    if (userCount > 0) {
      const accountTypes = await User.aggregate([
        { $match: { accountType: { $exists: true } } },
        { $group: { _id: '$accountType', count: { $sum: 1 } } }
      ]);
      accountTypes.forEach(({ _id, count }) => {
        console.log(`   - ${_id}: ${count}`);
      });

      const sampleUsers = await User.find().limit(3).select('email accountType createdAt');
      if (sampleUsers.length > 0) {
        console.log('\n   Sample users:');
        sampleUsers.forEach(u => {
          console.log(`   - ${u.email} (${u.accountType || 'no accountType'}) - Created: ${u.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
        });
      }
    }

    // Check Mediators
    const mediatorCount = await Mediator.countDocuments();
    console.log(`\n⚖️  MEDIATORS:`);
    console.log(`   Total mediators: ${mediatorCount}`);

    if (mediatorCount > 0) {
      const verifiedCount = await Mediator.countDocuments({ isVerified: true });
      const activeCount = await Mediator.countDocuments({ isActive: true });
      console.log(`   Verified: ${verifiedCount}`);
      console.log(`   Active: ${activeCount}`);

      // Ideology distribution
      const ideologyDistribution = await Mediator.aggregate([
        {
          $bucket: {
            groupBy: '$ideologyScore',
            boundaries: [-10, -4, -1, 1, 4, 10],
            default: 'Unknown',
            output: { count: { $sum: 1 } }
          }
        }
      ]);

      console.log('\n   Ideology distribution:');
      const labels = {
        '-10': 'Strong Liberal (-10 to -4)',
        '-4': 'Lean Liberal (-4 to -1)',
        '-1': 'Neutral (-1 to 1)',
        '1': 'Lean Conservative (1 to 4)',
        '4': 'Strong Conservative (4 to 10)'
      };
      ideologyDistribution.forEach(({ _id, count }) => {
        console.log(`   - ${labels[_id] || 'Unknown'}: ${count}`);
      });

      // Sample mediators
      const sampleMediators = await Mediator.find()
        .limit(5)
        .select('name specializations ideologyScore isVerified');

      console.log('\n   Sample mediators:');
      sampleMediators.forEach(m => {
        const ideology = m.ideologyScore < -4 ? 'STRONG_LIB' :
                        m.ideologyScore < -1 ? 'LEAN_LIB' :
                        m.ideologyScore <= 1 ? 'NEUTRAL' :
                        m.ideologyScore <= 4 ? 'LEAN_CONS' : 'STRONG_CONS';
        console.log(`   - ${m.name} (${ideology}) - ${m.specializations?.slice(0, 2).join(', ') || 'N/A'}`);
      });
    }

    // Check Model Versions
    const modelVersionCount = await ModelVersion.countDocuments();
    console.log(`\n🤖 MODEL VERSIONS:`);
    console.log(`   Total versions: ${modelVersionCount}`);

    if (modelVersionCount > 0) {
      const activeModels = await ModelVersion.find({ isActive: true })
        .select('version modelType metrics.f1Score metrics.accuracy');

      if (activeModels.length > 0) {
        console.log('\n   Active models:');
        activeModels.forEach(m => {
          console.log(`   - ${m.modelType} v${m.version}`);
          if (m.metrics) {
            console.log(`     F1: ${(m.metrics.f1Score * 100).toFixed(1)}%, Acc: ${(m.metrics.accuracy * 100).toFixed(1)}%`);
          }
        });
      }
    }

    // Check other collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).filter(n => !n.startsWith('system.'));

    console.log(`\n📚 ALL COLLECTIONS (${collectionNames.length}):`);
    for (const name of collectionNames.sort()) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`   - ${name}: ${count} documents`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Database check complete!\n');

    // Migration recommendations
    if (usersWithoutAccountType > 0) {
      console.log('⚠️  RECOMMENDATION:');
      console.log(`   Found ${usersWithoutAccountType} users without accountType field.`);
      console.log('   Run: node backend/src/scripts/migrate-add-accountType.js');
      console.log('');
    }

    if (mediatorCount === 0) {
      console.log('💡 TIP:');
      console.log('   No mediators found. Consider running:');
      console.log('   node backend/src/scripts/seed-data.js');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error checking database:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await checkDatabase();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

main();
