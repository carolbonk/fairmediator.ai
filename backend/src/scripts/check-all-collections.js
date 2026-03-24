const mongoose = require('mongoose');

async function checkAllCollections() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📂 Collections in database:');
    console.log('='.repeat(80));

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name.padEnd(30)} ${count} documents`);

      // Check for donation-related data
      if (collection.name.toLowerCase().includes('donation') ||
          collection.name.toLowerCase().includes('fec') ||
          collection.name === 'mediators') {
        const sample = await db.collection(collection.name).findOne({});
        if (sample) {
          console.log(`    Sample keys: ${Object.keys(sample).slice(0, 10).join(', ')}`);

          // If it's mediators, check for donation fields
          if (collection.name === 'mediators' && sample.donorHistory) {
            console.log(`    ✅ donorHistory field exists (length: ${sample.donorHistory?.length || 0})`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 Searching for donations in mediators collection...');
    console.log('='.repeat(80));

    const Mediator = mongoose.model('Mediator', new mongoose.Schema({}, { strict: false }));
    const withDonations = await Mediator.find({
      $or: [
        { 'donorHistory.0': { $exists: true } },
        { 'donations.0': { $exists: true } },
        { 'fecData.0': { $exists: true } }
      ]
    }).select('name donorHistory donations fecData');

    console.log(`\nFound ${withDonations.length} mediators with donation data`);

    if (withDonations.length > 0) {
      withDonations.forEach(m => {
        console.log(`\n${m.name}:`);
        console.log(`  donorHistory: ${m.donorHistory?.length || 0} items`);
        console.log(`  donations: ${m.donations?.length || 0} items`);
        console.log(`  fecData: ${m.fecData?.length || 0} items`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

checkAllCollections();
